import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ChevronRight, Droplets, Pencil, Star, Trees } from 'lucide-react';
import { BADGES, seenTypes, useStore } from '../engine/store';
import { useWallet } from '../ace/wallet';
import { AceNav } from '../ace/AceNav';
import { AceRewardCards } from '../ace/Rewards';
import { AREAS } from '../engine/areas';
import { STAGES, isDone, kindOf, stageOf } from '../engine/tree';
import { newCountFor, pickNew } from '../engine/round';
import { StageBar, TreeArt } from '../components/thinking';

interface Props {
  onParent: () => void;
  onDaily: () => void;
  onArea: (id: string) => void;
  onRewards: () => void;
  onForest: () => void;
  onCards: () => void;
  onRename: () => void;
  onPlant: () => void;
}

export default function ChildHome({ onParent, onDaily, onArea, onRewards, onForest, onCards, onRename, onPlant }: Props) {
  const store = useStore();
  const { config, tree } = store;
  const balance = useWallet().balance;
  const st = stageOf(tree.drops);
  const nNew = pickNew(newCountFor(seenTypes(store).length, config.newPer), store.seen).length;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <header className="flex flex-wrap items-center gap-2 mb-6 max-w-lg landscape:max-w-5xl mx-auto w-full">
        <AceNav current="thinking" onParent={onParent} />
        <button onClick={onRewards} aria-label="내 보상 보기"
          className="ml-auto bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-transform">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
            <Star size={18} className="text-amber-500 fill-amber-500" />
          </div>
          <span className="font-black text-slate-700 text-lg font-display">{balance}</span>
          <ChevronRight size={16} className="text-slate-300 -ml-1" />
        </button>
      </header>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg landscape:max-w-5xl mx-auto space-y-6 landscape:space-y-0 landscape:grid landscape:grid-cols-2 landscape:gap-8 landscape:items-start">
        {/* 생각나무 */}
        <div className="bg-gradient-to-b from-sky-50 to-white rounded-[2rem] border border-slate-100 shadow-sm p-5 space-y-2">
          <div>
            <h2 className="text-3xl font-black text-slate-900 font-display flex items-center gap-2">
              {tree.name || '생각나무'}
              <button onClick={onRename} aria-label="나무 이름 바꾸기" className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center active:scale-90"><Pencil size={15} /></button>
            </h2>
            <p className="text-sm font-bold text-emerald-700">{kindOf(tree.kind).n} · {STAGES[st].n}</p>
          </div>
          <TreeArt drops={tree.drops} kind={tree.kind} />
          <StageBar drops={tree.drops} kind={tree.kind} />
          {isDone(tree.drops) && (
            <button className="btn-primary w-full py-4 mt-2" onClick={onPlant}>🌲 생각 숲으로 옮겨 심고 새 씨앗 심기</button>
          )}
        </div>

        <div className="space-y-5">
          <motion.button whileTap={{ scale: 0.97 }} onClick={onDaily}
            className="w-full bg-gradient-to-br from-brand-500 to-brand-700 p-7 landscape:p-6 rounded-[2rem] shadow-xl shadow-brand-200 flex items-center gap-5 text-left">
            <div className="w-16 h-16 bg-white/25 rounded-2xl flex items-center justify-center shrink-0">
              <Droplets size={34} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-black text-white">물 주러 가기</div>
              <div className="text-white/80 text-sm font-medium mt-0.5 break-keep">
                {config.count}문제 · 5문제 맞힐 때마다 물 한 방울{nNew ? ` · 새로운 문제 ${nNew}개` : ''}
              </div>
            </div>
            <ChevronRight size={24} className="text-white/60 shrink-0" />
          </motion.button>

          <div>
            <div className="text-xs font-black text-slate-400 mb-2 px-1">골라 하는 놀이터</div>
            <div className="grid grid-cols-3 gap-3">
              {AREAS.map(a => (
                <motion.button key={a.id} whileTap={{ scale: 0.95 }} onClick={() => onArea(a.id)}
                  className="bg-white border-2 border-slate-200 rounded-3xl p-3 flex flex-col items-center gap-2">
                  <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: a.col + '1f' }}>{a.ic}</span>
                  <span className="text-sm font-black text-slate-700 break-keep text-center">{a.name}</span>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-4 text-sm font-bold text-slate-600 space-y-1">
            <div className="font-black text-slate-800">이렇게 자라요</div>
            <div>💧 한 판에서 5문제 맞힐 때마다 물 한 방울 (별도 한 개)</div>
            <div>🌳 물이 모이면 나무가 한 단계씩 자라요</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={onForest} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 font-black text-slate-700 flex items-center justify-center gap-2 active:scale-95">
              <Trees size={18} className="text-emerald-600" />생각 숲 ({tree.forest.length})
            </button>
            <button onClick={onCards} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 font-black text-slate-700 flex items-center justify-center gap-2 active:scale-95">
              <BookOpen size={18} className="text-brand-500" />전략 카드
            </button>
          </div>

          {/* 내 보상 · 찬스 바꾸기 · 명예의 전당 (모든 에이스 같은 모양) */}
          <AceRewardCards subject="thinking" badges={BADGES} onOpen={onRewards} />
        </div>
      </motion.div>
    </div>
  );
}
