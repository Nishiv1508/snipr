import { prisma } from "../config/db";

export class SessionRepository {
  async create(userId: string, tokenHash: string, expiresAt: Date) {
    return prisma.userSession.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  async findValid(tokenHash: string) {
    return prisma.userSession.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async rotate(
    sessionId: string,
    userId: string,
    oldHash: string,
    newHash: string,
    expiresAt: Date,
  ) {
    return prisma.$transaction(async (tx) => {
      const result = await tx.userSession.updateMany({
        where: {
          id: sessionId,
          userId,
          tokenHash: oldHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { revokedAt: new Date() },
      });

      if (result.count !== 1) {
        return false;
      }

      await tx.userSession.create({
        data: { userId, tokenHash: newHash, expiresAt },
      });

      return true;
    });
  }

  async revoke(tokenHash: string) {
    await prisma.userSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAll(userId: string) {
    await prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export const sessionRepository = new SessionRepository();
