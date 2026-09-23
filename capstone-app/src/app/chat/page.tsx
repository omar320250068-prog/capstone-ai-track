import type { Metadata } from "next";
import Chat from "@/components/chat/chat";
import PageHeader from "@/components/page-header";
import { chatBackend } from "@/lib/ai/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Chat",
};

export default function ChatPage() {
  return (
    <>
      <PageHeader
        eyebrow="Build · streaming chat"
        title="Hold a live streaming conversation."
        description="Replies stream in token by token. Scroll up mid-stream to release the pin, hit Stop and send again."
      />
      <Chat mode={chatBackend()} />
    </>
  );
}