import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import {
  listMessagesForConversation,
  MAX_MESSAGE_LENGTH,
  sanitizeMessageBody,
  sendDirectMessage,
} from "@/lib/communicationRepo";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.roles.includes("RESEARCHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const messages = await listMessagesForConversation({
    conversationId: id,
    userId: user.id,
  });
  if (!messages) {
    return NextResponse.json({ error: "المحادثة غير موجودة" }, { status: 404 });
  }

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.roles.includes("RESEARCHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.message === "string" ? sanitizeMessageBody(body.message) : "";
  if (!text) {
    return NextResponse.json({ error: "نص الرسالة مطلوب" }, { status: 400 });
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "الرسالة طويلة جدًا" }, { status: 400 });
  }

  const message = await sendDirectMessage({
    conversationId: id,
    senderId: user.id,
    body: text,
  });
  if (!message) {
    return NextResponse.json({ error: "تعذر إرسال الرسالة أو المحادثة غير متاحة" }, { status: 404 });
  }

  return NextResponse.json({
    message: {
      id: message.id,
      body: message.body,
      senderId: message.senderId,
      createdAt: message.createdAt.toISOString(),
      readAt: message.readAt?.toISOString() ?? null,
      isMine: true,
    },
  });
}
