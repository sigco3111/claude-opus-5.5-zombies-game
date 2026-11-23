// Title, pause, settings and results screens. Buttons are wired once at construction.
import type { Game } from '../core/Game';
import type { BestRun } from '../core/Settings';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

export type Screen = 'title' | 'pause' | 'settings' | 'results' | 'none';

export interface ResultStats { kills: number; headshots: number; contracts: number; salvage: number; caches: number; time: number; accuracy: number }

export class Menus {
  private settingsReturn: Screen = 'title';

  constructor(private game: Game) {
    $('btn-deploy').addEventListener('click', () => void this.game.deploy());
    $('btn-settings').addEventListener('click', () => this.openSettings('title'));
    $('btn-resume').addEventListener('click', () => void this.game.resume());
    $('btn-pause-settings').addEventListener('click', () => this.openSettings('pause'));
    $('btn-restart').addEventListener('click', () => this.game.restart());
    $('btn-quit').addEventListener('click', () => this.game.quitToTitle());
    $('btn-again').addEventListener('click', () => this.game.restart());
    $('btn-menu').addEventListener('click', () => this.game.quitToTitle());
    $('btn-settings-back').addEventListener('click', () => this.showScreen(this.settingsReturn));
    this.bindSettings();
    this.renderBest();
  }

  showScreen(s: Screen, note = ''): void {
    for (const id of ['title', 'pause', 'settings', 'results']) $(id).classList.toggle('hidden', id !== s);
    if (s === 'pause') this.setResumeNote(note);
    if (s === 'title') this.renderBest();
  }

  setResumeNote(t: string): void {
    $('resume-note').textContent = t;
  }

  showMap(open: boolean): void {
    $('tacmap').classList.toggle('hidden', !open);
  }

  private openSettings(from: Screen): void {
    this.settingsReturn = from;
    this.syncSettingsUI();
    this.showScreen('settings');
  }

  private bindSettings(): void {
    const g = this.game;
    const on = (id: string, ev: string, fn: (el: HTMLInputElement) => void) => $(id).addEventListener(ev, (e) => { fn(e.target as HTMLInputElement); g.applySettings(); this.syncSettingsUI(); });
    on('set-sens', 'input', (el) => { g.settings.sensitivity = +el.value; });
    on('set-fov', 'input', (el) => { g.settings.fov = +el.value; });
    on('set-vol', 'input', (el) => { g.settings.volume = +el.value; });
    on('set-quality', 'change', (el) => { g.settings.quality = el.value as never; });
    on('set-scale', 'change', (el) => { g.settings.renderScale = +el.value; });
    on('set-motion', 'change', (el) => { g.settings.reducedMotion = el.checked; });
    on('set-fps', 'change', (el) => { g.settings.showFps = el.checked; });
  }

  private syncSettingsUI(): void {
    const s = this.game.settings;
    $<HTMLInputElement>('set-sens').value = String(s.sensitivity);
    $('out-sens').textContent = s.sensitivity.toFixed(2);
    $<HTMLInputElement>('set-fov').value = String(s.fov);
    $('out-fov').textContent = String(s.fov);
    $<HTMLInputElement>('set-vol').value = String(s.volume);
    $('out-vol').textContent = `${Math.round(s.volume * 100)}%`;
    $<HTMLSelectElement>('set-quality').value = s.quality;
    $<HTMLInputElement>('set-scale').value = String(s.renderScale);
    $('out-scale').textContent = `${Math.round(s.renderScale * 100)}%`;
    $<HTMLInputElement>('set-motion').checked = s.reducedMotion;
    $<HTMLInputElement>('set-fps').checked = s.showFps;
  }

  private renderBest(): void {
    const b = this.game.bestRun;
    $('best-run').textContent = b ? `최고 기록  ${fmt(b.time)}  ·  처치 ${b.kills}  ·  헤드샷 ${b.headshots}` : '';
  }

  showResults(outcome: 'victory' | 'dead' | 'timeout', s: ResultStats, record: boolean, best: BestRun | null): void {
    const title = $('result-title');
    title.textContent = outcome === 'victory' ? '탈출 성공' : outcome === 'dead' ? '전사' : '구역 상실';
    title.className = outcome === 'victory' ? 'win' : 'lose';
    $('result-kicker').textContent = outcome === 'victory' ? '작전 보고 · 성공' : '작전 보고 · 실패';
    $('result-sub').textContent = outcome === 'victory'
      ? 'RAVEN 2-1이 당신을 태우고 구역을 벗어났습니다. 업링크 데이터와 WARDEN-9 제거 확인이 무사히 전달되었습니다.'
      : outcome === 'dead'
        ? '당신의 신호가 격리 구역 안에서 끊겼습니다. 구조대는 투입되지 않습니다.'
        : '탈출하기 전에 오염 전선이 착륙 지점을 집어삼켰습니다.';
    const cells: [string, string][] = [
      ['결과', outcome === 'victory' ? '성공' : '실패'],
      ['생존 시간', fmt(s.time)],
      ['계약', `${s.contracts} / 2`],
      ['처치', String(s.kills)],
      ['헤드샷', String(s.headshots)],
      ['명중률', `${Math.round(s.accuracy * 100)}%`],
      ['획득 전리품', `$${s.salvage.toLocaleString('en-US')}`],
      ['보급품 캐시', String(s.caches)],
      ['탈출', outcome === 'victory' ? '예' : '아니오'],
    ];
    const grid = $('result-stats');
    grid.replaceChildren(...cells.map(([k, v]) => {
      const d = document.createElement('div');
      d.className = 'stat';
      const vv = document.createElement('div'); vv.className = 'v'; vv.textContent = v;
      const kk = document.createElement('div'); kk.className = 'k2'; kk.textContent = k;
      d.append(vv, kk);
      return d;
    }));
    $('result-best').textContent = record ? '최고 탈출 기록 경신' : best ? `최고 기록  ${fmt(best.time)}` : '';
    this.showScreen('results');
  }
}

function fmt(t: number): string {
  const s = Math.floor(t);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
