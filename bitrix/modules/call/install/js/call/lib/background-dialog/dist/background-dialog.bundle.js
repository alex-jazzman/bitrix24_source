/* eslint-disable */
this.BX = this.BX || {};
this.BX.Call = this.BX.Call || {};
(function (exports, main_core, call_adapter_utils, call_adapter_desktopApi) {
	'use strict';

	class BackgroundDialog {
		static isAvailable() {
			return call_adapter_utils.Utils.platform.getDesktopVersion() >= 52;
		}
		static isMaskAvailable() {
			return call_adapter_utils.Utils.platform.isDesktopFeatureEnabled('mask');
		}
		static open(params) {
			const options = main_core.Type.isPlainObject(params) ? params : {};
			const tab = main_core.Type.isStringFilled(options.tab) ? options.tab : 'background'; // mask, background

			if (!this.isAvailable()) {
				if (window.BX.Helper) {
					window.BX.Helper.show('redirect=detail&code=12398124');
				}
				return false;
			}
			const html = `
			<div id="bx-desktop-loader" class="bx-desktop-loader-wrap">
							<div class="bx-desktop-loader">
								<svg class="bx-desktop-loader-circular" viewBox="25 25 50 50">
									<circle class="bx-desktop-loader-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/>
								</svg>
							</div>
						</div>
						<div id="placeholder"></div>
		`;
			const js = `
			BX.Runtime.loadExtension("call.legacy.component.v2.call-background").then(function(exports) {
										BX.Vue3.BitrixVue.createApp({
											components: {CallBackground: exports.CallBackground},
											template: '<CallBackground tab="${tab}"/>',
										}).mount("#placeholder");
									});
		`;
			call_adapter_desktopApi.DesktopApi.createWindow('callBackground', controller => {
				const title = this.isMaskAvailable() ? main_core.Loc.getMessage('BXD_CALL_BG_MASK_TITLE') : main_core.Loc.getMessage('BXD_CALL_BG_TITLE');
				controller.SetProperty('title', title);
				controller.SetProperty('clientSize', {
					Width: 943,
					Height: 670
				});
				controller.SetProperty('minClientSize', {
					Width: 943,
					Height: 670
				});
				controller.SetProperty('backgroundColor', '#2B3038');
				controller.ExecuteCommand('center');
				controller.ExecuteCommand('html.load', call_adapter_desktopApi.DesktopApi.prepareHtml(html, js));
			});
			return true;
		}
	}

	exports.BackgroundDialog = BackgroundDialog;

})(this.BX.Call.Lib = this.BX.Call.Lib || {}, BX, BX.Call.Adapter, BX.Call.Adapter);
//# sourceMappingURL=background-dialog.bundle.js.map
