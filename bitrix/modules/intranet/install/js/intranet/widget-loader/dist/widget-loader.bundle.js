this.BX=this.BX||{},function(e,t,i){"use strict";let s,a,n,l,o,r,d,c,p,v,_,g,h,b,u=e=>e;var k=babelHelpers.classPrivateFieldLooseKey("cache"),w=babelHelpers.classPrivateFieldLooseKey("setOptions"),m=babelHelpers.classPrivateFieldLooseKey("getOptions"),P=babelHelpers.classPrivateFieldLooseKey("createHeaderSkeleton"),f=babelHelpers.classPrivateFieldLooseKey("createItemSkeleton"),H=babelHelpers.classPrivateFieldLooseKey("createColumnSplitItemSkeleton"),F=babelHelpers.classPrivateFieldLooseKey("createSplitItemSkeleton"),L=babelHelpers.classPrivateFieldLooseKey("createFooterSkeleton"),y=babelHelpers.classPrivateFieldLooseKey("createAvatarWidgetHeaderSkeleton"),S=babelHelpers.classPrivateFieldLooseKey("createAvatarWidgetTimemanSkeleton"),B=babelHelpers.classPrivateFieldLooseKey("createAvatarWidgetToolsSkeleton"),C=babelHelpers.classPrivateFieldLooseKey("createApplicationSectionSkeleton");function D(e){return babelHelpers.classPrivateFieldLooseBase(this,k)[k].set("options",e),this}function T(){return babelHelpers.classPrivateFieldLooseBase(this,k)[k].get("options",{})}function x(){return t.Tag.render(s||(s=u`
			<div class="intranet-widget-skeleton__header">
				<div class="intranet-widget-skeleton__line"></div>
			</div>
		`))}function A(e){return t.Tag.render(a||(a=u`
			<div class="intranet-widget-skeleton__row">
				<div style="height: ${0}px" class="intranet-widget-skeleton__item">
					<div style="width: 24px;height: 24px;border-radius: 6px;margin-right: 12px;" class="intranet-widget-skeleton__cube"></div>
					<div style="max-width: 130px;height: 10px;" class="intranet-widget-skeleton__line"></div>
					<div style="width: 12px; height: 12px; margin-left: auto;" class="intranet-widget-skeleton__circle"></div>
				</div>
			</div>
		`),e)}function O(e,i){const s=t.Tag.render(n||(n=u`
			<div class="intranet-widget-skeleton__row">
				<div style="height: ${0}px" class="intranet-widget-skeleton__item --column"></div>
			</div>
		`),e);for(let e=0;e<i;e++){const e=t.Tag.render(l||(l=u`
				<div class="intranet-widget-skeleton__nested-item">
					<div class="intranet-widget-skeleton__cube intranet-widget-skeleton-column-split-item__cube"></div>
					<div class="intranet-widget-skeleton__line intranet-widget-skeleton-column-split-item__line"></div>
					<div class="intranet-widget-skeleton__circle intranet-widget-skeleton-column-split-item__circle"></div>
				</div>
			`));t.Dom.append(e,s.querySelector(".intranet-widget-skeleton__item"))}return s}function j(e){return t.Tag.render(o||(o=u`
			<div class="intranet-widget-skeleton__row">
				<div style="height: ${0}px" class="intranet-widget-skeleton__item">
					<div class="intranet-widget-skeleton__nested-item">
						<div class="intranet-widget-skeleton__circle intranet-widget-skeleton-split-item__icon"></div>
						<div class="intranet-widget-skeleton__line intranet-widget-skeleton-split-item__line"></div>
					</div>
				</div>
			</div>
		`),e)}function I(e=6){return t.Tag.render(r||(r=u`
			<div class="intranet-widget-skeleton__footer">
				<div style="height: ${0}px" class="intranet-widget-skeleton__line"></div>
				<div style="height: ${0}px" class="intranet-widget-skeleton__line"></div>
			</div>
		`),e,e)}function K(e){const i=t.Tag.render(d||(d=u`
			<div class="intranet-widget-skeleton-avatar__header">
				<div class="intranet-widget-skeleton-avatar__header-info">
					<div class="intranet-widget-skeleton__circle --avatar intranet-widget-skeleton-avatar__avatar"></div>
					<div class="intranet-widget-skeleton-avatar__user-info">
						<div class="intranet-widget-skeleton-avatar__name-wrapper">
							<div class="intranet-widget-skeleton__line intranet-widget-skeleton-avatar__name"></div>
							<div class="intranet-widget-skeleton__circle intranet-widget-skeleton-avatar__status-circle"></div>
						</div>
						<div class="intranet-widget-skeleton__line intranet-widget-skeleton-avatar__department"></div>
					</div>
				</div>
			</div>
		`));return e.isAdmin&&t.Dom.append(t.Tag.render(c||(c=u`<div class="intranet-widget-skeleton__line intranet-widget-skeleton-avatar__action-button"></div>`)),i),e.hasTimeman&&t.Dom.append(babelHelpers.classPrivateFieldLooseBase(this,S)[S](),i),e.toolsCount>0&&t.Dom.append(babelHelpers.classPrivateFieldLooseBase(this,B)[B](e.toolsCount),i),i}function E(){return t.Tag.render(p||(p=u`
			<div class="intranet-widget-skeleton__line intranet-widget-skeleton-avatar__timeman">
				<div class="intranet-widget-skeleton-avatar__timeman-top">
					<div class="intranet-widget-skeleton-avatar__timeman-line1"></div>
					<div class="intranet-widget-skeleton-avatar__timeman-line2"></div>
					<div class="intranet-widget-skeleton__circle intranet-widget-skeleton-avatar__timeman-circle"></div>
					<div class="intranet-widget-skeleton-avatar__timeman-line3"></div>
				</div>
				<div class="intranet-widget-skeleton-avatar__timeman-bottom"></div>
			</div>
		`))}function W(e=4){const i=t.Tag.render(v||(v=u`
			<div class="intranet-widget-skeleton-avatar__tools">
				<div class="intranet-widget-skeleton__cubes"></div>
			</div>
		`)),s=t.Tag.render(_||(_=u`<div class="intranet-widget-skeleton-avatar__tools-labels"></div>`));for(let a=0;a<e;a++){const e=t.Tag.render(g||(g=u`<div class="intranet-widget-skeleton__cube"></div>`));t.Dom.append(e,i.querySelector(".intranet-widget-skeleton__cubes"));const a=t.Tag.render(h||(h=u`<div class="intranet-widget-skeleton__line intranet-widget-skeleton-avatar__tools-label"></div>`));t.Dom.append(a,s)}return t.Dom.append(s,i),i}function q(){return t.Tag.render(b||(b=u`
			<div class="intranet-widget-skeleton__row">
				<div class="intranet-widget-skeleton__item --column">
					<div class="intranet-widget-skeleton__nested-item intranet-widget-skeleton-application-section__wrapper">
						<i class="intranet-widget-skeleton-application-section__qr ui-icon-set --o-qr-code"></i>
						<div class="intranet-widget-skeleton-application-section__text">
							<div class="intranet-widget-skeleton__line intranet-widget-skeleton-application-section__title"></div>
							<div class="intranet-widget-skeleton__line intranet-widget-skeleton-application-section__button"></div>
						</div>
					</div>
					<div class="intranet-widget-skeleton__nested-item">
						<div class="intranet-widget-skeleton__line intranet-widget-skeleton-application-section__description">
							<div class="intranet-widget-skeleton-application-section__desc-line"></div>
							<div class="intranet-widget-skeleton-application-section__desc-line"></div>
						</div>
					</div>
					<div class="intranet-widget-skeleton__nested-item">
						<div class="intranet-widget-skeleton__cube intranet-widget-skeleton-application-section__nested-cube"></div>
						<div class="intranet-widget-skeleton__line intranet-widget-skeleton-application-section__nested-line"></div>
						<div class="intranet-widget-skeleton__circle intranet-widget-skeleton-application-section__nested-circle"></div>
					</div>
				</div>
			</div>
		`))}e.WidgetLoader=class{constructor(e={}){Object.defineProperty(this,C,{value:q}),Object.defineProperty(this,B,{value:W}),Object.defineProperty(this,S,{value:E}),Object.defineProperty(this,y,{value:K}),Object.defineProperty(this,L,{value:I}),Object.defineProperty(this,F,{value:j}),Object.defineProperty(this,H,{value:O}),Object.defineProperty(this,f,{value:A}),Object.defineProperty(this,P,{value:x}),Object.defineProperty(this,m,{value:T}),Object.defineProperty(this,w,{value:D}),Object.defineProperty(this,k,{writable:!0,value:new t.Cache.MemoryCache}),babelHelpers.classPrivateFieldLooseBase(this,w)[w](e),t.Event.bind(babelHelpers.classPrivateFieldLooseBase(this,m)[m]().bindElement,"click",()=>{this.show()})}show(){this.getPopup().show()}clearBeforeInsertContent(){const e=this.getPopup().getPopupContainer();t.Dom.removeClass(e,"intranet-widget-skeleton__wrap");const i=[".intranet-widget-skeleton__row",".intranet-widget-skeleton__header",".intranet-widget-skeleton-avatar__header",".intranet-widget-skeleton__footer"].join(", ");e.querySelectorAll(i).forEach(e=>t.Dom.remove(e)),t.Dom.prepend(babelHelpers.classPrivateFieldLooseBase(this,k)[k].get("popup-content"),e)}getPopup(){return babelHelpers.classPrivateFieldLooseBase(this,k)[k].remember("popup",()=>{var e,s,a,n,l,o;const r=-babelHelpers.classPrivateFieldLooseBase(this,m)[m]().width/2+(babelHelpers.classPrivateFieldLooseBase(this,m)[m]().bindElement?babelHelpers.classPrivateFieldLooseBase(this,m)[m]().bindElement.offsetWidth/2:0)+40,d=new i.Popup({autoHide:!0,id:null!=(e=babelHelpers.classPrivateFieldLooseBase(this,m)[m]().id)?e:null,bindElement:babelHelpers.classPrivateFieldLooseBase(this,m)[m]().bindElement,width:babelHelpers.classPrivateFieldLooseBase(this,m)[m]().width,useAngle:null==(s=babelHelpers.classPrivateFieldLooseBase(this,m)[m]().useAngle)||s,angle:null!=(a=babelHelpers.classPrivateFieldLooseBase(this,m)[m]().useAngle)?a:{offset:babelHelpers.classPrivateFieldLooseBase(this,m)[m]().width/2-16},className:null!=(n=babelHelpers.classPrivateFieldLooseBase(this,m)[m]().className)?n:null,animation:"fading-slide",closeByEsc:!0,offsetLeft:null!=(l=babelHelpers.classPrivateFieldLooseBase(this,m)[m]().offsetLeft)?l:r,offsetTop:null!=(o=babelHelpers.classPrivateFieldLooseBase(this,m)[m]().offsetTop)?o:3}),c=d.getPopupContainer();return babelHelpers.classPrivateFieldLooseBase(this,k)[k].set("popup-content",c.querySelector(".popup-window-content")),t.Dom.remove(c.querySelector(".popup-window-content")),t.Dom.addClass(c,"intranet-widget-skeleton__wrap"),d})}createSkeletonFromConfig(e={}){var t;(e.header&&this.addHeaderSkeleton(),e.avatarWidgetHeader&&this.addAvatarWidgetHeaderSkeleton(e.avatarWidgetHeader),Array.isArray(e.items)&&e.items.forEach(e=>{switch(e.type){case"item":this.addItemSkeleton(e.height);break;case"split":this.addSplitItemSkeleton(e.height);break;case"splitColumn":this.addColumnSplitItemSkeleton(e.height,e.count);break;case"applicationSection":this.addApplicationSectionSkeleton()}}),e.footer)&&this.addFooterSkeleton(null!=(t=e.footer.height)?t:6);return this}addItemSkeleton(e){return t.Dom.append(babelHelpers.classPrivateFieldLooseBase(this,f)[f](e),this.getPopup().getPopupContainer()),this}addSplitItemSkeleton(e){return t.Dom.append(babelHelpers.classPrivateFieldLooseBase(this,F)[F](e),this.getPopup().getPopupContainer()),this}addHeaderSkeleton(){return t.Dom.prepend(babelHelpers.classPrivateFieldLooseBase(this,P)[P](),this.getPopup().getPopupContainer()),this}addAvatarWidgetHeaderSkeleton(e){return t.Dom.prepend(babelHelpers.classPrivateFieldLooseBase(this,y)[y](e),this.getPopup().getPopupContainer()),this}addColumnSplitItemSkeleton(e,i){return t.Dom.append(babelHelpers.classPrivateFieldLooseBase(this,H)[H](e,i),this.getPopup().getPopupContainer()),this}addApplicationSectionSkeleton(){return t.Dom.append(babelHelpers.classPrivateFieldLooseBase(this,C)[C](),this.getPopup().getPopupContainer()),this}addFooterSkeleton(e){return t.Dom.append(babelHelpers.classPrivateFieldLooseBase(this,L)[L](e),this.getPopup().getPopupContainer()),this}}}(this.BX.Intranet=this.BX.Intranet||{},BX,BX.Main);
//# sourceMappingURL=widget-loader.bundle.js.map
