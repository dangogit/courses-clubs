import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type CommentRow = Database["public"]["Tables"]["post_comments"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface CommentWithAuthor extends CommentRow {
  author: Pick<ProfileRow, "id" | "display_name" | "avatar_url" | "role">;
  replies: CommentWithAuthor[];
}

export function useComments(postId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["comments", postId],
    queryFn: async (): Promise<CommentWithAuthor[]> => {
      if (!postId) return [];

      const { data, error } = await supabase
        .from("post_comments")
        .select(
          "*, profiles!post_comments_user_id_fkey(id, display_name, avatar_url, role)"
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!data) return [];

      // Build tree: separate top-level and replies
      const commentMap = new Map<string, CommentWithAuthor>();
      const topLevel: CommentWithAuthor[] = [];

      for (const row of data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { profiles, ...rest } = row as any;
        const comment: CommentWithAuthor = {
          ...rest,
          author: profiles as CommentWithAuthor["author"],
          replies: [],
        };
        commentMap.set(comment.id, comment);
      }

      for (const comment of commentMap.values()) {
        if (comment.parent_id && commentMap.has(comment.parent_id)) {
          commentMap.get(comment.parent_id)!.replies.push(comment);
        } else {
          topLevel.push(comment);
        }
      }

      return topLevel;
    },
    enabled: !!postId,
  });
}
