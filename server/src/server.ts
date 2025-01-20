import dotenv from "dotenv";
dotenv.config();

import type { UserId, RoomId, Application } from "@hathora/server-sdk";
import { startServer } from "@hathora/server-sdk";
import { GameState, GameEvent, Player } from "../../shared/types/GameState";

const rooms = new Map<RoomId, GameState>();
let server: { broadcastMessage: (roomId: RoomId, buffer: Buffer) => void };

const decoder = new TextDecoder();

function getInitialState(): GameState {
  return {
    players: new Map<string, Player>()
  };
}

function broadcastState(roomId: RoomId) {
  const state = rooms.get(roomId);
  if (!state) return;

  console.log(`[broadcastState] Broadcasting state for room ${roomId}`);
  server.broadcastMessage(
    roomId,
    Buffer.from(JSON.stringify({ type: "gameState", state }))
  );
}

const store: Application = {
  verifyToken: async (token: string): Promise<UserId> => {
    console.log("[verifyToken] Verifying token:", token);
    return token as UserId;
  },

  subscribeUser: async (roomId: RoomId, userId: UserId): Promise<void> => {
    console.log(`[subscribeUser] User ${userId} subscribing to room ${roomId}`);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, getInitialState());
    }
    broadcastState(roomId);
  },

  unsubscribeUser: async (roomId: RoomId, userId: UserId): Promise<void> => {
    console.log(`[unsubscribeUser] User ${userId} unsubscribing from room ${roomId}`);
    const state = rooms.get(roomId);
    if (state) {
      handleEvent(state, { type: "leave", userId });
      if (state.players.size === 0) {
        rooms.delete(roomId);
      }
      broadcastState(roomId);
    }
  },

  onMessage: async (roomId: RoomId, userId: UserId, data: ArrayBuffer): Promise<void> => {
    const state = rooms.get(roomId);
    if (!state) return;

    const event = JSON.parse(decoder.decode(data)) as GameEvent;
    console.log(`[onMessage] Received event:`, event);
    
    handleEvent(state, event);
    broadcastState(roomId);
  }
};

function handleEvent(state: GameState, event: GameEvent): void {
  console.log(`[handleEvent] Processing event:`, event);
  switch (event.type) {
    case "join":
      if (!state.players.has(event.userId)) {
        state.players.set(event.userId, { id: event.userId });
      }
      break;
    case "leave":
      state.players.delete(event.userId);
      break;
    // Add game-specific event handling here
  }
}

// Boot server
const port = parseInt(process.env.PORT ?? "4000");
server = await startServer(store, port);
console.log(`[startup] Server started successfully`); 
console.log(`[startup] Listening on port ${port}...`);
