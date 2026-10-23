// 생각 에이스 문제 만들기 — 시제품(2026-10-23)에서 검증한 코드를 그대로 옮김. 그림은 HTML 문자열로 만듦.
// @ts-nocheck

const R={int:(a,b)=>a+Math.floor(Math.random()*(b-a+1)),pick:a=>a[Math.floor(Math.random()*a.length)],
  shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}};
const COLORS=['red','yel','blu','grn','pur'];
const CNAME={red:'빨강',yel:'노랑',blu:'파랑',grn:'초록',pur:'보라'};
const SHAPES=['circle','tri','square','diamond','star'];
const SNAME={circle:'동그라미',tri:'세모',square:'네모',diamond:'마름모',star:'별'};
const tk=(shape,color,size='l',fill='s')=>({shape,color,size,fill});
const key=t=>t?t.shape+'|'+t.color+'|'+t.size+(t.fill==='o'?'|o':'')+(t.rot!=null?'|r'+t.rot:''):null;
const DIR=['위','오른','아래','왼'];
const tname=t=>t.shape==='arrow'?`${DIR[t.rot]}쪽 ${CNAME[t.color]} 화살표`:(t.size==='s'?'작은 ':t.size==='l2'?'큰 ':'')+(t.fill==='o'?'테두리만 있는 ':'')+CNAME[t.color]+' '+SNAME[t.shape];
function distinctTokens(n){const sh=R.shuffle(SHAPES),co=R.shuffle(COLORS);return Array.from({length:n},(_,i)=>tk(sh[i],co[i]));}

// 반복 규칙 검증: 두 번 이상 보이는 모든 반복 길이로 빈칸을 채워 보고, 채운 답이 하나뿐인지 본다
function solveRepeat(keys){
  const n=keys.length,fills=new Set();
  for(let p=1;p*2<=n;p++){
    const rep={};let ok=true;
    for(let i=0;i<n;i++){if(keys[i]==null)continue;const r=i%p;if(rep[r]==null)rep[r]=keys[i];else if(rep[r]!==keys[i]){ok=false;break;}}
    if(!ok)continue;
    const f=[];let full=true;
    for(let i=0;i<n;i++)if(keys[i]==null){const v=rep[i%p];if(v==null){full=false;break;}f.push(v);}
    if(full)fills.add(f.join(','));
  }
  return [...fills];
}
// 수 규칙 검증: 같은 차, 차가 일정하게 바뀜, 몇 배, 앞 두 수의 합 — 어느 규칙으로든 맞는 빈칸 값을 모두 모은다
function numRules(s){
  const ok=[];const d=s.slice(1).map((x,i)=>x-s[i]);
  if(d.every(x=>x===d[0]))ok.push('arith');
  const dd=d.slice(1).map((x,i)=>x-d[i]);if(dd.length>=2&&dd.every(x=>x===dd[0]))ok.push('diff2');
  if(s[0]>0){const r=s[1]/s[0];if(Number.isInteger(r)&&r>1&&s.every((x,i)=>i===0||x===s[i-1]*r))ok.push('geo');}
  if(s.length>=4&&s.every((x,i)=>i<2||x===s[i-1]+s[i-2]))ok.push('fib');
  return ok;
}
function numAnswers(seq){const b=seq.indexOf(null),out=[];for(let v=0;v<=150;v++){const f=seq.slice();f[b]=v;if(numRules(f).length)out.push(v);}return out;}

// 화살표가 시계 방향으로 도는 규칙 (모양 규칙의 다른 모습)
function genArrow(step){
  for(let t=0;t<200;t++){
    const col=R.pick(COLORS),st=R.int(0,3),n=step===1?8:10;
    const by=step===1?1:R.pick([1,2]); // 한 번에 90도 또는 180도
    const full=Array.from({length:n},(_,i)=>{const a=tk('arrow',col,'l2');a.rot=(st+i*by)%4;return a;});
    const b=step===1?R.int(4,7):R.int(5,9),seq=full.map((x,i)=>i===b?null:x);
    const f=solveRepeat(seq.map(key));if(f.length!==1)continue;
    const ans=full[b],opts=[0,1,2,3].map(r=>{const a=tk('arrow',col,'l2');a.rot=r;return a;});
    const prev=full[b-1];
    return {type:'A',step,kind:'choice',seq,full,blanks:[b],unitLen:by===1?4:2,
      prompt:'빈칸에 들어갈 화살표를 골라요. 화살표가 어떻게 도는지 봐요.',
      options:R.shuffle(opts).map(x=>({val:key(x),toks:[x]})),ans:key(ans),answerText:tname(ans),
      mistake:{val:key(prev),text:'앞 화살표와 같은 쪽을 골랐나요? 화살표는 한 칸마다 돌아가요.'},
      hintText:by===1?'화살표가 한 칸마다 시계 방향(오른쪽)으로 한 번씩 돌아요.':'화살표가 한 칸마다 반 바퀴씩 돌아요.',
      solveText:by===1?'시계 방향으로 한 번씩 돌아서 4개마다 다시 처음 방향이 돼요.':'반 바퀴씩 돌아서 2개마다 같은 방향이 돼요.'};
  }
}
function genA(step){
  if(step>0&&Math.random()<.4)return genArrow(step);
  for(let t=0;t<200;t++){
    if(step===0){
      const unit=R.pick(['ABB','AAB','ABC']),T=distinctTokens(3),m={A:T[0],B:T[1],C:T[2]};
      const n=9,full=Array.from({length:n},(_,i)=>m[unit[i%3]]),b=R.int(2,7);
      const seq=full.map((x,i)=>i===b?null:x);
      const f=solveRepeat(seq.map(key));if(f.length!==1)continue;
      const ans=full[b],mk=key(full[b-2])!==key(ans)?full[b-2]:null;
      return {type:'A',step,kind:'choice',seq,full,blanks:[b],unitLen:3,
        prompt:'빈칸에 들어갈 모양을 골라요.',
        options:R.shuffle(T).map(x=>({val:key(x),toks:[x]})),ans:key(ans),answerText:tname(ans),
        mistake:mk?{val:key(mk),text:'두 개씩 반복된다고 생각했나요? 한 묶음은 3개예요.'}:null,
        hintText:'처음 3개를 한 묶음으로 보세요. 이 묶음이 계속 나와요.',solveText:'3개가 한 묶음으로 반복돼요.'};
    }
    if(step===1){
      const unit=R.pick(['ABCC','AABC','ABCB','ABBC']),T=distinctTokens(3),m={A:T[0],B:T[1],C:T[2]};
      const n=12,full=Array.from({length:n},(_,i)=>m[unit[i%4]]),b2=R.int(5,10);
      const seq=full.map((x,i)=>i===0||i===b2?null:x);
      const f=solveRepeat(seq.map(key));if(f.length!==1)continue;
      const a1=full[0],a2=full[b2],ansv=key(a1)+','+key(a2);
      const pairs=[];for(const x of T)for(const y of T){const v=key(x)+','+key(y);if(v!==ansv)pairs.push({val:v,toks:[x,y]});}
      const opts=R.shuffle([{val:ansv,toks:[a1,a2]},...R.shuffle(pairs).slice(0,2)]);
      return {type:'A',step,kind:'choice',seq,full,blanks:[0,b2],unitLen:4,
        prompt:'빈칸 두 곳에 들어갈 모양을 차례로 골라요.',
        options:opts,ans:ansv,answerText:tname(a1)+', '+tname(a2),mistake:null,
        hintText:'뒤쪽에서 반복되는 묶음을 먼저 찾아요. 한 묶음은 4개예요.',solveText:'4개가 한 묶음으로 반복돼요. 맨 앞 빈칸도 같은 묶음의 첫 번째예요.'};
    }
    // 도전: 늘어나는 반복 (묶음 = 고정 1개 + 늘어나는 것 k개), 네 번째 묶음 안쪽에 빈칸
    const T=distinctTokens(3),fx=T[0],gr=T[1];
    const groups=[1,2,3,4],full=[],chunks=[];
    for(const k of groups){const g=[fx,...Array(k).fill(gr)];chunks.push(g.length);full.push(...g);}
    const b=full.length-1,seq=full.map((x,i)=>i===b?null:x);
    const f=solveRepeat(seq.map(key));if(f.some(v=>v!==key(gr)))continue;
    return {type:'A',step,kind:'choice',seq,full,blanks:[b],grow:chunks,
      prompt:'빈칸에 들어갈 모양을 골라요. 잘 보면 무언가 늘어나요.',
      options:R.shuffle(T).map(x=>({val:key(x),toks:[x]})),ans:key(gr),answerText:tname(gr),
      mistake:{val:key(fx),text:'3개에서 다시 시작한다고 생각했나요? 하나씩 늘어나서 이번에는 4개예요.'},
      hintText:CNAME[fx.color]+' '+SNAME[fx.shape]+'에서 끊어서 묶어 보세요. 묶음마다 '+SNAME[gr.shape]+'가 몇 개인지 세어 봐요.',
      solveText:SNAME[gr.shape]+'가 1개, 2개, 3개, 4개로 하나씩 늘어나요.'};
  }
}

function genB(step){
  for(let t=0;t<200;t++){
    let nums,b,mk=null,d;
    if(step===0){
      const desc=Math.random()<.6;d=desc?-1:1;const a=desc?R.int(7,15):R.int(1,12);
      nums=Array.from({length:5},(_,i)=>a+d*i);b=R.int(1,3);
    }else if(step===1){
      d=R.pick([2,3,5]);const a=R.pick([d,d,R.int(1,6)]);
      nums=Array.from({length:5},(_,i)=>a+d*i);b=4;mk={val:nums[3]+1,text:'1씩 커진다고 생각했나요? '+d+'씩 커져요.'};
    }else{
      d=-R.pick([2,3,4]);const a=R.int(-4*d+1,Math.min(30,-4*d+12));
      nums=Array.from({length:5},(_,i)=>a+d*i);b=4;mk={val:nums[3]-1,text:'1씩 작아진다고 생각했나요? '+(-d)+'씩 작아져요.'};
    }
    if(nums.some(x=>x<0))continue;
    const seq=nums.map((x,i)=>i===b?null:x);
    const ans=numAnswers(seq);if(ans.length!==1||ans[0]!==nums[b])continue;
    if(mk&&mk.val===nums[b])mk=null;
    return {type:'B',step,kind:'num',seq,full:nums,blanks:[b],ans:String(nums[b]),answerText:String(nums[b]),
      prompt:'빈칸에 들어갈 수를 써요.',mistake:mk?{val:String(mk.val),text:mk.text}:null,
      hintText:'옆에 있는 두 수가 얼마나 차이 나는지 먼저 봐요.',
      solveText:(d>0?d+'씩 커져요.':(-d)+'씩 작아져요.')};
  }
}

function genC(step){
  for(let t=0;t<200;t++){
    let nums,b,start;
    if(step===0){start=1;const a=R.int(1,6);nums=[a];for(let i=0;i<4;i++)nums.push(nums[i]+start+i);b=4;}
    else if(step===1){start=2;const a=R.int(1,6);nums=[a];for(let i=0;i<4;i++)nums.push(nums[i]+start+i);b=4;}
    else{start=R.pick([1,2]);const a=R.int(1,5);nums=[a];for(let i=0;i<4;i++)nums.push(nums[i]+start+i);b=R.pick([2,3]);}
    const seq=nums.map((x,i)=>i===b?null:x);
    const ans=numAnswers(seq);if(ans.length!==1||ans[0]!==nums[b])continue;
    let mk=null;
    if(b===4){const v=nums[3]+(nums[3]-nums[2]);mk={val:String(v),text:'앞과 같은 만큼 커진다고 생각했나요? 커지는 수가 1씩 더 커져요.'};}
    else{const v=nums[b-1]+(nums[b-1]-nums[b-2]);if(v!==nums[b])mk={val:String(v),text:'앞과 같은 만큼 커진다고 생각했나요? 커지는 수가 1씩 더 커져요.'};}
    return {type:'C',step,kind:'num',seq,full:nums,blanks:[b],ans:String(nums[b]),answerText:String(nums[b]),
      prompt:'빈칸에 들어갈 수를 써요.',mistake:mk,
      hintText:'옆에 있는 두 수의 차이를 차례로 적어 봐요. 그 차이가 어떻게 바뀌나요?',
      solveText:'커지는 수가 +'+start+', +'+(start+1)+', +'+(start+2)+', +'+(start+3)+'처럼 1씩 더 커져요.'};
  }
}

function genD(step){
  for(let t=0;t<200;t++){
    const co=R.shuffle(COLORS),sh=R.shuffle(SHAPES);let full,ans,opts,lines,mk=null,hint;
    if(step===0){
      const A=tk(sh[0],co[0],'l2'),B=tk(sh[0],co[1],'s');
      full=[A,B,A,B,A,B];ans=B;
      opts=[B,tk(sh[0],co[1],'l2'),tk(sh[0],co[0],'s'),A];
      mk={val:key(opts[1]),text:'색만 보았나요? 크기도 같이 바뀌어요.'};
      lines=['색: '+CNAME[co[0]]+', '+CNAME[co[1]]+'이 번갈아 나와요.','크기: 큰 것, 작은 것이 번갈아 나와요.'];
      hint='색과 크기를 따로따로 보세요. 먼저 색만 봐요.';
    }else if(step===1){
      const C=[co[0],co[1]],S=[sh[0],sh[1],sh[2]];
      full=Array.from({length:7},(_,i)=>tk(S[i%3],C[i%2],'l2'));ans=full[6];
      const wrongShape=S[(6+1)%3];
      opts=[ans,tk(S[0],C[1],'l2'),tk(wrongShape,C[0],'l2'),tk(wrongShape,C[1],'l2')];
      mk={val:key(opts[1]),text:'모양만 보았나요? 색도 같이 봐야 해요.'};
      lines=['색: '+CNAME[C[0]]+', '+CNAME[C[1]]+'이 번갈아 나와요 (2개 묶음).','모양: '+S.map(x=>SNAME[x]).join(', ')+' 순서로 반복돼요 (3개 묶음).'];
      hint='색과 모양을 따로따로 보세요. 색은 몇 개씩, 모양은 몇 개씩 반복되나요?';
    }else{
      const C=[co[0],co[1]],Z=['l2','s','s'];
      full=Array.from({length:7},(_,i)=>tk(sh[0],C[i%2],Z[i%3]));ans=full[6];
      opts=[ans,tk(sh[0],C[0],'s'),tk(sh[0],C[1],'l2'),tk(sh[0],C[1],'s')];
      mk={val:key(opts[1]),text:'색만 보았나요? 크기는 큰 것 하나, 작은 것 둘로 반복돼요.'};
      lines=['색: '+CNAME[C[0]]+', '+CNAME[C[1]]+'이 번갈아 나와요 (2개 묶음).','크기: 큰 것, 작은 것, 작은 것 순서로 반복돼요 (3개 묶음).'];
      hint='색과 크기를 따로따로 보세요. 크기는 큰 것 다음에 작은 것이 몇 개 나오나요?';
    }
    const b=full.length-1;
    // 속성마다 따로 검증
    const okAttr=['color','shape','size'].every(a=>{const ks=full.map((x,i)=>i===b?null:x[a]);const f=solveRepeat(ks);
      return f.length===1&&f[0]===String(ans[a]);});
    if(!okAttr)continue;
    const keys=opts.map(key);if(new Set(keys).size!==4)continue;
    return {type:'D',step,kind:'choice',seq:full.map((x,i)=>i===b?null:x),full,blanks:[b],
      prompt:'빈칸에 들어갈 것을 골라요.',options:R.shuffle(opts).map(x=>({val:key(x),toks:[x]})),
      ans:key(ans),answerText:tname(ans),mistake:mk,hintText:hint,lines,solveText:'두 가지를 따로 보면 답이 보여요.'};
  }
}
const GEN={A:genA,B:genB,C:genC,D:genD};


const FILL={red:'#E5484D',yel:'#F2B705',blu:'#3B7DF5',grn:'#24A35A',pur:'#8B5CF6'};
function shapeSVG(t){
  if(t.shape==='arrow')return `<svg viewBox="0 0 40 40" role="img" aria-label="${tname(t)}"><g transform="rotate(${t.rot*90} 20 20)"><polygon points="20,3 34,19 25,19 25,37 15,37 15,19 6,19" fill="${FILL[t.color]}" stroke="rgba(0,0,0,.18)" stroke-width="1.5" stroke-linejoin="round"/></g></svg>`;
  const s=t.size==='s'?0.55:1,c=20,r=17*s,o=t.fill==='o',f=o?'none':FILL[t.color],st=o?`stroke="${FILL[t.color]}" stroke-width="3.5"`:'stroke="rgba(0,0,0,.18)" stroke-width="1.5"';
  let g='';
  if(t.shape==='circle')g=`<circle cx="${c}" cy="${c}" r="${r}" fill="${f}" ${st}/>`;
  else if(t.shape==='square')g=`<rect x="${c-r*0.88}" y="${c-r*0.88}" width="${r*1.76}" height="${r*1.76}" rx="${3*s}" fill="${f}" ${st}/>`;
  else if(t.shape==='tri')g=`<polygon points="${c},${c-r} ${c+r*0.95},${c+r*0.8} ${c-r*0.95},${c+r*0.8}" fill="${f}" ${st} stroke-linejoin="round"/>`;
  else if(t.shape==='diamond')g=`<polygon points="${c},${c-r} ${c+r*0.8},${c} ${c},${c+r} ${c-r*0.8},${c}" fill="${f}" ${st}/>`;
  else{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*0.45:r;p.push((c+rr*Math.cos(a)).toFixed(1)+','+(c+rr*Math.sin(a)+1).toFixed(1));}
    g=`<polygon points="${p.join(' ')}" fill="${f}" ${st} stroke-linejoin="round"/>`;}
  return `<svg viewBox="0 0 40 40" role="img" aria-label="${tname(t)}">${g}</svg>`;
}
const blankSVG=`<svg viewBox="0 0 40 40" aria-label="빈칸"><rect x="3" y="3" width="34" height="34" rx="8" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 4"/><text x="20" y="27" text-anchor="middle" font-size="20" fill="var(--accent)" font-family="Fredoka,sans-serif" font-weight="700">?</text></svg>`;
const tokHTML=(t,cls='')=>`<span class="tok ${cls}">${t?shapeSVG(t):blankSVG}</span>`;
function optInner(o){return o.toks.map(t=>tokHTML(t)).join(o.toks.length>1?'<span class="comma">,</span>':'');}
function miniToks(val){return '<span class="mini">'+val.split(',').map(k=>{const p=k.split('|'),t=tk(p[0],p[1],p[2],p.includes('o')?'o':'s');const r=p.find(x=>/^r\d$/.test(x));if(r)t.rot=+r[1];return tokHTML(t);}).join('')+'</span>';}


// ===================== 공통 도우미 =====================
function jong(w){w=String(w);const last=w[w.length-1];
  if(/[0-9]/.test(last)){const n=parseInt(w.match(/\d+$/)[0],10);if(n%10!==0)return [1,1,0,1,0,0,1,1,1,0][n%10];return 1;}
  const c=last.charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3)return (c-0xAC00)%28!==0?1:0;return 0;}
const J=(w,a,b)=>w+(jong(w)?a:b);
function permutations(a){if(a.length<=1)return [a.slice()];const o=[];a.forEach((x,i)=>{for(const p of permutations(a.filter((_,j)=>j!==i)))o.push([x,...p]);});return o;}
const choose=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-k+i)/i;return Math.round(r);};
const blankBox='<span class="box">?</span>';
const CADJ={red:'빨간색',yel:'노란색',blu:'파란색',grn:'초록색',pur:'보라색'};
const optTok=(t,i)=>({val:key(t),html:tokHTML(t)});
function distinctOpts(list){const seen=new Set();for(const o of list){if(seen.has(o.val))return false;seen.add(o.val);}return true;}

// ===================== 규칙 탐정 =====================
function numsHTML(seq){return `<div class="nums">${seq.map((x,i)=>`<span class="num ${x==null?'blank':''}">${x==null?'?':x}</span>`+(i<seq.length-1?'<span class="comma">,</span>':'')).join('')}</div>`;}
function chunksHTML(q,onlyFirst){
  const out=[];let i=0;
  const sizes=q.grow?q.grow:Array(Math.ceil(q.full.length/q.unitLen)).fill(q.unitLen);
  sizes.forEach((n,ci)=>{const part=[];for(let j=0;j<n&&i<q.full.length;j++,i++){const isB=q.blanks.includes(i);
      part.push(onlyFirst?tokHTML(isB?null:q.full[i]):tokHTML(q.full[i],isB?'hl':''));}
    out.push(`<span class="chunk ${onlyFirst&&ci>0?'dim':''}">${part.join('')}</span>`);});
  return `<div class="chunks">${out.join('')}</div>`;
}
function arrowsHTML(q,onlyFirst){
  const f=q.full,parts=[];
  f.forEach((x,i)=>{const isB=q.blanks.includes(i);
    parts.push(`<span class="n ${!onlyFirst&&isB?'hl':''}">${onlyFirst&&isB?'?':x}</span>`);
    if(i<f.length-1){const d=f[i+1]-x,show=!onlyFirst||(i===0&&!q.blanks.includes(0)&&!q.blanks.includes(1));
      parts.push(`<span class="d ${show?'':'q'}">${show?(d>0?'+'+d:d):'?'}</span>`);}});
  return `<div class="arrows">${parts.join('')}</div>`;
}
function wrapRule(key_,raw){
  const q=raw;q.key=key_;
  if(q.kind==='choice'){
    q.stemHTML=`<div class="seq">${q.seq.map(t=>tokHTML(t)).join('')}</div>`;
    q.options=q.options.map(o=>({val:o.val,html:optInner(o)}));q.ansHTML=miniToks(q.ans);
  }else q.stemHTML=numsHTML(q.seq);
  let pic='';
  if(key_==='RA')pic=chunksHTML(q,false);
  else if(key_==='RD')pic=`<div class="seq">${q.full.map((t,i)=>tokHTML(t,i===q.full.length-1?'hl':'')).join('')}</div><div>${q.lines.map(l=>'· '+l).join('<br>')}</div>`;
  else pic=arrowsHTML(q,false);
  q.solveHTML=`<div>${q.solveText}</div>${pic}`;
  let hp='';if(key_==='RA')hp=chunksHTML(q,true);else if(key_==='RB')hp=arrowsHTML(q,true);
  q.hintHTML=`<div>${q.hintText}</div>${hp}`;
  return q;
}
// 수 규칙: 쉬움 1씩(가운데 빈칸), 보통 2·3·5씩, 도전 차가 1씩 커지기
function genRB(step){const raw=step===0?genB(0):step===1?genB(1):genC(0);raw.step=step;return wrapRule('RB',raw);}

// 매트릭스 규칙 (3×3 그림 표)
function matrixHTML(g,blank,hl){
  return `<div class="mtx">${g.map((row,r)=>row.map((t,c)=>{const isB=blank&&r===blank[0]&&c===blank[1];
    const h=hl&&(hl==='all'||(hl.r===r||hl.c===c));
    return `<span class="mc ${h?'hl':''} ${isB?'q':''}">${isB?blankSVG:shapeSVG(t)}</span>`;}).join('')).join('')}</div>`;
}
function genRM(step){
  for(let t=0;t<300;t++){
    const sh=R.shuffle(SHAPES).slice(0,3),co=R.shuffle(COLORS).slice(0,3);let g;
    if(step<2)g=[0,1,2].map(r=>[0,1,2].map(c=>tk(sh[r],co[c],'l2')));
    else{const base=[[0,1,2],[1,2,0],[2,0,1]],rp=R.shuffle([0,1,2]),cp=R.shuffle([0,1,2]);
      g=[0,1,2].map(r=>[0,1,2].map(c=>tk(sh[base[rp[r]][cp[c]]],co[c],'l2')));}
    const b=step===0?[2,2]:[R.int(0,2),R.int(0,2)],ans=g[b[0]][b[1]];
    // 검증: 가로줄의 나머지 두 칸과 세로줄의 나머지 두 칸만으로 답이 정해지는지
    const rowO=[0,1,2].filter(c=>c!==b[1]).map(c=>g[b[0]][c]),colO=[0,1,2].filter(r=>r!==b[0]).map(r=>g[r][b[1]]);
    if(colO[0].color!==colO[1].color)continue;
    const shapeFromRow=step<2?(rowO[0].shape===rowO[1].shape?rowO[0].shape:null):sh.find(s=>!rowO.some(x=>x.shape===s));
    if(shapeFromRow!==ans.shape||colO[0].color!==ans.color)continue;
    const oc=co.find(c=>c!==ans.color),os=sh.find(s=>s!==ans.shape);
    const opts=[ans,tk(os,ans.color,'l2'),tk(ans.shape,oc,'l2'),tk(os,oc,'l2')];
    if(!distinctOpts(opts.map(optTok)))continue;
    const rowRule=step<2?`가로줄은 모두 ${J(SNAME[ans.shape],'이에요','예요')}`:`가로줄마다 ${sh.map(s=>SNAME[s]).join(', ')}가 하나씩 있어요. 이 줄에 없는 것은 ${J(SNAME[ans.shape],'이에요','예요')}`;
    return {key:'RM',step,kind:'choice',prompt:'표의 규칙을 찾아 ?에 들어갈 것을 골라요.',stemHTML:matrixHTML(g,b),
      options:R.shuffle(opts).map(optTok),ans:key(ans),ansHTML:tokHTML(ans),answerText:tname(ans),
      mistake:{val:key(opts[2]),text:'모양은 맞았어요. 세로줄의 색 규칙도 같이 봐요.'},
      hintHTML:`<div>?가 있는 가로줄과 세로줄을 따로 봐요. 가로줄끼리 무엇이 같은지, 세로줄끼리 무엇이 같은지 찾아요.</div>${matrixHTML(g,b,{r:b[0],c:b[1]})}`,
      solveHTML:`<div>${rowRule}. 세로줄은 모두 ${J(CADJ[ans.color],'이에요','예요')}. 그래서 ${J(tname(ans),'이에요','예요')}.</div>${matrixHTML(g,null,{r:b[0],c:b[1]})}`};
  }
}
// 도형 관계: A → B 처럼 C → ?
const relCard=(c)=>`<span class="rcard">${Array(c.n).fill(0).map(()=>shapeSVG(c.t)).join('')}</span>`;
const TR={
  size:{f:c=>({t:tk(c.t.shape,c.t.color,'s',c.t.fill),n:c.n}),txt:'크기가 작아졌어요'},
  fill:{f:c=>({t:tk(c.t.shape,c.t.color,c.t.size,'o'),n:c.n}),txt:'속이 비었어요 (테두리만 남았어요)'},
  count:{f:c=>({t:c.t,n:c.n*2}),txt:'개수가 두 배가 되었어요'},
};
const cardKey=c=>key(c.t)+'x'+c.n;
function genRR(step){
  for(let t=0;t<300;t++){
    const sh=R.shuffle(SHAPES),co=R.shuffle(COLORS);
    let trs,A,C;
    A={t:tk(sh[0],co[0],'l2'),n:1};C={t:tk(sh[1],step===0?co[1]:co[0],'l2'),n:1};
    if(step===0)trs=[R.pick(['size','fill'])];
    else if(step===1)trs=[R.pick(['color','count'])];
    else trs=R.pick([['size','color'],['fill','count'],['size','count'],['fill','color']]);
    const c2=co[2];
    const apply=(card,list)=>list.reduce((x,k)=>k==='color'?{t:tk(x.t.shape,x.t.color===co[0]?c2:x.t.color,x.t.size,x.t.fill),n:x.n}:TR[k].f(x),card);
    const B=apply(A,trs),D=apply(C,trs);
    let opts=[D,C,B];
    if(step>0){opts.push(trs.length>1?apply(C,[trs[0]]):{t:tk(C.t.shape,co[3],C.t.size,C.t.fill),n:C.n});}
    if(step===2)opts[2]=apply(C,[trs[1]]);
    const keys=opts.map(cardKey);if(new Set(keys).size!==keys.length)continue;
    const txt=trs.map(k=>k==='color'?`${CADJ[co[0]]}이 ${J(CADJ[c2],'으로','로')} 바뀌었어요`:TR[k].txt);
    const o=R.shuffle(opts);
    return {key:'RR',step,kind:'choice',prompt:'위의 두 그림처럼 똑같이 바꾸면 ?는 무엇일까요?',
      stemHTML:`<div class="rel"><div class="rrow">${relCard(A)}<span class="rarr">→</span>${relCard(B)}</div><div class="rrow">${relCard(C)}<span class="rarr">→</span><span class="rcard q">${blankSVG}</span></div></div>`,
      options:o.map(c=>({val:cardKey(c),html:relCard(c)})),ans:cardKey(D),ansHTML:relCard(D),answerText:txt.join(', ')+' → 같은 변화',
      mistake:{val:cardKey(C),text:'그대로 두었나요? 위에서 바뀐 것을 아래에도 똑같이 바꿔야 해요.'},
      hintHTML:`<div>위의 두 그림을 비교해 봐요. 크기, 색, 속 칠하기, 개수 가운데 무엇이 바뀌었나요?</div>`,
      solveHTML:`<div>위에서는 ${txt.join(', 그리고 ')}. 아래도 똑같이 바꾸면</div><div class="rrow">${relCard(C)}<span class="rarr">→</span>${relCard(D)}</div>`};
  }
}

// ===================== 도형·공간 =====================
// 똑같이 색칠하기 (거울 대칭)
const PAINT=['#14a0a8','#f2a20c'];
function paintGridHTML(q,cells,opts={}){ // cells: 전체 w×h 값 (0 없음, 1·2 색)
  const {w,h}=q;let s=`<div class="pgrid" style="grid-template-columns:repeat(${w},1fr)">`;
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){const v=cells[r*w+c],right=c>=w/2;
    const cls=['pc',right?'r':'l',c===w/2?'mid':'',opts.hlRow===r&&right?'hlrow':''].join(' ');
    const st=v?`background:${PAINT[v-1]}`:'';
    s+=opts.tap&&right?`<button class="${cls}" data-cell="${r*w+c}" style="${st}" aria-label="${r+1}줄 ${c+1}칸"></button>`:`<span class="${cls}" style="${st}"></span>`;}
  return s+'</div>';
}
function genG1(step){
  for(let t=0;t<300;t++){
    const h=step===0?3:4,w=step===0?4:6,half=w/2,nc=step===2?2:1;
    const left=Array.from({length:h*half},()=>Math.random()<.45?R.int(1,nc):0);
    const filled=left.filter(Boolean).length;if(filled<(step===0?3:5)||filled>(step===0?4:8))continue;
    if(nc===2&&(!left.includes(1)||!left.includes(2)))continue;
    const full=Array(h*w).fill(0),mirror=Array(h*w).fill(0),copy=Array(h*w).fill(0);
    for(let r=0;r<h;r++)for(let c=0;c<half;c++){const v=left[r*half+c];full[r*w+c]=v;mirror[r*w+c]=v;copy[r*w+c]=v;
      mirror[r*w+(w-1-c)]=v;copy[r*w+half+c]=v;}
    const ser=a=>a.map((v,i)=>i%w>=half?v:'').join('');
    if(ser(mirror)===ser(copy))continue; // 그대로 옮겨도 같으면 대칭 연습이 안 됨
    const q={key:'G1',step,kind:'paint',w,h,given:full,nc,prompt:'가운데 선을 거울이라고 생각하고, 오른쪽을 똑같이 색칠해요. 칸을 누를 때마다 색이 '+(nc===2?'바뀌어요 (두 색).':'칠해지거나 지워져요.'),
      ans:ser(mirror),answerText:'오른쪽 그림 (부모님 창 풀이 참고)',
      mistake:{val:ser(copy),text:'그대로 옮겨 그렸나요? 거울에 비치면 왼쪽과 오른쪽이 바뀌어요. 선에 붙은 칸은 선에 붙은 칸끼리 같아요.'}};
    q.stemHTML=null;
    const r0=mirror.slice(0);
    q.hintHTML=`<div>선에서 가까운 칸부터 봐요. 첫째 줄은 이렇게 칠해요.</div>${paintGridHTML(q,full.map((v,i)=>i<w?r0[i]:v),{hlRow:0})}`;
    q.solveHTML=`<div>거울처럼 접으면 왼쪽과 오른쪽이 꼭 겹쳐요.</div>${paintGridHTML(q,mirror)}`;
    q.ansHTML=paintGridHTML(q,mirror);
    return q;
  }
}
// 돌린 모양 찾기
const POLY={L4:[[0,0],[1,0],[2,0],[2,1]],S4:[[0,1],[0,2],[1,0],[1,1]],L5:[[0,0],[1,0],[2,0],[3,0],[3,1]],P5:[[0,0],[0,1],[1,0],[1,1],[2,0]],
  Y5:[[0,0],[1,0],[2,0],[3,0],[1,1]],F5:[[0,1],[0,2],[1,0],[1,1],[2,1]],N5:[[0,0],[1,0],[1,1],[2,1],[3,1]]};
const norm=cs=>{const mr=Math.min(...cs.map(c=>c[0])),mc=Math.min(...cs.map(c=>c[1]));return cs.map(([r,c])=>[r-mr,c-mc]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);};
const pkey=cs=>norm(cs).map(c=>c.join(',')).join(';');
const rot=cs=>norm(cs.map(([r,c])=>[c,-r]));
const flip=cs=>norm(cs.map(([r,c])=>[r,-c]));
const rots=cs=>{const o=[norm(cs)];for(let i=0;i<3;i++)o.push(rot(o[o.length-1]));return o;};
function polySVG(cs,color,mark){
  const n=norm(cs),R_=Math.max(...n.map(c=>c[0]))+1,C_=Math.max(...n.map(c=>c[1]))+1,u=16;
  return `<span class="poly"><svg viewBox="-2 -2 ${C_*u+4} ${R_*u+4}" style="width:${C_*u*1.6+6}px">${n.map(([r,c])=>`<rect x="${c*u}" y="${r*u}" width="${u}" height="${u}" rx="2" fill="${color}" stroke="#fff" stroke-width="1.5"/>`).join('')}</svg></span>`;
}
function genG2(step){
  for(let t=0;t<200;t++){
    const name=step===0?R.pick(['L4','S4']):step===1?R.pick(['L5','P5','Y5']):R.pick(['F5','N5']);
    const base=R.pick(rots(POLY[name])),rs=rots(base),fs=rots(flip(base));
    const rk=new Set(rs.map(pkey));if(fs.some(f=>rk.has(pkey(f))))continue;
    const k=R.int(1,3),ans=rs[k];
    let wrong=R.shuffle(fs).filter((f,i,a)=>a.findIndex(x=>pkey(x)===pkey(f))===i);
    let opts=[ans];
    if(step===0){opts.push(wrong[0]);const other=R.pick(Object.keys(POLY).filter(x=>x!==name&&POLY[x].length===POLY[name].length));opts.push(R.pick(rots(POLY[other])));}
    else{opts.push(...wrong.slice(0,step===1?2:3));if(step===1){const other=R.pick(Object.keys(POLY).filter(x=>x!==name&&POLY[x].length===POLY[name].length));opts.push(R.pick(rots(POLY[other])));}}
    opts=opts.slice(0,4);
    const keys=opts.map(pkey);if(new Set(keys).size!==keys.length)continue;
    if(keys.slice(1).some(x=>rk.has(x)))continue;
    const col='#149fa6';
    return {key:'G2',step,kind:'choice',prompt:'왼쪽 모양을 돌리기만 했어요 (뒤집지 않았어요). 어느 것일까요?',
      stemHTML:`<div class="g2">${polySVG(base,col)}<span class="rarr">↻</span><span class="rcard q">${blankSVG}</span></div>`,
      options:R.shuffle(opts).map(o=>({val:pkey(o),html:polySVG(o,col)})),ans:pkey(ans),ansHTML:polySVG(ans,col),answerText:`${k*90}도 돌린 모양`,
      mistake:{val:pkey(wrong[0]),text:'뒤집은 모양이에요. 종이를 뒤집지 않고 돌리기만 하면 이렇게 될 수 없어요.'},
      hintHTML:`<div>모양을 오른쪽으로 한 번씩 돌려 봐요. 튀어나온 부분이 어느 쪽으로 가는지 따라가요.</div><div class="g2">${polySVG(rs[0],col)}<span class="rarr">↻</span>${polySVG(rs[1],col)}</div>`,
      solveHTML:`<div>오른쪽으로 한 번 돌릴 때마다 이렇게 바뀌어요.</div><div class="g2">${rs.map((x,i)=>`<span class="${i===k?'hlbox':''}">${polySVG(x,col)}</span>`).join('<span class="rarr">↻</span>')}</div><div>${k}번 돌린 모양이 답이에요.</div>`};
  }
}
// 빈 조각 맞추기
const PCOL=['#3B7DF5','#F2B705','#E5484D'];
const PATS=[
  {s:0,f:(r,c)=>r%2,n:'가로 줄무늬'},{s:0,f:(r,c)=>c%2,n:'세로 줄무늬'},
  {s:1,f:(r,c)=>(r+c)%2,n:'바둑판 무늬'},{s:1,f:(r,c)=>r%3,n:'세 색 가로 줄무늬'},
  {s:2,f:(r,c)=>(r+c)%3,n:'비스듬한 줄무늬'},{s:2,f:(r,c)=>((r-c)%3+3)%3,n:'반대쪽으로 비스듬한 줄무늬'}];
function tilesHTML(cells,cols,miss,pcols,mode){ // mode: 'nb' 빈곳 둘레 표시, 'fill' 채워서 보이기
  let s=`<div class="tgrid" style="grid-template-columns:repeat(${cols},1fr)">`;
  const inM=(r,c)=>miss&&r>=miss[0]&&r<miss[0]+2&&c>=miss[1]&&c<miss[1]+2;
  cells.forEach((v,i)=>{const r=Math.floor(i/cols),c=i%cols,m=inM(r,c);
    const nb=mode==='nb'&&!m&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>inM(r+a,c+b));
    s+=m&&mode!=='fill'?`<span class="tc miss"></span>`:`<span class="tc ${m?'hl':''} ${nb?'nb':''}" style="background:${pcols[v]}"></span>`;});
  return s+'</div>';
}
const pieceHTML=(p,pcols)=>`<span class="piece">${p.map(v=>`<span style="background:${pcols[v]}"></span>`).join('')}</span>`;
function genG3(step){
  for(let t=0;t<200;t++){
    const pat=R.pick(PATS.filter(p=>p.s===step)),N=4,pcols=R.shuffle(PCOL);
    const cells=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)cells.push(pat.f(r,c));
    const m=[R.int(0,2),R.int(0,2)];
    const piece=(r0,c0,f)=>[f(r0,c0),f(r0,c0+1),f(r0+1,c0),f(r0+1,c0+1)];
    const ans=piece(m[0],m[1],pat.f);
    const cands=[piece(m[0]+1,m[1],pat.f),piece(m[0],m[1]+1,pat.f),[ans[1],ans[0],ans[3],ans[2]],[ans[2],ans[3],ans[0],ans[1]],ans.map(v=>(v+1)%3),ans.map(v=>v===0?1:v===1?0:v),[ans[0],ans[0],ans[0],ans[0]],[ans[3],ans[3],ans[3],ans[3]]];
    const seen=new Set([ans.join('')]);const wrong=[];for(const c of R.shuffle(cands)){const k=c.join('');if(!seen.has(k)){seen.add(k);wrong.push(c);}}
    if(wrong.length<(step===0?2:3))continue;
    const opts=[ans,...wrong.slice(0,step===0?2:3)];
    return {key:'G3',step,kind:'choice',prompt:'그림에서 빠진 조각을 찾아요.',stemHTML:tilesHTML(cells,N,m,pcols),
      options:R.shuffle(opts).map(p=>({val:p.join(''),html:pieceHTML(p,pcols)})),ans:ans.join(''),ansHTML:pieceHTML(ans,pcols),answerText:'빠진 자리와 이어지는 조각',
      mistake:{val:wrong[0].join(''),text:'빈 곳 바로 옆 칸과 색이 이어지는지 확인해요.'},
      hintHTML:`<div>빈 곳 바로 옆 칸(굵은 테두리)의 색을 봐요. 그 색이 빈 곳으로 똑같이 이어져요.</div>${tilesHTML(cells,N,m,pcols,'nb')}`,
      solveHTML:`<div>무늬가 끊기지 않게 이어 보면 빈 곳은 이렇게 채워져요.</div>${tilesHTML(cells,N,m,pcols,'fill')}`};
  }
}
// 쌓기나무 세기
function blocksSVG(H,labels){ // H[y][x] 높이, y=0 뒷줄
  const cw=26,ch=15,hh=30,cubes=[];
  H.forEach((row,y)=>row.forEach((hgt,x)=>{for(let z=0;z<hgt;z++)cubes.push([x,y,z]);}));
  cubes.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1])||a[2]-b[2]);
  const P=(x,y,z)=>[(x-y)*cw,(x+y)*ch-z*hh];
  let g='';const all=[];
  for(const [x,y,z] of cubes){const pts=a=>a.map(p=>P(...p)).map(p=>p.join(',')).join(' ');
    g+=`<polygon points="${pts([[x,y,z+1],[x+1,y,z+1],[x+1,y+1,z+1],[x,y+1,z+1]])}" fill="#a6e9ea" stroke="#0e5f66" stroke-width="1.2"/>`;
    g+=`<polygon points="${pts([[x,y+1,z],[x+1,y+1,z],[x+1,y+1,z+1],[x,y+1,z+1]])}" fill="#33bcc2" stroke="#0e5f66" stroke-width="1.2"/>`;
    g+=`<polygon points="${pts([[x+1,y,z],[x+1,y+1,z],[x+1,y+1,z+1],[x+1,y,z+1]])}" fill="#0e828a" stroke="#0e5f66" stroke-width="1.2"/>`;
    all.push(P(x,y,z),P(x+1,y+1,z+1),P(x,y+1,z),P(x+1,y,z+1),P(x,y,z+1),P(x+1,y+1,z));}
  if(labels)H.forEach((row,y)=>row.forEach((hgt,x)=>{if(!hgt)return;const [px,py]=P(x+0.5,y+0.5,hgt);
    g+=`<circle cx="${px}" cy="${py-16}" r="11" fill="#fff" stroke="#0e828a" stroke-width="2"/><text x="${px}" y="${py-11}" text-anchor="middle" font-size="13" font-weight="700" fill="#0f172a">${hgt}</text>`;
    all.push([px,py-30]);}));
  const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]),x0=Math.min(...xs)-4,y0=Math.min(...ys)-4,W=Math.max(...xs)-x0+8,Ht=Math.max(...ys)-y0+8;
  return `<div class="blocks"><svg viewBox="${x0} ${y0} ${W} ${Ht}" style="width:${Math.min(W*1.5,340)}px">${g}</svg></div>`;
}
function genG4(step){
  for(let t=0;t<200;t++){
    let H;
    if(step===0){const n=R.int(2,4);H=[Array.from({length:n},()=>R.int(1,2))];}
    else if(step===1){const n=R.int(3,4);H=[Array.from({length:n},()=>R.int(1,3))];}
    else{const n=R.int(2,3);const back=Array.from({length:n},()=>R.int(1,3));H=[back,back.map(()=>R.int(0,1))];}
    const total=H.flat().reduce((a,b)=>a+b,0);
    if(step===0&&(total<3||total>6))continue;if(step===1&&(total<6||total>10))continue;if(step===2&&(total<5||total>10||H[1].every(v=>!v)||H[0].every(v=>v===1)))continue;
    const towers=H.flat().filter(Boolean);
    let mk={val:String(towers.length),text:'탑의 수만 세었나요? 탑마다 몇 층인지 세어 더해요.'};if(mk.val===String(total))mk=null;
    return {key:'G4',step,kind:'num',prompt:step===2?'쌓기나무는 모두 몇 개일까요? 위에 있는 쌓기나무 아래에는 보이지 않아도 쌓기나무가 받치고 있어요.':'쌓기나무는 모두 몇 개일까요?',
      stemHTML:blocksSVG(H),ans:String(total),answerText:String(total),mistake:mk,
      hintHTML:'<div>탑 하나씩, 아래에서부터 세어 봐요. 높은 탑은 위에서부터 아래까지 몇 층인지 봐요.</div>',
      solveHTML:`<div>탑마다 층수를 적으면 ${towers.join(' + ')} = ${J(total,'이에요','예요')}.</div>${blocksSVG(H,true)}`};
  }
}

// ===================== 퍼즐 =====================
const FRUITS=[['사과','🍎'],['바나나','🍌'],['딸기','🍓'],['포도','🍇'],['귤','🍊'],['수박','🍉']];
function seesawHTML(L,Rt,tilt){
  // 간단하고 확실한 방법: 판을 기울여 그리고 그 위에 과일을 얹음
  const a=tilt*12;
  return `<div class="ss"><div class="ssbeam" style="transform:rotate(${a}deg)"><span class="ssl">${L.join('')}</span><span class="ssr">${Rt.join('')}</span></div><div class="ssbase"></div></div>`;
}
function genZ1(step){
  for(let t=0;t<200;t++){
    if(step===0){
      const fr=R.shuffle(FRUITS).slice(0,3); // fr[0]이 가장 무거움
      const pairs=R.shuffle([[0,1],[1,2]]);
      const shown=pairs.map(([h,l])=>{const left=Math.random()<.5;return left?seesawHTML([fr[h][1]],[fr[l][1]],-1):seesawHTML([fr[l][1]],[fr[h][1]],1);});
      const ask=R.pick(['most','least']),ans=ask==='most'?fr[0]:fr[2];
      const ok=permutations([0,1,2]).filter(p=>pairs.every(([h,l])=>p.indexOf(h)<p.indexOf(l)));if(new Set(ok.map(p=>ask==='most'?p[0]:p[2])).size!==1)continue;
      return {key:'Z1',step,kind:'choice',prompt:`시소는 무거운 쪽이 내려가요. 가장 ${ask==='most'?'무거운':'가벼운'} 과일은 무엇일까요?`,
        stemHTML:`<div class="sss">${shown.join('')}</div>`,options:R.shuffle(fr).map(f=>({val:f[0],html:`<span class="em">${f[1]}</span><span class="ot">${f[0]}</span>`})),
        ans:ans[0],ansHTML:`<b>${ans[1]} ${ans[0]}</b>`,answerText:ans[1]+' '+ans[0],
        mistake:{val:(ask==='most'?fr[2]:fr[0])[0],text:'반대로 골랐나요? 내려간 쪽이 더 무거워요.'},
        hintHTML:'<div>시소마다 내려간 쪽이 더 무거워요. 무거운 순서로 줄을 세워 봐요.</div>',
        solveHTML:`<div>무거운 순서: ${fr.map(f=>f[1]+' '+f[0]).join(' &gt; ')}</div><div>그래서 가장 ${ask==='most'?'무거운':'가벼운'} 것은 ${ans[1]} ${J(ans[0],'이에요','예요')}.</div>`};
    }
    const fr=R.shuffle(FRUITS).slice(0,3),[A,B,C]=fr;
    if(step===1){
      const n=R.int(2,3),k=2,ans=n*k;
      return {key:'Z1',step,kind:'num',prompt:`${A[1]} 1개와 ${B[1]} ${n}개는 무게가 같아요. ${A[1]} ${k}개는 ${B[1]} 몇 개와 같을까요?`,
        stemHTML:`<div class="sss">${seesawHTML([A[1]],Array(n).fill(B[1]),0)}${seesawHTML(Array(k).fill(A[1]),['❓'],0)}</div>`,ans:String(ans),answerText:String(ans),
        mistake:{val:String(n),text:`${A[1]}가 ${k}개예요. ${A[1]} 하나마다 ${B[1]} ${n}개씩 바꿔 넣어요.`},
        hintHTML:`<div>${A[1]} 하나를 ${B[1]} ${n}개로 바꿔 넣어 봐요.</div>`,
        solveHTML:`<div>${A[1]} 하나 = ${B[1].repeat(n)}</div><div>${A[1]}${A[1]} = ${B[1].repeat(n)} ${B[1].repeat(n)} → ${B[1]} ${ans}개</div>`};
    }
    const n=R.int(2,3),m=R.int(2,3),ans=n*m;
    return {key:'Z1',step,kind:'num',prompt:`${A[1]} 1개는 ${B[1]} ${n}개와, ${B[1]} 1개는 ${C[1]} ${m}개와 무게가 같아요. ${A[1]} 1개는 ${C[1]} 몇 개와 같을까요?`,
      stemHTML:`<div class="sss">${seesawHTML([A[1]],Array(n).fill(B[1]),0)}${seesawHTML([B[1]],Array(m).fill(C[1]),0)}</div>`,ans:String(ans),answerText:String(ans),
      mistake:n+m===ans?null:{val:String(n+m),text:`더했나요? ${B[1]} ${n}개를 하나씩 ${C[1]} ${m}개로 바꿔 넣어야 해요.`},
      hintHTML:`<div>${A[1]}를 먼저 ${B[1]} ${n}개로 바꾸고, 그다음 ${B[1]}를 하나씩 ${C[1]}로 바꿔요.</div>`,
      solveHTML:`<div>${A[1]} = ${B[1].repeat(n)}</div><div>${B[1]} 하나마다 ${C[1].repeat(m)} → ${Array(n).fill(C[1].repeat(m)).join(' ')}</div><div>${C[1]} ${ans}개</div>`};
  }
}
// 사다리 타기 (한 높이에 가로줄 여러 개 가능, 이웃한 가로줄은 같은 높이에 두지 않음)
const LAD_TOP=[['토끼','🐰'],['곰','🐻'],['고양이','🐱'],['강아지','🐶'],['돼지','🐷']];
const LAD_BOT=['🎁','🎈','🧸','🍩','🚀'];
function ladderTrace(n,rungs,start,L){let p=start;const pts=[[p,0]];
  for(let y=1;y<=L;y++){const r=rungs.find(x=>x.y===y&&(x.i===p-1||x.i===p));if(!r)continue;const np=r.i===p?p+1:p-1;pts.push([p,y],[np,y]);p=np;}
  pts.push([p,99]);return {end:p,pts};}
function ladderSVG(n,rungs,L,tops,bots,path,upto){
  const gx=64,top=34,gy=30,bottom=top+(L+1)*gy;const X=i=>20+i*gx,Y=y=>y===99?bottom:y===0?top:top+y*gy;
  let g='';for(let i=0;i<n;i++)g+=`<line x1="${X(i)}" y1="${top}" x2="${X(i)}" y2="${bottom}" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/>`;
  rungs.forEach(r=>g+=`<line x1="${X(r.i)}" y1="${Y(r.y)}" x2="${X(r.i+1)}" y2="${Y(r.y)}" stroke="#94a3b8" stroke-width="4"/>`);
  if(path){const pts=path.pts.slice(0,upto||path.pts.length);g+=`<polyline points="${pts.map(([i,y])=>X(i)+','+Y(y)).join(' ')}" fill="none" stroke="#0e828a" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>`;}
  tops.forEach((t,i)=>g+=`<text x="${X(i)}" y="${top-8}" text-anchor="middle" font-size="24">${t}</text>`);
  bots.forEach((b,i)=>g+=`<text x="${X(i)}" y="${bottom+28}" text-anchor="middle" font-size="24">${b}</text>`);
  const W=(n-1)*gx+60;
  return `<div class="ladder"><svg viewBox="-10 0 ${W} ${bottom+40}" style="width:${Math.min(W*1.3,440)}px">${g}</svg></div>`;
}
function genZ2(step){
  for(let t=0;t<500;t++){
    const n=step===0?3:step===1?4:5,L=step===0?4:step===1?7:9,want=step===0?3:step===1?7:11;
    const rungs=[];let tries=0;
    while(rungs.length<want&&tries++<200){const y=R.int(1,L),i=R.int(0,n-2);
      if(rungs.some(r=>r.y===y&&Math.abs(r.i-i)<=1))continue;rungs.push({y,i});}
    if(rungs.length<want)continue;
    const tops=LAD_TOP.slice(0,n),bots=R.shuffle(LAD_BOT).slice(0,n),s=R.int(0,n-1);
    const tr=ladderTrace(n,rungs,s,L);
    if(step>0&&tr.end===s)continue;
    const turns=(tr.pts.length-2)/2;if(step===1&&turns<3)continue;if(step===2&&turns<5)continue;
    return {key:'Z2',step,kind:'choice',prompt:`${tops[s][1]} ${J(tops[s][0],'이','가')} 사다리를 타고 내려가요. 가로줄을 만나면 꼭 옆으로 건너가요. 어디에 도착할까요?`,
      stemHTML:ladderSVG(n,rungs,L,tops.map(x=>x[1]),bots),options:bots.map(b=>({val:b,html:`<span class="em">${b}</span>`})),
      ans:bots[tr.end],ansHTML:`<span class="em">${bots[tr.end]}</span>`,answerText:bots[tr.end],
      mistake:tr.end!==s?{val:bots[s],text:'곧장 내려왔나요? 가로줄을 만나면 꼭 옆으로 건너가야 해요.'}:null,
      hintHTML:`<div>손가락으로 선을 따라가 봐요. 첫 번째 가로줄까지는 이렇게 가요.</div>${ladderSVG(n,rungs,L,tops.map(x=>x[1]),bots,tr,Math.min(3,tr.pts.length))}`,
      solveHTML:`<div>가로줄을 만날 때마다 건너가면 ${bots[tr.end]}에 도착해요. (가로줄 ${turns}번 건넘)</div>${ladderSVG(n,rungs,L,tops.map(x=>x[1]),bots,tr)}`};
  }
}
// 그림 스도쿠 (4×4, 빈칸을 직접 채워 완성)
const SUDO_SYM=[tk('circle','red','l2'),tk('tri','blu','l2'),tk('square','yel','l2'),tk('star','grn','l2')];
const PEERS=[...Array(16).keys()].map(i=>{const r=Math.floor(i/4),c=i%4,s=new Set();for(let k=0;k<4;k++){s.add(r*4+k);s.add(k*4+c);}
  const br=Math.floor(r/2)*2,bc=Math.floor(c/2)*2;for(let a=br;a<br+2;a++)for(let b=bc;b<bc+2;b++)s.add(a*4+b);s.delete(i);return [...s];});
function sudoCands(grid,i){return [0,1,2,3].filter(v=>!PEERS[i].some(j=>grid[j]===v));}
function sudoCount(grid,limit=2){const i=grid.indexOf(-1);if(i<0)return 1;let n=0;for(const v of sudoCands(grid,i)){grid[i]=v;n+=sudoCount(grid,limit);grid[i]=-1;if(n>=limit)break;}return n;}
function sudoSinglesSolvable(grid){const g=grid.slice();let prog=true;while(prog){prog=false;for(let i=0;i<16;i++)if(g[i]<0){const c=sudoCands(g,i);if(c.length===1){g[i]=c[0];prog=true;}}}return !g.includes(-1);}
// cells: 0~3 그림, -1 빈칸 / mark: {sel, wrong:Set, hl:Set, given:Set}
function sudokuHTML(cells,o={}){
  const box=(br,bc)=>{let s='<div class="sbox">';for(let r=br;r<br+2;r++)for(let c=bc;c<bc+2;c++){const i=r*4+c,v=cells[i],given=o.given&&o.given[i];
      const cls=['sc',given?'given':'blank',o.sel===i?'sel':'',o.wrong&&o.wrong.has(i)?'wrong':'',o.hl&&o.hl.has(i)?'hl':'',o.right&&o.right.has(i)?'right':''].join(' ');
      const inner=v>=0?shapeSVG(SUDO_SYM[v]):'';
      s+=o.tap&&!given?`<button class="${cls}" data-sc="${i}" aria-label="${r+1}줄 ${c+1}칸">${inner}</button>`:`<span class="${cls}">${inner}</span>`;}
    return s+'</div>';};
  return `<div class="sudo">${box(0,0)}${box(0,2)}${box(2,0)}${box(2,2)}</div>`;
}
function genZ3(step){
  for(let t=0;t<3000;t++){
    let base=[[0,1,2,3],[2,3,0,1],[1,0,3,2],[3,2,1,0]];
    const sp=R.shuffle([0,1,2,3]);base=base.map(r=>r.map(v=>sp[v]));
    if(Math.random()<.5)base=[base[1],base[0],base[2],base[3]];if(Math.random()<.5)base=[base[0],base[1],base[3],base[2]];
    if(Math.random()<.5)base=[base[2],base[3],base[0],base[1]];if(Math.random()<.5)base=base[0].map((_,c)=>base.map(r=>r[c]));
    const sol=base.flat(),nBlank=step===0?3:step===1?5:8;
    const blanks=R.shuffle([...Array(16).keys()]).slice(0,nBlank);
    const puzzle=sol.map((v,i)=>blanks.includes(i)?-1:v);
    if(sudoCount(puzzle.slice())!==1)continue;
    if(step===0&&!blanks.every(i=>sudoCands(puzzle,i).length===1))continue;   // 쉬움: 빈칸마다 바로 하나로 정해짐
    if(step>=1&&!sudoSinglesSolvable(puzzle))continue;
    if(step===2&&blanks.filter(i=>sudoCands(puzzle,i).length===1).length>3)continue; // 도전: 처음엔 바로 정해지는 칸이 적음
    const easy=blanks.find(i=>sudoCands(puzzle,i).length===1);
    const given=sol.map((_,i)=>!blanks.includes(i));
    const r=Math.floor(easy/4),c=easy%4,br=Math.floor(r/2)*2,bc=Math.floor(c/2)*2;
    const hl=new Set(PEERS[easy]);
    return {key:'Z3',step,kind:'sudoku',sol,puzzle,given,blanks,
      prompt:'빈칸을 눌러 그림을 넣어요. 가로줄, 세로줄, 굵은 선 네모 안에 같은 그림이 두 번 들어가면 안 돼요.',
      ans:sol.join(''),answerText:'완성된 표 (부모님 창 풀이 참고)',mistake:null,
      ansHTML:sudokuHTML(sol,{given,right:new Set(blanks)}),
      hintHTML:`<div>파란 칸과 같은 가로줄·세로줄·네모(색칠한 칸)를 봐요. 거기에 없는 그림은 하나뿐이에요.</div>${sudokuHTML(puzzle,{given,sel:easy,hl})}`,
      solveHTML:`<div>바로 정해지는 칸부터 하나씩 채우면 이렇게 완성돼요. (초록 칸이 빈칸이었던 곳)</div>${sudokuHTML(sol,{given,right:new Set(blanks)})}`};
  }
}

// ===================== 추리 =====================
function genL1(step){
  const n=step===0?4:step===1?5:6;
  for(let t=0;t<500;t++){
    const items=[];const seen=new Set();
    while(items.length<n){const x=tk(R.pick(SHAPES.slice(0,4)),R.pick(COLORS.slice(0,4)),R.pick(['l2','s']));if(!seen.has(key(x))){seen.add(key(x));items.push(x);}}
    const target=R.pick(items);
    const conds=[
      {t:`${J(CADJ[target.color],'이에요','예요')}`,f:x=>x.color===target.color,neg:false},
      {t:`${J(SNAME[target.shape],'이에요','예요')}`,f:x=>x.shape===target.shape,neg:false},
      {t:target.size==='s'?'작은 것이에요':'큰 것이에요',f:x=>x.size===target.size,neg:false}];
    for(const c of COLORS.slice(0,4))if(c!==target.color)conds.push({t:`${J(CADJ[c],'이','가')} 아니에요`,f:x=>x.color!==c,neg:true});
    for(const s of SHAPES.slice(0,4))if(s!==target.shape)conds.push({t:`${J(SNAME[s],'이','가')} 아니에요`,f:x=>x.shape!==s,neg:true});
    const need=step===0?2:step===1?2:3,negN=step===0?0:step===1?1:2;
    const pick=[...R.shuffle(conds.filter(c=>c.neg)).slice(0,negN),...R.shuffle(conds.filter(c=>!c.neg)).slice(0,need-negN)];
    let rem=items.slice(),good=true;for(const c of pick){const b=rem.length;rem=rem.filter(c.f);if(rem.length===b){good=false;break;}}
    if(!good||rem.length!==1||rem[0]!==target)continue;
    const almost=items.filter(x=>x!==target&&pick.slice(0,-1).every(c=>c.f(x)));
    return {key:'L1',step,kind:'choice',prompt:'조건에 모두 맞는 것을 하나 골라요.',
      stemHTML:`<div class="clues">${pick.map((c,i)=>`<div class="clue"><span class="cn">조건 ${i+1}</span>${c.t}.</div>`).join('')}</div>`,
      options:items.map(x=>({val:key(x),html:tokHTML(x)})),ans:key(target),ansHTML:tokHTML(target),answerText:tname(target),
      mistake:almost.length===1?{val:key(almost[0]),text:'마지막 조건도 확인했나요? 조건을 하나씩 모두 맞춰 봐요.'}:null,
      hintHTML:`<div>조건 1에 맞지 않는 것부터 지워 봐요.</div><div class="seq">${items.map(x=>`<span class="tokwrap ${pick[0].f(x)?'':'gone'}">${tokHTML(x)}</span>`).join('')}</div>`,
      solveHTML:`<ol class="ways">${pick.map((c,i)=>{const out=items.filter(x=>!c.f(x)&&pick.slice(0,i).every(p=>p.f(x)));return `<li>${c.t} → ${out.length?out.map(x=>`<span class="mini">${tokHTML(x)}</span>`).join(' ')+' 지우기':'지울 것 없음'}</li>`;}).join('')}</ol><div>남은 것: <span class="mini">${tokHTML(target)}</span></div>`};
  }
}
const KIDS=['민준','서연','지호','하윤','도윤','수아','지우','예준'];
const SCALES=[{big:'커요',small:'작아요',most:'가장 큰',least:'가장 작은',second:'두 번째로 큰',word:'큰'},
  {big:'빨라요',small:'느려요',most:'가장 빠른',least:'가장 느린',second:'두 번째로 빠른',word:'빠른'},
  {big:'무거워요',small:'가벼워요',most:'가장 무거운',least:'가장 가벼운',second:'두 번째로 무거운',word:'무거운'}];
function genL2(step){
  for(let t=0;t<200;t++){
    const n=step===2?4:3,names=R.shuffle(KIDS).slice(0,n),sc=R.pick(SCALES);
    const rel=[];for(let i=0;i<n-1;i++)rel.push([names[i],names[i+1]]);
    let clues=rel.map(([x,y])=>{const flip=step>0&&Math.random()<.5;return {x,y,s:flip?`${J(y,'은','는')} ${x}보다 ${sc.small}`:`${J(x,'은','는')} ${y}보다 ${sc.big}`};});
    if(step>0)clues=R.shuffle(clues);
    const ask=R.pick(step===0?['most','least']:['most','least','second']),pos={most:0,least:n-1,second:1}[ask];
    const ok=permutations(names).filter(p=>rel.every(([x,y])=>p.indexOf(x)<p.indexOf(y)));
    if(new Set(ok.map(p=>p[pos])).size!==1)continue;
    const ans=names[pos],opp=ask==='most'?names[n-1]:ask==='least'?names[0]:null;
    const bar=(arr,hi)=>`<div class="chain">${arr.map((x,i)=>`<span class="kid ${i===hi?'hl':''}">${x}</span>`).join('<span class="gt">&gt;</span>')}</div>`;
    return {key:'L2',step,kind:'choice',prompt:`${sc[ask]} 친구는 누구일까요?`,
      stemHTML:`<div class="clues">${clues.map((c,i)=>`<div class="clue"><span class="cn">단서 ${i+1}</span>${c.s}.</div>`).join('')}</div>`,
      options:R.shuffle(names).map(x=>({val:x,html:`<span class="ot">${x}</span>`})),ans,ansHTML:`<b>${ans}</b>`,answerText:ans,
      mistake:opp?{val:opp,text:`반대로 골랐나요? ${sc[ask]} 친구를 찾아야 해요.`}:null,
      hintHTML:`<div>단서마다 더 ${sc.word} 친구를 왼쪽에 써서 줄 세워 봐요. 단서 1은 이렇게 써요.</div>${bar([clues[0].x,clues[0].y],-1)}`,
      solveHTML:`<div>단서를 모두 이어서 ${sc.word} 순서로 줄 세우면</div>${bar(names,pos)}`};
  }
}
const LINE_ANIMALS=[['곰','🐻'],['토끼','🐰'],['강아지','🐶'],['고양이','🐱'],['펭귄','🐧']];
function lineHTML(n,ti,emoji,front,back,shown){
  let h='<div class="lineWrap"><div class="line">';
  for(let i=0;i<n;i++){const vis=shown==null||i<shown;
    h+=`<div class="slot"><span class="lb">${front&&i<front?i+1:''}</span><span class="pp ${i===ti?'me':''}">${vis?emoji:''}${i===ti?'<i class="rb">🎀</i>':''}</span><span class="lb">${back&&n-i<=back?n-i:''}</span></div>`;}
  return h+'</div><div class="ends"><span>← 앞</span><span>뒤 →</span></div></div>';
}
function genL3(step){
  const [nm,em]=R.pick(LINE_ANIMALS);let n,ti,ans,mk,prompt,hint,solve,front=0,back=0;
  const rib=`🎀리본 ${nm}`;
  if(step===0){const f=R.int(1,4),b=R.int(1,4);n=f+b+1;ti=f;ans=n;
    prompt=`${nm}들이 한 줄로 서 있어요. ${rib} 앞에 ${J(nm,'이','가')} ${f}마리, 뒤에 ${J(nm,'이','가')} ${b}마리 있어요. ${J(nm,'은','는')} 모두 몇 마리일까요?`;
    mk={val:String(f+b),text:`${J(rib,'을','를')} 빼고 세었나요? 리본 ${nm}도 줄에 서 있어요.`};
    hint=`<div>줄을 그림으로 그려 봐요. 리본 ${nm} 앞에 ${f}마리, 뒤에 ${b}마리를 놓아요.</div>${lineHTML(n,ti,em,0,0)}`;
    solve=`<div>앞 ${f}마리 + 리본 ${nm} 1마리 + 뒤 ${b}마리 = ${n}마리</div>${lineHTML(n,ti,em,n,0)}`;}
  else if(step===1){const k=R.int(2,6),m=R.int(2,6);n=k+m-1;ti=k-1;ans=n;
    prompt=`${nm}들이 한 줄로 서 있어요. ${J(rib,'은','는')} 앞에서 ${k}번째, 뒤에서 ${m}번째예요. ${J(nm,'은','는')} 모두 몇 마리일까요?`;
    mk={val:String(k+m),text:`리본 ${J(nm,'을','를')} 두 번 세었나요? 앞에서 셀 때도, 뒤에서 셀 때도 리본 ${J(nm,'이','가')} 들어가요.`};
    hint=`<div>앞에서부터 ${k}번째까지 그려 봐요. ${k}번째가 리본 ${J(nm,'이에요','예요')}.</div>${lineHTML(k,ti,em,k,0)}`;
    solve=`<div>${k} + ${m} = ${k+m}인데, 리본 ${J(nm,'이','가')} 두 번 세어졌으니 1을 빼요. ${k+m} − 1 = ${n}</div>${lineHTML(n,ti,em,k,m)}`;}
  else{n=R.int(6,10);const k=R.int(2,n-1);ti=k-1;ans=n-k+1;
    prompt=`${nm} ${n}마리가 한 줄로 서 있어요. ${J(rib,'은','는')} 앞에서 ${k}번째예요. 뒤에서는 몇 번째일까요?`;
    mk={val:String(n-k),text:`${n} − ${k}만 했나요? 리본 ${nm} 자신도 세어야 해요.`};
    hint=`<div>${n}마리를 그리고 리본 ${J(nm,'을','를')} 표시해 봐요.</div>${lineHTML(n,ti,em,k,0)}`;
    solve=`<div>뒤에서부터 세면 ${ans}번째예요.</div>${lineHTML(n,ti,em,0,n-ti)}`;}
  if(mk&&mk.val===String(ans))mk=null;
  return {key:'L3',step,kind:'num',prompt,stemHTML:'',ans:String(ans),answerText:String(ans),mistake:mk,hintHTML:hint,solveHTML:solve};
}

// ===================== 몇 가지? =====================
const CLOTH_COL=['#E5484D','#3B7DF5','#F2B705','#24A35A','#8B5CF6'];
const CLOTH={shirt:'M10 8 L16 6 Q20 10 24 6 L30 8 L36 15 L31 19 L29 16 L29 34 L11 34 L11 16 L9 19 L4 15 Z',
  pants:'M11 6 L29 6 L31 34 L23 34 L20 15 L17 34 L9 34 Z',hat:'M9 25 Q9 9 20 9 Q31 9 31 25 Z M4 25 L36 25 L36 29 L4 29 Z'};
const clothSVG=(k,c,sm)=>`<span class="tok ${sm?'sm':''}"><svg viewBox="0 0 40 40"><path d="${CLOTH[k]}" fill="${c}" stroke="rgba(0,0,0,.2)" stroke-width="1.2"/></svg></span>`;
const CLOTH_NAME={shirt:'윗옷',pants:'바지',hat:'모자'};
function genK1(step){
  let cnt;
  if(step===0)cnt=R.pick([[2,3],[3,2],[1,3],[3,1],[2,2]]);else if(step===1)cnt=R.pick([[3,3],[4,2],[2,4],[3,4],[4,3]]);else cnt=R.pick([[2,2,2],[3,2,2],[2,3,2]]);
  const kinds=['shirt','pants','hat'].slice(0,cnt.length),cols=kinds.map(()=>R.shuffle(CLOTH_COL));
  const ans=cnt.reduce((a,b)=>a*b,1),sum=cnt.reduce((a,b)=>a+b,0);
  const stem=`<div class="closet">${kinds.map((k,i)=>`<div class="crow"><span class="cl">${CLOTH_NAME[k]} ${cnt[i]}개</span>${cols[i].slice(0,cnt[i]).map(c=>clothSVG(k,c)).join('')}</div>`).join('')}</div>`;
  const prompt=cnt.length===2?'윗옷 하나와 바지 하나를 골라 입어요. 서로 다르게 입는 방법은 모두 몇 가지일까요?':'윗옷, 바지, 모자를 하나씩 골라요. 서로 다르게 입는 방법은 모두 몇 가지일까요?';
  const outfits=[];
  const rec=(i,acc)=>{if(i===kinds.length){outfits.push(acc);return;}for(let j=0;j<cnt[i];j++)rec(i+1,[...acc,j]);};rec(0,[]);
  const outfitHTML=(o,no)=>`<span class="outfit"><span class="ono">${no}</span>${o.map((j,i)=>clothSVG(kinds[i],cols[i][j],true)).join('')}</span>`;
  const groups=[];for(let s=0;s<cnt[0];s++)groups.push(outfits.filter(o=>o[0]===s));
  let no=0;
  const solve=`<div>윗옷마다 짝지을 수 있는 것을 모두 늘어놓았어요. 윗옷 하나에 ${outfits.length/cnt[0]}가지씩, 윗옷이 ${cnt[0]}개라서 ${Array(cnt[0]).fill(outfits.length/cnt[0]).join(' + ')} = ${J(ans,'이에요','예요')}.</div>
    <div class="ogroups">${groups.map(gp=>`<div class="ogroup">${gp.map(o=>outfitHTML(o,++no)).join('')}</div>`).join('')}</div>`;
  const hint=`<div>윗옷 하나를 먼저 정해요. 이 윗옷으로 입는 방법은 몇 가지인가요?</div><div class="ogroup">${groups[0].map((o,i)=>outfitHTML(o,i+1)).join('')}</div>`;
  let mk={val:String(sum),text:'개수를 더하기만 했나요? 윗옷 하나마다 짝지을 수 있는 것을 모두 세어야 해요.'};if(mk.val===String(ans))mk=null;
  return {key:'K1',step,kind:'num',prompt,stemHTML:stem,ans:String(ans),answerText:String(ans),mistake:mk,hintHTML:hint,solveHTML:solve};
}
function gridSVG(w,h,path,small){
  const cs=small?22:44,m=small?10:24,W=w*cs+2*m,H=h*cs+2*m;let g='';
  for(let i=0;i<=w;i++)g+=`<line x1="${m+i*cs}" y1="${m}" x2="${m+i*cs}" y2="${m+h*cs}" stroke="#cbd5e1" stroke-width="${small?2:3}"/>`;
  for(let j=0;j<=h;j++)g+=`<line x1="${m}" y1="${m+j*cs}" x2="${m+w*cs}" y2="${m+j*cs}" stroke="#cbd5e1" stroke-width="${small?2:3}"/>`;
  if(path){let x=0,y=0;const pts=[[x,y]];for(const s of path){if(s==='R')x++;else y++;pts.push([x,y]);}
    g+=`<polyline points="${pts.map(([a,b])=>(m+a*cs)+','+(m+(h-b)*cs)).join(' ')}" fill="none" stroke="#0e828a" stroke-width="${small?4:6}" stroke-linecap="round" stroke-linejoin="round" ${small?'':'stroke-dasharray="2 9"'}/>`;}
  const r=small?6:12;
  g+=`<circle cx="${m}" cy="${m+h*cs}" r="${r}" fill="#22c55e"/><circle cx="${m+w*cs}" cy="${m}" r="${r}" fill="#f43f5e"/>`;
  if(!small)g+=`<text x="${m+4}" y="${m+h*cs+r+14}" font-size="12" fill="#475569">출발</text><text x="${m+w*cs-30}" y="${m-r-4}" font-size="12" fill="#475569">도착</text>`;
  return `<svg viewBox="0 ${small?0:-10} ${W} ${H+(small?0:20)}" class="${small?'gsm':'gbig'}">${g}</svg>`;
}
function allPaths(w,h){const o=[];const rec=(a,r,u)=>{if(r===w&&u===h){o.push(a);return;}if(r<w)rec(a+'R',r+1,u);if(u<h)rec(a+'U',r,u+1);};rec('',0,0);return o;}
function genK2(step){
  const [w,h]=step===0?R.pick([[1,1],[1,2],[2,1]]):step===1?R.pick([[2,2],[1,3],[3,1]]):R.pick([[2,3],[3,2],[2,4]]);
  const ps=allPaths(w,h),ans=ps.length,ex=R.pick(ps);
  let mk={val:String(w+h),text:'가로와 세로 칸 수를 더했나요? 길을 하나씩 그려 보며 세어 봐요.'};if(mk.val===String(ans))mk=null;
  const firstR=ps.filter(p=>p[0]==='R'),firstU=ps.filter(p=>p[0]==='U');
  return {key:'K2',step,kind:'num',prompt:'초록 점(출발)에서 빨간 점(도착)까지 선을 따라가요. 오른쪽(→)이나 위쪽(↑)으로만 갈 수 있고, 가는 순서는 마음대로예요. 가장 짧은 길은 모두 몇 가지일까요?',
    stemHTML:`<div class="k2"><div class="gbox">${gridSVG(w,h)}</div><div class="gex"><span class="muted">예를 들면 이런 길도 있어요</span>${gridSVG(w,h,ex)}</div></div>`,
    ans:String(ans),answerText:String(ans),mistake:mk,
    hintHTML:`<div>처음에 →로 가는 길과 ↑로 가는 길로 나눠서 하나씩 그려 봐요.</div>`,
    solveHTML:`<div>처음에 →로 가는 길 ${firstR.length}가지, ↑로 가는 길 ${firstU.length}가지. 모두 ${J(ans,'이에요','예요')}.</div><div class="paths">${[...firstR,...firstU].map((p,i)=>`<span class="pth"><span class="ono">${i+1}</span>${gridSVG(w,h,p,true)}</span>`).join('')}</div>`};
}
const coinHTML=(v,sm)=>`<span class="coin c${v} ${sm?'sm':''}">${v}</span>`;
function coinWays(T,coins){const out=[];const rec=(i,left,acc)=>{if(i===coins.length-1){if(left%coins[i]===0)out.push([...acc,left/coins[i]]);return;}
  for(let k=0;k*coins[i]<=left;k++)rec(i+1,left-k*coins[i],[...acc,k]);};rec(0,T,[]);return out;}
function genK3(step){
  const coins=step===2?[100,50,10]:[50,10];
  const T=step===0?R.pick([60,70,80,90,100]):step===1?R.pick([110,120,130,140,150,160]):R.pick([100,120,150,160]);
  const ways=coinWays(T,coins),ans=ways.length;
  const rows=ways.map(w=>w.map((k,i)=>Array(k).fill(coinHTML(coins[i],true)).join('')).join(''));
  return {key:'K3',step,kind:'num',prompt:`${coins.map(c=>c+'원').join(', ')}짜리 동전이 많이 있어요. ${T}원을 만드는 방법은 모두 몇 가지일까요?`,
    stemHTML:`<div class="coins">${coins.map(c=>coinHTML(c)).join('')}<span class="eq sm">→ ${T}원</span></div>`,ans:String(ans),answerText:String(ans),
    mistake:{val:String(ans-1),text:'한 가지를 빠뜨렸나요? 큰 동전을 하나도 안 쓰는 방법도 세어요.'},
    hintHTML:`<div>가장 큰 동전(${coins[0]}원)을 0개 쓸 때, 1개 쓸 때, 2개 쓸 때… 차례로 나눠서 세어 봐요.</div>`,
    solveHTML:`<div>큰 동전 개수를 0개부터 차례로 바꾸며 빠짐없이 놓아 봤어요.</div><ol class="cways">${rows.map(r=>`<li>${r}</li>`).join('')}</ol>`};
}

// ===================== 스무고개 =====================
const T_ITEMS=[
 {n:'고양이',e:'🐱',k:'동물',legs:4,fly:false,water:false,big:false,feather:false,sound:'야옹'},
 {n:'강아지',e:'🐶',k:'동물',legs:4,fly:false,water:false,big:false,feather:false,sound:'멍멍'},
 {n:'소',e:'🐮',k:'동물',legs:4,fly:false,water:false,big:true,feather:false,sound:'음매'},
 {n:'말',e:'🐴',k:'동물',legs:4,fly:false,water:false,big:true,feather:false,sound:'히힝'},
 {n:'코끼리',e:'🐘',k:'동물',legs:4,fly:false,water:false,big:true,feather:false,sound:'뿌우'},
 {n:'돼지',e:'🐷',k:'동물',legs:4,fly:false,water:false,big:null,feather:false,sound:'꿀꿀'},
 {n:'양',e:'🐑',k:'동물',legs:4,fly:false,water:false,big:null,feather:false,sound:'매애'},
 {n:'토끼',e:'🐰',k:'동물',legs:4,fly:false,water:false,big:false,feather:false},
 {n:'닭',e:'🐔',k:'동물',legs:2,fly:false,water:false,big:false,feather:true,sound:'꼬끼오'},
 {n:'오리',e:'🦆',k:'동물',legs:2,fly:true,water:null,big:false,feather:true,sound:'꽥꽥',sea:null},
 {n:'참새',e:'🐦',k:'동물',legs:2,fly:true,water:false,big:false,feather:true,sound:'짹짹'},
 {n:'부엉이',e:'🦉',k:'동물',legs:2,fly:true,water:false,big:false,feather:true,sound:'부엉부엉'},
 {n:'펭귄',e:'🐧',k:'동물',legs:2,fly:false,water:null,big:false,feather:true,sea:null},
 {n:'물고기',e:'🐟',k:'동물',legs:0,fly:false,water:true,big:false,feather:false,sea:null},
 {n:'고래',e:'🐳',k:'동물',legs:0,fly:false,water:true,big:true,feather:false,sea:null},
 {n:'개구리',e:'🐸',k:'동물',legs:4,fly:false,water:null,big:false,feather:false,sound:'개굴개굴'},
 {n:'나비',e:'🦋',k:'동물',bug:true,legs:6,fly:true,water:false,big:false,feather:false},
 {n:'벌',e:'🐝',k:'동물',bug:true,legs:6,fly:true,water:false,big:false,feather:false,sound:'윙윙'},
 {n:'거미',e:'🕷️',k:'동물',bug:null,legs:8,fly:false,water:false,big:false,feather:false},
 {n:'자동차',e:'🚗',k:'탈것',wheels:4,fly:false,road:true,rail:false,sea:false,pedal:false,many:false,sound:'빵빵'},
 {n:'자전거',e:'🚲',k:'탈것',wheels:2,fly:false,road:true,rail:false,sea:false,pedal:true,many:false},
 {n:'버스',e:'🚌',k:'탈것',wheels:null,fly:false,road:true,rail:false,sea:false,pedal:false,many:true},
 {n:'기차',e:'🚂',k:'탈것',wheels:null,fly:false,road:false,rail:true,sea:false,pedal:false,many:true,sound:'칙칙폭폭'},
 {n:'비행기',e:'✈️',k:'탈것',wheels:null,fly:true,road:false,rail:false,sea:false,pedal:false,many:true},
 {n:'배',e:'⛵',k:'탈것',wheels:0,fly:false,road:false,rail:false,sea:true,pedal:false,many:null},
 {n:'사과',e:'🍎',k:'음식',color:'빨강',round:true,long:false,tree:true,under:false,peel:null,huge:false},
 {n:'바나나',e:'🍌',k:'음식',color:'노랑',round:false,long:true,tree:null,under:false,peel:true,huge:false},
 {n:'수박',e:'🍉',k:'음식',color:'초록',round:true,long:false,tree:false,under:false,peel:null,huge:true},
 {n:'당근',e:'🥕',k:'음식',color:'주황',round:false,long:true,tree:false,under:true,peel:null,huge:false},
 {n:'귤',e:'🍊',k:'음식',color:'주황',round:true,long:false,tree:true,under:false,peel:true,huge:false},
 {n:'포도',e:'🍇',k:'음식',color:'보라',round:null,long:false,tree:null,under:false,peel:null,huge:false},
 {n:'딸기',e:'🍓',k:'음식',color:'빨강',round:null,long:false,tree:false,under:false,peel:false,huge:false}];
const T_CLUES=[
 {a:'k',val:true,text:v=>({동물:'동물이에요.',탈것:'사람이 타고 다니는 거예요.',음식:'먹는 거예요.'})[v]},
 {a:'bug',T:'곤충이에요.',def:{동물:false,탈것:false,음식:false}},
 {a:'legs',val:true,text:v=>v===0?'다리가 없어요.':`다리가 ${v}개예요.`,def:{탈것:0,음식:0}},
 {a:'fly',T:'하늘을 날 수 있어요.',F:'날지 못해요.',def:{음식:false},negSame:true},
 {a:'water',T:'물속에서 살아요.',F:'물속에서 살지 않아요.',def:{}},
 {a:'big',T:'몸집이 사람보다 커요.',F:'몸집이 사람보다 작아요.',def:{}},
 {a:'feather',T:'깃털이 있어요.',F:'깃털이 없어요.',def:{탈것:false,음식:false},negSame:true},
 {a:'sound',val:true,text:v=>`'${v}' 하고 소리를 내요.`,def:{동물:'',탈것:'',음식:''},sound:true},
 {a:'wheels',val:true,text:v=>v===0?'바퀴가 없어요.':`바퀴가 ${v}개예요.`,def:{동물:0,음식:0}},
 {a:'road',T:'도로를 달려요.',def:{음식:false}},
 {a:'rail',T:'철길 위를 달려요.',def:{동물:false,음식:false}},
 {a:'sea',T:'물 위를 다녀요.',def:{음식:false}},
 {a:'pedal',T:'발로 페달을 밟아서 가요.',def:{동물:false,음식:false}},
 {a:'many',T:'한 번에 사람이 많이 타요.',def:{동물:false,음식:false}},
 {a:'color',val:true,text:v=>({빨강:'빨간색이에요.',노랑:'노란색이에요.',초록:'겉이 초록색이에요.',주황:'주황색이에요.',보라:'보라색이에요.'})[v],def:{}},
 {a:'round',T:'동글동글해요.',def:{}},
 {a:'long',T:'길쭉해요.',def:{}},
 {a:'tree',T:'나무에 열려요.',def:{동물:false,탈것:false}},
 {a:'under',T:'땅속에서 자라요.',def:{동물:false,탈것:false}},
 {a:'peel',T:'껍질을 까서 먹어요.',def:{동물:false,탈것:false}},
 {a:'huge',T:'한 손으로 들기 어려울 만큼 커요.',def:{}}];
function tv(x,c){if(c.a==='k'&&x.bug!==undefined)return null;if(x[c.a]!==undefined)return x[c.a];const d=c.def&&c.def[x.k];return d===undefined?null:d;}
function clueCands(target){
  const out=[];
  for(const c of T_CLUES){const v=tv(target,c);if(v===null||v===undefined)continue;
    if(c.a==='legs'&&target.k!=='동물')continue;if(c.a==='wheels'&&target.k!=='탈것')continue;
    if(c.val){if(c.sound&&!v)continue;const tx=c.text(v);if(!tx)continue;out.push({id:c.a,text:tx,test:x=>{const w=tv(x,c);return w===null?null:w===v;},sound:!!c.sound});}
    else if(v===true&&c.T)out.push({id:c.a,text:c.T,test:x=>{const w=tv(x,c);return w===null?null:w===true;}});
    else if(v===false&&c.F)out.push({id:c.a+'-',text:c.F,negSame:!!c.negSame,test:x=>{const w=tv(x,c);return w===null?null:w===false;}});}
  return out;
}
// 단서 k개면 하나만 남고(필요한 단서), 그 뒤에 확인용 단서를 더 붙임
function genT1(step){
  const nOpt=step===0?6:8;
  for(let t=0;t<3000;t++){
    const k=step===0?3:step===1?R.pick([3,4]):R.pick([4,4,5]);
    const target=R.pick(T_ITEMS);let others;
    if(step===0)others=R.shuffle(T_ITEMS.filter(x=>x!==target)).slice(0,nOpt-1);
    else if(step===1){const same=R.shuffle(T_ITEMS.filter(x=>x!==target&&x.k===target.k)).slice(0,R.int(3,5)),diff=R.shuffle(T_ITEMS.filter(x=>x.k!==target.k)).slice(0,nOpt-1-same.length);others=[...same,...diff];}
    else{const same=R.shuffle(T_ITEMS.filter(x=>x!==target&&x.k===target.k)).slice(0,nOpt-1);others=same.length===nOpt-1?same:[...same,...R.shuffle(T_ITEMS.filter(x=>x.k!==target.k)).slice(0,nOpt-1-same.length)];}
    if(others.length!==nOpt-1)continue;
    const opts=[target,...others],allSame=opts.every(x=>x.k===target.k);
    const cands=clueCands(target).filter(c=>opts.every(x=>c.test(x)!==null)&&(!c.negSame||allSame)&&(step<2||!c.sound));
    if(cands.length<k)continue;
    for(let s=0;s<80;s++){
      const pick=R.shuffle(cands).slice(0,k);if(new Set(pick.map(c=>c.id.replace('-',''))).size!==k)continue;
      const elim=c=>opts.filter(x=>!c.test(x)).length;
      pick.sort((a,b)=>(a.id==='k'?-1:0)-(b.id==='k'?-1:0)||elim(a)-elim(b)||(a.sound?1:0)-(b.sound?1:0));
      let rem=opts.slice(),good=true;
      for(let i=0;i<pick.length;i++){const before=rem.length;rem=rem.filter(x=>pick[i].test(x));if(rem.length===before){good=false;break;}if(i<pick.length-1&&rem.length<2){good=false;break;}}
      if(!good||rem.length!==1||rem[0]!==target)continue;
      const used=new Set(pick.map(c=>c.id.replace('-','')));
      let extra=R.shuffle(cands.filter(c=>!used.has(c.id.replace('-',''))&&elim(c)>0)).slice(0,2);
      if(!extra.length&&s<60)continue;
      const clues=[...pick,...extra];
      const o=R.shuffle(opts);
      return {key:'T1',step,kind:'twenty',prompt:'{{NAME_GA}} 무엇을 생각하고 있을까요? 단서를 열고, 아닌 것을 눌러 지워요. 하나만 남으면 "이거예요!"를 눌러요.',
        clues:clues.map(c=>c.text),need:k,items:o,elim:clues.map(c=>o.map((x,i)=>!c.test(x)?i:-1).filter(i=>i>=0)),
        options:o.map(x=>({val:x.n,html:`<span class="em">${x.e}</span><span class="ot">${x.n}</span>`})),
        ans:target.n,ansHTML:`<b>${target.e} ${target.n}</b>`,answerText:target.e+' '+target.n+` (단서 ${k}개면 하나만 남아요)`,mistake:null};
    }
  }
}
function twentySolve(q,upto){
  const n=Math.max(upto,q.need);const gone=new Set();const rows=[];
  for(let i=0;i<n;i++){const out=q.elim[i].filter(j=>!gone.has(j));out.forEach(j=>gone.add(j));
    rows.push(`<li>${q.clues[i]} → ${out.length?out.map(j=>q.items[j].e+' '+q.items[j].n).join(', ')+' 지우기':'지울 것 없음 (확인 단서)'}</li>`);}
  const t=q.items.find(x=>x.n===q.ans);
  return `<ol class="ways">${rows.join('')}</ol><div>단서 ${q.need}개면 ${t.e} ${t.n}만 남아요.</div>`;
}

const GEN2={RA:s=>wrapRule('RA',genA(s)),RB:genRB,RD:s=>wrapRule('RD',genD(s)),RM:genRM,RR:genRR,
  G1:genG1,G2:genG2,G3:genG3,G4:genG4,Z1:genZ1,Z2:genZ2,Z3:genZ3,L1:genL1,L2:genL2,L3:genL3,K1:genK1,K2:genK2,K3:genK3,T1:genT1};

export { sudoCount, sudokuHTML, paintGridHTML, GEN2, R, J, PAINT, SUDO_SYM, tname, tokHTML, twentySolve, genArrow, wrapRule };
