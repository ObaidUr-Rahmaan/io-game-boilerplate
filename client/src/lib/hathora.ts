import { HathoraClient, HathoraConnection as HathoraSdkConnection, ConnectionDetails } from '@hathora/client-sdk';

const APP_ID = import.meta.env.VITE_APP_ID || '';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

export class HathoraConnection {
  private client: HathoraClient;
  private connection: HathoraSdkConnection | null = null;
  private token: string | null = null;
  private messageHandlers: Array<(data: ArrayBuffer) => void> = [];
  private connectionInfo: ConnectionDetails | null = null;

  constructor() {
    this.client = new HathoraClient(APP_ID);
  }

  isConnected(): boolean {
    return this.connection !== null;
  }

  async createRoom(): Promise<string> {
    try {
      console.log('[createRoom] Creating new room...');
      this.token = await this.client.loginAnonymous();
      const roomId = await this.client.createPrivateLobby(this.token);
      console.log('[createRoom] Created room:', roomId);
      return roomId;
    } catch (error) {
      console.error('[createRoom] Failed:', error);
      throw error;
    }
  }

  async connect(roomId: string): Promise<void> {
    try {
      console.log(`[connect] Connecting to room ${roomId}...`);
      
      if (this.connection) {
        console.log('[connect] Cleaning up existing connection...');
        this.connection.disconnect();
        this.connection = null;
      }

      if (!this.token) {
        console.log('[connect] Getting anonymous token...');
        this.token = await this.client.loginAnonymous();
      }

      console.log('[connect] Getting connection details...');
      this.connectionInfo = await this.client.getConnectionDetailsForRoomId(roomId);
      
      console.log('[connect] Creating new connection...');
      this.connection = await this.client.newConnection(roomId);
      this.connection.onMessage(this.handleMessage);
      this.connection.onClose(this.handleError);
      
      await this.connection.connect(this.token);
      console.log('[connect] Connected successfully');
    } catch (error) {
      console.error('[connect] Failed:', error);
      this.cleanup();
      throw error;
    }
  }

  private cleanup() {
    console.log('[cleanup] Starting cleanup...');
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }
    this.connectionInfo = null;
    this.messageHandlers = [];
    console.log('[cleanup] Cleanup complete');
  }

  private handleMessage = (data: ArrayBuffer) => {
    try {
      const message = JSON.parse(decoder.decode(data));
      console.log('[handleMessage] Received:', message);
      this.messageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('[handleMessage] Handler error:', error);
        }
      });
    } catch (error) {
      console.error('[handleMessage] Parse error:', error);
    }
  };

  private handleError = (e: {code: number, reason: string}) => {
    console.error('[handleError] Connection error:', e);
    this.cleanup();
  };

  addMessageHandler(handler: (data: ArrayBuffer) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (data: ArrayBuffer) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  sendMessage(message: unknown) {
    if (!this.connection) {
      console.warn('[sendMessage] No active connection');
      return;
    }
    console.log('[sendMessage] Sending:', message);
    this.connection.write(encoder.encode(JSON.stringify(message)));
  }

  disconnect() {
    console.log('[disconnect] Disconnecting...');
    this.cleanup();
  }

  getConnectionInfo(): ConnectionDetails | null {
    return this.connectionInfo;
  }
}

// Export singleton instance
export const hathoraClient = new HathoraConnection(); 