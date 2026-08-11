/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events, main_loader) {
	'use strict';

	function renderWidgetWrapper(contextClass) {
		const contentContainer = main_core.Tag.render`
		<div class="intranet-ai-chat-panel__content"></div>
	`;
		new main_loader.Loader({
			size: 144,
			color: 'rgba(255, 255, 255, 0.6)',
			target: contentContainer,
			offset: {
				top: '-50px'
			}
		}).show();
		const wrapperContainer = main_core.Tag.render`
		<div class="intranet-ai-chat-panel ${contextClass}">
			${contentContainer}
			<div class="intranet-ai-chat-panel__background">
				<div class="intranet-ai-chat-panel__background_header"></div>
			</div>
		</div>
	`;
		return {
			wrapperContainer,
			contentContainer
		};
	}

	const HIDE_BUTTON_CLICK_EVENT = 'IM.AiAssistantWidget:minimize';

	function loadWidgetApplication(chatWidgetConfig = {}) {
		return main_core.Runtime.loadExtension('im.v2.application.integration.ai-assistant-widget').then(() => BX.Messenger.v2.Application.Launch('aiAssistantWidget', {
			embedded: true,
			...chatWidgetConfig
		}));
	}

	class AiChatPanel {
		#dialogId;
		#chatWidgetConfig;
		#events;
		#wrapperContainer = null;
		#contentContainer = null;
		#widgetApplication = null;
		#widgetApplicationPromise = null;
		#hideButtonClickHandler = null;
		#isMounted = false;
		constructor(options) {
			if (options.dialogId !== undefined && !main_core.Type.isStringFilled(options.dialogId)) {
				throw new Error('AiChatPanel: dialogId must be non-empty string');
			}
			this.#dialogId = options.dialogId;
			this.#chatWidgetConfig = options.chatWidgetConfig ?? {};
			this.#events = options.events ?? {};
		}
		preload() {
			return this.#loadWidgetApplication();
		}
		async mount(targetContainer) {
			if (this.#isMounted) {
				return;
			}
			if (!(targetContainer instanceof HTMLElement)) {
				throw new Error('AiChatPanel: targetContainer must be HTMLElement');
			}
			this.#isMounted = true;
			const contextClass = main_core.Extension.getSettings('intranet.ai-chat-panel').contextClass || '';
			const {
				wrapperContainer,
				contentContainer
			} = renderWidgetWrapper(contextClass);
			this.#wrapperContainer = wrapperContainer;
			this.#contentContainer = contentContainer;
			main_core.Dom.append(this.#wrapperContainer, targetContainer);
			this.#subscribeEvents();
			const application = await this.#loadWidgetApplication();
			await application.mount({
				rootContainer: this.#contentContainer,
				dialogId: this.#dialogId,
				onError: this.#events.onError
			});
			this.#widgetApplication = application;
		}
		async changeDialog(dialogId) {
			if (!main_core.Type.isStringFilled(dialogId)) {
				console.warn('AiChatPanel: dialogId must be non-empty string, dialog not changed');
				return;
			}
			this.#dialogId = dialogId;
			if (!this.#widgetApplication) {
				return;
			}
			await this.#widgetApplication.changeDialog({
				dialogId
			});
		}
		unmount() {
			if (!this.#isMounted) {
				return;
			}
			this.#unsubscribeEvents();
			this.#widgetApplication?.bitrixVue?.unmount();
			main_core.Dom.remove(this.#wrapperContainer);
			this.#widgetApplication = null;
			this.#wrapperContainer = null;
			this.#contentContainer = null;
			this.#isMounted = false;
		}
		#subscribeEvents() {
			if (!this.#events.onHideButtonClick) {
				return;
			}
			this.#hideButtonClickHandler = () => this.#events.onHideButtonClick?.();
			main_core_events.EventEmitter.subscribe(HIDE_BUTTON_CLICK_EVENT, this.#hideButtonClickHandler);
		}
		#unsubscribeEvents() {
			if (this.#hideButtonClickHandler) {
				main_core_events.EventEmitter.unsubscribe(HIDE_BUTTON_CLICK_EVENT, this.#hideButtonClickHandler);
				this.#hideButtonClickHandler = null;
			}
		}
		#loadWidgetApplication() {
			if (!this.#widgetApplicationPromise) {
				this.#widgetApplicationPromise = loadWidgetApplication(this.#chatWidgetConfig).catch(error => {
					this.#widgetApplicationPromise = null;
					throw error;
				});
			}
			return this.#widgetApplicationPromise;
		}
	}

	exports.AiChatPanel = AiChatPanel;

})(this.BX.Intranet = this.BX.Intranet || {}, BX, BX.Event, BX);
//# sourceMappingURL=ai-chat-panel.bundle.js.map
