(function(root){
  'use strict';
  const G=root.Space3D, M=root.LabMath, S=root.LabScience, {add,sub,scale,unit,cross}=G.math;
  const P={blue:G.color('#8cbdff'),green:G.color('#9be6d1'),amber:G.color('#f0c88c'),red:G.color('#ef9696'),purple:G.color('#b59ae4'),white:G.color('#e4edf7'),gray:G.color('#647c92'),dark:G.color('#1a3044')};
  const builders={};
  const scene=(caption,distance=8.2)=>({objects:[],lines:[],points:[],labels:[],caption,distance});
  const sphere=(s,p,r,c)=>s.objects.push({kind:'sphere',pos:p,size:Array.isArray(r)?r:[r,r,r],color:c});
  const box=(s,p,size,c,basis)=>s.objects.push({kind:'box',pos:p,size,color:c,basis});
  function tube(s,a,b,r,c,cone=false){const delta=sub(b,a),len=Math.hypot(...delta);if(len<1e-6)return;const v=unit(delta),u=unit(cross(Math.abs(v[1])>.9?[1,0,0]:[0,1,0],v)),w=cross(u,v);s.objects.push({kind:cone?'cone':'cylinder',pos:scale(add(a,b),.5),size:[r,len,r],color:c,basis:[u,v,w]});}
  function arrow(s,a,b,c=P.amber){const v=unit(sub(b,a)),base=sub(b,scale(v,.22));tube(s,a,base,.025,c);tube(s,base,b,.09,c,true);}
  const label=(s,text,p,action)=>s.labels.push({text,pos:p,action});
  const path=(s,points,color=P.gray)=>s.lines.push({points,color});
  function wirebox(s,p,size,col=P.gray){const pts=Array.from({length:8},(_,i)=>[p[0]+(i&1?.5:-.5)*size[0],p[1]+(i&2?.5:-.5)*size[1],p[2]+(i&4?.5:-.5)*size[2]]);for(let i=0;i<8;i++)for(const bit of [1,2,4])if(!(i&bit))path(s,[pts[i],pts[i|bit]],col);}
  function floor(s,y=-1.6){box(s,[0,y-.04,0],[6,.08,4.5],P.dark);for(let i=-3;i<=3;i++)path(s,[[i,y, -2],[i,y,2]],G.color('#35516b',.45));for(let i=-2;i<=2;i++)path(s,[[-3,y,i],[3,y,i]],G.color('#35516b',.45));}
  function ring(s,center,rx,ry,color=P.gray,plane='xy'){path(s,Array.from({length:65},(_,i)=>{const a=i*Math.PI/32;return add(center,plane==='xy'?[rx*Math.cos(a),ry*Math.sin(a),0]:[rx*Math.cos(a),0,ry*Math.sin(a)]);}),color);}
  const fract=x=>x-Math.floor(x);
  const noise=i=>fract(Math.sin(i*127.1+17.7)*43758.5453);
  function molecule(s,type,pos,size=.5,t=0){
    const cs=Math.cos(t),sn=Math.sin(t),transform=p=>add(pos,[size*(p[0]*cs+p[2]*sn),size*p[1],size*(-p[0]*sn+p[2]*cs)]);
    const atoms=type==='water'?[['O',0,0,0],['H',-.76,.59,0],['H',.76,.59,0]]:type==='oxygen'?[['O',-.55,0,0],['O',.55,0,0]]:[['H',-.4,0,0],['H',.4,0,0]];
    const coords=atoms.map(a=>transform(a.slice(1)));for(let i=1;i<coords.length;i++)tube(s,coords[0],coords[i],.07*size,P.white);
    atoms.forEach((a,i)=>sphere(s,coords[i],(a[0]==='O'?.3:.2)*size,a[0]==='O'?P.red:P.white));
  }
  function register(id,build){builders[id]=build;}
  register('gas',(a,t)=>{
    const s=scene('Объёмный сосуд: частицы движутся по трём координатам. Поршень меняет доступный объём.'),w=a.v('volume')/6*5;floor(s);
    wirebox(s,[0,0,0],[5,2.8,2.5]);box(s,[-2.5+w,0,0],[.07,2.8,2.5],G.color('#f0c88c',.35));
    for(const p of a.state.particles||[])sphere(s,[-2.45+p.x*(w-.1),-1.32+p.y*2.64,-1.17+p.z*2.34],.065,P.blue);
    label(s,'Поршень',[-2.5+w,1.7,0]);return s;
  });
  register('evaporation',(a,t)=>{
    const {liquid=160,vapor=20}=a.state,s=scene('Точки — условные группы молекул. Стрелки обозначают встречные потоки, а не траектории всех частиц.');floor(s);wirebox(s,[0,0,0],[4.8,2.8,2.6]);
    const height=Math.max(.02,liquid/180*1.1),surface=-1.35+height;
    box(s,[0,-1.35+height/2,0],[4.65,height,2.45],G.color('#4b9bc7',.16));
    for(let i=0;i<Math.round(liquid/2);i++)sphere(s,[-2.15+noise(i)*4.3,-1.25+noise(i+100)*Math.max(.03,height-.15),-1.1+noise(i+200)*2.2],.065,P.blue);
    for(let i=0;i<Math.round(vapor/2);i++)sphere(s,[-2.1+noise(i+300)*4.2,surface+.17+noise(i+400)*(1.1-surface)+Math.sin(t+i)*.035,-1.1+noise(i+500)*2.2],.06,P.green);
    if(a.s('lid')==='closed')box(s,[0,1.43,0],[4.9,.06,2.7],G.color('#f0c88c',.23));
    arrow(s,[-1,surface,1.2],[-1,.7,1.2],P.amber);arrow(s,[1,.7,1.2],[1,surface,1.2],P.green);
    label(s,'Жидкость',[-1,-1.4,1.6]);label(s,'Пар',[0,1.7,0]);return s;
  });
  register('dissolution',(a,t)=>{
    const n=Math.round(a.state.dissolved||0),s=scene('В кристалле ионы чередуются в трёх измерениях; в растворе нет отдельных пар «молекул соли».');floor(s);wirebox(s,[0,0,0],[5.2,2.8,2.6]);
    const waterHeight=.75*a.v('volume');box(s,[0,-1.35+waterHeight/2,0],[5.1,waterHeight,2.5],G.color('#4b9bc7',.15));
    for(let i=0;i<64-2*n;i++){const x=i%4,y=Math.floor(i/4)%4,z=Math.floor(i/16),positive=(x+y+z)%2===0;sphere(s,[-1.7+x*.27,-1.15+y*.27,-.5+z*.27],positive?.11:.13,positive?P.amber:P.blue);}
    for(let i=0;i<n*2;i++)sphere(s,[.1+noise(i+20)*2.2+Math.sin(t+i)*.07,-1.2+noise(i+30)*(waterHeight-.2),-1+noise(i+40)*2],i%2?.115:.095,i%2?P.blue:P.amber);
    label(s,'Na⁺',[-1.9,1.55,0]);label(s,'Cl⁻',[1.8,1.55,0]);return s;
  });
  register('reaction',(a,t)=>{
    const s=scene('Снимки состава смеси. Поворот молекул служит осмотру геометрии; микроскопический механизм реакции не рассчитывается.'),b=M.balance(a.v('extent'));floor(s);
    [['hydrogen',b.h2,'H₂'],['oxygen',b.o2,'O₂'],['water',b.h2o,'H₂O']].forEach(([type,n,name],k)=>{for(let i=0;i<n;i++)molecule(s,type,[-2.1+k*2.1,-.9+Math.floor(i/2)*.75,(i%2-.5)*1.1],.48,t*.16+i);label(s,name+' · '+n,[-2.1+k*2.1,1.65,0]);});return s;
  });
  register('charges',a=>{
    const s=scene('Объёмные маркеры точечных зарядов. Стрелки показывают силу, а не скорость.'),q=[a.v('q1'),a.v('q2')],d=1.7+a.v('r')*1.8,f=M.coulomb(...q,a.v('r'));floor(s);
    q.forEach((v,i)=>{const x=(i-.5)*d;sphere(s,[x,.1,0],.34,v>0?P.red:v<0?P.blue:P.gray);label(s,(v>0?'+':'')+v+' нКл',[x,.75,0]);});
    if(f){const dir=f>0?-1:1,len=Math.min(1.1,.18+Math.abs(f)*1.4e7);arrow(s,[-d/2+dir*.4,.1,0],[-d/2+dir*(.4+len),.1,0]);arrow(s,[d/2-dir*.4,.1,0],[d/2-dir*(.4+len),.1,0]);}
    label(s,'r = '+a.v('r').toFixed(2)+' м',[0,-.8,0]);return s;
  });
  register('photons',(a,t)=>{
    const s=scene('Вертикаль — шкала энергии, не высота электрона в пространстве. Условный атом имеет уровни 0, 2 и 5 эВ.');floor(s);
    [0,2,5].forEach(e=>{const y=-1.2+e*.45;box(s,[.8,y,0],[2.5,.035,1.1],G.color('#8cbdff',.22));label(s,e+' эВ',[2.2,y+.05,0]);});
    sphere(s,[.8,-1.2+(a.state.level||0)*.45,0],.15,P.green);
    const pulse=a.state.pulse;if(pulse>=0){const x=-2.8+Math.min(pulse,1)*3.6;for(let i=0;i<25;i++)sphere(s,[x-.6+i*.024,.15+Math.sin(i*.5)*.1,0],.025,P.amber);}
    label(s,'hν = '+a.v('e')+' эВ',[-1.8,1.5,0]);return s;
  });
  register('enzyme',(a,t)=>{
    const s=scene('Условные активные центры и субстрат. Геометрия не является структурой конкретного белка.'),n=a.v('enzyme'),sat=a.v('substrate')/(20+a.v('substrate'));floor(s);
    for(let i=0;i<n;i++){
      const p=[-2.1+(i%5)*1.05,-.6,Math.floor(i/5)*1.4-.7];sphere(s,p,[.33,.3,.25],P.purple);sphere(s,add(p,[-.22,.2,0]),.2,P.purple);sphere(s,add(p,[.22,.2,0]),.2,P.purple);
      if(fract(t*.45+i*.173)<sat)sphere(s,add(p,[0,.33,0]),.13,P.amber);
    }
    for(let i=0;i<Math.round(a.v('substrate')*.45);i++)sphere(s,[-2.5+noise(i+70)*5,.4+noise(i+80)*.8,-1.3+noise(i+90)*2.6],.065,P.green);
    label(s,'Субстрат',[0,1.75,0]);return s;
  });
  register('energy',a=>{
    const s=scene('Положение тела соответствует доле спуска. U, K и Q показаны числами под моделью; размеры и уклон условны.'),f=a.v('part')/100,top=[-2.1,1.1,0],bottom=[2.1,-1.15,0];floor(s);
    for(const z of [-.6,.6])tube(s,add(top,[0,-.15,z]),add(bottom,[0,-.15,z]),.07,P.gray);
    const p=add(scale(top,1-f),scale(bottom,f));box(s,add(p,[0,.25,0]),[.5+.025*a.v('mass'),.45,.9],P.blue);
    const loss=a.v('loss')/100;for(let i=0;i<Math.round(loss*f*30);i++)sphere(s,add(p,[-noise(i)*.7,.4+noise(i+10)*.6,(noise(i+20)-.5)*.8]),.035,P.amber);
    label(s,'H = '+a.v('height')+' м',[-2.1,1.9,0]);label(s,'Спуск '+a.v('part')+'%',[1.3,1.8,0]);return s;
  });
  register('pulley',a=>{
    const s=scene('Обобщённая модель несущих ветвей. Это не инструкция запасовки конкретного полиспаста.'),n=a.v('n'),y=-1.2+a.v('height')*.22;floor(s);box(s,[0,1.5,0],[4.5,.14,1.2],P.gray);box(s,[0,y,0],[2,.45,1],P.blue);
    for(let i=0;i<n;i++){const x=(i-(n-1)/2)*.45;tube(s,[x,1.4,0],[x,y+.25,0],.025,P.amber);sphere(s,[x,1.25,0],.12,P.gray);arrow(s,[x,y+.5,.1],[x,y+1,.1],P.green);}
    tube(s,[2,1.4,0],[2,-.5,0],.025,P.amber);arrow(s,[2,-.45,.1],[2,-1.1,.1]);label(s,'n = '+n,[0,2,0]);label(s,'F = '+(a.v('mass')*9.81/n).toFixed(1)+' Н',[2,0,0]);return s;
  });
  register('spring',(a,t)=>{
    const s=scene('Объёмная пружина и груз; колебания без трения. Период и энергия связаны с теми же параметрами, что и график.'),w=Math.sqrt(a.v('k')/a.v('mass')),x=a.v('amp')*Math.cos(w*t)*2.5,X=1+x;floor(s);
    box(s,[-2.2,-.5,0],[.15,1.8,1.6],P.gray);box(s,[X,-.9,0],[.7,.7,.8],P.amber);
    let last=[-2.1,-.9,0];for(let i=0;i<=90;i++){const f=i/90,p=[-2.1+(X-.4+2.1)*f,-.9+Math.cos(f*Math.PI*18)*.2,Math.sin(f*Math.PI*18)*.2];tube(s,last,p,.026,P.blue);last=p;}
    label(s,'x = '+(x/2.5).toFixed(2)+' м',[X,.5,0]);return s;
  });
  register('ranging',(a,t)=>{
    const s=scene('Установка показана без масштаба. Численные расстояния рассчитываются из времени или углов, а не из размеров картинки.');floor(s);
    if(a.s('mode')==='echo'){
      const left=[-2.2,0,0],right=[2.2,0,0];box(s,add(left,[0,-.7,0]),[.6,.8,.6],P.blue);tube(s,add(left,[0,-.3,0]),add(left,[0,.5,0]),.04,P.gray);box(s,right,[.1,2,2],P.gray);
      arrow(s,add(left,[0,.5,0]),add(right,[0,.5,0]),P.green);arrow(s,add(right,[0,-.5,0]),add(left,[0,-.5,0]),P.blue);
      const phase=fract(t*.35),f=phase<.5?phase*2:2-phase*2;sphere(s,[-2.2+4.4*f,phase<.5?.5:-.5,0],.1,P.amber);label(s,'Передатчик',[-2.2,1.5,0]);label(s,'Отражатель',[2.2,1.5,0]);
    }else{const p=[[-2.1,-.8,1.3],[2.1,-.8,1.3],[0,.7,-1.7]];p.forEach((v,i)=>{box(s,v,[.35,.5,.35],i===2?P.amber:P.blue);});path(s,[p[0],p[2],p[1]],P.green);path(s,[p[0],p[1]],P.amber);label(s,'θ = '+a.v('angle')+'°',[0,1.4,-1.7]);label(s,'База '+a.v('base')+' км',[0,-.7,1.7]);}return s;
  });
  register('dating',a=>{
    const s=scene('Каждый шар — условное ядро. Синий цвет показывает ожидаемую оставшуюся долю, серый — преобразовавшуюся; это не случайные времена распада.'),remaining=Math.round(128*a.v('fraction')/100);floor(s);
    for(let i=0;i<128;i++)sphere(s,[(i%8-3.5)*.5,(Math.floor(i/8)%4-1.5)*.5,(Math.floor(i/32)-1.5)*.5],.115,i<remaining?P.blue:G.color('#35465a'));
    label(s,'Исходный изотоп: '+a.v('fraction')+'%',[0,1.7,0]);return s;
  });
  register('coins',a=>{
    const s=scene('Показаны первые 40 результатов серии. Цвет и знак обозначают орла или решку; результат берётся из той же серии, что и числа.'),outcomes=a.state.outcomes||[];floor(s);
    outcomes.slice(0,40).forEach((head,i)=>{const p=[(i%8-3.5)*.65,-1.4,Math.floor(i/8)*.66-1.3];tube(s,add(p,[0,-.04,0]),add(p,[0,.04,0]),.25,head?P.amber:P.blue);if(head){tube(s,add(p,[-.09,.05,0]),add(p,[.09,.05,0]),.025,P.dark);tube(s,add(p,[0,.05,-.09]),add(p,[0,.05,.09]),.025,P.dark);}else sphere(s,add(p,[0,.06,0]),.055,P.dark);});
    if(!outcomes.length)label(s,'Нажми «Бросить монеты»',[0,.3,0]);else label(s,'+ орёл   • решка',[0,1.5,0]);return s;
  });
  register('walk',a=>{
    const s=scene('Линии — первые 10 траекторий, точки — окончания всех 300. Оси имеют одинаковый масштаб; облако можно поворачивать.'),paths=a.state.paths||[],theory=a.state.theory||{mean:0,sigma:10},norm=2.3/Math.max(5,theory.mean+3*theory.sigma);
    for(let axis=0;axis<3;axis++){const end=[0,0,0];end[axis]=2.7;path(s,[scale(end,-1),end],P.gray);label(s,['x','y','z'][axis],scale(end,1.08));}
    paths.slice(0,10).forEach((p,i)=>path(s,p.map(v=>scale(v,norm)),i===0?P.amber:G.color('#8cbdff',.4)));
    s.points.push({positions:paths.map(p=>scale(p.at(-1),norm)),color:P.green,size:4});sphere(s,[0,0,0],.07,P.amber);return s;
  });
  register('cell',(a,t)=>{
    const s=scene('Разрез животной клетки. Подписи можно нажимать: выбор связан с объяснением справа. Масштабы органелл условны.',6.8),selected=a.s('organelle');
    const positions={nucleus:[-.7,.15,0],mitochondria:[1.2,-.65,.65],er:[.4,.1,-.7],golgi:[-1.5,-.5,.8],ribosome:[.5,.9,.5],lysosome:[1.3,.8,-.4],membrane:[0,1.8,0]};
    sphere(s,[0,0,0],[2.8,1.8,1.9],G.color('#72c9b0',a.v('opacity')/250));
    for(const plane of ['xy','xz'])ring(s,[0,0,0],2.8,plane==='xy'?1.8:1.9,G.color('#8cbdff',.5),plane);
    sphere(s,positions.nucleus,[.85,.8,.75],G.color('#b59ae4',.55));sphere(s,add(positions.nucleus,[0,.1,.2]),.25,P.purple);
    for(let i=0;i<6;i++)ring(s,add(positions.nucleus,[(i%2-.5)*.3,(i-3)*.14,0]),.45,.18,G.color('#dfcbff',.65));
    for(const p of [positions.mitochondria,[.8,-.4,-1]]){sphere(s,p,[.7,.3,.34],G.color('#f0a97b',.6));for(let i=0;i<5;i++){const x=p[0]+(i-2)*.19;path(s,[[x,p[1]-.15,p[2]-.13],[x+.08,p[1]+.14,p[2]],[x,p[1]-.15,p[2]+.13]],P.red);}}
    for(let i=0;i<5;i++){const z=-.7+i*.12;path(s,[[.1,-.2,z],[.7,-.2,z],[.9,.35,z],[.35,.6,z]],P.blue);sphere(s,[.3+i*.13,.6,z],.045,P.green);}
    for(let i=0;i<5;i++)sphere(s,add(positions.golgi,[0,(i-2)*.12,0]),[.55,.055,.3],P.purple);
    for(let i=0;i<24;i++)sphere(s,[-1.8+noise(i)*3.7,-1.2+noise(i+30)*2.3,-1.4+noise(i+60)*2.8],.035,P.green);
    sphere(s,positions.lysosome,.22,P.amber);
    for(let i=0;i<5;i++){const f=fract((a.state.transport||0)*.12+i*.2);sphere(s,[-.1-f*1.5,.2-f*.5,.3+f*.7],.07,P.green);}
    const anchors={nucleus:[-1.3,.85,.8],mitochondria:[1.4,-1,.9],er:[1.3,.2,-1],golgi:[-2,-.65,1.3],ribosome:[-.1,1.5,.3],lysosome:[1.8,1,-.5],membrane:[0,2.1,0]},short={nucleus:'Ядро',mitochondria:'Мито.',er:'ЭПС',golgi:'Гольджи',ribosome:'Рибосомы',lysosome:'Лизосомы',membrane:'Мембрана'};
    ring(s,positions[selected],selected==='nucleus'?.95:.5,selected==='nucleus'?.9:.4,P.green);for(const key of Object.keys(positions))label(s,key===selected?S.organelles[key][0]:short[key],anchors[key],{key:'organelle',value:key,selected:key===selected});return s;
  });
  register('dna',a=>{
    const s=scene('Парные основания соединяют две антипараллельные цепи. Полосы и ферменты условны; процесс читается по шагам.',8.2),st=a.state,mode=st.mode||'transcribe',step=st.step||0;
    for(let i=0;i<15;i++){
      const angle=i*2*Math.PI/10.5,y=(i-7)*.28,split=mode==='replicate'&&i<step?.65:0;
      const p=[-1.2+Math.cos(angle)*.5-split,y,-Math.sin(angle)*.5],q=[-1.2-Math.cos(angle)*.5+split,y,Math.sin(angle)*.5];
      const base=(st.coding||S.codingDNA)[i],col=base==='A'||base==='T'?P.amber:P.green;
      sphere(s,p,.075,P.blue);sphere(s,q,.075,P.purple);if(mode!=='replicate'||i>=step)tube(s,p,q,.035,col);
      if(i){const prev=(i-1)*2*Math.PI/10.5,oldY=(i-8)*.28,oldSplit=mode==='replicate'&&i-1<step?.65:0;tube(s,p,[-1.2+Math.cos(prev)*.5-oldSplit,oldY,-Math.sin(prev)*.5],.025,P.blue);tube(s,q,[-1.2-Math.cos(prev)*.5+oldSplit,oldY,Math.sin(prev)*.5],.025,P.purple);}
      if(mode==='replicate'&&i<step){const pn=add(p,[.2,0,0]),qn=add(q,[-.2,0,0]);sphere(s,pn,.06,P.green);sphere(s,qn,.06,P.green);tube(s,p,pn,.025,col);tube(s,q,qn,.025,col);if(i){const prev=(i-1)*2*Math.PI/10.5,oldY=(i-8)*.28;tube(s,pn,[-1.2+Math.cos(prev)*.5-.65+.2,oldY,-Math.sin(prev)*.5],.022,P.green);tube(s,qn,[-1.2-Math.cos(prev)*.5+.65-.2,oldY,Math.sin(prev)*.5],.022,P.green);}}
      if(mode==='transcribe'&&i<step){const r=[1+(i-7)*.13, .6-Math.abs(i-7)*.12,.3];sphere(s,r,.08,P.amber);if(i)tube(s,r,[1+(i-8)*.13,.6-Math.abs(i-8)*.12,.3],.025,P.amber);}
    }
    label(s,'5′ кодирующая',[-1.8,-2.35,0]);label(s,'3′ матричная',[-.4,-2.35,0]);label(s,'3′ / 5′',[-1.2,2.4,0]);
    if(mode==='translate'){
      for(let i=0;i<15;i++)sphere(s,[.9+(i-7)*.17,.1,.4],.065,Math.floor(i/3)<st.codons?P.amber:P.green);
      sphere(s,[.9+(Math.min(st.codons,4)*3-6)*.17,.1,.4],[.4,.45,.3],G.color('#b59ae4',.45));
      (st.peptide||[]).forEach((name,i)=>{const p=[.9+i*.3,.9+i*.2,.4];sphere(s,p,.12,P.green);if(i)tube(s,p,[.9+(i-1)*.3,.9+(i-1)*.2,.4],.04,P.white);});label(s,'мРНК 5′ → 3′',[1,-.55,.4]);label(s,st.codons===5?'UAA · стоп':'Рибосома',[1,1.8,.4]);
    }else label(s,mode==='transcribe'?'РНК 5′ '+(st.rna||'').slice(0,step)+' 3′':'Новые цепи ДНК',[1.3,1.1,.4]);return s;
  });
  register('krebs',a=>{
    const s=scene('Кольцо — карта восьми реакций. В центре: условный углеродный скелет выбранного продукта, не точная конформация.',9),step=a.state.step||0,r=S.krebs[step];
    const ps=S.krebs.map((_,i)=>{const q=i*Math.PI/4;return [2.6*Math.sin(q),1.7*Math.cos(q),-.4];});
    path(s,[...ps,ps[0]],P.gray);ps.forEach((p,i)=>{sphere(s,p,i===step?.24:.13,i===step?P.amber:P.blue);label(s,String(i+1),add(p,[0,.3,.05]),{key:'step',value:i+1,selected:i===step});});
    for(let i=0;i<r.carbon;i++){const p=[(i-(r.carbon-1)/2)*.4,-.1+(.18*(i%2)),.7];sphere(s,p,.13,P.gray);if(i)tube(s,p,[(i-1-(r.carbon-1)/2)*.4,-.1+(.18*((i-1)%2)),.7],.045,P.white);}
    label(s,r.name,[0,.7,.9]);label(s,r.carbon+'C',[0,-.7,.9]);label(s,'NADH '+r.nadh+'  ·  FADH₂ '+r.fadh,[0,-2.05,.2]);label(s,'GTP/ATP '+r.gtp+'  ·  CO₂ '+r.co2,[0,-2.4,.2]);return s;
  });
  register('respiration',(a,t)=>{
    const s=scene('Разрез митохондрии: H⁺ накапливаются вне матрикса и возвращаются через ATP-синтазу. Индексы и масштабы условны.',8.8),st=a.state;
    sphere(s,[0,0,0],[2.9,1.5,1.8],G.color('#ecaa7f',.08));ring(s,[0,0,0],2.9,1.5,P.gray);ring(s,[0,0,0],2.6,1.3,P.amber,'xz');
    for(let i=0;i<5;i++){const x=-2+i;path(s,[[x,.25,-1.1],[x,-.85,-.7],[x+.2,-.85,.7],[x+.2,.25,1.1]],P.amber);}
    const xs=[-1.9,-1,.2,1.3];xs.forEach((x,i)=>{box(s,[x,.25,0],[.38,.55,.5],[P.blue,P.purple,P.green,P.red][i]);label(s,['I','II','III','IV'][i],[x,-.2,.3]);});
    const route=[[-1.9,.3,0],[-.4,.3,.6],[.2,.3,0],[.8,.4,.6],[1.3,.3,0]];path(s,route,P.blue);
    for(let i=0;i<Math.round((st.electron||0)*12);i++){const f=fract(t*.4+i/12)*(route.length-1),j=Math.floor(f),p=add(scale(route[j],1-fract(f)),scale(route[Math.min(j+1,4)],fract(f)));sphere(s,p,.055,P.blue);}
    for(let i=0;i<Math.round((st.gradient||0)*28);i++)sphere(s,[-2.3+noise(i+10)*4.6,.85+noise(i+20)*.25,-1+noise(i+30)*2],.05,P.amber);
    for(const x of [-1.9,.2,1.3])if(st.electron>0)arrow(s,[x,.55,-.3],[x,1.05,-.3],P.amber);
    tube(s,[2.1,-.4,0],[2.1,.8,0],.12,P.green);sphere(s,[2.1,-.6,0],[.3,.18,.3],P.green);label(s,'ATP-синтаза',[2.2,-1.1,.4]);
    if(st.atp>0){arrow(s,[2.1,.9,.4],[2.1,-.3,.4],P.green);const f=fract(t*(.2+st.atp));sphere(s,[2.1,.9-f*1.2,.4],.07,P.amber);}
    if(a.v('leak')>0)arrow(s,[-.4,.9,1],[-.4,-.4,1],P.red);
    if(a.v('oxygen')>0)molecule(s,'oxygen',[1.7,.3,.8],.25);
    label(s,'Межмембранное пространство',[0,1.65,0]);label(s,'Матрикс',[-1,-1.2,.7]);return s;
  });
  register('frequency',(a,t)=>{
    const s=scene('Синяя линия — E, зелёная — cB. Это значения полей в пространстве, а не форма траектории фотона.',8.5),light=S.light(a.v('frequency')),amp=a.v('amplitude'),theta=a.v('polarization')*Math.PI/180;
    path(s,[[-2.8,0,0],[2.8,0,0]],P.gray);arrow(s,[2.3,0,0],[2.9,0,0],P.white);label(s,'Распространение',[2.2,-.7,0]);
    let prevE=null,prevB=null;for(let i=0;i<=100;i++){
      const x=i/100*1500e-9,X=-2.7+i/100*5.4,f=amp*Math.sin(2*Math.PI*(x/light.wavelength-light.frequency*t*1e-14));
      const E=[X,f*Math.cos(theta),f*Math.sin(theta)],B=[X,-f*Math.sin(theta),f*Math.cos(theta)];if(prevE){tube(s,prevE,E,.018,P.blue);tube(s,prevB,B,.018,P.green);}prevE=E;prevB=B;
      if(i%10===0){path(s,[[X,0,0],E],P.blue);path(s,[[X,0,0],B],P.green);}
    }
    label(s,'E',[0,1.4,0]);label(s,'cB',[0,0,1.4]);label(s,'ν '+a.v('frequency')+' ТГц · λ '+(light.wavelength*1e9).toFixed(0)+' нм',[0,1.9,0]);return s;
  });
  register('duality',a=>{
    const s=scene('Каждая точка на экране — отдельная регистрация. Путь конкретного фотона между источником и экраном не рисуется.',9.6),half=a.v('separation')/50*.35,gap=.14;
    floor(s);box(s,[0,0,-2.25],[5,2.5,.06],P.dark);
    const intervals=[[-2.3,-half-gap/2],[-half+gap/2,half-gap/2],[half+gap/2,2.3]];
    for(const [x0,x1]of intervals)box(s,[(x0+x1)/2,0,0],[x1-x0,2.2,.09],G.color('#647c92',.8));
    box(s,[0,0,2.3],[.5,.45,.55],P.blue);tube(s,[0,0,2],[0,0,1.7],.12,P.gray);label(s,'Источник',[0,.7,2.3]);label(s,'Две щели',[0,1.6,0]);label(s,'Экран',[0,1.65,-2.2]);
    const hits=a.state.hits||[];s.points.push({positions:hits.map(([x,y])=>[x/.05*2.4,y,-2.2]),color:P.amber,size:3});
    if(a.s('path')==='known')for(const x of [-half,half]){box(s,[x,-.4,.15],[.2,.3,.2],P.red);}return s;
  });
  root.SpaceScenes={has:id=>Boolean(builders[id]),build:(id,a,t)=>builders[id](a,t),ids:()=>Object.keys(builders),helpers:{scene,sphere,box,tube,path,arrow,label,wirebox,floor,ring,molecule,P}};
})(window);
