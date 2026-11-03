/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, main_core_events, pull_client, ui_a11y, disk_documentHeader) {
	'use strict';

	var helper_umd$1 = {exports: {}};

	var helper_umd = helper_umd$1.exports;

	var hasRequiredHelper_umd;

	function requireHelper_umd () {
		if (hasRequiredHelper_umd) return helper_umd$1.exports;
		hasRequiredHelper_umd = 1;
		(function (module, exports) {
			(function(J,z){z(exports);})(helper_umd,function(J){class z{constructor(){this.listeners=new Map;}on(e,t){let i=this.listeners.get(e);return i||(i=new Set,this.listeners.set(e,i)),i.add(t),()=>{var r;(r=this.listeners.get(e))==null||r.delete(t);}}emit(e,...t){const i=this.listeners.get(e);if(i)for(const r of [...i])try{r(...t);}catch{}}clear(){this.listeners.clear();}}async function De(n,e){if(e.aborted)return "cancelled";const{readyUrl:t,loadAttemptId:i,editorKey:r,voSess:s}=n;if(!t||!i)return "unsupported";const o=performance.now()+3e3;for(let c=0;c<2;c++){const h=o-performance.now();if(e.aborted)return "cancelled";if(h<=0)return "failed";const a=new AbortController;let f;const d=new Promise((v,y)=>{f=()=>{a.abort(),y(new Error("ready acknowledgement stopped"));};}),m=setTimeout(f,h);e.addEventListener("abort",f,{once:true});try{const v=await Promise.race([fetch(t,{method:"POST",credentials:"omit",signal:a.signal,headers:{"Content-Type":"application/json",Authorization:`Bearer ${s}`},body:JSON.stringify({editor_key:r,load_attempt_id:i})}),d]);if(e.aborted)return "cancelled";if(performance.now()>=o)return "failed";if(v.status===204)return "confirmed";if(v.status<500||v.status>599)return "rejected"}catch{if(e.aborted)return "cancelled"}finally{clearTimeout(m),e.removeEventListener("abort",f);}}return "failed"}const de={fetchTimeoutMs:1e4,fetchRetries:3,refreshFileTimeoutMs:15e3,recreateTimeoutMs:3e4,recreateRetries:2,createReadyTimeoutMs:6e4,firstLoadRetries:2,firstLoadBudgetMs:9e4,noSignalNoticeMs:6e4};class u extends Error{constructor(e,t,i){super(t??e,i!==void 0?{cause:i}:void 0),this.name="VibeOfficeError",this.code=e,Object.setPrototypeOf(this,u.prototype);}}class D extends u{constructor(e,t,i,r){super("refresh-fetch-failed",e),this.retryable=t,this.httpStatus=i,this.lastHttpStatus=r,this.name="RefreshFetchError",Object.setPrototypeOf(this,D.prototype);}}function P(n,e,t,i){return new D(n,e,t,i)}class N extends u{constructor(e,t,i){super("session-dead",e,t),this.httpStatus=i,this.retryable=false,this.name="SessionDeadError",Object.setPrototypeOf(this,N.prototype);}}class B extends u{constructor(e="refresh_url returned 409 save_refused"){super("save-refused",e),this.retryable=false,this.httpStatus=409,this.name="SaveRefusedError",Object.setPrototypeOf(this,B.prototype);}}function ce(n){var t;if(!n||typeof n!="object")throw new u("invalid-open-config","openConfig is not an object");const e=n.urls;if(!e||!e.api_js||!e.events||!e.refresh)throw new u("invalid-open-config","openConfig.urls incomplete");if(!n.vo_sess)throw new u("invalid-open-config","openConfig.vo_sess missing");if(!n.session_id||!n.doc_id||!n.editor_key)throw new u("invalid-open-config","openConfig identity fields missing");if(!n.config||typeof n.config!="object")throw new u("invalid-open-config","openConfig.config missing");if(((t=n.config.document)==null?void 0:t.key)!==n.editor_key)throw new u("invalid-open-config","config.document.key != editor_key");return {docId:n.doc_id,sessionId:n.session_id,editorKey:n.editor_key,rev:n.rev,voSess:n.vo_sess,apiJsUrl:e.api_js,eventsUrl:e.events,refreshUrl:e.refresh,readyUrl:typeof e.ready=="string"?e.ready:void 0,loadAttemptId:typeof n.load_attempt_id=="string"?n.load_attempt_id:void 0,config:n.config}}function le(n,e,t){const i={...n,vo_sess:e},r=ce(i);return t?r.refreshUrl=t:r.refreshUrl=i.urls.refresh,r}function fe(n){return n.replace(/\/s\/[^/]+\//,"/s/***/")}function q(n){try{return new URL(n,typeof location<"u"?location.href:void 0)}catch{return}}function ue(n,e){if(e.docId!==n.docId||e.sessionId!==n.sessionId)throw new u("invalid-open-config","refresh config belongs to another document or session")}function he(n,e){const t=q(n),i=q(e),r=typeof location<"u"?location.origin:"",s=t!==void 0&&i!==void 0&&(i.protocol==="https:"||i.protocol==="http:"&&(t.protocol==="http:"||i.origin===r));if(t===void 0||i===void 0||!s||i.origin!==t.origin)throw new u("api-js-load-failed",`refused api.js url ${fe(e)}`)}function Pe(n,e){const t=q(n),i=q(e);return t===void 0||i===void 0||i.origin===""||i.origin==="null"?false:i.origin===t.origin}function pe(n){const e=new URLSearchParams(n.search);return e.sort(),e.toString()}function Z(n,e){if(n===e)return  true;const t=q(n),i=q(e);return t===void 0||i===void 0?false:t.origin===i.origin&&t.pathname===i.pathname&&pe(t)===pe(i)}function me(n,e){const t=n.includes("?");return /[?&]vo_sess=/.test(n)?n:`${n}${t?"&":"?"}vo_sess=${encodeURIComponent(e)}`}function ke(n,e){return new Promise((t,i)=>{const r=()=>{clearTimeout(s),e==null||e.removeEventListener("abort",r),i(P("refresh_url request cancelled",false));},s=setTimeout(()=>{e==null||e.removeEventListener("abort",r),t();},n);e==null||e.addEventListener("abort",r,{once:true}),e!=null&&e.aborted&&r();})}const ve=3e4;function re(n){return n===void 0?Number.POSITIVE_INFINITY:n-performance.now()}function x(n,e){if(n.aborted||performance.now()>=e)throw P("refresh_url request cancelled or timed out",true)}async function Fe(n,e){var t;if(typeof n.json=="function")try{const i=await Promise.race([n.json(),e]),r=(t=i==null?void 0:i.error)==null?void 0:t.code;return typeof r=="string"?r:void 0}catch(i){if(i instanceof D)throw i;return}}function ge(n){var t,i;const e=(i=(t=n.headers)==null?void 0:t.get)==null?void 0:i.call(t,"Retry-After");if(!(e==null||!/^\d+$/.test(e.trim())))return Math.min(Number.parseInt(e,10)*1e3,ve)}async function ye(n,e,t){var v,y,E,R,M,S,L;const i=me(n,e);let r,s,o=false,c=0;const h=(v=t.series)==null?void 0:v.saving;t.series&&(t.series.saving=void 0);let a=(h==null?void 0:h.backoffSteps)??0,f=(h==null?void 0:h.waits)??0,d=false,m;for(let k=0;k<=t.retries;k++){if((y=t.signal)!=null&&y.aborted)throw P("refresh_url request cancelled",false);if(re(t.deadlineAt)<=0){o=true;break}if(c>0){a++;const p=1e3*2**Math.min(a-1,5)+Math.floor(Math.random()*500),b=Math.min(Math.max(s??0,p),ve);if(s=void 0,b>=re(t.deadlineAt)){d&&t.series&&(t.series.saving={backoffSteps:a,waits:f,delayMs:b}),o=true;break}if(d)try{(E=t.onWait)==null||E.call(t,{code:"saving",retryAfterMs:b,attempt:f});}catch{}await ke(b,t.signal);}if(d=false,re(t.deadlineAt)<=0){o=true;break}c++;let j;const T=new AbortController,C=Math.min(performance.now()+t.timeoutMs,t.deadlineAt??1/0);let w;const g=new Promise((p,b)=>{w=b;});g.catch(()=>{});const _=()=>{w(P("refresh_url request cancelled or timed out",true)),T.abort();};(R=t.signal)==null||R.addEventListener("abort",_,{once:true}),(M=t.signal)!=null&&M.aborted&&_();const U=setTimeout(_,Math.max(0,C-performance.now()));try{x(T.signal,C);const p=await Promise.race([fetch(i,{method:"GET",signal:T.signal,credentials:"omit",headers:{accept:"application/json"}}),g]);if(j=p.status,m=p.status,x(T.signal,C),p.status===401||p.status===403)throw new N(`refresh_url returned ${p.status}`,void 0,p.status);if(p.status===409){const W=ge(p),G=await Fe(p,g);if(x(T.signal,C),G==="save_refused")throw new B;if(G==="saving_in_progress"){d=!0,f++,k--,r=P(`refresh_url returned ${p.status}`,!0,p.status),s=W;continue}if(W===void 0)throw P(`refresh_url returned ${p.status}`,!1,p.status);r=P(`refresh_url returned ${p.status}`,!0,p.status),s=W;continue}if(p.status>=500){r=P(`refresh_url returned ${p.status}`,!0,p.status),s=ge(p);continue}if(!p.ok)throw P(`refresh_url returned ${p.status}`,!1,p.status);const b=await Promise.race([p.json(),g]);return x(T.signal,C),b}catch(p){if((S=t.signal)!=null&&S.aborted)throw P("refresh_url request cancelled",false);if(p instanceof N||p instanceof B||p instanceof D&&!p.retryable)throw p;r=p instanceof D?P(p.message,p.retryable,p.httpStatus??j):P("refresh_url transport or response failed",true,j);}finally{clearTimeout(U),(L=t.signal)==null||L.removeEventListener("abort",_);}}throw P(o?"refresh_url retry budget exhausted":"refresh_url exhausted retries",r instanceof D?r.retryable:true,r instanceof D?r.httpStatus:void 0,m)}const se="vibeoffice-ds-api-js",Ke=6e4;function Y(){return window}function I(n,e){return new u("api-js-load-failed",n,e)}class Ue{constructor(e,t){this.url=e,this.script=t,this.pending=true,this.consumers=0,this.isCurrent=()=>Y().__vibeofficeApiJsResource===this,this.onLoad=()=>{!this.pending||!this.isCurrent()||(window.DocsAPI?this.accept(window.DocsAPI):this.fail(I("api.js loaded but window.DocsAPI is undefined")));},this.onError=i=>{this.fail(I(`failed to load ${fe(this.url)}`,i));},this.promise=new Promise((i,r)=>{this.resolve=i,this.reject=r;}),this.promise.catch(()=>{});}start(e,t){if(e){this.accept(e);return}this.script.addEventListener("load",this.onLoad),this.script.addEventListener("error",this.onError),this.timer=setTimeout(()=>{this.fail(I("api.js load timed out"));},Math.max(0,t-performance.now()));}wait(e){return this.consumers++,new Promise((t,i)=>{var a,f;let r=false,s;const o=(d,m)=>{var v;r||(r=true,clearTimeout(s),(v=e.signal)==null||v.removeEventListener("abort",c),this.consumers--,m?t(m):i(d),this.pending&&this.consumers===0&&this.fail(I("api.js load has no active consumers")));},c=()=>{var d;return o(I("api.js wait cancelled",(d=e.signal)==null?void 0:d.reason))},h=()=>e.deadlineAt!==void 0&&performance.now()>=e.deadlineAt;this.promise.then(d=>{var m;(m=e.signal)!=null&&m.aborted?c():h()?o(I("api.js wait timed out")):d.isCurrent()?o(void 0,d):o(I("api.js generation was replaced"));},d=>o(d)),(a=e.signal)==null||a.addEventListener("abort",c,{once:true}),(f=e.signal)!=null&&f.aborted?c():h()?o(I("api.js wait timed out")):e.deadlineAt!==void 0&&(s=setTimeout(()=>o(I("api.js wait timed out")),e.deadlineAt-performance.now()));})}retire(){var e;this.cleanup(),this.pending&&(this.pending=false,this.reject(I("api.js generation was reset"))),this.isCurrent()&&delete Y().__vibeofficeApiJsResource,(e=this.script)==null||e.remove();}cleanup(){var e,t;clearTimeout(this.timer),(e=this.script)==null||e.removeEventListener("load",this.onLoad),(t=this.script)==null||t.removeEventListener("error",this.onError);}accept(e){!this.pending||!this.isCurrent()||(this.pending=false,this.cleanup(),this.accepted={api:e,isCurrent:()=>{var t;return this.isCurrent()&&((t=this.accepted)==null?void 0:t.api)===e}},this.resolve(this.accepted));}fail(e){!this.pending||!this.isCurrent()||(this.pending=false,this.reject(e),we()?this.retire():this.cleanup());}}function Ne(n,e={}){var h;if(typeof window>"u"||typeof document>"u")return Promise.reject(I("no DOM environment"));if((h=e.signal)!=null&&h.aborted)return Promise.reject(I("api.js wait cancelled",e.signal.reason));if(e.deadlineAt!==void 0&&performance.now()>=e.deadlineAt)return Promise.reject(I("api.js wait timed out"));const t=Y().__vibeofficeApiJsResource;if(t)return Z(t.url,n)?t.wait(e):Promise.reject(I("api.js generation must be reset before changing its URL"));const i=document.getElementById(se);if(i&&!Z(i.src,n))return Promise.reject(I("existing api.js script has a different URL"));const r=window.DocsAPI,s=i??(r?null:document.createElement("script"));s&&!i&&(s.id=se,s.type="text/javascript",s.async=true,s.src=n);const o=new Ue(n,s);Y().__vibeofficeApiJsResource=o,o.start(r,Math.max(performance.now()+Ke,e.deadlineAt??0));const c=o.wait(e);if(s&&!i)try{document.head.appendChild(s);}catch(a){return oe(),c.catch(()=>{}),Promise.reject(I("failed to append api.js script",a))}return c}function oe(){var e;if(typeof window>"u")return  true;if(!we())return  false;const n=Y().__vibeofficeApiJsResource;return n?n.retire():typeof document<"u"&&((e=document.getElementById(se))==null||e.remove()),true}function we(){const n=Object.getOwnPropertyDescriptor(window,"DocsAPI");if(n&&!n.configurable)return  false;try{delete window.DocsAPI;}catch{return  false}return window.DocsAPI===void 0}class ee extends u{constructor(){super("editor-create-failed","first instance did not reach appReady"),Object.setPrototypeOf(this,ee.prototype);}}function ae(n){const e=be(n);return e!==void 0?e:be(n==null?void 0:n.data)}function be(n){if(typeof n!="object"||n===null)return;const e=n.errorCode;return typeof e=="number"&&Number.isFinite(e)?e:void 0}class H extends u{constructor(e){super("ds-error","editor reported a terminal error",e);const t=ae(e);t!==void 0&&(this.engineCode=t),Object.setPrototypeOf(this,H.prototype);}}const Ee=-18,We=new Set(["onAppReady","onDocumentReady","onDocumentStateChange","onError","onRequestRefreshFile","onWarning"]);class Je{constructor(e,t,i){this.element=e,this.documentServerEvents=t,this.hooks=i,this.instanceRef=null,this.lifetime=null,this.waiter=null,this.closed=false,this.reachedReady=false,this.cleanupSucceeded=true,typeof this.documentServerEvents.onOutdatedVersion=="function"&&console.warn("[vibeoffice] onOutdatedVersion is deprecated and not supported; recovery is driven via onRequestRefreshFile. Handler ignored.");}get cleanupComplete(){return this.cleanupSucceeded}get readyReached(){return this.reachedReady}get instance(){return this.instanceRef}unsavedState(){const e=this.lifetime;return e!=null&&e.active?{unsaved:e.unsaved,disconnected:e.disconnectedAfterReady}:{unsaved:false,disconnected:false}}offlineAfterReady(){const e=this.lifetime;return (e==null?void 0:e.active)===true&&e.offlineAfterReady}async create(e,t,i={}){var h,a,f;if(this.closed||(h=i.signal)!=null&&h.aborted)throw new u("editor-create-failed","editor creation cancelled");this.releaseInstance(true);const r=Math.min(i.deadlineAt??1/0,((a=this.waiter)==null?void 0:a.deadlineAt)??1/0),s={model:i.model?{...i.model}:void 0,active:true,creating:true,deadlineAt:Number.isFinite(r)?r:void 0,controller:new AbortController,detach:()=>{var d;return (d=i.signal)==null?void 0:d.removeEventListener("abort",o)},stopAppReadyWatch:()=>{},onAppReady:i.onAppReady,onEngineSignal:i.onEngineSignal,ready:false,unsaved:false,disconnectedAfterReady:false,offlineAfterReady:false,stopOfflineWatch:()=>{}};if(typeof window<"u"){const d=()=>{s.active&&s.ready&&(s.offlineAfterReady=true);};window.addEventListener("offline",d),s.stopOfflineWatch=()=>window.removeEventListener("offline",d);}const o=()=>{this.lifetime===s&&this.destroyInstance();};this.lifetime=s,this.waiter&&(this.waiter.lifetime=s),(f=i.signal)==null||f.addEventListener("abort",o,{once:true});let c;try{const d=await Ne(t,{signal:s.controller.signal,deadlineAt:s.deadlineAt});this.assertCreating(s,d,r);const m=this.buildConfig(e,s);this.assertCreating(s,d,r),i.watchInitialAppReady&&this.watchAppReady(s),c=new d.api.DocEditor(this.element,m),this.assertCreating(s,d,r),this.instanceRef=c,s.creating=!1;}catch(d){throw this.lifetime===s&&this.destroyInstance(),c&&this.destroyNativeInstance(c),d instanceof u?d:new u("editor-create-failed","new DocsAPI.DocEditor threw",d)}}recreate(e,t,i={}){return this.create(e,t,i)}refreshFile(e,t){var i,r;if(!this.instanceRef||!((i=this.lifetime)!=null&&i.active)||this.closed)throw new u("recovery-failed","no live instance for refreshFile");(r=this.lifetime.acknowledgement)==null||r.abort(),this.lifetime.acknowledgement=void 0,this.lifetime.model=t?{...t}:void 0,this.lifetime.offlineAfterReady=false,this.instanceRef.refreshFile(e);}waitForStep(e,t={}){this.cancelStep();const i=Math.min(performance.now()+e,t.deadlineAt??1/0),r=new Promise((s,o)=>{var v,y;let c=false,h;const a=E=>{var R;return c?false:(c=true,clearTimeout(h),(R=t.signal)==null||R.removeEventListener("abort",d),this.waiter===m&&(this.waiter=null),E?(m.lifetime&&this.lifetime===m.lifetime&&this.destroyInstance(),o(E),false):(s(),true))},f=()=>{a(new u("recovery-failed","step timed out"));},d=()=>{var E;a(new u("recovery-failed","step cancelled",(E=t.signal)==null?void 0:E.reason));},m={lifetime:this.lifetime,deadlineAt:i,onReady:()=>performance.now()>=m.deadlineAt?(f(),false):a(),onError:E=>a(new H(E)),onAppReadyMissing:()=>a(new ee),cancel:d,clearDeadline:()=>{c||(m.deadlineAt=1/0,clearTimeout(h));}};this.waiter=m,(v=t.signal)==null||v.addEventListener("abort",d,{once:true}),this.closed||(y=t.signal)!=null&&y.aborted?d():performance.now()>=i?f():h=setTimeout(f,i-performance.now());});return r.catch(()=>{}),r}cancelStep(){var e,t;(e=this.waiter)==null||e.cancel(),(t=this.lifetime)!=null&&t.creating&&this.destroyInstance();}destroyInstance(){this.releaseInstance(false);}closeSession(){this.closed=true,this.releaseInstance(false);}destroy(){this.closed=true,this.destroyInstance();}releaseInstance(e,t=false){var r;const i=this.lifetime;if(this.lifetime=null,i&&(i.active=false,i.stopAppReadyWatch(),i.stopOfflineWatch(),i.detach(),i.controller.abort(),(r=i.acknowledgement)==null||r.abort()),e||this.cancelStep(),!t){const s=this.instanceRef;this.instanceRef=null,s&&this.destroyNativeInstance(s);}}watchAppReady(e){const t=document.getElementById(this.element),i=t==null?void 0:t.parentNode;if(!t||!i||document.hidden)return;let r,s;const o=()=>{a.disconnect(),r==null||r.removeEventListener("load",h),document.removeEventListener("visibilitychange",c),clearTimeout(s);},c=()=>{document.hidden&&o();},h=()=>{!this.isCurrent(e)||document.hidden||(s=setTimeout(()=>{if(o(),!this.isCurrent(e)||!(r!=null&&r.isConnected)||document.hidden)return;const f=this.waiter;(f==null?void 0:f.lifetime)===e&&f.onAppReadyMissing();},3e4));},a=new MutationObserver(f=>{for(const d of f){if(!Array.from(d.removedNodes).includes(t))continue;const m=Array.from(d.addedNodes).find(y=>y instanceof HTMLIFrameElement);if(!(m instanceof HTMLIFrameElement))continue;const v=m.getAttribute("src");if(!(!v||v==="about:blank")){r=m,a.disconnect(),r.addEventListener("load",h,{once:true});break}}});e.stopAppReadyWatch=o,document.addEventListener("visibilitychange",c),a.observe(i,{childList:true});}continueAfterAppReady(e){var i;if(e.onAppReady===void 0)return;e.deadlineAt=void 0;const t=this.waiter;(t==null?void 0:t.lifetime)===e&&t.clearDeadline(),(i=e.onAppReady)==null||i.call(e),e.onAppReady=void 0;}destroyNativeInstance(e){try{e.destroyEditor();}catch{this.cleanupSucceeded=false;}}assertCreating(e,t,i){if(!this.isCurrent(e)||!t.isCurrent())throw new u("editor-create-failed","editor creation cancelled");if(performance.now()>=i)throw new u("editor-create-failed","editor creation timed out")}isCurrent(e){return !this.closed&&e.active&&this.lifetime===e}acceptEvent(e){return this.isCurrent(e)?e.deadlineAt!==void 0&&performance.now()>=e.deadlineAt?(this.destroyInstance(),false):true:false}buildConfig(e,t){const i={},r=this.documentServerEvents;for(const[s,o]of Object.entries(r))s==="onOutdatedVersion"||We.has(s)||(i[s]=c=>{this.acceptEvent(t)&&o(c);});return i.onAppReady=s=>{var o;this.acceptEvent(t)&&(t.stopAppReadyWatch(),this.continueAfterAppReady(t),(o=r.onAppReady)==null||o.call(r,s));},i.onDocumentReady=s=>{var c;if(!this.acceptEvent(t))return;t.stopAppReadyWatch();const o=this.waiter;if(!(o&&o.lifetime===t&&!o.onReady())){if(this.reachedReady=true,t.ready=true,t.onEngineSignal=void 0,t.deadlineAt=void 0,t.onAppReady=void 0,t.detach(),t.model&&!t.acknowledgement){const h=new AbortController;t.acknowledgement=h,De(t.model,h.signal).then(a=>{this.isCurrent(t)&&t.acknowledgement===h&&(this.readyAcknowledgement=a);});}o||this.hooks.onIdleDocumentReady(),this.isCurrent(t)&&((c=r.onDocumentReady)==null||c.call(r,s));}},i.onDocumentStateChange=s=>{var o,c;this.acceptEvent(t)&&(typeof s.data=="boolean"&&(t.unsaved=s.data),(o=t.onEngineSignal)==null||o.call(t),this.isCurrent(t)&&((c=r.onDocumentStateChange)==null||c.call(r,s)));},i.onWarning=s=>{var o,c;this.acceptEvent(t)&&((o=t.onEngineSignal)==null||o.call(t),this.isCurrent(t)&&((c=r.onWarning)==null||c.call(r,s)));},i.onError=s=>{var c,h,a;if(!this.acceptEvent(t))return;t.ready&&ae(s.data)===Ee&&(t.disconnectedAfterReady=true),(c=t.onEngineSignal)==null||c.call(t);const o=this.waiter;if(o&&o.lifetime===t)try{(h=r.onError)==null||h.call(r,s);}finally{this.isCurrent(t)&&o.onError(s.data);}else this.hooks.onIdleError(s.data),this.isCurrent(t)&&((a=r.onError)==null||a.call(r,s));},i.onRequestRefreshFile=s=>{var o;this.acceptEvent(t)&&(this.hooks.onRequestRefreshFile(),this.isCurrent(t)&&((o=r.onRequestRefreshFile)==null||o.call(r,s)));},{...e,events:i}}}const Be=new Set(["api-js-load-failed","editor-create-failed","recovery-failed"]),$e=new Set([-4,-18,-26,-27]);function Re(n){return n instanceof N?false:n instanceof H?n.engineCode!==void 0&&$e.has(n.engineCode):n instanceof u&&Be.has(n.code)}class Q extends u{constructor(e,t){super("editor-create-failed",`first load interrupted by ${e}`),this.stage=t,Object.setPrototypeOf(this,Q.prototype);}}const Ae={"hello-mismatch":0,"session-refresh":1,"session-closed":2};class Ge{constructor(){this.reject=null,this.deferred=null,this.stage=()=>"after-create";}arm(e,t=()=>"after-create"){let i;const r=new Promise((h,a)=>{i=a;});let s=false;const o=h=>{s=true,i(h);};this.reject=o,this.stage=t;const c=this.deferred;return c!==null&&(c.editorKey===e?(this.deferred=null,this.fire(c.reason)):c.kind!=="session-closed"&&(this.deferred=null)),{interrupted:r,get signalled(){return s},disarm:()=>{this.reject===o&&(this.reject=null);}}}signal(e,t,i,r){if(this.reject===null){const s=this.deferred;if(s!==null&&Ae[s.kind]>Ae[e]&&(s.editorKey===i||s.kind==="session-closed"))return;this.deferred={kind:e,reason:t,editorKey:i,replay:r};return}this.fire(t);}replayPending(){const e=this.deferred;e!==null&&(this.deferred=null,e.replay());}fire(e){const t=this.reject;t!==null&&(this.reject=null,t(new Q(e,this.stage())));}}function te(n){if(n instanceof ee)return "app-ready-missing";if(!(n instanceof u))return "unknown-error";switch(n.code){case "api-js-load-failed":case "editor-create-failed":case "invalid-open-config":case "refresh-fetch-failed":case "session-dead":case "sse-degraded":case "recovery-failed":case "ds-error":case "save-refused":return n.code;default:return "unknown-error"}}function X(n){return n==="ready"||n==="document-ready"?"ready":n==="api-create"?"create":"refresh"}function ne(n){return n instanceof H?n.engineCode:void 0}function V(n,e){const t=te(n),i=t==="unknown-error"||t==="timeout"||t==="cancelled"?"unknown":t,r=n instanceof D||n instanceof N||n instanceof B?n.httpStatus:void 0,s=ne(n);return Object.freeze({code:i,stage:e,...r===void 0?{}:{httpStatus:r},...s===void 0?{}:{engineCode:s}})}function K(n,e){if(e!=null&&e.aborted)throw new u("editor-create-failed","first load cancelled",e.reason);if(performance.now()>=n)throw new u("recovery-failed","first load attempt timed out")}const qe=1e3,He=3e4,Ve=500;function ze(n){return Math.min(qe*2**Math.max(0,n),He)+Math.floor(Math.random()*Ve)}function Se(n,e){return Ce(n,ze(e))}function Ce(n,e){return n!=null&&n.aborted?Promise.reject(new u("editor-create-failed","first load cancelled",n.reason)):new Promise((t,i)=>{const r=setTimeout(s,e);function s(){n==null||n.removeEventListener("abort",o),t();}function o(){clearTimeout(r),n==null||n.removeEventListener("abort",o),i(new u("editor-create-failed","first load cancelled",n==null?void 0:n.reason));}n==null||n.addEventListener("abort",o,{once:true});})}async function Ye(n,e,t,i,r,s,o,c,h){var j,T,C;const a=r.interrupt.arm(e.editorKey,()=>o.stage==="api-create"?"api-create":"after-create");a.interrupted.catch(()=>{});let f;const d=new Promise((w,g)=>{f=g;});d.catch(()=>{});const m=()=>f(new u("editor-create-failed","first load cancelled",s.signal.reason)),v=()=>{var w;return s.abort((w=r.signal)==null?void 0:w.reason)};s.signal.addEventListener("abort",m,{once:true}),(j=r.signal)==null||j.addEventListener("abort",v,{once:true}),(T=r.signal)!=null&&T.aborted&&v();let E=setTimeout(()=>f(new u("recovery-failed","first load attempt timed out")),Math.max(0,i-performance.now())),R=false,M,S=false;const L=()=>{clearTimeout(M),M=setTimeout(()=>{R||o.ready||(S=true,h({stage:"document-ready",waitCode:"loading_no_signal"}));},c);},k=()=>{clearTimeout(M),M=void 0;},F={signal:s.signal,deadlineAt:i,model:e,watchInitialAppReady:t===0,onAppReady:()=>{R||(o.stage="document-ready",o.deadlineAt=1/0,clearTimeout(E),L());},onEngineSignal:()=>{R||M===void 0||L();}};try{K(o.deadlineAt,s.signal);const w=n.waitForStep(i-performance.now(),F).then(()=>{o.ready=!0,k(),S&&(S=!1,h());});w.catch(()=>{});const g=(async()=>{a.signalled&&await a.interrupted,K(o.deadlineAt,s.signal),t===0?await n.create(e.config,e.apiJsUrl,F):await n.recreate(e.config,e.apiJsUrl,F),K(o.deadlineAt,s.signal),o.stage==="api-create"&&(o.stage="ready"),await w,K(o.deadlineAt,s.signal);})();await Promise.race([g,a.interrupted,d]),a.signalled&&await a.interrupted,K(o.deadlineAt,s.signal);}catch(w){throw s.abort(),n.destroyInstance(),w}finally{R=true,clearTimeout(E),k(),s.signal.removeEventListener("abort",m),(C=r.signal)==null||C.removeEventListener("abort",v),a.disarm();}}async function Qe(n,e,t,i){var T,C;let r=e,s;const o=performance.now(),c=i.deadlineAt===void 0?1/0:Math.max(0,i.deadlineAt-o),h=Math.min(t.createReadyTimeoutMs,6e4,c);let a=o+h,f=0,d,m,v="not-attempted";const y={stage:"api-create",ready:false,deadlineAt:a};let E,R,M=false,S=0;const L={};let k;const F=w=>{var g;(g=i.publishProgress)==null||g.call(i,Object.freeze({attempt:f+1,...k===void 0?{}:{lastEngineCode:k},...w===void 0?{}:w}));},j=w=>{var g;return (g=i.signal)!=null&&g.aborted?"cancelled":performance.now()>=a?"timeout":te(w)};try{e:for(;;){M&&(M=!1,await Se(i.signal,S++)),a=performance.now()+h,y.stage="api-create",y.deadlineAt=a,F();const w=new AbortController;try{return K(a,i.signal),i.setState("creating"),await Ye(n,r,f,a,i,w,y,t.noSignalNoticeMs,F),a=y.deadlineAt,K(a,i.signal),r}catch(g){a=y.deadlineAt,w.abort(),n.destroyInstance();const _=ne(g);if(_!==void 0&&(k=_,F()),s===void 0&&(E=V(g,X(y.stage)),s=g,d=j(g)),f>0&&(R=V(g,X(y.stage))),(T=i.signal)!=null&&T.aborted||n.readyReached||!Re(g))throw g;const U=!(g instanceof Q&&g.stage==="api-create");M=!(g instanceof Q),console.warn("[vibeoffice] first load failed, refreshing config",f+1,te(g)),i.setState("refreshing");let p;for(;;){y.stage="refresh",a=performance.now()+Math.min(t.firstLoadBudgetMs,c);try{K(a,i.signal);const b=await ye(r.refreshUrl,r.voSess,{timeoutMs:t.fetchTimeoutMs,retries:t.fetchRetries,deadlineAt:a,signal:i.signal,onWait:()=>F({stage:"refresh",waitCode:"saving"}),series:L});v="success",K(a,i.signal),y.stage="validate-config",p=le(b,r.voSess),K(a,i.signal);}catch(b){R=V(b,"refresh");const W=j(b);if((v!=="success"||y.stage==="refresh")&&(v=b instanceof N?"session-dead":W==="cancelled"?"cancelled":W==="timeout"?"timeout":"failed"),b instanceof N||b instanceof B)throw b;if((C=i.signal)!=null&&C.aborted)throw new u("editor-create-failed","first load cancelled",i.signal.reason);if(b instanceof D&&!b.retryable)throw m=W,s;if(!(b instanceof D)&&!Re(b))throw b;if(!(b instanceof D)||b.httpStatus===void 0&&b.lastHttpStatus===void 0){M=!0,U&&f++;continue e}M=!1;const G=L.saving;G!==void 0?(F({stage:"refresh",waitCode:"saving"}),await Ce(i.signal,G.delayMs)):await Se(i.signal,S++);continue}break}if(ue(e,p),he(e.apiJsUrl,p.apiJsUrl),K(a,i.signal),y.stage="apply-config",!Z(r.apiJsUrl,p.apiJsUrl)&&!oe())throw new u("api-js-load-failed","cannot replace existing DocsAPI");K(a,i.signal),r=p,i.setModel(r),U&&f++;}}}catch(w){E&&w!==s&&R===void 0&&(R=V(w,X(y.stage)));const g=ne(w)??ne(s),_=Object.freeze({initialFailure:d??j(w),refreshOutcome:v,finalReason:m??j(w),stage:y.stage,attempt:f+1,elapsedMs:Math.max(0,performance.now()-o),remainingMs:Number.isFinite(a)?Math.max(0,a-performance.now()):0,ready:n.readyReached||y.ready,...g===void 0?{}:{engineCode:g}}),U=w instanceof N?new N(`first load failed: ${_.finalReason}`,void 0,w.httpStatus):w instanceof B?new B(`first load failed: ${_.finalReason}`):new u(w instanceof u?w.code:"editor-create-failed",`first load failed: ${_.finalReason}`);throw U.diagnostic=_,U.diagnostics=Object.freeze({initialFailure:E??V(w,X(y.stage)),...R?{recoveryFailure:R}:{},stage:X(y.stage),attempt:_.attempt,readyReached:_.ready,terminal:true}),U}}function Xe(n){return n instanceof D&&n.retryable&&n.httpStatus===void 0&&typeof navigator<"u"&&navigator.onLine===false}function Ze(n){return new Promise(e=>{if(n.aborted||typeof window>"u"||navigator.onLine){e();return}const t=()=>{window.removeEventListener("online",t),n.removeEventListener("abort",t),e();};window.addEventListener("online",t),n.addEventListener("abort",t);})}function ie(n,e){const t={...e,expectedEditorKey:void 0};return n.removedEditorKey!==e.removedEditorKey&&(t.removedEditorKey=void 0),n.reason==="reopen"&&(t.reason="reopen"),n.placementGone===true&&(t.placementGone=true),n.unsavedLost===true&&(t.unsavedLost=true),n.instanceGone===true&&(t.instanceGone=true),t.engineCode===void 0&&n.engineCode!==void 0&&(t.engineCode=n.engineCode),t}function xe(n){const e={...n};return delete e.events,delete e.documentType,delete e.type,e}class et{constructor(e,t,i,r,s={}){this.host=e,this.cb=t,this.timeouts=i,this.pinned=r,this.options=s,this.inFlight=false,this.dirty=null,this.terminal=false,this.awaitingDocumentKey=null,this.unsavedLossPending=false,this.documentWaitInterrupted=false,this.lifetime=new AbortController;}unsavedLost(){const{unsaved:e,disconnected:t}=this.host.unsavedState();return e||this.options.unsavedChangesSignal==="conservative"&&(t||this.host.offlineAfterReady())}unsavedPending(e){return e.unsavedLost===true||this.unsavedLossPending||this.unsavedLost()}isReopen(e){return e.reason==="reopen"||e.trigger==="engine-disconnect"||e.placementGone===true||e.instanceGone===true||this.host.instance===null||this.host.unsavedState().disconnected}destroy(){this.dirty=null,this.lifetime.abort();}stopped(){return this.lifetime.signal.aborted||this.cb.getState()==="closed"||this.terminal}recover(e){if(!this.stopped()){if(this.inFlight){const t=this.dirty;let r=t!==null&&(t.expectedEditorKey===void 0||t.placementGone===true)?ie(t,e):e;t!==null&&r.removedEditorKey!==void 0&&t.removedEditorKey!==r.removedEditorKey&&(r={...r,removedEditorKey:void 0}),this.dirty=r,this.interruptDocumentWait(r);return}this.run(e);}}interruptDocumentWait(e){const t=this.awaitingDocumentKey;t===null||!this.willRun(e)||e.expectedEditorKey!==void 0&&e.expectedEditorKey===t||e.removedEditorKey!==void 0&&e.removedEditorKey!==t&&e.placementGone!==true||(this.awaitingDocumentKey=null,this.documentWaitInterrupted=true,this.host.cancelStep());}async run(e){this.inFlight=true;try{await this.cycle(e);}finally{this.inFlight=false;const t=this.dirty;this.dirty=null,t&&!this.stopped()&&this.willRun(t)&&this.run(t);}}async cycle(e){const t=this.cb.getModel();if(this.cb.setState("refreshing"),this.stopped())return;let i=e.refreshUrlOverride;i!==void 0&&!Pe(this.pinned.refreshUrl,i)&&(console.warn("[vibeoffice] untrusted refresh_url origin in session event, ignored"),i=void 0);let r;try{const a=await ye(i??t.refreshUrl,t.voSess,{timeoutMs:this.timeouts.fetchTimeoutMs,retries:this.timeouts.fetchRetries,signal:this.lifetime.signal,onWait:f=>{var d,m;this.stopped()||(m=(d=this.cb).emitWaiting)==null||m.call(d,{code:"saving",stage:"refresh",attempt:f.attempt,retryAfterMs:f.retryAfterMs,unsavedChanges:this.unsavedPending(e)});}});if(this.stopped())return;r=le(a,t.voSess,i),ue(this.pinned,r),he(this.pinned.apiJsUrl,r.apiJsUrl);}catch(a){if(this.stopped())return;if(a instanceof N){this.cb.setState("closed"),this.cb.emitSessionClosed("expired");return}if(Xe(a)){if(await Ze(this.lifetime.signal),this.stopped())return;this.dirty=ie(e,this.dirty??e);return}const f=a instanceof B;if(this.cb.setState("error"),this.stopped())return;const d=a instanceof u?a:new u("recovery-failed","fetch failed",a);if(this.cb.emitError(d),this.stopped())return;this.cb.emitFailover({recovered:false,method:null,trigger:e.trigger,reason:e.reason,editorKey:t.editorKey}),f&&(this.terminal=true,this.dirty=null);return}const s=this.isReopen(e),o=r.editorKey===t.editorKey&&e.instanceGone!==true&&this.host.instance!==null&&!this.host.unsavedState().disconnected;if(r.rev<t.rev||o){this.cb.setState("ready");return}const c=s&&this.unsavedPending(e);if(c&&(this.unsavedLossPending=true),!s)try{const a=this.host.waitForStep(this.timeouts.refreshFileTimeoutMs,{signal:this.lifetime.signal});a.catch(()=>{});try{this.host.refreshFile(xe(r.config),r);}catch(f){throw this.host.cancelStep(),await a.catch(()=>{}),f}await a,this.succeed(r,"refreshFile",e,!1);return}catch{}if(this.stopped()||(this.cb.setState("recreating"),this.stopped()))return;const h=Math.max(0,this.timeouts.recreateRetries);for(let a=0;;a++){let f=false;this.documentWaitInterrupted=false;const d={signal:this.lifetime.signal,model:r,onAppReady:()=>{f=true,!this.stopped()&&(this.awaitingDocumentKey=r.editorKey,queueMicrotask(()=>{this.dirty!==null&&this.awaitingDocumentKey===r.editorKey&&this.interruptDocumentWait(this.dirty);}));}},m=performance.now()+this.timeouts.recreateTimeoutMs,v=this.host.waitForStep(this.timeouts.recreateTimeoutMs,d);v.catch(()=>{});try{if(a===0&&!Z(t.apiJsUrl,r.apiJsUrl)&&!oe())throw new u("api-js-load-failed","cannot replace loaded DocsAPI");if(await this.host.recreate(r.config,r.apiJsUrl,d),this.stopped())return;await v,this.awaitingDocumentKey=null,this.succeed(r,"recreate",e,c);return}catch(y){if(this.awaitingDocumentKey=null,this.host.cancelStep(),await v.catch(()=>{}),this.stopped())return;if(this.documentWaitInterrupted){this.documentWaitInterrupted=false,this.host.destroyInstance(),this.dirty=ie({...e,unsavedLost:c,instanceGone:true},this.dirty??e);return}if(!f&&!(y instanceof H)&&performance.now()>=m&&a<h){this.host.destroyInstance();const R=this.dirty;if(R!==null&&this.willRun(R)){this.dirty=ie({...e,unsavedLost:c,instanceGone:true},R);return}continue}if(this.cb.setState("error"),this.stopped()||(this.cb.emitError(y instanceof u?y:new u("recovery-failed","recreate failed",y)),this.stopped()))return;this.cb.emitFailover({recovered:false,method:null,trigger:e.trigger,reason:e.reason,editorKey:r.editorKey});return}}}willRun(e){return e.expectedEditorKey===void 0||e.expectedEditorKey!==this.cb.getModel().editorKey}succeed(e,t,i,r){this.stopped()||(t==="recreate"&&(this.unsavedLossPending=false),this.cb.setModel(e),this.cb.setState("ready"),!this.stopped()&&(this.cb.emitDocumentReady(),!this.stopped()&&this.cb.emitFailover({recovered:true,method:t,trigger:i.trigger,reason:i.reason,editorKey:e.editorKey,...r?{outcome:"reopened_unsaved_lost",diagnostic:Object.freeze({trigger:i.trigger,...i.engineCode===void 0?{}:{engineCode:i.engineCode}})}:{}})));}}const tt=256,nt=3e4,it=5,rt=1e3,st=n=>new EventSource(n);class ot{constructor(e,t,i,r=st){this.cb=i,this.factory=r,this.es=null,this.closedByUs=false,this.reconnectAttempt=0,this.consecutiveInstantCloses=0,this.degradedEmitted=false,this.lastOpenAt=0,this.reconnectTimer=null,this.seenIds=new Set,this.seenQueue=[],this.url=me(e,t);}get closed(){return this.closedByUs}start(){this.closedByUs=false,this.connect();}close(){this.closedByUs=true,this.reconnectTimer!==null&&(clearTimeout(this.reconnectTimer),this.reconnectTimer=null),this.es&&(this.es.close(),this.es=null);}connect(){let e;try{e=this.factory(this.url);}catch{this.es=null,this.markInstantClose(),this.scheduleReconnect();return}this.es=e,this.lastOpenAt=0,e.addEventListener("open",()=>{this.lastOpenAt=Date.now(),this.reconnectAttempt=0;}),e.addEventListener("hello",t=>{const i=this.parseDeduped(t);i!==void 0&&this.cb.onHello(i);}),e.addEventListener("session-refresh",t=>{const i=t.lastEventId??"",r=this.parseDeduped(t);r!==void 0&&this.cb.onSessionRefresh(r,i);}),e.addEventListener("session-closed",t=>{const i=this.parseDeduped(t);i!==void 0&&(this.closedByUs=true,this.cb.onSessionClosed(i),this.es&&(this.es.close(),this.es=null));}),e.addEventListener("error",()=>{this.onError();});}parseDeduped(e){const t=e,i=t.lastEventId;if(i){if(this.seenIds.has(i))return;this.remember(i);}try{return JSON.parse(t.data)}catch{return}}remember(e){if(this.seenIds.add(e),this.seenQueue.push(e),this.seenQueue.length>tt){const t=this.seenQueue.shift();t!==void 0&&this.seenIds.delete(t);}}onError(){if(this.closedByUs)return;const e=this.es;if(!e||e.readyState!==EventSource.CLOSED)return;const t=this.lastOpenAt>0?Date.now()-this.lastOpenAt:0;this.lastOpenAt===0||t<rt?this.markInstantClose():(this.consecutiveInstantCloses=0,this.degradedEmitted=false),e.close(),this.es=null,this.scheduleReconnect();}markInstantClose(){this.consecutiveInstantCloses++,this.consecutiveInstantCloses>=it&&!this.degradedEmitted&&(this.degradedEmitted=true,this.cb.onDegraded());}scheduleReconnect(){if(this.closedByUs)return;const e=Math.min(1e3*2**this.reconnectAttempt,nt);this.reconnectAttempt++,this.reconnectTimer=setTimeout(()=>{this.reconnectTimer=null,this.closedByUs||this.connect();},e);}}const _e=Symbol("vibeoffice.eventSourceFactory");function at(n){return n[_e]}function dt(n){return n==="closed"?"expired":n}function ct(n,e){if(n!==void 0){if(!n||n.version!==1||!Number.isSafeInteger(n.remainingMs)||!Number.isSafeInteger(n.helperRemainingMs)||n.remainingMs<=0||n.helperRemainingMs<=0||n.helperRemainingMs>Math.min(15e4,n.remainingMs))throw new u("invalid-open-config","invalid firstLoadContext");return e+Math.min(n.remainingMs,n.helperRemainingMs)}}async function lt(n){var G,Ie,Me,Le,Te;if((G=n.signal)!=null&&G.aborted)throw new u("editor-create-failed","first load cancelled");const e=performance.now(),t=ct(n.firstLoadContext,e),i=new AbortController,r=ce(n.openConfig),s={...de,...n.timeouts??{}};let o=r,c="loading",h=false,a=null;const f=new Ge,d=new z,m=()=>c,v=l=>{if(l===c)return;const A=c;c=l,d.emit("stateChange",l,A);};let y=false,E=null;const R=l=>{y||(E=l),d.emit("sessionClosed",l);},M={onRequestRefreshFile:()=>{L.recover({trigger:"ds-request"});},onIdleError:l=>{const A=ae(l);if(A===Ee){L.recover({trigger:"engine-disconnect",engineCode:A});return}d.emit("error",new u("ds-error","api.js onError",l));},onIdleDocumentReady:()=>{d.emit("documentReady");}},S=new Je(n.element,n.documentServerEvents??{},M),L=new et(S,{getModel:()=>o,setModel:l=>{o=l;},setState:l=>v(l),getState:m,emitFailover:l=>d.emit("failover",l),emitDocumentReady:()=>d.emit("documentReady"),emitError:l=>d.emit("error",l),emitSessionClosed:l=>k(l),emitWaiting:l=>d.emit("waiting",l)},s,r,{unsavedChangesSignal:n.unsavedChangesSignal??"conservative"}),k=l=>{S.closeSession(),L.destroy(),C.close(),v("closed"),R(l);},F=l=>{L.recover({trigger:"hello-mismatch",expectedEditorKey:l.editor_key,placementGone:!l.editor_key});},j=l=>{L.recover({trigger:"session-refresh",reason:l.reason,refreshUrlOverride:l.refresh_url,expectedEditorKey:l.reason==="reopen"?void 0:l.editor_key,...l.reason==="reopen"&&l.editor_key?{removedEditorKey:l.editor_key}:{}});},T=l=>{k(dt(l.reason));},C=new ot(r.eventsUrl,r.voSess,{onHello:l=>{if(c!=="closed"&&l.editor_key!==o.editorKey){if(!h){f.signal("hello-mismatch",`hello editor_key="${l.editor_key}"`,o.editorKey,()=>F(l));return}F(l);}},onSessionRefresh:l=>{if(c!=="closed"){if(!h){f.signal("session-refresh",`session-refresh reason=${l.reason}`,o.editorKey,()=>j(l));return}j(l);}},onSessionClosed:l=>{if(c!=="closed"){if(!h){f.signal("session-closed",`session-closed reason=${l.reason}`,o.editorKey,()=>T(l));return}T(l);}},onDegraded:()=>{c!=="closed"&&d.emit("error",new u("sse-degraded","SSE channel degraded"));}},at(n));let w=false,g=true;const _=()=>{var l;return (l=n.signal)==null?void 0:l.removeEventListener("abort",p)},U=()=>{if(w)return g;w=true,_();for(const l of [()=>S.destroy(),()=>i.abort(),()=>L.destroy(),()=>C.close()])try{l();}catch{g=false;}return g=g&&S.cleanupComplete,g},p=()=>{U(),v("closed");},b=()=>{var l;if((l=n.signal)!=null&&l.aborted||w)throw new u("editor-create-failed","first load cancelled")},W=()=>{if(b(),t!==void 0&&performance.now()>=t)throw new u("recovery-failed","first load budget exhausted")};(Ie=n.signal)==null||Ie.addEventListener("abort",p,{once:true});try{W(),C.start(),W(),o=await Qe(S,o,s,{setState:v,setModel:A=>{o=A;},interrupt:f,publishProgress:A=>{var O;a=A;try{(O=n.onFirstLoadProgress)==null||O.call(n,A);}catch{}if(A.waitCode!==void 0){const $={code:A.waitCode,stage:A.stage??"document-ready",attempt:A.attempt,...A.waitCode==="saving"?{unsavedChanges:!1}:{}};d.emit("waiting",$);}},signal:i.signal,deadlineAt:t}),b(),h=!0,v("ready"),f.replayPending(),C.closed&&m()!=="closed"&&C.start();const l={get state(){return c},get editorKey(){return o.editorKey},get instance(){return S.instance},get firstLoad(){return a},on(A,O){const $=d.on(A,O);if(A==="sessionClosed"&&E!==null)try{O(E);}catch{}return $},destroy(){U(),v("closed"),d.clear(),E=null;}};return b(),y=!0,_(),l}catch(l){const A=U();v((Me=n.signal)!=null&&Me.aborted?"closed":"error");const O=l instanceof u?l:new u("editor-create-failed","failed to create editor"),$=S.readyReached,Oe=$?"ready":"create",je=(Le=n.signal)!=null&&Le.aborted?"cancelled":te(O);throw O.diagnostic=Object.freeze({...O.diagnostic??{initialFailure:je,refreshOutcome:"not-attempted",finalReason:je,stage:$?"ready":"api-create",attempt:1,elapsedMs:Math.max(0,performance.now()-e),remainingMs:Math.max(0,(t??performance.now())-performance.now())},ready:$}),O.diagnostics=Object.freeze({...O.diagnostics??{initialFailure:V(O,Oe),stage:Oe,attempt:O.diagnostic.attempt,terminal:true},...A?{}:{stage:"cleanup"},readyReached:$}),A&&!((Te=n.signal)!=null&&Te.aborted)&&!$&&(O.handoff=Object.freeze({version:1,action:"manual",automaticOpenAllowed:false,readyReached:false,terminal:true,cleanupComplete:true})),O}}J.DEFAULT_TIMEOUTS=de,J.EVENT_SOURCE_FACTORY=_e,J.VibeOfficeError=u,J.createEditor=lt,Object.defineProperty(J,Symbol.toStringTag,{value:"Module"});});
			
		} (helper_umd$1, helper_umd$1.exports));
		return helper_umd$1.exports;
	}

	var helper_umdExports = requireHelper_umd();

	const SECONDS_TO_MARK_AS_STILL_WORKING = 60;

	/** The component serving the actions of this shell. */
	const COMPONENT_NAME = 'bitrix:disk.file.editor-vibeoffice';

	// The engine endpoint of ajax actions and the action ending an edit session, shared with the
	// OnlyOffice shell (@see BX.Disk.endEditSession in c_disk.js). Only the beacon of the unload path
	// addresses the action directly: `ajax.runAction` returns a promise nobody is left to await, and
	// the browser cancels its request together with the page.
	const AJAX_ENDPOINT = '/bitrix/services/main/ajax.php';
	const END_SESSION_ACTION = 'disk.api.onlyoffice.endSession';
	const SAVE_REFUSAL_REASON_ACTION = 'disk.api.vibeoffice.getSavedRefusalReason';
	const EXTERNAL_SAVE_REFUSAL_REASON_ACTION = 'disk.api.vibeoffice.getSavedRefusalReasonForExternalLink';
	const ACCESS_CONTROL_TYPES = Object.freeze(['with-change-rights', 'with-sharing', 'without-edit', 'blocked-by-feature']);

	// The shape of a path of this very portal: one leading slash, no host of its own and no backslash
	// (@see isSamePortalPath).
	const PORTAL_PATH_SHAPE = /^\/(?!\/)[^\\]*$/;

	// The helper facade events the wrapper reacts to (HelperEvents, types.ts:178-186). Recovery
	// itself is fully owned by the helper, as is the loading UI; the wrapper subscribes only to what
	// it turns into Disk-side UI, so `stateChange` and `documentReady` are not among them.
	const HELPER_EVENTS = ['failover', 'sessionClosed', 'error', 'waiting'];

	// Session-close reasons the helper relays from the SSE channel (SseSessionClosed,
	// types.ts:116-119).
	const SESSION_CLOSED_SAVED = 'saved';
	const SESSION_CLOSED_REVOKED = 'revoked';
	const SESSION_CLOSED_EXPIRED = 'expired';

	// A session-close reaction that has to navigate the page (expired → reload, revoked/saved on a
	// standalone page → downgrade to view) is deferred by this long so the accompanying message is
	// actually painted before the navigation happens — an immediate `document.location` change would
	// swap the page before the toast is seen (parity with the OnlyOffice force-reload UX).
	const SESSION_CLOSE_NAVIGATION_DELAY_MS = 3000;

	// `document.saved` is delivered asynchronously after the editor reports `sessionClosed('saved')`.
	// Poll the host-side content version before opening the view, with a bounded fallback for a save
	// that does not produce a new version or a temporarily unavailable AJAX endpoint.
	const SAVED_CONFIRMATION_INITIAL_POLL_INTERVAL_MS = 1000;
	const SAVED_CONFIRMATION_MAX_POLL_INTERVAL_MS = 5000;
	const SAVED_CONFIRMATION_POLL_BACKOFF_FACTOR = 1.5;
	const SAVED_CONFIRMATION_POLL_JITTER_RATIO = 0.2;
	const SAVED_CONFIRMATION_TIMEOUT_MS = 30000;

	// The helper emits error(...) and failover({recovered:false}) synchronously for one recovery
	// failure; a failover within this window of the last surfaced error is that same event and its
	// toast is suppressed (see handleFailover).
	const FAILOVER_ERROR_DEDUP_WINDOW_MS = 1000;

	// VibeOfficeError.code → user-facing reaction (helper types.ts:199-207). Every code maps to a
	// localized message so the editor never fails silently. `terminal: true` means the editor is no
	// longer usable → a blocking messagebox; `terminal: false` is a transient degradation → a toast.
	// `sse-degraded` is the only non-terminal code here: the live channel is degraded but editing can
	// continue, so the actual terminal point stays on `sessionClosed`/a terminal `error`.
	// Exported for the test that keeps every code covered by a phrase of the extension; the entry
	// point does not re-export it, so the public surface stays `BX.Disk.Editor.Vibeoffice`.
	const ERROR_REACTIONS = {
		'api-js-load-failed': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_API_JS_LOAD_FAILED',
			terminal: true
		},
		'editor-create-failed': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_EDITOR_CREATE_FAILED',
			terminal: true
		},
		'invalid-open-config': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_INVALID_OPEN_CONFIG',
			terminal: true
		},
		'refresh-fetch-failed': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_REFRESH_FETCH_FAILED',
			terminal: false
		},
		'session-dead': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_SESSION_DEAD',
			terminal: true
		},
		'sse-degraded': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_SSE_DEGRADED',
			terminal: false
		},
		'recovery-failed': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_RECOVERY_FAILED',
			terminal: true
		},
		'ds-error': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_DS_ERROR',
			terminal: true
		},
		'save-refused': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_SAVE_REFUSED',
			terminal: true
		}
	};

	// Fallback for an unknown / missing code: still surfaced (never silent), and treated as terminal.
	const ERROR_FALLBACK = {
		messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_GENERIC',
		terminal: true
	};

	/**
	 * Disk wrapper around `@vibeoffice/helper`.
	 *
	 * Additive sibling of {@see OnlyOffice}, but the engine boundary is different: the native
	 * `DocsAPI.DocEditor` is NEVER created here — the helper's `createEditor` owns api.js
	 * loading, the SSE session channel and seamless failover/recreate. This class only:
	 *   - feeds the platform-signed `openConfig` to `createEditor` as-is,
	 *   - subscribes to the facade events and maps them onto Disk UI/channels,
	 *   - reuses the engine-orthogonal OnlyOffice behaviours (SidePanel close, endEditSession,
	 *     markAsStillWorking, onSaved/onClosed emits),
	 *   - tears the editor (SSE + native) down via `editor.destroy()` on unmount.
	 *
	 * `#documentServerEvents` is the pass-through seam for api.js handlers not reserved by the
	 * helper (e.g. `onRequestHistory*` for history, driven via `historyEnabled`).
	 */
	class Vibeoffice {
		// `@vibeoffice/helper` API, injected by index.js after the vendored UMD runs. Static so a
		// single capture serves every instance; tests can override it.
		static #helper = null;
		static setHelper(helper) {
			Vibeoffice.#helper = helper;
		}
		static getHelper() {
			return Vibeoffice.#helper;
		}
		openConfig = null;
		documentSession = null;
		object = null;
		attachedObject = null;
		context = null;
		targetNode = null;
		editorNode = null;
		elementId = null;
		linkToView = null;
		linkToDownload = null;
		linkToEdit = null;
		historyEnabled = false;
		externalLinkMode = false;
		texts = {};
		pullConfig = null;
		publicChannel = null;
		editor = null;
		documentWasChanged = false;
		#unsubscribers = [];
		#conflictNotified = false;
		#trackWorkTimer = null;
		#documentServerEvents = {};
		// Only a real server answer resets this; cache hits issue no request and leave it untouched.
		#badUserInfoAttempts = 0;
		// Author display names resolved through getUserInfo, keyed by userId (the response depends on
		// the user alone - infoToken only authorizes the call). The promise is cached, not the value,
		// so events arriving while a request is in flight join it instead of firing their own.
		#userNameCache = new Map();
		#currentUserAvatarPromise = null;
		#avatarRecipients = new WeakSet();
		// Timestamps of the native "editor settled" events, used to gate document-change tracking
		// (see #handleDocumentStateChange). Parity with the OnlyOffice sibling.
		#caughtDocumentReady = null;
		#caughtInfoEvent = null;
		// When #handleError last surfaced a reaction to the user. The helper emits error(...) THEN
		// failover({recovered:false}) for the same recovery failure (helper.umd.cjs), so handleFailover
		// uses this to suppress its duplicate toast.
		#lastErrorNotifiedAt = null;
		#notifiedUnsavedReopens = new Set();
		// Pending deferred session-close navigation (expired / standalone downgrade-to-view),
		// cleared on destroy so it never navigates a torn-down editor.
		#pendingNavigationTimer = null;
		#lifecycleGeneration = 0;
		#firstLoadController = new AbortController();
		#openingDeadline = Infinity;
		#restartTarget = null;
		#manualRestartBox = null;
		#manualRestartPending = false;
		#manualRestartClosePromise = null;
		#waitingBox = null;
		#waitingFallback = null;
		#waitingCode = null;
		#waitingUnsavedChanges = false;
		#saveRefusedShown = false;
		#saveRefusedBox = null;
		#destroyed = false;
		// The rename asked for last: the engine can ask again while the previous request is in flight
		// (a repeated Enter), and the answers resolve in any order, so only the last one is applied.
		#renameGeneration = 0;
		// A transition to editing being made right now. The button of the engine draws no waiting of its
		// own and the shell cannot disable it from outside the frame, so a repeated press is ignored: the
		// press already under way answers the engine itself, with a refusal or with leaving the page.
		#reopening = false;
		// Idempotency guard for handleClose(): SidePanel.Slider:onClose,
		// pagehide and postMessage 'closeIframe' can all fire it, but the teardown /
		// endEditSession must run once. Never reset (a new wrapper is a new instance).
		#closed = false;
		constructor(editorOptions) {
			const options = main_core.Type.isPlainObject(editorOptions) ? editorOptions : {};
			this.#openingDeadline = openingDeadline(options.openingBudget);
			this.#restartTarget = isSamePortalPath(options.restartTarget) ? options.restartTarget : null;
			const headerComposition = disk_documentHeader.mapCompositionDtoToModel(options.headerComposition);
			this.openConfig = options.openConfig;
			this.documentSession = options.documentSession;
			this.object = options.object || {};
			this.attachedObject = options.attachedObject || {
				id: null
			};
			this.targetNode = options.targetNode;
			this.editorNode = options.editorNode;
			this.linkToView = options.linkToView;
			this.linkToDownload = options.linkToDownload;
			this.linkToEdit = options.linkToEdit;
			this.historyEnabled = options.historyEnabled === true;
			this.externalLinkMode = options.externalLinkMode === true;
			this.texts = options.texts || {};
			this.pullConfig = options.pullConfig || null;
			this.publicChannel = main_core.Type.isStringFilled(options.publicChannel) ? options.publicChannel : null;
			this.context = {
				currentUser: options.currentUser,
				documentSession: this.documentSession,
				object: this.object,
				attachedObject: this.attachedObject
			};

			// The api.js contract works with an element id. The template passes the node; resolve
			// it to its id (helper passes `element` straight into `new DocsAPI.DocEditor(id, ...)`).
			this.elementId = this.#resolveElementId(options.element, this.editorNode);

			// api.js handlers flow through here to the native DocsAPI editor: the helper (vendor
			// helper.umd.cjs) passes them straight through, except onAppReady/onDocumentReady/onError/
			// onRequestRefreshFile, which it wraps and calls ours after its own handling.
			// We wire the same document-change signal the OnlyOffice sibling uses:
			// onDocumentStateChange marks the document as changed once the editor has settled, so
			// endEditSession/emitEventOnClosed report a truthful `documentWasChanged` (it drives the
			// c_disk.js "document is being saved" balloon and its `vibeoffice` pull "saved" toast).
			// P4 history wiring (onRequestHistory*, gated by `historyEnabled`) lands here later.
			this.#documentServerEvents = {
				onDocumentReady: this.#handleNativeDocumentReady.bind(this),
				onInfo: this.#handleNativeInfo.bind(this),
				onDocumentStateChange: this.#handleDocumentStateChange.bind(this)
			};
			if (headerComposition !== null && headerComposition.elements.includes(disk_documentHeader.HeaderElement.Access) && Number.isInteger(headerComposition.object.id) && headerComposition.object.id > 0 && ACCESS_CONTROL_TYPES.includes(headerComposition.access.controlType)) {
				this.#documentServerEvents.onRequestSharingSettings = () => disk_documentHeader.openAccess(headerComposition);
			}
			if (headerComposition !== null && headerComposition.elements.includes(disk_documentHeader.HeaderElement.Rename)) {
				this.#documentServerEvents.onRequestRename = event => {
					void this.#handleRequestRename(event, headerComposition);
				};
			}

			// The declaration itself is what offers the transition: the engine draws the button of editing
			// in a viewing by the sole fact the handler is there, so the address the server gave for this
			// opening is the whole condition - no right of its own is decided here.
			if (main_core.Type.isStringFilled(this.linkToEdit)) {
				this.#documentServerEvents.onRequestEditRights = () => {
					void this.#handleRequestEditRights(headerComposition);
				};
			}
			this.loadDiskExtensionInTopWindow();
			if (this.isEditMode()) {
				this.#closeParentViewer();
			}
			this.bindEvents();
			this.#initPull();
			if (options.initialNotice === true) {
				this.#notify(this.#text('openingNotice', ''));
			}
			void this.#createEditor();
		}
		async #createEditor() {
			const lifecycleToken = this.#lifecycleGeneration;
			const context = this.#openingDeadline === Infinity ? undefined : firstLoadContext(this.#openingDeadline, performance.now());
			if (context === null) {
				this.#handleError({
					code: 'editor-create-failed'
				});
				return;
			}
			const createEditor = Vibeoffice.#helper?.createEditor;
			if (!main_core.Type.isFunction(createEditor)) {
				// The vendored helper UMD must have run (index.js side-effect import). If it did not,
				// the editor can never be created — surface the terminal reaction rather than only
				// logging, so the class keeps its "never fails silently" contract.
				if (this.#isCurrent(lifecycleToken)) {
					this.#handleError({
						code: 'editor-create-failed'
					});
				}
				return;
			}
			try {
				const editor = await createEditor({
					element: this.elementId,
					openConfig: this.openConfig,
					documentServerEvents: this.#documentServerEvents,
					onFirstLoadProgress: progress => {
						if (this.#isCurrent(lifecycleToken)) {
							this.#handleWaiting({
								code: progress?.waitCode,
								stage: progress?.stage,
								attempt: progress?.attempt
							});
						}
					},
					signal: this.#firstLoadController.signal,
					...(context === undefined ? {} : {
						firstLoadContext: context
					})
				});
				if (!this.#isCurrent(lifecycleToken)) {
					editor.destroy();
					return;
				}
				this.editor = editor;
				// Initial onDocumentReady may precede the resolution of createEditor.
				void this.#applyCurrentUserAvatar();
			} catch (error) {
				if (!this.#isCurrent(lifecycleToken)) {
					return;
				}

				// Initial creation failed; surface the reaction without masking diagnostics.
				console.error('[vibeoffice] createEditor failed', error);
				this.#handleError(error);
				return;
			}
			this.#subscribeFacadeEvents(lifecycleToken);
			if (this.isEditMode()) {
				this.registerTimerToTrackWork();
			}
		}
		#subscribeFacadeEvents(lifecycleToken) {
			const editor = this.editor;
			if (!editor || !this.#isCurrent(lifecycleToken)) {
				return;
			}
			const handlers = {
				failover: event => {
					if (this.#isCurrentEditor(editor, lifecycleToken)) {
						this.handleFailover(event);
					}
				},
				sessionClosed: reason => {
					if (this.#isCurrentEditor(editor, lifecycleToken)) {
						this.handleSessionClosed(reason);
					}
				},
				error: error => {
					if (this.#isCurrentEditor(editor, lifecycleToken)) {
						this.#handleError(error);
					}
				},
				waiting: event => {
					if (this.#isCurrentEditor(editor, lifecycleToken)) {
						this.#handleWaiting(event);
					}
				}
			};
			HELPER_EVENTS.forEach(event => {
				const off = editor.on(event, handlers[event]);
				if (main_core.Type.isFunction(off)) {
					this.#unsubscribers.push(off);
				}
			});
		}
		#handleUnsavedReopen(event) {
			const transitionId = main_core.Type.isStringFilled(event?.editorKey) ? `${this.documentSession?.id}:${event.editorKey}` : null;
			if (transitionId !== null && this.#notifiedUnsavedReopens.has(transitionId)) {
				return;
			}
			if (transitionId !== null) {
				this.#notifiedUnsavedReopens.add(transitionId);
				if (this.#notifiedUnsavedReopens.size > 64) {
					this.#notifiedUnsavedReopens.delete(this.#notifiedUnsavedReopens.values().next().value);
				}
			}
			this.#notify(main_core.Loc.getMessage('DISK_EDITOR_VIBEOFFICE_REOPENED_UNSAVED_LOST'));
		}
		#handleWaiting(event) {
			if (event?.code !== 'saving' && event?.code !== 'loading_no_signal') {
				return;
			}
			const unsavedChanges = event.code === 'saving' && event.unsavedChanges === true;
			const messageId = event.code === 'saving' ? 'DISK_EDITOR_VIBEOFFICE_WAITING_SAVING' : 'DISK_EDITOR_VIBEOFFICE_WAITING_LOADING_NO_SIGNAL';
			const message = [main_core.Loc.getMessage(messageId), unsavedChanges ? main_core.Loc.getMessage('DISK_EDITOR_VIBEOFFICE_WAITING_UNSAVED_CHANGES') : null].filter(Boolean).join(' ');
			if (this.#waitingCode === event.code) {
				if (this.#waitingUnsavedChanges !== unsavedChanges) {
					this.#waitingUnsavedChanges = unsavedChanges;
					this.#waitingBox?.setMessage(message);
					if (this.#waitingFallback) {
						this.#waitingFallback.querySelector('p').textContent = message;
					}
				}
				return;
			}
			this.#closeWaiting();
			this.#waitingCode = event.code;
			this.#waitingUnsavedChanges = unsavedChanges;
			const MessageBox = BX.UI?.Dialogs?.MessageBox;
			if (!main_core.Type.isFunction(MessageBox?.create)) {
				const dialog = document.createElement('dialog');
				const description = document.createElement('p');
				const cancel = document.createElement('button');
				description.textContent = message;
				cancel.type = 'button';
				cancel.textContent = main_core.Loc.getMessage('DISK_EDITOR_VIBEOFFICE_WAITING_CANCEL') || '';
				dialog.append(description, cancel);
				document.body.append(dialog);
				main_core.Event.bind(cancel, 'click', () => this.handleClose());
				main_core.Event.bind(dialog, 'cancel', cancelEvent => {
					cancelEvent.preventDefault();
					this.handleClose();
				});
				dialog.showModal();
				this.#waitingFallback = dialog;
				return;
			}
			this.#waitingBox = MessageBox.create({
				message,
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
				okCaption: main_core.Loc.getMessage('DISK_EDITOR_VIBEOFFICE_WAITING_CANCEL'),
				onOk: () => {
					this.#closeWaiting();
					this.handleClose();
				},
				popupOptions: {
					events: {
						onPopupClose: () => {
							if (this.#waitingBox !== null) {
								this.handleClose();
							}
						}
					}
				}
			});
			this.#waitingBox.show();
		}
		#closeWaiting() {
			this.#waitingCode = null;
			this.#waitingUnsavedChanges = false;
			const waitingBox = this.#waitingBox;
			this.#waitingBox = null;
			waitingBox?.close();
			this.#waitingFallback?.remove();
			this.#waitingFallback = null;
		}

		// region [P2.T2] facade event reactions ----------------------------------------------

		handleFailover(event) {
			if (!this.#isActive()) {
				return;
			}

			// The helper already attempted (and possibly completed) recovery on its own. The
			// wrapper only reflects the outcome in the UI — it never touches the platform session.
			if (event && event.recovered === true) {
				this.#closeWaiting();
				if (event.outcome === 'reopened_unsaved_lost') {
					this.#handleUnsavedReopen(event);
					return;
				}
				this.#notify(this.#text('failoverRecovered', 'DISK_EDITOR_VIBEOFFICE_FAILOVER_RECOVERED'), 'success');
				return;
			}
			this.#closeWaiting();

			// A failed recovery is emitted by the helper as error(...) immediately followed by
			// failover({recovered:false}) for the SAME event (helper.umd.cjs cycle()), so #handleError
			// has already surfaced it (terminal messagebox or transient toast). Skip this toast when an
			// error was just shown so the user sees one message, not two. With no preceding error we
			// still notify — never fail silently.
			if (this.#lastErrorNotifiedAt !== null && Date.now() - this.#lastErrorNotifiedAt < FAILOVER_ERROR_DEDUP_WINDOW_MS) {
				return;
			}
			this.#notify(this.#text('failoverFailed', 'DISK_EDITOR_VIBEOFFICE_FAILOVER_FAILED'));
		}
		handleSessionClosed(reason) {
			if (!this.#isActive()) {
				return;
			}
			this.#closeWaiting();
			switch (reason) {
				case SESSION_CLOSED_SAVED:
					// vibeoffice persists versions via webhook (backend), so the onSaved-equivalent
					// is driven by sessionClosed('saved'), NOT a pull command.
					this.emitEventOnSaved();
					this.#waitForSavedThenClose();
					break;
				case SESSION_CLOSED_REVOKED:
					// SDD-frontend: revoked → message + downgrade to view / close.
					this.#notify(this.#text('sessionRevoked', 'DISK_EDITOR_VIBEOFFICE_SESSION_REVOKED'));
					this.#closeSliderOrDowngradeToView();
					break;
				case SESSION_CLOSED_EXPIRED:
					// 401/403 from refresh is folded into 'expired' by the helper; no HTTP-code
					// handling needed on the front. Downgrade like 'revoked' does instead of reloading:
					// the current address may open editing again and take a fresh session slot, while
					// `linkToView` is pinned to viewing. Delayed so the message is seen first.
					this.#notify(this.#text('sessionExpired', 'DISK_EDITOR_VIBEOFFICE_SESSION_EXPIRED'));
					this.#scheduleNavigation(() => this.#downgradeToView());
					break;
			}
		}

		/**
		 * Single point for error reactions. Maps a `VibeOfficeError.code` (helper types.ts:199-207)
		 * onto a localized, user-facing reaction — never a silent failure. Terminal codes raise a
		 * blocking `ui.dialogs.messagebox`; transient codes (only `sse-degraded`) raise a toast and
		 * let editing continue. An unknown/missing code falls back to a generic terminal message.
		 *
		 * Only the standard UI surfaces (`ui.notification` / `ui.dialogs.messagebox`) are used; no
		 * custom popup class is introduced.
		 */
		#handleError(error) {
			if (!this.#isActive()) {
				return;
			}
			this.#closeWaiting();
			const reaction = this.#resolveErrorReaction(error);
			const message = main_core.Loc.getMessage(reaction.messageId) || '';

			// Mark that an error was just surfaced so a failover({recovered:false}) fired in the same
			// helper cycle does not double-notify the user (see handleFailover).
			this.#lastErrorNotifiedAt = Date.now();
			if (error?.code === 'save-refused') {
				if (!this.#saveRefusedShown) {
					this.#saveRefusedShown = true;
					this.#showSaveRefused(message);
				}
				return;
			}
			if (reaction.terminal || hasManualHandoff(error)) {
				if (!this.#showManualRestart(message, error)) {
					this.#showErrorMessageBox(message);
				}
			} else {
				this.#notify(message);
			}
		}
		#showSaveRefused(message) {
			const MessageBox = BX.UI?.Dialogs?.MessageBox;
			if (!main_core.Type.isFunction(MessageBox?.create)) {
				this.#showErrorMessageBox(message);
				return;
			}
			const lifecycleToken = this.#lifecycleGeneration;
			const box = MessageBox.create({
				message,
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK,
				popupOptions: {
					events: {
						onPopupClose: () => {
							if (this.#saveRefusedBox === box) {
								this.#saveRefusedBox = null;
							}
						}
					}
				}
			});
			this.#saveRefusedBox = box;
			box.show();
			void this.#loadSaveRefusalReason(box, message, lifecycleToken);
		}
		async #loadSaveRefusalReason(box, message, lifecycleToken) {
			try {
				const action = this.externalLinkMode ? EXTERNAL_SAVE_REFUSAL_REASON_ACTION : SAVE_REFUSAL_REASON_ACTION;
				const response = await main_core.ajax.runAction(action, {
					data: {
						documentSessionId: this.documentSession.id,
						documentSessionHash: this.documentSession.hash
					}
				});
				const reason = response?.data?.reason;
				if (!this.#isCurrent(lifecycleToken) || this.#saveRefusedBox !== box || !main_core.Type.isStringFilled(reason) || !/^[a-z0-9_]+$/.test(reason)) {
					return;
				}
				const reasonMessage = main_core.Loc.getMessage('DISK_EDITOR_VIBEOFFICE_SAVE_REFUSED_REASON', {
					'#CODE#': main_core.Text.encode(reason)
				});
				if (main_core.Type.isStringFilled(reasonMessage) && main_core.Type.isFunction(box.setMessage)) {
					box.setMessage(`${message}<br>${reasonMessage}`);
				}
			} catch (error) {
				// The refusal remains visible when the diagnostic lookup is unavailable.
			}
		}

		// Resolve a `VibeOfficeError` onto its reaction descriptor (code → message + terminal flag).
		// The unit tests assert this mapping via the public `error` event (terminal → messagebox,
		// `sse-degraded`/`refresh-fetch-failed` → toast, unknown/missing code → generic terminal).
		#resolveErrorReaction(error) {
			const code = error && main_core.Type.isStringFilled(error.code) ? error.code : null;
			return code && ERROR_REACTIONS[code] ? ERROR_REACTIONS[code] : ERROR_FALLBACK;
		}
		#showManualRestart(message, error) {
			const MessageBox = BX.UI?.Dialogs?.MessageBox;
			if (!hasManualHandoff(error) || this.#caughtDocumentReady !== null || this.#restartTarget === null || this.#firstLoadController.signal.aborted || !main_core.Type.isFunction(MessageBox?.create)) {
				return false;
			}
			if (this.#manualRestartBox !== null) {
				return true;
			}
			const lifecycleToken = this.#lifecycleGeneration;
			const target = this.#restartTarget;
			this.#manualRestartPending = true;
			this.#manualRestartBox = MessageBox.create({
				message,
				buttons: BX.UI.Dialogs.MessageBoxButtons.OK_CANCEL,
				okCaption: main_core.Loc.getMessage('DISK_EDITOR_VIBEOFFICE_OPEN_AGAIN'),
				onOk: (_messageBox, button) => {
					if (!this.#manualRestartPending || !this.#isCurrent(lifecycleToken) || this.#caughtDocumentReady !== null) {
						return false;
					}
					this.#manualRestartPending = false;
					this.#manualRestartClosePromise = Promise.resolve(top.BX.Disk.endEditSession({
						id: this.documentSession.id,
						hash: this.documentSession.hash,
						documentWasChanged: this.documentWasChanged
					})).then(() => {
						if (!this.#isCurrent(lifecycleToken)) {
							return;
						}
						this.#closed = true;
						this.emitEventOnClosed();
						this.destroy();
						main_core.Page.redirect(target);
					}, () => {
						if (!this.#isCurrent(lifecycleToken)) {
							return;
						}
						this.#manualRestartPending = true;
						this.#manualRestartClosePromise = null;
						button.setDisabled(false);
					});
					return false;
				},
				popupOptions: {
					events: {
						onPopupClose: () => {
							this.#manualRestartPending = false;
						}
					}
				}
			});
			this.#manualRestartBox.show();
			return true;
		}
		#closeManualRestart() {
			this.#manualRestartPending = false;
			this.#manualRestartBox?.close();
			this.#manualRestartBox = null;
		}
		#showErrorMessageBox(message) {
			if (!main_core.Type.isStringFilled(message)) {
				return;
			}

			// The page shell (template.php) loads `ui.dialogs.messagebox`; access it via the global,
			// mirroring the `BX.UI.Notification` usage in `#notify`. No custom popup is created.
			const MessageBox = BX.UI?.Dialogs?.MessageBox;
			if (MessageBox && main_core.Type.isFunction(MessageBox.alert)) {
				MessageBox.alert(message);
				return;
			}

			// Last-resort fallback so the failure is never swallowed if the extension is missing.
			this.#notify(message);
		}

		// endregion

		// region [FF-V1] document-change tracking (parity with OnlyOffice handleDocumentStateChange) --

		// Native api.js `onDocumentReady` / `onInfo`: `onInfo` passes through the helper untouched,
		// `onDocumentReady` is wrapped by it and called here after its own handling. They timestamp
		// the moment the editor settled so the load-time / co-editing state changes below are not
		// mistaken for a genuine user edit.
		#handleNativeDocumentReady() {
			if (!this.#isActive()) {
				return;
			}
			this.#caughtDocumentReady = Date.now();
			this.#closeWaiting();
			this.#closeManualRestart();
			this.#showDocumentName();
			void this.#applyCurrentUserAvatar();
		}
		#getCurrentEditorUser() {
			const user = this.openConfig?.config?.editorConfig?.user;
			if (!main_core.Type.isStringFilled(user?.id) || !/^[1-9]\d*$/.test(user.id) || user.id !== String(this.context.currentUser?.id) || !main_core.Type.isString(user.name)) {
				return null;
			}
			return {
				id: user.id,
				name: user.name
			};
		}
		async #loadCurrentUserAvatar() {
			try {
				const response = await main_core.ajax.runComponentAction(COMPONENT_NAME, 'getCurrentUserAvatar', {
					mode: 'ajax',
					json: {}
				});
				return response.data;
			} catch {
				return null;
			}
		}
		async #applyCurrentUserAvatar() {
			const lifecycleToken = this.#lifecycleGeneration;
			const editor = this.editor;
			const nativeEditor = editor?.instance;
			const user = this.#getCurrentEditorUser();
			if (!this.#isCurrent(lifecycleToken) || !nativeEditor || !user || !main_core.Type.isFunction(nativeEditor.setUsers) || this.#avatarRecipients.has(nativeEditor)) {
				return;
			}
			this.#currentUserAvatarPromise ??= this.#loadCurrentUserAvatar();
			const avatar = await this.#currentUserAvatarPromise;
			const currentUser = this.#getCurrentEditorUser();
			if (!this.#isCurrentEditor(editor, lifecycleToken) || editor.instance !== nativeEditor || this.#avatarRecipients.has(nativeEditor) || currentUser?.id !== user.id || currentUser?.name !== user.name || avatar?.id !== user.id || !main_core.Type.isStringFilled(avatar.image) || !/^data:image\/(?:png|jpeg|gif|webp);base64,/.test(avatar.image)) {
				return;
			}
			this.#avatarRecipients.add(nativeEditor);
			try {
				nativeEditor.setUsers({
					c: 'info',
					users: [{
						...user,
						image: avatar.image
					}]
				});
			} catch {
				// An optional avatar must not interrupt the document session.
			}
		}

		// The two places the page shows the name of the document, named from one owner so a rename
		// reaches both. The engine builds the iframe itself and leaves it without an accessible name,
		// and the page around it carries no header any more; it REPLACES the placeholder node with that
		// frame, so the search starts at the container around it - the only node of ours that survives
		// the drawing. The title of the page is written by the server once, while the shell is rendered
		// (`SetTitle` with the same stored name), and nothing else refreshes the tab afterwards.
		// Called when the document is ready (again after a failover recreate, which builds a new frame)
		// and after a rename, which is the other moment the name of the document changes.
		#showDocumentName() {
			if (!main_core.Type.isStringFilled(this.object.name)) {
				return;
			}
			const frame = this.targetNode?.querySelector('iframe');
			if (frame) {
				frame.title = this.object.name;
			}
			document.title = this.object.name;
		}
		#handleNativeInfo() {
			if (!this.#isActive()) {
				return;
			}
			this.#caughtInfoEvent = Date.now();
		}

		// Native api.js `onDocumentStateChange`. Same guard as the OnlyOffice sibling: ignore changes
		// fired before the editor settled or within 500ms of it (load-time echoes, incoming co-editing
		// deltas), then treat any change as a real edit. Once set, `documentWasChanged` makes
		// handleClose → endEditSession create the "document is being saved" balloon in c_disk.js, which
		// the `vibeoffice` pull command later turns into the "saved" toast; emitEventOnClosed also
		// reports the truthful flag to the hosts.
		#handleDocumentStateChange() {
			if (!this.#isActive()) {
				return;
			}
			if (this.#caughtDocumentReady === null || this.#caughtInfoEvent === null) {
				return;
			}
			if (Date.now() - Math.max(this.#caughtDocumentReady, this.#caughtInfoEvent) < 500) {
				return;
			}
			this.documentWasChanged = true;
		}

		// endregion

		/**
		 * The rename the editor asks for. The name is sent without the extension - it is appended by the
		 * server, so the entered one is stripped of it here; the server also makes an occupied name unique,
		 * so the name the object carries afterwards is not always the entered one and the person is told
		 * when it differs.
		 *
		 * The server also carries the stored name to the platform, which is what makes the header of the
		 * engine keep it. `editorSynchronized: false` says it did not get there - the engine will fall
		 * back to the name it was opened with on its next redraw - but the object is renamed either way,
		 * so that is not a refusal and nothing is said about it.
		 */
		async #handleRequestRename(event, composition) {
			if (!this.#isActive()) {
				return;
			}
			this.#renameGeneration += 1;
			const renameToken = this.#renameGeneration;
			const enteredName = main_core.Type.isStringFilled(event?.data) ? event.data.trim() : '';
			const newName = toEditableName(enteredName, composition.object.extension);
			const result = await disk_documentHeader.documentHeaderService.rename(this.documentSession.hash, newName);
			if (!this.#isLastRename(renameToken)) {
				return;
			}
			if (!result.success) {
				// The codes of the action are localized by the server; the two codes of the service itself
				// (UNEXPECTED, INVALID_RESPONSE) carry no message and are told with our own.
				const refusal = main_core.Type.isStringFilled(result.error.message) ? result.error.message : this.#text('renameFailed', 'DISK_EDITOR_VIBEOFFICE_RENAME_FAILED');
				this.#notify(refusal);
				return;
			}

			// Our own view of the name feeds everything the page names after the document - the frame and
			// the tab (`this.context.object` is the same object, so it follows along).
			if (main_core.Type.isStringFilled(result.data.name)) {
				this.object.name = result.data.name;
				this.#showDocumentName();
			}
			const actualName = toEditableName(result.data.name, composition.object.extension);
			if (actualName === newName) {
				return;
			}
			this.#notify(main_core.Loc.getMessage('DISK_EDITOR_VIBEOFFICE_RENAMED_TO', {
				'#NAME#': main_core.Text.encode(actualName)
			}), 'success');
		}

		/**
		 * Reopens the document by the edit address, where the server checks the rights again.
		 */
		async #handleRequestEditRights(composition) {
			if (!this.#isActive() || this.#reopening) {
				return;
			}
			this.#reopening = true;
			try {
				const outcome = isSamePortalPath(this.linkToEdit) ? await this.#reopenInEditing(composition) : 'unavailable';
				this.#answerTransition(outcome);
			} finally {
				this.#reopening = false;
			}
		}

		/**
		 * The button of the engine waits until it hears an answer, so every outcome but the leaving of the
		 * page is answered. A refusal of the gate of the limit shows the scenario of the restriction itself,
		 * and repeating the rights over it would name a reason the person does not have.
		 */
		#answerTransition(outcome) {
			if (outcome === 'opened') {
				return;
			}
			const refusal = outcome === 'refused' ? this.#text('editTransitionUnavailable', 'DISK_EDITOR_VIBEOFFICE_EDIT_TRANSITION_UNAVAILABLE') : this.#text('editRightsDenied', 'DISK_EDITOR_VIBEOFFICE_EDIT_RIGHTS_DENIED');
			this.#denyEditingRights(refusal);
		}

		/**
		 * Reports how the transition ended. The leaving of the page is announced by the header, and the answer
		 * of the transition tells the scenario of the restriction of the limit - which speaks to the person on
		 * its own - apart from a transition which was never made at all.
		 */
		async #reopenInEditing(composition) {
			let leaving = false;
			const onLeaving = () => {
				leaving = true;
			};

			// The wait can outlive the shell, so the teardown owns the release of the subscription as well;
			// whichever of the two comes first, the other one finds nothing left to release.
			let released = false;
			const release = () => {
				if (released) {
					return;
				}
				released = true;
				this.#unsubscribers = this.#unsubscribers.filter(off => off !== release);
				main_core_events.EventEmitter.unsubscribe(disk_documentHeader.BeforeStartEditEvent, onLeaving);
			};
			main_core_events.EventEmitter.subscribe(disk_documentHeader.BeforeStartEditEvent, onLeaving);
			this.#unsubscribers.push(release);
			let outcome = 'unavailable';
			try {
				outcome = await disk_documentHeader.startEdit({
					editorCode: disk_documentHeader.ServerChosenEditor,
					editUrl: this.linkToEdit,
					composition,
					// The button of the transition lives inside the engine, so the scenario of the restriction
					// has no control of ours to bind itself to.
					trigger: null,
					// The press is waited out by the gate, and the shell can be taken down in the meantime -
					// a document the person has just closed is not reopened in editing behind their back.
					isStillWanted: () => this.#isActive()
				});
			} catch (error) {
				// A transition broken on its way is a transition not made; the refusal is the answer to it,
				// but the breakage itself never disappears silently.
				console.error('[vibeoffice] startEdit failed', error);
				return 'unavailable';
			} finally {
				release();
			}
			return leaving ? 'opened' : outcome;
		}

		// The answer of a refusal belongs to the native editor: the facade of the helper carries its own
		// methods only, and the rest of the api.js surface is reached through the index signature of its type.
		#denyEditingRights(message) {
			const instance = this.editor?.instance;
			const deny = instance?.denyEditingRights;
			if (main_core.Type.isFunction(deny)) {
				deny.call(instance, message);
			}
		}

		// region engine-orthogonal behaviours reused from the OnlyOffice wrapper ---------------

		registerTimerToTrackWork() {
			if (!this.#isActive() || this.#trackWorkTimer !== null) {
				return;
			}
			this.#trackWorkTimer = setInterval(this.#trackWork.bind(this), SECONDS_TO_MARK_AS_STILL_WORKING * 1000);
		}
		#trackWork() {
			if (!this.#isActive()) {
				return;
			}

			// Mirrors the OnlyOffice wrapper's keep-alive: ping the component so the document
			// session is not garbage-collected while the user keeps editing. Requires the
			// `markAsStillWorkingSession` action on the vibeoffice component (backend).
			main_core.ajax.runComponentAction(COMPONENT_NAME, 'markAsStillWorkingSession', {
				mode: 'ajax',
				json: {
					documentSessionId: this.documentSession.id,
					documentSessionHash: this.documentSession.hash
				}
			}).catch(() => {});
		}
		bindEvents() {
			const onSliderClose = this.handleSliderClose.bind(this);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', onSliderClose);
			this.#unsubscribers.push(() => main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onClose', onSliderClose));

			// beforeunload cannot distinguish navigation from a page entering the back/forward cache.
			const onPageHide = event => {
				// A page put into the back/forward cache is not closed: it can be shown again with the
				// editor alive, so its session stays open.
				if (event?.persisted === true) {
					return;
				}
				this.handleClose(true);
			};
			main_core.Event.bind(window, 'pagehide', onPageHide);
			this.#unsubscribers.push(() => main_core.Event.unbind(window, 'pagehide', onPageHide));

			// Native window events reach the page only through Event.bind: EventEmitter keeps a registry
			// of its own and never calls addEventListener.
			const onMessage = event => {
				// 'closeIframe' is posted by the portal page embedding this editor in an iframe
				// (disk.onlyoffice-im-integration/create-document.js sends it with targetOrigin '*'). Both
				// pages are served by this portal, so a trusted message carries our own origin; anything
				// from another origin, or of another shape, is not ours and must not close the editor.
				if (event.origin !== window.location.origin || event.data !== 'closeIframe') {
					return;
				}
				this.handleClose(false);
			};
			main_core.Event.bind(window, 'message', onMessage);
			this.#unsubscribers.push(() => main_core.Event.unbind(window, 'message', onMessage));
		}
		loadDiskExtensionInTopWindow() {
			if (window.top !== window && !BX.getClass('window.top.BX.Disk.endEditSession')) {
				top.BX.loadExt('disk');
			}
		}

		// The 'Disk.OnlyOffice:*' event names below are the engine-agnostic contract of the hosts
		// (disk/document/editprocess.js, disk.folder.list, disk.documents, c_disk.js): they finalize
		// create/edit flows by listening to these exact names, whichever editor engine rendered the page.
		emitEventOnSaved() {
			const payload = {
				documentSession: this.documentSession,
				object: this.object
			};
			const sliderByWindow = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (sliderByWindow) {
				BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onSaved', payload);
			}
			main_core_events.EventEmitter.emit('Disk.OnlyOffice:onSaved', payload);
		}
		emitEventOnClosed() {
			let process = 'edit';
			const sliderByWindow = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (sliderByWindow) {
				process = sliderByWindow.getData().get('process') || 'edit';
				BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onClosed', {
					documentSession: this.documentSession,
					object: this.object,
					process,
					documentWasChanged: this.documentWasChanged
				});
			}
			main_core_events.EventEmitter.emit('Disk.OnlyOffice:onClosed', {
				documentSession: this.documentSession,
				object: this.object,
				process,
				documentWasChanged: this.documentWasChanged
			});
		}
		handleSliderClose(event) {
			if (!this.#isActive()) {
				return;
			}
			const currentSlider = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (!currentSlider) {
				return;
			}
			const uid = currentSlider.getData().get('uid');
			const [sliderEvent] = event.getData();
			if (sliderEvent.getSlider().getData().get('uid') !== uid) {
				return;
			}
			this.handleClose();
		}

		// `viaBeacon` tells the two ways out apart. Closing the slider and the 'closeIframe' message of
		// the embedding page leave the page alive: the answer of the server is what draws the "document
		// is being saved" balloon, so they keep the ordinary call. Leaving the page has nobody left to
		// read an answer, so it hands the same action to the browser as a beacon.
		handleClose(viaBeacon = false) {
			if (this.#closed || !this.#isActive()) {
				return;
			}
			const manualClosePending = this.#manualRestartClosePromise !== null;
			if (manualClosePending && !viaBeacon) {
				this.#closed = true;
				this.destroy();
				this.emitEventOnClosed();
				return;
			}
			this.#closed = true;

			// Tear down SSE + native editor (helper destroy(); index.ts:183).
			this.destroy();
			this.emitEventOnClosed();
			if (viaBeacon && (this.#sendEndSessionBeacon() || manualClosePending)) {
				return;
			}
			top.BX.Disk.endEditSession({
				id: this.documentSession.id,
				hash: this.documentSession.hash,
				documentWasChanged: this.documentWasChanged
			});
		}

		// Returns whether the browser took the beacon over; the delivery itself is never guaranteed, and
		// a browser without sendBeacon returns false so the caller falls back to the ordinary call.
		// A repeated end of an already finished session is not an error on the server side.
		#sendEndSessionBeacon() {
			if (!main_core.Type.isFunction(navigator?.sendBeacon)) {
				return false;
			}
			return navigator.sendBeacon(main_core.Uri.addParam(AJAX_ENDPOINT, {
				action: END_SESSION_ACTION,
				sessid: main_core.Loc.getMessage('bitrix_sessid') ?? ''
			}), this.#buildEndSessionPayload());
		}

		// `documentWasChanged` is left out on purpose: the action does not ask for it, and the balloon
		// it drives needs a page that is still there to show it.
		#buildEndSessionPayload() {
			return new Blob([JSON.stringify({
				sessionId: this.documentSession.id,
				documentSessionHash: this.documentSession.hash
			})], {
				type: 'application/json'
			});
		}

		// endregion

		// The object channel carries viewer updates and conflict facts for exact editor sessions.
		#initPull() {
			if (!this.#isActive()) {
				return;
			}
			if (!this.pullConfig || !this.publicChannel) {
				return;
			}

			// Always start a fresh public-channel client with this object's pull config, exactly like
			// the OnlyOffice editor shell. A login session almost always already has a `BX.PULL`
			// (im/notifications) that is NOT listening on this object's public channel (object_{id}),
			// so reusing it would never deliver the `contentUpdated` command. The editor page owns the
			// channel, so replacing `BX.PULL` with a client started from `this.pullConfig` is safe.
			BX.PULL = new pull_client.PullClient({
				skipStorageInit: true
			});
			BX.PULL.start(this.pullConfig);
			if (!this.isViewMode()) {
				this.#unsubscribers.push(BX.PULL.subscribe({
					type: pull_client.PullClient.SubscriptionType.Server,
					moduleId: 'disk',
					command: 'vibeoffice',
					callback: this.#handleConflict.bind(this)
				}));
				return;
			}

			// params-form subscription on the object client we just started. A handler-literal
			// (getModuleId/getSubscriptionType/getMap) is a plain object, so `subscribe()` skips the
			// `attachCommandHandler` branch (emitter.js:95) and falls into the flat params branch with
			// every field undefined — the callback would never fire. The params-form registers the
			// callback under `disk`/`contentUpdated` directly; on emit it receives `data.params`
			// (the `{object, updatedBy}` payload) as its first argument (emitter.js:246-251), which is
			// exactly what `#handleContentUpdated(data)` expects.
			const unsubscribe = BX.PULL.subscribe({
				type: pull_client.PullClient.SubscriptionType.Server,
				moduleId: 'disk',
				command: 'contentUpdated',
				callback: this.#handleContentUpdated.bind(this)
			});
			this.#unsubscribers.push(unsubscribe);
		}
		#handleConflict(data) {
			const sessionId = Number(this.documentSession?.id);
			if (!this.#isActive() || this.#conflictNotified || data?.event !== 'conflict' || Number(data.object?.id) !== Number(this.object?.id) || !Number.isInteger(sessionId) || sessionId <= 0 || !Array.isArray(data.documentSessionIds) || !data.documentSessionIds.includes(sessionId)) {
				return;
			}
			this.#conflictNotified = true;
			this.#notify(main_core.Loc.getMessage('DISK_EDITOR_VIBEOFFICE_CONFLICT'), null, 'disk-vibeoffice-conflict-notification');
		}

		// Live host notification that the object got a new version. Three guards, in order:
		//  (1) ignore other objects (the channel is per-object, but be defensive);
		//  (2) ignore our own change (the editor closes the stale parent viewer before editing);
		//  (3) only act in VIEW mode — edit mode handles its own concurrency. Then show a toast
		//      naming the author with a clickable "Refresh".
		#handleContentUpdated(data) {
			if (!this.#isActive() || !data || !data.object) {
				return;
			}
			if (Number(data.object.id) !== Number(this.object?.id)) {
				return;
			}
			const updatedBy = data.object.updatedBy;
			if (!updatedBy) {
				return;
			}
			if (!this.isViewMode()) {
				return;
			}
			if (this.#isCurrentUser(updatedBy)) {
				return;
			}
			const lifecycleToken = this.#lifecycleGeneration;
			const infoToken = data.updatedBy?.infoToken;
			this.#resolveUserName(updatedBy, infoToken).then(userName => {
				if (this.#isCurrent(lifecycleToken)) {
					this.#notifyNonActualVersion(data.object.name, userName);
				}
			}, () => {
				if (this.#isCurrent(lifecycleToken)) {
					this.#notifyNonActualVersion(data.object.name, null);
				}
			});
		}
		#isCurrentUser(userId) {
			return Number(this.context.currentUser?.id) === Number(userId);
		}

		// Resolve the author's display name for parity with OnlyOffice (token-gated component
		// action). Rejects instead of throwing (the caller renders a name-less toast), so name
		// resolution never blocks the notification. The cache is read before the guards: they gate
		// issuing a NEW request, not a name already resolved under a token valid at that time.
		#resolveUserName(userId, infoToken) {
			const cacheKey = this.#resolveNameCacheKey(userId);
			const cached = this.#userNameCache.get(cacheKey);
			if (cached) {
				return cached;
			}
			if (!main_core.Type.isStringFilled(infoToken) || this.#badUserInfoAttempts >= 3) {
				return Promise.reject();
			}
			const request = new Promise((resolve, reject) => {
				// A failed attempt counts toward the breaker (a stably failing backend stops being
				// re-asked) and drops its cache entry, so a transient failure does not lock the name
				// out for the rest of the viewing session.
				const fail = () => {
					this.#badUserInfoAttempts += 1;
					this.#userNameCache.delete(cacheKey);
					reject();
				};
				main_core.ajax.runComponentAction(COMPONENT_NAME, 'getUserInfo', {
					mode: 'ajax',
					json: {
						documentSessionId: this.documentSession.id,
						documentSessionHash: this.documentSession.hash,
						userId,
						infoToken
					}
				}).then(response => {
					if (!this.#isActive()) {
						reject();
						return;
					}
					if (response.status === 'success' && response.data?.user?.name) {
						this.#badUserInfoAttempts = 0;
						resolve(response.data.user.name);
						return;
					}

					// A success response with no usable name is still a failed attempt: count it
					// toward the breaker threshold so a backend stably returning success-without-name
					// stops re-requesting getUserInfo on every contentUpdated.
					fail();
				}, () => {
					if (!this.#isActive()) {
						reject();
						return;
					}
					fail();
				});
			});

			// Cached before the request settles: that is what deduplicates concurrent lookups.
			if (cacheKey !== null) {
				this.#userNameCache.set(cacheKey, request);
			}
			return request;
		}

		// Cache slot for an author id, or null when the id is not a positive int: `updatedBy` comes
		// from a pull message, and Number() would collapse every non-numeric value onto one NaN slot
		// shared by unrelated authors. A slot-less id is still requested from the backend.
		#resolveNameCacheKey(userId) {
			const cacheKey = Number(userId);
			return Number.isInteger(cacheKey) && cacheKey > 0 ? cacheKey : null;
		}

		// Toast with a clickable "Refresh" anchor (matches the OnlyOffice `[data-refresh-btn]`
		// pattern). With an author name → the `#USER_NAME#` variant; without → the no-name variant
		// so the user is still notified when name resolution fails.
		#notifyNonActualVersion(objectName, userName) {
			if (!this.#isActive()) {
				return;
			}
			const messageId = main_core.Type.isStringFilled(userName) ? 'DISK_EDITOR_VIBEOFFICE_VIEW_NON_ACTUAL_VERSION' : 'DISK_EDITOR_VIBEOFFICE_VIEW_NON_ACTUAL_VERSION_NO_NAME';
			const replacements = {
				'#NAME#': main_core.Text.encode(objectName || '')
			};
			if (main_core.Type.isStringFilled(userName)) {
				replacements['#USER_NAME#'] = main_core.Text.encode(userName);
			}
			const message = main_core.Loc.getMessage(messageId, replacements);
			if (!main_core.Type.isStringFilled(message)) {
				return;
			}
			const content = main_core.Tag.render`<span data-testid="disk-vibeoffice-outdated-notification">${message}</span>`;
			const refreshButton = content.querySelector('[data-refresh-btn]');
			if (refreshButton) {
				refreshButton.setAttribute('data-testid', 'disk-vibeoffice-outdated-refresh-btn');
				main_core.Tag.style(refreshButton)`
				cursor: pointer;
			`;
				refreshButton.addEventListener('click', this.#reloadView.bind(this));
			}
			BX.UI?.Notification?.Center?.notify({
				content
			});
		}

		// endregion

		// Prefer the text the template handed in `texts`; fall back to the extension's own
		// localization. No user-facing string is ever hardcoded here.
		#text(textKey, messageId) {
			if (main_core.Type.isStringFilled(this.texts[textKey])) {
				return this.texts[textKey];
			}
			return main_core.Loc.getMessage(messageId) || '';
		}
		#notify(message, type = null, testId = null) {
			if (!this.#isActive() || !main_core.Type.isStringFilled(message)) {
				return;
			}
			const content = testId === null ? message : main_core.Tag.render`<span data-testid="${testId}">${main_core.Text.encode(message)}</span>`;
			BX.UI?.Notification?.Center?.notify({
				content,
				autoHideDelay: type === 'success' ? 3000 : 5000
			});

			// The balloon carries no live region, so a screen reader gets nothing from it. The toast
			// renders the message as HTML; the live region speaks plain text.
			ui_a11y.LiveAnnouncer.announce(main_core.Text.decode(message), type === 'success' ? 'polite' : 'assertive');
		}

		// Reaction to a closed session. Inside a slider we just close it (the host list / caller is
		// behind it). On a standalone page (external link / "open in new window") there is no slider to
		// close, so `#closeSlider`'s old `BX.SidePanel.Instance.close()` was a no-op that left a dead
		// editor on screen — downgrade to the document view instead. This satisfies the SDD requirement
		// (revoked → downgrade to view/close) and keeps `saved` from stranding the user on a finished
		// session.
		//
		// `deferNavigation` gates only the standalone navigation timing: revoked shows a message first,
		// so the navigation is delayed until it paints; saved shows no message, so it navigates at once
		// rather than leaving the user on the finished editor for the (message-only) delay.
		#closeSliderOrDowngradeToView(deferNavigation = true) {
			const currentSlider = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (currentSlider) {
				currentSlider.close();
				return;
			}
			if (!deferNavigation) {
				this.#downgradeToView();
				return;
			}

			// Deferred so a just-shown message (e.g. "access revoked") paints before we navigate.
			this.#scheduleNavigation(() => this.#downgradeToView());
		}
		#waitForSavedThenClose() {
			const startedAt = Date.now();
			let pollInterval = SAVED_CONFIRMATION_INITIAL_POLL_INTERVAL_MS;
			const scheduleNextCheck = check => {
				const elapsed = Date.now() - startedAt;
				if (elapsed >= SAVED_CONFIRMATION_TIMEOUT_MS) {
					this.#closeSliderOrDowngradeToView(false);
					return;
				}
				const jitterMultiplier = 1 + (Math.random() * 2 - 1) * SAVED_CONFIRMATION_POLL_JITTER_RATIO;
				const delay = Math.min(Math.max(SAVED_CONFIRMATION_INITIAL_POLL_INTERVAL_MS, Math.round(pollInterval * jitterMultiplier)), SAVED_CONFIRMATION_MAX_POLL_INTERVAL_MS, SAVED_CONFIRMATION_TIMEOUT_MS - elapsed);
				pollInterval = Math.min(pollInterval * SAVED_CONFIRMATION_POLL_BACKOFF_FACTOR, SAVED_CONFIRMATION_MAX_POLL_INTERVAL_MS);
				setTimeout(check, delay);
			};
			const check = () => {
				if (!this.#isActive()) {
					return;
				}
				main_core.ajax.runAction('disk.api.vibeoffice.waitForSaved', {
					json: {
						documentSessionHash: this.documentSession?.hash
					}
				}).then(response => {
					const ready = response?.status === 'success' && response?.data?.ready === true;
					if (ready || Date.now() - startedAt >= SAVED_CONFIRMATION_TIMEOUT_MS) {
						this.#closeSliderOrDowngradeToView(false);
						return;
					}
					scheduleNextCheck(check);
				}).catch(() => {
					if (Date.now() - startedAt >= SAVED_CONFIRMATION_TIMEOUT_MS) {
						this.#closeSliderOrDowngradeToView(false);
						return;
					}
					scheduleNextCheck(check);
				});
			};
			check();
		}
		#closeParentViewer() {
			const viewer = window.top?.BX?.UI?.Viewer?.Instance;
			if (viewer?.isOpen?.() && viewer?.getCurrentItem?.()) {
				viewer.close();
			}
		}

		// Leave the (now closed) editor for the plain document view. Prefer the server-built view URL;
		// fall back to a reload when it is absent so the stale editor is never left in place.
		#downgradeToView() {
			if (main_core.Type.isStringFilled(this.linkToView)) {
				document.location = this.linkToView;
				return;
			}
			document.location.reload();
		}

		// Run a page-navigating session-close reaction after a short delay so its message is seen
		// first. Single-shot: a second close reason cannot stack another navigation. Cleared on destroy
		// so a torn-down editor never navigates.
		#scheduleNavigation(navigate) {
			if (!this.#isActive() || this.#pendingNavigationTimer !== null) {
				return;
			}
			this.#pendingNavigationTimer = setTimeout(() => {
				this.#pendingNavigationTimer = null;
				if (this.#isActive()) {
					navigate();
				}
			}, SESSION_CLOSE_NAVIGATION_DELAY_MS);
		}
		#reloadView() {
			if (!this.#isActive()) {
				return;
			}
			if (this.isViewMode() && main_core.Type.isStringFilled(this.linkToView)) {
				document.location = this.linkToView;
				return;
			}
			document.location.reload();
		}
		#resolveElementId(element, fallbackNode) {
			if (main_core.Type.isStringFilled(element)) {
				return element;
			}
			if (main_core.Type.isDomNode(element) && element.id) {
				return element.id;
			}
			if (fallbackNode && fallbackNode.id) {
				return fallbackNode.id;
			}
			return null;
		}
		isEditMode() {
			return this.openConfig?.config?.editorConfig?.mode === 'edit';
		}
		isViewMode() {
			return !this.isEditMode();
		}
		getEditor() {
			return this.editor;
		}
		#isActive() {
			return !this.#destroyed;
		}
		#isCurrent(lifecycleToken) {
			return this.#isActive() && lifecycleToken === this.#lifecycleGeneration;
		}
		#isCurrentEditor(editor, lifecycleToken) {
			return this.#isCurrent(lifecycleToken) && this.editor === editor;
		}
		#isLastRename(renameToken) {
			return this.#isActive() && renameToken === this.#renameGeneration;
		}
		destroy() {
			if (!this.#isActive()) {
				return;
			}
			this.#destroyed = true;
			this.#lifecycleGeneration += 1;
			this.#firstLoadController.abort();
			this.#closeManualRestart();
			this.#closeWaiting();
			this.#saveRefusedBox?.close();
			this.#saveRefusedBox = null;
			if (this.#trackWorkTimer !== null) {
				clearInterval(this.#trackWorkTimer);
				this.#trackWorkTimer = null;
			}
			if (this.#pendingNavigationTimer !== null) {
				clearTimeout(this.#pendingNavigationTimer);
				this.#pendingNavigationTimer = null;
			}
			this.#unsubscribers.forEach(off => {
				try {
					off();
				} catch (e) {
					// best-effort teardown
				}
			});
			this.#unsubscribers = [];
			this.#userNameCache.clear();
			this.#currentUserAvatarPromise = null;
			this.#avatarRecipients = new WeakSet();
			if (this.editor) {
				this.editor.destroy();
				this.editor = null;
			}
		}
	}

	/**
	 * Guards the transition against an open redirect. A control character is refused too, because a browser
	 * drops it and follows what is left as `//host`.
	 */
	function isSamePortalPath(link) {
		return main_core.Type.isStringFilled(link) && PORTAL_PATH_SHAPE.test(link) && !carriesControlCharacter(link);
	}
	function carriesControlCharacter(value) {
		return [...value].some(character => {
			const code = character.codePointAt(0);
			return code < 0x20 || code === 0x7F;
		});
	}

	/**
	 * The name as the person edits it. The extension belongs to the object and is appended by the server,
	 * so the name it answers with is compared with the entered one without the extension.
	 */
	function toEditableName(storedName, extension) {
		const suffix = `.${extension}`;
		return extension !== '' && storedName.endsWith(suffix) ? storedName.slice(0, -suffix.length) : storedName;
	}
	function hasManualHandoff(error) {
		if (!main_core.Type.isObject(error)) {
			return false;
		}
		const handoff = error.handoff;
		return handoff?.version === 1 && handoff.action === 'manual' && handoff.automaticOpenAllowed === false && handoff.readyReached === false && handoff.terminal === true && handoff.cleanupComplete === true;
	}
	function openingDeadline(budget) {
		if (budget === null || budget === undefined) {
			return Infinity;
		}
		if (!main_core.Type.isPlainObject(budget)) {
			return 0;
		}
		const {
			version,
			totalMs,
			remainingMs
		} = budget;
		if (version !== 1 || !Number.isSafeInteger(totalMs) || !Number.isSafeInteger(remainingMs) || totalMs <= 0 || remainingMs < 0) {
			return 0;
		}

		// performance.now() includes the navigation elapsed before the HTML reached this shell.
		return Math.min(totalMs, remainingMs);
	}
	function firstLoadContext(deadline, navigationElapsed) {
		const remainingMs = Math.floor(deadline - navigationElapsed);
		if (remainingMs <= 0) {
			return null;
		}
		return {
			version: 1,
			remainingMs,
			helperRemainingMs: Math.min(150_000, remainingMs)
		};
	}

	// Vendored UMD build of `@vibeoffice/helper` (zero runtime deps). We do NOT build/ship the
	// helper from its source here; the published UMD artifact is the contract; where it came
	// from is recorded in `vendor/helper.provenance.json`.
	//
	// The API is imported BY VALUE, not via a `window.*` global: under chef/rollup the
	// commonjs plugin resolves the UMD through its CommonJS branch (`m(exports)`), so the API
	// is attached to `exports`, never to `window.VibeOffice`. A side-effect import would
	// therefore leave `window.VibeOffice` undefined in the built bundle. Importing the named
	// export lets rollup-commonjs hand us the real `createEditor`.
	Vibeoffice.setHelper({
		createEditor: helper_umdExports.createEditor
	});

	exports.Vibeoffice = Vibeoffice;

})(this.BX.Disk.Editor = this.BX.Disk.Editor || {}, BX, BX.Event, BX, BX.UI.Accessibility, BX.Disk);
//# sourceMappingURL=editor-vibeoffice.bundle.js.map
