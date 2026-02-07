interface TitleComponentProps {
  content: string;
}

/** 서버에서 내려준 TITLE 타입 컴포넌트 - 발표용 제목 */
export default function TitleComponent({ content }: TitleComponentProps) {
  return (
    <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
      {content}
    </h2>
  );
}
