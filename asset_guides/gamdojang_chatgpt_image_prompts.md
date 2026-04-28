# 여운 ChatGPT 이미지 생성 프롬프트

## 1. 사용 원칙

- 모든 에셋은 먼저 `공통 브랜드 프롬프트`를 붙이고 시작한다.
- 그 다음 `유형별 공통 프롬프트`를 붙인다.
- 마지막으로 `에셋별 상세 프롬프트`를 붙인다.
- 같은 시리즈는 가능하면 같은 채팅 또는 같은 레퍼런스 이미지를 유지한다.
- 피드 사진은 한 번에 한 장씩 생성하고, 가장 잘 나온 1장을 이후 생성의 스타일 레퍼런스로 재사용한다.

## 2. 공통 브랜드 프롬프트

아래 블록은 사진/일러스트 공통으로 맨 앞에 붙인다.

```text
Create a mobile-app-ready visual asset for a Korean social app called "여운".
The brand world is pastel pixel, dreamy but readable, soft and collectible, photo-first, gentle and non-judgmental.
Use a soft cream, lavender, baby pink, sky blue, and a very limited mint palette.
The result must feel like a coherent branded world, not a generic startup design, not a dating app, not an Instagram clone.
Keep the image clean, emotionally warm, and easy to crop for mobile UI.
Avoid heavy gradients, glossy plastic 3D, neon colors, luxury black-and-white styling, harsh contrast, or cluttered compositions.
```

## 3. 유형별 공통 프롬프트

### 3.1 사진용 공통 프롬프트

```text
Use case: photorealistic-natural
Asset type: in-app content photo
Style/medium: natural editorial smartphone photo with subtle film softness
Lighting/mood: soft natural light or gentle ambient city light, calm and atmospheric
Color palette: pastel-leaning real-world tones, cream highlights, lavender-pink-blue accents, never neon
Composition/framing: mobile-friendly composition, clear main subject, enough breathing room for UI crop
Materials/textures: real fabric, glass, paper, skin, sky, indoor light, slight real-camera grain
Constraints: adult subjects only when people appear; no logos; no visible brand names; no watermarks; no text in image
Avoid: sexualized posing, glamour-shot makeup styling, influencer-ad look, luxury campaign styling, over-sharpening, exaggerated bokeh, plastic skin, childish toy look
```

### 3.2 일러스트용 공통 프롬프트

```text
Use case: illustration-story
Asset type: in-app branded illustration
Style/medium: soft pastel illustration with subtle pixel-inspired shape language, clean 2D finish
Lighting/mood: gentle, airy, warm, and calm
Composition/framing: simple silhouette, centered main subject, edges kept light for UI overlay
Color palette: cream background with lavender, pink, sky blue, and a tiny mint accent
Materials/textures: matte surfaces, light grain, very soft shading
Constraints: simple forms, readable at small mobile sizes, no text, no watermark
Avoid: over-detailed anime rendering, glossy mascot art, toy-store aesthetics, chaotic stickers everywhere, dark horror mood, aggressive expressions
```

### 3.3 아이콘 스타일 보드용 공통 프롬프트

아이콘 자체는 SVG 제작이 더 적합하지만, 스타일 기준 이미지를 뽑고 싶을 때만 쓴다.

```text
Use case: ui-mockup
Asset type: icon style reference sheet
Style/medium: pixel-inspired flat icon concept sheet
Composition/framing: evenly spaced icon grid on a cream background
Color palette: ink outline with lavender, pink, sky blue accents
Constraints: consistent line weight, minimal detail, no glossy effect, no text labels inside the artwork
Avoid: skeuomorphism, photorealism, gradient-heavy dribbble style, copied social media icons
```

## 4. 공통 네거티브 제약

아래 블록은 필요할 때 마지막에 덧붙인다.

```text
Avoid hearts as the main symbol, avoid star ratings, avoid black-and-white luxury styling, avoid neon purple gradient UI, avoid card-on-card clutter, avoid direct Instagram story-circle language, avoid anything that feels like appearance scoring.
```

## 5. 스타일 앵커 생성 프롬프트

### 5.1 브랜드 무드 앵커

권장 크기: `1536 x 2048`

```text
Create a portrait mood-board-like branded illustration for the app "여운".
Show a dreamy pastel pixel world with a soft stamp motif, cat paw cues, jelly-like accent shapes, cream background, lavender-pink-sky-blue palette, and airy spacing.
The image should feel like the emotional north star for all future assets.
No text, no phone mockup, no heavy gradients, no realistic UI screenshot.
```

### 5.2 사진 앵커

권장 크기: `1440 x 1800`

```text
Create a single editorial lifestyle photo that defines the visual tone of "여운".
Subject: a calm everyday scene with soft pastel color relationships, emotionally warm atmosphere, real textures, and subtle film softness.
Setting: a sunlit room corner with fabric, paper, glass, and a small personal object arrangement.
Keep the composition crop-friendly for 4:5 and later 1:1 crops.
No visible brand names, no text, no luxury styling, no influencer-ad feel.
```

## 6. 에셋별 상세 프롬프트

### 6.1 스플래시 히어로 일러스트

권장 크기: `1536 x 2048`, `PNG`

```text
Create a splash-screen hero illustration for the app "여운".
Show a dreamy pastel pixel world with a soft cat paw stamp motif and a tiny jelly mascot feeling.
Main scene: a floating photo frame, cat paw stamp marks, soft sticker-like mood tags, and a calm cream background with lavender, baby pink, and sky blue accents.
Keep the main focal cluster slightly above center so logo and subtitle can sit lower on screen.
No text, no phone device frame, no heavy shadows, no noisy background.
```

### 6.2 온보딩 무드 선택 히어로

권장 크기: `1536 x 1920`, `PNG`

```text
Create an onboarding illustration for a mobile app where users choose their mood tags.
Show floating mood-tag stickers around a gentle central scene: dreamy sky, cafe light, film camera, ribbon camera, paper notes, and soft paw-stamp marks.
The image should feel welcoming, collectible, and calm, with the lower part left visually lighter for onboarding copy and buttons.
No text, no clutter, no childish cartoon overload.
```

### 6.3 편지함 빈 상태 일러스트

권장 크기: `1200 x 1600`, `PNG`

```text
Create an empty-state illustration for the mailbox screen of "여운".
Main subject: a soft pastel envelope with a tiny paw stamp seal, placed in a calm cream space with subtle floating paper pieces and a gentle mood.
Keep the bottom 25 percent visually quiet for empty-state text and CTA.
No text, no dark mood, no exaggerated mascot expression.
```

### 6.4 알림함 빈 상태 일러스트

권장 크기: `1200 x 1600`, `PNG`

```text
Create an empty-state illustration for a notification inbox.
Main subject: a small bell-shaped charm and soft floating paw-stamp sparkles, with a calm cream background and very light pastel accents.
The image should feel like "nothing urgent, just quiet".
Keep the lower area open for copy.
No text, no dramatic effects, no metallic realism.
```

### 6.5 보관함 빈 상태 일러스트

권장 크기: `1200 x 1600`, `PNG`

```text
Create an empty-state illustration for a saved-post archive screen.
Main subject: a soft keepsake box or drawer with sticker-like mood tags and a tiny paw-stamp seal, in a calm pastel pixel-inspired illustration style.
Leave room at the bottom for explanatory text.
No text, no clutter, no overly toy-like styling.
```

### 6.6 업로드 완료 스티커

권장 크기: `1024 x 1024`, `PNG`, 가능하면 투명 배경

```text
Create a celebratory sticker-style illustration for a successful post upload in "여운".
Main subject: a cat paw stamp landing softly on a jelly-like seal, with tiny confetti shapes in pastel lavender, pink, and sky blue.
The result should be cute but restrained, readable at small size, and usable as a centered reward sticker in a mobile app.
No text, no loud confetti explosion, no glossy 3D plastic look.
```

## 7. 피드 사진 생성 템플릿

### 7.1 일반 게시물 사진 템플릿

권장 크기: `1440 x 1800`, `JPG`

```text
Create a 4:5 mobile-feed photo for "여운".
Subject: [insert subject]
Setting: [insert place]
Mood tags: [insert 2 or 3 mood tags]
The image must feel like a real everyday moment captured with care, soft pastel color relationships, subtle film softness, and enough centered composition to survive later 1:1 crops for profile and explore grids.
No text, no logos, no aggressive fashion-ad styling.
```

### 7.2 찰나 사진 템플릿

권장 크기: `1080 x 1920`, `JPG`

```text
Create a 9:16 vertical chalna photo for "여운".
Subject: [insert subject]
Setting: [insert place]
Mood tags: [insert 2 or 3 mood tags]
The image should feel fleeting, immediate, and intimate, like a soft moment someone leaves for 12 or 24 hours.
Keep the subject inside the center 70 percent because the app may crop this image into a smaller tile.
No text, no logos, no influencer-ad posing.
```

### 7.3 아바타 사진 템플릿

권장 크기: `1024 x 1024`, `JPG` 또는 `PNG`

```text
Create a square avatar portrait for the app "여운".
Subject: one adult person or one clear personal object composition that can represent a profile.
Style: natural, calm, soft pastel editorial, readable at small size.
Keep the face or main subject centered and simple enough to remain recognizable in a small circular or rounded-square crop.
No text, no logos, no sexualized styling, no extreme makeup campaign look.
```

## 8. 바로 쓰기 좋은 예시 프롬프트

### 8.1 피드 사진 예시 A: 몽환 침실 무드

권장 크기: `1440 x 1800`

```text
Create a 4:5 mobile-feed photo for "여운".
Subject: a softly lit bedroom corner with white bedding, a lavender cardigan, a half-open journal, and a glass of water on a cream side table
Setting: morning light in a small calm room
Mood tags: 몽환, 새벽, 포근
The image must feel like a real everyday moment captured with care, soft pastel color relationships, subtle film softness, and enough centered composition to survive later 1:1 crops for profile and explore grids.
No text, no logos, no aggressive fashion-ad styling.
```

### 8.2 피드 사진 예시 B: 청량 강변 산책

권장 크기: `1440 x 1800`

```text
Create a 4:5 mobile-feed photo for "여운".
Subject: an adult person seen from behind on a riverside path, wearing a pale blue shirt and carrying a simple tote bag
Setting: clear afternoon sky, light breeze, clean open riverside walkway
Mood tags: 청량, 산책, 바람
The image must feel like a real everyday moment captured with care, soft pastel color relationships, subtle film softness, and enough centered composition to survive later 1:1 crops for profile and explore grids.
No text, no logos, no aggressive fashion-ad styling.
```

### 8.3 피드 사진 예시 C: 필름 카페 정물

권장 크기: `1440 x 1800`

```text
Create a 4:5 mobile-feed photo for "여운".
Subject: a cafe table still life with an iced drink, a compact film camera, pastel notebook, and soft window light
Setting: a quiet cafe corner with cream and wood tones
Mood tags: 필름, 빈티지, 조용함
The image must feel like a real everyday moment captured with care, soft pastel color relationships, subtle film softness, and enough centered composition to survive later 1:1 crops for profile and explore grids.
No text, no logos, no aggressive fashion-ad styling.
```

### 8.4 찰나 예시 A: 밤 산책

권장 크기: `1080 x 1920`

```text
Create a 9:16 vertical chalna photo for "여운".
Subject: a quiet crosswalk at blue hour with soft reflections on the road and one adult figure in a pale jacket
Setting: calm city evening, not crowded, slightly damp pavement
Mood tags: 새벽, 고요, 도심
The image should feel fleeting, immediate, and intimate, like a soft moment someone leaves for 12 or 24 hours.
Keep the subject inside the center 70 percent because the app may crop this image into a smaller tile.
No text, no logos, no influencer-ad posing.
```

### 8.5 찰나 예시 B: 엘리베이터 거울 셀프샷

권장 크기: `1080 x 1920`

```text
Create a 9:16 vertical chalna photo for "여운".
Subject: an adult person taking a soft mirror selfie in an elevator, wearing a cream hoodie and holding a simple phone with no visible logo
Setting: clean elevator interior with soft overhead light
Mood tags: 일상, 담백, 순간
The image should feel fleeting, immediate, and intimate, like a soft moment someone leaves for 12 or 24 hours.
Keep the subject inside the center 70 percent because the app may crop this image into a smaller tile.
No text, no logos, no influencer-ad posing.
```

### 8.6 아바타 예시 A: 담백한 프로필

권장 크기: `1024 x 1024`

```text
Create a square avatar portrait for the app "여운".
Subject: one adult person with a calm expression, soft natural hair, cream knitwear, and a simple pastel background
Style: natural, calm, soft pastel editorial, readable at small size
Keep the face centered and simple enough to remain recognizable in a small circular or rounded-square crop.
No text, no logos, no sexualized styling, no extreme makeup campaign look.
```

## 9. 아이콘 스타일 레퍼런스 프롬프트

아이콘 실물 제작용이 아니라 아트 디렉션 기준 이미지를 만들고 싶을 때만 사용한다.

권장 크기: `1600 x 1200`

```text
Create a pixel-inspired icon style reference sheet for the app "여운".
Show a small family of flat UI icons on a cream background: home, walk, upload, mailbox, mood card, bell, search, archive, paw stamp, jelly, ribbon camera, stamp seal, chalna frame.
Keep all icons visually related with minimal detail, soft squared corners, thin ink outlines, and pastel lavender-pink-sky accents.
Do not include text labels inside the artwork.
No glossy effects, no photorealism, no copied social-media icon silhouettes.
```

## 10. 생성 팁

- 같은 피드용 사진은 `일반 게시물 사진 템플릿`만 유지하고, `Subject / Setting / Mood tags`만 바꿔 생성한다.
- 찰나는 정식 피드보다 더 순간적이고 살짝 덜 정돈된 장면이 잘 어울린다.
- 사람이 들어가는 사진은 가급적 `adult subject`를 명시한다.
- UI 위에 올릴 이미지는 항상 `no text, no logos, no watermark`를 반복하는 편이 안전하다.
- 1차 생성 후 너무 화려하면 `calmer, less styled, more everyday`를 추가하고, 너무 밋밋하면 `slightly clearer focal subject`를 추가해 미세 조정한다.
