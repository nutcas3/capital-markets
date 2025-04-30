/**
 * Session management utilities for WhatsApp bot
 */

import { randomBytes } from 'crypto';

/**
 * Generate a random session token
 * @param length Length of the token
 * @returns Random session token
 */
export function generateSessionToken(length = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Session state interface
 */
export interface SessionState {
  userId: string;
  phoneNumber: string;
  walletAddress?: string;
  isVerified: boolean;
  lastActivity: Date;
  currentCommand?: string;
  commandParams?: Record<string, any>;
}

/**
 * In-memory session store (for development only)
 * In production, use Redis or another distributed cache
 */
class SessionManager {
  private sessions: Map<string, SessionState> = new Map();
  private sessionsByPhone: Map<string, string> = new Map();
  private readonly SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Create a new session
   * @param phoneNumber User's phone number
   * @param userId User's ID
   * @param walletAddress User's wallet address (optional)
   * @param isVerified Whether user is verified
   * @returns Session token
   */
  createSession(
    phoneNumber: string,
    userId: string,
    walletAddress?: string,
    isVerified = false
  ): string {
    // Generate token
    const token = generateSessionToken();
    
    // Create session
    const session: SessionState = {
      userId,
      phoneNumber,
      walletAddress,
      isVerified,
      lastActivity: new Date()
    };
    
    // Store session
    this.sessions.set(token, session);
    this.sessionsByPhone.set(phoneNumber, token);
    
    return token;
  }

  /**
   * Get session by token
   * @param token Session token
   * @returns Session state or null if not found/expired
   */
  getSession(token: string): SessionState | null {
    const session = this.sessions.get(token);
    
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    const now = new Date();
    if (now.getTime() - session.lastActivity.getTime() > this.SESSION_EXPIRY_MS) {
      this.sessions.delete(token);
      this.sessionsByPhone.delete(session.phoneNumber);
      return null;
    }
    
    // Update last activity
    session.lastActivity = now;
    this.sessions.set(token, session);
    
    return session;
  }

  /**
   * Get session by phone number
   * @param phoneNumber User's phone number
   * @returns Session state or null if not found
   */
  getSessionByPhone(phoneNumber: string): SessionState | null {
    const token = this.sessionsByPhone.get(phoneNumber);
    if (!token) {
      return null;
    }
    
    return this.getSession(token);
  }

  /**
   * Update session state
   * @param token Session token
   * @param updates Partial session state updates
   * @returns Updated session or null if not found
   */
  updateSession(token: string, updates: Partial<SessionState>): SessionState | null {
    const session = this.getSession(token);
    
    if (!session) {
      return null;
    }
    
    // Apply updates
    const updatedSession = {
      ...session,
      ...updates,
      lastActivity: new Date()
    };
    
    // Store updated session
    this.sessions.set(token, updatedSession);
    
    return updatedSession;
  }

  /**
   * Delete session
   * @param token Session token
   * @returns Whether session was deleted
   */
  deleteSession(token: string): boolean {
    const session = this.sessions.get(token);
    
    if (!session) {
      return false;
    }
    
    this.sessions.delete(token);
    this.sessionsByPhone.delete(session.phoneNumber);
    
    return true;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = new Date().getTime();
    
    for (const [token, session] of this.sessions.entries()) {
      if (now - session.lastActivity.getTime() > this.SESSION_EXPIRY_MS) {
        this.sessions.delete(token);
        this.sessionsByPhone.delete(session.phoneNumber);
      }
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
