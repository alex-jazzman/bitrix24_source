{"version":3,"file":"text.map.js","names":["BX","namespace","escapeText","Landing","Utils","headerTagMatcher","Matchers","headerTag","changeTagName","textToPlaceholders","Block","Node","Text","options","Runtime","loadExtension","apply","this","arguments","type","tableBaseFontSize","onClick","bind","onPaste","onDrop","onInput","onKeyDown","onMousedown","onMouseup","node","addEventListener","document","currentNode","prototype","__proto__","superClass","constructor","onAllowInlineEdit","setAttribute","Loc","getMessage","onChange","preventAdjustPosition","preventHistory","call","UI","Panel","EditorPanel","getInstance","adjustPosition","History","push","event","code","onBackspaceDown","clearTimeout","inputTimeout","key","keyCode","which","top","window","navigator","userAgent","match","ctrlKey","metaKey","setTimeout","lastValue","getValue","isTable","tableFontSize","parseInt","getComputedStyle","srcElement","getPropertyValue","textContent","Dom","hasClass","addClass","removeClass","onEscapePress","isEditable","hide","disableEdit","preventDefault","clipboardData","getData","sourceText","encodedText","encode","isLinkPasted","prepareToLink","formattedHtml","replace","RegExp","execCommand","text","onDocumentClick","fromNode","manifest","group","allowInlineEdit","Main","isControlsEnabled","stopPropagation","enableEdit","querySelectorAll","forEach","table","hasAttribute","prepareNewTable","textOnly","StylePanel","isShown","show","buttons","nodeTableContainerList","tableContainer","tableEditor","unselect","Tool","ColorPicker","hideAll","requestAnimationFrame","target","nodeName","parentElement","range","createRange","selectNode","getSelection","removeAllRanges","addRange","addTableButtons","isContentEditable","length","nodeTableContainer","TableEditor","default","getDesignButton","getAiTextButton","isHeader","getChangeTagButton","onChangeHandler","onChangeTag","contentEditable","designButton","Button","Design","html","attrs","title","onDesignShow","aiTextButton","AiText","sections","onSelect","item","innerHTML","data","isAllowInlineEdit","getField","field","Field","selector","name","content","changeTagButton","setValue","value","preventSave","isSavePrevented","querySelector","cloneNode","prepareTable","test","nodeIsTable","contains","tdTag","remove","neededButtons","setTd","tableButtons","getTableButtons","tableAlignButtons","isCell","isButtonAddRow","isButtonAddCol","isNeedTablePanel","hideButtons","nodeTableList","nodeTable","isSelectedAll","tableButton","parentNode","children","Array","from","getAmountTableRows","neededButton","childNodes","childNodesArray","childNodesArrayPrepare","childNode","nodeType","neededPosition","indexOf","rows","row","rowChildPrepare","rowChildNode","getAmountTableCols","th","closest","insertAfter","activeAlignButtonId","setActiveAlignButtonId","undefined","count","isIdentical","tableAlignButton","id","layout","ChangeTag","toLowerCase","activateItem","AlignTable","TableColorAction","DeleteElementTable","StyleTable","CopyTable","DeleteTable","changeOptionsHandler","then","setClassesForRemove","className","element","selection","position","getRangeAt","startOffset","focusNode","Type","isNil","firstChild","focusNodeParent","allowedNodeName","includes","focusNodeContainer","createElement","append","contentNode","after","reg"],"sources":["text.js"],"mappings":"CAAC,WACA,aAEAA,GAAGC,UAAU,cAEb,MAAMC,EAAaF,GAAGG,QAAQC,MAAMF,WACpC,MAAMG,EAAmBL,GAAGG,QAAQC,MAAME,SAASC,UACnD,MAAMC,EAAgBR,GAAGG,QAAQC,MAAMI,cACvC,MAAMC,EAAqBT,GAAGG,QAAQC,MAAMK,mBAU5CT,GAAGG,QAAQO,MAAMC,KAAKC,KAAO,SAASC,GAErCb,GAAGc,QAAQC,cAAc,iCACzBf,GAAGG,QAAQO,MAAMC,KAAKK,MAAMC,KAAMC,WAElCD,KAAKE,KAAO,OACZF,KAAKG,kBAAoB,KAEzBH,KAAKI,QAAUJ,KAAKI,QAAQC,KAAKL,MACjCA,KAAKM,QAAUN,KAAKM,QAAQD,KAAKL,MACjCA,KAAKO,OAASP,KAAKO,OAAOF,KAAKL,MAC/BA,KAAKQ,QAAUR,KAAKQ,QAAQH,KAAKL,MACjCA,KAAKS,UAAYT,KAAKS,UAAUJ,KAAKL,MACrCA,KAAKU,YAAcV,KAAKU,YAAYL,KAAKL,MACzCA,KAAKW,UAAYX,KAAKW,UAAUN,KAAKL,MAGrCA,KAAKY,KAAKC,iBAAiB,YAAab,KAAKU,aAC7CV,KAAKY,KAAKC,iBAAiB,QAASb,KAAKI,SACzCJ,KAAKY,KAAKC,iBAAiB,QAASb,KAAKM,SACzCN,KAAKY,KAAKC,iBAAiB,OAAQb,KAAKO,QACxCP,KAAKY,KAAKC,iBAAiB,QAASb,KAAKQ,SACzCR,KAAKY,KAAKC,iBAAiB,UAAWb,KAAKS,WAE3CK,SAASD,iBAAiB,UAAWb,KAAKW,UAC3C,EAOA5B,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,YAAc,KAGzChC,GAAGG,QAAQO,MAAMC,KAAKC,KAAKqB,UAAY,CACtCC,UAAWlC,GAAGG,QAAQO,MAAMC,KAAKsB,UACjCE,WAAYnC,GAAGG,QAAQO,MAAMC,KAAKsB,UAClCG,YAAapC,GAAGG,QAAQO,MAAMC,KAAKC,KAMnCyB,kBAAmB,WAGlBpB,KAAKY,KAAKS,aAAa,QAASpC,EAAWF,GAAGG,QAAQoC,IAAIC,WAAW,+BACtE,EAQAC,SAAU,SAASC,EAAuBC,GAEzC1B,KAAKkB,WAAWM,SAASG,KAAK3B,KAAM0B,GACpC,IAAKD,EACL,CACC1C,GAAGG,QAAQ0C,GAAGC,MAAMC,YAAYC,cAAcC,eAAehC,KAAKY,KACnE,CACA,IAAKc,EACL,CACC3C,GAAGG,QAAQ+C,QAAQF,cAAcG,MAClC,CACD,EAEAzB,UAAW,SAAS0B,GAEnB,GAAIA,EAAMC,OAAS,YACnB,CACCpC,KAAKqC,gBAAgBF,EACtB,CACAnC,KAAKQ,QAAQ2B,EACd,EAGA3B,QAAS,SAAS2B,GAEjBG,aAAatC,KAAKuC,cAElB,MAAMC,EAAML,EAAMM,SAAWN,EAAMO,MAEnC,KAAMF,IAAQ,KAAOG,IAAIC,OAAOC,UAAUC,UAAUC,MAAM,QAAUZ,EAAMa,QAAUb,EAAMc,UAC1F,CACCjD,KAAKuC,aAAeW,WAAW,WAC9B,GAAIlD,KAAKmD,YAAcnD,KAAKoD,WAC5B,CACCpD,KAAKwB,SAAS,MACdxB,KAAKmD,UAAYnD,KAAKoD,UACvB,CACD,EAAE/C,KAAKL,MAAO,IACf,CAEA,GAAIA,KAAKqD,QAAQlB,GACjB,CACC,MAAMmB,EAAgBC,SAASX,OAAOY,iBAAiBrB,EAAMsB,YAAYC,iBAAiB,cAC1F,GACCvB,EAAMsB,WAAWE,cAAgB,IAC9B5E,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAY,qBAClCH,EAAgBtD,KAAKG,kBAEzB,CACCpB,GAAG6E,IAAIE,SAAS3B,EAAMsB,WAAY,0BACnC,KAEA,CACC1E,GAAG6E,IAAIG,YAAY5B,EAAMsB,WAAY,0BACtC,CACD,CACD,EAMAO,cAAe,WAGd,GAAIhE,KAAKiE,aACT,CACC,GAAIjE,OAASjB,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,YACxC,CACChC,GAAGG,QAAQ0C,GAAGC,MAAMC,YAAYC,cAAcmC,MAC/C,CAEAlE,KAAKmE,aACN,CACD,EAQA5D,OAAQ,SAAS4B,GAGhBA,EAAMiC,gBACP,EAUA9D,QAAS,SAAS6B,GAEjBA,EAAMiC,iBAEN,GAAIjC,EAAMkC,eAAiBlC,EAAMkC,cAAcC,QAC/C,CACC,MAAMC,EAAapC,EAAMkC,cAAcC,QAAQ,cAC/C,IAAIE,EAAczF,GAAGY,KAAK8E,OAAOF,GACjC,GAAIvE,KAAK0E,aAAaH,GACtB,CACCC,EAAcxE,KAAK2E,cAAcH,EAClC,CACA,MAAMI,EAAgBJ,EAAYK,QAAQ,IAAIC,OAAO,KAAM,KAAM,QACjEhE,SAASiE,YAAY,aAAc,MAAOH,EAC3C,KAEA,CAEC,MAAMI,EAAOpC,OAAOyB,cAAcC,QAAQ,QAC1CxD,SAASiE,YAAY,QAAS,KAAMhG,GAAGY,KAAK8E,OAAOO,GACpD,CAEAhF,KAAKwB,UACN,EAMAyD,gBAAiB,SAAS9C,GAEzB,GAAInC,KAAKiE,eAAiBjE,KAAKkF,SAC/B,CACCnG,GAAGG,QAAQ0C,GAAGC,MAAMC,YAAYC,cAAcmC,OAC9ClE,KAAKmE,aACN,CAEAnE,KAAKkF,SAAW,KACjB,EAGAxE,YAAa,SAASyB,GAErB,IAAKnC,KAAKmF,SAASC,MACnB,CACCpF,KAAKkF,SAAW,KAEhB,GAAIlF,KAAKmF,SAASE,kBAAoB,OACrCtG,GAAGG,QAAQoG,KAAKvD,cAAcwD,oBAC/B,CACCpD,EAAMqD,kBACNxF,KAAKyF,aACL,GAAIzF,KAAKqD,QAAQlB,GACjB,CACCnC,KAAKmE,cACLpF,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,YAAYH,KAAK8E,iBAAiB,4BAC3DC,SAAQ,SAASC,GACjB,IAAKA,EAAMC,aAAa,iBACxB,CACC9G,GAAGG,QAAQO,MAAMC,KAAKC,KAAKqB,UAAU8E,gBAAgBF,EACtD,CACD,IACD,MAAMtC,EAAgBC,SAASX,OAAOY,iBAAiBrB,EAAMsB,YAAYC,iBAAiB,cAC1F,GACCvB,EAAMsB,WAAWE,cAAgB,IAC9B5E,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAY,qBAClCH,EAAgBtD,KAAKG,kBAEzB,CACCpB,GAAG6E,IAAIE,SAAS3B,EAAMsB,WAAY,0BACnC,KAEA,CACC1E,GAAG6E,IAAIG,YAAY5B,EAAMsB,WAAY,0BACtC,CACD,KAEA,CACC,IAAKzD,KAAKmF,SAASY,WAAahH,GAAGG,QAAQ0C,GAAGC,MAAMmE,WAAWjE,cAAckE,UAC7E,CACClH,GAAGG,QAAQ0C,GAAGC,MAAMC,YAAYC,cAAcmE,KAAKlG,KAAKY,KAAM,KAAMZ,KAAKmG,QAC1E,CACA,GAAIpH,GAAGG,QAAQO,MAAMC,KAAKC,KAAKyG,uBAC/B,CACCrH,GAAGG,QAAQO,MAAMC,KAAKC,KAAKyG,uBAAuBT,SAAQ,SAASU,GAClEA,EAAeC,YAAYC,SAASF,EAAeC,YACpD,GACD,CACD,CAEAvH,GAAGG,QAAQ0C,GAAG4E,KAAKC,YAAYC,SAChC,CAEAC,uBAAsB,WACrB,GAAIxE,EAAMyE,OAAOC,WAAa,KAC7B1E,EAAMyE,OAAOE,cAAcD,WAAa,IACzC,CACC,MAAME,EAAQjG,SAASkG,cACvBD,EAAME,WAAW9E,EAAMyE,QACvBhE,OAAOsE,eAAeC,kBACtBvE,OAAOsE,eAAeE,SAASL,EAChC,CACD,GACD,CACD,EAGApG,UAAW,WAEVuC,WAAW,WACVlD,KAAKkF,SAAW,KACjB,EAAE7E,KAAKL,MAAO,GACf,EAMAI,QAAS,SAAS+B,GAEjB,GAAInC,KAAKqD,QAAQlB,GACjB,CACCnC,KAAKqH,gBAAgBlF,EACtB,CAEAA,EAAMqD,kBACNrD,EAAMiC,iBACNpE,KAAKkF,SAAW,MAEhB,GAAI/C,EAAMyE,OAAOC,WAAa,KAC7B1E,EAAMyE,OAAOE,cAAcD,WAAa,IACzC,CACC,MAAME,EAAQjG,SAASkG,cACvBD,EAAME,WAAW9E,EAAMyE,QACvBhE,OAAOsE,eAAeC,kBACtBvE,OAAOsE,eAAeE,SAASL,EAChC,CACD,EAOA9C,WAAY,WAEX,OAAOjE,KAAKY,KAAK0G,iBAClB,EAMA7B,WAAY,WAEX,MAAM1E,EAAchC,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,YAC/C,GAAIA,EACJ,CACC,MAAMH,EAAO7B,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,YAAYH,KACpD,MAAMwF,EAAyBxF,EAAK8E,iBAAiB,4BACrD,GAAIU,EAAuBmB,OAAS,EACpC,CACCnB,EAAuBT,SAAQ,SAAS6B,GACvC,IAAKA,EAAmBlB,YACxB,CACCkB,EAAmBlB,YAAc,IAAIvH,GAAGG,QAAQQ,KAAKC,KAAK8H,YAAYC,QAAQF,EAC/E,CACD,IACAzI,GAAGG,QAAQO,MAAMC,KAAKC,KAAKyG,uBAAyBA,CACrD,CACD,CAEA,IAAKpG,KAAKiE,eAAiBlF,GAAGG,QAAQ0C,GAAGC,MAAMmE,WAAWjE,cAAckE,UACxE,CACC,GAAIjG,OAASjB,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,aAAehC,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,cAAgB,KAClG,CACChC,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,YAAYoD,aACxC,CAEApF,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,YAAcf,KAEzCA,KAAKmG,QAAU,GACfnG,KAAKmG,QAAQjE,KAAKlC,KAAK2H,mBAEvB,GAAI5I,GAAGG,QAAQoG,KAAKvD,cAAc,WAAW,iBAC7C,CACC/B,KAAKmG,QAAQjE,KAAKlC,KAAK4H,kBACxB,CAEA,GAAI5H,KAAK6H,WACT,CACC7H,KAAKmG,QAAQjE,KAAKlC,KAAK8H,sBACvB9H,KAAK8H,qBAAqBC,gBAAkB/H,KAAKgI,YAAY3H,KAAKL,KACnE,CAEAA,KAAKmD,UAAYnD,KAAKoD,WACtBpD,KAAKY,KAAKqH,gBAAkB,KAE5BjI,KAAKY,KAAKS,aAAa,QAAS,GACjC,CACD,EAOAsG,gBAAiB,WAEhB,IAAK3H,KAAKkI,aACV,CACClI,KAAKkI,aAAe,IAAInJ,GAAGG,QAAQ0C,GAAGuG,OAAOC,OAAO,SAAU,CAC7DC,KAAMtJ,GAAGG,QAAQoC,IAAIC,WAAW,yCAChC+G,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,0CACzCnB,QAAS,WACRrB,GAAGG,QAAQ0C,GAAGC,MAAMC,YAAYC,cAAcmC,OAC9ClE,KAAKmE,cACLnE,KAAKwI,aAAaxI,KAAKmF,SAAS/C,KACjC,EAAE/B,KAAKL,OAET,CAEA,OAAOA,KAAKkI,YACb,EAMAN,gBAAiB,WAEhB,IAAK5H,KAAKyI,aACV,CACCzI,KAAKyI,aAAe,IAAI1J,GAAGG,QAAQ0C,GAAGuG,OAAOO,OAAO3G,YAAY,UAAW,CAC1EsG,KAAMtJ,GAAGG,QAAQoC,IAAIC,WAAW,0CAChC+G,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,2CACzCoH,SAAU3I,KAAKmF,SAASwD,SACxBC,SAAU,SAAUC,GACnB7I,KAAKY,KAAKkI,UAAYD,EAAKE,KAAKlE,QAAQ,gBAAiB,QACzD7E,KAAKwB,UACN,EAAEnB,KAAKL,OAET,CAEA,OAAOA,KAAKyI,YACb,EAKAtE,YAAa,WAEZ,GAAInE,KAAKiE,aACT,CACCjE,KAAKY,KAAKqH,gBAAkB,MAE5B,GAAIjI,KAAKmD,YAAcnD,KAAKoD,WAC5B,CACCpD,KAAKwB,WACLxB,KAAKmD,UAAYnD,KAAKoD,UACvB,CAEA,GAAIpD,KAAKgJ,oBACT,CACChJ,KAAKY,KAAKS,aAAa,QAASpC,EAAWF,GAAGG,QAAQoC,IAAIC,WAAW,+BACtE,CACD,CACD,EAOA0H,SAAU,WAET,IAAKjJ,KAAKkJ,MACV,CACClJ,KAAKkJ,MAAQ,IAAInK,GAAGG,QAAQ0C,GAAGuH,MAAMxJ,KAAK,CACzCyJ,SAAUpJ,KAAKoJ,SACfb,MAAOvI,KAAKmF,SAASkE,KACrBC,QAAStJ,KAAKY,KAAKkI,UACnB/C,SAAU/F,KAAKmF,SAASY,SACxB1F,KAAML,KAAKY,OAGZ,GAAIZ,KAAK6H,WACT,CACC7H,KAAKkJ,MAAMK,gBAAkBvJ,KAAK8H,oBACnC,CACD,KAEA,CACC9H,KAAKkJ,MAAMM,SAASxJ,KAAKY,KAAKkI,WAC9B9I,KAAKkJ,MAAMI,QAAUtJ,KAAKY,KAAKkI,SAChC,CAEA,OAAO9I,KAAKkJ,KACb,EASAM,SAAU,SAASC,EAAOC,EAAahI,GAEtC1B,KAAK0J,YAAYA,GACjB1J,KAAKmD,UAAYnD,KAAK2J,kBAAoB3J,KAAKoD,WAAapD,KAAKmD,UACjEnD,KAAKY,KAAKkI,UAAYW,EACtBzJ,KAAKwB,SAAS,MAAOE,EACtB,EAOA0B,SAAU,WAET,GAAIpD,KAAKY,KAAKgJ,cAAc,8BAAgC,KAC5D,CACC,MAAMhJ,EAAOZ,KAAKY,KAAKiJ,UAAU,MACjC7J,KAAK8J,aAAalJ,GAClB,OAAOpB,EAAmBoB,EAAKkI,UAChC,CACA,OAAOtJ,EAAmBQ,KAAKY,KAAKkI,UACrC,EAOAjB,SAAU,WAET,OAAOzI,EAAiB2K,KAAK/J,KAAKY,KAAKiG,SACxC,EAMAxD,QAAS,SAASlB,GAEjB,IAAI6H,EAAc,MAClB,GAAIjL,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,aAAeoB,EAC9C,CACCpD,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,YAAYH,KAAK8E,iBAAiB,4BAC3DC,SAAQ,SAASC,GACjB,GAAIA,EAAMqE,SAAS9H,EAAMsB,YACzB,CACCuG,EAAc,IACf,CACD,GACF,CACA,OAAOA,CACR,EAKAlE,gBAAiB,SAASF,GAEzBA,EAAMF,iBAAiB,MAAMC,SAAQ,SAASuE,GAC7CA,EAAMC,QACP,IACAvE,EAAMvE,aAAa,gBAAiB,QACpCtC,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,YAAYS,SAAS,KACjD,EAEA6F,gBAAiB,SAASlF,GAEzB,MAAMgE,EAAU,GAChB,IAAIiE,EAAgB,GACpB,IAAIC,EAAQ,GACZ,MAAMC,EAAetK,KAAKuK,kBAC1B,MAAMC,EAAoB,CAACF,EAAa,GAAIA,EAAa,GAAIA,EAAa,GAAIA,EAAa,IAC3F,MAAM1J,EAAO7B,GAAGG,QAAQO,MAAMC,KAAKC,KAAKoB,YAAYH,KACpD,IAAIgF,EAAQ,KACZ,IAAI6E,EAAS,MACb,IAAIC,EAAiB,MACrB,IAAIC,EAAiB,MACrB,IAAIC,EAAmB,KACvB,GACC7L,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAY,kBAC/B1E,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAY,yBAEtC,CACCmH,EAAmB,KACpB,CACA,GAAI7L,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAY,yBACtC,CACCiH,EAAiB,IAClB,CACA,GAAI3L,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAY,yBACtC,CACCkH,EAAiB,IAClB,CACA,IAAIE,EAAc,GAClB,MAAMC,EAAgBlK,EAAK8E,iBAAiB,kBAC5C,GAAIoF,EAAcvD,OAAS,EAC3B,CACCuD,EAAcnF,SAAQ,SAASoF,GAC9B,GAAIA,EAAUd,SAAS9H,EAAMsB,YAC7B,CACCmC,EAAQmF,EACR,OAAO,IACR,CACD,GACD,CACA,IAAIC,EAEJV,EAAa3E,SAAQ,SAASsF,GAC7BA,EAAY,WAAW,cAAgB9I,EAAMsB,WAC7CwH,EAAY,WAAW,QAAUrK,EACjCqK,EAAY,WAAW,SAAWrF,CACnC,IAEA,GAAI7G,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAY,yBACtC,CACC4G,EAAQlI,EAAMsB,WAAWyH,WAAWC,SACpCd,EAAQe,MAAMC,KAAKhB,GACnB,GAAIrK,KAAKsL,mBAAmB1F,GAAS,EACrC,CACCwE,EAAgB,CAAC,EAAG,EAAG,EAAG,EAAG,EAAG,EAAG,EACpC,KAEA,CACCA,EAAgB,CAAC,EAAG,EAAG,EAAG,EAAG,EAAG,EACjC,CACAA,EAAczE,SAAQ,SAAS4F,GAC9BjB,EAAaiB,GAAc,WAAW,UAAY,MAClDjB,EAAaiB,GAAc,WAAW,SAAWlB,EACjDlE,EAAQjE,KAAKoI,EAAaiB,GAC3B,GACD,CAEA,GAAIxM,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAWyH,WAAY,yBACjD,CACC,MAAMM,EAAarJ,EAAMsB,WAAWqD,cAAcA,cAAc0E,WAChE,MAAMC,EAAkBL,MAAMC,KAAKG,GACnC,MAAME,EAAyB,GAC/BD,EAAgB9F,SAAQ,SAASgG,GAChC,GAAIA,EAAUC,WAAa,EAC3B,CACCF,EAAuBxJ,KAAKyJ,EAC7B,CACD,IACA,MAAME,EAAiBH,EAAuBI,QAAQ3J,EAAMsB,WAAWqD,eACvE,MAAMiF,EAAO5J,EAAMsB,WAAWqD,cAAcA,cAAcA,cAAc0E,WACxEO,EAAKpG,SAAQ,SAASqG,GACrB,GAAIA,EAAIJ,WAAa,EACrB,CACC,MAAMK,EAAkB,GACxBD,EAAIR,WAAW7F,SAAQ,SAASuG,GAC/B,GAAIA,EAAaN,WAAa,EAC9B,CACCK,EAAgB/J,KAAKgK,EACtB,CACD,IACA,GAAID,EAAgBJ,GACpB,CACCxB,EAAMnI,KAAK+J,EAAgBJ,GAC5B,CACD,CACD,IACA,GAAI7L,KAAKmM,mBAAmBvG,GAAS,EACrC,CACCwE,EAAgB,CAAC,EAAG,EAAG,EAAG,EAAG,EAAG,EAAG,EACpC,KAEA,CACCA,EAAgB,CAAC,EAAG,EAAG,EAAG,EAAG,EAAG,EACjC,CACAA,EAAczE,SAAQ,SAAS4F,GAC9BjB,EAAaiB,GAAc,WAAW,UAAY,MAClDjB,EAAaiB,GAAc,WAAW,SAAWlB,EACjDlE,EAAQjE,KAAKoI,EAAaiB,GAC3B,GACD,CAEA,GAAIxM,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAY,+BACtC,CACC,GAAI1E,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAY,wCACtC,CACCuH,EAAgB,KAChB,MAAMe,EAAO5J,EAAMsB,WAAWqD,cAAcA,cAAc0E,WAC1DO,EAAKpG,SAAQ,SAASqG,GACrBA,EAAIR,WAAW7F,SAAQ,SAASyG,GAC/B/B,EAAMnI,KAAKkK,EACZ,GACD,IACAhC,EAAgB,CAAC,EAAG,EAAG,EAAG,EAAG,EAAG,EAAG,EAAG,EAAG,IACzCA,EAAczE,SAAQ,SAAS4F,GAC9BjB,EAAaiB,GAAc,WAAW,UAAY,QAClDjB,EAAaiB,GAAc,WAAW,SAAWlB,EACjDlE,EAAQjE,KAAKoI,EAAaiB,GAC3B,GACD,KAEA,CACCP,EAAgB,MAChBjM,GAAGG,QAAQ0C,GAAGC,MAAMC,YAAYC,cAAcmC,MAC/C,CACD,CAEA,GACCnF,GAAG6E,IAAIC,SAAS1B,EAAMsB,WAAY,qBAC/BtB,EAAMsB,WAAW4I,QAAQ,uBAAyB,KAEtD,CACChC,EAAMnI,KAAKC,EAAMsB,YACjB2G,EAAgB,CAAC,EAAG,EAAG,EAAG,GAC1BA,EAAczE,SAAQ,SAAS4F,GAC9BjB,EAAaiB,GAAc,WAAW,UAAY,OAClDjB,EAAaiB,GAAc,WAAW,SAAWlB,EACjDC,EAAaiB,GAAce,YAAc,gBACzCnG,EAAQjE,KAAKoI,EAAaiB,GAC3B,IACAd,EAAS,KACTI,EAAc,CAAC,cAAe,gBAAiB,eAAgB,cAAe,cAAe,aAC9F,CAEA,IAAI0B,EACJ,MAAMC,EAAyB,GAC/BnC,EAAM1E,SAAQ,SAASyG,GACtB,GAAIA,EAAGR,WAAa,EACpB,CACCW,EAAsBE,UACtB,GAAI1N,GAAG6E,IAAIC,SAASuI,EAAI,aACxB,CACCG,EAAsB,WACvB,CACA,GAAIxN,GAAG6E,IAAIC,SAASuI,EAAI,eACxB,CACCG,EAAsB,aACvB,CACA,GAAIxN,GAAG6E,IAAIC,SAASuI,EAAI,cACxB,CACCG,EAAsB,YACvB,CACA,GAAIxN,GAAG6E,IAAIC,SAASuI,EAAI,gBACxB,CACCG,EAAsB,cACvB,CACAC,EAAuBtK,KAAKqK,EAC7B,CACD,IACA,IAAIG,EAAQ,EACZ,IAAIC,EAAc,KAClB,MAAOD,EAAQF,EAAuBjF,QAAUoF,EAChD,CACC,GAAID,EAAQ,EACZ,CACC,GAAIF,EAAuBE,KAAWF,EAAuBE,EAAQ,GACrE,CACCC,EAAc,KACf,CACD,CACAD,GACD,CACA,GAAIC,EACJ,CACCJ,EAAsBC,EAAuB,EAC9C,KAEA,CACCD,EAAsBE,SACvB,CACA,GAAIF,EACJ,CACC/B,EAAkB7E,SAAQ,SAASiH,GAClC,GAAIA,EAAiBC,KAAON,EAC5B,CACCxN,GAAG6E,IAAIE,SAAS8I,EAAiBE,OAAQ,oBAC1C,CACD,GACD,CAEA,GAAI3G,EAAQ,IAAMA,EAAQ,IAAMA,EAAQ,IAAMA,EAAQ,GACtD,CACCA,EAAQ,GAAG,WAAW,gBAAkBqE,EACxCrE,EAAQ,GAAG,WAAW,gBAAkBqE,EACxCrE,EAAQ,GAAG,WAAW,gBAAkBqE,EACxCrE,EAAQ,GAAG,WAAW,gBAAkBqE,CACzC,CAEA,IAAKxK,KAAKmF,SAASY,SACnB,CACC,GAAI6E,EACJ,CACC,IAAKF,IAAmBC,GAAkB/E,EAC1C,CACC,IAAK6E,EACL,CACC,GAAIO,IAAkB,MACtB,CACCjM,GAAGG,QAAQ0C,GAAGC,MAAMC,YAAYC,cAAcmC,MAC/C,KAEA,CACCnF,GAAGG,QAAQ0C,GAAGC,MAAMC,YAAYC,cAAcmE,KAAKN,EAAMsF,WAAY,KAAM/E,EAAS,KACrF,CACD,KAEA,CACCpH,GAAGG,QAAQ0C,GAAGC,MAAMC,YAAYC,cAAcmE,KAAKN,EAAMsF,WAAY,KAAM/E,EAAS,KAAM0E,EAC3F,CACD,CACD,KAEA,CACC9L,GAAGG,QAAQ0C,GAAGC,MAAMC,YAAYC,cAAcmC,MAC/C,CACD,CACD,EAMA4D,mBAAoB,WAEnB,IAAK9H,KAAKuJ,gBACV,CACCvJ,KAAKuJ,gBAAkB,IAAIxK,GAAGG,QAAQ0C,GAAGuG,OAAO4E,UAAU,YAAa,CACtE1E,KAAM,uCAAwCrI,KAAKY,KAAKiG,SAASmG,cAAc,YAC/E1E,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,8CACzCC,SAAUxB,KAAKgI,YAAY3H,KAAKL,OAElC,CAEAA,KAAKuJ,gBAAgB+C,YAAc,SAEnCtM,KAAKuJ,gBAAgB0D,aAAajN,KAAKY,KAAKiG,UAE5C,OAAO7G,KAAKuJ,eACb,EAEAgB,gBAAiB,WAEhBvK,KAAKmG,QAAU,GACfnG,KAAKmG,QAAQjE,KACZ,IAAInD,GAAGG,QAAQ0C,GAAGuG,OAAO+E,WAAW,YAAa,CAChD7E,KAAM,oDACNC,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,gDAE1C,IAAIxC,GAAGG,QAAQ0C,GAAGuG,OAAO+E,WAAW,cAAe,CAClD7E,KAAM,sDACNC,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,kDAE1C,IAAIxC,GAAGG,QAAQ0C,GAAGuG,OAAO+E,WAAW,aAAc,CACjD7E,KAAM,qDACNC,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,iDAE1C,IAAIxC,GAAGG,QAAQ0C,GAAGuG,OAAO+E,WAAW,eAAgB,CACnD7E,KAAM,uDACNC,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,mDAE1C,IAAIxC,GAAGG,QAAQ0C,GAAGuG,OAAOgF,iBAAiB,iBAAkB,CAC3DnI,KAAMjG,GAAGG,QAAQoC,IAAIC,WAAW,gCAChC+G,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,2CAE1C,IAAIxC,GAAGG,QAAQ0C,GAAGuG,OAAOgF,iBAAiB,eAAgB,CACzD9E,KAAM,oDACNC,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,mDAE1C,IAAIxC,GAAGG,QAAQ0C,GAAGuG,OAAOiF,mBAAmB,YAAa,CACxD/E,KAAM,sDACNC,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,sDAE1C,IAAIxC,GAAGG,QAAQ0C,GAAGuG,OAAOiF,mBAAmB,YAAa,CACxD/E,KAAM,sDACNC,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,sDAE1C,IAAIxC,GAAGG,QAAQ0C,GAAGuG,OAAOkF,WAAW,aAAc,CACjDhF,KAAMtJ,GAAGG,QAAQoC,IAAIC,WAAW,8CAC7B,6CACH+G,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,iDAE1C,IAAIxC,GAAGG,QAAQ0C,GAAGuG,OAAOmF,UAAU,YAAa,CAC/CtI,KAAMjG,GAAGG,QAAQoC,IAAIC,WAAW,6CAChC+G,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,gDAE1C,IAAIxC,GAAGG,QAAQ0C,GAAGuG,OAAOoF,YAAY,cAAe,CACnDlF,KAAM,sDACNC,MAAO,CAACC,MAAOxJ,GAAGG,QAAQoC,IAAIC,WAAW,mDAI3C,OAAOvB,KAAKmG,OACb,EAQA6B,YAAa,SAASyB,EAAO/H,GAE5B1B,KAAKY,KAAOrB,EAAcS,KAAKY,KAAM6I,GAErCzJ,KAAKY,KAAKC,iBAAiB,YAAab,KAAKU,aAC7CV,KAAKY,KAAKC,iBAAiB,QAASb,KAAKI,SACzCJ,KAAKY,KAAKC,iBAAiB,QAASb,KAAKM,SACzCN,KAAKY,KAAKC,iBAAiB,OAAQb,KAAKO,QACxCP,KAAKY,KAAKC,iBAAiB,QAASb,KAAKQ,SACzCR,KAAKY,KAAKC,iBAAiB,UAAWb,KAAKQ,SAE3C,IAAKR,KAAKiJ,WAAWhF,eAAiBvC,EACtC,CACC1B,KAAKmE,cACLnE,KAAKyF,YACN,CAEA,MAAMsD,EAAO,CAAC,EACdA,EAAK/I,KAAKoJ,UAAYK,EAEtB,IAAK/H,EACL,CACC1B,KAAKwN,qBAAqBzE,GACxB0E,MAAK,KACL1O,GAAGG,QAAQ+C,QAAQF,cAAcG,MAAM,GAE1C,CACD,EAEAiK,mBAAoB,SAASvG,GAE5B,OAAOA,EAAMF,iBAAiB,0BAA0B6B,MACzD,EAEA+D,mBAAoB,SAAS1F,GAE5B,OAAOA,EAAMF,iBAAiB,0BAA0B6B,MACzD,EAEAuC,aAAc,SAASlJ,GAEtB,MAAM8M,EAAsB,CAC3B,qBACA,uCACA,8BACA,6BACA,4BACA,iCACA,gCACA,8BACA,iCACA,8BACA,6BACA,4BACA,2BACA,6BAEDA,EAAoB/H,SAAQ,SAASgI,GACpC/M,EAAK8E,iBAAiB,IAAMiI,GAAWhI,SAAQ,SAASiI,GACvD7O,GAAG6E,IAAIG,YAAY6J,EAASD,EAC7B,GACD,IACA,OAAO/M,CACR,EAEAyB,gBAAiB,SAASF,GACzB,MAAM0L,EAAYjL,OAAOsE,eACzB,MAAM4G,EAAWD,EAAUE,WAAW,GAAGC,YACzC,GAAIF,IAAa,EACjB,CACC,IAAIG,EAAYJ,EAAUI,UAC1B,IAAKlP,GAAGmP,KAAKC,MAAMF,IAAcA,EAAUrC,WAAa,EACxD,CACC,GAAIqC,EAAUG,WAAWxC,WAAa,GAAKqC,EAAUG,WAAWA,WAAWxC,WAAa,EACxF,CACCqC,EAAYA,EAAUG,WAAWA,UAClC,MACK,GAAIH,EAAUG,WAAWxC,WAAa,EAC3C,CACCqC,EAAYA,EAAUG,UACvB,KAEA,CACCH,EAAY,IACb,CACD,CACA,GAAIA,EACJ,CACC,MAAMI,EAAkBJ,EAAU/C,WAClC,MAAMoD,EAAkB,CAAC,aAAc,MACvC,GAAID,GAAmBC,EAAgBC,SAASF,EAAgBxH,UAChE,CACC,MAAM2H,EAAqB1N,SAAS2N,cAAc,OAClDD,EAAmBE,OAAOT,GAC1BI,EAAgBK,OAAOF,EACxB,CACA,IAAIG,EAAcV,EAAU/C,WAAWA,WACvC,MAAOyD,IAAgBL,EAAgBC,SAASI,EAAY9H,UAC5D,CACC8H,EAAcA,EAAYzD,UAC3B,CACA,GAAIyD,GAAeA,EAAYnD,WAAWjE,SAAW,EACrD,CACCoH,EAAYC,MAAMX,EAAU/C,YAC5ByD,EAAYxE,SAEZhI,EAAMiC,gBACP,CACD,CACD,CACD,EAEAM,aAAc,SAASM,GACtB,MAAM6J,EAAM,8GACZ,QAAS7J,EAAKjC,MAAM8L,EACrB,EAEAlK,cAAe,SAASK,GAEvB,MAAO,qCAAuCA,EAAO,sBAAwBA,EAAO,OACrF,EAGD,EAn+BA"}