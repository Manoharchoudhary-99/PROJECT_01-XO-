import { users, type User, type InsertUser, type GameRoom, type BoardState } from "@shared/schema";
import crypto from "crypto";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createRoom(hostId: string, hostName: string): Promise<GameRoom>;
  getRoom(roomCode: string): Promise<GameRoom | undefined>;
  joinRoom(roomCode: string, guestId: string, guestName: string): Promise<GameRoom | undefined>;
  updateRoom(roomCode: string, updates: Partial<GameRoom>): Promise<GameRoom | undefined>;
  deleteRoom(roomCode: string): Promise<void>;
  cleanupStaleRooms(): Promise<void>;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private rooms: Map<string, GameRoom>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.rooms = new Map();
    this.currentId = 1;
    
    setInterval(() => this.cleanupStaleRooms(), 60000);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createRoom(hostId: string, hostName: string): Promise<GameRoom> {
    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const room: GameRoom = {
      roomCode,
      hostId,
      hostName,
      guestId: null,
      guestName: null,
      board: Array(9).fill(null) as BoardState,
      currentPlayer: 'X',
      status: 'waiting',
      winner: null,
      winningCells: [],
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  async getRoom(roomCode: string): Promise<GameRoom | undefined> {
    return this.rooms.get(roomCode.toUpperCase());
  }

  async joinRoom(roomCode: string, guestId: string, guestName: string): Promise<GameRoom | undefined> {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room || room.guestId) {
      return undefined;
    }

    room.guestId = guestId;
    room.guestName = guestName;
    room.status = 'playing';
    room.lastActivity = Date.now();
    
    return room;
  }

  async updateRoom(roomCode: string, updates: Partial<GameRoom>): Promise<GameRoom | undefined> {
    const room = this.rooms.get(roomCode.toUpperCase());
    if (!room) {
      return undefined;
    }

    Object.assign(room, updates, { lastActivity: Date.now() });
    return room;
  }

  async deleteRoom(roomCode: string): Promise<void> {
    this.rooms.delete(roomCode.toUpperCase());
  }

  async cleanupStaleRooms(): Promise<void> {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000;
    
    Array.from(this.rooms.entries()).forEach(([code, room]) => {
      if (now - room.lastActivity > staleThreshold) {
        this.rooms.delete(code);
      }
    });
  }
}

export const storage = new MemStorage();
