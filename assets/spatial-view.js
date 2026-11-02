(function(root){
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function attach(id,api){
    const view=api.host.querySelector('.model-view'),original=api.canvas;
    const toolbar=document.createElement('div');toolbar.className='spatial-toolbar';
    toolbar.innerHTML='<div class="spatial-modes" role="group" aria-label="Отображение модели"><button type="button" data-view="3d" aria-pressed="true">3D-модель</button><button type="button" data-view="2d" aria-pressed="false">Схема / график</button></div><button type="button" data-camera="interact" aria-pressed="false">Вращать</button><button type="button" data-camera="reset">Вернуть вид</button>';
    const stage=document.createElement('div');stage.className='spatial-stage';
    const canvas=document.createElement('canvas');canvas.className='spatial-canvas';canvas.width=760;canvas.height=430;canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Трёхмерная модель: '+root.LabModels.specs[id].title);canvas.setAttribute('aria-keyshortcuts','ArrowLeft ArrowRight ArrowUp ArrowDown + - Home');
    const labels=document.createElement('div');labels.className='spatial-labels';stage.append(canvas,labels);
    const zoomLabel=document.createElement('label');zoomLabel.className='spatial-zoom';zoomLabel.innerHTML='Масштаб <input type="range" min="65" max="170" value="100" step="5" aria-label="Масштаб 3D-модели"><output>100%</output>';
    const help=document.createElement('p');help.className='spatial-help';help.textContent='Для жестов включи «Вращать». Поворот — пальцем, масштаб — двумя пальцами или ползунком. Стрелки клавиатуры тоже работают.';
    const caption=document.createElement('p');caption.className='spatial-caption';
    const message=document.createElement('p');message.className='spatial-message';message.setAttribute('role','status');message.hidden=true;
    view.insertBefore(toolbar,original);view.insertBefore(stage,original);view.insertBefore(zoomLabel,original);view.insertBefore(help,original);view.insertBefore(caption,original);view.insertBefore(message,original);
    let renderer=null,mode='3d',interactive=false,disposed=false,lastScene=null;const listeners=[],pointers=new Map(),pool=[];
    const buttons={three:toolbar.querySelector('[data-view="3d"]'),two:toolbar.querySelector('[data-view="2d"]'),interact:toolbar.querySelector('[data-camera="interact"]'),reset:toolbar.querySelector('[data-camera="reset"]')};
    const zoom=zoomLabel.querySelector('input'),zoomOut=zoomLabel.querySelector('output');
    function listen(target,type,handler,options){target.addEventListener(type,handler,options);listeners.push(()=>target.removeEventListener(type,handler,options));}
    function updateVisibility(){
      const three=mode==='3d';original.hidden=three;stage.hidden=!three;zoomLabel.hidden=!three;help.hidden=!three;caption.hidden=!three;buttons.interact.hidden=!three;buttons.reset.hidden=!three;
      buttons.three.setAttribute('aria-pressed',String(three));buttons.two.setAttribute('aria-pressed',String(!three));api.host.dataset.view=mode;
    }
    function fail(){if(disposed)return;mode='2d';message.hidden=false;message.textContent='3D сейчас недоступен. Схема и расчёты продолжают работать; можно повторить включение 3D.';api.host.dataset.spatial='fallback';updateVisibility();}
    function ensure(){
      if(renderer)return !renderer.lost;
      try{renderer=new root.Space3D.Renderer(canvas,{onLost:fail,onRestored(){message.textContent='3D снова доступен — нажми «3D-модель».';buttons.three.disabled=false;}});return true;}catch(e){fail();return false;}
    }
    function paint(){
      if(disposed||mode!=='3d'||!lastScene||!ensure())return;
      try{
        if(!renderer.draw(lastScene))return;api.host.dataset.spatial='ready';message.hidden=true;
        const active=lastScene.labels||[];
        while(pool.length<active.length){const node=document.createElement('button');node.type='button';node.className='spatial-label';node.tabIndex=-1;labels.append(node);pool.push(node);}
        pool.forEach((node,i)=>{
          const item=active[i];if(!item){node.hidden=true;return;}const p=root.Space3D.math.project(item.pos,renderer.vp);
          node.hidden=!p.visible||p.x<.01||p.x>.99||p.y<.02||p.y>.98;node.textContent=item.text;node.style.left=(p.x*100).toFixed(2)+'%';node.style.top=(p.y*100).toFixed(2)+'%';node.disabled=!item.action;node.tabIndex=item.action?0:-1;node.classList.toggle('is-selected',Boolean(item.action?.selected));
          node.onclick=item.action?()=>api.set(item.action.key,item.action.value):null;
        });
      }catch(e){fail();}
    }
    function cameraChanged(){if(renderer){zoom.value=String(Math.round(renderer.camera.zoom*100));zoomOut.textContent=zoom.value+'%';paint();}}
    function setInteractive(on){interactive=on;buttons.interact.setAttribute('aria-pressed',String(on));buttons.interact.textContent=on?'Прокручивать страницу':'Вращать';canvas.style.touchAction=on?'none':'pan-y';if(!on)pointers.clear();}
    listen(buttons.three,'click',()=>{mode='3d';updateVisibility();if(ensure())paint();});listen(buttons.two,'click',()=>{mode='2d';setInteractive(false);updateVisibility();});listen(buttons.interact,'click',()=>setInteractive(!interactive));
    function resetCamera(){if(renderer)renderer.camera={yaw:.55,pitch:.32,zoom:1};zoom.value='100';zoomOut.textContent='100%';paint();}
    listen(buttons.reset,'click',resetCamera);listen(zoom,'input',()=>{if(ensure()){renderer.camera.zoom=Number(zoom.value)/100;cameraChanged();}});
    listen(canvas,'pointerdown',e=>{if(e.pointerType==='touch'&&!interactive)return;if(!ensure())return;if(e.pointerType!=='touch')setInteractive(true);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});
    listen(canvas,'pointermove',e=>{
      const prev=pointers.get(e.pointerId);if(!prev||!renderer)return;
      if(pointers.size===1){renderer.camera.yaw+=(e.clientX-prev.x)*.009;renderer.camera.pitch=clamp(renderer.camera.pitch+(e.clientY-prev.y)*.009,-1.2,1.2);}
      else if(pointers.size===2){const other=[...pointers.entries()].find(([key])=>key!==e.pointerId)[1],before=Math.hypot(prev.x-other.x,prev.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);if(before>5)renderer.camera.zoom=clamp(renderer.camera.zoom*after/before,.65,1.7);}
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});cameraChanged();
    });
    for(const event of ['pointerup','pointercancel','lostpointercapture'])listen(canvas,event,e=>pointers.delete(e.pointerId));
    listen(canvas,'wheel',e=>{if(!interactive||!ensure())return;e.preventDefault();renderer.camera.zoom=clamp(renderer.camera.zoom-e.deltaY*.001,.65,1.7);cameraChanged();},{passive:false});
    listen(canvas,'keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)||!ensure())return;e.preventDefault();
      const c=renderer.camera;if(e.key==='Home'){resetCamera();return;}if(e.key==='ArrowLeft')c.yaw-=.12;if(e.key==='ArrowRight')c.yaw+=.12;if(e.key==='ArrowUp')c.pitch=clamp(c.pitch-.12,-1.2,1.2);if(e.key==='ArrowDown')c.pitch=clamp(c.pitch+.12,-1.2,1.2);if(e.key==='+'||e.key==='=')c.zoom=clamp(c.zoom+.05,.65,1.7);if(e.key==='-')c.zoom=clamp(c.zoom-.05,.65,1.7);cameraChanged();
    });
    updateVisibility();
    return {resetCamera,render(t){if(disposed)return;lastScene=root.SpaceScenes.build(id,api,t);caption.textContent=lastScene.caption;paint();},dispose(){disposed=true;listeners.forEach(fn=>fn());pointers.clear();renderer?.dispose();pool.forEach(n=>n.onclick=null);}};
  }
  root.Lab3D={attach};
})(window);
