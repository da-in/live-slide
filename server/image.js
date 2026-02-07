/**
 * 이미지 검색 (Unsplash API).
 * LLM이 생성한 영문 검색 키워드로 이미지를 찾아 URL을 반환한다.
 *
 * 환경변수: UNSPLASH_ACCESS_KEY 필요
 *   예) UNSPLASH_ACCESS_KEY=your_key node index.js
 */

const UNSPLASH_BASE = "https://api.unsplash.com/search/photos";
const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

/**
 * 키워드로 Unsplash 이미지를 검색해 첫 번째 결과의 URL을 반환한다.
 * @param {string} query - 검색 키워드 (영문 2~4단어 권장)
 * @returns {Promise<string|null>} 이미지 URL 또는 null
 */
export async function searchImage(query) {
  if (!ACCESS_KEY) {
    console.warn("[IMAGE] UNSPLASH_ACCESS_KEY가 설정되지 않았습니다.");
    return null;
  }

  if (!query || typeof query !== "string") return null;

  try {
    const url = `${UNSPLASH_BASE}?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${ACCESS_KEY}` },
    });

    if (!res.ok) {
      console.error(`[IMAGE] Unsplash error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const photo = data?.results?.[0];

    if (!photo) {
      console.warn(`[IMAGE] 검색 결과 없음: "${query}"`);
      return null;
    }

    // regular: 1080px wide — 프레젠테이션에 적합한 크기
    const imageUrl = photo.urls?.regular ?? photo.urls?.small ?? null;
    console.log(`[IMAGE] "${query}" → ${imageUrl?.slice(0, 80)}...`);
    return imageUrl;
  } catch (err) {
    console.error("[IMAGE] 검색 실패:", err.message ?? err);
    return null;
  }
}

/**
 * ActionPayload 내 IMAGE 컴포넌트의 src(키워드)를 실제 Unsplash URL로 교체한다.
 * 검색에 실패한 IMAGE 컴포넌트는 제거된다.
 *
 * @param {object} payload - LLM이 생성한 ActionPayload
 * @returns {Promise<object>} URL이 교체된 ActionPayload
 */
export async function resolveImageComponents(payload) {
  if (!payload?.components?.length) return payload;

  const resolved = await Promise.all(
    payload.components.map(async (comp) => {
      if (comp.type !== "IMAGE") return comp;

      const url = await searchImage(comp.src);
      if (!url) {
        // 이미지를 찾지 못하면 해당 컴포넌트 제거
        console.warn(`[IMAGE] "${comp.src}" → URL 교체 실패, 컴포넌트 제거`);
        return null;
      }

      return { ...comp, src: url };
    })
  );

  return {
    ...payload,
    components: resolved.filter(Boolean),
  };
}
