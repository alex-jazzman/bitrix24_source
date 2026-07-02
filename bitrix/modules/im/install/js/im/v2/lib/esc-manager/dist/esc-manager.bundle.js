/* eslint-disable */
this.BX = this.BX || {};
this.BX.Messenger = this.BX.Messenger || {};
this.BX.Messenger.v2 = this.BX.Messenger.v2 || {};
(function (exports, main_core, main_core_events, main_popup, main_sidepanel, im_v2_lib_utils, im_v2_lib_call, im_v2_application_core, im_v2_const, im_v2_lib_layout, im_v2_lib_slider, im_v2_lib_desktop, im_v2_lib_desktopApi) {
	'use strict';

	const EscEventAction = Object.freeze({
		handled: 'handled',
		ignored: 'ignored'
	});
	class EscManager {
		#messengerContainer;
		#emitter;
		#wasKeyDownHandled = false;
		static #instance;
		constructor() {
			this.keyUpEventHandler = this.#onKeyUp.bind(this);
			this.keyDownEventHandler = this.#onKeyDown.bind(this);
		}
		static getInstance() {
			EscManager.#instance = EscManager.#instance ?? new EscManager();
			return EscManager.#instance;
		}
		register(payload) {
			const {
				messengerContainer,
				context: {
					emitter
				}
			} = payload;
			this.#emitter = emitter;
			this.#messengerContainer = messengerContainer;
			main_core.Event.bind(document, 'keyup', this.keyUpEventHandler);
			main_core.Event.bind(document, 'keydown', this.keyDownEventHandler);
		}
		unregister() {
			main_core.Event.unbind(document, 'keyup', this.keyUpEventHandler);
			main_core.Event.unbind(document, 'keydown', this.keyDownEventHandler);
		}
		async handleEsc() {
			if (this.#wasKeyDownHandled) {
				this.#wasKeyDownHandled = false;
				return;
			}
			if (this.#shouldIgnoreEscape()) {
				return;
			}
			if (await this.#isHandledBySubscriber()) {
				return;
			}
			if (this.#handleActiveInput()) {
				return;
			}
			if (this.#handleChannelComments()) {
				return;
			}
			if (this.#handleLayoutClear()) {
				return;
			}
			if (await this.#handleAdditionalRecentLists()) {
				return;
			}
			if (this.#handleMessengerSliderClose()) {
				return;
			}
			this.#handleDesktopAction();
		}
		#shouldIgnoreEscape() {
			const hasVisibleCall = im_v2_lib_call.CallManager.getInstance().hasVisibleCall();
			// popups have their own escape handling
			const isAnyPopupShown = main_popup.PopupWindowManager.isAnyPopupShown();
			return hasVisibleCall || isAnyPopupShown || this.#isExternalSliderOpened();
		}
		async #isHandledBySubscriber() {
			const eventResult = await this.#emitter.emitAsync(im_v2_const.EventType.key.onBeforeEscape);
			const globalEventResult = await main_core_events.EventEmitter.emitAsync(im_v2_const.EventType.key.onBeforeEscape);
			const mergedEventResult = [...eventResult, ...globalEventResult];
			return mergedEventResult.includes(EscEventAction.handled);
		}
		#handleActiveInput() {
			const {
				activeElement
			} = document;
			if (!activeElement) {
				return false;
			}
			const isMessengerFocused = this.#messengerContainer.contains(activeElement);
			const isInputFocused = activeElement.matches('input');
			if (isMessengerFocused && isInputFocused) {
				activeElement.blur();
				return true;
			}
			return false;
		}
		#handleLayoutClear() {
			const layoutManager = im_v2_lib_layout.LayoutManager.getInstance();
			const currentLayout = layoutManager.getLayout();
			const isChatLayout = layoutManager.isChatLayout(currentLayout.name);
			const isChatLayoutEmptyState = isChatLayout && currentLayout.entityId === '';
			if (isChatLayoutEmptyState) {
				return false;
			}
			if (isChatLayout) {
				layoutManager.clearCurrentLayoutEntityId();
			} else {
				this.#switchToChatLayout();
			}
			return true;
		}
		#handleMessengerSliderClose() {
			const slider = im_v2_lib_slider.MessengerSlider.getInstance();
			if (slider.getCurrent() && slider.isFocused()) {
				slider.getCurrent().close();
				return true;
			}
			return false;
		}
		#handleDesktopAction() {
			if (!im_v2_lib_desktop.DesktopManager.isDesktop()) {
				return false;
			}
			im_v2_lib_desktopApi.DesktopApi.hideWindow();
			return true;
		}
		#onKeyUp(event) {
			if (!im_v2_lib_utils.Utils.key.isCombination(event, 'Escape')) {
				return;
			}
			void this.handleEsc();
		}
		#onKeyDown() {
			// Viewer has its own ESC keydown handler, so we need to check if it is opened
			this.#wasKeyDownHandled = BX.UI.Viewer.Instance.isOpen();
		}
		#switchToChatLayout() {
			void im_v2_lib_layout.LayoutManager.getInstance().setLayout({
				name: im_v2_const.Layout.chat,
				entityId: ''
			});
		}
		#isExternalSliderOpened() {
			const isEmbeddedMode = im_v2_lib_layout.LayoutManager.getInstance().isEmbeddedMode();
			if (isEmbeddedMode) {
				return main_sidepanel.SidePanel.Instance.getOpenSlidersCount() > 0;
			}
			return !im_v2_lib_slider.MessengerSlider.getInstance().isFocused();
		}
		#handleChannelComments() {
			const areCommentsOpened = im_v2_application_core.Core.getStore().getters['messages/comments/areOpened'];
			if (areCommentsOpened) {
				this.#emitter.emit(im_v2_const.EventType.dialog.closeComments);
			}
			return areCommentsOpened;
		}
		async #handleAdditionalRecentLists() {
			const eventResult = await main_core_events.EventEmitter.emitAsync(im_v2_const.EventType.recent.closeListSlider);
			return eventResult.includes(EscEventAction.handled);
		}
	}

	exports.EscEventAction = EscEventAction;
	exports.EscManager = EscManager;

})(this.BX.Messenger.v2.Lib = this.BX.Messenger.v2.Lib || {}, BX, BX.Event, BX.Main, BX.SidePanel, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Application, BX.Messenger.v2.Const, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib, BX.Messenger.v2.Lib);
//# sourceMappingURL=esc-manager.bundle.js.map
