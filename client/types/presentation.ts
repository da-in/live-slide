/** 발표 배경 테마 */
export type BackgroundTheme = "auto" | "hackathon";

/** 발표 목록용 간단한 정보 */
export interface PresentationSummary {
  id: string;
  title: string;
  /** 생성일 (정렬용) */
  createdAt: number;
}

/** 시작 화면에서 입력하는 사전 정보 */
export interface PresentationPreInput {
  /** 발표에 대한 사전 정보 (텍스트) */
  context: string;
  /** 발표에서 활용할 자료 파일들 */
  files: File[];
  /** 배경 테마 */
  background: BackgroundTheme;
}
