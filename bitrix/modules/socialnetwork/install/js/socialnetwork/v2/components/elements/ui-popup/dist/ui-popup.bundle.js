/* eslint-disable */
this.BX = this.BX || {};
this.BX.Socialnetwork = this.BX.Socialnetwork || {};
this.BX.Socialnetwork.V2 = this.BX.Socialnetwork.V2 || {};
this.BX.Socialnetwork.V2.Components = this.BX.Socialnetwork.V2.Components || {};
(function (exports, main_popup) {
	'use strict';

	// @vue/components
	const UiPopup = {
		name: 'UiSocialnetworkPopup',
		props: {
			id: {
				type: String,
				required: true
			},
			options: {
				/** @type {UiPopupOptions} */
				type: Object,
				default: () => ({})
			}
		},
		emits: ['close'],
		expose: ['getPopupInstance'],
		setup() {
			return {
				popup: null
			};
		},
		computed: {
			popupContainer() {
				return `#popup-window-content-${this.id}`;
			},
			container() {
				return this.getPopupInstance().getPopupContainer();
			},
			popupDefaultOptions() {
				return {
					id: this.id,
					cacheable: false,
					autoHide: true,
					autoHideHandler: ({
						target
					}) => {
						const parentAutoHide = target !== this.container && !this.container.contains(target);
						const isAhaMoment = target.closest('.popup-window-ui-tour');
						return parentAutoHide && !isAhaMoment;
					},
					bindOptions: {
						position: 'bottom'
					},
					closeByEsc: true,
					animation: 'fading',
					events: {
						onPopupClose: this.closePopup,
						onPopupDestroy: this.closePopup
					}
				};
			}
		},
		created() {
			this.popup = this.getPopupInstance();
			this.popup?.show();
		},
		mounted() {
			this.popup?.adjustPosition({
				forceBindPosition: true,
				position: this.getPopupOptions()?.bindOptions?.position || 'bottom'
			});
		},
		beforeUnmount() {
			this.closePopup();
		},
		methods: {
			getPopupInstance() {
				if (!this.popup) {
					main_popup.PopupManager.getPopupById(this.id)?.destroy();
					this.popup = new main_popup.Popup(this.getPopupOptions());
				}
				return this.popup;
			},
			getPopupOptions() {
				return {
					...this.popupDefaultOptions,
					...this.options
				};
			},
			closePopup() {
				this.$emit('close');
				this.popup?.destroy();
				this.popup = null;
			}
		},
		template: `
		<Teleport :to="popupContainer">
			<slot/>
		</Teleport>
	`
	};

	exports.UiPopup = UiPopup;

})(this.BX.Socialnetwork.V2.Components.Elements = this.BX.Socialnetwork.V2.Components.Elements || {}, BX.Main);
//# sourceMappingURL=ui-popup.bundle.js.map
