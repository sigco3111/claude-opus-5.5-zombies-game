import './style.css';
import { KOREAN_FONT_B64 } from './assets/koreanFont';
import { Game } from './core/Game';

function fail(msg: string): void {
  document.getElementById('loading')?.classList.add('hidden');
  const e = document.getElementById('error')!;
  document.getElementById('error-text')!.textContent = msg;
  e.classList.remove('hidden');
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

async function boot(): Promise<void> {
  if (!webglAvailable()) {
    fail('이 게임에는 WebGL이 필요하지만 이 브라우저에서 비활성화되어 있거나 지원하지 않습니다. 하드웨어 가속을 켜거나 데스크톱의 최신 Chrome, Edge, Firefox를 사용해주세요.');
    return;
  }
  if (!('requestPointerLock' in HTMLElement.prototype)) {
    fail('이 브라우저는 1인칭 조작에 필요한 마우스 포인터 잠금을 지원하지 않습니다. 데스크톱 브라우저를 사용해주세요.');
    return;
  }
  const fill = document.getElementById('load-fill')!;
  const text = document.getElementById('load-text')!;
  const progress = async (p: number, label: string) => {
    fill.style.width = `${Math.round(p * 100)}%`;
    text.textContent = label;
  };
  // Yield so the loading screen paints before heavy generation begins.
  await new Promise((r) => requestAnimationFrame(() => r(null)));
  // Register the bundled Korean font before canvas textures (signs, maps) are generated.
  try {
    const bin = Uint8Array.from(atob(KOREAN_FONT_B64), (c) => c.charCodeAt(0));
    const face = new FontFace('Noto Sans KR', bin.buffer, { weight: '100 900' });
    await face.load();
    document.fonts.add(face);
  } catch { /* system Korean fonts still apply as fallback */ }
  let game: Game;
  try {
    game = new Game(document.getElementById('app')!, (p, l) => void progress(p, l));
  } catch (err) {
    console.error(err);
    fail(`게임을 시작하지 못했습니다: ${(err as Error).message}`);
    return;
  }
  document.getElementById('loading')!.classList.add('hidden');
  game.menus.showScreen('title');
  // Development-only automation hooks. Stripped from production builds.
  if (import.meta.env.DEV && new URLSearchParams(location.search).has('dev')) {
    (window as unknown as { __DS: unknown }).__DS = game.devApi();
    console.info('[DEAD SIGNAL] dev hooks available on window.__DS');
  }
}

window.addEventListener('error', (e) => console.error('[DEAD SIGNAL] uncaught', e.error ?? e.message));
void boot();
