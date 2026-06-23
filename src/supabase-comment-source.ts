import { createClient, type RealtimeChannel } from "@supabase/supabase-js";
import type { Comment, CommentSource } from "./comment.js";

export class SupabaseCommentSource implements CommentSource {
  private supabase = createClient(
    window.supabaseEnv.url,
    window.supabaseEnv.publishableKey
  );
  private readonly handlers = new Set<(comment: Comment) => void>();
  private channel: RealtimeChannel | null = null;

  constructor(private readonly roomId: string) {}

  start(): void {
    if (this.channel) return;

    this.channel = this.supabase
      .channel(`room:${this.roomId}`)
      .on("broadcast", { event: "new_comment" }, (payload) => {
        const comment: Comment = payload.payload;
        this.handlers.forEach((handler) => handler(comment));
      })
      .subscribe();
  }

  stop(): void {
    if (!this.channel) return;

    this.supabase.removeChannel(this.channel);
    this.channel = null;
  }

  subscribe(handler: (comment: Comment) => void): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }
}
