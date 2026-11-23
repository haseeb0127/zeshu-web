import type { CSSProperties } from "react";
export const ZESHU_GLOSSY_IMAGES = {
  "shop": "https://d2ol7oe51mr4n9.cloudfront.net/user_3JEWOqisqN1dgwr4TYI6pNAfQYR/f50dc355-b05d-4600-a8ae-84e6dfc71ede.webp",
  "fashion": "https://d2ol7oe51mr4n9.cloudfront.net/user_3JEWOqisqN1dgwr4TYI6pNAfQYR/16426cf9-e832-48e5-bd8f-f4dfbc5316a1.webp",
  "pay": "https://d2ol7oe51mr4n9.cloudfront.net/user_3JEWOqisqN1dgwr4TYI6pNAfQYR/6c6a7183-1aad-42ca-a496-72911abb3ddd.webp",
  "move": "https://d2ol7oe51mr4n9.cloudfront.net/user_3JEWOqisqN1dgwr4TYI6pNAfQYR/abf58fff-0b10-4f05-8063-d93f2e2b2b64.webp",
  "services": "https://d2ol7oe51mr4n9.cloudfront.net/user_3JEWOqisqN1dgwr4TYI6pNAfQYR/74a9bacd-f415-4c15-8432-26e3b8faea1f.webp",
  "weddings": "https://d2ol7oe51mr4n9.cloudfront.net/user_3JEWOqisqN1dgwr4TYI6pNAfQYR/25d7a276-c025-42b2-925d-4d5f2999daa3.webp",
  "interiors": "https://d2ol7oe51mr4n9.cloudfront.net/user_3JEWOqisqN1dgwr4TYI6pNAfQYR/8f196d44-4109-493b-bbab-970d3520aed5.webp",
  "support": "https://d2ol7oe51mr4n9.cloudfront.net/user_3JEWOqisqN1dgwr4TYI6pNAfQYR/4d5d2f24-0494-46eb-a5e8-4cd7942d8e3d.webp",
  "app": "https://d2ol7oe51mr4n9.cloudfront.net/user_3JEWOqisqN1dgwr4TYI6pNAfQYR/51c07dc1-0ef9-4159-94dc-13a4466cce3f.webp"
} as const;
export type ZeshuGlossyKind = keyof typeof ZESHU_GLOSSY_IMAGES;
export default function GlossyArtwork({kind,loading="lazy"}:{kind:ZeshuGlossyKind;loading?:"lazy"|"eager"}) {
 return <div data-glossy-art={kind} aria-hidden="true" className="pointer-events-none overflow-hidden" style={{position:"absolute",inset:0,zIndex:0} as CSSProperties}>
  <div className="absolute inset-y-0 right-0 w-[70%] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%)]">
   <img data-glossy-image={kind} src={ZESHU_GLOSSY_IMAGES[kind]} alt="" loading={loading} decoding="async" className="absolute right-0 top-0 h-full w-[187%] max-w-none object-cover object-right"/>
  </div>
  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(1,38,27,.98)_0%,rgba(1,46,33,.84)_37%,rgba(1,49,34,.27)_65%,transparent_91%)]"/>
 </div>;
}
