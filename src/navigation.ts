import { getBlogPermalink, getPermalink, getHomePermalink } from "~/utils/permalinks";

export const headerData = {
  links: [
    {
      text: "Homes",
      href: getBlogPermalink(), // 홈으로 이동
    },
    {
      text: "Blog",
      links: [
        {
          text: "Post List",
          href: getBlogPermalink(),
        },
      ],
    },
  ],
};

export const footerData = {
  footNote: `
    Made by <a class="text-blue-600 underline dark:text-muted" href="https://github.com/arthelokyo"> Arthelokyo</a> · All rights reserved.
  `,
};
