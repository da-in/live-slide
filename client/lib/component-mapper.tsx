import type { ReactNode } from "react";
import type { SlideComponent } from "@/types/slide";
import TitleComponent from "@/components/canvas/TitleComponent";
import DescriptionComponent from "@/components/canvas/DescriptionComponent";
import ImageComponent from "@/components/canvas/ImageComponent";

/**
 * 서버에서 받은 SlideComponent를 해당하는 React 컴포넌트로 매핑해 반환한다.
 * @param component - 서버 payload의 컴포넌트 항목
 * @param key - 리스트 렌더링용 key (optional)
 */
export function mapComponent(
  component: SlideComponent,
  key?: string | number
): ReactNode {
  switch (component.type) {
    case "TITLE":
      return <TitleComponent key={key} content={component.content} />;
    case "DESCRIPTION":
      return <DescriptionComponent key={key} content={component.content} />;
    case "IMAGE":
      return (
        <ImageComponent
          key={key}
          src={component.src}
          alt={component.alt}
        />
      );
    default: {
      const _: never = component;
      return null;
    }
  }
}
