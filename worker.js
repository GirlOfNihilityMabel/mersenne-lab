function calculate(p, report = () => {}) {
  if (!Number.isSafeInteger(p) || p < 2) throw Error('Введите целый показатель не меньше 2, точно представимый в браузере.');
  const start = performance.now(), bits = BigInt(p), m = (1n << bits) - 1n;
  const prime = n => { if (n < 2) return false; if (n % 2 === 0) return n === 2; for (let d = 3; d <= n / d; d += 2) if (n % d === 0) return false; return true; };
  const compact = p > 2000, total = prime(p) && p > 2 ? p - 2 : 0;
  const rows = [], stride = Math.max(1, Math.ceil(total / 100));
  const preview = n => { if (!compact) return String(n); if (n < (1n << 120n)) return String(n); return '0x' + (n >> BigInt(Math.max(0, p - 48))).toString(16) + '…' + (n & ((1n << 48n) - 1n)).toString(16).padStart(12, '0'); };
  const base = {p, m: String(m), digits: Math.floor(p * Math.LOG10E * Math.LN2) + 1, rows, compact, total};
  if (!prime(p)) return {...base, prime:false, reason:'exponent', ms:performance.now()-start};
  if (p === 2) return {...base, prime:true, reason:'special', ms:performance.now()-start};
  let s = 4n, lastReport = start;
  for (let i = 1; i <= total; i++) {
    const prev = s;
    let t = s * s - 2n;
    if (t < 0n) t += m;
    // Folding at bit p implements reduction modulo 2^p - 1.
    t = (t & m) + (t >> bits);
    t = (t & m) + (t >> bits);
    s = t >= m ? t - m : t;
    if (!compact || i <= 12 || i % stride === 0 || i === total) rows.push({i, prev:preview(prev), s:preview(s)});
    if (i % 32 === 0) { const now = performance.now(); if (now - lastReport > 150) {report({done:i,total,ms:now-start});lastReport=now;} }
  }
  return {...base, prime:s===0n, rest:String(s), ms:performance.now()-start};
}
onmessage = e => { try { postMessage({result:calculate(e.data, progress => postMessage({progress}))}); } catch (error) { postMessage({error:error.message}); } };
