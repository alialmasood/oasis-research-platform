import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/middleware";
import {
  getOrCreateConversation,
  listConversationsForUser,
  requireResearcherPeer,
  sanitizeMessageBody,
  sendDirectMessage,
  MAX_MESSAGE_LENGTH,
} from "@/lib/communicationRepo";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.roles.includes("RESEARCHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const conversations = await listConversationsForUser(user.id);
  return NextResponse.json({ conversations });
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.roles.includes("RESEARCHER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { peerId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const peerId = typeof body.peerId === "string" ? body.peerId.trim() : "";
  const peer = await requireResearcherPeer(peerId, user.id);
  if (!peer) {
    return NextResponse.json({ error: "الباحث غير متاح للمراسلة" }, { status: 404 });
  }

  const conversation = await getOrCreateConversation(user.id, peer.id);
  const messageText = typeof body.message === "string" ? sanitizeMessageBody(body.message) : "";

  if (messageText) {
    if (messageText.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "الرسالة طويلة جدًا" }, { status: 400 });
    }
    const message = await sendDirectMessage({
      conversationId: conversation.id,
      senderId: user.id,
      body: messageText,
    });
    if (!message) {
      return NextResponse.json({ error: "تعذر إرسال الرسالة" }, { status: 400 });
    }
  }

  return NextResponse.json({ conversationId: conversation.id });
}
