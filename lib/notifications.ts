import { prisma } from "@/lib/prisma";
import { sendPushToUser, type PushPayload } from "@/lib/push";

export type NotificationInput = {
  type: string;
  title: string;
  description: string;
};

export async function createNotification(
  userId: string,
  notification: NotificationInput,
  push?: PushPayload
) {
  await prisma.notification.create({
    data: {
      userId,
      type: notification.type,
      title: notification.title,
      description: notification.description,
    },
  });

  await sendPushToUser(
    userId,
    push ?? { title: notification.title, body: notification.description, url: "/notifications" }
  );
}
