"use client";

import type { SlideComponent } from "@/types/slide";
import TitleComponent from "@/components/canvas/TitleComponent";
import DescriptionComponent from "@/components/canvas/DescriptionComponent";
import ImageComponent from "@/components/canvas/ImageComponent";

type LayoutVariant =
  | "classic"        // 타이틀 → 설명 → 이미지 (세로)
  | "imageLeft"      // 타이틀 → [이미지 | 설명]
  | "imageRight"     // 타이틀 → [설명 | 이미지]
  | "imageTop"       // 타이틀 → 이미지 → 설명
  | "imageCenter";   // 타이틀 → 이미지(큰) → 설명

function extractParts(components: SlideComponent[]) {
  let title: { content: string } | null = null;
  let description: { content: string } | null = null;
  let image: { src: string; alt?: string } | null = null;
  for (const c of components) {
    if (c.type === "TITLE" && !title) title = { content: c.content };
    if (c.type === "DESCRIPTION" && !description) description = { content: c.content };
    if (c.type === "IMAGE" && !image) image = { src: c.src, alt: c.alt };
  }
  return { title, description, image };
}

/** 콘텐츠 기반으로 동일 슬라이드는 같은 레이아웃을 유지하도록 해시 */
function getLayoutVariant(components: SlideComponent[]): LayoutVariant {
  const parts = extractParts(components);
  const seed =
    (parts.title?.content ?? "") + "|" + (parts.description?.content ?? "") + "|" + (parts.image?.src ?? "");
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i);
  const variants: LayoutVariant[] = ["classic", "imageLeft", "imageRight", "imageTop", "imageCenter"];
  const index = Math.abs(hash) % variants.length;
  return variants[index];
}

interface SlideLayoutProps {
  components: SlideComponent[];
}

/**
 * 타이틀/설명/이미지를 여러 레이아웃 중 하나로 렌더링한다.
 * 슬라이드별로 콘텐츠 기반 해시로 레이아웃이 고정되어, 동일 슬라이드는 같은 UI를 유지한다.
 */
export default function SlideLayout({ components }: SlideLayoutProps) {
  const { title, description, image } = extractParts(components);
  const variant = getLayoutVariant(components);

  if (!title && !description && !image) return null;

  const titleEl = title ? <TitleComponent content={title.content} /> : null;
  const descEl = description ? <DescriptionComponent content={description.content} /> : null;
  const imgEl = image ? <ImageComponent src={image.src} alt={image.alt} /> : null;

  switch (variant) {
    case "classic":
      return (
        <div className="flex flex-col items-center gap-8 text-center">
          {titleEl}
          {descEl}
          {imgEl}
        </div>
      );
    case "imageLeft":
      return (
        <div className="flex flex-col items-center gap-8 text-center">
          {titleEl}
          <div className="grid w-full max-w-4xl grid-cols-1 items-start gap-8 md:grid-cols-2 md:items-center">
            <div className="flex justify-center">{imgEl}</div>
            <div className="flex flex-col justify-center text-left">{descEl}</div>
          </div>
        </div>
      );
    case "imageRight":
      return (
        <div className="flex flex-col items-center gap-8 text-center">
          {titleEl}
          <div className="grid w-full max-w-4xl grid-cols-1 items-start gap-8 md:grid-cols-2 md:grid-flow-dense md:items-center">
            <div className="flex flex-col justify-center text-left md:order-1">{descEl}</div>
            <div className="flex justify-center md:order-2">{imgEl}</div>
          </div>
        </div>
      );
    case "imageTop":
      return (
        <div className="flex flex-col items-center gap-8 text-center">
          {titleEl}
          {imgEl}
          {descEl}
        </div>
      );
    case "imageCenter":
      return (
        <div className="flex flex-col items-center gap-8 text-center">
          {titleEl}
          {imgEl}
          <div className="w-full max-w-2xl">{descEl}</div>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center gap-8 text-center">
          {titleEl}
          {descEl}
          {imgEl}
        </div>
      );
  }
}
