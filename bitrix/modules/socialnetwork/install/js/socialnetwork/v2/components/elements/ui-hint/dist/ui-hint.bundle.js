/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, main_core, ui_vue3_components_popup) {
	'use strict';

	// @vue/component
	const UiHint = {
		components: {
			Popup: ui_vue3_components_popup.Popup
		},
		props: {
			bindElement: {
				type: HTMLElement,
				required: true
			},
			options: {
				/** @type PopupOptions */
				type: Object,
				default: () => ({})
			}
		},
		emits: ['close'],
		data() {
			return {
				popupId: `socialnetwork-hint-${main_core.Text.getRandom(10)}`
			};
		},
		computed: {
			popupOptions() {
				return {
					id: this.popupId,
					bindElement: this.bindElement,
					maxWidth: 320,
					offsetLeft: 40,
					background: 'var(--ui-color-bg-content-inapp)',
					padding: 13,
					angle: true,
					targetContainer: document.body,
					className: 'socialnetwork-hint-popup',
					...this.options
				};
			}
		},
		template: `
		<Popup :options="popupOptions" @close="$emit('close')">
			<div class="socialnetwork-hint">
				<slot/>
			</div>
		</Popup>
	`
	};
	const tooltip = params => ({
		timeout: 500,
		...params,
		popupOptions: {
			className: 'socialnetwork-hint',
			darkMode: false,
			offsetTop: 2,
			background: 'var(--ui-color-bg-content-inapp)',
			padding: 6,
			angle: true,
			targetContainer: document.body,
			...params.popupOptions
		}
	});

	exports.UiHint = UiHint;
	exports.tooltip = tooltip;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX, BX.UI.Vue3.Components);
//# sourceMappingURL=ui-hint.bundle.js.map
