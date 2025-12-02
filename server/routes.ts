import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage";
import { createRoomSchema, joinRoomSchema, type GameRoom, type Player, type BoardState } from "@shared/schema";
import crypto from "crypto";

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function checkWinner(board: BoardState): { winner: Player | null; cells: number[] } {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, cells: combo };
    }
  }
  return { winner: null, cells: [] };
}

function checkDraw(board: BoardState): boolean {
  return board.every(cell => cell !== null) && !checkWinner(board).winner;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const result = createRoomSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ success: false, error: "Invalid player name" });
      }

      const playerId = crypto.randomUUID();
      const room = await storage.createRoom(playerId, result.data.playerName);
      
      res.json({
        success: true,
        room,
        playerId,
        role: 'host'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create room" });
    }
  });

  app.post("/api/rooms/:code/join", async (req, res) => {
    try {
      const roomCode = req.params.code.toUpperCase();
      const result = joinRoomSchema.safeParse({ ...req.body, roomCode });
      
      if (!result.success) {
        return res.status(400).json({ success: false, error: "Invalid request" });
      }

      const existingRoom = await storage.getRoom(roomCode);
      if (!existingRoom) {
        return res.status(404).json({ success: false, error: "Room not found" });
      }

      if (existingRoom.guestId) {
        return res.status(400).json({ success: false, error: "Room is full" });
      }

      const playerId = crypto.randomUUID();
      const room = await storage.joinRoom(roomCode, playerId, result.data.playerName);
      
      if (!room) {
        return res.status(400).json({ success: false, error: "Failed to join room" });
      }

      io.to(roomCode).emit("guest_joined", { room });

      res.json({
        success: true,
        room,
        playerId,
        role: 'guest'
      });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to join room" });
    }
  });

  app.get("/api/rooms/:code", async (req, res) => {
    try {
      const roomCode = req.params.code.toUpperCase();
      const room = await storage.getRoom(roomCode);
      
      if (!room) {
        return res.status(404).json({ success: false, error: "Room not found" });
      }

      res.json({ success: true, room });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to get room" });
    }
  });

  io.on("connection", (socket) => {
    let currentRoom: string | null = null;
    let currentPlayerId: string | null = null;

    socket.on("join_room", async ({ roomCode, playerId }) => {
      const room = await storage.getRoom(roomCode);
      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      if (playerId !== room.hostId && playerId !== room.guestId) {
        socket.emit("error", { message: "Not authorized" });
        return;
      }

      const roomId = roomCode.toUpperCase();
      currentRoom = roomId;
      currentPlayerId = playerId;
      socket.join(roomId);

      socket.emit("room_state", { room });
      
      socket.to(roomId).emit("player_connected", { 
        playerId,
        isHost: playerId === room.hostId 
      });
    });

    socket.on("make_move", async ({ index }) => {
      if (!currentRoom || !currentPlayerId) return;

      const room = await storage.getRoom(currentRoom);
      if (!room || room.status !== 'playing') return;

      const isHost = currentPlayerId === room.hostId;
      const playerMark: Player = isHost ? 'X' : 'O';

      if (room.currentPlayer !== playerMark) {
        socket.emit("error", { message: "Not your turn" });
        return;
      }

      if (room.board[index] !== null) {
        socket.emit("error", { message: "Cell already taken" });
        return;
      }

      const newBoard = [...room.board] as BoardState;
      newBoard[index] = playerMark;

      const { winner, cells } = checkWinner(newBoard);
      const isDraw = checkDraw(newBoard);

      const updates: Partial<GameRoom> = {
        board: newBoard,
        currentPlayer: playerMark === 'X' ? 'O' : 'X'
      };

      if (winner) {
        updates.status = 'won';
        updates.winner = winner;
        updates.winningCells = cells;
      } else if (isDraw) {
        updates.status = 'draw';
      }

      const updatedRoom = await storage.updateRoom(currentRoom, updates);
      if (updatedRoom) {
        io.to(currentRoom).emit("game_update", { room: updatedRoom });
      }
    });

    socket.on("request_rematch", async () => {
      if (!currentRoom) return;

      const room = await storage.getRoom(currentRoom);
      if (!room || (room.status !== 'won' && room.status !== 'draw')) return;

      const updatedRoom = await storage.updateRoom(currentRoom, {
        board: Array(9).fill(null) as BoardState,
        currentPlayer: 'X',
        status: 'playing',
        winner: null,
        winningCells: []
      });

      if (updatedRoom) {
        io.to(currentRoom).emit("game_update", { room: updatedRoom });
      }
    });

    socket.on("leave_room", async () => {
      if (currentRoom) {
        socket.to(currentRoom).emit("opponent_left");
        await storage.deleteRoom(currentRoom);
        socket.leave(currentRoom);
        currentRoom = null;
        currentPlayerId = null;
      }
    });

    socket.on("disconnect", async () => {
      if (currentRoom) {
        socket.to(currentRoom).emit("opponent_disconnected", { playerId: currentPlayerId });
      }
    });
  });

  return httpServer;
}
