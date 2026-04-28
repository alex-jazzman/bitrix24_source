this.BX=this.BX||{},function(e,t,i,s,n,r,o,a,l,c){"use strict";class d extends i.EventEmitter{constructor(e){super(),this.cache=new c.Cache.MemoryCache,this.setOptions(e),this.setEventNamespace("BX.Intranet.LicenseWidget.Content")}setOptions(e){return this.cache.set("options",e),this}getOptions(){return this.cache.get("options",{})}getLayout(){throw new Error("Must be implemented in a child class")}getConfig(){return{html:this.getLayout(),minHeight:"58px"}}}let g,p,h,u,m,b,v,w=e=>e;var P=babelHelpers.classPrivateFieldLooseKey("getHelpIcon"),O=babelHelpers.classPrivateFieldLooseKey("showHelper");class L extends d{constructor(...e){super(...e),Object.defineProperty(this,O,{value:f}),Object.defineProperty(this,P,{value:E})}getConfig(){return{html:this.getLayout(),minHeight:this.getOptions().isSmall?"86px":"55px"}}getLayout(){return this.cache.remember("layout",()=>c.Tag.render(g||(g=w`
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
			`),this.getLayoutId(),this.getMainClass(),this.getOptions().isSmall?"--column":"",this.getIcon(),this.getTitle(),this.getDescription(),this.getButton()))}getLayoutId(){return"license-widget-block-market"}getTitle(){return this.cache.remember("title",()=>c.Tag.render(p||(p=w`
				<div class="license-widget-item-name">
					<span>
						${0}
					</span>
					${0}
				</div>
			`),this.getOptions().title,babelHelpers.classPrivateFieldLooseBase(this,P)[P]()))}getIcon(){return this.cache.remember("icon",()=>c.Tag.render(h||(h=w`
				<div class="license-widget-item-icon license-widget-item-icon--mp"/>
			`)))}getDescription(){return this.cache.remember("description",()=>this.getOptions().isPaid||this.getOptions().isDemo?this.getReminderMessage():this.getDescriptionLink())}getMainClass(){return this.getOptions().isExpired||this.getOptions().isAlmostExpired?"--market-expired":this.getOptions().isPaid||this.getOptions().isDemo?"--market-active":"--market-default"}getReminderMessage(){return this.cache.remember("reminder-message",()=>c.Tag.render(u||(u=w`
				<div class="license-widget-item-info">
					<span class="license-widget-item-info-text">
						${0}
					</span>
				</div>
			`),this.getOptions().messages.remainder))}getDescriptionLink(){return this.cache.remember("description-link",()=>c.Tag.render(m||(m=w`
				<div class="license-widget-item-link">
					<span class="license-widget-item-link-text" onclick="${0}">
						${0}
					</span>
				</div>
			`),()=>babelHelpers.classPrivateFieldLooseBase(this,O)[O](),this.getOptions().description.text))}getButton(){return this.cache.remember("button",()=>c.Tag.render(b||(b=w`
				<a onclick="${0}" href="${0}" class="license-widget-item-btn" target="_blank">
					${0}
				</a>
			`),()=>{i.EventEmitter.emit(i.EventEmitter.GLOBAL_TARGET,"BX.Intranet.LicenseWidget.Popup:openChild")},this.getOptions().button.link,this.getOptions().button.text))}}function E(){return this.getOptions().isPaid||this.getOptions().isDemo?c.Tag.render(v||(v=w`<span class="license-widget-item-help" onclick="${0}"></span>`),()=>babelHelpers.classPrivateFieldLooseBase(this,O)[O]()):""}function f(){l.FeaturePromotersRegistry.getPromoter({code:this.getOptions().description.landingCode}).show()}let B,y,T,F,H,C,k=e=>e;const I=Symbol("baas widget");var x=babelHelpers.classPrivateFieldLooseKey("getHelpIcon"),$=babelHelpers.classPrivateFieldLooseKey("showHelper"),_=babelHelpers.classPrivateFieldLooseKey("showBaasWidget");class S extends L{constructor(...e){super(...e),Object.defineProperty(this,_,{value:D}),Object.defineProperty(this,$,{value:N}),Object.defineProperty(this,x,{value:A})}getConfig(){return{html:this.getLayout(),minHeight:this.getOptions().isSmall?"86px":"55px"}}getTitle(){return this.cache.remember("title",()=>c.Tag.render(B||(B=k`
				<div class="license-widget-item-name">
					<span>
						${0}
					</span>
					${0}
				</div>
			`),this.getOptions().title,babelHelpers.classPrivateFieldLooseBase(this,x)[x]()))}getDescription(){return this.getOptions().isActive?this.getReminderMessage():this.getDescriptionLink()}getDescriptionLink(){return this.cache.remember("description-link",()=>c.Tag.render(y||(y=k`
				<div class="license-widget-item-link">
					<span class="license-widget-item-link-text" onclick="${0}">
						${0}
					</span>
				</div>
			`),()=>babelHelpers.classPrivateFieldLooseBase(this,$)[$](),this.getOptions().description.text))}getReminderMessage(){return this.cache.remember("reminder-message",()=>{const e=c.Tag.render(T||(T=k`
				<div class="license-widget-item-link" onclick="${0}">
					<span class="license-widget-item-link-text --active">
						${0}
					</span>
				</div>
			`),babelHelpers.classPrivateFieldLooseBase(this,_)[_].bind(this),this.getOptions().messages.remainder);return BX.PULL&&c.Extension.getSettings("baas.store").pull&&(BX.PULL.extendWatch(c.Extension.getSettings("baas.store").pull.channelName),i.EventEmitter.subscribe("onPullEvent-baas",t=>{const[i,s]=t.getData();"updateService"===i&&s.purchaseCount&&(e.querySelector('[data-bx-role="purchaseCount"]').innerText=s.purchaseCount)})),e})}getLayoutId(){return"license-widget-block-baas"}getButton(){return c.Tag.render(F||(F=k`
			<a class="license-widget-item-btn" onclick="${0}">
				${0}
			</a>
		`),babelHelpers.classPrivateFieldLooseBase(this,_)[_].bind(this),this.getOptions().button.text)}getIcon(){return this.cache.remember("icon",()=>c.Tag.render(H||(H=k`
				<div class="license-widget-item-icon license-widget-item-icon--baas"/>
			`)))}getMainClass(){return this.getOptions().isActive?"--baas-active":"--baas-default"}}function A(){return this.getOptions().isActive?c.Tag.render(C||(C=k`<span class="license-widget-item-help" onclick="${0}"></span>`),()=>babelHelpers.classPrivateFieldLooseBase(this,$)[$]()):""}function N(){l.FeaturePromotersRegistry.getPromoter({code:this.getOptions().description.landingCode}).show()}function D(){c.Runtime.loadExtension(["baas.store"]).then(e=>{const t=e.Widget.getInstance();t[I]||t.subscribe("onClickBack",()=>{this.getOptions().licensePopup.show()}),t.bind(this.getOptions().licensePopupTarget,e.Analytics.CONTEXT_LICENSE_WIDGET).show(),i.EventEmitter.emit(i.EventEmitter.GLOBAL_TARGET,"BX.Intranet.LicenseWidget.Popup:openChild")})}let R,X,M,U,j,K,W,G,q,z,J,Q,V,Y=e=>e;var Z=babelHelpers.classPrivateFieldLooseKey("getTitleWithIntegrator"),ee=babelHelpers.classPrivateFieldLooseKey("getTitleWithoutPartner"),te=babelHelpers.classPrivateFieldLooseKey("getHelpIcon"),ie=babelHelpers.classPrivateFieldLooseKey("renderButtonsWithConnectedPartner"),se=babelHelpers.classPrivateFieldLooseKey("renderButtonsWithoutPartner"),ne=babelHelpers.classPrivateFieldLooseKey("closeBasePopup"),re=babelHelpers.classPrivateFieldLooseKey("showDiscontinueFeedbackForm"),oe=babelHelpers.classPrivateFieldLooseKey("getRefusalFormIds"),ae=babelHelpers.classPrivateFieldLooseKey("showSuccessDiscontinuePopup"),le=babelHelpers.classPrivateFieldLooseKey("getSuccessDiscontinuePopup"),ce=babelHelpers.classPrivateFieldLooseKey("getSuccessDiscontinuePopupContent");class de extends d{constructor(...e){super(...e),Object.defineProperty(this,ce,{value:Le}),Object.defineProperty(this,le,{value:Oe}),Object.defineProperty(this,ae,{value:Pe}),Object.defineProperty(this,oe,{value:we}),Object.defineProperty(this,re,{value:ve}),Object.defineProperty(this,ne,{value:be}),Object.defineProperty(this,se,{value:me}),Object.defineProperty(this,ie,{value:ue}),Object.defineProperty(this,te,{value:he}),Object.defineProperty(this,ee,{value:pe}),Object.defineProperty(this,Z,{value:ge})}getLayout(){return this.cache.remember("layout",()=>c.Tag.render(R||(R=Y`
				<div data-id="license-widget-block-partner" class="license-widget-item license-widget-item--secondary">
					<div class="license-widget-inner">
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
			`),this.getIcon(),this.getTitle(),this.getDescription(),this.getButtons()))}getConfig(){return{html:this.getLayout(),className:"license-widget-section-with-box"}}getIcon(){return this.cache.remember("icon",()=>c.Tag.render(X||(X=Y`
				<div class="license-widget-item-icon license-widget-item-icon--b24-partner">
					${0}
				</div>
			`),this.isConnected()&&""!==this.getPartnerLogo()?c.Tag.safe(M||(M=Y`<img class="license-widget-item-icon-img" src="${0}" alt="">`),this.getPartnerLogo()):""))}getTitle(){return this.cache.remember("title",()=>{const e=this.isConnected(),t=e&&""!==this.getPartnerName()?babelHelpers.classPrivateFieldLooseBase(this,Z)[Z]():babelHelpers.classPrivateFieldLooseBase(this,ee)[ee]();return e&&this.getPartnerUrl()&&c.Event.bind(t,"click",async()=>{window.open(this.getPartnerUrl(),"_blank","noopener,noreferrer")}),t})}getDescription(){return this.cache.remember("description",()=>c.Tag.render(U||(U=Y`
				<div class="license-widget-option-text --flex">
					${0}
				</div>
			`),this.getOptions().description))}getButtons(){return this.cache.remember("button",()=>this.isConnected()?babelHelpers.classPrivateFieldLooseBase(this,ie)[ie]():babelHelpers.classPrivateFieldLooseBase(this,se)[se]())}getMoreMenu(e){return this.cache.remember("partner_menu",()=>{const t=new a.Menu({bindElement:e,cacheable:!0,items:[{text:this.getButtonTitle("feedback"),onclick:()=>{t.close(),this.showFeedbackForm()}},{text:this.getButtonTitle("discontinue"),onclick:()=>{t.close(),(new o.PartnerDiscontinue).getPopup({onConfirm:()=>{babelHelpers.classPrivateFieldLooseBase(this,re)[re]()}}).show()}}]});return t})}showFeedbackForm(){var e;const t=null!=(e=this.getOptions().feedbackFormPresets)?e:{};c.Type.isObject(t)&&!c.Type.isArray(t)&&BX.UI.Feedback.PartnerForm.showFeedback({id:"partner-feedback",presets:t,title:c.Loc.getMessage("INTRANET_LICENSE_WIDGET_PARTNER_FEEDBACK_TITLE")})}showInfoHelper(e){var t,i,s;null!=(t=BX)&&null!=(i=t.UI)&&i.InfoHelper?BX.UI.InfoHelper.show(e):null!=(s=BX)&&s.Helper&&BX.Helper.show("redirect=detail&code="+e)}getButtonTitle(e){var t,i,s,n,r,o,a;const l=null!=(t=this.getOptions().buttons)?t:{};switch(e){case"connect":return null==l||null==(i=l.connect)?void 0:i.title;case"choose":return null==l||null==(s=l.choose)?void 0:s.title;case"feedback":return null==l||null==(n=l.menu)||null==(r=n.feedback)?void 0:r.title;case"discontinue":return null==l||null==(o=l.menu)||null==(a=o.discontinue)?void 0:a.title;default:return""}}isConnected(){var e;return Boolean(null!=(e=this.getOptions().isConnected)?e:this.getOptions().isPartnerConnect)}getPartnerName(){var e,t;return null!=(e=null!=(t=this.getOptions().integratorName)?t:this.getOptions().partnerName)?e:""}getPartnerUrl(){var e,t;return null!=(e=null!=(t=this.getOptions().integratorUrl)?t:this.getOptions().partnerUrl)?e:""}getPartnerLogo(){var e,t;return null!=(e=null!=(t=this.getOptions().integratorLogo)?t:this.getOptions().partnerLogo)?e:""}isCurrentUserAdmin(){return!0===this.getOptions().isCurrentUserAdmin}}function ge(){return c.Tag.render(j||(j=Y`
			<div class="license-widget-item-name --link">
				${0}
				<div class="license-widget-item-chevron-right">
					<div class="ui-icon-set --chevron-right"></div>
				</div>
				${0}
			</div>
		`),c.Text.encode(this.getPartnerName()),babelHelpers.classPrivateFieldLooseBase(this,te)[te]())}function pe(){return c.Tag.render(K||(K=Y`
			<div class="license-widget-item-name">
				<span>${0}</span>
				${0}
			</div>
		`),this.getOptions().title,babelHelpers.classPrivateFieldLooseBase(this,te)[te]())}function he(){return c.Tag.render(W||(W=Y`<span class="license-widget-item-help" onclick="${0}"></span>`),e=>{e.stopPropagation(),BX.Helper.show("redirect=detail&code=26952922")})}function ue(){const e=c.Tag.render(G||(G=Y`
			<a class="license-widget-item-btn" >
				${0}
			</a>
		`),this.getButtonTitle("connect"));c.Event.bind(e,"click",async()=>{var e,t,i,s,n;babelHelpers.classPrivateFieldLooseBase(this,ne)[ne]();const r=null!=(e=this.getOptions().connectPartnerFormParams)?e:{};null!=(t=BX)&&null!=(i=t.Intranet)&&null!=(s=i.Bitrix24)&&null!=(n=s.PartnerForm)&&n.showConnectForm?await BX.Intranet.Bitrix24.PartnerForm.showConnectForm(r):this.showInfoHelper("info_implementation_request")});const t=c.Tag.render(q||(q=Y`
			<div class="license-widget-item-btn-container">
				${0}
			</div>
		`),e);if(this.isCurrentUserAdmin()){const e=c.Tag.render(z||(z=Y`
				<a class="license-widget-item-btn --partner-more" >
					<div class="ui-icon-set --more-m"></div>
				</a>
			`)),i=this.getMoreMenu(e);c.Event.bind(e,"click",()=>{i.show()}),c.Dom.append(e,t)}return t}function me(){const e=c.Tag.render(J||(J=Y`
			<a class="license-widget-item-btn">
				${0}
			</a>
		`),this.getButtonTitle("choose"));return c.Event.bind(e,"click",()=>{this.showInfoHelper("info_implementation_request")}),c.Tag.render(Q||(Q=Y`
			<div class="license-widget-item-btn-container">
				${0}
			</div>
		`),e)}function be(){i.EventEmitter.emit(i.EventEmitter.GLOBAL_TARGET,"BX.Intranet.LicenseWidget.Popup:openChild")}function ve(){var e;const t=null!=(e=this.getOptions().feedbackFormPresets)?e:{};c.Type.isObject(t)&&!c.Type.isArray(t)&&(BX.UI.Feedback.PartnerForm.showRefusal({id:"partner-refusal",presets:t,title:c.Loc.getMessage("INTRANET_LICENSE_WIDGET_PARTNER_FEEDBACK_TITLE")}),top.addEventListener("b24:form:send:success",e=>{var t,i,s;const n=null==e||null==(t=e.detail)||null==(i=t.object)||null==(s=i.identification)?void 0:s.id;if(c.Type.isNil(n))return;const r=String(n),o=babelHelpers.classPrivateFieldLooseBase(this,oe)[oe]();(0===o.length||o.includes(r))&&c.ajax.runAction("intranet.v2.Partner.Relation.delete",{}).then(()=>{babelHelpers.classPrivateFieldLooseBase(this,ae)[ae]()}).catch(e=>{BX.UI.Notification.Center.notify({content:c.Loc.getMessage("INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_ERROR")}),top.console.error(e)})},{once:!0}))}function we(){var e;const t=null==(e=c.Extension.getSettings("ui.feedback.partnerform"))?void 0:e.get("partnerRefusalForms");return Array.isArray(t)?t.map(e=>null==e?void 0:e.id).filter(e=>c.Type.isNumber(e)||c.Type.isStringFilled(e)).map(String):[]}function Pe(){var e,t;!(null==(e=top.BX.SidePanel)||null==(t=e.Instance)||!t.getOpenSliders||"function"!=typeof top.BX.SidePanel.Instance.getOpenSliders)&&top.BX.SidePanel.Instance.getOpenSliders().length>0?top.BX.Event.EventEmitter.subscribeOnce("SidePanel.Slider:onCloseComplete",()=>{babelHelpers.classPrivateFieldLooseBase(this,le)[le]().show()}):babelHelpers.classPrivateFieldLooseBase(this,le)[le]().show()}function Oe(){return this.cache.remember("success-discontinue-popup",()=>{const e=new a.Popup({useAirDesign:!0,content:babelHelpers.classPrivateFieldLooseBase(this,ce)[ce](),closeIcon:!0,cacheable:!0,className:"license-widget-partner-success-discontinue-popup",width:590,overlay:{opacity:100,backgroundColor:"rgba(0, 32, 78, 0.46)"},buttons:[new s.Button({text:c.Loc.getMessage("INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_CHOOSE_NEW_BTN"),useAirDesign:!0,style:s.AirButtonStyle.FILLED,className:"license-widget-partner-success-discontinue-popup-choose-new-btn",onclick:()=>{e.close(),this.showInfoHelper("info_implementation_request"),top.BX.Event.EventEmitter.subscribeOnce("SidePanel.Slider:onCloseComplete",()=>{location.reload()})}}),new s.Button({text:c.Loc.getMessage("INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_CLOSE_BTN"),useAirDesign:!0,style:s.AirButtonStyle.OUTLINE,onclick:()=>{e.close(),location.reload()}})]});return e})}function Le(){return c.Tag.render(V||(V=Y`
			<div class="license-widget-partner-success-discontinue-popup-content">
				<div class="license-widget-partner-success-discontinue-popup-content-text-wrapper">
					<div class="license-widget-partner-success-discontinue-popup-content-title">
						${0}
					</div>
					<div class="license-widget-partner-success-discontinue-popup-content-description">
						${0}
					</div>
				</div>
				<div class="license-widget-partner-success-discontinue-popup-content-image">
				</div>
			</div>
		`),c.Loc.getMessage("INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_TITLE"),c.Loc.getMessage("INTRANET_LICENSE_WIDGET_PARTNER_SUCCESS_DISCONTINUE_POPUP_DESC"))}var Ee=babelHelpers.classPrivateFieldLooseKey("popup");class fe{static show(e){babelHelpers.classPrivateFieldLooseBase(this,Ee)[Ee]?(babelHelpers.classPrivateFieldLooseBase(this,Ee)[Ee].setBindElement(e),babelHelpers.classPrivateFieldLooseBase(this,Ee)[Ee].show()):(babelHelpers.classPrivateFieldLooseBase(this,Ee)[Ee]=new a.Popup({content:c.Loc.getMessage("INTRANET_LICENSE_WIDGET_ADMIN_RIGHTS_RESTRICTED"),bindElement:e,angle:!0,offsetTop:0,offsetLeft:40,closeIcon:!1,autoHide:!0,darkMode:!0,overlay:!1,closeByEsc:!0,width:300}),babelHelpers.classPrivateFieldLooseBase(this,Ee)[Ee].show())}}Object.defineProperty(fe,Ee,{writable:!0,value:null});let Be,ye,Te,Fe,He,Ce,ke,Ie,xe,$e,_e=e=>e;class Se extends d{constructor(e){super(e),this.setEventNamespace("BX.Bitrix24.LicenseWidget.Content.License")}getLayout(){return this.cache.remember("layout",()=>c.Tag.render(Be||(Be=_e`
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
			`),this.getOptions().isExpired||this.getOptions().isAlmostExpired?"license-widget-item--expired":"",this.getOptions().isDemo?"--demo":"",this.getMainIcon(),this.getOptions().name,this.getOptions().isExpired?this.getExpiredMessage():this.getRemainderMessage(),this.getOptions().isExpired&&this.getOptions().isAlmostBlocked?this.getBlockMessage():"",this.getOptions().isAlmostBlocked?"":this.getLink(),this.getOptions().button.isAvailable?this.getButton():""))}getMainIcon(){const e=c.Tag.render(ye||(ye=_e`
			<div class="license-widget-item-icon"/>
		`));return this.getOptions().isAlmostExpired?c.Dom.addClass(e,"license-widget-item-icon--low"):this.getOptions().isExpired?c.Dom.addClass(e,"license-widget-item-icon--expired"):this.getOptions().isDemo?c.Dom.addClass(e,"license-widget-item-icon--demo"):c.Dom.addClass(e,"license-widget-item-icon--pro"),e}getButton(){if(this.getOptions().button.isAdminRestricted){const e=e=>{e.preventDefault(),fe.show(e.target)};return c.Tag.render(Te||(Te=_e`
				<a href="#" onclick="${0}" class="license-widget-item-btn ${0}">
					${0}
				</a>
			`),e,!this.getOptions().isDemo||this.getOptions().isAlmostExpired||this.getOptions().isExpired?"":"license-widget-item-btn--green",this.getOptions().button.text)}if("POST"===this.getOptions().button.type){const e=()=>{document.querySelector("#renew-license-form").submit()};return c.Tag.render(Fe||(Fe=_e`
				<button onclick="${0}" class="license-widget-item-btn ${0}">
					<form id="renew-license-form" action="${0}" method="post" target="_blank">
						<input name="license_key" value="${0}" hidden>
					</form>
					${0}
				</button>
			`),e,!this.getOptions().isDemo||this.getOptions().isAlmostExpired||this.getOptions().isExpired?"":"license-widget-item-btn--green",this.getOptions().button.link,this.getOptions().button.hashKey,this.getOptions().button.text)}return c.Tag.render(He||(He=_e`
			<a href="${0}" target="_blank" class="license-widget-item-btn ${0}">
				${0}
			</a>
		`),this.getOptions().button.link,!this.getOptions().isDemo||this.getOptions().isAlmostExpired||this.getOptions().isExpired?"":"license-widget-item-btn--green",this.getOptions().button.text)}getExpiredMessage(){return this.cache.remember("expired-message",()=>c.Tag.render(Ce||(Ce=_e`
				<div class="license-widget-item-expired-message">
					<span class="license-widget-item-info-text">
						${0}
					</span>
				</div>
			`),this.getOptions().messages.expired))}getBlockMessage(){return this.cache.remember("block-message",()=>c.Tag.render(ke||(ke=_e`
				<div class="license-widget-item-expired-message --scanner-info">
					<span class="license-widget-item-info-text">
						${0}
					</span>
				</div>
			`),this.getOptions().messages.block))}getRemainderMessage(){return this.cache.remember("block-message",()=>this.getOptions().isExpired||this.getOptions().isAlmostExpired?c.Tag.render(Ie||(Ie=_e`
					<div class="license-widget-item-expired-message --scanner-info">
						<span class="license-widget-item-info-text">
							${0}
						</span>
					</div>
				`),this.getOptions().messages.remainder):c.Tag.render(xe||(xe=_e`
				<div class="license-widget-item-info">
					<span class="license-widget-item-info-text">
						${0}
					</span>
				</div>
			`),this.getOptions().messages.remainder))}getLink(){const e=this.getOptions().more.isAdminRestricted?e=>{e.preventDefault(),fe.show(e.target)}:()=>{};return c.Tag.render($e||($e=_e`
			<a href="${0}" onclick="${0}" class="license-widget-item-link-text" target="_blank">
				${0}
			</a>
		`),this.getOptions().more.link,e,this.getOptions().more.text)}}let Ae,Ne,De=e=>e;class Re extends d{constructor(e){super(e),this.setEventNamespace("BX.Bitrix24.LicenseWidget.Content.Orders")}getConfig(){return{html:this.getLayout(),minHeight:"50px"}}getLayout(){return this.cache.remember("layout",()=>c.Tag.render(Ae||(Ae=De`
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
			`),()=>{this.getOptions().landingCode?l.FeaturePromotersRegistry.getPromoter({code:this.getOptions().landingCode}).show():window.open(this.getOptions().link)},this.getTitle()))}getTitle(){return this.cache.remember("title",()=>c.Tag.render(Ne||(Ne=De`
				<div class="license-widget-item-name">
					<span>
						${0}
					</span>
				</div>
			`),this.getOptions().title))}}let Xe,Me,Ue=e=>e;class je extends d{constructor(e){super(e),this.setEventNamespace("BX.Bitrix24.LicenseWidget.Content.Orders")}getConfig(){return{html:this.getLayout(),minHeight:"50px"}}getLayout(){return this.cache.remember("layout",()=>c.Tag.render(Xe||(Xe=Ue`
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
			`),e=>{document.querySelector("#form-purchase-history").submit()},this.getTitle(),this.getOptions().link,this.getOptions().hashKey))}getTitle(){return this.cache.remember("title",()=>c.Tag.render(Me||(Me=Ue`
				<div class="license-widget-item-name">
					<span>
						${0}
					</span>
				</div>
			`),this.getOptions().text))}}let Ke,We=e=>e;class Ge extends d{constructor(e){super(e),this.setEventNamespace("BX.Bitrix24.LicenseWidget.Content.Telephony")}getConfig(){return{html:this.getLayout(),minHeight:"43px",sizeLoader:30}}getLayout(){return this.cache.remember("layout",()=>c.Tag.render(Ke||(Ke=We`
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
			`),()=>{document.location.href=this.getOptions().link},this.getOptions().isActive?"license-widget-item-icon--tel-active":"license-widget-item-icon--tel",this.getOptions().title))}}let qe,ze,Je,Qe=e=>e;class Ve extends d{getConfig(){return{html:this.getLayout(),minHeight:"43px",sizeLoader:30}}getLayout(){return this.cache.remember("layout",()=>{const e=this.getOptions().isAdminRestricted?e=>{e.preventDefault(),fe.show(e.target)}:()=>{window.open(this.getOptions().link,"_blank")};return c.Tag.render(qe||(qe=Qe`
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
			`),e,this.getMainIcon(),this.getTitle())})}getMainIcon(){return this.cache.remember("main-icon",()=>c.Tag.render(ze||(ze=Qe`
				<div class="license-widget-item-icon license-widget-item-icon--updates"></div>
			`)))}getTitle(){return this.cache.remember("title",()=>c.Tag.render(Je||(Je=Qe`
				<div class="license-widget-item-name">
					<span>
						${0}
					</span>
				</div>
			`),this.getOptions().title))}}var Ye=babelHelpers.classPrivateFieldLooseKey("cache"),Ze=babelHelpers.classPrivateFieldLooseKey("getContent"),et=babelHelpers.classPrivateFieldLooseKey("getLicenseContent"),tt=babelHelpers.classPrivateFieldLooseKey("getMarketContent"),it=babelHelpers.classPrivateFieldLooseKey("getBaasContent"),st=babelHelpers.classPrivateFieldLooseKey("getIntegratorContent"),nt=babelHelpers.classPrivateFieldLooseKey("getPurchaseHistoryContent"),rt=babelHelpers.classPrivateFieldLooseKey("getTelephonyContent"),ot=babelHelpers.classPrivateFieldLooseKey("getUpdatesContent"),at=babelHelpers.classPrivateFieldLooseKey("getPartnerContent");class lt extends i.EventEmitter{constructor(e){super(),Object.defineProperty(this,at,{value:vt}),Object.defineProperty(this,ot,{value:bt}),Object.defineProperty(this,rt,{value:mt}),Object.defineProperty(this,nt,{value:ut}),Object.defineProperty(this,st,{value:ht}),Object.defineProperty(this,it,{value:pt}),Object.defineProperty(this,tt,{value:gt}),Object.defineProperty(this,et,{value:dt}),Object.defineProperty(this,Ze,{value:ct}),Object.defineProperty(this,Ye,{writable:!0,value:new c.Cache.MemoryCache}),this.setOptions(e),this.setEventNamespace("BX.Intranet.LicenseWidget.Popup"),this.setEventHandlers()}setOptions(e){babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].set("options",e)}getOptions(){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].get("options",{})}show(){this.getBasePopup().show(),this.emit("show")}close(){this.getBasePopup().close()}getBasePopup(){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].remember("popup",()=>(this.emit("init"),new t.PopupComponentsMaker({target:this.getOptions().target,width:374,content:babelHelpers.classPrivateFieldLooseBase(this,Ze)[Ze](),popupLoader:this.getOptions().loader})))}setEventHandlers(){const e=()=>{this.close()};this.subscribe("init",()=>{i.EventEmitter.subscribe(i.EventEmitter.GLOBAL_TARGET,"SidePanel.Slider:onOpenStart",e),i.EventEmitter.subscribe(i.EventEmitter.GLOBAL_TARGET,"BX.Intranet.LicenseWidget.Popup:openChild",e)})}}function ct(){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].remember("content",()=>{var e,t;const i=[];return this.getOptions().content.license.isAvailable&&i.push(babelHelpers.classPrivateFieldLooseBase(this,et)[et]().getConfig()),this.getOptions().content.market.isAvailable&&i.push(babelHelpers.classPrivateFieldLooseBase(this,tt)[tt](!1).getConfig()),this.getOptions().content.baas.isAvailable&&i.push(babelHelpers.classPrivateFieldLooseBase(this,it)[it](!1).getConfig()),null!=(e=this.getOptions().content.integrator)&&e.isAvailable&&i.push(babelHelpers.classPrivateFieldLooseBase(this,st)[st](!1).getConfig()),i.push(babelHelpers.classPrivateFieldLooseBase(this,nt)[nt]().getConfig()),this.getOptions().content.telephony.isAvailable?i.push({html:[babelHelpers.classPrivateFieldLooseBase(this,rt)[rt]().getConfig(),babelHelpers.classPrivateFieldLooseBase(this,ot)[ot]().getConfig()]}):i.push(babelHelpers.classPrivateFieldLooseBase(this,ot)[ot]().getConfig()),!this.getOptions().content.partner.isAvailable||null!=(t=this.getOptions().content.integrator)&&t.isAvailable||i.push(babelHelpers.classPrivateFieldLooseBase(this,at)[at]().getConfig()),i})}function dt(){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].remember("license-content",()=>new Se({...this.getOptions().content.license}))}function gt(e){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].remember("market-content",()=>new L({...this.getOptions().content.market,isSmall:e}))}function pt(e){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].remember("baas-content",()=>new S({...this.getOptions().content.baas,licensePopupTarget:this.getOptions().target,licensePopup:this,isAdmin:this.getOptions().isAdmin,isSmall:e}))}function ht(e){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].remember("integrator-content",()=>new de({...this.getOptions().content.integrator}))}function ut(){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].remember("purchase-history-content",()=>new je({...this.getOptions().content["purchase-history"]}))}function mt(){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].remember("telephony-content",()=>new Ge({...this.getOptions().content.telephony}))}function bt(){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].remember("updates-content",()=>new Ve({...this.getOptions().content.updates}))}function vt(){return babelHelpers.classPrivateFieldLooseBase(this,Ye)[Ye].remember("partner-content",()=>new Re({...this.getOptions().content.partner}))}var wt=babelHelpers.classPrivateFieldLooseKey("cache"),Pt=babelHelpers.classPrivateFieldLooseKey("instance"),Ot=babelHelpers.classPrivateFieldLooseKey("getPopup");class Lt{constructor(){Object.defineProperty(this,Ot,{value:Et}),Object.defineProperty(this,wt,{writable:!0,value:new c.Cache.MemoryCache})}static getInstance(){return babelHelpers.classPrivateFieldLooseBase(this,Pt)[Pt]||(babelHelpers.classPrivateFieldLooseBase(this,Pt)[Pt]=new this),babelHelpers.classPrivateFieldLooseBase(this,Pt)[Pt]}show(){babelHelpers.classPrivateFieldLooseBase(this,Ot)[Ot]().getBasePopup().isShown()||babelHelpers.classPrivateFieldLooseBase(this,Ot)[Ot]().show()}setOptions(e){return babelHelpers.classPrivateFieldLooseBase(this,wt)[wt].set("options",e),this}getOptions(){return babelHelpers.classPrivateFieldLooseBase(this,wt)[wt].get("options",{})}}function Et(){return babelHelpers.classPrivateFieldLooseBase(this,wt)[wt].remember("popup",()=>new lt({target:this.getOptions().buttonWrapper,loader:this.getOptions().loader,content:{...this.getOptions().data}}))}Object.defineProperty(Lt,Pt,{writable:!0,value:void 0}),e.LicenseWidget=Lt}(this.BX.Intranet=this.BX.Intranet||{},BX.UI,BX.Event,BX.UI,BX.UI.Feedback,BX,BX.Intranet,BX.Main,BX.UI,BX);
//# sourceMappingURL=license-widget.bundle.js.map
