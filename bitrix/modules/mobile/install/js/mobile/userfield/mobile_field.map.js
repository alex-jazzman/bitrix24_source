{"version":3,"sources":["mobile_field.js"],"names":["BX","window","MobileFieldManager","fieldNames","getInstance","this","namespace","Mobile","Field","prototype","init","params","gridId","formId","formats","restrictedMode","name","repo","apply","delegate","nodes","node","obj","ff","initFf","arguments","bindElements","addCustomEvent","command","userFieldType","mobileFieldManager","fieldName","getAttribute","includes","push","Datetime","Date","Money","pop","bindElement","proxy","o","res","i","length","onCustomEvent","BXMobileApp","Events","postToComponent","getParamsForMobilePostEvent","cancel","e","PreventDefault","click","save","input","file","submit","id","ajax","options","restricted","method","onsuccess","onfailure","onprogress","UI","Page","LoadingScreen","hide","show","elements","create","attrs","type","appendChild","value","submitAjax","fieldObject","nodeId","nodeName","nodeValue"],"mappings":"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","file":"mobile_field.map.js"}