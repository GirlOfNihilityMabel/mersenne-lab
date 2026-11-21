/* Exact arithmetic; a catalogue verdict never pretends to be a fresh LL run. */
try { importScripts('catalog.js?v=20261121', 'seed-results.js?v=20261121'); } catch {}
const catalogue = self.MersenneCatalog;
const primeBits = catalogue ? Uint8Array.from(atob(catalogue.primeBits), c => c.charCodeAt(0)) : null;
const known = new Set(catalogue?.mersennePrimes || []);
function tablePrime(n) { return !!(primeBits[n >> 3] & (1 << (n & 7))); }
function powMod(a, e, n) { let r=1n; a%=n; while(e){if(e&1n)r=r*a%n;e>>=1n;if(e)a=a*a%n;}return r; }
function exactPrime(n, progress=()=>{}) {
 if(n<2n)return false;
 if(catalogue && n<=BigInt(catalogue.limit))return tablePrime(Number(n));
 for(const d of [2n,3n,5n,7n,11n,13n,17n,19n,23n,29n,31n,37n]){if(n===d)return true;if(n%d===0n)return false;}
 let d=n-1n,s=0;while(!(d&1n)){d>>=1n;s++;}
 for(const base of [2n,325n,9375n,28178n,450775n,9780504n,1795265022n]) {
  if(base%n===0n)continue;let x=powMod(base,d,n);if(x===1n||x===n-1n)continue;
  let passes=false;for(let r=1;r<s;r++){x=x*x%n;if(x===n-1n){passes=true;break;}}
  if(!passes)return false;
 }
 // These witnesses are deterministic below 2^64, never a probable-prime verdict.
 if(n<18446744073709551616n)return true;
 let last=performance.now();
 for(let t=41n;t<=n/t;t+=2n){if(n%t===0n)return false;if(t%4096n===1n&&performance.now()-last>200){progress({stage:'exact-prime',message:'Точная проверка большого числа продолжается…'});last=performance.now();}}
 return true;
}
function parseInteger(value,min=2n){const text=String(value).trim();if(!/^\d+$/.test(text))throw Error('Введите целое число без дробей и знаков.');const n=BigInt(text);if(n<min)throw Error(`Введите целое число не меньше ${min}.`);return n;}
function calculate(value, report=()=>{}, fullTest=false) {
 const pBig=parseInteger(value),start=performance.now();
 if(pBig>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Такой показатель превышает точность счётчика итераций браузера. Введите меньший показатель; результат не был вычислен.');
 const p=Number(pBig),exponentPrime=exactPrime(pBig,report),compact=p>2000;
 const base={p,rows:[],total:0,compact,digits:Math.floor(p*Math.LOG10E*Math.LN2)+1,method:'ll',ms:0};
 let m;try{m=(1n<<pBig)-1n;}catch{throw Error('Браузеру не хватает ресурсов для создания этого числа. Расчёт не выполнен.');}
 base.m=String(m);
 if(!exponentPrime)return {...base,prime:false,reason:'exponent',ms:performance.now()-start};
 if(p===2)return {...base,prime:true,reason:'special',ms:performance.now()-start};
 if(self.MersenneSeeds?.[p])return {...self.MersenneSeeds[p],ms:performance.now()-start};
 if(!fullTest && catalogue && p<=catalogue.limit)return {...base,prime:known.has(p),reason:'catalogue',method:'catalogue',source:catalogue.sources[0],catalogueVersion:catalogue.version,expectedIterations:p-2,ms:performance.now()-start};
 if(!fullTest && p>2000) {
  for(let k=1n;k<=2048n;k++){const q=2n*k*pBig+1n;if(q>=m)break;if(q%8n!==1n&&q%8n!==7n)continue;
   if(powMod(2n,pBig,q)===1n && m%q===0n)return {...base,prime:false,reason:'factor',factor:String(q),ms:performance.now()-start};
  }
 }
 let s=4n,last=performance.now();const total=p-2,stride=Math.max(1,Math.ceil(total/100)),mask48=(1n<<48n)-1n,shift=BigInt(Math.max(0,p-48));
 const preview=n=>!compact||n<(1n<<120n)?String(n):'0x'+(n>>shift).toString(16)+'…'+(n&mask48).toString(16).padStart(12,'0');
 for(let i=1;i<=total;i++){
  const prev=s;let t=s*s-2n;if(t<0n)t+=m;t=(t&m)+(t>>pBig);t=(t&m)+(t>>pBig);s=t>=m?t-m:t;
  if(!compact||i<=12||i%stride===0||i===total)base.rows.push({i,prev:preview(prev),s:preview(s)});
  if(i%32===0){const now=performance.now();if(now-last>150){report({done:i,total,ms:now-start});last=now;}}
 }
 return {...base,total,prime:s===0n,rest:String(s),ms:performance.now()-start};
}
function neighbors(value, report=()=>{}) {
 const n=parseInteger(value,1n);let lower=n-1n,upper=n+1n;
 if(lower>2n&&!(lower&1n))lower--;while(lower>=2n&&!exactPrime(lower,report))lower-=lower===3n?1n:2n;
 if(upper<2n)upper=2n;if(upper>2n&&!(upper&1n))upper++;while(!exactPrime(upper,report))upper+=upper===2n?1n:2n;
 return {n:String(n),lower:lower>=2n?String(lower):null,upper:String(upper),prime:exactPrime(n,report)};
}
onmessage=e=>{try{const d=e.data;const progress=p=>postMessage({progress:p});postMessage({result:d.mode==='neighbors'?neighbors(d.n,progress):calculate(d.p,progress,d.fullTest===true)});}catch(error){postMessage({error:error.message||'Не удалось завершить расчёт.'});}};
