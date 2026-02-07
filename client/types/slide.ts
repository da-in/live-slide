/**
 * 서버에서 내려주는 슬라이드 컴포넌트 타입 (디스크리미네이트드 유니온)
 */
export type SlideComponent =
  | { type: "TITLE"; content: string }
  | { type: "DESCRIPTION"; content: string }
  | { type: "IMAGE"; src: string; alt?: string };

/**
 * 서버 슬라이드 업데이트 응답 (WebSocket slide-update 등)
 */
export interface ActionPayload {
  type: "SLIDE_UPDATE" | "SLIDE_CLEAR" | "SLIDE_APPEND";
  components?: SlideComponent[];
  timestamp?: number;
}
