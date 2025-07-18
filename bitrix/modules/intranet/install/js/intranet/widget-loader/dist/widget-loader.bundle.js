this.BX=this.BX||{},function(e,t,s){"use strict";let i,l,a,o,r=e=>e;var n=babelHelpers.classPrivateFieldLooseKey("cache"),d=babelHelpers.classPrivateFieldLooseKey("setOptions"),p=babelHelpers.classPrivateFieldLooseKey("getOptions"),c=babelHelpers.classPrivateFieldLooseKey("createHeaderSkeleton"),h=babelHelpers.classPrivateFieldLooseKey("createItemSkeleton"),v=babelHelpers.classPrivateFieldLooseKey("createSplitItemSkeleton"),b=babelHelpers.classPrivateFieldLooseKey("createFooterSkeleton");function u(e){return babelHelpers.classPrivateFieldLooseBase(this,n)[n].set("options",e),this}function g(){return babelHelpers.classPrivateFieldLooseBase(this,n)[n].get("options",{})}function w(){return t.Tag.render(i||(i=r`
			<div class="intranet-widget-skeleton__header">
				<div style="max-width: 95px; height: 8px;" class="intranet-widget-skeleton__line"></div>
			</div>
		`))}function P(e){return t.Tag.render(l||(l=r`
			<div class="intranet-widget-skeleton__row">
				<div style="height: ${0}px" class="intranet-widget-skeleton__item">
					<div class="intranet-widget-skeleton__circle"></div>
					<div style="max-width: 130px;" class="intranet-widget-skeleton__line"></div>
					<div style="width: 12px; height: 12px; margin-left: auto;" class="intranet-widget-skeleton__circle"></div>
				</div>
			</div>
		`),e)}function m(e){return t.Tag.render(a||(a=r`
			<div class="intranet-widget-skeleton__row">
				<div style="height: ${0}px" class="intranet-widget-skeleton__item">
					<div class="intranet-widget-skeleton__circle"></div>
					<div style="max-width: 75px;" class="intranet-widget-skeleton__line"></div>
					<div style="width: 12px; height: 12px; margin-left: auto;" class="intranet-widget-skeleton__circle"></div>
				</div>
				<div style="height: ${0}px" class="intranet-widget-skeleton__item">
					<div class="intranet-widget-skeleton__circle"></div>
					<div style="max-width: 75px;" class="intranet-widget-skeleton__line"></div>
					<div style="width: 12px; height: 12px; margin-left: auto;" class="intranet-widget-skeleton__circle"></div>
				</div>
			</div>
		`),e,e)}function _(){return t.Tag.render(o||(o=r`
			<div class="intranet-widget-skeleton__footer">
				<div style="max-width: 40px;" class="intranet-widget-skeleton__line"></div>
				<div style="max-width: 40px;" class="intranet-widget-skeleton__line"></div>
				<div style="max-width: 40px;" class="intranet-widget-skeleton__line"></div>
			</div>
		`))}e.WidgetLoader=class{constructor(e={}){Object.defineProperty(this,b,{value:_}),Object.defineProperty(this,v,{value:m}),Object.defineProperty(this,h,{value:P}),Object.defineProperty(this,c,{value:w}),Object.defineProperty(this,p,{value:g}),Object.defineProperty(this,d,{value:u}),Object.defineProperty(this,n,{writable:!0,value:new t.Cache.MemoryCache}),babelHelpers.classPrivateFieldLooseBase(this,d)[d](e),t.Event.bind(babelHelpers.classPrivateFieldLooseBase(this,p)[p]().bindElement,"click",()=>{this.show()})}show(){this.getPopup().show()}clearBeforeInsertContent(){const e=this.getPopup().getPopupContainer();t.Dom.removeClass(e,"intranet-widget-skeleton__wrap"),e.querySelectorAll(".intranet-widget-skeleton__row").forEach(e=>t.Dom.remove(e)),e.querySelectorAll(".intranet-widget-skeleton__header").forEach(e=>t.Dom.remove(e)),e.querySelectorAll(".intranet-widget-skeleton__footer").forEach(e=>t.Dom.remove(e)),t.Dom.prepend(babelHelpers.classPrivateFieldLooseBase(this,n)[n].get("popup-content"),e)}getPopup(){return babelHelpers.classPrivateFieldLooseBase(this,n)[n].remember("popup",()=>{var e,i,l,a,o,r;const d=-babelHelpers.classPrivateFieldLooseBase(this,p)[p]().width/2+(babelHelpers.classPrivateFieldLooseBase(this,p)[p]().bindElement?babelHelpers.classPrivateFieldLooseBase(this,p)[p]().bindElement.offsetWidth/2:0)+40,c=new s.Popup({autoHide:!0,id:null!=(e=babelHelpers.classPrivateFieldLooseBase(this,p)[p]().id)?e:null,bindElement:babelHelpers.classPrivateFieldLooseBase(this,p)[p]().bindElement,width:babelHelpers.classPrivateFieldLooseBase(this,p)[p]().width,useAngle:null==(i=babelHelpers.classPrivateFieldLooseBase(this,p)[p]().useAngle)||i,angle:null!=(l=babelHelpers.classPrivateFieldLooseBase(this,p)[p]().useAngle)?l:{offset:babelHelpers.classPrivateFieldLooseBase(this,p)[p]().width/2-16},className:null!=(a=babelHelpers.classPrivateFieldLooseBase(this,p)[p]().className)?a:null,animation:"fading-slide",closeByEsc:!0});c.setOffset({offsetLeft:null!=(o=babelHelpers.classPrivateFieldLooseBase(this,p)[p]().offsetLeft)?o:d,offsetTop:null!=(r=babelHelpers.classPrivateFieldLooseBase(this,p)[p]().offsetTop)?r:3});const h=c.getPopupContainer();return babelHelpers.classPrivateFieldLooseBase(this,n)[n].set("popup-content",h.querySelector(".popup-window-content")),t.Dom.remove(h.querySelector(".popup-window-content")),t.Dom.addClass(h,"intranet-widget-skeleton__wrap"),c})}createSkeletonFromConfig(e={}){return e.header&&this.addHeaderSkeleton(),Array.isArray(e.items)&&e.items.forEach(e=>{"item"===e.type?this.addItemSkeleton(e.height):"split"===e.type&&this.addSplitItemSkeleton(e.height)}),e.footer&&this.addFooterSkeleton(),this}addItemSkeleton(e){return t.Dom.append(babelHelpers.classPrivateFieldLooseBase(this,h)[h](e),this.getPopup().getPopupContainer()),this}addSplitItemSkeleton(e){return t.Dom.append(babelHelpers.classPrivateFieldLooseBase(this,v)[v](e),this.getPopup().getPopupContainer()),this}addHeaderSkeleton(){return t.Dom.prepend(babelHelpers.classPrivateFieldLooseBase(this,c)[c](),this.getPopup().getPopupContainer()),this}addFooterSkeleton(){return t.Dom.append(babelHelpers.classPrivateFieldLooseBase(this,b)[b](),this.getPopup().getPopupContainer()),this}}}(this.BX.Intranet=this.BX.Intranet||{},BX,BX.Main);
//# sourceMappingURL=widget-loader.bundle.js.map
