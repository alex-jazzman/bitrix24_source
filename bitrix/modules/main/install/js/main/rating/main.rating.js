this.BX = this.BX || {};
(function (exports,main_core,main_popup,main_core_events) {
	'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};
	function createCommonjsModule(fn, module) {
	  return module = {
	    exports: {}
	  }, fn(module, module.exports), module.exports;
	}

	var lottie = createCommonjsModule(function (module, exports) {
	typeof navigator!=="undefined"&&function(global,factory){(babelHelpers["typeof"](exports))==='object'&&'object'!=='undefined'?module.exports=factory():(global=typeof globalThis!=='undefined'?globalThis:global||self,global.lottie=factory());}(commonjsGlobal,function(){var svgNS='http://www.w3.org/2000/svg';var locationHref='';var _useWebWorker=false;var initialDefaultFrame=-999999;var setWebWorker=function setWebWorker(flag){_useWebWorker=!!flag;};var getWebWorker=function getWebWorker(){return _useWebWorker;};var setLocationHref=function setLocationHref(value){locationHref=value;};var getLocationHref=function getLocationHref(){return locationHref;};function createTag(type){// return {appendChild:function(){},setAttribute:function(){},style:{}}
	return document.createElement(type);}function extendPrototype(sources,destination){var i;var len=sources.length;var sourcePrototype;for(i=0;i<len;i+=1){sourcePrototype=sources[i].prototype;for(var attr in sourcePrototype){if(Object.prototype.hasOwnProperty.call(sourcePrototype,attr))destination.prototype[attr]=sourcePrototype[attr];}}}function getDescriptor(object,prop){return Object.getOwnPropertyDescriptor(object,prop);}function createProxyFunction(prototype){function ProxyFunction(){}ProxyFunction.prototype=prototype;return ProxyFunction;}// import Howl from '../../3rd_party/howler';
	var audioControllerFactory=function(){function AudioController(audioFactory){this.audios=[];this.audioFactory=audioFactory;this._volume=1;this._isMuted=false;}AudioController.prototype={addAudio:function addAudio(audio){this.audios.push(audio);},pause:function pause(){var i;var len=this.audios.length;for(i=0;i<len;i+=1){this.audios[i].pause();}},resume:function resume(){var i;var len=this.audios.length;for(i=0;i<len;i+=1){this.audios[i].resume();}},setRate:function setRate(rateValue){var i;var len=this.audios.length;for(i=0;i<len;i+=1){this.audios[i].setRate(rateValue);}},createAudio:function createAudio(assetPath){if(this.audioFactory){return this.audioFactory(assetPath);}if(window.Howl){return new window.Howl({src:[assetPath]});}return {isPlaying:false,play:function play(){this.isPlaying=true;},seek:function seek(){this.isPlaying=false;},playing:function playing(){},rate:function rate(){},setVolume:function setVolume(){}};},setAudioFactory:function setAudioFactory(audioFactory){this.audioFactory=audioFactory;},setVolume:function setVolume(value){this._volume=value;this._updateVolume();},mute:function mute(){this._isMuted=true;this._updateVolume();},unmute:function unmute(){this._isMuted=false;this._updateVolume();},getVolume:function getVolume(){return this._volume;},_updateVolume:function _updateVolume(){var i;var len=this.audios.length;for(i=0;i<len;i+=1){this.audios[i].volume(this._volume*(this._isMuted?0:1));}}};return function(){return new AudioController();};}();var createTypedArray=function(){function createRegularArray(type,len){var i=0;var arr=[];var value;switch(type){case'int16':case'uint8c':value=1;break;default:value=1.1;break;}for(i=0;i<len;i+=1){arr.push(value);}return arr;}function createTypedArrayFactory(type,len){if(type==='float32'){return new Float32Array(len);}if(type==='int16'){return new Int16Array(len);}if(type==='uint8c'){return new Uint8ClampedArray(len);}return createRegularArray(type,len);}if(typeof Uint8ClampedArray==='function'&&typeof Float32Array==='function'){return createTypedArrayFactory;}return createRegularArray;}();function createSizedArray(len){return Array.apply(null,{length:len});}function _typeof$6(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof$6=function _typeof(obj){return typeof obj;};}else{_typeof$6=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};}return _typeof$6(obj);}var subframeEnabled=true;var expressionsPlugin=null;var idPrefix$1='';var isSafari=/^((?!chrome|android).)*safari/i.test(navigator.userAgent);var bmPow=Math.pow;var bmSqrt=Math.sqrt;var bmFloor=Math.floor;var bmMax=Math.max;var bmMin=Math.min;var BMMath={};(function(){var propertyNames=['abs','acos','acosh','asin','asinh','atan','atanh','atan2','ceil','cbrt','expm1','clz32','cos','cosh','exp','floor','fround','hypot','imul','log','log1p','log2','log10','max','min','pow','random','round','sign','sin','sinh','sqrt','tan','tanh','trunc','E','LN10','LN2','LOG10E','LOG2E','PI','SQRT1_2','SQRT2'];var i;var len=propertyNames.length;for(i=0;i<len;i+=1){BMMath[propertyNames[i]]=Math[propertyNames[i]];}})();BMMath.random=Math.random;BMMath.abs=function(val){var tOfVal=_typeof$6(val);if(tOfVal==='object'&&val.length){var absArr=createSizedArray(val.length);var i;var len=val.length;for(i=0;i<len;i+=1){absArr[i]=Math.abs(val[i]);}return absArr;}return Math.abs(val);};var defaultCurveSegments=150;var degToRads=Math.PI/180;var roundCorner=0.5519;function styleDiv(element){element.style.position='absolute';element.style.top=0;element.style.left=0;element.style.display='block';element.style.transformOrigin='0 0';element.style.webkitTransformOrigin='0 0';element.style.backfaceVisibility='visible';element.style.webkitBackfaceVisibility='visible';element.style.transformStyle='preserve-3d';element.style.webkitTransformStyle='preserve-3d';element.style.mozTransformStyle='preserve-3d';}function BMEnterFrameEvent(type,currentTime,totalTime,frameMultiplier){this.type=type;this.currentTime=currentTime;this.totalTime=totalTime;this.direction=frameMultiplier<0?-1:1;}function BMCompleteEvent(type,frameMultiplier){this.type=type;this.direction=frameMultiplier<0?-1:1;}function BMCompleteLoopEvent(type,totalLoops,currentLoop,frameMultiplier){this.type=type;this.currentLoop=currentLoop;this.totalLoops=totalLoops;this.direction=frameMultiplier<0?-1:1;}function BMSegmentStartEvent(type,firstFrame,totalFrames){this.type=type;this.firstFrame=firstFrame;this.totalFrames=totalFrames;}function BMDestroyEvent(type,target){this.type=type;this.target=target;}function BMRenderFrameErrorEvent(nativeError,currentTime){this.type='renderFrameError';this.nativeError=nativeError;this.currentTime=currentTime;}function BMConfigErrorEvent(nativeError){this.type='configError';this.nativeError=nativeError;}var createElementID=function(){var _count=0;return function createID(){_count+=1;return idPrefix$1+'__lottie_element_'+_count;};}();function HSVtoRGB(h,s,v){var r;var g;var b;var i;var f;var p;var q;var t;i=Math.floor(h*6);f=h*6-i;p=v*(1-s);q=v*(1-f*s);t=v*(1-(1-f)*s);switch(i%6){case 0:r=v;g=t;b=p;break;case 1:r=q;g=v;b=p;break;case 2:r=p;g=v;b=t;break;case 3:r=p;g=q;b=v;break;case 4:r=t;g=p;b=v;break;case 5:r=v;g=p;b=q;break;default:break;}return [r,g,b];}function RGBtoHSV(r,g,b){var max=Math.max(r,g,b);var min=Math.min(r,g,b);var d=max-min;var h;var s=max===0?0:d/max;var v=max/255;switch(max){case min:h=0;break;case r:h=g-b+d*(g<b?6:0);h/=6*d;break;case g:h=b-r+d*2;h/=6*d;break;case b:h=r-g+d*4;h/=6*d;break;default:break;}return [h,s,v];}function addSaturationToRGB(color,offset){var hsv=RGBtoHSV(color[0]*255,color[1]*255,color[2]*255);hsv[1]+=offset;if(hsv[1]>1){hsv[1]=1;}else if(hsv[1]<=0){hsv[1]=0;}return HSVtoRGB(hsv[0],hsv[1],hsv[2]);}function addBrightnessToRGB(color,offset){var hsv=RGBtoHSV(color[0]*255,color[1]*255,color[2]*255);hsv[2]+=offset;if(hsv[2]>1){hsv[2]=1;}else if(hsv[2]<0){hsv[2]=0;}return HSVtoRGB(hsv[0],hsv[1],hsv[2]);}function addHueToRGB(color,offset){var hsv=RGBtoHSV(color[0]*255,color[1]*255,color[2]*255);hsv[0]+=offset/360;if(hsv[0]>1){hsv[0]-=1;}else if(hsv[0]<0){hsv[0]+=1;}return HSVtoRGB(hsv[0],hsv[1],hsv[2]);}var rgbToHex=function(){var colorMap=[];var i;var hex;for(i=0;i<256;i+=1){hex=i.toString(16);colorMap[i]=hex.length===1?'0'+hex:hex;}return function(r,g,b){if(r<0){r=0;}if(g<0){g=0;}if(b<0){b=0;}return '#'+colorMap[r]+colorMap[g]+colorMap[b];};}();var setSubframeEnabled=function setSubframeEnabled(flag){subframeEnabled=!!flag;};var getSubframeEnabled=function getSubframeEnabled(){return subframeEnabled;};var setExpressionsPlugin=function setExpressionsPlugin(value){expressionsPlugin=value;};var getExpressionsPlugin=function getExpressionsPlugin(){return expressionsPlugin;};var setDefaultCurveSegments=function setDefaultCurveSegments(value){defaultCurveSegments=value;};var getDefaultCurveSegments=function getDefaultCurveSegments(){return defaultCurveSegments;};var setIdPrefix=function setIdPrefix(value){idPrefix$1=value;};function createNS(type){// return {appendChild:function(){},setAttribute:function(){},style:{}}
	return document.createElementNS(svgNS,type);}function _typeof$5(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof$5=function _typeof(obj){return typeof obj;};}else{_typeof$5=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};}return _typeof$5(obj);}var dataManager=function(){var _counterId=1;var processes=[];var workerFn;var workerInstance;var workerProxy={onmessage:function onmessage(){},postMessage:function postMessage(path){workerFn({data:path});}};var _workerSelf={postMessage:function postMessage(data){workerProxy.onmessage({data:data});}};function createWorker(fn){if(window.Worker&&window.Blob&&getWebWorker()){var blob=new Blob(['var _workerSelf = self; self.onmessage = ',fn.toString()],{type:'text/javascript'});// var blob = new Blob(['self.onmessage = ', fn.toString()], { type: 'text/javascript' });
	var url=URL.createObjectURL(blob);return new Worker(url);}workerFn=fn;return workerProxy;}function setupWorker(){if(!workerInstance){workerInstance=createWorker(function workerStart(e){function dataFunctionManager(){function completeLayers(layers,comps){var layerData;var i;var len=layers.length;var j;var jLen;var k;var kLen;for(i=0;i<len;i+=1){layerData=layers[i];if('ks'in layerData&&!layerData.completed){layerData.completed=true;if(layerData.tt){layers[i-1].td=layerData.tt;}if(layerData.hasMask){var maskProps=layerData.masksProperties;jLen=maskProps.length;for(j=0;j<jLen;j+=1){if(maskProps[j].pt.k.i){convertPathsToAbsoluteValues(maskProps[j].pt.k);}else{kLen=maskProps[j].pt.k.length;for(k=0;k<kLen;k+=1){if(maskProps[j].pt.k[k].s){convertPathsToAbsoluteValues(maskProps[j].pt.k[k].s[0]);}if(maskProps[j].pt.k[k].e){convertPathsToAbsoluteValues(maskProps[j].pt.k[k].e[0]);}}}}}if(layerData.ty===0){layerData.layers=findCompLayers(layerData.refId,comps);completeLayers(layerData.layers,comps);}else if(layerData.ty===4){completeShapes(layerData.shapes);}else if(layerData.ty===5){completeText(layerData);}}}}function completeChars(chars,assets){if(chars){var i=0;var len=chars.length;for(i=0;i<len;i+=1){if(chars[i].t===1){// var compData = findComp(chars[i].data.refId, assets);
	chars[i].data.layers=findCompLayers(chars[i].data.refId,assets);// chars[i].data.ip = 0;
	// chars[i].data.op = 99999;
	// chars[i].data.st = 0;
	// chars[i].data.sr = 1;
	// chars[i].w = compData.w;
	// chars[i].data.ks = {
	//   a: { k: [0, 0, 0], a: 0 },
	//   p: { k: [0, -compData.h, 0], a: 0 },
	//   r: { k: 0, a: 0 },
	//   s: { k: [100, 100], a: 0 },
	//   o: { k: 100, a: 0 },
	// };
	completeLayers(chars[i].data.layers,assets);}}}}function findComp(id,comps){var i=0;var len=comps.length;while(i<len){if(comps[i].id===id){return comps[i];}i+=1;}return null;}function findCompLayers(id,comps){var comp=findComp(id,comps);if(comp){if(!comp.layers.__used){comp.layers.__used=true;return comp.layers;}return JSON.parse(JSON.stringify(comp.layers));}return null;}function completeShapes(arr){var i;var len=arr.length;var j;var jLen;for(i=len-1;i>=0;i-=1){if(arr[i].ty==='sh'){if(arr[i].ks.k.i){convertPathsToAbsoluteValues(arr[i].ks.k);}else{jLen=arr[i].ks.k.length;for(j=0;j<jLen;j+=1){if(arr[i].ks.k[j].s){convertPathsToAbsoluteValues(arr[i].ks.k[j].s[0]);}if(arr[i].ks.k[j].e){convertPathsToAbsoluteValues(arr[i].ks.k[j].e[0]);}}}}else if(arr[i].ty==='gr'){completeShapes(arr[i].it);}}}function convertPathsToAbsoluteValues(path){var i;var len=path.i.length;for(i=0;i<len;i+=1){path.i[i][0]+=path.v[i][0];path.i[i][1]+=path.v[i][1];path.o[i][0]+=path.v[i][0];path.o[i][1]+=path.v[i][1];}}function checkVersion(minimum,animVersionString){var animVersion=animVersionString?animVersionString.split('.'):[100,100,100];if(minimum[0]>animVersion[0]){return true;}if(animVersion[0]>minimum[0]){return false;}if(minimum[1]>animVersion[1]){return true;}if(animVersion[1]>minimum[1]){return false;}if(minimum[2]>animVersion[2]){return true;}if(animVersion[2]>minimum[2]){return false;}return null;}var checkText=function(){var minimumVersion=[4,4,14];function updateTextLayer(textLayer){var documentData=textLayer.t.d;textLayer.t.d={k:[{s:documentData,t:0}]};}function iterateLayers(layers){var i;var len=layers.length;for(i=0;i<len;i+=1){if(layers[i].ty===5){updateTextLayer(layers[i]);}}}return function(animationData){if(checkVersion(minimumVersion,animationData.v)){iterateLayers(animationData.layers);if(animationData.assets){var i;var len=animationData.assets.length;for(i=0;i<len;i+=1){if(animationData.assets[i].layers){iterateLayers(animationData.assets[i].layers);}}}}};}();var checkChars=function(){var minimumVersion=[4,7,99];return function(animationData){if(animationData.chars&&!checkVersion(minimumVersion,animationData.v)){var i;var len=animationData.chars.length;for(i=0;i<len;i+=1){var charData=animationData.chars[i];if(charData.data&&charData.data.shapes){completeShapes(charData.data.shapes);charData.data.ip=0;charData.data.op=99999;charData.data.st=0;charData.data.sr=1;charData.data.ks={p:{k:[0,0],a:0},s:{k:[100,100],a:0},a:{k:[0,0],a:0},r:{k:0,a:0},o:{k:100,a:0}};if(!animationData.chars[i].t){charData.data.shapes.push({ty:'no'});charData.data.shapes[0].it.push({p:{k:[0,0],a:0},s:{k:[100,100],a:0},a:{k:[0,0],a:0},r:{k:0,a:0},o:{k:100,a:0},sk:{k:0,a:0},sa:{k:0,a:0},ty:'tr'});}}}}};}();var checkPathProperties=function(){var minimumVersion=[5,7,15];function updateTextLayer(textLayer){var pathData=textLayer.t.p;if(typeof pathData.a==='number'){pathData.a={a:0,k:pathData.a};}if(typeof pathData.p==='number'){pathData.p={a:0,k:pathData.p};}if(typeof pathData.r==='number'){pathData.r={a:0,k:pathData.r};}}function iterateLayers(layers){var i;var len=layers.length;for(i=0;i<len;i+=1){if(layers[i].ty===5){updateTextLayer(layers[i]);}}}return function(animationData){if(checkVersion(minimumVersion,animationData.v)){iterateLayers(animationData.layers);if(animationData.assets){var i;var len=animationData.assets.length;for(i=0;i<len;i+=1){if(animationData.assets[i].layers){iterateLayers(animationData.assets[i].layers);}}}}};}();var checkColors=function(){var minimumVersion=[4,1,9];function iterateShapes(shapes){var i;var len=shapes.length;var j;var jLen;for(i=0;i<len;i+=1){if(shapes[i].ty==='gr'){iterateShapes(shapes[i].it);}else if(shapes[i].ty==='fl'||shapes[i].ty==='st'){if(shapes[i].c.k&&shapes[i].c.k[0].i){jLen=shapes[i].c.k.length;for(j=0;j<jLen;j+=1){if(shapes[i].c.k[j].s){shapes[i].c.k[j].s[0]/=255;shapes[i].c.k[j].s[1]/=255;shapes[i].c.k[j].s[2]/=255;shapes[i].c.k[j].s[3]/=255;}if(shapes[i].c.k[j].e){shapes[i].c.k[j].e[0]/=255;shapes[i].c.k[j].e[1]/=255;shapes[i].c.k[j].e[2]/=255;shapes[i].c.k[j].e[3]/=255;}}}else{shapes[i].c.k[0]/=255;shapes[i].c.k[1]/=255;shapes[i].c.k[2]/=255;shapes[i].c.k[3]/=255;}}}}function iterateLayers(layers){var i;var len=layers.length;for(i=0;i<len;i+=1){if(layers[i].ty===4){iterateShapes(layers[i].shapes);}}}return function(animationData){if(checkVersion(minimumVersion,animationData.v)){iterateLayers(animationData.layers);if(animationData.assets){var i;var len=animationData.assets.length;for(i=0;i<len;i+=1){if(animationData.assets[i].layers){iterateLayers(animationData.assets[i].layers);}}}}};}();var checkShapes=function(){var minimumVersion=[4,4,18];function completeClosingShapes(arr){var i;var len=arr.length;var j;var jLen;for(i=len-1;i>=0;i-=1){if(arr[i].ty==='sh'){if(arr[i].ks.k.i){arr[i].ks.k.c=arr[i].closed;}else{jLen=arr[i].ks.k.length;for(j=0;j<jLen;j+=1){if(arr[i].ks.k[j].s){arr[i].ks.k[j].s[0].c=arr[i].closed;}if(arr[i].ks.k[j].e){arr[i].ks.k[j].e[0].c=arr[i].closed;}}}}else if(arr[i].ty==='gr'){completeClosingShapes(arr[i].it);}}}function iterateLayers(layers){var layerData;var i;var len=layers.length;var j;var jLen;var k;var kLen;for(i=0;i<len;i+=1){layerData=layers[i];if(layerData.hasMask){var maskProps=layerData.masksProperties;jLen=maskProps.length;for(j=0;j<jLen;j+=1){if(maskProps[j].pt.k.i){maskProps[j].pt.k.c=maskProps[j].cl;}else{kLen=maskProps[j].pt.k.length;for(k=0;k<kLen;k+=1){if(maskProps[j].pt.k[k].s){maskProps[j].pt.k[k].s[0].c=maskProps[j].cl;}if(maskProps[j].pt.k[k].e){maskProps[j].pt.k[k].e[0].c=maskProps[j].cl;}}}}}if(layerData.ty===4){completeClosingShapes(layerData.shapes);}}}return function(animationData){if(checkVersion(minimumVersion,animationData.v)){iterateLayers(animationData.layers);if(animationData.assets){var i;var len=animationData.assets.length;for(i=0;i<len;i+=1){if(animationData.assets[i].layers){iterateLayers(animationData.assets[i].layers);}}}}};}();function completeData(animationData){if(animationData.__complete){return;}checkColors(animationData);checkText(animationData);checkChars(animationData);checkPathProperties(animationData);checkShapes(animationData);completeLayers(animationData.layers,animationData.assets);completeChars(animationData.chars,animationData.assets);animationData.__complete=true;}function completeText(data){if(data.t.a.length===0&&!('m'in data.t.p));}var moduleOb={};moduleOb.completeData=completeData;moduleOb.checkColors=checkColors;moduleOb.checkChars=checkChars;moduleOb.checkPathProperties=checkPathProperties;moduleOb.checkShapes=checkShapes;moduleOb.completeLayers=completeLayers;return moduleOb;}if(!_workerSelf.dataManager){_workerSelf.dataManager=dataFunctionManager();}if(!_workerSelf.assetLoader){_workerSelf.assetLoader=function(){function formatResponse(xhr){// using typeof doubles the time of execution of this method,
	// so if available, it's better to use the header to validate the type
	var contentTypeHeader=xhr.getResponseHeader('content-type');if(contentTypeHeader&&xhr.responseType==='json'&&contentTypeHeader.indexOf('json')!==-1){return xhr.response;}if(xhr.response&&_typeof$5(xhr.response)==='object'){return xhr.response;}if(xhr.response&&typeof xhr.response==='string'){return JSON.parse(xhr.response);}if(xhr.responseText){return JSON.parse(xhr.responseText);}return null;}function loadAsset(path,fullPath,callback,errorCallback){var response;var xhr=new XMLHttpRequest();// set responseType after calling open or IE will break.
	try{// This crashes on Android WebView prior to KitKat
	xhr.responseType='json';}catch(err){}// eslint-disable-line no-empty
	xhr.onreadystatechange=function(){if(xhr.readyState===4){if(xhr.status===200){response=formatResponse(xhr);callback(response);}else{try{response=formatResponse(xhr);callback(response);}catch(err){if(errorCallback){errorCallback(err);}}}}};try{xhr.open('GET',path,true);}catch(error){xhr.open('GET',fullPath+'/'+path,true);}xhr.send();}return {load:loadAsset};}();}if(e.data.type==='loadAnimation'){_workerSelf.assetLoader.load(e.data.path,e.data.fullPath,function(data){_workerSelf.dataManager.completeData(data);_workerSelf.postMessage({id:e.data.id,payload:data,status:'success'});},function(){_workerSelf.postMessage({id:e.data.id,status:'error'});});}else if(e.data.type==='complete'){var animation=e.data.animation;_workerSelf.dataManager.completeData(animation);_workerSelf.postMessage({id:e.data.id,payload:animation,status:'success'});}else if(e.data.type==='loadData'){_workerSelf.assetLoader.load(e.data.path,e.data.fullPath,function(data){_workerSelf.postMessage({id:e.data.id,payload:data,status:'success'});},function(){_workerSelf.postMessage({id:e.data.id,status:'error'});});}});workerInstance.onmessage=function(event){var data=event.data;var id=data.id;var process=processes[id];processes[id]=null;if(data.status==='success'){process.onComplete(data.payload);}else if(process.onError){process.onError();}};}}function createProcess(onComplete,onError){_counterId+=1;var id='processId_'+_counterId;processes[id]={onComplete:onComplete,onError:onError};return id;}function loadAnimation(path,onComplete,onError){setupWorker();var processId=createProcess(onComplete,onError);workerInstance.postMessage({type:'loadAnimation',path:path,fullPath:window.location.origin+window.location.pathname,id:processId});}function loadData(path,onComplete,onError){setupWorker();var processId=createProcess(onComplete,onError);workerInstance.postMessage({type:'loadData',path:path,fullPath:window.location.origin+window.location.pathname,id:processId});}function completeAnimation(anim,onComplete,onError){setupWorker();var processId=createProcess(onComplete,onError);workerInstance.postMessage({type:'complete',animation:anim,id:processId});}return {loadAnimation:loadAnimation,loadData:loadData,completeAnimation:completeAnimation};}();var ImagePreloader=function(){var proxyImage=function(){var canvas=createTag('canvas');canvas.width=1;canvas.height=1;var ctx=canvas.getContext('2d');ctx.fillStyle='rgba(0,0,0,0)';ctx.fillRect(0,0,1,1);return canvas;}();function imageLoaded(){this.loadedAssets+=1;if(this.loadedAssets===this.totalImages&&this.loadedFootagesCount===this.totalFootages){if(this.imagesLoadedCb){this.imagesLoadedCb(null);}}}function footageLoaded(){this.loadedFootagesCount+=1;if(this.loadedAssets===this.totalImages&&this.loadedFootagesCount===this.totalFootages){if(this.imagesLoadedCb){this.imagesLoadedCb(null);}}}function getAssetsPath(assetData,assetsPath,originalPath){var path='';if(assetData.e){path=assetData.p;}else if(assetsPath){var imagePath=assetData.p;if(imagePath.indexOf('images/')!==-1){imagePath=imagePath.split('/')[1];}path=assetsPath+imagePath;}else{path=originalPath;path+=assetData.u?assetData.u:'';path+=assetData.p;}return path;}function testImageLoaded(img){var _count=0;var intervalId=setInterval(function(){var box=img.getBBox();if(box.width||_count>500){this._imageLoaded();clearInterval(intervalId);}_count+=1;}.bind(this),50);}function createImageData(assetData){var path=getAssetsPath(assetData,this.assetsPath,this.path);var img=createNS('image');if(isSafari){this.testImageLoaded(img);}else{img.addEventListener('load',this._imageLoaded,false);}img.addEventListener('error',function(){ob.img=proxyImage;this._imageLoaded();}.bind(this),false);img.setAttributeNS('http://www.w3.org/1999/xlink','href',path);if(this._elementHelper.append){this._elementHelper.append(img);}else{this._elementHelper.appendChild(img);}var ob={img:img,assetData:assetData};return ob;}function createImgData(assetData){var path=getAssetsPath(assetData,this.assetsPath,this.path);var img=createTag('img');img.crossOrigin='anonymous';img.addEventListener('load',this._imageLoaded,false);img.addEventListener('error',function(){ob.img=proxyImage;this._imageLoaded();}.bind(this),false);img.src=path;var ob={img:img,assetData:assetData};return ob;}function createFootageData(data){var ob={assetData:data};var path=getAssetsPath(data,this.assetsPath,this.path);dataManager.loadData(path,function(footageData){ob.img=footageData;this._footageLoaded();}.bind(this),function(){ob.img={};this._footageLoaded();}.bind(this));return ob;}function loadAssets(assets,cb){this.imagesLoadedCb=cb;var i;var len=assets.length;for(i=0;i<len;i+=1){if(!assets[i].layers){if(!assets[i].t||assets[i].t==='seq'){this.totalImages+=1;this.images.push(this._createImageData(assets[i]));}else if(assets[i].t===3){this.totalFootages+=1;this.images.push(this.createFootageData(assets[i]));}}}}function setPath(path){this.path=path||'';}function setAssetsPath(path){this.assetsPath=path||'';}function getAsset(assetData){var i=0;var len=this.images.length;while(i<len){if(this.images[i].assetData===assetData){return this.images[i].img;}i+=1;}return null;}function destroy(){this.imagesLoadedCb=null;this.images.length=0;}function loadedImages(){return this.totalImages===this.loadedAssets;}function loadedFootages(){return this.totalFootages===this.loadedFootagesCount;}function setCacheType(type,elementHelper){if(type==='svg'){this._elementHelper=elementHelper;this._createImageData=this.createImageData.bind(this);}else{this._createImageData=this.createImgData.bind(this);}}function ImagePreloaderFactory(){this._imageLoaded=imageLoaded.bind(this);this._footageLoaded=footageLoaded.bind(this);this.testImageLoaded=testImageLoaded.bind(this);this.createFootageData=createFootageData.bind(this);this.assetsPath='';this.path='';this.totalImages=0;this.totalFootages=0;this.loadedAssets=0;this.loadedFootagesCount=0;this.imagesLoadedCb=null;this.images=[];}ImagePreloaderFactory.prototype={loadAssets:loadAssets,setAssetsPath:setAssetsPath,setPath:setPath,loadedImages:loadedImages,loadedFootages:loadedFootages,destroy:destroy,getAsset:getAsset,createImgData:createImgData,createImageData:createImageData,imageLoaded:imageLoaded,footageLoaded:footageLoaded,setCacheType:setCacheType};return ImagePreloaderFactory;}();function BaseEvent(){}BaseEvent.prototype={triggerEvent:function triggerEvent(eventName,args){if(this._cbs[eventName]){var callbacks=this._cbs[eventName];for(var i=0;i<callbacks.length;i+=1){callbacks[i](args);}}},addEventListener:function addEventListener(eventName,callback){if(!this._cbs[eventName]){this._cbs[eventName]=[];}this._cbs[eventName].push(callback);return function(){this.removeEventListener(eventName,callback);}.bind(this);},removeEventListener:function removeEventListener(eventName,callback){if(!callback){this._cbs[eventName]=null;}else if(this._cbs[eventName]){var i=0;var len=this._cbs[eventName].length;while(i<len){if(this._cbs[eventName][i]===callback){this._cbs[eventName].splice(i,1);i-=1;len-=1;}i+=1;}if(!this._cbs[eventName].length){this._cbs[eventName]=null;}}}};var markerParser=function(){function parsePayloadLines(payload){var lines=payload.split('\r\n');var keys={};var line;var keysCount=0;for(var i=0;i<lines.length;i+=1){line=lines[i].split(':');if(line.length===2){keys[line[0]]=line[1].trim();keysCount+=1;}}if(keysCount===0){throw new Error();}return keys;}return function(_markers){var markers=[];for(var i=0;i<_markers.length;i+=1){var _marker=_markers[i];var markerData={time:_marker.tm,duration:_marker.dr};try{markerData.payload=JSON.parse(_markers[i].cm);}catch(_){try{markerData.payload=parsePayloadLines(_markers[i].cm);}catch(__){markerData.payload={name:_markers[i].cm};}}markers.push(markerData);}return markers;};}();var ProjectInterface=function(){function registerComposition(comp){this.compositions.push(comp);}return function(){function _thisProjectFunction(name){var i=0;var len=this.compositions.length;while(i<len){if(this.compositions[i].data&&this.compositions[i].data.nm===name){if(this.compositions[i].prepareFrame&&this.compositions[i].data.xt){this.compositions[i].prepareFrame(this.currentFrame);}return this.compositions[i].compInterface;}i+=1;}return null;}_thisProjectFunction.compositions=[];_thisProjectFunction.currentFrame=0;_thisProjectFunction.registerComposition=registerComposition;return _thisProjectFunction;};}();var renderers={};var registerRenderer=function registerRenderer(key,value){renderers[key]=value;};function getRenderer(key){return renderers[key];}function _typeof$4(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof$4=function _typeof(obj){return typeof obj;};}else{_typeof$4=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};}return _typeof$4(obj);}var AnimationItem=function AnimationItem(){this._cbs=[];this.name='';this.path='';this.isLoaded=false;this.currentFrame=0;this.currentRawFrame=0;this.firstFrame=0;this.totalFrames=0;this.frameRate=0;this.frameMult=0;this.playSpeed=1;this.playDirection=1;this.playCount=0;this.animationData={};this.assets=[];this.isPaused=true;this.autoplay=false;this.loop=true;this.renderer=null;this.animationID=createElementID();this.assetsPath='';this.timeCompleted=0;this.segmentPos=0;this.isSubframeEnabled=getSubframeEnabled();this.segments=[];this._idle=true;this._completedLoop=false;this.projectInterface=ProjectInterface();this.imagePreloader=new ImagePreloader();this.audioController=audioControllerFactory();this.markers=[];this.configAnimation=this.configAnimation.bind(this);this.onSetupError=this.onSetupError.bind(this);this.onSegmentComplete=this.onSegmentComplete.bind(this);this.drawnFrameEvent=new BMEnterFrameEvent('drawnFrame',0,0,0);};extendPrototype([BaseEvent],AnimationItem);AnimationItem.prototype.setParams=function(params){if(params.wrapper||params.container){this.wrapper=params.wrapper||params.container;}var animType='svg';if(params.animType){animType=params.animType;}else if(params.renderer){animType=params.renderer;}var RendererClass=getRenderer(animType);this.renderer=new RendererClass(this,params.rendererSettings);this.imagePreloader.setCacheType(animType,this.renderer.globalData.defs);this.renderer.setProjectInterface(this.projectInterface);this.animType=animType;if(params.loop===''||params.loop===null||params.loop===undefined||params.loop===true){this.loop=true;}else if(params.loop===false){this.loop=false;}else{this.loop=parseInt(params.loop,10);}this.autoplay='autoplay'in params?params.autoplay:true;this.name=params.name?params.name:'';this.autoloadSegments=Object.prototype.hasOwnProperty.call(params,'autoloadSegments')?params.autoloadSegments:true;this.assetsPath=params.assetsPath;this.initialSegment=params.initialSegment;if(params.audioFactory){this.audioController.setAudioFactory(params.audioFactory);}if(params.animationData){this.setupAnimation(params.animationData);}else if(params.path){if(params.path.lastIndexOf('\\')!==-1){this.path=params.path.substr(0,params.path.lastIndexOf('\\')+1);}else{this.path=params.path.substr(0,params.path.lastIndexOf('/')+1);}this.fileName=params.path.substr(params.path.lastIndexOf('/')+1);this.fileName=this.fileName.substr(0,this.fileName.lastIndexOf('.json'));dataManager.loadAnimation(params.path,this.configAnimation,this.onSetupError);}};AnimationItem.prototype.onSetupError=function(){this.trigger('data_failed');};AnimationItem.prototype.setupAnimation=function(data){dataManager.completeAnimation(data,this.configAnimation);};AnimationItem.prototype.setData=function(wrapper,animationData){if(animationData){if(_typeof$4(animationData)!=='object'){animationData=JSON.parse(animationData);}}var params={wrapper:wrapper,animationData:animationData};var wrapperAttributes=wrapper.attributes;params.path=wrapperAttributes.getNamedItem('data-animation-path')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-animation-path').value:wrapperAttributes.getNamedItem('data-bm-path')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-bm-path').value:wrapperAttributes.getNamedItem('bm-path')?wrapperAttributes.getNamedItem('bm-path').value:'';params.animType=wrapperAttributes.getNamedItem('data-anim-type')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-anim-type').value:wrapperAttributes.getNamedItem('data-bm-type')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-bm-type').value:wrapperAttributes.getNamedItem('bm-type')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('bm-type').value:wrapperAttributes.getNamedItem('data-bm-renderer')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-bm-renderer').value:wrapperAttributes.getNamedItem('bm-renderer')?wrapperAttributes.getNamedItem('bm-renderer').value:'canvas';var loop=wrapperAttributes.getNamedItem('data-anim-loop')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-anim-loop').value:wrapperAttributes.getNamedItem('data-bm-loop')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-bm-loop').value:wrapperAttributes.getNamedItem('bm-loop')?wrapperAttributes.getNamedItem('bm-loop').value:'';if(loop==='false'){params.loop=false;}else if(loop==='true'){params.loop=true;}else if(loop!==''){params.loop=parseInt(loop,10);}var autoplay=wrapperAttributes.getNamedItem('data-anim-autoplay')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-anim-autoplay').value:wrapperAttributes.getNamedItem('data-bm-autoplay')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-bm-autoplay').value:wrapperAttributes.getNamedItem('bm-autoplay')?wrapperAttributes.getNamedItem('bm-autoplay').value:true;params.autoplay=autoplay!=='false';params.name=wrapperAttributes.getNamedItem('data-name')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-name').value:wrapperAttributes.getNamedItem('data-bm-name')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-bm-name').value:wrapperAttributes.getNamedItem('bm-name')?wrapperAttributes.getNamedItem('bm-name').value:'';var prerender=wrapperAttributes.getNamedItem('data-anim-prerender')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-anim-prerender').value:wrapperAttributes.getNamedItem('data-bm-prerender')// eslint-disable-line no-nested-ternary
	?wrapperAttributes.getNamedItem('data-bm-prerender').value:wrapperAttributes.getNamedItem('bm-prerender')?wrapperAttributes.getNamedItem('bm-prerender').value:'';if(prerender==='false'){params.prerender=false;}this.setParams(params);};AnimationItem.prototype.includeLayers=function(data){if(data.op>this.animationData.op){this.animationData.op=data.op;this.totalFrames=Math.floor(data.op-this.animationData.ip);}var layers=this.animationData.layers;var i;var len=layers.length;var newLayers=data.layers;var j;var jLen=newLayers.length;for(j=0;j<jLen;j+=1){i=0;while(i<len){if(layers[i].id===newLayers[j].id){layers[i]=newLayers[j];break;}i+=1;}}if(data.chars||data.fonts){this.renderer.globalData.fontManager.addChars(data.chars);this.renderer.globalData.fontManager.addFonts(data.fonts,this.renderer.globalData.defs);}if(data.assets){len=data.assets.length;for(i=0;i<len;i+=1){this.animationData.assets.push(data.assets[i]);}}this.animationData.__complete=false;dataManager.completeAnimation(this.animationData,this.onSegmentComplete);};AnimationItem.prototype.onSegmentComplete=function(data){this.animationData=data;var expressionsPlugin=getExpressionsPlugin();if(expressionsPlugin){expressionsPlugin.initExpressions(this);}this.loadNextSegment();};AnimationItem.prototype.loadNextSegment=function(){var segments=this.animationData.segments;if(!segments||segments.length===0||!this.autoloadSegments){this.trigger('data_ready');this.timeCompleted=this.totalFrames;return;}var segment=segments.shift();this.timeCompleted=segment.time*this.frameRate;var segmentPath=this.path+this.fileName+'_'+this.segmentPos+'.json';this.segmentPos+=1;dataManager.loadData(segmentPath,this.includeLayers.bind(this),function(){this.trigger('data_failed');}.bind(this));};AnimationItem.prototype.loadSegments=function(){var segments=this.animationData.segments;if(!segments){this.timeCompleted=this.totalFrames;}this.loadNextSegment();};AnimationItem.prototype.imagesLoaded=function(){this.trigger('loaded_images');this.checkLoaded();};AnimationItem.prototype.preloadImages=function(){this.imagePreloader.setAssetsPath(this.assetsPath);this.imagePreloader.setPath(this.path);this.imagePreloader.loadAssets(this.animationData.assets,this.imagesLoaded.bind(this));};AnimationItem.prototype.configAnimation=function(animData){if(!this.renderer){return;}try{this.animationData=animData;if(this.initialSegment){this.totalFrames=Math.floor(this.initialSegment[1]-this.initialSegment[0]);this.firstFrame=Math.round(this.initialSegment[0]);}else{this.totalFrames=Math.floor(this.animationData.op-this.animationData.ip);this.firstFrame=Math.round(this.animationData.ip);}this.renderer.configAnimation(animData);if(!animData.assets){animData.assets=[];}this.assets=this.animationData.assets;this.frameRate=this.animationData.fr;this.frameMult=this.animationData.fr/1000;this.renderer.searchExtraCompositions(animData.assets);this.markers=markerParser(animData.markers||[]);this.trigger('config_ready');this.preloadImages();this.loadSegments();this.updaFrameModifier();this.waitForFontsLoaded();if(this.isPaused){this.audioController.pause();}}catch(error){this.triggerConfigError(error);}};AnimationItem.prototype.waitForFontsLoaded=function(){if(!this.renderer){return;}if(this.renderer.globalData.fontManager.isLoaded){this.checkLoaded();}else{setTimeout(this.waitForFontsLoaded.bind(this),20);}};AnimationItem.prototype.checkLoaded=function(){if(!this.isLoaded&&this.renderer.globalData.fontManager.isLoaded&&(this.imagePreloader.loadedImages()||this.renderer.rendererType!=='canvas')&&this.imagePreloader.loadedFootages()){this.isLoaded=true;var expressionsPlugin=getExpressionsPlugin();if(expressionsPlugin){expressionsPlugin.initExpressions(this);}this.renderer.initItems();setTimeout(function(){this.trigger('DOMLoaded');}.bind(this),0);this.gotoFrame();if(this.autoplay){this.play();}}};AnimationItem.prototype.resize=function(){this.renderer.updateContainerSize();};AnimationItem.prototype.setSubframe=function(flag){this.isSubframeEnabled=!!flag;};AnimationItem.prototype.gotoFrame=function(){this.currentFrame=this.isSubframeEnabled?this.currentRawFrame:~~this.currentRawFrame;// eslint-disable-line no-bitwise
	if(this.timeCompleted!==this.totalFrames&&this.currentFrame>this.timeCompleted){this.currentFrame=this.timeCompleted;}this.trigger('enterFrame');this.renderFrame();this.trigger('drawnFrame');};AnimationItem.prototype.renderFrame=function(){if(this.isLoaded===false||!this.renderer){return;}try{this.renderer.renderFrame(this.currentFrame+this.firstFrame);}catch(error){this.triggerRenderFrameError(error);}};AnimationItem.prototype.play=function(name){if(name&&this.name!==name){return;}if(this.isPaused===true){this.isPaused=false;this.trigger('_pause');this.audioController.resume();if(this._idle){this._idle=false;this.trigger('_active');}}};AnimationItem.prototype.pause=function(name){if(name&&this.name!==name){return;}if(this.isPaused===false){this.isPaused=true;this.trigger('_play');this._idle=true;this.trigger('_idle');this.audioController.pause();}};AnimationItem.prototype.togglePause=function(name){if(name&&this.name!==name){return;}if(this.isPaused===true){this.play();}else{this.pause();}};AnimationItem.prototype.stop=function(name){if(name&&this.name!==name){return;}this.pause();this.playCount=0;this._completedLoop=false;this.setCurrentRawFrameValue(0);};AnimationItem.prototype.getMarkerData=function(markerName){var marker;for(var i=0;i<this.markers.length;i+=1){marker=this.markers[i];if(marker.payload&&marker.payload.name===markerName){return marker;}}return null;};AnimationItem.prototype.goToAndStop=function(value,isFrame,name){if(name&&this.name!==name){return;}var numValue=Number(value);if(isNaN(numValue)){var marker=this.getMarkerData(value);if(marker){this.goToAndStop(marker.time,true);}}else if(isFrame){this.setCurrentRawFrameValue(value);}else{this.setCurrentRawFrameValue(value*this.frameModifier);}this.pause();};AnimationItem.prototype.goToAndPlay=function(value,isFrame,name){if(name&&this.name!==name){return;}var numValue=Number(value);if(isNaN(numValue)){var marker=this.getMarkerData(value);if(marker){if(!marker.duration){this.goToAndStop(marker.time,true);}else{this.playSegments([marker.time,marker.time+marker.duration],true);}}}else{this.goToAndStop(numValue,isFrame,name);}this.play();};AnimationItem.prototype.advanceTime=function(value){if(this.isPaused===true||this.isLoaded===false){return;}var nextValue=this.currentRawFrame+value*this.frameModifier;var _isComplete=false;// Checking if nextValue > totalFrames - 1 for addressing non looping and looping animations.
	// If animation won't loop, it should stop at totalFrames - 1. If it will loop it should complete the last frame and then loop.
	if(nextValue>=this.totalFrames-1&&this.frameModifier>0){if(!this.loop||this.playCount===this.loop){if(!this.checkSegments(nextValue>this.totalFrames?nextValue%this.totalFrames:0)){_isComplete=true;nextValue=this.totalFrames-1;}}else if(nextValue>=this.totalFrames){this.playCount+=1;if(!this.checkSegments(nextValue%this.totalFrames)){this.setCurrentRawFrameValue(nextValue%this.totalFrames);this._completedLoop=true;this.trigger('loopComplete');}}else{this.setCurrentRawFrameValue(nextValue);}}else if(nextValue<0){if(!this.checkSegments(nextValue%this.totalFrames)){if(this.loop&&!(this.playCount--<=0&&this.loop!==true)){// eslint-disable-line no-plusplus
	this.setCurrentRawFrameValue(this.totalFrames+nextValue%this.totalFrames);if(!this._completedLoop){this._completedLoop=true;}else{this.trigger('loopComplete');}}else{_isComplete=true;nextValue=0;}}}else{this.setCurrentRawFrameValue(nextValue);}if(_isComplete){this.setCurrentRawFrameValue(nextValue);this.pause();this.trigger('complete');}};AnimationItem.prototype.adjustSegment=function(arr,offset){this.playCount=0;if(arr[1]<arr[0]){if(this.frameModifier>0){if(this.playSpeed<0){this.setSpeed(-this.playSpeed);}else{this.setDirection(-1);}}this.totalFrames=arr[0]-arr[1];this.timeCompleted=this.totalFrames;this.firstFrame=arr[1];this.setCurrentRawFrameValue(this.totalFrames-0.001-offset);}else if(arr[1]>arr[0]){if(this.frameModifier<0){if(this.playSpeed<0){this.setSpeed(-this.playSpeed);}else{this.setDirection(1);}}this.totalFrames=arr[1]-arr[0];this.timeCompleted=this.totalFrames;this.firstFrame=arr[0];this.setCurrentRawFrameValue(0.001+offset);}this.trigger('segmentStart');};AnimationItem.prototype.setSegment=function(init,end){var pendingFrame=-1;if(this.isPaused){if(this.currentRawFrame+this.firstFrame<init){pendingFrame=init;}else if(this.currentRawFrame+this.firstFrame>end){pendingFrame=end-init;}}this.firstFrame=init;this.totalFrames=end-init;this.timeCompleted=this.totalFrames;if(pendingFrame!==-1){this.goToAndStop(pendingFrame,true);}};AnimationItem.prototype.playSegments=function(arr,forceFlag){if(forceFlag){this.segments.length=0;}if(_typeof$4(arr[0])==='object'){var i;var len=arr.length;for(i=0;i<len;i+=1){this.segments.push(arr[i]);}}else{this.segments.push(arr);}if(this.segments.length&&forceFlag){this.adjustSegment(this.segments.shift(),0);}if(this.isPaused){this.play();}};AnimationItem.prototype.resetSegments=function(forceFlag){this.segments.length=0;this.segments.push([this.animationData.ip,this.animationData.op]);if(forceFlag){this.checkSegments(0);}};AnimationItem.prototype.checkSegments=function(offset){if(this.segments.length){this.adjustSegment(this.segments.shift(),offset);return true;}return false;};AnimationItem.prototype.destroy=function(name){if(name&&this.name!==name||!this.renderer){return;}this.renderer.destroy();this.imagePreloader.destroy();this.trigger('destroy');this._cbs=null;this.onEnterFrame=null;this.onLoopComplete=null;this.onComplete=null;this.onSegmentStart=null;this.onDestroy=null;this.renderer=null;this.renderer=null;this.imagePreloader=null;this.projectInterface=null;};AnimationItem.prototype.setCurrentRawFrameValue=function(value){this.currentRawFrame=value;this.gotoFrame();};AnimationItem.prototype.setSpeed=function(val){this.playSpeed=val;this.updaFrameModifier();};AnimationItem.prototype.setDirection=function(val){this.playDirection=val<0?-1:1;this.updaFrameModifier();};AnimationItem.prototype.setVolume=function(val,name){if(name&&this.name!==name){return;}this.audioController.setVolume(val);};AnimationItem.prototype.getVolume=function(){return this.audioController.getVolume();};AnimationItem.prototype.mute=function(name){if(name&&this.name!==name){return;}this.audioController.mute();};AnimationItem.prototype.unmute=function(name){if(name&&this.name!==name){return;}this.audioController.unmute();};AnimationItem.prototype.updaFrameModifier=function(){this.frameModifier=this.frameMult*this.playSpeed*this.playDirection;this.audioController.setRate(this.playSpeed*this.playDirection);};AnimationItem.prototype.getPath=function(){return this.path;};AnimationItem.prototype.getAssetsPath=function(assetData){var path='';if(assetData.e){path=assetData.p;}else if(this.assetsPath){var imagePath=assetData.p;if(imagePath.indexOf('images/')!==-1){imagePath=imagePath.split('/')[1];}path=this.assetsPath+imagePath;}else{path=this.path;path+=assetData.u?assetData.u:'';path+=assetData.p;}return path;};AnimationItem.prototype.getAssetData=function(id){var i=0;var len=this.assets.length;while(i<len){if(id===this.assets[i].id){return this.assets[i];}i+=1;}return null;};AnimationItem.prototype.hide=function(){this.renderer.hide();};AnimationItem.prototype.show=function(){this.renderer.show();};AnimationItem.prototype.getDuration=function(isFrame){return isFrame?this.totalFrames:this.totalFrames/this.frameRate;};AnimationItem.prototype.updateDocumentData=function(path,documentData,index){try{var element=this.renderer.getElementByPath(path);element.updateDocumentData(documentData,index);}catch(error){// TODO: decide how to handle catch case
	}};AnimationItem.prototype.trigger=function(name){if(this._cbs&&this._cbs[name]){switch(name){case'enterFrame':this.triggerEvent(name,new BMEnterFrameEvent(name,this.currentFrame,this.totalFrames,this.frameModifier));break;case'drawnFrame':this.drawnFrameEvent.currentTime=this.currentFrame;this.drawnFrameEvent.totalTime=this.totalFrames;this.drawnFrameEvent.direction=this.frameModifier;this.triggerEvent(name,this.drawnFrameEvent);break;case'loopComplete':this.triggerEvent(name,new BMCompleteLoopEvent(name,this.loop,this.playCount,this.frameMult));break;case'complete':this.triggerEvent(name,new BMCompleteEvent(name,this.frameMult));break;case'segmentStart':this.triggerEvent(name,new BMSegmentStartEvent(name,this.firstFrame,this.totalFrames));break;case'destroy':this.triggerEvent(name,new BMDestroyEvent(name,this));break;default:this.triggerEvent(name);}}if(name==='enterFrame'&&this.onEnterFrame){this.onEnterFrame.call(this,new BMEnterFrameEvent(name,this.currentFrame,this.totalFrames,this.frameMult));}if(name==='loopComplete'&&this.onLoopComplete){this.onLoopComplete.call(this,new BMCompleteLoopEvent(name,this.loop,this.playCount,this.frameMult));}if(name==='complete'&&this.onComplete){this.onComplete.call(this,new BMCompleteEvent(name,this.frameMult));}if(name==='segmentStart'&&this.onSegmentStart){this.onSegmentStart.call(this,new BMSegmentStartEvent(name,this.firstFrame,this.totalFrames));}if(name==='destroy'&&this.onDestroy){this.onDestroy.call(this,new BMDestroyEvent(name,this));}};AnimationItem.prototype.triggerRenderFrameError=function(nativeError){var error=new BMRenderFrameErrorEvent(nativeError,this.currentFrame);this.triggerEvent('error',error);if(this.onError){this.onError.call(this,error);}};AnimationItem.prototype.triggerConfigError=function(nativeError){var error=new BMConfigErrorEvent(nativeError,this.currentFrame);this.triggerEvent('error',error);if(this.onError){this.onError.call(this,error);}};var animationManager=function(){var moduleOb={};var registeredAnimations=[];var initTime=0;var len=0;var playingAnimationsNum=0;var _stopped=true;var _isFrozen=false;function removeElement(ev){var i=0;var animItem=ev.target;while(i<len){if(registeredAnimations[i].animation===animItem){registeredAnimations.splice(i,1);i-=1;len-=1;if(!animItem.isPaused){subtractPlayingCount();}}i+=1;}}function registerAnimation(element,animationData){if(!element){return null;}var i=0;while(i<len){if(registeredAnimations[i].elem===element&&registeredAnimations[i].elem!==null){return registeredAnimations[i].animation;}i+=1;}var animItem=new AnimationItem();setupAnimation(animItem,element);animItem.setData(element,animationData);return animItem;}function getRegisteredAnimations(){var i;var lenAnims=registeredAnimations.length;var animations=[];for(i=0;i<lenAnims;i+=1){animations.push(registeredAnimations[i].animation);}return animations;}function addPlayingCount(){playingAnimationsNum+=1;activate();}function subtractPlayingCount(){playingAnimationsNum-=1;}function setupAnimation(animItem,element){animItem.addEventListener('destroy',removeElement);animItem.addEventListener('_active',addPlayingCount);animItem.addEventListener('_idle',subtractPlayingCount);registeredAnimations.push({elem:element,animation:animItem});len+=1;}function loadAnimation(params){var animItem=new AnimationItem();setupAnimation(animItem,null);animItem.setParams(params);return animItem;}function setSpeed(val,animation){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.setSpeed(val,animation);}}function setDirection(val,animation){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.setDirection(val,animation);}}function play(animation){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.play(animation);}}function resume(nowTime){var elapsedTime=nowTime-initTime;var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.advanceTime(elapsedTime);}initTime=nowTime;if(playingAnimationsNum&&!_isFrozen){window.requestAnimationFrame(resume);}else{_stopped=true;}}function first(nowTime){initTime=nowTime;window.requestAnimationFrame(resume);}function pause(animation){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.pause(animation);}}function goToAndStop(value,isFrame,animation){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.goToAndStop(value,isFrame,animation);}}function stop(animation){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.stop(animation);}}function togglePause(animation){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.togglePause(animation);}}function destroy(animation){var i;for(i=len-1;i>=0;i-=1){registeredAnimations[i].animation.destroy(animation);}}function searchAnimations(animationData,standalone,renderer){var animElements=[].concat([].slice.call(document.getElementsByClassName('lottie')),[].slice.call(document.getElementsByClassName('bodymovin')));var i;var lenAnims=animElements.length;for(i=0;i<lenAnims;i+=1){if(renderer){animElements[i].setAttribute('data-bm-type',renderer);}registerAnimation(animElements[i],animationData);}if(standalone&&lenAnims===0){if(!renderer){renderer='svg';}var body=document.getElementsByTagName('body')[0];body.innerText='';var div=createTag('div');div.style.width='100%';div.style.height='100%';div.setAttribute('data-bm-type',renderer);body.appendChild(div);registerAnimation(div,animationData);}}function resize(){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.resize();}}function activate(){if(!_isFrozen&&playingAnimationsNum){if(_stopped){window.requestAnimationFrame(first);_stopped=false;}}}function freeze(){_isFrozen=true;}function unfreeze(){_isFrozen=false;activate();}function setVolume(val,animation){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.setVolume(val,animation);}}function mute(animation){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.mute(animation);}}function unmute(animation){var i;for(i=0;i<len;i+=1){registeredAnimations[i].animation.unmute(animation);}}moduleOb.registerAnimation=registerAnimation;moduleOb.loadAnimation=loadAnimation;moduleOb.setSpeed=setSpeed;moduleOb.setDirection=setDirection;moduleOb.play=play;moduleOb.pause=pause;moduleOb.stop=stop;moduleOb.togglePause=togglePause;moduleOb.searchAnimations=searchAnimations;moduleOb.resize=resize;// moduleOb.start = start;
	moduleOb.goToAndStop=goToAndStop;moduleOb.destroy=destroy;moduleOb.freeze=freeze;moduleOb.unfreeze=unfreeze;moduleOb.setVolume=setVolume;moduleOb.mute=mute;moduleOb.unmute=unmute;moduleOb.getRegisteredAnimations=getRegisteredAnimations;return moduleOb;}();/* eslint-disable */var BezierFactory=function(){/**
	       * BezierEasing - use bezier curve for transition easing function
	       * by Gaëtan Renaudeau 2014 - 2015 – MIT License
	       *
	       * Credits: is based on Firefox's nsSMILKeySpline.cpp
	       * Usage:
	       * var spline = BezierEasing([ 0.25, 0.1, 0.25, 1.0 ])
	       * spline.get(x) => returns the easing value | x must be in [0, 1] range
	       *
	       */var ob={};ob.getBezierEasing=getBezierEasing;var beziers={};function getBezierEasing(a,b,c,d,nm){var str=nm||('bez_'+a+'_'+b+'_'+c+'_'+d).replace(/\./g,'p');if(beziers[str]){return beziers[str];}var bezEasing=new BezierEasing([a,b,c,d]);beziers[str]=bezEasing;return bezEasing;}// These values are established by empiricism with tests (tradeoff: performance VS precision)
	var NEWTON_ITERATIONS=4;var NEWTON_MIN_SLOPE=0.001;var SUBDIVISION_PRECISION=0.0000001;var SUBDIVISION_MAX_ITERATIONS=10;var kSplineTableSize=11;var kSampleStepSize=1.0/(kSplineTableSize-1.0);var float32ArraySupported=typeof Float32Array==='function';function A(aA1,aA2){return 1.0-3.0*aA2+3.0*aA1;}function B(aA1,aA2){return 3.0*aA2-6.0*aA1;}function C(aA1){return 3.0*aA1;}// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
	function calcBezier(aT,aA1,aA2){return ((A(aA1,aA2)*aT+B(aA1,aA2))*aT+C(aA1))*aT;}// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
	function getSlope(aT,aA1,aA2){return 3.0*A(aA1,aA2)*aT*aT+2.0*B(aA1,aA2)*aT+C(aA1);}function binarySubdivide(aX,aA,aB,mX1,mX2){var currentX,currentT,i=0;do{currentT=aA+(aB-aA)/2.0;currentX=calcBezier(currentT,mX1,mX2)-aX;if(currentX>0.0){aB=currentT;}else{aA=currentT;}}while(Math.abs(currentX)>SUBDIVISION_PRECISION&&++i<SUBDIVISION_MAX_ITERATIONS);return currentT;}function newtonRaphsonIterate(aX,aGuessT,mX1,mX2){for(var i=0;i<NEWTON_ITERATIONS;++i){var currentSlope=getSlope(aGuessT,mX1,mX2);if(currentSlope===0.0)return aGuessT;var currentX=calcBezier(aGuessT,mX1,mX2)-aX;aGuessT-=currentX/currentSlope;}return aGuessT;}/**
	       * points is an array of [ mX1, mY1, mX2, mY2 ]
	       */function BezierEasing(points){this._p=points;this._mSampleValues=float32ArraySupported?new Float32Array(kSplineTableSize):new Array(kSplineTableSize);this._precomputed=false;this.get=this.get.bind(this);}BezierEasing.prototype={get:function get(x){var mX1=this._p[0],mY1=this._p[1],mX2=this._p[2],mY2=this._p[3];if(!this._precomputed)this._precompute();if(mX1===mY1&&mX2===mY2)return x;// linear
	// Because JavaScript number are imprecise, we should guarantee the extremes are right.
	if(x===0)return 0;if(x===1)return 1;return calcBezier(this._getTForX(x),mY1,mY2);},// Private part
	_precompute:function _precompute(){var mX1=this._p[0],mY1=this._p[1],mX2=this._p[2],mY2=this._p[3];this._precomputed=true;if(mX1!==mY1||mX2!==mY2){this._calcSampleValues();}},_calcSampleValues:function _calcSampleValues(){var mX1=this._p[0],mX2=this._p[2];for(var i=0;i<kSplineTableSize;++i){this._mSampleValues[i]=calcBezier(i*kSampleStepSize,mX1,mX2);}},/**
	           * getTForX chose the fastest heuristic to determine the percentage value precisely from a given X projection.
	           */_getTForX:function _getTForX(aX){var mX1=this._p[0],mX2=this._p[2],mSampleValues=this._mSampleValues;var intervalStart=0.0;var currentSample=1;var lastSample=kSplineTableSize-1;for(;currentSample!==lastSample&&mSampleValues[currentSample]<=aX;++currentSample){intervalStart+=kSampleStepSize;}--currentSample;// Interpolate to provide an initial guess for t
	var dist=(aX-mSampleValues[currentSample])/(mSampleValues[currentSample+1]-mSampleValues[currentSample]);var guessForT=intervalStart+dist*kSampleStepSize;var initialSlope=getSlope(guessForT,mX1,mX2);if(initialSlope>=NEWTON_MIN_SLOPE){return newtonRaphsonIterate(aX,guessForT,mX1,mX2);}if(initialSlope===0.0){return guessForT;}return binarySubdivide(aX,intervalStart,intervalStart+kSampleStepSize,mX1,mX2);}};return ob;}();var pooling=function(){function _double(arr){return arr.concat(createSizedArray(arr.length));}return {"double":_double};}();var poolFactory=function(){return function(initialLength,_create,_release){var _length=0;var _maxLength=initialLength;var pool=createSizedArray(_maxLength);var ob={newElement:newElement,release:release};function newElement(){var element;if(_length){_length-=1;element=pool[_length];}else{element=_create();}return element;}function release(element){if(_length===_maxLength){pool=pooling["double"](pool);_maxLength*=2;}if(_release){_release(element);}pool[_length]=element;_length+=1;}return ob;};}();var bezierLengthPool=function(){function create(){return {addedLength:0,percents:createTypedArray('float32',getDefaultCurveSegments()),lengths:createTypedArray('float32',getDefaultCurveSegments())};}return poolFactory(8,create);}();var segmentsLengthPool=function(){function create(){return {lengths:[],totalLength:0};}function release(element){var i;var len=element.lengths.length;for(i=0;i<len;i+=1){bezierLengthPool.release(element.lengths[i]);}element.lengths.length=0;}return poolFactory(8,create,release);}();function bezFunction(){var math=Math;function pointOnLine2D(x1,y1,x2,y2,x3,y3){var det1=x1*y2+y1*x3+x2*y3-x3*y2-y3*x1-x2*y1;return det1>-0.001&&det1<0.001;}function pointOnLine3D(x1,y1,z1,x2,y2,z2,x3,y3,z3){if(z1===0&&z2===0&&z3===0){return pointOnLine2D(x1,y1,x2,y2,x3,y3);}var dist1=math.sqrt(math.pow(x2-x1,2)+math.pow(y2-y1,2)+math.pow(z2-z1,2));var dist2=math.sqrt(math.pow(x3-x1,2)+math.pow(y3-y1,2)+math.pow(z3-z1,2));var dist3=math.sqrt(math.pow(x3-x2,2)+math.pow(y3-y2,2)+math.pow(z3-z2,2));var diffDist;if(dist1>dist2){if(dist1>dist3){diffDist=dist1-dist2-dist3;}else{diffDist=dist3-dist2-dist1;}}else if(dist3>dist2){diffDist=dist3-dist2-dist1;}else{diffDist=dist2-dist1-dist3;}return diffDist>-0.0001&&diffDist<0.0001;}var getBezierLength=function(){return function(pt1,pt2,pt3,pt4){var curveSegments=getDefaultCurveSegments();var k;var i;var len;var ptCoord;var perc;var addedLength=0;var ptDistance;var point=[];var lastPoint=[];var lengthData=bezierLengthPool.newElement();len=pt3.length;for(k=0;k<curveSegments;k+=1){perc=k/(curveSegments-1);ptDistance=0;for(i=0;i<len;i+=1){ptCoord=bmPow(1-perc,3)*pt1[i]+3*bmPow(1-perc,2)*perc*pt3[i]+3*(1-perc)*bmPow(perc,2)*pt4[i]+bmPow(perc,3)*pt2[i];point[i]=ptCoord;if(lastPoint[i]!==null){ptDistance+=bmPow(point[i]-lastPoint[i],2);}lastPoint[i]=point[i];}if(ptDistance){ptDistance=bmSqrt(ptDistance);addedLength+=ptDistance;}lengthData.percents[k]=perc;lengthData.lengths[k]=addedLength;}lengthData.addedLength=addedLength;return lengthData;};}();function getSegmentsLength(shapeData){var segmentsLength=segmentsLengthPool.newElement();var closed=shapeData.c;var pathV=shapeData.v;var pathO=shapeData.o;var pathI=shapeData.i;var i;var len=shapeData._length;var lengths=segmentsLength.lengths;var totalLength=0;for(i=0;i<len-1;i+=1){lengths[i]=getBezierLength(pathV[i],pathV[i+1],pathO[i],pathI[i+1]);totalLength+=lengths[i].addedLength;}if(closed&&len){lengths[i]=getBezierLength(pathV[i],pathV[0],pathO[i],pathI[0]);totalLength+=lengths[i].addedLength;}segmentsLength.totalLength=totalLength;return segmentsLength;}function BezierData(length){this.segmentLength=0;this.points=new Array(length);}function PointData(partial,point){this.partialLength=partial;this.point=point;}var buildBezierData=function(){var storedData={};return function(pt1,pt2,pt3,pt4){var bezierName=(pt1[0]+'_'+pt1[1]+'_'+pt2[0]+'_'+pt2[1]+'_'+pt3[0]+'_'+pt3[1]+'_'+pt4[0]+'_'+pt4[1]).replace(/\./g,'p');if(!storedData[bezierName]){var curveSegments=getDefaultCurveSegments();var k;var i;var len;var ptCoord;var perc;var addedLength=0;var ptDistance;var point;var lastPoint=null;if(pt1.length===2&&(pt1[0]!==pt2[0]||pt1[1]!==pt2[1])&&pointOnLine2D(pt1[0],pt1[1],pt2[0],pt2[1],pt1[0]+pt3[0],pt1[1]+pt3[1])&&pointOnLine2D(pt1[0],pt1[1],pt2[0],pt2[1],pt2[0]+pt4[0],pt2[1]+pt4[1])){curveSegments=2;}var bezierData=new BezierData(curveSegments);len=pt3.length;for(k=0;k<curveSegments;k+=1){point=createSizedArray(len);perc=k/(curveSegments-1);ptDistance=0;for(i=0;i<len;i+=1){ptCoord=bmPow(1-perc,3)*pt1[i]+3*bmPow(1-perc,2)*perc*(pt1[i]+pt3[i])+3*(1-perc)*bmPow(perc,2)*(pt2[i]+pt4[i])+bmPow(perc,3)*pt2[i];point[i]=ptCoord;if(lastPoint!==null){ptDistance+=bmPow(point[i]-lastPoint[i],2);}}ptDistance=bmSqrt(ptDistance);addedLength+=ptDistance;bezierData.points[k]=new PointData(ptDistance,point);lastPoint=point;}bezierData.segmentLength=addedLength;storedData[bezierName]=bezierData;}return storedData[bezierName];};}();function getDistancePerc(perc,bezierData){var percents=bezierData.percents;var lengths=bezierData.lengths;var len=percents.length;var initPos=bmFloor((len-1)*perc);var lengthPos=perc*bezierData.addedLength;var lPerc=0;if(initPos===len-1||initPos===0||lengthPos===lengths[initPos]){return percents[initPos];}var dir=lengths[initPos]>lengthPos?-1:1;var flag=true;while(flag){if(lengths[initPos]<=lengthPos&&lengths[initPos+1]>lengthPos){lPerc=(lengthPos-lengths[initPos])/(lengths[initPos+1]-lengths[initPos]);flag=false;}else{initPos+=dir;}if(initPos<0||initPos>=len-1){// FIX for TypedArrays that don't store floating point values with enough accuracy
	if(initPos===len-1){return percents[initPos];}flag=false;}}return percents[initPos]+(percents[initPos+1]-percents[initPos])*lPerc;}function getPointInSegment(pt1,pt2,pt3,pt4,percent,bezierData){var t1=getDistancePerc(percent,bezierData);var u1=1-t1;var ptX=math.round((u1*u1*u1*pt1[0]+(t1*u1*u1+u1*t1*u1+u1*u1*t1)*pt3[0]+(t1*t1*u1+u1*t1*t1+t1*u1*t1)*pt4[0]+t1*t1*t1*pt2[0])*1000)/1000;var ptY=math.round((u1*u1*u1*pt1[1]+(t1*u1*u1+u1*t1*u1+u1*u1*t1)*pt3[1]+(t1*t1*u1+u1*t1*t1+t1*u1*t1)*pt4[1]+t1*t1*t1*pt2[1])*1000)/1000;return [ptX,ptY];}var bezierSegmentPoints=createTypedArray('float32',8);function getNewSegment(pt1,pt2,pt3,pt4,startPerc,endPerc,bezierData){if(startPerc<0){startPerc=0;}else if(startPerc>1){startPerc=1;}var t0=getDistancePerc(startPerc,bezierData);endPerc=endPerc>1?1:endPerc;var t1=getDistancePerc(endPerc,bezierData);var i;var len=pt1.length;var u0=1-t0;var u1=1-t1;var u0u0u0=u0*u0*u0;var t0u0u0_3=t0*u0*u0*3;// eslint-disable-line camelcase
	var t0t0u0_3=t0*t0*u0*3;// eslint-disable-line camelcase
	var t0t0t0=t0*t0*t0;//
	var u0u0u1=u0*u0*u1;var t0u0u1_3=t0*u0*u1+u0*t0*u1+u0*u0*t1;// eslint-disable-line camelcase
	var t0t0u1_3=t0*t0*u1+u0*t0*t1+t0*u0*t1;// eslint-disable-line camelcase
	var t0t0t1=t0*t0*t1;//
	var u0u1u1=u0*u1*u1;var t0u1u1_3=t0*u1*u1+u0*t1*u1+u0*u1*t1;// eslint-disable-line camelcase
	var t0t1u1_3=t0*t1*u1+u0*t1*t1+t0*u1*t1;// eslint-disable-line camelcase
	var t0t1t1=t0*t1*t1;//
	var u1u1u1=u1*u1*u1;var t1u1u1_3=t1*u1*u1+u1*t1*u1+u1*u1*t1;// eslint-disable-line camelcase
	var t1t1u1_3=t1*t1*u1+u1*t1*t1+t1*u1*t1;// eslint-disable-line camelcase
	var t1t1t1=t1*t1*t1;for(i=0;i<len;i+=1){bezierSegmentPoints[i*4]=math.round((u0u0u0*pt1[i]+t0u0u0_3*pt3[i]+t0t0u0_3*pt4[i]+t0t0t0*pt2[i])*1000)/1000;// eslint-disable-line camelcase
	bezierSegmentPoints[i*4+1]=math.round((u0u0u1*pt1[i]+t0u0u1_3*pt3[i]+t0t0u1_3*pt4[i]+t0t0t1*pt2[i])*1000)/1000;// eslint-disable-line camelcase
	bezierSegmentPoints[i*4+2]=math.round((u0u1u1*pt1[i]+t0u1u1_3*pt3[i]+t0t1u1_3*pt4[i]+t0t1t1*pt2[i])*1000)/1000;// eslint-disable-line camelcase
	bezierSegmentPoints[i*4+3]=math.round((u1u1u1*pt1[i]+t1u1u1_3*pt3[i]+t1t1u1_3*pt4[i]+t1t1t1*pt2[i])*1000)/1000;// eslint-disable-line camelcase
	}return bezierSegmentPoints;}return {getSegmentsLength:getSegmentsLength,getNewSegment:getNewSegment,getPointInSegment:getPointInSegment,buildBezierData:buildBezierData,pointOnLine2D:pointOnLine2D,pointOnLine3D:pointOnLine3D};}var bez=bezFunction();var PropertyFactory=function(){var initFrame=initialDefaultFrame;var mathAbs=Math.abs;function interpolateValue(frameNum,caching){var offsetTime=this.offsetTime;var newValue;if(this.propType==='multidimensional'){newValue=createTypedArray('float32',this.pv.length);}var iterationIndex=caching.lastIndex;var i=iterationIndex;var len=this.keyframes.length-1;var flag=true;var keyData;var nextKeyData;var keyframeMetadata;while(flag){keyData=this.keyframes[i];nextKeyData=this.keyframes[i+1];if(i===len-1&&frameNum>=nextKeyData.t-offsetTime){if(keyData.h){keyData=nextKeyData;}iterationIndex=0;break;}if(nextKeyData.t-offsetTime>frameNum){iterationIndex=i;break;}if(i<len-1){i+=1;}else{iterationIndex=0;flag=false;}}keyframeMetadata=this.keyframesMetadata[i]||{};var k;var kLen;var perc;var jLen;var j;var fnc;var nextKeyTime=nextKeyData.t-offsetTime;var keyTime=keyData.t-offsetTime;var endValue;if(keyData.to){if(!keyframeMetadata.bezierData){keyframeMetadata.bezierData=bez.buildBezierData(keyData.s,nextKeyData.s||keyData.e,keyData.to,keyData.ti);}var bezierData=keyframeMetadata.bezierData;if(frameNum>=nextKeyTime||frameNum<keyTime){var ind=frameNum>=nextKeyTime?bezierData.points.length-1:0;kLen=bezierData.points[ind].point.length;for(k=0;k<kLen;k+=1){newValue[k]=bezierData.points[ind].point[k];}// caching._lastKeyframeIndex = -1;
	}else{if(keyframeMetadata.__fnct){fnc=keyframeMetadata.__fnct;}else{fnc=BezierFactory.getBezierEasing(keyData.o.x,keyData.o.y,keyData.i.x,keyData.i.y,keyData.n).get;keyframeMetadata.__fnct=fnc;}perc=fnc((frameNum-keyTime)/(nextKeyTime-keyTime));var distanceInLine=bezierData.segmentLength*perc;var segmentPerc;var addedLength=caching.lastFrame<frameNum&&caching._lastKeyframeIndex===i?caching._lastAddedLength:0;j=caching.lastFrame<frameNum&&caching._lastKeyframeIndex===i?caching._lastPoint:0;flag=true;jLen=bezierData.points.length;while(flag){addedLength+=bezierData.points[j].partialLength;if(distanceInLine===0||perc===0||j===bezierData.points.length-1){kLen=bezierData.points[j].point.length;for(k=0;k<kLen;k+=1){newValue[k]=bezierData.points[j].point[k];}break;}else if(distanceInLine>=addedLength&&distanceInLine<addedLength+bezierData.points[j+1].partialLength){segmentPerc=(distanceInLine-addedLength)/bezierData.points[j+1].partialLength;kLen=bezierData.points[j].point.length;for(k=0;k<kLen;k+=1){newValue[k]=bezierData.points[j].point[k]+(bezierData.points[j+1].point[k]-bezierData.points[j].point[k])*segmentPerc;}break;}if(j<jLen-1){j+=1;}else{flag=false;}}caching._lastPoint=j;caching._lastAddedLength=addedLength-bezierData.points[j].partialLength;caching._lastKeyframeIndex=i;}}else{var outX;var outY;var inX;var inY;var keyValue;len=keyData.s.length;endValue=nextKeyData.s||keyData.e;if(this.sh&&keyData.h!==1){if(frameNum>=nextKeyTime){newValue[0]=endValue[0];newValue[1]=endValue[1];newValue[2]=endValue[2];}else if(frameNum<=keyTime){newValue[0]=keyData.s[0];newValue[1]=keyData.s[1];newValue[2]=keyData.s[2];}else{var quatStart=createQuaternion(keyData.s);var quatEnd=createQuaternion(endValue);var time=(frameNum-keyTime)/(nextKeyTime-keyTime);quaternionToEuler(newValue,slerp(quatStart,quatEnd,time));}}else{for(i=0;i<len;i+=1){if(keyData.h!==1){if(frameNum>=nextKeyTime){perc=1;}else if(frameNum<keyTime){perc=0;}else{if(keyData.o.x.constructor===Array){if(!keyframeMetadata.__fnct){keyframeMetadata.__fnct=[];}if(!keyframeMetadata.__fnct[i]){outX=keyData.o.x[i]===undefined?keyData.o.x[0]:keyData.o.x[i];outY=keyData.o.y[i]===undefined?keyData.o.y[0]:keyData.o.y[i];inX=keyData.i.x[i]===undefined?keyData.i.x[0]:keyData.i.x[i];inY=keyData.i.y[i]===undefined?keyData.i.y[0]:keyData.i.y[i];fnc=BezierFactory.getBezierEasing(outX,outY,inX,inY).get;keyframeMetadata.__fnct[i]=fnc;}else{fnc=keyframeMetadata.__fnct[i];}}else if(!keyframeMetadata.__fnct){outX=keyData.o.x;outY=keyData.o.y;inX=keyData.i.x;inY=keyData.i.y;fnc=BezierFactory.getBezierEasing(outX,outY,inX,inY).get;keyData.keyframeMetadata=fnc;}else{fnc=keyframeMetadata.__fnct;}perc=fnc((frameNum-keyTime)/(nextKeyTime-keyTime));}}endValue=nextKeyData.s||keyData.e;keyValue=keyData.h===1?keyData.s[i]:keyData.s[i]+(endValue[i]-keyData.s[i])*perc;if(this.propType==='multidimensional'){newValue[i]=keyValue;}else{newValue=keyValue;}}}}caching.lastIndex=iterationIndex;return newValue;}// based on @Toji's https://github.com/toji/gl-matrix/
	function slerp(a,b,t){var out=[];var ax=a[0];var ay=a[1];var az=a[2];var aw=a[3];var bx=b[0];var by=b[1];var bz=b[2];var bw=b[3];var omega;var cosom;var sinom;var scale0;var scale1;cosom=ax*bx+ay*by+az*bz+aw*bw;if(cosom<0.0){cosom=-cosom;bx=-bx;by=-by;bz=-bz;bw=-bw;}if(1.0-cosom>0.000001){omega=Math.acos(cosom);sinom=Math.sin(omega);scale0=Math.sin((1.0-t)*omega)/sinom;scale1=Math.sin(t*omega)/sinom;}else{scale0=1.0-t;scale1=t;}out[0]=scale0*ax+scale1*bx;out[1]=scale0*ay+scale1*by;out[2]=scale0*az+scale1*bz;out[3]=scale0*aw+scale1*bw;return out;}function quaternionToEuler(out,quat){var qx=quat[0];var qy=quat[1];var qz=quat[2];var qw=quat[3];var heading=Math.atan2(2*qy*qw-2*qx*qz,1-2*qy*qy-2*qz*qz);var attitude=Math.asin(2*qx*qy+2*qz*qw);var bank=Math.atan2(2*qx*qw-2*qy*qz,1-2*qx*qx-2*qz*qz);out[0]=heading/degToRads;out[1]=attitude/degToRads;out[2]=bank/degToRads;}function createQuaternion(values){var heading=values[0]*degToRads;var attitude=values[1]*degToRads;var bank=values[2]*degToRads;var c1=Math.cos(heading/2);var c2=Math.cos(attitude/2);var c3=Math.cos(bank/2);var s1=Math.sin(heading/2);var s2=Math.sin(attitude/2);var s3=Math.sin(bank/2);var w=c1*c2*c3-s1*s2*s3;var x=s1*s2*c3+c1*c2*s3;var y=s1*c2*c3+c1*s2*s3;var z=c1*s2*c3-s1*c2*s3;return [x,y,z,w];}function getValueAtCurrentTime(){var frameNum=this.comp.renderedFrame-this.offsetTime;var initTime=this.keyframes[0].t-this.offsetTime;var endTime=this.keyframes[this.keyframes.length-1].t-this.offsetTime;if(!(frameNum===this._caching.lastFrame||this._caching.lastFrame!==initFrame&&(this._caching.lastFrame>=endTime&&frameNum>=endTime||this._caching.lastFrame<initTime&&frameNum<initTime))){if(this._caching.lastFrame>=frameNum){this._caching._lastKeyframeIndex=-1;this._caching.lastIndex=0;}var renderResult=this.interpolateValue(frameNum,this._caching);this.pv=renderResult;}this._caching.lastFrame=frameNum;return this.pv;}function setVValue(val){var multipliedValue;if(this.propType==='unidimensional'){multipliedValue=val*this.mult;if(mathAbs(this.v-multipliedValue)>0.00001){this.v=multipliedValue;this._mdf=true;}}else{var i=0;var len=this.v.length;while(i<len){multipliedValue=val[i]*this.mult;if(mathAbs(this.v[i]-multipliedValue)>0.00001){this.v[i]=multipliedValue;this._mdf=true;}i+=1;}}}function processEffectsSequence(){if(this.elem.globalData.frameId===this.frameId||!this.effectsSequence.length){return;}if(this.lock){this.setVValue(this.pv);return;}this.lock=true;this._mdf=this._isFirstFrame;var i;var len=this.effectsSequence.length;var finalValue=this.kf?this.pv:this.data.k;for(i=0;i<len;i+=1){finalValue=this.effectsSequence[i](finalValue);}this.setVValue(finalValue);this._isFirstFrame=false;this.lock=false;this.frameId=this.elem.globalData.frameId;}function addEffect(effectFunction){this.effectsSequence.push(effectFunction);this.container.addDynamicProperty(this);}function ValueProperty(elem,data,mult,container){this.propType='unidimensional';this.mult=mult||1;this.data=data;this.v=mult?data.k*mult:data.k;this.pv=data.k;this._mdf=false;this.elem=elem;this.container=container;this.comp=elem.comp;this.k=false;this.kf=false;this.vel=0;this.effectsSequence=[];this._isFirstFrame=true;this.getValue=processEffectsSequence;this.setVValue=setVValue;this.addEffect=addEffect;}function MultiDimensionalProperty(elem,data,mult,container){this.propType='multidimensional';this.mult=mult||1;this.data=data;this._mdf=false;this.elem=elem;this.container=container;this.comp=elem.comp;this.k=false;this.kf=false;this.frameId=-1;var i;var len=data.k.length;this.v=createTypedArray('float32',len);this.pv=createTypedArray('float32',len);this.vel=createTypedArray('float32',len);for(i=0;i<len;i+=1){this.v[i]=data.k[i]*this.mult;this.pv[i]=data.k[i];}this._isFirstFrame=true;this.effectsSequence=[];this.getValue=processEffectsSequence;this.setVValue=setVValue;this.addEffect=addEffect;}function KeyframedValueProperty(elem,data,mult,container){this.propType='unidimensional';this.keyframes=data.k;this.keyframesMetadata=[];this.offsetTime=elem.data.st;this.frameId=-1;this._caching={lastFrame:initFrame,lastIndex:0,value:0,_lastKeyframeIndex:-1};this.k=true;this.kf=true;this.data=data;this.mult=mult||1;this.elem=elem;this.container=container;this.comp=elem.comp;this.v=initFrame;this.pv=initFrame;this._isFirstFrame=true;this.getValue=processEffectsSequence;this.setVValue=setVValue;this.interpolateValue=interpolateValue;this.effectsSequence=[getValueAtCurrentTime.bind(this)];this.addEffect=addEffect;}function KeyframedMultidimensionalProperty(elem,data,mult,container){this.propType='multidimensional';var i;var len=data.k.length;var s;var e;var to;var ti;for(i=0;i<len-1;i+=1){if(data.k[i].to&&data.k[i].s&&data.k[i+1]&&data.k[i+1].s){s=data.k[i].s;e=data.k[i+1].s;to=data.k[i].to;ti=data.k[i].ti;if(s.length===2&&!(s[0]===e[0]&&s[1]===e[1])&&bez.pointOnLine2D(s[0],s[1],e[0],e[1],s[0]+to[0],s[1]+to[1])&&bez.pointOnLine2D(s[0],s[1],e[0],e[1],e[0]+ti[0],e[1]+ti[1])||s.length===3&&!(s[0]===e[0]&&s[1]===e[1]&&s[2]===e[2])&&bez.pointOnLine3D(s[0],s[1],s[2],e[0],e[1],e[2],s[0]+to[0],s[1]+to[1],s[2]+to[2])&&bez.pointOnLine3D(s[0],s[1],s[2],e[0],e[1],e[2],e[0]+ti[0],e[1]+ti[1],e[2]+ti[2])){data.k[i].to=null;data.k[i].ti=null;}if(s[0]===e[0]&&s[1]===e[1]&&to[0]===0&&to[1]===0&&ti[0]===0&&ti[1]===0){if(s.length===2||s[2]===e[2]&&to[2]===0&&ti[2]===0){data.k[i].to=null;data.k[i].ti=null;}}}}this.effectsSequence=[getValueAtCurrentTime.bind(this)];this.data=data;this.keyframes=data.k;this.keyframesMetadata=[];this.offsetTime=elem.data.st;this.k=true;this.kf=true;this._isFirstFrame=true;this.mult=mult||1;this.elem=elem;this.container=container;this.comp=elem.comp;this.getValue=processEffectsSequence;this.setVValue=setVValue;this.interpolateValue=interpolateValue;this.frameId=-1;var arrLen=data.k[0].s.length;this.v=createTypedArray('float32',arrLen);this.pv=createTypedArray('float32',arrLen);for(i=0;i<arrLen;i+=1){this.v[i]=initFrame;this.pv[i]=initFrame;}this._caching={lastFrame:initFrame,lastIndex:0,value:createTypedArray('float32',arrLen)};this.addEffect=addEffect;}function getProp(elem,data,type,mult,container){var p;if(!data.k.length){p=new ValueProperty(elem,data,mult,container);}else if(typeof data.k[0]==='number'){p=new MultiDimensionalProperty(elem,data,mult,container);}else{switch(type){case 0:p=new KeyframedValueProperty(elem,data,mult,container);break;case 1:p=new KeyframedMultidimensionalProperty(elem,data,mult,container);break;default:break;}}if(p.effectsSequence.length){container.addDynamicProperty(p);}return p;}var ob={getProp:getProp};return ob;}();function DynamicPropertyContainer(){}DynamicPropertyContainer.prototype={addDynamicProperty:function addDynamicProperty(prop){if(this.dynamicProperties.indexOf(prop)===-1){this.dynamicProperties.push(prop);this.container.addDynamicProperty(this);this._isAnimated=true;}},iterateDynamicProperties:function iterateDynamicProperties(){this._mdf=false;var i;var len=this.dynamicProperties.length;for(i=0;i<len;i+=1){this.dynamicProperties[i].getValue();if(this.dynamicProperties[i]._mdf){this._mdf=true;}}},initDynamicPropertyContainer:function initDynamicPropertyContainer(container){this.container=container;this.dynamicProperties=[];this._mdf=false;this._isAnimated=false;}};var pointPool=function(){function create(){return createTypedArray('float32',2);}return poolFactory(8,create);}();function ShapePath(){this.c=false;this._length=0;this._maxLength=8;this.v=createSizedArray(this._maxLength);this.o=createSizedArray(this._maxLength);this.i=createSizedArray(this._maxLength);}ShapePath.prototype.setPathData=function(closed,len){this.c=closed;this.setLength(len);var i=0;while(i<len){this.v[i]=pointPool.newElement();this.o[i]=pointPool.newElement();this.i[i]=pointPool.newElement();i+=1;}};ShapePath.prototype.setLength=function(len){while(this._maxLength<len){this.doubleArrayLength();}this._length=len;};ShapePath.prototype.doubleArrayLength=function(){this.v=this.v.concat(createSizedArray(this._maxLength));this.i=this.i.concat(createSizedArray(this._maxLength));this.o=this.o.concat(createSizedArray(this._maxLength));this._maxLength*=2;};ShapePath.prototype.setXYAt=function(x,y,type,pos,replace){var arr;this._length=Math.max(this._length,pos+1);if(this._length>=this._maxLength){this.doubleArrayLength();}switch(type){case'v':arr=this.v;break;case'i':arr=this.i;break;case'o':arr=this.o;break;default:arr=[];break;}if(!arr[pos]||arr[pos]&&!replace){arr[pos]=pointPool.newElement();}arr[pos][0]=x;arr[pos][1]=y;};ShapePath.prototype.setTripleAt=function(vX,vY,oX,oY,iX,iY,pos,replace){this.setXYAt(vX,vY,'v',pos,replace);this.setXYAt(oX,oY,'o',pos,replace);this.setXYAt(iX,iY,'i',pos,replace);};ShapePath.prototype.reverse=function(){var newPath=new ShapePath();newPath.setPathData(this.c,this._length);var vertices=this.v;var outPoints=this.o;var inPoints=this.i;var init=0;if(this.c){newPath.setTripleAt(vertices[0][0],vertices[0][1],inPoints[0][0],inPoints[0][1],outPoints[0][0],outPoints[0][1],0,false);init=1;}var cnt=this._length-1;var len=this._length;var i;for(i=init;i<len;i+=1){newPath.setTripleAt(vertices[cnt][0],vertices[cnt][1],inPoints[cnt][0],inPoints[cnt][1],outPoints[cnt][0],outPoints[cnt][1],i,false);cnt-=1;}return newPath;};var shapePool=function(){function create(){return new ShapePath();}function release(shapePath){var len=shapePath._length;var i;for(i=0;i<len;i+=1){pointPool.release(shapePath.v[i]);pointPool.release(shapePath.i[i]);pointPool.release(shapePath.o[i]);shapePath.v[i]=null;shapePath.i[i]=null;shapePath.o[i]=null;}shapePath._length=0;shapePath.c=false;}function clone(shape){var cloned=factory.newElement();var i;var len=shape._length===undefined?shape.v.length:shape._length;cloned.setLength(len);cloned.c=shape.c;for(i=0;i<len;i+=1){cloned.setTripleAt(shape.v[i][0],shape.v[i][1],shape.o[i][0],shape.o[i][1],shape.i[i][0],shape.i[i][1],i);}return cloned;}var factory=poolFactory(4,create,release);factory.clone=clone;return factory;}();function ShapeCollection(){this._length=0;this._maxLength=4;this.shapes=createSizedArray(this._maxLength);}ShapeCollection.prototype.addShape=function(shapeData){if(this._length===this._maxLength){this.shapes=this.shapes.concat(createSizedArray(this._maxLength));this._maxLength*=2;}this.shapes[this._length]=shapeData;this._length+=1;};ShapeCollection.prototype.releaseShapes=function(){var i;for(i=0;i<this._length;i+=1){shapePool.release(this.shapes[i]);}this._length=0;};var shapeCollectionPool=function(){var ob={newShapeCollection:newShapeCollection,release:release};var _length=0;var _maxLength=4;var pool=createSizedArray(_maxLength);function newShapeCollection(){var shapeCollection;if(_length){_length-=1;shapeCollection=pool[_length];}else{shapeCollection=new ShapeCollection();}return shapeCollection;}function release(shapeCollection){var i;var len=shapeCollection._length;for(i=0;i<len;i+=1){shapePool.release(shapeCollection.shapes[i]);}shapeCollection._length=0;if(_length===_maxLength){pool=pooling["double"](pool);_maxLength*=2;}pool[_length]=shapeCollection;_length+=1;}return ob;}();var ShapePropertyFactory=function(){var initFrame=-999999;function interpolateShape(frameNum,previousValue,caching){var iterationIndex=caching.lastIndex;var keyPropS;var keyPropE;var isHold;var j;var k;var jLen;var kLen;var perc;var vertexValue;var kf=this.keyframes;if(frameNum<kf[0].t-this.offsetTime){keyPropS=kf[0].s[0];isHold=true;iterationIndex=0;}else if(frameNum>=kf[kf.length-1].t-this.offsetTime){keyPropS=kf[kf.length-1].s?kf[kf.length-1].s[0]:kf[kf.length-2].e[0];/* if(kf[kf.length - 1].s){
	                  keyPropS = kf[kf.length - 1].s[0];
	              }else{
	                  keyPropS = kf[kf.length - 2].e[0];
	              } */isHold=true;}else{var i=iterationIndex;var len=kf.length-1;var flag=true;var keyData;var nextKeyData;var keyframeMetadata;while(flag){keyData=kf[i];nextKeyData=kf[i+1];if(nextKeyData.t-this.offsetTime>frameNum){break;}if(i<len-1){i+=1;}else{flag=false;}}keyframeMetadata=this.keyframesMetadata[i]||{};isHold=keyData.h===1;iterationIndex=i;if(!isHold){if(frameNum>=nextKeyData.t-this.offsetTime){perc=1;}else if(frameNum<keyData.t-this.offsetTime){perc=0;}else{var fnc;if(keyframeMetadata.__fnct){fnc=keyframeMetadata.__fnct;}else{fnc=BezierFactory.getBezierEasing(keyData.o.x,keyData.o.y,keyData.i.x,keyData.i.y).get;keyframeMetadata.__fnct=fnc;}perc=fnc((frameNum-(keyData.t-this.offsetTime))/(nextKeyData.t-this.offsetTime-(keyData.t-this.offsetTime)));}keyPropE=nextKeyData.s?nextKeyData.s[0]:keyData.e[0];}keyPropS=keyData.s[0];}jLen=previousValue._length;kLen=keyPropS.i[0].length;caching.lastIndex=iterationIndex;for(j=0;j<jLen;j+=1){for(k=0;k<kLen;k+=1){vertexValue=isHold?keyPropS.i[j][k]:keyPropS.i[j][k]+(keyPropE.i[j][k]-keyPropS.i[j][k])*perc;previousValue.i[j][k]=vertexValue;vertexValue=isHold?keyPropS.o[j][k]:keyPropS.o[j][k]+(keyPropE.o[j][k]-keyPropS.o[j][k])*perc;previousValue.o[j][k]=vertexValue;vertexValue=isHold?keyPropS.v[j][k]:keyPropS.v[j][k]+(keyPropE.v[j][k]-keyPropS.v[j][k])*perc;previousValue.v[j][k]=vertexValue;}}}function interpolateShapeCurrentTime(){var frameNum=this.comp.renderedFrame-this.offsetTime;var initTime=this.keyframes[0].t-this.offsetTime;var endTime=this.keyframes[this.keyframes.length-1].t-this.offsetTime;var lastFrame=this._caching.lastFrame;if(!(lastFrame!==initFrame&&(lastFrame<initTime&&frameNum<initTime||lastFrame>endTime&&frameNum>endTime))){/// /
	this._caching.lastIndex=lastFrame<frameNum?this._caching.lastIndex:0;this.interpolateShape(frameNum,this.pv,this._caching);/// /
	}this._caching.lastFrame=frameNum;return this.pv;}function resetShape(){this.paths=this.localShapeCollection;}function shapesEqual(shape1,shape2){if(shape1._length!==shape2._length||shape1.c!==shape2.c){return false;}var i;var len=shape1._length;for(i=0;i<len;i+=1){if(shape1.v[i][0]!==shape2.v[i][0]||shape1.v[i][1]!==shape2.v[i][1]||shape1.o[i][0]!==shape2.o[i][0]||shape1.o[i][1]!==shape2.o[i][1]||shape1.i[i][0]!==shape2.i[i][0]||shape1.i[i][1]!==shape2.i[i][1]){return false;}}return true;}function setVValue(newPath){if(!shapesEqual(this.v,newPath)){this.v=shapePool.clone(newPath);this.localShapeCollection.releaseShapes();this.localShapeCollection.addShape(this.v);this._mdf=true;this.paths=this.localShapeCollection;}}function processEffectsSequence(){if(this.elem.globalData.frameId===this.frameId){return;}if(!this.effectsSequence.length){this._mdf=false;return;}if(this.lock){this.setVValue(this.pv);return;}this.lock=true;this._mdf=false;var finalValue;if(this.kf){finalValue=this.pv;}else if(this.data.ks){finalValue=this.data.ks.k;}else{finalValue=this.data.pt.k;}var i;var len=this.effectsSequence.length;for(i=0;i<len;i+=1){finalValue=this.effectsSequence[i](finalValue);}this.setVValue(finalValue);this.lock=false;this.frameId=this.elem.globalData.frameId;}function ShapeProperty(elem,data,type){this.propType='shape';this.comp=elem.comp;this.container=elem;this.elem=elem;this.data=data;this.k=false;this.kf=false;this._mdf=false;var pathData=type===3?data.pt.k:data.ks.k;this.v=shapePool.clone(pathData);this.pv=shapePool.clone(this.v);this.localShapeCollection=shapeCollectionPool.newShapeCollection();this.paths=this.localShapeCollection;this.paths.addShape(this.v);this.reset=resetShape;this.effectsSequence=[];}function addEffect(effectFunction){this.effectsSequence.push(effectFunction);this.container.addDynamicProperty(this);}ShapeProperty.prototype.interpolateShape=interpolateShape;ShapeProperty.prototype.getValue=processEffectsSequence;ShapeProperty.prototype.setVValue=setVValue;ShapeProperty.prototype.addEffect=addEffect;function KeyframedShapeProperty(elem,data,type){this.propType='shape';this.comp=elem.comp;this.elem=elem;this.container=elem;this.offsetTime=elem.data.st;this.keyframes=type===3?data.pt.k:data.ks.k;this.keyframesMetadata=[];this.k=true;this.kf=true;var len=this.keyframes[0].s[0].i.length;this.v=shapePool.newElement();this.v.setPathData(this.keyframes[0].s[0].c,len);this.pv=shapePool.clone(this.v);this.localShapeCollection=shapeCollectionPool.newShapeCollection();this.paths=this.localShapeCollection;this.paths.addShape(this.v);this.lastFrame=initFrame;this.reset=resetShape;this._caching={lastFrame:initFrame,lastIndex:0};this.effectsSequence=[interpolateShapeCurrentTime.bind(this)];}KeyframedShapeProperty.prototype.getValue=processEffectsSequence;KeyframedShapeProperty.prototype.interpolateShape=interpolateShape;KeyframedShapeProperty.prototype.setVValue=setVValue;KeyframedShapeProperty.prototype.addEffect=addEffect;var EllShapeProperty=function(){var cPoint=roundCorner;function EllShapePropertyFactory(elem,data){this.v=shapePool.newElement();this.v.setPathData(true,4);this.localShapeCollection=shapeCollectionPool.newShapeCollection();this.paths=this.localShapeCollection;this.localShapeCollection.addShape(this.v);this.d=data.d;this.elem=elem;this.comp=elem.comp;this.frameId=-1;this.initDynamicPropertyContainer(elem);this.p=PropertyFactory.getProp(elem,data.p,1,0,this);this.s=PropertyFactory.getProp(elem,data.s,1,0,this);if(this.dynamicProperties.length){this.k=true;}else{this.k=false;this.convertEllToPath();}}EllShapePropertyFactory.prototype={reset:resetShape,getValue:function getValue(){if(this.elem.globalData.frameId===this.frameId){return;}this.frameId=this.elem.globalData.frameId;this.iterateDynamicProperties();if(this._mdf){this.convertEllToPath();}},convertEllToPath:function convertEllToPath(){var p0=this.p.v[0];var p1=this.p.v[1];var s0=this.s.v[0]/2;var s1=this.s.v[1]/2;var _cw=this.d!==3;var _v=this.v;_v.v[0][0]=p0;_v.v[0][1]=p1-s1;_v.v[1][0]=_cw?p0+s0:p0-s0;_v.v[1][1]=p1;_v.v[2][0]=p0;_v.v[2][1]=p1+s1;_v.v[3][0]=_cw?p0-s0:p0+s0;_v.v[3][1]=p1;_v.i[0][0]=_cw?p0-s0*cPoint:p0+s0*cPoint;_v.i[0][1]=p1-s1;_v.i[1][0]=_cw?p0+s0:p0-s0;_v.i[1][1]=p1-s1*cPoint;_v.i[2][0]=_cw?p0+s0*cPoint:p0-s0*cPoint;_v.i[2][1]=p1+s1;_v.i[3][0]=_cw?p0-s0:p0+s0;_v.i[3][1]=p1+s1*cPoint;_v.o[0][0]=_cw?p0+s0*cPoint:p0-s0*cPoint;_v.o[0][1]=p1-s1;_v.o[1][0]=_cw?p0+s0:p0-s0;_v.o[1][1]=p1+s1*cPoint;_v.o[2][0]=_cw?p0-s0*cPoint:p0+s0*cPoint;_v.o[2][1]=p1+s1;_v.o[3][0]=_cw?p0-s0:p0+s0;_v.o[3][1]=p1-s1*cPoint;}};extendPrototype([DynamicPropertyContainer],EllShapePropertyFactory);return EllShapePropertyFactory;}();var StarShapeProperty=function(){function StarShapePropertyFactory(elem,data){this.v=shapePool.newElement();this.v.setPathData(true,0);this.elem=elem;this.comp=elem.comp;this.data=data;this.frameId=-1;this.d=data.d;this.initDynamicPropertyContainer(elem);if(data.sy===1){this.ir=PropertyFactory.getProp(elem,data.ir,0,0,this);this.is=PropertyFactory.getProp(elem,data.is,0,0.01,this);this.convertToPath=this.convertStarToPath;}else{this.convertToPath=this.convertPolygonToPath;}this.pt=PropertyFactory.getProp(elem,data.pt,0,0,this);this.p=PropertyFactory.getProp(elem,data.p,1,0,this);this.r=PropertyFactory.getProp(elem,data.r,0,degToRads,this);this.or=PropertyFactory.getProp(elem,data.or,0,0,this);this.os=PropertyFactory.getProp(elem,data.os,0,0.01,this);this.localShapeCollection=shapeCollectionPool.newShapeCollection();this.localShapeCollection.addShape(this.v);this.paths=this.localShapeCollection;if(this.dynamicProperties.length){this.k=true;}else{this.k=false;this.convertToPath();}}StarShapePropertyFactory.prototype={reset:resetShape,getValue:function getValue(){if(this.elem.globalData.frameId===this.frameId){return;}this.frameId=this.elem.globalData.frameId;this.iterateDynamicProperties();if(this._mdf){this.convertToPath();}},convertStarToPath:function convertStarToPath(){var numPts=Math.floor(this.pt.v)*2;var angle=Math.PI*2/numPts;/* this.v.v.length = numPts;
	                  this.v.i.length = numPts;
	                  this.v.o.length = numPts; */var longFlag=true;var longRad=this.or.v;var shortRad=this.ir.v;var longRound=this.os.v;var shortRound=this.is.v;var longPerimSegment=2*Math.PI*longRad/(numPts*2);var shortPerimSegment=2*Math.PI*shortRad/(numPts*2);var i;var rad;var roundness;var perimSegment;var currentAng=-Math.PI/2;currentAng+=this.r.v;var dir=this.data.d===3?-1:1;this.v._length=0;for(i=0;i<numPts;i+=1){rad=longFlag?longRad:shortRad;roundness=longFlag?longRound:shortRound;perimSegment=longFlag?longPerimSegment:shortPerimSegment;var x=rad*Math.cos(currentAng);var y=rad*Math.sin(currentAng);var ox=x===0&&y===0?0:y/Math.sqrt(x*x+y*y);var oy=x===0&&y===0?0:-x/Math.sqrt(x*x+y*y);x+=+this.p.v[0];y+=+this.p.v[1];this.v.setTripleAt(x,y,x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir,x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir,i,true);/* this.v.v[i] = [x,y];
	                      this.v.i[i] = [x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir];
	                      this.v.o[i] = [x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir];
	                      this.v._length = numPts; */longFlag=!longFlag;currentAng+=angle*dir;}},convertPolygonToPath:function convertPolygonToPath(){var numPts=Math.floor(this.pt.v);var angle=Math.PI*2/numPts;var rad=this.or.v;var roundness=this.os.v;var perimSegment=2*Math.PI*rad/(numPts*4);var i;var currentAng=-Math.PI*0.5;var dir=this.data.d===3?-1:1;currentAng+=this.r.v;this.v._length=0;for(i=0;i<numPts;i+=1){var x=rad*Math.cos(currentAng);var y=rad*Math.sin(currentAng);var ox=x===0&&y===0?0:y/Math.sqrt(x*x+y*y);var oy=x===0&&y===0?0:-x/Math.sqrt(x*x+y*y);x+=+this.p.v[0];y+=+this.p.v[1];this.v.setTripleAt(x,y,x-ox*perimSegment*roundness*dir,y-oy*perimSegment*roundness*dir,x+ox*perimSegment*roundness*dir,y+oy*perimSegment*roundness*dir,i,true);currentAng+=angle*dir;}this.paths.length=0;this.paths[0]=this.v;}};extendPrototype([DynamicPropertyContainer],StarShapePropertyFactory);return StarShapePropertyFactory;}();var RectShapeProperty=function(){function RectShapePropertyFactory(elem,data){this.v=shapePool.newElement();this.v.c=true;this.localShapeCollection=shapeCollectionPool.newShapeCollection();this.localShapeCollection.addShape(this.v);this.paths=this.localShapeCollection;this.elem=elem;this.comp=elem.comp;this.frameId=-1;this.d=data.d;this.initDynamicPropertyContainer(elem);this.p=PropertyFactory.getProp(elem,data.p,1,0,this);this.s=PropertyFactory.getProp(elem,data.s,1,0,this);this.r=PropertyFactory.getProp(elem,data.r,0,0,this);if(this.dynamicProperties.length){this.k=true;}else{this.k=false;this.convertRectToPath();}}RectShapePropertyFactory.prototype={convertRectToPath:function convertRectToPath(){var p0=this.p.v[0];var p1=this.p.v[1];var v0=this.s.v[0]/2;var v1=this.s.v[1]/2;var round=bmMin(v0,v1,this.r.v);var cPoint=round*(1-roundCorner);this.v._length=0;if(this.d===2||this.d===1){this.v.setTripleAt(p0+v0,p1-v1+round,p0+v0,p1-v1+round,p0+v0,p1-v1+cPoint,0,true);this.v.setTripleAt(p0+v0,p1+v1-round,p0+v0,p1+v1-cPoint,p0+v0,p1+v1-round,1,true);if(round!==0){this.v.setTripleAt(p0+v0-round,p1+v1,p0+v0-round,p1+v1,p0+v0-cPoint,p1+v1,2,true);this.v.setTripleAt(p0-v0+round,p1+v1,p0-v0+cPoint,p1+v1,p0-v0+round,p1+v1,3,true);this.v.setTripleAt(p0-v0,p1+v1-round,p0-v0,p1+v1-round,p0-v0,p1+v1-cPoint,4,true);this.v.setTripleAt(p0-v0,p1-v1+round,p0-v0,p1-v1+cPoint,p0-v0,p1-v1+round,5,true);this.v.setTripleAt(p0-v0+round,p1-v1,p0-v0+round,p1-v1,p0-v0+cPoint,p1-v1,6,true);this.v.setTripleAt(p0+v0-round,p1-v1,p0+v0-cPoint,p1-v1,p0+v0-round,p1-v1,7,true);}else{this.v.setTripleAt(p0-v0,p1+v1,p0-v0+cPoint,p1+v1,p0-v0,p1+v1,2);this.v.setTripleAt(p0-v0,p1-v1,p0-v0,p1-v1+cPoint,p0-v0,p1-v1,3);}}else{this.v.setTripleAt(p0+v0,p1-v1+round,p0+v0,p1-v1+cPoint,p0+v0,p1-v1+round,0,true);if(round!==0){this.v.setTripleAt(p0+v0-round,p1-v1,p0+v0-round,p1-v1,p0+v0-cPoint,p1-v1,1,true);this.v.setTripleAt(p0-v0+round,p1-v1,p0-v0+cPoint,p1-v1,p0-v0+round,p1-v1,2,true);this.v.setTripleAt(p0-v0,p1-v1+round,p0-v0,p1-v1+round,p0-v0,p1-v1+cPoint,3,true);this.v.setTripleAt(p0-v0,p1+v1-round,p0-v0,p1+v1-cPoint,p0-v0,p1+v1-round,4,true);this.v.setTripleAt(p0-v0+round,p1+v1,p0-v0+round,p1+v1,p0-v0+cPoint,p1+v1,5,true);this.v.setTripleAt(p0+v0-round,p1+v1,p0+v0-cPoint,p1+v1,p0+v0-round,p1+v1,6,true);this.v.setTripleAt(p0+v0,p1+v1-round,p0+v0,p1+v1-round,p0+v0,p1+v1-cPoint,7,true);}else{this.v.setTripleAt(p0-v0,p1-v1,p0-v0+cPoint,p1-v1,p0-v0,p1-v1,1,true);this.v.setTripleAt(p0-v0,p1+v1,p0-v0,p1+v1-cPoint,p0-v0,p1+v1,2,true);this.v.setTripleAt(p0+v0,p1+v1,p0+v0-cPoint,p1+v1,p0+v0,p1+v1,3,true);}}},getValue:function getValue(){if(this.elem.globalData.frameId===this.frameId){return;}this.frameId=this.elem.globalData.frameId;this.iterateDynamicProperties();if(this._mdf){this.convertRectToPath();}},reset:resetShape};extendPrototype([DynamicPropertyContainer],RectShapePropertyFactory);return RectShapePropertyFactory;}();function getShapeProp(elem,data,type){var prop;if(type===3||type===4){var dataProp=type===3?data.pt:data.ks;var keys=dataProp.k;if(keys.length){prop=new KeyframedShapeProperty(elem,data,type);}else{prop=new ShapeProperty(elem,data,type);}}else if(type===5){prop=new RectShapeProperty(elem,data);}else if(type===6){prop=new EllShapeProperty(elem,data);}else if(type===7){prop=new StarShapeProperty(elem,data);}if(prop.k){elem.addDynamicProperty(prop);}return prop;}function getConstructorFunction(){return ShapeProperty;}function getKeyframedConstructorFunction(){return KeyframedShapeProperty;}var ob={};ob.getShapeProp=getShapeProp;ob.getConstructorFunction=getConstructorFunction;ob.getKeyframedConstructorFunction=getKeyframedConstructorFunction;return ob;}();/*!
	   Transformation Matrix v2.0
	   (c) Epistemex 2014-2015
	   www.epistemex.com
	   By Ken Fyrstenberg
	   Contributions by leeoniya.
	   License: MIT, header required.
	   */ /**
	   * 2D transformation matrix object initialized with identity matrix.
	   *
	   * The matrix can synchronize a canvas context by supplying the context
	   * as an argument, or later apply current absolute transform to an
	   * existing context.
	   *
	   * All values are handled as floating point values.
	   *
	   * @param {CanvasRenderingContext2D} [context] - Optional context to sync with Matrix
	   * @prop {number} a - scale x
	   * @prop {number} b - shear y
	   * @prop {number} c - shear x
	   * @prop {number} d - scale y
	   * @prop {number} e - translate x
	   * @prop {number} f - translate y
	   * @prop {CanvasRenderingContext2D|null} [context=null] - set or get current canvas context
	   * @constructor
	   */var Matrix=function(){var _cos=Math.cos;var _sin=Math.sin;var _tan=Math.tan;var _rnd=Math.round;function reset(){this.props[0]=1;this.props[1]=0;this.props[2]=0;this.props[3]=0;this.props[4]=0;this.props[5]=1;this.props[6]=0;this.props[7]=0;this.props[8]=0;this.props[9]=0;this.props[10]=1;this.props[11]=0;this.props[12]=0;this.props[13]=0;this.props[14]=0;this.props[15]=1;return this;}function rotate(angle){if(angle===0){return this;}var mCos=_cos(angle);var mSin=_sin(angle);return this._t(mCos,-mSin,0,0,mSin,mCos,0,0,0,0,1,0,0,0,0,1);}function rotateX(angle){if(angle===0){return this;}var mCos=_cos(angle);var mSin=_sin(angle);return this._t(1,0,0,0,0,mCos,-mSin,0,0,mSin,mCos,0,0,0,0,1);}function rotateY(angle){if(angle===0){return this;}var mCos=_cos(angle);var mSin=_sin(angle);return this._t(mCos,0,mSin,0,0,1,0,0,-mSin,0,mCos,0,0,0,0,1);}function rotateZ(angle){if(angle===0){return this;}var mCos=_cos(angle);var mSin=_sin(angle);return this._t(mCos,-mSin,0,0,mSin,mCos,0,0,0,0,1,0,0,0,0,1);}function shear(sx,sy){return this._t(1,sy,sx,1,0,0);}function skew(ax,ay){return this.shear(_tan(ax),_tan(ay));}function skewFromAxis(ax,angle){var mCos=_cos(angle);var mSin=_sin(angle);return this._t(mCos,mSin,0,0,-mSin,mCos,0,0,0,0,1,0,0,0,0,1)._t(1,0,0,0,_tan(ax),1,0,0,0,0,1,0,0,0,0,1)._t(mCos,-mSin,0,0,mSin,mCos,0,0,0,0,1,0,0,0,0,1);// return this._t(mCos, mSin, -mSin, mCos, 0, 0)._t(1, 0, _tan(ax), 1, 0, 0)._t(mCos, -mSin, mSin, mCos, 0, 0);
	}function scale(sx,sy,sz){if(!sz&&sz!==0){sz=1;}if(sx===1&&sy===1&&sz===1){return this;}return this._t(sx,0,0,0,0,sy,0,0,0,0,sz,0,0,0,0,1);}function setTransform(a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p){this.props[0]=a;this.props[1]=b;this.props[2]=c;this.props[3]=d;this.props[4]=e;this.props[5]=f;this.props[6]=g;this.props[7]=h;this.props[8]=i;this.props[9]=j;this.props[10]=k;this.props[11]=l;this.props[12]=m;this.props[13]=n;this.props[14]=o;this.props[15]=p;return this;}function translate(tx,ty,tz){tz=tz||0;if(tx!==0||ty!==0||tz!==0){return this._t(1,0,0,0,0,1,0,0,0,0,1,0,tx,ty,tz,1);}return this;}function transform(a2,b2,c2,d2,e2,f2,g2,h2,i2,j2,k2,l2,m2,n2,o2,p2){var _p=this.props;if(a2===1&&b2===0&&c2===0&&d2===0&&e2===0&&f2===1&&g2===0&&h2===0&&i2===0&&j2===0&&k2===1&&l2===0){// NOTE: commenting this condition because TurboFan deoptimizes code when present
	// if(m2 !== 0 || n2 !== 0 || o2 !== 0){
	_p[12]=_p[12]*a2+_p[15]*m2;_p[13]=_p[13]*f2+_p[15]*n2;_p[14]=_p[14]*k2+_p[15]*o2;_p[15]*=p2;// }
	this._identityCalculated=false;return this;}var a1=_p[0];var b1=_p[1];var c1=_p[2];var d1=_p[3];var e1=_p[4];var f1=_p[5];var g1=_p[6];var h1=_p[7];var i1=_p[8];var j1=_p[9];var k1=_p[10];var l1=_p[11];var m1=_p[12];var n1=_p[13];var o1=_p[14];var p1=_p[15];/* matrix order (canvas compatible):
	           * ace
	           * bdf
	           * 001
	           */_p[0]=a1*a2+b1*e2+c1*i2+d1*m2;_p[1]=a1*b2+b1*f2+c1*j2+d1*n2;_p[2]=a1*c2+b1*g2+c1*k2+d1*o2;_p[3]=a1*d2+b1*h2+c1*l2+d1*p2;_p[4]=e1*a2+f1*e2+g1*i2+h1*m2;_p[5]=e1*b2+f1*f2+g1*j2+h1*n2;_p[6]=e1*c2+f1*g2+g1*k2+h1*o2;_p[7]=e1*d2+f1*h2+g1*l2+h1*p2;_p[8]=i1*a2+j1*e2+k1*i2+l1*m2;_p[9]=i1*b2+j1*f2+k1*j2+l1*n2;_p[10]=i1*c2+j1*g2+k1*k2+l1*o2;_p[11]=i1*d2+j1*h2+k1*l2+l1*p2;_p[12]=m1*a2+n1*e2+o1*i2+p1*m2;_p[13]=m1*b2+n1*f2+o1*j2+p1*n2;_p[14]=m1*c2+n1*g2+o1*k2+p1*o2;_p[15]=m1*d2+n1*h2+o1*l2+p1*p2;this._identityCalculated=false;return this;}function isIdentity(){if(!this._identityCalculated){this._identity=!(this.props[0]!==1||this.props[1]!==0||this.props[2]!==0||this.props[3]!==0||this.props[4]!==0||this.props[5]!==1||this.props[6]!==0||this.props[7]!==0||this.props[8]!==0||this.props[9]!==0||this.props[10]!==1||this.props[11]!==0||this.props[12]!==0||this.props[13]!==0||this.props[14]!==0||this.props[15]!==1);this._identityCalculated=true;}return this._identity;}function equals(matr){var i=0;while(i<16){if(matr.props[i]!==this.props[i]){return false;}i+=1;}return true;}function clone(matr){var i;for(i=0;i<16;i+=1){matr.props[i]=this.props[i];}return matr;}function cloneFromProps(props){var i;for(i=0;i<16;i+=1){this.props[i]=props[i];}}function applyToPoint(x,y,z){return {x:x*this.props[0]+y*this.props[4]+z*this.props[8]+this.props[12],y:x*this.props[1]+y*this.props[5]+z*this.props[9]+this.props[13],z:x*this.props[2]+y*this.props[6]+z*this.props[10]+this.props[14]};/* return {
	           x: x * me.a + y * me.c + me.e,
	           y: x * me.b + y * me.d + me.f
	           }; */}function applyToX(x,y,z){return x*this.props[0]+y*this.props[4]+z*this.props[8]+this.props[12];}function applyToY(x,y,z){return x*this.props[1]+y*this.props[5]+z*this.props[9]+this.props[13];}function applyToZ(x,y,z){return x*this.props[2]+y*this.props[6]+z*this.props[10]+this.props[14];}function getInverseMatrix(){var determinant=this.props[0]*this.props[5]-this.props[1]*this.props[4];var a=this.props[5]/determinant;var b=-this.props[1]/determinant;var c=-this.props[4]/determinant;var d=this.props[0]/determinant;var e=(this.props[4]*this.props[13]-this.props[5]*this.props[12])/determinant;var f=-(this.props[0]*this.props[13]-this.props[1]*this.props[12])/determinant;var inverseMatrix=new Matrix();inverseMatrix.props[0]=a;inverseMatrix.props[1]=b;inverseMatrix.props[4]=c;inverseMatrix.props[5]=d;inverseMatrix.props[12]=e;inverseMatrix.props[13]=f;return inverseMatrix;}function inversePoint(pt){var inverseMatrix=this.getInverseMatrix();return inverseMatrix.applyToPointArray(pt[0],pt[1],pt[2]||0);}function inversePoints(pts){var i;var len=pts.length;var retPts=[];for(i=0;i<len;i+=1){retPts[i]=inversePoint(pts[i]);}return retPts;}function applyToTriplePoints(pt1,pt2,pt3){var arr=createTypedArray('float32',6);if(this.isIdentity()){arr[0]=pt1[0];arr[1]=pt1[1];arr[2]=pt2[0];arr[3]=pt2[1];arr[4]=pt3[0];arr[5]=pt3[1];}else{var p0=this.props[0];var p1=this.props[1];var p4=this.props[4];var p5=this.props[5];var p12=this.props[12];var p13=this.props[13];arr[0]=pt1[0]*p0+pt1[1]*p4+p12;arr[1]=pt1[0]*p1+pt1[1]*p5+p13;arr[2]=pt2[0]*p0+pt2[1]*p4+p12;arr[3]=pt2[0]*p1+pt2[1]*p5+p13;arr[4]=pt3[0]*p0+pt3[1]*p4+p12;arr[5]=pt3[0]*p1+pt3[1]*p5+p13;}return arr;}function applyToPointArray(x,y,z){var arr;if(this.isIdentity()){arr=[x,y,z];}else{arr=[x*this.props[0]+y*this.props[4]+z*this.props[8]+this.props[12],x*this.props[1]+y*this.props[5]+z*this.props[9]+this.props[13],x*this.props[2]+y*this.props[6]+z*this.props[10]+this.props[14]];}return arr;}function applyToPointStringified(x,y){if(this.isIdentity()){return x+','+y;}var _p=this.props;return Math.round((x*_p[0]+y*_p[4]+_p[12])*100)/100+','+Math.round((x*_p[1]+y*_p[5]+_p[13])*100)/100;}function toCSS(){// Doesn't make much sense to add this optimization. If it is an identity matrix, it's very likely this will get called only once since it won't be keyframed.
	/* if(this.isIdentity()) {
	              return '';
	          } */var i=0;var props=this.props;var cssValue='matrix3d(';var v=10000;while(i<16){cssValue+=_rnd(props[i]*v)/v;cssValue+=i===15?')':',';i+=1;}return cssValue;}function roundMatrixProperty(val){var v=10000;if(val<0.000001&&val>0||val>-0.000001&&val<0){return _rnd(val*v)/v;}return val;}function to2dCSS(){// Doesn't make much sense to add this optimization. If it is an identity matrix, it's very likely this will get called only once since it won't be keyframed.
	/* if(this.isIdentity()) {
	              return '';
	          } */var props=this.props;var _a=roundMatrixProperty(props[0]);var _b=roundMatrixProperty(props[1]);var _c=roundMatrixProperty(props[4]);var _d=roundMatrixProperty(props[5]);var _e=roundMatrixProperty(props[12]);var _f=roundMatrixProperty(props[13]);return 'matrix('+_a+','+_b+','+_c+','+_d+','+_e+','+_f+')';}return function(){this.reset=reset;this.rotate=rotate;this.rotateX=rotateX;this.rotateY=rotateY;this.rotateZ=rotateZ;this.skew=skew;this.skewFromAxis=skewFromAxis;this.shear=shear;this.scale=scale;this.setTransform=setTransform;this.translate=translate;this.transform=transform;this.applyToPoint=applyToPoint;this.applyToX=applyToX;this.applyToY=applyToY;this.applyToZ=applyToZ;this.applyToPointArray=applyToPointArray;this.applyToTriplePoints=applyToTriplePoints;this.applyToPointStringified=applyToPointStringified;this.toCSS=toCSS;this.to2dCSS=to2dCSS;this.clone=clone;this.cloneFromProps=cloneFromProps;this.equals=equals;this.inversePoints=inversePoints;this.inversePoint=inversePoint;this.getInverseMatrix=getInverseMatrix;this._t=this.transform;this.isIdentity=isIdentity;this._identity=true;this._identityCalculated=false;this.props=createTypedArray('float32',16);this.reset();};}();function _typeof$3(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof$3=function _typeof(obj){return typeof obj;};}else{_typeof$3=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};}return _typeof$3(obj);}var lottie={};var renderer='';function setLocation(href){setLocationHref(href);}function searchAnimations(){{animationManager.searchAnimations();}}function setSubframeRendering(flag){setSubframeEnabled(flag);}function setPrefix(prefix){setIdPrefix(prefix);}function loadAnimation(params){return animationManager.loadAnimation(params);}function setQuality(value){if(typeof value==='string'){switch(value){case'high':setDefaultCurveSegments(200);break;default:case'medium':setDefaultCurveSegments(50);break;case'low':setDefaultCurveSegments(10);break;}}else if(!isNaN(value)&&value>1){setDefaultCurveSegments(value);}}function inBrowser(){return typeof navigator!=='undefined';}function installPlugin(type,plugin){if(type==='expressions'){setExpressionsPlugin(plugin);}}function getFactory(name){switch(name){case'propertyFactory':return PropertyFactory;case'shapePropertyFactory':return ShapePropertyFactory;case'matrix':return Matrix;default:return null;}}lottie.play=animationManager.play;lottie.pause=animationManager.pause;lottie.setLocationHref=setLocation;lottie.togglePause=animationManager.togglePause;lottie.setSpeed=animationManager.setSpeed;lottie.setDirection=animationManager.setDirection;lottie.stop=animationManager.stop;lottie.searchAnimations=searchAnimations;lottie.registerAnimation=animationManager.registerAnimation;lottie.loadAnimation=loadAnimation;lottie.setSubframeRendering=setSubframeRendering;lottie.resize=animationManager.resize;// lottie.start = start;
	lottie.goToAndStop=animationManager.goToAndStop;lottie.destroy=animationManager.destroy;lottie.setQuality=setQuality;lottie.inBrowser=inBrowser;lottie.installPlugin=installPlugin;lottie.freeze=animationManager.freeze;lottie.unfreeze=animationManager.unfreeze;lottie.setVolume=animationManager.setVolume;lottie.mute=animationManager.mute;lottie.unmute=animationManager.unmute;lottie.getRegisteredAnimations=animationManager.getRegisteredAnimations;lottie.useWebWorker=setWebWorker;lottie.setIDPrefix=setPrefix;lottie.__getFactory=getFactory;lottie.version='5.9.6';function checkReady(){if(document.readyState==='complete'){clearInterval(readyStateCheckInterval);searchAnimations();}}function getQueryVariable(variable){var vars=queryString.split('&');for(var i=0;i<vars.length;i+=1){var pair=vars[i].split('=');if(decodeURIComponent(pair[0])==variable){// eslint-disable-line eqeqeq
	return decodeURIComponent(pair[1]);}}return null;}var queryString='';{var scripts=document.getElementsByTagName('script');var index=scripts.length-1;var myScript=scripts[index]||{src:''};queryString=myScript.src?myScript.src.replace(/^[^\?]+\??/,''):'';// eslint-disable-line no-useless-escape
	renderer=getQueryVariable('renderer');}var readyStateCheckInterval=setInterval(checkReady,100);// this adds bodymovin to the window object for backwards compatibility
	try{if(!((_typeof$3(exports))==='object'&&'object'!=='undefined')&&!(typeof undefined==='function'&&undefined.amd)// eslint-disable-line no-undef
	){window.bodymovin=lottie;}}catch(err){//
	}var ShapeModifiers=function(){var ob={};var modifiers={};ob.registerModifier=registerModifier;ob.getModifier=getModifier;function registerModifier(nm,factory){if(!modifiers[nm]){modifiers[nm]=factory;}}function getModifier(nm,elem,data){return new modifiers[nm](elem,data);}return ob;}();function ShapeModifier(){}ShapeModifier.prototype.initModifierProperties=function(){};ShapeModifier.prototype.addShapeToModifier=function(){};ShapeModifier.prototype.addShape=function(data){if(!this.closed){// Adding shape to dynamic properties. It covers the case where a shape has no effects applied, to reset it's _mdf state on every tick.
	data.sh.container.addDynamicProperty(data.sh);var shapeData={shape:data.sh,data:data,localShapeCollection:shapeCollectionPool.newShapeCollection()};this.shapes.push(shapeData);this.addShapeToModifier(shapeData);if(this._isAnimated){data.setAsAnimated();}}};ShapeModifier.prototype.init=function(elem,data){this.shapes=[];this.elem=elem;this.initDynamicPropertyContainer(elem);this.initModifierProperties(elem,data);this.frameId=initialDefaultFrame;this.closed=false;this.k=false;if(this.dynamicProperties.length){this.k=true;}else{this.getValue(true);}};ShapeModifier.prototype.processKeys=function(){if(this.elem.globalData.frameId===this.frameId){return;}this.frameId=this.elem.globalData.frameId;this.iterateDynamicProperties();};extendPrototype([DynamicPropertyContainer],ShapeModifier);function TrimModifier(){}extendPrototype([ShapeModifier],TrimModifier);TrimModifier.prototype.initModifierProperties=function(elem,data){this.s=PropertyFactory.getProp(elem,data.s,0,0.01,this);this.e=PropertyFactory.getProp(elem,data.e,0,0.01,this);this.o=PropertyFactory.getProp(elem,data.o,0,0,this);this.sValue=0;this.eValue=0;this.getValue=this.processKeys;this.m=data.m;this._isAnimated=!!this.s.effectsSequence.length||!!this.e.effectsSequence.length||!!this.o.effectsSequence.length;};TrimModifier.prototype.addShapeToModifier=function(shapeData){shapeData.pathsData=[];};TrimModifier.prototype.calculateShapeEdges=function(s,e,shapeLength,addedLength,totalModifierLength){var segments=[];if(e<=1){segments.push({s:s,e:e});}else if(s>=1){segments.push({s:s-1,e:e-1});}else{segments.push({s:s,e:1});segments.push({s:0,e:e-1});}var shapeSegments=[];var i;var len=segments.length;var segmentOb;for(i=0;i<len;i+=1){segmentOb=segments[i];if(!(segmentOb.e*totalModifierLength<addedLength||segmentOb.s*totalModifierLength>addedLength+shapeLength)){var shapeS;var shapeE;if(segmentOb.s*totalModifierLength<=addedLength){shapeS=0;}else{shapeS=(segmentOb.s*totalModifierLength-addedLength)/shapeLength;}if(segmentOb.e*totalModifierLength>=addedLength+shapeLength){shapeE=1;}else{shapeE=(segmentOb.e*totalModifierLength-addedLength)/shapeLength;}shapeSegments.push([shapeS,shapeE]);}}if(!shapeSegments.length){shapeSegments.push([0,0]);}return shapeSegments;};TrimModifier.prototype.releasePathsData=function(pathsData){var i;var len=pathsData.length;for(i=0;i<len;i+=1){segmentsLengthPool.release(pathsData[i]);}pathsData.length=0;return pathsData;};TrimModifier.prototype.processShapes=function(_isFirstFrame){var s;var e;if(this._mdf||_isFirstFrame){var o=this.o.v%360/360;if(o<0){o+=1;}if(this.s.v>1){s=1+o;}else if(this.s.v<0){s=0+o;}else{s=this.s.v+o;}if(this.e.v>1){e=1+o;}else if(this.e.v<0){e=0+o;}else{e=this.e.v+o;}if(s>e){var _s=s;s=e;e=_s;}s=Math.round(s*10000)*0.0001;e=Math.round(e*10000)*0.0001;this.sValue=s;this.eValue=e;}else{s=this.sValue;e=this.eValue;}var shapePaths;var i;var len=this.shapes.length;var j;var jLen;var pathsData;var pathData;var totalShapeLength;var totalModifierLength=0;if(e===s){for(i=0;i<len;i+=1){this.shapes[i].localShapeCollection.releaseShapes();this.shapes[i].shape._mdf=true;this.shapes[i].shape.paths=this.shapes[i].localShapeCollection;if(this._mdf){this.shapes[i].pathsData.length=0;}}}else if(!(e===1&&s===0||e===0&&s===1)){var segments=[];var shapeData;var localShapeCollection;for(i=0;i<len;i+=1){shapeData=this.shapes[i];// if shape hasn't changed and trim properties haven't changed, cached previous path can be used
	if(!shapeData.shape._mdf&&!this._mdf&&!_isFirstFrame&&this.m!==2){shapeData.shape.paths=shapeData.localShapeCollection;}else{shapePaths=shapeData.shape.paths;jLen=shapePaths._length;totalShapeLength=0;if(!shapeData.shape._mdf&&shapeData.pathsData.length){totalShapeLength=shapeData.totalShapeLength;}else{pathsData=this.releasePathsData(shapeData.pathsData);for(j=0;j<jLen;j+=1){pathData=bez.getSegmentsLength(shapePaths.shapes[j]);pathsData.push(pathData);totalShapeLength+=pathData.totalLength;}shapeData.totalShapeLength=totalShapeLength;shapeData.pathsData=pathsData;}totalModifierLength+=totalShapeLength;shapeData.shape._mdf=true;}}var shapeS=s;var shapeE=e;var addedLength=0;var edges;for(i=len-1;i>=0;i-=1){shapeData=this.shapes[i];if(shapeData.shape._mdf){localShapeCollection=shapeData.localShapeCollection;localShapeCollection.releaseShapes();// if m === 2 means paths are trimmed individually so edges need to be found for this specific shape relative to whoel group
	if(this.m===2&&len>1){edges=this.calculateShapeEdges(s,e,shapeData.totalShapeLength,addedLength,totalModifierLength);addedLength+=shapeData.totalShapeLength;}else{edges=[[shapeS,shapeE]];}jLen=edges.length;for(j=0;j<jLen;j+=1){shapeS=edges[j][0];shapeE=edges[j][1];segments.length=0;if(shapeE<=1){segments.push({s:shapeData.totalShapeLength*shapeS,e:shapeData.totalShapeLength*shapeE});}else if(shapeS>=1){segments.push({s:shapeData.totalShapeLength*(shapeS-1),e:shapeData.totalShapeLength*(shapeE-1)});}else{segments.push({s:shapeData.totalShapeLength*shapeS,e:shapeData.totalShapeLength});segments.push({s:0,e:shapeData.totalShapeLength*(shapeE-1)});}var newShapesData=this.addShapes(shapeData,segments[0]);if(segments[0].s!==segments[0].e){if(segments.length>1){var lastShapeInCollection=shapeData.shape.paths.shapes[shapeData.shape.paths._length-1];if(lastShapeInCollection.c){var lastShape=newShapesData.pop();this.addPaths(newShapesData,localShapeCollection);newShapesData=this.addShapes(shapeData,segments[1],lastShape);}else{this.addPaths(newShapesData,localShapeCollection);newShapesData=this.addShapes(shapeData,segments[1]);}}this.addPaths(newShapesData,localShapeCollection);}}shapeData.shape.paths=localShapeCollection;}}}else if(this._mdf){for(i=0;i<len;i+=1){// Releasign Trim Cached paths data when no trim applied in case shapes are modified inbetween.
	// Don't remove this even if it's losing cached info.
	this.shapes[i].pathsData.length=0;this.shapes[i].shape._mdf=true;}}};TrimModifier.prototype.addPaths=function(newPaths,localShapeCollection){var i;var len=newPaths.length;for(i=0;i<len;i+=1){localShapeCollection.addShape(newPaths[i]);}};TrimModifier.prototype.addSegment=function(pt1,pt2,pt3,pt4,shapePath,pos,newShape){shapePath.setXYAt(pt2[0],pt2[1],'o',pos);shapePath.setXYAt(pt3[0],pt3[1],'i',pos+1);if(newShape){shapePath.setXYAt(pt1[0],pt1[1],'v',pos);}shapePath.setXYAt(pt4[0],pt4[1],'v',pos+1);};TrimModifier.prototype.addSegmentFromArray=function(points,shapePath,pos,newShape){shapePath.setXYAt(points[1],points[5],'o',pos);shapePath.setXYAt(points[2],points[6],'i',pos+1);if(newShape){shapePath.setXYAt(points[0],points[4],'v',pos);}shapePath.setXYAt(points[3],points[7],'v',pos+1);};TrimModifier.prototype.addShapes=function(shapeData,shapeSegment,shapePath){var pathsData=shapeData.pathsData;var shapePaths=shapeData.shape.paths.shapes;var i;var len=shapeData.shape.paths._length;var j;var jLen;var addedLength=0;var currentLengthData;var segmentCount;var lengths;var segment;var shapes=[];var initPos;var newShape=true;if(!shapePath){shapePath=shapePool.newElement();segmentCount=0;initPos=0;}else{segmentCount=shapePath._length;initPos=shapePath._length;}shapes.push(shapePath);for(i=0;i<len;i+=1){lengths=pathsData[i].lengths;shapePath.c=shapePaths[i].c;jLen=shapePaths[i].c?lengths.length:lengths.length+1;for(j=1;j<jLen;j+=1){currentLengthData=lengths[j-1];if(addedLength+currentLengthData.addedLength<shapeSegment.s){addedLength+=currentLengthData.addedLength;shapePath.c=false;}else if(addedLength>shapeSegment.e){shapePath.c=false;break;}else{if(shapeSegment.s<=addedLength&&shapeSegment.e>=addedLength+currentLengthData.addedLength){this.addSegment(shapePaths[i].v[j-1],shapePaths[i].o[j-1],shapePaths[i].i[j],shapePaths[i].v[j],shapePath,segmentCount,newShape);newShape=false;}else{segment=bez.getNewSegment(shapePaths[i].v[j-1],shapePaths[i].v[j],shapePaths[i].o[j-1],shapePaths[i].i[j],(shapeSegment.s-addedLength)/currentLengthData.addedLength,(shapeSegment.e-addedLength)/currentLengthData.addedLength,lengths[j-1]);this.addSegmentFromArray(segment,shapePath,segmentCount,newShape);// this.addSegment(segment.pt1, segment.pt3, segment.pt4, segment.pt2, shapePath, segmentCount, newShape);
	newShape=false;shapePath.c=false;}addedLength+=currentLengthData.addedLength;segmentCount+=1;}}if(shapePaths[i].c&&lengths.length){currentLengthData=lengths[j-1];if(addedLength<=shapeSegment.e){var segmentLength=lengths[j-1].addedLength;if(shapeSegment.s<=addedLength&&shapeSegment.e>=addedLength+segmentLength){this.addSegment(shapePaths[i].v[j-1],shapePaths[i].o[j-1],shapePaths[i].i[0],shapePaths[i].v[0],shapePath,segmentCount,newShape);newShape=false;}else{segment=bez.getNewSegment(shapePaths[i].v[j-1],shapePaths[i].v[0],shapePaths[i].o[j-1],shapePaths[i].i[0],(shapeSegment.s-addedLength)/segmentLength,(shapeSegment.e-addedLength)/segmentLength,lengths[j-1]);this.addSegmentFromArray(segment,shapePath,segmentCount,newShape);// this.addSegment(segment.pt1, segment.pt3, segment.pt4, segment.pt2, shapePath, segmentCount, newShape);
	newShape=false;shapePath.c=false;}}else{shapePath.c=false;}addedLength+=currentLengthData.addedLength;segmentCount+=1;}if(shapePath._length){shapePath.setXYAt(shapePath.v[initPos][0],shapePath.v[initPos][1],'i',initPos);shapePath.setXYAt(shapePath.v[shapePath._length-1][0],shapePath.v[shapePath._length-1][1],'o',shapePath._length-1);}if(addedLength>shapeSegment.e){break;}if(i<len-1){shapePath=shapePool.newElement();newShape=true;shapes.push(shapePath);segmentCount=0;}}return shapes;};function PuckerAndBloatModifier(){}extendPrototype([ShapeModifier],PuckerAndBloatModifier);PuckerAndBloatModifier.prototype.initModifierProperties=function(elem,data){this.getValue=this.processKeys;this.amount=PropertyFactory.getProp(elem,data.a,0,null,this);this._isAnimated=!!this.amount.effectsSequence.length;};PuckerAndBloatModifier.prototype.processPath=function(path,amount){var percent=amount/100;var centerPoint=[0,0];var pathLength=path._length;var i=0;for(i=0;i<pathLength;i+=1){centerPoint[0]+=path.v[i][0];centerPoint[1]+=path.v[i][1];}centerPoint[0]/=pathLength;centerPoint[1]/=pathLength;var clonedPath=shapePool.newElement();clonedPath.c=path.c;var vX;var vY;var oX;var oY;var iX;var iY;for(i=0;i<pathLength;i+=1){vX=path.v[i][0]+(centerPoint[0]-path.v[i][0])*percent;vY=path.v[i][1]+(centerPoint[1]-path.v[i][1])*percent;oX=path.o[i][0]+(centerPoint[0]-path.o[i][0])*-percent;oY=path.o[i][1]+(centerPoint[1]-path.o[i][1])*-percent;iX=path.i[i][0]+(centerPoint[0]-path.i[i][0])*-percent;iY=path.i[i][1]+(centerPoint[1]-path.i[i][1])*-percent;clonedPath.setTripleAt(vX,vY,oX,oY,iX,iY,i);}return clonedPath;};PuckerAndBloatModifier.prototype.processShapes=function(_isFirstFrame){var shapePaths;var i;var len=this.shapes.length;var j;var jLen;var amount=this.amount.v;if(amount!==0){var shapeData;var localShapeCollection;for(i=0;i<len;i+=1){shapeData=this.shapes[i];localShapeCollection=shapeData.localShapeCollection;if(!(!shapeData.shape._mdf&&!this._mdf&&!_isFirstFrame)){localShapeCollection.releaseShapes();shapeData.shape._mdf=true;shapePaths=shapeData.shape.paths.shapes;jLen=shapeData.shape.paths._length;for(j=0;j<jLen;j+=1){localShapeCollection.addShape(this.processPath(shapePaths[j],amount));}}shapeData.shape.paths=shapeData.localShapeCollection;}}if(!this.dynamicProperties.length){this._mdf=false;}};var TransformPropertyFactory=function(){var defaultVector=[0,0];function applyToMatrix(mat){var _mdf=this._mdf;this.iterateDynamicProperties();this._mdf=this._mdf||_mdf;if(this.a){mat.translate(-this.a.v[0],-this.a.v[1],this.a.v[2]);}if(this.s){mat.scale(this.s.v[0],this.s.v[1],this.s.v[2]);}if(this.sk){mat.skewFromAxis(-this.sk.v,this.sa.v);}if(this.r){mat.rotate(-this.r.v);}else{mat.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);}if(this.data.p.s){if(this.data.p.z){mat.translate(this.px.v,this.py.v,-this.pz.v);}else{mat.translate(this.px.v,this.py.v,0);}}else{mat.translate(this.p.v[0],this.p.v[1],-this.p.v[2]);}}function processKeys(forceRender){if(this.elem.globalData.frameId===this.frameId){return;}if(this._isDirty){this.precalculateMatrix();this._isDirty=false;}this.iterateDynamicProperties();if(this._mdf||forceRender){var frameRate;this.v.cloneFromProps(this.pre.props);if(this.appliedTransformations<1){this.v.translate(-this.a.v[0],-this.a.v[1],this.a.v[2]);}if(this.appliedTransformations<2){this.v.scale(this.s.v[0],this.s.v[1],this.s.v[2]);}if(this.sk&&this.appliedTransformations<3){this.v.skewFromAxis(-this.sk.v,this.sa.v);}if(this.r&&this.appliedTransformations<4){this.v.rotate(-this.r.v);}else if(!this.r&&this.appliedTransformations<4){this.v.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);}if(this.autoOriented){var v1;var v2;frameRate=this.elem.globalData.frameRate;if(this.p&&this.p.keyframes&&this.p.getValueAtTime){if(this.p._caching.lastFrame+this.p.offsetTime<=this.p.keyframes[0].t){v1=this.p.getValueAtTime((this.p.keyframes[0].t+0.01)/frameRate,0);v2=this.p.getValueAtTime(this.p.keyframes[0].t/frameRate,0);}else if(this.p._caching.lastFrame+this.p.offsetTime>=this.p.keyframes[this.p.keyframes.length-1].t){v1=this.p.getValueAtTime(this.p.keyframes[this.p.keyframes.length-1].t/frameRate,0);v2=this.p.getValueAtTime((this.p.keyframes[this.p.keyframes.length-1].t-0.05)/frameRate,0);}else{v1=this.p.pv;v2=this.p.getValueAtTime((this.p._caching.lastFrame+this.p.offsetTime-0.01)/frameRate,this.p.offsetTime);}}else if(this.px&&this.px.keyframes&&this.py.keyframes&&this.px.getValueAtTime&&this.py.getValueAtTime){v1=[];v2=[];var px=this.px;var py=this.py;if(px._caching.lastFrame+px.offsetTime<=px.keyframes[0].t){v1[0]=px.getValueAtTime((px.keyframes[0].t+0.01)/frameRate,0);v1[1]=py.getValueAtTime((py.keyframes[0].t+0.01)/frameRate,0);v2[0]=px.getValueAtTime(px.keyframes[0].t/frameRate,0);v2[1]=py.getValueAtTime(py.keyframes[0].t/frameRate,0);}else if(px._caching.lastFrame+px.offsetTime>=px.keyframes[px.keyframes.length-1].t){v1[0]=px.getValueAtTime(px.keyframes[px.keyframes.length-1].t/frameRate,0);v1[1]=py.getValueAtTime(py.keyframes[py.keyframes.length-1].t/frameRate,0);v2[0]=px.getValueAtTime((px.keyframes[px.keyframes.length-1].t-0.01)/frameRate,0);v2[1]=py.getValueAtTime((py.keyframes[py.keyframes.length-1].t-0.01)/frameRate,0);}else{v1=[px.pv,py.pv];v2[0]=px.getValueAtTime((px._caching.lastFrame+px.offsetTime-0.01)/frameRate,px.offsetTime);v2[1]=py.getValueAtTime((py._caching.lastFrame+py.offsetTime-0.01)/frameRate,py.offsetTime);}}else{v2=defaultVector;v1=v2;}this.v.rotate(-Math.atan2(v1[1]-v2[1],v1[0]-v2[0]));}if(this.data.p&&this.data.p.s){if(this.data.p.z){this.v.translate(this.px.v,this.py.v,-this.pz.v);}else{this.v.translate(this.px.v,this.py.v,0);}}else{this.v.translate(this.p.v[0],this.p.v[1],-this.p.v[2]);}}this.frameId=this.elem.globalData.frameId;}function precalculateMatrix(){if(!this.a.k){this.pre.translate(-this.a.v[0],-this.a.v[1],this.a.v[2]);this.appliedTransformations=1;}else{return;}if(!this.s.effectsSequence.length){this.pre.scale(this.s.v[0],this.s.v[1],this.s.v[2]);this.appliedTransformations=2;}else{return;}if(this.sk){if(!this.sk.effectsSequence.length&&!this.sa.effectsSequence.length){this.pre.skewFromAxis(-this.sk.v,this.sa.v);this.appliedTransformations=3;}else{return;}}if(this.r){if(!this.r.effectsSequence.length){this.pre.rotate(-this.r.v);this.appliedTransformations=4;}}else if(!this.rz.effectsSequence.length&&!this.ry.effectsSequence.length&&!this.rx.effectsSequence.length&&!this.or.effectsSequence.length){this.pre.rotateZ(-this.rz.v).rotateY(this.ry.v).rotateX(this.rx.v).rotateZ(-this.or.v[2]).rotateY(this.or.v[1]).rotateX(this.or.v[0]);this.appliedTransformations=4;}}function autoOrient(){//
	// var prevP = this.getValueAtTime();
	}function addDynamicProperty(prop){this._addDynamicProperty(prop);this.elem.addDynamicProperty(prop);this._isDirty=true;}function TransformProperty(elem,data,container){this.elem=elem;this.frameId=-1;this.propType='transform';this.data=data;this.v=new Matrix();// Precalculated matrix with non animated properties
	this.pre=new Matrix();this.appliedTransformations=0;this.initDynamicPropertyContainer(container||elem);if(data.p&&data.p.s){this.px=PropertyFactory.getProp(elem,data.p.x,0,0,this);this.py=PropertyFactory.getProp(elem,data.p.y,0,0,this);if(data.p.z){this.pz=PropertyFactory.getProp(elem,data.p.z,0,0,this);}}else{this.p=PropertyFactory.getProp(elem,data.p||{k:[0,0,0]},1,0,this);}if(data.rx){this.rx=PropertyFactory.getProp(elem,data.rx,0,degToRads,this);this.ry=PropertyFactory.getProp(elem,data.ry,0,degToRads,this);this.rz=PropertyFactory.getProp(elem,data.rz,0,degToRads,this);if(data.or.k[0].ti){var i;var len=data.or.k.length;for(i=0;i<len;i+=1){data.or.k[i].to=null;data.or.k[i].ti=null;}}this.or=PropertyFactory.getProp(elem,data.or,1,degToRads,this);// sh Indicates it needs to be capped between -180 and 180
	this.or.sh=true;}else{this.r=PropertyFactory.getProp(elem,data.r||{k:0},0,degToRads,this);}if(data.sk){this.sk=PropertyFactory.getProp(elem,data.sk,0,degToRads,this);this.sa=PropertyFactory.getProp(elem,data.sa,0,degToRads,this);}this.a=PropertyFactory.getProp(elem,data.a||{k:[0,0,0]},1,0,this);this.s=PropertyFactory.getProp(elem,data.s||{k:[100,100,100]},1,0.01,this);// Opacity is not part of the transform properties, that's why it won't use this.dynamicProperties. That way transforms won't get updated if opacity changes.
	if(data.o){this.o=PropertyFactory.getProp(elem,data.o,0,0.01,elem);}else{this.o={_mdf:false,v:1};}this._isDirty=true;if(!this.dynamicProperties.length){this.getValue(true);}}TransformProperty.prototype={applyToMatrix:applyToMatrix,getValue:processKeys,precalculateMatrix:precalculateMatrix,autoOrient:autoOrient};extendPrototype([DynamicPropertyContainer],TransformProperty);TransformProperty.prototype.addDynamicProperty=addDynamicProperty;TransformProperty.prototype._addDynamicProperty=DynamicPropertyContainer.prototype.addDynamicProperty;function getTransformProperty(elem,data,container){return new TransformProperty(elem,data,container);}return {getTransformProperty:getTransformProperty};}();function RepeaterModifier(){}extendPrototype([ShapeModifier],RepeaterModifier);RepeaterModifier.prototype.initModifierProperties=function(elem,data){this.getValue=this.processKeys;this.c=PropertyFactory.getProp(elem,data.c,0,null,this);this.o=PropertyFactory.getProp(elem,data.o,0,null,this);this.tr=TransformPropertyFactory.getTransformProperty(elem,data.tr,this);this.so=PropertyFactory.getProp(elem,data.tr.so,0,0.01,this);this.eo=PropertyFactory.getProp(elem,data.tr.eo,0,0.01,this);this.data=data;if(!this.dynamicProperties.length){this.getValue(true);}this._isAnimated=!!this.dynamicProperties.length;this.pMatrix=new Matrix();this.rMatrix=new Matrix();this.sMatrix=new Matrix();this.tMatrix=new Matrix();this.matrix=new Matrix();};RepeaterModifier.prototype.applyTransforms=function(pMatrix,rMatrix,sMatrix,transform,perc,inv){var dir=inv?-1:1;var scaleX=transform.s.v[0]+(1-transform.s.v[0])*(1-perc);var scaleY=transform.s.v[1]+(1-transform.s.v[1])*(1-perc);pMatrix.translate(transform.p.v[0]*dir*perc,transform.p.v[1]*dir*perc,transform.p.v[2]);rMatrix.translate(-transform.a.v[0],-transform.a.v[1],transform.a.v[2]);rMatrix.rotate(-transform.r.v*dir*perc);rMatrix.translate(transform.a.v[0],transform.a.v[1],transform.a.v[2]);sMatrix.translate(-transform.a.v[0],-transform.a.v[1],transform.a.v[2]);sMatrix.scale(inv?1/scaleX:scaleX,inv?1/scaleY:scaleY);sMatrix.translate(transform.a.v[0],transform.a.v[1],transform.a.v[2]);};RepeaterModifier.prototype.init=function(elem,arr,pos,elemsData){this.elem=elem;this.arr=arr;this.pos=pos;this.elemsData=elemsData;this._currentCopies=0;this._elements=[];this._groups=[];this.frameId=-1;this.initDynamicPropertyContainer(elem);this.initModifierProperties(elem,arr[pos]);while(pos>0){pos-=1;// this._elements.unshift(arr.splice(pos,1)[0]);
	this._elements.unshift(arr[pos]);}if(this.dynamicProperties.length){this.k=true;}else{this.getValue(true);}};RepeaterModifier.prototype.resetElements=function(elements){var i;var len=elements.length;for(i=0;i<len;i+=1){elements[i]._processed=false;if(elements[i].ty==='gr'){this.resetElements(elements[i].it);}}};RepeaterModifier.prototype.cloneElements=function(elements){var newElements=JSON.parse(JSON.stringify(elements));this.resetElements(newElements);return newElements;};RepeaterModifier.prototype.changeGroupRender=function(elements,renderFlag){var i;var len=elements.length;for(i=0;i<len;i+=1){elements[i]._render=renderFlag;if(elements[i].ty==='gr'){this.changeGroupRender(elements[i].it,renderFlag);}}};RepeaterModifier.prototype.processShapes=function(_isFirstFrame){var items;var itemsTransform;var i;var dir;var cont;var hasReloaded=false;if(this._mdf||_isFirstFrame){var copies=Math.ceil(this.c.v);if(this._groups.length<copies){while(this._groups.length<copies){var group={it:this.cloneElements(this._elements),ty:'gr'};group.it.push({a:{a:0,ix:1,k:[0,0]},nm:'Transform',o:{a:0,ix:7,k:100},p:{a:0,ix:2,k:[0,0]},r:{a:1,ix:6,k:[{s:0,e:0,t:0},{s:0,e:0,t:1}]},s:{a:0,ix:3,k:[100,100]},sa:{a:0,ix:5,k:0},sk:{a:0,ix:4,k:0},ty:'tr'});this.arr.splice(0,0,group);this._groups.splice(0,0,group);this._currentCopies+=1;}this.elem.reloadShapes();hasReloaded=true;}cont=0;var renderFlag;for(i=0;i<=this._groups.length-1;i+=1){renderFlag=cont<copies;this._groups[i]._render=renderFlag;this.changeGroupRender(this._groups[i].it,renderFlag);if(!renderFlag){var elems=this.elemsData[i].it;var transformData=elems[elems.length-1];if(transformData.transform.op.v!==0){transformData.transform.op._mdf=true;transformData.transform.op.v=0;}else{transformData.transform.op._mdf=false;}}cont+=1;}this._currentCopies=copies;/// /
	var offset=this.o.v;var offsetModulo=offset%1;var roundOffset=offset>0?Math.floor(offset):Math.ceil(offset);var pProps=this.pMatrix.props;var rProps=this.rMatrix.props;var sProps=this.sMatrix.props;this.pMatrix.reset();this.rMatrix.reset();this.sMatrix.reset();this.tMatrix.reset();this.matrix.reset();var iteration=0;if(offset>0){while(iteration<roundOffset){this.applyTransforms(this.pMatrix,this.rMatrix,this.sMatrix,this.tr,1,false);iteration+=1;}if(offsetModulo){this.applyTransforms(this.pMatrix,this.rMatrix,this.sMatrix,this.tr,offsetModulo,false);iteration+=offsetModulo;}}else if(offset<0){while(iteration>roundOffset){this.applyTransforms(this.pMatrix,this.rMatrix,this.sMatrix,this.tr,1,true);iteration-=1;}if(offsetModulo){this.applyTransforms(this.pMatrix,this.rMatrix,this.sMatrix,this.tr,-offsetModulo,true);iteration-=offsetModulo;}}i=this.data.m===1?0:this._currentCopies-1;dir=this.data.m===1?1:-1;cont=this._currentCopies;var j;var jLen;while(cont){items=this.elemsData[i].it;itemsTransform=items[items.length-1].transform.mProps.v.props;jLen=itemsTransform.length;items[items.length-1].transform.mProps._mdf=true;items[items.length-1].transform.op._mdf=true;items[items.length-1].transform.op.v=this._currentCopies===1?this.so.v:this.so.v+(this.eo.v-this.so.v)*(i/(this._currentCopies-1));if(iteration!==0){if(i!==0&&dir===1||i!==this._currentCopies-1&&dir===-1){this.applyTransforms(this.pMatrix,this.rMatrix,this.sMatrix,this.tr,1,false);}this.matrix.transform(rProps[0],rProps[1],rProps[2],rProps[3],rProps[4],rProps[5],rProps[6],rProps[7],rProps[8],rProps[9],rProps[10],rProps[11],rProps[12],rProps[13],rProps[14],rProps[15]);this.matrix.transform(sProps[0],sProps[1],sProps[2],sProps[3],sProps[4],sProps[5],sProps[6],sProps[7],sProps[8],sProps[9],sProps[10],sProps[11],sProps[12],sProps[13],sProps[14],sProps[15]);this.matrix.transform(pProps[0],pProps[1],pProps[2],pProps[3],pProps[4],pProps[5],pProps[6],pProps[7],pProps[8],pProps[9],pProps[10],pProps[11],pProps[12],pProps[13],pProps[14],pProps[15]);for(j=0;j<jLen;j+=1){itemsTransform[j]=this.matrix.props[j];}this.matrix.reset();}else{this.matrix.reset();for(j=0;j<jLen;j+=1){itemsTransform[j]=this.matrix.props[j];}}iteration+=1;cont-=1;i+=dir;}}else{cont=this._currentCopies;i=0;dir=1;while(cont){items=this.elemsData[i].it;itemsTransform=items[items.length-1].transform.mProps.v.props;items[items.length-1].transform.mProps._mdf=false;items[items.length-1].transform.op._mdf=false;cont-=1;i+=dir;}}return hasReloaded;};RepeaterModifier.prototype.addShape=function(){};function RoundCornersModifier(){}extendPrototype([ShapeModifier],RoundCornersModifier);RoundCornersModifier.prototype.initModifierProperties=function(elem,data){this.getValue=this.processKeys;this.rd=PropertyFactory.getProp(elem,data.r,0,null,this);this._isAnimated=!!this.rd.effectsSequence.length;};RoundCornersModifier.prototype.processPath=function(path,round){var clonedPath=shapePool.newElement();clonedPath.c=path.c;var i;var len=path._length;var currentV;var currentI;var currentO;var closerV;var distance;var newPosPerc;var index=0;var vX;var vY;var oX;var oY;var iX;var iY;for(i=0;i<len;i+=1){currentV=path.v[i];currentO=path.o[i];currentI=path.i[i];if(currentV[0]===currentO[0]&&currentV[1]===currentO[1]&&currentV[0]===currentI[0]&&currentV[1]===currentI[1]){if((i===0||i===len-1)&&!path.c){clonedPath.setTripleAt(currentV[0],currentV[1],currentO[0],currentO[1],currentI[0],currentI[1],index);/* clonedPath.v[index] = currentV;
	                  clonedPath.o[index] = currentO;
	                  clonedPath.i[index] = currentI; */index+=1;}else{if(i===0){closerV=path.v[len-1];}else{closerV=path.v[i-1];}distance=Math.sqrt(Math.pow(currentV[0]-closerV[0],2)+Math.pow(currentV[1]-closerV[1],2));newPosPerc=distance?Math.min(distance/2,round)/distance:0;iX=currentV[0]+(closerV[0]-currentV[0])*newPosPerc;vX=iX;iY=currentV[1]-(currentV[1]-closerV[1])*newPosPerc;vY=iY;oX=vX-(vX-currentV[0])*roundCorner;oY=vY-(vY-currentV[1])*roundCorner;clonedPath.setTripleAt(vX,vY,oX,oY,iX,iY,index);index+=1;if(i===len-1){closerV=path.v[0];}else{closerV=path.v[i+1];}distance=Math.sqrt(Math.pow(currentV[0]-closerV[0],2)+Math.pow(currentV[1]-closerV[1],2));newPosPerc=distance?Math.min(distance/2,round)/distance:0;oX=currentV[0]+(closerV[0]-currentV[0])*newPosPerc;vX=oX;oY=currentV[1]+(closerV[1]-currentV[1])*newPosPerc;vY=oY;iX=vX-(vX-currentV[0])*roundCorner;iY=vY-(vY-currentV[1])*roundCorner;clonedPath.setTripleAt(vX,vY,oX,oY,iX,iY,index);index+=1;}}else{clonedPath.setTripleAt(path.v[i][0],path.v[i][1],path.o[i][0],path.o[i][1],path.i[i][0],path.i[i][1],index);index+=1;}}return clonedPath;};RoundCornersModifier.prototype.processShapes=function(_isFirstFrame){var shapePaths;var i;var len=this.shapes.length;var j;var jLen;var rd=this.rd.v;if(rd!==0){var shapeData;var localShapeCollection;for(i=0;i<len;i+=1){shapeData=this.shapes[i];localShapeCollection=shapeData.localShapeCollection;if(!(!shapeData.shape._mdf&&!this._mdf&&!_isFirstFrame)){localShapeCollection.releaseShapes();shapeData.shape._mdf=true;shapePaths=shapeData.shape.paths.shapes;jLen=shapeData.shape.paths._length;for(j=0;j<jLen;j+=1){localShapeCollection.addShape(this.processPath(shapePaths[j],rd));}}shapeData.shape.paths=shapeData.localShapeCollection;}}if(!this.dynamicProperties.length){this._mdf=false;}};function getFontProperties(fontData){var styles=fontData.fStyle?fontData.fStyle.split(' '):[];var fWeight='normal';var fStyle='normal';var len=styles.length;var styleName;for(var i=0;i<len;i+=1){styleName=styles[i].toLowerCase();switch(styleName){case'italic':fStyle='italic';break;case'bold':fWeight='700';break;case'black':fWeight='900';break;case'medium':fWeight='500';break;case'regular':case'normal':fWeight='400';break;case'light':case'thin':fWeight='200';break;default:break;}}return {style:fStyle,weight:fontData.fWeight||fWeight};}var FontManager=function(){var maxWaitingTime=5000;var emptyChar={w:0,size:0,shapes:[],data:{shapes:[]}};var combinedCharacters=[];// Hindi characters
	combinedCharacters=combinedCharacters.concat([2304,2305,2306,2307,2362,2363,2364,2364,2366,2367,2368,2369,2370,2371,2372,2373,2374,2375,2376,2377,2378,2379,2380,2381,2382,2383,2387,2388,2389,2390,2391,2402,2403]);var surrogateModifiers=['d83cdffb','d83cdffc','d83cdffd','d83cdffe','d83cdfff'];var zeroWidthJoiner=[65039,8205];function trimFontOptions(font){var familyArray=font.split(',');var i;var len=familyArray.length;var enabledFamilies=[];for(i=0;i<len;i+=1){if(familyArray[i]!=='sans-serif'&&familyArray[i]!=='monospace'){enabledFamilies.push(familyArray[i]);}}return enabledFamilies.join(',');}function setUpNode(font,family){var parentNode=createTag('span');// Node is invisible to screen readers.
	parentNode.setAttribute('aria-hidden',true);parentNode.style.fontFamily=family;var node=createTag('span');// Characters that vary significantly among different fonts
	node.innerText='giItT1WQy@!-/#';// Visible - so we can measure it - but not on the screen
	parentNode.style.position='absolute';parentNode.style.left='-10000px';parentNode.style.top='-10000px';// Large font size makes even subtle changes obvious
	parentNode.style.fontSize='300px';// Reset any font properties
	parentNode.style.fontVariant='normal';parentNode.style.fontStyle='normal';parentNode.style.fontWeight='normal';parentNode.style.letterSpacing='0';parentNode.appendChild(node);document.body.appendChild(parentNode);// Remember width with no applied web font
	var width=node.offsetWidth;node.style.fontFamily=trimFontOptions(font)+', '+family;return {node:node,w:width,parent:parentNode};}function checkLoadedFonts(){var i;var len=this.fonts.length;var node;var w;var loadedCount=len;for(i=0;i<len;i+=1){if(this.fonts[i].loaded){loadedCount-=1;}else if(this.fonts[i].fOrigin==='n'||this.fonts[i].origin===0){this.fonts[i].loaded=true;}else{node=this.fonts[i].monoCase.node;w=this.fonts[i].monoCase.w;if(node.offsetWidth!==w){loadedCount-=1;this.fonts[i].loaded=true;}else{node=this.fonts[i].sansCase.node;w=this.fonts[i].sansCase.w;if(node.offsetWidth!==w){loadedCount-=1;this.fonts[i].loaded=true;}}if(this.fonts[i].loaded){this.fonts[i].sansCase.parent.parentNode.removeChild(this.fonts[i].sansCase.parent);this.fonts[i].monoCase.parent.parentNode.removeChild(this.fonts[i].monoCase.parent);}}}if(loadedCount!==0&&Date.now()-this.initTime<maxWaitingTime){setTimeout(this.checkLoadedFontsBinded,20);}else{setTimeout(this.setIsLoadedBinded,10);}}function createHelper(fontData,def){var engine=document.body&&def?'svg':'canvas';var helper;var fontProps=getFontProperties(fontData);if(engine==='svg'){var tHelper=createNS('text');tHelper.style.fontSize='100px';// tHelper.style.fontFamily = fontData.fFamily;
	tHelper.setAttribute('font-family',fontData.fFamily);tHelper.setAttribute('font-style',fontProps.style);tHelper.setAttribute('font-weight',fontProps.weight);tHelper.textContent='1';if(fontData.fClass){tHelper.style.fontFamily='inherit';tHelper.setAttribute('class',fontData.fClass);}else{tHelper.style.fontFamily=fontData.fFamily;}def.appendChild(tHelper);helper=tHelper;}else{var tCanvasHelper=new OffscreenCanvas(500,500).getContext('2d');tCanvasHelper.font=fontProps.style+' '+fontProps.weight+' 100px '+fontData.fFamily;helper=tCanvasHelper;}function measure(text){if(engine==='svg'){helper.textContent=text;return helper.getComputedTextLength();}return helper.measureText(text).width;}return {measureText:measure};}function addFonts(fontData,defs){if(!fontData){this.isLoaded=true;return;}if(this.chars){this.isLoaded=true;this.fonts=fontData.list;return;}if(!document.body){this.isLoaded=true;fontData.list.forEach(function(data){data.helper=createHelper(data);data.cache={};});this.fonts=fontData.list;return;}var fontArr=fontData.list;var i;var len=fontArr.length;var _pendingFonts=len;for(i=0;i<len;i+=1){var shouldLoadFont=true;var loadedSelector;var j;fontArr[i].loaded=false;fontArr[i].monoCase=setUpNode(fontArr[i].fFamily,'monospace');fontArr[i].sansCase=setUpNode(fontArr[i].fFamily,'sans-serif');if(!fontArr[i].fPath){fontArr[i].loaded=true;_pendingFonts-=1;}else if(fontArr[i].fOrigin==='p'||fontArr[i].origin===3){loadedSelector=document.querySelectorAll('style[f-forigin="p"][f-family="'+fontArr[i].fFamily+'"], style[f-origin="3"][f-family="'+fontArr[i].fFamily+'"]');if(loadedSelector.length>0){shouldLoadFont=false;}if(shouldLoadFont){var s=createTag('style');s.setAttribute('f-forigin',fontArr[i].fOrigin);s.setAttribute('f-origin',fontArr[i].origin);s.setAttribute('f-family',fontArr[i].fFamily);s.type='text/css';s.innerText='@font-face {font-family: '+fontArr[i].fFamily+"; font-style: normal; src: url('"+fontArr[i].fPath+"');}";defs.appendChild(s);}}else if(fontArr[i].fOrigin==='g'||fontArr[i].origin===1){loadedSelector=document.querySelectorAll('link[f-forigin="g"], link[f-origin="1"]');for(j=0;j<loadedSelector.length;j+=1){if(loadedSelector[j].href.indexOf(fontArr[i].fPath)!==-1){// Font is already loaded
	shouldLoadFont=false;}}if(shouldLoadFont){var l=createTag('link');l.setAttribute('f-forigin',fontArr[i].fOrigin);l.setAttribute('f-origin',fontArr[i].origin);l.type='text/css';l.rel='stylesheet';l.href=fontArr[i].fPath;document.body.appendChild(l);}}else if(fontArr[i].fOrigin==='t'||fontArr[i].origin===2){loadedSelector=document.querySelectorAll('script[f-forigin="t"], script[f-origin="2"]');for(j=0;j<loadedSelector.length;j+=1){if(fontArr[i].fPath===loadedSelector[j].src){// Font is already loaded
	shouldLoadFont=false;}}if(shouldLoadFont){var sc=createTag('link');sc.setAttribute('f-forigin',fontArr[i].fOrigin);sc.setAttribute('f-origin',fontArr[i].origin);sc.setAttribute('rel','stylesheet');sc.setAttribute('href',fontArr[i].fPath);defs.appendChild(sc);}}fontArr[i].helper=createHelper(fontArr[i],defs);fontArr[i].cache={};this.fonts.push(fontArr[i]);}if(_pendingFonts===0){this.isLoaded=true;}else{// On some cases even if the font is loaded, it won't load correctly when measuring text on canvas.
	// Adding this timeout seems to fix it
	setTimeout(this.checkLoadedFonts.bind(this),100);}}function addChars(chars){if(!chars){return;}if(!this.chars){this.chars=[];}var i;var len=chars.length;var j;var jLen=this.chars.length;var found;for(i=0;i<len;i+=1){j=0;found=false;while(j<jLen){if(this.chars[j].style===chars[i].style&&this.chars[j].fFamily===chars[i].fFamily&&this.chars[j].ch===chars[i].ch){found=true;}j+=1;}if(!found){this.chars.push(chars[i]);jLen+=1;}}}function getCharData(_char,style,font){var i=0;var len=this.chars.length;while(i<len){if(this.chars[i].ch===_char&&this.chars[i].style===style&&this.chars[i].fFamily===font){return this.chars[i];}i+=1;}if((typeof _char==='string'&&_char.charCodeAt(0)!==13||!_char)&&console&&console.warn// eslint-disable-line no-console
	&&!this._warned){this._warned=true;console.warn('Missing character from exported characters list: ',_char,style,font);// eslint-disable-line no-console
	}return emptyChar;}function measureText(_char2,fontName,size){var fontData=this.getFontByName(fontName);var index=_char2.charCodeAt(0);if(!fontData.cache[index+1]){var tHelper=fontData.helper;if(_char2===' '){var doubleSize=tHelper.measureText('|'+_char2+'|');var singleSize=tHelper.measureText('||');fontData.cache[index+1]=(doubleSize-singleSize)/100;}else{fontData.cache[index+1]=tHelper.measureText(_char2)/100;}}return fontData.cache[index+1]*size;}function getFontByName(name){var i=0;var len=this.fonts.length;while(i<len){if(this.fonts[i].fName===name){return this.fonts[i];}i+=1;}return this.fonts[0];}function isModifier(firstCharCode,secondCharCode){var sum=firstCharCode.toString(16)+secondCharCode.toString(16);return surrogateModifiers.indexOf(sum)!==-1;}function isZeroWidthJoiner(firstCharCode,secondCharCode){if(!secondCharCode){return firstCharCode===zeroWidthJoiner[1];}return firstCharCode===zeroWidthJoiner[0]&&secondCharCode===zeroWidthJoiner[1];}function isCombinedCharacter(_char3){return combinedCharacters.indexOf(_char3)!==-1;}function setIsLoaded(){this.isLoaded=true;}var Font=function Font(){this.fonts=[];this.chars=null;this.typekitLoaded=0;this.isLoaded=false;this._warned=false;this.initTime=Date.now();this.setIsLoadedBinded=this.setIsLoaded.bind(this);this.checkLoadedFontsBinded=this.checkLoadedFonts.bind(this);};Font.isModifier=isModifier;Font.isZeroWidthJoiner=isZeroWidthJoiner;Font.isCombinedCharacter=isCombinedCharacter;var fontPrototype={addChars:addChars,addFonts:addFonts,getCharData:getCharData,getFontByName:getFontByName,measureText:measureText,checkLoadedFonts:checkLoadedFonts,setIsLoaded:setIsLoaded};Font.prototype=fontPrototype;return Font;}();function RenderableElement(){}RenderableElement.prototype={initRenderable:function initRenderable(){// layer's visibility related to inpoint and outpoint. Rename isVisible to isInRange
	this.isInRange=false;// layer's display state
	this.hidden=false;// If layer's transparency equals 0, it can be hidden
	this.isTransparent=false;// list of animated components
	this.renderableComponents=[];},addRenderableComponent:function addRenderableComponent(component){if(this.renderableComponents.indexOf(component)===-1){this.renderableComponents.push(component);}},removeRenderableComponent:function removeRenderableComponent(component){if(this.renderableComponents.indexOf(component)!==-1){this.renderableComponents.splice(this.renderableComponents.indexOf(component),1);}},prepareRenderableFrame:function prepareRenderableFrame(num){this.checkLayerLimits(num);},checkTransparency:function checkTransparency(){if(this.finalTransform.mProp.o.v<=0){if(!this.isTransparent&&this.globalData.renderConfig.hideOnTransparent){this.isTransparent=true;this.hide();}}else if(this.isTransparent){this.isTransparent=false;this.show();}},/**
	       * @function
	       * Initializes frame related properties.
	       *
	       * @param {number} num
	       * current frame number in Layer's time
	       *
	       */checkLayerLimits:function checkLayerLimits(num){if(this.data.ip-this.data.st<=num&&this.data.op-this.data.st>num){if(this.isInRange!==true){this.globalData._mdf=true;this._mdf=true;this.isInRange=true;this.show();}}else if(this.isInRange!==false){this.globalData._mdf=true;this.isInRange=false;this.hide();}},renderRenderable:function renderRenderable(){var i;var len=this.renderableComponents.length;for(i=0;i<len;i+=1){this.renderableComponents[i].renderFrame(this._isFirstFrame);}/* this.maskManager.renderFrame(this.finalTransform.mat);
	          this.renderableEffectsManager.renderFrame(this._isFirstFrame); */},sourceRectAtTime:function sourceRectAtTime(){return {top:0,left:0,width:100,height:100};},getLayerSize:function getLayerSize(){if(this.data.ty===5){return {w:this.data.textData.width,h:this.data.textData.height};}return {w:this.data.width,h:this.data.height};}};var MaskManagerInterface=function(){function MaskInterface(mask,data){this._mask=mask;this._data=data;}Object.defineProperty(MaskInterface.prototype,'maskPath',{get:function get(){if(this._mask.prop.k){this._mask.prop.getValue();}return this._mask.prop;}});Object.defineProperty(MaskInterface.prototype,'maskOpacity',{get:function get(){if(this._mask.op.k){this._mask.op.getValue();}return this._mask.op.v*100;}});var MaskManager=function MaskManager(maskManager){var _masksInterfaces=createSizedArray(maskManager.viewData.length);var i;var len=maskManager.viewData.length;for(i=0;i<len;i+=1){_masksInterfaces[i]=new MaskInterface(maskManager.viewData[i],maskManager.masksProperties[i]);}var maskFunction=function maskFunction(name){i=0;while(i<len){if(maskManager.masksProperties[i].nm===name){return _masksInterfaces[i];}i+=1;}return null;};return maskFunction;};return MaskManager;}();var ExpressionPropertyInterface=function(){var defaultUnidimensionalValue={pv:0,v:0,mult:1};var defaultMultidimensionalValue={pv:[0,0,0],v:[0,0,0],mult:1};function completeProperty(expressionValue,property,type){Object.defineProperty(expressionValue,'velocity',{get:function get(){return property.getVelocityAtTime(property.comp.currentFrame);}});expressionValue.numKeys=property.keyframes?property.keyframes.length:0;expressionValue.key=function(pos){if(!expressionValue.numKeys){return 0;}var value='';if('s'in property.keyframes[pos-1]){value=property.keyframes[pos-1].s;}else if('e'in property.keyframes[pos-2]){value=property.keyframes[pos-2].e;}else{value=property.keyframes[pos-2].s;}var valueProp=type==='unidimensional'?new Number(value):Object.assign({},value);// eslint-disable-line no-new-wrappers
	valueProp.time=property.keyframes[pos-1].t/property.elem.comp.globalData.frameRate;valueProp.value=type==='unidimensional'?value[0]:value;return valueProp;};expressionValue.valueAtTime=property.getValueAtTime;expressionValue.speedAtTime=property.getSpeedAtTime;expressionValue.velocityAtTime=property.getVelocityAtTime;expressionValue.propertyGroup=property.propertyGroup;}function UnidimensionalPropertyInterface(property){if(!property||!('pv'in property)){property=defaultUnidimensionalValue;}var mult=1/property.mult;var val=property.pv*mult;var expressionValue=new Number(val);// eslint-disable-line no-new-wrappers
	expressionValue.value=val;completeProperty(expressionValue,property,'unidimensional');return function(){if(property.k){property.getValue();}val=property.v*mult;if(expressionValue.value!==val){expressionValue=new Number(val);// eslint-disable-line no-new-wrappers
	expressionValue.value=val;completeProperty(expressionValue,property,'unidimensional');}return expressionValue;};}function MultidimensionalPropertyInterface(property){if(!property||!('pv'in property)){property=defaultMultidimensionalValue;}var mult=1/property.mult;var len=property.data&&property.data.l||property.pv.length;var expressionValue=createTypedArray('float32',len);var arrValue=createTypedArray('float32',len);expressionValue.value=arrValue;completeProperty(expressionValue,property,'multidimensional');return function(){if(property.k){property.getValue();}for(var i=0;i<len;i+=1){arrValue[i]=property.v[i]*mult;expressionValue[i]=arrValue[i];}return expressionValue;};}// TODO: try to avoid using this getter
	function defaultGetter(){return defaultUnidimensionalValue;}return function(property){if(!property){return defaultGetter;}if(property.propType==='unidimensional'){return UnidimensionalPropertyInterface(property);}return MultidimensionalPropertyInterface(property);};}();var TransformExpressionInterface=function(){return function(transform){function _thisFunction(name){switch(name){case'scale':case'Scale':case'ADBE Scale':case 6:return _thisFunction.scale;case'rotation':case'Rotation':case'ADBE Rotation':case'ADBE Rotate Z':case 10:return _thisFunction.rotation;case'ADBE Rotate X':return _thisFunction.xRotation;case'ADBE Rotate Y':return _thisFunction.yRotation;case'position':case'Position':case'ADBE Position':case 2:return _thisFunction.position;case'ADBE Position_0':return _thisFunction.xPosition;case'ADBE Position_1':return _thisFunction.yPosition;case'ADBE Position_2':return _thisFunction.zPosition;case'anchorPoint':case'AnchorPoint':case'Anchor Point':case'ADBE AnchorPoint':case 1:return _thisFunction.anchorPoint;case'opacity':case'Opacity':case 11:return _thisFunction.opacity;default:return null;}}Object.defineProperty(_thisFunction,'rotation',{get:ExpressionPropertyInterface(transform.r||transform.rz)});Object.defineProperty(_thisFunction,'zRotation',{get:ExpressionPropertyInterface(transform.rz||transform.r)});Object.defineProperty(_thisFunction,'xRotation',{get:ExpressionPropertyInterface(transform.rx)});Object.defineProperty(_thisFunction,'yRotation',{get:ExpressionPropertyInterface(transform.ry)});Object.defineProperty(_thisFunction,'scale',{get:ExpressionPropertyInterface(transform.s)});var _px;var _py;var _pz;var _transformFactory;if(transform.p){_transformFactory=ExpressionPropertyInterface(transform.p);}else{_px=ExpressionPropertyInterface(transform.px);_py=ExpressionPropertyInterface(transform.py);if(transform.pz){_pz=ExpressionPropertyInterface(transform.pz);}}Object.defineProperty(_thisFunction,'position',{get:function get(){if(transform.p){return _transformFactory();}return [_px(),_py(),_pz?_pz():0];}});Object.defineProperty(_thisFunction,'xPosition',{get:ExpressionPropertyInterface(transform.px)});Object.defineProperty(_thisFunction,'yPosition',{get:ExpressionPropertyInterface(transform.py)});Object.defineProperty(_thisFunction,'zPosition',{get:ExpressionPropertyInterface(transform.pz)});Object.defineProperty(_thisFunction,'anchorPoint',{get:ExpressionPropertyInterface(transform.a)});Object.defineProperty(_thisFunction,'opacity',{get:ExpressionPropertyInterface(transform.o)});Object.defineProperty(_thisFunction,'skew',{get:ExpressionPropertyInterface(transform.sk)});Object.defineProperty(_thisFunction,'skewAxis',{get:ExpressionPropertyInterface(transform.sa)});Object.defineProperty(_thisFunction,'orientation',{get:ExpressionPropertyInterface(transform.or)});return _thisFunction;};}();var LayerExpressionInterface=function(){function getMatrix(time){var toWorldMat=new Matrix();if(time!==undefined){var propMatrix=this._elem.finalTransform.mProp.getValueAtTime(time);propMatrix.clone(toWorldMat);}else{var transformMat=this._elem.finalTransform.mProp;transformMat.applyToMatrix(toWorldMat);}return toWorldMat;}function toWorldVec(arr,time){var toWorldMat=this.getMatrix(time);toWorldMat.props[12]=0;toWorldMat.props[13]=0;toWorldMat.props[14]=0;return this.applyPoint(toWorldMat,arr);}function toWorld(arr,time){var toWorldMat=this.getMatrix(time);return this.applyPoint(toWorldMat,arr);}function fromWorldVec(arr,time){var toWorldMat=this.getMatrix(time);toWorldMat.props[12]=0;toWorldMat.props[13]=0;toWorldMat.props[14]=0;return this.invertPoint(toWorldMat,arr);}function fromWorld(arr,time){var toWorldMat=this.getMatrix(time);return this.invertPoint(toWorldMat,arr);}function applyPoint(matrix,arr){if(this._elem.hierarchy&&this._elem.hierarchy.length){var i;var len=this._elem.hierarchy.length;for(i=0;i<len;i+=1){this._elem.hierarchy[i].finalTransform.mProp.applyToMatrix(matrix);}}return matrix.applyToPointArray(arr[0],arr[1],arr[2]||0);}function invertPoint(matrix,arr){if(this._elem.hierarchy&&this._elem.hierarchy.length){var i;var len=this._elem.hierarchy.length;for(i=0;i<len;i+=1){this._elem.hierarchy[i].finalTransform.mProp.applyToMatrix(matrix);}}return matrix.inversePoint(arr);}function fromComp(arr){var toWorldMat=new Matrix();toWorldMat.reset();this._elem.finalTransform.mProp.applyToMatrix(toWorldMat);if(this._elem.hierarchy&&this._elem.hierarchy.length){var i;var len=this._elem.hierarchy.length;for(i=0;i<len;i+=1){this._elem.hierarchy[i].finalTransform.mProp.applyToMatrix(toWorldMat);}return toWorldMat.inversePoint(arr);}return toWorldMat.inversePoint(arr);}function sampleImage(){return [1,1,1,1];}return function(elem){var transformInterface;function _registerMaskInterface(maskManager){_thisLayerFunction.mask=new MaskManagerInterface(maskManager,elem);}function _registerEffectsInterface(effects){_thisLayerFunction.effect=effects;}function _thisLayerFunction(name){switch(name){case'ADBE Root Vectors Group':case'Contents':case 2:return _thisLayerFunction.shapeInterface;case 1:case 6:case'Transform':case'transform':case'ADBE Transform Group':return transformInterface;case 4:case'ADBE Effect Parade':case'effects':case'Effects':return _thisLayerFunction.effect;case'ADBE Text Properties':return _thisLayerFunction.textInterface;default:return null;}}_thisLayerFunction.getMatrix=getMatrix;_thisLayerFunction.invertPoint=invertPoint;_thisLayerFunction.applyPoint=applyPoint;_thisLayerFunction.toWorld=toWorld;_thisLayerFunction.toWorldVec=toWorldVec;_thisLayerFunction.fromWorld=fromWorld;_thisLayerFunction.fromWorldVec=fromWorldVec;_thisLayerFunction.toComp=toWorld;_thisLayerFunction.fromComp=fromComp;_thisLayerFunction.sampleImage=sampleImage;_thisLayerFunction.sourceRectAtTime=elem.sourceRectAtTime.bind(elem);_thisLayerFunction._elem=elem;transformInterface=TransformExpressionInterface(elem.finalTransform.mProp);var anchorPointDescriptor=getDescriptor(transformInterface,'anchorPoint');Object.defineProperties(_thisLayerFunction,{hasParent:{get:function get(){return elem.hierarchy.length;}},parent:{get:function get(){return elem.hierarchy[0].layerInterface;}},rotation:getDescriptor(transformInterface,'rotation'),scale:getDescriptor(transformInterface,'scale'),position:getDescriptor(transformInterface,'position'),opacity:getDescriptor(transformInterface,'opacity'),anchorPoint:anchorPointDescriptor,anchor_point:anchorPointDescriptor,transform:{get:function get(){return transformInterface;}},active:{get:function get(){return elem.isInRange;}}});_thisLayerFunction.startTime=elem.data.st;_thisLayerFunction.index=elem.data.ind;_thisLayerFunction.source=elem.data.refId;_thisLayerFunction.height=elem.data.ty===0?elem.data.h:100;_thisLayerFunction.width=elem.data.ty===0?elem.data.w:100;_thisLayerFunction.inPoint=elem.data.ip/elem.comp.globalData.frameRate;_thisLayerFunction.outPoint=elem.data.op/elem.comp.globalData.frameRate;_thisLayerFunction._name=elem.data.nm;_thisLayerFunction.registerMaskInterface=_registerMaskInterface;_thisLayerFunction.registerEffectsInterface=_registerEffectsInterface;return _thisLayerFunction;};}();var propertyGroupFactory=function(){return function(interfaceFunction,parentPropertyGroup){return function(val){val=val===undefined?1:val;if(val<=0){return interfaceFunction;}return parentPropertyGroup(val-1);};};}();var PropertyInterface=function(){return function(propertyName,propertyGroup){var interfaceFunction={_name:propertyName};function _propertyGroup(val){val=val===undefined?1:val;if(val<=0){return interfaceFunction;}return propertyGroup(val-1);}return _propertyGroup;};}();var EffectsExpressionInterface=function(){var ob={createEffectsInterface:createEffectsInterface};function createEffectsInterface(elem,propertyGroup){if(elem.effectsManager){var effectElements=[];var effectsData=elem.data.ef;var i;var len=elem.effectsManager.effectElements.length;for(i=0;i<len;i+=1){effectElements.push(createGroupInterface(effectsData[i],elem.effectsManager.effectElements[i],propertyGroup,elem));}var effects=elem.data.ef||[];var groupInterface=function groupInterface(name){i=0;len=effects.length;while(i<len){if(name===effects[i].nm||name===effects[i].mn||name===effects[i].ix){return effectElements[i];}i+=1;}return null;};Object.defineProperty(groupInterface,'numProperties',{get:function get(){return effects.length;}});return groupInterface;}return null;}function createGroupInterface(data,elements,propertyGroup,elem){function groupInterface(name){var effects=data.ef;var i=0;var len=effects.length;while(i<len){if(name===effects[i].nm||name===effects[i].mn||name===effects[i].ix){if(effects[i].ty===5){return effectElements[i];}return effectElements[i]();}i+=1;}throw new Error();}var _propertyGroup=propertyGroupFactory(groupInterface,propertyGroup);var effectElements=[];var i;var len=data.ef.length;for(i=0;i<len;i+=1){if(data.ef[i].ty===5){effectElements.push(createGroupInterface(data.ef[i],elements.effectElements[i],elements.effectElements[i].propertyGroup,elem));}else{effectElements.push(createValueInterface(elements.effectElements[i],data.ef[i].ty,elem,_propertyGroup));}}if(data.mn==='ADBE Color Control'){Object.defineProperty(groupInterface,'color',{get:function get(){return effectElements[0]();}});}Object.defineProperties(groupInterface,{numProperties:{get:function get(){return data.np;}},_name:{value:data.nm},propertyGroup:{value:_propertyGroup}});groupInterface.enabled=data.en!==0;groupInterface.active=groupInterface.enabled;return groupInterface;}function createValueInterface(element,type,elem,propertyGroup){var expressionProperty=ExpressionPropertyInterface(element.p);function interfaceFunction(){if(type===10){return elem.comp.compInterface(element.p.v);}return expressionProperty();}if(element.p.setGroupProperty){element.p.setGroupProperty(PropertyInterface('',propertyGroup));}return interfaceFunction;}return ob;}();var CompExpressionInterface=function(){return function(comp){function _thisLayerFunction(name){var i=0;var len=comp.layers.length;while(i<len){if(comp.layers[i].nm===name||comp.layers[i].ind===name){return comp.elements[i].layerInterface;}i+=1;}return null;// return {active:false};
	}Object.defineProperty(_thisLayerFunction,'_name',{value:comp.data.nm});_thisLayerFunction.layer=_thisLayerFunction;_thisLayerFunction.pixelAspect=1;_thisLayerFunction.height=comp.data.h||comp.globalData.compSize.h;_thisLayerFunction.width=comp.data.w||comp.globalData.compSize.w;_thisLayerFunction.pixelAspect=1;_thisLayerFunction.frameDuration=1/comp.globalData.frameRate;_thisLayerFunction.displayStartTime=0;_thisLayerFunction.numLayers=comp.layers.length;return _thisLayerFunction;};}();var ShapePathInterface=function(){return function pathInterfaceFactory(shape,view,propertyGroup){var prop=view.sh;function interfaceFunction(val){if(val==='Shape'||val==='shape'||val==='Path'||val==='path'||val==='ADBE Vector Shape'||val===2){return interfaceFunction.path;}return null;}var _propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);prop.setGroupProperty(PropertyInterface('Path',_propertyGroup));Object.defineProperties(interfaceFunction,{path:{get:function get(){if(prop.k){prop.getValue();}return prop;}},shape:{get:function get(){if(prop.k){prop.getValue();}return prop;}},_name:{value:shape.nm},ix:{value:shape.ix},propertyIndex:{value:shape.ix},mn:{value:shape.mn},propertyGroup:{value:propertyGroup}});return interfaceFunction;};}();var ShapeExpressionInterface=function(){function iterateElements(shapes,view,propertyGroup){var arr=[];var i;var len=shapes?shapes.length:0;for(i=0;i<len;i+=1){if(shapes[i].ty==='gr'){arr.push(groupInterfaceFactory(shapes[i],view[i],propertyGroup));}else if(shapes[i].ty==='fl'){arr.push(fillInterfaceFactory(shapes[i],view[i],propertyGroup));}else if(shapes[i].ty==='st'){arr.push(strokeInterfaceFactory(shapes[i],view[i],propertyGroup));}else if(shapes[i].ty==='tm'){arr.push(trimInterfaceFactory(shapes[i],view[i],propertyGroup));}else if(shapes[i].ty==='tr');else if(shapes[i].ty==='el'){arr.push(ellipseInterfaceFactory(shapes[i],view[i],propertyGroup));}else if(shapes[i].ty==='sr'){arr.push(starInterfaceFactory(shapes[i],view[i],propertyGroup));}else if(shapes[i].ty==='sh'){arr.push(ShapePathInterface(shapes[i],view[i],propertyGroup));}else if(shapes[i].ty==='rc'){arr.push(rectInterfaceFactory(shapes[i],view[i],propertyGroup));}else if(shapes[i].ty==='rd'){arr.push(roundedInterfaceFactory(shapes[i],view[i],propertyGroup));}else if(shapes[i].ty==='rp'){arr.push(repeaterInterfaceFactory(shapes[i],view[i],propertyGroup));}else if(shapes[i].ty==='gf'){arr.push(gradientFillInterfaceFactory(shapes[i],view[i],propertyGroup));}else{arr.push(defaultInterfaceFactory(shapes[i],view[i],propertyGroup));}}return arr;}function contentsInterfaceFactory(shape,view,propertyGroup){var interfaces;var interfaceFunction=function _interfaceFunction(value){var i=0;var len=interfaces.length;while(i<len){if(interfaces[i]._name===value||interfaces[i].mn===value||interfaces[i].propertyIndex===value||interfaces[i].ix===value||interfaces[i].ind===value){return interfaces[i];}i+=1;}if(typeof value==='number'){return interfaces[value-1];}return null;};interfaceFunction.propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);interfaces=iterateElements(shape.it,view.it,interfaceFunction.propertyGroup);interfaceFunction.numProperties=interfaces.length;var transformInterface=transformInterfaceFactory(shape.it[shape.it.length-1],view.it[view.it.length-1],interfaceFunction.propertyGroup);interfaceFunction.transform=transformInterface;interfaceFunction.propertyIndex=shape.cix;interfaceFunction._name=shape.nm;return interfaceFunction;}function groupInterfaceFactory(shape,view,propertyGroup){var interfaceFunction=function _interfaceFunction(value){switch(value){case'ADBE Vectors Group':case'Contents':case 2:return interfaceFunction.content;// Not necessary for now. Keeping them here in case a new case appears
	// case 'ADBE Vector Transform Group':
	// case 3:
	default:return interfaceFunction.transform;}};interfaceFunction.propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);var content=contentsInterfaceFactory(shape,view,interfaceFunction.propertyGroup);var transformInterface=transformInterfaceFactory(shape.it[shape.it.length-1],view.it[view.it.length-1],interfaceFunction.propertyGroup);interfaceFunction.content=content;interfaceFunction.transform=transformInterface;Object.defineProperty(interfaceFunction,'_name',{get:function get(){return shape.nm;}});// interfaceFunction.content = interfaceFunction;
	interfaceFunction.numProperties=shape.np;interfaceFunction.propertyIndex=shape.ix;interfaceFunction.nm=shape.nm;interfaceFunction.mn=shape.mn;return interfaceFunction;}function fillInterfaceFactory(shape,view,propertyGroup){function interfaceFunction(val){if(val==='Color'||val==='color'){return interfaceFunction.color;}if(val==='Opacity'||val==='opacity'){return interfaceFunction.opacity;}return null;}Object.defineProperties(interfaceFunction,{color:{get:ExpressionPropertyInterface(view.c)},opacity:{get:ExpressionPropertyInterface(view.o)},_name:{value:shape.nm},mn:{value:shape.mn}});view.c.setGroupProperty(PropertyInterface('Color',propertyGroup));view.o.setGroupProperty(PropertyInterface('Opacity',propertyGroup));return interfaceFunction;}function gradientFillInterfaceFactory(shape,view,propertyGroup){function interfaceFunction(val){if(val==='Start Point'||val==='start point'){return interfaceFunction.startPoint;}if(val==='End Point'||val==='end point'){return interfaceFunction.endPoint;}if(val==='Opacity'||val==='opacity'){return interfaceFunction.opacity;}return null;}Object.defineProperties(interfaceFunction,{startPoint:{get:ExpressionPropertyInterface(view.s)},endPoint:{get:ExpressionPropertyInterface(view.e)},opacity:{get:ExpressionPropertyInterface(view.o)},type:{get:function get(){return 'a';}},_name:{value:shape.nm},mn:{value:shape.mn}});view.s.setGroupProperty(PropertyInterface('Start Point',propertyGroup));view.e.setGroupProperty(PropertyInterface('End Point',propertyGroup));view.o.setGroupProperty(PropertyInterface('Opacity',propertyGroup));return interfaceFunction;}function defaultInterfaceFactory(){function interfaceFunction(){return null;}return interfaceFunction;}function strokeInterfaceFactory(shape,view,propertyGroup){var _propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);var _dashPropertyGroup=propertyGroupFactory(dashOb,_propertyGroup);function addPropertyToDashOb(i){Object.defineProperty(dashOb,shape.d[i].nm,{get:ExpressionPropertyInterface(view.d.dataProps[i].p)});}var i;var len=shape.d?shape.d.length:0;var dashOb={};for(i=0;i<len;i+=1){addPropertyToDashOb(i);view.d.dataProps[i].p.setGroupProperty(_dashPropertyGroup);}function interfaceFunction(val){if(val==='Color'||val==='color'){return interfaceFunction.color;}if(val==='Opacity'||val==='opacity'){return interfaceFunction.opacity;}if(val==='Stroke Width'||val==='stroke width'){return interfaceFunction.strokeWidth;}return null;}Object.defineProperties(interfaceFunction,{color:{get:ExpressionPropertyInterface(view.c)},opacity:{get:ExpressionPropertyInterface(view.o)},strokeWidth:{get:ExpressionPropertyInterface(view.w)},dash:{get:function get(){return dashOb;}},_name:{value:shape.nm},mn:{value:shape.mn}});view.c.setGroupProperty(PropertyInterface('Color',_propertyGroup));view.o.setGroupProperty(PropertyInterface('Opacity',_propertyGroup));view.w.setGroupProperty(PropertyInterface('Stroke Width',_propertyGroup));return interfaceFunction;}function trimInterfaceFactory(shape,view,propertyGroup){function interfaceFunction(val){if(val===shape.e.ix||val==='End'||val==='end'){return interfaceFunction.end;}if(val===shape.s.ix){return interfaceFunction.start;}if(val===shape.o.ix){return interfaceFunction.offset;}return null;}var _propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);interfaceFunction.propertyIndex=shape.ix;view.s.setGroupProperty(PropertyInterface('Start',_propertyGroup));view.e.setGroupProperty(PropertyInterface('End',_propertyGroup));view.o.setGroupProperty(PropertyInterface('Offset',_propertyGroup));interfaceFunction.propertyIndex=shape.ix;interfaceFunction.propertyGroup=propertyGroup;Object.defineProperties(interfaceFunction,{start:{get:ExpressionPropertyInterface(view.s)},end:{get:ExpressionPropertyInterface(view.e)},offset:{get:ExpressionPropertyInterface(view.o)},_name:{value:shape.nm}});interfaceFunction.mn=shape.mn;return interfaceFunction;}function transformInterfaceFactory(shape,view,propertyGroup){function interfaceFunction(value){if(shape.a.ix===value||value==='Anchor Point'){return interfaceFunction.anchorPoint;}if(shape.o.ix===value||value==='Opacity'){return interfaceFunction.opacity;}if(shape.p.ix===value||value==='Position'){return interfaceFunction.position;}if(shape.r.ix===value||value==='Rotation'||value==='ADBE Vector Rotation'){return interfaceFunction.rotation;}if(shape.s.ix===value||value==='Scale'){return interfaceFunction.scale;}if(shape.sk&&shape.sk.ix===value||value==='Skew'){return interfaceFunction.skew;}if(shape.sa&&shape.sa.ix===value||value==='Skew Axis'){return interfaceFunction.skewAxis;}return null;}var _propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);view.transform.mProps.o.setGroupProperty(PropertyInterface('Opacity',_propertyGroup));view.transform.mProps.p.setGroupProperty(PropertyInterface('Position',_propertyGroup));view.transform.mProps.a.setGroupProperty(PropertyInterface('Anchor Point',_propertyGroup));view.transform.mProps.s.setGroupProperty(PropertyInterface('Scale',_propertyGroup));view.transform.mProps.r.setGroupProperty(PropertyInterface('Rotation',_propertyGroup));if(view.transform.mProps.sk){view.transform.mProps.sk.setGroupProperty(PropertyInterface('Skew',_propertyGroup));view.transform.mProps.sa.setGroupProperty(PropertyInterface('Skew Angle',_propertyGroup));}view.transform.op.setGroupProperty(PropertyInterface('Opacity',_propertyGroup));Object.defineProperties(interfaceFunction,{opacity:{get:ExpressionPropertyInterface(view.transform.mProps.o)},position:{get:ExpressionPropertyInterface(view.transform.mProps.p)},anchorPoint:{get:ExpressionPropertyInterface(view.transform.mProps.a)},scale:{get:ExpressionPropertyInterface(view.transform.mProps.s)},rotation:{get:ExpressionPropertyInterface(view.transform.mProps.r)},skew:{get:ExpressionPropertyInterface(view.transform.mProps.sk)},skewAxis:{get:ExpressionPropertyInterface(view.transform.mProps.sa)},_name:{value:shape.nm}});interfaceFunction.ty='tr';interfaceFunction.mn=shape.mn;interfaceFunction.propertyGroup=propertyGroup;return interfaceFunction;}function ellipseInterfaceFactory(shape,view,propertyGroup){function interfaceFunction(value){if(shape.p.ix===value){return interfaceFunction.position;}if(shape.s.ix===value){return interfaceFunction.size;}return null;}var _propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);interfaceFunction.propertyIndex=shape.ix;var prop=view.sh.ty==='tm'?view.sh.prop:view.sh;prop.s.setGroupProperty(PropertyInterface('Size',_propertyGroup));prop.p.setGroupProperty(PropertyInterface('Position',_propertyGroup));Object.defineProperties(interfaceFunction,{size:{get:ExpressionPropertyInterface(prop.s)},position:{get:ExpressionPropertyInterface(prop.p)},_name:{value:shape.nm}});interfaceFunction.mn=shape.mn;return interfaceFunction;}function starInterfaceFactory(shape,view,propertyGroup){function interfaceFunction(value){if(shape.p.ix===value){return interfaceFunction.position;}if(shape.r.ix===value){return interfaceFunction.rotation;}if(shape.pt.ix===value){return interfaceFunction.points;}if(shape.or.ix===value||value==='ADBE Vector Star Outer Radius'){return interfaceFunction.outerRadius;}if(shape.os.ix===value){return interfaceFunction.outerRoundness;}if(shape.ir&&(shape.ir.ix===value||value==='ADBE Vector Star Inner Radius')){return interfaceFunction.innerRadius;}if(shape.is&&shape.is.ix===value){return interfaceFunction.innerRoundness;}return null;}var _propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);var prop=view.sh.ty==='tm'?view.sh.prop:view.sh;interfaceFunction.propertyIndex=shape.ix;prop.or.setGroupProperty(PropertyInterface('Outer Radius',_propertyGroup));prop.os.setGroupProperty(PropertyInterface('Outer Roundness',_propertyGroup));prop.pt.setGroupProperty(PropertyInterface('Points',_propertyGroup));prop.p.setGroupProperty(PropertyInterface('Position',_propertyGroup));prop.r.setGroupProperty(PropertyInterface('Rotation',_propertyGroup));if(shape.ir){prop.ir.setGroupProperty(PropertyInterface('Inner Radius',_propertyGroup));prop.is.setGroupProperty(PropertyInterface('Inner Roundness',_propertyGroup));}Object.defineProperties(interfaceFunction,{position:{get:ExpressionPropertyInterface(prop.p)},rotation:{get:ExpressionPropertyInterface(prop.r)},points:{get:ExpressionPropertyInterface(prop.pt)},outerRadius:{get:ExpressionPropertyInterface(prop.or)},outerRoundness:{get:ExpressionPropertyInterface(prop.os)},innerRadius:{get:ExpressionPropertyInterface(prop.ir)},innerRoundness:{get:ExpressionPropertyInterface(prop.is)},_name:{value:shape.nm}});interfaceFunction.mn=shape.mn;return interfaceFunction;}function rectInterfaceFactory(shape,view,propertyGroup){function interfaceFunction(value){if(shape.p.ix===value){return interfaceFunction.position;}if(shape.r.ix===value){return interfaceFunction.roundness;}if(shape.s.ix===value||value==='Size'||value==='ADBE Vector Rect Size'){return interfaceFunction.size;}return null;}var _propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);var prop=view.sh.ty==='tm'?view.sh.prop:view.sh;interfaceFunction.propertyIndex=shape.ix;prop.p.setGroupProperty(PropertyInterface('Position',_propertyGroup));prop.s.setGroupProperty(PropertyInterface('Size',_propertyGroup));prop.r.setGroupProperty(PropertyInterface('Rotation',_propertyGroup));Object.defineProperties(interfaceFunction,{position:{get:ExpressionPropertyInterface(prop.p)},roundness:{get:ExpressionPropertyInterface(prop.r)},size:{get:ExpressionPropertyInterface(prop.s)},_name:{value:shape.nm}});interfaceFunction.mn=shape.mn;return interfaceFunction;}function roundedInterfaceFactory(shape,view,propertyGroup){function interfaceFunction(value){if(shape.r.ix===value||value==='Round Corners 1'){return interfaceFunction.radius;}return null;}var _propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);var prop=view;interfaceFunction.propertyIndex=shape.ix;prop.rd.setGroupProperty(PropertyInterface('Radius',_propertyGroup));Object.defineProperties(interfaceFunction,{radius:{get:ExpressionPropertyInterface(prop.rd)},_name:{value:shape.nm}});interfaceFunction.mn=shape.mn;return interfaceFunction;}function repeaterInterfaceFactory(shape,view,propertyGroup){function interfaceFunction(value){if(shape.c.ix===value||value==='Copies'){return interfaceFunction.copies;}if(shape.o.ix===value||value==='Offset'){return interfaceFunction.offset;}return null;}var _propertyGroup=propertyGroupFactory(interfaceFunction,propertyGroup);var prop=view;interfaceFunction.propertyIndex=shape.ix;prop.c.setGroupProperty(PropertyInterface('Copies',_propertyGroup));prop.o.setGroupProperty(PropertyInterface('Offset',_propertyGroup));Object.defineProperties(interfaceFunction,{copies:{get:ExpressionPropertyInterface(prop.c)},offset:{get:ExpressionPropertyInterface(prop.o)},_name:{value:shape.nm}});interfaceFunction.mn=shape.mn;return interfaceFunction;}return function(shapes,view,propertyGroup){var interfaces;function _interfaceFunction(value){if(typeof value==='number'){value=value===undefined?1:value;if(value===0){return propertyGroup;}return interfaces[value-1];}var i=0;var len=interfaces.length;while(i<len){if(interfaces[i]._name===value){return interfaces[i];}i+=1;}return null;}function parentGroupWrapper(){return propertyGroup;}_interfaceFunction.propertyGroup=propertyGroupFactory(_interfaceFunction,parentGroupWrapper);interfaces=iterateElements(shapes,view,_interfaceFunction.propertyGroup);_interfaceFunction.numProperties=interfaces.length;_interfaceFunction._name='Contents';return _interfaceFunction;};}();var TextExpressionInterface=function(){return function(elem){var _prevValue;var _sourceText;function _thisLayerFunction(name){switch(name){case'ADBE Text Document':return _thisLayerFunction.sourceText;default:return null;}}Object.defineProperty(_thisLayerFunction,'sourceText',{get:function get(){elem.textProperty.getValue();var stringValue=elem.textProperty.currentData.t;if(stringValue!==_prevValue){elem.textProperty.currentData.t=_prevValue;_sourceText=new String(stringValue);// eslint-disable-line no-new-wrappers
	// If stringValue is an empty string, eval returns undefined, so it has to be returned as a String primitive
	_sourceText.value=stringValue||new String(stringValue);// eslint-disable-line no-new-wrappers
	}return _sourceText;}});return _thisLayerFunction;};}();var getBlendMode=function(){var blendModeEnums={0:'source-over',1:'multiply',2:'screen',3:'overlay',4:'darken',5:'lighten',6:'color-dodge',7:'color-burn',8:'hard-light',9:'soft-light',10:'difference',11:'exclusion',12:'hue',13:'saturation',14:'color',15:'luminosity'};return function(mode){return blendModeEnums[mode]||'';};}();function SliderEffect(data,elem,container){this.p=PropertyFactory.getProp(elem,data.v,0,0,container);}function AngleEffect(data,elem,container){this.p=PropertyFactory.getProp(elem,data.v,0,0,container);}function ColorEffect(data,elem,container){this.p=PropertyFactory.getProp(elem,data.v,1,0,container);}function PointEffect(data,elem,container){this.p=PropertyFactory.getProp(elem,data.v,1,0,container);}function LayerIndexEffect(data,elem,container){this.p=PropertyFactory.getProp(elem,data.v,0,0,container);}function MaskIndexEffect(data,elem,container){this.p=PropertyFactory.getProp(elem,data.v,0,0,container);}function CheckboxEffect(data,elem,container){this.p=PropertyFactory.getProp(elem,data.v,0,0,container);}function NoValueEffect(){this.p={};}function EffectsManager(data,element){var effects=data.ef||[];this.effectElements=[];var i;var len=effects.length;var effectItem;for(i=0;i<len;i+=1){effectItem=new GroupEffect(effects[i],element);this.effectElements.push(effectItem);}}function GroupEffect(data,element){this.init(data,element);}extendPrototype([DynamicPropertyContainer],GroupEffect);GroupEffect.prototype.getValue=GroupEffect.prototype.iterateDynamicProperties;GroupEffect.prototype.init=function(data,element){this.data=data;this.effectElements=[];this.initDynamicPropertyContainer(element);var i;var len=this.data.ef.length;var eff;var effects=this.data.ef;for(i=0;i<len;i+=1){eff=null;switch(effects[i].ty){case 0:eff=new SliderEffect(effects[i],element,this);break;case 1:eff=new AngleEffect(effects[i],element,this);break;case 2:eff=new ColorEffect(effects[i],element,this);break;case 3:eff=new PointEffect(effects[i],element,this);break;case 4:case 7:eff=new CheckboxEffect(effects[i],element,this);break;case 10:eff=new LayerIndexEffect(effects[i],element,this);break;case 11:eff=new MaskIndexEffect(effects[i],element,this);break;case 5:eff=new EffectsManager(effects[i],element,this);break;// case 6:
	default:eff=new NoValueEffect(effects[i],element,this);break;}if(eff){this.effectElements.push(eff);}}};function BaseElement(){}BaseElement.prototype={checkMasks:function checkMasks(){if(!this.data.hasMask){return false;}var i=0;var len=this.data.masksProperties.length;while(i<len){if(this.data.masksProperties[i].mode!=='n'&&this.data.masksProperties[i].cl!==false){return true;}i+=1;}return false;},initExpressions:function initExpressions(){this.layerInterface=LayerExpressionInterface(this);if(this.data.hasMask&&this.maskManager){this.layerInterface.registerMaskInterface(this.maskManager);}var effectsInterface=EffectsExpressionInterface.createEffectsInterface(this,this.layerInterface);this.layerInterface.registerEffectsInterface(effectsInterface);if(this.data.ty===0||this.data.xt){this.compInterface=CompExpressionInterface(this);}else if(this.data.ty===4){this.layerInterface.shapeInterface=ShapeExpressionInterface(this.shapesData,this.itemsData,this.layerInterface);this.layerInterface.content=this.layerInterface.shapeInterface;}else if(this.data.ty===5){this.layerInterface.textInterface=TextExpressionInterface(this);this.layerInterface.text=this.layerInterface.textInterface;}},setBlendMode:function setBlendMode(){var blendModeValue=getBlendMode(this.data.bm);var elem=this.baseElement||this.layerElement;elem.style['mix-blend-mode']=blendModeValue;},initBaseData:function initBaseData(data,globalData,comp){this.globalData=globalData;this.comp=comp;this.data=data;this.layerId=createElementID();// Stretch factor for old animations missing this property.
	if(!this.data.sr){this.data.sr=1;}// effects manager
	this.effectsManager=new EffectsManager(this.data,this,this.dynamicProperties);},getType:function getType(){return this.type;},sourceRectAtTime:function sourceRectAtTime(){}};/**
	   * @file
	   * Handles element's layer frame update.
	   * Checks layer in point and out point
	   *
	   */function FrameElement(){}FrameElement.prototype={/**
	       * @function
	       * Initializes frame related properties.
	       *
	       */initFrame:function initFrame(){// set to true when inpoint is rendered
	this._isFirstFrame=false;// list of animated properties
	this.dynamicProperties=[];// If layer has been modified in current tick this will be true
	this._mdf=false;},/**
	       * @function
	       * Calculates all dynamic values
	       *
	       * @param {number} num
	       * current frame number in Layer's time
	       * @param {boolean} isVisible
	       * if layers is currently in range
	       *
	       */prepareProperties:function prepareProperties(num,isVisible){var i;var len=this.dynamicProperties.length;for(i=0;i<len;i+=1){if(isVisible||this._isParent&&this.dynamicProperties[i].propType==='transform'){this.dynamicProperties[i].getValue();if(this.dynamicProperties[i]._mdf){this.globalData._mdf=true;this._mdf=true;}}}},addDynamicProperty:function addDynamicProperty(prop){if(this.dynamicProperties.indexOf(prop)===-1){this.dynamicProperties.push(prop);}}};function _typeof$2(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof$2=function _typeof(obj){return typeof obj;};}else{_typeof$2=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};}return _typeof$2(obj);}var FootageInterface=function(){var outlineInterfaceFactory=function outlineInterfaceFactory(elem){var currentPropertyName='';var currentProperty=elem.getFootageData();function init(){currentPropertyName='';currentProperty=elem.getFootageData();return searchProperty;}function searchProperty(value){if(currentProperty[value]){currentPropertyName=value;currentProperty=currentProperty[value];if(_typeof$2(currentProperty)==='object'){return searchProperty;}return currentProperty;}var propertyNameIndex=value.indexOf(currentPropertyName);if(propertyNameIndex!==-1){var index=parseInt(value.substr(propertyNameIndex+currentPropertyName.length),10);currentProperty=currentProperty[index];if(_typeof$2(currentProperty)==='object'){return searchProperty;}return currentProperty;}return '';}return init;};var dataInterfaceFactory=function dataInterfaceFactory(elem){function interfaceFunction(value){if(value==='Outline'){return interfaceFunction.outlineInterface();}return null;}interfaceFunction._name='Outline';interfaceFunction.outlineInterface=outlineInterfaceFactory(elem);return interfaceFunction;};return function(elem){function _interfaceFunction(value){if(value==='Data'){return _interfaceFunction.dataInterface;}return null;}_interfaceFunction._name='Data';_interfaceFunction.dataInterface=dataInterfaceFactory(elem);return _interfaceFunction;};}();function FootageElement(data,globalData,comp){this.initFrame();this.initRenderable();this.assetData=globalData.getAssetData(data.refId);this.footageData=globalData.imageLoader.getAsset(this.assetData);this.initBaseData(data,globalData,comp);}FootageElement.prototype.prepareFrame=function(){};extendPrototype([RenderableElement,BaseElement,FrameElement],FootageElement);FootageElement.prototype.getBaseElement=function(){return null;};FootageElement.prototype.renderFrame=function(){};FootageElement.prototype.destroy=function(){};FootageElement.prototype.initExpressions=function(){this.layerInterface=FootageInterface(this);};FootageElement.prototype.getFootageData=function(){return this.footageData;};function AudioElement(data,globalData,comp){this.initFrame();this.initRenderable();this.assetData=globalData.getAssetData(data.refId);this.initBaseData(data,globalData,comp);this._isPlaying=false;this._canPlay=false;var assetPath=this.globalData.getAssetsPath(this.assetData);this.audio=this.globalData.audioController.createAudio(assetPath);this._currentTime=0;this.globalData.audioController.addAudio(this);this._volumeMultiplier=1;this._volume=1;this._previousVolume=null;this.tm=data.tm?PropertyFactory.getProp(this,data.tm,0,globalData.frameRate,this):{_placeholder:true};this.lv=PropertyFactory.getProp(this,data.au&&data.au.lv?data.au.lv:{k:[100]},1,0.01,this);}AudioElement.prototype.prepareFrame=function(num){this.prepareRenderableFrame(num,true);this.prepareProperties(num,true);if(!this.tm._placeholder){var timeRemapped=this.tm.v;this._currentTime=timeRemapped;}else{this._currentTime=num/this.data.sr;}this._volume=this.lv.v[0];var totalVolume=this._volume*this._volumeMultiplier;if(this._previousVolume!==totalVolume){this._previousVolume=totalVolume;this.audio.volume(totalVolume);}};extendPrototype([RenderableElement,BaseElement,FrameElement],AudioElement);AudioElement.prototype.renderFrame=function(){if(this.isInRange&&this._canPlay){if(!this._isPlaying){this.audio.play();this.audio.seek(this._currentTime/this.globalData.frameRate);this._isPlaying=true;}else if(!this.audio.playing()||Math.abs(this._currentTime/this.globalData.frameRate-this.audio.seek())>0.1){this.audio.seek(this._currentTime/this.globalData.frameRate);}}};AudioElement.prototype.show=function(){// this.audio.play()
	};AudioElement.prototype.hide=function(){this.audio.pause();this._isPlaying=false;};AudioElement.prototype.pause=function(){this.audio.pause();this._isPlaying=false;this._canPlay=false;};AudioElement.prototype.resume=function(){this._canPlay=true;};AudioElement.prototype.setRate=function(rateValue){this.audio.rate(rateValue);};AudioElement.prototype.volume=function(volumeValue){this._volumeMultiplier=volumeValue;this._previousVolume=volumeValue*this._volume;this.audio.volume(this._previousVolume);};AudioElement.prototype.getBaseElement=function(){return null;};AudioElement.prototype.destroy=function(){};AudioElement.prototype.sourceRectAtTime=function(){};AudioElement.prototype.initExpressions=function(){};function BaseRenderer(){}BaseRenderer.prototype.checkLayers=function(num){var i;var len=this.layers.length;var data;this.completeLayers=true;for(i=len-1;i>=0;i-=1){if(!this.elements[i]){data=this.layers[i];if(data.ip-data.st<=num-this.layers[i].st&&data.op-data.st>num-this.layers[i].st){this.buildItem(i);}}this.completeLayers=this.elements[i]?this.completeLayers:false;}this.checkPendingElements();};BaseRenderer.prototype.createItem=function(layer){switch(layer.ty){case 2:return this.createImage(layer);case 0:return this.createComp(layer);case 1:return this.createSolid(layer);case 3:return this.createNull(layer);case 4:return this.createShape(layer);case 5:return this.createText(layer);case 6:return this.createAudio(layer);case 13:return this.createCamera(layer);case 15:return this.createFootage(layer);default:return this.createNull(layer);}};BaseRenderer.prototype.createCamera=function(){throw new Error('You\'re using a 3d camera. Try the html renderer.');};BaseRenderer.prototype.createAudio=function(data){return new AudioElement(data,this.globalData,this);};BaseRenderer.prototype.createFootage=function(data){return new FootageElement(data,this.globalData,this);};BaseRenderer.prototype.buildAllItems=function(){var i;var len=this.layers.length;for(i=0;i<len;i+=1){this.buildItem(i);}this.checkPendingElements();};BaseRenderer.prototype.includeLayers=function(newLayers){this.completeLayers=false;var i;var len=newLayers.length;var j;var jLen=this.layers.length;for(i=0;i<len;i+=1){j=0;while(j<jLen){if(this.layers[j].id===newLayers[i].id){this.layers[j]=newLayers[i];break;}j+=1;}}};BaseRenderer.prototype.setProjectInterface=function(pInterface){this.globalData.projectInterface=pInterface;};BaseRenderer.prototype.initItems=function(){if(!this.globalData.progressiveLoad){this.buildAllItems();}};BaseRenderer.prototype.buildElementParenting=function(element,parentName,hierarchy){var elements=this.elements;var layers=this.layers;var i=0;var len=layers.length;while(i<len){if(layers[i].ind==parentName){// eslint-disable-line eqeqeq
	if(!elements[i]||elements[i]===true){this.buildItem(i);this.addPendingElement(element);}else{hierarchy.push(elements[i]);elements[i].setAsParent();if(layers[i].parent!==undefined){this.buildElementParenting(element,layers[i].parent,hierarchy);}else{element.setHierarchy(hierarchy);}}}i+=1;}};BaseRenderer.prototype.addPendingElement=function(element){this.pendingElements.push(element);};BaseRenderer.prototype.searchExtraCompositions=function(assets){var i;var len=assets.length;for(i=0;i<len;i+=1){if(assets[i].xt){var comp=this.createComp(assets[i]);comp.initExpressions();this.globalData.projectInterface.registerComposition(comp);}}};BaseRenderer.prototype.getElementByPath=function(path){var pathValue=path.shift();var element;if(typeof pathValue==='number'){element=this.elements[pathValue];}else{var i;var len=this.elements.length;for(i=0;i<len;i+=1){if(this.elements[i].data.nm===pathValue){element=this.elements[i];break;}}}if(path.length===0){return element;}return element.getElementByPath(path);};BaseRenderer.prototype.setupGlobalData=function(animData,fontsContainer){this.globalData.fontManager=new FontManager();this.globalData.fontManager.addChars(animData.chars);this.globalData.fontManager.addFonts(animData.fonts,fontsContainer);this.globalData.getAssetData=this.animationItem.getAssetData.bind(this.animationItem);this.globalData.getAssetsPath=this.animationItem.getAssetsPath.bind(this.animationItem);this.globalData.imageLoader=this.animationItem.imagePreloader;this.globalData.audioController=this.animationItem.audioController;this.globalData.frameId=0;this.globalData.frameRate=animData.fr;this.globalData.nm=animData.nm;this.globalData.compSize={w:animData.w,h:animData.h};};function TransformElement(){}TransformElement.prototype={initTransform:function initTransform(){this.finalTransform={mProp:this.data.ks?TransformPropertyFactory.getTransformProperty(this,this.data.ks,this):{o:0},_matMdf:false,_opMdf:false,mat:new Matrix()};if(this.data.ao){this.finalTransform.mProp.autoOriented=true;}// TODO: check TYPE 11: Guided elements
	if(this.data.ty!==11);},renderTransform:function renderTransform(){this.finalTransform._opMdf=this.finalTransform.mProp.o._mdf||this._isFirstFrame;this.finalTransform._matMdf=this.finalTransform.mProp._mdf||this._isFirstFrame;if(this.hierarchy){var mat;var finalMat=this.finalTransform.mat;var i=0;var len=this.hierarchy.length;// Checking if any of the transformation matrices in the hierarchy chain has changed.
	if(!this.finalTransform._matMdf){while(i<len){if(this.hierarchy[i].finalTransform.mProp._mdf){this.finalTransform._matMdf=true;break;}i+=1;}}if(this.finalTransform._matMdf){mat=this.finalTransform.mProp.v.props;finalMat.cloneFromProps(mat);for(i=0;i<len;i+=1){mat=this.hierarchy[i].finalTransform.mProp.v.props;finalMat.transform(mat[0],mat[1],mat[2],mat[3],mat[4],mat[5],mat[6],mat[7],mat[8],mat[9],mat[10],mat[11],mat[12],mat[13],mat[14],mat[15]);}}}},globalToLocal:function globalToLocal(pt){var transforms=[];transforms.push(this.finalTransform);var flag=true;var comp=this.comp;while(flag){if(comp.finalTransform){if(comp.data.hasMask){transforms.splice(0,0,comp.finalTransform);}comp=comp.comp;}else{flag=false;}}var i;var len=transforms.length;var ptNew;for(i=0;i<len;i+=1){ptNew=transforms[i].mat.applyToPointArray(0,0,0);// ptNew = transforms[i].mat.applyToPointArray(pt[0],pt[1],pt[2]);
	pt=[pt[0]-ptNew[0],pt[1]-ptNew[1],0];}return pt;},mHelper:new Matrix()};function MaskElement(data,element,globalData){this.data=data;this.element=element;this.globalData=globalData;this.storedData=[];this.masksProperties=this.data.masksProperties||[];this.maskElement=null;var defs=this.globalData.defs;var i;var len=this.masksProperties?this.masksProperties.length:0;this.viewData=createSizedArray(len);this.solidPath='';var path;var properties=this.masksProperties;var count=0;var currentMasks=[];var j;var jLen;var layerId=createElementID();var rect;var expansor;var feMorph;var x;var maskType='clipPath';var maskRef='clip-path';for(i=0;i<len;i+=1){if(properties[i].mode!=='a'&&properties[i].mode!=='n'||properties[i].inv||properties[i].o.k!==100||properties[i].o.x){maskType='mask';maskRef='mask';}if((properties[i].mode==='s'||properties[i].mode==='i')&&count===0){rect=createNS('rect');rect.setAttribute('fill','#ffffff');rect.setAttribute('width',this.element.comp.data.w||0);rect.setAttribute('height',this.element.comp.data.h||0);currentMasks.push(rect);}else{rect=null;}path=createNS('path');if(properties[i].mode==='n'){// TODO move this to a factory or to a constructor
	this.viewData[i]={op:PropertyFactory.getProp(this.element,properties[i].o,0,0.01,this.element),prop:ShapePropertyFactory.getShapeProp(this.element,properties[i],3),elem:path,lastPath:''};defs.appendChild(path);}else{count+=1;path.setAttribute('fill',properties[i].mode==='s'?'#000000':'#ffffff');path.setAttribute('clip-rule','nonzero');var filterID;if(properties[i].x.k!==0){maskType='mask';maskRef='mask';x=PropertyFactory.getProp(this.element,properties[i].x,0,null,this.element);filterID=createElementID();expansor=createNS('filter');expansor.setAttribute('id',filterID);feMorph=createNS('feMorphology');feMorph.setAttribute('operator','erode');feMorph.setAttribute('in','SourceGraphic');feMorph.setAttribute('radius','0');expansor.appendChild(feMorph);defs.appendChild(expansor);path.setAttribute('stroke',properties[i].mode==='s'?'#000000':'#ffffff');}else{feMorph=null;x=null;}// TODO move this to a factory or to a constructor
	this.storedData[i]={elem:path,x:x,expan:feMorph,lastPath:'',lastOperator:'',filterId:filterID,lastRadius:0};if(properties[i].mode==='i'){jLen=currentMasks.length;var g=createNS('g');for(j=0;j<jLen;j+=1){g.appendChild(currentMasks[j]);}var mask=createNS('mask');mask.setAttribute('mask-type','alpha');mask.setAttribute('id',layerId+'_'+count);mask.appendChild(path);defs.appendChild(mask);g.setAttribute('mask','url('+getLocationHref()+'#'+layerId+'_'+count+')');currentMasks.length=0;currentMasks.push(g);}else{currentMasks.push(path);}if(properties[i].inv&&!this.solidPath){this.solidPath=this.createLayerSolidPath();}// TODO move this to a factory or to a constructor
	this.viewData[i]={elem:path,lastPath:'',op:PropertyFactory.getProp(this.element,properties[i].o,0,0.01,this.element),prop:ShapePropertyFactory.getShapeProp(this.element,properties[i],3),invRect:rect};if(!this.viewData[i].prop.k){this.drawPath(properties[i],this.viewData[i].prop.v,this.viewData[i]);}}}this.maskElement=createNS(maskType);len=currentMasks.length;for(i=0;i<len;i+=1){this.maskElement.appendChild(currentMasks[i]);}if(count>0){this.maskElement.setAttribute('id',layerId);this.element.maskedElement.setAttribute(maskRef,'url('+getLocationHref()+'#'+layerId+')');defs.appendChild(this.maskElement);}if(this.viewData.length){this.element.addRenderableComponent(this);}}MaskElement.prototype.getMaskProperty=function(pos){return this.viewData[pos].prop;};MaskElement.prototype.renderFrame=function(isFirstFrame){var finalMat=this.element.finalTransform.mat;var i;var len=this.masksProperties.length;for(i=0;i<len;i+=1){if(this.viewData[i].prop._mdf||isFirstFrame){this.drawPath(this.masksProperties[i],this.viewData[i].prop.v,this.viewData[i]);}if(this.viewData[i].op._mdf||isFirstFrame){this.viewData[i].elem.setAttribute('fill-opacity',this.viewData[i].op.v);}if(this.masksProperties[i].mode!=='n'){if(this.viewData[i].invRect&&(this.element.finalTransform.mProp._mdf||isFirstFrame)){this.viewData[i].invRect.setAttribute('transform',finalMat.getInverseMatrix().to2dCSS());}if(this.storedData[i].x&&(this.storedData[i].x._mdf||isFirstFrame)){var feMorph=this.storedData[i].expan;if(this.storedData[i].x.v<0){if(this.storedData[i].lastOperator!=='erode'){this.storedData[i].lastOperator='erode';this.storedData[i].elem.setAttribute('filter','url('+getLocationHref()+'#'+this.storedData[i].filterId+')');}feMorph.setAttribute('radius',-this.storedData[i].x.v);}else{if(this.storedData[i].lastOperator!=='dilate'){this.storedData[i].lastOperator='dilate';this.storedData[i].elem.setAttribute('filter',null);}this.storedData[i].elem.setAttribute('stroke-width',this.storedData[i].x.v*2);}}}}};MaskElement.prototype.getMaskelement=function(){return this.maskElement;};MaskElement.prototype.createLayerSolidPath=function(){var path='M0,0 ';path+=' h'+this.globalData.compSize.w;path+=' v'+this.globalData.compSize.h;path+=' h-'+this.globalData.compSize.w;path+=' v-'+this.globalData.compSize.h+' ';return path;};MaskElement.prototype.drawPath=function(pathData,pathNodes,viewData){var pathString=' M'+pathNodes.v[0][0]+','+pathNodes.v[0][1];var i;var len;len=pathNodes._length;for(i=1;i<len;i+=1){// pathString += " C"+pathNodes.o[i-1][0]+','+pathNodes.o[i-1][1] + " "+pathNodes.i[i][0]+','+pathNodes.i[i][1] + " "+pathNodes.v[i][0]+','+pathNodes.v[i][1];
	pathString+=' C'+pathNodes.o[i-1][0]+','+pathNodes.o[i-1][1]+' '+pathNodes.i[i][0]+','+pathNodes.i[i][1]+' '+pathNodes.v[i][0]+','+pathNodes.v[i][1];}// pathString += " C"+pathNodes.o[i-1][0]+','+pathNodes.o[i-1][1] + " "+pathNodes.i[0][0]+','+pathNodes.i[0][1] + " "+pathNodes.v[0][0]+','+pathNodes.v[0][1];
	if(pathNodes.c&&len>1){pathString+=' C'+pathNodes.o[i-1][0]+','+pathNodes.o[i-1][1]+' '+pathNodes.i[0][0]+','+pathNodes.i[0][1]+' '+pathNodes.v[0][0]+','+pathNodes.v[0][1];}// pathNodes.__renderedString = pathString;
	if(viewData.lastPath!==pathString){var pathShapeValue='';if(viewData.elem){if(pathNodes.c){pathShapeValue=pathData.inv?this.solidPath+pathString:pathString;}viewData.elem.setAttribute('d',pathShapeValue);}viewData.lastPath=pathString;}};MaskElement.prototype.destroy=function(){this.element=null;this.globalData=null;this.maskElement=null;this.data=null;this.masksProperties=null;};var filtersFactory=function(){var ob={};ob.createFilter=createFilter;ob.createAlphaToLuminanceFilter=createAlphaToLuminanceFilter;function createFilter(filId,skipCoordinates){var fil=createNS('filter');fil.setAttribute('id',filId);if(skipCoordinates!==true){fil.setAttribute('filterUnits','objectBoundingBox');fil.setAttribute('x','0%');fil.setAttribute('y','0%');fil.setAttribute('width','100%');fil.setAttribute('height','100%');}return fil;}function createAlphaToLuminanceFilter(){var feColorMatrix=createNS('feColorMatrix');feColorMatrix.setAttribute('type','matrix');feColorMatrix.setAttribute('color-interpolation-filters','sRGB');feColorMatrix.setAttribute('values','0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 1 1');return feColorMatrix;}return ob;}();var featureSupport=function(){var ob={maskType:true};if(/MSIE 10/i.test(navigator.userAgent)||/MSIE 9/i.test(navigator.userAgent)||/rv:11.0/i.test(navigator.userAgent)||/Edge\/\d./i.test(navigator.userAgent)){ob.maskType=false;}return ob;}();var registeredEffects={};var idPrefix='filter_result_';function SVGEffects(elem){var i;var source='SourceGraphic';var len=elem.data.ef?elem.data.ef.length:0;var filId=createElementID();var fil=filtersFactory.createFilter(filId,true);var count=0;this.filters=[];var filterManager;for(i=0;i<len;i+=1){filterManager=null;var type=elem.data.ef[i].ty;if(registeredEffects[type]){var Effect=registeredEffects[type].effect;filterManager=new Effect(fil,elem.effectsManager.effectElements[i],elem,idPrefix+count,source);source=idPrefix+count;if(registeredEffects[type].countsAsEffect){count+=1;}}if(filterManager){this.filters.push(filterManager);}}if(count){elem.globalData.defs.appendChild(fil);elem.layerElement.setAttribute('filter','url('+getLocationHref()+'#'+filId+')');}if(this.filters.length){elem.addRenderableComponent(this);}}SVGEffects.prototype.renderFrame=function(_isFirstFrame){var i;var len=this.filters.length;for(i=0;i<len;i+=1){this.filters[i].renderFrame(_isFirstFrame);}};function registerEffect(id,effect,countsAsEffect){registeredEffects[id]={effect:effect,countsAsEffect:countsAsEffect};}function SVGBaseElement(){}SVGBaseElement.prototype={initRendererElement:function initRendererElement(){this.layerElement=createNS('g');},createContainerElements:function createContainerElements(){this.matteElement=createNS('g');this.transformedElement=this.layerElement;this.maskedElement=this.layerElement;this._sizeChanged=false;var layerElementParent=null;// If this layer acts as a mask for the following layer
	var filId;var fil;var gg;if(this.data.td){if(this.data.td==3||this.data.td==1){// eslint-disable-line eqeqeq
	var masker=createNS('mask');masker.setAttribute('id',this.layerId);masker.setAttribute('mask-type',this.data.td==3?'luminance':'alpha');// eslint-disable-line eqeqeq
	masker.appendChild(this.layerElement);layerElementParent=masker;this.globalData.defs.appendChild(masker);// This is only for IE and Edge when mask if of type alpha
	if(!featureSupport.maskType&&this.data.td==1){// eslint-disable-line eqeqeq
	masker.setAttribute('mask-type','luminance');filId=createElementID();fil=filtersFactory.createFilter(filId);this.globalData.defs.appendChild(fil);fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());gg=createNS('g');gg.appendChild(this.layerElement);layerElementParent=gg;masker.appendChild(gg);gg.setAttribute('filter','url('+getLocationHref()+'#'+filId+')');}}else if(this.data.td==2){// eslint-disable-line eqeqeq
	var maskGroup=createNS('mask');maskGroup.setAttribute('id',this.layerId);maskGroup.setAttribute('mask-type','alpha');var maskGrouper=createNS('g');maskGroup.appendChild(maskGrouper);filId=createElementID();fil=filtersFactory.createFilter(filId);/// /
	// This solution doesn't work on Android when meta tag with viewport attribute is set
	/* var feColorMatrix = createNS('feColorMatrix');
	                  feColorMatrix.setAttribute('type', 'matrix');
	                  feColorMatrix.setAttribute('color-interpolation-filters', 'sRGB');
	                  feColorMatrix.setAttribute('values','1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 -1 1');
	                  fil.appendChild(feColorMatrix); */ /// /
	var feCTr=createNS('feComponentTransfer');feCTr.setAttribute('in','SourceGraphic');fil.appendChild(feCTr);var feFunc=createNS('feFuncA');feFunc.setAttribute('type','table');feFunc.setAttribute('tableValues','1.0 0.0');feCTr.appendChild(feFunc);/// /
	this.globalData.defs.appendChild(fil);var alphaRect=createNS('rect');alphaRect.setAttribute('width',this.comp.data.w);alphaRect.setAttribute('height',this.comp.data.h);alphaRect.setAttribute('x','0');alphaRect.setAttribute('y','0');alphaRect.setAttribute('fill','#ffffff');alphaRect.setAttribute('opacity','0');maskGrouper.setAttribute('filter','url('+getLocationHref()+'#'+filId+')');maskGrouper.appendChild(alphaRect);maskGrouper.appendChild(this.layerElement);layerElementParent=maskGrouper;if(!featureSupport.maskType){maskGroup.setAttribute('mask-type','luminance');fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());gg=createNS('g');maskGrouper.appendChild(alphaRect);gg.appendChild(this.layerElement);layerElementParent=gg;maskGrouper.appendChild(gg);}this.globalData.defs.appendChild(maskGroup);}}else if(this.data.tt){this.matteElement.appendChild(this.layerElement);layerElementParent=this.matteElement;this.baseElement=this.matteElement;}else{this.baseElement=this.layerElement;}if(this.data.ln){this.layerElement.setAttribute('id',this.data.ln);}if(this.data.cl){this.layerElement.setAttribute('class',this.data.cl);}// Clipping compositions to hide content that exceeds boundaries. If collapsed transformations is on, component should not be clipped
	if(this.data.ty===0&&!this.data.hd){var cp=createNS('clipPath');var pt=createNS('path');pt.setAttribute('d','M0,0 L'+this.data.w+',0 L'+this.data.w+','+this.data.h+' L0,'+this.data.h+'z');var clipId=createElementID();cp.setAttribute('id',clipId);cp.appendChild(pt);this.globalData.defs.appendChild(cp);if(this.checkMasks()){var cpGroup=createNS('g');cpGroup.setAttribute('clip-path','url('+getLocationHref()+'#'+clipId+')');cpGroup.appendChild(this.layerElement);this.transformedElement=cpGroup;if(layerElementParent){layerElementParent.appendChild(this.transformedElement);}else{this.baseElement=this.transformedElement;}}else{this.layerElement.setAttribute('clip-path','url('+getLocationHref()+'#'+clipId+')');}}if(this.data.bm!==0){this.setBlendMode();}},renderElement:function renderElement(){if(this.finalTransform._matMdf){this.transformedElement.setAttribute('transform',this.finalTransform.mat.to2dCSS());}if(this.finalTransform._opMdf){this.transformedElement.setAttribute('opacity',this.finalTransform.mProp.o.v);}},destroyBaseElement:function destroyBaseElement(){this.layerElement=null;this.matteElement=null;this.maskManager.destroy();},getBaseElement:function getBaseElement(){if(this.data.hd){return null;}return this.baseElement;},createRenderableComponents:function createRenderableComponents(){this.maskManager=new MaskElement(this.data,this,this.globalData);this.renderableEffectsManager=new SVGEffects(this);},setMatte:function setMatte(id){if(!this.matteElement){return;}this.matteElement.setAttribute('mask','url('+getLocationHref()+'#'+id+')');}};/**
	   * @file
	   * Handles AE's layer parenting property.
	   *
	   */function HierarchyElement(){}HierarchyElement.prototype={/**
	       * @function
	       * Initializes hierarchy properties
	       *
	       */initHierarchy:function initHierarchy(){// element's parent list
	this.hierarchy=[];// if element is parent of another layer _isParent will be true
	this._isParent=false;this.checkParenting();},/**
	       * @function
	       * Sets layer's hierarchy.
	       * @param {array} hierarch
	       * layer's parent list
	       *
	       */setHierarchy:function setHierarchy(hierarchy){this.hierarchy=hierarchy;},/**
	       * @function
	       * Sets layer as parent.
	       *
	       */setAsParent:function setAsParent(){this._isParent=true;},/**
	       * @function
	       * Searches layer's parenting chain
	       *
	       */checkParenting:function checkParenting(){if(this.data.parent!==undefined){this.comp.buildElementParenting(this,this.data.parent,[]);}}};function RenderableDOMElement(){}(function(){var _prototype={initElement:function initElement(data,globalData,comp){this.initFrame();this.initBaseData(data,globalData,comp);this.initTransform(data,globalData,comp);this.initHierarchy();this.initRenderable();this.initRendererElement();this.createContainerElements();this.createRenderableComponents();this.createContent();this.hide();},hide:function hide(){// console.log('HIDE', this);
	if(!this.hidden&&(!this.isInRange||this.isTransparent)){var elem=this.baseElement||this.layerElement;elem.style.display='none';this.hidden=true;}},show:function show(){// console.log('SHOW', this);
	if(this.isInRange&&!this.isTransparent){if(!this.data.hd){var elem=this.baseElement||this.layerElement;elem.style.display='block';}this.hidden=false;this._isFirstFrame=true;}},renderFrame:function renderFrame(){// If it is exported as hidden (data.hd === true) no need to render
	// If it is not visible no need to render
	if(this.data.hd||this.hidden){return;}this.renderTransform();this.renderRenderable();this.renderElement();this.renderInnerContent();if(this._isFirstFrame){this._isFirstFrame=false;}},renderInnerContent:function renderInnerContent(){},prepareFrame:function prepareFrame(num){this._mdf=false;this.prepareRenderableFrame(num);this.prepareProperties(num,this.isInRange);this.checkTransparency();},destroy:function destroy(){this.innerElem=null;this.destroyBaseElement();}};extendPrototype([RenderableElement,createProxyFunction(_prototype)],RenderableDOMElement);})();function IImageElement(data,globalData,comp){this.assetData=globalData.getAssetData(data.refId);this.initElement(data,globalData,comp);this.sourceRect={top:0,left:0,width:this.assetData.w,height:this.assetData.h};}extendPrototype([BaseElement,TransformElement,SVGBaseElement,HierarchyElement,FrameElement,RenderableDOMElement],IImageElement);IImageElement.prototype.createContent=function(){var assetPath=this.globalData.getAssetsPath(this.assetData);this.innerElem=createNS('image');this.innerElem.setAttribute('width',this.assetData.w+'px');this.innerElem.setAttribute('height',this.assetData.h+'px');this.innerElem.setAttribute('preserveAspectRatio',this.assetData.pr||this.globalData.renderConfig.imagePreserveAspectRatio);this.innerElem.setAttributeNS('http://www.w3.org/1999/xlink','href',assetPath);this.layerElement.appendChild(this.innerElem);};IImageElement.prototype.sourceRectAtTime=function(){return this.sourceRect;};function ProcessedElement(element,position){this.elem=element;this.pos=position;}function IShapeElement(){}IShapeElement.prototype={addShapeToModifiers:function addShapeToModifiers(data){var i;var len=this.shapeModifiers.length;for(i=0;i<len;i+=1){this.shapeModifiers[i].addShape(data);}},isShapeInAnimatedModifiers:function isShapeInAnimatedModifiers(data){var i=0;var len=this.shapeModifiers.length;while(i<len){if(this.shapeModifiers[i].isAnimatedWithShape(data)){return true;}}return false;},renderModifiers:function renderModifiers(){if(!this.shapeModifiers.length){return;}var i;var len=this.shapes.length;for(i=0;i<len;i+=1){this.shapes[i].sh.reset();}len=this.shapeModifiers.length;var shouldBreakProcess;for(i=len-1;i>=0;i-=1){shouldBreakProcess=this.shapeModifiers[i].processShapes(this._isFirstFrame);// workaround to fix cases where a repeater resets the shape so the following processes get called twice
	// TODO: find a better solution for this
	if(shouldBreakProcess){break;}}},searchProcessedElement:function searchProcessedElement(elem){var elements=this.processedElements;var i=0;var len=elements.length;while(i<len){if(elements[i].elem===elem){return elements[i].pos;}i+=1;}return 0;},addProcessedElement:function addProcessedElement(elem,pos){var elements=this.processedElements;var i=elements.length;while(i){i-=1;if(elements[i].elem===elem){elements[i].pos=pos;return;}}elements.push(new ProcessedElement(elem,pos));},prepareFrame:function prepareFrame(num){this.prepareRenderableFrame(num);this.prepareProperties(num,this.isInRange);}};var lineCapEnum={1:'butt',2:'round',3:'square'};var lineJoinEnum={1:'miter',2:'round',3:'bevel'};function SVGShapeData(transformers,level,shape){this.caches=[];this.styles=[];this.transformers=transformers;this.lStr='';this.sh=shape;this.lvl=level;// TODO find if there are some cases where _isAnimated can be false.
	// For now, since shapes add up with other shapes. They have to be calculated every time.
	// One way of finding out is checking if all styles associated to this shape depend only of this shape
	this._isAnimated=!!shape.k;// TODO: commenting this for now since all shapes are animated
	var i=0;var len=transformers.length;while(i<len){if(transformers[i].mProps.dynamicProperties.length){this._isAnimated=true;break;}i+=1;}}SVGShapeData.prototype.setAsAnimated=function(){this._isAnimated=true;};function SVGStyleData(data,level){this.data=data;this.type=data.ty;this.d='';this.lvl=level;this._mdf=false;this.closed=data.hd===true;this.pElem=createNS('path');this.msElem=null;}SVGStyleData.prototype.reset=function(){this.d='';this._mdf=false;};function DashProperty(elem,data,renderer,container){this.elem=elem;this.frameId=-1;this.dataProps=createSizedArray(data.length);this.renderer=renderer;this.k=false;this.dashStr='';this.dashArray=createTypedArray('float32',data.length?data.length-1:0);this.dashoffset=createTypedArray('float32',1);this.initDynamicPropertyContainer(container);var i;var len=data.length||0;var prop;for(i=0;i<len;i+=1){prop=PropertyFactory.getProp(elem,data[i].v,0,0,this);this.k=prop.k||this.k;this.dataProps[i]={n:data[i].n,p:prop};}if(!this.k){this.getValue(true);}this._isAnimated=this.k;}DashProperty.prototype.getValue=function(forceRender){if(this.elem.globalData.frameId===this.frameId&&!forceRender){return;}this.frameId=this.elem.globalData.frameId;this.iterateDynamicProperties();this._mdf=this._mdf||forceRender;if(this._mdf){var i=0;var len=this.dataProps.length;if(this.renderer==='svg'){this.dashStr='';}for(i=0;i<len;i+=1){if(this.dataProps[i].n!=='o'){if(this.renderer==='svg'){this.dashStr+=' '+this.dataProps[i].p.v;}else{this.dashArray[i]=this.dataProps[i].p.v;}}else{this.dashoffset[0]=this.dataProps[i].p.v;}}}};extendPrototype([DynamicPropertyContainer],DashProperty);function SVGStrokeStyleData(elem,data,styleOb){this.initDynamicPropertyContainer(elem);this.getValue=this.iterateDynamicProperties;this.o=PropertyFactory.getProp(elem,data.o,0,0.01,this);this.w=PropertyFactory.getProp(elem,data.w,0,null,this);this.d=new DashProperty(elem,data.d||{},'svg',this);this.c=PropertyFactory.getProp(elem,data.c,1,255,this);this.style=styleOb;this._isAnimated=!!this._isAnimated;}extendPrototype([DynamicPropertyContainer],SVGStrokeStyleData);function SVGFillStyleData(elem,data,styleOb){this.initDynamicPropertyContainer(elem);this.getValue=this.iterateDynamicProperties;this.o=PropertyFactory.getProp(elem,data.o,0,0.01,this);this.c=PropertyFactory.getProp(elem,data.c,1,255,this);this.style=styleOb;}extendPrototype([DynamicPropertyContainer],SVGFillStyleData);function SVGNoStyleData(elem,data,styleOb){this.initDynamicPropertyContainer(elem);this.getValue=this.iterateDynamicProperties;this.style=styleOb;}extendPrototype([DynamicPropertyContainer],SVGNoStyleData);function GradientProperty(elem,data,container){this.data=data;this.c=createTypedArray('uint8c',data.p*4);var cLength=data.k.k[0].s?data.k.k[0].s.length-data.p*4:data.k.k.length-data.p*4;this.o=createTypedArray('float32',cLength);this._cmdf=false;this._omdf=false;this._collapsable=this.checkCollapsable();this._hasOpacity=cLength;this.initDynamicPropertyContainer(container);this.prop=PropertyFactory.getProp(elem,data.k,1,null,this);this.k=this.prop.k;this.getValue(true);}GradientProperty.prototype.comparePoints=function(values,points){var i=0;var len=this.o.length/2;var diff;while(i<len){diff=Math.abs(values[i*4]-values[points*4+i*2]);if(diff>0.01){return false;}i+=1;}return true;};GradientProperty.prototype.checkCollapsable=function(){if(this.o.length/2!==this.c.length/4){return false;}if(this.data.k.k[0].s){var i=0;var len=this.data.k.k.length;while(i<len){if(!this.comparePoints(this.data.k.k[i].s,this.data.p)){return false;}i+=1;}}else if(!this.comparePoints(this.data.k.k,this.data.p)){return false;}return true;};GradientProperty.prototype.getValue=function(forceRender){this.prop.getValue();this._mdf=false;this._cmdf=false;this._omdf=false;if(this.prop._mdf||forceRender){var i;var len=this.data.p*4;var mult;var val;for(i=0;i<len;i+=1){mult=i%4===0?100:255;val=Math.round(this.prop.v[i]*mult);if(this.c[i]!==val){this.c[i]=val;this._cmdf=!forceRender;}}if(this.o.length){len=this.prop.v.length;for(i=this.data.p*4;i<len;i+=1){mult=i%2===0?100:1;val=i%2===0?Math.round(this.prop.v[i]*100):this.prop.v[i];if(this.o[i-this.data.p*4]!==val){this.o[i-this.data.p*4]=val;this._omdf=!forceRender;}}}this._mdf=!forceRender;}};extendPrototype([DynamicPropertyContainer],GradientProperty);function SVGGradientFillStyleData(elem,data,styleOb){this.initDynamicPropertyContainer(elem);this.getValue=this.iterateDynamicProperties;this.initGradientData(elem,data,styleOb);}SVGGradientFillStyleData.prototype.initGradientData=function(elem,data,styleOb){this.o=PropertyFactory.getProp(elem,data.o,0,0.01,this);this.s=PropertyFactory.getProp(elem,data.s,1,null,this);this.e=PropertyFactory.getProp(elem,data.e,1,null,this);this.h=PropertyFactory.getProp(elem,data.h||{k:0},0,0.01,this);this.a=PropertyFactory.getProp(elem,data.a||{k:0},0,degToRads,this);this.g=new GradientProperty(elem,data.g,this);this.style=styleOb;this.stops=[];this.setGradientData(styleOb.pElem,data);this.setGradientOpacity(data,styleOb);this._isAnimated=!!this._isAnimated;};SVGGradientFillStyleData.prototype.setGradientData=function(pathElement,data){var gradientId=createElementID();var gfill=createNS(data.t===1?'linearGradient':'radialGradient');gfill.setAttribute('id',gradientId);gfill.setAttribute('spreadMethod','pad');gfill.setAttribute('gradientUnits','userSpaceOnUse');var stops=[];var stop;var j;var jLen;jLen=data.g.p*4;for(j=0;j<jLen;j+=4){stop=createNS('stop');gfill.appendChild(stop);stops.push(stop);}pathElement.setAttribute(data.ty==='gf'?'fill':'stroke','url('+getLocationHref()+'#'+gradientId+')');this.gf=gfill;this.cst=stops;};SVGGradientFillStyleData.prototype.setGradientOpacity=function(data,styleOb){if(this.g._hasOpacity&&!this.g._collapsable){var stop;var j;var jLen;var mask=createNS('mask');var maskElement=createNS('path');mask.appendChild(maskElement);var opacityId=createElementID();var maskId=createElementID();mask.setAttribute('id',maskId);var opFill=createNS(data.t===1?'linearGradient':'radialGradient');opFill.setAttribute('id',opacityId);opFill.setAttribute('spreadMethod','pad');opFill.setAttribute('gradientUnits','userSpaceOnUse');jLen=data.g.k.k[0].s?data.g.k.k[0].s.length:data.g.k.k.length;var stops=this.stops;for(j=data.g.p*4;j<jLen;j+=2){stop=createNS('stop');stop.setAttribute('stop-color','rgb(255,255,255)');opFill.appendChild(stop);stops.push(stop);}maskElement.setAttribute(data.ty==='gf'?'fill':'stroke','url('+getLocationHref()+'#'+opacityId+')');if(data.ty==='gs'){maskElement.setAttribute('stroke-linecap',lineCapEnum[data.lc||2]);maskElement.setAttribute('stroke-linejoin',lineJoinEnum[data.lj||2]);if(data.lj===1){maskElement.setAttribute('stroke-miterlimit',data.ml);}}this.of=opFill;this.ms=mask;this.ost=stops;this.maskId=maskId;styleOb.msElem=maskElement;}};extendPrototype([DynamicPropertyContainer],SVGGradientFillStyleData);function SVGGradientStrokeStyleData(elem,data,styleOb){this.initDynamicPropertyContainer(elem);this.getValue=this.iterateDynamicProperties;this.w=PropertyFactory.getProp(elem,data.w,0,null,this);this.d=new DashProperty(elem,data.d||{},'svg',this);this.initGradientData(elem,data,styleOb);this._isAnimated=!!this._isAnimated;}extendPrototype([SVGGradientFillStyleData,DynamicPropertyContainer],SVGGradientStrokeStyleData);function ShapeGroupData(){this.it=[];this.prevViewData=[];this.gr=createNS('g');}function SVGTransformData(mProps,op,container){this.transform={mProps:mProps,op:op,container:container};this.elements=[];this._isAnimated=this.transform.mProps.dynamicProperties.length||this.transform.op.effectsSequence.length;}var buildShapeString=function buildShapeString(pathNodes,length,closed,mat){if(length===0){return '';}var _o=pathNodes.o;var _i=pathNodes.i;var _v=pathNodes.v;var i;var shapeString=' M'+mat.applyToPointStringified(_v[0][0],_v[0][1]);for(i=1;i<length;i+=1){shapeString+=' C'+mat.applyToPointStringified(_o[i-1][0],_o[i-1][1])+' '+mat.applyToPointStringified(_i[i][0],_i[i][1])+' '+mat.applyToPointStringified(_v[i][0],_v[i][1]);}if(closed&&length){shapeString+=' C'+mat.applyToPointStringified(_o[i-1][0],_o[i-1][1])+' '+mat.applyToPointStringified(_i[0][0],_i[0][1])+' '+mat.applyToPointStringified(_v[0][0],_v[0][1]);shapeString+='z';}return shapeString;};var SVGElementsRenderer=function(){var _identityMatrix=new Matrix();var _matrixHelper=new Matrix();var ob={createRenderFunction:createRenderFunction};function createRenderFunction(data){switch(data.ty){case'fl':return renderFill;case'gf':return renderGradient;case'gs':return renderGradientStroke;case'st':return renderStroke;case'sh':case'el':case'rc':case'sr':return renderPath;case'tr':return renderContentTransform;case'no':return renderNoop;default:return null;}}function renderContentTransform(styleData,itemData,isFirstFrame){if(isFirstFrame||itemData.transform.op._mdf){itemData.transform.container.setAttribute('opacity',itemData.transform.op.v);}if(isFirstFrame||itemData.transform.mProps._mdf){itemData.transform.container.setAttribute('transform',itemData.transform.mProps.v.to2dCSS());}}function renderNoop(){}function renderPath(styleData,itemData,isFirstFrame){var j;var jLen;var pathStringTransformed;var redraw;var pathNodes;var l;var lLen=itemData.styles.length;var lvl=itemData.lvl;var paths;var mat;var props;var iterations;var k;for(l=0;l<lLen;l+=1){redraw=itemData.sh._mdf||isFirstFrame;if(itemData.styles[l].lvl<lvl){mat=_matrixHelper.reset();iterations=lvl-itemData.styles[l].lvl;k=itemData.transformers.length-1;while(!redraw&&iterations>0){redraw=itemData.transformers[k].mProps._mdf||redraw;iterations-=1;k-=1;}if(redraw){iterations=lvl-itemData.styles[l].lvl;k=itemData.transformers.length-1;while(iterations>0){props=itemData.transformers[k].mProps.v.props;mat.transform(props[0],props[1],props[2],props[3],props[4],props[5],props[6],props[7],props[8],props[9],props[10],props[11],props[12],props[13],props[14],props[15]);iterations-=1;k-=1;}}}else{mat=_identityMatrix;}paths=itemData.sh.paths;jLen=paths._length;if(redraw){pathStringTransformed='';for(j=0;j<jLen;j+=1){pathNodes=paths.shapes[j];if(pathNodes&&pathNodes._length){pathStringTransformed+=buildShapeString(pathNodes,pathNodes._length,pathNodes.c,mat);}}itemData.caches[l]=pathStringTransformed;}else{pathStringTransformed=itemData.caches[l];}itemData.styles[l].d+=styleData.hd===true?'':pathStringTransformed;itemData.styles[l]._mdf=redraw||itemData.styles[l]._mdf;}}function renderFill(styleData,itemData,isFirstFrame){var styleElem=itemData.style;if(itemData.c._mdf||isFirstFrame){styleElem.pElem.setAttribute('fill','rgb('+bmFloor(itemData.c.v[0])+','+bmFloor(itemData.c.v[1])+','+bmFloor(itemData.c.v[2])+')');}if(itemData.o._mdf||isFirstFrame){styleElem.pElem.setAttribute('fill-opacity',itemData.o.v);}}function renderGradientStroke(styleData,itemData,isFirstFrame){renderGradient(styleData,itemData,isFirstFrame);renderStroke(styleData,itemData,isFirstFrame);}function renderGradient(styleData,itemData,isFirstFrame){var gfill=itemData.gf;var hasOpacity=itemData.g._hasOpacity;var pt1=itemData.s.v;var pt2=itemData.e.v;if(itemData.o._mdf||isFirstFrame){var attr=styleData.ty==='gf'?'fill-opacity':'stroke-opacity';itemData.style.pElem.setAttribute(attr,itemData.o.v);}if(itemData.s._mdf||isFirstFrame){var attr1=styleData.t===1?'x1':'cx';var attr2=attr1==='x1'?'y1':'cy';gfill.setAttribute(attr1,pt1[0]);gfill.setAttribute(attr2,pt1[1]);if(hasOpacity&&!itemData.g._collapsable){itemData.of.setAttribute(attr1,pt1[0]);itemData.of.setAttribute(attr2,pt1[1]);}}var stops;var i;var len;var stop;if(itemData.g._cmdf||isFirstFrame){stops=itemData.cst;var cValues=itemData.g.c;len=stops.length;for(i=0;i<len;i+=1){stop=stops[i];stop.setAttribute('offset',cValues[i*4]+'%');stop.setAttribute('stop-color','rgb('+cValues[i*4+1]+','+cValues[i*4+2]+','+cValues[i*4+3]+')');}}if(hasOpacity&&(itemData.g._omdf||isFirstFrame)){var oValues=itemData.g.o;if(itemData.g._collapsable){stops=itemData.cst;}else{stops=itemData.ost;}len=stops.length;for(i=0;i<len;i+=1){stop=stops[i];if(!itemData.g._collapsable){stop.setAttribute('offset',oValues[i*2]+'%');}stop.setAttribute('stop-opacity',oValues[i*2+1]);}}if(styleData.t===1){if(itemData.e._mdf||isFirstFrame){gfill.setAttribute('x2',pt2[0]);gfill.setAttribute('y2',pt2[1]);if(hasOpacity&&!itemData.g._collapsable){itemData.of.setAttribute('x2',pt2[0]);itemData.of.setAttribute('y2',pt2[1]);}}}else{var rad;if(itemData.s._mdf||itemData.e._mdf||isFirstFrame){rad=Math.sqrt(Math.pow(pt1[0]-pt2[0],2)+Math.pow(pt1[1]-pt2[1],2));gfill.setAttribute('r',rad);if(hasOpacity&&!itemData.g._collapsable){itemData.of.setAttribute('r',rad);}}if(itemData.e._mdf||itemData.h._mdf||itemData.a._mdf||isFirstFrame){if(!rad){rad=Math.sqrt(Math.pow(pt1[0]-pt2[0],2)+Math.pow(pt1[1]-pt2[1],2));}var ang=Math.atan2(pt2[1]-pt1[1],pt2[0]-pt1[0]);var percent=itemData.h.v;if(percent>=1){percent=0.99;}else if(percent<=-1){percent=-0.99;}var dist=rad*percent;var x=Math.cos(ang+itemData.a.v)*dist+pt1[0];var y=Math.sin(ang+itemData.a.v)*dist+pt1[1];gfill.setAttribute('fx',x);gfill.setAttribute('fy',y);if(hasOpacity&&!itemData.g._collapsable){itemData.of.setAttribute('fx',x);itemData.of.setAttribute('fy',y);}}// gfill.setAttribute('fy','200');
	}}function renderStroke(styleData,itemData,isFirstFrame){var styleElem=itemData.style;var d=itemData.d;if(d&&(d._mdf||isFirstFrame)&&d.dashStr){styleElem.pElem.setAttribute('stroke-dasharray',d.dashStr);styleElem.pElem.setAttribute('stroke-dashoffset',d.dashoffset[0]);}if(itemData.c&&(itemData.c._mdf||isFirstFrame)){styleElem.pElem.setAttribute('stroke','rgb('+bmFloor(itemData.c.v[0])+','+bmFloor(itemData.c.v[1])+','+bmFloor(itemData.c.v[2])+')');}if(itemData.o._mdf||isFirstFrame){styleElem.pElem.setAttribute('stroke-opacity',itemData.o.v);}if(itemData.w._mdf||isFirstFrame){styleElem.pElem.setAttribute('stroke-width',itemData.w.v);if(styleElem.msElem){styleElem.msElem.setAttribute('stroke-width',itemData.w.v);}}}return ob;}();function SVGShapeElement(data,globalData,comp){// List of drawable elements
	this.shapes=[];// Full shape data
	this.shapesData=data.shapes;// List of styles that will be applied to shapes
	this.stylesList=[];// List of modifiers that will be applied to shapes
	this.shapeModifiers=[];// List of items in shape tree
	this.itemsData=[];// List of items in previous shape tree
	this.processedElements=[];// List of animated components
	this.animatedContents=[];this.initElement(data,globalData,comp);// Moving any property that doesn't get too much access after initialization because of v8 way of handling more than 10 properties.
	// List of elements that have been created
	this.prevViewData=[];// Moving any property that doesn't get too much access after initialization because of v8 way of handling more than 10 properties.
	}extendPrototype([BaseElement,TransformElement,SVGBaseElement,IShapeElement,HierarchyElement,FrameElement,RenderableDOMElement],SVGShapeElement);SVGShapeElement.prototype.initSecondaryElement=function(){};SVGShapeElement.prototype.identityMatrix=new Matrix();SVGShapeElement.prototype.buildExpressionInterface=function(){};SVGShapeElement.prototype.createContent=function(){this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,this.layerElement,0,[],true);this.filterUniqueShapes();};/*
	  This method searches for multiple shapes that affect a single element and one of them is animated
	  */SVGShapeElement.prototype.filterUniqueShapes=function(){var i;var len=this.shapes.length;var shape;var j;var jLen=this.stylesList.length;var style;var tempShapes=[];var areAnimated=false;for(j=0;j<jLen;j+=1){style=this.stylesList[j];areAnimated=false;tempShapes.length=0;for(i=0;i<len;i+=1){shape=this.shapes[i];if(shape.styles.indexOf(style)!==-1){tempShapes.push(shape);areAnimated=shape._isAnimated||areAnimated;}}if(tempShapes.length>1&&areAnimated){this.setShapesAsAnimated(tempShapes);}}};SVGShapeElement.prototype.setShapesAsAnimated=function(shapes){var i;var len=shapes.length;for(i=0;i<len;i+=1){shapes[i].setAsAnimated();}};SVGShapeElement.prototype.createStyleElement=function(data,level){// TODO: prevent drawing of hidden styles
	var elementData;var styleOb=new SVGStyleData(data,level);var pathElement=styleOb.pElem;if(data.ty==='st'){elementData=new SVGStrokeStyleData(this,data,styleOb);}else if(data.ty==='fl'){elementData=new SVGFillStyleData(this,data,styleOb);}else if(data.ty==='gf'||data.ty==='gs'){var GradientConstructor=data.ty==='gf'?SVGGradientFillStyleData:SVGGradientStrokeStyleData;elementData=new GradientConstructor(this,data,styleOb);this.globalData.defs.appendChild(elementData.gf);if(elementData.maskId){this.globalData.defs.appendChild(elementData.ms);this.globalData.defs.appendChild(elementData.of);pathElement.setAttribute('mask','url('+getLocationHref()+'#'+elementData.maskId+')');}}else if(data.ty==='no'){elementData=new SVGNoStyleData(this,data,styleOb);}if(data.ty==='st'||data.ty==='gs'){pathElement.setAttribute('stroke-linecap',lineCapEnum[data.lc||2]);pathElement.setAttribute('stroke-linejoin',lineJoinEnum[data.lj||2]);pathElement.setAttribute('fill-opacity','0');if(data.lj===1){pathElement.setAttribute('stroke-miterlimit',data.ml);}}if(data.r===2){pathElement.setAttribute('fill-rule','evenodd');}if(data.ln){pathElement.setAttribute('id',data.ln);}if(data.cl){pathElement.setAttribute('class',data.cl);}if(data.bm){pathElement.style['mix-blend-mode']=getBlendMode(data.bm);}this.stylesList.push(styleOb);this.addToAnimatedContents(data,elementData);return elementData;};SVGShapeElement.prototype.createGroupElement=function(data){var elementData=new ShapeGroupData();if(data.ln){elementData.gr.setAttribute('id',data.ln);}if(data.cl){elementData.gr.setAttribute('class',data.cl);}if(data.bm){elementData.gr.style['mix-blend-mode']=getBlendMode(data.bm);}return elementData;};SVGShapeElement.prototype.createTransformElement=function(data,container){var transformProperty=TransformPropertyFactory.getTransformProperty(this,data,this);var elementData=new SVGTransformData(transformProperty,transformProperty.o,container);this.addToAnimatedContents(data,elementData);return elementData;};SVGShapeElement.prototype.createShapeElement=function(data,ownTransformers,level){var ty=4;if(data.ty==='rc'){ty=5;}else if(data.ty==='el'){ty=6;}else if(data.ty==='sr'){ty=7;}var shapeProperty=ShapePropertyFactory.getShapeProp(this,data,ty,this);var elementData=new SVGShapeData(ownTransformers,level,shapeProperty);this.shapes.push(elementData);this.addShapeToModifiers(elementData);this.addToAnimatedContents(data,elementData);return elementData;};SVGShapeElement.prototype.addToAnimatedContents=function(data,element){var i=0;var len=this.animatedContents.length;while(i<len){if(this.animatedContents[i].element===element){return;}i+=1;}this.animatedContents.push({fn:SVGElementsRenderer.createRenderFunction(data),element:element,data:data});};SVGShapeElement.prototype.setElementStyles=function(elementData){var arr=elementData.styles;var j;var jLen=this.stylesList.length;for(j=0;j<jLen;j+=1){if(!this.stylesList[j].closed){arr.push(this.stylesList[j]);}}};SVGShapeElement.prototype.reloadShapes=function(){this._isFirstFrame=true;var i;var len=this.itemsData.length;for(i=0;i<len;i+=1){this.prevViewData[i]=this.itemsData[i];}this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,this.layerElement,0,[],true);this.filterUniqueShapes();len=this.dynamicProperties.length;for(i=0;i<len;i+=1){this.dynamicProperties[i].getValue();}this.renderModifiers();};SVGShapeElement.prototype.searchShapes=function(arr,itemsData,prevViewData,container,level,transformers,render){var ownTransformers=[].concat(transformers);var i;var len=arr.length-1;var j;var jLen;var ownStyles=[];var ownModifiers=[];var currentTransform;var modifier;var processedPos;for(i=len;i>=0;i-=1){processedPos=this.searchProcessedElement(arr[i]);if(!processedPos){arr[i]._render=render;}else{itemsData[i]=prevViewData[processedPos-1];}if(arr[i].ty==='fl'||arr[i].ty==='st'||arr[i].ty==='gf'||arr[i].ty==='gs'||arr[i].ty==='no'){if(!processedPos){itemsData[i]=this.createStyleElement(arr[i],level);}else{itemsData[i].style.closed=false;}if(arr[i]._render){if(itemsData[i].style.pElem.parentNode!==container){container.appendChild(itemsData[i].style.pElem);}}ownStyles.push(itemsData[i].style);}else if(arr[i].ty==='gr'){if(!processedPos){itemsData[i]=this.createGroupElement(arr[i]);}else{jLen=itemsData[i].it.length;for(j=0;j<jLen;j+=1){itemsData[i].prevViewData[j]=itemsData[i].it[j];}}this.searchShapes(arr[i].it,itemsData[i].it,itemsData[i].prevViewData,itemsData[i].gr,level+1,ownTransformers,render);if(arr[i]._render){if(itemsData[i].gr.parentNode!==container){container.appendChild(itemsData[i].gr);}}}else if(arr[i].ty==='tr'){if(!processedPos){itemsData[i]=this.createTransformElement(arr[i],container);}currentTransform=itemsData[i].transform;ownTransformers.push(currentTransform);}else if(arr[i].ty==='sh'||arr[i].ty==='rc'||arr[i].ty==='el'||arr[i].ty==='sr'){if(!processedPos){itemsData[i]=this.createShapeElement(arr[i],ownTransformers,level);}this.setElementStyles(itemsData[i]);}else if(arr[i].ty==='tm'||arr[i].ty==='rd'||arr[i].ty==='ms'||arr[i].ty==='pb'){if(!processedPos){modifier=ShapeModifiers.getModifier(arr[i].ty);modifier.init(this,arr[i]);itemsData[i]=modifier;this.shapeModifiers.push(modifier);}else{modifier=itemsData[i];modifier.closed=false;}ownModifiers.push(modifier);}else if(arr[i].ty==='rp'){if(!processedPos){modifier=ShapeModifiers.getModifier(arr[i].ty);itemsData[i]=modifier;modifier.init(this,arr,i,itemsData);this.shapeModifiers.push(modifier);render=false;}else{modifier=itemsData[i];modifier.closed=true;}ownModifiers.push(modifier);}this.addProcessedElement(arr[i],i+1);}len=ownStyles.length;for(i=0;i<len;i+=1){ownStyles[i].closed=true;}len=ownModifiers.length;for(i=0;i<len;i+=1){ownModifiers[i].closed=true;}};SVGShapeElement.prototype.renderInnerContent=function(){this.renderModifiers();var i;var len=this.stylesList.length;for(i=0;i<len;i+=1){this.stylesList[i].reset();}this.renderShape();for(i=0;i<len;i+=1){if(this.stylesList[i]._mdf||this._isFirstFrame){if(this.stylesList[i].msElem){this.stylesList[i].msElem.setAttribute('d',this.stylesList[i].d);// Adding M0 0 fixes same mask bug on all browsers
	this.stylesList[i].d='M0 0'+this.stylesList[i].d;}this.stylesList[i].pElem.setAttribute('d',this.stylesList[i].d||'M0 0');}}};SVGShapeElement.prototype.renderShape=function(){var i;var len=this.animatedContents.length;var animatedContent;for(i=0;i<len;i+=1){animatedContent=this.animatedContents[i];if((this._isFirstFrame||animatedContent.element._isAnimated)&&animatedContent.data!==true){animatedContent.fn(animatedContent.data,animatedContent.element,this._isFirstFrame);}}};SVGShapeElement.prototype.destroy=function(){this.destroyBaseElement();this.shapesData=null;this.itemsData=null;};function LetterProps(o,sw,sc,fc,m,p){this.o=o;this.sw=sw;this.sc=sc;this.fc=fc;this.m=m;this.p=p;this._mdf={o:true,sw:!!sw,sc:!!sc,fc:!!fc,m:true,p:true};}LetterProps.prototype.update=function(o,sw,sc,fc,m,p){this._mdf.o=false;this._mdf.sw=false;this._mdf.sc=false;this._mdf.fc=false;this._mdf.m=false;this._mdf.p=false;var updated=false;if(this.o!==o){this.o=o;this._mdf.o=true;updated=true;}if(this.sw!==sw){this.sw=sw;this._mdf.sw=true;updated=true;}if(this.sc!==sc){this.sc=sc;this._mdf.sc=true;updated=true;}if(this.fc!==fc){this.fc=fc;this._mdf.fc=true;updated=true;}if(this.m!==m){this.m=m;this._mdf.m=true;updated=true;}if(p.length&&(this.p[0]!==p[0]||this.p[1]!==p[1]||this.p[4]!==p[4]||this.p[5]!==p[5]||this.p[12]!==p[12]||this.p[13]!==p[13])){this.p=p;this._mdf.p=true;updated=true;}return updated;};function TextProperty(elem,data){this._frameId=initialDefaultFrame;this.pv='';this.v='';this.kf=false;this._isFirstFrame=true;this._mdf=false;this.data=data;this.elem=elem;this.comp=this.elem.comp;this.keysIndex=0;this.canResize=false;this.minimumFontSize=1;this.effectsSequence=[];this.currentData={ascent:0,boxWidth:this.defaultBoxWidth,f:'',fStyle:'',fWeight:'',fc:'',j:'',justifyOffset:'',l:[],lh:0,lineWidths:[],ls:'',of:'',s:'',sc:'',sw:0,t:0,tr:0,sz:0,ps:null,fillColorAnim:false,strokeColorAnim:false,strokeWidthAnim:false,yOffset:0,finalSize:0,finalText:[],finalLineHeight:0,__complete:false};this.copyData(this.currentData,this.data.d.k[0].s);if(!this.searchProperty()){this.completeTextData(this.currentData);}}TextProperty.prototype.defaultBoxWidth=[0,0];TextProperty.prototype.copyData=function(obj,data){for(var s in data){if(Object.prototype.hasOwnProperty.call(data,s)){obj[s]=data[s];}}return obj;};TextProperty.prototype.setCurrentData=function(data){if(!data.__complete){this.completeTextData(data);}this.currentData=data;this.currentData.boxWidth=this.currentData.boxWidth||this.defaultBoxWidth;this._mdf=true;};TextProperty.prototype.searchProperty=function(){return this.searchKeyframes();};TextProperty.prototype.searchKeyframes=function(){this.kf=this.data.d.k.length>1;if(this.kf){this.addEffect(this.getKeyframeValue.bind(this));}return this.kf;};TextProperty.prototype.addEffect=function(effectFunction){this.effectsSequence.push(effectFunction);this.elem.addDynamicProperty(this);};TextProperty.prototype.getValue=function(_finalValue){if((this.elem.globalData.frameId===this.frameId||!this.effectsSequence.length)&&!_finalValue){return;}this.currentData.t=this.data.d.k[this.keysIndex].s.t;var currentValue=this.currentData;var currentIndex=this.keysIndex;if(this.lock){this.setCurrentData(this.currentData);return;}this.lock=true;this._mdf=false;var i;var len=this.effectsSequence.length;var finalValue=_finalValue||this.data.d.k[this.keysIndex].s;for(i=0;i<len;i+=1){// Checking if index changed to prevent creating a new object every time the expression updates.
	if(currentIndex!==this.keysIndex){finalValue=this.effectsSequence[i](finalValue,finalValue.t);}else{finalValue=this.effectsSequence[i](this.currentData,finalValue.t);}}if(currentValue!==finalValue){this.setCurrentData(finalValue);}this.v=this.currentData;this.pv=this.v;this.lock=false;this.frameId=this.elem.globalData.frameId;};TextProperty.prototype.getKeyframeValue=function(){var textKeys=this.data.d.k;var frameNum=this.elem.comp.renderedFrame;var i=0;var len=textKeys.length;while(i<=len-1){if(i===len-1||textKeys[i+1].t>frameNum){break;}i+=1;}if(this.keysIndex!==i){this.keysIndex=i;}return this.data.d.k[this.keysIndex].s;};TextProperty.prototype.buildFinalText=function(text){var charactersArray=[];var i=0;var len=text.length;var charCode;var secondCharCode;var shouldCombine=false;while(i<len){charCode=text.charCodeAt(i);if(FontManager.isCombinedCharacter(charCode)){charactersArray[charactersArray.length-1]+=text.charAt(i);}else if(charCode>=0xD800&&charCode<=0xDBFF){secondCharCode=text.charCodeAt(i+1);if(secondCharCode>=0xDC00&&secondCharCode<=0xDFFF){if(shouldCombine||FontManager.isModifier(charCode,secondCharCode)){charactersArray[charactersArray.length-1]+=text.substr(i,2);shouldCombine=false;}else{charactersArray.push(text.substr(i,2));}i+=1;}else{charactersArray.push(text.charAt(i));}}else if(charCode>0xDBFF){secondCharCode=text.charCodeAt(i+1);if(FontManager.isZeroWidthJoiner(charCode,secondCharCode)){shouldCombine=true;charactersArray[charactersArray.length-1]+=text.substr(i,2);i+=1;}else{charactersArray.push(text.charAt(i));}}else if(FontManager.isZeroWidthJoiner(charCode)){charactersArray[charactersArray.length-1]+=text.charAt(i);shouldCombine=true;}else{charactersArray.push(text.charAt(i));}i+=1;}return charactersArray;};TextProperty.prototype.completeTextData=function(documentData){documentData.__complete=true;var fontManager=this.elem.globalData.fontManager;var data=this.data;var letters=[];var i;var len;var newLineFlag;var index=0;var val;var anchorGrouping=data.m.g;var currentSize=0;var currentPos=0;var currentLine=0;var lineWidths=[];var lineWidth=0;var maxLineWidth=0;var j;var jLen;var fontData=fontManager.getFontByName(documentData.f);var charData;var cLength=0;var fontProps=getFontProperties(fontData);documentData.fWeight=fontProps.weight;documentData.fStyle=fontProps.style;documentData.finalSize=documentData.s;documentData.finalText=this.buildFinalText(documentData.t);len=documentData.finalText.length;documentData.finalLineHeight=documentData.lh;var trackingOffset=documentData.tr/1000*documentData.finalSize;var charCode;if(documentData.sz){var flag=true;var boxWidth=documentData.sz[0];var boxHeight=documentData.sz[1];var currentHeight;var finalText;while(flag){finalText=this.buildFinalText(documentData.t);currentHeight=0;lineWidth=0;len=finalText.length;trackingOffset=documentData.tr/1000*documentData.finalSize;var lastSpaceIndex=-1;for(i=0;i<len;i+=1){charCode=finalText[i].charCodeAt(0);newLineFlag=false;if(finalText[i]===' '){lastSpaceIndex=i;}else if(charCode===13||charCode===3){lineWidth=0;newLineFlag=true;currentHeight+=documentData.finalLineHeight||documentData.finalSize*1.2;}if(fontManager.chars){charData=fontManager.getCharData(finalText[i],fontData.fStyle,fontData.fFamily);cLength=newLineFlag?0:charData.w*documentData.finalSize/100;}else{// tCanvasHelper.font = documentData.s + 'px '+ fontData.fFamily;
	cLength=fontManager.measureText(finalText[i],documentData.f,documentData.finalSize);}if(lineWidth+cLength>boxWidth&&finalText[i]!==' '){if(lastSpaceIndex===-1){len+=1;}else{i=lastSpaceIndex;}currentHeight+=documentData.finalLineHeight||documentData.finalSize*1.2;finalText.splice(i,lastSpaceIndex===i?1:0,'\r');// finalText = finalText.substr(0,i) + "\r" + finalText.substr(i === lastSpaceIndex ? i + 1 : i);
	lastSpaceIndex=-1;lineWidth=0;}else{lineWidth+=cLength;lineWidth+=trackingOffset;}}currentHeight+=fontData.ascent*documentData.finalSize/100;if(this.canResize&&documentData.finalSize>this.minimumFontSize&&boxHeight<currentHeight){documentData.finalSize-=1;documentData.finalLineHeight=documentData.finalSize*documentData.lh/documentData.s;}else{documentData.finalText=finalText;len=documentData.finalText.length;flag=false;}}}lineWidth=-trackingOffset;cLength=0;var uncollapsedSpaces=0;var currentChar;for(i=0;i<len;i+=1){newLineFlag=false;currentChar=documentData.finalText[i];charCode=currentChar.charCodeAt(0);if(charCode===13||charCode===3){uncollapsedSpaces=0;lineWidths.push(lineWidth);maxLineWidth=lineWidth>maxLineWidth?lineWidth:maxLineWidth;lineWidth=-2*trackingOffset;val='';newLineFlag=true;currentLine+=1;}else{val=currentChar;}if(fontManager.chars){charData=fontManager.getCharData(currentChar,fontData.fStyle,fontManager.getFontByName(documentData.f).fFamily);cLength=newLineFlag?0:charData.w*documentData.finalSize/100;}else{// var charWidth = fontManager.measureText(val, documentData.f, documentData.finalSize);
	// tCanvasHelper.font = documentData.finalSize + 'px '+ fontManager.getFontByName(documentData.f).fFamily;
	cLength=fontManager.measureText(val,documentData.f,documentData.finalSize);}//
	if(currentChar===' '){uncollapsedSpaces+=cLength+trackingOffset;}else{lineWidth+=cLength+trackingOffset+uncollapsedSpaces;uncollapsedSpaces=0;}letters.push({l:cLength,an:cLength,add:currentSize,n:newLineFlag,anIndexes:[],val:val,line:currentLine,animatorJustifyOffset:0});if(anchorGrouping==2){// eslint-disable-line eqeqeq
	currentSize+=cLength;if(val===''||val===' '||i===len-1){if(val===''||val===' '){currentSize-=cLength;}while(currentPos<=i){letters[currentPos].an=currentSize;letters[currentPos].ind=index;letters[currentPos].extra=cLength;currentPos+=1;}index+=1;currentSize=0;}}else if(anchorGrouping==3){// eslint-disable-line eqeqeq
	currentSize+=cLength;if(val===''||i===len-1){if(val===''){currentSize-=cLength;}while(currentPos<=i){letters[currentPos].an=currentSize;letters[currentPos].ind=index;letters[currentPos].extra=cLength;currentPos+=1;}currentSize=0;index+=1;}}else{letters[index].ind=index;letters[index].extra=0;index+=1;}}documentData.l=letters;maxLineWidth=lineWidth>maxLineWidth?lineWidth:maxLineWidth;lineWidths.push(lineWidth);if(documentData.sz){documentData.boxWidth=documentData.sz[0];documentData.justifyOffset=0;}else{documentData.boxWidth=maxLineWidth;switch(documentData.j){case 1:documentData.justifyOffset=-documentData.boxWidth;break;case 2:documentData.justifyOffset=-documentData.boxWidth/2;break;default:documentData.justifyOffset=0;}}documentData.lineWidths=lineWidths;var animators=data.a;var animatorData;var letterData;jLen=animators.length;var based;var ind;var indexes=[];for(j=0;j<jLen;j+=1){animatorData=animators[j];if(animatorData.a.sc){documentData.strokeColorAnim=true;}if(animatorData.a.sw){documentData.strokeWidthAnim=true;}if(animatorData.a.fc||animatorData.a.fh||animatorData.a.fs||animatorData.a.fb){documentData.fillColorAnim=true;}ind=0;based=animatorData.s.b;for(i=0;i<len;i+=1){letterData=letters[i];letterData.anIndexes[j]=ind;if(based==1&&letterData.val!==''||based==2&&letterData.val!==''&&letterData.val!==' '||based==3&&(letterData.n||letterData.val==' '||i==len-1)||based==4&&(letterData.n||i==len-1)){// eslint-disable-line eqeqeq
	if(animatorData.s.rn===1){indexes.push(ind);}ind+=1;}}data.a[j].s.totalChars=ind;var currentInd=-1;var newInd;if(animatorData.s.rn===1){for(i=0;i<len;i+=1){letterData=letters[i];if(currentInd!=letterData.anIndexes[j]){// eslint-disable-line eqeqeq
	currentInd=letterData.anIndexes[j];newInd=indexes.splice(Math.floor(Math.random()*indexes.length),1)[0];}letterData.anIndexes[j]=newInd;}}}documentData.yOffset=documentData.finalLineHeight||documentData.finalSize*1.2;documentData.ls=documentData.ls||0;documentData.ascent=fontData.ascent*documentData.finalSize/100;};TextProperty.prototype.updateDocumentData=function(newData,index){index=index===undefined?this.keysIndex:index;var dData=this.copyData({},this.data.d.k[index].s);dData=this.copyData(dData,newData);this.data.d.k[index].s=dData;this.recalculate(index);this.elem.addDynamicProperty(this);};TextProperty.prototype.recalculate=function(index){var dData=this.data.d.k[index].s;dData.__complete=false;this.keysIndex=0;this._isFirstFrame=true;this.getValue(dData);};TextProperty.prototype.canResizeFont=function(_canResize){this.canResize=_canResize;this.recalculate(this.keysIndex);this.elem.addDynamicProperty(this);};TextProperty.prototype.setMinimumFontSize=function(_fontValue){this.minimumFontSize=Math.floor(_fontValue)||1;this.recalculate(this.keysIndex);this.elem.addDynamicProperty(this);};var TextSelectorProp=function(){var max=Math.max;var min=Math.min;var floor=Math.floor;function TextSelectorPropFactory(elem,data){this._currentTextLength=-1;this.k=false;this.data=data;this.elem=elem;this.comp=elem.comp;this.finalS=0;this.finalE=0;this.initDynamicPropertyContainer(elem);this.s=PropertyFactory.getProp(elem,data.s||{k:0},0,0,this);if('e'in data){this.e=PropertyFactory.getProp(elem,data.e,0,0,this);}else{this.e={v:100};}this.o=PropertyFactory.getProp(elem,data.o||{k:0},0,0,this);this.xe=PropertyFactory.getProp(elem,data.xe||{k:0},0,0,this);this.ne=PropertyFactory.getProp(elem,data.ne||{k:0},0,0,this);this.sm=PropertyFactory.getProp(elem,data.sm||{k:100},0,0,this);this.a=PropertyFactory.getProp(elem,data.a,0,0.01,this);if(!this.dynamicProperties.length){this.getValue();}}TextSelectorPropFactory.prototype={getMult:function getMult(ind){if(this._currentTextLength!==this.elem.textProperty.currentData.l.length){this.getValue();}var x1=0;var y1=0;var x2=1;var y2=1;if(this.ne.v>0){x1=this.ne.v/100.0;}else{y1=-this.ne.v/100.0;}if(this.xe.v>0){x2=1.0-this.xe.v/100.0;}else{y2=1.0+this.xe.v/100.0;}var easer=BezierFactory.getBezierEasing(x1,y1,x2,y2).get;var mult=0;var s=this.finalS;var e=this.finalE;var type=this.data.sh;if(type===2){if(e===s){mult=ind>=e?1:0;}else{mult=max(0,min(0.5/(e-s)+(ind-s)/(e-s),1));}mult=easer(mult);}else if(type===3){if(e===s){mult=ind>=e?0:1;}else{mult=1-max(0,min(0.5/(e-s)+(ind-s)/(e-s),1));}mult=easer(mult);}else if(type===4){if(e===s){mult=0;}else{mult=max(0,min(0.5/(e-s)+(ind-s)/(e-s),1));if(mult<0.5){mult*=2;}else{mult=1-2*(mult-0.5);}}mult=easer(mult);}else if(type===5){if(e===s){mult=0;}else{var tot=e-s;/* ind += 0.5;
	                      mult = -4/(tot*tot)*(ind*ind)+(4/tot)*ind; */ind=min(max(0,ind+0.5-s),e-s);var x=-tot/2+ind;var a=tot/2;mult=Math.sqrt(1-x*x/(a*a));}mult=easer(mult);}else if(type===6){if(e===s){mult=0;}else{ind=min(max(0,ind+0.5-s),e-s);mult=(1+Math.cos(Math.PI+Math.PI*2*ind/(e-s)))/2;// eslint-disable-line
	}mult=easer(mult);}else{if(ind>=floor(s)){if(ind-s<0){mult=max(0,min(min(e,1)-(s-ind),1));}else{mult=max(0,min(e-ind,1));}}mult=easer(mult);}// Smoothness implementation.
	// The smoothness represents a reduced range of the original [0; 1] range.
	// if smoothness is 25%, the new range will be [0.375; 0.625]
	// Steps are:
	// - find the lower value of the new range (threshold)
	// - if multiplier is smaller than that value, floor it to 0
	// - if it is larger,
	//     - subtract the threshold
	//     - divide it by the smoothness (this will return the range to [0; 1])
	// Note: If it doesn't work on some scenarios, consider applying it before the easer.
	if(this.sm.v!==100){var smoothness=this.sm.v*0.01;if(smoothness===0){smoothness=0.00000001;}var threshold=0.5-smoothness*0.5;if(mult<threshold){mult=0;}else{mult=(mult-threshold)/smoothness;if(mult>1){mult=1;}}}return mult*this.a.v;},getValue:function getValue(newCharsFlag){this.iterateDynamicProperties();this._mdf=newCharsFlag||this._mdf;this._currentTextLength=this.elem.textProperty.currentData.l.length||0;if(newCharsFlag&&this.data.r===2){this.e.v=this._currentTextLength;}var divisor=this.data.r===2?1:100/this.data.totalChars;var o=this.o.v/divisor;var s=this.s.v/divisor+o;var e=this.e.v/divisor+o;if(s>e){var _s=s;s=e;e=_s;}this.finalS=s;this.finalE=e;}};extendPrototype([DynamicPropertyContainer],TextSelectorPropFactory);function getTextSelectorProp(elem,data,arr){return new TextSelectorPropFactory(elem,data,arr);}return {getTextSelectorProp:getTextSelectorProp};}();function TextAnimatorDataProperty(elem,animatorProps,container){var defaultData={propType:false};var getProp=PropertyFactory.getProp;var textAnimatorAnimatables=animatorProps.a;this.a={r:textAnimatorAnimatables.r?getProp(elem,textAnimatorAnimatables.r,0,degToRads,container):defaultData,rx:textAnimatorAnimatables.rx?getProp(elem,textAnimatorAnimatables.rx,0,degToRads,container):defaultData,ry:textAnimatorAnimatables.ry?getProp(elem,textAnimatorAnimatables.ry,0,degToRads,container):defaultData,sk:textAnimatorAnimatables.sk?getProp(elem,textAnimatorAnimatables.sk,0,degToRads,container):defaultData,sa:textAnimatorAnimatables.sa?getProp(elem,textAnimatorAnimatables.sa,0,degToRads,container):defaultData,s:textAnimatorAnimatables.s?getProp(elem,textAnimatorAnimatables.s,1,0.01,container):defaultData,a:textAnimatorAnimatables.a?getProp(elem,textAnimatorAnimatables.a,1,0,container):defaultData,o:textAnimatorAnimatables.o?getProp(elem,textAnimatorAnimatables.o,0,0.01,container):defaultData,p:textAnimatorAnimatables.p?getProp(elem,textAnimatorAnimatables.p,1,0,container):defaultData,sw:textAnimatorAnimatables.sw?getProp(elem,textAnimatorAnimatables.sw,0,0,container):defaultData,sc:textAnimatorAnimatables.sc?getProp(elem,textAnimatorAnimatables.sc,1,0,container):defaultData,fc:textAnimatorAnimatables.fc?getProp(elem,textAnimatorAnimatables.fc,1,0,container):defaultData,fh:textAnimatorAnimatables.fh?getProp(elem,textAnimatorAnimatables.fh,0,0,container):defaultData,fs:textAnimatorAnimatables.fs?getProp(elem,textAnimatorAnimatables.fs,0,0.01,container):defaultData,fb:textAnimatorAnimatables.fb?getProp(elem,textAnimatorAnimatables.fb,0,0.01,container):defaultData,t:textAnimatorAnimatables.t?getProp(elem,textAnimatorAnimatables.t,0,0,container):defaultData};this.s=TextSelectorProp.getTextSelectorProp(elem,animatorProps.s,container);this.s.t=animatorProps.s.t;}function TextAnimatorProperty(textData,renderType,elem){this._isFirstFrame=true;this._hasMaskedPath=false;this._frameId=-1;this._textData=textData;this._renderType=renderType;this._elem=elem;this._animatorsData=createSizedArray(this._textData.a.length);this._pathData={};this._moreOptions={alignment:{}};this.renderedLetters=[];this.lettersChangedFlag=false;this.initDynamicPropertyContainer(elem);}TextAnimatorProperty.prototype.searchProperties=function(){var i;var len=this._textData.a.length;var animatorProps;var getProp=PropertyFactory.getProp;for(i=0;i<len;i+=1){animatorProps=this._textData.a[i];this._animatorsData[i]=new TextAnimatorDataProperty(this._elem,animatorProps,this);}if(this._textData.p&&'m'in this._textData.p){this._pathData={a:getProp(this._elem,this._textData.p.a,0,0,this),f:getProp(this._elem,this._textData.p.f,0,0,this),l:getProp(this._elem,this._textData.p.l,0,0,this),r:getProp(this._elem,this._textData.p.r,0,0,this),p:getProp(this._elem,this._textData.p.p,0,0,this),m:this._elem.maskManager.getMaskProperty(this._textData.p.m)};this._hasMaskedPath=true;}else{this._hasMaskedPath=false;}this._moreOptions.alignment=getProp(this._elem,this._textData.m.a,1,0,this);};TextAnimatorProperty.prototype.getMeasures=function(documentData,lettersChangedFlag){this.lettersChangedFlag=lettersChangedFlag;if(!this._mdf&&!this._isFirstFrame&&!lettersChangedFlag&&(!this._hasMaskedPath||!this._pathData.m._mdf)){return;}this._isFirstFrame=false;var alignment=this._moreOptions.alignment.v;var animators=this._animatorsData;var textData=this._textData;var matrixHelper=this.mHelper;var renderType=this._renderType;var renderedLettersCount=this.renderedLetters.length;var xPos;var yPos;var i;var len;var letters=documentData.l;var pathInfo;var currentLength;var currentPoint;var segmentLength;var flag;var pointInd;var segmentInd;var prevPoint;var points;var segments;var partialLength;var totalLength;var perc;var tanAngle;var mask;if(this._hasMaskedPath){mask=this._pathData.m;if(!this._pathData.n||this._pathData._mdf){var paths=mask.v;if(this._pathData.r.v){paths=paths.reverse();}// TODO: release bezier data cached from previous pathInfo: this._pathData.pi
	pathInfo={tLength:0,segments:[]};len=paths._length-1;var bezierData;totalLength=0;for(i=0;i<len;i+=1){bezierData=bez.buildBezierData(paths.v[i],paths.v[i+1],[paths.o[i][0]-paths.v[i][0],paths.o[i][1]-paths.v[i][1]],[paths.i[i+1][0]-paths.v[i+1][0],paths.i[i+1][1]-paths.v[i+1][1]]);pathInfo.tLength+=bezierData.segmentLength;pathInfo.segments.push(bezierData);totalLength+=bezierData.segmentLength;}i=len;if(mask.v.c){bezierData=bez.buildBezierData(paths.v[i],paths.v[0],[paths.o[i][0]-paths.v[i][0],paths.o[i][1]-paths.v[i][1]],[paths.i[0][0]-paths.v[0][0],paths.i[0][1]-paths.v[0][1]]);pathInfo.tLength+=bezierData.segmentLength;pathInfo.segments.push(bezierData);totalLength+=bezierData.segmentLength;}this._pathData.pi=pathInfo;}pathInfo=this._pathData.pi;currentLength=this._pathData.f.v;segmentInd=0;pointInd=1;segmentLength=0;flag=true;segments=pathInfo.segments;if(currentLength<0&&mask.v.c){if(pathInfo.tLength<Math.abs(currentLength)){currentLength=-Math.abs(currentLength)%pathInfo.tLength;}segmentInd=segments.length-1;points=segments[segmentInd].points;pointInd=points.length-1;while(currentLength<0){currentLength+=points[pointInd].partialLength;pointInd-=1;if(pointInd<0){segmentInd-=1;points=segments[segmentInd].points;pointInd=points.length-1;}}}points=segments[segmentInd].points;prevPoint=points[pointInd-1];currentPoint=points[pointInd];partialLength=currentPoint.partialLength;}len=letters.length;xPos=0;yPos=0;var yOff=documentData.finalSize*1.2*0.714;var firstLine=true;var animatorProps;var animatorSelector;var j;var jLen;var letterValue;jLen=animators.length;var mult;var ind=-1;var offf;var xPathPos;var yPathPos;var initPathPos=currentLength;var initSegmentInd=segmentInd;var initPointInd=pointInd;var currentLine=-1;var elemOpacity;var sc;var sw;var fc;var k;var letterSw;var letterSc;var letterFc;var letterM='';var letterP=this.defaultPropsArray;var letterO;//
	if(documentData.j===2||documentData.j===1){var animatorJustifyOffset=0;var animatorFirstCharOffset=0;var justifyOffsetMult=documentData.j===2?-0.5:-1;var lastIndex=0;var isNewLine=true;for(i=0;i<len;i+=1){if(letters[i].n){if(animatorJustifyOffset){animatorJustifyOffset+=animatorFirstCharOffset;}while(lastIndex<i){letters[lastIndex].animatorJustifyOffset=animatorJustifyOffset;lastIndex+=1;}animatorJustifyOffset=0;isNewLine=true;}else{for(j=0;j<jLen;j+=1){animatorProps=animators[j].a;if(animatorProps.t.propType){if(isNewLine&&documentData.j===2){animatorFirstCharOffset+=animatorProps.t.v*justifyOffsetMult;}animatorSelector=animators[j].s;mult=animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);if(mult.length){animatorJustifyOffset+=animatorProps.t.v*mult[0]*justifyOffsetMult;}else{animatorJustifyOffset+=animatorProps.t.v*mult*justifyOffsetMult;}}}isNewLine=false;}}if(animatorJustifyOffset){animatorJustifyOffset+=animatorFirstCharOffset;}while(lastIndex<i){letters[lastIndex].animatorJustifyOffset=animatorJustifyOffset;lastIndex+=1;}}//
	for(i=0;i<len;i+=1){matrixHelper.reset();elemOpacity=1;if(letters[i].n){xPos=0;yPos+=documentData.yOffset;yPos+=firstLine?1:0;currentLength=initPathPos;firstLine=false;if(this._hasMaskedPath){segmentInd=initSegmentInd;pointInd=initPointInd;points=segments[segmentInd].points;prevPoint=points[pointInd-1];currentPoint=points[pointInd];partialLength=currentPoint.partialLength;segmentLength=0;}letterM='';letterFc='';letterSw='';letterO='';letterP=this.defaultPropsArray;}else{if(this._hasMaskedPath){if(currentLine!==letters[i].line){switch(documentData.j){case 1:currentLength+=totalLength-documentData.lineWidths[letters[i].line];break;case 2:currentLength+=(totalLength-documentData.lineWidths[letters[i].line])/2;break;default:break;}currentLine=letters[i].line;}if(ind!==letters[i].ind){if(letters[ind]){currentLength+=letters[ind].extra;}currentLength+=letters[i].an/2;ind=letters[i].ind;}currentLength+=alignment[0]*letters[i].an*0.005;var animatorOffset=0;for(j=0;j<jLen;j+=1){animatorProps=animators[j].a;if(animatorProps.p.propType){animatorSelector=animators[j].s;mult=animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);if(mult.length){animatorOffset+=animatorProps.p.v[0]*mult[0];}else{animatorOffset+=animatorProps.p.v[0]*mult;}}if(animatorProps.a.propType){animatorSelector=animators[j].s;mult=animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);if(mult.length){animatorOffset+=animatorProps.a.v[0]*mult[0];}else{animatorOffset+=animatorProps.a.v[0]*mult;}}}flag=true;// Force alignment only works with a single line for now
	if(this._pathData.a.v){currentLength=letters[0].an*0.5+(totalLength-this._pathData.f.v-letters[0].an*0.5-letters[letters.length-1].an*0.5)*ind/(len-1);currentLength+=this._pathData.f.v;}while(flag){if(segmentLength+partialLength>=currentLength+animatorOffset||!points){perc=(currentLength+animatorOffset-segmentLength)/currentPoint.partialLength;xPathPos=prevPoint.point[0]+(currentPoint.point[0]-prevPoint.point[0])*perc;yPathPos=prevPoint.point[1]+(currentPoint.point[1]-prevPoint.point[1])*perc;matrixHelper.translate(-alignment[0]*letters[i].an*0.005,-(alignment[1]*yOff)*0.01);flag=false;}else if(points){segmentLength+=currentPoint.partialLength;pointInd+=1;if(pointInd>=points.length){pointInd=0;segmentInd+=1;if(!segments[segmentInd]){if(mask.v.c){pointInd=0;segmentInd=0;points=segments[segmentInd].points;}else{segmentLength-=currentPoint.partialLength;points=null;}}else{points=segments[segmentInd].points;}}if(points){prevPoint=currentPoint;currentPoint=points[pointInd];partialLength=currentPoint.partialLength;}}}offf=letters[i].an/2-letters[i].add;matrixHelper.translate(-offf,0,0);}else{offf=letters[i].an/2-letters[i].add;matrixHelper.translate(-offf,0,0);// Grouping alignment
	matrixHelper.translate(-alignment[0]*letters[i].an*0.005,-alignment[1]*yOff*0.01,0);}for(j=0;j<jLen;j+=1){animatorProps=animators[j].a;if(animatorProps.t.propType){animatorSelector=animators[j].s;mult=animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);// This condition is to prevent applying tracking to first character in each line. Might be better to use a boolean "isNewLine"
	if(xPos!==0||documentData.j!==0){if(this._hasMaskedPath){if(mult.length){currentLength+=animatorProps.t.v*mult[0];}else{currentLength+=animatorProps.t.v*mult;}}else if(mult.length){xPos+=animatorProps.t.v*mult[0];}else{xPos+=animatorProps.t.v*mult;}}}}if(documentData.strokeWidthAnim){sw=documentData.sw||0;}if(documentData.strokeColorAnim){if(documentData.sc){sc=[documentData.sc[0],documentData.sc[1],documentData.sc[2]];}else{sc=[0,0,0];}}if(documentData.fillColorAnim&&documentData.fc){fc=[documentData.fc[0],documentData.fc[1],documentData.fc[2]];}for(j=0;j<jLen;j+=1){animatorProps=animators[j].a;if(animatorProps.a.propType){animatorSelector=animators[j].s;mult=animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);if(mult.length){matrixHelper.translate(-animatorProps.a.v[0]*mult[0],-animatorProps.a.v[1]*mult[1],animatorProps.a.v[2]*mult[2]);}else{matrixHelper.translate(-animatorProps.a.v[0]*mult,-animatorProps.a.v[1]*mult,animatorProps.a.v[2]*mult);}}}for(j=0;j<jLen;j+=1){animatorProps=animators[j].a;if(animatorProps.s.propType){animatorSelector=animators[j].s;mult=animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);if(mult.length){matrixHelper.scale(1+(animatorProps.s.v[0]-1)*mult[0],1+(animatorProps.s.v[1]-1)*mult[1],1);}else{matrixHelper.scale(1+(animatorProps.s.v[0]-1)*mult,1+(animatorProps.s.v[1]-1)*mult,1);}}}for(j=0;j<jLen;j+=1){animatorProps=animators[j].a;animatorSelector=animators[j].s;mult=animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);if(animatorProps.sk.propType){if(mult.length){matrixHelper.skewFromAxis(-animatorProps.sk.v*mult[0],animatorProps.sa.v*mult[1]);}else{matrixHelper.skewFromAxis(-animatorProps.sk.v*mult,animatorProps.sa.v*mult);}}if(animatorProps.r.propType){if(mult.length){matrixHelper.rotateZ(-animatorProps.r.v*mult[2]);}else{matrixHelper.rotateZ(-animatorProps.r.v*mult);}}if(animatorProps.ry.propType){if(mult.length){matrixHelper.rotateY(animatorProps.ry.v*mult[1]);}else{matrixHelper.rotateY(animatorProps.ry.v*mult);}}if(animatorProps.rx.propType){if(mult.length){matrixHelper.rotateX(animatorProps.rx.v*mult[0]);}else{matrixHelper.rotateX(animatorProps.rx.v*mult);}}if(animatorProps.o.propType){if(mult.length){elemOpacity+=(animatorProps.o.v*mult[0]-elemOpacity)*mult[0];}else{elemOpacity+=(animatorProps.o.v*mult-elemOpacity)*mult;}}if(documentData.strokeWidthAnim&&animatorProps.sw.propType){if(mult.length){sw+=animatorProps.sw.v*mult[0];}else{sw+=animatorProps.sw.v*mult;}}if(documentData.strokeColorAnim&&animatorProps.sc.propType){for(k=0;k<3;k+=1){if(mult.length){sc[k]+=(animatorProps.sc.v[k]-sc[k])*mult[0];}else{sc[k]+=(animatorProps.sc.v[k]-sc[k])*mult;}}}if(documentData.fillColorAnim&&documentData.fc){if(animatorProps.fc.propType){for(k=0;k<3;k+=1){if(mult.length){fc[k]+=(animatorProps.fc.v[k]-fc[k])*mult[0];}else{fc[k]+=(animatorProps.fc.v[k]-fc[k])*mult;}}}if(animatorProps.fh.propType){if(mult.length){fc=addHueToRGB(fc,animatorProps.fh.v*mult[0]);}else{fc=addHueToRGB(fc,animatorProps.fh.v*mult);}}if(animatorProps.fs.propType){if(mult.length){fc=addSaturationToRGB(fc,animatorProps.fs.v*mult[0]);}else{fc=addSaturationToRGB(fc,animatorProps.fs.v*mult);}}if(animatorProps.fb.propType){if(mult.length){fc=addBrightnessToRGB(fc,animatorProps.fb.v*mult[0]);}else{fc=addBrightnessToRGB(fc,animatorProps.fb.v*mult);}}}}for(j=0;j<jLen;j+=1){animatorProps=animators[j].a;if(animatorProps.p.propType){animatorSelector=animators[j].s;mult=animatorSelector.getMult(letters[i].anIndexes[j],textData.a[j].s.totalChars);if(this._hasMaskedPath){if(mult.length){matrixHelper.translate(0,animatorProps.p.v[1]*mult[0],-animatorProps.p.v[2]*mult[1]);}else{matrixHelper.translate(0,animatorProps.p.v[1]*mult,-animatorProps.p.v[2]*mult);}}else if(mult.length){matrixHelper.translate(animatorProps.p.v[0]*mult[0],animatorProps.p.v[1]*mult[1],-animatorProps.p.v[2]*mult[2]);}else{matrixHelper.translate(animatorProps.p.v[0]*mult,animatorProps.p.v[1]*mult,-animatorProps.p.v[2]*mult);}}}if(documentData.strokeWidthAnim){letterSw=sw<0?0:sw;}if(documentData.strokeColorAnim){letterSc='rgb('+Math.round(sc[0]*255)+','+Math.round(sc[1]*255)+','+Math.round(sc[2]*255)+')';}if(documentData.fillColorAnim&&documentData.fc){letterFc='rgb('+Math.round(fc[0]*255)+','+Math.round(fc[1]*255)+','+Math.round(fc[2]*255)+')';}if(this._hasMaskedPath){matrixHelper.translate(0,-documentData.ls);matrixHelper.translate(0,alignment[1]*yOff*0.01+yPos,0);if(this._pathData.p.v){tanAngle=(currentPoint.point[1]-prevPoint.point[1])/(currentPoint.point[0]-prevPoint.point[0]);var rot=Math.atan(tanAngle)*180/Math.PI;if(currentPoint.point[0]<prevPoint.point[0]){rot+=180;}matrixHelper.rotate(-rot*Math.PI/180);}matrixHelper.translate(xPathPos,yPathPos,0);currentLength-=alignment[0]*letters[i].an*0.005;if(letters[i+1]&&ind!==letters[i+1].ind){currentLength+=letters[i].an/2;currentLength+=documentData.tr*0.001*documentData.finalSize;}}else{matrixHelper.translate(xPos,yPos,0);if(documentData.ps){// matrixHelper.translate(documentData.ps[0],documentData.ps[1],0);
	matrixHelper.translate(documentData.ps[0],documentData.ps[1]+documentData.ascent,0);}switch(documentData.j){case 1:matrixHelper.translate(letters[i].animatorJustifyOffset+documentData.justifyOffset+(documentData.boxWidth-documentData.lineWidths[letters[i].line]),0,0);break;case 2:matrixHelper.translate(letters[i].animatorJustifyOffset+documentData.justifyOffset+(documentData.boxWidth-documentData.lineWidths[letters[i].line])/2,0,0);break;default:break;}matrixHelper.translate(0,-documentData.ls);matrixHelper.translate(offf,0,0);matrixHelper.translate(alignment[0]*letters[i].an*0.005,alignment[1]*yOff*0.01,0);xPos+=letters[i].l+documentData.tr*0.001*documentData.finalSize;}if(renderType==='html'){letterM=matrixHelper.toCSS();}else if(renderType==='svg'){letterM=matrixHelper.to2dCSS();}else{letterP=[matrixHelper.props[0],matrixHelper.props[1],matrixHelper.props[2],matrixHelper.props[3],matrixHelper.props[4],matrixHelper.props[5],matrixHelper.props[6],matrixHelper.props[7],matrixHelper.props[8],matrixHelper.props[9],matrixHelper.props[10],matrixHelper.props[11],matrixHelper.props[12],matrixHelper.props[13],matrixHelper.props[14],matrixHelper.props[15]];}letterO=elemOpacity;}if(renderedLettersCount<=i){letterValue=new LetterProps(letterO,letterSw,letterSc,letterFc,letterM,letterP);this.renderedLetters.push(letterValue);renderedLettersCount+=1;this.lettersChangedFlag=true;}else{letterValue=this.renderedLetters[i];this.lettersChangedFlag=letterValue.update(letterO,letterSw,letterSc,letterFc,letterM,letterP)||this.lettersChangedFlag;}}};TextAnimatorProperty.prototype.getValue=function(){if(this._elem.globalData.frameId===this._frameId){return;}this._frameId=this._elem.globalData.frameId;this.iterateDynamicProperties();};TextAnimatorProperty.prototype.mHelper=new Matrix();TextAnimatorProperty.prototype.defaultPropsArray=[];extendPrototype([DynamicPropertyContainer],TextAnimatorProperty);function ITextElement(){}ITextElement.prototype.initElement=function(data,globalData,comp){this.lettersChangedFlag=true;this.initFrame();this.initBaseData(data,globalData,comp);this.textProperty=new TextProperty(this,data.t,this.dynamicProperties);this.textAnimator=new TextAnimatorProperty(data.t,this.renderType,this);this.initTransform(data,globalData,comp);this.initHierarchy();this.initRenderable();this.initRendererElement();this.createContainerElements();this.createRenderableComponents();this.createContent();this.hide();this.textAnimator.searchProperties(this.dynamicProperties);};ITextElement.prototype.prepareFrame=function(num){this._mdf=false;this.prepareRenderableFrame(num);this.prepareProperties(num,this.isInRange);if(this.textProperty._mdf||this.textProperty._isFirstFrame){this.buildNewText();this.textProperty._isFirstFrame=false;this.textProperty._mdf=false;}};ITextElement.prototype.createPathShape=function(matrixHelper,shapes){var j;var jLen=shapes.length;var pathNodes;var shapeStr='';for(j=0;j<jLen;j+=1){if(shapes[j].ty==='sh'){pathNodes=shapes[j].ks.k;shapeStr+=buildShapeString(pathNodes,pathNodes.i.length,true,matrixHelper);}}return shapeStr;};ITextElement.prototype.updateDocumentData=function(newData,index){this.textProperty.updateDocumentData(newData,index);};ITextElement.prototype.canResizeFont=function(_canResize){this.textProperty.canResizeFont(_canResize);};ITextElement.prototype.setMinimumFontSize=function(_fontSize){this.textProperty.setMinimumFontSize(_fontSize);};ITextElement.prototype.applyTextPropertiesToMatrix=function(documentData,matrixHelper,lineNumber,xPos,yPos){if(documentData.ps){matrixHelper.translate(documentData.ps[0],documentData.ps[1]+documentData.ascent,0);}matrixHelper.translate(0,-documentData.ls,0);switch(documentData.j){case 1:matrixHelper.translate(documentData.justifyOffset+(documentData.boxWidth-documentData.lineWidths[lineNumber]),0,0);break;case 2:matrixHelper.translate(documentData.justifyOffset+(documentData.boxWidth-documentData.lineWidths[lineNumber])/2,0,0);break;default:break;}matrixHelper.translate(xPos,yPos,0);};ITextElement.prototype.buildColor=function(colorData){return 'rgb('+Math.round(colorData[0]*255)+','+Math.round(colorData[1]*255)+','+Math.round(colorData[2]*255)+')';};ITextElement.prototype.emptyProp=new LetterProps();ITextElement.prototype.destroy=function(){};var emptyShapeData={shapes:[]};function SVGTextLottieElement(data,globalData,comp){this.textSpans=[];this.renderType='svg';this.initElement(data,globalData,comp);}extendPrototype([BaseElement,TransformElement,SVGBaseElement,HierarchyElement,FrameElement,RenderableDOMElement,ITextElement],SVGTextLottieElement);SVGTextLottieElement.prototype.createContent=function(){if(this.data.singleShape&&!this.globalData.fontManager.chars){this.textContainer=createNS('text');}};SVGTextLottieElement.prototype.buildTextContents=function(textArray){var i=0;var len=textArray.length;var textContents=[];var currentTextContent='';while(i<len){if(textArray[i]===String.fromCharCode(13)||textArray[i]===String.fromCharCode(3)){textContents.push(currentTextContent);currentTextContent='';}else{currentTextContent+=textArray[i];}i+=1;}textContents.push(currentTextContent);return textContents;};SVGTextLottieElement.prototype.buildShapeData=function(data,scale){// data should probably be cloned to apply scale separately to each instance of a text on different layers
	// but since text internal content gets only rendered once and then it's never rerendered,
	// it's probably safe not to clone data and reuse always the same instance even if the object is mutated.
	// Avoiding cloning is preferred since cloning each character shape data is expensive
	if(data.shapes&&data.shapes.length){var shape=data.shapes[0];if(shape.it){var shapeItem=shape.it[shape.it.length-1];if(shapeItem.s){shapeItem.s.k[0]=scale;shapeItem.s.k[1]=scale;}}}return data;};SVGTextLottieElement.prototype.buildNewText=function(){this.addDynamicProperty(this);var i;var len;var documentData=this.textProperty.currentData;this.renderedLetters=createSizedArray(documentData?documentData.l.length:0);if(documentData.fc){this.layerElement.setAttribute('fill',this.buildColor(documentData.fc));}else{this.layerElement.setAttribute('fill','rgba(0,0,0,0)');}if(documentData.sc){this.layerElement.setAttribute('stroke',this.buildColor(documentData.sc));this.layerElement.setAttribute('stroke-width',documentData.sw);}this.layerElement.setAttribute('font-size',documentData.finalSize);var fontData=this.globalData.fontManager.getFontByName(documentData.f);if(fontData.fClass){this.layerElement.setAttribute('class',fontData.fClass);}else{this.layerElement.setAttribute('font-family',fontData.fFamily);var fWeight=documentData.fWeight;var fStyle=documentData.fStyle;this.layerElement.setAttribute('font-style',fStyle);this.layerElement.setAttribute('font-weight',fWeight);}this.layerElement.setAttribute('aria-label',documentData.t);var letters=documentData.l||[];var usesGlyphs=!!this.globalData.fontManager.chars;len=letters.length;var tSpan;var matrixHelper=this.mHelper;var shapeStr='';var singleShape=this.data.singleShape;var xPos=0;var yPos=0;var firstLine=true;var trackingOffset=documentData.tr*0.001*documentData.finalSize;if(singleShape&&!usesGlyphs&&!documentData.sz){var tElement=this.textContainer;var justify='start';switch(documentData.j){case 1:justify='end';break;case 2:justify='middle';break;default:justify='start';break;}tElement.setAttribute('text-anchor',justify);tElement.setAttribute('letter-spacing',trackingOffset);var textContent=this.buildTextContents(documentData.finalText);len=textContent.length;yPos=documentData.ps?documentData.ps[1]+documentData.ascent:0;for(i=0;i<len;i+=1){tSpan=this.textSpans[i].span||createNS('tspan');tSpan.textContent=textContent[i];tSpan.setAttribute('x',0);tSpan.setAttribute('y',yPos);tSpan.style.display='inherit';tElement.appendChild(tSpan);if(!this.textSpans[i]){this.textSpans[i]={span:null,glyph:null};}this.textSpans[i].span=tSpan;yPos+=documentData.finalLineHeight;}this.layerElement.appendChild(tElement);}else{var cachedSpansLength=this.textSpans.length;var charData;for(i=0;i<len;i+=1){if(!this.textSpans[i]){this.textSpans[i]={span:null,childSpan:null,glyph:null};}if(!usesGlyphs||!singleShape||i===0){tSpan=cachedSpansLength>i?this.textSpans[i].span:createNS(usesGlyphs?'g':'text');if(cachedSpansLength<=i){tSpan.setAttribute('stroke-linecap','butt');tSpan.setAttribute('stroke-linejoin','round');tSpan.setAttribute('stroke-miterlimit','4');this.textSpans[i].span=tSpan;if(usesGlyphs){var childSpan=createNS('g');tSpan.appendChild(childSpan);this.textSpans[i].childSpan=childSpan;}this.textSpans[i].span=tSpan;this.layerElement.appendChild(tSpan);}tSpan.style.display='inherit';}matrixHelper.reset();if(singleShape){if(letters[i].n){xPos=-trackingOffset;yPos+=documentData.yOffset;yPos+=firstLine?1:0;firstLine=false;}this.applyTextPropertiesToMatrix(documentData,matrixHelper,letters[i].line,xPos,yPos);xPos+=letters[i].l||0;// xPos += letters[i].val === ' ' ? 0 : trackingOffset;
	xPos+=trackingOffset;}if(usesGlyphs){charData=this.globalData.fontManager.getCharData(documentData.finalText[i],fontData.fStyle,this.globalData.fontManager.getFontByName(documentData.f).fFamily);var glyphElement;// t === 1 means the character has been replaced with an animated shaped
	if(charData.t===1){glyphElement=new SVGCompElement(charData.data,this.globalData,this);}else{var data=emptyShapeData;if(charData.data&&charData.data.shapes){data=this.buildShapeData(charData.data,documentData.finalSize);}glyphElement=new SVGShapeElement(data,this.globalData,this);}if(this.textSpans[i].glyph){var glyph=this.textSpans[i].glyph;this.textSpans[i].childSpan.removeChild(glyph.layerElement);glyph.destroy();}this.textSpans[i].glyph=glyphElement;glyphElement._debug=true;glyphElement.prepareFrame(0);glyphElement.renderFrame();this.textSpans[i].childSpan.appendChild(glyphElement.layerElement);// when using animated shapes, the layer will be scaled instead of replacing the internal scale
	// this might have issues with strokes and might need a different solution
	if(charData.t===1){this.textSpans[i].childSpan.setAttribute('transform','scale('+documentData.finalSize/100+','+documentData.finalSize/100+')');}}else{if(singleShape){tSpan.setAttribute('transform','translate('+matrixHelper.props[12]+','+matrixHelper.props[13]+')');}tSpan.textContent=letters[i].val;tSpan.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');}//
	}if(singleShape&&tSpan){tSpan.setAttribute('d',shapeStr);}}while(i<this.textSpans.length){this.textSpans[i].span.style.display='none';i+=1;}this._sizeChanged=true;};SVGTextLottieElement.prototype.sourceRectAtTime=function(){this.prepareFrame(this.comp.renderedFrame-this.data.st);this.renderInnerContent();if(this._sizeChanged){this._sizeChanged=false;var textBox=this.layerElement.getBBox();this.bbox={top:textBox.y,left:textBox.x,width:textBox.width,height:textBox.height};}return this.bbox;};SVGTextLottieElement.prototype.getValue=function(){var i;var len=this.textSpans.length;var glyphElement;this.renderedFrame=this.comp.renderedFrame;for(i=0;i<len;i+=1){glyphElement=this.textSpans[i].glyph;if(glyphElement){glyphElement.prepareFrame(this.comp.renderedFrame-this.data.st);if(glyphElement._mdf){this._mdf=true;}}}};SVGTextLottieElement.prototype.renderInnerContent=function(){if(!this.data.singleShape||this._mdf){this.textAnimator.getMeasures(this.textProperty.currentData,this.lettersChangedFlag);if(this.lettersChangedFlag||this.textAnimator.lettersChangedFlag){this._sizeChanged=true;var i;var len;var renderedLetters=this.textAnimator.renderedLetters;var letters=this.textProperty.currentData.l;len=letters.length;var renderedLetter;var textSpan;var glyphElement;for(i=0;i<len;i+=1){if(!letters[i].n){renderedLetter=renderedLetters[i];textSpan=this.textSpans[i].span;glyphElement=this.textSpans[i].glyph;if(glyphElement){glyphElement.renderFrame();}if(renderedLetter._mdf.m){textSpan.setAttribute('transform',renderedLetter.m);}if(renderedLetter._mdf.o){textSpan.setAttribute('opacity',renderedLetter.o);}if(renderedLetter._mdf.sw){textSpan.setAttribute('stroke-width',renderedLetter.sw);}if(renderedLetter._mdf.sc){textSpan.setAttribute('stroke',renderedLetter.sc);}if(renderedLetter._mdf.fc){textSpan.setAttribute('fill',renderedLetter.fc);}}}}}};function ISolidElement(data,globalData,comp){this.initElement(data,globalData,comp);}extendPrototype([IImageElement],ISolidElement);ISolidElement.prototype.createContent=function(){var rect=createNS('rect');/// /rect.style.width = this.data.sw;
	/// /rect.style.height = this.data.sh;
	/// /rect.style.fill = this.data.sc;
	rect.setAttribute('width',this.data.sw);rect.setAttribute('height',this.data.sh);rect.setAttribute('fill',this.data.sc);this.layerElement.appendChild(rect);};function NullElement(data,globalData,comp){this.initFrame();this.initBaseData(data,globalData,comp);this.initFrame();this.initTransform(data,globalData,comp);this.initHierarchy();}NullElement.prototype.prepareFrame=function(num){this.prepareProperties(num,true);};NullElement.prototype.renderFrame=function(){};NullElement.prototype.getBaseElement=function(){return null;};NullElement.prototype.destroy=function(){};NullElement.prototype.sourceRectAtTime=function(){};NullElement.prototype.hide=function(){};extendPrototype([BaseElement,TransformElement,HierarchyElement,FrameElement],NullElement);function SVGRendererBase(){}extendPrototype([BaseRenderer],SVGRendererBase);SVGRendererBase.prototype.createNull=function(data){return new NullElement(data,this.globalData,this);};SVGRendererBase.prototype.createShape=function(data){return new SVGShapeElement(data,this.globalData,this);};SVGRendererBase.prototype.createText=function(data){return new SVGTextLottieElement(data,this.globalData,this);};SVGRendererBase.prototype.createImage=function(data){return new IImageElement(data,this.globalData,this);};SVGRendererBase.prototype.createSolid=function(data){return new ISolidElement(data,this.globalData,this);};SVGRendererBase.prototype.configAnimation=function(animData){this.svgElement.setAttribute('xmlns','http://www.w3.org/2000/svg');if(this.renderConfig.viewBoxSize){this.svgElement.setAttribute('viewBox',this.renderConfig.viewBoxSize);}else{this.svgElement.setAttribute('viewBox','0 0 '+animData.w+' '+animData.h);}if(!this.renderConfig.viewBoxOnly){this.svgElement.setAttribute('width',animData.w);this.svgElement.setAttribute('height',animData.h);this.svgElement.style.width='100%';this.svgElement.style.height='100%';this.svgElement.style.transform='translate3d(0,0,0)';this.svgElement.style.contentVisibility=this.renderConfig.contentVisibility;}if(this.renderConfig.width){this.svgElement.setAttribute('width',this.renderConfig.width);}if(this.renderConfig.height){this.svgElement.setAttribute('height',this.renderConfig.height);}if(this.renderConfig.className){this.svgElement.setAttribute('class',this.renderConfig.className);}if(this.renderConfig.id){this.svgElement.setAttribute('id',this.renderConfig.id);}if(this.renderConfig.focusable!==undefined){this.svgElement.setAttribute('focusable',this.renderConfig.focusable);}this.svgElement.setAttribute('preserveAspectRatio',this.renderConfig.preserveAspectRatio);// this.layerElement.style.transform = 'translate3d(0,0,0)';
	// this.layerElement.style.transformOrigin = this.layerElement.style.mozTransformOrigin = this.layerElement.style.webkitTransformOrigin = this.layerElement.style['-webkit-transform'] = "0px 0px 0px";
	this.animationItem.wrapper.appendChild(this.svgElement);// Mask animation
	var defs=this.globalData.defs;this.setupGlobalData(animData,defs);this.globalData.progressiveLoad=this.renderConfig.progressiveLoad;this.data=animData;var maskElement=createNS('clipPath');var rect=createNS('rect');rect.setAttribute('width',animData.w);rect.setAttribute('height',animData.h);rect.setAttribute('x',0);rect.setAttribute('y',0);var maskId=createElementID();maskElement.setAttribute('id',maskId);maskElement.appendChild(rect);this.layerElement.setAttribute('clip-path','url('+getLocationHref()+'#'+maskId+')');defs.appendChild(maskElement);this.layers=animData.layers;this.elements=createSizedArray(animData.layers.length);};SVGRendererBase.prototype.destroy=function(){if(this.animationItem.wrapper){this.animationItem.wrapper.innerText='';}this.layerElement=null;this.globalData.defs=null;var i;var len=this.layers?this.layers.length:0;for(i=0;i<len;i+=1){if(this.elements[i]){this.elements[i].destroy();}}this.elements.length=0;this.destroyed=true;this.animationItem=null;};SVGRendererBase.prototype.updateContainerSize=function(){};SVGRendererBase.prototype.buildItem=function(pos){var elements=this.elements;if(elements[pos]||this.layers[pos].ty===99){return;}elements[pos]=true;var element=this.createItem(this.layers[pos]);elements[pos]=element;if(getExpressionsPlugin()){if(this.layers[pos].ty===0){this.globalData.projectInterface.registerComposition(element);}element.initExpressions();}this.appendElementInPos(element,pos);if(this.layers[pos].tt){if(!this.elements[pos-1]||this.elements[pos-1]===true){this.buildItem(pos-1);this.addPendingElement(element);}else{element.setMatte(elements[pos-1].layerId);}}};SVGRendererBase.prototype.checkPendingElements=function(){while(this.pendingElements.length){var element=this.pendingElements.pop();element.checkParenting();if(element.data.tt){var i=0;var len=this.elements.length;while(i<len){if(this.elements[i]===element){element.setMatte(this.elements[i-1].layerId);break;}i+=1;}}}};SVGRendererBase.prototype.renderFrame=function(num){if(this.renderedFrame===num||this.destroyed){return;}if(num===null){num=this.renderedFrame;}else{this.renderedFrame=num;}// console.log('-------');
	// console.log('FRAME ',num);
	this.globalData.frameNum=num;this.globalData.frameId+=1;this.globalData.projectInterface.currentFrame=num;this.globalData._mdf=false;var i;var len=this.layers.length;if(!this.completeLayers){this.checkLayers(num);}for(i=len-1;i>=0;i-=1){if(this.completeLayers||this.elements[i]){this.elements[i].prepareFrame(num-this.layers[i].st);}}if(this.globalData._mdf){for(i=0;i<len;i+=1){if(this.completeLayers||this.elements[i]){this.elements[i].renderFrame();}}}};SVGRendererBase.prototype.appendElementInPos=function(element,pos){var newElement=element.getBaseElement();if(!newElement){return;}var i=0;var nextElement;while(i<pos){if(this.elements[i]&&this.elements[i]!==true&&this.elements[i].getBaseElement()){nextElement=this.elements[i].getBaseElement();}i+=1;}if(nextElement){this.layerElement.insertBefore(newElement,nextElement);}else{this.layerElement.appendChild(newElement);}};SVGRendererBase.prototype.hide=function(){this.layerElement.style.display='none';};SVGRendererBase.prototype.show=function(){this.layerElement.style.display='block';};function ICompElement(){}extendPrototype([BaseElement,TransformElement,HierarchyElement,FrameElement,RenderableDOMElement],ICompElement);ICompElement.prototype.initElement=function(data,globalData,comp){this.initFrame();this.initBaseData(data,globalData,comp);this.initTransform(data,globalData,comp);this.initRenderable();this.initHierarchy();this.initRendererElement();this.createContainerElements();this.createRenderableComponents();if(this.data.xt||!globalData.progressiveLoad){this.buildAllItems();}this.hide();};/* ICompElement.prototype.hide = function(){
	      if(!this.hidden){
	          this.hideElement();
	          var i,len = this.elements.length;
	          for( i = 0; i < len; i+=1 ){
	              if(this.elements[i]){
	                  this.elements[i].hide();
	              }
	          }
	      }
	  }; */ICompElement.prototype.prepareFrame=function(num){this._mdf=false;this.prepareRenderableFrame(num);this.prepareProperties(num,this.isInRange);if(!this.isInRange&&!this.data.xt){return;}if(!this.tm._placeholder){var timeRemapped=this.tm.v;if(timeRemapped===this.data.op){timeRemapped=this.data.op-1;}this.renderedFrame=timeRemapped;}else{this.renderedFrame=num/this.data.sr;}var i;var len=this.elements.length;if(!this.completeLayers){this.checkLayers(this.renderedFrame);}// This iteration needs to be backwards because of how expressions connect between each other
	for(i=len-1;i>=0;i-=1){if(this.completeLayers||this.elements[i]){this.elements[i].prepareFrame(this.renderedFrame-this.layers[i].st);if(this.elements[i]._mdf){this._mdf=true;}}}};ICompElement.prototype.renderInnerContent=function(){var i;var len=this.layers.length;for(i=0;i<len;i+=1){if(this.completeLayers||this.elements[i]){this.elements[i].renderFrame();}}};ICompElement.prototype.setElements=function(elems){this.elements=elems;};ICompElement.prototype.getElements=function(){return this.elements;};ICompElement.prototype.destroyElements=function(){var i;var len=this.layers.length;for(i=0;i<len;i+=1){if(this.elements[i]){this.elements[i].destroy();}}};ICompElement.prototype.destroy=function(){this.destroyElements();this.destroyBaseElement();};function SVGCompElement(data,globalData,comp){this.layers=data.layers;this.supports3d=true;this.completeLayers=false;this.pendingElements=[];this.elements=this.layers?createSizedArray(this.layers.length):[];this.initElement(data,globalData,comp);this.tm=data.tm?PropertyFactory.getProp(this,data.tm,0,globalData.frameRate,this):{_placeholder:true};}extendPrototype([SVGRendererBase,ICompElement,SVGBaseElement],SVGCompElement);SVGCompElement.prototype.createComp=function(data){return new SVGCompElement(data,this.globalData,this);};function SVGRenderer(animationItem,config){this.animationItem=animationItem;this.layers=null;this.renderedFrame=-1;this.svgElement=createNS('svg');var ariaLabel='';if(config&&config.title){var titleElement=createNS('title');var titleId=createElementID();titleElement.setAttribute('id',titleId);titleElement.textContent=config.title;this.svgElement.appendChild(titleElement);ariaLabel+=titleId;}if(config&&config.description){var descElement=createNS('desc');var descId=createElementID();descElement.setAttribute('id',descId);descElement.textContent=config.description;this.svgElement.appendChild(descElement);ariaLabel+=' '+descId;}if(ariaLabel){this.svgElement.setAttribute('aria-labelledby',ariaLabel);}var defs=createNS('defs');this.svgElement.appendChild(defs);var maskElement=createNS('g');this.svgElement.appendChild(maskElement);this.layerElement=maskElement;this.renderConfig={preserveAspectRatio:config&&config.preserveAspectRatio||'xMidYMid meet',imagePreserveAspectRatio:config&&config.imagePreserveAspectRatio||'xMidYMid slice',contentVisibility:config&&config.contentVisibility||'visible',progressiveLoad:config&&config.progressiveLoad||false,hideOnTransparent:!(config&&config.hideOnTransparent===false),viewBoxOnly:config&&config.viewBoxOnly||false,viewBoxSize:config&&config.viewBoxSize||false,className:config&&config.className||'',id:config&&config.id||'',focusable:config&&config.focusable,filterSize:{width:config&&config.filterSize&&config.filterSize.width||'100%',height:config&&config.filterSize&&config.filterSize.height||'100%',x:config&&config.filterSize&&config.filterSize.x||'0%',y:config&&config.filterSize&&config.filterSize.y||'0%'},width:config&&config.width,height:config&&config.height};this.globalData={_mdf:false,frameNum:-1,defs:defs,renderConfig:this.renderConfig};this.elements=[];this.pendingElements=[];this.destroyed=false;this.rendererType='svg';}extendPrototype([SVGRendererBase],SVGRenderer);SVGRenderer.prototype.createComp=function(data){return new SVGCompElement(data,this.globalData,this);};function CVContextData(){this.saved=[];this.cArrPos=0;this.cTr=new Matrix();this.cO=1;var i;var len=15;this.savedOp=createTypedArray('float32',len);for(i=0;i<len;i+=1){this.saved[i]=createTypedArray('float32',16);}this._length=len;}CVContextData.prototype.duplicate=function(){var newLength=this._length*2;var currentSavedOp=this.savedOp;this.savedOp=createTypedArray('float32',newLength);this.savedOp.set(currentSavedOp);var i=0;for(i=this._length;i<newLength;i+=1){this.saved[i]=createTypedArray('float32',16);}this._length=newLength;};CVContextData.prototype.reset=function(){this.cArrPos=0;this.cTr.reset();this.cO=1;};function ShapeTransformManager(){this.sequences={};this.sequenceList=[];this.transform_key_count=0;}ShapeTransformManager.prototype={addTransformSequence:function addTransformSequence(transforms){var i;var len=transforms.length;var key='_';for(i=0;i<len;i+=1){key+=transforms[i].transform.key+'_';}var sequence=this.sequences[key];if(!sequence){sequence={transforms:[].concat(transforms),finalTransform:new Matrix(),_mdf:false};this.sequences[key]=sequence;this.sequenceList.push(sequence);}return sequence;},processSequence:function processSequence(sequence,isFirstFrame){var i=0;var len=sequence.transforms.length;var _mdf=isFirstFrame;while(i<len&&!isFirstFrame){if(sequence.transforms[i].transform.mProps._mdf){_mdf=true;break;}i+=1;}if(_mdf){var props;sequence.finalTransform.reset();for(i=len-1;i>=0;i-=1){props=sequence.transforms[i].transform.mProps.v.props;sequence.finalTransform.transform(props[0],props[1],props[2],props[3],props[4],props[5],props[6],props[7],props[8],props[9],props[10],props[11],props[12],props[13],props[14],props[15]);}}sequence._mdf=_mdf;},processSequences:function processSequences(isFirstFrame){var i;var len=this.sequenceList.length;for(i=0;i<len;i+=1){this.processSequence(this.sequenceList[i],isFirstFrame);}},getNewKey:function getNewKey(){this.transform_key_count+=1;return '_'+this.transform_key_count;}};function CVEffects(){}CVEffects.prototype.renderFrame=function(){};function CVMaskElement(data,element){this.data=data;this.element=element;this.masksProperties=this.data.masksProperties||[];this.viewData=createSizedArray(this.masksProperties.length);var i;var len=this.masksProperties.length;var hasMasks=false;for(i=0;i<len;i+=1){if(this.masksProperties[i].mode!=='n'){hasMasks=true;}this.viewData[i]=ShapePropertyFactory.getShapeProp(this.element,this.masksProperties[i],3);}this.hasMasks=hasMasks;if(hasMasks){this.element.addRenderableComponent(this);}}CVMaskElement.prototype.renderFrame=function(){if(!this.hasMasks){return;}var transform=this.element.finalTransform.mat;var ctx=this.element.canvasContext;var i;var len=this.masksProperties.length;var pt;var pts;var data;ctx.beginPath();for(i=0;i<len;i+=1){if(this.masksProperties[i].mode!=='n'){if(this.masksProperties[i].inv){ctx.moveTo(0,0);ctx.lineTo(this.element.globalData.compSize.w,0);ctx.lineTo(this.element.globalData.compSize.w,this.element.globalData.compSize.h);ctx.lineTo(0,this.element.globalData.compSize.h);ctx.lineTo(0,0);}data=this.viewData[i].v;pt=transform.applyToPointArray(data.v[0][0],data.v[0][1],0);ctx.moveTo(pt[0],pt[1]);var j;var jLen=data._length;for(j=1;j<jLen;j+=1){pts=transform.applyToTriplePoints(data.o[j-1],data.i[j],data.v[j]);ctx.bezierCurveTo(pts[0],pts[1],pts[2],pts[3],pts[4],pts[5]);}pts=transform.applyToTriplePoints(data.o[j-1],data.i[0],data.v[0]);ctx.bezierCurveTo(pts[0],pts[1],pts[2],pts[3],pts[4],pts[5]);}}this.element.globalData.renderer.save(true);ctx.clip();};CVMaskElement.prototype.getMaskProperty=MaskElement.prototype.getMaskProperty;CVMaskElement.prototype.destroy=function(){this.element=null;};function CVBaseElement(){}CVBaseElement.prototype={createElements:function createElements(){},initRendererElement:function initRendererElement(){},createContainerElements:function createContainerElements(){this.canvasContext=this.globalData.canvasContext;this.renderableEffectsManager=new CVEffects(this);},createContent:function createContent(){},setBlendMode:function setBlendMode(){var globalData=this.globalData;if(globalData.blendMode!==this.data.bm){globalData.blendMode=this.data.bm;var blendModeValue=getBlendMode(this.data.bm);globalData.canvasContext.globalCompositeOperation=blendModeValue;}},createRenderableComponents:function createRenderableComponents(){this.maskManager=new CVMaskElement(this.data,this);},hideElement:function hideElement(){if(!this.hidden&&(!this.isInRange||this.isTransparent)){this.hidden=true;}},showElement:function showElement(){if(this.isInRange&&!this.isTransparent){this.hidden=false;this._isFirstFrame=true;this.maskManager._isFirstFrame=true;}},renderFrame:function renderFrame(){if(this.hidden||this.data.hd){return;}this.renderTransform();this.renderRenderable();this.setBlendMode();var forceRealStack=this.data.ty===0;this.globalData.renderer.save(forceRealStack);this.globalData.renderer.ctxTransform(this.finalTransform.mat.props);this.globalData.renderer.ctxOpacity(this.finalTransform.mProp.o.v);this.renderInnerContent();this.globalData.renderer.restore(forceRealStack);if(this.maskManager.hasMasks){this.globalData.renderer.restore(true);}if(this._isFirstFrame){this._isFirstFrame=false;}},destroy:function destroy(){this.canvasContext=null;this.data=null;this.globalData=null;this.maskManager.destroy();},mHelper:new Matrix()};CVBaseElement.prototype.hide=CVBaseElement.prototype.hideElement;CVBaseElement.prototype.show=CVBaseElement.prototype.showElement;function CVShapeData(element,data,styles,transformsManager){this.styledShapes=[];this.tr=[0,0,0,0,0,0];var ty=4;if(data.ty==='rc'){ty=5;}else if(data.ty==='el'){ty=6;}else if(data.ty==='sr'){ty=7;}this.sh=ShapePropertyFactory.getShapeProp(element,data,ty,element);var i;var len=styles.length;var styledShape;for(i=0;i<len;i+=1){if(!styles[i].closed){styledShape={transforms:transformsManager.addTransformSequence(styles[i].transforms),trNodes:[]};this.styledShapes.push(styledShape);styles[i].elements.push(styledShape);}}}CVShapeData.prototype.setAsAnimated=SVGShapeData.prototype.setAsAnimated;function CVShapeElement(data,globalData,comp){this.shapes=[];this.shapesData=data.shapes;this.stylesList=[];this.itemsData=[];this.prevViewData=[];this.shapeModifiers=[];this.processedElements=[];this.transformsManager=new ShapeTransformManager();this.initElement(data,globalData,comp);}extendPrototype([BaseElement,TransformElement,CVBaseElement,IShapeElement,HierarchyElement,FrameElement,RenderableElement],CVShapeElement);CVShapeElement.prototype.initElement=RenderableDOMElement.prototype.initElement;CVShapeElement.prototype.transformHelper={opacity:1,_opMdf:false};CVShapeElement.prototype.dashResetter=[];CVShapeElement.prototype.createContent=function(){this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,true,[]);};CVShapeElement.prototype.createStyleElement=function(data,transforms){var styleElem={data:data,type:data.ty,preTransforms:this.transformsManager.addTransformSequence(transforms),transforms:[],elements:[],closed:data.hd===true};var elementData={};if(data.ty==='fl'||data.ty==='st'){elementData.c=PropertyFactory.getProp(this,data.c,1,255,this);if(!elementData.c.k){styleElem.co='rgb('+bmFloor(elementData.c.v[0])+','+bmFloor(elementData.c.v[1])+','+bmFloor(elementData.c.v[2])+')';}}else if(data.ty==='gf'||data.ty==='gs'){elementData.s=PropertyFactory.getProp(this,data.s,1,null,this);elementData.e=PropertyFactory.getProp(this,data.e,1,null,this);elementData.h=PropertyFactory.getProp(this,data.h||{k:0},0,0.01,this);elementData.a=PropertyFactory.getProp(this,data.a||{k:0},0,degToRads,this);elementData.g=new GradientProperty(this,data.g,this);}elementData.o=PropertyFactory.getProp(this,data.o,0,0.01,this);if(data.ty==='st'||data.ty==='gs'){styleElem.lc=lineCapEnum[data.lc||2];styleElem.lj=lineJoinEnum[data.lj||2];if(data.lj==1){// eslint-disable-line eqeqeq
	styleElem.ml=data.ml;}elementData.w=PropertyFactory.getProp(this,data.w,0,null,this);if(!elementData.w.k){styleElem.wi=elementData.w.v;}if(data.d){var d=new DashProperty(this,data.d,'canvas',this);elementData.d=d;if(!elementData.d.k){styleElem.da=elementData.d.dashArray;styleElem["do"]=elementData.d.dashoffset[0];}}}else{styleElem.r=data.r===2?'evenodd':'nonzero';}this.stylesList.push(styleElem);elementData.style=styleElem;return elementData;};CVShapeElement.prototype.createGroupElement=function(){var elementData={it:[],prevViewData:[]};return elementData;};CVShapeElement.prototype.createTransformElement=function(data){var elementData={transform:{opacity:1,_opMdf:false,key:this.transformsManager.getNewKey(),op:PropertyFactory.getProp(this,data.o,0,0.01,this),mProps:TransformPropertyFactory.getTransformProperty(this,data,this)}};return elementData;};CVShapeElement.prototype.createShapeElement=function(data){var elementData=new CVShapeData(this,data,this.stylesList,this.transformsManager);this.shapes.push(elementData);this.addShapeToModifiers(elementData);return elementData;};CVShapeElement.prototype.reloadShapes=function(){this._isFirstFrame=true;var i;var len=this.itemsData.length;for(i=0;i<len;i+=1){this.prevViewData[i]=this.itemsData[i];}this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,true,[]);len=this.dynamicProperties.length;for(i=0;i<len;i+=1){this.dynamicProperties[i].getValue();}this.renderModifiers();this.transformsManager.processSequences(this._isFirstFrame);};CVShapeElement.prototype.addTransformToStyleList=function(transform){var i;var len=this.stylesList.length;for(i=0;i<len;i+=1){if(!this.stylesList[i].closed){this.stylesList[i].transforms.push(transform);}}};CVShapeElement.prototype.removeTransformFromStyleList=function(){var i;var len=this.stylesList.length;for(i=0;i<len;i+=1){if(!this.stylesList[i].closed){this.stylesList[i].transforms.pop();}}};CVShapeElement.prototype.closeStyles=function(styles){var i;var len=styles.length;for(i=0;i<len;i+=1){styles[i].closed=true;}};CVShapeElement.prototype.searchShapes=function(arr,itemsData,prevViewData,shouldRender,transforms){var i;var len=arr.length-1;var j;var jLen;var ownStyles=[];var ownModifiers=[];var processedPos;var modifier;var currentTransform;var ownTransforms=[].concat(transforms);for(i=len;i>=0;i-=1){processedPos=this.searchProcessedElement(arr[i]);if(!processedPos){arr[i]._shouldRender=shouldRender;}else{itemsData[i]=prevViewData[processedPos-1];}if(arr[i].ty==='fl'||arr[i].ty==='st'||arr[i].ty==='gf'||arr[i].ty==='gs'){if(!processedPos){itemsData[i]=this.createStyleElement(arr[i],ownTransforms);}else{itemsData[i].style.closed=false;}ownStyles.push(itemsData[i].style);}else if(arr[i].ty==='gr'){if(!processedPos){itemsData[i]=this.createGroupElement(arr[i]);}else{jLen=itemsData[i].it.length;for(j=0;j<jLen;j+=1){itemsData[i].prevViewData[j]=itemsData[i].it[j];}}this.searchShapes(arr[i].it,itemsData[i].it,itemsData[i].prevViewData,shouldRender,ownTransforms);}else if(arr[i].ty==='tr'){if(!processedPos){currentTransform=this.createTransformElement(arr[i]);itemsData[i]=currentTransform;}ownTransforms.push(itemsData[i]);this.addTransformToStyleList(itemsData[i]);}else if(arr[i].ty==='sh'||arr[i].ty==='rc'||arr[i].ty==='el'||arr[i].ty==='sr'){if(!processedPos){itemsData[i]=this.createShapeElement(arr[i]);}}else if(arr[i].ty==='tm'||arr[i].ty==='rd'||arr[i].ty==='pb'){if(!processedPos){modifier=ShapeModifiers.getModifier(arr[i].ty);modifier.init(this,arr[i]);itemsData[i]=modifier;this.shapeModifiers.push(modifier);}else{modifier=itemsData[i];modifier.closed=false;}ownModifiers.push(modifier);}else if(arr[i].ty==='rp'){if(!processedPos){modifier=ShapeModifiers.getModifier(arr[i].ty);itemsData[i]=modifier;modifier.init(this,arr,i,itemsData);this.shapeModifiers.push(modifier);shouldRender=false;}else{modifier=itemsData[i];modifier.closed=true;}ownModifiers.push(modifier);}this.addProcessedElement(arr[i],i+1);}this.removeTransformFromStyleList();this.closeStyles(ownStyles);len=ownModifiers.length;for(i=0;i<len;i+=1){ownModifiers[i].closed=true;}};CVShapeElement.prototype.renderInnerContent=function(){this.transformHelper.opacity=1;this.transformHelper._opMdf=false;this.renderModifiers();this.transformsManager.processSequences(this._isFirstFrame);this.renderShape(this.transformHelper,this.shapesData,this.itemsData,true);};CVShapeElement.prototype.renderShapeTransform=function(parentTransform,groupTransform){if(parentTransform._opMdf||groupTransform.op._mdf||this._isFirstFrame){groupTransform.opacity=parentTransform.opacity;groupTransform.opacity*=groupTransform.op.v;groupTransform._opMdf=true;}};CVShapeElement.prototype.drawLayer=function(){var i;var len=this.stylesList.length;var j;var jLen;var k;var kLen;var elems;var nodes;var renderer=this.globalData.renderer;var ctx=this.globalData.canvasContext;var type;var currentStyle;for(i=0;i<len;i+=1){currentStyle=this.stylesList[i];type=currentStyle.type;// Skipping style when
	// Stroke width equals 0
	// style should not be rendered (extra unused repeaters)
	// current opacity equals 0
	// global opacity equals 0
	if(!((type==='st'||type==='gs')&&currentStyle.wi===0||!currentStyle.data._shouldRender||currentStyle.coOp===0||this.globalData.currentGlobalAlpha===0)){renderer.save();elems=currentStyle.elements;if(type==='st'||type==='gs'){ctx.strokeStyle=type==='st'?currentStyle.co:currentStyle.grd;ctx.lineWidth=currentStyle.wi;ctx.lineCap=currentStyle.lc;ctx.lineJoin=currentStyle.lj;ctx.miterLimit=currentStyle.ml||0;}else{ctx.fillStyle=type==='fl'?currentStyle.co:currentStyle.grd;}renderer.ctxOpacity(currentStyle.coOp);if(type!=='st'&&type!=='gs'){ctx.beginPath();}renderer.ctxTransform(currentStyle.preTransforms.finalTransform.props);jLen=elems.length;for(j=0;j<jLen;j+=1){if(type==='st'||type==='gs'){ctx.beginPath();if(currentStyle.da){ctx.setLineDash(currentStyle.da);ctx.lineDashOffset=currentStyle["do"];}}nodes=elems[j].trNodes;kLen=nodes.length;for(k=0;k<kLen;k+=1){if(nodes[k].t==='m'){ctx.moveTo(nodes[k].p[0],nodes[k].p[1]);}else if(nodes[k].t==='c'){ctx.bezierCurveTo(nodes[k].pts[0],nodes[k].pts[1],nodes[k].pts[2],nodes[k].pts[3],nodes[k].pts[4],nodes[k].pts[5]);}else{ctx.closePath();}}if(type==='st'||type==='gs'){ctx.stroke();if(currentStyle.da){ctx.setLineDash(this.dashResetter);}}}if(type!=='st'&&type!=='gs'){ctx.fill(currentStyle.r);}renderer.restore();}}};CVShapeElement.prototype.renderShape=function(parentTransform,items,data,isMain){var i;var len=items.length-1;var groupTransform;groupTransform=parentTransform;for(i=len;i>=0;i-=1){if(items[i].ty==='tr'){groupTransform=data[i].transform;this.renderShapeTransform(parentTransform,groupTransform);}else if(items[i].ty==='sh'||items[i].ty==='el'||items[i].ty==='rc'||items[i].ty==='sr'){this.renderPath(items[i],data[i]);}else if(items[i].ty==='fl'){this.renderFill(items[i],data[i],groupTransform);}else if(items[i].ty==='st'){this.renderStroke(items[i],data[i],groupTransform);}else if(items[i].ty==='gf'||items[i].ty==='gs'){this.renderGradientFill(items[i],data[i],groupTransform);}else if(items[i].ty==='gr'){this.renderShape(groupTransform,items[i].it,data[i].it);}else if(items[i].ty==='tm');}if(isMain){this.drawLayer();}};CVShapeElement.prototype.renderStyledShape=function(styledShape,shape){if(this._isFirstFrame||shape._mdf||styledShape.transforms._mdf){var shapeNodes=styledShape.trNodes;var paths=shape.paths;var i;var len;var j;var jLen=paths._length;shapeNodes.length=0;var groupTransformMat=styledShape.transforms.finalTransform;for(j=0;j<jLen;j+=1){var pathNodes=paths.shapes[j];if(pathNodes&&pathNodes.v){len=pathNodes._length;for(i=1;i<len;i+=1){if(i===1){shapeNodes.push({t:'m',p:groupTransformMat.applyToPointArray(pathNodes.v[0][0],pathNodes.v[0][1],0)});}shapeNodes.push({t:'c',pts:groupTransformMat.applyToTriplePoints(pathNodes.o[i-1],pathNodes.i[i],pathNodes.v[i])});}if(len===1){shapeNodes.push({t:'m',p:groupTransformMat.applyToPointArray(pathNodes.v[0][0],pathNodes.v[0][1],0)});}if(pathNodes.c&&len){shapeNodes.push({t:'c',pts:groupTransformMat.applyToTriplePoints(pathNodes.o[i-1],pathNodes.i[0],pathNodes.v[0])});shapeNodes.push({t:'z'});}}}styledShape.trNodes=shapeNodes;}};CVShapeElement.prototype.renderPath=function(pathData,itemData){if(pathData.hd!==true&&pathData._shouldRender){var i;var len=itemData.styledShapes.length;for(i=0;i<len;i+=1){this.renderStyledShape(itemData.styledShapes[i],itemData.sh);}}};CVShapeElement.prototype.renderFill=function(styleData,itemData,groupTransform){var styleElem=itemData.style;if(itemData.c._mdf||this._isFirstFrame){styleElem.co='rgb('+bmFloor(itemData.c.v[0])+','+bmFloor(itemData.c.v[1])+','+bmFloor(itemData.c.v[2])+')';}if(itemData.o._mdf||groupTransform._opMdf||this._isFirstFrame){styleElem.coOp=itemData.o.v*groupTransform.opacity;}};CVShapeElement.prototype.renderGradientFill=function(styleData,itemData,groupTransform){var styleElem=itemData.style;var grd;if(!styleElem.grd||itemData.g._mdf||itemData.s._mdf||itemData.e._mdf||styleData.t!==1&&(itemData.h._mdf||itemData.a._mdf)){var ctx=this.globalData.canvasContext;var pt1=itemData.s.v;var pt2=itemData.e.v;if(styleData.t===1){grd=ctx.createLinearGradient(pt1[0],pt1[1],pt2[0],pt2[1]);}else{var rad=Math.sqrt(Math.pow(pt1[0]-pt2[0],2)+Math.pow(pt1[1]-pt2[1],2));var ang=Math.atan2(pt2[1]-pt1[1],pt2[0]-pt1[0]);var percent=itemData.h.v;if(percent>=1){percent=0.99;}else if(percent<=-1){percent=-0.99;}var dist=rad*percent;var x=Math.cos(ang+itemData.a.v)*dist+pt1[0];var y=Math.sin(ang+itemData.a.v)*dist+pt1[1];grd=ctx.createRadialGradient(x,y,0,pt1[0],pt1[1],rad);}var i;var len=styleData.g.p;var cValues=itemData.g.c;var opacity=1;for(i=0;i<len;i+=1){if(itemData.g._hasOpacity&&itemData.g._collapsable){opacity=itemData.g.o[i*2+1];}grd.addColorStop(cValues[i*4]/100,'rgba('+cValues[i*4+1]+','+cValues[i*4+2]+','+cValues[i*4+3]+','+opacity+')');}styleElem.grd=grd;}styleElem.coOp=itemData.o.v*groupTransform.opacity;};CVShapeElement.prototype.renderStroke=function(styleData,itemData,groupTransform){var styleElem=itemData.style;var d=itemData.d;if(d&&(d._mdf||this._isFirstFrame)){styleElem.da=d.dashArray;styleElem["do"]=d.dashoffset[0];}if(itemData.c._mdf||this._isFirstFrame){styleElem.co='rgb('+bmFloor(itemData.c.v[0])+','+bmFloor(itemData.c.v[1])+','+bmFloor(itemData.c.v[2])+')';}if(itemData.o._mdf||groupTransform._opMdf||this._isFirstFrame){styleElem.coOp=itemData.o.v*groupTransform.opacity;}if(itemData.w._mdf||this._isFirstFrame){styleElem.wi=itemData.w.v;}};CVShapeElement.prototype.destroy=function(){this.shapesData=null;this.globalData=null;this.canvasContext=null;this.stylesList.length=0;this.itemsData.length=0;};function CVTextElement(data,globalData,comp){this.textSpans=[];this.yOffset=0;this.fillColorAnim=false;this.strokeColorAnim=false;this.strokeWidthAnim=false;this.stroke=false;this.fill=false;this.justifyOffset=0;this.currentRender=null;this.renderType='canvas';this.values={fill:'rgba(0,0,0,0)',stroke:'rgba(0,0,0,0)',sWidth:0,fValue:''};this.initElement(data,globalData,comp);}extendPrototype([BaseElement,TransformElement,CVBaseElement,HierarchyElement,FrameElement,RenderableElement,ITextElement],CVTextElement);CVTextElement.prototype.tHelper=createTag('canvas').getContext('2d');CVTextElement.prototype.buildNewText=function(){var documentData=this.textProperty.currentData;this.renderedLetters=createSizedArray(documentData.l?documentData.l.length:0);var hasFill=false;if(documentData.fc){hasFill=true;this.values.fill=this.buildColor(documentData.fc);}else{this.values.fill='rgba(0,0,0,0)';}this.fill=hasFill;var hasStroke=false;if(documentData.sc){hasStroke=true;this.values.stroke=this.buildColor(documentData.sc);this.values.sWidth=documentData.sw;}var fontData=this.globalData.fontManager.getFontByName(documentData.f);var i;var len;var letters=documentData.l;var matrixHelper=this.mHelper;this.stroke=hasStroke;this.values.fValue=documentData.finalSize+'px '+this.globalData.fontManager.getFontByName(documentData.f).fFamily;len=documentData.finalText.length;// this.tHelper.font = this.values.fValue;
	var charData;var shapeData;var k;var kLen;var shapes;var j;var jLen;var pathNodes;var commands;var pathArr;var singleShape=this.data.singleShape;var trackingOffset=documentData.tr*0.001*documentData.finalSize;var xPos=0;var yPos=0;var firstLine=true;var cnt=0;for(i=0;i<len;i+=1){charData=this.globalData.fontManager.getCharData(documentData.finalText[i],fontData.fStyle,this.globalData.fontManager.getFontByName(documentData.f).fFamily);shapeData=charData&&charData.data||{};matrixHelper.reset();if(singleShape&&letters[i].n){xPos=-trackingOffset;yPos+=documentData.yOffset;yPos+=firstLine?1:0;firstLine=false;}shapes=shapeData.shapes?shapeData.shapes[0].it:[];jLen=shapes.length;matrixHelper.scale(documentData.finalSize/100,documentData.finalSize/100);if(singleShape){this.applyTextPropertiesToMatrix(documentData,matrixHelper,letters[i].line,xPos,yPos);}commands=createSizedArray(jLen-1);var commandsCounter=0;for(j=0;j<jLen;j+=1){if(shapes[j].ty==='sh'){kLen=shapes[j].ks.k.i.length;pathNodes=shapes[j].ks.k;pathArr=[];for(k=1;k<kLen;k+=1){if(k===1){pathArr.push(matrixHelper.applyToX(pathNodes.v[0][0],pathNodes.v[0][1],0),matrixHelper.applyToY(pathNodes.v[0][0],pathNodes.v[0][1],0));}pathArr.push(matrixHelper.applyToX(pathNodes.o[k-1][0],pathNodes.o[k-1][1],0),matrixHelper.applyToY(pathNodes.o[k-1][0],pathNodes.o[k-1][1],0),matrixHelper.applyToX(pathNodes.i[k][0],pathNodes.i[k][1],0),matrixHelper.applyToY(pathNodes.i[k][0],pathNodes.i[k][1],0),matrixHelper.applyToX(pathNodes.v[k][0],pathNodes.v[k][1],0),matrixHelper.applyToY(pathNodes.v[k][0],pathNodes.v[k][1],0));}pathArr.push(matrixHelper.applyToX(pathNodes.o[k-1][0],pathNodes.o[k-1][1],0),matrixHelper.applyToY(pathNodes.o[k-1][0],pathNodes.o[k-1][1],0),matrixHelper.applyToX(pathNodes.i[0][0],pathNodes.i[0][1],0),matrixHelper.applyToY(pathNodes.i[0][0],pathNodes.i[0][1],0),matrixHelper.applyToX(pathNodes.v[0][0],pathNodes.v[0][1],0),matrixHelper.applyToY(pathNodes.v[0][0],pathNodes.v[0][1],0));commands[commandsCounter]=pathArr;commandsCounter+=1;}}if(singleShape){xPos+=letters[i].l;xPos+=trackingOffset;}if(this.textSpans[cnt]){this.textSpans[cnt].elem=commands;}else{this.textSpans[cnt]={elem:commands};}cnt+=1;}};CVTextElement.prototype.renderInnerContent=function(){var ctx=this.canvasContext;ctx.font=this.values.fValue;ctx.lineCap='butt';ctx.lineJoin='miter';ctx.miterLimit=4;if(!this.data.singleShape){this.textAnimator.getMeasures(this.textProperty.currentData,this.lettersChangedFlag);}var i;var len;var j;var jLen;var k;var kLen;var renderedLetters=this.textAnimator.renderedLetters;var letters=this.textProperty.currentData.l;len=letters.length;var renderedLetter;var lastFill=null;var lastStroke=null;var lastStrokeW=null;var commands;var pathArr;for(i=0;i<len;i+=1){if(!letters[i].n){renderedLetter=renderedLetters[i];if(renderedLetter){this.globalData.renderer.save();this.globalData.renderer.ctxTransform(renderedLetter.p);this.globalData.renderer.ctxOpacity(renderedLetter.o);}if(this.fill){if(renderedLetter&&renderedLetter.fc){if(lastFill!==renderedLetter.fc){lastFill=renderedLetter.fc;ctx.fillStyle=renderedLetter.fc;}}else if(lastFill!==this.values.fill){lastFill=this.values.fill;ctx.fillStyle=this.values.fill;}commands=this.textSpans[i].elem;jLen=commands.length;this.globalData.canvasContext.beginPath();for(j=0;j<jLen;j+=1){pathArr=commands[j];kLen=pathArr.length;this.globalData.canvasContext.moveTo(pathArr[0],pathArr[1]);for(k=2;k<kLen;k+=6){this.globalData.canvasContext.bezierCurveTo(pathArr[k],pathArr[k+1],pathArr[k+2],pathArr[k+3],pathArr[k+4],pathArr[k+5]);}}this.globalData.canvasContext.closePath();this.globalData.canvasContext.fill();/// ctx.fillText(this.textSpans[i].val,0,0);
	}if(this.stroke){if(renderedLetter&&renderedLetter.sw){if(lastStrokeW!==renderedLetter.sw){lastStrokeW=renderedLetter.sw;ctx.lineWidth=renderedLetter.sw;}}else if(lastStrokeW!==this.values.sWidth){lastStrokeW=this.values.sWidth;ctx.lineWidth=this.values.sWidth;}if(renderedLetter&&renderedLetter.sc){if(lastStroke!==renderedLetter.sc){lastStroke=renderedLetter.sc;ctx.strokeStyle=renderedLetter.sc;}}else if(lastStroke!==this.values.stroke){lastStroke=this.values.stroke;ctx.strokeStyle=this.values.stroke;}commands=this.textSpans[i].elem;jLen=commands.length;this.globalData.canvasContext.beginPath();for(j=0;j<jLen;j+=1){pathArr=commands[j];kLen=pathArr.length;this.globalData.canvasContext.moveTo(pathArr[0],pathArr[1]);for(k=2;k<kLen;k+=6){this.globalData.canvasContext.bezierCurveTo(pathArr[k],pathArr[k+1],pathArr[k+2],pathArr[k+3],pathArr[k+4],pathArr[k+5]);}}this.globalData.canvasContext.closePath();this.globalData.canvasContext.stroke();/// ctx.strokeText(letters[i].val,0,0);
	}if(renderedLetter){this.globalData.renderer.restore();}}}};function CVImageElement(data,globalData,comp){this.assetData=globalData.getAssetData(data.refId);this.img=globalData.imageLoader.getAsset(this.assetData);this.initElement(data,globalData,comp);}extendPrototype([BaseElement,TransformElement,CVBaseElement,HierarchyElement,FrameElement,RenderableElement],CVImageElement);CVImageElement.prototype.initElement=SVGShapeElement.prototype.initElement;CVImageElement.prototype.prepareFrame=IImageElement.prototype.prepareFrame;CVImageElement.prototype.createContent=function(){if(this.img.width&&(this.assetData.w!==this.img.width||this.assetData.h!==this.img.height)){var canvas=createTag('canvas');canvas.width=this.assetData.w;canvas.height=this.assetData.h;var ctx=canvas.getContext('2d');var imgW=this.img.width;var imgH=this.img.height;var imgRel=imgW/imgH;var canvasRel=this.assetData.w/this.assetData.h;var widthCrop;var heightCrop;var par=this.assetData.pr||this.globalData.renderConfig.imagePreserveAspectRatio;if(imgRel>canvasRel&&par==='xMidYMid slice'||imgRel<canvasRel&&par!=='xMidYMid slice'){heightCrop=imgH;widthCrop=heightCrop*canvasRel;}else{widthCrop=imgW;heightCrop=widthCrop/canvasRel;}ctx.drawImage(this.img,(imgW-widthCrop)/2,(imgH-heightCrop)/2,widthCrop,heightCrop,0,0,this.assetData.w,this.assetData.h);this.img=canvas;}};CVImageElement.prototype.renderInnerContent=function(){this.canvasContext.drawImage(this.img,0,0);};CVImageElement.prototype.destroy=function(){this.img=null;};function CVSolidElement(data,globalData,comp){this.initElement(data,globalData,comp);}extendPrototype([BaseElement,TransformElement,CVBaseElement,HierarchyElement,FrameElement,RenderableElement],CVSolidElement);CVSolidElement.prototype.initElement=SVGShapeElement.prototype.initElement;CVSolidElement.prototype.prepareFrame=IImageElement.prototype.prepareFrame;CVSolidElement.prototype.renderInnerContent=function(){var ctx=this.canvasContext;ctx.fillStyle=this.data.sc;ctx.fillRect(0,0,this.data.sw,this.data.sh);//
	};function CanvasRendererBase(animationItem,config){this.animationItem=animationItem;this.renderConfig={clearCanvas:config&&config.clearCanvas!==undefined?config.clearCanvas:true,context:config&&config.context||null,progressiveLoad:config&&config.progressiveLoad||false,preserveAspectRatio:config&&config.preserveAspectRatio||'xMidYMid meet',imagePreserveAspectRatio:config&&config.imagePreserveAspectRatio||'xMidYMid slice',contentVisibility:config&&config.contentVisibility||'visible',className:config&&config.className||'',id:config&&config.id||''};this.renderConfig.dpr=config&&config.dpr||1;if(this.animationItem.wrapper){this.renderConfig.dpr=config&&config.dpr||window.devicePixelRatio||1;}this.renderedFrame=-1;this.globalData={frameNum:-1,_mdf:false,renderConfig:this.renderConfig,currentGlobalAlpha:-1};this.contextData=new CVContextData();this.elements=[];this.pendingElements=[];this.transformMat=new Matrix();this.completeLayers=false;this.rendererType='canvas';}extendPrototype([BaseRenderer],CanvasRendererBase);CanvasRendererBase.prototype.createShape=function(data){return new CVShapeElement(data,this.globalData,this);};CanvasRendererBase.prototype.createText=function(data){return new CVTextElement(data,this.globalData,this);};CanvasRendererBase.prototype.createImage=function(data){return new CVImageElement(data,this.globalData,this);};CanvasRendererBase.prototype.createSolid=function(data){return new CVSolidElement(data,this.globalData,this);};CanvasRendererBase.prototype.createNull=SVGRenderer.prototype.createNull;CanvasRendererBase.prototype.ctxTransform=function(props){if(props[0]===1&&props[1]===0&&props[4]===0&&props[5]===1&&props[12]===0&&props[13]===0){return;}if(!this.renderConfig.clearCanvas){this.canvasContext.transform(props[0],props[1],props[4],props[5],props[12],props[13]);return;}this.transformMat.cloneFromProps(props);var cProps=this.contextData.cTr.props;this.transformMat.transform(cProps[0],cProps[1],cProps[2],cProps[3],cProps[4],cProps[5],cProps[6],cProps[7],cProps[8],cProps[9],cProps[10],cProps[11],cProps[12],cProps[13],cProps[14],cProps[15]);// this.contextData.cTr.transform(props[0],props[1],props[2],props[3],props[4],props[5],props[6],props[7],props[8],props[9],props[10],props[11],props[12],props[13],props[14],props[15]);
	this.contextData.cTr.cloneFromProps(this.transformMat.props);var trProps=this.contextData.cTr.props;this.canvasContext.setTransform(trProps[0],trProps[1],trProps[4],trProps[5],trProps[12],trProps[13]);};CanvasRendererBase.prototype.ctxOpacity=function(op){/* if(op === 1){
	          return;
	      } */if(!this.renderConfig.clearCanvas){this.canvasContext.globalAlpha*=op<0?0:op;this.globalData.currentGlobalAlpha=this.contextData.cO;return;}this.contextData.cO*=op<0?0:op;if(this.globalData.currentGlobalAlpha!==this.contextData.cO){this.canvasContext.globalAlpha=this.contextData.cO;this.globalData.currentGlobalAlpha=this.contextData.cO;}};CanvasRendererBase.prototype.reset=function(){if(!this.renderConfig.clearCanvas){this.canvasContext.restore();return;}this.contextData.reset();};CanvasRendererBase.prototype.save=function(actionFlag){if(!this.renderConfig.clearCanvas){this.canvasContext.save();return;}if(actionFlag){this.canvasContext.save();}var props=this.contextData.cTr.props;if(this.contextData._length<=this.contextData.cArrPos){this.contextData.duplicate();}var i;var arr=this.contextData.saved[this.contextData.cArrPos];for(i=0;i<16;i+=1){arr[i]=props[i];}this.contextData.savedOp[this.contextData.cArrPos]=this.contextData.cO;this.contextData.cArrPos+=1;};CanvasRendererBase.prototype.restore=function(actionFlag){if(!this.renderConfig.clearCanvas){this.canvasContext.restore();return;}if(actionFlag){this.canvasContext.restore();this.globalData.blendMode='source-over';}this.contextData.cArrPos-=1;var popped=this.contextData.saved[this.contextData.cArrPos];var i;var arr=this.contextData.cTr.props;for(i=0;i<16;i+=1){arr[i]=popped[i];}this.canvasContext.setTransform(popped[0],popped[1],popped[4],popped[5],popped[12],popped[13]);popped=this.contextData.savedOp[this.contextData.cArrPos];this.contextData.cO=popped;if(this.globalData.currentGlobalAlpha!==popped){this.canvasContext.globalAlpha=popped;this.globalData.currentGlobalAlpha=popped;}};CanvasRendererBase.prototype.configAnimation=function(animData){if(this.animationItem.wrapper){this.animationItem.container=createTag('canvas');var containerStyle=this.animationItem.container.style;containerStyle.width='100%';containerStyle.height='100%';var origin='0px 0px 0px';containerStyle.transformOrigin=origin;containerStyle.mozTransformOrigin=origin;containerStyle.webkitTransformOrigin=origin;containerStyle['-webkit-transform']=origin;containerStyle.contentVisibility=this.renderConfig.contentVisibility;this.animationItem.wrapper.appendChild(this.animationItem.container);this.canvasContext=this.animationItem.container.getContext('2d');if(this.renderConfig.className){this.animationItem.container.setAttribute('class',this.renderConfig.className);}if(this.renderConfig.id){this.animationItem.container.setAttribute('id',this.renderConfig.id);}}else{this.canvasContext=this.renderConfig.context;}this.data=animData;this.layers=animData.layers;this.transformCanvas={w:animData.w,h:animData.h,sx:0,sy:0,tx:0,ty:0};this.setupGlobalData(animData,document.body);this.globalData.canvasContext=this.canvasContext;this.globalData.renderer=this;this.globalData.isDashed=false;this.globalData.progressiveLoad=this.renderConfig.progressiveLoad;this.globalData.transformCanvas=this.transformCanvas;this.elements=createSizedArray(animData.layers.length);this.updateContainerSize();};CanvasRendererBase.prototype.updateContainerSize=function(){this.reset();var elementWidth;var elementHeight;if(this.animationItem.wrapper&&this.animationItem.container){elementWidth=this.animationItem.wrapper.offsetWidth;elementHeight=this.animationItem.wrapper.offsetHeight;this.animationItem.container.setAttribute('width',elementWidth*this.renderConfig.dpr);this.animationItem.container.setAttribute('height',elementHeight*this.renderConfig.dpr);}else{elementWidth=this.canvasContext.canvas.width*this.renderConfig.dpr;elementHeight=this.canvasContext.canvas.height*this.renderConfig.dpr;}var elementRel;var animationRel;if(this.renderConfig.preserveAspectRatio.indexOf('meet')!==-1||this.renderConfig.preserveAspectRatio.indexOf('slice')!==-1){var par=this.renderConfig.preserveAspectRatio.split(' ');var fillType=par[1]||'meet';var pos=par[0]||'xMidYMid';var xPos=pos.substr(0,4);var yPos=pos.substr(4);elementRel=elementWidth/elementHeight;animationRel=this.transformCanvas.w/this.transformCanvas.h;if(animationRel>elementRel&&fillType==='meet'||animationRel<elementRel&&fillType==='slice'){this.transformCanvas.sx=elementWidth/(this.transformCanvas.w/this.renderConfig.dpr);this.transformCanvas.sy=elementWidth/(this.transformCanvas.w/this.renderConfig.dpr);}else{this.transformCanvas.sx=elementHeight/(this.transformCanvas.h/this.renderConfig.dpr);this.transformCanvas.sy=elementHeight/(this.transformCanvas.h/this.renderConfig.dpr);}if(xPos==='xMid'&&(animationRel<elementRel&&fillType==='meet'||animationRel>elementRel&&fillType==='slice')){this.transformCanvas.tx=(elementWidth-this.transformCanvas.w*(elementHeight/this.transformCanvas.h))/2*this.renderConfig.dpr;}else if(xPos==='xMax'&&(animationRel<elementRel&&fillType==='meet'||animationRel>elementRel&&fillType==='slice')){this.transformCanvas.tx=(elementWidth-this.transformCanvas.w*(elementHeight/this.transformCanvas.h))*this.renderConfig.dpr;}else{this.transformCanvas.tx=0;}if(yPos==='YMid'&&(animationRel>elementRel&&fillType==='meet'||animationRel<elementRel&&fillType==='slice')){this.transformCanvas.ty=(elementHeight-this.transformCanvas.h*(elementWidth/this.transformCanvas.w))/2*this.renderConfig.dpr;}else if(yPos==='YMax'&&(animationRel>elementRel&&fillType==='meet'||animationRel<elementRel&&fillType==='slice')){this.transformCanvas.ty=(elementHeight-this.transformCanvas.h*(elementWidth/this.transformCanvas.w))*this.renderConfig.dpr;}else{this.transformCanvas.ty=0;}}else if(this.renderConfig.preserveAspectRatio==='none'){this.transformCanvas.sx=elementWidth/(this.transformCanvas.w/this.renderConfig.dpr);this.transformCanvas.sy=elementHeight/(this.transformCanvas.h/this.renderConfig.dpr);this.transformCanvas.tx=0;this.transformCanvas.ty=0;}else{this.transformCanvas.sx=this.renderConfig.dpr;this.transformCanvas.sy=this.renderConfig.dpr;this.transformCanvas.tx=0;this.transformCanvas.ty=0;}this.transformCanvas.props=[this.transformCanvas.sx,0,0,0,0,this.transformCanvas.sy,0,0,0,0,1,0,this.transformCanvas.tx,this.transformCanvas.ty,0,1];/* var i, len = this.elements.length;
	      for(i=0;i<len;i+=1){
	          if(this.elements[i] && this.elements[i].data.ty === 0){
	              this.elements[i].resize(this.globalData.transformCanvas);
	          }
	      } */this.ctxTransform(this.transformCanvas.props);this.canvasContext.beginPath();this.canvasContext.rect(0,0,this.transformCanvas.w,this.transformCanvas.h);this.canvasContext.closePath();this.canvasContext.clip();this.renderFrame(this.renderedFrame,true);};CanvasRendererBase.prototype.destroy=function(){if(this.renderConfig.clearCanvas&&this.animationItem.wrapper){this.animationItem.wrapper.innerText='';}var i;var len=this.layers?this.layers.length:0;for(i=len-1;i>=0;i-=1){if(this.elements[i]){this.elements[i].destroy();}}this.elements.length=0;this.globalData.canvasContext=null;this.animationItem.container=null;this.destroyed=true;};CanvasRendererBase.prototype.renderFrame=function(num,forceRender){if(this.renderedFrame===num&&this.renderConfig.clearCanvas===true&&!forceRender||this.destroyed||num===-1){return;}this.renderedFrame=num;this.globalData.frameNum=num-this.animationItem._isFirstFrame;this.globalData.frameId+=1;this.globalData._mdf=!this.renderConfig.clearCanvas||forceRender;this.globalData.projectInterface.currentFrame=num;// console.log('--------');
	// console.log('NEW: ',num);
	var i;var len=this.layers.length;if(!this.completeLayers){this.checkLayers(num);}for(i=0;i<len;i+=1){if(this.completeLayers||this.elements[i]){this.elements[i].prepareFrame(num-this.layers[i].st);}}if(this.globalData._mdf){if(this.renderConfig.clearCanvas===true){this.canvasContext.clearRect(0,0,this.transformCanvas.w,this.transformCanvas.h);}else{this.save();}for(i=len-1;i>=0;i-=1){if(this.completeLayers||this.elements[i]){this.elements[i].renderFrame();}}if(this.renderConfig.clearCanvas!==true){this.restore();}}};CanvasRendererBase.prototype.buildItem=function(pos){var elements=this.elements;if(elements[pos]||this.layers[pos].ty===99){return;}var element=this.createItem(this.layers[pos],this,this.globalData);elements[pos]=element;element.initExpressions();/* if(this.layers[pos].ty === 0){
	          element.resize(this.globalData.transformCanvas);
	      } */};CanvasRendererBase.prototype.checkPendingElements=function(){while(this.pendingElements.length){var element=this.pendingElements.pop();element.checkParenting();}};CanvasRendererBase.prototype.hide=function(){this.animationItem.container.style.display='none';};CanvasRendererBase.prototype.show=function(){this.animationItem.container.style.display='block';};function CVCompElement(data,globalData,comp){this.completeLayers=false;this.layers=data.layers;this.pendingElements=[];this.elements=createSizedArray(this.layers.length);this.initElement(data,globalData,comp);this.tm=data.tm?PropertyFactory.getProp(this,data.tm,0,globalData.frameRate,this):{_placeholder:true};}extendPrototype([CanvasRendererBase,ICompElement,CVBaseElement],CVCompElement);CVCompElement.prototype.renderInnerContent=function(){var ctx=this.canvasContext;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(this.data.w,0);ctx.lineTo(this.data.w,this.data.h);ctx.lineTo(0,this.data.h);ctx.lineTo(0,0);ctx.clip();var i;var len=this.layers.length;for(i=len-1;i>=0;i-=1){if(this.completeLayers||this.elements[i]){this.elements[i].renderFrame();}}};CVCompElement.prototype.destroy=function(){var i;var len=this.layers.length;for(i=len-1;i>=0;i-=1){if(this.elements[i]){this.elements[i].destroy();}}this.layers=null;this.elements=null;};CVCompElement.prototype.createComp=function(data){return new CVCompElement(data,this.globalData,this);};function CanvasRenderer(animationItem,config){this.animationItem=animationItem;this.renderConfig={clearCanvas:config&&config.clearCanvas!==undefined?config.clearCanvas:true,context:config&&config.context||null,progressiveLoad:config&&config.progressiveLoad||false,preserveAspectRatio:config&&config.preserveAspectRatio||'xMidYMid meet',imagePreserveAspectRatio:config&&config.imagePreserveAspectRatio||'xMidYMid slice',contentVisibility:config&&config.contentVisibility||'visible',className:config&&config.className||'',id:config&&config.id||''};this.renderConfig.dpr=config&&config.dpr||1;if(this.animationItem.wrapper){this.renderConfig.dpr=config&&config.dpr||window.devicePixelRatio||1;}this.renderedFrame=-1;this.globalData={frameNum:-1,_mdf:false,renderConfig:this.renderConfig,currentGlobalAlpha:-1};this.contextData=new CVContextData();this.elements=[];this.pendingElements=[];this.transformMat=new Matrix();this.completeLayers=false;this.rendererType='canvas';}extendPrototype([CanvasRendererBase],CanvasRenderer);CanvasRenderer.prototype.createComp=function(data){return new CVCompElement(data,this.globalData,this);};function HBaseElement(){}HBaseElement.prototype={checkBlendMode:function checkBlendMode(){},initRendererElement:function initRendererElement(){this.baseElement=createTag(this.data.tg||'div');if(this.data.hasMask){this.svgElement=createNS('svg');this.layerElement=createNS('g');this.maskedElement=this.layerElement;this.svgElement.appendChild(this.layerElement);this.baseElement.appendChild(this.svgElement);}else{this.layerElement=this.baseElement;}styleDiv(this.baseElement);},createContainerElements:function createContainerElements(){this.renderableEffectsManager=new CVEffects(this);this.transformedElement=this.baseElement;this.maskedElement=this.layerElement;if(this.data.ln){this.layerElement.setAttribute('id',this.data.ln);}if(this.data.cl){this.layerElement.setAttribute('class',this.data.cl);}if(this.data.bm!==0){this.setBlendMode();}},renderElement:function renderElement(){var transformedElementStyle=this.transformedElement?this.transformedElement.style:{};if(this.finalTransform._matMdf){var matrixValue=this.finalTransform.mat.toCSS();transformedElementStyle.transform=matrixValue;transformedElementStyle.webkitTransform=matrixValue;}if(this.finalTransform._opMdf){transformedElementStyle.opacity=this.finalTransform.mProp.o.v;}},renderFrame:function renderFrame(){// If it is exported as hidden (data.hd === true) no need to render
	// If it is not visible no need to render
	if(this.data.hd||this.hidden){return;}this.renderTransform();this.renderRenderable();this.renderElement();this.renderInnerContent();if(this._isFirstFrame){this._isFirstFrame=false;}},destroy:function destroy(){this.layerElement=null;this.transformedElement=null;if(this.matteElement){this.matteElement=null;}if(this.maskManager){this.maskManager.destroy();this.maskManager=null;}},createRenderableComponents:function createRenderableComponents(){this.maskManager=new MaskElement(this.data,this,this.globalData);},addEffects:function addEffects(){},setMatte:function setMatte(){}};HBaseElement.prototype.getBaseElement=SVGBaseElement.prototype.getBaseElement;HBaseElement.prototype.destroyBaseElement=HBaseElement.prototype.destroy;HBaseElement.prototype.buildElementParenting=BaseRenderer.prototype.buildElementParenting;function HSolidElement(data,globalData,comp){this.initElement(data,globalData,comp);}extendPrototype([BaseElement,TransformElement,HBaseElement,HierarchyElement,FrameElement,RenderableDOMElement],HSolidElement);HSolidElement.prototype.createContent=function(){var rect;if(this.data.hasMask){rect=createNS('rect');rect.setAttribute('width',this.data.sw);rect.setAttribute('height',this.data.sh);rect.setAttribute('fill',this.data.sc);this.svgElement.setAttribute('width',this.data.sw);this.svgElement.setAttribute('height',this.data.sh);}else{rect=createTag('div');rect.style.width=this.data.sw+'px';rect.style.height=this.data.sh+'px';rect.style.backgroundColor=this.data.sc;}this.layerElement.appendChild(rect);};function HShapeElement(data,globalData,comp){// List of drawable elements
	this.shapes=[];// Full shape data
	this.shapesData=data.shapes;// List of styles that will be applied to shapes
	this.stylesList=[];// List of modifiers that will be applied to shapes
	this.shapeModifiers=[];// List of items in shape tree
	this.itemsData=[];// List of items in previous shape tree
	this.processedElements=[];// List of animated components
	this.animatedContents=[];this.shapesContainer=createNS('g');this.initElement(data,globalData,comp);// Moving any property that doesn't get too much access after initialization because of v8 way of handling more than 10 properties.
	// List of elements that have been created
	this.prevViewData=[];this.currentBBox={x:999999,y:-999999,h:0,w:0};}extendPrototype([BaseElement,TransformElement,HSolidElement,SVGShapeElement,HBaseElement,HierarchyElement,FrameElement,RenderableElement],HShapeElement);HShapeElement.prototype._renderShapeFrame=HShapeElement.prototype.renderInnerContent;HShapeElement.prototype.createContent=function(){var cont;this.baseElement.style.fontSize=0;if(this.data.hasMask){this.layerElement.appendChild(this.shapesContainer);cont=this.svgElement;}else{cont=createNS('svg');var size=this.comp.data?this.comp.data:this.globalData.compSize;cont.setAttribute('width',size.w);cont.setAttribute('height',size.h);cont.appendChild(this.shapesContainer);this.layerElement.appendChild(cont);}this.searchShapes(this.shapesData,this.itemsData,this.prevViewData,this.shapesContainer,0,[],true);this.filterUniqueShapes();this.shapeCont=cont;};HShapeElement.prototype.getTransformedPoint=function(transformers,point){var i;var len=transformers.length;for(i=0;i<len;i+=1){point=transformers[i].mProps.v.applyToPointArray(point[0],point[1],0);}return point;};HShapeElement.prototype.calculateShapeBoundingBox=function(item,boundingBox){var shape=item.sh.v;var transformers=item.transformers;var i;var len=shape._length;var vPoint;var oPoint;var nextIPoint;var nextVPoint;if(len<=1){return;}for(i=0;i<len-1;i+=1){vPoint=this.getTransformedPoint(transformers,shape.v[i]);oPoint=this.getTransformedPoint(transformers,shape.o[i]);nextIPoint=this.getTransformedPoint(transformers,shape.i[i+1]);nextVPoint=this.getTransformedPoint(transformers,shape.v[i+1]);this.checkBounds(vPoint,oPoint,nextIPoint,nextVPoint,boundingBox);}if(shape.c){vPoint=this.getTransformedPoint(transformers,shape.v[i]);oPoint=this.getTransformedPoint(transformers,shape.o[i]);nextIPoint=this.getTransformedPoint(transformers,shape.i[0]);nextVPoint=this.getTransformedPoint(transformers,shape.v[0]);this.checkBounds(vPoint,oPoint,nextIPoint,nextVPoint,boundingBox);}};HShapeElement.prototype.checkBounds=function(vPoint,oPoint,nextIPoint,nextVPoint,boundingBox){this.getBoundsOfCurve(vPoint,oPoint,nextIPoint,nextVPoint);var bounds=this.shapeBoundingBox;boundingBox.x=bmMin(bounds.left,boundingBox.x);boundingBox.xMax=bmMax(bounds.right,boundingBox.xMax);boundingBox.y=bmMin(bounds.top,boundingBox.y);boundingBox.yMax=bmMax(bounds.bottom,boundingBox.yMax);};HShapeElement.prototype.shapeBoundingBox={left:0,right:0,top:0,bottom:0};HShapeElement.prototype.tempBoundingBox={x:0,xMax:0,y:0,yMax:0,width:0,height:0};HShapeElement.prototype.getBoundsOfCurve=function(p0,p1,p2,p3){var bounds=[[p0[0],p3[0]],[p0[1],p3[1]]];for(var a,b,c,t,b2ac,t1,t2,i=0;i<2;++i){// eslint-disable-line no-plusplus
	b=6*p0[i]-12*p1[i]+6*p2[i];a=-3*p0[i]+9*p1[i]-9*p2[i]+3*p3[i];c=3*p1[i]-3*p0[i];b|=0;// eslint-disable-line no-bitwise
	a|=0;// eslint-disable-line no-bitwise
	c|=0;// eslint-disable-line no-bitwise
	if(a===0&&b===0);else if(a===0){t=-c/b;if(t>0&&t<1){bounds[i].push(this.calculateF(t,p0,p1,p2,p3,i));}}else{b2ac=b*b-4*c*a;if(b2ac>=0){t1=(-b+bmSqrt(b2ac))/(2*a);if(t1>0&&t1<1)bounds[i].push(this.calculateF(t1,p0,p1,p2,p3,i));t2=(-b-bmSqrt(b2ac))/(2*a);if(t2>0&&t2<1)bounds[i].push(this.calculateF(t2,p0,p1,p2,p3,i));}}}this.shapeBoundingBox.left=bmMin.apply(null,bounds[0]);this.shapeBoundingBox.top=bmMin.apply(null,bounds[1]);this.shapeBoundingBox.right=bmMax.apply(null,bounds[0]);this.shapeBoundingBox.bottom=bmMax.apply(null,bounds[1]);};HShapeElement.prototype.calculateF=function(t,p0,p1,p2,p3,i){return bmPow(1-t,3)*p0[i]+3*bmPow(1-t,2)*t*p1[i]+3*(1-t)*bmPow(t,2)*p2[i]+bmPow(t,3)*p3[i];};HShapeElement.prototype.calculateBoundingBox=function(itemsData,boundingBox){var i;var len=itemsData.length;for(i=0;i<len;i+=1){if(itemsData[i]&&itemsData[i].sh){this.calculateShapeBoundingBox(itemsData[i],boundingBox);}else if(itemsData[i]&&itemsData[i].it){this.calculateBoundingBox(itemsData[i].it,boundingBox);}else if(itemsData[i]&&itemsData[i].style&&itemsData[i].w){this.expandStrokeBoundingBox(itemsData[i].w,boundingBox);}}};HShapeElement.prototype.expandStrokeBoundingBox=function(widthProperty,boundingBox){var width=0;if(widthProperty.keyframes){for(var i=0;i<widthProperty.keyframes.length;i+=1){var kfw=widthProperty.keyframes[i].s;if(kfw>width){width=kfw;}}width*=widthProperty.mult;}else{width=widthProperty.v*widthProperty.mult;}boundingBox.x-=width;boundingBox.xMax+=width;boundingBox.y-=width;boundingBox.yMax+=width;};HShapeElement.prototype.currentBoxContains=function(box){return this.currentBBox.x<=box.x&&this.currentBBox.y<=box.y&&this.currentBBox.width+this.currentBBox.x>=box.x+box.width&&this.currentBBox.height+this.currentBBox.y>=box.y+box.height;};HShapeElement.prototype.renderInnerContent=function(){this._renderShapeFrame();if(!this.hidden&&(this._isFirstFrame||this._mdf)){var tempBoundingBox=this.tempBoundingBox;var max=999999;tempBoundingBox.x=max;tempBoundingBox.xMax=-max;tempBoundingBox.y=max;tempBoundingBox.yMax=-max;this.calculateBoundingBox(this.itemsData,tempBoundingBox);tempBoundingBox.width=tempBoundingBox.xMax<tempBoundingBox.x?0:tempBoundingBox.xMax-tempBoundingBox.x;tempBoundingBox.height=tempBoundingBox.yMax<tempBoundingBox.y?0:tempBoundingBox.yMax-tempBoundingBox.y;// var tempBoundingBox = this.shapeCont.getBBox();
	if(this.currentBoxContains(tempBoundingBox)){return;}var changed=false;if(this.currentBBox.w!==tempBoundingBox.width){this.currentBBox.w=tempBoundingBox.width;this.shapeCont.setAttribute('width',tempBoundingBox.width);changed=true;}if(this.currentBBox.h!==tempBoundingBox.height){this.currentBBox.h=tempBoundingBox.height;this.shapeCont.setAttribute('height',tempBoundingBox.height);changed=true;}if(changed||this.currentBBox.x!==tempBoundingBox.x||this.currentBBox.y!==tempBoundingBox.y){this.currentBBox.w=tempBoundingBox.width;this.currentBBox.h=tempBoundingBox.height;this.currentBBox.x=tempBoundingBox.x;this.currentBBox.y=tempBoundingBox.y;this.shapeCont.setAttribute('viewBox',this.currentBBox.x+' '+this.currentBBox.y+' '+this.currentBBox.w+' '+this.currentBBox.h);var shapeStyle=this.shapeCont.style;var shapeTransform='translate('+this.currentBBox.x+'px,'+this.currentBBox.y+'px)';shapeStyle.transform=shapeTransform;shapeStyle.webkitTransform=shapeTransform;}}};function HTextElement(data,globalData,comp){this.textSpans=[];this.textPaths=[];this.currentBBox={x:999999,y:-999999,h:0,w:0};this.renderType='svg';this.isMasked=false;this.initElement(data,globalData,comp);}extendPrototype([BaseElement,TransformElement,HBaseElement,HierarchyElement,FrameElement,RenderableDOMElement,ITextElement],HTextElement);HTextElement.prototype.createContent=function(){this.isMasked=this.checkMasks();if(this.isMasked){this.renderType='svg';this.compW=this.comp.data.w;this.compH=this.comp.data.h;this.svgElement.setAttribute('width',this.compW);this.svgElement.setAttribute('height',this.compH);var g=createNS('g');this.maskedElement.appendChild(g);this.innerElem=g;}else{this.renderType='html';this.innerElem=this.layerElement;}this.checkParenting();};HTextElement.prototype.buildNewText=function(){var documentData=this.textProperty.currentData;this.renderedLetters=createSizedArray(documentData.l?documentData.l.length:0);var innerElemStyle=this.innerElem.style;var textColor=documentData.fc?this.buildColor(documentData.fc):'rgba(0,0,0,0)';innerElemStyle.fill=textColor;innerElemStyle.color=textColor;if(documentData.sc){innerElemStyle.stroke=this.buildColor(documentData.sc);innerElemStyle.strokeWidth=documentData.sw+'px';}var fontData=this.globalData.fontManager.getFontByName(documentData.f);if(!this.globalData.fontManager.chars){innerElemStyle.fontSize=documentData.finalSize+'px';innerElemStyle.lineHeight=documentData.finalSize+'px';if(fontData.fClass){this.innerElem.className=fontData.fClass;}else{innerElemStyle.fontFamily=fontData.fFamily;var fWeight=documentData.fWeight;var fStyle=documentData.fStyle;innerElemStyle.fontStyle=fStyle;innerElemStyle.fontWeight=fWeight;}}var i;var len;var letters=documentData.l;len=letters.length;var tSpan;var tParent;var tCont;var matrixHelper=this.mHelper;var shapes;var shapeStr='';var cnt=0;for(i=0;i<len;i+=1){if(this.globalData.fontManager.chars){if(!this.textPaths[cnt]){tSpan=createNS('path');tSpan.setAttribute('stroke-linecap',lineCapEnum[1]);tSpan.setAttribute('stroke-linejoin',lineJoinEnum[2]);tSpan.setAttribute('stroke-miterlimit','4');}else{tSpan=this.textPaths[cnt];}if(!this.isMasked){if(this.textSpans[cnt]){tParent=this.textSpans[cnt];tCont=tParent.children[0];}else{tParent=createTag('div');tParent.style.lineHeight=0;tCont=createNS('svg');tCont.appendChild(tSpan);styleDiv(tParent);}}}else if(!this.isMasked){if(this.textSpans[cnt]){tParent=this.textSpans[cnt];tSpan=this.textPaths[cnt];}else{tParent=createTag('span');styleDiv(tParent);tSpan=createTag('span');styleDiv(tSpan);tParent.appendChild(tSpan);}}else{tSpan=this.textPaths[cnt]?this.textPaths[cnt]:createNS('text');}// tSpan.setAttribute('visibility', 'hidden');
	if(this.globalData.fontManager.chars){var charData=this.globalData.fontManager.getCharData(documentData.finalText[i],fontData.fStyle,this.globalData.fontManager.getFontByName(documentData.f).fFamily);var shapeData;if(charData){shapeData=charData.data;}else{shapeData=null;}matrixHelper.reset();if(shapeData&&shapeData.shapes&&shapeData.shapes.length){shapes=shapeData.shapes[0].it;matrixHelper.scale(documentData.finalSize/100,documentData.finalSize/100);shapeStr=this.createPathShape(matrixHelper,shapes);tSpan.setAttribute('d',shapeStr);}if(!this.isMasked){this.innerElem.appendChild(tParent);if(shapeData&&shapeData.shapes){// document.body.appendChild is needed to get exact measure of shape
	document.body.appendChild(tCont);var boundingBox=tCont.getBBox();tCont.setAttribute('width',boundingBox.width+2);tCont.setAttribute('height',boundingBox.height+2);tCont.setAttribute('viewBox',boundingBox.x-1+' '+(boundingBox.y-1)+' '+(boundingBox.width+2)+' '+(boundingBox.height+2));var tContStyle=tCont.style;var tContTranslation='translate('+(boundingBox.x-1)+'px,'+(boundingBox.y-1)+'px)';tContStyle.transform=tContTranslation;tContStyle.webkitTransform=tContTranslation;letters[i].yOffset=boundingBox.y-1;}else{tCont.setAttribute('width',1);tCont.setAttribute('height',1);}tParent.appendChild(tCont);}else{this.innerElem.appendChild(tSpan);}}else{tSpan.textContent=letters[i].val;tSpan.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');if(!this.isMasked){this.innerElem.appendChild(tParent);//
	var tStyle=tSpan.style;var tSpanTranslation='translate3d(0,'+-documentData.finalSize/1.2+'px,0)';tStyle.transform=tSpanTranslation;tStyle.webkitTransform=tSpanTranslation;}else{this.innerElem.appendChild(tSpan);}}//
	if(!this.isMasked){this.textSpans[cnt]=tParent;}else{this.textSpans[cnt]=tSpan;}this.textSpans[cnt].style.display='block';this.textPaths[cnt]=tSpan;cnt+=1;}while(cnt<this.textSpans.length){this.textSpans[cnt].style.display='none';cnt+=1;}};HTextElement.prototype.renderInnerContent=function(){var svgStyle;if(this.data.singleShape){if(!this._isFirstFrame&&!this.lettersChangedFlag){return;}if(this.isMasked&&this.finalTransform._matMdf){// Todo Benchmark if using this is better than getBBox
	this.svgElement.setAttribute('viewBox',-this.finalTransform.mProp.p.v[0]+' '+-this.finalTransform.mProp.p.v[1]+' '+this.compW+' '+this.compH);svgStyle=this.svgElement.style;var translation='translate('+-this.finalTransform.mProp.p.v[0]+'px,'+-this.finalTransform.mProp.p.v[1]+'px)';svgStyle.transform=translation;svgStyle.webkitTransform=translation;}}this.textAnimator.getMeasures(this.textProperty.currentData,this.lettersChangedFlag);if(!this.lettersChangedFlag&&!this.textAnimator.lettersChangedFlag){return;}var i;var len;var count=0;var renderedLetters=this.textAnimator.renderedLetters;var letters=this.textProperty.currentData.l;len=letters.length;var renderedLetter;var textSpan;var textPath;for(i=0;i<len;i+=1){if(letters[i].n){count+=1;}else{textSpan=this.textSpans[i];textPath=this.textPaths[i];renderedLetter=renderedLetters[count];count+=1;if(renderedLetter._mdf.m){if(!this.isMasked){textSpan.style.webkitTransform=renderedLetter.m;textSpan.style.transform=renderedLetter.m;}else{textSpan.setAttribute('transform',renderedLetter.m);}}/// /textSpan.setAttribute('opacity',renderedLetter.o);
	textSpan.style.opacity=renderedLetter.o;if(renderedLetter.sw&&renderedLetter._mdf.sw){textPath.setAttribute('stroke-width',renderedLetter.sw);}if(renderedLetter.sc&&renderedLetter._mdf.sc){textPath.setAttribute('stroke',renderedLetter.sc);}if(renderedLetter.fc&&renderedLetter._mdf.fc){textPath.setAttribute('fill',renderedLetter.fc);textPath.style.color=renderedLetter.fc;}}}if(this.innerElem.getBBox&&!this.hidden&&(this._isFirstFrame||this._mdf)){var boundingBox=this.innerElem.getBBox();if(this.currentBBox.w!==boundingBox.width){this.currentBBox.w=boundingBox.width;this.svgElement.setAttribute('width',boundingBox.width);}if(this.currentBBox.h!==boundingBox.height){this.currentBBox.h=boundingBox.height;this.svgElement.setAttribute('height',boundingBox.height);}var margin=1;if(this.currentBBox.w!==boundingBox.width+margin*2||this.currentBBox.h!==boundingBox.height+margin*2||this.currentBBox.x!==boundingBox.x-margin||this.currentBBox.y!==boundingBox.y-margin){this.currentBBox.w=boundingBox.width+margin*2;this.currentBBox.h=boundingBox.height+margin*2;this.currentBBox.x=boundingBox.x-margin;this.currentBBox.y=boundingBox.y-margin;this.svgElement.setAttribute('viewBox',this.currentBBox.x+' '+this.currentBBox.y+' '+this.currentBBox.w+' '+this.currentBBox.h);svgStyle=this.svgElement.style;var svgTransform='translate('+this.currentBBox.x+'px,'+this.currentBBox.y+'px)';svgStyle.transform=svgTransform;svgStyle.webkitTransform=svgTransform;}}};function HCameraElement(data,globalData,comp){this.initFrame();this.initBaseData(data,globalData,comp);this.initHierarchy();var getProp=PropertyFactory.getProp;this.pe=getProp(this,data.pe,0,0,this);if(data.ks.p.s){this.px=getProp(this,data.ks.p.x,1,0,this);this.py=getProp(this,data.ks.p.y,1,0,this);this.pz=getProp(this,data.ks.p.z,1,0,this);}else{this.p=getProp(this,data.ks.p,1,0,this);}if(data.ks.a){this.a=getProp(this,data.ks.a,1,0,this);}if(data.ks.or.k.length&&data.ks.or.k[0].to){var i;var len=data.ks.or.k.length;for(i=0;i<len;i+=1){data.ks.or.k[i].to=null;data.ks.or.k[i].ti=null;}}this.or=getProp(this,data.ks.or,1,degToRads,this);this.or.sh=true;this.rx=getProp(this,data.ks.rx,0,degToRads,this);this.ry=getProp(this,data.ks.ry,0,degToRads,this);this.rz=getProp(this,data.ks.rz,0,degToRads,this);this.mat=new Matrix();this._prevMat=new Matrix();this._isFirstFrame=true;// TODO: find a better way to make the HCamera element to be compatible with the LayerInterface and TransformInterface.
	this.finalTransform={mProp:this};}extendPrototype([BaseElement,FrameElement,HierarchyElement],HCameraElement);HCameraElement.prototype.setup=function(){var i;var len=this.comp.threeDElements.length;var comp;var perspectiveStyle;var containerStyle;for(i=0;i<len;i+=1){// [perspectiveElem,container]
	comp=this.comp.threeDElements[i];if(comp.type==='3d'){perspectiveStyle=comp.perspectiveElem.style;containerStyle=comp.container.style;var perspective=this.pe.v+'px';var origin='0px 0px 0px';var matrix='matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)';perspectiveStyle.perspective=perspective;perspectiveStyle.webkitPerspective=perspective;containerStyle.transformOrigin=origin;containerStyle.mozTransformOrigin=origin;containerStyle.webkitTransformOrigin=origin;perspectiveStyle.transform=matrix;perspectiveStyle.webkitTransform=matrix;}}};HCameraElement.prototype.createElements=function(){};HCameraElement.prototype.hide=function(){};HCameraElement.prototype.renderFrame=function(){var _mdf=this._isFirstFrame;var i;var len;if(this.hierarchy){len=this.hierarchy.length;for(i=0;i<len;i+=1){_mdf=this.hierarchy[i].finalTransform.mProp._mdf||_mdf;}}if(_mdf||this.pe._mdf||this.p&&this.p._mdf||this.px&&(this.px._mdf||this.py._mdf||this.pz._mdf)||this.rx._mdf||this.ry._mdf||this.rz._mdf||this.or._mdf||this.a&&this.a._mdf){this.mat.reset();if(this.hierarchy){len=this.hierarchy.length-1;for(i=len;i>=0;i-=1){var mTransf=this.hierarchy[i].finalTransform.mProp;this.mat.translate(-mTransf.p.v[0],-mTransf.p.v[1],mTransf.p.v[2]);this.mat.rotateX(-mTransf.or.v[0]).rotateY(-mTransf.or.v[1]).rotateZ(mTransf.or.v[2]);this.mat.rotateX(-mTransf.rx.v).rotateY(-mTransf.ry.v).rotateZ(mTransf.rz.v);this.mat.scale(1/mTransf.s.v[0],1/mTransf.s.v[1],1/mTransf.s.v[2]);this.mat.translate(mTransf.a.v[0],mTransf.a.v[1],mTransf.a.v[2]);}}if(this.p){this.mat.translate(-this.p.v[0],-this.p.v[1],this.p.v[2]);}else{this.mat.translate(-this.px.v,-this.py.v,this.pz.v);}if(this.a){var diffVector;if(this.p){diffVector=[this.p.v[0]-this.a.v[0],this.p.v[1]-this.a.v[1],this.p.v[2]-this.a.v[2]];}else{diffVector=[this.px.v-this.a.v[0],this.py.v-this.a.v[1],this.pz.v-this.a.v[2]];}var mag=Math.sqrt(Math.pow(diffVector[0],2)+Math.pow(diffVector[1],2)+Math.pow(diffVector[2],2));// var lookDir = getNormalizedPoint(getDiffVector(this.a.v,this.p.v));
	var lookDir=[diffVector[0]/mag,diffVector[1]/mag,diffVector[2]/mag];var lookLengthOnXZ=Math.sqrt(lookDir[2]*lookDir[2]+lookDir[0]*lookDir[0]);var mRotationX=Math.atan2(lookDir[1],lookLengthOnXZ);var mRotationY=Math.atan2(lookDir[0],-lookDir[2]);this.mat.rotateY(mRotationY).rotateX(-mRotationX);}this.mat.rotateX(-this.rx.v).rotateY(-this.ry.v).rotateZ(this.rz.v);this.mat.rotateX(-this.or.v[0]).rotateY(-this.or.v[1]).rotateZ(this.or.v[2]);this.mat.translate(this.globalData.compSize.w/2,this.globalData.compSize.h/2,0);this.mat.translate(0,0,this.pe.v);var hasMatrixChanged=!this._prevMat.equals(this.mat);if((hasMatrixChanged||this.pe._mdf)&&this.comp.threeDElements){len=this.comp.threeDElements.length;var comp;var perspectiveStyle;var containerStyle;for(i=0;i<len;i+=1){comp=this.comp.threeDElements[i];if(comp.type==='3d'){if(hasMatrixChanged){var matValue=this.mat.toCSS();containerStyle=comp.container.style;containerStyle.transform=matValue;containerStyle.webkitTransform=matValue;}if(this.pe._mdf){perspectiveStyle=comp.perspectiveElem.style;perspectiveStyle.perspective=this.pe.v+'px';perspectiveStyle.webkitPerspective=this.pe.v+'px';}}}this.mat.clone(this._prevMat);}}this._isFirstFrame=false;};HCameraElement.prototype.prepareFrame=function(num){this.prepareProperties(num,true);};HCameraElement.prototype.destroy=function(){};HCameraElement.prototype.getBaseElement=function(){return null;};function HImageElement(data,globalData,comp){this.assetData=globalData.getAssetData(data.refId);this.initElement(data,globalData,comp);}extendPrototype([BaseElement,TransformElement,HBaseElement,HSolidElement,HierarchyElement,FrameElement,RenderableElement],HImageElement);HImageElement.prototype.createContent=function(){var assetPath=this.globalData.getAssetsPath(this.assetData);var img=new Image();if(this.data.hasMask){this.imageElem=createNS('image');this.imageElem.setAttribute('width',this.assetData.w+'px');this.imageElem.setAttribute('height',this.assetData.h+'px');this.imageElem.setAttributeNS('http://www.w3.org/1999/xlink','href',assetPath);this.layerElement.appendChild(this.imageElem);this.baseElement.setAttribute('width',this.assetData.w);this.baseElement.setAttribute('height',this.assetData.h);}else{this.layerElement.appendChild(img);}img.crossOrigin='anonymous';img.src=assetPath;if(this.data.ln){this.baseElement.setAttribute('id',this.data.ln);}};function HybridRendererBase(animationItem,config){this.animationItem=animationItem;this.layers=null;this.renderedFrame=-1;this.renderConfig={className:config&&config.className||'',imagePreserveAspectRatio:config&&config.imagePreserveAspectRatio||'xMidYMid slice',hideOnTransparent:!(config&&config.hideOnTransparent===false),filterSize:{width:config&&config.filterSize&&config.filterSize.width||'400%',height:config&&config.filterSize&&config.filterSize.height||'400%',x:config&&config.filterSize&&config.filterSize.x||'-100%',y:config&&config.filterSize&&config.filterSize.y||'-100%'}};this.globalData={_mdf:false,frameNum:-1,renderConfig:this.renderConfig};this.pendingElements=[];this.elements=[];this.threeDElements=[];this.destroyed=false;this.camera=null;this.supports3d=true;this.rendererType='html';}extendPrototype([BaseRenderer],HybridRendererBase);HybridRendererBase.prototype.buildItem=SVGRenderer.prototype.buildItem;HybridRendererBase.prototype.checkPendingElements=function(){while(this.pendingElements.length){var element=this.pendingElements.pop();element.checkParenting();}};HybridRendererBase.prototype.appendElementInPos=function(element,pos){var newDOMElement=element.getBaseElement();if(!newDOMElement){return;}var layer=this.layers[pos];if(!layer.ddd||!this.supports3d){if(this.threeDElements){this.addTo3dContainer(newDOMElement,pos);}else{var i=0;var nextDOMElement;var nextLayer;var tmpDOMElement;while(i<pos){if(this.elements[i]&&this.elements[i]!==true&&this.elements[i].getBaseElement){nextLayer=this.elements[i];tmpDOMElement=this.layers[i].ddd?this.getThreeDContainerByPos(i):nextLayer.getBaseElement();nextDOMElement=tmpDOMElement||nextDOMElement;}i+=1;}if(nextDOMElement){if(!layer.ddd||!this.supports3d){this.layerElement.insertBefore(newDOMElement,nextDOMElement);}}else if(!layer.ddd||!this.supports3d){this.layerElement.appendChild(newDOMElement);}}}else{this.addTo3dContainer(newDOMElement,pos);}};HybridRendererBase.prototype.createShape=function(data){if(!this.supports3d){return new SVGShapeElement(data,this.globalData,this);}return new HShapeElement(data,this.globalData,this);};HybridRendererBase.prototype.createText=function(data){if(!this.supports3d){return new SVGTextLottieElement(data,this.globalData,this);}return new HTextElement(data,this.globalData,this);};HybridRendererBase.prototype.createCamera=function(data){this.camera=new HCameraElement(data,this.globalData,this);return this.camera;};HybridRendererBase.prototype.createImage=function(data){if(!this.supports3d){return new IImageElement(data,this.globalData,this);}return new HImageElement(data,this.globalData,this);};HybridRendererBase.prototype.createSolid=function(data){if(!this.supports3d){return new ISolidElement(data,this.globalData,this);}return new HSolidElement(data,this.globalData,this);};HybridRendererBase.prototype.createNull=SVGRenderer.prototype.createNull;HybridRendererBase.prototype.getThreeDContainerByPos=function(pos){var i=0;var len=this.threeDElements.length;while(i<len){if(this.threeDElements[i].startPos<=pos&&this.threeDElements[i].endPos>=pos){return this.threeDElements[i].perspectiveElem;}i+=1;}return null;};HybridRendererBase.prototype.createThreeDContainer=function(pos,type){var perspectiveElem=createTag('div');var style;var containerStyle;styleDiv(perspectiveElem);var container=createTag('div');styleDiv(container);if(type==='3d'){style=perspectiveElem.style;style.width=this.globalData.compSize.w+'px';style.height=this.globalData.compSize.h+'px';var center='50% 50%';style.webkitTransformOrigin=center;style.mozTransformOrigin=center;style.transformOrigin=center;containerStyle=container.style;var matrix='matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)';containerStyle.transform=matrix;containerStyle.webkitTransform=matrix;}perspectiveElem.appendChild(container);// this.resizerElem.appendChild(perspectiveElem);
	var threeDContainerData={container:container,perspectiveElem:perspectiveElem,startPos:pos,endPos:pos,type:type};this.threeDElements.push(threeDContainerData);return threeDContainerData;};HybridRendererBase.prototype.build3dContainers=function(){var i;var len=this.layers.length;var lastThreeDContainerData;var currentContainer='';for(i=0;i<len;i+=1){if(this.layers[i].ddd&&this.layers[i].ty!==3){if(currentContainer!=='3d'){currentContainer='3d';lastThreeDContainerData=this.createThreeDContainer(i,'3d');}lastThreeDContainerData.endPos=Math.max(lastThreeDContainerData.endPos,i);}else{if(currentContainer!=='2d'){currentContainer='2d';lastThreeDContainerData=this.createThreeDContainer(i,'2d');}lastThreeDContainerData.endPos=Math.max(lastThreeDContainerData.endPos,i);}}len=this.threeDElements.length;for(i=len-1;i>=0;i-=1){this.resizerElem.appendChild(this.threeDElements[i].perspectiveElem);}};HybridRendererBase.prototype.addTo3dContainer=function(elem,pos){var i=0;var len=this.threeDElements.length;while(i<len){if(pos<=this.threeDElements[i].endPos){var j=this.threeDElements[i].startPos;var nextElement;while(j<pos){if(this.elements[j]&&this.elements[j].getBaseElement){nextElement=this.elements[j].getBaseElement();}j+=1;}if(nextElement){this.threeDElements[i].container.insertBefore(elem,nextElement);}else{this.threeDElements[i].container.appendChild(elem);}break;}i+=1;}};HybridRendererBase.prototype.configAnimation=function(animData){var resizerElem=createTag('div');var wrapper=this.animationItem.wrapper;var style=resizerElem.style;style.width=animData.w+'px';style.height=animData.h+'px';this.resizerElem=resizerElem;styleDiv(resizerElem);style.transformStyle='flat';style.mozTransformStyle='flat';style.webkitTransformStyle='flat';if(this.renderConfig.className){resizerElem.setAttribute('class',this.renderConfig.className);}wrapper.appendChild(resizerElem);style.overflow='hidden';var svg=createNS('svg');svg.setAttribute('width','1');svg.setAttribute('height','1');styleDiv(svg);this.resizerElem.appendChild(svg);var defs=createNS('defs');svg.appendChild(defs);this.data=animData;// Mask animation
	this.setupGlobalData(animData,svg);this.globalData.defs=defs;this.layers=animData.layers;this.layerElement=this.resizerElem;this.build3dContainers();this.updateContainerSize();};HybridRendererBase.prototype.destroy=function(){if(this.animationItem.wrapper){this.animationItem.wrapper.innerText='';}this.animationItem.container=null;this.globalData.defs=null;var i;var len=this.layers?this.layers.length:0;for(i=0;i<len;i+=1){this.elements[i].destroy();}this.elements.length=0;this.destroyed=true;this.animationItem=null;};HybridRendererBase.prototype.updateContainerSize=function(){var elementWidth=this.animationItem.wrapper.offsetWidth;var elementHeight=this.animationItem.wrapper.offsetHeight;var elementRel=elementWidth/elementHeight;var animationRel=this.globalData.compSize.w/this.globalData.compSize.h;var sx;var sy;var tx;var ty;if(animationRel>elementRel){sx=elementWidth/this.globalData.compSize.w;sy=elementWidth/this.globalData.compSize.w;tx=0;ty=(elementHeight-this.globalData.compSize.h*(elementWidth/this.globalData.compSize.w))/2;}else{sx=elementHeight/this.globalData.compSize.h;sy=elementHeight/this.globalData.compSize.h;tx=(elementWidth-this.globalData.compSize.w*(elementHeight/this.globalData.compSize.h))/2;ty=0;}var style=this.resizerElem.style;style.webkitTransform='matrix3d('+sx+',0,0,0,0,'+sy+',0,0,0,0,1,0,'+tx+','+ty+',0,1)';style.transform=style.webkitTransform;};HybridRendererBase.prototype.renderFrame=SVGRenderer.prototype.renderFrame;HybridRendererBase.prototype.hide=function(){this.resizerElem.style.display='none';};HybridRendererBase.prototype.show=function(){this.resizerElem.style.display='block';};HybridRendererBase.prototype.initItems=function(){this.buildAllItems();if(this.camera){this.camera.setup();}else{var cWidth=this.globalData.compSize.w;var cHeight=this.globalData.compSize.h;var i;var len=this.threeDElements.length;for(i=0;i<len;i+=1){var style=this.threeDElements[i].perspectiveElem.style;style.webkitPerspective=Math.sqrt(Math.pow(cWidth,2)+Math.pow(cHeight,2))+'px';style.perspective=style.webkitPerspective;}}};HybridRendererBase.prototype.searchExtraCompositions=function(assets){var i;var len=assets.length;var floatingContainer=createTag('div');for(i=0;i<len;i+=1){if(assets[i].xt){var comp=this.createComp(assets[i],floatingContainer,this.globalData.comp,null);comp.initExpressions();this.globalData.projectInterface.registerComposition(comp);}}};function HCompElement(data,globalData,comp){this.layers=data.layers;this.supports3d=!data.hasMask;this.completeLayers=false;this.pendingElements=[];this.elements=this.layers?createSizedArray(this.layers.length):[];this.initElement(data,globalData,comp);this.tm=data.tm?PropertyFactory.getProp(this,data.tm,0,globalData.frameRate,this):{_placeholder:true};}extendPrototype([HybridRendererBase,ICompElement,HBaseElement],HCompElement);HCompElement.prototype._createBaseContainerElements=HCompElement.prototype.createContainerElements;HCompElement.prototype.createContainerElements=function(){this._createBaseContainerElements();// divElement.style.clip = 'rect(0px, '+this.data.w+'px, '+this.data.h+'px, 0px)';
	if(this.data.hasMask){this.svgElement.setAttribute('width',this.data.w);this.svgElement.setAttribute('height',this.data.h);this.transformedElement=this.baseElement;}else{this.transformedElement=this.layerElement;}};HCompElement.prototype.addTo3dContainer=function(elem,pos){var j=0;var nextElement;while(j<pos){if(this.elements[j]&&this.elements[j].getBaseElement){nextElement=this.elements[j].getBaseElement();}j+=1;}if(nextElement){this.layerElement.insertBefore(elem,nextElement);}else{this.layerElement.appendChild(elem);}};HCompElement.prototype.createComp=function(data){if(!this.supports3d){return new SVGCompElement(data,this.globalData,this);}return new HCompElement(data,this.globalData,this);};function HybridRenderer(animationItem,config){this.animationItem=animationItem;this.layers=null;this.renderedFrame=-1;this.renderConfig={className:config&&config.className||'',imagePreserveAspectRatio:config&&config.imagePreserveAspectRatio||'xMidYMid slice',hideOnTransparent:!(config&&config.hideOnTransparent===false),filterSize:{width:config&&config.filterSize&&config.filterSize.width||'400%',height:config&&config.filterSize&&config.filterSize.height||'400%',x:config&&config.filterSize&&config.filterSize.x||'-100%',y:config&&config.filterSize&&config.filterSize.y||'-100%'}};this.globalData={_mdf:false,frameNum:-1,renderConfig:this.renderConfig};this.pendingElements=[];this.elements=[];this.threeDElements=[];this.destroyed=false;this.camera=null;this.supports3d=true;this.rendererType='html';}extendPrototype([HybridRendererBase],HybridRenderer);HybridRenderer.prototype.createComp=function(data){if(!this.supports3d){return new SVGCompElement(data,this.globalData,this);}return new HCompElement(data,this.globalData,this);};var Expressions=function(){var ob={};ob.initExpressions=initExpressions;function initExpressions(animation){var stackCount=0;var registers=[];function pushExpression(){stackCount+=1;}function popExpression(){stackCount-=1;if(stackCount===0){releaseInstances();}}function registerExpressionProperty(expression){if(registers.indexOf(expression)===-1){registers.push(expression);}}function releaseInstances(){var i;var len=registers.length;for(i=0;i<len;i+=1){registers[i].release();}registers.length=0;}animation.renderer.compInterface=CompExpressionInterface(animation.renderer);animation.renderer.globalData.projectInterface.registerComposition(animation.renderer);animation.renderer.globalData.pushExpression=pushExpression;animation.renderer.globalData.popExpression=popExpression;animation.renderer.globalData.registerExpressionProperty=registerExpressionProperty;}return ob;}();function _typeof$1(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof$1=function _typeof(obj){return typeof obj;};}else{_typeof$1=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};}return _typeof$1(obj);}/* eslint-disable */ /*
	   Copyright 2014 David Bau.

	   Permission is hereby granted, free of charge, to any person obtaining
	   a copy of this software and associated documentation files (the
	   "Software"), to deal in the Software without restriction, including
	   without limitation the rights to use, copy, modify, merge, publish,
	   distribute, sublicense, and/or sell copies of the Software, and to
	   permit persons to whom the Software is furnished to do so, subject to
	   the following conditions:

	   The above copyright notice and this permission notice shall be
	   included in all copies or substantial portions of the Software.

	   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
	   IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
	   CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
	   TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
	   SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	   */function seedRandom(pool,math){//
	// The following constants are related to IEEE 754 limits.
	//
	var global=this,width=256,// each RC4 output is 0 <= x < 256
	chunks=6,// at least six RC4 outputs for each double
	digits=52,// there are 52 significant digits in a double
	rngname='random',// rngname: name for Math.random and Math.seedrandom
	startdenom=math.pow(width,chunks),significance=math.pow(2,digits),overflow=significance*2,mask=width-1;// node.js crypto module, initialized at the bottom.
	//
	// seedrandom()
	// This is the seedrandom function described above.
	//
	function seedrandom(seed,options,callback){var key=[];options=options===true?{entropy:true}:options||{};// Flatten the seed string or build one from local entropy if needed.
	var shortseed=mixkey(flatten(options.entropy?[seed,tostring(pool)]:seed===null?autoseed():seed,3),key);// Use the seed to initialize an ARC4 generator.
	var arc4=new ARC4(key);// This function returns a random double in [0, 1) that contains
	// randomness in every bit of the mantissa of the IEEE 754 value.
	var prng=function prng(){var n=arc4.g(chunks),// Start with a numerator n < 2 ^ 48
	d=startdenom,//   and denominator d = 2 ^ 48.
	x=0;//   and no 'extra last byte'.
	while(n<significance){// Fill up all significant digits by
	n=(n+x)*width;//   shifting numerator and
	d*=width;//   denominator and generating a
	x=arc4.g(1);//   new least-significant-byte.
	}while(n>=overflow){// To avoid rounding up, before adding
	n/=2;//   last byte, shift everything
	d/=2;//   right using integer math until
	x>>>=1;//   we have exactly the desired bits.
	}return (n+x)/d;// Form the number within [0, 1).
	};prng.int32=function(){return arc4.g(4)|0;};prng.quick=function(){return arc4.g(4)/0x100000000;};prng["double"]=prng;// Mix the randomness into accumulated entropy.
	mixkey(tostring(arc4.S),pool);// Calling convention: what to return as a function of prng, seed, is_math.
	return (options.pass||callback||function(prng,seed,is_math_call,state){if(state){// Load the arc4 state from the given state if it has an S array.
	if(state.S){copy(state,arc4);}// Only provide the .state method if requested via options.state.
	prng.state=function(){return copy(arc4,{});};}// If called as a method of Math (Math.seedrandom()), mutate
	// Math.random because that is how seedrandom.js has worked since v1.0.
	if(is_math_call){math[rngname]=prng;return seed;}// Otherwise, it is a newer calling convention, so return the
	// prng directly.
	else return prng;})(prng,shortseed,'global'in options?options.global:this==math,options.state);}math['seed'+rngname]=seedrandom;//
	// ARC4
	//
	// An ARC4 implementation.  The constructor takes a key in the form of
	// an array of at most (width) integers that should be 0 <= x < (width).
	//
	// The g(count) method returns a pseudorandom integer that concatenates
	// the next (count) outputs from ARC4.  Its return value is a number x
	// that is in the range 0 <= x < (width ^ count).
	//
	function ARC4(key){var t,keylen=key.length,me=this,i=0,j=me.i=me.j=0,s=me.S=[];// The empty key [] is treated as [0].
	if(!keylen){key=[keylen++];}// Set up S using the standard key scheduling algorithm.
	while(i<width){s[i]=i++;}for(i=0;i<width;i++){s[i]=s[j=mask&j+key[i%keylen]+(t=s[i])];s[j]=t;}// The "g" method returns the next (count) outputs as one number.
	me.g=function(count){// Using instance members instead of closure state nearly doubles speed.
	var t,r=0,i=me.i,j=me.j,s=me.S;while(count--){t=s[i=mask&i+1];r=r*width+s[mask&(s[i]=s[j=mask&j+t])+(s[j]=t)];}me.i=i;me.j=j;return r;// For robust unpredictability, the function call below automatically
	// discards an initial batch of values.  This is called RC4-drop[256].
	// See http://google.com/search?q=rsa+fluhrer+response&btnI
	};}//
	// copy()
	// Copies internal state of ARC4 to or from a plain object.
	//
	function copy(f,t){t.i=f.i;t.j=f.j;t.S=f.S.slice();return t;}//
	// flatten()
	// Converts an object tree to nested arrays of strings.
	//
	function flatten(obj,depth){var result=[],typ=_typeof$1(obj),prop;if(depth&&typ=='object'){for(prop in obj){try{result.push(flatten(obj[prop],depth-1));}catch(e){}}}return result.length?result:typ=='string'?obj:obj+'\0';}//
	// mixkey()
	// Mixes a string seed into a key that is an array of integers, and
	// returns a shortened string seed that is equivalent to the result key.
	//
	function mixkey(seed,key){var stringseed=seed+'',smear,j=0;while(j<stringseed.length){key[mask&j]=mask&(smear^=key[mask&j]*19)+stringseed.charCodeAt(j++);}return tostring(key);}//
	// autoseed()
	// Returns an object for autoseeding, using window.crypto and Node crypto
	// module if available.
	//
	function autoseed(){try{var out=new Uint8Array(width);(global.crypto||global.msCrypto).getRandomValues(out);return tostring(out);}catch(e){var browser=global.navigator,plugins=browser&&browser.plugins;return [+new Date(),global,plugins,global.screen,tostring(pool)];}}//
	// tostring()
	// Converts an array of charcodes to a string
	//
	function tostring(a){return String.fromCharCode.apply(0,a);}//
	// When seedrandom.js is loaded, we immediately mix a few bits
	// from the built-in RNG into the entropy pool.  Because we do
	// not want to interfere with deterministic PRNG state later,
	// seedrandom will not call math.random on its own again after
	// initialization.
	//
	mixkey(math.random(),pool);//
	// Nodejs and AMD support: export the implementation as a module using
	// either convention.
	//
	// End anonymous scope, and pass initial values.
	}function initialize$2(BMMath){seedRandom([],BMMath);}var propTypes={SHAPE:'shape'};function _typeof(obj){"@babel/helpers - typeof";if(typeof Symbol==="function"&&typeof Symbol.iterator==="symbol"){_typeof=function _typeof(obj){return typeof obj;};}else{_typeof=function _typeof(obj){return obj&&typeof Symbol==="function"&&obj.constructor===Symbol&&obj!==Symbol.prototype?"symbol":typeof obj;};}return _typeof(obj);}var ExpressionManager=function(){var ob={};var Math=BMMath;var window=null;var document=null;var XMLHttpRequest=null;var fetch=null;var frames=null;initialize$2(BMMath);function $bm_isInstanceOfArray(arr){return arr.constructor===Array||arr.constructor===Float32Array;}function isNumerable(tOfV,v){return tOfV==='number'||tOfV==='boolean'||tOfV==='string'||v instanceof Number;}function $bm_neg(a){var tOfA=_typeof(a);if(tOfA==='number'||tOfA==='boolean'||a instanceof Number){return -a;}if($bm_isInstanceOfArray(a)){var i;var lenA=a.length;var retArr=[];for(i=0;i<lenA;i+=1){retArr[i]=-a[i];}return retArr;}if(a.propType){return a.v;}return -a;}var easeInBez=BezierFactory.getBezierEasing(0.333,0,0.833,0.833,'easeIn').get;var easeOutBez=BezierFactory.getBezierEasing(0.167,0.167,0.667,1,'easeOut').get;var easeInOutBez=BezierFactory.getBezierEasing(0.33,0,0.667,1,'easeInOut').get;function sum(a,b){var tOfA=_typeof(a);var tOfB=_typeof(b);if(tOfA==='string'||tOfB==='string'){return a+b;}if(isNumerable(tOfA,a)&&isNumerable(tOfB,b)){return a+b;}if($bm_isInstanceOfArray(a)&&isNumerable(tOfB,b)){a=a.slice(0);a[0]+=b;return a;}if(isNumerable(tOfA,a)&&$bm_isInstanceOfArray(b)){b=b.slice(0);b[0]=a+b[0];return b;}if($bm_isInstanceOfArray(a)&&$bm_isInstanceOfArray(b)){var i=0;var lenA=a.length;var lenB=b.length;var retArr=[];while(i<lenA||i<lenB){if((typeof a[i]==='number'||a[i]instanceof Number)&&(typeof b[i]==='number'||b[i]instanceof Number)){retArr[i]=a[i]+b[i];}else{retArr[i]=b[i]===undefined?a[i]:a[i]||b[i];}i+=1;}return retArr;}return 0;}var add=sum;function sub(a,b){var tOfA=_typeof(a);var tOfB=_typeof(b);if(isNumerable(tOfA,a)&&isNumerable(tOfB,b)){if(tOfA==='string'){a=parseInt(a,10);}if(tOfB==='string'){b=parseInt(b,10);}return a-b;}if($bm_isInstanceOfArray(a)&&isNumerable(tOfB,b)){a=a.slice(0);a[0]-=b;return a;}if(isNumerable(tOfA,a)&&$bm_isInstanceOfArray(b)){b=b.slice(0);b[0]=a-b[0];return b;}if($bm_isInstanceOfArray(a)&&$bm_isInstanceOfArray(b)){var i=0;var lenA=a.length;var lenB=b.length;var retArr=[];while(i<lenA||i<lenB){if((typeof a[i]==='number'||a[i]instanceof Number)&&(typeof b[i]==='number'||b[i]instanceof Number)){retArr[i]=a[i]-b[i];}else{retArr[i]=b[i]===undefined?a[i]:a[i]||b[i];}i+=1;}return retArr;}return 0;}function mul(a,b){var tOfA=_typeof(a);var tOfB=_typeof(b);var arr;if(isNumerable(tOfA,a)&&isNumerable(tOfB,b)){return a*b;}var i;var len;if($bm_isInstanceOfArray(a)&&isNumerable(tOfB,b)){len=a.length;arr=createTypedArray('float32',len);for(i=0;i<len;i+=1){arr[i]=a[i]*b;}return arr;}if(isNumerable(tOfA,a)&&$bm_isInstanceOfArray(b)){len=b.length;arr=createTypedArray('float32',len);for(i=0;i<len;i+=1){arr[i]=a*b[i];}return arr;}return 0;}function div(a,b){var tOfA=_typeof(a);var tOfB=_typeof(b);var arr;if(isNumerable(tOfA,a)&&isNumerable(tOfB,b)){return a/b;}var i;var len;if($bm_isInstanceOfArray(a)&&isNumerable(tOfB,b)){len=a.length;arr=createTypedArray('float32',len);for(i=0;i<len;i+=1){arr[i]=a[i]/b;}return arr;}if(isNumerable(tOfA,a)&&$bm_isInstanceOfArray(b)){len=b.length;arr=createTypedArray('float32',len);for(i=0;i<len;i+=1){arr[i]=a/b[i];}return arr;}return 0;}function mod(a,b){if(typeof a==='string'){a=parseInt(a,10);}if(typeof b==='string'){b=parseInt(b,10);}return a%b;}var $bm_sum=sum;var $bm_sub=sub;var $bm_mul=mul;var $bm_div=div;var $bm_mod=mod;function clamp(num,min,max){if(min>max){var mm=max;max=min;min=mm;}return Math.min(Math.max(num,min),max);}function radiansToDegrees(val){return val/degToRads;}var radians_to_degrees=radiansToDegrees;function degreesToRadians(val){return val*degToRads;}var degrees_to_radians=radiansToDegrees;var helperLengthArray=[0,0,0,0,0,0];function length(arr1,arr2){if(typeof arr1==='number'||arr1 instanceof Number){arr2=arr2||0;return Math.abs(arr1-arr2);}if(!arr2){arr2=helperLengthArray;}var i;var len=Math.min(arr1.length,arr2.length);var addedLength=0;for(i=0;i<len;i+=1){addedLength+=Math.pow(arr2[i]-arr1[i],2);}return Math.sqrt(addedLength);}function normalize(vec){return div(vec,length(vec));}function rgbToHsl(val){var r=val[0];var g=val[1];var b=val[2];var max=Math.max(r,g,b);var min=Math.min(r,g,b);var h;var s;var l=(max+min)/2;if(max===min){h=0;// achromatic
	s=0;// achromatic
	}else{var d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break;default:break;}h/=6;}return [h,s,l,val[3]];}function hue2rgb(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p;}function hslToRgb(val){var h=val[0];var s=val[1];var l=val[2];var r;var g;var b;if(s===0){r=l;// achromatic
	b=l;// achromatic
	g=l;// achromatic
	}else{var q=l<0.5?l*(1+s):l+s-l*s;var p=2*l-q;r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3);}return [r,g,b,val[3]];}function linear(t,tMin,tMax,value1,value2){if(value1===undefined||value2===undefined){value1=tMin;value2=tMax;tMin=0;tMax=1;}if(tMax<tMin){var _tMin=tMax;tMax=tMin;tMin=_tMin;}if(t<=tMin){return value1;}if(t>=tMax){return value2;}var perc=tMax===tMin?0:(t-tMin)/(tMax-tMin);if(!value1.length){return value1+(value2-value1)*perc;}var i;var len=value1.length;var arr=createTypedArray('float32',len);for(i=0;i<len;i+=1){arr[i]=value1[i]+(value2[i]-value1[i])*perc;}return arr;}function random(min,max){if(max===undefined){if(min===undefined){min=0;max=1;}else{max=min;min=undefined;}}if(max.length){var i;var len=max.length;if(!min){min=createTypedArray('float32',len);}var arr=createTypedArray('float32',len);var rnd=BMMath.random();for(i=0;i<len;i+=1){arr[i]=min[i]+rnd*(max[i]-min[i]);}return arr;}if(min===undefined){min=0;}var rndm=BMMath.random();return min+rndm*(max-min);}function createPath(points,inTangents,outTangents,closed){var i;var len=points.length;var path=shapePool.newElement();path.setPathData(!!closed,len);var arrPlaceholder=[0,0];var inVertexPoint;var outVertexPoint;for(i=0;i<len;i+=1){inVertexPoint=inTangents&&inTangents[i]?inTangents[i]:arrPlaceholder;outVertexPoint=outTangents&&outTangents[i]?outTangents[i]:arrPlaceholder;path.setTripleAt(points[i][0],points[i][1],outVertexPoint[0]+points[i][0],outVertexPoint[1]+points[i][1],inVertexPoint[0]+points[i][0],inVertexPoint[1]+points[i][1],i,true);}return path;}function initiateExpression(elem,data,property){var val=data.x;var needsVelocity=/velocity(?![\w\d])/.test(val);var _needsRandom=val.indexOf('random')!==-1;var elemType=elem.data.ty;var transform;var $bm_transform;var content;var effect;var thisProperty=property;thisProperty.valueAtTime=thisProperty.getValueAtTime;Object.defineProperty(thisProperty,'value',{get:function get(){return thisProperty.v;}});elem.comp.frameDuration=1/elem.comp.globalData.frameRate;elem.comp.displayStartTime=0;var inPoint=elem.data.ip/elem.comp.globalData.frameRate;var outPoint=elem.data.op/elem.comp.globalData.frameRate;var width=elem.data.sw?elem.data.sw:0;var height=elem.data.sh?elem.data.sh:0;var name=elem.data.nm;var loopIn;var loop_in;var loopOut;var loop_out;var smooth;var toWorld;var fromWorld;var fromComp;var toComp;var fromCompToSurface;var position;var rotation;var anchorPoint;var scale;var thisLayer;var thisComp;var mask;var valueAtTime;var velocityAtTime;var scoped_bm_rt;// val = val.replace(/(\\?"|')((http)(s)?(:\/))?\/.*?(\\?"|')/g, "\"\""); // deter potential network calls
	var expression_function=eval('[function _expression_function(){'+val+';scoped_bm_rt=$bm_rt}]')[0];// eslint-disable-line no-eval
	var numKeys=property.kf?data.k.length:0;var active=!this.data||this.data.hd!==true;var wiggle=function wiggle(freq,amp){var iWiggle;var j;var lenWiggle=this.pv.length?this.pv.length:1;var addedAmps=createTypedArray('float32',lenWiggle);freq=5;var iterations=Math.floor(time*freq);iWiggle=0;j=0;while(iWiggle<iterations){// var rnd = BMMath.random();
	for(j=0;j<lenWiggle;j+=1){addedAmps[j]+=-amp+amp*2*BMMath.random();// addedAmps[j] += -amp + amp*2*rnd;
	}iWiggle+=1;}// var rnd2 = BMMath.random();
	var periods=time*freq;var perc=periods-Math.floor(periods);var arr=createTypedArray('float32',lenWiggle);if(lenWiggle>1){for(j=0;j<lenWiggle;j+=1){arr[j]=this.pv[j]+addedAmps[j]+(-amp+amp*2*BMMath.random())*perc;// arr[j] = this.pv[j] + addedAmps[j] + (-amp + amp*2*rnd)*perc;
	// arr[i] = this.pv[i] + addedAmp + amp1*perc + amp2*(1-perc);
	}return arr;}return this.pv+addedAmps[0]+(-amp+amp*2*BMMath.random())*perc;}.bind(this);if(thisProperty.loopIn){loopIn=thisProperty.loopIn.bind(thisProperty);loop_in=loopIn;}if(thisProperty.loopOut){loopOut=thisProperty.loopOut.bind(thisProperty);loop_out=loopOut;}if(thisProperty.smooth){smooth=thisProperty.smooth.bind(thisProperty);}function loopInDuration(type,duration){return loopIn(type,duration,true);}function loopOutDuration(type,duration){return loopOut(type,duration,true);}if(this.getValueAtTime){valueAtTime=this.getValueAtTime.bind(this);}if(this.getVelocityAtTime){velocityAtTime=this.getVelocityAtTime.bind(this);}var comp=elem.comp.globalData.projectInterface.bind(elem.comp.globalData.projectInterface);function lookAt(elem1,elem2){var fVec=[elem2[0]-elem1[0],elem2[1]-elem1[1],elem2[2]-elem1[2]];var pitch=Math.atan2(fVec[0],Math.sqrt(fVec[1]*fVec[1]+fVec[2]*fVec[2]))/degToRads;var yaw=-Math.atan2(fVec[1],fVec[2])/degToRads;return [yaw,pitch,0];}function easeOut(t,tMin,tMax,val1,val2){return applyEase(easeOutBez,t,tMin,tMax,val1,val2);}function easeIn(t,tMin,tMax,val1,val2){return applyEase(easeInBez,t,tMin,tMax,val1,val2);}function ease(t,tMin,tMax,val1,val2){return applyEase(easeInOutBez,t,tMin,tMax,val1,val2);}function applyEase(fn,t,tMin,tMax,val1,val2){if(val1===undefined){val1=tMin;val2=tMax;}else{t=(t-tMin)/(tMax-tMin);}if(t>1){t=1;}else if(t<0){t=0;}var mult=fn(t);if($bm_isInstanceOfArray(val1)){var iKey;var lenKey=val1.length;var arr=createTypedArray('float32',lenKey);for(iKey=0;iKey<lenKey;iKey+=1){arr[iKey]=(val2[iKey]-val1[iKey])*mult+val1[iKey];}return arr;}return (val2-val1)*mult+val1;}function nearestKey(time){var iKey;var lenKey=data.k.length;var index;var keyTime;if(!data.k.length||typeof data.k[0]==='number'){index=0;keyTime=0;}else{index=-1;time*=elem.comp.globalData.frameRate;if(time<data.k[0].t){index=1;keyTime=data.k[0].t;}else{for(iKey=0;iKey<lenKey-1;iKey+=1){if(time===data.k[iKey].t){index=iKey+1;keyTime=data.k[iKey].t;break;}else if(time>data.k[iKey].t&&time<data.k[iKey+1].t){if(time-data.k[iKey].t>data.k[iKey+1].t-time){index=iKey+2;keyTime=data.k[iKey+1].t;}else{index=iKey+1;keyTime=data.k[iKey].t;}break;}}if(index===-1){index=iKey+1;keyTime=data.k[iKey].t;}}}var obKey={};obKey.index=index;obKey.time=keyTime/elem.comp.globalData.frameRate;return obKey;}function key(ind){var obKey;var iKey;var lenKey;if(!data.k.length||typeof data.k[0]==='number'){throw new Error('The property has no keyframe at index '+ind);}ind-=1;obKey={time:data.k[ind].t/elem.comp.globalData.frameRate,value:[]};var arr=Object.prototype.hasOwnProperty.call(data.k[ind],'s')?data.k[ind].s:data.k[ind-1].e;lenKey=arr.length;for(iKey=0;iKey<lenKey;iKey+=1){obKey[iKey]=arr[iKey];obKey.value[iKey]=arr[iKey];}return obKey;}function framesToTime(fr,fps){if(!fps){fps=elem.comp.globalData.frameRate;}return fr/fps;}function timeToFrames(t,fps){if(!t&&t!==0){t=time;}if(!fps){fps=elem.comp.globalData.frameRate;}return t*fps;}function seedRandom(seed){BMMath.seedrandom(randSeed+seed);}function sourceRectAtTime(){return elem.sourceRectAtTime();}function substring(init,end){if(typeof value==='string'){if(end===undefined){return value.substring(init);}return value.substring(init,end);}return '';}function substr(init,end){if(typeof value==='string'){if(end===undefined){return value.substr(init);}return value.substr(init,end);}return '';}function posterizeTime(framesPerSecond){time=framesPerSecond===0?0:Math.floor(time*framesPerSecond)/framesPerSecond;value=valueAtTime(time);}var time;var velocity;var value;var text;var textIndex;var textTotal;var selectorValue;var index=elem.data.ind;var hasParent=!!(elem.hierarchy&&elem.hierarchy.length);var parent;var randSeed=Math.floor(Math.random()*1000000);var globalData=elem.globalData;function executeExpression(_value){// globalData.pushExpression();
	value=_value;if(this.frameExpressionId===elem.globalData.frameId&&this.propType!=='textSelector'){return value;}if(this.propType==='textSelector'){textIndex=this.textIndex;textTotal=this.textTotal;selectorValue=this.selectorValue;}if(!thisLayer){text=elem.layerInterface.text;thisLayer=elem.layerInterface;thisComp=elem.comp.compInterface;toWorld=thisLayer.toWorld.bind(thisLayer);fromWorld=thisLayer.fromWorld.bind(thisLayer);fromComp=thisLayer.fromComp.bind(thisLayer);toComp=thisLayer.toComp.bind(thisLayer);mask=thisLayer.mask?thisLayer.mask.bind(thisLayer):null;fromCompToSurface=fromComp;}if(!transform){transform=elem.layerInterface('ADBE Transform Group');$bm_transform=transform;if(transform){anchorPoint=transform.anchorPoint;/* position = transform.position;
	                      rotation = transform.rotation;
	                      scale = transform.scale; */}}if(elemType===4&&!content){content=thisLayer('ADBE Root Vectors Group');}if(!effect){effect=thisLayer(4);}hasParent=!!(elem.hierarchy&&elem.hierarchy.length);if(hasParent&&!parent){parent=elem.hierarchy[0].layerInterface;}time=this.comp.renderedFrame/this.comp.globalData.frameRate;if(_needsRandom){seedRandom(randSeed+time);}if(needsVelocity){velocity=velocityAtTime(time);}expression_function();this.frameExpressionId=elem.globalData.frameId;// TODO: Check if it's possible to return on ShapeInterface the .v value
	// Changed this to a ternary operation because Rollup failed compiling it correctly
	scoped_bm_rt=scoped_bm_rt.propType===propTypes.SHAPE?scoped_bm_rt.v:scoped_bm_rt;return scoped_bm_rt;}// Bundlers will see these as dead code and unless we reference them
	executeExpression.__preventDeadCodeRemoval=[$bm_transform,anchorPoint,time,velocity,inPoint,outPoint,width,height,name,loop_in,loop_out,smooth,toComp,fromCompToSurface,toWorld,fromWorld,mask,position,rotation,scale,thisComp,numKeys,active,wiggle,loopInDuration,loopOutDuration,comp,lookAt,easeOut,easeIn,ease,nearestKey,key,text,textIndex,textTotal,selectorValue,framesToTime,timeToFrames,sourceRectAtTime,substring,substr,posterizeTime,index,globalData];return executeExpression;}ob.initiateExpression=initiateExpression;ob.__preventDeadCodeRemoval=[window,document,XMLHttpRequest,fetch,frames,$bm_neg,add,$bm_sum,$bm_sub,$bm_mul,$bm_div,$bm_mod,clamp,radians_to_degrees,degreesToRadians,degrees_to_radians,normalize,rgbToHsl,hslToRgb,linear,random,createPath];return ob;}();var expressionHelpers=function(){function searchExpressions(elem,data,prop){if(data.x){prop.k=true;prop.x=true;prop.initiateExpression=ExpressionManager.initiateExpression;prop.effectsSequence.push(prop.initiateExpression(elem,data,prop).bind(prop));}}function getValueAtTime(frameNum){frameNum*=this.elem.globalData.frameRate;frameNum-=this.offsetTime;if(frameNum!==this._cachingAtTime.lastFrame){this._cachingAtTime.lastIndex=this._cachingAtTime.lastFrame<frameNum?this._cachingAtTime.lastIndex:0;this._cachingAtTime.value=this.interpolateValue(frameNum,this._cachingAtTime);this._cachingAtTime.lastFrame=frameNum;}return this._cachingAtTime.value;}function getSpeedAtTime(frameNum){var delta=-0.01;var v1=this.getValueAtTime(frameNum);var v2=this.getValueAtTime(frameNum+delta);var speed=0;if(v1.length){var i;for(i=0;i<v1.length;i+=1){speed+=Math.pow(v2[i]-v1[i],2);}speed=Math.sqrt(speed)*100;}else{speed=0;}return speed;}function getVelocityAtTime(frameNum){if(this.vel!==undefined){return this.vel;}var delta=-0.001;// frameNum += this.elem.data.st;
	var v1=this.getValueAtTime(frameNum);var v2=this.getValueAtTime(frameNum+delta);var velocity;if(v1.length){velocity=createTypedArray('float32',v1.length);var i;for(i=0;i<v1.length;i+=1){// removing frameRate
	// if needed, don't add it here
	// velocity[i] = this.elem.globalData.frameRate*((v2[i] - v1[i])/delta);
	velocity[i]=(v2[i]-v1[i])/delta;}}else{velocity=(v2-v1)/delta;}return velocity;}function getStaticValueAtTime(){return this.pv;}function setGroupProperty(propertyGroup){this.propertyGroup=propertyGroup;}return {searchExpressions:searchExpressions,getSpeedAtTime:getSpeedAtTime,getVelocityAtTime:getVelocityAtTime,getValueAtTime:getValueAtTime,getStaticValueAtTime:getStaticValueAtTime,setGroupProperty:setGroupProperty};}();function addPropertyDecorator(){function loopOut(type,duration,durationFlag){if(!this.k||!this.keyframes){return this.pv;}type=type?type.toLowerCase():'';var currentFrame=this.comp.renderedFrame;var keyframes=this.keyframes;var lastKeyFrame=keyframes[keyframes.length-1].t;if(currentFrame<=lastKeyFrame){return this.pv;}var cycleDuration;var firstKeyFrame;if(!durationFlag){if(!duration||duration>keyframes.length-1){duration=keyframes.length-1;}firstKeyFrame=keyframes[keyframes.length-1-duration].t;cycleDuration=lastKeyFrame-firstKeyFrame;}else{if(!duration){cycleDuration=Math.max(0,lastKeyFrame-this.elem.data.ip);}else{cycleDuration=Math.abs(lastKeyFrame-this.elem.comp.globalData.frameRate*duration);}firstKeyFrame=lastKeyFrame-cycleDuration;}var i;var len;var ret;if(type==='pingpong'){var iterations=Math.floor((currentFrame-firstKeyFrame)/cycleDuration);if(iterations%2!==0){return this.getValueAtTime((cycleDuration-(currentFrame-firstKeyFrame)%cycleDuration+firstKeyFrame)/this.comp.globalData.frameRate,0);// eslint-disable-line
	}}else if(type==='offset'){var initV=this.getValueAtTime(firstKeyFrame/this.comp.globalData.frameRate,0);var endV=this.getValueAtTime(lastKeyFrame/this.comp.globalData.frameRate,0);var current=this.getValueAtTime(((currentFrame-firstKeyFrame)%cycleDuration+firstKeyFrame)/this.comp.globalData.frameRate,0);// eslint-disable-line
	var repeats=Math.floor((currentFrame-firstKeyFrame)/cycleDuration);if(this.pv.length){ret=new Array(initV.length);len=ret.length;for(i=0;i<len;i+=1){ret[i]=(endV[i]-initV[i])*repeats+current[i];}return ret;}return (endV-initV)*repeats+current;}else if(type==='continue'){var lastValue=this.getValueAtTime(lastKeyFrame/this.comp.globalData.frameRate,0);var nextLastValue=this.getValueAtTime((lastKeyFrame-0.001)/this.comp.globalData.frameRate,0);if(this.pv.length){ret=new Array(lastValue.length);len=ret.length;for(i=0;i<len;i+=1){ret[i]=lastValue[i]+(lastValue[i]-nextLastValue[i])*((currentFrame-lastKeyFrame)/this.comp.globalData.frameRate)/0.0005;// eslint-disable-line
	}return ret;}return lastValue+(lastValue-nextLastValue)*((currentFrame-lastKeyFrame)/0.001);}return this.getValueAtTime(((currentFrame-firstKeyFrame)%cycleDuration+firstKeyFrame)/this.comp.globalData.frameRate,0);// eslint-disable-line
	}function loopIn(type,duration,durationFlag){if(!this.k){return this.pv;}type=type?type.toLowerCase():'';var currentFrame=this.comp.renderedFrame;var keyframes=this.keyframes;var firstKeyFrame=keyframes[0].t;if(currentFrame>=firstKeyFrame){return this.pv;}var cycleDuration;var lastKeyFrame;if(!durationFlag){if(!duration||duration>keyframes.length-1){duration=keyframes.length-1;}lastKeyFrame=keyframes[duration].t;cycleDuration=lastKeyFrame-firstKeyFrame;}else{if(!duration){cycleDuration=Math.max(0,this.elem.data.op-firstKeyFrame);}else{cycleDuration=Math.abs(this.elem.comp.globalData.frameRate*duration);}lastKeyFrame=firstKeyFrame+cycleDuration;}var i;var len;var ret;if(type==='pingpong'){var iterations=Math.floor((firstKeyFrame-currentFrame)/cycleDuration);if(iterations%2===0){return this.getValueAtTime(((firstKeyFrame-currentFrame)%cycleDuration+firstKeyFrame)/this.comp.globalData.frameRate,0);// eslint-disable-line
	}}else if(type==='offset'){var initV=this.getValueAtTime(firstKeyFrame/this.comp.globalData.frameRate,0);var endV=this.getValueAtTime(lastKeyFrame/this.comp.globalData.frameRate,0);var current=this.getValueAtTime((cycleDuration-(firstKeyFrame-currentFrame)%cycleDuration+firstKeyFrame)/this.comp.globalData.frameRate,0);var repeats=Math.floor((firstKeyFrame-currentFrame)/cycleDuration)+1;if(this.pv.length){ret=new Array(initV.length);len=ret.length;for(i=0;i<len;i+=1){ret[i]=current[i]-(endV[i]-initV[i])*repeats;}return ret;}return current-(endV-initV)*repeats;}else if(type==='continue'){var firstValue=this.getValueAtTime(firstKeyFrame/this.comp.globalData.frameRate,0);var nextFirstValue=this.getValueAtTime((firstKeyFrame+0.001)/this.comp.globalData.frameRate,0);if(this.pv.length){ret=new Array(firstValue.length);len=ret.length;for(i=0;i<len;i+=1){ret[i]=firstValue[i]+(firstValue[i]-nextFirstValue[i])*(firstKeyFrame-currentFrame)/0.001;}return ret;}return firstValue+(firstValue-nextFirstValue)*(firstKeyFrame-currentFrame)/0.001;}return this.getValueAtTime((cycleDuration-((firstKeyFrame-currentFrame)%cycleDuration+firstKeyFrame))/this.comp.globalData.frameRate,0);// eslint-disable-line
	}function smooth(width,samples){if(!this.k){return this.pv;}width=(width||0.4)*0.5;samples=Math.floor(samples||5);if(samples<=1){return this.pv;}var currentTime=this.comp.renderedFrame/this.comp.globalData.frameRate;var initFrame=currentTime-width;var endFrame=currentTime+width;var sampleFrequency=samples>1?(endFrame-initFrame)/(samples-1):1;var i=0;var j=0;var value;if(this.pv.length){value=createTypedArray('float32',this.pv.length);}else{value=0;}var sampleValue;while(i<samples){sampleValue=this.getValueAtTime(initFrame+i*sampleFrequency);if(this.pv.length){for(j=0;j<this.pv.length;j+=1){value[j]+=sampleValue[j];}}else{value+=sampleValue;}i+=1;}if(this.pv.length){for(j=0;j<this.pv.length;j+=1){value[j]/=samples;}}else{value/=samples;}return value;}function getTransformValueAtTime(time){if(!this._transformCachingAtTime){this._transformCachingAtTime={v:new Matrix()};}/// /
	var matrix=this._transformCachingAtTime.v;matrix.cloneFromProps(this.pre.props);if(this.appliedTransformations<1){var anchor=this.a.getValueAtTime(time);matrix.translate(-anchor[0]*this.a.mult,-anchor[1]*this.a.mult,anchor[2]*this.a.mult);}if(this.appliedTransformations<2){var scale=this.s.getValueAtTime(time);matrix.scale(scale[0]*this.s.mult,scale[1]*this.s.mult,scale[2]*this.s.mult);}if(this.sk&&this.appliedTransformations<3){var skew=this.sk.getValueAtTime(time);var skewAxis=this.sa.getValueAtTime(time);matrix.skewFromAxis(-skew*this.sk.mult,skewAxis*this.sa.mult);}if(this.r&&this.appliedTransformations<4){var rotation=this.r.getValueAtTime(time);matrix.rotate(-rotation*this.r.mult);}else if(!this.r&&this.appliedTransformations<4){var rotationZ=this.rz.getValueAtTime(time);var rotationY=this.ry.getValueAtTime(time);var rotationX=this.rx.getValueAtTime(time);var orientation=this.or.getValueAtTime(time);matrix.rotateZ(-rotationZ*this.rz.mult).rotateY(rotationY*this.ry.mult).rotateX(rotationX*this.rx.mult).rotateZ(-orientation[2]*this.or.mult).rotateY(orientation[1]*this.or.mult).rotateX(orientation[0]*this.or.mult);}if(this.data.p&&this.data.p.s){var positionX=this.px.getValueAtTime(time);var positionY=this.py.getValueAtTime(time);if(this.data.p.z){var positionZ=this.pz.getValueAtTime(time);matrix.translate(positionX*this.px.mult,positionY*this.py.mult,-positionZ*this.pz.mult);}else{matrix.translate(positionX*this.px.mult,positionY*this.py.mult,0);}}else{var position=this.p.getValueAtTime(time);matrix.translate(position[0]*this.p.mult,position[1]*this.p.mult,-position[2]*this.p.mult);}return matrix;/// /
	}function getTransformStaticValueAtTime(){return this.v.clone(new Matrix());}var getTransformProperty=TransformPropertyFactory.getTransformProperty;TransformPropertyFactory.getTransformProperty=function(elem,data,container){var prop=getTransformProperty(elem,data,container);if(prop.dynamicProperties.length){prop.getValueAtTime=getTransformValueAtTime.bind(prop);}else{prop.getValueAtTime=getTransformStaticValueAtTime.bind(prop);}prop.setGroupProperty=expressionHelpers.setGroupProperty;return prop;};var propertyGetProp=PropertyFactory.getProp;PropertyFactory.getProp=function(elem,data,type,mult,container){var prop=propertyGetProp(elem,data,type,mult,container);// prop.getVelocityAtTime = getVelocityAtTime;
	// prop.loopOut = loopOut;
	// prop.loopIn = loopIn;
	if(prop.kf){prop.getValueAtTime=expressionHelpers.getValueAtTime.bind(prop);}else{prop.getValueAtTime=expressionHelpers.getStaticValueAtTime.bind(prop);}prop.setGroupProperty=expressionHelpers.setGroupProperty;prop.loopOut=loopOut;prop.loopIn=loopIn;prop.smooth=smooth;prop.getVelocityAtTime=expressionHelpers.getVelocityAtTime.bind(prop);prop.getSpeedAtTime=expressionHelpers.getSpeedAtTime.bind(prop);prop.numKeys=data.a===1?data.k.length:0;prop.propertyIndex=data.ix;var value=0;if(type!==0){value=createTypedArray('float32',data.a===1?data.k[0].s.length:data.k.length);}prop._cachingAtTime={lastFrame:initialDefaultFrame,lastIndex:0,value:value};expressionHelpers.searchExpressions(elem,data,prop);if(prop.k){container.addDynamicProperty(prop);}return prop;};function getShapeValueAtTime(frameNum){// For now this caching object is created only when needed instead of creating it when the shape is initialized.
	if(!this._cachingAtTime){this._cachingAtTime={shapeValue:shapePool.clone(this.pv),lastIndex:0,lastTime:initialDefaultFrame};}frameNum*=this.elem.globalData.frameRate;frameNum-=this.offsetTime;if(frameNum!==this._cachingAtTime.lastTime){this._cachingAtTime.lastIndex=this._cachingAtTime.lastTime<frameNum?this._caching.lastIndex:0;this._cachingAtTime.lastTime=frameNum;this.interpolateShape(frameNum,this._cachingAtTime.shapeValue,this._cachingAtTime);}return this._cachingAtTime.shapeValue;}var ShapePropertyConstructorFunction=ShapePropertyFactory.getConstructorFunction();var KeyframedShapePropertyConstructorFunction=ShapePropertyFactory.getKeyframedConstructorFunction();function ShapeExpressions(){}ShapeExpressions.prototype={vertices:function vertices(prop,time){if(this.k){this.getValue();}var shapePath=this.v;if(time!==undefined){shapePath=this.getValueAtTime(time,0);}var i;var len=shapePath._length;var vertices=shapePath[prop];var points=shapePath.v;var arr=createSizedArray(len);for(i=0;i<len;i+=1){if(prop==='i'||prop==='o'){arr[i]=[vertices[i][0]-points[i][0],vertices[i][1]-points[i][1]];}else{arr[i]=[vertices[i][0],vertices[i][1]];}}return arr;},points:function points(time){return this.vertices('v',time);},inTangents:function inTangents(time){return this.vertices('i',time);},outTangents:function outTangents(time){return this.vertices('o',time);},isClosed:function isClosed(){return this.v.c;},pointOnPath:function pointOnPath(perc,time){var shapePath=this.v;if(time!==undefined){shapePath=this.getValueAtTime(time,0);}if(!this._segmentsLength){this._segmentsLength=bez.getSegmentsLength(shapePath);}var segmentsLength=this._segmentsLength;var lengths=segmentsLength.lengths;var lengthPos=segmentsLength.totalLength*perc;var i=0;var len=lengths.length;var accumulatedLength=0;var pt;while(i<len){if(accumulatedLength+lengths[i].addedLength>lengthPos){var initIndex=i;var endIndex=shapePath.c&&i===len-1?0:i+1;var segmentPerc=(lengthPos-accumulatedLength)/lengths[i].addedLength;pt=bez.getPointInSegment(shapePath.v[initIndex],shapePath.v[endIndex],shapePath.o[initIndex],shapePath.i[endIndex],segmentPerc,lengths[i]);break;}else{accumulatedLength+=lengths[i].addedLength;}i+=1;}if(!pt){pt=shapePath.c?[shapePath.v[0][0],shapePath.v[0][1]]:[shapePath.v[shapePath._length-1][0],shapePath.v[shapePath._length-1][1]];}return pt;},vectorOnPath:function vectorOnPath(perc,time,vectorType){// perc doesn't use triple equality because it can be a Number object as well as a primitive.
	if(perc==1){// eslint-disable-line eqeqeq
	perc=this.v.c;}else if(perc==0){// eslint-disable-line eqeqeq
	perc=0.999;}var pt1=this.pointOnPath(perc,time);var pt2=this.pointOnPath(perc+0.001,time);var xLength=pt2[0]-pt1[0];var yLength=pt2[1]-pt1[1];var magnitude=Math.sqrt(Math.pow(xLength,2)+Math.pow(yLength,2));if(magnitude===0){return [0,0];}var unitVector=vectorType==='tangent'?[xLength/magnitude,yLength/magnitude]:[-yLength/magnitude,xLength/magnitude];return unitVector;},tangentOnPath:function tangentOnPath(perc,time){return this.vectorOnPath(perc,time,'tangent');},normalOnPath:function normalOnPath(perc,time){return this.vectorOnPath(perc,time,'normal');},setGroupProperty:expressionHelpers.setGroupProperty,getValueAtTime:expressionHelpers.getStaticValueAtTime};extendPrototype([ShapeExpressions],ShapePropertyConstructorFunction);extendPrototype([ShapeExpressions],KeyframedShapePropertyConstructorFunction);KeyframedShapePropertyConstructorFunction.prototype.getValueAtTime=getShapeValueAtTime;KeyframedShapePropertyConstructorFunction.prototype.initiateExpression=ExpressionManager.initiateExpression;var propertyGetShapeProp=ShapePropertyFactory.getShapeProp;ShapePropertyFactory.getShapeProp=function(elem,data,type,arr,trims){var prop=propertyGetShapeProp(elem,data,type,arr,trims);prop.propertyIndex=data.ix;prop.lock=false;if(type===3){expressionHelpers.searchExpressions(elem,data.pt,prop);}else if(type===4){expressionHelpers.searchExpressions(elem,data.ks,prop);}if(prop.k){elem.addDynamicProperty(prop);}return prop;};}function initialize$1(){addPropertyDecorator();}function addDecorator(){function searchExpressions(){if(this.data.d.x){this.calculateExpression=ExpressionManager.initiateExpression.bind(this)(this.elem,this.data.d,this);this.addEffect(this.getExpressionValue.bind(this));return true;}return null;}TextProperty.prototype.getExpressionValue=function(currentValue,text){var newValue=this.calculateExpression(text);if(currentValue.t!==newValue){var newData={};this.copyData(newData,currentValue);newData.t=newValue.toString();newData.__complete=false;return newData;}return currentValue;};TextProperty.prototype.searchProperty=function(){var isKeyframed=this.searchKeyframes();var hasExpressions=this.searchExpressions();this.kf=isKeyframed||hasExpressions;return this.kf;};TextProperty.prototype.searchExpressions=searchExpressions;}function initialize(){addDecorator();}function SVGComposableEffect(){}SVGComposableEffect.prototype={createMergeNode:function createMergeNode(resultId,ins){var feMerge=createNS('feMerge');feMerge.setAttribute('result',resultId);var feMergeNode;var i;for(i=0;i<ins.length;i+=1){feMergeNode=createNS('feMergeNode');feMergeNode.setAttribute('in',ins[i]);feMerge.appendChild(feMergeNode);feMerge.appendChild(feMergeNode);}return feMerge;}};function SVGTintFilter(filter,filterManager,elem,id,source){this.filterManager=filterManager;var feColorMatrix=createNS('feColorMatrix');feColorMatrix.setAttribute('type','matrix');feColorMatrix.setAttribute('color-interpolation-filters','linearRGB');feColorMatrix.setAttribute('values','0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0');feColorMatrix.setAttribute('result',id+'_tint_1');filter.appendChild(feColorMatrix);feColorMatrix=createNS('feColorMatrix');feColorMatrix.setAttribute('type','matrix');feColorMatrix.setAttribute('color-interpolation-filters','sRGB');feColorMatrix.setAttribute('values','1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');feColorMatrix.setAttribute('result',id+'_tint_2');filter.appendChild(feColorMatrix);this.matrixFilter=feColorMatrix;var feMerge=this.createMergeNode(id,[source,id+'_tint_1',id+'_tint_2']);filter.appendChild(feMerge);}extendPrototype([SVGComposableEffect],SVGTintFilter);SVGTintFilter.prototype.renderFrame=function(forceRender){if(forceRender||this.filterManager._mdf){var colorBlack=this.filterManager.effectElements[0].p.v;var colorWhite=this.filterManager.effectElements[1].p.v;var opacity=this.filterManager.effectElements[2].p.v/100;this.matrixFilter.setAttribute('values',colorWhite[0]-colorBlack[0]+' 0 0 0 '+colorBlack[0]+' '+(colorWhite[1]-colorBlack[1])+' 0 0 0 '+colorBlack[1]+' '+(colorWhite[2]-colorBlack[2])+' 0 0 0 '+colorBlack[2]+' 0 0 0 '+opacity+' 0');}};function SVGFillFilter(filter,filterManager,elem,id){this.filterManager=filterManager;var feColorMatrix=createNS('feColorMatrix');feColorMatrix.setAttribute('type','matrix');feColorMatrix.setAttribute('color-interpolation-filters','sRGB');feColorMatrix.setAttribute('values','1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');feColorMatrix.setAttribute('result',id);filter.appendChild(feColorMatrix);this.matrixFilter=feColorMatrix;}SVGFillFilter.prototype.renderFrame=function(forceRender){if(forceRender||this.filterManager._mdf){var color=this.filterManager.effectElements[2].p.v;var opacity=this.filterManager.effectElements[6].p.v;this.matrixFilter.setAttribute('values','0 0 0 0 '+color[0]+' 0 0 0 0 '+color[1]+' 0 0 0 0 '+color[2]+' 0 0 0 '+opacity+' 0');}};function SVGStrokeEffect(fil,filterManager,elem){this.initialized=false;this.filterManager=filterManager;this.elem=elem;this.paths=[];}SVGStrokeEffect.prototype.initialize=function(){var elemChildren=this.elem.layerElement.children||this.elem.layerElement.childNodes;var path;var groupPath;var i;var len;if(this.filterManager.effectElements[1].p.v===1){len=this.elem.maskManager.masksProperties.length;i=0;}else{i=this.filterManager.effectElements[0].p.v-1;len=i+1;}groupPath=createNS('g');groupPath.setAttribute('fill','none');groupPath.setAttribute('stroke-linecap','round');groupPath.setAttribute('stroke-dashoffset',1);for(i;i<len;i+=1){path=createNS('path');groupPath.appendChild(path);this.paths.push({p:path,m:i});}if(this.filterManager.effectElements[10].p.v===3){var mask=createNS('mask');var id=createElementID();mask.setAttribute('id',id);mask.setAttribute('mask-type','alpha');mask.appendChild(groupPath);this.elem.globalData.defs.appendChild(mask);var g=createNS('g');g.setAttribute('mask','url('+getLocationHref()+'#'+id+')');while(elemChildren[0]){g.appendChild(elemChildren[0]);}this.elem.layerElement.appendChild(g);this.masker=mask;groupPath.setAttribute('stroke','#fff');}else if(this.filterManager.effectElements[10].p.v===1||this.filterManager.effectElements[10].p.v===2){if(this.filterManager.effectElements[10].p.v===2){elemChildren=this.elem.layerElement.children||this.elem.layerElement.childNodes;while(elemChildren.length){this.elem.layerElement.removeChild(elemChildren[0]);}}this.elem.layerElement.appendChild(groupPath);this.elem.layerElement.removeAttribute('mask');groupPath.setAttribute('stroke','#fff');}this.initialized=true;this.pathMasker=groupPath;};SVGStrokeEffect.prototype.renderFrame=function(forceRender){if(!this.initialized){this.initialize();}var i;var len=this.paths.length;var mask;var path;for(i=0;i<len;i+=1){if(this.paths[i].m!==-1){mask=this.elem.maskManager.viewData[this.paths[i].m];path=this.paths[i].p;if(forceRender||this.filterManager._mdf||mask.prop._mdf){path.setAttribute('d',mask.lastPath);}if(forceRender||this.filterManager.effectElements[9].p._mdf||this.filterManager.effectElements[4].p._mdf||this.filterManager.effectElements[7].p._mdf||this.filterManager.effectElements[8].p._mdf||mask.prop._mdf){var dasharrayValue;if(this.filterManager.effectElements[7].p.v!==0||this.filterManager.effectElements[8].p.v!==100){var s=Math.min(this.filterManager.effectElements[7].p.v,this.filterManager.effectElements[8].p.v)*0.01;var e=Math.max(this.filterManager.effectElements[7].p.v,this.filterManager.effectElements[8].p.v)*0.01;var l=path.getTotalLength();dasharrayValue='0 0 0 '+l*s+' ';var lineLength=l*(e-s);var segment=1+this.filterManager.effectElements[4].p.v*2*this.filterManager.effectElements[9].p.v*0.01;var units=Math.floor(lineLength/segment);var j;for(j=0;j<units;j+=1){dasharrayValue+='1 '+this.filterManager.effectElements[4].p.v*2*this.filterManager.effectElements[9].p.v*0.01+' ';}dasharrayValue+='0 '+l*10+' 0 0';}else{dasharrayValue='1 '+this.filterManager.effectElements[4].p.v*2*this.filterManager.effectElements[9].p.v*0.01;}path.setAttribute('stroke-dasharray',dasharrayValue);}}}if(forceRender||this.filterManager.effectElements[4].p._mdf){this.pathMasker.setAttribute('stroke-width',this.filterManager.effectElements[4].p.v*2);}if(forceRender||this.filterManager.effectElements[6].p._mdf){this.pathMasker.setAttribute('opacity',this.filterManager.effectElements[6].p.v);}if(this.filterManager.effectElements[10].p.v===1||this.filterManager.effectElements[10].p.v===2){if(forceRender||this.filterManager.effectElements[3].p._mdf){var color=this.filterManager.effectElements[3].p.v;this.pathMasker.setAttribute('stroke','rgb('+bmFloor(color[0]*255)+','+bmFloor(color[1]*255)+','+bmFloor(color[2]*255)+')');}}};function SVGTritoneFilter(filter,filterManager,elem,id){this.filterManager=filterManager;var feColorMatrix=createNS('feColorMatrix');feColorMatrix.setAttribute('type','matrix');feColorMatrix.setAttribute('color-interpolation-filters','linearRGB');feColorMatrix.setAttribute('values','0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0');filter.appendChild(feColorMatrix);var feComponentTransfer=createNS('feComponentTransfer');feComponentTransfer.setAttribute('color-interpolation-filters','sRGB');feComponentTransfer.setAttribute('result',id);this.matrixFilter=feComponentTransfer;var feFuncR=createNS('feFuncR');feFuncR.setAttribute('type','table');feComponentTransfer.appendChild(feFuncR);this.feFuncR=feFuncR;var feFuncG=createNS('feFuncG');feFuncG.setAttribute('type','table');feComponentTransfer.appendChild(feFuncG);this.feFuncG=feFuncG;var feFuncB=createNS('feFuncB');feFuncB.setAttribute('type','table');feComponentTransfer.appendChild(feFuncB);this.feFuncB=feFuncB;filter.appendChild(feComponentTransfer);}SVGTritoneFilter.prototype.renderFrame=function(forceRender){if(forceRender||this.filterManager._mdf){var color1=this.filterManager.effectElements[0].p.v;var color2=this.filterManager.effectElements[1].p.v;var color3=this.filterManager.effectElements[2].p.v;var tableR=color3[0]+' '+color2[0]+' '+color1[0];var tableG=color3[1]+' '+color2[1]+' '+color1[1];var tableB=color3[2]+' '+color2[2]+' '+color1[2];this.feFuncR.setAttribute('tableValues',tableR);this.feFuncG.setAttribute('tableValues',tableG);this.feFuncB.setAttribute('tableValues',tableB);}};function SVGProLevelsFilter(filter,filterManager,elem,id){this.filterManager=filterManager;var effectElements=this.filterManager.effectElements;var feComponentTransfer=createNS('feComponentTransfer');// Red
	if(effectElements[10].p.k||effectElements[10].p.v!==0||effectElements[11].p.k||effectElements[11].p.v!==1||effectElements[12].p.k||effectElements[12].p.v!==1||effectElements[13].p.k||effectElements[13].p.v!==0||effectElements[14].p.k||effectElements[14].p.v!==1){this.feFuncR=this.createFeFunc('feFuncR',feComponentTransfer);}// Green
	if(effectElements[17].p.k||effectElements[17].p.v!==0||effectElements[18].p.k||effectElements[18].p.v!==1||effectElements[19].p.k||effectElements[19].p.v!==1||effectElements[20].p.k||effectElements[20].p.v!==0||effectElements[21].p.k||effectElements[21].p.v!==1){this.feFuncG=this.createFeFunc('feFuncG',feComponentTransfer);}// Blue
	if(effectElements[24].p.k||effectElements[24].p.v!==0||effectElements[25].p.k||effectElements[25].p.v!==1||effectElements[26].p.k||effectElements[26].p.v!==1||effectElements[27].p.k||effectElements[27].p.v!==0||effectElements[28].p.k||effectElements[28].p.v!==1){this.feFuncB=this.createFeFunc('feFuncB',feComponentTransfer);}// Alpha
	if(effectElements[31].p.k||effectElements[31].p.v!==0||effectElements[32].p.k||effectElements[32].p.v!==1||effectElements[33].p.k||effectElements[33].p.v!==1||effectElements[34].p.k||effectElements[34].p.v!==0||effectElements[35].p.k||effectElements[35].p.v!==1){this.feFuncA=this.createFeFunc('feFuncA',feComponentTransfer);}// RGB
	if(this.feFuncR||this.feFuncG||this.feFuncB||this.feFuncA){feComponentTransfer.setAttribute('color-interpolation-filters','sRGB');filter.appendChild(feComponentTransfer);}if(effectElements[3].p.k||effectElements[3].p.v!==0||effectElements[4].p.k||effectElements[4].p.v!==1||effectElements[5].p.k||effectElements[5].p.v!==1||effectElements[6].p.k||effectElements[6].p.v!==0||effectElements[7].p.k||effectElements[7].p.v!==1){feComponentTransfer=createNS('feComponentTransfer');feComponentTransfer.setAttribute('color-interpolation-filters','sRGB');feComponentTransfer.setAttribute('result',id);filter.appendChild(feComponentTransfer);this.feFuncRComposed=this.createFeFunc('feFuncR',feComponentTransfer);this.feFuncGComposed=this.createFeFunc('feFuncG',feComponentTransfer);this.feFuncBComposed=this.createFeFunc('feFuncB',feComponentTransfer);}}SVGProLevelsFilter.prototype.createFeFunc=function(type,feComponentTransfer){var feFunc=createNS(type);feFunc.setAttribute('type','table');feComponentTransfer.appendChild(feFunc);return feFunc;};SVGProLevelsFilter.prototype.getTableValue=function(inputBlack,inputWhite,gamma,outputBlack,outputWhite){var cnt=0;var segments=256;var perc;var min=Math.min(inputBlack,inputWhite);var max=Math.max(inputBlack,inputWhite);var table=Array.call(null,{length:segments});var colorValue;var pos=0;var outputDelta=outputWhite-outputBlack;var inputDelta=inputWhite-inputBlack;while(cnt<=256){perc=cnt/256;if(perc<=min){colorValue=inputDelta<0?outputWhite:outputBlack;}else if(perc>=max){colorValue=inputDelta<0?outputBlack:outputWhite;}else{colorValue=outputBlack+outputDelta*Math.pow((perc-inputBlack)/inputDelta,1/gamma);}table[pos]=colorValue;pos+=1;cnt+=256/(segments-1);}return table.join(' ');};SVGProLevelsFilter.prototype.renderFrame=function(forceRender){if(forceRender||this.filterManager._mdf){var val;var effectElements=this.filterManager.effectElements;if(this.feFuncRComposed&&(forceRender||effectElements[3].p._mdf||effectElements[4].p._mdf||effectElements[5].p._mdf||effectElements[6].p._mdf||effectElements[7].p._mdf)){val=this.getTableValue(effectElements[3].p.v,effectElements[4].p.v,effectElements[5].p.v,effectElements[6].p.v,effectElements[7].p.v);this.feFuncRComposed.setAttribute('tableValues',val);this.feFuncGComposed.setAttribute('tableValues',val);this.feFuncBComposed.setAttribute('tableValues',val);}if(this.feFuncR&&(forceRender||effectElements[10].p._mdf||effectElements[11].p._mdf||effectElements[12].p._mdf||effectElements[13].p._mdf||effectElements[14].p._mdf)){val=this.getTableValue(effectElements[10].p.v,effectElements[11].p.v,effectElements[12].p.v,effectElements[13].p.v,effectElements[14].p.v);this.feFuncR.setAttribute('tableValues',val);}if(this.feFuncG&&(forceRender||effectElements[17].p._mdf||effectElements[18].p._mdf||effectElements[19].p._mdf||effectElements[20].p._mdf||effectElements[21].p._mdf)){val=this.getTableValue(effectElements[17].p.v,effectElements[18].p.v,effectElements[19].p.v,effectElements[20].p.v,effectElements[21].p.v);this.feFuncG.setAttribute('tableValues',val);}if(this.feFuncB&&(forceRender||effectElements[24].p._mdf||effectElements[25].p._mdf||effectElements[26].p._mdf||effectElements[27].p._mdf||effectElements[28].p._mdf)){val=this.getTableValue(effectElements[24].p.v,effectElements[25].p.v,effectElements[26].p.v,effectElements[27].p.v,effectElements[28].p.v);this.feFuncB.setAttribute('tableValues',val);}if(this.feFuncA&&(forceRender||effectElements[31].p._mdf||effectElements[32].p._mdf||effectElements[33].p._mdf||effectElements[34].p._mdf||effectElements[35].p._mdf)){val=this.getTableValue(effectElements[31].p.v,effectElements[32].p.v,effectElements[33].p.v,effectElements[34].p.v,effectElements[35].p.v);this.feFuncA.setAttribute('tableValues',val);}}};function SVGDropShadowEffect(filter,filterManager,elem,id,source){var globalFilterSize=filterManager.container.globalData.renderConfig.filterSize;var filterSize=filterManager.data.fs||globalFilterSize;filter.setAttribute('x',filterSize.x||globalFilterSize.x);filter.setAttribute('y',filterSize.y||globalFilterSize.y);filter.setAttribute('width',filterSize.width||globalFilterSize.width);filter.setAttribute('height',filterSize.height||globalFilterSize.height);this.filterManager=filterManager;var feGaussianBlur=createNS('feGaussianBlur');feGaussianBlur.setAttribute('in','SourceAlpha');feGaussianBlur.setAttribute('result',id+'_drop_shadow_1');feGaussianBlur.setAttribute('stdDeviation','0');this.feGaussianBlur=feGaussianBlur;filter.appendChild(feGaussianBlur);var feOffset=createNS('feOffset');feOffset.setAttribute('dx','25');feOffset.setAttribute('dy','0');feOffset.setAttribute('in',id+'_drop_shadow_1');feOffset.setAttribute('result',id+'_drop_shadow_2');this.feOffset=feOffset;filter.appendChild(feOffset);var feFlood=createNS('feFlood');feFlood.setAttribute('flood-color','#00ff00');feFlood.setAttribute('flood-opacity','1');feFlood.setAttribute('result',id+'_drop_shadow_3');this.feFlood=feFlood;filter.appendChild(feFlood);var feComposite=createNS('feComposite');feComposite.setAttribute('in',id+'_drop_shadow_3');feComposite.setAttribute('in2',id+'_drop_shadow_2');feComposite.setAttribute('operator','in');feComposite.setAttribute('result',id+'_drop_shadow_4');filter.appendChild(feComposite);var feMerge=this.createMergeNode(id,[id+'_drop_shadow_4',source]);filter.appendChild(feMerge);//
	}extendPrototype([SVGComposableEffect],SVGDropShadowEffect);SVGDropShadowEffect.prototype.renderFrame=function(forceRender){if(forceRender||this.filterManager._mdf){if(forceRender||this.filterManager.effectElements[4].p._mdf){this.feGaussianBlur.setAttribute('stdDeviation',this.filterManager.effectElements[4].p.v/4);}if(forceRender||this.filterManager.effectElements[0].p._mdf){var col=this.filterManager.effectElements[0].p.v;this.feFlood.setAttribute('flood-color',rgbToHex(Math.round(col[0]*255),Math.round(col[1]*255),Math.round(col[2]*255)));}if(forceRender||this.filterManager.effectElements[1].p._mdf){this.feFlood.setAttribute('flood-opacity',this.filterManager.effectElements[1].p.v/255);}if(forceRender||this.filterManager.effectElements[2].p._mdf||this.filterManager.effectElements[3].p._mdf){var distance=this.filterManager.effectElements[3].p.v;var angle=(this.filterManager.effectElements[2].p.v-90)*degToRads;var x=distance*Math.cos(angle);var y=distance*Math.sin(angle);this.feOffset.setAttribute('dx',x);this.feOffset.setAttribute('dy',y);}}};var _svgMatteSymbols=[];function SVGMatte3Effect(filterElem,filterManager,elem){this.initialized=false;this.filterManager=filterManager;this.filterElem=filterElem;this.elem=elem;elem.matteElement=createNS('g');elem.matteElement.appendChild(elem.layerElement);elem.matteElement.appendChild(elem.transformedElement);elem.baseElement=elem.matteElement;}SVGMatte3Effect.prototype.findSymbol=function(mask){var i=0;var len=_svgMatteSymbols.length;while(i<len){if(_svgMatteSymbols[i]===mask){return _svgMatteSymbols[i];}i+=1;}return null;};SVGMatte3Effect.prototype.replaceInParent=function(mask,symbolId){var parentNode=mask.layerElement.parentNode;if(!parentNode){return;}var children=parentNode.children;var i=0;var len=children.length;while(i<len){if(children[i]===mask.layerElement){break;}i+=1;}var nextChild;if(i<=len-2){nextChild=children[i+1];}var useElem=createNS('use');useElem.setAttribute('href','#'+symbolId);if(nextChild){parentNode.insertBefore(useElem,nextChild);}else{parentNode.appendChild(useElem);}};SVGMatte3Effect.prototype.setElementAsMask=function(elem,mask){if(!this.findSymbol(mask)){var symbolId=createElementID();var masker=createNS('mask');masker.setAttribute('id',mask.layerId);masker.setAttribute('mask-type','alpha');_svgMatteSymbols.push(mask);var defs=elem.globalData.defs;defs.appendChild(masker);var symbol=createNS('symbol');symbol.setAttribute('id',symbolId);this.replaceInParent(mask,symbolId);symbol.appendChild(mask.layerElement);defs.appendChild(symbol);var useElem=createNS('use');useElem.setAttribute('href','#'+symbolId);masker.appendChild(useElem);mask.data.hd=false;mask.show();}elem.setMatte(mask.layerId);};SVGMatte3Effect.prototype.initialize=function(){var ind=this.filterManager.effectElements[0].p.v;var elements=this.elem.comp.elements;var i=0;var len=elements.length;while(i<len){if(elements[i]&&elements[i].data.ind===ind){this.setElementAsMask(this.elem,elements[i]);}i+=1;}this.initialized=true;};SVGMatte3Effect.prototype.renderFrame=function(){if(!this.initialized){this.initialize();}};function SVGGaussianBlurEffect(filter,filterManager,elem,id){// Outset the filter region by 100% on all sides to accommodate blur expansion.
	filter.setAttribute('x','-100%');filter.setAttribute('y','-100%');filter.setAttribute('width','300%');filter.setAttribute('height','300%');this.filterManager=filterManager;var feGaussianBlur=createNS('feGaussianBlur');feGaussianBlur.setAttribute('result',id);filter.appendChild(feGaussianBlur);this.feGaussianBlur=feGaussianBlur;}SVGGaussianBlurEffect.prototype.renderFrame=function(forceRender){if(forceRender||this.filterManager._mdf){// Empirical value, matching AE's blur appearance.
	var kBlurrinessToSigma=0.3;var sigma=this.filterManager.effectElements[0].p.v*kBlurrinessToSigma;// Dimensions mapping:
	//
	//   1 -> horizontal & vertical
	//   2 -> horizontal only
	//   3 -> vertical only
	//
	var dimensions=this.filterManager.effectElements[1].p.v;var sigmaX=dimensions==3?0:sigma;// eslint-disable-line eqeqeq
	var sigmaY=dimensions==2?0:sigma;// eslint-disable-line eqeqeq
	this.feGaussianBlur.setAttribute('stdDeviation',sigmaX+' '+sigmaY);// Repeat edges mapping:
	//
	//   0 -> off -> duplicate
	//   1 -> on  -> wrap
	var edgeMode=this.filterManager.effectElements[2].p.v==1?'wrap':'duplicate';// eslint-disable-line eqeqeq
	this.feGaussianBlur.setAttribute('edgeMode',edgeMode);}};registerRenderer('canvas',CanvasRenderer);registerRenderer('html',HybridRenderer);registerRenderer('svg',SVGRenderer);// Registering shape modifiers
	ShapeModifiers.registerModifier('tm',TrimModifier);ShapeModifiers.registerModifier('pb',PuckerAndBloatModifier);ShapeModifiers.registerModifier('rp',RepeaterModifier);ShapeModifiers.registerModifier('rd',RoundCornersModifier);// Registering expression plugin
	setExpressionsPlugin(Expressions);initialize$1();initialize();// Registering svg effects
	registerEffect(20,SVGTintFilter,true);registerEffect(21,SVGFillFilter,true);registerEffect(22,SVGStrokeEffect,false);registerEffect(23,SVGTritoneFilter,true);registerEffect(24,SVGProLevelsFilter,true);registerEffect(25,SVGDropShadowEffect,true);registerEffect(28,SVGMatte3Effect,false);registerEffect(29,SVGGaussianBlurEffect,true);return lottie;});
	});

	var ListPopup = /*#__PURE__*/function () {
	  function ListPopup() {
	    babelHelpers.classCallCheck(this, ListPopup);
	  }

	  babelHelpers.createClass(ListPopup, null, [{
	    key: "getListPopup",
	    value: function getListPopup(params) {
	      var _this = this;

	      var likeId = params.likeId;
	      var likeInstance = RatingLike$1.getInstance(likeId);
	      var target = params.target;
	      var reaction = params.reaction;
	      var nodeId = params.nodeId;

	      if (this.popupLikeId === likeId) {
	        return false;
	      }

	      if (likeInstance.popupContentPage != 1) {
	        return;
	      }

	      this.List(likeId, 1, reaction, true);
	      likeInstance.popupTimeoutIdShow = setTimeout(function () {
	        _this.getListPopupShow({
	          likeId: likeId,
	          reaction: reaction,
	          target: target,
	          nodeId: nodeId
	        });
	      }, 100);
	    }
	  }, {
	    key: "getListPopupShow",
	    value: function getListPopupShow(params) {
	      var _this2 = this;

	      var likeId = params.likeId;
	      var likeInstance = RatingLike$1.getInstance(likeId);
	      var target = params.target;
	      var reaction = params.reaction;
	      var nodeId = params.nodeId;
	      likeInstance.resultPopupAnimation = true;
	      setTimeout(function () {
	        _this2.getListPopupAnimation({
	          likeId: likeId
	        });
	      }, 500);

	      if (likeInstance.mouseInShowPopupNode[reaction]) {
	        this.OpenWindow(likeId, null, target, nodeId);
	      }
	    }
	  }, {
	    key: "getListPopupAnimation",
	    value: function getListPopupAnimation(params) {
	      var likeId = params.likeId;
	      var likeInstance = RatingLike$1.getInstance(likeId);
	      likeInstance.resultPopupAnimation = false;
	    }
	  }, {
	    key: "OpenWindow",
	    value: function OpenWindow(likeId, clickEvent, target, targetId) {
	      var _this3 = this;

	      var likeInstance = RatingLike$1.getInstance(likeId);

	      if (Number(likeInstance.countText.innerHTML) === 0) {
	        return;
	      }

	      var bindNode = likeInstance.template === 'standart' ? likeInstance.count : likeInstance.version === 2 ? main_core.Type.isDomNode(target) ? target : main_core.Type.isStringFilled(targetId) && document.getElementById(targetId) ? document.getElementById(targetId) : null : likeInstance.box;

	      if (!main_core.Type.isDomNode(bindNode)) {
	        return;
	      }

	      if (likeInstance.popup == null) {
	        var globalZIndex = this.getGlobalIndex(bindNode);
	        var popupClassNameList = [];

	        if (likeInstance.topPanel) {
	          popupClassNameList.push('bx-ilike-wrap-block-react-wrap');
	        }

	        if (RatingManager.mobile) {
	          popupClassNameList.push('bx-ilike-mobile-wrap');
	        }

	        likeInstance.popup = new main_popup.Popup({
	          id: "ilike-popup-".concat(likeId),
	          bindElement: bindNode,
	          lightShadow: true,
	          offsetTop: 0,
	          offsetLeft: !main_core.Type.isUndefined(clickEvent) && !main_core.Type.isNull(clickEvent) && !main_core.Type.isUndefined(clickEvent.offsetX) ? clickEvent.offsetX - 100 : likeInstance.version == 2 ? -30 : 5,
	          autoHide: true,
	          closeByEsc: true,
	          zIndexAbsolute: globalZIndex > 1000 ? globalZIndex + 1 : 1000,
	          bindOptions: {
	            position: 'top'
	          },
	          animation: 'fading-slide',
	          events: {
	            onPopupClose: function onPopupClose() {
	              _this3.popupLikeId = null;
	            },
	            onPopupDestroy: function onPopupDestroy() {}
	          },
	          content: document.getElementById("bx-ilike-popup-cont-".concat(likeId)),
	          className: popupClassNameList.join(' ')
	        });

	        if (!likeInstance.topPanel && !RatingManager.mobile) {
	          likeInstance.popup.setAngle({});
	          document.getElementById("ilike-popup-".concat(likeId)).addEventListener('mouseout', function () {
	            clearTimeout(likeInstance.popupTimeout);
	            likeInstance.popupTimeout = setTimeout(function () {
	              likeInstance.popup.close();
	            }, 1000);
	          });
	          document.getElementById("ilike-popup-".concat(likeId)).addEventListener('mouseover', function () {
	            clearTimeout(likeInstance.popupTimeout);
	          });
	        }
	      } else {
	        if (!main_core.Type.isUndefined(clickEvent) && !main_core.Type.isNull(clickEvent) && !main_core.Type.isUndefined(clickEvent.offsetX)) {
	          likeInstance.popup.offsetLeft = clickEvent.offsetX - 100;
	        }

	        likeInstance.popup.setBindElement(bindNode);
	      }

	      if (this.popupLikeId !== likeId) {
	        var popupLikeInstance = RatingLike$1.getInstance(this.popupLikeId);

	        if (popupLikeInstance) {
	          popupLikeInstance.popup.close();
	        }
	      }

	      this.popupLikeId = likeId;
	      likeInstance.popup.show();
	      this.AdjustWindow(likeId);
	    }
	  }, {
	    key: "getGlobalIndex",
	    value: function getGlobalIndex(element) {
	      var index = 0;
	      var propertyValue = '';

	      do {
	        propertyValue = main_core.Dom.style(element, 'z-index');

	        if (propertyValue !== 'auto') {
	          index = !Number.isNaN(parseInt(propertyValue)) ? index : 0;
	        }

	        element = element.offsetParent;
	      } while (element && element.tagName !== 'BODY');

	      return index;
	    }
	  }, {
	    key: "removeOnClose",
	    value: function removeOnClose() {
	      main_core_events.EventEmitter.unsubscribe(BX.SidePanel.Instance.getTopSlider().getWindow(), 'SidePanel.Slider:onClose', this.removeOnCloseHandler);
	      var popupLikeInstance = RatingLike$1.getInstance(this.popupLikeId);

	      if (popupLikeInstance) {
	        popupLikeInstance.popup.close();
	      }
	    }
	  }, {
	    key: "AdjustWindow",
	    value: function AdjustWindow(likeId) {
	      var likeInstance = RatingLike$1.getInstance(likeId);

	      if (!likeInstance.popup) {
	        return;
	      }

	      likeInstance.popup.bindOptions.forceBindPosition = true;
	      likeInstance.popup.adjustPosition();
	      likeInstance.popup.bindOptions.forceBindPosition = false;
	    }
	  }, {
	    key: "PopupScroll",
	    value: function PopupScroll(likeId) {
	      var _this4 = this;

	      var likeInstance = RatingLike$1.getInstance(likeId);
	      var contentContainerNodeList = likeInstance.popupContent.querySelectorAll('.bx-ilike-popup-content'); // reactions

	      if (contentContainerNodeList.length <= 0) {
	        contentContainerNodeList = [likeInstance.popupContent];
	      }

	      contentContainerNodeList.forEach(function (contentContainerNode) {
	        contentContainerNode.addEventListener('scroll', function (e) {
	          if (e.target.scrollTop <= (e.target.scrollHeight - e.target.offsetHeight) / 1.5) {
	            return;
	          }

	          _this4.List(likeId, null, likeInstance.version == 2 ? RatingRender.popupCurrentReaction : false);

	          main_core.Event.unbindAll(e.target);
	        });
	      });
	    }
	  }, {
	    key: "List",
	    value: function List(likeId, page, reaction, clear) {
	      var _this5 = this;

	      var likeInstance = RatingLike$1.getInstance(likeId);

	      if (Number(likeInstance.countText.innerHTML) === 0) {
	        return false;
	      }

	      reaction = main_core.Type.isStringFilled(reaction) ? reaction : '';

	      if (main_core.Type.isNull(page)) {
	        page = likeInstance.version === 2 ? !main_core.Type.isUndefined(RatingRender.popupPagesList[reaction]) ? RatingRender.popupPagesList[reaction] : 1 : likeInstance.popupContentPage;
	      }

	      if (clear && Number(page) === 1 && likeInstance.version === 2) {
	        RatingRender.clearPopupContent({
	          likeId: likeId
	        });
	      }

	      if (likeInstance.listXHR) {
	        likeInstance.listXHR.abort();
	      }

	      main_core.ajax.runAction('main.rating.list', {
	        data: {
	          params: {
	            RATING_VOTE_TYPE_ID: likeInstance.entityTypeId,
	            RATING_VOTE_ENTITY_ID: likeInstance.entityId,
	            RATING_VOTE_LIST_PAGE: page,
	            RATING_VOTE_REACTION: reaction === 'all' ? '' : reaction,
	            PATH_TO_USER_PROFILE: likeInstance.pathToUserProfile
	          }
	        },
	        onrequeststart: function onrequeststart(xhr) {
	          likeInstance.listXHR = xhr;
	        }
	      }).then(function (result) {
	        _this5.onListSuccess(result.data, {
	          likeId: likeId,
	          reaction: reaction,
	          page: page,
	          clear: clear
	        });
	      }, function () {});
	      return false;
	    }
	  }, {
	    key: "onListSuccess",
	    value: function onListSuccess(data, params) {
	      if (!data) {
	        return false;
	      }

	      var likeInstance = RatingLike$1.getInstance(params.likeId);
	      likeInstance.countText.innerHTML = data.items_all;

	      if (Number(data.items_page) === 0) {
	        if (Number(data.list_page) === 1) {
	          likeInstance.popup.close();
	        }

	        return false;
	      }

	      if (likeInstance.version === 2) {
	        RatingRender.buildPopupContent({
	          likeId: params.likeId,
	          reaction: params.reaction,
	          rating: likeInstance,
	          page: params.page,
	          data: data,
	          clear: params.clear
	        });
	        likeInstance.topPanel.setAttribute('data-popup', 'Y');
	      } else {
	        RatingRender.buildPopupContentNoReactions({
	          rating: likeInstance,
	          page: params.page,
	          data: data
	        });
	      }

	      this.AdjustWindow(params.likeId);
	      this.PopupScroll(params.likeId);
	    }
	  }, {
	    key: "onResultClick",
	    value: function onResultClick(params) {
	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : false;
	      var clickEvent = !main_core.Type.isUndefined(params.event) ? params.event : false;
	      var reaction = main_core.Type.isStringFilled(params.reaction) ? params.reaction : '';
	      var likeInstance = RatingLike$1.getInstance(likeId);

	      if (likeInstance.resultPopupAnimation) {
	        return;
	      }

	      if (likeInstance.popup && likeInstance.popup.isShown()) {
	        likeInstance.popup.close();
	      } else {
	        clearTimeout(likeInstance.popupTimeoutIdList);
	        clearTimeout(likeInstance.popupTimeoutIdShow);

	        if (likeInstance.popupContentPage == 1 && (likeInstance.topPanel.getAttribute('data-popup') !== 'Y' || likeInstance.popupCurrentReaction != reaction)) {
	          this.List(likeId, 1, reaction, true);
	        }

	        this.OpenWindow(likeId, clickEvent.currentTarget === likeInstance.count ? null : clickEvent, clickEvent.currentTarget, clickEvent.currentTarget.id);
	      }
	    }
	  }, {
	    key: "onResultMouseEnter",
	    value: function onResultMouseEnter(params) {
	      var _this6 = this;

	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : false;
	      var mouseEnterEvent = !main_core.Type.isUndefined(params.event) ? params.event : null;
	      var reaction = main_core.Type.isStringFilled(params.reaction) ? params.reaction : '';
	      var nodeId = mouseEnterEvent && main_core.Type.isStringFilled(mouseEnterEvent.currentTarget.id) ? mouseEnterEvent.currentTarget.id : '';
	      var likeInstance = RatingLike$1.getInstance(likeId);
	      likeInstance.mouseInShowPopupNode[reaction] = true;
	      clearTimeout(likeInstance.popupTimeoutIdList);
	      clearTimeout(likeInstance.popupTimeoutIdShow);
	      likeInstance.popupTimeoutIdList = setTimeout(function () {
	        _this6.getListPopup({
	          likeId: likeId,
	          target: mouseEnterEvent.currentTarget,
	          reaction: reaction,
	          nodeId: nodeId
	        });
	      }, 300);
	    }
	  }, {
	    key: "onResultMouseLeave",
	    value: function onResultMouseLeave(params) {
	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : false;
	      var reaction = main_core.Type.isStringFilled(params.reaction) ? params.reaction : '';
	      var likeInstance = RatingLike$1.getInstance(likeId);
	      likeInstance.mouseInShowPopupNode[reaction] = false;
	      likeInstance.resultPopupAnimation = false;
	    }
	  }]);
	  return ListPopup;
	}();
	babelHelpers.defineProperty(ListPopup, "popupLikeId", null);
	babelHelpers.defineProperty(ListPopup, "removeOnCloseHandler", ListPopup.removeOnClose.bind(ListPopup));

	var v = "5.9.1";
	var fr = 25;
	var ip = 0;
	var op = 30;
	var w = 40;
	var h = 40;
	var nm = "em_01";
	var ddd = 0;
	var assets = [];
	var layers = [{
	  ddd: 0,
	  ind: 1,
	  ty: 4,
	  nm: "Layer 1/Emotions Outlines 2",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.833],
	          y: [0.702]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 0,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.803]
	        },
	        o: {
	          x: [0.167],
	          y: [0.116]
	        },
	        t: 1,
	        s: [-0.443]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.826]
	        },
	        o: {
	          x: [0.167],
	          y: [0.144]
	        },
	        t: 2,
	        s: [-1.586]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.84]
	        },
	        o: {
	          x: [0.167],
	          y: [0.16]
	        },
	        t: 3,
	        s: [-3.149]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.856]
	        },
	        o: {
	          x: [0.167],
	          y: [0.174]
	        },
	        t: 4,
	        s: [-4.851]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.884]
	        },
	        o: {
	          x: [0.167],
	          y: [0.197]
	        },
	        t: 5,
	        s: [-6.414]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.942]
	        },
	        o: {
	          x: [0.167],
	          y: [0.298]
	        },
	        t: 6,
	        s: [-7.557]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.457]
	        },
	        o: {
	          x: [0.167],
	          y: [-0.196]
	        },
	        t: 7,
	        s: [-8]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.749]
	        },
	        o: {
	          x: [0.167],
	          y: [0.098]
	        },
	        t: 8,
	        s: [-7.868]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.783]
	        },
	        o: {
	          x: [0.167],
	          y: [0.125]
	        },
	        t: 9,
	        s: [-7.139]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.8]
	        },
	        o: {
	          x: [0.167],
	          y: [0.135]
	        },
	        t: 10,
	        s: [-5.67]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.835]
	        },
	        o: {
	          x: [0.167],
	          y: [0.143]
	        },
	        t: 11,
	        s: [-3.305]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.863]
	        },
	        o: {
	          x: [0.167],
	          y: [0.169]
	        },
	        t: 12,
	        s: [-0.008]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.872]
	        },
	        o: {
	          x: [0.167],
	          y: [0.212]
	        },
	        t: 13,
	        s: [3.205]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.923]
	        },
	        o: {
	          x: [0.167],
	          y: [0.239]
	        },
	        t: 14,
	        s: [5.294]
	      }, {
	        i: {
	          x: [0.833],
	          y: [-0.288]
	        },
	        o: {
	          x: [0.167],
	          y: [-1.045]
	        },
	        t: 15,
	        s: [6.409]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.779]
	        },
	        o: {
	          x: [0.167],
	          y: [0.089]
	        },
	        t: 16,
	        s: [6.327]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.82]
	        },
	        o: {
	          x: [0.167],
	          y: [0.134]
	        },
	        t: 17,
	        s: [5.136]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.884]
	        },
	        o: {
	          x: [0.167],
	          y: [0.155]
	        },
	        t: 18,
	        s: [3.172]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.87]
	        },
	        o: {
	          x: [0.167],
	          y: [0.293]
	        },
	        t: 19,
	        s: [0.902]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.865]
	        },
	        o: {
	          x: [0.167],
	          y: [0.231]
	        },
	        t: 20,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.897]
	        },
	        o: {
	          x: [0.167],
	          y: [0.218]
	        },
	        t: 21,
	        s: [-0.509]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1.079]
	        },
	        o: {
	          x: [0.167],
	          y: [0.432]
	        },
	        t: 22,
	        s: [-0.824]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.745]
	        },
	        o: {
	          x: [0.167],
	          y: [0.041]
	        },
	        t: 23,
	        s: [-0.899]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.816]
	        },
	        o: {
	          x: [0.167],
	          y: [0.124]
	        },
	        t: 24,
	        s: [-0.752]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.841]
	        },
	        o: {
	          x: [0.167],
	          y: [0.153]
	        },
	        t: 25,
	        s: [-0.451]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.86]
	        },
	        o: {
	          x: [0.167],
	          y: [0.175]
	        },
	        t: 26,
	        s: [-0.089]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.886]
	        },
	        o: {
	          x: [0.167],
	          y: [0.206]
	        },
	        t: 27,
	        s: [0.241]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.976]
	        },
	        o: {
	          x: [0.167],
	          y: [0.311]
	        },
	        t: 28,
	        s: [0.465]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.681]
	        },
	        o: {
	          x: [0.167],
	          y: [-0.035]
	        },
	        t: 29,
	        s: [0.547]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.807]
	        },
	        o: {
	          x: [0.167],
	          y: [0.113]
	        },
	        t: 30,
	        s: [0.489]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.147]
	        },
	        t: 31,
	        s: [0.325]
	      }, {
	        t: 32,
	        s: [0.109]
	      }],
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.833,
	          y: 0.706
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 0,
	        s: [10.908, 24.986, 0],
	        to: [0, -0.008, 0],
	        ti: [0, 0.029, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.802
	        },
	        o: {
	          x: 0.167,
	          y: 0.116
	        },
	        t: 1,
	        s: [10.908, 24.936, 0],
	        to: [0, -0.029, 0],
	        ti: [0, 0.05, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.813
	        },
	        o: {
	          x: 0.167,
	          y: 0.144
	        },
	        t: 2,
	        s: [10.908, 24.81, 0],
	        to: [0, -0.05, 0],
	        ti: [0, 0.065, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.821
	        },
	        o: {
	          x: 0.167,
	          y: 0.15
	        },
	        t: 3,
	        s: [10.908, 24.636, 0],
	        to: [0, -0.065, 0],
	        ti: [0, 0.078, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.826
	        },
	        o: {
	          x: 0.167,
	          y: 0.156
	        },
	        t: 4,
	        s: [10.908, 24.419, 0],
	        to: [0, -0.078, 0],
	        ti: [0, 0.087, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.828
	        },
	        o: {
	          x: 0.167,
	          y: 0.16
	        },
	        t: 5,
	        s: [10.908, 24.17, 0],
	        to: [0, -0.087, 0],
	        ti: [0, 0.093, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.829
	        },
	        o: {
	          x: 0.167,
	          y: 0.162
	        },
	        t: 6,
	        s: [10.908, 23.9, 0],
	        to: [0, -0.093, 0],
	        ti: [0, 0.098, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.834
	        },
	        o: {
	          x: 0.167,
	          y: 0.163
	        },
	        t: 7,
	        s: [10.908, 23.614, 0],
	        to: [0, -0.098, 0],
	        ti: [0, 0.099, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.839
	        },
	        o: {
	          x: 0.167,
	          y: 0.168
	        },
	        t: 8,
	        s: [10.908, 23.314, 0],
	        to: [0, -0.099, 0],
	        ti: [0, 0.095, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.865
	        },
	        o: {
	          x: 0.167,
	          y: 0.173
	        },
	        t: 9,
	        s: [10.908, 23.019, 0],
	        to: [0, -0.095, 0],
	        ti: [0, 0.018, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.781
	        },
	        o: {
	          x: 0.167,
	          y: 0.218
	        },
	        t: 10,
	        s: [10.908, 22.745, 0],
	        to: [0, -0.018, 0],
	        ti: [0, -0.074, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.795
	        },
	        o: {
	          x: 0.167,
	          y: 0.134
	        },
	        t: 11,
	        s: [10.908, 22.91, 0],
	        to: [0, 0.074, 0],
	        ti: [0, -0.113, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.807
	        },
	        o: {
	          x: 0.167,
	          y: 0.14
	        },
	        t: 12,
	        s: [10.908, 23.186, 0],
	        to: [0, 0.113, 0],
	        ti: [0, -0.156, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.781
	        },
	        o: {
	          x: 0.167,
	          y: 0.147
	        },
	        t: 13,
	        s: [10.908, 23.589, 0],
	        to: [0, 0.156, 0],
	        ti: [0, -0.233, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.866
	        },
	        o: {
	          x: 0.167,
	          y: 0.134
	        },
	        t: 14,
	        s: [10.908, 24.12, 0],
	        to: [0, 0.233, 0],
	        ti: [0, -0.232, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.865
	        },
	        o: {
	          x: 0.167,
	          y: 0.22
	        },
	        t: 15,
	        s: [10.908, 24.986, 0],
	        to: [0, 0.232, 0],
	        ti: [0, -0.142, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.895
	        },
	        o: {
	          x: 0.167,
	          y: 0.218
	        },
	        t: 16,
	        s: [10.908, 25.513, 0],
	        to: [0, 0.142, 0],
	        ti: [0, -0.067, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.766
	        },
	        o: {
	          x: 0.167,
	          y: 0.407
	        },
	        t: 17,
	        s: [10.908, 25.839, 0],
	        to: [0, 0.067, 0],
	        ti: [0, 0.012, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.745
	        },
	        o: {
	          x: 0.167,
	          y: 0.13
	        },
	        t: 18,
	        s: [10.908, 25.917, 0],
	        to: [0, -0.012, 0],
	        ti: [0, 0.077, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.816
	        },
	        o: {
	          x: 0.167,
	          y: 0.124
	        },
	        t: 19,
	        s: [10.908, 25.765, 0],
	        to: [0, -0.077, 0],
	        ti: [0, 0.114, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.841
	        },
	        o: {
	          x: 0.167,
	          y: 0.153
	        },
	        t: 20,
	        s: [10.908, 25.453, 0],
	        to: [0, -0.114, 0],
	        ti: [0, 0.119, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.86
	        },
	        o: {
	          x: 0.167,
	          y: 0.175
	        },
	        t: 21,
	        s: [10.908, 25.078, 0],
	        to: [0, -0.119, 0],
	        ti: [0, 0.096, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.886
	        },
	        o: {
	          x: 0.167,
	          y: 0.206
	        },
	        t: 22,
	        s: [10.908, 24.737, 0],
	        to: [0, -0.096, 0],
	        ti: [0, 0.053, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.857
	        },
	        o: {
	          x: 0.167,
	          y: 0.311
	        },
	        t: 23,
	        s: [10.908, 24.504, 0],
	        to: [0, -0.053, 0],
	        ti: [0, 0.004, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.684
	        },
	        o: {
	          x: 0.167,
	          y: 0.2
	        },
	        t: 24,
	        s: [10.908, 24.419, 0],
	        to: [0, -0.004, 0],
	        ti: [0, -0.038, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.807
	        },
	        o: {
	          x: 0.167,
	          y: 0.113
	        },
	        t: 25,
	        s: [10.908, 24.479, 0],
	        to: [0, 0.038, 0],
	        ti: [0, -0.066, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.836
	        },
	        o: {
	          x: 0.167,
	          y: 0.147
	        },
	        t: 26,
	        s: [10.908, 24.649, 0],
	        to: [0, 0.066, 0],
	        ti: [0, -0.073, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.855
	        },
	        o: {
	          x: 0.167,
	          y: 0.169
	        },
	        t: 27,
	        s: [10.908, 24.873, 0],
	        to: [0, 0.073, 0],
	        ti: [0, -0.063, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.878
	        },
	        o: {
	          x: 0.167,
	          y: 0.196
	        },
	        t: 28,
	        s: [10.908, 25.09, 0],
	        to: [0, 0.063, 0],
	        ti: [0, -0.039, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.89
	        },
	        o: {
	          x: 0.167,
	          y: 0.262
	        },
	        t: 29,
	        s: [10.908, 25.251, 0],
	        to: [0, 0.039, 0],
	        ti: [0, -0.01, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.615
	        },
	        o: {
	          x: 0.167,
	          y: 0.336
	        },
	        t: 30,
	        s: [10.908, 25.326, 0],
	        to: [0, 0.01, 0],
	        ti: [0, 0.018, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.106
	        },
	        t: 31,
	        s: [10.908, 25.31, 0],
	        to: [0, -0.018, 0],
	        ti: [0, 0.015, 0]
	      }, {
	        t: 32,
	        s: [10.908, 25.22, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [8.158, 25.236, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  ef: [{
	    ty: 34,
	    nm: "Puppet",
	    np: 6,
	    mn: "ADBE FreePin3",
	    ix: 1,
	    en: 1,
	    ef: [{
	      ty: 7,
	      nm: "Puppet Engine",
	      mn: "ADBE FreePin3 Puppet Engine",
	      ix: 1,
	      v: {
	        a: 0,
	        k: 2,
	        ix: 1
	      }
	    }, {
	      ty: 0,
	      nm: "Mesh Rotation Refinement",
	      mn: "ADBE FreePin3 Auto Rotate Pins",
	      ix: 2,
	      v: {
	        a: 0,
	        k: 20,
	        ix: 2
	      }
	    }, {
	      ty: 7,
	      nm: "On Transparent",
	      mn: "ADBE FreePin3 On Transparent",
	      ix: 3,
	      v: {
	        a: 0,
	        k: 0,
	        ix: 3
	      }
	    }, {
	      ty: "",
	      nm: "arap",
	      np: 3,
	      mn: "ADBE FreePin3 ARAP Group",
	      ix: 4,
	      en: 1,
	      ef: [{
	        ty: 6,
	        nm: "Auto-traced Shapes",
	        mn: "ADBE FreePin3 Outlines",
	        ix: 1,
	        v: 0
	      }, {
	        ty: "",
	        nm: "Mesh",
	        np: 1,
	        mn: "ADBE FreePin3 Mesh Group",
	        ix: 2,
	        en: 1,
	        ef: []
	      }]
	    }]
	  }],
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[0.144, 0], [0, 0], [-0.027, -0.154], [0, 0], [-0.159, 0], [0, 0], [0, 0.172], [0, 0]],
	          o: [[0, 0], [-0.16, 0], [0, 0], [0.028, 0.155], [0, 0], [0.176, 0], [0, 0], [0, -0.141]],
	          v: [[-5.635, -1.652], [-8.715, -1.652], [-8.971, -1.355], [-7.182, 8.697], [-6.859, 8.964], [-5.719, 8.964], [-5.4, 8.652], [-5.376, -1.396]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ind: 1,
	      ty: "sh",
	      ix: 2,
	      ks: {
	        a: 0,
	        k: {
	          i: [[0.611, 0], [0, 0], [0.046, 0.112], [-0.211, 0.477], [0.277, 1.05], [1.336, 0.061], [0.21, -0.366], [0, -0.074], [0.061, -0.891], [1.084, -1.441], [0.113, -0.017], [0.279, -0.037], [0, -0.038], [0, 0], [-0.064, -0.011], [-0.553, -0.178], [-1.157, -0.39], [-0.064, 0], [0, 0], [-0.035, 0.72], [0.164, 0.365], [-0.057, 0.011], [1.073, 1.065], [-0.038, 0.01], [-0.138, 0.589], [0.067, 0.221], [0.166, 0.22], [-0.067, 0.022], [0.004, 0.641]],
	          o: [[0, 0], [-0.123, 0], [-0.192, -0.48], [0.353, -1.027], [-0.29, -0.723], [-0.418, 0.061], [-0.037, 0.065], [0, 0], [-0.062, 0.891], [-0.069, 0.092], [-0.406, 0.061], [-0.066, 0.009], [0, 0], [0, 0.029], [0.219, 0.036], [0.694, 0.222], [0.061, 0.021], [0, 0], [0.702, -0.125], [0.01, -0.402], [-0.023, -0.052], [0.697, -0.127], [-0.028, -0.028], [0.592, -0.151], [0.054, -0.225], [-0.079, -0.264], [-0.042, -0.056], [0.589, -0.199], [0.068, -0.628]],
	          v: [[7.882, -1.992], [3.62, -1.992], [3.333, -2.174], [3.359, -3.673], [3.475, -6.859], [1.773, -8.964], [0.779, -8.285], [0.727, -8.068], [0.727, -5.896], [-2.124, -1.292], [-2.402, -1.124], [-3.863, -0.923], [-3.967, -0.794], [-3.967, 7.292], [-3.867, 7.398], [-2.549, 7.712], [-0.118, 8.852], [0.075, 8.883], [5.51, 8.883], [6.77, 7.439], [6.536, 6.275], [6.6, 6.156], [7.094, 3.641], [7.109, 3.566], [8.292, 2.354], [8.26, 1.674], [7.891, 0.943], [7.939, 0.794], [8.93, -0.609]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 2",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "mm",
	      mm: 1,
	      nm: "Merge Paths 1",
	      mn: "ADBE Vector Filter - Merge",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [1, 1, 1, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [17.132, 16.273],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 4,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 33,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 2,
	  ty: 4,
	  nm: "Layer 1/Emotions Outlines",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20, 17, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [17.25, 17.25, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-9.389, 0], [0, -9.389], [9.389, 0], [0, 9.389]],
	          o: [[9.389, 0], [0, 9.389], [-9.389, 0], [0, -9.389]],
	          v: [[0, -17], [17, 0], [0, 17], [-17, 0]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.384313755409, 0.662745098039, 0.952941236309, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [17.25, 17.25],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 2",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 33,
	  st: 0,
	  bm: 0
	}];
	var markers = [];
	var likeAnimatedEmojiData = {
	  v: v,
	  fr: fr,
	  ip: ip,
	  op: op,
	  w: w,
	  h: h,
	  nm: nm,
	  ddd: ddd,
	  assets: assets,
	  layers: layers,
	  markers: markers
	};

	var v$1 = "5.9.1";
	var fr$1 = 25;
	var ip$1 = 0;
	var op$1 = 30;
	var w$1 = 40;
	var h$1 = 40;
	var nm$1 = "em_02";
	var ddd$1 = 0;
	var assets$1 = [];
	var layers$1 = [{
	  ddd: 0,
	  ind: 1,
	  ty: 4,
	  nm: "Group 1 :M",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 0,
	        s: [19.888, 22.482, 0],
	        to: [0, -0.375, 0],
	        ti: [0, -0.167, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 4,
	        s: [19.888, 20.232, 0],
	        to: [0, 0.167, 0],
	        ti: [0, -0.125, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 7.979,
	        s: [19.888, 23.482, 0],
	        to: [0, 0.125, 0],
	        ti: [0, -0.146, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 12.764,
	        s: [19.888, 20.982, 0],
	        to: [0, 0.146, 0],
	        ti: [0, -0.042, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 16.647,
	        s: [19.888, 24.357, 0],
	        to: [0, 0.042, 0],
	        ti: [0, 0.312, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 22.427,
	        s: [19.888, 21.232, 0],
	        to: [0, -0.312, 0],
	        ti: [0, -0.208, 0]
	      }, {
	        t: 27.400390625,
	        s: [19.888, 22.482, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [17.139, 22.732, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0, -1.596], [6.293, 0], [0, 3.023], [-5.122, 0]],
	            o: [[0, 3.024], [-6.292, 0], [0, -1.63], [5.122, 0]],
	            v: [[9.273, -3.113], [0, 4.742], [-9.273, -3.111], [0, -3.189]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [17.138, 22.377],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 1",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [17.138, 22.819],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [17.138, 22.819],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }, {
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0, -2.332], [7.202, 0], [0, 4.104], [-6.085, 0]],
	            o: [[0, 4.105], [-7.201, 0], [0, -2.367], [6.086, 0]],
	            v: [[10.757, -3.799], [-0.001, 6.165], [-10.757, -3.798], [-0.001, -4.253]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.698039233685, 0.392156898975, 0.137254908681, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [17.139, 22.141],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 2",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [17.139, 22.732],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [17.139, 22.732],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 2",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 2,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 30,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 2,
	  ty: 4,
	  nm: "Group 3 :M",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 0,
	        s: [19.167, 11.243, 0],
	        to: [0, -0.375, 0],
	        ti: [0, -0.167, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 4,
	        s: [19.167, 8.993, 0],
	        to: [0, 0.167, 0],
	        ti: [0, -0.125, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 7.979,
	        s: [19.167, 12.243, 0],
	        to: [0, 0.125, 0],
	        ti: [0, 0.083, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 12.764,
	        s: [19.167, 9.743, 0],
	        to: [0, -0.083, 0],
	        ti: [0, -0.125, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 16.647,
	        s: [19.167, 11.743, 0],
	        to: [0, 0.125, 0],
	        ti: [0, 0.083, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 21.432,
	        s: [19.167, 10.493, 0],
	        to: [0, -0.083, 0],
	        ti: [0, -0.125, 0]
	      }, {
	        t: 27.400390625,
	        s: [19.167, 11.243, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [16.417, 11.493, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[1.007, 0.088], [0.848, -0.551], [0.007, -0.072], [0, 0], [-0.157, 0.074], [-0.788, -0.069], [-0.746, -0.701], [-0.015, 0.19], [0, 0], [0.052, 0.048]],
	            o: [[-1.008, -0.088], [-0.06, 0.039], [0, 0], [-0.015, 0.173], [0.701, -0.335], [1.017, 0.089], [0.137, 0.13], [0, 0], [0.006, -0.072], [-0.743, -0.689]],
	            v: [[0.132, -1.337], [-2.693, -0.592], [-2.798, -0.415], [-2.854, 0.247], [-2.536, 0.475], [-0.284, 0.053], [2.395, 1.294], [2.771, 1.146], [2.863, 0.074], [2.79, -0.117]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [10.476, 11.491],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 3",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [10.48, 11.493],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [10.48, 11.493],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 3",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }, {
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0, 0], [0.077, 0.049], [0.998, -0.088], [0.739, -0.676], [-0.008, -0.092], [0, 0], [-0.18, 0.162], [-0.973, 0.085], [-0.674, -0.302], [0.019, 0.224]],
	            o: [[-0.008, -0.092], [-0.841, -0.539], [-0.996, 0.086], [-0.068, 0.062], [0, 0], [0.021, 0.243], [0.729, -0.65], [0.751, -0.066], [0.202, 0.091], [0, 0]],
	            v: [[2.802, -0.355], [2.668, -0.582], [-0.129, -1.308], [-2.763, -0.112], [-2.857, 0.135], [-2.78, 1.044], [-2.296, 1.234], [0.286, 0.081], [2.44, 0.457], [2.846, 0.165]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [22.365, 11.463],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 4",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [22.359, 11.457],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [22.359, 11.457],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 4",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 2,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 30,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 3,
	  ty: 4,
	  nm: "Group 5",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20, 17, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [17.25, 17.25, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-9.389, 0], [0, -9.389], [9.389, 0], [0, 9.389]],
	          o: [[9.389, 0], [0, 9.389], [-9.389, 0], [0, -9.389]],
	          v: [[0, -17], [17, 0], [0, 17], [-17, 0]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.964705942191, 0.878431432387, 0.443137284821, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [17.25, 17.25],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 5",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 30,
	  st: 0,
	  bm: 0
	}];
	var markers$1 = [];
	var laughAnimatedEmojiData = {
	  v: v$1,
	  fr: fr$1,
	  ip: ip$1,
	  op: op$1,
	  w: w$1,
	  h: h$1,
	  nm: nm$1,
	  ddd: ddd$1,
	  assets: assets$1,
	  layers: layers$1,
	  markers: markers$1
	};

	var v$2 = "5.9.1";
	var fr$2 = 25;
	var ip$2 = 0;
	var op$2 = 45;
	var w$2 = 40;
	var h$2 = 40;
	var nm$2 = "em_03";
	var ddd$2 = 0;
	var assets$2 = [];
	var layers$2 = [{
	  ddd: 0,
	  ind: 1,
	  ty: 4,
	  nm: "Group 1",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 4,
	        s: [20.619, 24.041, 0],
	        to: [0.667, -0.25, 0],
	        ti: [0.708, 0.583, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.784,
	          y: 0
	        },
	        t: 18,
	        s: [24.619, 22.541, 0],
	        to: [-0.413, -0.34, 0],
	        ti: [2.093, 0.432, 0]
	      }, {
	        i: {
	          x: 0.139,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 31,
	        s: [18.842, 19.508, 0],
	        to: [-1.495, -0.309, 0],
	        ti: [-0.296, -0.756, 0]
	      }, {
	        t: 44,
	        s: [20.619, 24.041, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [17.869, 24.291, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.667, 0, 0.667],
	          y: [1, 0.999, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 10,
	        s: [100, 100, 100]
	      }, {
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 23,
	        s: [100, 140, 100]
	      }, {
	        i: {
	          x: [0, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [1, 0.888, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 30,
	        s: [100, 140, 100]
	      }, {
	        t: 38,
	        s: [100, 100, 100]
	      }],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      d: 1,
	      ty: "el",
	      s: {
	        a: 0,
	        k: [9, 9],
	        ix: 2
	      },
	      p: {
	        a: 0,
	        k: [0, 0],
	        ix: 3
	      },
	      nm: "Ellipse Path 1",
	      mn: "ADBE Vector Shape - Ellipse",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.470588265213, 0.243137269862, 0.066666666667, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [17.869, 24.291],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 2,
	  ty: 4,
	  nm: "Group 2",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 4,
	        s: [25.962, 12.071, 0],
	        to: [0.667, -0.25, 0],
	        ti: [0.708, 0.583, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.784,
	          y: 0
	        },
	        t: 18,
	        s: [29.962, 10.571, 0],
	        to: [-0.413, -0.34, 0],
	        ti: [2.093, 0.432, 0]
	      }, {
	        i: {
	          x: 0.139,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 31,
	        s: [24.185, 7.538, 0],
	        to: [-1.495, -0.309, 0],
	        ti: [-0.296, -0.756, 0]
	      }, {
	        t: 44,
	        s: [25.962, 12.071, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [23.212, 12.321, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 18,
	        s: [100, 100, 100]
	      }, {
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 31,
	        s: [57, 100, 100]
	      }, {
	        t: 38,
	        s: [100, 100, 100]
	      }],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        d: 1,
	        ty: "el",
	        s: {
	          a: 0,
	          k: [5, 5],
	          ix: 2
	        },
	        p: {
	          a: 0,
	          k: [0, 0],
	          ix: 3
	        },
	        nm: "Ellipse Path 1",
	        mn: "ADBE Vector Shape - Ellipse",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [23.212, 12.321],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 2",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [23.212, 12.321],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [23.212, 12.321],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 2",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 3,
	  ty: 4,
	  nm: "Group 3",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 4,
	        s: [13.379, 12.071, 0],
	        to: [0.667, -0.25, 0],
	        ti: [0.708, 0.583, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.784,
	          y: 0
	        },
	        t: 18,
	        s: [17.379, 10.571, 0],
	        to: [-0.413, -0.34, 0],
	        ti: [2.093, 0.432, 0]
	      }, {
	        i: {
	          x: 0.139,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 31,
	        s: [11.602, 7.538, 0],
	        to: [-1.495, -0.309, 0],
	        ti: [-0.296, -0.756, 0]
	      }, {
	        t: 44,
	        s: [13.379, 12.071, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [10.629, 12.321, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 18,
	        s: [100, 100, 100]
	      }, {
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 31,
	        s: [57, 100, 100]
	      }, {
	        t: 38,
	        s: [100, 100, 100]
	      }],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        d: 1,
	        ty: "el",
	        s: {
	          a: 0,
	          k: [5, 5],
	          ix: 2
	        },
	        p: {
	          a: 0,
	          k: [0, 0],
	          ix: 3
	        },
	        nm: "Ellipse Path 1",
	        mn: "ADBE Vector Shape - Ellipse",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [10.629, 12.321],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 3",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [10.629, 12.321],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [10.629, 12.321],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 3",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 4,
	  ty: 4,
	  nm: "Group 4 :M",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 4,
	        s: [19.573, 6.265, 0],
	        to: [0.667, -0.25, 0],
	        ti: [0.708, 0.583, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.784,
	          y: 0
	        },
	        t: 18,
	        s: [23.573, 4.765, 0],
	        to: [-0.413, -0.34, 0],
	        ti: [2.093, 0.432, 0]
	      }, {
	        i: {
	          x: 0.139,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 31,
	        s: [17.796, 1.731, 0],
	        to: [-1.495, -0.309, 0],
	        ti: [-0.296, -0.756, 0]
	      }, {
	        t: 44,
	        s: [19.573, 6.265, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [16.823, 6.515, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[-0.013, 0.304], [-0.196, 0.087], [-1.038, -0.245], [-0.374, -0.307], [0.005, -0.12], [0, 0], [0.333, 0.193], [0.349, 0.082], [0.905, -0.305]],
	            o: [[0.007, -0.185], [1.081, -0.487], [0.536, 0.127], [0.094, 0.078], [0, 0], [-0.016, 0.368], [-0.281, -0.162], [-0.853, -0.201], [-0.334, 0.112]],
	            v: [[-2.557, 0.16], [-2.219, -0.284], [1.055, -0.7], [2.421, -0.036], [2.557, 0.277], [2.555, 0.313], [1.723, 0.744], [0.779, 0.374], [-1.911, 0.56]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [10.494, 6.514],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 4",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [10.493, 6.515],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [10.493, 6.515],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 4",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }, {
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0.013, 0.304], [0.195, 0.087], [1.038, -0.245], [0.373, -0.307], [-0.005, -0.12], [0, 0], [-0.332, 0.193], [-0.349, 0.082], [-0.905, -0.305]],
	            o: [[-0.008, -0.185], [-1.082, -0.487], [-0.537, 0.127], [-0.095, 0.078], [0, 0], [0.015, 0.368], [0.281, -0.162], [0.853, -0.201], [0.334, 0.112]],
	            v: [[2.557, 0.16], [2.219, -0.284], [-1.055, -0.7], [-2.421, -0.036], [-2.557, 0.277], [-2.555, 0.313], [-1.724, 0.744], [-0.779, 0.374], [1.911, 0.56]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [23.152, 6.514],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 5",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [23.152, 6.515],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [23.152, 6.515],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 5",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 2,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 5,
	  ty: 4,
	  nm: "Group 6",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20, 17, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [17.25, 17.25, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-9.389, 0], [0, -9.389], [9.389, 0], [0, 9.389]],
	          o: [[9.389, 0], [0, 9.389], [-9.389, 0], [0, -9.389]],
	          v: [[0, -17], [17, 0], [0, 17], [-17, 0]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.964705942191, 0.878431432387, 0.443137284821, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [17.25, 17.25],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 6",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: 0,
	  bm: 0
	}];
	var markers$2 = [];
	var wonderAnimatedEmojiData = {
	  v: v$2,
	  fr: fr$2,
	  ip: ip$2,
	  op: op$2,
	  w: w$2,
	  h: h$2,
	  nm: nm$2,
	  ddd: ddd$2,
	  assets: assets$2,
	  layers: layers$2,
	  markers: markers$2
	};

	var v$3 = "5.9.1";
	var fr$3 = 25;
	var ip$3 = 0;
	var op$3 = 70;
	var w$3 = 40;
	var h$3 = 40;
	var nm$3 = "em_04";
	var ddd$3 = 0;
	var assets$3 = [];
	var layers$3 = [{
	  ddd: 0,
	  ind: 1,
	  ty: 4,
	  nm: "Group 13",
	  sr: 1,
	  ks: {
	    o: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: -11,
	        s: [100]
	      }, {
	        t: -3,
	        s: [0]
	      }],
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [11.503, 22.765, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [27.065, 17.327, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: -25,
	        s: [0, 0, 100]
	      }, {
	        t: -4,
	        s: [-100, 100, 100]
	      }],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-1.141, 0.201], [-0.363, -2.054], [1.141, -0.201], [0.363, 2.055]],
	          o: [[1.141, -0.201], [0.362, 2.055], [-1.142, 0.201], [-0.362, -2.054]],
	          v: [[-0.656, -3.72], [2.067, -0.365], [0.656, 3.72], [-2.067, 0.364]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.160784313725, 0.709803921569, 0.886274569642, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [29.234, 21.065],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 29,
	  st: -41,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 2,
	  ty: 4,
	  nm: "Group 12",
	  sr: 1,
	  ks: {
	    o: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 0,
	        s: [100]
	      }, {
	        t: 8,
	        s: [0]
	      }],
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [27.565, 18.577, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [27.065, 17.327, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-1.141, 0.201], [-0.363, -2.054], [1.141, -0.201], [0.363, 2.055]],
	          o: [[1.141, -0.201], [0.362, 2.055], [-1.142, 0.201], [-0.362, -2.054]],
	          v: [[-0.656, -3.72], [2.067, -0.365], [0.656, 3.72], [-2.067, 0.364]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.160784313725, 0.709803921569, 0.886274569642, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [29.234, 21.065],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: -14,
	  op: 40,
	  st: -14,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 3,
	  ty: 4,
	  nm: "Group 5 :M 2",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -11,
	        s: [20.025, 17.177, 0],
	        to: [0, -1.042, 0],
	        ti: [0, 1.042, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: -4,
	        s: [20.025, 10.927, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 33,
	        s: [20.025, 10.927, 0],
	        to: [0, 1.042, 0],
	        ti: [0, -1.042, 0]
	      }, {
	        t: 41,
	        s: [20.025, 17.177, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19.025, 12.927, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0.082, 0.293], [-0.159, 0.144], [-1.063, 0.087], [-0.45, -0.176], [-0.033, -0.116], [0, 0], [0.375, 0.08], [0.357, -0.03], [0.766, -0.57]],
	            o: [[-0.05, -0.178], [0.879, -0.797], [0.549, -0.045], [0.114, 0.045], [0, 0], [0.099, 0.356], [-0.318, -0.068], [-0.874, 0.072], [-0.283, 0.21]],
	            v: [[-2.455, 0.827], [-2.271, 0.3], [0.715, -1.107], [2.219, -0.898], [2.445, -0.642], [2.454, -0.608], [1.797, 0.06], [0.784, 0], [-1.717, 1.008]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [12.182, 12.927],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 5",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [12.182, 12.927],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [12.182, 12.927],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 5",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }, {
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[-0.082, 0.293], [0.159, 0.144], [1.063, 0.087], [0.45, -0.176], [0.032, -0.116], [0, 0], [-0.376, 0.08], [-0.357, -0.03], [-0.767, -0.57]],
	            o: [[0.05, -0.178], [-0.878, -0.797], [-0.55, -0.045], [-0.114, 0.045], [0, 0], [-0.099, 0.356], [0.317, -0.068], [0.873, 0.072], [0.282, 0.21]],
	            v: [[2.455, 0.827], [2.271, 0.3], [-0.714, -1.107], [-2.219, -0.898], [-2.444, -0.642], [-2.454, -0.608], [-1.796, 0.06], [-0.783, 0], [1.718, 1.008]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [25.868, 12.927],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 6",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [25.868, 12.927],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [25.868, 12.927],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 6",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 2,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: -25,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 4,
	  ty: 4,
	  nm: "Group 11",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -10,
	        s: [20, 29.883, 0],
	        to: [0, -1.042, 0],
	        ti: [0, 1.042, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: -3,
	        s: [20, 23.633, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 33,
	        s: [20, 23.633, 0],
	        to: [0, 1.042, 0],
	        ti: [0, -1.042, 0]
	      }, {
	        t: 41,
	        s: [20, 29.883, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19, 25.633, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[0, 0], [-0.239, 0.195], [-2.538, -0.001], [-1.954, -1.593], [0, 0.307], [0, 0], [0.077, 0.069], [2.747, 0.001], [2.042, -1.839], [0, -0.105]],
	          o: [[0, 0.308], [1.955, -1.592], [2.538, 0], [0.239, 0.195], [0, 0], [0, -0.105], [-2.042, -1.84], [-2.747, 0], [-0.078, 0.07], [0, 0]],
	          v: [[-7.445, 1.859], [-6.848, 2.142], [0.001, -0.38], [6.848, 2.145], [7.445, 1.863], [7.445, 0.869], [7.323, 0.593], [0.001, -2.34], [-7.322, 0.589], [-7.444, 0.865]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.470588265213, 0.243137269862, 0.066666666667, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [19, 25.689],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 2",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: -25,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 5,
	  ty: 4,
	  nm: "Shape Layer 4",
	  parent: 7,
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -25,
	        s: [19, 23, 0],
	        to: [0, -0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -23,
	        s: [19, 20.5, 0],
	        to: [0, 0, 0],
	        ti: [0, -0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: -20,
	        s: [19, 23, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -5,
	        s: [19, 23, 0],
	        to: [0, -0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -3,
	        s: [19, 20.5, 0],
	        to: [0, 0, 0],
	        ti: [0, -0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 0,
	        s: [19, 23, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 18,
	        s: [19, 23, 0],
	        to: [0, -0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 20,
	        s: [19, 20.5, 0],
	        to: [0, 0, 0],
	        ti: [0, -0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 23,
	        s: [19, 23, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 39,
	        s: [19, 23, 0],
	        to: [0, -0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 41,
	        s: [19, 20.5, 0],
	        to: [0, 0, 0],
	        ti: [0, -0.417, 0]
	      }, {
	        t: 44,
	        s: [19, 23, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [0, 0, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [80, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "rc",
	    d: 1,
	    s: {
	      a: 0,
	      k: [26, 4],
	      ix: 2
	    },
	    p: {
	      a: 0,
	      k: [0, 0],
	      ix: 3
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 4
	    },
	    nm: "Rectangle Path 1",
	    mn: "ADBE Vector Shape - Rect",
	    hd: false
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [0.964705942191, 0.878431432387, 0.443137284821, 1],
	      ix: 4
	    },
	    o: {
	      a: 0,
	      k: 100,
	      ix: 5
	    },
	    r: 1,
	    bm: 0,
	    nm: "Fill 1",
	    mn: "ADBE Vector Graphic - Fill",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: -25,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 6,
	  ty: 4,
	  nm: "Shape Layer 3",
	  parent: 7,
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -25,
	        s: [19, 12, 0],
	        to: [0, 0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -23,
	        s: [19, 14.5, 0],
	        to: [0, 0, 0],
	        ti: [0, 0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: -20,
	        s: [19, 12, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -5,
	        s: [19, 12, 0],
	        to: [0, 0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -3,
	        s: [19, 14.5, 0],
	        to: [0, 0, 0],
	        ti: [0, 0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 0,
	        s: [19, 12, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 18,
	        s: [19, 12, 0],
	        to: [0, 0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 20,
	        s: [19, 14.5, 0],
	        to: [0, 0, 0],
	        ti: [0, 0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 23,
	        s: [19, 12, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 39,
	        s: [19, 12, 0],
	        to: [0, 0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 41,
	        s: [19, 14.5, 0],
	        to: [0, 0, 0],
	        ti: [0, 0.417, 0]
	      }, {
	        t: 44,
	        s: [19, 12, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [0, 0, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [80, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "rc",
	    d: 1,
	    s: {
	      a: 0,
	      k: [26, 4],
	      ix: 2
	    },
	    p: {
	      a: 0,
	      k: [0, 0],
	      ix: 3
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 4
	    },
	    nm: "Rectangle Path 1",
	    mn: "ADBE Vector Shape - Rect",
	    hd: false
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [0.964705942191, 0.878431432387, 0.443137284821, 1],
	      ix: 4
	    },
	    o: {
	      a: 0,
	      k: 100,
	      ix: 5
	    },
	    r: 1,
	    bm: 0,
	    nm: "Fill 1",
	    mn: "ADBE Vector Graphic - Fill",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: -25,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 7,
	  ty: 4,
	  nm: "Group 3 :M 2",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: -12,
	        s: [20.065, 21.464, 0],
	        to: [0, -1.042, 0],
	        ti: [0, 1.042, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: -5,
	        s: [20.065, 15.214, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 33,
	        s: [20.065, 15.214, 0],
	        to: [0, 1.042, 0],
	        ti: [0, -1.042, 0]
	      }, {
	        t: 41,
	        s: [20.065, 21.464, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19.065, 17.214, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[-0.915, 0], [0, -1.34], [0.915, 0], [0, 1.341]],
	            o: [[0.915, 0], [0, 1.341], [-0.915, 0], [0, -1.34]],
	            v: [[0, -2.427], [1.657, 0], [0, 2.427], [-1.657, 0]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [25.357, 17.214],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 3",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [25.357, 17.214],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [25.357, 17.214],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 3",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }, {
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[-0.915, 0], [0, -1.34], [0.915, 0], [0, 1.341]],
	            o: [[0.915, 0], [0, 1.341], [-0.915, 0], [0, -1.34]],
	            v: [[0, -2.427], [1.657, 0], [0, 2.427], [-1.657, 0]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [12.774, 17.214],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 4",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [12.774, 17.214],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [12.774, 17.214],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 4",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 2,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: -25,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 8,
	  ty: 4,
	  nm: "Group 10",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20, 17, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [17.25, 17.25, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-9.389, 0], [0, -9.389], [9.389, 0], [0, 9.389]],
	          o: [[9.389, 0], [0, 9.389], [-9.389, 0], [0, -9.389]],
	          v: [[0, -17], [17, 0], [0, 17], [-17, 0]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.964705942191, 0.878431432387, 0.443137284821, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [17.25, 17.25],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 6",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 45,
	  st: -25,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 9,
	  ty: 4,
	  nm: "Group 14",
	  sr: 1,
	  ks: {
	    o: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 59,
	        s: [100]
	      }, {
	        t: 67,
	        s: [0]
	      }],
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [11.503, 22.765, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [27.065, 17.327, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 45,
	        s: [0, 0, 100]
	      }, {
	        t: 66,
	        s: [-100, 100, 100]
	      }],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-1.141, 0.201], [-0.363, -2.054], [1.141, -0.201], [0.363, 2.055]],
	          o: [[1.141, -0.201], [0.362, 2.055], [-1.142, 0.201], [-0.362, -2.054]],
	          v: [[-0.656, -3.72], [2.067, -0.365], [0.656, 3.72], [-2.067, 0.364]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.160784313725, 0.709803921569, 0.886274569642, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [29.234, 21.065],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 45,
	  op: 70,
	  st: 29,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 10,
	  ty: 4,
	  nm: "Group 1",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [27.565, 18.577, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [27.065, 17.327, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 60,
	        s: [0, 0, 100]
	      }, {
	        t: 70,
	        s: [100, 100, 100]
	      }],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-1.141, 0.201], [-0.363, -2.054], [1.141, -0.201], [0.363, 2.055]],
	          o: [[1.141, -0.201], [0.362, 2.055], [-1.142, 0.201], [-0.362, -2.054]],
	          v: [[-0.656, -3.72], [2.067, -0.365], [0.656, 3.72], [-2.067, 0.364]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.160784313725, 0.709803921569, 0.886274569642, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [29.234, 21.065],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 49,
	  op: 70,
	  st: 49,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 11,
	  ty: 4,
	  nm: "Group 5 :M",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 59,
	        s: [20.025, 17.177, 0],
	        to: [0, -1.042, 0],
	        ti: [0, 1.042, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 66,
	        s: [20.025, 10.927, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 103,
	        s: [20.025, 10.927, 0],
	        to: [0, 1.042, 0],
	        ti: [0, -1.042, 0]
	      }, {
	        t: 111,
	        s: [20.025, 17.177, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19.025, 12.927, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0.082, 0.293], [-0.159, 0.144], [-1.063, 0.087], [-0.45, -0.176], [-0.033, -0.116], [0, 0], [0.375, 0.08], [0.357, -0.03], [0.766, -0.57]],
	            o: [[-0.05, -0.178], [0.879, -0.797], [0.549, -0.045], [0.114, 0.045], [0, 0], [0.099, 0.356], [-0.318, -0.068], [-0.874, 0.072], [-0.283, 0.21]],
	            v: [[-2.455, 0.827], [-2.271, 0.3], [0.715, -1.107], [2.219, -0.898], [2.445, -0.642], [2.454, -0.608], [1.797, 0.06], [0.784, 0], [-1.717, 1.008]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [12.182, 12.927],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 5",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [12.182, 12.927],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [12.182, 12.927],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 5",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }, {
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[-0.082, 0.293], [0.159, 0.144], [1.063, 0.087], [0.45, -0.176], [0.032, -0.116], [0, 0], [-0.376, 0.08], [-0.357, -0.03], [-0.767, -0.57]],
	            o: [[0.05, -0.178], [-0.878, -0.797], [-0.55, -0.045], [-0.114, 0.045], [0, 0], [-0.099, 0.356], [0.317, -0.068], [0.873, 0.072], [0.282, 0.21]],
	            v: [[2.455, 0.827], [2.271, 0.3], [-0.714, -1.107], [-2.219, -0.898], [-2.444, -0.642], [-2.454, -0.608], [-1.796, 0.06], [-0.783, 0], [1.718, 1.008]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [25.868, 12.927],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 6",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [25.868, 12.927],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [25.868, 12.927],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 6",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 2,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 45,
	  op: 70,
	  st: 45,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 12,
	  ty: 4,
	  nm: "Group 2",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 60,
	        s: [20, 29.883, 0],
	        to: [0, -1.042, 0],
	        ti: [0, 1.042, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 67,
	        s: [20, 23.633, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 103,
	        s: [20, 23.633, 0],
	        to: [0, 1.042, 0],
	        ti: [0, -1.042, 0]
	      }, {
	        t: 111,
	        s: [20, 29.883, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19, 25.633, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[0, 0], [-0.239, 0.195], [-2.538, -0.001], [-1.954, -1.593], [0, 0.307], [0, 0], [0.077, 0.069], [2.747, 0.001], [2.042, -1.839], [0, -0.105]],
	          o: [[0, 0.308], [1.955, -1.592], [2.538, 0], [0.239, 0.195], [0, 0], [0, -0.105], [-2.042, -1.84], [-2.747, 0], [-0.078, 0.07], [0, 0]],
	          v: [[-7.445, 1.859], [-6.848, 2.142], [0.001, -0.38], [6.848, 2.145], [7.445, 1.863], [7.445, 0.869], [7.323, 0.593], [0.001, -2.34], [-7.322, 0.589], [-7.444, 0.865]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.470588265213, 0.243137269862, 0.066666666667, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [19, 25.689],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 2",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 45,
	  op: 70,
	  st: 45,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 13,
	  ty: 4,
	  nm: "Shape Layer 2",
	  parent: 15,
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 45,
	        s: [19, 23, 0],
	        to: [0, -0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 47,
	        s: [19, 20.5, 0],
	        to: [0, 0, 0],
	        ti: [0, -0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 50,
	        s: [19, 23, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 65,
	        s: [19, 23, 0],
	        to: [0, -0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 67,
	        s: [19, 20.5, 0],
	        to: [0, 0, 0],
	        ti: [0, -0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 70,
	        s: [19, 23, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 88,
	        s: [19, 23, 0],
	        to: [0, -0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 90,
	        s: [19, 20.5, 0],
	        to: [0, 0, 0],
	        ti: [0, -0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 93,
	        s: [19, 23, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 109,
	        s: [19, 23, 0],
	        to: [0, -0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 111,
	        s: [19, 20.5, 0],
	        to: [0, 0, 0],
	        ti: [0, -0.417, 0]
	      }, {
	        t: 114,
	        s: [19, 23, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [0, 0, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [80, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "rc",
	    d: 1,
	    s: {
	      a: 0,
	      k: [26, 4],
	      ix: 2
	    },
	    p: {
	      a: 0,
	      k: [0, 0],
	      ix: 3
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 4
	    },
	    nm: "Rectangle Path 1",
	    mn: "ADBE Vector Shape - Rect",
	    hd: false
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [0.964705942191, 0.878431432387, 0.443137284821, 1],
	      ix: 4
	    },
	    o: {
	      a: 0,
	      k: 100,
	      ix: 5
	    },
	    r: 1,
	    bm: 0,
	    nm: "Fill 1",
	    mn: "ADBE Vector Graphic - Fill",
	    hd: false
	  }],
	  ip: 45,
	  op: 70,
	  st: 45,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 14,
	  ty: 4,
	  nm: "Shape Layer 1",
	  parent: 15,
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 45,
	        s: [19, 12, 0],
	        to: [0, 0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 47,
	        s: [19, 14.5, 0],
	        to: [0, 0, 0],
	        ti: [0, 0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 50,
	        s: [19, 12, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 65,
	        s: [19, 12, 0],
	        to: [0, 0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 67,
	        s: [19, 14.5, 0],
	        to: [0, 0, 0],
	        ti: [0, 0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 70,
	        s: [19, 12, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 88,
	        s: [19, 12, 0],
	        to: [0, 0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 90,
	        s: [19, 14.5, 0],
	        to: [0, 0, 0],
	        ti: [0, 0.417, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 93,
	        s: [19, 12, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 109,
	        s: [19, 12, 0],
	        to: [0, 0.417, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 111,
	        s: [19, 14.5, 0],
	        to: [0, 0, 0],
	        ti: [0, 0.417, 0]
	      }, {
	        t: 114,
	        s: [19, 12, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [0, 0, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [80, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "rc",
	    d: 1,
	    s: {
	      a: 0,
	      k: [26, 4],
	      ix: 2
	    },
	    p: {
	      a: 0,
	      k: [0, 0],
	      ix: 3
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 4
	    },
	    nm: "Rectangle Path 1",
	    mn: "ADBE Vector Shape - Rect",
	    hd: false
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [0.964705942191, 0.878431432387, 0.443137284821, 1],
	      ix: 4
	    },
	    o: {
	      a: 0,
	      k: 100,
	      ix: 5
	    },
	    r: 1,
	    bm: 0,
	    nm: "Fill 1",
	    mn: "ADBE Vector Graphic - Fill",
	    hd: false
	  }],
	  ip: 45,
	  op: 70,
	  st: 45,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 15,
	  ty: 4,
	  nm: "Group 3 :M",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 58,
	        s: [20.065, 21.464, 0],
	        to: [0, -1.042, 0],
	        ti: [0, 1.042, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 65,
	        s: [20.065, 15.214, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 103,
	        s: [20.065, 15.214, 0],
	        to: [0, 1.042, 0],
	        ti: [0, -1.042, 0]
	      }, {
	        t: 111,
	        s: [20.065, 21.464, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19.065, 17.214, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[-0.915, 0], [0, -1.34], [0.915, 0], [0, 1.341]],
	            o: [[0.915, 0], [0, 1.341], [-0.915, 0], [0, -1.34]],
	            v: [[0, -2.427], [1.657, 0], [0, 2.427], [-1.657, 0]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [25.357, 17.214],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 3",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [25.357, 17.214],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [25.357, 17.214],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 3",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }, {
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[-0.915, 0], [0, -1.34], [0.915, 0], [0, 1.341]],
	            o: [[0.915, 0], [0, 1.341], [-0.915, 0], [0, -1.34]],
	            v: [[0, -2.427], [1.657, 0], [0, 2.427], [-1.657, 0]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [12.774, 17.214],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 4",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [12.774, 17.214],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [12.774, 17.214],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 4",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 2,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 45,
	  op: 70,
	  st: 45,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 16,
	  ty: 4,
	  nm: "Group 6",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20, 17, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [17.25, 17.25, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-9.389, 0], [0, -9.389], [9.389, 0], [0, 9.389]],
	          o: [[9.389, 0], [0, 9.389], [-9.389, 0], [0, -9.389]],
	          v: [[0, -17], [17, 0], [0, 17], [-17, 0]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.964705942191, 0.878431432387, 0.443137284821, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [17.25, 17.25],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 6",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 45,
	  op: 70,
	  st: 45,
	  bm: 0
	}];
	var markers$3 = [];
	var cryAnimatedEmojiData = {
	  v: v$3,
	  fr: fr$3,
	  ip: ip$3,
	  op: op$3,
	  w: w$3,
	  h: h$3,
	  nm: nm$3,
	  ddd: ddd$3,
	  assets: assets$3,
	  layers: layers$3,
	  markers: markers$3
	};

	var v$4 = "5.9.1";
	var fr$4 = 25;
	var ip$4 = 0;
	var op$4 = 85;
	var w$4 = 40;
	var h$4 = 40;
	var nm$4 = "em_05";
	var ddd$4 = 0;
	var assets$4 = [];
	var layers$4 = [{
	  ddd: 0,
	  ind: 1,
	  ty: 4,
	  nm: "Shape Layer 2",
	  parent: 5,
	  sr: 1,
	  ks: {
	    o: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 56,
	        s: [75]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 63,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 78,
	        s: [0]
	      }, {
	        t: 83,
	        s: [75]
	      }],
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [32.125, 21.75, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [0, 0, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [4, 14, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    d: 1,
	    ty: "el",
	    s: {
	      a: 0,
	      k: [100, 100],
	      ix: 2
	    },
	    p: {
	      a: 0,
	      k: [0, 0],
	      ix: 3
	    },
	    nm: "Ellipse Path 1",
	    mn: "ADBE Vector Shape - Ellipse",
	    hd: false
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [1, 0.592156862745, 0.58431372549, 1],
	      ix: 4
	    },
	    o: {
	      a: 0,
	      k: 100,
	      ix: 5
	    },
	    r: 1,
	    bm: 0,
	    nm: "Fill 1",
	    mn: "ADBE Vector Graphic - Fill",
	    hd: false
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [1, 0.592156862745, 0.58431372549, 1],
	      ix: 4
	    },
	    o: {
	      a: 0,
	      k: 100,
	      ix: 5
	    },
	    r: 1,
	    bm: 0,
	    nm: "Fill 2",
	    mn: "ADBE Vector Graphic - Fill",
	    hd: false
	  }],
	  ip: 0,
	  op: 85,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 2,
	  ty: 4,
	  nm: "Shape Layer 1",
	  parent: 5,
	  sr: 1,
	  ks: {
	    o: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 56,
	        s: [75]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 63,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 78,
	        s: [0]
	      }, {
	        t: 83,
	        s: [75]
	      }],
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [6.938, 21.75, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [0, 0, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [4, 14, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    d: 1,
	    ty: "el",
	    s: {
	      a: 0,
	      k: [100, 100],
	      ix: 2
	    },
	    p: {
	      a: 0,
	      k: [0, 0],
	      ix: 3
	    },
	    nm: "Ellipse Path 1",
	    mn: "ADBE Vector Shape - Ellipse",
	    hd: false
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [1, 0.592156862745, 0.58431372549, 1],
	      ix: 4
	    },
	    o: {
	      a: 0,
	      k: 100,
	      ix: 5
	    },
	    r: 1,
	    bm: 0,
	    nm: "Fill 1",
	    mn: "ADBE Vector Graphic - Fill",
	    hd: false
	  }, {
	    ty: "fl",
	    c: {
	      a: 0,
	      k: [1, 0.592156862745, 0.58431372549, 1],
	      ix: 4
	    },
	    o: {
	      a: 0,
	      k: 100,
	      ix: 5
	    },
	    r: 1,
	    bm: 0,
	    nm: "Fill 2",
	    mn: "ADBE Vector Graphic - Fill",
	    hd: false
	  }],
	  ip: 0,
	  op: 85,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 3,
	  ty: 4,
	  nm: "Group 1",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 0,
	        s: [13.776, 15.896, 0],
	        to: [0, -0.625, 0],
	        ti: [0, 0.292, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 9,
	        s: [13.776, 12.146, 0],
	        to: [0, -0.292, 0],
	        ti: [0, -0.333, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 15,
	        s: [13.776, 14.146, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 56,
	        s: [13.776, 14.146, 0],
	        to: [0, -1.604, 0],
	        ti: [0, 1.604, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 63,
	        s: [13.776, 4.521, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 78,
	        s: [13.776, 4.521, 0],
	        to: [0, 1.896, 0],
	        ti: [0, -1.896, 0]
	      }, {
	        t: 83,
	        s: [13.776, 15.896, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [12.776, 17.896, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0.268, 0.008], [1.033, 0.845], [0.252, 0.549], [-0.071, 0.132], [0, 0], [-0.269, -0.399], [-0.347, -0.284], [-1.185, -0.154], [0.181, -0.335]],
	            o: [[-1.483, -0.046], [-0.534, -0.437], [-0.064, -0.14], [0, 0], [0.219, -0.406], [0.226, 0.336], [0.849, 0.694], [0.438, 0.057], [-0.11, 0.203]],
	            v: [[2.484, 2.023], [-1.426, 0.695], [-3.225, -1.137], [-3.206, -1.564], [-3.184, -1.604], [-2.012, -1.633], [-0.525, -0.361], [2.6, 0.906], [3.107, 1.71]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [12.826, 17.844],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 1",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [12.776, 17.896],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [12.776, 17.896],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 85,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 4,
	  ty: 4,
	  nm: "Group 2",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 0,
	        s: [25.514, 15.911, 0],
	        to: [0, -0.625, 0],
	        ti: [0, 0.292, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 9,
	        s: [25.514, 12.161, 0],
	        to: [0, -0.292, 0],
	        ti: [0, -0.333, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 15,
	        s: [25.514, 14.161, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 56,
	        s: [25.514, 14.161, 0],
	        to: [0, -1.604, 0],
	        ti: [0, 1.604, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 63,
	        s: [25.514, 4.536, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 78,
	        s: [25.514, 4.536, 0],
	        to: [0, 1.896, 0],
	        ti: [0, -1.896, 0]
	      }, {
	        t: 83,
	        s: [25.514, 15.911, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [24.514, 17.911, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[-0.268, 0.008], [-1.033, 0.845], [-0.252, 0.549], [0.072, 0.132], [0, 0], [0.268, -0.399], [0.347, -0.284], [1.185, -0.154], [-0.181, -0.335]],
	            o: [[1.483, -0.047], [0.534, -0.437], [0.063, -0.14], [0, 0], [-0.22, -0.406], [-0.227, 0.336], [-0.849, 0.694], [-0.437, 0.057], [0.109, 0.203]],
	            v: [[-2.484, 2.023], [1.426, 0.695], [3.225, -1.137], [3.205, -1.564], [3.184, -1.604], [2.012, -1.633], [0.526, -0.361], [-2.601, 0.906], [-3.107, 1.71]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [24.464, 17.859],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 2",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [24.514, 17.911],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [24.514, 17.911],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 2",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 85,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 5,
	  ty: 4,
	  nm: "Group 3",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 0,
	        s: [13.773, 18.001, 0],
	        to: [0, -0.625, 0],
	        ti: [0, 0.292, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 9,
	        s: [13.773, 14.251, 0],
	        to: [0, -0.292, 0],
	        ti: [0, -0.333, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 15,
	        s: [13.773, 16.251, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 56,
	        s: [13.773, 16.251, 0],
	        to: [0, -0.771, 0],
	        ti: [0, 0.771, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 63,
	        s: [13.773, 11.626, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 78,
	        s: [13.773, 11.626, 0],
	        to: [0, 1.062, 0],
	        ti: [0, -1.062, 0]
	      }, {
	        t: 83,
	        s: [13.773, 18.001, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [12.773, 20.001, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0, -0.92], [-0.909, 0], [0, 0.92], [0.908, 0]],
	            o: [[0, 0.92], [0.908, 0], [0, -0.92], [-0.909, 0]],
	            v: [[-1.645, 0.001], [0, 1.665], [1.645, 0.001], [0, -1.665]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [12.773, 20.001],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 3",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [12.773, 20.001],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [12.773, 20.001],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 3",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 85,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 6,
	  ty: 4,
	  nm: "Group 4",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 0,
	        s: [25.242, 18.001, 0],
	        to: [0, -0.625, 0],
	        ti: [0, 0.292, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 9,
	        s: [25.242, 14.251, 0],
	        to: [0, -0.292, 0],
	        ti: [0, -0.333, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 15,
	        s: [25.242, 16.251, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 56,
	        s: [25.242, 16.251, 0],
	        to: [0, -0.771, 0],
	        ti: [0, 0.771, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 63,
	        s: [25.242, 11.626, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 78,
	        s: [25.242, 11.626, 0],
	        to: [0, 1.062, 0],
	        ti: [0, -1.062, 0]
	      }, {
	        t: 83,
	        s: [25.242, 18.001, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [24.242, 20.001, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0, -0.92], [0.908, 0], [0, 0.92], [-0.909, 0]],
	            o: [[0, 0.92], [-0.909, 0], [0, -0.92], [0.908, 0]],
	            v: [[1.645, 0.001], [0, 1.665], [-1.645, 0.001], [0, -1.665]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [24.242, 20.001],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 4",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [24.242, 20.001],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [24.242, 20.001],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 4",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 85,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 7,
	  ty: 4,
	  nm: "Group 5",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 0,
	        s: [20.127, 25.524, 0],
	        to: [0, -0.625, 0],
	        ti: [0, 0.292, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 9,
	        s: [20.127, 21.774, 0],
	        to: [0, -0.292, 0],
	        ti: [0, -0.333, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 15,
	        s: [20.127, 23.774, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 56,
	        s: [20.127, 23.774, 0],
	        to: [0, -0.771, 0],
	        ti: [0, 0.771, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 63,
	        s: [20.127, 19.149, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 78,
	        s: [20.127, 19.149, 0],
	        to: [0, 1.062, 0],
	        ti: [0, -1.062, 0]
	      }, {
	        t: 83,
	        s: [20.127, 25.524, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19.127, 27.524, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[0, 0], [-0.182, 0.195], [-1.936, -0.001], [-1.49, -1.597], [0, 0.308], [0, 0], [0.059, 0.07], [2.095, 0.001], [1.558, -1.843], [0, -0.105]],
	          o: [[0, 0.309], [1.491, -1.596], [1.936, 0], [0.183, 0.195], [0, 0], [0, -0.105], [-1.558, -1.844], [-2.096, -0.001], [-0.059, 0.07], [0, 0]],
	          v: [[-5.68, 1.74], [-5.224, 2.024], [0, -0.249], [5.224, 2.027], [5.68, 1.744], [5.68, 0.747], [5.587, 0.47], [0.002, -2.221], [-5.586, 0.467], [-5.679, 0.744]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.470588265213, 0.243137269862, 0.066666666667, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [19.127, 27.58],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 5",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 85,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 8,
	  ty: 4,
	  nm: "Group 9",
	  sr: 1,
	  ks: {
	    o: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 53,
	        s: [100]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 63,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 72,
	        s: [0]
	      }, {
	        t: 83,
	        s: [100]
	      }],
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20, 17, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19, 19, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-9.389, 0], [0, -9.389], [9.389, 0], [0, 9.389]],
	          o: [[9.389, 0], [0, 9.389], [-9.389, 0], [0, -9.389]],
	          v: [[0, -17], [17, 0], [0, 17], [-17, 0]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [1, 0.725490196078, 0.717647058824, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [19, 19],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 8",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 85,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 9,
	  ty: 4,
	  nm: "Group 8",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20, 17, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19, 19, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-9.389, 0], [0, -9.389], [9.389, 0], [0, 9.389]],
	          o: [[9.389, 0], [0, 9.389], [-9.389, 0], [0, -9.389]],
	          v: [[0, -17], [17, 0], [0, 17], [-17, 0]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.964705882353, 0.878431372549, 0.443137254902, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [19, 19],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 8",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 85,
	  st: 0,
	  bm: 0
	}];
	var markers$4 = [];
	var angryAnimatedEmojiData = {
	  v: v$4,
	  fr: fr$4,
	  ip: ip$4,
	  op: op$4,
	  w: w$4,
	  h: h$4,
	  nm: nm$4,
	  ddd: ddd$4,
	  assets: assets$4,
	  layers: layers$4,
	  markers: markers$4
	};

	var v$5 = "5.9.1";
	var fr$5 = 25;
	var ip$5 = 0;
	var op$5 = 60;
	var w$5 = 40;
	var h$5 = 40;
	var nm$5 = "em_06";
	var ddd$5 = 0;
	var assets$5 = [];
	var layers$5 = [{
	  ddd: 0,
	  ind: 1,
	  ty: 4,
	  nm: "Group 1 :M",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.833],
	          y: [1]
	        },
	        o: {
	          x: [0.167],
	          y: [0]
	        },
	        t: 0,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1]
	        },
	        o: {
	          x: [0.167],
	          y: [0]
	        },
	        t: 1,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1]
	        },
	        o: {
	          x: [0.167],
	          y: [0]
	        },
	        t: 2,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1]
	        },
	        o: {
	          x: [0.167],
	          y: [0]
	        },
	        t: 3,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1]
	        },
	        o: {
	          x: [0.167],
	          y: [0]
	        },
	        t: 4,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1]
	        },
	        o: {
	          x: [0.167],
	          y: [0]
	        },
	        t: 5,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1]
	        },
	        o: {
	          x: [0.167],
	          y: [0]
	        },
	        t: 6,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1]
	        },
	        o: {
	          x: [0.167],
	          y: [0]
	        },
	        t: 7,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1]
	        },
	        o: {
	          x: [0.167],
	          y: [0]
	        },
	        t: 8,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1.06]
	        },
	        o: {
	          x: [0.167],
	          y: [0]
	        },
	        t: 9,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.702]
	        },
	        o: {
	          x: [0.167],
	          y: [0.083]
	        },
	        t: 10,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.803]
	        },
	        o: {
	          x: [0.167],
	          y: [0.116]
	        },
	        t: 11,
	        s: [-0.72]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.826]
	        },
	        o: {
	          x: [0.167],
	          y: [0.144]
	        },
	        t: 12,
	        s: [-2.577]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.84]
	        },
	        o: {
	          x: [0.167],
	          y: [0.16]
	        },
	        t: 13,
	        s: [-5.117]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.856]
	        },
	        o: {
	          x: [0.167],
	          y: [0.174]
	        },
	        t: 14,
	        s: [-7.883]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.884]
	        },
	        o: {
	          x: [0.167],
	          y: [0.197]
	        },
	        t: 15,
	        s: [-10.423]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.897]
	        },
	        o: {
	          x: [0.167],
	          y: [0.298]
	        },
	        t: 16,
	        s: [-12.28]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.865]
	        },
	        o: {
	          x: [0.167],
	          y: [0.43]
	        },
	        t: 17,
	        s: [-13]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.897]
	        },
	        o: {
	          x: [0.167],
	          y: [0.218]
	        },
	        t: 18,
	        s: [-13.173]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1.079]
	        },
	        o: {
	          x: [0.167],
	          y: [0.432]
	        },
	        t: 19,
	        s: [-13.28]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.745]
	        },
	        o: {
	          x: [0.167],
	          y: [0.041]
	        },
	        t: 20,
	        s: [-13.305]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.816]
	        },
	        o: {
	          x: [0.167],
	          y: [0.124]
	        },
	        t: 21,
	        s: [-13.256]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.841]
	        },
	        o: {
	          x: [0.167],
	          y: [0.153]
	        },
	        t: 22,
	        s: [-13.153]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.86]
	        },
	        o: {
	          x: [0.167],
	          y: [0.175]
	        },
	        t: 23,
	        s: [-13.03]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.886]
	        },
	        o: {
	          x: [0.167],
	          y: [0.206]
	        },
	        t: 24,
	        s: [-12.918]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.976]
	        },
	        o: {
	          x: [0.167],
	          y: [0.311]
	        },
	        t: 25,
	        s: [-12.842]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.681]
	        },
	        o: {
	          x: [0.167],
	          y: [-0.035]
	        },
	        t: 26,
	        s: [-12.814]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.807]
	        },
	        o: {
	          x: [0.167],
	          y: [0.113]
	        },
	        t: 27,
	        s: [-12.834]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.836]
	        },
	        o: {
	          x: [0.167],
	          y: [0.147]
	        },
	        t: 28,
	        s: [-12.89]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.855]
	        },
	        o: {
	          x: [0.167],
	          y: [0.169]
	        },
	        t: 29,
	        s: [-12.963]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.878]
	        },
	        o: {
	          x: [0.167],
	          y: [0.196]
	        },
	        t: 30,
	        s: [-13.034]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.934]
	        },
	        o: {
	          x: [0.167],
	          y: [0.262]
	        },
	        t: 31,
	        s: [-13.087]
	      }, {
	        i: {
	          x: [0.833],
	          y: [-0.789]
	        },
	        o: {
	          x: [0.167],
	          y: [-0.311]
	        },
	        t: 32,
	        s: [-13.111]
	      }, {
	        i: {
	          x: [0.833],
	          y: [-0.358]
	        },
	        o: {
	          x: [0.167],
	          y: [0.087]
	        },
	        t: 33,
	        s: [-13.106]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.089]
	        },
	        t: 34,
	        s: [-13]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 35,
	        s: [-11.375]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 36,
	        s: [-9.75]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 37,
	        s: [-8.125]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 38,
	        s: [-6.5]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 39,
	        s: [-4.875]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 40,
	        s: [-3.25]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.824]
	        },
	        o: {
	          x: [0.167],
	          y: [0.167]
	        },
	        t: 41,
	        s: [-1.625]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.865]
	        },
	        o: {
	          x: [0.167],
	          y: [0.158]
	        },
	        t: 42,
	        s: [0]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.897]
	        },
	        o: {
	          x: [0.167],
	          y: [0.218]
	        },
	        t: 43,
	        s: [1.807]
	      }, {
	        i: {
	          x: [0.833],
	          y: [1.079]
	        },
	        o: {
	          x: [0.167],
	          y: [0.432]
	        },
	        t: 44,
	        s: [2.923]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.745]
	        },
	        o: {
	          x: [0.167],
	          y: [0.041]
	        },
	        t: 45,
	        s: [3.189]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.816]
	        },
	        o: {
	          x: [0.167],
	          y: [0.124]
	        },
	        t: 46,
	        s: [2.669]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.841]
	        },
	        o: {
	          x: [0.167],
	          y: [0.153]
	        },
	        t: 47,
	        s: [1.601]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.86]
	        },
	        o: {
	          x: [0.167],
	          y: [0.175]
	        },
	        t: 48,
	        s: [0.315]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.886]
	        },
	        o: {
	          x: [0.167],
	          y: [0.206]
	        },
	        t: 49,
	        s: [-0.854]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.976]
	        },
	        o: {
	          x: [0.167],
	          y: [0.311]
	        },
	        t: 50,
	        s: [-1.651]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.681]
	        },
	        o: {
	          x: [0.167],
	          y: [-0.035]
	        },
	        t: 51,
	        s: [-1.942]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.807]
	        },
	        o: {
	          x: [0.167],
	          y: [0.113]
	        },
	        t: 52,
	        s: [-1.736]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.836]
	        },
	        o: {
	          x: [0.167],
	          y: [0.147]
	        },
	        t: 53,
	        s: [-1.153]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.855]
	        },
	        o: {
	          x: [0.167],
	          y: [0.169]
	        },
	        t: 54,
	        s: [-0.387]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.878]
	        },
	        o: {
	          x: [0.167],
	          y: [0.196]
	        },
	        t: 55,
	        s: [0.357]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.934]
	        },
	        o: {
	          x: [0.167],
	          y: [0.262]
	        },
	        t: 56,
	        s: [0.907]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.446]
	        },
	        o: {
	          x: [0.167],
	          y: [-0.311]
	        },
	        t: 57,
	        s: [1.164]
	      }, {
	        i: {
	          x: [0.833],
	          y: [0.833]
	        },
	        o: {
	          x: [0.167],
	          y: [0.098]
	        },
	        t: 58,
	        s: [1.11]
	      }, {
	        t: 59,
	        s: [0.803]
	      }],
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 0,
	        s: [20.644, 34, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 1,
	        s: [20.644, 34, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 2,
	        s: [20.644, 34, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 3,
	        s: [20.644, 34, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 4,
	        s: [20.644, 34, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 5,
	        s: [20.644, 34, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 6,
	        s: [20.644, 34, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 7,
	        s: [20.644, 34, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 8,
	        s: [20.644, 34, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 9,
	        s: [20.644, 34, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.703
	        },
	        o: {
	          x: 0.167,
	          y: 0.083
	        },
	        t: 10,
	        s: [20.644, 34, 0],
	        to: [0.003, 0.042, 0],
	        ti: [-0.012, -0.149, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.803
	        },
	        o: {
	          x: 0.167,
	          y: 0.116
	        },
	        t: 11,
	        s: [20.665, 34.251, 0],
	        to: [0.012, 0.149, 0],
	        ti: [-0.021, -0.253, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.826
	        },
	        o: {
	          x: 0.167,
	          y: 0.144
	        },
	        t: 12,
	        s: [20.719, 34.895, 0],
	        to: [0.021, 0.253, 0],
	        ti: [-0.025, -0.306, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.84
	        },
	        o: {
	          x: 0.167,
	          y: 0.16
	        },
	        t: 13,
	        s: [20.792, 35.772, 0],
	        to: [0.025, 0.306, 0],
	        ti: [-0.025, -0.306, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.856
	        },
	        o: {
	          x: 0.167,
	          y: 0.174
	        },
	        t: 14,
	        s: [20.871, 36.728, 0],
	        to: [0.025, 0.306, 0],
	        ti: [-0.021, -0.254, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.884
	        },
	        o: {
	          x: 0.167,
	          y: 0.197
	        },
	        t: 15,
	        s: [20.945, 37.607, 0],
	        to: [0.021, 0.254, 0],
	        ti: [-0.012, -0.149, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.897
	        },
	        o: {
	          x: 0.167,
	          y: 0.297
	        },
	        t: 16,
	        s: [20.998, 38.249, 0],
	        to: [0.012, 0.149, 0],
	        ti: [-0.004, -0.052, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.865
	        },
	        o: {
	          x: 0.167,
	          y: 0.44
	        },
	        t: 17,
	        s: [21.019, 38.5, 0],
	        to: [0.004, 0.052, 0],
	        ti: [-0.001, -0.016, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.895
	        },
	        o: {
	          x: 0.167,
	          y: 0.218
	        },
	        t: 18,
	        s: [21.024, 38.559, 0],
	        to: [0.001, 0.016, 0],
	        ti: [-0.001, -0.007, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.759
	        },
	        o: {
	          x: 0.167,
	          y: 0.419
	        },
	        t: 19,
	        s: [21.027, 38.595, 0],
	        to: [0.001, 0.007, 0],
	        ti: [0, 0.001, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.746
	        },
	        o: {
	          x: 0.167,
	          y: 0.13
	        },
	        t: 20,
	        s: [21.028, 38.604, 0],
	        to: [0, -0.001, 0],
	        ti: [0.001, 0.009, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.816
	        },
	        o: {
	          x: 0.167,
	          y: 0.124
	        },
	        t: 21,
	        s: [21.026, 38.587, 0],
	        to: [-0.001, -0.009, 0],
	        ti: [0.001, 0.013, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.841
	        },
	        o: {
	          x: 0.167,
	          y: 0.153
	        },
	        t: 22,
	        s: [21.023, 38.552, 0],
	        to: [-0.001, -0.013, 0],
	        ti: [0.001, 0.013, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.86
	        },
	        o: {
	          x: 0.167,
	          y: 0.175
	        },
	        t: 23,
	        s: [21.02, 38.51, 0],
	        to: [-0.001, -0.013, 0],
	        ti: [0.001, 0.011, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.886
	        },
	        o: {
	          x: 0.167,
	          y: 0.206
	        },
	        t: 24,
	        s: [21.017, 38.473, 0],
	        to: [-0.001, -0.011, 0],
	        ti: [0, 0.006, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.857
	        },
	        o: {
	          x: 0.167,
	          y: 0.31
	        },
	        t: 25,
	        s: [21.015, 38.447, 0],
	        to: [0, -0.006, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.681
	        },
	        o: {
	          x: 0.167,
	          y: 0.202
	        },
	        t: 26,
	        s: [21.014, 38.437, 0],
	        to: [0, 0, 0],
	        ti: [0, -0.004, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.807
	        },
	        o: {
	          x: 0.167,
	          y: 0.113
	        },
	        t: 27,
	        s: [21.014, 38.444, 0],
	        to: [0, 0.004, 0],
	        ti: [-0.001, -0.007, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.836
	        },
	        o: {
	          x: 0.167,
	          y: 0.147
	        },
	        t: 28,
	        s: [21.016, 38.463, 0],
	        to: [0.001, 0.007, 0],
	        ti: [-0.001, -0.008, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.855
	        },
	        o: {
	          x: 0.167,
	          y: 0.169
	        },
	        t: 29,
	        s: [21.018, 38.488, 0],
	        to: [0.001, 0.008, 0],
	        ti: [-0.001, -0.007, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.878
	        },
	        o: {
	          x: 0.167,
	          y: 0.196
	        },
	        t: 30,
	        s: [21.02, 38.512, 0],
	        to: [0.001, 0.007, 0],
	        ti: [0, -0.004, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.861
	        },
	        o: {
	          x: 0.167,
	          y: 0.262
	        },
	        t: 31,
	        s: [21.022, 38.53, 0],
	        to: [0, 0.004, 0],
	        ti: [0, -0.001, 0]
	      }, {
	        i: {
	          x: 0.864,
	          y: 0
	        },
	        o: {
	          x: 0.167,
	          y: 0.216
	        },
	        t: 32,
	        s: [21.022, 38.538, 0],
	        to: [0, 0.001, 0],
	        ti: [0.001, 0.006, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.272
	        },
	        o: {
	          x: 0.167,
	          y: 0.09
	        },
	        t: 33,
	        s: [21.022, 38.536, 0],
	        to: [-0.001, -0.006, 0],
	        ti: [0.008, 0.1, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.834
	        },
	        o: {
	          x: 0.167,
	          y: 0.094
	        },
	        t: 34,
	        s: [21.019, 38.5, 0],
	        to: [-0.008, -0.1, 0],
	        ti: [0.016, 0.188, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.168
	        },
	        t: 35,
	        s: [20.972, 37.934, 0],
	        to: [-0.016, -0.188, 0],
	        ti: [0.016, 0.187, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.834
	        },
	        o: {
	          x: 0.167,
	          y: 0.166
	        },
	        t: 36,
	        s: [20.925, 37.375, 0],
	        to: [-0.016, -0.187, 0],
	        ti: [0.016, 0.188, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 37,
	        s: [20.878, 36.812, 0],
	        to: [-0.016, -0.188, 0],
	        ti: [0.016, 0.187, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 38,
	        s: [20.832, 36.25, 0],
	        to: [-0.016, -0.187, 0],
	        ti: [0.016, 0.187, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.834
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 39,
	        s: [20.785, 35.688, 0],
	        to: [-0.016, -0.187, 0],
	        ti: [0.016, 0.187, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.832
	        },
	        o: {
	          x: 0.167,
	          y: 0.167
	        },
	        t: 40,
	        s: [20.738, 35.125, 0],
	        to: [-0.016, -0.187, 0],
	        ti: [0.016, 0.188, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.825
	        },
	        o: {
	          x: 0.167,
	          y: 0.165
	        },
	        t: 41,
	        s: [20.691, 34.568, 0],
	        to: [-0.016, -0.188, 0],
	        ti: [0.017, 0.199, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.865
	        },
	        o: {
	          x: 0.167,
	          y: 0.159
	        },
	        t: 42,
	        s: [20.644, 34, 0],
	        to: [-0.017, -0.199, 0],
	        ti: [0.014, 0.169, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.895
	        },
	        o: {
	          x: 0.167,
	          y: 0.218
	        },
	        t: 43,
	        s: [20.592, 33.375, 0],
	        to: [-0.014, -0.169, 0],
	        ti: [0.007, 0.08, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.767
	        },
	        o: {
	          x: 0.167,
	          y: 0.405
	        },
	        t: 44,
	        s: [20.56, 32.989, 0],
	        to: [-0.007, -0.08, 0],
	        ti: [-0.001, -0.015, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.745
	        },
	        o: {
	          x: 0.167,
	          y: 0.13
	        },
	        t: 45,
	        s: [20.552, 32.897, 0],
	        to: [0.001, 0.015, 0],
	        ti: [-0.008, -0.092, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.816
	        },
	        o: {
	          x: 0.167,
	          y: 0.124
	        },
	        t: 46,
	        s: [20.567, 33.077, 0],
	        to: [0.008, 0.092, 0],
	        ti: [-0.011, -0.136, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.841
	        },
	        o: {
	          x: 0.167,
	          y: 0.153
	        },
	        t: 47,
	        s: [20.598, 33.446, 0],
	        to: [0.011, 0.136, 0],
	        ti: [-0.012, -0.142, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.86
	        },
	        o: {
	          x: 0.167,
	          y: 0.175
	        },
	        t: 48,
	        s: [20.635, 33.891, 0],
	        to: [0.012, 0.142, 0],
	        ti: [-0.009, -0.113, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.886
	        },
	        o: {
	          x: 0.167,
	          y: 0.206
	        },
	        t: 49,
	        s: [20.669, 34.296, 0],
	        to: [0.009, 0.113, 0],
	        ti: [-0.005, -0.063, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.857
	        },
	        o: {
	          x: 0.167,
	          y: 0.311
	        },
	        t: 50,
	        s: [20.692, 34.571, 0],
	        to: [0.005, 0.063, 0],
	        ti: [0, -0.005, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.685
	        },
	        o: {
	          x: 0.167,
	          y: 0.199
	        },
	        t: 51,
	        s: [20.7, 34.672, 0],
	        to: [0, 0.005, 0],
	        ti: [0.004, 0.045, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.807
	        },
	        o: {
	          x: 0.167,
	          y: 0.113
	        },
	        t: 52,
	        s: [20.694, 34.601, 0],
	        to: [-0.004, -0.045, 0],
	        ti: [0.006, 0.078, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.836
	        },
	        o: {
	          x: 0.167,
	          y: 0.147
	        },
	        t: 53,
	        s: [20.677, 34.399, 0],
	        to: [-0.006, -0.078, 0],
	        ti: [0.007, 0.087, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.855
	        },
	        o: {
	          x: 0.167,
	          y: 0.169
	        },
	        t: 54,
	        s: [20.655, 34.134, 0],
	        to: [-0.007, -0.087, 0],
	        ti: [0.006, 0.075, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.878
	        },
	        o: {
	          x: 0.167,
	          y: 0.196
	        },
	        t: 55,
	        s: [20.634, 33.877, 0],
	        to: [-0.006, -0.075, 0],
	        ti: [0.004, 0.047, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.89
	        },
	        o: {
	          x: 0.167,
	          y: 0.262
	        },
	        t: 56,
	        s: [20.618, 33.686, 0],
	        to: [-0.004, -0.047, 0],
	        ti: [0.001, 0.012, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.615
	        },
	        o: {
	          x: 0.167,
	          y: 0.335
	        },
	        t: 57,
	        s: [20.611, 33.598, 0],
	        to: [-0.001, -0.012, 0],
	        ti: [-0.002, -0.021, 0]
	      }, {
	        i: {
	          x: 0.833,
	          y: 0.833
	        },
	        o: {
	          x: 0.167,
	          y: 0.106
	        },
	        t: 58,
	        s: [20.612, 33.616, 0],
	        to: [0.002, 0.021, 0],
	        ti: [-0.001, -0.018, 0]
	      }, {
	        t: 59,
	        s: [20.621, 33.722, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19.644, 36, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0.869, -0.456], [-0.593, -0.701], [0, 0], [0, 0], [0, 0], [0.402, -0.32], [0.309, 0.305], [0, 0], [0, 0], [0, 0], [0.178, 0.143], [0, 0], [0.628, -0.629], [-0.518, -0.58], [0, 0], [0, 0], [0, 0], [0, 0], [0.133, -0.141], [0.248, 0.131], [0, 0], [0, 0], [0.529, -0.53], [-0.41, -0.685], [0, 0], [0, 0], [0, 0], [-1.492, -1.606], [0, 0], [0, 0], [0.19, -0.169], [0.155, 0.066], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.163, -0.132], [-0.511, -0.888], [0, 0], [-1.412, -1.566], [0, 0], [-0.605, -1.17], [0, 0], [-2.284, 0], [-2.755, 3.049], [0, 0], [0, 0], [0.004, 0.391], [0, 0], [-1.496, 4.072], [0, 0], [0, 0], [1.957, -1.789], [0.973, -1.558], [0, 0], [0, 0], [0.675, -0.021], [0.499, 0.435], [0, 0], [0, 0]],
	            o: [[-0.874, 0.458], [0, 0], [0, 0], [0, 0], [0.131, 0.159], [-0.289, 0.23], [0, 0], [0, 0], [0, 0], [-0.491, -0.472], [0, 0], [-0.623, -0.397], [-0.629, 0.628], [0, 0], [0, 0], [0, 0], [0, 0], [0.24, 0.271], [-0.119, 0.127], [0, 0], [0, 0], [-0.33, -0.3], [-0.61, 0.609], [0, 0], [0, 0], [0, 0], [0.529, 0.624], [0, 0], [0, 0], [0.134, 0.133], [-0.168, 0.15], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [-0.359, -0.357], [-0.552, 0.446], [0, 0], [0.692, 1.085], [0, 0], [1.016, 1.126], [0, 0], [1.935, 0.825], [4.317, 0], [0, 0], [0, 0], [-0.069, -0.638], [0, 0], [0.052, -0.963], [0, 0], [0, 0], [-0.051, -0.397], [-0.832, 0.76], [0, 0], [0, 0], [-0.281, 0.477], [-0.618, 0.019], [0, 0], [0, 0], [-0.699, -0.635]],
	            v: [[-7.988, -12.021], [-8.379, -10.314], [-8.279, -10.202], [-1.107, -2.879], [-1.078, -2.847], [-1.196, -1.992], [-2.093, -2.105], [-6.427, -6.486], [-8.886, -8.929], [-9.551, -9.573], [-10.555, -10.496], [-10.655, -10.57], [-12.527, -10.347], [-12.628, -7.97], [-12.232, -7.561], [-11.103, -6.429], [-4.312, 0.304], [-3.596, 1.025], [-3.571, 1.823], [-4.303, 1.935], [-4.381, 1.881], [-12.288, -5.995], [-13.726, -5.697], [-13.747, -3.375], [-13.694, -3.295], [-13.607, -3.179], [-13.336, -2.851], [-10.304, 0.494], [-8.537, 2.386], [-6.348, 4.711], [-6.332, 5.425], [-6.99, 5.603], [-7.038, 5.571], [-11.603, 0.734], [-11.799, 0.532], [-12.332, -0.038], [-12.53, -0.241], [-13.379, -0.722], [-13.364, 1.832], [-13.231, 2.05], [-8.994, 7.552], [-8.577, 8.009], [-6.332, 11.177], [-6.521, 11.101], [-0.15, 12.387], [10.884, 7.387], [10.85, 7.126], [10.784, 6.55], [10.676, 5.008], [10.679, 4.779], [13.002, -2.773], [13.457, -3.998], [14.372, -6.409], [11.525, -6.687], [8.965, -3.364], [8.563, -2.711], [7.981, -1.734], [6.737, -0.833], [4.981, -1.612], [4.848, -1.732], [-5.48, -11.51]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ind: 1,
	        ty: "sh",
	        ix: 2,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0, 0], [0, 0], [0, 0], [0.998, -0.731], [0, 0], [0.159, -0.103], [0, 0], [0.348, -0.186], [0.182, -0.088], [0.517, -0.192], [0.85, -0.169], [0, 0], [0, 0], [0, 0], [0.527, -0.013], [0, 0], [0.21, 0.007], [0.368, 0.035], [0, 0], [0, 0], [0, 0], [0.282, 0.06], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [1.119, 1.241], [0, 0], [0, 0], [0, 0], [0, 0], [0.47, 0.817], [-1.092, 1.029], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [-1.122, 1.122], [-0.177, 0.121], [0, 0], [0, 0], [0, 0], [-0.788, 1.044], [0, 0], [0, 0], [-1.101, -0.464], [0, 0], [0, 0], [0, 0], [-0.457, 0.309], [0, 0], [0, 0], [-1.173, -1.078], [0, 0], [0, 0], [-0.165, -0.075], [0, 0], [0, 0], [0, 0], [-1.078, 0.985], [-1.187, -0.627], [-0.153, -0.722], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0.047, -0.719], [0, 0], [-0.069, -0.65]],
	            o: [[0, 0], [0, 0], [-0.819, 0.926], [0, 0], [-0.156, 0.109], [0, 0], [-0.335, 0.21], [-0.178, 0.096], [-0.492, 0.242], [-0.803, 0.298], [0, 0], [0, 0], [0, 0], [-0.516, 0.064], [0, 0], [-0.212, 0], [-0.375, -0.012], [0, 0], [0, 0], [0, 0], [-0.287, -0.047], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [-0.688, -1.48], [0, 0], [0, 0], [0, 0], [0, 0], [-1.336, -1.65], [-0.82, -1.424], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [-0.794, -1.329], [0.159, -0.159], [0, 0], [0, 0], [0, 0], [-0.636, -1.1], [0, 0], [0, 0], [0.949, -0.949], [0, 0], [0, 0], [0, 0], [0.193, -0.405], [0, 0], [0, 0], [1.444, -0.758], [0, 0], [0, 0], [0.226, 0.213], [0, 0], [0, 0], [0, 0], [1.444, -2.409], [1.295, -1.183], [0.777, 0.41], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [-1.284, 3.531], [0, 0], [-0.005, 0.348], [0, 0]],
	            v: [[12.293, 6.371], [12.589, 8.059], [12.297, 8.399], [9.562, 10.895], [9.255, 11.115], [8.783, 11.433], [8.56, 11.576], [7.535, 12.171], [6.995, 12.447], [5.48, 13.098], [2.998, 13.801], [2.618, 13.872], [2.235, 13.933], [1.85, 13.986], [0.286, 14.102], [-0.11, 14.107], [-0.744, 14.096], [-1.86, 14.025], [-2.108, 14], [-2.634, 13.935], [-3.068, 13.87], [-3.922, 13.71], [-4.35, 13.614], [-4.806, 13.499], [-5.248, 13.375], [-5.597, 13.269], [-5.982, 13.142], [-6.167, 13.078], [-6.597, 12.919], [-6.941, 12.783], [-6.945, 12.757], [-7.302, 12.607], [-9.687, 9.017], [-10.273, 8.371], [-10.627, 7.961], [-10.988, 7.53], [-11.364, 7.07], [-14.664, 2.58], [-14.458, -1.77], [-14.414, -1.809], [-14.687, -2.137], [-14.847, -2.339], [-14.966, -2.5], [-15.035, -2.605], [-14.787, -6.758], [-14.281, -7.178], [-14.101, -7.291], [-14.02, -7.337], [-14.082, -7.436], [-13.854, -11.103], [-13.723, -11.263], [-13.588, -11.408], [-10.376, -12.113], [-10.193, -12.03], [-10.073, -11.967], [-10.041, -12.04], [-9.064, -13.124], [-8.86, -13.252], [-8.685, -13.349], [-4.477, -12.627], [-4.327, -12.483], [5.878, -2.823], [6.496, -2.386], [6.573, -2.356], [6.599, -2.349], [7.077, -3.151], [10.513, -7.795], [14.364, -8.694], [15.832, -6.768], [15.86, -6.603], [15.909, -6.226], [15.172, -4.295], [14.598, -2.76], [14.195, -1.661], [12.178, 4.816], [12.176, 4.877], [12.273, 6.376]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 2",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "mm",
	        mm: 1,
	        nm: "Merge Paths 1",
	        mn: "ADBE Vector Filter - Merge",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.823529481888, 0.607843160629, 0.235294133425, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [19.505, 21.893],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 1",
	      np: 4,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [19.644, 22.077],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [19.644, 22.077],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }, {
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[-0.92, 0.483], [-0.699, -0.635], [0, 0], [-0.675, 0.021], [-0.262, 0.428], [0, 0], [-0.992, 0.906], [-0.051, -0.397], [0, 0], [0.013, -1.034], [-0.352, -2.247], [4.315, 0], [1.646, 0.494], [0.093, 0.213], [0, 0], [1.333, 1.477], [0, 0], [0.511, 0.888], [-0.552, 0.446], [-0.593, -0.593], [0, 0], [-0.189, 0.169], [0.134, 0.133], [0, 0], [0.192, 0.321], [-0.61, 0.61], [-0.33, -0.3], [0, 0], [-0.217, -0.188], [-0.132, 0.142], [0.24, 0.271], [0, 0], [0.45, 0.505], [-0.629, 0.628], [-0.623, -0.397], [0, 0], [-4.981, -5.063], [-0.289, 0.23], [0.131, 0.159], [0, 0], [0, 0]],
	            o: [[0.869, -0.456], [0, 0], [0.515, 0.485], [0.623, -0.019], [0, 0], [1.274, -2.126], [1.957, -1.789], [0, 0], [-2.035, 5.386], [-0.011, 0.853], [-2.99, 2.818], [-1.835, 0], [-0.08, -0.199], [0, 0], [-0.829, -1.85], [0, 0], [-1.509, -1.632], [-0.511, -0.888], [0.305, -0.247], [0, 0], [0.117, 0.121], [0.19, -0.169], [0, 0], [-2.355, -2.528], [-0.409, -0.685], [0.529, -0.529], [0, 0], [1.449, 1.431], [0.241, 0.211], [0.133, -0.141], [0, 0], [-1.791, -1.787], [-0.518, -0.579], [0.628, -0.629], [0, 0], [0.661, 0.532], [0.309, 0.305], [0.402, -0.32], [0, 0], [0, 0], [-0.702, -0.756]],
	            v: [[-8.006, -12.822], [-5.498, -12.311], [4.83, -2.534], [6.719, -1.635], [7.897, -2.428], [8.357, -3.201], [11.507, -7.488], [14.354, -7.21], [13.73, -5.572], [10.658, 4.057], [11.169, 8.708], [-0.134, 13.279], [-5.374, 12.516], [-5.632, 11.902], [-5.776, 11.574], [-8.595, 7.208], [-8.853, 6.926], [-13.382, 1.031], [-13.397, -1.523], [-11.621, -0.068], [-7.056, 4.77], [-6.35, 4.624], [-6.366, 3.91], [-9.946, 0.096], [-13.766, -4.176], [-13.744, -6.499], [-12.306, -6.796], [-12.001, -6.499], [-4.399, 1.079], [-3.589, 1.021], [-3.614, 0.223], [-4.078, -0.245], [-12.646, -8.773], [-12.545, -11.148], [-10.673, -11.372], [-10.574, -11.299], [-2.111, -2.906], [-1.214, -2.794], [-1.096, -3.648], [-1.125, -3.68], [-8.297, -11.003]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [1, 1, 1, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [19.481, 22.593],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 2",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [19.588, 22.715],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [19.588, 22.715],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 2",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 2,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 60,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 2,
	  ty: 4,
	  nm: "Group 7",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 10,
	        s: [13.129, 19.446, 0],
	        to: [0, -1.146, 0],
	        ti: [0, 1.146, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 17,
	        s: [13.129, 12.571, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 37,
	        s: [13.129, 12.571, 0],
	        to: [0, 1.208, 0],
	        ti: [0, -1.208, 0]
	      }, {
	        t: 42,
	        s: [13.129, 19.821, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [10.629, 12.321, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        d: 1,
	        ty: "el",
	        s: {
	          a: 0,
	          k: [5, 5],
	          ix: 2
	        },
	        p: {
	          a: 0,
	          k: [0, 0],
	          ix: 3
	        },
	        nm: "Ellipse Path 1",
	        mn: "ADBE Vector Shape - Ellipse",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [10.629, 12.321],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 3",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [10.629, 12.321],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [10.629, 12.321],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 3",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 60,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 3,
	  ty: 4,
	  nm: "Group 6",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 10,
	        s: [25.712, 19.446, 0],
	        to: [0, -1.146, 0],
	        ti: [0, 1.146, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 17,
	        s: [25.712, 12.571, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 37,
	        s: [25.712, 12.571, 0],
	        to: [0, 1.208, 0],
	        ti: [0, -1.208, 0]
	      }, {
	        t: 42,
	        s: [25.712, 19.821, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [23.212, 12.321, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        d: 1,
	        ty: "el",
	        s: {
	          a: 0,
	          k: [5, 5],
	          ix: 2
	        },
	        p: {
	          a: 0,
	          k: [0, 0],
	          ix: 3
	        },
	        nm: "Ellipse Path 1",
	        mn: "ADBE Vector Shape - Ellipse",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [23.212, 12.321],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 2",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [23.212, 12.321],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [23.212, 12.321],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 2",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 60,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 4,
	  ty: 4,
	  nm: "Group 2",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 10,
	        s: [25.514, 12.161, 0],
	        to: [0, -0.854, 0],
	        ti: [0, 0.854, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 17,
	        s: [25.514, 7.036, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 37,
	        s: [25.514, 7.036, 0],
	        to: [0, 0.854, 0],
	        ti: [0, -0.854, 0]
	      }, {
	        t: 42,
	        s: [25.514, 12.161, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [24.514, 17.911, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[-0.268, 0.008], [-1.033, 0.845], [-0.252, 0.549], [0.072, 0.132], [0, 0], [0.268, -0.399], [0.347, -0.284], [1.185, -0.154], [-0.181, -0.335]],
	            o: [[1.483, -0.047], [0.534, -0.437], [0.063, -0.14], [0, 0], [-0.22, -0.406], [-0.227, 0.336], [-0.849, 0.694], [-0.437, 0.057], [0.109, 0.203]],
	            v: [[-2.484, 2.023], [1.426, 0.695], [3.225, -1.137], [3.205, -1.564], [3.184, -1.604], [2.012, -1.633], [0.526, -0.361], [-2.601, 0.906], [-3.107, 1.71]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [24.464, 17.859],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 2",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [24.514, 17.911],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [24.514, 17.911],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 2",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 60,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 5,
	  ty: 4,
	  nm: "Group 1",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 1,
	      k: [{
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 10,
	        s: [13.776, 12.161, 0],
	        to: [0, -0.857, 0],
	        ti: [0, 0.857, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 0.667
	        },
	        o: {
	          x: 0.333,
	          y: 0.333
	        },
	        t: 17,
	        s: [13.776, 7.021, 0],
	        to: [0, 0, 0],
	        ti: [0, 0, 0]
	      }, {
	        i: {
	          x: 0.667,
	          y: 1
	        },
	        o: {
	          x: 0.333,
	          y: 0
	        },
	        t: 37,
	        s: [13.776, 7.021, 0],
	        to: [0, 0.857, 0],
	        ti: [0, -0.857, 0]
	      }, {
	        t: 42,
	        s: [13.776, 12.161, 0]
	      }],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [12.776, 17.896, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0.268, 0.008], [1.033, 0.845], [0.252, 0.549], [-0.071, 0.132], [0, 0], [-0.269, -0.399], [-0.347, -0.284], [-1.185, -0.154], [0.181, -0.335]],
	            o: [[-1.483, -0.046], [-0.534, -0.437], [-0.064, -0.14], [0, 0], [0.219, -0.406], [0.226, 0.336], [0.849, 0.694], [0.438, 0.057], [-0.11, 0.203]],
	            v: [[2.484, 2.023], [-1.426, 0.695], [-3.225, -1.137], [-3.206, -1.564], [-3.184, -1.604], [-2.012, -1.633], [-0.525, -0.361], [2.6, 0.906], [3.107, 1.71]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [12.826, 17.844],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 1",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [12.776, 17.896],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [12.776, 17.896],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 60,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 6,
	  ty: 4,
	  nm: "Group 4",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20, 17, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19, 19, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-9.389, 0], [0, -9.389], [9.389, 0], [0, 9.389]],
	          o: [[9.389, 0], [0, 9.389], [-9.389, 0], [0, -9.389]],
	          v: [[0, -17], [17, 0], [0, 17], [-17, 0]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.964705942191, 0.878431432387, 0.443137284821, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [19, 19],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 4",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 60,
	  st: 0,
	  bm: 0
	}];
	var markers$5 = [];
	var facepalmAnimatedEmojiData = {
	  v: v$5,
	  fr: fr$5,
	  ip: ip$5,
	  op: op$5,
	  w: w$5,
	  h: h$5,
	  nm: nm$5,
	  ddd: ddd$5,
	  assets: assets$5,
	  layers: layers$5,
	  markers: markers$5
	};

	var v$6 = "5.9.1";
	var fr$6 = 25;
	var ip$6 = 0;
	var op$6 = 21;
	var w$6 = 40;
	var h$6 = 40;
	var nm$6 = "em_07";
	var ddd$6 = 0;
	var assets$6 = [];
	var layers$6 = [{
	  ddd: 0,
	  ind: 1,
	  ty: 4,
	  nm: "Group 1 :M 2",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20.142, 10.824, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19.142, 12.824, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[1.007, 0.088], [0.848, -0.551], [0.007, -0.072], [0, 0], [-0.156, 0.074], [-0.788, -0.069], [-0.746, -0.701], [-0.015, 0.19], [0, 0], [0.052, 0.048]],
	            o: [[-1.008, -0.088], [-0.06, 0.039], [0, 0], [-0.015, 0.173], [0.702, -0.335], [1.017, 0.089], [0.137, 0.13], [0, 0], [0.006, -0.072], [-0.743, -0.689]],
	            v: [[0.132, -1.337], [-2.693, -0.592], [-2.798, -0.415], [-2.854, 0.247], [-2.537, 0.475], [-0.284, 0.053], [2.394, 1.294], [2.77, 1.146], [2.862, 0.074], [2.789, -0.117]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [13.201, 12.822],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 1",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [13.206, 12.824],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [13.206, 12.824],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 1",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }, {
	    ty: "gr",
	    it: [{
	      ty: "gr",
	      it: [{
	        ind: 0,
	        ty: "sh",
	        ix: 1,
	        ks: {
	          a: 0,
	          k: {
	            i: [[0, 0], [0.077, 0.049], [0.998, -0.088], [0.739, -0.676], [-0.008, -0.093], [0, 0], [-0.18, 0.161], [-0.974, 0.085], [-0.674, -0.302], [0.019, 0.224]],
	            o: [[-0.008, -0.092], [-0.841, -0.539], [-0.996, 0.086], [-0.068, 0.062], [0, 0], [0.021, 0.243], [0.729, -0.651], [0.751, -0.066], [0.202, 0.091], [0, 0]],
	            v: [[2.802, -0.355], [2.668, -0.582], [-0.129, -1.308], [-2.763, -0.112], [-2.857, 0.136], [-2.78, 1.044], [-2.296, 1.235], [0.286, 0.081], [2.44, 0.457], [2.846, 0.165]],
	            c: true
	          },
	          ix: 2
	        },
	        nm: "Path 1",
	        mn: "ADBE Vector Shape - Group",
	        hd: false
	      }, {
	        ty: "fl",
	        c: {
	          a: 0,
	          k: [0.47058826685, 0.243137270212, 0.066666670144, 1],
	          ix: 4
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 5
	        },
	        r: 1,
	        bm: 0,
	        nm: "Fill 1",
	        mn: "ADBE Vector Graphic - Fill",
	        hd: false
	      }, {
	        ty: "tr",
	        p: {
	          a: 0,
	          k: [25.09, 12.794],
	          ix: 2
	        },
	        a: {
	          a: 0,
	          k: [0, 0],
	          ix: 1
	        },
	        s: {
	          a: 0,
	          k: [100, 100],
	          ix: 3
	        },
	        r: {
	          a: 0,
	          k: 0,
	          ix: 6
	        },
	        o: {
	          a: 0,
	          k: 100,
	          ix: 7
	        },
	        sk: {
	          a: 0,
	          k: 0,
	          ix: 4
	        },
	        sa: {
	          a: 0,
	          k: 0,
	          ix: 5
	        },
	        nm: "Transform"
	      }],
	      nm: "Group 2",
	      np: 2,
	      cix: 2,
	      bm: 0,
	      ix: 1,
	      mn: "ADBE Vector Group",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [25.085, 12.787],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [25.085, 12.787],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 2",
	    np: 1,
	    cix: 2,
	    bm: 0,
	    ix: 2,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 21,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 2,
	  ty: 4,
	  nm: "Group 3",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20, 22.427, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19, 24.428, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 1,
	      k: [{
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 0,
	        s: [100, 100, 100]
	      }, {
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 3,
	        s: [80, 80, 100]
	      }, {
	        i: {
	          x: [0.667, 0.667, 0.667],
	          y: [1, 1, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 6,
	        s: [80, 80, 100]
	      }, {
	        i: {
	          x: [0.833, 0.833, 0.833],
	          y: [0.833, 0.833, 1]
	        },
	        o: {
	          x: [0.333, 0.333, 0.333],
	          y: [0, 0, 0]
	        },
	        t: 9,
	        s: [60, 60, 100]
	      }, {
	        i: {
	          x: [0.833, 0.833, 0.833],
	          y: [0.833, 0.833, 0.833]
	        },
	        o: {
	          x: [0.167, 0.167, 0.167],
	          y: [0.167, 0.167, 0.167]
	        },
	        t: 12,
	        s: [120, 120, 100]
	      }, {
	        i: {
	          x: [0.833, 0.833, 0.833],
	          y: [0.833, 0.833, 0.833]
	        },
	        o: {
	          x: [0.167, 0.167, 0.167],
	          y: [0.167, 0.167, 0.167]
	        },
	        t: 15,
	        s: [120, 120, 100]
	      }, {
	        t: 19,
	        s: [100, 100, 100]
	      }],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[0.509, -0.209], [0.027, -1.264], [-0.023, -0.284], [-0.106, -0.326], [-0.559, -0.561], [-0.485, -0.355], [-0.778, -0.511], [0, 0], [-0.635, 0.418], [-0.643, 0.479], [-0.413, 0.45], [-0.151, 0.805], [-0.014, 0.29], [0.145, 0.412], [1.052, 0.491], [0.684, 0.057], [0.427, -0.052], [0.659, -0.392], [0.368, -0.456], [0.011, -0.012], [0.054, 0.062], [0.857, 0.335], [0.578, 0.046], [0.163, 0], [0.217, -0.021]],
	          o: [[-1.497, 0.615], [-0.006, 0.285], [0.026, 0.337], [0.222, 0.685], [0.408, 0.408], [0.741, 0.542], [0.662, 0.435], [0, 0], [0.68, -0.448], [0.512, -0.385], [0.611, -0.669], [0.054, -0.287], [0.021, -0.424], [-0.319, -0.905], [-0.587, -0.273], [-0.43, -0.036], [-0.827, 0.1], [-0.556, 0.329], [-0.011, 0.012], [-0.063, -0.068], [-0.534, -0.603], [-0.517, -0.202], [-0.165, -0.013], [-0.217, 0], [-0.575, 0.057]],
	          v: [[-6.65, -5.389], [-9.039, -2.352], [-9, -1.499], [-8.792, -0.505], [-7.601, 1.357], [-6.246, 2.491], [-3.946, 4.051], [0.028, 5.829], [4.388, 3.751], [6.389, 2.374], [7.798, 1.135], [8.927, -1.079], [9.024, -1.945], [8.875, -3.204], [6.828, -5.305], [4.917, -5.792], [3.63, -5.775], [1.405, -5.029], [0.028, -3.844], [-0.004, -3.807], [-0.172, -4.001], [-2.237, -5.426], [-3.88, -5.798], [-4.372, -5.818], [-5.022, -5.786]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.941176530427, 0.239215701234, 0.215686289469, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [19.005, 24.422],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 3",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 21,
	  st: 0,
	  bm: 0
	}, {
	  ddd: 0,
	  ind: 3,
	  ty: 4,
	  nm: "Group 4",
	  sr: 1,
	  ks: {
	    o: {
	      a: 0,
	      k: 100,
	      ix: 11
	    },
	    r: {
	      a: 0,
	      k: 0,
	      ix: 10
	    },
	    p: {
	      a: 0,
	      k: [20, 17, 0],
	      ix: 2,
	      l: 2
	    },
	    a: {
	      a: 0,
	      k: [19, 19, 0],
	      ix: 1,
	      l: 2
	    },
	    s: {
	      a: 0,
	      k: [100, 100, 100],
	      ix: 6,
	      l: 2
	    }
	  },
	  ao: 0,
	  shapes: [{
	    ty: "gr",
	    it: [{
	      ind: 0,
	      ty: "sh",
	      ix: 1,
	      ks: {
	        a: 0,
	        k: {
	          i: [[-9.389, 0], [0, -9.389], [9.389, 0], [0, 9.389]],
	          o: [[9.389, 0], [0, 9.389], [-9.389, 0], [0, -9.389]],
	          v: [[0, -17], [17, 0], [0, 17], [-17, 0]],
	          c: true
	        },
	        ix: 2
	      },
	      nm: "Path 1",
	      mn: "ADBE Vector Shape - Group",
	      hd: false
	    }, {
	      ty: "fl",
	      c: {
	        a: 0,
	        k: [0.964705942191, 0.878431432387, 0.443137284821, 1],
	        ix: 4
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 5
	      },
	      r: 1,
	      bm: 0,
	      nm: "Fill 1",
	      mn: "ADBE Vector Graphic - Fill",
	      hd: false
	    }, {
	      ty: "tr",
	      p: {
	        a: 0,
	        k: [19, 19],
	        ix: 2
	      },
	      a: {
	        a: 0,
	        k: [0, 0],
	        ix: 1
	      },
	      s: {
	        a: 0,
	        k: [100, 100],
	        ix: 3
	      },
	      r: {
	        a: 0,
	        k: 0,
	        ix: 6
	      },
	      o: {
	        a: 0,
	        k: 100,
	        ix: 7
	      },
	      sk: {
	        a: 0,
	        k: 0,
	        ix: 4
	      },
	      sa: {
	        a: 0,
	        k: 0,
	        ix: 5
	      },
	      nm: "Transform"
	    }],
	    nm: "Group 4",
	    np: 2,
	    cix: 2,
	    bm: 0,
	    ix: 1,
	    mn: "ADBE Vector Group",
	    hd: false
	  }],
	  ip: 0,
	  op: 21,
	  st: 0,
	  bm: 0
	}];
	var markers$6 = [];
	var kissAnimatedEmojiData = {
	  v: v$6,
	  fr: fr$6,
	  ip: ip$6,
	  op: op$6,
	  w: w$6,
	  h: h$6,
	  nm: nm$6,
	  ddd: ddd$6,
	  assets: assets$6,
	  layers: layers$6,
	  markers: markers$6
	};

	var RatingRender = /*#__PURE__*/function () {
	  function RatingRender() {
	    babelHelpers.classCallCheck(this, RatingRender);
	  }

	  babelHelpers.createClass(RatingRender, null, [{
	    key: "getTopUsersText",
	    value: function getTopUsersText(params) {
	      var currentUserId = Number(main_core.Loc.getMessage('USER_ID'));
	      var you = !main_core.Type.isUndefined(params.you) ? !!params.you : false;
	      var topList = !main_core.Type.isUndefined(params.top) && main_core.Type.isArray(params.top) ? params.top : [];
	      var more = !main_core.Type.isUndefined(params.more) ? Number(params.more) : 0;
	      var result = '';

	      if (topList.length <= 0 && !you && (RatingManager.mobile || more <= 0)) {
	        return result;
	      }

	      if (RatingManager.mobile) {
	        if (you) {
	          topList.push({
	            ID: currentUserId,
	            NAME_FORMATTED: main_core.Loc.getMessage('RATING_LIKE_TOP_TEXT3_YOU'),
	            WEIGHT: 1
	          });
	        }

	        result = main_core.Loc.getMessage("RATING_LIKE_TOP_TEXT3_".concat(topList.length > 1 ? '2' : '1')).replace('#OVERFLOW_START#', RatingManager.mobile ? '<span class="feed-post-emoji-text-item-overflow">' : '').replace('#OVERFLOW_END#', RatingManager.mobile ? '</span>' : '');
	      } else {
	        result = main_core.Loc.getMessage("RATING_LIKE_TOP_TEXT2_".concat(you ? 'YOU_' : '').concat(topList.length).concat(more > 0 ? '_MORE' : '')).replace('#OVERFLOW_START#', RatingManager.mobile ? '<span class="feed-post-emoji-text-item-overflow">' : '').replace('#OVERFLOW_END#', RatingManager.mobile ? '</span>' : '').replace('#MORE_START#', RatingManager.mobile ? '<span class="feed-post-emoji-text-item-more">' : '&nbsp;').replace('#MORE_END#', RatingManager.mobile ? '</span>' : '');
	      }

	      if (RatingManager.mobile) {
	        topList.sort(function (a, b) {
	          if (parseInt(a.ID) === currentUserId) {
	            return -1;
	          }

	          if (parseInt(b.ID) === currentUserId) {
	            return 1;
	          }

	          if (parseFloat(a.WEIGHT) === parseFloat(b.WEIGHT)) {
	            return 0;
	          }

	          return parseFloat(a.WEIGHT) > parseFloat(b.WEIGHT) ? -1 : 1;
	        });
	        var userNameList = topList.map(function (item) {
	          return item.NAME_FORMATTED;
	        });
	        var userNameBegin = '';
	        var userNameEnd = '';

	        if (userNameList.length === 1) {
	          userNameBegin = userNameList.pop();
	          userNameEnd = '';
	        } else {
	          userNameBegin = userNameList.slice(0, userNameList.length - 1).join(main_core.Loc.getMessage('RATING_LIKE_TOP_TEXT3_USERLIST_SEPARATOR').replace(/#USERNAME#/g, ''));
	          userNameEnd = userNameList[userNameList.length - 1];
	        }

	        result = result.replace('#USER_LIST_BEGIN#', userNameBegin).replace('#USER_LIST_END#', userNameEnd);
	      } else {
	        topList.forEach(function (item, i) {
	          result = result.replace("#USER_".concat(Number(i) + 1, "#"), "<span class=\"feed-post-emoji-text-item\">".concat(item.NAME_FORMATTED, "</span>"));
	        });
	        result = result.replace('#USERS_MORE#', '<span class="feed-post-emoji-text-item">' + more + '</span>');
	      }

	      return result;
	    }
	  }, {
	    key: "getUserReaction",
	    value: function getUserReaction(params) {
	      return main_core.Type.isDomNode(params.userReactionNode) ? params.userReactionNode.getAttribute('data-value') : '';
	    }
	  }, {
	    key: "setReaction",
	    value: function setReaction(params) {
	      if (main_core.Type.isUndefined(params.rating) || !main_core.Type.isStringFilled(params.likeId)) {
	        return;
	      }

	      var action = main_core.Type.isStringFilled(params.action) ? params.action : 'add';

	      if (!['add', 'cancel', 'change'].includes(action)) {
	        return;
	      }

	      var likeId = params.likeId;
	      var rating = params.rating;
	      var userReaction = main_core.Type.isStringFilled(params.userReaction) ? params.userReaction : main_core.Loc.getMessage('RATING_LIKE_REACTION_DEFAULT');
	      var userReactionOld = main_core.Type.isStringFilled(params.userReactionOld) ? params.userReactionOld : main_core.Loc.getMessage('RATING_LIKE_REACTION_DEFAULT');

	      if (action === 'change' && userReaction === userReactionOld) {
	        return;
	      }

	      var totalCount = !main_core.Type.isUndefined(params.totalCount) ? Number(params.totalCount) : null;
	      var currentUserId = Number(main_core.Loc.getMessage('USER_ID'));
	      var userId = !main_core.Type.isUndefined(params.userId) ? Number(params.userId) : currentUserId;
	      var userReactionNode = this.getNode(rating.userReactionNode);
	      var reactionsNode = this.getNode(rating.reactionsNode);
	      var topPanel = this.getNode(rating.topPanel);
	      var topPanelContainer = this.getNode(rating.topPanelContainer);
	      var topUsersText = this.getNode(rating.topUsersText);
	      var countText = this.getNode(rating.countText);
	      var buttonText = this.getNode(rating.buttonText);

	      if (userId === currentUserId // not pull
	      && userReactionNode) {
	        userReactionNode.setAttribute('data-value', ['add', 'change'].includes(action) ? userReaction : '');
	      }
	      var elements = [];
	      var elementsNew = [];

	      if (totalCount !== null && topPanel && topUsersText && reactionsNode) {
	        if (totalCount > 0) {
	          topPanelContainer.classList.add('feed-post-emoji-top-panel-container-active');

	          if (!topPanel.classList.contains('feed-post-emoji-container-toggle')) {
	            topPanel.classList.add('feed-post-emoji-container-toggle');
	            topUsersText.classList.add('feed-post-emoji-move-to-right');
	            reactionsNode.classList.add('feed-post-emoji-icon-box-show');
	          }
	        } else if (totalCount <= 0) {
	          topPanelContainer.classList.remove('feed-post-emoji-top-panel-container-active');

	          if (topPanel.classList.contains('feed-post-emoji-container-toggle')) {
	            topPanel.classList.remove('feed-post-emoji-container-toggle');
	            topUsersText.classList.remove('feed-post-emoji-move-to-right');
	            reactionsNode.classList.remove('feed-post-emoji-icon-box-show');
	          }
	        }
	      }

	      if (totalCount !== null && countText) {
	        if (totalCount <= 0 && !countText.classList.contains('feed-post-emoji-text-counter-invisible')) {
	          countText.classList.add('feed-post-emoji-text-counter-invisible');
	        } else if (totalCount > 0 && countText.classList.contains('feed-post-emoji-text-counter-invisible')) {
	          countText.classList.remove('feed-post-emoji-text-counter-invisible');
	        }
	      }

	      if (reactionsNode) {
	        var reactionsContainer = reactionsNode.querySelector('.feed-post-emoji-icon-container');
	        elements = reactionsNode.querySelectorAll('.feed-post-emoji-icon-item');

	        if (reactionsContainer) {
	          var found = false;
	          var newValue = false;
	          elements.forEach(function (element) {
	            var reactionValue = element.getAttribute('data-reaction');
	            var reactionCount = Number(element.getAttribute('data-value'));

	            if (reactionValue === userReaction) {
	              found = true;

	              if (action === 'cancel') {
	                newValue = reactionCount > 0 ? reactionCount - 1 : 0;
	              } else if (['add', 'change'].includes(action)) {
	                newValue = reactionCount + 1;
	              }

	              if (newValue > 0 && newValue > reactionCount) {
	                elementsNew.push({
	                  reaction: reactionValue,
	                  count: newValue,
	                  animate: {
	                    type: 'pop'
	                  }
	                });
	              } else if (newValue > 0) {
	                elementsNew.push({
	                  reaction: reactionValue,
	                  count: reactionCount,
	                  animate: false
	                });
	              }
	            } else if (action === 'change' && reactionValue === userReactionOld) {
	              newValue = reactionCount > 0 ? reactionCount - 1 : 0;

	              if (newValue > 0) {
	                elementsNew.push({
	                  reaction: reactionValue,
	                  count: newValue,
	                  animate: false
	                });
	              }
	            } else {
	              elementsNew.push({
	                reaction: reactionValue,
	                count: reactionCount,
	                animate: false
	              });
	            }
	          });

	          if (['add', 'change'].includes(action) && !found) {
	            elementsNew.push({
	              reaction: userReaction,
	              count: 1,
	              animate: true
	            });
	          }

	          main_core.Dom.clean(reactionsContainer);

	          if (topPanel) {
	            if (elementsNew.length > 0) {
	              topPanel.classList.add('feed-post-emoji-container-nonempty');
	            } else {
	              topPanel.classList.remove('feed-post-emoji-container-nonempty');
	            }

	            if (RatingManager.mobile) {
	              var commentNode = topPanel.closest('.post-comment-block');

	              if (commentNode) {
	                if (elementsNew.length > 0) {
	                  commentNode.classList.add('comment-block-rating-nonempty');
	                } else {
	                  commentNode.classList.remove('comment-block-rating-nonempty');
	                }
	              }
	            }
	          }

	          this.drawReactions({
	            likeId: likeId,
	            container: reactionsContainer,
	            data: elementsNew
	          });
	        }
	      }

	      if (userId === currentUserId && buttonText) {
	        if (['add', 'change'].includes(action)) {
	          buttonText.innerHTML = main_core.Loc.getMessage("RATING_LIKE_EMOTION_".concat(userReaction.toUpperCase(), "_CALC"));

	          if (RatingManager.mobile) {
	            buttonText.parentElement.className = '';
	            buttonText.parentElement.classList.add('bx-ilike-left-wrap', 'bx-you-like-button', "bx-you-like-button-".concat(userReaction.toLowerCase()));
	          }
	        } else {
	          buttonText.innerHTML = main_core.Loc.getMessage('RATING_LIKE_EMOTION_LIKE_CALC');

	          if (RatingManager.mobile) {
	            buttonText.parentElement.className = 'bx-ilike-left-wrap';
	          }
	        }
	      }
	    }
	  }, {
	    key: "drawReactions",
	    value: function drawReactions(params) {
	      var _this = this;

	      var container = main_core.Type.isDomNode(params.container) ? params.container : null;
	      var data = main_core.Type.isArray(params.data) ? params.data : [];
	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : '';

	      if (!container || !main_core.Type.isStringFilled(likeId)) {
	        return;
	      }

	      var reactionEvents = RatingManager.mobile ? {} : {
	        click: this.resultReactionClick.bind(this),
	        mouseenter: this.resultReactionMouseEnter.bind(this),
	        mouseleave: this.resultReactionMouseLeave.bind(this)
	      };
	      main_core.Dom.clean(container);
	      var reactionsData = {};
	      data.forEach(function (element, i) {
	        var classList = ['feed-post-emoji-icon-item', "feed-post-emoji-icon-item-".concat(i + 1)];

	        if (element !== null && element !== void 0 && element.animate) {
	          var _element$animate;

	          if (((_element$animate = element.animate) === null || _element$animate === void 0 ? void 0 : _element$animate.type) === 'pop') {
	            classList.push('feed-post-emoji-animation-pop');
	          } else if (i >= 1) {
	            classList.push('feed-post-emoji-icon-animate');
	          } else if (data.length == 1) {
	            classList.push('feed-post-emoji-animation-pop');
	          }
	        }

	        var emojiContainer = main_core.Dom.create('div', {
	          props: {
	            id: "bx-ilike-result-reaction-".concat(element.reaction, "-").concat(likeId),
	            className: classList.join(' ')
	          },
	          attrs: {
	            'data-reaction': element.reaction,
	            'data-value': element.count,
	            'data-like-id': likeId,
	            title: main_core.Loc.getMessage("RATING_LIKE_EMOTION_".concat(element.reaction.toUpperCase(), "_CALC"))
	          },
	          events: reactionEvents
	        });
	        var animation = lottie.loadAnimation({
	          animationData: _this.reactionsAnimationData[element.reaction],
	          container: emojiContainer,
	          loop: false,
	          autoplay: false,
	          renderer: 'svg',
	          rendererSettings: {
	            viewBoxOnly: true
	          }
	        });

	        if (Boolean(element.animate)) {
	          setTimeout(function () {
	            animation.play();
	          }, 200);
	        }

	        container.appendChild(emojiContainer);
	        reactionsData[element.reaction] = element.count;
	      });
	      container.setAttribute('data-reactions-data', JSON.stringify(reactionsData));
	    }
	  }, {
	    key: "showReactionsPopup",
	    value: function showReactionsPopup(params) {
	      var _this2 = this;

	      var bindElement = this.getNode(params.bindElement);
	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : '';

	      if (!bindElement || !main_core.Type.isStringFilled(likeId)) {
	        return false;
	      }

	      this.reactionsPopupLikeId = likeId;

	      if (this.reactionsPopup === null) {
	        var reactionsNodesList = [];
	        this.reactionsList.forEach(function (currentEmotion, index) {
	          var emojiItem = main_core.Dom.create('div', {
	            props: {
	              className: "feed-post-emoji-icon-item"
	            },
	            attrs: {
	              'data-reaction': currentEmotion,
	              title: main_core.Loc.getMessage("RATING_LIKE_EMOTION_".concat(currentEmotion.toUpperCase(), "_CALC"))
	            }
	          });
	          lottie.loadAnimation({
	            renderer: 'svg',
	            container: emojiItem,
	            animationData: _this2.reactionsAnimationData[currentEmotion]
	          });
	          reactionsNodesList.push(emojiItem);
	        });
	        this.reactionsPopup = main_core.Dom.create('div', {
	          props: {
	            className: "feed-post-emoji-popup-container ".concat(RatingManager.mobile ? '--mobile' : '')
	          },
	          children: [main_core.Dom.create('div', {
	            props: {
	              className: 'feed-post-emoji-icon-inner'
	            },
	            children: reactionsNodesList
	          })]
	        });
	        this.reactionsPopup.addEventListener(RatingManager.mobile ? 'touchend' : 'click', function (e) {
	          var reactionNode = e.target.classList.contains('feed-post-emoji-icon-item') ? e.target : e.target.closest('.feed-post-emoji-icon-item');

	          if (reactionNode) {
	            RatingLike$1.ClickVote(e, _this2.reactionsPopupLikeId, reactionNode.getAttribute('data-reaction'), true);
	          }

	          e.preventDefault();
	        });
	        main_core.Dom.append(this.reactionsPopup, document.body);
	      } else if (this.reactionsPopup.classList.contains('feed-post-emoji-popup-invisible')) {
	        this.reactionsPopup.classList.remove('feed-post-emoji-popup-invisible');
	      } else if (RatingManager.mobile && this.reactionsPopup.classList.contains('feed-post-emoji-popup-invisible-final-mobile')) {
	        this.reactionsPopup.classList.remove('feed-post-emoji-popup-invisible-final-mobile');
	      } else {
	        return;
	      }

	      this.reactionsPopupMouseOutHandler = this.getReactionsPopupMouseOutHandler(likeId);
	      var bindElementPosition = main_core.pos(bindElement);

	      if (bindElement.closest('.feed-com-informers-bottom') && bindElement.closest('.iframe-comments-cont, .task-iframe-popup')) {
	        bindElementPosition.left += 100;
	      }

	      var inverted = bindElementPosition.top - main_core.GetWindowSize().scrollTop < 80;
	      var deltaY = inverted ? 15 : -45;

	      if (inverted) {
	        this.reactionsPopup.classList.add('feed-post-emoji-popup-inverted');
	      } else {
	        this.reactionsPopup.classList.remove('feed-post-emoji-popup-inverted');
	      }

	      var likeInstance = RatingLike$1.getInstance(likeId);

	      if (RatingManager.mobile) {
	        this.touchMoveDeltaY = inverted ? 60 : -45;
	        main_core.Dom.adjust(this.reactionsPopup, {
	          style: {
	            left: '12px',
	            top: (inverted ? bindElementPosition.top - 23 : bindElementPosition.top - 28) + deltaY + 'px',
	            width: '330px',
	            borderRadius: '61px'
	          }
	        });
	        this.reactionsPopup.classList.remove('feed-post-emoji-popup-invisible-final');
	        this.reactionsPopup.classList.add('feed-post-emoji-popup-active-final');
	        this.reactionsPopup.classList.add('feed-post-emoji-popup-active-final-item');
	        likeInstance.box.classList.add('feed-post-emoji-control-active');
	        this.reactionsPopupMobileDisableScroll();
	      } else {
	        this.reactionsPopupAnimation = new BX.easing({
	          duration: 300,
	          start: {
	            width: 100,
	            left: bindElementPosition.left + bindElementPosition.width / 2 - 50,
	            top: (inverted ? bindElementPosition.top - 30 : bindElementPosition.top + 30) + deltaY,
	            borderRadius: 0,
	            opacity: 0
	          },
	          finish: {
	            width: 300,
	            left: bindElementPosition.left + bindElementPosition.width / 2 - 133,
	            top: bindElementPosition.top + deltaY - 5,
	            borderRadius: 50,
	            opacity: 100
	          },
	          transition: BX.easing.makeEaseInOut(BX.easing.transitions.cubic),
	          step: function step(state) {
	            _this2.reactionsPopup.style.width = "".concat(state.width, "px");
	            _this2.reactionsPopup.style.left = "".concat(state.left, "px");
	            _this2.reactionsPopup.style.top = "".concat(state.top, "px");
	            _this2.reactionsPopup.style.borderRadius = "".concat(state.borderRadius, "px");
	            _this2.reactionsPopup.style.opacity = state.opacity / 100;
	            _this2.reactionsPopupOpacityState = state.opacity;
	          },
	          complete: function complete() {
	            _this2.reactionsPopup.style.opacity = '';

	            _this2.reactionsPopup.classList.add('feed-post-emoji-popup-active-final');

	            likeInstance.box.classList.add('feed-post-emoji-control-active');
	          }
	        });
	        this.reactionsPopupAnimation.animate();
	        setTimeout(function () {
	          var reactions = _this2.reactionsPopup.querySelectorAll('.feed-post-emoji-icon-item');

	          _this2.reactionsPopupAnimation2 = new BX.easing({
	            duration: 140,
	            start: {
	              opacity: 0
	            },
	            finish: {
	              opacity: 100
	            },
	            transition: BX.easing.transitions.cubic,
	            step: function step(state) {
	              reactions[0].style.opacity = state.opacity / 100;
	              reactions[1].style.opacity = state.opacity / 100;
	              reactions[2].style.opacity = state.opacity / 100;
	              reactions[3].style.opacity = state.opacity / 100;
	              reactions[4].style.opacity = state.opacity / 100;
	              reactions[5].style.opacity = state.opacity / 100;
	              reactions[6].style.opacity = state.opacity / 100;
	            },
	            complete: function complete() {
	              _this2.reactionsPopup.classList.add('feed-post-emoji-popup-active-final-item');

	              reactions[0].style.opacity = '';
	              reactions[1].style.opacity = '';
	              reactions[2].style.opacity = '';
	              reactions[3].style.opacity = '';
	              reactions[4].style.opacity = '';
	              reactions[5].style.opacity = '';
	              reactions[6].style.opacity = '';
	            }
	          });

	          _this2.reactionsPopupAnimation2.animate();
	        }, 100);
	      }

	      if (!this.reactionsPopup.classList.contains('feed-post-emoji-popup-active')) {
	        this.reactionsPopup.classList.add('feed-post-emoji-popup-active');
	      }

	      if (!RatingManager.mobile) {
	        document.addEventListener('mousemove', this.reactionsPopupMouseOutHandler);
	      } else {
	        this.touchScrollTop = main_core.GetWindowSize().scrollTop;
	        this.hasMobileTouchMoved = null;
	        window.addEventListener('touchend', this.reactionsPopupMobileTouchEndHandler);
	        window.addEventListener('touchmove', this.reactionsPopupMobileTouchMoveHandler);
	      }
	    }
	  }, {
	    key: "reactionsPopupMobileTouchEnd",
	    value: function reactionsPopupMobileTouchEnd(e) {
	      var coords = {
	        x: e.changedTouches[0].pageX,
	        // e.touches[0].clientX + window.pageXOffset
	        y: e.changedTouches[0].pageY // e.touches[0].clientY + window.pageYOffset

	      };

	      if (this.hasMobileTouchMoved === true) {
	        var userReaction = null;
	        var reactionNode = this.reactionsPopupMobileGetHoverNode(coords.x, coords.y);

	        if (reactionNode && (userReaction = reactionNode.getAttribute('data-reaction'))) {
	          RatingLike$1.ClickVote(e, this.reactionsPopupLikeId, userReaction, true);
	        }

	        this.reactionsPopupMobileHideHandler();
	      } else // show reactions popup and handle clicks
	        {
	          window.addEventListener('touchend', this.reactionsPopupMobileHideHandler);
	        }

	      window.removeEventListener('touchend', this.reactionsPopupMobileTouchEndHandler);
	      window.removeEventListener('touchmove', this.reactionsPopupMobileTouchMoveHandler);
	      this.touchStartPosition = null;
	      e.preventDefault();
	    }
	  }, {
	    key: "reactionsPopupMobileTouchMove",
	    value: function reactionsPopupMobileTouchMove(e) {
	      var coords = {
	        x: e.touches[0].pageX,
	        // e.touches[0].clientX + window.pageXOffset
	        y: e.touches[0].pageY // e.touches[0].clientY + window.pageYOffset

	      };
	      this.touchCurrentPosition = {
	        x: coords.x,
	        y: coords.y
	      };

	      if (this.touchStartPosition === null) {
	        this.touchStartPosition = {
	          x: coords.x,
	          y: coords.y
	        };
	      } else {
	        if (this.hasMobileTouchMoved !== true) {
	          this.hasMobileTouchMoved = !this.reactionsPopupMobileCheckTouchMove();
	        }
	      }

	      if (this.hasMobileTouchMoved === true) {
	        var reactionNode = this.reactionsPopupMobileGetHoverNode(coords.x, coords.y);

	        if (reactionNode) {
	          if (this.currentReactionNodeHover && this.currentReactionNodeHover !== reactionNode) {
	            this.reactionsPopupMobileRemoveHover(this.currentReactionNodeHover);
	          }

	          this.reactionsPopupMobileAddHover(reactionNode);
	          this.currentReactionNodeHover = reactionNode;
	        } else if (this.currentReactionNodeHover) {
	          this.reactionsPopupMobileRemoveHover(this.currentReactionNodeHover);
	        }
	      } else {
	        if (this.currentReactionNodeHover) {
	          this.reactionsPopupMobileRemoveHover(this.currentReactionNodeHover);
	        }
	      }
	    }
	  }, {
	    key: "blockReactionsPopup",
	    value: function blockReactionsPopup() {
	      var _this3 = this;

	      if (this.blockShowPopupTimeout) {
	        window.clearTimeout(this.blockShowPopupTimeout);
	      }

	      this.blockShowPopup = true;
	      this.blockShowPopupTimeout = setTimeout(function () {
	        _this3.blockShowPopup = false;
	      }, 500);
	    }
	  }, {
	    key: "hideReactionsPopup",
	    value: function hideReactionsPopup(params) {
	      var _this4 = this;

	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : false;

	      if (this.reactionsPopup) {
	        if (RatingManager.mobile) {
	          this.reactionsPopup.classList.add('feed-post-emoji-popup-invisible-final');
	          this.reactionsPopup.classList.add('feed-post-emoji-popup-invisible-final-mobile');
	          this.reactionsPopup.classList.remove('feed-post-emoji-popup-active');
	          this.reactionsPopup.classList.remove('feed-post-emoji-popup-active-final');
	          this.reactionsPopup.classList.remove('feed-post-emoji-popup-active-final-item');
	          this.reactionsPopupMobileEnableScroll();
	          main_core.Dom.remove(this.reactionsPopup);
	          this.reactionsPopup = null;
	        } else {
	          if (this.reactionsPopupAnimation) {
	            this.reactionsPopupAnimation.stop();
	          }

	          if (this.reactionsPopupAnimation2) {
	            this.reactionsPopupAnimation2.stop();
	          }

	          this.reactionsPopup.classList.add('feed-post-emoji-popup-invisible');
	          this.reactionsPopupAnimation4 = new BX.easing({
	            duration: 500,
	            start: {
	              opacity: this.reactionsPopupOpacityState
	            },
	            finish: {
	              opacity: 0
	            },
	            transition: BX.easing.transitions.linear,
	            step: function step(state) {
	              _this4.reactionsPopup.style.opacity = state.opacity / 100;
	              _this4.reactionsPopupOpacityState = state.opacity;
	            },
	            complete: function complete() {
	              _this4.reactionsPopup.style.opacity = '';

	              _this4.reactionsPopup.classList.add('feed-post-emoji-popup-invisible-final');

	              _this4.reactionsPopup.classList.remove('feed-post-emoji-popup-active');

	              _this4.reactionsPopup.classList.remove('feed-post-emoji-popup-active-final');

	              _this4.reactionsPopup.classList.remove('feed-post-emoji-popup-active-final-item');

	              main_core.Dom.remove(_this4.reactionsPopup);
	              _this4.reactionsPopup = null;
	            }
	          });
	          this.reactionsPopupAnimation4.animate();
	        }

	        this.reactionsPopupLikeId = null;

	        if (likeId) {
	          RatingLike$1.getInstance(likeId).box.classList.remove('feed-post-emoji-control-active');
	        }
	      }

	      this.reactionsPopupMobileRemoveHover(this.currentReactionNodeHover);

	      if (likeId) {
	        this.bindReactionsPopup({
	          likeId: likeId
	        });
	      }
	    }
	  }, {
	    key: "reactionsPopupMobileCheckTouchMove",
	    value: function reactionsPopupMobileCheckTouchMove() {
	      if (this.touchStartPosition === null) {
	        return true;
	      } else {
	        if (Math.abs(this.touchCurrentPosition.x - this.touchStartPosition.x) > 5 || Math.abs(this.touchCurrentPosition.y - this.touchStartPosition.y) > 5) {
	          return false;
	        }
	      }

	      return true;
	    }
	  }, {
	    key: "reactionsPopupMobileHide",
	    value: function reactionsPopupMobileHide(e) {
	      window.removeEventListener('touchend', this.reactionsPopupMobileHideHandler);

	      if (this.reactionsPopupLikeId) {
	        this.hideReactionsPopup({
	          likeId: this.reactionsPopupLikeId
	        });

	        if (e) {
	          e.preventDefault();
	        }
	      }
	    }
	  }, {
	    key: "reactionsPopupMobileGetHoverNode",
	    value: function reactionsPopupMobileGetHoverNode(x, y) {
	      var nodeAboveFinger = document.elementFromPoint(x, y + this.touchMoveDeltaY - this.touchScrollTop);
	      var nodeBelowFinger = document.elementFromPoint(x, y - this.touchScrollTop);
	      var iconNodeAboveFinger = nodeAboveFinger === null || nodeAboveFinger === void 0 ? void 0 : nodeAboveFinger.closest('[data-reaction]');
	      var iconNodeBelowFinger = nodeBelowFinger === null || nodeBelowFinger === void 0 ? void 0 : nodeBelowFinger.closest('[data-reaction]');
	      var reactionNode = iconNodeAboveFinger || iconNodeBelowFinger;
	      var userReaction = reactionNode === null || reactionNode === void 0 ? void 0 : reactionNode.getAttribute('data-reaction');
	      return main_core.Type.isStringFilled(userReaction) ? reactionNode : null;
	    }
	  }, {
	    key: "reactionsPopupMobileAddHover",
	    value: function reactionsPopupMobileAddHover(reactionNode) {
	      if (!reactionNode) {
	        return;
	      }

	      reactionNode.classList.add('feed-post-emoji-icon-item-hover');
	    }
	  }, {
	    key: "reactionsPopupMobileRemoveHover",
	    value: function reactionsPopupMobileRemoveHover(reactionNode) {
	      if (!reactionNode) {
	        return;
	      }

	      reactionNode.classList.remove('feed-post-emoji-icon-item-hover');
	    }
	  }, {
	    key: "reactionsPopupMobileEnableScroll",
	    value: function reactionsPopupMobileEnableScroll() {
	      document.removeEventListener('touchmove', this.touchMoveScrollListener, {
	        passive: false
	      });
	      main_core_events.EventEmitter.emit('onPullDownEnable');

	      if (this.mobileOverlay !== null) {
	        main_core.Dom.clean(this.mobileOverlay);
	        main_core.Dom.remove(this.mobileOverlay);
	        this.mobileOverlay = null;
	      }
	    }
	  }, {
	    key: "reactionsPopupMobileDisableScroll",
	    value: function reactionsPopupMobileDisableScroll() {
	      var _this5 = this;

	      document.addEventListener('touchmove', this.touchMoveScrollListener, {
	        passive: false
	      });

	      if (app) {
	        app.exec('disableTabScrolling');
	      }

	      main_core_events.EventEmitter.emit('onPullDownDisable');

	      if (!main_core.Type.isNull(this.mobileOverlay)) {
	        return;
	      }

	      this.mobileOverlay = main_core.Dom.create('DIV', {
	        props: {
	          className: 'feed-post-emoji-popup-mobile-overlay'
	        }
	      });
	      setTimeout(function () {
	        if (main_core.Type.isNull(_this5.mobileOverlay)) {
	          return;
	        }

	        main_core.Dom.append(_this5.mobileOverlay, document.body);
	      }, 1000); // to avoid blink
	    }
	  }, {
	    key: "bindReactionsPopup",
	    value: function bindReactionsPopup(params) {
	      if (RatingManager.mobile) {
	        return false;
	      }

	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : '';

	      if (!main_core.Type.isStringFilled(likeId)) {
	        return false;
	      }

	      var likeInstance = RatingLike$1.getInstance(likeId);

	      if (!likeInstance) {
	        return false;
	      }

	      likeInstance.mouseOverHandler = main_core.Runtime.debounce(this.getMouseOverHandler(likeId), 500);
	      likeInstance.box.addEventListener('mouseenter', likeInstance.mouseOverHandler);
	      likeInstance.box.addEventListener('mouseleave', this.blockReactionsPopup);
	    }
	  }, {
	    key: "touchMoveScrollListener",
	    value: function touchMoveScrollListener(e) {
	      e.preventDefault();
	    }
	  }, {
	    key: "getReactionsPopupMouseOutHandler",
	    value: function getReactionsPopupMouseOutHandler(likeId) {
	      var _this6 = this;

	      return function (e) {
	        var popupPosition = _this6.reactionsPopup.getBoundingClientRect();

	        var inverted = _this6.reactionsPopup.classList.contains('feed-post-emoji-popup-inverted');

	        if (e.clientX >= popupPosition.left && e.clientX <= popupPosition.right && e.clientY >= popupPosition.top - (inverted ? 25 : 0) && e.clientY <= popupPosition.bottom + (inverted ? 0 : 25)) {
	          return;
	        }

	        _this6.blockReactionsPopup();

	        _this6.hideReactionsPopup({
	          likeId: likeId
	        });

	        document.removeEventListener('mousemove', _this6.reactionsPopupMouseOutHandler);
	        _this6.reactionsPopupMouseOutHandler = null;
	      };
	    }
	  }, {
	    key: "getMouseOverHandler",
	    value: function getMouseOverHandler(likeId) {
	      var _this7 = this;

	      return function () {
	        var likeInstance = RatingLike$1.getInstance(likeId);

	        if (!_this7.afterClickBlockShowPopup) {
	          if (_this7.blockShowPopup) {
	            return;
	          }

	          if (RatingManager.mobile) {
	            app.exec('callVibration');
	          }

	          _this7.showReactionsPopup({
	            bindElement: likeInstance.box,
	            likeId: likeId
	          });
	        }

	        likeInstance.box.removeEventListener('mouseenter', likeInstance.mouseOverHandler);
	        likeInstance.box.removeEventListener('mouseleave', _this7.blockReactionsPopup.bind(_this7));
	      };
	    }
	  }, {
	    key: "buildPopupContent",
	    value: function buildPopupContent(params) {
	      var _this8 = this;

	      var clear = params.clear ? Boolean(params.clear) : false;
	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : '';
	      var rating = params.rating;
	      var requestReaction = main_core.Type.isStringFilled(params.reaction) ? params.reaction : '';
	      var page = Number(params.page) > 0 ? Number(params.page) : 1;
	      var data = params.data;
	      var reactionsList = [];
	      var reactionsCount = 0;

	      if (clear && page === 1) {
	        this.clearPopupContent({
	          likeId: likeId
	        });
	      }

	      this.popupCurrentReaction = main_core.Type.isStringFilled(requestReaction) ? requestReaction : 'all';

	      if (requestReaction.length <= 0 || requestReaction == 'all') // first current tab
	        {
	          this.popupSizeInitialized = false;
	          document.getElementById("bx-ilike-popup-cont-".concat(likeId)).style.height = 'auto';
	          document.getElementById("bx-ilike-popup-cont-".concat(likeId)).style.minWidth = 'auto';
	        }

	      if (!main_core.Type.isStringFilled(requestReaction)) {
	        this.popupPagesList = {};
	      }

	      this.popupPagesList[requestReaction == '' ? 'all' : requestReaction] = page + 1;

	      if (main_core.Type.isPlainObject(data.reactions)) {
	        Object.entries(data.reactions).forEach(function (_ref) {
	          var _ref2 = babelHelpers.slicedToArray(_ref, 2),
	              reaction = _ref2[0],
	              count = _ref2[1];

	          if (Number(count) <= 0) {
	            return;
	          }

	          reactionsList.push({
	            reaction: reaction,
	            count: Number(count)
	          });
	          reactionsCount++;
	        });
	      }

	      var tabsNode = main_core.Dom.create('span', {
	        props: {
	          className: 'bx-ilike-popup-head'
	        }
	      });

	      if (reactionsCount > 1) {
	        var headClassList = ['bx-ilike-popup-head-item'];

	        if (!main_core.Type.isStringFilled(requestReaction) || requestReaction == 'all') {
	          headClassList.push('bx-ilike-popup-head-item-current');
	        }

	        tabsNode.appendChild(main_core.Dom.create('span', {
	          props: {
	            className: headClassList.join(' ')
	          },
	          children: [main_core.Dom.create('span', {
	            props: {
	              className: 'bx-ilike-popup-head-icon feed-post-emoji-icon-all'
	            }
	          }), main_core.Dom.create('span', {
	            props: {
	              className: 'bx-ilike-popup-head-text'
	            },
	            html: main_core.Loc.getMessage('RATING_LIKE_POPUP_ALL').replace('#CNT#', Number(data.items_all))
	          })],
	          events: {
	            click: function click(e) {
	              _this8.changePopupTab({
	                likeId: likeId,
	                rating: rating,
	                reaction: 'all'
	              });

	              e.preventDefault();
	            }
	          }
	        }));
	      }

	      if (reactionsCount === 0) {
	        reactionsList.push({
	          reaction: main_core.Loc.getMessage('RATING_LIKE_REACTION_DEFAULT'),
	          count: Number(data.items_all)
	        });
	      }

	      reactionsList.sort(function (a, b) {
	        var sample = {
	          like: 0,
	          kiss: 1,
	          laugh: 2,
	          wonder: 3,
	          cry: 4,
	          angry: 5,
	          facepalm: 6
	        };

	        if (sample[a.reaction] < sample[b.reaction]) {
	          return -1;
	        }

	        if (sample[a.reaction] > sample[b.reaction]) {
	          return 1;
	        }

	        return 0;
	      });
	      reactionsList.forEach(function (reactionData) {
	        var headItemClassList = ['bx-ilike-popup-head-item'];

	        if (requestReaction === reactionData.reaction) {
	          headItemClassList.push('bx-ilike-popup-head-item-current');
	        }

	        tabsNode.appendChild(main_core.Dom.create('span', {
	          props: {
	            className: headItemClassList.join(' ')
	          },
	          attrs: {
	            title: main_core.Loc.getMessage("RATING_LIKE_EMOTION_".concat(reactionData.reaction.toUpperCase(), "_CALC"))
	          },
	          children: [main_core.Dom.create('span', {
	            props: {
	              className: ['bx-ilike-popup-head-icon', 'feed-post-emoji-icon-item', "feed-post-emoji-icon-".concat(reactionData.reaction)].join(' ')
	            }
	          }), main_core.Dom.create('span', {
	            props: {
	              className: 'bx-ilike-popup-head-text'
	            },
	            html: reactionData.count
	          })],
	          events: {
	            click: function click(e) {
	              var popupContent = document.getElementById("bx-ilike-popup-cont-".concat(likeId));
	              var popupContentPosition = popupContent.getBoundingClientRect();

	              if (requestReaction.length <= 0 || requestReaction === 'all') // first current tab
	                {
	                  _this8.popupSizeInitialized = true;
	                  popupContent.style.height = "".concat(popupContentPosition.height, "px");
	                  popupContent.style.minWidth = "".concat(popupContentPosition.width, "px");
	                } else {
	                if (popupContentPosition.width > Number(popupContent.style.minWidth)) {
	                  popupContent.style.minWidth = "".concat(popupContentPosition.width, "px");
	                }
	              }

	              _this8.changePopupTab({
	                likeId: likeId,
	                rating: rating,
	                reaction: reactionData.reaction
	              });

	              e.preventDefault();
	            }
	          }
	        }));
	      });
	      var usersNode = rating.popupContent.querySelector('.bx-ilike-popup-content-container');
	      var usersNodeExists = false;

	      if (!usersNode) {
	        usersNode = main_core.Dom.create('span', {
	          props: {
	            className: 'bx-ilike-popup-content-container'
	          }
	        });
	      } else {
	        usersNodeExists = true;
	      }

	      usersNode.querySelectorAll('.bx-ilike-popup-content').forEach(function (contentNode) {
	        contentNode.classList.add('bx-ilike-popup-content-invisible');
	      });
	      var reactionUsersNode = usersNode.querySelector(".bx-ilike-popup-content-".concat(this.popupCurrentReaction));

	      if (!reactionUsersNode) {
	        reactionUsersNode = main_core.Dom.create('span', {
	          props: {
	            className: ['bx-ilike-popup-content', "bx-ilike-popup-content-".concat(this.popupCurrentReaction)].join(' ')
	          }
	        });
	        usersNode.appendChild(reactionUsersNode);
	      } else {
	        reactionUsersNode.classList.remove('bx-ilike-popup-content-invisible');
	      }

	      data.items.forEach(function (item) {
	        var userItemClassList = ['bx-ilike-popup-user-item'];

	        if (main_core.Type.isStringFilled(item.USER_TYPE)) {
	          userItemClassList.push("bx-ilike-popup-user-item-".concat(item.USER_TYPE));
	        }

	        reactionUsersNode.appendChild(main_core.Dom.create('a', {
	          props: {
	            className: userItemClassList.join(' ')
	          },
	          attrs: {
	            href: item.URL,
	            target: '_blank'
	          },
	          children: [main_core.Dom.create('span', {
	            props: {
	              className: 'bx-ilike-popup-user-icon'
	            },
	            style: main_core.Type.isStringFilled(item.PHOTO_SRC) ? {
	              'background-image': "url(\"".concat(item.PHOTO_SRC, "\")")
	            } : {}
	          }), main_core.Dom.create('span', {
	            props: {
	              className: 'bx-ilike-popup-user-name'
	            },
	            html: item.FULL_NAME
	          }), main_core.Dom.create('span', {
	            props: {
	              className: 'bx-ilike-popup-user-status'
	            }
	          })]
	        }));
	      });
	      var waitNode = rating.popupContent.querySelector('.bx-ilike-wait');

	      if (waitNode) {
	        main_core.Dom.clean(waitNode);
	        main_core.Dom.remove(waitNode);
	      }

	      var tabsNodeOld = rating.popupContent.querySelector('.bx-ilike-popup-head');

	      if (tabsNodeOld) {
	        tabsNodeOld.parentNode.insertBefore(tabsNode, tabsNodeOld);
	        tabsNodeOld.parentNode.removeChild(tabsNodeOld);
	      } else {
	        rating.popupContent.appendChild(tabsNode);
	      }

	      if (!usersNodeExists) {
	        rating.popupContent.appendChild(usersNode);
	      }
	    }
	  }, {
	    key: "clearPopupContent",
	    value: function clearPopupContent(params) {
	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : '';
	      var likeInstance = RatingLike$1.getInstance(likeId);
	      likeInstance.popupContent.innerHTML = '';
	      document.getElementById("bx-ilike-popup-cont-".concat(likeId)).style.height = 'auto';
	      document.getElementById("bx-ilike-popup-cont-".concat(likeId)).style.minWidth = 'auto';
	      likeInstance.popupContent.appendChild(main_core.Dom.create('span', {
	        props: {
	          className: 'bx-ilike-wait'
	        }
	      }));
	    }
	  }, {
	    key: "changePopupTab",
	    value: function changePopupTab(params) {
	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : '';
	      var rating = params.rating;
	      var reaction = main_core.Type.isStringFilled(params.reaction) ? params.reaction : '';
	      var contentContainerNode = rating.popupContent.querySelector('.bx-ilike-popup-content-container');

	      if (!contentContainerNode) {
	        return false;
	      }

	      var reactionUsersNode = contentContainerNode.querySelector('.bx-ilike-popup-content-' + reaction);

	      if (reactionUsersNode) {
	        this.popupCurrentReaction = main_core.Type.isStringFilled(reaction) ? reaction : 'all';
	        rating.popupContent.querySelectorAll('.bx-ilike-popup-head-item').forEach(function (tabNode) {
	          tabNode.classList.remove('bx-ilike-popup-head-item-current');
	          var reactionTabNode = tabNode.querySelector(".feed-post-emoji-icon-".concat(reaction));

	          if (reactionTabNode) {
	            tabNode.classList.add('bx-ilike-popup-head-item-current');
	          }
	        });
	        contentContainerNode.querySelectorAll('.bx-ilike-popup-content').forEach(function (contentNode) {
	          contentNode.classList.add('bx-ilike-popup-content-invisible');
	        });
	        reactionUsersNode.classList.remove('bx-ilike-popup-content-invisible');
	      } else {
	        ListPopup.List(likeId, 1, reaction);
	      }
	    }
	  }, {
	    key: "buildPopupContentNoReactions",
	    value: function buildPopupContentNoReactions(params) {
	      var page = Number(params.page) > 0 ? Number(params.page) : 1;
	      var likeInstance = !main_core.Type.isUndefined(params.rating) ? params.rating : null;
	      var data = params.data;

	      if (!likeInstance) {
	        return false;
	      }

	      if (page === 1) {
	        likeInstance.popupContent.innerHTML = '';
	        likeInstance.popupContent.appendChild(main_core.Dom.create('span', {
	          props: {
	            className: 'bx-ilike-bottom_scroll'
	          }
	        }));
	      }

	      likeInstance.popupContentPage += 1;
	      data.items.forEach(function (item) {
	        var avatarNode = null;

	        if (main_core.Type.isStringFilled(item.PHOTO_SRC)) {
	          avatarNode = main_core.Dom.create('img', {
	            attrs: {
	              src: item.PHOTO_SRC
	            },
	            props: {
	              className: 'bx-ilike-popup-avatar-img'
	            }
	          });
	        } else {
	          avatarNode = main_core.Dom.create('img', {
	            attrs: {
	              src: '/bitrix/images/main/blank.gif'
	            },
	            props: {
	              className: 'bx-ilike-popup-avatar-img bx-ilike-popup-avatar-img-default'
	            }
	          });
	        }

	        var imgClassList = ['bx-ilike-popup-img'];

	        if (main_core.Type.isStringFilled(item.USER_TYPE)) {
	          imgClassList.push("bx-ilike-popup-img-".concat(item.USER_TYPE));
	        }

	        likeInstance.popupContent.appendChild(main_core.Dom.create('a', {
	          attrs: {
	            href: item.URL,
	            target: '_blank'
	          },
	          props: {
	            className: imgClassList.join(' ')
	          },
	          children: [main_core.Dom.create('span', {
	            props: {
	              className: 'bx-ilike-popup-avatar-new'
	            },
	            children: [avatarNode, main_core.Dom.create('span', {
	              props: {
	                className: 'bx-ilike-popup-avatar-status-icon'
	              }
	            })]
	          }), main_core.Dom.create('span', {
	            props: {
	              className: 'bx-ilike-popup-name-new'
	            },
	            html: item.FULL_NAME
	          })]
	        }));
	      });
	    }
	  }, {
	    key: "afterClick",
	    value: function afterClick(params) {
	      var likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : '';

	      if (!main_core.Type.isStringFilled(likeId)) {
	        return;
	      }

	      this.afterClickBlockShowPopup = true;
	      this.afterClickHandler = this.getAfterClickHandler(likeId);
	      RatingLike$1.getInstance(likeId).box.addEventListener('mouseleave', this.afterClickHandler);
	    }
	  }, {
	    key: "getAfterClickHandler",
	    value: function getAfterClickHandler(likeId) {
	      var _this9 = this;

	      return function () {
	        _this9.afterClickBlockShowPopup = false;
	        RatingLike$1.getInstance(likeId).box.removeEventListener('mouseleave', _this9.afterClickHandler);
	      };
	    }
	  }, {
	    key: "resultReactionClick",
	    value: function resultReactionClick(e) {
	      var likeId = e.currentTarget.getAttribute('data-like-id');
	      var reaction = e.currentTarget.getAttribute('data-reaction');

	      if (!main_core.Type.isSet(reaction)) {
	        reaction = '';
	      }

	      ListPopup.onResultClick({
	        likeId: likeId,
	        event: e,
	        reaction: reaction
	      });
	      e.stopPropagation();
	    }
	  }, {
	    key: "resultReactionMouseEnter",
	    value: function resultReactionMouseEnter(e) {
	      var likeId = e.currentTarget.getAttribute('data-like-id');
	      var reaction = e.currentTarget.getAttribute('data-reaction');
	      ListPopup.onResultMouseEnter({
	        likeId: likeId,
	        event: e,
	        reaction: reaction
	      });
	    }
	  }, {
	    key: "resultReactionMouseLeave",
	    value: function resultReactionMouseLeave(e) {
	      var likeId = e.currentTarget.getAttribute('data-like-id');
	      var reaction = e.currentTarget.getAttribute('data-reaction');
	      ListPopup.onResultMouseLeave({
	        likeId: likeId,
	        reaction: reaction
	      });
	    }
	  }, {
	    key: "openMobileReactionsPage",
	    value: function openMobileReactionsPage(params) {
	      BXMobileApp.PageManager.loadPageBlank({
	        url: "".concat(main_core.Loc.getMessage('SITE_DIR'), "mobile/like/result.php"),
	        title: main_core.Loc.getMessage('RATING_LIKE_RESULTS'),
	        backdrop: {
	          mediumPositionPercent: 65
	        },
	        cache: true,
	        data: {
	          entityTypeId: params.entityTypeId,
	          entityId: params.entityId
	        }
	      });
	    }
	  }, {
	    key: "onRatingLike",
	    value: function onRatingLike(eventData) {
	      RatingLike$1.repo.forEach(function (likeInstance, likeId) {
	        if (likeInstance.entityTypeId !== eventData.entityTypeId && Number(likeInstance.entityId) !== Number(eventData.entityId)) {
	          return;
	        }

	        var voteAction = main_core.Type.isStringFilled(eventData.voteAction) ? eventData.voteAction.toUpperCase() : 'ADD';
	        voteAction = voteAction === 'PLUS' ? 'ADD' : voteAction;

	        if (Number(eventData.userId) === Number(main_core.Loc.getMessage('USER_ID')) && likeInstance.button) {
	          if (voteAction === 'CANCEL') {
	            likeInstance.button.classList.remove('bx-you-like-button');
	          } else {
	            likeInstance.button.classList.add('bx-you-like-button');
	          }
	        }

	        RatingLike$1.Draw(likeId, {
	          TYPE: voteAction,
	          USER_ID: eventData.userId,
	          ENTITY_TYPE_ID: eventData.entityTypeId,
	          ENTITY_ID: eventData.entityId,
	          USER_DATA: eventData.userData,
	          REACTION: eventData.voteReaction,
	          REACTION_OLD: eventData.voteReactionOld,
	          TOTAL_POSITIVE_VOTES: eventData.itemsAll
	        });
	      });
	    }
	  }, {
	    key: "onMobileCommentsGet",
	    value: function onMobileCommentsGet() {
	      var ratingEmojiSelectorPopup = document.querySelector('.feed-post-emoji-popup-container');

	      if (ratingEmojiSelectorPopup) {
	        ratingEmojiSelectorPopup.style.top = 0;
	        ratingEmojiSelectorPopup.style.left = 0;
	        ratingEmojiSelectorPopup.classList.remove('feed-post-emoji-popup-active');
	        ratingEmojiSelectorPopup.classList.remove('feed-post-emoji-popup-active-final');
	        ratingEmojiSelectorPopup.classList.remove('feed-post-emoji-popup-active-final-item');
	        ratingEmojiSelectorPopup.classList.add('feed-post-emoji-popup-invisible-final');
	        ratingEmojiSelectorPopup.classList.add('feed-post-emoji-popup-invisible-final-mobile');
	      }
	    }
	  }, {
	    key: "getNode",
	    value: function getNode(node) {
	      if (main_core.Type.isDomNode(node)) {
	        return node;
	      } else if (main_core.Type.isStringFilled(node)) {
	        return document.getElementById(node);
	      } else {
	        return null;
	      }
	    }
	  }]);
	  return RatingRender;
	}();
	babelHelpers.defineProperty(RatingRender, "reactionsList", ['like', 'kiss', 'laugh', 'wonder', 'cry', 'angry', 'facepalm']);
	babelHelpers.defineProperty(RatingRender, "reactionsAnimationData", {
	  like: likeAnimatedEmojiData,
	  kiss: kissAnimatedEmojiData,
	  laugh: laughAnimatedEmojiData,
	  wonder: wonderAnimatedEmojiData,
	  cry: cryAnimatedEmojiData,
	  angry: angryAnimatedEmojiData,
	  facepalm: facepalmAnimatedEmojiData
	});
	babelHelpers.defineProperty(RatingRender, "popupCurrentReaction", false);
	babelHelpers.defineProperty(RatingRender, "popupPagesList", []);
	babelHelpers.defineProperty(RatingRender, "popupSizeInitialized", false);
	babelHelpers.defineProperty(RatingRender, "blockShowPopup", false);
	babelHelpers.defineProperty(RatingRender, "blockShowPopupTimeout", false);
	babelHelpers.defineProperty(RatingRender, "afterClickBlockShowPopup", false);
	babelHelpers.defineProperty(RatingRender, "afterClickHandler", null);
	babelHelpers.defineProperty(RatingRender, "touchStartPosition", null);
	babelHelpers.defineProperty(RatingRender, "touchCurrentPosition", {
	  x: null,
	  y: null
	});
	babelHelpers.defineProperty(RatingRender, "currentReactionNodeHover", null);
	babelHelpers.defineProperty(RatingRender, "touchMoveDeltaY", null);
	babelHelpers.defineProperty(RatingRender, "touchScrollTop", 0);
	babelHelpers.defineProperty(RatingRender, "hasMobileTouchMoved", null);
	babelHelpers.defineProperty(RatingRender, "mobileOverlay", null);
	babelHelpers.defineProperty(RatingRender, "reactionsPopup", null);
	babelHelpers.defineProperty(RatingRender, "reactionsPopupAnimation", null);
	babelHelpers.defineProperty(RatingRender, "reactionsPopupAnimation2", null);
	babelHelpers.defineProperty(RatingRender, "reactionsPopupLikeId", null);
	babelHelpers.defineProperty(RatingRender, "reactionsPopupMouseOutHandler", null);
	babelHelpers.defineProperty(RatingRender, "reactionsPopupOpacityState", 0);
	babelHelpers.defineProperty(RatingRender, "reactionsPopupTouchStartIn", null);
	babelHelpers.defineProperty(RatingRender, "reactionsPopupPositionY", null);
	babelHelpers.defineProperty(RatingRender, "blockTouchEndByScroll", false);
	babelHelpers.defineProperty(RatingRender, "reactionsPopupMobileTouchEndHandler", RatingRender.reactionsPopupMobileTouchEnd.bind(RatingRender));
	babelHelpers.defineProperty(RatingRender, "reactionsPopupMobileTouchMoveHandler", RatingRender.reactionsPopupMobileTouchMove.bind(RatingRender));
	babelHelpers.defineProperty(RatingRender, "reactionsPopupMobileHideHandler", RatingRender.reactionsPopupMobileHide.bind(RatingRender));

	var RatingManager = /*#__PURE__*/function () {
	  function RatingManager() {
	    babelHelpers.classCallCheck(this, RatingManager);
	  }

	  babelHelpers.createClass(RatingManager, null, [{
	    key: "init",
	    value: function init(params) {
	      var _this = this;

	      if (!main_core.Type.isPlainObject(params)) {
	        params = {};
	      }

	      if (this.initialized) {
	        return;
	      }

	      this.mobile = !main_core.Type.isUndefined(params.mobile) && !!params.mobile;
	      this.initialized = true;
	      this.setDisplayHeight();

	      if (!this.mobile) {
	        window.addEventListener('scroll', main_core.Runtime.throttle(function () {
	          _this.getInViewScope();
	        }, 80), {
	          passive: true
	        });
	        window.addEventListener('resize', this.setDisplayHeight.bind(this));
	      }

	      main_core_events.EventEmitter.subscribe('onBeforeMobileLivefeedRefresh', RatingRender.reactionsPopupMobileHide);
	      main_core_events.EventEmitter.subscribe('BX.MobileLF:onCommentsGet', RatingRender.onMobileCommentsGet);

	      if (this.mobile) {
	        // new one
	        BXMobileApp.addCustomEvent('onRatingLike', RatingRender.onRatingLike);
	      }

	      if (this.mobile) {
	        BXMobileApp.addCustomEvent('onPull-main', function (data) {
	          if (data.command == 'rating_vote') {
	            RatingLike.LiveUpdate(data.params);
	          }
	        });
	      } else {
	        main_core_events.EventEmitter.subscribe('onPullEvent-main', function (event) {
	          var _event$getCompatData = event.getCompatData(),
	              _event$getCompatData2 = babelHelpers.slicedToArray(_event$getCompatData, 2),
	              command = _event$getCompatData2[0],
	              params = _event$getCompatData2[1];

	          if (command === 'rating_vote') {
	            RatingLike.LiveUpdate(params);
	          }
	        });

	        if (!main_core.Type.isUndefined(window.BX.SidePanel) && BX.SidePanel.Instance.getTopSlider()) {
	          main_core_events.EventEmitter.subscribe(BX.SidePanel.Instance.getTopSlider().getWindow(), 'SidePanel.Slider:onCloseComplete', ListPopup.removeOnCloseHandler);
	        }
	      }
	    }
	  }, {
	    key: "setDisplayHeight",
	    value: function setDisplayHeight() {
	      this.displayHeight = document.documentElement.clientHeight;
	    }
	  }, {
	    key: "getInViewScope",
	    value: function getInViewScope() {
	      var _this2 = this;

	      var ratingNode = null;
	      this.delayedList.forEach(function (value, key) {
	        ratingNode = BX(_this2.getNode(key));

	        if (!ratingNode) {
	          return;
	        }

	        if (_this2.isNodeVisibleOnScreen(ratingNode)) {
	          _this2.fireAnimation(key);
	        }
	      });
	    }
	  }, {
	    key: "addNode",
	    value: function addNode(entityId, node) {
	      if (!main_core.Type.isDomNode(node) //			|| !Type.isUndefined(this.ratingNodeList.get(entityId))
	      ) {
	        return;
	      }

	      this.ratingNodeList.set(entityId, node);
	    }
	  }, {
	    key: "getNode",
	    value: function getNode(entityId) {
	      var node = this.ratingNodeList.get(entityId);
	      return !main_core.Type.isUndefined(node) ? node : false;
	    }
	  }, {
	    key: "isNodeVisibleOnScreen",
	    value: function isNodeVisibleOnScreen(node) {
	      var coords = node.getBoundingClientRect();
	      var visibleAreaTop = Number(this.displayHeight / 10);
	      var visibleAreaBottom = Number(this.displayHeight * 9 / 10);
	      return (coords.top > 0 && coords.top < visibleAreaBottom || coords.bottom > visibleAreaTop && coords.bottom < this.displayHeight) && (this.mobile || !(coords.top < visibleAreaTop && coords.bottom < visibleAreaTop || coords.top > visibleAreaBottom && coords.bottom > visibleAreaBottom));
	    }
	  }, {
	    key: "fireAnimation",
	    value: function fireAnimation(key) {
	      this.delayedList["delete"](key);
	    }
	  }, {
	    key: "addEntity",
	    value: function addEntity(entityId, ratingObject) {
	      if (!this.entityList.includes(entityId) && ratingObject.topPanelContainer) {
	        this.entityList.push(entityId);
	        this.addNode(entityId, ratingObject.topPanelContainer);
	      }
	    }
	  }, {
	    key: "live",
	    value: function live(params) {
	      if (main_core.Type.isUndefined(params.TYPE) || params.TYPE !== 'ADD' || !main_core.Type.isStringFilled(params.ENTITY_TYPE_ID) || main_core.Type.isUndefined(params.ENTITY_ID) || Number(params.ENTITY_ID) <= 0) {
	        return;
	      }

	      var key = "".concat(params.ENTITY_TYPE_ID, "_").concat(params.ENTITY_ID);

	      if (!this.checkEntity(key)) {
	        return;
	      }

	      var ratingNode = this.getNode(key);

	      if (!ratingNode) {
	        return false;
	      }

	      if (this.isNodeVisibleOnScreen(ratingNode)) {
	        this.fireAnimation(key);
	      } else {
	        this.addDelayed(params);
	      }
	    }
	  }, {
	    key: "checkEntity",
	    value: function checkEntity(entityId) {
	      return this.entityList.includes(entityId);
	    }
	  }, {
	    key: "addDelayed",
	    value: function addDelayed(liveParams) {
	      if (!main_core.Type.isStringFilled(liveParams.ENTITY_TYPE_ID) || main_core.Type.isUndefined(liveParams.ENTITY_ID) || Number(liveParams.ENTITY_ID) <= 0) {
	        return;
	      }

	      var key = "".concat(liveParams.ENTITY_TYPE_ID, "_").concat(liveParams.ENTITY_ID);
	      var delayedListItem = this.delayedList.get(key);

	      if (main_core.Type.isUndefined(delayedListItem)) {
	        delayedListItem = [];
	      }

	      delayedListItem.push(liveParams);
	      this.delayedList.set(key, delayedListItem);
	    }
	  }]);
	  return RatingManager;
	}();
	babelHelpers.defineProperty(RatingManager, "mobile", false);
	babelHelpers.defineProperty(RatingManager, "initialized", false);
	babelHelpers.defineProperty(RatingManager, "displayHeight", 0);
	babelHelpers.defineProperty(RatingManager, "startScrollTop", 0);
	babelHelpers.defineProperty(RatingManager, "entityList", []);
	babelHelpers.defineProperty(RatingManager, "ratingNodeList", new Map());
	babelHelpers.defineProperty(RatingManager, "delayedList", new Map());

	var RatingLike$1 = /*#__PURE__*/function () {
	  function RatingLike(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile) {
	    babelHelpers.classCallCheck(this, RatingLike);

	    if (main_core.Type.isObject(arguments[0])) {
	      var params = arguments[0];
	      this.likeId = main_core.Type.isStringFilled(params.likeId) ? params.likeId : '';
	      this.entityTypeId = main_core.Type.isStringFilled(params.entityTypeId) ? params.entityTypeId : '';
	      this.entityId = !main_core.Type.isUndefined(params.entityId) ? Number(params.entityId) : 0;
	      this.available = main_core.Type.isStringFilled(params.available) ? params.available === 'Y' : false;
	      this.userId = !main_core.Type.isUndefined(params.userId) ? Number(params.userId) : 0;
	      this.localize = main_core.Type.isPlainObject(params.localize) ? params.localize : {};
	      this.template = main_core.Type.isStringFilled(params.template) ? params.template : '';
	      this.pathToUserProfile = main_core.Type.isStringFilled(params.pathToUserProfile) ? params.pathToUserProfile : '';
	    } else {
	      this.likeId = main_core.Type.isStringFilled(arguments[0]) ? arguments[0] : '';
	      this.entityTypeId = main_core.Type.isStringFilled(arguments[1]) ? arguments[1] : '';
	      this.entityId = !main_core.Type.isUndefined(arguments[2]) ? Number(arguments[2]) : 0;
	      this.available = main_core.Type.isStringFilled(arguments[3]) ? arguments[3] === 'Y' : false;
	      this.userId = !main_core.Type.isUndefined(arguments[4]) ? Number(arguments[4]) : 0;
	      this.localize = main_core.Type.isPlainObject(arguments[5]) ? arguments[5] : {};
	      this.template = main_core.Type.isStringFilled(arguments[6]) ? arguments[6] : '';
	      this.pathToUserProfile = main_core.Type.isStringFilled(arguments[7]) ? arguments[7] : '';
	    }

	    var key = "".concat(this.entityTypeId, "_").concat(this.entityId);
	    this.enabled = true;
	    this.box = document.getElementById("bx-ilike-button-".concat(this.likeId));

	    if (this.box === null) {
	      this.enabled = false;
	      return false;
	    }

	    this.box.setAttribute('data-rating-vote-id', likeId);
	    this.button = this.box.querySelector('.bx-ilike-left-wrap');
	    this.buttonText = this.button.querySelector('.bx-ilike-text');
	    this.count = this.box.querySelector('span.bx-ilike-right-wrap');

	    if (!this.count) {
	      this.count = document.getElementById("bx-ilike-count-".concat(this.likeId));
	    }

	    this.countText = this.count.querySelector('.bx-ilike-right');
	    this.topPanelContainer = document.getElementById("feed-post-emoji-top-panel-container-".concat(this.likeId));
	    this.topPanel = document.getElementById("feed-post-emoji-top-panel-".concat(this.likeId));
	    this.topUsersText = document.getElementById("bx-ilike-top-users-".concat(this.likeId));
	    this.topUsersDataNode = document.getElementById("bx-ilike-top-users-data-".concat(this.likeId));
	    this.userReactionNode = document.getElementById("bx-ilike-user-reaction-".concat(this.likeId));
	    this.reactionsNode = document.getElementById("feed-post-emoji-icons-".concat(this.likeId));
	    this.popup = null;
	    this.popupId = null;
	    this.popupTimeoutIdShow = null;
	    this.popupTimeoutIdList = null;
	    this.popupContent = document.getElementById("bx-ilike-popup-cont-".concat(this.likeId)).querySelector('span.bx-ilike-popup');
	    this.popupContentPage = 1;
	    this.popupTimeout = false;
	    this.likeTimeout = false;
	    this.mouseOverHandler = null;
	    this.version = main_core.Type.isDomNode(this.topPanel) ? 2 : 1;
	    this.mouseInShowPopupNode = {};
	    this.listXHR = null;

	    if (this.template === 'light' && main_core.Type.isDomNode(this.reactionsNode)) {
	      var container = this.reactionsNode.querySelector('.feed-post-emoji-icon-container');

	      if (container) {
	        var reactionsData = container.getAttribute('data-reactions-data');

	        try {
	          reactionsData = JSON.parse(reactionsData);
	          var elementsNew = [];
	          Object.entries(reactionsData).forEach(function (_ref) {
	            var _ref2 = babelHelpers.slicedToArray(_ref, 2),
	                reaction = _ref2[0],
	                count = _ref2[1];

	            elementsNew.push({
	              reaction: reaction,
	              count: count,
	              animate: false
	            });
	          });
	          RatingRender.drawReactions({
	            likeId: likeId,
	            container: container,
	            data: elementsNew
	          });
	        } catch (e) {}
	      }
	    }

	    if (!main_core.Type.isUndefined(RatingLike.lastVoteRepo.get(key))) {
	      this.lastVote = RatingLike.lastVoteRepo.get(key);
	      var ratingNode = template === 'standart' ? this.button : this.count;

	      if (this.lastVote === 'plus') {
	        ratingNode.classList.add('bx-you-like');
	      } else {
	        ratingNode.classList.remove('bx-you-like');
	      }
	    } else {
	      this.lastVote = (this.template === 'standart' ? this.button : this.count).classList.contains('bx-you-like') ? 'plus' : 'cancel';
	      RatingLike.lastVoteRepo.set(key, this.lastVote);
	    }

	    if (!main_core.Type.isUndefined(RatingLike.lastReactionRepo.get(key))) {
	      this.lastReaction = RatingLike.lastReactionRepo.get(key);
	      this.count.setAttribute('data-myreaction', this.lastReaction);
	    } else {
	      var lastReaction = this.count.getAttribute('data-myreaction');
	      this.lastReaction = main_core.Type.isStringFilled(lastReaction) ? lastReaction : 'like';
	      RatingLike.lastReactionRepo.set(key, this.lastReaction);
	    }

	    if (this.topPanelContainer) {
	      RatingManager.addEntity(key, this);
	    }

	    return this;
	  }

	  babelHelpers.createClass(RatingLike, null, [{
	    key: "setInstance",
	    value: function setInstance(likeId, likeInstance) {
	      this.repo.set(likeId, likeInstance);
	      window.BXRL[likeId] = likeInstance;
	    }
	  }, {
	    key: "getInstance",
	    value: function getInstance(likeId) {
	      return this.repo.get(likeId);
	    }
	  }, {
	    key: "ClickVote",
	    value: function ClickVote(e, likeId, userReaction, forceAdd) {
	      var _this = this;

	      if (main_core.Type.isUndefined(userReaction)) {
	        userReaction = 'like';
	      }

	      var likeInstance = this.getInstance(likeId);
	      var container = likeInstance.template === 'standart' ? e.target : likeInstance.count;

	      if (likeInstance.version === 2 && likeInstance.userReactionNode) {
	        RatingRender.hideReactionsPopup({
	          likeId: likeId
	        });
	        RatingRender.blockReactionsPopup();
	        document.removeEventListener('mousemove', RatingRender.reactionsPopupMouseOutHandler);
	      }

	      clearTimeout(likeInstance.likeTimeout);
	      var active = container.classList.contains('bx-you-like');
	      forceAdd = !!forceAdd;
	      var change = false;
	      var userReactionOld = false;

	      if (active && !forceAdd) {
	        userReaction = likeInstance.version === 2 ? RatingRender.getUserReaction({
	          userReactionNode: likeInstance.userReactionNode
	        }) : false;
	        likeInstance.buttonText.innerHTML = likeInstance.localize['LIKE_N'];
	        likeInstance.countText.innerHTML = Number(likeInstance.countText.innerHTML) - 1;
	        container.classList.remove('bx-you-like');
	        likeInstance.button.classList.remove('bx-you-like-button');

	        if (userReaction) {
	          likeInstance.button.classList.remove("bx-you-like-button-".concat(userReaction));
	        }

	        likeInstance.likeTimeout = setTimeout(function () {
	          if (likeInstance.lastVote != 'cancel') {
	            _this.Vote(likeId, 'cancel', userReaction);
	          }
	        }, 1000);
	      } else if (active && forceAdd) {
	        change = true;
	        userReactionOld = likeInstance.version === 2 ? RatingRender.getUserReaction({
	          userReactionNode: likeInstance.userReactionNode
	        }) : false;

	        if (userReaction != userReactionOld) {
	          if (userReactionOld) {
	            likeInstance.button.classList.remove("bx-you-like-button-".concat(userReactionOld));
	          }

	          likeInstance.button.classList.add("bx-you-like-button-".concat(userReaction));
	          likeInstance.likeTimeout = setTimeout(function () {
	            _this.Vote(likeId, 'change', userReaction, userReactionOld);
	          }, 1000);
	        }
	      } else if (!active) {
	        likeInstance.buttonText.innerHTML = likeInstance.localize['LIKE_Y'];
	        likeInstance.countText.innerHTML = Number(likeInstance.countText.innerHTML) + 1;
	        container.classList.add('bx-you-like');
	        likeInstance.button.classList.add('bx-you-like-button');
	        likeInstance.button.classList.add("bx-you-like-button-".concat(userReaction));
	        likeInstance.likeTimeout = setTimeout(function () {
	          if (likeInstance.lastVote !== 'plus') {
	            _this.Vote(likeId, 'plus', userReaction);
	          } else if (userReaction !== likeInstance.lastReaction) // http://jabber.bx/view.php?id=99339
	            {
	              _this.Vote(likeId, 'change', userReaction, likeInstance.lastReaction);
	            }
	        }, 1000);
	      }

	      if (likeInstance.version === 2) {
	        if (change) {
	          RatingRender.setReaction({
	            likeId: likeId,
	            rating: likeInstance,
	            action: 'change',
	            userReaction: userReaction,
	            userReactionOld: userReactionOld,
	            totalCount: Number(likeInstance.countText.innerHTML)
	          });
	        } else {
	          RatingRender.setReaction({
	            likeId: likeId,
	            rating: likeInstance,
	            action: active ? 'cancel' : 'add',
	            userReaction: userReaction,
	            totalCount: Number(likeInstance.countText.innerHTML)
	          });
	        }
	      }

	      if (!change && likeInstance.version === 2) {
	        var dataUsers = likeInstance.topUsersDataNode ? JSON.parse(likeInstance.topUsersDataNode.getAttribute('data-users')) : false;

	        if (dataUsers) {
	          dataUsers.TOP = Object.values(dataUsers.TOP);
	          likeInstance.topUsersText.innerHTML = RatingRender.getTopUsersText({
	            you: !active,
	            top: dataUsers.TOP,
	            more: dataUsers.MORE
	          });
	        }
	      }

	      if (likeInstance.template === 'light' && !likeInstance.userReactionNode) {
	        var cont = likeInstance.box;
	        var likeNode = cont.cloneNode(true);
	        likeNode.id = 'like_anim'; // to not dublicate original id

	        var type = 'normal';

	        if (cont.closest('.feed-com-informers-bottom')) {
	          type = 'comment';
	        } else if (cont.closest('.feed-post-informers')) {
	          type = 'post';
	        }

	        likeNode.classList.remove('bx-ilike-button-hover');
	        likeNode.classList.add('bx-like-anim');
	        main_core.Dom.adjust(cont.parentNode, {
	          style: {
	            position: 'relative'
	          }
	        });
	        main_core.Dom.adjust(likeNode, {
	          style: {
	            position: 'absolute',
	            whiteSpace: 'nowrap',
	            top: type === 'post' ? '1px' : type === 'comment' ? '0' : ''
	          }
	        });
	        main_core.Dom.adjust(cont, {
	          style: {
	            visibility: 'hidden'
	          }
	        });
	        main_core.Dom.prepend(likeNode, cont.parentNode);
	        new BX.easing({
	          duration: 140,
	          start: {
	            scale: 100
	          },
	          finish: {
	            scale: type === 'comment' ? 110 : 115
	          },
	          transition: BX.easing.transitions.quad,
	          step: function step(state) {
	            likeNode.style.transform = "scale(".concat(state.scale / 100, ")");
	          },
	          complete: function complete() {
	            var likeThumbNode = main_core.Dom.create('SPAN', {
	              props: {
	                className: active ? 'bx-ilike-icon' : 'bx-ilike-icon bx-ilike-icon-orange'
	              }
	            });
	            main_core.Dom.adjust(likeThumbNode, {
	              style: {
	                position: 'absolute',
	                whiteSpace: 'nowrap'
	              }
	            });
	            main_core.Dom.prepend(likeThumbNode, cont.parentNode);
	            new BX.easing({
	              duration: 140,
	              start: {
	                scale: type == 'comment' ? 110 : 115
	              },
	              finish: {
	                scale: 100
	              },
	              transition: BX.easing.transitions.quad,
	              step: function step(state) {
	                likeNode.style.transform = "scale(".concat(state.scale / 100, ")");
	              },
	              complete: function complete() {}
	            }).animate();
	            var propsStart = {
	              opacity: 100,
	              scale: type === 'comment' ? 110 : 115,
	              top: 0
	            };
	            var propsFinish = {
	              opacity: 0,
	              scale: 200,
	              top: type === 'comment' ? -3 : -2
	            };

	            if (type !== 'comment') {
	              propsStart.left = -5;
	              propsFinish.left = -13;
	            }

	            new BX.easing({
	              duration: 200,
	              start: propsStart,
	              finish: propsFinish,
	              transition: BX.easing.transitions.linear,
	              step: function step(state) {
	                likeThumbNode.style.transform = "scale(".concat(state.scale / 100, ")");
	                likeThumbNode.style.opacity = state.opacity / 100;

	                if (type !== 'comment') {
	                  likeThumbNode.style.left = "".concat(state.left, "px");
	                }

	                likeThumbNode.style.top = "".concat(state.top, "px");
	              },
	              complete: function complete() {
	                likeNode.parentNode.removeChild(likeNode);
	                likeThumbNode.parentNode.removeChild(likeThumbNode);
	                main_core.Dom.adjust(cont.parentNode, {
	                  style: {
	                    position: 'static'
	                  }
	                });
	                main_core.Dom.adjust(cont, {
	                  style: {
	                    visibility: 'visible'
	                  }
	                });
	              }
	            }).animate();
	          }
	        }).animate();
	      }

	      likeInstance.box.classList.remove('bx-ilike-button-hover');
	    }
	  }, {
	    key: "Draw",
	    value: function Draw(likeId, params) {
	      var likeInstance = this.getInstance(likeId);
	      likeInstance.countText.innerHTML = Number(params.TOTAL_POSITIVE_VOTES);

	      if (!main_core.Type.isUndefined(params.TYPE) && !main_core.Type.isUndefined(params.USER_ID) && Number(params.USER_ID) > 0 && !main_core.Type.isUndefined(params.USER_DATA) && !main_core.Type.isUndefined(params.USER_DATA.WEIGHT)) {
	        var userWeight = parseFloat(params.USER_DATA.WEIGHT);
	        var usersData = likeInstance.topUsersDataNode ? JSON.parse(likeInstance.topUsersDataNode.getAttribute('data-users')) : false;

	        if (params.TYPE != 'CHANGE' && main_core.Type.isPlainObject(usersData)) {
	          usersData.TOP = Object.values(usersData.TOP);
	          var recalcNeeded = usersData.TOP.length < 2;
	          Object.values(usersData.TOP).forEach(function (item) {
	            if (recalcNeeded) {
	              return;
	            }

	            if (params.TYPE === 'ADD' && userWeight > item.WEIGHT || params.TYPE === 'CANCEL' && params.USER_ID === item.ID) {
	              recalcNeeded = true;
	            }
	          });

	          if (recalcNeeded) {
	            if (params.TYPE === 'ADD' && Number(params.USER_ID) !== Number(main_core.Loc.getMessage('USER_ID'))) {
	              if (!usersData.TOP.find(function (a) {
	                return Number(a.ID) === Number(params.USER_ID);
	              })) {
	                usersData.TOP.push({
	                  ID: Number(params.USER_ID),
	                  NAME_FORMATTED: params.USER_DATA.NAME_FORMATTED,
	                  WEIGHT: parseFloat(params.USER_DATA.WEIGHT)
	                });
	              }
	            } else if (params.TYPE === 'CANCEL') {
	              usersData.TOP = usersData.TOP.filter(function (a) {
	                return Number(a.ID) !== Number(params.USER_ID);
	              });
	            }

	            usersData.TOP.sort(function (a, b) {
	              if (parseFloat(a.WEIGHT) === parseFloat(b.WEIGHT)) {
	                return 0;
	              }

	              return parseFloat(a.WEIGHT) > parseFloat(b.WEIGHT) ? -1 : 1;
	            });

	            if (usersData.TOP.length > 2 && params.TYPE === 'ADD') {
	              usersData.TOP.pop();
	              usersData.MORE++;
	            }
	          } else {
	            if (params.TYPE === 'ADD') {
	              usersData.MORE = !main_core.Type.isUndefined(usersData.MORE) ? Number(usersData.MORE) + 1 : 1;
	            } else if (params.TYPE === 'CANCEL') {
	              usersData.MORE = !main_core.Type.isUndefined(usersData.MORE) && Number(usersData.MORE) > 0 ? Number(usersData.MORE) - 1 : 0;
	            }
	          }

	          likeInstance.topUsersDataNode.setAttribute('data-users', JSON.stringify(usersData));

	          if (likeInstance.topUsersText) {
	            likeInstance.topUsersText.innerHTML = RatingRender.getTopUsersText({
	              you: Number(params.USER_ID) === Number(main_core.Loc.getMessage('USER_ID')) ? params.TYPE !== 'CANCEL' : likeInstance.count.classList.contains('bx-you-like'),
	              top: usersData.TOP,
	              more: usersData.MORE
	            });
	          }
	        }

	        if (main_core.Type.isStringFilled(params.REACTION) && main_core.Type.isStringFilled(params.REACTION_OLD) && params.TYPE === 'CHANGE') {
	          RatingRender.setReaction({
	            likeId: likeId,
	            rating: likeInstance,
	            action: 'change',
	            userReaction: params.REACTION,
	            userReactionOld: params.REACTION_OLD,
	            totalCount: params.TOTAL_POSITIVE_VOTES,
	            userId: params.USER_ID
	          });
	        } else if (main_core.Type.isStringFilled(params.REACTION) && ['ADD', 'CANCEL'].includes(params.TYPE)) {
	          RatingRender.setReaction({
	            likeId: likeId,
	            rating: likeInstance,
	            userReaction: params.REACTION,
	            action: params.TYPE === 'ADD' ? 'add' : 'cancel',
	            totalCount: params.TOTAL_POSITIVE_VOTES,
	            userId: params.USER_ID
	          });
	        }
	      }

	      if (likeInstance.topPanel) {
	        likeInstance.topPanel.setAttribute('data-popup', 'N');
	      }

	      if (!likeInstance.userReactionNode) {
	        likeInstance.count.insertBefore(main_core.Dom.create('span', {
	          props: {
	            className: 'bx-ilike-plus-one'
	          },
	          style: {
	            width: "".concat(element.countText.clientWidth - 8, "px"),
	            height: "".concat(element.countText.clientHeight - 8, "px")
	          },
	          html: params.TYPE === 'ADD' ? '+1' : '-1'
	        }), element.count.firstChild);
	      }

	      if (likeInstance.popup) {
	        likeInstance.popup.close();
	        likeInstance.popupContentPage = 1;
	      }
	    }
	  }, {
	    key: "Vote",
	    value: function Vote(likeId, voteAction, voteReaction, voteReactionOld) {
	      var _this2 = this;

	      if (!main_core.Type.isStringFilled(voteReaction)) {
	        voteReaction = 'like';
	      }

	      var ajaxInstance = RatingManager.mobile ? new MobileAjaxWrapper() : main_core.ajax;
	      var likeInstance = this.getInstance(likeId);

	      var successCallback = function successCallback(response) {
	        var data = response.data;
	        likeInstance.lastVote = data.action;
	        likeInstance.lastReaction = voteReaction;
	        var key = "".concat(likeInstance.entityTypeId, "_").concat(likeInstance.entityId);

	        _this2.lastVoteRepo.set(key, data.action);

	        _this2.lastReactionRepo.set(key, data.voteReaction);

	        likeInstance.countText.innerHTML = data.items_all;
	        likeInstance.popupContentPage = 1;
	        likeInstance.popupContent.innerHTML = '';
	        likeInstance.popupContent.appendChild(main_core.Dom.create('span', {
	          props: {
	            className: 'bx-ilike-wait'
	          }
	        }));

	        if (likeInstance.topPanel) {
	          likeInstance.topPanel.setAttribute('data-popup', 'N');
	        }

	        ListPopup.AdjustWindow(likeId);
	        var popup = document.getElementById("ilike-popup-".concat(likeId));

	        if (popup && popup.style.display === 'block') {
	          ListPopup.List(likeId, null, '', true);
	        }

	        if (likeInstance.version >= 2 && RatingManager.mobile) {
	          BXMobileApp.onCustomEvent('onRatingLike', {
	            action: data.action,
	            ratingId: likeId,
	            entityTypeId: likeInstance.entityTypeId,
	            entityId: likeInstance.entityId,
	            voteAction: voteAction,
	            voteReaction: voteReaction,
	            voteReactionOld: voteReactionOld,
	            userId: main_core.Loc.getMessage('USER_ID'),
	            userData: !main_core.Type.isUndefined(data.user_data) ? data.user_data : null,
	            itemsAll: data.items_all
	          }, true);
	        }
	      };

	      var failureCallback = function failureCallback() {
	        var dataUsers = likeInstance.topUsersDataNode ? JSON.parse(likeInstance.topUsersDataNode.getAttribute('data-users')) : false;

	        if (likeInstance.version == 2) {
	          if (voteAction === 'change') {
	            RatingRender.setReaction({
	              likeId: likeId,
	              rating: likeInstance,
	              action: voteAction,
	              userReaction: voteReaction,
	              userReactionOld: voteReactionOld,
	              totalCount: Number(likeInstance.countText.innerHTML)
	            });
	          } else {
	            RatingRender.setReaction({
	              likeId: likeId,
	              rating: likeInstance,
	              action: voteAction === 'cancel' ? 'add' : 'cancel',
	              userReaction: voteReaction,
	              totalCount: voteAction == 'cancel' ? Number(likeInstance.countText.innerHTML) + 1 : Number(likeInstance.countText.innerHTML) - 1
	            });
	          }

	          if (likeInstance.buttonText) {
	            if (voteAction === 'add') {
	              likeInstance.buttonText.innerHTML = main_core.Loc.getMessage('RATING_LIKE_EMOTION_LIKE_CALC');
	            } else if (voteAction === 'change') {
	              likeInstance.buttonText.innerHTML = main_core.Loc.getMessage("RATING_LIKE_EMOTION_".concat(voteReactionOld.toUpperCase(), "_CALC"));
	            } else {
	              likeInstance.buttonText.innerHTML = main_core.Loc.getMessage("RATING_LIKE_EMOTION_".concat(voteReaction.toUpperCase(), "_CALC"));
	            }
	          }
	        }

	        if (dataUsers && voteAction !== 'change' && likeInstance.version == 2) {
	          likeInstance.topUsersText.innerHTML = RatingRender.getTopUsersText({
	            you: voteAction === 'cancel',
	            // negative
	            top: Object.values(dataUsers.TOP),
	            more: dataUsers.MORE
	          });
	        }
	      };

	      var analyticsLabel = {
	        b24statAction: 'addLike'
	      };

	      if (likeInstance.version >= 2 && RatingManager.mobile) {
	        analyticsLabel.b24statContext = 'mobile';
	      }

	      ajaxInstance.runAction('main.rating.vote', {
	        data: {
	          params: {
	            RATING_VOTE_TYPE_ID: likeInstance.entityTypeId,
	            RATING_VOTE_ENTITY_ID: likeInstance.entityId,
	            RATING_VOTE_ACTION: voteAction,
	            RATING_VOTE_REACTION: voteReaction
	          }
	        },
	        analyticsLabel: analyticsLabel
	      }).then(successCallback, failureCallback);
	      return false;
	    }
	  }, {
	    key: "LiveUpdate",
	    value: function LiveUpdate(params) {
	      var _this3 = this;

	      if (Number(params.USER_ID) === Number(main_core.Loc.getMessage('USER_ID'))) {
	        return false;
	      }

	      this.repo.forEach(function (likeInstance, likeId) {
	        if (likeInstance.entityTypeId !== params.ENTITY_TYPE_ID || Number(likeInstance.entityId) !== Number(params.ENTITY_ID)) {
	          return;
	        }

	        _this3.Draw(likeId, params);
	      });
	      RatingManager.live(params);
	    }
	  }, {
	    key: "Set",
	    value: function Set(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile, pathToAjax, mobile) {
	      var _this4 = this;

	      mobile = !!mobile;

	      if (template === undefined) {
	        template = 'standart';
	      }

	      if (this.additionalParams.get('pathToUserProfile')) {
	        pathToUserProfile = this.additionalParams.get('pathToUserProfile');
	      }

	      var likeInstance = this.getInstance(likeId);

	      if (likeInstance && likeInstance.tryToSet > 5) {
	        return;
	      }

	      var tryToSend = likeInstance && likeInstance.tryToSet ? likeInstance.tryToSet : 1;
	      likeInstance = new RatingLike(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile);
	      this.setInstance(likeId, likeInstance);

	      if (likeInstance.enabled) {
	        this.Init(likeId, {
	          mobile: mobile
	        });
	      } else {
	        setTimeout(function () {
	          likeInstance.tryToSet = tryToSend + 1;

	          _this4.Set(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile, pathToAjax, mobile);
	        }, 500);
	      }
	    }
	  }, {
	    key: "setParams",
	    value: function setParams(params) {
	      if (!main_core.Type.isUndefined(params.pathToUserProfile)) {
	        this.additionalParams.set('pathToUserProfile', params.pathToUserProfile);
	      }
	    }
	  }, {
	    key: "Init",
	    value: function Init(likeId, params) {
	      params = !main_core.Type.isUndefined(params) ? params : {};
	      RatingManager.init(params);
	      var likeInstance = this.getInstance(likeId); // like/unlike button

	      if (likeInstance.available) {
	        var eventNode = likeInstance.template === 'standart' ? likeInstance.button : likeInstance.buttonText;

	        if (!RatingManager.mobile) {
	          var eventNodeNew = eventNode.closest('.feed-new-like');

	          if (eventNodeNew) {
	            eventNode = eventNodeNew;
	          }
	        }

	        if (likeInstance.version >= 2 && RatingManager.mobile) {
	          eventNode.removeEventListener('touchstart', this.mobileTouchStartHandler);
	          eventNode.addEventListener('touchstart', this.mobileTouchStartHandler);
	        }

	        var eventName = RatingManager.mobile ? 'touchend' : 'click';
	        eventNode.removeEventListener(eventName, this.buttonClickHandler);
	        eventNode.addEventListener(eventName, this.buttonClickHandler);

	        if (!RatingManager.mobile) {
	          // Hover/unHover like-button
	          likeInstance.box.addEventListener('mouseover', function () {
	            likeInstance.box.classList.add('bx-ilike-button-hover');
	          });
	          likeInstance.box.addEventListener('mouseout', function () {
	            likeInstance.box.classList.remove('bx-ilike-button-hover');
	          });
	        } else {
	          likeInstance.topPanel.removeEventListener('click', this.mobileTopPanelClickHandler);
	          likeInstance.topPanel.addEventListener('click', this.mobileTopPanelClickHandler);
	        }
	      } else if (main_core.Type.isDomNode(likeInstance.buttonText)) {
	        likeInstance.buttonText.innerHTML = likeInstance.localize['LIKE_D'];
	        likeInstance.buttonText.classList.add('bx-ilike-text-unavailable');
	      } // get like-user-list


	      var clickShowPopupNode = likeInstance.topUsersText ? likeInstance.topUsersText : likeInstance.count;

	      if (!RatingManager.mobile) {
	        clickShowPopupNode.addEventListener('mouseenter', function (e) {
	          ListPopup.onResultMouseEnter({
	            likeId: likeId,
	            event: e,
	            nodeId: e.currentTarget.id
	          });
	        });
	        clickShowPopupNode.addEventListener('mouseleave', function (e) {
	          ListPopup.onResultMouseLeave({
	            likeId: likeId
	          });
	        });
	        clickShowPopupNode.addEventListener('click', function (e) {
	          ListPopup.onResultClick({
	            likeId: likeId,
	            event: e,
	            nodeId: e.currentTarget.id
	          });
	        });
	      }

	      if (likeInstance.version === 2 && likeInstance.available && likeInstance.userReactionNode) {
	        RatingRender.bindReactionsPopup({
	          likeId: likeId
	        });
	      }
	    }
	  }, {
	    key: "mobileTouchStartHandler",
	    value: function mobileTouchStartHandler() {
	      RatingManager.startScrollTop = document.documentElement && document.documentElement.scrollTop || document.body.scrollTop;
	    }
	  }, {
	    key: "buttonClickHandler",
	    value: function buttonClickHandler(e) {
	      var likeInstanceNode = e.currentTarget.closest('[data-rating-vote-id]');

	      if (!main_core.Type.isDomNode(likeInstanceNode)) {
	        return;
	      }

	      var likeId = likeInstanceNode.getAttribute('data-rating-vote-id');

	      if (!main_core.Type.isStringFilled(likeId)) {
	        return;
	      }

	      var likeInstance = RatingLike.getInstance(likeId);

	      if (likeInstance.version >= 2 && RatingManager.mobile && RatingRender.blockTouchEndByScroll) {
	        RatingRender.blockTouchEndByScroll = false;
	        return;
	      }

	      if (likeInstance.version < 2 || !RatingManager.mobile || !RatingRender.reactionsPopupLikeId) {
	        if (likeInstance.version >= 2 && RatingManager.mobile) {
	          var currentScrollTop = document.documentElement && document.documentElement.scrollTop || document.body.scrollTop;

	          if (Math.abs(currentScrollTop - RatingManager.startScrollTop) > 2) {
	            return;
	          }
	        }

	        RatingLike.ClickVote(e, likeId);
	      }

	      if (likeInstance.version == 2) {
	        RatingRender.afterClick({
	          likeId: likeId
	        });
	      }

	      e.preventDefault();
	    }
	  }, {
	    key: "mobileTopPanelClickHandler",
	    value: function mobileTopPanelClickHandler(e) {
	      var likeInstanceNode = e.currentTarget.querySelector('[data-like-id]');

	      if (!main_core.Type.isDomNode(likeInstanceNode)) {
	        return;
	      }

	      var likeId = likeInstanceNode.getAttribute('data-like-id');

	      if (!main_core.Type.isStringFilled(likeId)) {
	        return;
	      }

	      var likeInstance = RatingLike.getInstance(likeId);
	      RatingRender.openMobileReactionsPage({
	        entityTypeId: likeInstance.entityTypeId,
	        entityId: likeInstance.entityId
	      });
	      e.stopPropagation();
	    }
	  }]);
	  return RatingLike;
	}();
	babelHelpers.defineProperty(RatingLike$1, "repo", new Map());
	babelHelpers.defineProperty(RatingLike$1, "lastVoteRepo", new Map());
	babelHelpers.defineProperty(RatingLike$1, "lastReactionRepo", new Map());
	babelHelpers.defineProperty(RatingLike$1, "additionalParams", new Map());

	if (main_core.Type.isUndefined(window.BXRL)) {
	  window.BXRL = {};
	}

	window.BXRL.manager = RatingManager;
	window.BXRL.render = RatingRender;
	window.RatingLike = RatingLike$1;

}((this.BX.Main = this.BX.Main || {}),BX,BX.Main,BX.Event));
//# sourceMappingURL=main.rating.js.map
