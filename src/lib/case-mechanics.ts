// CS:GO Panorama timing reconstructed from popup_capability_decodable.js/.css.
// Reference: https://github.com/Desynci/CSGO_Panorama_Code.pbin
export const OPENING_DELAY_MS = 2400;
export const SPIN_DURATION_MS = 6000;
export const TICK_SECONDS = [0,.063,.125,.188,.250,.313,.375,.438,.500,.563,.625,.688,.750,.813,.875,.938,1,1.063,1.125,1.188,1.250,1.313,1.375,1.483,1.351,1.620,1.701,1.786,1.872,2.003,2.154,2.313,2.466,2.615,2.773,2.941,3.104,3.339,3.630,3.953,4.385,5.004].sort((a,b)=>a-b);
// Grouped iPOS/Nestlé 2025 lunch spending implies roughly 49–52k under
// documented endpoint assumptions. This is a proxy, not an office-only mean.
export const TARGET_LUNCH_PRICE = 50;
// Product choice: spread in log-price space, not measured diner behavior.
export const LOG_PRICE_SPREAD = .35;
export function caseEase(progress:number){const p=Math.max(0,Math.min(1,progress));let lo=0,hi=1;for(let i=0;i<30;i++){const t=(lo+hi)/2,u=1-t,x=3*u*u*t*.075+3*u*t*t*.165+t*t*t;if(x<p)lo=t;else hi=t}const t=(lo+hi)/2,u=1-t;return 3*u*u*t*.82+3*u*t*t+t*t*t}
type PricedMeal={price:number;rarity:number};
export function createFoodSelector<T extends PricedMeal>(population:T[],target=TARGET_LUNCH_PRICE){
 if(!population.length)throw new Error('No meals in population');
 if(!Number.isFinite(target)||target<=0)throw new Error('Invalid target');
 if(population.some(f=>!Number.isFinite(f.price)||f.price<=0))throw new Error('Invalid meal price');
 const min=Math.min(...population.map(f=>f.price)),max=Math.max(...population.map(f=>f.price));
 if(target<min||target>max)throw new Error('Target mean is outside feasible meal prices');
 // Equal total prior weight per distinct price, split among meals at that price.
 // Adding variants at an existing price cannot inflate its aggregate probability.
 const counts=new Map<number,number>();
 population.forEach(f=>counts.set(f.price,(counts.get(f.price)||0)+1));
 const logs=population.map(f=>Math.log(f.price/50));
 const prior=logs.map((x,i)=>-.5*(x/LOG_PRICE_SPREAD)**2-Math.log(counts.get(population[i].price)!));
 function weights(tilt:number){
  const logits=logs.map((x,i)=>prior[i]+tilt*x),anchor=Math.max(...logits);
  const raw=logits.map(x=>Math.exp(x-anchor)),sum=raw.reduce((s,x)=>s+x,0);
  return raw.map(x=>x/sum);
 }
 const mean=(w:number[])=>population.reduce((s,f,i)=>s+f.price*w[i],0);
 let raw:number[];
 if(target===min||target===max){const n=counts.get(target)!;raw=population.map(f=>f.price===target?1/n:0)}
 else{
  let lo=-1,hi=1;
  while(mean(weights(lo))>target)lo*=2;
  while(mean(weights(hi))<target)hi*=2;
  for(let i=0;i<80;i++){const mid=(lo+hi)/2;if(mean(weights(mid))<target)lo=mid;else hi=mid}
  raw=weights((lo+hi)/2);
 }
 const probabilities=new Map(population.map((f,i)=>[f,raw[i]]));
 function weighted(items:T[]){
  if(!items.length)throw new Error('No eligible meals');
  const w=items.map(f=>{const p=probabilities.get(f);if(p===undefined)throw new Error('Unknown meal');return p});
  const sum=w.reduce((s,p)=>s+p,0);if(sum<=0)throw new Error('Eligible meals have no probability');
  return {w,sum};
 }
 return {probabilities,expectedPrice:mean(raw),meanFor(items:T[]){const {w,sum}=weighted(items);return items.reduce((s,f,i)=>s+f.price*w[i],0)/sum},choose(items:T[],random=Math.random):T{
  const {w,sum}=weighted(items);const draw=random();
  if(!Number.isFinite(draw)||draw<0||draw>=1)throw new Error('Random draw must be in [0,1)');
  let remaining=draw*sum;
  for(let i=0;i<items.length;i++)if((remaining-=w[i])<0)return items[i];
  for(let i=items.length-1;i>=0;i--)if(w[i]>0)return items[i];
  throw new Error('Invalid probability total');
 }};
}
export function stopFraction(random=Math.random){return (Math.floor(random()*81)+10)/100}

export function priceRarity(priceInThousands:number){return priceInThousands<=40?0:priceInThousands<=65?1:priceInThousands<=100?2:priceInThousands<=130?3:4}

// Cosmetic motion is independent of reward selection. Every profile is monotonic
// and finishes at zero velocity; vary travel, duration and drag between rolls.
export function createSpinProfile(random = Math.random, reducedMotion = false) {
 if(reducedMotion)return {durationMs:4000+Math.floor(random()*1001),tiles:10+Math.floor(random()*4),friction:2.7+random()*.6};
 return {durationMs:7500+Math.floor(random()*2001),tiles:30+Math.floor(random()*11),friction:2.7+random()*.6};
}
export function spinProgress(progress:number,friction:number) {
 const p=Math.max(0,Math.min(1,progress));
 return 1-Math.pow(1-p,friction);
}

/**
 * Sinh danh sách các thẻ bài trên cuộn quay (reel fillers) theo tiêu chuẩn CS:GO / Casino:
 * 1. Tuyệt đối không bao giờ có 2 ô liền kề trùng nhau (tile[i] !== tile[i - 1]).
 * 2. Vùng sát ô chiến thắng (winnerSlotIndex ± 2 ô) TUYỆT ĐỐI không được trùng với winner,
 *    giúp người dùng nhìn vào cụm thẻ bài trung tâm luôn thấy các món khác nhau, tạo cảm giác
 *    "suýt trúng" kịch tính và loại bỏ hoàn toàn lỗi lặp 3 món liên tiếp.
 * 3. Nếu kho món >= 4, ngăn chặn cả mô hình lặp A - B - A (tile[i] !== tile[i - 2]).
 */
export function generateReelFillers<T extends { name: string }>(
  pool: T[],
  winner: T,
  totalLength: number,
  winnerSlotIndex: number,
  chooseWeighted?: (pool: T[]) => T,
): T[] {
  if (!pool.length) return [];
  if (pool.length === 1) return Array(totalLength).fill(pool[0]);

  const getItemId = (item: T): string => {
    if ("customId" in item && (item as any).customId) return String((item as any).customId);
    if ("image" in item && typeof (item as any).image === "number") return `img_${(item as any).image}`;
    if ("id" in item && (item as any).id) return String((item as any).id);
    return item.name;
  };

  const isSame = (a: T | null | undefined, b: T | null | undefined): boolean => {
    if (!a || !b) return false;
    return getItemId(a) === getItemId(b) || a.name === b.name;
  };

  const result: T[] = [];

  for (let i = 0; i < totalLength; i++) {
    // Vùng xung quanh winner (winner ± 2 ô)
    const isAdjacentToWinner = Math.abs(i - winnerSlotIndex) <= 2;
    const prev = result[i - 1] ?? null;
    const prev2 = pool.length >= 4 ? (result[i - 2] ?? null) : null;

    const isForbidden = (candidate: T): boolean => {
      if (isSame(candidate, prev)) return true;
      if (isAdjacentToWinner && isSame(candidate, winner)) return true;
      if (prev2 && isSame(candidate, prev2)) return true;
      return false;
    };

    let picked: T | null = null;

    if (chooseWeighted) {
      for (let attempt = 0; attempt < 15; attempt++) {
        const candidate = chooseWeighted(pool);
        if (!isForbidden(candidate)) {
          picked = candidate;
          break;
        }
      }
    }

    if (!picked) {
      const validCandidates = pool.filter((c) => !isForbidden(c));
      if (validCandidates.length > 0) {
        picked = validCandidates[Math.floor(Math.random() * validCandidates.length)];
      } else {
        const fallbackCandidates = pool.filter((c) => !isSame(c, prev));
        if (fallbackCandidates.length > 0) {
          picked = fallbackCandidates[Math.floor(Math.random() * fallbackCandidates.length)];
        } else {
          picked = pool[i % pool.length];
        }
      }
    }

    result.push(picked);
  }

  return result;
}
