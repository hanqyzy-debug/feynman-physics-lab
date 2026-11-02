(function(){
'use strict';
// Older iPad versions may not provide CanvasRenderingContext2D.roundRect.
if(window.CanvasRenderingContext2D&&!CanvasRenderingContext2D.prototype.roundRect){CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h,r){r=typeof r==='number'?r:10;r=Math.min(r,w/2,h/2);this.moveTo(x+r,y);this.lineTo(x+w-r,y);this.quadraticCurveTo(x+w,y,x+w,y+r);this.lineTo(x+w,y+h-r);this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);this.lineTo(x+r,y+h);this.quadraticCurveTo(x,y+h,x,y+h-r);this.lineTo(x,y+r);this.quadraticCurveTo(x,y,x+r,y);return this;};}
window.LegacyLab={start(items,before=()=>{}){
 const box=document.createElement('div');box.className='legacy-toolbar';box.innerHTML='<a href="index.html">← Курс · главы 1–6</a><button type="button" aria-pressed="false">Пауза анимаций</button><span role="status">Проверяем модели…</span>';
 document.querySelector('main').prepend(box);const button=box.querySelector('button'),status=box.querySelector('span');let paused=matchMedia('(prefers-reduced-motion: reduce)').matches,last=0,raf=0;const failed=new Set();
 function update(){button.textContent=paused?'Включить анимации':'Пауза анимаций';button.setAttribute('aria-pressed',String(paused));}update();button.onclick=()=>{paused=!paused;last=0;update();};
 function render(item,ts,dt){if(failed.has(item[0]))return;try{item[1](ts,dt);}catch(e){failed.add(item[0]);status.textContent='Некоторые модели не запустились; остальные доступны.';console.error('Model '+item[0],e);}}
 items.forEach(item=>render(item,0,0));status.textContent=failed.size?'Некоторые модели не запустились; остальные доступны.':'Загружены модели: '+items.length+' / '+items.length;
 function redraw(){before(performance.now(),0);items.forEach(item=>render(item,performance.now(),0));}
 ['input','change','click','keydown'].forEach(type=>document.addEventListener(type,redraw));
 document.querySelectorAll('label').forEach(label=>{const field=label.querySelector('select,input');if(field&&!field.hasAttribute('aria-label')){const name=[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join(' ').trim();if(name)field.setAttribute('aria-label',name);}});
 function frame(ts){if(!last||ts-last>=1000/30){const dt=!last||paused||document.hidden?0:Math.min((ts-last)/1000,.1);last=ts;if(!document.hidden&&!paused){before(ts,dt);items.forEach(item=>{const el=document.getElementById(item[0]),b=el.getBoundingClientRect();if(b.bottom>=-100&&b.top<=innerHeight+100)render(item,ts,dt);});}}raf=requestAnimationFrame(frame);}requestAnimationFrame(frame);
 document.addEventListener('visibilitychange',()=>last=0);window.addEventListener('pagehide',()=>cancelAnimationFrame(raf));window.addEventListener('pageshow',e=>{if(e.persisted){last=0;raf=requestAnimationFrame(frame);}});
}};
})();
