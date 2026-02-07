interface ImageComponentProps {
  src: string;
  alt?: string;
}

/** 서버에서 내려준 IMAGE 타입 컴포넌트 - 발표용 이미지 */
export default function ImageComponent({ src, alt = "" }: ImageComponentProps) {
  return (
    <figure className="overflow-hidden rounded-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-h-[70vh] w-auto max-w-full object-contain"
      />
    </figure>
  );
}
