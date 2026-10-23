import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu } from './types';
import { BADGES, Milestone, actions, getState, seenTypes, useStore } from './engine/store';
import { initCelebration, migrateThinkingRecords } from './ace/wallet';
import { startAceSync } from './ace/aceSync';
import { AceRewardsSheet } from './ace/Rewards';
import { confirmLeave } from './ace/SaveBar';
import { Overlays, askPin, fireConfetti } from './components/ui';
import { NamingSheet, StratSheet } from './components/thinking';
import { areaTypes, buildPlan, newCountFor, pickNew } from './engine/round';
import ChildHome from './screens/ChildHome';
import Play from './screens/Play';
import Parent from './screens/Parent';
import { Cards, Forest } from './screens/Extras';

type View = 'home' | 'play' | 'forest' | 'cards';

// 첫 화면 그리기 전에: 축하 목록 준비, 처음 한 번 이 기기의 생각 기록을 서버 대기열에
initCelebration();
migrateThinkingRecords();

export default function App() {
  const store = useStore();
  const [screen, setScreen] = useState<'parent' | 'child'>('child');
  const [view, setView] = useState<View>('home');
  const [round, setRound] = useState<{ key: number; menu: Menu; plan: string[]; fresh: string[] } | null>(null);
  const [intro, setIntro] = useState<{ list: string[]; i: number; go: () => void } | null>(null);
  const [strat, setStrat] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [lastName, setLastName] = useState('');
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const treeName = store.tree.name || '생각나무';

  useEffect(() => {
    startAceSync({ pullMath: true });
    const fallback = document.getElementById('loading-fallback');
    if (fallback) fallback.style.display = 'none';
  }, []);

  // ── 기기의 뒤로가기: 홈이 아니면 홈으로 (문제 푸는 중이면 한 번 물어봄) ──
  const atHome = screen === 'child' && view === 'home';
  const nav = useRef({ screen, view }); nav.current = { screen, view };
  const guard = useRef(false);
  useEffect(() => {
    const onPop = () => {
      guard.current = false;
      const cur = nav.current;
      if (cur.screen === 'child' && cur.view === 'home') return;
      const stay = (cur.screen === 'child' && cur.view === 'play' && !window.confirm('그만하고 나갈까요? 이 판은 기록되지 않아요.'))
        || (cur.screen === 'parent' && !confirmLeave());
      if (stay) { history.pushState({ thinking: 1 }, ''); guard.current = true; return; }
      setScreen('child'); setView('home');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    if (!atHome && !guard.current) { history.pushState({ thinking: 1 }, ''); guard.current = true; }
    else if (atHome && guard.current) { guard.current = false; history.back(); }
  }, [atHome]);

  // ── 판 시작 ──
  const begin = (menu: Menu, plan: string[], fresh: string[]) => {
    setRound(r => ({ key: (r?.key || 0) + 1, menu, plan, fresh }));
    setView('play');
  };
  const startDaily = () => {
    const s = getState();
    const fresh = pickNew(newCountFor(seenTypes(s).length, s.config.newPer), s.seen);
    const go = () => {
      const st = getState();
      begin('daily', buildPlan({ count: st.config.count, pool: seenTypes(st), fresh }), fresh);
    };
    if (!fresh.length) { go(); return; }
    setIntro({ list: fresh, i: 0, go });
  };
  const startArea = (id: string) => {
    const s = getState();
    const plan = buildPlan({ count: s.config.count, pool: areaTypes(id), fresh: [], area: id });
    actions.markSeen([...new Set(plan)]);
    begin(`area:${id}`, plan, []);
  };
  const again = () => { if (!round) return; round.menu === 'daily' ? startDaily() : startArea(round.menu.slice(5)); };
  const toHome = () => { setView('home'); setRound(null); };

  const needName = screen === 'child' && view === 'home' && !store.tree.name;

  return (
    <div className="min-h-[100dvh] bg-slate-50 selection:bg-brand-100 selection:text-brand-900">
      <Overlays pin={store.pin} />

      <AnimatePresence mode="wait">
        {screen === 'parent' && (
          <motion.div key="parent" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Parent onHome={() => { setScreen('child'); setView('home'); }} onPreview={() => { setScreen('child'); setView('home'); }} />
          </motion.div>
        )}

        {screen === 'child' && (
          <motion.div key="child" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-[100dvh] bg-gradient-to-b from-brand-50 to-white flex flex-col overflow-hidden">
            {store.preview && (
              <div className="shrink-0 bg-slate-800 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm font-bold flex-wrap">
                <span>👀 부모님 체험 중 · 모든 문제가 바로 나오고 별·물·기록이 남지 않아요</span>
                <button className="bg-white/15 rounded-lg px-3 py-1 text-xs font-black" onClick={() => { actions.setPreview(false); toHome(); }}>체험 끝내기</button>
              </div>
            )}
            {view === 'home' && (
              <ChildHome
                onParent={() => askPin('', () => setScreen('parent'))}
                onDaily={startDaily} onArea={startArea} onRewards={() => setRewardsOpen(true)}
                onForest={() => setView('forest')} onCards={() => setView('cards')}
                onRename={() => setNaming(true)}
                onPlant={() => { setLastName(treeName); actions.plantNew(); }} />
            )}
            {view === 'play' && round && (
              <Play key={round.key} menu={round.menu} plan={round.plan} fresh={round.fresh}
                onExit={toHome} onAgain={again}
                onMilestone={m => { setMilestone(m); fireConfetti(m.hall ? 'epic' : m.value % 50 === 0 ? 'big' : 'normal'); }} />
            )}
            {view === 'forest' && <Forest onBack={() => setView('home')} />}
            {view === 'cards' && <Cards onBack={() => setView('home')} onOpen={setStrat} />}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 새 문제 소개 (물 주러 가기) */}
      {intro && (
        <StratSheet key={intro.list[intro.i]} k={intro.list[intro.i]} treeName={treeName} intro={{ i: intro.i, n: intro.list.length }}
          onClose={() => { }}
          onDone={() => {
            actions.markSeen([intro.list[intro.i]]);
            if (intro.i + 1 < intro.list.length) setIntro({ ...intro, i: intro.i + 1 });
            else { const go = intro.go; setIntro(null); go(); }
          }} />
      )}
      {/* 전략 카드 목록에서 열기 */}
      <StratSheet k={strat} treeName={treeName} onDone={() => setStrat(null)} onClose={() => setStrat(null)} />

      {/* 나무 이름: 새 나무면 꼭 짓고 넘어감 */}
      {(needName || naming) && (
        <NamingSheet open current={naming && !needName ? store.tree.name : ''} kind={store.tree.kind} lastName={needName ? lastName : ''}
          onClose={() => setNaming(false)}
          onSave={n => { actions.renameTree(n); setNaming(false); setLastName(''); }} />
      )}

      {/* 내 보상 */}
      <AceRewardsSheet open={rewardsOpen && screen === 'child'} onClose={() => setRewardsOpen(false)} childName={store.config.childName?.trim()} subject="thinking" badges={BADGES} />

      {/* 번 별 10개마다 축하 */}
      <AnimatePresence>
        {milestone && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setMilestone(null)}>
            <motion.div initial={{ scale: 0.5, y: 40 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 14 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl">
              <div className="text-7xl mb-4">{milestone.hall ? '👑' : milestone.badge ? '🏅' : '🎉'}</div>
              <h2 className={`text-3xl font-black font-display mb-2 ${milestone.hall ? 'text-brand-600' : 'text-slate-900'}`}>
                {milestone.hall ? '명예의 전당 입성!' : milestone.value ? `별 ${milestone.value}개를 모았어!` : '새 뱃지!'}
              </h2>
              {milestone.value > 0 && <p className="text-xs font-bold text-slate-400 mb-2">모든 과목에서 모은 별 {milestone.value}개</p>}
              <p className="text-slate-500 font-medium">
                {milestone.badge
                  ? <>생각 뱃지 <strong className="text-brand-600">‘{milestone.badge}’</strong>를 받았어요!</>
                  : milestone.hall ? <>진정한 에이스야 👑</> : <>정말 대단해! 계속 모아 보자 ⭐</>}
              </p>
              <button onClick={() => setMilestone(null)} className="btn-primary w-full mt-6 py-4 text-lg">좋아! 🙌</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
