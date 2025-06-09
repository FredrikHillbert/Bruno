import { prisma } from "@/db.server";

export async function userHasActiveSubscription(userId: string): Promise<boolean> {
  // This is where you'd check your database or payment provider (e.g., Stripe)
  // For now, let's assume a field on the User model or a related Subscription model
  const user = await prisma.user.findUnique({
    where: { id: userId },
    // include: { subscriptions: { where: { status: 'active' } } } // Example
  });
  // return user?.subscriptions?.length > 0 || user?.isPayingSubscriber || false;
  return user?.isSubscribed || false; // Simplified: assumes a boolean field `isPayingSubscriber`
}