this.BX=this.BX||{},function(e,t,i,s,n,a){"use strict";let r,o,l=e=>e;var c=babelHelpers.classPrivateFieldLooseKey("cache"),d=babelHelpers.classPrivateFieldLooseKey("getClassName"),g=babelHelpers.classPrivateFieldLooseKey("getBattery");class p extends i.EventEmitter{constructor(e){super(),Object.defineProperty(this,g,{value:m}),Object.defineProperty(this,d,{value:h}),Object.defineProperty(this,c,{writable:!0,value:new n.Cache.MemoryCache}),this.setEventNamespace("BX.Bitrix24.LicenseWidget.MainButton"),this.setOptions(e),n.Event.bind(this.getContent(),"click",()=>{this.emit("click")})}setOptions(e){return babelHelpers.classPrivateFieldLooseBase(this,c)[c].set("options",e),this}getOptions(){return babelHelpers.classPrivateFieldLooseBase(this,c)[c].get("options",{})}getContent(){return babelHelpers.classPrivateFieldLooseBase(this,c)[c].remember("content",()=>n.Tag.render(r||(r=l`
				<button data-id="license-widget-main-button" class="${0}">
					<span class="license-btn-icon"></span>
					<span class="license-btn-counter"></span>
					${0}
					<span class="license-btn-name">${0}</span>
				</button>
			`),babelHelpers.classPrivateFieldLooseBase(this,d)[d](),this.getOptions().isLicenseExpired?babelHelpers.classPrivateFieldLooseBase(this,g)[g]():null,this.getOptions().text))}getCounter(){return babelHelpers.classPrivateFieldLooseBase(this,c)[c].remember("counter",()=>new t.Counter({color:t.Counter.Color.DANGER}))}setCounter(e){e<1&&(this.getCounter().destroy(),babelHelpers.classPrivateFieldLooseBase(this,c)[c].delete("counter")),e>0&&(this.getCounter().update(e),this.getCounter().renderTo(this.getCounterWrapper()))}getCounterWrapper(){return babelHelpers.classPrivateFieldLooseBase(this,c)[c].remember("counter-node",()=>this.getContent().querySelector(".license-btn-counter"))}onClick(){this.emit("click")}replaceSkeleton(){n.Dom.replace(this.getOptions().wrapper,this.getContent())}}function h(){return babelHelpers.classPrivateFieldLooseBase(this,c)[c].remember("button-class-name",()=>this.getOptions().isLicenseExpired?"ui-btn ui-btn-round ui-btn-themes license-btn license-btn-alert-border license-btn-animate license-btn-animate-forward":this.getOptions().className)}function m(){return babelHelpers.classPrivateFieldLooseBase(this,c)[c].remember("battery",()=>n.Tag.render(o||(o=l`
				<span class="license-btn-icon-battery">
						<span class="license-btn-icon-battery-full">
							<span class="license-btn-icon-battery-inner">
								<span></span>
								<span></span>
								<span></span>
							</span>
						</span>
						<svg class="license-btn-icon-battery-cross" xmlns="http://www.w3.org/2000/svg" width="22" height="18">
							<path fill="#FFF" fill-rule="evenodd" d="M18.567.395c.42.42.42 1.1 0 1.52l-1.04 1.038.704.001a2 2 0 012 2v1.799a1.01 1.01 0 01.116-.007H21a1 1 0 011 1v2.495a1 1 0 01-1 1h-.653l-.116-.006v1.798a2 2 0 01-2 2L5.45 15.032l-2.045 2.045a1.075 1.075 0 11-1.52-1.52L17.047.395c.42-.42 1.1-.42 1.52 0zm-2.583 4.102l-8.991 8.99 10.836.002a1 1 0 00.994-.883l.006-.117v-6.99a1 1 0 00-1-1l-1.845-.002zm-5.031-1.543L9.409 4.498h-6.23a1 1 0 00-.993.884l-.006.116-.001 6.23-1.4 1.398v-.046L.777 4.954a2 2 0 012-2h8.175z"/>
						</svg>
				</span>
			`)))}class b extends i.EventEmitter{constructor(e){super(),this.cache=new n.Cache.MemoryCache,this.setOptions(e),this.setEventNamespace("BX.Intranet.LicenseWidget.Content")}setOptions(e){return this.cache.set("options",e),this}getOptions(){return this.cache.get("options",{})}getLayout(){throw new Error("Must be implemented in a child class")}getConfig(){return{html:this.getLayout(),minHeight:"58px"}}}let u,v,w,O,L,P,y=e=>e;class B extends b{getConfig(){return{html:this.getLayout(),minHeight:this.getOptions().isSmall?"86px":"55px"}}getLayout(){return this.cache.remember("layout",()=>n.Tag.render(u||(u=y`
				<div data-id="${0}" class="license-widget-item license-widget-item--secondary ${0}">
					<div class="license-widget-inner ${0}">
						<div class="license-widget-content">
							${0}
							<div class="license-widget-item-content">
								${0}
								${0}
							</div>
						</div>
						${0}
					</div>
				</div>
			`),this.getLayoutId(),this.getMainClass(),this.getOptions().isSmall?"--column":"",this.getIcon(),this.getTitle(),this.getDescription(),this.getButton()))}getLayoutId(){return"license-widget-block-market"}getTitle(){return this.cache.remember("title",()=>n.Tag.render(v||(v=y`
				<div class="license-widget-item-name">
					<span>
						${0}
					</span>
				</div>
			`),this.getOptions().title))}getIcon(){return this.cache.remember("icon",()=>n.Tag.render(w||(w=y`
				<div class="license-widget-item-icon license-widget-item-icon--mp"/>
			`)))}getDescription(){return this.cache.remember("description",()=>this.getOptions().isPaid||this.getOptions().isDemo?this.getReminderMessage():this.getDescriptionLink())}getMainClass(){return this.getOptions().isExpired||this.getOptions().isAlmostExpired?"--market-expired":this.getOptions().isPaid||this.getOptions().isDemo?"--market-active":"--market-default"}getReminderMessage(){return this.cache.remember("reminder-message",()=>n.Tag.render(O||(O=y`
				<div class="license-widget-item-info">
					<span class="license-widget-item-info-text">
						${0}
					</span>
				</div>
			`),this.getOptions().messages.remainder))}getDescriptionLink(){return this.cache.remember("description-link",()=>n.Tag.render(L||(L=y`
				<div class="license-widget-item-link">
					<span class="license-widget-item-link-text" onclick="${0}">
						${0}
					</span>
				</div>
			`),()=>{s.FeaturePromotersRegistry.getPromoter({code:this.getOptions().description.landingCode}).show()},this.getOptions().description.text))}getButton(){return this.cache.remember("button",()=>n.Tag.render(P||(P=y`
				<a onclick="${0}" href="${0}" class="license-widget-item-btn" target="_blank">
					${0}
				</a>
			`),()=>{i.EventEmitter.emit(i.EventEmitter.GLOBAL_TARGET,"BX.Intranet.LicenseWidget.Popup:openChild")},this.getOptions().button.link,this.getOptions().button.text))}}let x,C,f,k,E,H=e=>e;const F=Symbol("baas widget");var $=babelHelpers.classPrivateFieldLooseKey("showBaasWidget");class T extends B{constructor(...e){super(...e),Object.defineProperty(this,$,{value:A})}getConfig(){return{html:this.getOptions().awaitData.then(e=>(this.setOptions({...e.data.baas,...this.getOptions()}),this.getLayout())),minHeight:this.getOptions().isSmall?"86px":"55px"}}getTitle(){return this.cache.remember("title",()=>n.Tag.render(x||(x=H`
				<div class="license-widget-item-name">
					<span>
						${0}
					</span>
				</div>
			`),this.getOptions().title))}getDescription(){return this.getOptions().isActive?this.getReminderMessage():this.getDescriptionLink()}getDescriptionLink(){return this.cache.remember("description-link",()=>n.Tag.render(C||(C=H`
				<div class="license-widget-item-link">
					<span class="license-widget-item-link-text" onclick="${0}">
						${0}
					</span>
				</div>
			`),()=>{s.FeaturePromotersRegistry.getPromoter({code:this.getOptions().description.landingCode}).show()},this.getOptions().description.text))}getReminderMessage(){return this.cache.remember("reminder-message",()=>{const e=n.Tag.render(f||(f=H`
				<div class="license-widget-item-link" onclick="${0}">
					<span class="license-widget-item-link-text --active">
						${0}
					</span>
				</div>
			`),babelHelpers.classPrivateFieldLooseBase(this,$)[$].bind(this),this.getOptions().messages.remainder);return BX.PULL&&n.Extension.getSettings("baas.store").pull&&(BX.PULL.extendWatch(n.Extension.getSettings("baas.store").pull.channelName),i.EventEmitter.subscribe("onPullEvent-baas",t=>{const[i,s]=t.getData();"updateService"===i&&s.purchaseCount&&(e.querySelector('[data-bx-role="purchaseCount"]').innerText=s.purchaseCount)})),e})}getLayoutId(){return"license-widget-block-baas"}getButton(){return n.Tag.render(k||(k=H`
			<a class="license-widget-item-btn" onclick="${0}">
				${0}
			</a>
		`),babelHelpers.classPrivateFieldLooseBase(this,$)[$].bind(this),this.getOptions().button.text)}getIcon(){return this.cache.remember("icon",()=>n.Tag.render(E||(E=H`
				<div class="license-widget-item-icon license-widget-item-icon--baas"/>
			`)))}getMainClass(){return this.getOptions().isActive?"--baas-active":"--baas-default"}}function A(){n.Runtime.loadExtension(["baas.store"]).then(e=>{const t=e.Widget.getInstance();t[F]||t.subscribe("onClickBack",()=>{this.getOptions().licensePopup.show()}),t.bind(this.getOptions().licensePopupTarget,e.Analytics.CONTEXT_LICENSE_WIDGET).show(),i.EventEmitter.emit(i.EventEmitter.GLOBAL_TARGET,"BX.Intranet.LicenseWidget.Popup:openChild")})}let M,D,I,X,_,W,S,K,j,N=e=>e;class R extends b{constructor(e){super(e),this.setEventNamespace("BX.Bitrix24.LicenseWidget.Content.License")}getLayout(){return this.cache.remember("layout",()=>n.Tag.render(M||(M=N`
			<div data-id="license-widget-block-tariff"
				class="license-widget-item license-widget-item--main ${0}"
			>
				<div class="license-widget-inner ${0}">
					<div class="license-widget-content">
						${0}
						<div class="license-widget-item-content">
							<div class="license-widget-item-name">
								<span>${0}</span>
							</div>
							${0}
							${0}
							${0}
						</div>
					</div>
					${0}
				</div>
			</div>
			`),this.getOptions().isExpired||this.getOptions().isAlmostExpired?"license-widget-item--expired":"",this.getOptions().isDemo?"--demo":"",this.getMainIcon(),this.getOptions().name,this.getOptions().isExpired?this.getExpiredMessage():this.getRemainderMessage(),this.getOptions().isExpired&&this.getOptions().isAlmostBlocked?this.getBlockMessage():"",this.getOptions().isAlmostBlocked?"":this.getLink(),this.getOptions().button.isAvailable?this.getButton():""))}getMainIcon(){const e=n.Tag.render(D||(D=N`
			<div class="license-widget-item-icon"/>
		`));return this.getOptions().isAlmostExpired?n.Dom.addClass(e,"license-widget-item-icon--low"):this.getOptions().isExpired?n.Dom.addClass(e,"license-widget-item-icon--expired"):this.getOptions().isDemo?n.Dom.addClass(e,"license-widget-item-icon--demo"):n.Dom.addClass(e,"license-widget-item-icon--pro"),e}getButton(){if("POST"===this.getOptions().button.type){const e=()=>{document.querySelector("#renew-license-form").submit()};return n.Tag.render(I||(I=N`
				<button onclick="${0}" class="license-widget-item-btn ${0}">
					<form id="renew-license-form" action="${0}" method="post" target="_blank">
						<input name="license_key" value="${0}" hidden>
					</form>
					${0}
				</button>
			`),e,!this.getOptions().isDemo||this.getOptions().isAlmostExpired||this.getOptions().isExpired?"":"license-widget-item-btn--green",this.getOptions().button.link,this.getOptions().button.hashKey,this.getOptions().button.text)}return n.Tag.render(X||(X=N`
			<a href="${0}" target="_blank" class="license-widget-item-btn ${0}">
				${0}
			</a>
		`),this.getOptions().button.link,!this.getOptions().isDemo||this.getOptions().isAlmostExpired||this.getOptions().isExpired?"":"license-widget-item-btn--green",this.getOptions().button.text)}getExpiredMessage(){return this.cache.remember("expired-message",()=>n.Tag.render(_||(_=N`
				<div class="license-widget-item-expired-message">
					<span class="license-widget-item-info-text">
						${0}
					</span>
				</div>
			`),this.getOptions().messages.expired))}getBlockMessage(){return this.cache.remember("block-message",()=>n.Tag.render(W||(W=N`
				<div class="license-widget-item-expired-message --scanner-info">
					<span class="license-widget-item-info-text">
						${0}
					</span>
				</div>
			`),this.getOptions().messages.block))}getRemainderMessage(){return this.cache.remember("block-message",()=>this.getOptions().isExpired||this.getOptions().isAlmostExpired?n.Tag.render(S||(S=N`
					<div class="license-widget-item-expired-message --scanner-info">
						<span class="license-widget-item-info-text">
							${0}
						</span>
					</div>
				`),this.getOptions().messages.remainder):n.Tag.render(K||(K=N`
				<div class="license-widget-item-info">
					<span class="license-widget-item-info-text">
						${0}
					</span>
				</div>
			`),this.getOptions().messages.remainder))}getLink(){return n.Tag.render(j||(j=N`
			<a href="${0}" class="license-widget-item-link-text" target="_blank">
				${0}
			</a>
		`),this.getOptions().more.link,this.getOptions().more.text)}}let G,U,q=e=>e;class z extends b{constructor(e){super(e),this.setEventNamespace("BX.Bitrix24.LicenseWidget.Content.Orders")}getConfig(){return{html:this.getLayout(),minHeight:"50px"}}getLayout(){return this.cache.remember("layout",()=>n.Tag.render(G||(G=q`
				<div data-id="license-widget-block-orders" onclick="${0}" class="license-widget-item license-widget-item--secondary --pointer">
					<div class="license-widget-inner">
						<div class="license-widget-content">
							<div class="license-widget-item-icon license-widget-item-icon--partner"></div>
							<div class="license-widget-item-content">
								${0}
							</div>
						</div>
						<div class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right"/>
					</div>
				</div>
			`),()=>{this.getOptions().landingCode?s.FeaturePromotersRegistry.getPromoter({code:this.getOptions().landingCode}).show():window.open(this.getOptions().link)},this.getTitle()))}getTitle(){return this.cache.remember("title",()=>n.Tag.render(U||(U=q`
				<div class="license-widget-item-name">
					<span>
						${0}
					</span>
				</div>
			`),this.getOptions().title))}}let J,Q,V=e=>e;class Y extends b{constructor(e){super(e),this.setEventNamespace("BX.Bitrix24.LicenseWidget.Content.Orders")}getConfig(){return{html:this.getLayout(),minHeight:"50px"}}getLayout(){return this.cache.remember("layout",()=>n.Tag.render(J||(J=V`
				<div data-id="license-widget-block-orders" onclick="${0}" class="license-widget-item license-widget-item--secondary --pointer">
					<div class="license-widget-inner">
						<div class="license-widget-content">
							<div class="license-widget-item-icon license-widget-item-icon--order"></div>
							<div class="license-widget-item-content">
								${0}
							</div>
						</div>
						<div class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right"/>
					</div>
					<form id="form-purchase-history" action="${0}" method="post" target="_blank">
						<input name="license_key" value="${0}" hidden>
					</form>
				</div>
			`),e=>{document.querySelector("#form-purchase-history").submit()},this.getTitle(),this.getOptions().link,this.getOptions().hashKey))}getTitle(){return this.cache.remember("title",()=>n.Tag.render(Q||(Q=V`
				<div class="license-widget-item-name">
					<span>
						${0}
					</span>
				</div>
			`),this.getOptions().text))}}let Z,ee=e=>e;class te extends b{constructor(e){super(e),this.setEventNamespace("BX.Bitrix24.LicenseWidget.Content.Telephony")}getConfig(){return{html:this.getOptions().awaitData.then(e=>(this.setOptions({...e.data.telephony,...this.getOptions()}),this.getLayout())),minHeight:"43px",sizeLoader:30}}getLayout(){return this.cache.remember("layout",()=>n.Tag.render(Z||(Z=ee`
				<div data-id="license-widget-block-telephony" onclick="${0}" class="license-widget-item license-widget-item--secondary --pointer">
					<div class="license-widget-inner">
						<div class="license-widget-content">
							<div class="license-widget-item-icon ${0}"/>
							<div class="license-widget-item-content">
								<div class="license-widget-item-name">
									${0}
								</div>
							</div>
						</div>
						<div class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right"/>
					</div>
				</div>
			`),()=>{document.location.href=this.getOptions().link},this.getOptions().isActive?"license-widget-item-icon--tel-active":"license-widget-item-icon--tel",this.getOptions().title))}}let ie,se,ne,ae=e=>e;class re extends b{getConfig(){return{html:this.getLayout(),minHeight:"43px",sizeLoader:30}}getLayout(){return this.cache.remember("layout",()=>n.Tag.render(ie||(ie=ae`
				<div onclick="${0}" data-id="license-widget-block-whatsnew" class="license-widget-item license-widget-item--secondary --pointer">
					<div class="license-widget-inner">
						<div class="license-widget-content">
							${0}
							<div class="license-widget-item-content">
								${0}
							</div>
						</div>
						<div class="license-widget-item-icon__arrow-right ui-icon-set --arrow-right"/>
					</div>
				</div>
			`),()=>{window.open(this.getOptions().link,"_blank")},this.getMainIcon(),this.getTitle()))}getMainIcon(){return this.cache.remember("main-icon",()=>n.Tag.render(se||(se=ae`
				<div class="license-widget-item-icon license-widget-item-icon--updates"></div>
			`)))}getTitle(){return this.cache.remember("title",()=>n.Tag.render(ne||(ne=ae`
				<div class="license-widget-item-name">
					<span>
						${0}
					</span>
				</div>
			`),this.getOptions().title))}}var oe=babelHelpers.classPrivateFieldLooseKey("cache"),le=babelHelpers.classPrivateFieldLooseKey("getContent"),ce=babelHelpers.classPrivateFieldLooseKey("getLicenseContent"),de=babelHelpers.classPrivateFieldLooseKey("getMarketContent"),ge=babelHelpers.classPrivateFieldLooseKey("getBaasContent"),pe=babelHelpers.classPrivateFieldLooseKey("getPurchaseHistoryContent"),he=babelHelpers.classPrivateFieldLooseKey("getTelephonyContent"),me=babelHelpers.classPrivateFieldLooseKey("getUpdatesContent"),be=babelHelpers.classPrivateFieldLooseKey("getPartnerContent"),ue=babelHelpers.classPrivateFieldLooseKey("getDynamicContent");class ve extends i.EventEmitter{constructor(e){super(),Object.defineProperty(this,ue,{value:fe}),Object.defineProperty(this,be,{value:Ce}),Object.defineProperty(this,me,{value:xe}),Object.defineProperty(this,he,{value:Be}),Object.defineProperty(this,pe,{value:ye}),Object.defineProperty(this,ge,{value:Pe}),Object.defineProperty(this,de,{value:Le}),Object.defineProperty(this,ce,{value:Oe}),Object.defineProperty(this,le,{value:we}),Object.defineProperty(this,oe,{writable:!0,value:new n.Cache.MemoryCache}),this.setOptions(e),this.setEventNamespace("BX.Intranet.LicenseWidget.Popup"),this.setEventHandlers()}setOptions(e){babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].set("options",e)}getOptions(){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].get("options",{})}show(){this.getBasePopup().show(),this.emit("show")}close(){this.getBasePopup().close()}getBasePopup(){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].remember("popup",()=>(this.emit("init"),new a.PopupComponentsMaker({target:this.getOptions().target,width:374,content:babelHelpers.classPrivateFieldLooseBase(this,le)[le]()})))}setEventHandlers(){const e=()=>{this.close()};this.subscribe("init",()=>{i.EventEmitter.subscribe(i.EventEmitter.GLOBAL_TARGET,"SidePanel.Slider:onOpenStart",e),i.EventEmitter.subscribe(i.EventEmitter.GLOBAL_TARGET,"BX.Intranet.LicenseWidget.Popup:openChild",e)})}}function we(){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].remember("content",()=>{const e=[];return this.getOptions().content.license.isAvailable&&e.push(babelHelpers.classPrivateFieldLooseBase(this,ce)[ce]().getConfig()),this.getOptions().content.baas.isAvailable&&this.getOptions().content.market.isAvailable?e.push({html:[babelHelpers.classPrivateFieldLooseBase(this,de)[de](!0).getConfig(),babelHelpers.classPrivateFieldLooseBase(this,ge)[ge](!0).getConfig()]}):this.getOptions().content.market.isAvailable?e.push(babelHelpers.classPrivateFieldLooseBase(this,de)[de](!1).getConfig()):this.getOptions().content.baas.isAvailable&&e.push(babelHelpers.classPrivateFieldLooseBase(this,ge)[ge](!1).getConfig()),e.push(babelHelpers.classPrivateFieldLooseBase(this,pe)[pe]().getConfig()),this.getOptions().content.telephony.isAvailable?e.push({html:[babelHelpers.classPrivateFieldLooseBase(this,he)[he]().getConfig(),babelHelpers.classPrivateFieldLooseBase(this,me)[me]().getConfig()]}):e.push(babelHelpers.classPrivateFieldLooseBase(this,me)[me]().getConfig()),this.getOptions().content.partner.isAvailable&&e.push(babelHelpers.classPrivateFieldLooseBase(this,be)[be]().getConfig()),e})}function Oe(){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].remember("license-content",()=>new R({...this.getOptions().content.license}))}function Le(e){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].remember("market-content",()=>new B({...this.getOptions().content.market,isSmall:e}))}function Pe(e){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].remember("baas-content",()=>new T({awaitData:babelHelpers.classPrivateFieldLooseBase(this,ue)[ue](),licensePopupTarget:this.getOptions().target,licensePopup:this,isAdmin:this.getOptions().isAdmin,isSmall:e}))}function ye(){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].remember("purchase-history-content",()=>new Y({...this.getOptions().content["purchase-history"]}))}function Be(){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].remember("telephony-content",()=>new te({awaitData:babelHelpers.classPrivateFieldLooseBase(this,ue)[ue](),...this.getOptions().content.telephony}))}function xe(){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].remember("updates-content",()=>new re({...this.getOptions().content.updates}))}function Ce(){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].remember("partner-content",()=>new z({...this.getOptions().content.partner}))}function fe(){return babelHelpers.classPrivateFieldLooseBase(this,oe)[oe].remember("await-data",()=>new Promise((e,t)=>{n.ajax.runAction(this.getOptions().content.action).then(e).catch(t)}))}var ke=babelHelpers.classPrivateFieldLooseKey("cache");e.LicenseWidget=class{constructor(e){if(Object.defineProperty(this,ke,{writable:!0,value:new n.Cache.MemoryCache}),!n.Type.isDomNode(e.buttonWrapper))throw new Error("LicenseWidget: The buttonWrapper option is required.");this.setOptions(e),this.getMainButton().replaceSkeleton(),this.getMainButton().subscribe("click",()=>{this.getPopup().show()})}setOptions(e){return babelHelpers.classPrivateFieldLooseBase(this,ke)[ke].set("options",e),this}getOptions(){return babelHelpers.classPrivateFieldLooseBase(this,ke)[ke].get("options",{})}getPopup(){return babelHelpers.classPrivateFieldLooseBase(this,ke)[ke].remember("popup",()=>new ve({target:this.getMainButton().getContent(),content:{...this.getOptions()}}))}getMainButton(){return babelHelpers.classPrivateFieldLooseBase(this,ke)[ke].remember("main-button",()=>new p({wrapper:this.getOptions().buttonWrapper,isLicenseExpired:this.getOptions().license.isExpired,className:this.getOptions()["main-button"].className,text:this.getOptions()["main-button"].text}))}}}(this.BX.Intranet=this.BX.Intranet||{},BX.UI,BX.Event,BX.UI,BX,BX.UI);
//# sourceMappingURL=license-widget.bundle.js.map
