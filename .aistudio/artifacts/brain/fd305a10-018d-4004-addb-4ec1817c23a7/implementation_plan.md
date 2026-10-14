# Lo-Fi Focus Lounge & Ambient Study Sanctuary

An aesthetic, immersive workspace application centered on relaxing background music (`https://www.youtube.com/watch?v=ajtjPq66N8Y`) paired with focus tools, ambient audio layering, atmospheric visual scenes, and personal productivity widgets.

## User Review & Critical Decisions

> [!IMPORTANT] The user provided the YouTube music link (`ajtjPq66N8Y`) without specifying additional preferences. We are defaulting to a feature-rich, high-aesthetic Lo-Fi Focus & Study Space designed for deep focus, studying, and relaxation.

- **Background Music Source**: YouTube Video `ajtjPq66N8Y` embedded using YouTube IFrame Player API with custom, sleek UI controls (Play/Pause, Volume, Track Info, Loop, Mute, Direct YouTube Link).
- **Interactive Focus Tools**: Built-in customizable Pomodoro Timer (Focus / Short Break / Long Break), To-Do List with priority tags & completion stats, Quick Scratchpad / Focus Notes, and Ambient Soundscapes (Rain, Fireplace, Coffee Shop, Forest, Ocean Waves).
- **Visual Atmospheres**: 4 dynamic aesthetic themes (Cozy Rainy Library, Cyberpunk Neon Study, Sunset Beach Loft, Coffee Shop Corner) with animated CSS canvas particle effects (rain drops, floating ember glow, dust motes).

---

## 1. Overview & Core Concept

- **What It Does**: Transforms background music into a complete study and focus sanctuary. Users can listen to the YouTube lo-fi audio stream, mix it with ambient background sounds (rain, coffee shop, fireplace), run Pomodoro productivity sessions, manage daily tasks, jot down quick focus notes, and customize their visual background environment.
- **Target Audience / Persona**: Students, remote workers, developers, writers, and anyone looking for a calm, aesthetic, distraction-free environment to boost focus or relax.
- **Key Value**: Combines music, ambient audio, time management, and visual atmosphere into one harmonious, zero-clutter web application.

---

## 2. User Experience & Visual Design

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Warm, cozy editorial lo-fi aesthetic with dark posture options, smooth rounded glassmorphism panels (`backdrop-blur-md bg-slate-900/60 border border-white/10`), and warm ambient glow.
  - *Color Palette*: Dominant deep slate (`#0B0F17`, `#111827`), soft amber accents (`#F59E0B`), warm rose gold (`#F43F5E`), and crisp muted text (`#9CA3AF`, `#F3F4F6`).
  - *Typography*: `Plus Jakarta Sans` for clean, modern headings and UI labels, `DM Sans` for readable body text and notes, paired with `font-mono tabular-nums` for timers and clock metrics.
- **Key User Flows**:
  1. **Arrival & Audio Playback**: Header displaying track status with an immediate, floating Audio Control Deck (Play/Pause, Volume slider, Mute, Track Info).
  2. **Atmosphere Customization**: Floating toolbar to toggle ambient sounds (Rain, Waves, Fireplace, Cafe) and switch visual scenes/backgrounds.
  3. **Pomodoro Session**: Large, elegant timer display with radial progress, start/pause/reset controls, interval selection (25/5/15 min), auto-start breaks, and completion chiming.
  4. **Task & Note Workspace**: Side drawer or tabbed panel for checking off tasks, setting task priorities, and typing sticky focus notes.
  5. **Focus Mode (Zen Toggle)**: One-click "Hide UI / Fullscreen Visuals" mode for pure distraction-free listening and aesthetic display.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: YouTube IFrame API Integration**
  - *Chosen Approach*: Embed YouTube IFrame API invisibly/compactly while rendering a custom HTML/Tailwind audio player toolbar.
  - *Why*: YouTube autoplay policies restrict audio on unclicked page loads. An intuitive "Click to Play Background Music" hero CTA initialiser guarantees seamless audio playback compliant with browser policies.
- **Decision 2: Web Audio API Synthesized Ambient Sounds**
  - *Chosen Approach*: Combine YouTube lo-fi audio with procedurally synthesized or ambient audio loops (rain noise generator, crackling fire generator, cafe ambience via Web Audio API nodes) so ambient sound sliders work smoothly without heavy external asset loading.
  - *Why*: Zero broken external audio file dependencies and instant loading.
- **Decision 3: LocalStorage Data Persistence**
  - *Chosen Approach*: Persist tasks, notes, Pomodoro timer stats, custom time settings, and preferred theme/volume levels in `localStorage`.
  - *Why*: Immediate persistence without requiring user account sign-in or database provisioning.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Lo-Fi Focus Lounge Architecture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                 YouTube IFrame API Audio Engine                     │   │
│   │               (Video ID: ajtjPq66N8Y / Lo-Fi Track)                 │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │               Web Audio API Procedural Sound Engine                 │   │
│   │        (Pink/Brown Rain Generator, Crackle, Waves, Cafe)            │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         React App State                             │   │
│   │  ┌──────────────────┬───────────────────┬────────────────────────┐  │   │
│   │  │  Pomodoro State  │  Task / Todo List │  Notes & Scratchpad    │  │   │
│   │  │  (Timer/Stats)   │  (LocalStorage)   │  (LocalStorage)        │  │   │
│   │  └──────────────────┴───────────────────┴────────────────────────┘  │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     UI Component & Visual Layer                     │   │
│   │  ┌──────────────────┬───────────────────┬────────────────────────┐  │   │
│   │  │ Background Canvas│ Top Navigation    │ Audio Mixer & Player   │  │   │
│   │  │ & Particle FX    │ & Zen Focus Mode  │ Controller Deck        │  │   │
│   │  ├──────────────────┴───────────────────┴────────────────────────┤  │   │
│   │  │ Main Grid: Pomodoro Timer | Task Manager | Quick Scratchpad   │  │   │
│   │  └───────────────────────────────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Structure & Handlers
- **`App.tsx`**: Main application container managing theme selection, focus mode toggle, and localStorage synchronization.
- **`YouTubePlayer.tsx`**: YouTube IFrame API wrapper controlling video `ajtjPq66N8Y`, state events (playing, paused, buffering), and volume sync.
- **`AmbientMixer.tsx`**: Web Audio API ambient sound generator with individual volume controls for Rain, Fireplace, Ocean Waves, Cafe Noise, and Night Crickets.
- **`PomodoroTimer.tsx`**: Timer engine with Focus/Short Break/Long Break modes, radial canvas/SVG progress indicator, audio chime feedback, session counter, and customizable duration settings.
- **`TaskManager.tsx`**: Interactive to-do list with category tags (Study, Work, Quick, Personal), filter tabs, reordering, clear completed, and progress indicator.
- **`Scratchpad.tsx`**: Markdown-capable quick notes area with auto-save indicator, font size toggle, and clear button.
- **`BackgroundCanvas.tsx`**: HTML5 Canvas particle generator for atmospheric visual overlays (falling rain drops, floating embers, dust motes) matching selected themes.
- **`ZenModeModal.tsx`**: Fullscreen visual view with floating clock and minimal play bar for ultra-focused study sessions.

---

## 5. Pre-Flight Verification Plan

1. **Build & Syntax Verification**: Run `compile_applet` to confirm zero compilation errors across TypeScript components and Lucide icons.
2. **Audio & YouTube Compliance**: Verify browser playback requirements (initial play CTA button, iframe API ready listener, volume sync).
3. **Accessibility & Responsive Geometry**: Verify desktop 1440px viewport layout integrity, mobile drawer responsive views, and high-contrast dark theme readability.
