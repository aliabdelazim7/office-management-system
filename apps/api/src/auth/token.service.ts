import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AppConfig } from '../config/configuration';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TokenOwner {
  id: string;
  tenantId: string;
  role: string;
}

interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Refresh-token rotation with reuse detection.
 *
 * Refresh tokens are opaque random strings; only their SHA-256 hash is stored,
 * so a database dump does not yield usable sessions. Each refresh rotates the
 * token within a *family*. Presenting an already-rotated token means the token
 * was stolen and replayed, so the whole family is revoked — the attacker and
 * the legitimate user are both logged out, which is the correct outcome.
 */
@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private get cfg(): AppConfig {
    return this.config.get<AppConfig>('app')!;
  }

  async issue(
    user: TokenOwner,
    meta: RequestMeta,
    familyId: string = randomUUID(),
  ): Promise<IssuedTokens> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, tid: user.tenantId, role: user.role, jti: randomUUID() },
      { secret: this.cfg.jwt.accessSecret, expiresIn: this.cfg.jwt.accessTtl },
    );

    const refreshToken = randomBytes(48).toString('base64url');

    await this.prisma.unsafeUnscoped.refreshToken.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        familyId,
        expiresAt: new Date(Date.now() + this.parseDuration(this.cfg.jwt.refreshTtl)),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(this.parseDuration(this.cfg.jwt.accessTtl) / 1000),
    };
  }

  async rotate(presentedToken: string, meta: RequestMeta): Promise<IssuedTokens> {
    const tokenHash = this.hash(presentedToken);

    const stored = await this.prisma.unsafeUnscoped.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        user: { select: { id: true, tenantId: true, role: true, status: true, deletedAt: true } },
      },
    });

    if (!stored) {
      throw new UnauthorizedException('جلسة غير صالحة');
    }

    if (stored.revokedAt) {
      // Reuse of a rotated token. Burn the family.
      this.logger.warn(
        `Refresh token reuse detected for user ${stored.userId} (family ${stored.familyId}). Revoking family.`,
      );
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('تم اكتشاف استخدام جلسة منتهية. يرجى تسجيل الدخول مجدداً');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('انتهت صلاحية الجلسة');
    }

    if (!stored.user || stored.user.deletedAt || stored.user.status !== 'ACTIVE') {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException('الحساب غير مفعّل');
    }

    // Rotate: revoke the presented token, issue a successor in the same family.
    await this.prisma.unsafeUnscoped.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issue(
      { id: stored.user.id, tenantId: stored.user.tenantId, role: stored.user.role },
      meta,
      stored.familyId,
    );
  }

  /** Log out one session. */
  async revoke(presentedToken: string): Promise<void> {
    await this.prisma.unsafeUnscoped.refreshToken.updateMany({
      where: { tokenHash: this.hash(presentedToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Log out every session for a user — used on password change and suspension. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.unsafeUnscoped.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.unsafeUnscoped.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Parses `15m`, `30d`, `12h`, `45s` into milliseconds. */
  private parseDuration(value: string): number {
    const match = /^(\d+)([smhd])$/.exec(value.trim());
    if (!match) {
      throw new Error(`Invalid duration: "${value}". Expected e.g. "15m", "30d".`);
    }
    const amount = Number(match[1]);
    const unit = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]]!;
    return amount * unit;
  }
}
