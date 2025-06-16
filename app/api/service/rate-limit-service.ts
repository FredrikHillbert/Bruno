import { prisma } from "@/db.server";
import {
  getRateLimitsForModel,
  estimateTokenCount,
  type ModelRateLimit,
} from "@/lib/rate-limits";



interface CheckRateLimitResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  reset?: Date;
  cooldownSeconds?: number;
}

interface RateLimitUsage {
  requestCount: number;
  tokensUsed: number;
  lastReset: Date;
}

export const rateLimitService = {
  async checkRateLimit(
    userId: string | undefined,
    modelId: string,
    messageContent: string,
    isSubscribed: boolean
  ): Promise<CheckRateLimitResult> {
    // No user ID means using API key - no rate limits
    if (!userId) {
      return { allowed: true };
    }

    // Get rate limits for the model
    const limits = getRateLimitsForModel(modelId);

    // For free users, if free limit is 0, they cannot use this model
    if (!isSubscribed && limits.freeRequestsPerDay === 0) {
      return {
        allowed: false,
        reason: "This model requires a subscription.",
      };
    }

    // Estimate token usage for this request
    const estimatedTokens = estimateTokenCount(messageContent);

    // Get current usage
    const usage = await this.getUserModelUsage(userId, modelId);

    console.log('uisage:', usage);

    // Check if we should reset the counter (new day)
    const resetTime = this.getResetTime(usage.lastReset);
    const needsReset = resetTime <= new Date();

    if (needsReset) {
      // Reset counters for a new day
      await this.resetUsage(userId, modelId);

      // Check cooldown period
      const cooldownSeconds = isSubscribed
        ? limits.subscriberCooldownSeconds
        : limits.freeCooldownSeconds;

      if (
        cooldownSeconds &&
        this.isWithinCooldown(usage.lastReset, cooldownSeconds)
      ) {
        return {
          allowed: false,
          reason: `Please wait before making another request.`,
          cooldownSeconds: this.getRemainingCooldown(
            usage.lastReset,
            cooldownSeconds
          ),
        };
      }

      // After reset, we're good to go
      return {
        allowed: true,
        remaining: this.getRequestLimit(limits, isSubscribed),
      };
    }

    // Check request limit
    const requestLimit = this.getRequestLimit(limits, isSubscribed);
    if (usage.requestCount >= requestLimit) {
      return {
        allowed: false,
        reason: `You've reached your daily limit of ${requestLimit} requests for this model.`,
        reset: resetTime,
      };
    }

    // Check token limit
    const tokenLimit = this.getTokenLimit(limits, isSubscribed);
    if (usage.tokensUsed + estimatedTokens > tokenLimit) {
      return {
        allowed: false,
        reason: `You've reached your daily token limit for this model.`,
        reset: resetTime,
      };
    }

    // Check cooldown period
    const cooldownSeconds = isSubscribed
      ? limits.subscriberCooldownSeconds
      : limits.freeCooldownSeconds;

    if (
      cooldownSeconds &&
      this.isWithinCooldown(usage.lastReset, cooldownSeconds)
    ) {
      return {
        allowed: false,
        reason: `Please wait before making another request.`,
        cooldownSeconds: this.getRemainingCooldown(
          usage.lastReset,
          cooldownSeconds
        ),
      };
    }

    // All checks passed
    return {
      allowed: true,
      remaining: requestLimit - usage.requestCount - 1,
    };
  },

  async recordUsage(
    userId: string | undefined,
    modelId: string,
    tokensUsed: number
  ): Promise<void> {
    if (!userId) return; // No user ID means using API key - don't track

    try {
      await prisma.userModelUsage.upsert({
        where: {
          userId_modelId: {
            userId,
            modelId,
          },
        },
        update: {
          requestCount: { increment: 1 },
          tokensUsed: { increment: tokensUsed },
          updatedAt: new Date(),
        },
        create: {
          userId,
          modelId,
          requestCount: 1,
          tokensUsed,
          lastReset: new Date(),
        },
      });
    } catch (error) {
      console.error("Failed to record usage:", error);
    }
  },

  async getUserModelUsage(
    userId: string,
    modelId: string
  ): Promise<RateLimitUsage> {
    const usage = await prisma.userModelUsage.findUnique({
      where: {
        userId_modelId: {
          userId,
          modelId,
        },
      },
    });

    return (
      usage || {
        requestCount: 0,
        tokensUsed: 0,
        lastReset: new Date(),
      }
    );
  },

  async resetUsage(userId: string, modelId: string): Promise<void> {
    await prisma.userModelUsage.update({
      where: {
        userId_modelId: {
          userId,
          modelId,
        },
      },
      data: {
        requestCount: 0,
        tokensUsed: 0,
        lastReset: new Date(),
      },
    });
  },

  getResetTime(lastReset: Date): Date {
    const resetDate = new Date(lastReset);
    resetDate.setHours(0, 0, 0, 0);
    resetDate.setDate(resetDate.getDate() + 1);
    return resetDate;
  },

  getRequestLimit(limits: ModelRateLimit, isSubscribed: boolean): number {
    return isSubscribed
      ? limits.subscriberRequestsPerDay
      : limits.freeRequestsPerDay;
  },

  getTokenLimit(limits: ModelRateLimit, isSubscribed: boolean): number {
    return isSubscribed
      ? limits.subscriberTokensPerDay
      : limits.freeTokensPerDay;
  },

  isWithinCooldown(lastRequestTime: Date, cooldownSeconds: number): boolean {
    const cooldownEnds = new Date(
      lastRequestTime.getTime() + cooldownSeconds * 1000
    );
    return new Date() < cooldownEnds;
  },

  getRemainingCooldown(lastRequestTime: Date, cooldownSeconds: number): number {
    const cooldownEnds = new Date(
      lastRequestTime.getTime() + cooldownSeconds * 1000
    );
    const remaining = Math.ceil((cooldownEnds.getTime() - Date.now()) / 1000);
    return Math.max(0, remaining);
  },
};
