/** 부모님 설정 — 다른 에이스(한자·영어)와 같은 틀: 학습 설정 / 찬스와 별 / 학습 기록 */
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight, Database, Eye, Gift, History, Home, KeyRound, Lightbulb, Lock, Settings, SlidersHorizontal, Star, Trash2, XCircle } from 'lucide-react';
import { Config, RoundRecord, Steps } from '../types';
import { COUNT_CHOICES, MIN_ACC, actions, earnedStars, seenTypes, useStore } from '../engine/store';
import { AREAS, ALL_TYPES, AREA_OF, STEP_NAME, TYPE_NAME } from '../engine/areas';
import { STAGES, kindOf, stageOf } from '../engine/tree';
import { HINT_COST, couponState, coupons as aceCoupons, hubPin, mathWishCoupons, useWallet } from '../ace/wallet';
import { AceSaveBar, confirmLeave } from '../ace/SaveBar';
import { goHome } from '../ace/links';
import { toast } from '../components/ui';
import { FREE_HINTS } from './Play';

const Card = ({ children, dim = false }: { children: React.ReactNode; dim?: boolean }) => (
  <section className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 ${dim ? 'opacity-70 hover:opacity-100 transition-opacity' : ''}`}>{children}</section>
);
const Title = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="flex items-center gap-2 text-slate-900 font-bold">{icon}<h3>{children}</h3></div>
);
const Label = ({ children }: { children: React.ReactNode }) => <label className="text-xs font-bold text-slate-400 tracking-wider block">{children}</label>;
const Stepper = ({ value, min, max, onChange, unit }: { value: number; min: number; max: number; onChange: (n: number) => void; unit: string }) => (
  <div className="flex items-center gap-3">
    <button className="w-11 h-11 rounded-xl border-2 border-slate-200 font-black text-slate-500 active:scale-90 disabled:opacity-30" disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
    <span className="font-black text-slate-800 w-16 text-center">{value}{unit}</span>
    <button className="w-11 h-11 rounded-xl border-2 border-slate-200 font-black text-slate-500 active:scale-90 disabled:opacity-30" disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
  </div>
);
const Seg = ({ value, onChange }: { value: number; onChange: (n: number) => void }) => (
  <div className="flex bg-slate-100 p-1 rounded-xl">
    {STEP_NAME.map((n, i) => (
      <button key={i} onClick={() => onChange(i)}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${value === i ? 'bg-white text-trust-600 shadow-sm' : 'text-slate-400'}`}>{n}</button>
    ))}
  </div>
);

const menuName = (m: string) => (m === 'daily' ? '물 주러 가기' : `놀이터 · ${AREAS.find(a => `area:${a.id}` === m)?.name || ''}`);

export default function Parent({ onHome, onPreview }: { onHome: () => void; onPreview: () => void }) {
  const store = useStore();
  const [tab, setTab] = useState<'settings' | 'chance' | 'records'>('settings');
  const [draft, setDraft] = useState<{ config: Config; steps: Steps }>({ config: store.config, steps: store.steps });
  const shown = useRef(store.config);
  useEffect(() => {   // 다른 기기에서 설정이 넘어오면, 고치던 중이 아닐 때만 화면 값도 바꿈
    if (store.config === shown.current) return;
    const prev = shown.current; shown.current = store.config;
    setDraft(d => (JSON.stringify(d.config) === JSON.stringify(prev) ? { ...d, config: store.config } : d));
  }, [store.config]);
  const [newPin, setNewPin] = useState('');
  const [newPeek, setNewPeek] = useState('');
  const [selected, setSelected] = useState<RoundRecord | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify({ config: store.config, steps: store.steps });
  const save = () => { actions.saveConfig(draft.config, draft.steps); toast('설정이 저장되었습니다!'); };
  const setCfg = (p: Partial<Config>) => setDraft(d => ({ ...d, config: { ...d.config, ...p } }));
  const setStep = (types: string[], n: number) => setDraft(d => ({ ...d, steps: { ...d.steps, ...Object.fromEntries(types.map(t => [t, n])) } }));

  const wallet = useWallet();
  const coupons = [...aceCoupons().filter(c => couponState(c) === 'active'), ...mathWishCoupons()];
  const seenN = seenTypes(store).length;

  const exportBackup = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)!;
      if (k.startsWith('thinking_')) data[k] = localStorage.getItem(k) || '';
    }
    const blob = new Blob([JSON.stringify({ app: 'thinking-ace', at: Date.now(), data }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `생각에이스_백업_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed?.app !== 'thinking-ace' || !parsed.data) throw new Error('형식');
        if (!window.confirm('이 기기의 생각 에이스 나무·기록·설정을 백업 파일의 내용으로 바꿉니다.\n\n계속할까요?')) return;
        Object.keys(localStorage).filter(k => k.startsWith('thinking_')).forEach(k => localStorage.removeItem(k));
        for (const [k, v] of Object.entries(parsed.data as Record<string, string>)) if (k.startsWith('thinking_')) localStorage.setItem(k, v);
        location.reload();
      } catch { toast('생각 에이스 백업 파일이 아니에요'); }
    };
    reader.readAsText(file);
  };

  // 기록 요약: 자주 틀린 유형
  const tally: Record<string, { n: number; w: number }> = {};
  store.records.forEach(r => r.items?.forEach(it => { const t = tally[it.k] || (tally[it.k] = { n: 0, w: 0 }); t.n++; if (!it.ok) t.w++; }));
  const weak = Object.entries(tally).filter(([, t]) => t.w > 0).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n).slice(0, 6);

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-24">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => { if (confirmLeave()) onHome(); }} aria-label="아이 홈" className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Home size={20} className="text-slate-600" /></button>
          <h2 className="font-bold text-slate-900">부모님 설정</h2>
        </div>
        <div className="bg-trust-100 text-trust-700 text-[10px] font-black px-2 py-1 rounded-md tracking-wider">ADMIN</div>
      </header>

      <nav className="bg-white border-b border-slate-200 px-6 flex gap-6 overflow-x-auto">
        {([['settings', '학습 설정', <Settings size={16} />], ['chance', '찬스와 별', <Gift size={16} />], ['records', '학습 기록', <History size={16} />]] as const).map(([id, label, icon]) => (
          <button key={id} onClick={() => { setTab(id); setSelected(null); }}
            className={`shrink-0 py-4 text-sm font-bold transition-all border-b-2 ${tab === id ? 'border-trust-600 text-trust-600' : 'border-transparent text-slate-400'}`}>
            <div className="flex items-center gap-2">{icon}{label}{id === 'chance' && coupons.length > 0 && <span className="bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">{coupons.length}</span>}</div>
          </button>
        ))}
      </nav>

      <main className="p-6 max-w-2xl mx-auto">
        {/* ══════════ 학습 설정 ══════════ */}
        {tab === 'settings' && (
          <div className="space-y-6 animate-slide-up">
            <Card>
              <Title icon={<Settings size={18} className="text-trust-600" />}>문제 설정</Title>
              <div className="space-y-3">
                <Label>한 판의 문제 수 ({draft.config.count}문제)</Label>
                <input type="range" min={0} max={COUNT_CHOICES.length - 1} step={1} value={COUNT_CHOICES.indexOf(draft.config.count)}
                  onChange={e => setCfg({ count: COUNT_CHOICES[+e.target.value] })} className="w-full accent-trust-600" />
                <div className="flex justify-between text-[10px] font-bold text-slate-300">{COUNT_CHOICES.map(n => <span key={n}>{n}문제</span>)}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">마지막 한 문제는 도전 문제예요. 5문제 맞힐 때마다 별 1개와 물 한 방울을 받아요. 생각 문제는 한 문제가 오래 걸려서 20문제까지만 둬요.</p>
              </div>
              <div className="space-y-3">
                <Label>물 주러 가기 한 판에 새로 나오는 문제 유형</Label>
                <Stepper value={draft.config.newPer} min={0} max={2} unit="개" onChange={n => setCfg({ newPer: n })} />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  처음 보는 유형은 문제 전에 전략 카드로 먼저 보여 주고, 그 판에서 두 번 나와요. 0으로 두면 만난 유형만 나와요. 처음 한 판은 유형 3개로 시작해요.
                  놀이터는 그 영역 문제만, 소개 없이 바로 나와요. (지금까지 만난 유형 {seenN}/{ALL_TYPES.length})
                </p>
              </div>
            </Card>

            <Card>
              <Title icon={<SlidersHorizontal size={18} className="text-trust-600" />}>난이도</Title>
              <p className="text-sm text-slate-500 leading-relaxed">영역마다 고르고, 필요하면 '자세히'에서 유형별로 바꿔요. 풀면서 두 번 연속 맞히면 그 유형이 한 단계 오르고, 틀리면 한 단계 내려가요.</p>
              <div className="space-y-2">
                {AREAS.map(a => {
                  const vals = [...new Set(a.types.map(t => draft.steps[t]))];
                  const cur = vals.length === 1 ? vals[0] : -1;
                  return (
                    <div key={a.id} className="border border-slate-100 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <span className="font-bold text-slate-700">{a.ic} {a.name}{cur < 0 && <span className="ml-2 text-[11px] text-amber-600">유형마다 다름</span>}</span>
                        <div className="flex items-center gap-2">
                          <Seg value={cur} onChange={n => setStep(a.types, n)} />
                          {a.types.length > 1 && <button className="text-[11px] font-bold text-trust-600" onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? '접기' : '자세히'}</button>}
                        </div>
                      </div>
                      {open === a.id && (
                        <div className="space-y-2 pt-1">
                          {a.types.map(t => (
                            <div key={t} className="flex items-center justify-between gap-3 pl-6">
                              <span className="text-sm text-slate-500">{TYPE_NAME[t]}</span><Seg value={draft.steps[t]} onChange={n => setStep([t], n)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="text-[11px] font-bold text-slate-400 hover:underline" onClick={() => setStep(ALL_TYPES, 0)}>모두 쉬움으로</button>
            </Card>

            <Card>
              <Title icon={<KeyRound size={18} className="text-trust-600" />}>부모님 해설</Title>
              <p className="text-sm text-slate-500 leading-relaxed">
                문제 화면 아래의 「부모님 해설」에서 정답과 풀이를 볼 수 있어요. 아이가 알 수도 있는 부모님 설정 PIN과 따로, <strong className="text-slate-700">해설 PIN</strong>을 정해야 버튼이 보여요.
                한 번 넣으면 그 판이 끝날 때까지 다시 묻지 않아요.
              </p>
              <button onClick={() => setCfg({ peek: !draft.config.peek })}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 flex items-center justify-between gap-3 ${draft.config.peek ? 'border-trust-200 bg-trust-50' : 'border-slate-100 bg-white'}`}>
                <span className={`text-sm font-bold ${draft.config.peek ? 'text-trust-700' : 'text-slate-400'}`}>문제 화면에 「부모님 해설」 버튼 두기</span>
                <span className={`w-11 h-6 rounded-full p-0.5 transition-colors shrink-0 ${draft.config.peek ? 'bg-trust-600' : 'bg-slate-200'}`}>
                  <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${draft.config.peek ? 'translate-x-5' : ''}`} />
                </span>
              </button>
              <div className="space-y-2">
                <Label>해설 PIN (4자리) · {store.peekPin ? '정해 둠' : '아직 안 정함'}</Label>
                <div className="flex gap-2">
                  <input type="password" inputMode="numeric" maxLength={4} className="input-field flex-1 bg-slate-50" placeholder="****"
                    value={newPeek} onChange={e => setNewPeek(e.target.value.replace(/\D/g, ''))} />
                  <button className="btn-secondary px-6" onClick={() => {
                    if (newPeek.length !== 4) { toast('PIN 번호는 4자리여야 합니다.'); return; }
                    if (newPeek === '1234') { toast('처음 PIN(1234)은 쓸 수 없어요.'); return; }
                    if (newPeek === store.pin) { toast('부모님 설정 PIN과 다른 번호로 정해 주세요.'); return; }
                    actions.setPeekPin(newPeek); setNewPeek(''); toast('해설 PIN을 정했어요!');
                  }}>{store.peekPin ? '변경' : '정하기'}</button>
                </div>
              </div>
            </Card>

            <Card>
              <Title icon={<Lightbulb size={18} className="text-amber-500" />}>힌트와 별</Title>
              <div className="space-y-2 text-sm text-slate-500 leading-relaxed">
                <p>판마다 힌트 {FREE_HINTS}번을 무료로 줘요. 그 뒤로는 힌트 한 번에 <strong className="text-slate-700">별 {HINT_COST}개</strong>를 써요. (모든 에이스 같음)</p>
                <p>보기를 고르는 문제가 많아서, 한 판 정답률이 {Math.round(MIN_ACC * 100)}% 미만이면 그 판은 별과 물을 주지 않아요. 결과 화면에서 "천천히 풀면 받을 수 있어"라고 알려 줘요.</p>
              </div>
            </Card>

            <Card>
              <Title icon={<Eye size={18} className="text-trust-600" />}>아이 화면 체험하기</Title>
              <p className="text-sm text-slate-500 leading-relaxed">
                모든 문제 유형이 바로 나오는 아이 화면으로 들어가요. 체험 중에 푼 문제는 별·물·기록·난이도에 남지 않고, 힌트도 별을 쓰지 않아요. 「부모님 해설」은 PIN 없이 열려요.
                화면 위의 「체험 끝내기」를 누르거나 30분이 지나면 아이 모드로 돌아가요.
              </p>
              <button className="btn-secondary w-full flex items-center justify-center gap-2" onClick={() => { if (!confirmLeave()) return; actions.setPreview(true); onPreview(); }}>
                <Eye size={18} />체험 시작
              </button>
            </Card>

            <Card>
              <Title icon={<Star size={18} className="text-amber-400" />}>아이 이름</Title>
              <input type="text" className="input-field bg-slate-50" placeholder="예: 지민" maxLength={10}
                value={draft.config.childName || ''} onChange={e => setCfg({ childName: e.target.value })} />
              <p className="text-[11px] text-slate-400">칭찬에서 아이 이름을 불러 줘요. (선택) 나무 이름은 아이가 홈에서 직접 지어요.</p>
            </Card>

            <div className="pt-10 border-t-2 border-dashed border-slate-200 space-y-6">
              <div className="flex items-center justify-center gap-2">
                <div className="h-px bg-slate-200 flex-1" />
                <div className="text-[10px] font-black text-slate-300 tracking-[0.3em] whitespace-nowrap">SYSTEM</div>
                <div className="h-px bg-slate-200 flex-1" />
              </div>

              <Card dim>
                <Title icon={<Lock size={18} className="text-slate-400" />}>보안 설정</Title>
                <Label>새 PIN 번호 (4자리)</Label>
                <div className="flex gap-2">
                  <input type="password" inputMode="numeric" maxLength={4} className="input-field flex-1 bg-slate-50" placeholder="****"
                    value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} />
                  <button className="btn-secondary px-6" onClick={() => {
                    if (newPin.length !== 4) { toast('PIN 번호는 4자리여야 합니다.'); return; }
                    if (newPin === hubPin()) { toast('에이스 홈 PIN과 다른 번호로 정해 주세요.'); return; }
                    if (newPin === store.peekPin) { toast('해설 PIN과 다른 번호로 정해 주세요.'); return; }
                    actions.setPin(newPin); setNewPin(''); toast('PIN 번호가 변경되었습니다!');
                  }}>변경</button>
                </div>
                <p className="text-[11px] text-slate-400">처음 PIN은 1234입니다. 다른 에이스의 PIN과는 따로 저장됩니다.</p>
              </Card>

              <Card dim>
                <Title icon={<Database size={18} className="text-slate-400" />}>기록 백업</Title>
                <p className="text-sm text-slate-500 leading-relaxed">
                  판 기록(별 계산에 쓰는 것)은 수학 에이스에 연결한 동기화 서버로 올라가서 에이스 홈과 다른 기기에서도 별이 맞게 보여요. 설정과 PIN도 다른 기기와 맞춰져요. 나무·난이도·만난 유형은 이 기기에만 저장되니, 기기를 바꾸기 전에 백업 파일로 내려받아 두세요.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-secondary py-3 text-sm" onClick={exportBackup}>백업 파일 받기</button>
                  <button className="btn-secondary py-3 text-sm" onClick={() => fileRef.current?.click()}>백업 파일 불러오기</button>
                </div>
                <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importBackup} />
              </Card>

              <Card dim>
                <Title icon={<Trash2 size={18} className="text-slate-400" />}>기록 정리</Title>
                <p className="text-sm text-slate-500 leading-relaxed">아이 모드로 시험해 본 기록을 지울 때 써요. 나무와 설정은 남아요. 지운 기록은 되돌릴 수 없어요.</p>
                <button className="btn-secondary w-full py-3 text-sm text-rose-600" onClick={() => {
                  if (!window.confirm('생각 학습 기록을 모두 지울까요?\n\n지우는 것: 판 기록(생각에서 번 별 포함), 난이도 진행, 만난 유형, 스무고개 메달\n남기는 것: 나무, 설정, PIN\n\n힌트로 쓴 별은 모든 과목이 함께 쓰는 장부에 있어서 되돌아오지 않아요.')) return;
                  actions.resetLearning(); setDraft(d => ({ ...d, steps: Object.fromEntries(ALL_TYPES.map(k => [k, 0])) })); toast('생각 학습 기록을 지웠어요');
                }}>생각 학습 기록 모두 지우기 (판 {store.records.length}개)</button>
              </Card>
            </div>
          </div>
        )}

        {/* ══════════ 찬스와 별 (에이스 홈에서) ══════════ */}
        {tab === 'chance' && (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-3 gap-3">
              {([['남은 별 (합산)', wallet.balance, 'text-amber-600'], ['생각에서 번 별', earnedStars(store), 'text-emerald-600'], ['쓴 별 (합산)', wallet.spent, 'text-slate-600']] as const).map(([label, n, color]) => (
                <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
                  <div className={`text-2xl font-black font-display ${color}`}>{n}</div>
                  <div className="text-[11px] font-bold text-slate-400 mt-1">{label}</div>
                </div>
              ))}
            </div>
            <Card>
              <Title icon={<Gift size={18} className="text-trust-600" />}>찬스와 쿠폰은 에이스 홈에서</Title>
              <p className="text-sm text-slate-500 leading-relaxed">
                별은 모든 과목이 함께 쓰는 지갑 하나예요. 찬스 가게, 쿠폰 사용 처리, 잘못 산 쿠폰 되돌리기, 별 장부는 에이스 홈의 부모님 모드에서 해요.
              </p>
              {coupons.length > 0 && <p className="text-sm font-bold text-amber-600">사용을 기다리는 쿠폰 {coupons.length}장</p>}
              <button className="btn-secondary w-full flex items-center justify-center gap-2" onClick={() => goHome()}>
                <Star size={16} className="text-amber-500 fill-amber-500" />에이스 홈 열기
              </button>
            </Card>
          </div>
        )}

        {/* ══════════ 학습 기록 ══════════ */}
        {tab === 'records' && (
          <div className="space-y-4 animate-slide-up">
            {selected ? (
              <div className="space-y-6">
                <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-trust-600 font-bold hover:underline"><ChevronLeft size={20} />목록으로 돌아가기</button>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="text-xl font-black text-slate-900">{menuName(selected.menu)}</h3>
                      <p className="text-sm text-slate-400">{selected.date}</p>
                      <p className="text-xs text-slate-400 mt-1">번 별 {selected.stars}개 · 물 💧{selected.drops} · 무료 힌트 {selected.hintsFree}번 · 별로 본 힌트 {selected.hintsPaid}번{selected.lowAcc ? ' · 정답률이 낮아 별 없음' : ''}</p>
                      {selected.fresh.length > 0 && <p className="text-xs text-slate-400">처음 만난 유형: {selected.fresh.map(k => TYPE_NAME[k]).join(', ')}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-3xl font-black text-trust-600">{selected.correct} / {selected.total}</div>
                      <div className="text-[10px] font-bold text-slate-400 tracking-widest">SCORE</div>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    {selected.items.map((it, i) => (
                      <div key={i} className={`p-3 rounded-2xl border flex justify-between items-center gap-3 ${it.ok ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{i + 1}</span>
                          <span className="min-w-0">
                            <span className="font-bold text-slate-700 block truncate">{TYPE_NAME[it.k]}{it.ch ? ' (도전)' : ''}</span>
                            <span className="text-[11px] text-slate-400 block truncate">{AREA_OF(it.k).name} · {STEP_NAME[it.st]}{it.hint ? ' · 힌트 봄' : ''}{it.clues ? ` · 단서 ${it.clues}개` : ''} · 정답 {it.ans}</span>
                          </span>
                        </div>
                        {it.ok ? <CheckCircle2 size={20} className="text-emerald-500 shrink-0" /> : <XCircle size={20} className="text-rose-500 shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-3 gap-3 text-center">
                  <div><div className="text-xl font-black font-display text-trust-600">💧{store.tree.drops}</div><div className="text-[11px] font-bold text-slate-400">{store.tree.name || '생각나무'} · {STAGES[stageOf(store.tree.drops)].n}</div></div>
                  <div><div className="text-xl font-black font-display text-trust-600">{seenN}/{ALL_TYPES.length}</div><div className="text-[11px] font-bold text-slate-400">만난 문제 유형</div></div>
                  <div><div className="text-xl font-black font-display text-trust-600">🥇{store.medals.gold} 🥈{store.medals.silver} 🥉{store.medals.bronze}</div><div className="text-[11px] font-bold text-slate-400">스무고개 메달</div></div>
                </div>
                {store.tree.forest.length > 0 && <p className="text-xs text-slate-400 px-1">생각 숲: {store.tree.forest.map(t => `${t.name}(${kindOf(t.kind).n})`).join(', ')}</p>}
                {weak.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-900 mb-2">자주 틀린 유형</h3>
                    <div className="flex flex-wrap gap-2">
                      {weak.map(([k, t]) => (
                        <div key={k} className="bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-xs font-bold text-slate-600">{TYPE_NAME[k]} <span className="text-rose-500">· {t.w}/{t.n} 틀림</span></div>
                      ))}
                    </div>
                  </div>
                )}
                {store.records.length === 0 ? (
                  <div className="text-center py-16"><History size={48} className="mx-auto text-slate-200 mb-4" /><p className="text-slate-400 font-medium">아직 학습 기록이 없습니다.</p></div>
                ) : store.records.map(r => (
                  <button key={r.ts} onClick={() => setSelected(r)}
                    className="w-full text-left bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center gap-4 group hover:border-trust-300 transition-all active:scale-[0.98]">
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-slate-900">{menuName(r.menu)} <span className="text-xs font-bold text-amber-500">★ +{r.stars}</span></div>
                      <div className="text-xs text-slate-400 truncate">{r.date}{r.lowAcc ? ' · 정답률이 낮아 별 없음' : ''}</div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-2xl font-black text-trust-600 font-display">{r.correct} / {r.total}</div>
                        <div className="text-[10px] font-bold text-slate-400 tracking-widest">SCORE</div>
                      </div>
                      <ChevronRight size={20} className="text-slate-300 group-hover:text-trust-500" />
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        )}
        <AceSaveBar dirty={dirty} onSave={save} onRevert={() => setDraft({ config: store.config, steps: store.steps })} />
      </main>
    </div>
  );
}
