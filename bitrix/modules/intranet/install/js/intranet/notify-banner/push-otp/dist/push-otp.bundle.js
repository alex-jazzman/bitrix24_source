this.BX=this.BX||{},this.BX.Intranet=this.BX.Intranet||{},function(e,t,s,i,l){"use strict";let a,n=e=>e;var r=babelHelpers.classPrivateFieldLooseKey("needShowAdditionalBtn"),o=babelHelpers.classPrivateFieldLooseKey("clickEnableBtn"),c=babelHelpers.classPrivateFieldLooseKey("clickDisableBtn"),b=babelHelpers.classPrivateFieldLooseKey("title"),d=babelHelpers.classPrivateFieldLooseKey("text");e.PushOtp=class{constructor(e){Object.defineProperty(this,r,{writable:!0,value:void 0}),Object.defineProperty(this,o,{writable:!0,value:void 0}),Object.defineProperty(this,c,{writable:!0,value:void 0}),Object.defineProperty(this,b,{writable:!0,value:void 0}),Object.defineProperty(this,d,{writable:!0,value:void 0}),babelHelpers.classPrivateFieldLooseBase(this,o)[o]=t.Type.isFunction(e.clickEnableBtn)?e.clickEnableBtn:null,babelHelpers.classPrivateFieldLooseBase(this,c)[c]=t.Type.isFunction(e.clickDisableBtn)?e.clickDisableBtn:null,babelHelpers.classPrivateFieldLooseBase(this,r)[r]=t.Type.isFunction(e.clickDisableBtn),babelHelpers.classPrivateFieldLooseBase(this,b)[b]=t.Type.isStringFilled(e.title)?e.title:"",babelHelpers.classPrivateFieldLooseBase(this,d)[d]=t.Type.isStringFilled(e.text)?e.text:""}render(){var e;let s=null;babelHelpers.classPrivateFieldLooseBase(this,r)[r]&&(s=new l.Button({text:t.Loc.getMessage("NOTIFY_BANNER_PUSH_OTP_TIP"),noCaps:!0,size:l.Button.Size.MD,style:BX.UI.AirButtonStyle.PLAIN_NO_ACCENT,useAirDesign:!0,onclick:babelHelpers.classPrivateFieldLooseBase(this,c)[c],props:{"data-testid":"bx-notify-banner-push-otp-tip-btn"}}));const i=new l.Button({text:t.Loc.getMessage("NOTIFY_BANNER_PUSH_OTP_BTN"),noCaps:!0,size:l.Button.Size.MD,useAirDesign:!0,onclick:babelHelpers.classPrivateFieldLooseBase(this,o)[o],props:{"data-testid":"bx-notify-banner-push-otp-enable-btn"}});return t.Tag.render(a||(a=n`
			<div class="intranet-settings-info-banner">
				<div class="intranet-settings-info-banner__container">
					<div class="intranet-settings-info-banner__content">
						<h2 class="ui-headline --xs -accent">
							${0}
						</h2>
						<p class="ui-text --xs">
							${0}
						</p>
					</div>
					<div class="intranet-settings-info-banner__footer">
						${0}
						${0}
					</div>
				</div>
			</div>
		`),babelHelpers.classPrivateFieldLooseBase(this,b)[b],babelHelpers.classPrivateFieldLooseBase(this,d)[d],i.render(),null==(e=s)?void 0:e.render())}renderTo(e){t.Type.isDomNode(e)&&t.Dom.append(this.render(),e)}}}(this.BX.Intranet.NotifyBanner=this.BX.Intranet.NotifyBanner||{},BX,BX,BX.UI.System.Typography,BX.UI);
//# sourceMappingURL=push-otp.bundle.js.map
