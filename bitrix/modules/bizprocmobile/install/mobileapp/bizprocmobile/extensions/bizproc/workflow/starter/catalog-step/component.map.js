{"version":3,"file":"component.map.js","names":["jn","define","require","exports","module","EventEmitter","StorageCache","NotifyManager","isNil","Duration","PureComponent","CatalogStepView","CatalogStepComponent","constructor","props","super","this","state","templates","cachedTemplates","selectedTemplate","isLoading","uid","Random","getString","customEventEmitter","createWithUid","cache","env","userId","documentType","loadFromCache","handleSelectTemplate","bind","get","Object","keys","length","values","componentDidMount","on","loadTemplates","componentWillUnmount","off","template","emit","isLoaded","isLoadedFromCache","BX","ajax","runAction","data","signedDocument","then","response","catch","Array","isArray","errors","showErrors","finally","preparedTemplates","map","formattedTime","getFormattedTime","isSelected","key","id","type","set","setState","time","duration","createFromSeconds","roundedTime","roundTime","s","getUnitPropertyModByFormat","i","H","d","m","Y","getLengthFormat","YEAR","format","MONTH","DAY","HOUR","MINUTE","seconds","minutes","hours","days","months","years","render","layout"],"sources":["component.js"],"mappings":"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"}