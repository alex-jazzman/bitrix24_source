/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
this.BX.Messenger.v2.Component = this.BX.Messenger.v2.Component || {};
(function (exports, main_core, main_popup, ui_system_dialog, ui_vue3) {
	'use strict';

	const CONTENT_ID_PREFIX = 'im-air-popup-content-';
	const TITLE_ID_PREFIX = 'im-air-popup-title-';
	const CONTENT_WRAPPER_SELECTOR = '.ui-system-dialog__content-wrapper';
	const HEADER_LEFT_SELECTOR = '.ui-system-dialog__header-left';
	const CLOSE_BUTTON_SELECTOR = '.ui-system-dialog__header-close-btn';
	const POPUP_CONTAINER_SELECTOR = '.popup-window';
	const MESSENGER_SCOPE_CLASS = 'bx-im-messenger__scope';
	const MessengerAirPopup = ui_vue3.defineComponent({
		name: 'MessengerAirPopup',
		props: {
			id: {
				type: String,
				required: true
			},
			testId: {
				type: String,
				default: ''
			},
			title: {
				type: String,
				default: ''
			},
			width: {
				type: Number,
				default: 0
			},
			className: {
				type: String,
				default: ''
			},
			hasOverlay: {
				type: Boolean,
				default: false
			},
			hasHorizontalPadding: {
				type: Boolean,
				default: true
			},
			hasVerticalPadding: {
				type: Boolean,
				default: true
			},
			closeByEsc: {
				type: Boolean,
				default: true
			},
			closeByClickOutside: {
				type: Boolean,
				default: true
			}
		},
		emits: ['close'],
		data() {
			return {
				dialog: null,
				contentContainer: null,
				sizeObserver: null
			};
		},
		computed: {
			contentSelector() {
				return `#${CONTENT_ID_PREFIX}${this.id}`;
			},
			testAnchor() {
				return this.testId || this.id;
			}
		},
		watch: {
			title() {
				this.updateTitle();
			}
		},
		created() {
			const contentContainer = this.createContentContainer();
			this.contentContainer = ui_vue3.markRaw(contentContainer);
			this.dialog = ui_vue3.markRaw(new ui_system_dialog.Dialog(this.getDialogOptions(contentContainer)));
			this.dialog.show();
			this.pinPopupToViewport();
			this.setAccessibleNames();
			this.markTestAnchors();
		},
		mounted() {
			this.adjustPopupPosition();
			this.observePopupSize();
		},
		beforeUnmount() {
			this.sizeObserver?.disconnect();
			this.sizeObserver = null;
			const dialog = this.dialog;
			this.dialog = null;
			dialog?.hide();
		},
		methods: {
			createContentContainer() {
				const classes = [MESSENGER_SCOPE_CLASS, this.className].filter(Boolean).join(' ');
				const contentId = `${CONTENT_ID_PREFIX}${this.id}`;
				const contentTestId = `${this.testAnchor}-content`;
				return main_core.Tag.render`<div id="${contentId}" class="${classes}" data-testid="${contentTestId}"></div>`;
			},
			getDialogOptions(content) {
				return {
					title: this.title,
					content,
					width: this.width || undefined,
					hasOverlay: this.hasOverlay,
					hasHorizontalPadding: this.hasHorizontalPadding,
					hasVerticalPadding: this.hasVerticalPadding,
					closeByEsc: this.closeByEsc,
					closeByClickOutside: this.closeByClickOutside,
					events: {
						onHide: this.onDialogHide
					}
				};
			},
			pinPopupToViewport() {
				this.getPopup()?.setFixed(true);
			},
			observePopupSize() {
				const popupContainer = this.getPopup()?.getPopupContainer();
				if (!popupContainer) {
					return;
				}
				this.sizeObserver = ui_vue3.markRaw(new ResizeObserver(this.adjustPopupPosition));
				this.sizeObserver.observe(popupContainer);
			},
			adjustPopupPosition() {
				const popup = this.getPopup();
				if (popup?.isShown()) {
					popup.adjustPosition();
				}
			},
			getPopup() {
				const popupContainer = this.contentContainer?.closest(POPUP_CONTAINER_SELECTOR);
				return popupContainer ? main_popup.PopupManager.getPopupById(popupContainer.id) : null;
			},
			onDialogHide() {
				if (!this.dialog) {
					return;
				}
				this.dialog = null;
				this.$emit('close');
			},
			updateTitle() {
				const titleNode = this.getTitleNode();
				if (!titleNode) {
					this.dialog?.setTitle(this.title);
					this.setAccessibleNames();
					this.markTestAnchors();
					return;
				}
				titleNode.textContent = this.title;
			},
			getTitleNode() {
				const headerLeft = this.contentContainer?.closest(CONTENT_WRAPPER_SELECTOR)?.querySelector(HEADER_LEFT_SELECTOR);
				return headerLeft?.firstElementChild ?? null;
			},
			setAccessibleNames() {
				this.nameCloseButton();
				this.nameDialog();
			},
			nameCloseButton() {
				const closeButton = this.getCloseButtonNode();
				if (!closeButton) {
					return;
				}
				closeButton.type = 'button';
				const label = main_core.Loc.getMessage('IM_ELEMENTS_AIR_POPUP_CLOSE_ARIA');
				if (label) {
					closeButton.setAttribute('aria-label', label);
				}
			},
			nameDialog() {
				const titleNode = this.getTitleNode();
				const popupContainer = this.getPopup()?.getPopupContainer();
				if (!titleNode || !popupContainer) {
					return;
				}
				titleNode.id = `${TITLE_ID_PREFIX}${this.id}`;
				popupContainer.setAttribute('aria-labelledby', titleNode.id);
			},
			markTestAnchors() {
				this.getTitleNode()?.setAttribute('data-testid', `${this.testAnchor}-title`);
				this.getCloseButtonNode()?.setAttribute('data-testid', `${this.testAnchor}-close-btn`);
			},
			getCloseButtonNode() {
				const contentWrapper = this.contentContainer?.closest(CONTENT_WRAPPER_SELECTOR);
				return contentWrapper?.querySelector(CLOSE_BUTTON_SELECTOR) ?? null;
			}
		},
		template: `
		<Teleport :to="contentSelector">
			<slot></slot>
		</Teleport>
	`
	});

	exports.MessengerAirPopup = MessengerAirPopup;

})(this.BX.Messenger.v2.Component.Elements = this.BX.Messenger.v2.Component.Elements || {}, BX, BX.Main, BX.UI.System, BX.Vue3);
//# sourceMappingURL=air-popup.bundle.js.map
