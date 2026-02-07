/** 발표 배경 테마 */
export type BackgroundTheme = "auto" | "hackathon";

/** 발표 한 건 (목록 + 해당 발표 설정) */
export interface Presentation {
  id: string;
  title: string;
  /** 생성일 (정렬용) */
  createdAt: number;
  /** 발표에 대한 사전 정보 */
  context: string;
  /** 발표 테마 */
  background: BackgroundTheme;
  /** 활용할 자료 파일 이름 (실제 File은 저장 불가, 이름만 보관) */
  attachedFileNames: string[];
}

/** @deprecated 목록용은 Presentation 사용 */
export type PresentationSummary = Presentation;

/** 시작 화면에서 시작하기 클릭 시 넘기는 데이터 */
export interface PresentationPreInput {
  context: string;
  files: File[];
  background: BackgroundTheme;
}
