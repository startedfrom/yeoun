import type { Prisma } from '../generated/prisma/index.js';

type Tx = Prisma.TransactionClient;

/**
 * 수신자 흐름과 동일하게 대화를 만들고 첫 메시지를 넣는다. 호출 전에 권한·상태를 검증할 것.
 */
export async function acceptPendingMessageRequestTx(
  tx: Tx,
  requestId: string
): Promise<{ conversationId: string }> {
  const req = await tx.messageRequest.findUnique({ where: { id: requestId } });
  if (!req || req.status !== 'pending') {
    throw new Error('message_request_not_pending');
  }

  await tx.messageRequest.update({
    where: { id: requestId },
    data: { status: 'accepted' }
  });

  const existingConvs = await tx.conversation.findMany({
    where: {
      AND: [
        { members: { some: { userId: req.toUserId } } },
        { members: { some: { userId: req.fromUserId } } }
      ]
    }
  });

  let conv;
  if (existingConvs.length > 0) {
    conv = existingConvs[0];
  } else {
    conv = await tx.conversation.create({
      data: {
        conversationType: 'direct',
        members: {
          create: [{ userId: req.toUserId }, { userId: req.fromUserId }]
        }
      }
    });
  }

  if (req.initialMessage) {
    await tx.message.create({
      data: {
        conversationId: conv.id,
        senderUserId: req.fromUserId,
        messageType: 'text',
        content: req.initialMessage
      }
    });
    await tx.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: new Date() }
    });
  }

  return { conversationId: conv.id };
}

export async function rejectPendingMessageRequestTx(tx: Tx, requestId: string): Promise<void> {
  const req = await tx.messageRequest.findUnique({ where: { id: requestId } });
  if (!req || req.status !== 'pending') {
    throw new Error('message_request_not_pending');
  }

  await tx.messageRequest.update({
    where: { id: requestId },
    data: { status: 'rejected' }
  });
}
