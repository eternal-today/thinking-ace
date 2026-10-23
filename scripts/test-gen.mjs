// 문제 만들기 검사: 유형·단계마다 300문제를 만들어 정답이 보기에 있는지, 보기가 겹치지 않는지, 이상한 글자가 없는지 확인
// 실행: npm test
import { GEN2 } from '../src/gen/generators.js';
import * as G from '../src/gen/generators.js';
const sudoCount = G.sudoCount;
let bad=0;
for(const k of Object.keys(GEN2))for(const s of [0,1,2]){
  const st={fail:0,miss:0,dup:0,mk:0,html:0,n:0};const dist={};
  for(let i=0;i<300;i++){let q;try{q=GEN2[k](s);}catch(e){st.fail++;if(st.fail<2)console.log(k,s,e.stack.split('\n').slice(0,2).join(' '));continue;}
    if(!q){st.fail++;continue;}st.n++;
    if(q.kind==='choice'||q.kind==='twenty'){const v=q.options.map(o=>o.val);if(!v.includes(q.ans))st.miss++;if(new Set(v).size!==v.length)st.dup++;if(q.mistake&&(!v.includes(q.mistake.val)||q.mistake.val===q.ans))st.mk++;}
    else if(q.kind==='num'){if(!/^\d+$/.test(q.ans))st.miss++;if(q.mistake&&q.mistake.val===q.ans)st.mk++;}
    else if(q.kind==='paint'){if(q.mistake&&q.mistake.val===q.ans)st.mk++;}
    else if(q.kind==='sudoku'){const p=q.puzzle.slice();if(sudoCount(p,3)!==1)st.miss++;if(q.sol.join('')!==q.ans)st.miss++;}
    const all=(q.stemHTML||'')+(q.hintHTML||'')+(q.solveHTML||'')+q.prompt+JSON.stringify(q.options||'')+(q.clues||[]).join('');
    if(/undefined|NaN|null|\[object/.test(all))st.html++;
    dist[q.ans]=(dist[q.ans]||0)+1;}
  const f=st.fail||st.miss||st.dup||st.mk||st.html;if(f)bad++;
  console.log(k,s,JSON.stringify(st),f?'<<<':'','answers:',Object.keys(dist).length);
}
console.log('BAD',bad);
process.exit(bad?1:0);
