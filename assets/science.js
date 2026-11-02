(function(root) {
  'use strict';
  const C=299792458,H=6.62607015e-34,EV=1.602176634e-19;
  const codingDNA='ATGGCCTTACGATAA';
  const complement=sequence=>[...sequence].map(b=>({A:'T',T:'A',C:'G',G:'C'}[b]||'?')).join('');
  const transcribe=template=>[...template].map(b=>({A:'U',T:'A',C:'G',G:'C'}[b]||'?')).join('');
  const codons={AUG:'Метионин',GCC:'Аланин',UUA:'Лейцин',CGA:'Аргинин',UAA:'Стоп'};
  function translation(rna) {
    const result=[];for(let i=0;i+2<rna.length;i+=3){const codon=rna.slice(i,i+3),name=codons[codon]||'Не задано';if(name==='Стоп')break;result.push(name);}return result;
  }
  const organelles={
    nucleus:['Ядро','Ядерная ДНК хранит наследственную информацию. Здесь идёт транскрипция; ядерные поры регулируют обмен с цитоплазмой.'],
    mitochondria:['Митохондрии','Двойная мембрана. Матрикс содержит ферменты цикла Кребса, внутренняя мембрана — дыхательную цепь и ATP-синтазу. Есть собственная ДНК.'],
    er:['Эндоплазматическая сеть','На рибосомах шероховатой ЭПС синтезируются секретируемые и мембранные белки. Гладкая ЭПС участвует, в частности, в обмене липидов.'],
    golgi:['Аппарат Гольджи','Изменяет, сортирует и направляет белки и липиды в нужные отделы клетки и наружу.'],
    ribosome:['Рибосомы','Читают мРНК и собирают полипептид. Каталитическое ядро рибосомы содержит рРНК.'],
    lysosome:['Лизосомы','Кислая внутренняя среда и гидролитические ферменты обеспечивают расщепление и переработку компонентов.'],
    membrane:['Клеточная мембрана','Липидный бислой с белками отделяет клетку от среды и обеспечивает избирательный обмен и передачу сигналов.']
  };
  // Entries describe products of each canonical reaction, not trajectories in a ring.
  const krebs=[
    {name:'Цитрат',enzyme:'Цитрат-синтаза',reaction:'Оксалоацетат (4C) + ацетил-КоА (2C) → цитрат (6C)',carbon:6,nadh:0,fadh:0,gtp:0,co2:0,note:'Ацетильная группа присоединяется; освобождается КоА.'},
    {name:'Изоцитрат',enzyme:'Аконитаза',reaction:'Цитрат (6C) ↔ изоцитрат (6C)',carbon:6,nadh:0,fadh:0,gtp:0,co2:0,note:'Изомеризация через цис-аконитат.'},
    {name:'α-Кетоглутарат',enzyme:'Изоцитратдегидрогеназа',reaction:'Изоцитрат (6C) → α-кетоглутарат (5C) + CO₂',carbon:5,nadh:1,fadh:0,gtp:0,co2:1,note:'Окислительное декарбоксилирование, NAD⁺ → NADH.'},
    {name:'Сукцинил-КоА',enzyme:'α-Кетоглутаратдегидрогеназный комплекс',reaction:'α-Кетоглутарат (5C) → сукцинил-КоА (4C) + CO₂',carbon:4,nadh:2,fadh:0,gtp:0,co2:2,note:'Образуется ещё один NADH.'},
    {name:'Сукцинат',enzyme:'Сукцинил-КоА-синтетаза',reaction:'Сукцинил-КоА (4C) → сукцинат (4C)',carbon:4,nadh:2,fadh:0,gtp:1,co2:2,note:'Субстратное фосфорилирование даёт GTP или ATP в зависимости от изоформы.'},
    {name:'Фумарат',enzyme:'Сукцинатдегидрогеназа',reaction:'Сукцинат (4C) → фумарат (4C)',carbon:4,nadh:2,fadh:1,gtp:1,co2:2,note:'Восстановление связанного FAD; электроны поступают к убихинону через комплекс II.'},
    {name:'Малат',enzyme:'Фумараза',reaction:'Фумарат (4C) + H₂O → малат (4C)',carbon:4,nadh:2,fadh:1,gtp:1,co2:2,note:'Гидратация двойной связи.'},
    {name:'Оксалоацетат',enzyme:'Малатдегидрогеназа',reaction:'Малат (4C) → оксалоацетат (4C)',carbon:4,nadh:3,fadh:1,gtp:1,co2:2,note:'Образуется NADH; акцептор следующей ацетильной группы регенерирован.'}
  ];
  function light(fTHz){const f=fTHz*1e12;return {frequency:f,wavelength:C/f,photonEV:H*f/EV};}
  function slitIntensity(x,lambda,d,visibility=1,a=10e-6,L=1){const beta=Math.PI*a*x/(lambda*L),sinc=Math.abs(beta)<1e-10?1:Math.sin(beta)/beta;return sinc*sinc*(1+visibility*Math.cos(2*Math.PI*d*x/(lambda*L)))/2;}
  function sampleSlit(lambda,d,visibility,random=Math.random){for(let i=0;i<10000;i++){const x=(random()-.5)*.1;if(random()<slitIntensity(x,lambda,d,visibility))return x;}return 0;}
  function walk3D(n,p,random=Math.random){let point=[0,0,0];const path=[point];for(let i=0;i<n;i++){point=[...point];point[Math.min(2,Math.floor(random()*3))]+=random()<p?1:-1;path.push(point);}return path;}
  function walkTheory(n,p,dimensions=1){const bias=2*p-1;return {rms:Math.sqrt(n+n*(n-1)*bias*bias/dimensions),sigma:Math.sqrt(n*(1-bias*bias/dimensions)),mean:n*Math.abs(bias)/Math.sqrt(dimensions)};}
  function respiration(glucose,oxygen,adp,leak){
    // A qualitative control model. These indices are not biochemical rates or ATP yields.
    const fuel=glucose/100,acceptor=oxygen/100,demand=adp/100,loss=leak/100;
    const electron=fuel*acceptor*(.15+.85*Math.max(demand,loss));
    const gradient=electron*(1-loss),atp=gradient*demand;
    return {electron,gradient,atp,glycolysis:fuel*demand};
  }
  const api={C,H,EV,codingDNA,complement,transcribe,translation,organelles,krebs,light,slitIntensity,sampleSlit,walk3D,walkTheory,respiration};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.LabScience=api;
})(typeof window==='undefined'?globalThis:window);
