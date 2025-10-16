import slugify from "limax";
import { SITE, APP_BLOG } from "astrowind:config";
import { trim } from "~/utils/utils";

export const trimSlash = (s: string) => trim(trim(s, "/"));

/** 마지막 슬래시 정책과 base를 고려해 경로를 조합 */
const createPath = (...params: string[]) => {
  const paths = params
    .map((el) => trimSlash(String(el || "")))
    .filter((el) => el.length > 0)
    .join("/");

  const withLeading = "/" + paths;
  const wantTrailing = !!SITE?.trailingSlash;

  if (!paths) {
    // 루트일 땐 trailingSlash 여부에 따라 '/' 또는 '/' 그대로
    return "/";
  }
  return wantTrailing ? withLeading + "/" : withLeading;
};

const BASE_PATHNAME = SITE?.base ? trimSlash(SITE.base) : "";

/** 슬러그 정리 */
export const cleanSlug = (text = "") =>
  trimSlash(text)
    .split("/")
    .map((seg) => slugify(seg))
    .join("/");

/** 블로그/카테고리/태그 기본 경로 (설정 비어도 안전하게 기본값 지정) */
export const BLOG_BASE = cleanSlug(APP_BLOG?.list?.pathname || "blog");
export const CATEGORY_BASE = cleanSlug(APP_BLOG?.category?.pathname || "category");
export const TAG_BASE = cleanSlug(APP_BLOG?.tag?.pathname || "tag");

/** 포스트 퍼머링크 패턴 (기본: /blog/%slug%) */
export const POST_PERMALINK_PATTERN = trimSlash(APP_BLOG?.post?.permalink || `${BLOG_BASE}/%slug%`);

/** 절대 canonical URL 계산 */
export const getCanonical = (path = ""): string | URL => {
  const url = String(new URL(path || "/", SITE.site));
  const wantTrailing = !!SITE?.trailingSlash;

  if (!path) return url;

  if (!wantTrailing && url.endsWith("/")) {
    return url.slice(0, -1);
  } else if (wantTrailing && !url.endsWith("/")) {
    return url + "/";
  }
  return url;
};

/** base(배포 베이스) 포함한 최종 경로 생성 */
const definitivePermalink = (permalink: string): string => createPath(BASE_PATHNAME, permalink);

/** 에셋 경로 */
export const getAsset = (path: string): string =>
  "/" +
  [BASE_PATHNAME, path]
    .map((el) => trimSlash(String(el || "")))
    .filter((el) => el.length > 0)
    .join("/");

/** 홈 경로 */
export const getHomePermalink = (): string => getPermalink("/");

/** 블로그 루트 경로 */
export const getBlogPermalink = (): string => getPermalink(BLOG_BASE);

/** 범용 퍼머링크 */
export const getPermalink = (
  slug = "",
  type: "home" | "blog" | "asset" | "category" | "tag" | "post" | "page" = "page"
): string => {
  // 외부 링크/해시/javasript: 그대로 통과
  if (
    slug.startsWith("https://") ||
    slug.startsWith("http://") ||
    slug.startsWith("://") ||
    slug.startsWith("#") ||
    slug.startsWith("javascript:")
  ) {
    return slug;
  }

  let permalink: string;

  switch (type) {
    case "home":
      permalink = getHomePermalink();
      break;
    case "blog":
      permalink = getBlogPermalink();
      break;
    case "asset":
      permalink = getAsset(slug);
      break;
    case "category":
      permalink = createPath(CATEGORY_BASE, trimSlash(slug));
      break;
    case "tag":
      permalink = createPath(TAG_BASE, trimSlash(slug));
      break;
    case "post":
      permalink = createPath(trimSlash(slug));
      break;
    case "page":
    default:
      permalink = createPath(slug);
      break;
  }

  return definitivePermalink(permalink);
};

/* ============================================================
 * Navigation 데이터에 getPermalink 계열을 재귀 적용
 * ============================================================
 */

type HrefObject =
  | { type: "home" }
  | { type: "blog" }
  | { type: "asset"; url: string }
  | { type?: "page" | "post" | "category" | "tag"; url: string };

type MenuLeaf = string | number | boolean | null | undefined;
type MenuNode = MenuLeaf | MenuObject | MenuNode[];

type MenuObject = {
  [key: string]: MenuNode | HrefObject | string;
  href?: string | HrefObject;
};

/** 재귀적으로 href 필드를 실제 퍼머링크로 대체 */
export const applyGetPermalinks = <T extends MenuNode>(menu: T): T => {
  if (Array.isArray(menu)) {
    return menu.map((item) => applyGetPermalinks(item)) as T;
  }

  if (menu && typeof menu === "object") {
    // HrefObject 처리
    if ("type" in (menu as any) && !("href" in (menu as any))) {
      // 이 분기는 메뉴 자체가 HrefObject인 극단 경우를 방어(거의 없음)
      const m = menu as unknown as HrefObject;
      return resolveHrefObject(m) as unknown as T;
    }

    const src = menu as MenuObject;
    const out: MenuObject = {};

    for (const key in src) {
      const val = src[key];

      if (key === "href") {
        if (typeof val === "string") {
          out.href = getPermalink(val);
        } else if (val && typeof val === "object" && "type" in val) {
          out.href = resolveHrefObject(val as HrefObject);
        } else {
          out.href = val as any;
        }
      } else {
        out[key] = applyGetPermalinks(val as MenuNode);
      }
    }

    return out as T;
  }

  // 원시 타입은 그대로
  return menu;
};

function resolveHrefObject(h: HrefObject): string {
  switch (h.type) {
    case "home":
      return getHomePermalink();
    case "blog":
      return getBlogPermalink();
    case "asset":
      return getAsset(h.url);
    case "post":
    case "category":
    case "tag":
    case "page":
    default:
      return getPermalink(h.url, h.type ?? "page");
  }
}
