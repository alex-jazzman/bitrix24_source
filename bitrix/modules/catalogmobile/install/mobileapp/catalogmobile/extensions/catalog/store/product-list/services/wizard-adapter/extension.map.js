{"version":3,"file":"extension.map.js","names":["jn","define","require","exports","module","Random","StoreProductRow","StoreProductListWizardAdapter","constructor","root","onUpdate","this","isFirstStep","emptyCallback","on","upsertProductFromWizard","bind","data","ID","NAME","isMounted","state","getState","wizardId","WIZARD_UNIQID","action","queryConfig","fields","documentId","document","id","documentType","type","BX","ajax","runAction","then","response","item","justAdded","items","getItems","productRow","push","find","getField","setFields","catch","err","console","error","ErrorNotifier","showError","message","openWizard","defaultProductName","ComponentHelper","openLayout","name","componentParams","mode","entityData","DOCUMENT_CURRENCY","getDocumentCurrency","DOCUMENT_TYPE","getString","widgetParams","objectName","title","modal","backdrop","horizontalSwipeAllowed","bounceEnable","showOnTop","eventName","callback","addCustomEvent"],"sources":["extension.js"],"mappings":"AAGAA,GAAGC,OAAO,sDAAsD,CAACC,EAASC,EAASC,KAClF,MAAMC,OAAEA,GAAWH,EAAQ,gBAC3B,MAAMI,gBAAEA,GAAoBJ,EAAQ,oCAKpC,MAAMK,EAELC,aAAYC,KAAEA,EAAIC,SAAEA,IAGnBC,KAAKF,KAAOA,EACZE,KAAKC,YAAc,KAEnB,MAAMC,EAAgB,OACtBF,KAAKD,SAAWA,GAAYG,EAE5BF,KAAKG,GAAG,iCAAkCH,KAAKI,wBAAwBC,KAAKL,OAC5EA,KAAKG,GAAG,+BAAgCH,KAAKI,wBAAwBC,KAAKL,MAC3E,CAEAI,wBAAwBE,GAEvB,IAAKA,EAAKC,KAAOD,EAAKE,OAASR,KAAKF,KAAKW,YACzC,CACC,MACD,CAEA,MAAMC,EAAQV,KAAKF,KAAKa,WAExB,MAAMC,EAAWN,EAAKO,cAEtB,MAAMC,EAAS,iEACf,MAAMC,EAAc,CACnBT,KAAM,CACLU,OAAQV,EACRW,WAAYP,EAAMQ,SAASC,GAC3BC,aAAcV,EAAMQ,SAASG,OAI/BC,GAAGC,KAAKC,UAAUV,EAAQC,GACxBU,MAAMC,IACN,MAAMC,EAAOD,EAASpB,KACtBqB,EAAKC,UAAY,KACjBD,EAAKf,SAAWA,EAEhB,MAAMiB,EAAQ7B,KAAKF,KAAKgC,WAExB,GAAI9B,KAAKC,YACT,CACC,MAAM8B,EAAa,IAAIpC,EAAgBgC,GACvCE,EAAMG,KAAKD,EACZ,KAEA,CACC,MAAMA,EAAaF,EAAMI,MAAMN,GAASA,EAAKO,SAAS,cAAgBtB,IACtE,GAAImB,EACJ,CACCA,EAAWI,UAAUR,EACtB,CACD,CAEA3B,KAAKD,SAAS8B,EAAOF,EAAKR,GAAInB,KAAKC,aAEnCD,KAAKC,YAAc,KAAK,IAExBmC,OAAOC,IACPrC,KAAKC,YAAc,MACnBqC,QAAQC,MAAMF,GACdG,cAAcC,UAAUnB,GAAGoB,QAAQ,yBAAyB,GAE/D,CAEAC,WAAWC,GAEV5C,KAAKC,YAAc,KAEnB4C,gBAAgBC,WAAW,CAC1BC,KAAM,iCACNC,gBAAiB,CAChBC,KAAM,MACN5B,KAAM,QACN6B,WAAY,CACXC,kBAAmBnD,KAAKF,KAAKsD,sBAC7BC,cAAerD,KAAKF,KAAKY,MAAMQ,SAAWlB,KAAKF,KAAKY,MAAMQ,SAASG,KAAO,GAC1Eb,KAAMoC,EACN/B,cAAenB,EAAO4D,cAGxBC,aAAc,CACbC,WAAY,SACZC,MAAOnC,GAAGoB,QAAQ,mCAClBgB,MAAO,KACPC,SAAU,CACTC,uBAAwB,MACxBC,aAAc,KACdC,UAAW,QAIf,CAEA3D,GAAG4D,EAAWC,GAEb1C,GAAG2C,eAAeF,EAAWC,GAE7B,OAAOhE,IACR,EAGDP,EAAOD,QAAU,CAAEI,gCAA+B"}