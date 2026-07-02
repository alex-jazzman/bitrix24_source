/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, main_popup, im_v2_lib_logger) {
	'use strict';

	const POPUP_CONTAINER_PREFIX = '#popup-window-content-';
	const POPUP_BORDER_RADIUS = '10px';

	// @vue/component
	const MessengerPopup = {
		name: 'MessengerPopup',
		provide() {
			return {
				disableAutoHide: this.disableAutoHide,
				enableAutoHide: this.enableAutoHide
			};
		},
		props: {
			id: {
				type: String,
				required: true
			},
			config: {
				type: Object,
				required: false,
				default() {
					return {};
				}
			}
		},
		emits: ['close', 'popupDragStart'],
		computed: {
			popupContainer() {
				return `${POPUP_CONTAINER_PREFIX}${this.id}`;
			}
		},
		created() {
			im_v2_lib_logger.Logger.warn(`Popup: ${this.id} created`);
			this.instance = this.getPopupInstance();
			this.instance.show();
		},
		mounted() {
			this.instance.adjustPosition({
				forceBindPosition: true,
				position: this.getPopupConfig().bindOptions.position
			});
		},
		beforeUnmount() {
			if (!this.instance) {
				return;
			}
			this.closePopup();
		},
		methods: {
			getPopupInstance() {
				if (!this.instance) {
					main_popup.PopupManager.getPopupById(this.id)?.destroy();
					this.instance = new main_popup.Popup(this.getPopupConfig());
				}
				return this.instance;
			},
			getDefaultConfig() {
				return {
					id: this.id,
					bindOptions: {
						position: 'bottom'
					},
					offsetTop: 0,
					offsetLeft: 0,
					className: 'bx-im-messenger__scope',
					cacheable: false,
					closeIcon: false,
					autoHide: true,
					closeByEsc: true,
					animation: 'fading',
					events: {
						onPopupClose: this.closePopup.bind(this),
						onPopupDestroy: this.closePopup.bind(this),
						onDragStart: this.dragStart.bind(this)
					},
					borderRadius: POPUP_BORDER_RADIUS,
					contentBorderRadius: POPUP_BORDER_RADIUS
				};
			},
			getPopupConfig() {
				const defaultConfig = this.getDefaultConfig();
				const modifiedOptions = {};
				const defaultClassName = defaultConfig.className;
				if (this.config.className) {
					modifiedOptions.className = `${defaultClassName} ${this.config.className}`;
				}
				const offsetTop = this.config.offsetTop ?? defaultConfig.offsetTop;
				// adjust for default popup margin for shadow
				if (this.config.bindOptions?.position === 'top' && main_core.Type.isNumber(this.config.offsetTop)) {
					modifiedOptions.offsetTop = offsetTop - 10;
				}
				return {
					...defaultConfig,
					...this.config,
					...modifiedOptions
				};
			},
			closePopup() {
				im_v2_lib_logger.Logger.warn(`Popup: ${this.id} closing`);
				this.$emit('close');
				this.instance.destroy();
				this.instance = null;
			},
			dragStart() {
				this.$emit('popupDragStart');
			},
			enableAutoHide() {
				this.getPopupInstance().setAutoHide(true);
			},
			disableAutoHide() {
				this.getPopupInstance().setAutoHide(false);
			},
			adjustPosition() {
				this.getPopupInstance().adjustPosition({
					forceBindPosition: true,
					position: this.getPopupConfig().bindOptions.position
				});
			}
		},
		template: `
		<Teleport :to="popupContainer">
			<slot
				:adjustPosition="adjustPosition"
				:enableAutoHide="enableAutoHide"
				:disableAutoHide="disableAutoHide"
			></slot>
		</Teleport>
	`
	};

	exports.MessengerPopup = MessengerPopup;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX, BX.Main, BX.Messenger.v2.Lib);
//# sourceMappingURL=popup.bundle.js.map
