import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getOrCreateSession(phoneNumber: string) {
    // Find existing user or create new one
    const user = await this.prisma.user.upsert({
      where: { phoneNumber },
      update: {},
      create: {
        phoneNumber,
        isVerified: false
      }
    });

    // Create new session
    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        token: this.generateSessionToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });

    return {
      userId: user.id,
      isVerified: user.isVerified,
      sessionToken: session.token,
      walletAddress: user.walletAddress
    };
  }

  private generateSessionToken(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  async verifySession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      userId: session.userId,
      isVerified: session.user.isVerified,
      walletAddress: session.user.walletAddress
    };
  }
}
