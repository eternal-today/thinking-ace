// @ts-nocheck — 시제품 그림 코드를 그대로 옮김
/**
 * 생각나무 그림 (SVG 문자열). 물만으로 자람: 씨앗 → 새싹 → 어린 나무 → 큰 나무 → 꽃 나무 → 열매 나무
 */
export const STAGES = [{ n: '씨앗', d: 0 }, { n: '새싹', d: 1 }, { n: '어린 나무', d: 6 }, { n: '큰 나무', d: 16 }, { n: '꽃 나무', d: 30 }, { n: '열매 나무', d: 50 }];
export const KINDS = [{ n: '사과나무', fl: '#fbcfe8', fr: '#ef4444' }, { n: '귤나무', fl: '#ffffff', fr: '#f97316' }, { n: '자두나무', fl: '#fce7f3', fr: '#9333ea' }, { n: '레몬나무', fl: '#fefce8', fr: '#facc15' }];
export const stageOf = (d: number) => { let i = 0; STAGES.forEach((x, j) => { if (d >= x.d) i = j; }); return i; };
export const kindOf = (i: number) => KINDS[i % KINDS.length];
export const isDone = (d: number) => d >= STAGES[5].d;
export const toNext = (d: number) => { const st = stageOf(d); return st >= 5 ? 0 : STAGES[st + 1].d - d; };

const BR: number[][]=[[.6,-1,34,.55],[.66,1,34,.55],[.98,0,90,.22],[.8,-1,52,.42],[.84,1,52,.42],[.46,1,20,.48],[.5,-1,20,.48]];
const NBR=[0,0,3,5,7,7],TH=[0,0,150,215,245,265],TW=[0,0,11,19,23,27];
const VB=['120 290 160 120','120 270 160 140','40 150 320 260','0 60 400 360','0 40 400 380','0 40 400 380'];
function seedSVG(cx: number,cy: number,s=1){return `<g transform="translate(${cx} ${cy}) rotate(-28) scale(${s})"><path d="M0 -17 C11 -11 13 7 0 15 C-13 7 -11 -11 0 -17Z" fill="#b07a45" stroke="#7a5230" stroke-width="2.2"/><path d="M0 -12 C3.5 -4 3.5 6 0 11" stroke="#e3c08f" stroke-width="2.6" fill="none" stroke-linecap="round"/></g>`;}
export function treeSVG(opt: { stage: number; kind: number; mini?: boolean }): string {
  const st=opt.stage,kind=kindOf(opt.kind),gx=200,gy=380;
  const vb=opt.mini?VB[st]:st<2?'0 220 400 200':'0 0 400 420';   // 씨앗·새싹은 아래쪽만 보여 줘서 빈 하늘을 줄임
  let g=opt.mini?'':`<ellipse cx="${gx}" cy="${gy+14}" rx="170" ry="20" fill="#d9f2c4"/>`;
  g+=`<ellipse cx="${gx}" cy="${gy+10}" rx="${opt.mini&&st<2?50:80}" ry="10" fill="#b98b5e"/>`;
  if(st===0){g+=seedSVG(gx,gy-6,opt.mini?1.5:1.6);}
  else if(st===1){g+=`<path d="M${gx} ${gy+6} C${gx-2} ${gy-20} ${gx+4} ${gy-40} ${gx} ${gy-58}" stroke="#4caf50" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="${gx-16}" cy="${gy-64}" rx="18" ry="9" fill="#7bc96f" transform="rotate(-25 ${gx-16} ${gy-64})"/><ellipse cx="${gx+16}" cy="${gy-66}" rx="18" ry="9" fill="#5fb85a" transform="rotate(25 ${gx+16} ${gy-66})"/>`;}
  else{
    const th=TH[st],tw=TW[st],top=gy-th,ends: number[][]=[];
    g+=`<path d="M${gx-tw/2-6} ${gy+6} Q${gx-tw/2} ${gy-th*.5} ${gx-tw/4} ${top} L${gx+tw/4} ${top} Q${gx+tw/2} ${gy-th*.5} ${gx+tw/2+6} ${gy+6} Z" fill="#8b5e3c"/>`;
    BR.slice(0,NBR[st]).forEach(([fr,side,deg,lf])=>{const y0=gy-th*fr,a=deg*Math.PI/180,len=th*lf;
      const x1=gx+side*Math.cos(a)*len,y1=y0-Math.sin(a)*len;ends.push([x1,y1]);
      if(side)g+=`<path d="M${gx} ${y0} Q${gx+side*len*.45} ${y0-6} ${x1} ${y1}" stroke="#8b5e3c" stroke-width="${Math.max(4,tw*.42)}" fill="none" stroke-linecap="round"/>`;});
    if(st>=3){const r=st===3?44:50;
      g+=ends.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#6cc070"/>`).join('')+`<circle cx="${gx}" cy="${top+10}" r="${r+6}" fill="#6cc070"/>`;
      g+=ends.map(([x,y],i)=>`<circle cx="${x+(i%2?8:-8)}" cy="${y-8}" r="${r*.62}" fill="#86d07f"/>`).join('');}
    const leaf=(x: number,y: number)=>[[-11,-2,-30],[11,-2,30],[0,-12,0],[-6,9,-60],[7,9,60]].map(([dx,dy,r])=>`<ellipse cx="${x+dx}" cy="${y+dy}" rx="11" ry="6" fill="#4caf50" transform="rotate(${r} ${x+dx} ${y+dy})"/>`).join('');
    if(st===2)g+=ends.map(([x,y])=>leaf(x,y)).join('');
    if(st>=4){const pts: number[][]=[];ends.forEach(([x,y],i)=>{pts.push([x-18,y-14],[x+20,y+6],[x-4,y+22]);});
      g+=pts.map(([x,y],i)=>st===5&&i%3===1?`<circle cx="${x}" cy="${y}" r="9" fill="${kind.fr}"/><circle cx="${x-3}" cy="${y-3}" r="2.6" fill="#fff" opacity=".7"/><path d="M${x} ${y-9} v-5" stroke="#8b5e3c" stroke-width="2"/>`
        :`<g>${[0,72,144,216,288].map(r=>`<circle cx="${x+6*Math.cos(r*Math.PI/180)}" cy="${y+6*Math.sin(r*Math.PI/180)}" r="4.6" fill="${kind.fl}" stroke="#f0abfc" stroke-width=".8"/>`).join('')}<circle cx="${x}" cy="${y}" r="3" fill="#fde047"/></g>`).join('');}
  }
  return `<svg viewBox="${vb}" class="${opt.mini?'tmini':'tree'}" role="img" aria-label="${STAGES[st].n}">${g}</svg>`;
}
