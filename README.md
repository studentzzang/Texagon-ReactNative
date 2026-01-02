# 🎮 Texagon


## 🧩 장르
- 캐주얼 퍼즐
- 숫자 조합 / 전략 게임

---

## 📱 플랫폼
- 🌐 Web (예정)
- 🤖 Android (예정)

---

## 🎯 게임 목표
- 인접한 숫자 타일을 선택해 **합이 10이 되도록 조합**
- 보드를 비우며 최대한 오래 생존
- **최고 점수(High Score)** 갱신

---

## 📐 게임 규칙
- 인접한 두 타일만 선택 가능
- 합이 **10** → 타일 제거 + 점수 획득
- 합이 **10 초과** → `(합 - 10)` 타일 생성 (페널티)
- 합이 **10 미만** → 숫자 합쳐짐 + 새 타일 생성
- 더 이상 선택할 수 없거나 보드가 가득 차면 게임 오버

---

## ⭐ High Score 저장
- **비동기 로컬 저장소(AsyncStorage)** 사용
- 앱 재실행 시에도 최고 점수 유지
- 모바일 기준으로 구현되었으며  
  웹 출시 시 `localStorage` 등으로 확장 가능

---

## ✨ UI / 애니메이션
- 타일 선택/합산/제거 애니메이션
- **High Score 갱신 시 wobble 이펙트** 제공

---

## 🛠 기술 스택
- React Native / Expo
- TypeScript
- Animated API
- AsyncStorage

---

## 🚧 개발 상태
- 핵심 게임 로직 완료
- High Score 시스템 구현 완료
- UI/UX 및 웹 대응 작업 진행 중

# 🎮 Texagon (Eng)

## 🧩 Genre
- Casual Puzzle
- Number-based Strategy

---

## 📱 Platforms
- 🌐 Web (Planned)
- 🤖 Android (Planned)

---

## 🎯 Objective
- Combine adjacent tiles to make **exactly 10**
- Clear space on the board and survive as long as possible
- Beat your **High Score**

---

## 📐 Game Rules
- Only adjacent tiles can be selected
- **10** → tiles removed + score gained
- **>10** → `(sum - 10)` tile created (penalty)
- **<10** → tiles merged + new tile spawned
- Game over when no valid moves remain or the board is full

---

## ⭐ High Score Persistence
- Stored using **asynchronous local storage (AsyncStorage)**
- High Score persists between sessions
- Designed to be adaptable to web storage (`localStorage`)

---

## ✨ UI / Animations
- Animations for tile interactions
- **Wobble effect when achieving a new High Score**

---

## 🛠 Tech Stack
- React Native / Expo
- TypeScript
- Animated API
- AsyncStorage

---

## 🚧 Development Status
- Core gameplay completed
- High Score system implemented
- UI/UX polish and web support in progress
