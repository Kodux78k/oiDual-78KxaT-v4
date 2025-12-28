<!-- ============ TEXT BEAUTY & INTERACTION PATCH — V3 (aditivo) ============ -->
<style id="TEXT_BEAUTY_V3">
:root{
  --txt-card: color-mix(in oklab, var(--panel, #0e1220) 92%, black);
  --txt-bd: color-mix(in oklab, var(--ink, #e8ecf6) 16%, transparent);
  --txt-shadow: 0 6px 24px rgba(0,0,0,.25), inset 0 0 0 1px var(--txt-bd);
  --chip-bg: linear-gradient(42deg, var(--grad-a, #7effa1), var(--grad-b, #67e6ff));
  --chip-ink: #000;
  --paren-ink: color-mix(in oklab, var(--ink, #e8ecf6) 92%, white);
}

/* Tipografia base do texto corrido (aplicamos quando detectado bloco .flow-text) */
.flow-text p{
  text-wrap: pretty;
  line-height: 1.65;
  letter-spacing: .01em;
  margin: .65rem 0;
  hyphens: auto;
}

/* Heading leve detectado por “Titulo:” */
.flow-text .kv-head{
  font-weight: 800;
  letter-spacing:.02em;
  margin: 1.2rem 0 .4rem;
}

/* Parênteses → realce sutil */
.span-paren{
  padding: .05rem .35rem;
  border-radius: .55rem;
  border: 1px solid var(--txt-bd);
  color: var(--paren-ink);
  background: color-mix(in oklab, var(--txt-card) 86%, transparent);
}

/* Chips (colchetes) clicáveis */
.chip, .chip-btn{
  display:inline-grid; place-items:center;
  padding:.25rem .6rem; border-radius:999px;
  background: var(--chip-bg); color: var(--chip-ink);
  font-weight: 700; letter-spacing:.02em;
  box-shadow: 0 2px 10px rgba(0,0,0,.35);
  cursor: pointer; user-select: none;
}
.chip + .chip{ margin-left:.35rem; }

/* Pergunta → card */
.q-card{
  background: var(--txt-card);
  border: 1px solid var(--txt-bd);
  box-shadow: var(--txt-shadow);
  border-radius: 14px;
  padding: .85rem 1rem;
  margin: .9rem 0;
  display:grid; grid-template-columns:auto 1fr; gap:.65rem; align-items:start;
}
.q-card .q-ico{
  inline-size:1.65rem; block-size:1.65rem; border-radius:50%;
  display:grid; place-items:center; font-weight:800; color:#000;
  background: var(--chip-bg);
}
.q-card .q-body{ line-height:1.55; }

/* Overlay de copiar nas listas (usa .list-card do patch anterior) */
.list-card{ position:relative; }
.list-card .copy-badge{
  position:absolute; top:.35rem; right:.35rem;
  font-size:.8rem; padding:.2rem .45rem; border-radius:999px;
  background: color-mix(in oklab, #fff 12%, var(--txt-card));
  border: 1px solid var(--txt-bd);
  color: var(--ink, #e8ecf6); opacity:.65; transition:.2s; user-select:none;
}
.list-card:hover .copy-badge{ opacity:1; }

/* Área que receberá HTML “desescapado” */
.raw-html-card{
  background: var(--txt-card); border: 1px dashed var(--txt-bd);
  border-radius: 14px; padding: .85rem 1rem; margin: .9rem 0;
}
.raw-html-card .raw-note{ color: color-mix(in oklab, var(--ink) 62%, transparent); font-size:.85em; margin-bottom:.35rem; }
</style>

<script id="TEXT_BEAUTY_V3_SCRIPT">
(()=>{'use strict';
if(window.__TEXT_BEAUTY_V3__) return; window.__TEXT_BEAUTY_V3__=true;

/* Utilitários */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(s)=>s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));

/* 0) Toggle edição rápida */
let EDIT_ON=false;
const toggleEdit=()=>{
  EDIT_ON=!EDIT_ON;
  document.body.toggleAttribute('data-edit', EDIT_ON);
  const host = document.getElementById('CONTENT') || document.querySelector('main, article, .render, .reader, body');
  if(host) host.contentEditable = EDIT_ON ? 'plaintext-only' : 'false';
};
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='e'){ e.preventDefault(); toggleEdit(); }
});

/* 1) Key:Value negrito (palavra:) + parênteses + chips [ ]
   - roda apenas em blocos de texto (p, li) e não mexe dentro de code/pre */
const processInline = (root=document)=>{
  const targets = $$('p, li, h1, h2, h3, h4, h5, h6', root).filter(n=>!n.closest('pre, code, .no-beauty'));
  const rxKV = /(^|\s)([A-Za-zÀ-ÿ0-9_]+):(?=\s|$)/g; // Palavra:
  const rxParen = /\(([^\n)]+)\)/g;                  // ( … )
  const rxChip  = /\[\[([^[\]]+)\]\]|\[([^[\]]+)\]/g; // [[a]] | [a]

  for(const el of targets){
    // evita processar múltiplas vezes
    if(el.dataset.inlineProcessed==='1') continue;
    el.dataset.inlineProcessed='1';

    const html = el.innerHTML;
    if(/<pre|<code|contenteditable/i.test(html)) continue;

    let out = html;

    // 1. Palavra:  → <strong>
    out = out.replace(rxKV, (m, sp, key)=> `${sp}<strong class="kv-key">${key}:</strong>`);

    // 2. ( ... )   → span-paren
    out = out.replace(rxParen, (m, inside)=> `<span class="span-paren">(${inside})</span>`);

    // 3. [ ... ] / [[ ... ]]  → chip/chip-btn
    out = out.replace(rxChip, (m, dbl, sgl)=>{
      const label = (dbl||sgl||'').trim();
      return `<span class="${dbl?'chip-btn':'chip'}" data-chip="${esc(label)}">${esc(label)}</span>`;
    });

    el.innerHTML = out;
  }
};

/* 2) Perguntas → .q-card (frases que terminam com '?') */
const processQuestions=(root=document)=>{
  const paras = $$('p', root).filter(n=>!n.closest('.q-card, pre, code, .no-beauty'));
  for(const p of paras){
    const txt = (p.innerText||'').trim();
    if(txt.endsWith('?') && !p.dataset.qProcessed){
      p.dataset.qProcessed='1';
      const wrap=document.createElement('div'); wrap.className='q-card';
      wrap.innerHTML = `<div class="q-ico">?</div><div class="q-body">${esc(txt)}</div>`;
      p.replaceWith(wrap);
    }
  }
};

/* 3) Flow text: melhora texto corrido, cria heading leve se linha for "Algo:" sozinha */
const beautifyFlow=(root=document)=>{
  const container = root.querySelector('.flow-text') || root; // se já tiver classe, usa; senão aplica heurística suave
  $$('p', container).forEach(p=>{
    const t=(p.innerText||'').trim();
    if(/^[^:\n]{3,}:\s*$/.test(t)){ // linha que termina com ":" vira heading leve
      p.classList.add('kv-head');
    }
    // Quebra parágrafos absurdamente longos em dois (heurística)
    if(t.length>600 && t.includes('. ')){
      const mark = t.indexOf('. ', Math.floor(t.length/2));
      if(mark>0){
        const a=t.slice(0, mark+1), b=t.slice(mark+1);
        const p2=p.cloneNode(); p2.textContent=b.trim();
        p.textContent=a.trim();
        p.insertAdjacentElement('afterend', p2);
      }
    }
  });
};

/* 4) Listas copiáveis: badge + click copy */
const enableCopyLists=(root=document)=>{
  const lists = $$('.list-card', root);
  for(const card of lists){
    if(card.querySelector('.copy-badge')) continue;
    const badge = document.createElement('div');
    badge.className='copy-badge'; badge.textContent='copiar';
    card.appendChild(badge);
    card.addEventListener('click', e=>{
      // evita copiar quando clicou em link/botão dentro
      if(e.target.closest('a,button,.chip,.chip-btn')) return;
      const txt = [...card.querySelectorAll('li')].map(li=>li.innerText.trim()).join('\n');
      navigator.clipboard.writeText(txt).then(()=>{
        badge.textContent='copiado!'; setTimeout(()=>badge.textContent='copiar',1200);
      });
    }, {passive:true});
  }
};

/* 5) HTML/SVG pass-through
   - ```html-raw ... ``` → renderiza
   - <div data-raw-html>…(escapado)…</div> → renderiza
*/
const renderRawHTML=(root=document)=>{
  // code fence transform
  $$('pre code', root).forEach(code=>{
    const cls = (code.className||'').toLowerCase();
    if(cls.includes('language-html-raw') || cls.includes('lang-html-raw')){
      const raw = code.textContent;
      const box = document.createElement('div');
      box.className='raw-html-card';
      box.innerHTML = `<div class="raw-note">HTML/SVG renderizado a partir de bloco <code>html-raw</code></div>`;
      const slot = document.createElement('div');
      slot.className='raw-slot';
      // injeta SEM esc, assumindo que o autor confia no conteúdo
      slot.innerHTML = raw;
      box.appendChild(slot);
      const pre = code.closest('pre');
      pre.replaceWith(box);
    }
  });

  // <div data-raw-html>…</div>
  $$('div[data-raw-html]', root).forEach(div=>{
    const raw = div.textContent; // assume texto escapado pelo md
    const box = document.createElement('div'); box.className='raw-html-card';
    const slot = document.createElement('div'); slot.className='raw-slot';
    slot.innerHTML = raw;
    box.appendChild(slot);
    div.replaceWith(box);
  });
};

/* 6) Delegação de cliques para chips (colchetes) */
document.addEventListener('click', e=>{
  const chip = e.target.closest('.chip, .chip-btn');
  if(chip){
    const label = chip.dataset.chip||chip.textContent.trim();
    // dispara um evento customizado para teu bus/orquestrador
    const ev = new CustomEvent('chip:click', {detail:{label, source:'text-beauty-v3'}});
    document.dispatchEvent(ev);
  }
}, {passive:true});

/* 7) Orquestração */
const run=(ctx=document)=>{
  processInline(ctx);
  processQuestions(ctx);
  beautifyFlow(ctx);
  enableCopyLists(ctx);
  renderRawHTML(ctx);
};

if(window.__RENDERBUS__?.on){
  window.__RENDERBUS__.on('after', run, {name:'text-beauty-v3', priority: 96});
}else{
  (document.readyState==='loading') ? document.addEventListener('DOMContentLoaded',()=>run(document)) : run(document);
  new MutationObserver(m=>m.forEach(x=>x.addedNodes&&x.addedNodes.forEach(n=>n.nodeType===1&&run(n))))
    .observe(document.body,{childList:true,subtree:true});
}
})();
</script>
<!-- ============ /TEXT BEAUTY & INTERACTION PATCH — V3 ============ -->

<!-- ============ LIST/ASCII BEAUTY PATCH — V2 (hierarquia + traço-cápsula) ============ -->
<style id="LIST_BEAUTY_V2">
/* sem conflito: usa escopo mais específico, preservando V1 */
:root{
  --list-bg: color-mix(in oklab, var(--panel, #0e1220) 90%, black);
  --list-border: color-mix(in oklab, var(--ink, #e8ecf6) 16%, transparent);
  --list-shadow: 0 6px 24px rgba(0,0,0,.25), inset 0 0 0 1px var(--list-border);
  --list-radius: 16px;
  --list-marker-size: 1.65rem;
  --list-muted: color-mix(in oklab, var(--ink, #e8ecf6) 62%, transparent);
}

/* wrapper visual */
.list-card{ background:var(--list-bg); border-radius:var(--list-radius);
  box-shadow:var(--list-shadow); border:1px solid var(--list-border);
  padding:clamp(.6rem,.9rem,1rem); margin:.85rem 0; }
.list-card ul, .list-card ol{ margin:.25rem 0; padding:0; list-style:none; }
.list-card li{ display:grid; grid-template-columns:auto 1fr; gap:.65rem; align-items:start; padding:.35rem .25rem; }
.list-card li > ul, .list-card li > ol{ margin-top:.35rem; margin-left:1.85rem; }

/* ========= OL: numeração hierárquica ========= */
.list-card ol.ol-neo{ counter-reset:item; }
.list-card ol.ol-neo li{ counter-increment:item; }
.list-card ol.ol-neo li::before{
  /* hierarquia: 1, 1.1, 1.1.1 */
  content:counters(item, ".");
  inline-size:auto; min-inline-size: var(--list-marker-size);
  block-size: var(--list-marker-size);
  padding:0 .55rem; display:grid; place-items:center;
  font-weight:700; font-variant-numeric: tabular-nums;
  border-radius:12px;
  background:linear-gradient(42deg, var(--grad-a, #7effa1), var(--grad-b, #67e6ff));
  color:#000; box-shadow:0 2px 10px rgba(0,0,0,.35);
}
/* reseta contador em sub-listas para formar 1.1, 1.2, etc. */
.list-card ol.ol-neo ol{ counter-reset:item; }

/* ========= UL: bullets padrão (diamante) ========= */
.list-card ul.ul-neo:not(.style-dash):not([data-bullet="dash"]) > li::before{
  content:"";
  inline-size:.9rem; block-size:.9rem; border-radius:8px;
  background:linear-gradient(42deg, var(--grad-a, #7effa1), var(--grad-b, #67e6ff));
  box-shadow:0 1px 6px rgba(0,0,0,.35), 0 0 0 1px color-mix(in oklab, #fff 14%, transparent);
  translate:0 .15rem;
}

/* ========= UL: variante “traço-cápsula” ========= */
.list-card ul.ul-neo.style-dash > li::before,
.list-card ul.ul-neo[data-bullet="dash"] > li::before{
  content: attr(data-marker, "–"); /* pode trocar por texto: data-marker="TIP" */
  display:inline-grid; place-items:center;
  inline-size:auto; min-inline-size:1.35rem; block-size:1.35rem;
  padding:0 .6rem; border-radius:999px; font-weight:700;
  letter-spacing:.02em;
  background:linear-gradient(42deg, var(--grad-a, #7effa1), var(--grad-b, #67e6ff));
  color:#000; box-shadow:0 2px 10px rgba(0,0,0,.35);
}

/* dica/legenda leve */
.list-card .hint{ color:var(--list-muted); font-size:.9em; }

/* ========= ASCII card (igual V1, com leve glow) ========= */
.ascii-card{ background:var(--list-bg); border-radius:calc(var(--list-radius) + 2px);
  border:1px solid var(--list-border); box-shadow:var(--list-shadow),
  0 0 0 1px color-mix(in oklab, var(--grad-b, #67e6ff) 20%, transparent);
  margin:1rem 0; overflow:auto; }
.ascii-card pre{ margin:0; padding:1rem 1.1rem; line-height:1.35;
  font:500 13.5px/1.35 ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace; white-space:pre; tab-size:2; }
.ascii-card .ascii-cap{ padding:.55rem .9rem .6rem; border-top:1px dashed var(--list-border);
  color:var(--list-muted); font-size:.85em; }
</style>

<script id="LIST_BEAUTY_V2_SCRIPT">
(()=>{'use strict';
if(window.__LIST_BEAUTY_V2__) return; window.__LIST_BEAUTY_V2__=true;

const q=(s,r=document)=>[...r.querySelectorAll(s)];

const wrapLists=(root=document)=>{
  const lists = q('ul,ol',root).filter(el=>{
    if(el.closest('nav,menu,.no-beauty,.editor,.toolbar')) return false;
    if(el.classList.contains('ul-neo')||el.classList.contains('ol-neo')) return false; // já cuidado
    return true;
  });
  for(const el of lists){
    const isOL = el.tagName==='OL';
    el.classList.add(isOL?'ol-neo':'ul-neo');
    // preserva estilos existentes do usuário
    if(!el.parentElement.classList.contains('list-card')){
      const wrap = document.createElement('div');
      wrap.className='list-card';
      el.replaceWith(wrap); wrap.appendChild(el);
    }
  }
};

const asciiScore = t=>{
  const box=/[─│┌┐└┘╭╮╰╯═╬╠╣╦╩]+/g, grid=/[-_=+*#\\/|]{3,}/g;
  const L=t.split('\n'); let h=0;
  for(const ln of L){ if(box.test(ln)||grid.test(ln)||ln.trim().startsWith('> ')) h++; }
  return h>=Math.max(2,Math.ceil(L.length*0.2));
};

const enhanceASCII=(root=document)=>{
  const cand=new Set([...q('pre',root),...q('code.language-text, code[class*="language-plaintext"]',root)]);
  q('p',root).forEach(p=>{ const x=p.innerText||''; if(x.includes('\n')&&asciiScore(x)) cand.add(p); });
  for(const el of cand){
    if(el.closest('.ascii-card,.no-beauty')) continue;
    const txt=(el.innerText||'').trim(); if(!asciiScore(txt)) continue;
    const fig=document.createElement('figure'); fig.className='ascii-card';
    const pre=document.createElement('pre'); pre.textContent=txt; fig.appendChild(pre);
    if(!el.closest('pre')){ const fc=document.createElement('figcaption'); fc.className='ascii-cap'; fc.textContent='ASCII • renderizado em bloco'; fig.appendChild(fc); }
    el.replaceWith(fig);
  }
};

/* Heurística opcional: se o UL já tiver data-bullet="dash" ou class style-dash, mantém.
   Caso NÃO tenha, deixamos como diamante (padrão), para não interferir nos teus looks. */
const applyDashCapsuleByAttr=(root=document)=>{
  q('ul.ul-neo',root).forEach(ul=>{
    if(ul.matches('.style-dash,[data-bullet="dash"]')) return;
    // não força nada; o usuário decide via classe/atributo
  });
};

const run=(ctx=document)=>{
  wrapLists(ctx);
  enhanceASCII(ctx);
  applyDashCapsuleByAttr(ctx);
};

if(window.__RENDERBUS__?.on){
  window.__RENDERBUS__.on('after', run, {name:'list-ascii-beauty-v2', priority:95});
}else{
  (document.readyState==='loading') ? document.addEventListener('DOMContentLoaded',()=>run(document)) : run(document);
  new MutationObserver(m=>m.forEach(x=>x.addedNodes&&x.addedNodes.forEach(n=>n.nodeType===1&&run(n))))
    .observe(document.body,{childList:true,subtree:true});
}
})();
</script>
<!-- ============ /LIST/ASCII BEAUTY PATCH — V2 ============ -->
