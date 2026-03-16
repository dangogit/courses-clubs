import { useInfiniteQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export interface FeedPost extends PostRow {
  author: Pick<ProfileRow, "id" | "display_name" | "avatar_url" | "role">;
  commentCount: number;
  reactionCounts: Record<string, number>;
  userReactions: string[];
}

const PAGE_SIZE = 20;

export function useFeed(groupId: string | null) {
  const supabase = createClient();

  return useInfiniteQuery({
    queryKey: ["feed", groupId ?? "main"],
    queryFn: async ({ pageParam }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Build query for non-pinned posts
      let query = supabase
        .from("posts")
        .select(
          "*, profiles!posts_user_id_fkey(id, display_name, avatar_url, role), post_comments(count), post_reactions(reaction_type)"
        )
        .eq("is_pinned", false)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(PAGE_SIZE);

      if (groupId) {
        query = query.eq("group_id", groupId);
      } else {
        query = query.is("group_id", null);
      }

      // Apply cursor
      if (pageParam) {
        query = query.or(
          `created_at.lt.${pageParam.createdAt},and(created_at.eq.${pageParam.createdAt},id.lt.${pageParam.id})`
        );
      }

      const { data: posts, error } = await query;
      if (error) throw error;

      // Fetch pinned posts only on first page
      let pinnedPosts: typeof posts = [];
      if (!pageParam) {
        let pinnedQuery = supabase
          .from("posts")
          .select(
            "*, profiles!posts_user_id_fkey(id, display_name, avatar_url, role), post_comments(count), post_reactions(reaction_type)"
          )
          .eq("is_pinned", true)
          .order("created_at", { ascending: false });

        if (groupId) {
          pinnedQuery = pinnedQuery.eq("group_id", groupId);
        } else {
          pinnedQuery = pinnedQuery.is("group_id", null);
        }

        const { data: pinned } = await pinnedQuery;
        pinnedPosts = pinned ?? [];
      }

      // Get user's reactions for all posts in this page
      const allPosts = [...pinnedPosts, ...(posts ?? [])];
      const postIds = allPosts.map((p) => p.id);
      const userReactionMap: Record<string, string[]> = {};

      if (user && postIds.length > 0) {
        const { data: reactions } = await supabase
          .from("post_reactions")
          .select("post_id, reaction_type")
          .eq("user_id", user.id)
          .in("post_id", postIds);

        if (reactions) {
          for (const r of reactions) {
            if (!userReactionMap[r.post_id]) userReactionMap[r.post_id] = [];
            userReactionMap[r.post_id].push(r.reaction_type);
          }
        }
      }

      // Transform posts
      const transformPost = (
        post: (typeof allPosts)[number]
      ): FeedPost => {
        const { profiles, post_comments, post_reactions, ...rest } =
          post as Record<string, unknown>;
        const author = profiles as FeedPost["author"];
        const commentCount =
          (post_comments as { count: number }[])?.[0]?.count ?? 0;

        // Aggregate reaction counts
        const reactionCounts: Record<string, number> = {};
        if (Array.isArray(post_reactions)) {
          for (const r of post_reactions as { reaction_type: string }[]) {
            reactionCounts[r.reaction_type] =
              (reactionCounts[r.reaction_type] ?? 0) + 1;
          }
        }

        return {
          ...rest,
          author,
          commentCount,
          reactionCounts,
          userReactions: userReactionMap[(rest as { id: string }).id] ?? [],
        } as FeedPost;
      };

      const transformedPinned = pinnedPosts.map(transformPost);
      const transformedPosts = (posts ?? []).map(transformPost);

      return {
        posts: [...transformedPinned, ...transformedPosts],
        nextCursor:
          posts && posts.length === PAGE_SIZE
            ? {
                createdAt: posts[posts.length - 1].created_at,
                id: posts[posts.length - 1].id,
              }
            : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as
      | { createdAt: string; id: string }
      | undefined,
  });
}
