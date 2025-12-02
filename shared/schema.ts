import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type Player = 'X' | 'O';
export type BoardState = (Player | null)[];
export type GameStatus = 'waiting' | 'playing' | 'won' | 'draw';

export interface GameRoom {
  roomCode: string;
  hostId: string;
  hostName: string;
  guestId: string | null;
  guestName: string | null;
  board: BoardState;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningCells: number[];
  createdAt: number;
  lastActivity: number;
}

export interface CreateRoomRequest {
  playerName: string;
}

export interface JoinRoomRequest {
  roomCode: string;
  playerName: string;
}

export interface RoomResponse {
  success: boolean;
  room?: GameRoom;
  playerId?: string;
  role?: 'host' | 'guest';
  error?: string;
}

export const createRoomSchema = z.object({
  playerName: z.string().min(1).max(20)
});

export const joinRoomSchema = z.object({
  roomCode: z.string().length(6).regex(/^[A-Z0-9]{6}$/),
  playerName: z.string().min(1).max(20)
});
