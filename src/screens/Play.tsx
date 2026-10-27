/**
 * 한 판 풀기 + 결과.
 *  - 문제가 나온 직후·보기를 고른 직후 0.4초는 제출을 막음 (찍기 방지)
 *  - 맞혀도 틀려도 풀이를 바로 보여 주고, 버튼은 늘 같은 자리
 *  - 태블릿 가로: 화면 높이에 맞춰 왼쪽 문제, 오른쪽 보기 → (답한 뒤) 정답·풀이. 페이지가 스크롤되지 않음
 *    (한자·영어 에이스와 같은 틀). 세로: 한 줄로 쌓고 버튼은 아래에 붙어 있음
 *  - 두 번 연속 맞히면 그 유형 단계 +1, 틀리면 −1 (도전 문제는 단계에 넣지 않음)
 *  - 판이 끝나면 틀린 문제를 한 번 더 (기록에는 넣지 않는 연습)
 *  - 별은 주지 않음. 5문제 맞힐 때마다 나무에 물 한 방울
 */
import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Home, Lightbulb, Lock } from 'lucide-react';
import { R, J } from '../gen/generators.js';
import { AREA_OF, OOPS, PRAISE, STEP_NAME, TYPE_NAME } from '../engine/areas';
import { Menu, RoundItem, RoundRecord } from '../types';
import { PER_DROP, actions, dropsFor, getState, useStore } from '../engine/store';
import { paidRound } from '../ace/playground';
import { STAGES, stageOf } from '../engine/tree';
import { makeQ } from '../engine/makeQ';
import { Q, View, ansHTML, ansText, currentGiven, inputHTML, promptOf, remainingByClues, solveOf, stemHTML } from '../engine/render';
import { Html, StageBar, StratSheet, TreeArt } from '../components/thinking';
import { askPin, toast } from '../components/ui';
import { useWallet } from '../ace/wallet';

export const FREE_HINTS = 2;   // 한 판에 무료 힌트. 다 쓰면 힌트 한 번에 공통 지갑의 별 1개

interface LogItem { q: Q; given: string; ok: boolean; hint: boolean; before: number; after: number; clues: number | null }
interface Props { menu: Menu; plan: string[]; fresh: string[]; onExit: () => void; onAgain: () => void }

const freshView = (q: Q): View & { msg: string; medal: string | null; lockUntil: number; peekShow: boolean } => ({
  answered: false, lastOk: null, given: null, sel: null, typed: '',
  paint: q.kind === 'paint' ? q.given.slice() : [],
  sudo: q.kind === 'sudoku' ? q.puzzle.slice() : [],
  sudoSel: q.kind === 'sudoku' ? q.blanks.slice().sort((a: number, b: number) => a - b)[0] : null,
  revealed: 1, crossed: new Set<number>(), hintOpen: false, msg: '', medal: null, lockUntil: Date.now() + 400, peekShow: false,
});

const isWide = () => typeof window !== 'undefined' && window.matchMedia?.('(orientation: landscape) and (min-width: 700px)').matches;

export default function Play({ menu, plan, fresh, onExit, onAgain }: Props) {
  const store = useStore();
  const balance = useWallet().balance;
  const treeName = store.tree.name || '생각나무';
  const [, bump] = useState(0);
  const redraw = () => bump(n => n + 1);
  const [strat, setStrat] = useState<string | null>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);

  const S = useRef<any>(null);
  if (!S.current) {
    const steps = { ...getState().steps };
    const q0 = Object.assign(makeQ(plan[0], plan.length === 1 ? 2 : steps[plan[0]]), { challenge: plan.length === 1 });
    S.current = {
      i: 0, q: q0, v: freshView(q0), log: [] as LogItem[], steps, streak: {} as Record<string, number>,
      combo: 0, maxCombo: 0, gave: 0, freeLeft: FREE_HINTS, hintsFree: 0, hintsPaid: 0,
      retry: null as null | { list: Q[]; i: number }, phase: 'play' as 'play' | 'result', peekOk: getState().preview,
      t0: Date.now(), result: null as null | { drops: number; lowAcc: boolean; paid?: boolean; grew: string | null; correct: number },
    };
  }
  const s = S.current;
  const q: Q = s.q, v = s.v;
  const total = plan.length;

  // 0.4초 막기가 풀리면 다시 그림
  useEffect(() => {
    const left = v.lockUntil - Date.now();
    if (left > 0) { const t = setTimeout(redraw, left + 20); return () => clearTimeout(t); }
  });
  // 새 문제: 두 칸 모두 맨 위로
  useEffect(() => { leftRef.current?.scrollTo?.(0, 0); rightRef.current?.scrollTo?.(0, 0); }, [s.i, s.retry?.i, s.phase]);

  const setQ = (nq: Q) => { s.q = nq; s.v = freshView(nq); redraw(); };
  /** 답한 뒤: 가로면 오른쪽 칸 맨 위(정답·풀이), 세로면 풀이가 보이게 조금 내림 */
  const showFb = () => setTimeout(() => {
    if (isWide()) rightRef.current?.scrollTo?.({ top: 0 });
    else document.getElementById('fb')?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
  }, 60);

  // ── 답하기 ──
  const submit = () => {
    if (v.answered || Date.now() < v.lockUntil) return;
    const given = currentGiven(q, v);
    if (given == null) return;
    const ok = given === q.ans;
    v.answered = true; v.lastOk = ok; v.given = given;
    if (s.retry) { v.msg = ok ? '이번엔 맞혔어! 👍' : '괜찮아, 풀이를 한 번 더 보자 🌱'; redraw(); showFb(); return; }
    const k = q.key, before = s.steps[k];
    if (!q.challenge) {
      s.streak[k] = s.streak[k] || 0;
      if (ok) { s.streak[k]++; if (s.streak[k] >= 2 && s.steps[k] < 2) { s.steps[k]++; s.streak[k] = 0; } }
      else { s.streak[k] = 0; if (s.steps[k] > 0) s.steps[k]--; }
      actions.setSteps({ ...s.steps });
    }
    if (ok) s.gave++;
    s.combo = ok ? s.combo + 1 : 0; s.maxCombo = Math.max(s.maxCombo, s.combo);
    v.msg = ok ? (s.combo >= 5 ? `${s.combo}연속 정답! 대단해! 🔥` : s.combo >= 3 ? `${s.combo}연속! 쑥쑥 자라! ⚡` : R.pick(PRAISE)) : R.pick(OOPS);
    if (q.kind === 'twenty' && ok) {
      const left = remainingByClues(q, v.revealed);
      if (left === 1) { const tier = v.revealed <= q.need ? 'gold' : v.revealed === q.need + 1 ? 'silver' : 'bronze'; v.medal = tier; actions.addMedal(tier); }
      else v.medal = 'lucky';
    }
    s.log.push({ q, given, ok, hint: v.hintOpen, before, after: s.steps[k], clues: q.kind === 'twenty' ? v.revealed : null });
    redraw(); showFb();
  };

  // ── 판 끝: 물 주기, 기록 ──
  const finish = () => {
    const correct = s.gave;
    // 놀이터 무료 2번 뒤 별을 내고 한 판은 물 없음 (규칙 11번)
    const paid = !getState().preview && menu !== 'daily' && paidRound('thinking', String(menu).slice(5));
    const dr = dropsFor(correct, total);
    const drops = paid ? 0 : dr.drops, lowAcc = dr.lowAcc;
    const beforeSt = stageOf(getState().tree.drops);
    const d = new Date();
    const rec: RoundRecord = {
      ts: Date.now(),
      date: `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`,
      menu, stars: 0, correct, total, drops, lowAcc, ...(paid ? { paidPlay: true } : {}), hintsFree: s.hintsFree, hintsPaid: s.hintsPaid, fresh,
      items: s.log.map((l: LogItem): RoundItem => ({ k: l.q.key, st: l.q.step, ch: !!l.q.challenge, ok: l.ok, hint: l.hint, ans: ansText(l.q), clues: l.clues })),
    };
    actions.finishRound(rec);
    const afterSt = stageOf(getState().tree.drops);
    s.result = { drops, lowAcc, paid, correct, grew: afterSt > beforeSt ? `${J(treeName, '이', '가')} ${J(STAGES[afterSt].n, '이', '가')} 됐어요!` : null };
  };

  const advance = () => {
    if (s.retry) {
      s.retry.i++;
      if (s.retry.i >= s.retry.list.length) { s.retry = null; s.phase = 'result'; redraw(); return; }
      const nq = s.retry.list[s.retry.i];
      if (nq.options && nq.kind !== 'twenty') nq.options = R.shuffle(nq.options);
      setQ(nq); return;
    }
    s.i++;
    if (s.i >= total) {
      finish();
      const wrong = s.log.filter((l: LogItem) => !l.ok).map((l: LogItem) => l.q);
      if (wrong.length) {
        s.retry = { list: wrong, i: 0 };
        const nq = wrong[0]; if (nq.options && nq.kind !== 'twenty') nq.options = R.shuffle(nq.options);
        setQ(nq);
      } else { s.phase = 'result'; redraw(); }
      return;
    }
    const k = plan[s.i], ch = s.i === total - 1;
    setQ(Object.assign(makeQ(k, ch ? 2 : s.steps[k]), { challenge: ch }));
  };

  // ── 누르기 (그림 안의 칸·보기·숫자판을 한꺼번에 받음) ──
  const onPick = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = (e.target as HTMLElement).closest('[data-opt],[data-k],[data-cell],[data-sc],[data-sym],[data-reveal]') as HTMLElement | null;
    if (!el || v.answered) return;
    const d = el.dataset;
    if (d.reveal) { if (v.revealed < q.clues.length) v.revealed++; }
    else if (d.opt != null) {
      const i = +d.opt;
      if (q.kind === 'twenty') { v.crossed.has(i) ? v.crossed.delete(i) : v.crossed.add(i); }
      else { v.sel = q.options[i].val; v.lockUntil = Math.max(v.lockUntil, Date.now() + 400); }
    } else if (d.k != null) {
      if (d.k === 'del') v.typed = v.typed.slice(0, -1);
      else if (v.typed.length < 3) v.typed = (v.typed === '0' ? '' : v.typed) + d.k;
    } else if (d.cell != null) { const i = +d.cell; v.paint[i] = (v.paint[i] + 1) % (q.nc + 1); }
    else if (d.sc != null) { v.sudoSel = +d.sc; }
    else if (d.sym != null) {
      if (v.sudoSel == null) return;
      const val = +d.sym; v.sudo[v.sudoSel] = val;
      if (val >= 0) {
        const order = q.blanks.slice().sort((a: number, b: number) => a - b);
        const nx = order.find((i: number) => i > v.sudoSel && v.sudo[i] < 0) ?? order.find((i: number) => v.sudo[i] < 0);
        if (nx != null) v.sudoSel = nx;
      }
    }
    redraw();
  };

  // ── 힌트: 한 판에 2번 무료, 그 뒤로는 공통 지갑의 별 1개 ──
  const hint = () => {
    if (v.hintOpen || v.answered) return;
    if (s.freeLeft > 0) { s.freeLeft--; s.hintsFree++; }
    else {
      if (!actions.spendHint(`${TYPE_NAME[q.key]}`)) { toast('별이 모자라서 힌트를 더 볼 수 없어요'); return; }
      s.hintsPaid++;
    }
    v.hintOpen = true; redraw();
  };

  // ── 부모님 해설: 해설 PIN을 한 번 넣으면 이 판이 끝날 때까지 ──
  const canPeek = store.config.peek && (store.preview || !!store.peekPin);
  const openPeek = () => {
    if (s.peekOk) { v.peekShow = true; redraw(); return; }
    askPin('해설 PIN을 넣으면 이번 판이 끝날 때까지 정답과 풀이를 볼 수 있어요', () => { s.peekOk = true; v.peekShow = true; redraw(); }, store.peekPin);
  };
  const leave = () => { if (window.confirm('그만하고 나갈까요? 이 판은 기록되지 않아요.')) onExit(); };

  if (s.phase === 'result') return Result();

  const area = AREA_OF(q.key), inRetry = !!s.retry;
  const no = inRetry ? s.retry.i + 1 : s.i + 1, tot = inRetry ? s.retry.list.length : total;
  const given = currentGiven(q, v), locked = Date.now() < v.lockUntil;
  const label = q.kind === 'twenty' ? (given ? `이거예요! ${q.items.find((x: any) => x.n === given).e}` : '하나만 남기면 답할 수 있어요')
    : q.kind === 'paint' ? '다 칠했어요' : q.kind === 'sudoku' ? (given == null ? '빈칸을 모두 채워요' : '다 채웠어요')
      : given == null ? (q.kind === 'num' ? '답을 써요' : '보기를 골라요') : '정답 확인';
  const story = inRetry ? <div className="story retry"><span className="o">🌱</span><span>틀린 문제를 한 번 더 풀어 봐요. 기록에는 들어가지 않는 연습이에요.</span></div>
    : s.i === 0 && fresh.length ? <div className="story"><span className="o">🌱</span><span>{treeName}: 새로운 문제 {fresh.map(k => TYPE_NAME[k]).join(', ')}! 전략 카드에서 본 대로 풀어 보자.</span></div>
      : s.i === 0 ? <div className="story"><span className="o">🌳</span><span>{treeName}: {menu === 'daily' ? '물 주러 왔구나! 같이 풀어 볼까?' : area.story}</span></div> : null;
  const medal = v.medal === 'gold' ? '🥇 금메달! 단서를 꼭 필요한 만큼만 보고 맞혔어요.'
    : v.medal === 'silver' ? '🥈 은메달! 단서 하나를 더 보고 확실하게 맞혔어요.'
      : v.medal === 'bronze' ? '🥉 동메달! 단서를 많이 보고 맞혔어요. 다음엔 더 적은 단서로 도전!'
        : v.medal === 'lucky' ? `🍀 맞았지만, 그때는 후보가 아직 ${remainingByClues(q, v.revealed)}개 남아 있었어요. 단서를 더 열면 확실히 알 수 있어요.` : '';
  const paidHint = s.freeLeft <= 0;
  const hintTxt = v.hintOpen ? '힌트 보는 중' : '힌트';
  const inputHtml = inputHTML(q, v);

  return (
    <div className={`play ${v.answered ? 'is-answered' : ''}`}>
      <div className="ptop">
        <div className="bar">
          <button className="homebtn" aria-label="처음으로" onClick={leave}><Home size={20} /></button>
          <div className="prog"><i style={{ width: `${(no / tot) * 100}%` }} /></div>
          {s.combo >= 2 && !inRetry && <span className="combo">🔥 {s.combo}</span>}
          <span className="cnt">💧{Math.floor(s.gave / PER_DROP)}</span>
          <span className="cnt">{no}/{tot}</span>
        </div>
      </div>

      <div className="pbody">
        {/* 왼쪽(가로) · 위(세로): 문제 */}
        <div className="pleft" ref={leftRef}>
          {story}
          <div className="qcard">
            <div className="qtop">
              <span className="k">{q.challenge && !inRetry && <><span className="chipCh">도전 문제</span> </>}{area.ic} {area.name} · <b>{TYPE_NAME[q.key]}</b> · {STEP_NAME[q.step]}</span>
              <button className="stratBtn" onClick={() => setStrat(q.key)}>📒 전략 카드</button>
            </div>
            <div className="prompt">{promptOf(q, treeName)}</div>
            <Html className="stem" html={stemHTML(q, v)} onClick={onPick} />
            {v.hintOpen && !v.answered && (
              q.kind === 'twenty' ? <div className="hint">💡 지금까지 연 단서와 맞지 않는 것을 흐리게 표시했어요. 눌러서 지워 봐요.</div>
                : <Html className="hint" html={`💡 ${q.hintHTML}`} />
            )}
          </div>
        </div>

        {/* 오른쪽(가로) · 아래(세로): 보기 → 답한 뒤 정답·풀이, 그리고 버튼 */}
        <div className="pright">
          <div className="prscroll" ref={rightRef}>
            {inputHtml && <Html className="pinput" html={inputHtml} onClick={onPick} />}
            {v.answered && (
              <div className={`fb ${v.lastOk ? 'ok' : 'no'} pop`} id="fb">
                <div className="msg">{v.msg}</div>
                {v.lastOk && !inRetry && (
                  <div className="actline">{s.gave % PER_DROP === 0 ? `💧 ${treeName}에게 줄 물 한 방울이 모였어요!` : `이번 판 정답 ${s.gave}개 · ${PER_DROP - (s.gave % PER_DROP)}개 더 맞히면 💧 한 방울`}</div>
                )}
                {medal && <div className="medal">{medal}</div>}
                {!v.lastOk && <Html className="ansline" html={`정답은 ${ansHTML(q)}`} />}
                {!v.lastOk && q.mistake && q.mistake.val === v.given && <div className="think">🌳 {q.mistake.text}</div>}
                <Html className="solve" html={`<span class="lab">풀이</span>${solveOf(q, v.revealed)}`} />
              </div>
            )}
            {canPeek && !v.answered && (v.peekShow
              ? <div className="peekBox">
                <div className="ph"><b>🔒 부모님 해설</b><button onClick={() => { v.peekShow = false; redraw(); }}>닫기</button></div>
                <Html className="ansline" html={`정답 ${ansHTML(q)}`} />
                <Html className="solve" html={solveOf(q)} />
              </div>
              : <button className="peekBtn" onClick={openPeek}><Lock size={13} />부모님 해설</button>)}
          </div>
          <div className="pactions">
            <div className="left">
              {!v.answered && !inRetry && (
                <button className="btn-secondary hintBtn" onClick={hint} disabled={v.hintOpen}>
                  <span className="flex items-center gap-1"><Lightbulb size={18} className="text-amber-500" />{hintTxt}</span>
                  {!v.hintOpen && <small>{paidHint ? `⭐ 1개 (남은 별 ${balance})` : `무료 ${s.freeLeft}번`}</small>}
                </button>
              )}
            </div>
            <div className="right">
              {v.answered
                ? <button className="btn-primary" onClick={advance}>{v.lastOk ? '다음' : '알겠어요'} <ArrowRight size={20} /></button>
                : <button className="btn-primary" onClick={submit} disabled={(given == null && q.kind !== 'paint') || locked}>{label}</button>}
            </div>
          </div>
        </div>
      </div>

      <StratSheet k={strat} treeName={treeName} onDone={() => setStrat(null)} onClose={() => setStrat(null)} />
    </div>
  );

  function Result() {
    const r = s.result!;
    const main = s.log.filter((l: LogItem) => !l.q.challenge), ch = s.log.find((l: LogItem) => l.q.challenge);
    const okN = main.filter((l: LogItem) => l.ok).length, pct = main.length ? okN / main.length : 0;
    const cfg = pct >= .9 ? ['🌳', '완벽해요!', `${J(treeName, '이', '가')} 정말 기뻐해요!`, 'var(--ok100)'] : pct >= .7 ? ['🌟', '잘했어요!', '쑥쑥 자라는 게 느껴져요!', 'var(--b100)'] : pct >= .5 ? ['💪', '조금만 더!', '틀린 문제는 곧 다시 만나게 돼!', 'var(--or100)'] : ['🌱', '다시 도전!', '천천히 다시 해 보면 잘할 수 있어!', 'var(--no100)'];
    const sec = Math.round((Date.now() - s.t0) / 1000);
    const tree = getState().tree;
    return (
      <div className="play">
        <div className="presult">
          <div className="rleft">
            <div className="rcardbox">
              <div className="rhead">
                <div className="remoji" style={{ background: cfg[3] }}>{cfg[0]}</div>
                <div><h2>{cfg[1]}</h2><div className="sub">{cfg[2]}</div></div>
              </div>
              <div className="stats">
                <div className="stat"><b>{r.correct}<span style={{ fontSize: 13, color: 'var(--s400)' }}>/{total}</span></b><span>정답</span></div>
                <div className="stat"><b>💧{r.drops}</b><span>준 물</span></div>
                <div className="stat"><b>🔥{s.maxCombo}</b><span>최고 콤보</span></div>
              </div>
              {r.paid
                ? <div className="lowacc">별을 내고 한 판이라 이번 판은 물이 없어요. 물 주러 가기에서는 물을 줄 수 있어! 💧</div>
                : r.lowAcc
                ? <div className="lowacc">천천히 풀면 물을 줄 수 있어! (이번 판은 정답이 너무 적었어요)</div>
                : <div className="gave">맞힌 문제 {r.correct}개 → 💧{r.drops} <span className="muted">(5문제 맞힐 때마다 한 방울)</span></div>}
              {store.preview && <div className="muted">체험 중이라 나무에 물이 들어가지 않아요.</div>}
              {r.grew && <div className="newstamps"><b>🌳 나무가 자랐어요!</b><span>{r.grew}</span></div>}
              <div className="miniTree"><TreeArt drops={tree.drops} kind={tree.kind} /></div>
              <StageBar drops={tree.drops} kind={tree.kind} />
              <div className="muted">{ch ? `도전 문제 ${ch.ok ? '성공 🎉' : '다음에 다시!'} · ` : ''}걸린 시간 {Math.floor(sec / 60)}분 {sec % 60}초</div>
            </div>
          </div>
          <div className="rright">
            <div className="list">
              <h4>문제별 결과</h4>
              {s.log.map((l: LogItem, i: number) => {
                const chg = l.after > l.before ? ' · 단계 ↑' : l.after < l.before ? ' · 단계 ↓' : '';
                return (
                  <div key={i} className={`item ${l.ok ? 'ok' : 'no'}`}>
                    <div><div className="t">{i + 1}. {TYPE_NAME[l.q.key]}{l.q.challenge ? ' (도전)' : ''}</div>
                      <div className="s">{AREA_OF(l.q.key).name} · {STEP_NAME[l.q.step]}{chg}{l.hint ? ' · 힌트 봄' : ''}{l.clues ? ` · 단서 ${l.clues}개` : ''}</div></div>
                    <span className="mark">{l.ok ? '✔ 맞음' : '✕ 틀림'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="pactions rbtns">
          <button className="btn-primary" onClick={onAgain}>한 판 더</button>
          <button className="btn-secondary" onClick={onExit}>나무 보러 가기</button>
        </div>
      </div>
    );
  }
}
