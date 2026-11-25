import React, { useState, useRef } from 'react';
import { Hero3DStage, FinishMode } from './components/Hero3DStage';

interface Track {
  rank: number;
  title: string;
  artist: string;
  genre: string;
  tag: string;
  previewVibe: string;
  badge: string;
  color: string;
  gradient: string;
}

interface CurationData {
  mixsetTitle: string;
  curatorComment: string;
  themeColor: string;
  tracks: Track[];
}

const INITIAL_TRACKS: Track[] = [
  {
    rank: 1,
    title: 'Supernova Remix',
    artist: 'AESPA',
    genre: 'K-POP · Hyperpop',
    tag: '01 인트로 그루브',
    previewVibe: '청량한 신스 멜로디와 하이퍼 사운드가 터지는 15초 오프닝',
    badge: '지금 한국에서 가장 많이 듣는 1위 트랙 재생 중',
    color: '#00CD3C',
    gradient: 'from-emerald-600 to-teal-400',
  },
  {
    rank: 2,
    title: 'Midnight City Lights',
    artist: 'Synthwave Mix',
    genre: 'Electronic · Synthwave',
    tag: '02 드라이브 하이라이트',
    previewVibe: '80년대 레트로 신스베이스와 심야 도로를 질주하는 15초 그루브',
    badge: '심야 드라이브 베스트 믹스셋 스트리밍 중',
    color: '#06B6D4',
    gradient: 'from-cyan-600 to-blue-500',
  },
  {
    rank: 3,
    title: 'Lo-Fi Chill Study',
    artist: 'Deep Focus Beat',
    genre: 'Lo-Fi · Instrumental',
    tag: '03 칠 아웃트로',
    previewVibe: '따뜻한 일렉트릭 피아노와 빈티지 바이닐 노이즈의 15초 릴렉스',
    badge: '작업 & 집중용 로파이 비트 스트리밍 중',
    color: '#A855F7',
    gradient: 'from-purple-600 to-pink-500',
  },
];

const PRESET_MOODS = [
  '비 오는 날 들을 감성적인 시티팝',
  '심야 한강 드라이브에 어울리는 신스웨이브',
  '카페에서 집중하기 좋은 잔잔한 재즈 힙합',
  '퇴근길 마음을 위로하는 어쿠스틱 인디',
];

const TRENDING_MIXES = [
  {
    id: 'synth1',
    category: 'top10',
    kicker: 'K-POP TOP HITS',
    title: 'Supernova Spectrum',
    meta: '시티팝 · 댄스 · 24bit Hi-Fi',
    desc: '청량한 신스 멜로디와 함께 한국 음원 차트 정상을 달리는 대표 트랙 믹스.',
    accent: 'from-emerald-950/90 to-[#11161F]',
    freq: 440,
  },
  {
    id: 'synth2',
    category: 'drive',
    kicker: 'ELECTRONIC CITY',
    title: 'Neon Highway 88',
    meta: '딥하우스 · 심야드라이브 · 공간음향',
    desc: '야간 드라이브의 속도감과 공간감을 극대화하는 저역대 베이스 믹스셋.',
    accent: 'from-cyan-950/90 to-[#11161F]',
    freq: 392,
  },
  {
    id: 'synth3',
    category: 'top10',
    kicker: 'LO-FI STUDY',
    title: 'Rainy Cafe Beats',
    meta: '몰입비트 · 재즈피아노 · 아날로그',
    desc: '집중력 향상과 깊은 몰입을 돕는 잔잔한 빗소리 질감의 로파이 플레이리스트.',
    accent: 'from-purple-950/90 to-[#11161F]',
    freq: 349,
  },
  {
    id: 'synth4',
    category: 'exclusive',
    kicker: 'UNPLUGGED SESSION',
    title: 'Acoustic Midnight',
    meta: '독점라이브 · 어쿠스틱 · FLAC',
    desc: '멜론 쇼룸 구독자에게만 공개되는 아티스트 스튜디오 현장 무손실 세션.',
    accent: 'from-amber-950/90 to-[#11161F]',
    freq: 523,
  },
];

const FINISH_OPTIONS: { id: FinishMode; label: string; swatch: string }[] = [
  { id: 'obsidian', label: '옵시디언', swatch: '#1f2937' },
  { id: 'chrome', label: '크롬', swatch: '#cbd5e1' },
  { id: 'crystal', label: '크리스탈', swatch: '#34d399' },
  { id: 'clay', label: '클레이', swatch: '#e2e8f0' },
];

export default function App() {
  // Core Curation State
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number>(0);
  const [mixsetTitle, setMixsetTitle] = useState<string>('모든 순간을 채우는 사운드,');
  const [curatorComment, setCuratorComment] = useState<string>(
    '월 6,900원 모바일 플랜부터 24bit Hi-Fi 무손실 FLAC까지. 10년 차 음원 큐레이터가 설계한 3D 커버와 15초 믹스셋을 직접 돌려보며 청음하세요.'
  );
  const [themeColor, setThemeColor] = useState<string>('#00CD3C');
  const [promptInput, setPromptInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 3D Stage State
  const [finishMode, setFinishMode] = useState<FinishMode>('obsidian');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [resetSignal, setResetSignal] = useState<number>(0);
  const [modelProgress, setModelProgress] = useState<number>(0);
  const [isModelLoaded, setIsModelLoaded] = useState<boolean>(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);

  // Showcase & UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isInspectorActive, setIsInspectorActive] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [mixFilter, setMixFilter] = useState<'all' | 'top10' | 'drive' | 'exclusive'>('all');

  // Bento & Pricing State
  const [eqBands, setEqBands] = useState<number[]>([78, 64, 48, 72, 86]);
  const [selectedDevice, setSelectedDevice] = useState<string>('iPhone 15');
  const [isAirplaneMode, setIsAirplaneMode] = useState<boolean>(false);
  const [activePlanFilter, setActivePlanFilter] = useState<'mobile' | 'streaming' | 'family'>('streaming');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [signupEmail, setSignupEmail] = useState<string>('');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const playPreviewChords = (frequency: number = 440, type: OscillatorType = 'sine', duration: number = 3.0) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const rootOsc = ctx.createOscillator();
      const thirdOsc = ctx.createOscillator();
      const fifthOsc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      rootOsc.type = type;
      thirdOsc.type = type;
      fifthOsc.type = type;

      rootOsc.frequency.setValueAtTime(frequency, now);
      thirdOsc.frequency.setValueAtTime(frequency * 1.2599, now);
      fifthOsc.frequency.setValueAtTime(frequency * 1.4983, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.06, now + 0.25);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      rootOsc.connect(gainNode);
      thirdOsc.connect(gainNode);
      fifthOsc.connect(gainNode);
      gainNode.connect(ctx.destination);

      rootOsc.start(now);
      thirdOsc.start(now);
      fifthOsc.start(now);

      rootOsc.stop(now + duration);
      thirdOsc.stop(now + duration);
      fifthOsc.stop(now + duration);
    } catch {
      // Ignore autoplay blocks
    }
  };

  const handleSwitchTrack = (index: number) => {
    setActiveTrackIndex(index);
    const selected = tracks[index];
    if (selected) {
      setThemeColor(selected.color || '#00CD3C');
      setActivePreviewId(`dock-${index}`);
      playPreviewChords(330 + index * 65, 'triangle', 2.2);
      showToast(`'${selected.title}' 15초 하이라이트 청음으로 전환되었습니다.`);
    }
  };

  const handleCurateMixset = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const query = (customQuery ?? promptInput).trim();
    if (!query) {
      showToast('기분이나 상황을 입력해주세요. (예: 비 오는 날 들을 감성적인 시티팝)');
      return;
    }

    setIsLoading(true);
    showToast(`'${query}'에 어울리는 15초 믹스셋을 큐레이션하고 있습니다.`);

    try {
      const res = await fetch('/api/curate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodPrompt: query,
          userApiKey: customApiKey.trim() || undefined,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || `서버 오류 (${res.status})`);
      }

      const data = payload as CurationData;
      if (!data || !Array.isArray(data.tracks) || data.tracks.length < 3) {
        throw new Error('큐레이션 트랙 응답 형식이 올바르지 않습니다.');
      }

      setMixsetTitle(data.mixsetTitle);
      setCuratorComment(data.curatorComment);
      setThemeColor(data.themeColor || '#00CD3C');
      setTracks(data.tracks.slice(0, 3));
      setActiveTrackIndex(0);
      setActivePreviewId('dock-0');
      setIsDockCollapsed(false);

      playPreviewChords(440, 'sine', 3.0);
      showToast(`새로운 15초 믹스셋 '${data.mixsetTitle}'이 커버와 독에 반영되었습니다.`);
    } catch (err: unknown) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : '큐레이션 생성에 실패했습니다. 잠시 후 다시 시도해주세요.';
      showToast(message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMixPreview = (id: string, freq: number) => {
    if (activePreviewId === id) {
      setActivePreviewId(null);
      showToast('미리듣기를 일시정지했습니다.');
    } else {
      setActivePreviewId(id);
      playPreviewChords(freq, 'sawtooth', 3.2);
      showToast('10초 하이라이트 미리듣기를 재생합니다.');
    }
  };

  const applyEqPreset = (preset: 'bass' | 'vocal' | 'flat') => {
    if (preset === 'bass') {
      setEqBands([92, 80, 45, 60, 70]);
      showToast('Bass Boost 프리셋이 적용되었습니다.');
    } else if (preset === 'vocal') {
      setEqBands([45, 58, 86, 90, 74]);
      showToast('Vocal Clear 프리셋이 적용되었습니다.');
    } else {
      setEqBands([65, 65, 65, 65, 65]);
      showToast('Flat Hi-Fi 원음 프리셋이 적용되었습니다.');
    }
  };

  const filteredMixes =
    mixFilter === 'all' ? TRENDING_MIXES : TRENDING_MIXES.filter((m) => m.category === mixFilter);
  const activeTrack = tracks[activeTrackIndex] || tracks[0];

  return (
    <div className="relative min-h-screen w-full max-w-full bg-[#0B0E14] text-[#F0F6FC] font-sans antialiased overflow-x-hidden">
      {/* ==========================================
          TOP BAR (RESPONSIVE 3-ZONE + MOBILE DRAWER)
          ========================================== */}
      <header className="fixed top-0 left-0 right-0 z-50 header-surface h-[64px] md:h-[72px]">
        <div className="container-fluid h-full flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Clean Single Wordmark */}
          <a
            href="#"
            className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-white hover:text-[#00CD3C] transition-colors whitespace-nowrap shrink-0"
          >
            Melon
          </a>

          {/* Zone 2: Desktop Single-line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-gray-300">
            <a
              href="#trending"
              className="hover:text-white hover:underline underline-offset-8 decoration-[#00CD3C] transition-colors whitespace-nowrap shrink-0"
            >
              트렌딩 믹스
            </a>
            <a
              href="#bento"
              className="hover:text-white hover:underline underline-offset-8 decoration-[#00CD3C] transition-colors whitespace-nowrap shrink-0"
            >
              오디오 기술
            </a>
            <a
              href="#pricing"
              className="hover:text-white hover:underline underline-offset-8 decoration-[#00CD3C] transition-colors whitespace-nowrap shrink-0"
            >
              요금제
            </a>
            <a
              href="#faq"
              className="hover:text-white hover:underline underline-offset-8 decoration-[#00CD3C] transition-colors whitespace-nowrap shrink-0"
            >
              자주 묻는 질문
            </a>
          </nav>

          {/* Zone 3: Mobile Menu Trigger + Primary CTA */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 sm:px-5 py-2 rounded-lg bg-[#00CD3C] hover:bg-[#00E644] text-black font-bold text-xs sm:text-sm transition-colors whitespace-nowrap shrink-0"
            >
              첫 달 100원 시작
            </button>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="메뉴 열기"
              aria-expanded={isMobileMenuOpen}
              className="md:hidden w-10 h-10 rounded-lg border border-[#30363D] bg-[#161B22] text-gray-200 flex items-center justify-center shrink-0"
            >
              <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-sm`} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Panel */}
        {isMobileMenuOpen && (
          <nav className="md:hidden bg-[#0B0E14] border-b border-[#30363D] px-4 py-3 flex flex-col gap-1">
            {[
              { href: '#trending', label: '트렌딩 믹스' },
              { href: '#bento', label: '오디오 기술' },
              { href: '#pricing', label: '요금제' },
              { href: '#faq', label: '자주 묻는 질문' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="py-2.5 px-3 rounded-lg text-sm font-medium text-gray-200 hover:bg-[#161B22] hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      {/* ==========================================
          HERO COVER: RESPONSIVE 3D SPATIAL STAGE
          - < 1024px: Dedicated unobstructed 3D viewport above editorial copy
          - >= 1024px: Full-bleed 100svh 3D background stage
          ========================================== */}
      <section className="relative w-full lg:min-h-[100svh] flex flex-col justify-between pt-[64px] md:pt-[72px] overflow-hidden bg-[#0B0E14]">
        {/* 3D WebGL Cover Stage */}
        <div className="relative w-full h-[300px] sm:h-[380px] lg:h-full lg:absolute lg:inset-0 z-0 shrink-0">
          <Hero3DStage
            modelUrl="/models/hero.glb"
            themeColor={themeColor}
            finishMode={finishMode}
            autoRotate={autoRotate}
            isPlayingAudio={activePreviewId !== null}
            resetSignal={resetSignal}
            onLoadProgress={(progress, loaded, error) => {
              setModelProgress(progress);
              setIsModelLoaded(loaded);
              setModelError(error);
            }}
          />

          {/* Loading Status inside 3D Stage */}
          {!isModelLoaded && !modelError && (
            <div className="absolute inset-0 lg:inset-auto lg:right-12 lg:top-1/2 lg:-translate-y-1/2 z-20 pointer-events-none flex items-center justify-center">
              <div className="flex flex-col items-center gap-2.5 px-5 py-4 rounded-2xl bg-[#11161F]/90 border border-[#30363D]">
                <div className="w-7 h-7 rounded-full border-2 border-[#30363D] border-t-[#00CD3C] animate-spin" />
                <span className="text-xs font-medium text-gray-300 font-mono-tabular">
                  3D 커버 로딩 중 {modelProgress > 0 ? `${modelProgress}%` : ''}
                </span>
              </div>
            </div>
          )}

          {modelError && (
            <div className="absolute inset-0 lg:inset-auto lg:right-12 lg:top-1/2 lg:-translate-y-1/2 z-20 pointer-events-none flex items-center justify-center">
              <div className="px-5 py-3 rounded-xl bg-[#11161F]/90 border border-red-500/30 text-xs text-red-300">
                {modelError}
              </div>
            </div>
          )}
        </div>

        {/* Desktop Directional Contrast Scrim */}
        <div
          className="hidden lg:block absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              'linear-gradient(90deg, rgba(11,14,20,0.92) 0%, rgba(11,14,20,0.72) 44%, rgba(11,14,20,0.08) 78%, rgba(11,14,20,0.22) 100%)',
          }}
        />
        <div
          className="hidden lg:block absolute inset-x-0 bottom-0 h-56 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #0B0E14 0%, rgba(11,14,20,0.65) 55%, rgba(11,14,20,0) 100%)',
          }}
        />

        {/* Semantic Overlay Content */}
        <div className="relative z-20 container-fluid flex-1 flex flex-col justify-between py-6 sm:py-8 lg:py-10 lg:pointer-events-none">
          {/* Inspector Banner */}
          {isInspectorActive && (
            <div className="pointer-events-auto bg-[#11161F]/95 border border-emerald-500/40 rounded-xl p-4 text-xs text-emerald-100 max-w-2xl mb-4">
              <div className="font-bold text-[#00CD3C] mb-1">[3D Cover Hero UX/UI 설계 의도]</div>
              <p className="leading-relaxed text-gray-300">
                데스크톱에서는 100vh 풀블리드 3D 표지로 몰입감을 극대화하고, 태블릿·모바일에서는 3D 오브제 뷰포트를 상단에 독립 배치해 텍스트 겹침과 가로 스크롤 없이 모든 컨트롤을 조작할 수 있습니다.
              </p>
            </div>
          )}

          {/* Main Left Editorial Column */}
          <div className="my-auto w-full max-w-xl pointer-events-auto">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-gray-400 mb-3 sm:mb-4">
              <span style={{ color: themeColor }} className="font-semibold">
                3D Spatial Cover
              </span>
              <span aria-hidden="true">·</span>
              <span className="break-words">{activeTrack?.badge || '실시간 오디오 믹스셋 재생 중'}</span>
            </div>

            <h1 className="font-display hero-title-fluid font-extrabold text-white tracking-tight mb-4 sm:mb-5 text-balance break-keep">
              {mixsetTitle}
              <br />
              <span
                className="text-transparent bg-clip-text transition-colors duration-500"
                style={{
                  backgroundImage: `linear-gradient(90deg, #F0F6FC 0%, ${themeColor} 100%)`,
                }}
              >
                당신의 일상 속 모든 스크린에.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-6 max-w-lg break-keep">
              {curatorComment}
            </p>

            {/* AI Curation Input Form */}
            <form onSubmit={handleCurateMixset} className="w-full max-w-xl mb-4">
              <div className="flex flex-col sm:flex-row items-stretch gap-2 bg-[#11161F]/95 border border-[#30363D] p-2 rounded-xl focus-within:border-[#00CD3C] transition-colors">
                <div className="relative flex-1 flex items-center min-w-0">
                  <i className="fa-solid fa-wand-magic-sparkles absolute left-3.5 text-[#00CD3C] text-xs" />
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="기분/상황 입력 (예: 비 오는 날 시티팝)"
                    className="w-full min-w-0 h-11 pl-9 pr-3 bg-transparent text-white text-sm placeholder-gray-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-11 px-4 sm:px-5 rounded-lg bg-[#00CD3C] hover:bg-[#00E644] text-black font-bold text-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin text-xs" />
                      <span>생성 중</span>
                    </>
                  ) : (
                    <>
                      <span>15초 믹스셋 생성</span>
                      <i className="fa-solid fa-arrow-right text-xs" />
                    </>
                  )}
                </button>
              </div>

              {/* Mood Chips */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {PRESET_MOODS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPromptInput(preset);
                      handleCurateMixset(undefined, preset);
                    }}
                    className="px-2.5 py-1.5 rounded-md bg-[#161B22]/90 hover:bg-[#21262D] text-gray-300 hover:text-white border border-[#30363D] text-xs transition-colors text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </form>

            {/* Discreet Utility Actions */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-xs text-gray-400 pt-1">
              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <i className="fa-solid fa-key text-[11px] text-amber-400" />
                <span>API 키 직접 입력</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = !isInspectorActive;
                  setIsInspectorActive(next);
                  showToast(next ? '기획 의도 주석 모드를 켰습니다.' : '기획 의도 주석 모드를 껐습니다.');
                }}
                className="hover:text-white transition-colors flex items-center gap-1.5"
              >
                <i className="fa-regular fa-note-sticky text-[11px] text-[#00CD3C]" />
                <span>{isInspectorActive ? '기획 주석 닫기' : '기획 의도 보기'}</span>
              </button>
            </div>
          </div>

          {/* ==========================================
              BOTTOM UNIFIED 3D COVER & TRACK SWITCHER DOCK
              ========================================== */}
          <div className="w-full pt-6 pointer-events-auto">
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
              <div className="flex flex-wrap items-center gap-1.5 bg-[#11161F]/95 border border-[#30363D] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs max-w-full">
                <span className="text-gray-400 pr-2 border-r border-[#30363D] hidden sm:inline">
                  커버 3D 소재
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {FINISH_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFinishMode(opt.id)}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        finishMode === opt.id
                          ? 'bg-[#21262D] text-white border border-gray-600'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block shrink-0"
                        style={{ backgroundColor: opt.swatch }}
                      />
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>

                <span className="h-3.5 w-px bg-[#30363D] mx-0.5 hidden sm:inline-block" aria-hidden="true" />

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAutoRotate((prev) => !prev)}
                    className="px-2 py-1 rounded-lg hover:bg-[#21262D] text-gray-300 hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <i
                      className={`fa-solid ${autoRotate ? 'fa-pause' : 'fa-rotate'} text-[11px]`}
                      style={{ color: autoRotate ? themeColor : undefined }}
                    />
                    <span>{autoRotate ? '회전' : '정지'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetSignal((s) => s + 1)}
                    className="px-2 py-1 rounded-lg hover:bg-[#21262D] text-gray-300 hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap"
                  >
                    <i className="fa-solid fa-crosshairs text-[11px]" />
                    <span>정면</span>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDockCollapsed((prev) => !prev)}
                className="px-3 py-1.5 rounded-xl bg-[#11161F]/95 border border-[#30363D] text-xs font-medium text-gray-300 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                <i className={`fa-solid ${isDockCollapsed ? 'fa-chevron-up' : 'fa-chevron-down'} text-[10px]`} />
                <span>{isDockCollapsed ? '트랙 독 열기' : '3D 커버 전체 보기'}</span>
              </button>
            </div>

            {/* Responsive 3 -> 2 -> 1 Track Preview Dock */}
            {!isDockCollapsed && (
              <div className="responsive-card-grid">
                {tracks.map((track, i) => {
                  const isActive = activeTrackIndex === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSwitchTrack(i)}
                      id={`dock-card-${i}`}
                      className={`w-full min-w-0 text-left p-3.5 rounded-xl transition-all flex items-center gap-3 ${
                        isActive
                          ? 'bg-[#161B22]/95 border-2'
                          : 'bg-[#11161F]/90 border border-[#30363D] hover:border-gray-500'
                      }`}
                      style={{
                        borderColor: isActive ? track.color || themeColor : undefined,
                      }}
                    >
                      <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gray-900 overflow-hidden shrink-0">
                        <div
                          className={`absolute inset-0 bg-gradient-to-tr ${
                            track.gradient || 'from-emerald-600 to-teal-400'
                          } flex items-center justify-center text-white font-mono-tabular font-bold text-xs`}
                        >
                          0{track.rank || i + 1}
                        </div>
                        {isActive && (
                          <div className="absolute bottom-1 right-1 flex gap-[2px] items-end h-3">
                            <span
                              className="w-[2px] eq-bar"
                              style={{ height: '100%', backgroundColor: '#fff', animationDelay: '0.1s' }}
                            />
                            <span
                              className="w-[2px] eq-bar"
                              style={{ height: '65%', backgroundColor: '#fff', animationDelay: '0.3s' }}
                            />
                            <span
                              className="w-[2px] eq-bar"
                              style={{ height: '85%', backgroundColor: '#fff', animationDelay: '0.2s' }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold truncate" style={{ color: track.color || themeColor }}>
                          {track.tag}
                        </div>
                        <div id={`dock-title-${i}`} className="text-sm font-bold text-white truncate">
                          {track.title}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {track.artist} · {track.genre}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 2: LIVE CURATION TRENDING MIXES (3 -> 2 -> 1 GRID)
          ========================================== */}
      <section id="trending" className="section-padding-fluid bg-[#0B0E14] border-t border-[#1F242D]">
        <div className="container-fluid">
          {isInspectorActive && (
            <div className="bg-[#11161F] border border-emerald-500/30 rounded-xl p-4 text-xs text-emerald-100 mb-8">
              <div className="font-bold text-[#00CD3C] mb-1">[Live Curation Section UX/UI 설계 의도]</div>
              <p className="leading-relaxed text-gray-300">
                텍스트 차트 중심의 피로감을 줄이고 10초 하이라이트 즉시 청음과 필터 탭 전환을 통해 취향 탐색 속도를 높였습니다.
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#00CD3C] mb-2">
                Live Curation
              </p>
              <h2 className="font-display section-title-fluid font-extrabold text-white tracking-tight">
                지금 가장 뜨거운 트렌딩 믹스
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#161B22] border border-[#30363D] w-fit max-w-full">
              {[
                { id: 'all', label: '전체' },
                { id: 'top10', label: 'TOP 10' },
                { id: 'drive', label: '드라이브 믹스' },
                { id: 'exclusive', label: '독점 라이브' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMixFilter(tab.id as typeof mixFilter)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                    mixFilter === tab.id ? 'bg-[#00CD3C] text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="responsive-card-grid">
            {filteredMixes.map((mix) => {
              const isPlaying = activePreviewId === mix.id;
              return (
                <article
                  key={mix.id}
                  className="min-w-0 group rounded-2xl bg-[#161B22] border border-[#30363D] overflow-hidden hover:border-[#00CD3C]/70 transition-colors flex flex-col"
                >
                  <div className={`aspect-[4/3] bg-gradient-to-br ${mix.accent} p-5 sm:p-6 flex flex-col justify-between`}>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[11px] font-semibold tracking-wider text-gray-300 truncate">
                        {mix.kicker}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleMixPreview(mix.id, mix.freq)}
                        aria-label={`${mix.title} 미리듣기`}
                        className="w-10 h-10 rounded-full bg-[#00CD3C] text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                      >
                        <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-xs`} />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-white break-words">{mix.title}</h3>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between gap-3">
                    <div className="text-xs text-gray-400 break-words">{mix.meta}</div>
                    <p className="text-xs text-gray-300 leading-relaxed break-keep">{mix.desc}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 3: BENTO GRID AUDIO SHOWCASE
          ========================================== */}
      <section id="bento" className="section-padding-fluid bg-[#0B0E14] border-t border-[#1F242D]">
        <div className="container-fluid">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00CD3C] mb-2">
              Audio Engineering
            </p>
            <h2 className="font-display section-title-fluid font-extrabold text-white tracking-tight mb-3">
              압도적인 오디오 기술을 한눈에
            </h2>
            <p className="text-gray-400 text-sm">
              스튜디오 마스터링 음질부터 멀티 디바이스 연속 재생까지 직접 조작해 보세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
            {/* Box 1: Live EQ Customizer */}
            <div className="md:col-span-8 min-w-0 rounded-2xl bg-[#161B22] border border-[#30363D] p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-semibold text-[#00CD3C] mb-2">24bit/96kHz Hi-Fi FLAC</p>
                <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">
                  스튜디오 원음 & 5-Band 이퀄라이저
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
                  악기별 주파수 밸런스를 실시간으로 조율해 내 이어폰에 최적화된 사운드를 만듭니다.
                </p>
              </div>

              <div className="bg-[#0B0E14] border border-[#30363D] rounded-xl p-4 sm:p-5">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
                  <span className="text-xs font-semibold text-gray-300">Live EQ Customizer</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyEqPreset('bass')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#161B22] border border-[#30363D] text-gray-300 hover:text-white hover:border-[#00CD3C]"
                    >
                      Bass Boost
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEqPreset('vocal')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#161B22] border border-[#30363D] text-gray-300 hover:text-white hover:border-[#00CD3C]"
                    >
                      Vocal Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => applyEqPreset('flat')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#161B22] border border-[#30363D] text-gray-300 hover:text-white hover:border-[#00CD3C]"
                    >
                      Flat Hi-Fi
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1.5 sm:gap-4 items-end h-36">
                  {['60Hz', '230Hz', '910Hz', '4kHz', '14kHz'].map((hz, idx) => (
                    <div key={hz} className="flex flex-col items-center gap-2 h-full min-w-0">
                      <div className="flex-1 flex items-center justify-center w-full">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={eqBands[idx]}
                          onChange={(e) => {
                            const next = [...eqBands];
                            next[idx] = Number(e.target.value);
                            setEqBands(next);
                          }}
                          aria-label={`${hz} 이퀄라이저`}
                          className="h-24 accent-[#00CD3C] cursor-pointer"
                          style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                        />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-mono-tabular text-gray-400 text-center leading-tight">
                        {hz}
                        <span className="hidden sm:inline"> · {eqBands[idx]}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Box 2: Continuity Multi-Device */}
            <div className="md:col-span-4 min-w-0 rounded-2xl bg-[#161B22] border border-[#30363D] p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-semibold text-cyan-400 mb-2">Continuity</p>
                <h3 className="text-xl font-extrabold text-white mb-2">끊김 없는 멀티 디바이스</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  외출 중 듣던 트랙을 집 안의 Mac, Watch, CarPlay로 즉시 이어서 재생합니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'iPhone 15', icon: 'fa-mobile-screen' },
                  { id: 'Mac Pro', icon: 'fa-laptop' },
                  { id: 'Watch Ultra', icon: 'fa-clock' },
                  { id: 'CarPlay', icon: 'fa-car' },
                ].map((dev) => (
                  <button
                    key={dev.id}
                    type="button"
                    onClick={() => {
                      setSelectedDevice(dev.id);
                      showToast(`${dev.id}로 24bit 스트리밍을 전환했습니다.`);
                    }}
                    className={`min-w-0 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors ${
                      selectedDevice === dev.id
                        ? 'bg-[#00CD3C]/15 border border-[#00CD3C] text-[#00CD3C]'
                        : 'bg-[#0B0E14] border border-[#30363D] text-gray-300 hover:text-white'
                    }`}
                  >
                    <i className={`fa-solid ${dev.icon} shrink-0`} />
                    <span className="truncate">{dev.id}</span>
                  </button>
                ))}
              </div>

              <div className="text-xs text-gray-300 flex items-center gap-2">
                <i className="fa-solid fa-circle-check text-[#00CD3C]" />
                <span>{selectedDevice} 연결됨</span>
              </div>
            </div>

            {/* Box 3: Offline Auto-Download */}
            <div className="md:col-span-6 min-w-0 rounded-2xl bg-[#161B22] border border-[#30363D] p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-purple-400 mb-2">Offline Mode</p>
                  <h3 className="text-xl font-extrabold text-white mb-2">스마트 오프라인 저장</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    비행기 탑승이나 지하철 음영 구역에서도 데이터 걱정 없이 무손실 음원을 감상하세요.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isAirplaneMode}
                    onChange={(e) => {
                      setIsAirplaneMode(e.target.checked);
                      showToast(
                        e.target.checked
                          ? '비행기 모드 오프라인 캐시 재생으로 전환되었습니다.'
                          : '온라인 스트리밍 모드로 전환되었습니다.'
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500" />
                </label>
              </div>

              <div className="bg-[#0B0E14] border border-[#30363D] rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <i
                    className={`fa-solid ${
                      isAirplaneMode ? 'fa-plane text-purple-400' : 'fa-wifi text-[#00CD3C]'
                    } text-base shrink-0`}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {isAirplaneMode ? '오프라인 FLAC 재생 중' : '5G / Wi-Fi 스트리밍 중'}
                    </div>
                    <div className="text-xs text-gray-400 break-keep">
                      {isAirplaneMode
                        ? '사전 저장된 24bit 음원으로 끊김 없이 감상하고 있습니다.'
                        : '실시간 클라우드 라이브러리와 동기화되어 있습니다.'}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono-tabular font-semibold text-gray-300 shrink-0">
                  {isAirplaneMode ? 'OFFLINE' : 'ONLINE'}
                </span>
              </div>
            </div>

            {/* Box 4: Sync Lyrics */}
            <div className="md:col-span-6 min-w-0 rounded-2xl bg-[#161B22] border border-[#30363D] p-5 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-semibold text-amber-400 mb-2">Sync Lyrics</p>
                <h3 className="text-xl font-extrabold text-white mb-2">실시간 싱크 가사 & 듀엣</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  현재 선택된 믹스셋 트랙의 사운드 노트와 실시간 싱크 가사를 함께 확인하세요.
                </p>
              </div>

              <div className="bg-[#0B0E14] border border-[#30363D] rounded-xl p-4 space-y-1.5">
                <div className="text-xs font-mono-tabular text-gray-500 truncate">
                  01:24.50 · {activeTrack?.title}
                </div>
                <div className="text-sm font-bold break-keep" style={{ color: themeColor }}>
                  {activeTrack?.previewVibe}
                </div>
                <div className="text-xs text-gray-400 truncate">
                  {activeTrack?.artist} · {activeTrack?.genre}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 4: INTERACTIVE PRICING MATRIX (3 -> 2 -> 1 GRID)
          ========================================== */}
      <section id="pricing" className="section-padding-fluid bg-[#0B0E14] border-t border-[#1F242D]">
        <div className="container-fluid">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00CD3C] mb-2">
              10sec Plan Finder
            </p>
            <h2 className="font-display section-title-fluid font-extrabold text-white tracking-tight mb-3">
              나에게 맞는 최적의 요금제
            </h2>
            <p className="text-gray-400 text-sm">약정 없이 언제든 1초 만에 해지할 수 있습니다.</p>
          </div>

          <div className="max-w-xl mx-auto bg-[#161B22] border border-[#30363D] p-1.5 rounded-xl mb-10 sm:mb-14 grid grid-cols-3 gap-1">
            {[
              { id: 'mobile', label: '1인 스마트폰' },
              { id: 'streaming', label: '전 기기 무제한' },
              { id: 'family', label: '온 가족 패밀리' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActivePlanFilter(tab.id as typeof activePlanFilter)}
                className={`py-2.5 px-2 sm:px-4 rounded-lg text-[11px] sm:text-xs font-bold transition-colors truncate ${
                  activePlanFilter === tab.id ? 'bg-[#00CD3C] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="responsive-card-grid items-stretch">
            {[
              {
                id: 'mobile',
                kicker: '가성비 추천',
                title: '모바일 전용 플랜',
                desc: '스마트폰으로 출퇴근길에 가볍게 즐기는 1인 리스너',
                price: '6,900',
                features: ['320kbps MP3/AAC 표준 음질', '동시 재생 1대 (모바일 전용)', '첫 달 100원 체험 적용'],
                cta: '모바일 전용 시작',
              },
              {
                id: 'streaming',
                kicker: '가장 대중적인 선택',
                title: '무제한 스트리밍 플랜',
                desc: '스마트폰, PC, 스피커 등 모든 기기에서 제한 없이 감상',
                price: '10,900',
                features: ['320kbps + 3D 공간 음향 지원', '동시 재생 2대 (모바일+PC)', '무제한 오프라인 다운로드'],
                cta: '첫 달 100원으로 시작하기',
              },
              {
                id: 'family',
                kicker: '최고의 몰입감',
                title: 'Hi-Fi 패밀리 플랜',
                desc: '온 가족이 24bit 무손실 음질과 독립 프로필을 공유',
                price: '16,900',
                features: ['24bit/96kHz Hi-Fi FLAC 원음', '동시 재생 최대 6대 (프로필 5개)', '무제한 오프라인 다운로드'],
                cta: 'Hi-Fi 패밀리 시작',
              },
            ].map((plan) => {
              const selected = activePlanFilter === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`min-w-0 rounded-2xl bg-[#161B22] p-6 sm:p-8 flex flex-col justify-between transition-all ${
                    selected
                      ? 'border-2 border-[#00CD3C] shadow-2xl shadow-[#00CD3C]/10'
                      : 'border border-[#30363D] opacity-80'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold text-[#00CD3C] mb-3">{plan.kicker}</div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">{plan.title}</h3>
                    <p className="text-xs text-gray-400 mb-6 break-keep">{plan.desc}</p>
                    <div className="mb-6 font-mono-tabular">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">월 {plan.price}</span>
                      <span className="text-gray-400 text-sm ml-1">원</span>
                    </div>
                    <ul className="space-y-3 text-xs text-gray-300 border-t border-[#30363D] pt-6 mb-8">
                      {plan.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2">
                          <i className="fa-solid fa-check text-[#00CD3C] mt-0.5 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-colors ${
                      selected
                        ? 'bg-[#00CD3C] hover:bg-[#00E644] text-black'
                        : 'border border-[#30363D] text-white hover:border-[#00CD3C]'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==========================================
          SECTION 5: FAQ & QUIET FOOTER
          ========================================== */}
      <section id="faq" className="section-padding-fluid bg-[#0B0E14] border-t border-[#1F242D]">
        <div className="container-fluid max-w-3xl">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="font-display section-title-fluid font-extrabold text-white mb-2">자주 묻는 질문</h2>
            <p className="text-gray-400 text-sm">가입 전 궁금한 점을 바로 확인하세요.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: '표지의 3D 커버와 15초 AI 믹스셋은 어떻게 연동되나요?',
                a: '원하는 기분이나 상황을 입력하면 Gemini AI가 인트로-클라이맥스-아웃트로 흐름의 3곡과 무드 컬러를 생성하며, 표지 3D 오브제의 조명과 스펙트럼 링이 실시간으로 동기화됩니다.',
              },
              {
                q: '첫 달 100원 혜택 종료 후 약정이나 위약금이 발생하나요?',
                a: '약정 기간이나 위약금은 없습니다. 체험 기간 중 언제든지 마이페이지에서 클릭 한 번으로 수수료 없이 해지할 수 있습니다.',
              },
              {
                q: 'Hi-Fi 무손실 음원(FLAC)은 모든 디바이스에서 감상 가능한가요?',
                a: 'iOS, Android, Windows, macOS 전용 앱에서 24bit/96kHz 고해상도 출력을 지원합니다.',
              },
            ].map((item, idx) => (
              <div key={item.q} className="border border-[#30363D] rounded-xl bg-[#161B22] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left font-bold text-white text-sm flex justify-between items-center gap-3 hover:text-[#00CD3C] transition-colors"
                >
                  <span className="break-keep">{item.q}</span>
                  <i
                    className={`fa-solid fa-chevron-down text-xs shrink-0 transition-transform duration-200 ${
                      openFaqIndex === idx ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaqIndex === idx && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-gray-400 leading-relaxed border-t border-[#30363D]/60 pt-4">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#080A0F] py-8 sm:py-10 border-t border-[#1F242D] text-xs text-gray-500">
        <div className="container-fluid flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
          <div className="text-gray-300 font-semibold">Melon Showroom · 3D Spatial Edition</div>
          <div className="flex flex-wrap justify-center gap-5 sm:gap-6">
            <a href="#trending" className="hover:text-white transition-colors">이용약관</a>
            <a href="#bento" className="hover:text-white transition-colors">개인정보 처리방침</a>
            <a href="#faq" className="hover:text-white transition-colors">고객센터</a>
          </div>
        </div>
      </footer>

      {/* ==========================================
          API KEY MODAL
          ========================================== */}
      {isApiKeyModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl max-w-md w-full p-6 sm:p-7 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setIsApiKeyModalOpen(false)}
              aria-label="닫기"
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
            <h3 className="text-lg font-extrabold text-white mb-1">Gemini API Key 설정</h3>
            <p className="text-xs text-gray-400 mb-5">
              서버 기본 키 외에 개인 Gemini API Key로 직접 테스트하려면 입력해주세요.
            </p>
            <div className="space-y-4">
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl bg-[#0B0E14] border border-[#30363D] text-white text-sm focus:outline-none focus:border-[#00CD3C]"
              />
              <button
                type="button"
                onClick={() => {
                  setIsApiKeyModalOpen(false);
                  showToast('API 키 설정이 저장되었습니다.');
                }}
                className="w-full py-3 rounded-xl bg-[#00CD3C] text-black font-bold text-sm hover:bg-[#00E644] transition-colors"
              >
                저장 및 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          SIGNUP MODAL
          ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#161B22] border border-[#30363D] rounded-2xl max-w-md w-full p-6 sm:p-7 relative shadow-2xl">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="닫기"
              className="absolute top-5 right-5 text-gray-400 hover:text-white"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
            <div className="mb-6">
              <div className="text-xs font-semibold text-[#00CD3C] mb-1">Melon Membership</div>
              <h3 className="text-2xl font-extrabold text-white">첫 달 100원으로 시작</h3>
              <p className="text-xs text-gray-400 mt-1">약정 없이 언제든 해지 가능합니다.</p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!signupEmail.includes('@')) {
                  showToast('올바른 이메일 주소를 입력해주세요.');
                  return;
                }
                setIsModalOpen(false);
                showToast('첫 달 100원 가입 신청이 완료되었습니다.');
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">이메일 주소</label>
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="example@melon.com"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0E14] border border-[#30363D] text-white text-sm focus:outline-none focus:border-[#00CD3C]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">비밀번호</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="8자리 이상 입력"
                  className="w-full px-4 py-3 rounded-xl bg-[#0B0E14] border border-[#30363D] text-white text-sm focus:outline-none focus:border-[#00CD3C]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#00CD3C] text-black font-extrabold text-sm hover:bg-[#00E644] transition-colors"
              >
                100원으로 가입 완료하기
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-4 right-4 sm:left-auto sm:right-6 z-[300] px-4 py-3 rounded-xl bg-[#00CD3C] text-black font-bold text-xs shadow-2xl flex items-center gap-2 max-w-full sm:max-w-sm">
          <i className="fa-solid fa-circle-check shrink-0" />
          <span className="break-words">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
