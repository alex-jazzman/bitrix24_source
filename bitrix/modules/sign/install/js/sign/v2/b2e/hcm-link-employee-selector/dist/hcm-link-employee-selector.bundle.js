this.BX=this.BX||{},this.BX.Sign=this.BX.Sign||{},this.BX.Sign.V2=this.BX.Sign.V2||{},function(e,s,a,l,i,t){"use strict";let r,o,c=e=>e;var n=babelHelpers.classPrivateFieldLooseKey("api"),b=babelHelpers.classPrivateFieldLooseKey("documentGroupUids"),d=babelHelpers.classPrivateFieldLooseKey("employees"),v=babelHelpers.classPrivateFieldLooseKey("companyTitle"),p=babelHelpers.classPrivateFieldLooseKey("content"),h=babelHelpers.classPrivateFieldLooseKey("overlay"),P=babelHelpers.classPrivateFieldLooseKey("selectByUserId"),L=babelHelpers.classPrivateFieldLooseKey("getContent");class y{constructor(e){Object.defineProperty(this,L,{value:u}),Object.defineProperty(this,n,{writable:!0,value:void 0}),Object.defineProperty(this,b,{writable:!0,value:[]}),Object.defineProperty(this,d,{writable:!0,value:void 0}),Object.defineProperty(this,v,{writable:!0,value:void 0}),Object.defineProperty(this,p,{writable:!0,value:null}),Object.defineProperty(this,h,{writable:!0,value:null}),Object.defineProperty(this,P,{writable:!0,value:new Map}),babelHelpers.classPrivateFieldLooseBase(this,n)[n]=e.api,babelHelpers.classPrivateFieldLooseBase(this,b)[b]=e.documentGroupUids,babelHelpers.classPrivateFieldLooseBase(this,d)[d]=e.employees,babelHelpers.classPrivateFieldLooseBase(this,v)[v]=e.companyTitle}static openSlider(e,s){var a;BX.SidePanel.Instance.open("sign:hcmlink-vacancy-chooser",{width:800,loader:"default-loader",cacheable:!1,contentCallback:()=>top.BX.Runtime.loadExtension("sign.v2.b2e.hcm-link-employee-selector").then(s=>new s.HcmLinkVacancyChooser(e).getLayout()),events:{onClose:null!=(a=null==s?void 0:s.onCloseHandler)?a:()=>{}}})}getLayout(){const e=this;return t.Layout.createContent({extensions:["ui.forms","sign.v2.b2e.hcm-link-employee-selector"],title:babelHelpers.classPrivateFieldLooseBase(this,v)[v],toolbar:()=>[],content:()=>babelHelpers.classPrivateFieldLooseBase(e,L)[L](),buttons({cancelButton:s,SaveButton:a}){const i=new a({onclick:()=>{i.setWaiting(!0),l.Dom.show(babelHelpers.classPrivateFieldLooseBase(e,h)[h]),e.saveEmployees().then(()=>{BX.SidePanel.Instance.close()}).catch(()=>{}).finally(()=>{i.setWaiting(!1),l.Dom.hide(babelHelpers.classPrivateFieldLooseBase(e,h)[h])})}});return[i,s]}})}async saveEmployees(){if(0===babelHelpers.classPrivateFieldLooseBase(this,d)[d].size)return;const e=Array.from(babelHelpers.classPrivateFieldLooseBase(this,P)[P]).map(([e,s])=>({userId:e,employeeId:s.getValue()}));for(const s of babelHelpers.classPrivateFieldLooseBase(this,b)[b])await babelHelpers.classPrivateFieldLooseBase(this,n)[n].saveEmployeesForSignProcess({documentUid:s,selectedEmployeeCollection:e})}}function u(){if(!babelHelpers.classPrivateFieldLooseBase(this,p)[p]){const{root:e,selectContainer:s,overlay:a}=l.Tag.render(r||(r=c`
				<div class="sign-b2e-hcm-link-vacancy-choose">
					<div class="sign-b2e-hcm-link-vacancy-choose-overlay" ref="overlay"></div>
					<div class="sign-b2e-hcm-link-vacancy-choose-title">
						${0}
					</div>
					<div class="sign-b2e-hcm-link-vacancy-choose-select-container" ref="selectContainer"></div>
				</div>
			`),l.Loc.getMessage("SIGN_V2_B2E_HCM_LINK_EMPLOYEE_SELECTOR_TITLE"));babelHelpers.classPrivateFieldLooseBase(this,h)[h]=a,l.Dom.hide(a);Array.from(babelHelpers.classPrivateFieldLooseBase(this,d)[d].values()).sort((e,s)=>e.order-s.order).forEach(e=>{const a=e.positions[0].employeeId,t=new i.Select({options:e.positions.map(e=>({label:e.position,value:e.employeeId})),value:a});babelHelpers.classPrivateFieldLooseBase(this,P)[P].set(e.userId,t);const{rowElement:r,vacancySelector:n}=l.Tag.render(o||(o=c`
					<div class="sign-b2e-hcm-link-vacancy-choose-select-row" ref="rowElement">
						<div class="sign-b2e-hcm-link-vacancy-choose-select-row__avavar">
							<img src="${0}">
						</div>
						<div class="sign-b2e-hcm-link-vacancy-choose-select-row__name">
							${0}
						</div>
						<div class="sign-b2e-hcm-link-vacancy-choose-select-row__select" ref="vacancySelector"></div>
					</div>
				`),e.avatarLink,l.Text.encode(e.fullName));t.renderTo(n),l.Dom.append(r,s)}),babelHelpers.classPrivateFieldLooseBase(this,p)[p]=e}return babelHelpers.classPrivateFieldLooseBase(this,p)[p]}let H,B,m,F,g,E=e=>e;var f=babelHelpers.classPrivateFieldLooseKey("api"),_=babelHelpers.classPrivateFieldLooseKey("documentGroupUids"),k=babelHelpers.classPrivateFieldLooseKey("enabled"),w=babelHelpers.classPrivateFieldLooseKey("employees"),O=babelHelpers.classPrivateFieldLooseKey("companyTitle"),S=babelHelpers.classPrivateFieldLooseKey("container"),T=babelHelpers.classPrivateFieldLooseKey("usersPreviewContainer"),I=babelHelpers.classPrivateFieldLooseKey("loadEmployees"),C=babelHelpers.classPrivateFieldLooseKey("getLastDocumentUid"),K=babelHelpers.classPrivateFieldLooseKey("openVacancyChooser"),j=babelHelpers.classPrivateFieldLooseKey("updateUsersPreview"),M=babelHelpers.classPrivateFieldLooseKey("getUsersPreviewContainer");class N extends s.EventEmitter{constructor(e){super(),Object.defineProperty(this,M,{value:G}),Object.defineProperty(this,j,{value:V}),Object.defineProperty(this,K,{value:D}),Object.defineProperty(this,C,{value:X}),Object.defineProperty(this,I,{value:U}),Object.defineProperty(this,f,{writable:!0,value:void 0}),Object.defineProperty(this,_,{writable:!0,value:[]}),Object.defineProperty(this,k,{writable:!0,value:!1}),Object.defineProperty(this,w,{writable:!0,value:new Map}),Object.defineProperty(this,O,{writable:!0,value:null}),Object.defineProperty(this,S,{writable:!0,value:void 0}),Object.defineProperty(this,T,{writable:!0,value:null}),babelHelpers.classPrivateFieldLooseBase(this,f)[f]=e.api,this.setEventNamespace("BX.Sign.V2.B2e.HcmLinkEmployeeSelector")}async check(){return!babelHelpers.classPrivateFieldLooseBase(this,k)[k]||(babelHelpers.classPrivateFieldLooseBase(this,w)[w]=await babelHelpers.classPrivateFieldLooseBase(this,I)[I](),babelHelpers.classPrivateFieldLooseBase(this,w)[w].size>0&&babelHelpers.classPrivateFieldLooseBase(this,j)[j](),0===babelHelpers.classPrivateFieldLooseBase(this,w)[w].size)}setDocumentGroupUids(e){babelHelpers.classPrivateFieldLooseBase(this,_)[_]=e}setEnabled(e){babelHelpers.classPrivateFieldLooseBase(this,k)[k]=e}render(){if(babelHelpers.classPrivateFieldLooseBase(this,S)[S])return babelHelpers.classPrivateFieldLooseBase(this,S)[S];const{root:e,chooseButton:s}=l.Tag.render(H||(H=E`
			<div class="sign-b2e-hcm-link-party-checker-container">
				<div class="sign-b2e-hcm-link-party-checker-wrapper">
					<div class="sign-b2e-hcm-link-party-checker-wrapper-part --left">
						<div class="sign-b2e-hcm-link-party-checker-title">
							${0}
						</div>
						<div class="sign-b2e-hcm-link-party-checker-description">
							${0}
						</div>
					</div>
					<div class="sign-b2e-hcm-link-party-checker-wrapper-part --right">
						${0}
						<div class="sign-b2e-hcm-link-party-checker__action-button" ref="chooseButton">
							${0}
						</div>
					</div>
				</div>
			</div>
		`),l.Loc.getMessage("SIGN_V2_B2E_HCM_LINK_EMPLOYEE_SELECTOR_WIDGET_TITLE"),l.Loc.getMessage("SIGN_V2_B2E_HCM_LINK_EMPLOYEE_SELECTOR_WIDGET_DESCRIPTION"),babelHelpers.classPrivateFieldLooseBase(this,M)[M](),l.Loc.getMessage("SIGN_V2_B2E_HCM_LINK_EMPLOYEE_SELECTOR_WIDGET_OPEN_BUTTON"));return l.Event.bind(s,"click",()=>babelHelpers.classPrivateFieldLooseBase(this,K)[K]()),babelHelpers.classPrivateFieldLooseBase(this,S)[S]=e,this.hide(),babelHelpers.classPrivateFieldLooseBase(this,S)[S]}hide(){l.Dom.hide(babelHelpers.classPrivateFieldLooseBase(this,S)[S])}show(){l.Dom.show(babelHelpers.classPrivateFieldLooseBase(this,S)[S])}}async function U(){babelHelpers.classPrivateFieldLooseBase(this,w)[w].clear();const{employees:e,company:s}=await babelHelpers.classPrivateFieldLooseBase(this,f)[f].getMultipleVacancyMemberHrIntegration(babelHelpers.classPrivateFieldLooseBase(this,C)[C]());return babelHelpers.classPrivateFieldLooseBase(this,O)[O]=s.title,e.forEach(e=>babelHelpers.classPrivateFieldLooseBase(this,w)[w].set(e.userId,e)),new Map([...babelHelpers.classPrivateFieldLooseBase(this,w)[w].entries()])}function X(){return babelHelpers.classPrivateFieldLooseBase(this,_)[_].at(-1)}function D(){y.openSlider({api:babelHelpers.classPrivateFieldLooseBase(this,f)[f],documentGroupUids:babelHelpers.classPrivateFieldLooseBase(this,_)[_],employees:babelHelpers.classPrivateFieldLooseBase(this,w)[w],companyTitle:babelHelpers.classPrivateFieldLooseBase(this,O)[O]},{onCloseHandler:()=>this.emit("update")})}function V(){l.Dom.clean(babelHelpers.classPrivateFieldLooseBase(this,M)[M]());const e=babelHelpers.classPrivateFieldLooseBase(this,w)[w].size,s=Array.from(babelHelpers.classPrivateFieldLooseBase(this,w)[w].keys()).slice(0,6),a=l.Tag.render(B||(B=E`
			<div class="sign-b2e-hcm-link-party-checker-users-avatar-container"></div>
		`));s.forEach(e=>{const s=babelHelpers.classPrivateFieldLooseBase(this,w)[w].get(e),i=l.Tag.render(m||(m=E`
				<div class="sign-b2e-hcm-link-party-checker-user-preview" 
					title="${0}"
				>
					<img src="${0}">
				</div>
			`),l.Text.encode(s.fullName),s.avatarLink);l.Dom.append(i,a)}),l.Dom.append(a,babelHelpers.classPrivateFieldLooseBase(this,M)[M]());const i=e-6;if(i>0){const e=l.Tag.render(F||(F=E`
				<div class="sign-b2e-hcm-link-party-checker-users-preview-counter">
					${0}
				</div>
			`),l.Loc.getMessage("SIGN_V2_B2E_HCM_LINK_EMPLOYEE_USERS_COUNT_PLUS",{"#COUNT#":i}));l.Dom.append(e,babelHelpers.classPrivateFieldLooseBase(this,M)[M]())}}function G(){return babelHelpers.classPrivateFieldLooseBase(this,T)[T]||(babelHelpers.classPrivateFieldLooseBase(this,T)[T]=l.Tag.render(g||(g=E`
				<div class="sign-b2e-hcm-link-party-checker-users-preview-container"></div>
			`))),babelHelpers.classPrivateFieldLooseBase(this,T)[T]}e.HcmLinkEmployeeSelector=N,e.HcmLinkVacancyChooser=y}(this.BX.Sign.V2.B2e=this.BX.Sign.V2.B2e||{},BX.Event,BX.Sign.V2,BX,BX.Ui,BX.UI.SidePanel);
//# sourceMappingURL=hcm-link-employee-selector.bundle.js.map
