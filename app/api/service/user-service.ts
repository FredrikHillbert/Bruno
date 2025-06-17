import { prisma } from "@/db.server";

export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      isSubscribed: true,
      image: true,
      createdAt: true,
      threads: {
        select: {
          id: true,
          title: true,

          messages: {
            select: {
              id: true,
              content: true,
              role: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  return user;
}
