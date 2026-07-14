/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, main_loader) {
	'use strict';

	// @vue/component
	const UiLoader = {
		name: 'UiLoader',
		props: {
			show: Boolean
		},
		setup() {
			return {
				loader: new main_loader.Loader()
			};
		},
		watch: {
			show: {
				handler(show) {
					if (show) {
						this.showLoader();
					} else {
						this.hideLoader();
					}
				}
			}
		},
		mounted() {
			this.showLoader();
		},
		unmounted() {
			this.loader?.destroy();
		},
		methods: {
			showLoader() {
				void this.loader?.show(this.$refs.point);
			},
			hideLoader() {
				void this.loader?.hide(this.$refs.point);
			}
		},
		template: `
		<div ref="point"></div>
	`
	};

	exports.UiLoader = UiLoader;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX);
//# sourceMappingURL=ui-loader.bundle.js.map
