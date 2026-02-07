interface DescriptionComponentProps {
  content: string;
}

/** 서버에서 내려준 DESCRIPTION 타입 컴포넌트 - 발표용 설명 텍스트 */
export default function DescriptionComponent({ content }: DescriptionComponentProps) {
  return (
    <p className="text-lg leading-relaxed text-gray-200 md:text-xl">
      {content}
    </p>
  );
}
