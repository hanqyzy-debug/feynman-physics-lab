(function(root){
  'use strict';
  const checked='03.11.2026';
  const sources={
    book1:['Caltech · глава 1','https://www.feynmanlectures.caltech.edu/I_01.html'],
    book2:['Caltech · глава 2','https://www.feynmanlectures.caltech.edu/I_02.html'],
    book3:['Caltech · глава 3','https://www.feynmanlectures.caltech.edu/I_03.html'],
    book4:['Caltech · глава 4','https://www.feynmanlectures.caltech.edu/I_04.html'],
    book5:['Caltech · глава 5','https://www.feynmanlectures.caltech.edu/I_05.html'],
    book6:['Caltech · глава 6','https://www.feynmanlectures.caltech.edu/I_06.html'],
    enzymes:['OpenStax · ферменты','https://openstax.org/books/biology-2e/pages/6-5-enzymes'],
    cell:['OpenStax · эукариотическая клетка','https://openstax.org/books/biology-2e/pages/4-3-eukaryotic-cells'],
    dna:['NIH/NLM · ДНК и синтез белка','https://medlineplus.gov/genetics/understanding/howgeneswork/makingprotein/'],
    krebs:['Reactome · цикл Кребса','https://reactome.org/content/detail/R-HSA-71403'],
    respiration:['Reactome · дыхательная цепь','https://reactome.org/content/detail/R-HSA-611105'],
    oxidative:['OpenStax · окислительное фосфорилирование','https://openstax.org/books/biology-2e/pages/7-4-oxidative-phosphorylation'],
    constants:['NIST · константы CODATA 2022','https://physics.nist.gov/cuu/Constants/Table/allascii.txt'],
    interference:['NIST · декогеренция и информация о пути','https://www.nist.gov/publications/measurement-induced-decoherence-and-information-double-slit-interference'],
    photons:['NIST · отдельные фотоны и интерференция','https://www.nist.gov/publications/time-resolved-double-slit-interference-pattern-measurement-entangled-photons'],
    hydrogen:['NIST · линии водорода','https://physics.nist.gov/PhysRefData/Handbook/Tables/hydrogentable2.htm'],
    sodium:['NIST · линии натрия','https://pml.nist.gov/PhysRefData/Handbook/Tables/sodiumtable2.htm'],
    second:['BIPM · определение секунды','https://www.bipm.org/en/si-base-units/second'],
    rna:['NCBI · каталитические РНК','https://www.ncbi.nlm.nih.gov/mesh?Cmd=DetailsSearch&Db=mesh&Term=%22RNA%2C+Catalytic%22%5BMeSH+Terms%5D']
  };
  const extra={cell:['cell'],dna:['dna'],krebs:['krebs'],respiration:['respiration','oxidative'],enzyme:['enzymes','rna'],charges:['constants'],photons:['constants'],frequency:['constants'],duality:['interference','photons'],spectra:['hydrogen','sodium'],clocks:['second']};
  const modelSources={};for(const chapter of root.FeynmanCourse)for(const id of chapter.models)modelSources[id]=['book'+chapter.number,...(extra[id]||[])];
  function links(id){return '<p class="science-source">Сверено '+checked+' · '+(modelSources[id]||[]).map(key=>'<a href="'+sources[key][1].replace(/&/g,'&amp;')+'" target="_blank" rel="noopener">'+sources[key][0]+'</a>').join(' · ')+'</p>';}
  root.LabReview={checked,sources,modelSources,links};
})(window);
