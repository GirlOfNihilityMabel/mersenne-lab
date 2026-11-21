/* Only one bounded page of digits ever enters the DOM. */
window.MersenneViewer = (() => {
  const $ = id => document.getElementById(id), size = 4096;
  let result = null, digitWorker = null, active = 0;
  const offsets = {number:0, rest:0};
  function save(blob, filename) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function controls(kind, offset, total) {
    offsets[kind] = offset;
    $(kind+'-status').textContent = `Цифры ${offset+1}–${Math.min(offset+size,total)} из ${total.toLocaleString('ru-RU')}. Все цифры доступны страницами и в файле.`;
    $(kind+'-prev').disabled = offset === 0;
    $(kind+'-next').disabled = offset+size >= total;
    $(kind+'-position').value = offset+1;
  }
  function localPage(kind, text, offset=0) {
    offset = Math.max(0,Math.min(offset,Math.max(0,text.length-1)));
    $(kind === 'number' ? 'number' : 'metric-rest').textContent = text.slice(offset,offset+size);
    controls(kind,offset,text.length);
  }
  function remotePage(offset=0, download=false) {
    if (!result) return;
    const currentId=active;
    $('number-stop').hidden=false;
    $('number-status').textContent='Готовим цифры в фоне… Можно отменить.';
    if(!digitWorker){
      const current=new Worker('worker.js?v=large-pages-1');digitWorker=current;
      current.onmessage=e=>{
        if(current!==digitWorker||currentId!==active)return;
        if(e.data.progress){$('number-status').textContent=e.data.progress.message;return;}
        $('number-stop').hidden=true;
        if(e.data.error){$('number-status').textContent=e.data.error;current.terminate();digitWorker=null;return;}
        const r=e.data.result;
        if(r.blob){save(r.blob,r.filename);$('number-status').textContent=`Файл подготовлен: ${r.total.toLocaleString('ru-RU')} цифр.`;return;}
        $('number').textContent=r.text;controls('number',r.offset,r.total);
      };
      current.onerror=()=>{if(digitWorker!==current)return;current.terminate();digitWorker=null;$('number-stop').hidden=true;$('number-status').textContent='Не удалось подготовить цифры. Формула числа остаётся точной.';};
    }
    digitWorker.postMessage({mode:'digits',p:String(result.p),offset,download});
  }
  function page(kind, offset=0) {
    if(!result)return;
    if(kind==='number'&&result.mDeferred){remotePage(offset);return;}
    localPage(kind,kind==='number'?result.m:result.rest,offset);
  }
  function reset() {
    active++;result=null;if(digitWorker)digitWorker.terminate();digitWorker=null;
    $('number-tools').hidden=true;$('rest-tools').hidden=true;
    $('number-stop').hidden=true;
  }
  function set(r) {
    reset();result=r;
    $('number').textContent=r.mDeferred?r.m:r.m.slice(0,size);
    $('number-tools').hidden=!r.mDeferred&&r.m.length<=size;
    $('number-open').hidden=!r.mDeferred;
    if(r.mDeferred){offsets.number=0;$('number-status').textContent='Число записано точной формулой. Откройте цифры по частям или скачайте полную запись.';$('number-prev').disabled=true;$('number-next').disabled=true;$('number-position').value='1';}
    else if(r.m.length>size)localPage('number',r.m);
    if(typeof r.rest==='string'){
      $('metric-rest').textContent=r.rest.slice(0,size);
      $('rest-tools').hidden=r.rest.length<=size;
      if(r.rest.length>size)localPage('rest',r.rest);
    }
  }
  for(const kind of ['number','rest']){
    $(kind+'-prev').onclick=()=>page(kind,Math.max(0,offsets[kind]-size));
    $(kind+'-next').onclick=()=>page(kind,offsets[kind]+size);
    $(kind+'-jump').onclick=()=>{const n=Number($(kind+'-position').value);if(Number.isSafeInteger(n)&&n>=1)page(kind,n-1);};
    $(kind+'-download').onclick=()=>{
      if(!result)return;
      if(kind==='number'&&result.mDeferred){remotePage(0,true);return;}
      save(new Blob([kind==='number'?result.m:result.rest],{type:'text/plain;charset=utf-8'}),`${kind==='number'?'mersenne':'remainder'}-p${result.p}.txt`);
    };
  }
  $('number-open').onclick=()=>remotePage(0);
  $('number-stop').onclick=()=>{if(digitWorker)digitWorker.terminate();digitWorker=null;$('number-stop').hidden=true;$('number-status').textContent='Подготовка цифр отменена. Формула числа остаётся доступной.';};
  return {set,reset};
})();
