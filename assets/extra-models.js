(function(){
  'use strict';
  const {register:add,helpers:h}=window.LabModels, S=window.LabScience;
  const {slider,select,txt,line,dot,rect,arrow,axes,plot,colors}=h;
  add('cell',{
    title:'Живая клетка: исследуй органеллы',ref:'3 · § 3',
    desc:'Поверни разрез животной клетки и выбери органеллу. Проследи условное движение транспортных пузырьков.',
    task:'Найди ядро, митохондрии, ЭПС и аппарат Гольджи. Сопоставь их функции с расположением в пространстве.',
    observe:'У разных отделов клетки разные задачи. Секретируемые белки проходят путь через ЭПС и аппарат Гольджи; митохондрии поддерживают энергетический обмен.',
    limit:'Схема эукариотической животной клетки. Размеры, форма и скорости условны; клетки различаются по составу органелл. Движение пузырьков — иллюстрация транспорта.',
    controls:[select('organelle','Органелла',Object.entries(S.organelles).map(([key,value])=>[key,value[0]]),'nucleus'),slider('opacity','Оболочка: видимость',5,60,15,5,'%'),slider('activity','Темп транспорта',0,100,50,10,'%')]
  },a=>({draw(t){
    const selected=a.s('organelle');Object.assign(a.state,{selected,transport:t*a.v('activity')/50});
    a.c.save();a.c.translate(380,170);a.c.scale(1.5,.8);dot(a.c,0,0,175,'#193944');a.c.restore();
    dot(a.c,340,145,65,'#9177b6');dot(a.c,340,145,22,'#55446b');
    [[225,220],[540,175]].forEach(([x,y])=>{a.c.save();a.c.translate(x,y);a.c.scale(1.7,.8);dot(a.c,0,0,26,'#efad7f');a.c.restore();});
    for(let i=0;i<5;i++)line(a.c,400,90+i*20,500,80+i*20,'#6dc3b1',8);
    for(let i=0;i<5;i++)line(a.c,210,85+i*15,275,75+i*15,'#87bde7',6);
    txt(a.c,S.organelles[selected][0],380,325,23,colors.green);a.read(S.organelles[selected][0]+': '+S.organelles[selected][1]);
  }}));
  add('dna',{
    title:'ДНК → РНК → белок',ref:'3 · § 3',
    desc:'Исследуй антипараллельные цепи ДНК, копирование, транскрипцию и чтение кодонов рибосомой.',
    task:'Пройди транскрипцию по шагам, затем переключись на трансляцию. Сравни кодирующую ДНК, матричную цепь и мРНК.',
    observe:'мРНК строится 5′→3′ комплементарно матрице. AUG задаёт старт и метионин, UAA завершает трансляцию и не кодирует аминокислоту.',
    limit:'Короткий учебный фрагмент стандартного генетического кода: без интронов и процессинга, без промотора и регуляции. Двойная спираль схематическая. Существуют некодирующие РНК и обратная транскрипция.',
    controls:[select('mode','Процесс',[['replicate','Репликация ДНК'],['transcribe','Транскрипция'],['translate','Трансляция']],'transcribe'),slider('step','Шаг по нуклеотидам',0,15,0)],actions:[['next','Следующий шаг']]
  },a=>{
    a.on('next',()=>a.set('step',Math.min(15,a.v('step')+(a.s('mode')==='translate'?3:1))));
    return {change(key){if(key==='mode')a.set('step',0);},draw(){
      const coding=S.codingDNA,template=S.complement(coding),rna=S.transcribe(template),step=a.v('step'),mode=a.s('mode'),n=Math.min(5,Math.floor(step/3)),peptide=S.translation(rna.slice(0,n*3));
      Object.assign(a.state,{coding,template,rna,step,mode,codons:n,peptide});
      txt(a.c,'Кодирующая: 5′ '+coding+' 3′',380,65,23,colors.blue);txt(a.c,'Матричная: 3′ '+template+' 5′',380,120,23,colors.amber);
      if(mode==='translate'){txt(a.c,'мРНК: 5′ '+rna+' 3′',380,190,22,colors.green);txt(a.c,peptide.join(' — ')||'Рибосома ещё не начала чтение',380,255,19);a.read('Прочитано '+n+' из 5 кодонов · аминокислот: '+peptide.length+(n===5?' · UAA: стоп, полипептид освобождается.':'')+(peptide.length?' Цепь: '+peptide.join(' — ')+'.':''));}
      else if(mode==='transcribe'){txt(a.c,'мРНК: 5′ '+rna.slice(0,step)+' 3′',380,225,24,colors.green);a.read('Синтезировано '+step+' из 15 нуклеотидов мРНК. U комплементарен A; кодирующая ДНК совпадает с мРНК при замене T на U.');}
      else{txt(a.c,'Новая цепь: '+S.complement(coding).slice(0,step),380,225,24,colors.green);a.read('Скопировано '+step+' из 15 пар. Репликация полуконсервативная: у дочерней двойной спирали одна родительская и одна новая цепь.');}
    }};
  });
  add('krebs',{
    title:'Цикл Кребса: восемь реакций',ref:'3 · § 3',
    desc:'Пройди реакции от присоединения ацетильной группы до восстановления оксалоацетата. Считай углерод, переносчики и продукты.',
    task:'Найди две реакции с выделением CO₂, одну с GTP/ATP и три с NADH. После восьмой реакции проверь итог оборота.',
    observe:'На ацетил-КоА: 2 CO₂, 3 NADH, 1 эквивалент FADH₂ и 1 GTP/ATP; оксалоацетат регенерируется. Цикл не потребляет O₂ непосредственно, но связан с дыхательной цепью.',
    limit:'Кольцо — карта реакций, а не движение молекул по кругу. В 3D выделен условный углеродный скелет продукта; это не атомная конформация. Уравнения сокращены до основных метаболитов. FAD в комплексе II связан с ферментом. Углерод первого CO₂ не обязан принадлежать только что вошедшему ацетил-КоА.',
    controls:[select('step','Реакция',S.krebs.map((s,i)=>[i+1,(i+1)+'. '+s.name]),1)],actions:[['prev','← Предыдущая'],['next','Следующая →'],['auto','Автопоказ: выкл.']]
  },a=>{
    let auto=false,elapsed=0;a.on('prev',()=>a.set('step',(a.v('step')+6)%8+1));a.on('next',()=>a.set('step',a.v('step')%8+1));
    a.on('auto',()=>{auto=!auto;a.host.querySelector('[data-action="auto"]').textContent='Автопоказ: '+(auto?'вкл.':'выкл.');});
    return {reset(){auto=false;elapsed=0;a.host.querySelector('[data-action="auto"]').textContent='Автопоказ: выкл.';},draw(t,dt){
      if(auto){elapsed+=dt;if(elapsed>=2.4){elapsed=0;a.set('step',a.v('step')%8+1);}}
      const step=a.v('step')-1,s=S.krebs[step];Object.assign(a.state,{step,reaction:s});
      S.krebs.forEach((r,i)=>{const angle=i*Math.PI/4-Math.PI/2,x=380+255*Math.cos(angle),y=165+105*Math.sin(angle);dot(a.c,x,y,i===step?22:14,i===step?colors.amber:colors.blue);txt(a.c,i+1,x,y+6,18,'#102033');});
      txt(a.c,s.name,380,150,24,colors.green);txt(a.c,s.carbon+' атомов C',380,190,21);txt(a.c,'NADH '+s.nadh+' · FADH₂ '+s.fadh+' · GTP/ATP '+s.gtp+' · CO₂ '+s.co2,380,325,19,colors.amber);
      a.read((step+1)+'/8 · '+s.enzyme+' · '+s.reaction+'. '+s.note+' Итог к этому шагу: NADH '+s.nadh+', FADH₂-экв. '+s.fadh+', GTP/ATP '+s.gtp+', CO₂ '+s.co2+'.');
    }};
  });
  add('respiration',{
    title:'Митохондрия: от электронов к ATP',ref:'3 · § 3',
    desc:'Посмотри, как дыхательная цепь создаёт протонный градиент, а ATP-синтаза использует обратный поток H⁺.',
    task:'Убери кислород. Верни его и увеличь утечку H⁺: сравни поток электронов, градиент и синтез ATP.',
    observe:'O₂ — конечный акцептор электронов. Разобщение может поддерживать электронный транспорт, но снижает градиент и образование ATP. Наличие ADP также влияет на работу системы.',
    limit:'Качественная модель одной митохондрии. Проценты — условные индексы, а не кинетика, число ATP или медицинский прогноз. Реальный выход зависит от ткани, субстрата и утечек; фиксированных «36/38 ATP» для любой клетки нет.',
    controls:[slider('glucose','Доступность топлива',0,100,100,10,'%'),slider('oxygen','Доступность O₂',0,100,100,10,'%'),slider('adp','Доступность ADP',0,100,100,10,'%'),slider('leak','Утечка H⁺',0,100,0,10,'%')]
  },a=>({draw(t){
    const state=S.respiration(a.v('glucose'),a.v('oxygen'),a.v('adp'),a.v('leak'));Object.assign(a.state,state);
    h.bars(a.c,[['Электроны',state.electron*100,colors.blue],['Градиент H⁺',state.gradient*100,colors.amber],['Синтез ATP',state.atp*100,colors.green]],100);
    a.read('Условные индексы: электроны '+Math.round(state.electron*100)+'% · градиент '+Math.round(state.gradient*100)+'% · ATP '+Math.round(state.atp*100)+'%.'+(a.v('oxygen')===0?' Без O₂ аэробная цепь остановлена; гликолиз — отдельный путь.':''));
  }}));
  add('frequency',{
    title:'Частота, длина волны и поляризация',ref:'2 · §§ 2–3',
    desc:'Поверни электромагнитную волну: электрическое и магнитное поля перпендикулярны друг другу и направлению распространения.',
    task:'Увеличь частоту при постоянной скорости света. Затем измени амплитуду и угол поляризации.',
    observe:'λ = c/ν. Частота определяет энергию одного фотона hν, а амплитуда классического поля связана с интенсивностью. Поляризация меняет направление колебаний E.',
    limit:'Плоская монохроматическая волна в вакууме, без вещества и границ. B изображено в масштабе cB для сравнения с E. На экране 1 с соответствует 10 фс; линия поля не является траекторией фотона.',
    controls:[slider('frequency','Частота',300,800,500,25,' ТГц'),slider('amplitude','Амплитуда E',.2,1,.6,.1),slider('polarization','Поляризация',0,180,0,15,'°')]
  },a=>({draw(t){
    const light=S.light(a.v('frequency'));Object.assign(a.state,light);
    line(a.c,50,180,710,180);a.c.beginPath();for(let i=0;i<=330;i++){const x=i/330*1500e-9,phase=2*Math.PI*(x/light.wavelength-light.frequency*t*1e-14),y=180-a.v('amplitude')*90*Math.sin(phase);i?a.c.lineTo(50+i*2,y):a.c.moveTo(50,y);}a.c.strokeStyle=colors.blue;a.c.lineWidth=3;a.c.stroke();
    txt(a.c,'E · 0…1500 нм',380,330,21,colors.blue);a.read('ν = '+a.v('frequency')+' ТГц · λ = '+(light.wavelength*1e9).toFixed(1)+' нм · энергия фотона '+light.photonEV.toFixed(3)+' эВ · поляризация '+a.v('polarization')+'° · относительная интенсивность A² = '+(a.v('amplitude')**2).toFixed(2));
  }}));
  add('duality',{
    title:'Волна и частица: две щели',ref:'2 · § 3 · современная иллюстрация',
    desc:'Отправляй фотоны по одному и набирай распределение попаданий. Сравни режимы с информацией о пути и без неё.',
    task:'Набери несколько сотен попаданий. Включи различимость пути и повтори опыт; затем сравни длины волн.',
    observe:'Отдельная регистрация локальна, но частоты многих событий образуют интерференционную картину. Доступная информация о пути убирает интерференционный член в этой идеальной модели.',
    limit:'Дальняя зона, одинаковые щели шириной 10 мкм, экран в 1 м. Изображение установки не в масштабе. Полностью когерентный свет или полностью различимые пути — предельные случаи. Человеческое внимание не меняет физику; речь о взаимодействии с прибором. Классические траектории фотонов здесь не задаются.',
    controls:[slider('wavelength','Длина волны',400,700,500,25,' нм'),slider('separation','Между щелями',30,100,50,10,' мкм'),select('path','Информация о пути',[['unknown','Путь неразличим'],['known','Путь различим']],'unknown')],actions:[['one','Один фотон'],['hundred','Ещё 100 фотонов']]
  },a=>{
    let hits=[];function shoot(n){const visibility=a.s('path')==='known'?0:1;for(let i=0;i<n&&hits.length<2000;i++)hits.push([S.sampleSlit(a.v('wavelength')*1e-9,a.v('separation')*1e-6,visibility),(Math.random()-.5)*1.5]);}
    a.on('one',()=>shoot(1));a.on('hundred',()=>shoot(100));
    return {reset(){hits=[];},change(){hits=[];},draw(){
      const lambda=a.v('wavelength')*1e-9,d=a.v('separation')*1e-6,visibility=a.s('path')==='known'?0:1;Object.assign(a.state,{hits,lambda,d,visibility});
      axes(a.c,'x, мм','Относительная плотность');plot(a.c,x=>S.slitIntensity(x,lambda,d,visibility),-.05,.05,1);hits.forEach(([x,y])=>dot(a.c,60+(x+.05)/.1*640,285+y*12,1.5,colors.amber));
      a.read('Попаданий: '+hits.length+' из 2000 · '+(visibility?'интерференция разрешена':'интерференционный член отсутствует')+' · масштаб λL/d ≈ '+(lambda/d*1000).toFixed(1)+' мм. При изменении условий серия очищается.');
    }};
  });
})();
