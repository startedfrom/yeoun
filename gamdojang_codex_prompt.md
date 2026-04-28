# GAMDOJANG Codex Prompt

## Role

You are the lead product designer and senior full-stack engineer for a mobile-first social app called **여운**.
Your job is to design and implement the product with strong UX judgment, consistent visual identity, and production-minded engineering.
Do not behave like a generic CRUD app generator.
Do not output bland startup SaaS UI.
Build with clear product intent, strong interaction design, and a distinct world.

---

## Product Summary

**여운** is a pastel pixel social app where users upload photos and other users react to the **mood and vibe** of the photo using **cat paw reactions**, not appearance ratings.

This is **not** a beauty rating app.
This is **not** a dating app clone.
This is **not** an Instagram clone.

It should feel like:

- Instagram-level familiarity in feed consumption
- light social discovery energy inspired by dating/discovery apps
- a completely different product identity through worldbuilding, interaction language, and visual system

The product identity must be built around these 4 pillars:

- **Pastel pixel aesthetic**
- **Cat paw interaction system**
- **Mood tags**
- **Jelly reactions**

Core brand sentence:

> A pastel pixel world where people leave cat paw stamps on the mood of photos and collect taste like jelly.

---

## Brand / Worldbuilding

Service name: **여운**

Core vocabulary:

- 좋아요 / likes -> do **not** use
- 별점 / stars -> do **not** use
- reaction system -> **여운**
- average score -> **평균 감도**
- profile -> **무드카드**
- explore -> **산책**
- DM -> **편지함**
- disappearing post -> **찰나**
- saved posts -> **보관함**

Tone:

- cute but not childish
- dreamy but readable
- soft and collectible
- mood-driven, not performance-driven
- gentle, not aggressive

Avoid:

- generic social app UI
- black/white minimal clone aesthetics
- gradients everywhere
- card-on-card clutter
- harsh ranking vibes
- anything that feels like appearance scoring

---

## Design Direction

### Visual Style

Design for **mobile-first** usage.
Most users will use this on phones.

Style keywords:

- pastel pixel
- soft lavender
- baby pink
- sky blue
- cream white
- tiny jelly mascot energy
- pixel icons
- airy spacing
- simple hierarchy
- collectible UI

Important UI rules:

- do not use hearts as the main interaction symbol
- do not use star ratings
- use cat paw icons consistently for primary reactions
- use pixel-art icon language consistently across the product
- the UI must feel soft, but text must remain legible
- photos are the main content; decorations must not overpower content
- maintain generous spacing and clean hierarchy

Suggested palette direction:

- lavender
- baby pink
- sky blue
- cream / off-white
- soft mint as a limited accent

Typography direction:

- soft Korean-friendly UI typography
- can be paired with a pixel-style display treatment in headings or badges
- body text must remain readable on small mobile screens
- avoid overusing novelty fonts in functional areas

---

## Product Principles

1. This product reacts to **mood**, not appearance.
2. The reaction system should feel like **leaving a paw stamp**, not scoring someone.
3. Discovery should feel fun and light, but never predatory or judgmental.
4. The UI must feel like a distinct branded world, not a clone of an existing social app.
5. Safety, privacy, and moderation are product-critical.
6. Every major screen should express the worldbuilding vocabulary.

---

## Core Features

Implement the product around these feature groups.

### 1. Authentication

- email sign up / login
- social login
- nickname creation
- profile image
- short bio
- interest mood tag selection during onboarding

### 2. Profile / Mood Card

- profile image
- nickname
- short intro
- representative mood tags
- uploaded posts grid
- current 찰나 indicator
- average mood score display
- follower / following counts
- reaction summary

### 3. Standard Posts

Users can upload regular posts.

Fields:

- 1 to 4 photos
- caption
- mood tags
- optional location
- visibility setting

Actions:

- create
- edit
- delete
- react
- comment
- save
- report

### 4. 찰나 (Disappearing Posts)

찰나 is a temporary post format.
It behaves like a post but expires automatically.

Requirements:

- 1 photo
- short caption
- mood tag(s)
- duration selection: 12h or 24h
- visible in a top horizontal strip on home
- visible as a current status signal on profile
- automatically expires and disappears from public view

Important:
Do not design this as a direct story clone.
Do not use story circles exactly like Instagram.
Use a differentiated UI treatment such as stamp cards, mini frames, or pixel photo tiles.

### 5. 여운 Reaction System

This is the product’s signature interaction.

Reaction labels:

- 1 paw: 슬쩍
- 2 paws: 콕
- 3 paws: 꾹
- 4 paws: 폭닥
- 5 paws: 젤리

Long-form reaction copy:

- 슬쩍했어요
- 콕 남겼어요
- 꾹 눌렀어요
- 폭닥 주고 갔어요
- 젤리까지 찍고 갔어요

Functional requirements:

- one reaction per user per post
- reaction can be changed later
- available on standard posts and 찰나
- compute average score
- show reaction count / participation count

Average mood label mapping:

- 4.50 ~ 5.00 -> 젤리
- 4.00 ~ 4.49 -> 폭닥
- 3.00 ~ 3.99 -> 꾹
- 2.00 ~ 2.99 -> 콕
- 1.00 ~ 1.99 -> 슬쩍

Display example:

- 젤리 · 평균 감도 4.72발
- 폭닥 · 평균 감도 4.18발

Feed cards may show 1 decimal place if needed.
Detail pages should show 2 decimal places.

### 6. Home Feed

Home is the primary consumption screen.

Requirements:

- recommended feed
- latest feed
- following feed
- 찰나 strip near top
- post cards with quick reaction access
- comments entry
- save entry
- profile navigation

Each post card should prioritize:

1. photo
2. representative reaction + average mood
3. reaction actions
4. creator + mood tags
5. short caption preview

### 7. 산책 (Explore / Discovery)

This is the discover screen inspired by explore-style browsing.

Requirements:

- search bar
- photo grid / mosaic feed
- popular mood tags
- popular posts
- latest posts
- recommended users
- filtering by tag / popularity / recency

Search targets:

- nickname
- mood tags
- captions
- high-reaction posts

### 8. Comments

- write comment
- reply to comment
- delete own comment
- report comment

Important UX direction:
Encourage mood-oriented comments, not appearance judgment.
Use placeholder copy aligned to that.

### 9. Save / Archive

- save post
- unsave post
- view saved posts in 보관함
- optional filtering by tag or creator

### 10. DM / 편지함

Implement 1:1 messaging carefully.

Requirements:

- inbox list
- message request flow
- accept / decline request
- block / report user
- link to user profile

Recommended safety default:

- allow messages only from followed users, or
- require request approval before messaging starts

### 11. Notifications

Implement both in-app and push notification support.

In-app notification examples:

- someone left a paw reaction on your post
- someone commented on your post
- someone replied to your comment
- someone followed you
- someone viewed or reacted to your 찰나
- a message request arrived
- a new message arrived

Push notifications should be configurable.
Users should be able to toggle categories.

### 12. Follow System

- follow / unfollow
- follower / following lists
- following feed support

### 13. Safety / Moderation

This is mandatory.

Requirements:

- report post
- report 찰나
- report comment
- report user
- report message
- block user
- content moderation hooks
- bad-word filtering
- anti-harassment handling
- non-consensual image upload reporting
- privacy settings for account, comments, and messages

Important:
The product must clearly discourage appearance-scoring behavior.

---

## App Structure

Bottom navigation should contain these 5 tabs:

1. 홈
2. 산책
3. 업로드
4. 편지함
5. 무드카드

Additional screens:

- splash
- login / signup
- onboarding mood selection
- home
- post detail
- 찰나 detail
- upload
- explore / 산책
- inbox list
- chat room
- notifications
- saved posts / 보관함
- profile / 무드카드
- profile edit
- settings
- report / block flows

---

## UX Guidance Per Screen

### Home

Make the home feed instantly recognizable as 여운.
It should feel familiar enough to use quickly, but distinct in vocabulary and interaction language.

Include:

- top brand header
- notification entry
- search or discovery shortcut if useful
- horizontal 찰나 strip
- mood tag shortcuts
- feed filters like 추천 / 최신 / 팔로우
- post cards with visible average mood label

### Post Detail

Must clearly show:

- photo(s)
- caption
- mood tags
- representative reaction
- average mood score
- participation count
- comments
- save
- report
- profile navigation

### Explore / 산책

Should feel like playful discovery, not endless generic tiles.
Build a photo-first grid with strong entry points to tags and users.

### Upload

Support two creation modes clearly:

- 일반 게시물
- 찰나

The difference must be obvious.
찰나 must clearly show expiration options and time-left logic.

### Profile / 무드카드

Must feel more like a mood identity card than a sterile profile page.
Include mood labels, average mood, reaction summary, and current 찰나 signal.

### Inbox / 편지함

Keep it safe, soft, and clear.
Support message request states clearly.

---

## Engineering Expectations

Build production-minded code.
Prioritize maintainability and clear architecture.

Requirements:

- use a clean component structure
- separate UI, state, and domain logic where reasonable
- define reusable design primitives for spacing, cards, buttons, badges, and reaction controls
- create a consistent icon treatment strategy
- support responsive mobile layouts first
- keep naming aligned to the product vocabulary

Important:
Do not hardcode random styling everywhere.
Create reusable primitives and theme tokens.
Do not produce messy one-file app code.

If choosing stack defaults, prefer a modern web/mobile-friendly setup such as:

- Next.js or React-based frontend for web prototype
- TypeScript
- component-based architecture
- clean styling strategy

If building an app-style prototype, structure it so it can later transition toward React Native or a production mobile implementation.

---

## Content and Moderation Constraints

The app must not encourage:

- appearance ranking
- humiliating comments
- explicit attractiveness scoring
- harassment
- sexualized unsolicited messaging

Design UI copy and interaction flows to reinforce:

- mood
- vibe
- atmosphere
- taste
- aesthetic reaction

---

## Output Expectations for Codex

When implementing, do the following:

1. define the app information architecture first
2. define the design system and reusable UI primitives
3. define the main data models
4. build the main screens in a mobile-first way
5. implement the reaction system carefully
6. implement notification and messaging structure
7. add safety/moderation hooks
8. polish the UI to feel branded and intentional

Do not rush into raw coding without first establishing:

- screen map
- component map
- data model assumptions
- design tokens
- interaction patterns

When uncertain, choose the option that best preserves:

- product identity
- safety
- readability
- mobile UX quality

---

## Final Instruction

Build **여운** as a coherent branded product, not a template.
The result should feel like a real app with a distinct world:
soft, collectible, mood-focused, and socially engaging.

Every decision should answer this question:

> Does this feel like leaving a cat paw stamp on someone’s mood, inside a pastel pixel world?
