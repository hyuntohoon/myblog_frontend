import type { ImageMetadata } from "astro";
import type { Post as AWPost } from "~/types";
import type { PostListItem, PostDetail } from "@/lib/api";

// 목록용: 백엔드 항목 → AstroWind Post
export function toAWPostListItem(p: PostListItem): AWPost {
  const dateStr = p.published_at || p.created_at || null;
  const dt = dateStr ? new Date(dateStr) : null;

  return {
    id: String(p.id),
    slug: p.slug ?? String(p.id),
    permalink: `/blog/${p.id}`, // 상세 라우팅 규칙
    publishDate: dt ?? new Date(),
    title: p.title ?? "(제목 없음)",
    excerpt: p.excerpt ?? "",
    author: undefined,
    image: undefined as unknown as ImageMetadata | string | undefined,
    // 필요 필드만 채움 (남은 커스텀 필드는 컴포넌트가 optional 처리)
  };
}

// 상세용: 본문 포함
export function toAWPostDetail(p: PostDetail): AWPost & { content?: string } {
  const base = toAWPostListItem(p);
  return {
    ...base,
    content: p.content_html || undefined, // HTML을 바로 렌더
  };
}
