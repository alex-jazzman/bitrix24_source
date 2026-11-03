/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, intranet_aiChatPanel, ui_notification) {
	'use strict';

	const EXPANDED_CLASS = '--expanded';
	const RESIZING_CLASS = '--resizing';
	const TRIGGER_SELECTOR = '[data-bitrixgpt-trigger]';
	const MIN_WIDTH = 320;
	const MAX_WIDTH_FRACTION = 0.4;

	// Widget restores last opened dialog from these sessionStorage keys.
	// Without reset embed pages open a stale dialog instead of the latest from recent.
	const WIDGET_DIALOG_STORAGE_KEYS = ['im-ai-assistant-widget-copilotWidgetLastDialogId', 'im-ai-marta-widget-copilotWidgetLastDialogId'];
	class BitrixGptLauncher {
		static #instance = null;
		#panelNode;
		#panel = null;
		#isOpen = false;
		#mountPromise = null;
		#bitrixGptName = '';
		#createPanel = null;
		#pendingDialogId = null;
		#stubNode = null;
		#stubContentNode = null;
		#resizeHandleNode = null;
		#dragOverlayNode = null;
		#widthHostNode;
		#isDragging = false;
		#dragStartX = 0;
		#dragStartWidth = 0;
		#boundOnPointerMove = null;
		#boundOnPointerUp = null;
		#resizeRafId = null;
		#pendingWidth = 0;
		constructor(options) {
			if (!main_core.Type.isDomNode(options.panelNode)) {
				throw new Error('BitrixGptLauncher: panelNode is required');
			}
			this.#panelNode = options.panelNode;
			this.#bitrixGptName = main_core.Type.isStringFilled(options.bitrixGptName) ? options.bitrixGptName : '';
			this.#createPanel = main_core.Type.isFunction(options.createPanel) ? options.createPanel : null;
			this.#initResizeHandle();
			this.#initTriggerDelegation();
			this.#playIntroGlow();
			if (options.initiallyOpen === true) {
				// skipSync: this is page bootstrap, not a user action — don't overwrite user intent.
				// Defer to idle so the mount doesn't add first-paint jank on top of the synchronous
				// dashboard render.
				const schedule = window.requestIdleCallback || (cb => setTimeout(cb, 0));
				schedule(() => this.#expand({
					skipSync: true
				}));
			}
		}
		static init(options) {
			if (!BitrixGptLauncher.#instance) {
				BitrixGptLauncher.#instance = new BitrixGptLauncher(options);
			}
			return BitrixGptLauncher.#instance;
		}
		static getInstance() {
			return BitrixGptLauncher.#instance;
		}
		isOpen() {
			return this.#isOpen;
		}
		open() {
			if (!this.#isOpen) {
				this.#expand();
			}
		}
		close() {
			if (this.#isOpen) {
				this.#collapse();
			}
		}

		/**
		 * Switches the open panel to the chat. A panel closed by the user stays closed:
		 * the chat is applied on its next open.
		 */
		async openDialog(chatId) {
			const dialogId = `chat${chatId}`;
			this.hideStub();
			if (!this.#isOpen || !this.#mountPromise) {
				this.#pendingDialogId = dialogId;
				return;
			}
			try {
				await this.#mountPromise;
			} catch {
				this.#pendingDialogId = dialogId;
				return;
			}
			if (!this.#isOpen) {
				this.#pendingDialogId = dialogId;
				return;
			}
			this.#pendingDialogId = null;
			await this.#panel?.changeDialog(dialogId);
		}
		showStub(content) {
			if (!this.#stubNode) {
				this.#stubContentNode = main_core.Tag.render`<div class="dashboard-bitrixgpt-panel__stub-content"></div>`;

				// The stub covers the whole widget including its hide button, so it carries its own way back to the chat.
				const closeTitle = main_core.Loc.getMessage('JS_CORE_WINDOW_CLOSE') ?? '';
				const closeButton = main_core.Tag.render`<button type="button" class="dashboard-bitrixgpt-panel__stub-close"></button>`;
				main_core.Dom.attr(closeButton, {
					'aria-label': closeTitle,
					title: closeTitle
				});
				main_core.Event.bind(closeButton, 'click', () => this.hideStub());
				this.#stubNode = main_core.Tag.render`
				<div class="dashboard-bitrixgpt-panel__stub" role="status" aria-live="polite"></div>
			`;
				main_core.Dom.append(closeButton, this.#stubNode);
				main_core.Dom.append(this.#stubContentNode, this.#stubNode);
			}
			main_core.Dom.clean(this.#stubContentNode);
			main_core.Dom.append(content, this.#stubContentNode);
			if (this.#stubNode.parentNode !== this.#panelNode) {
				main_core.Dom.append(this.#stubNode, this.#panelNode);
			}
		}
		hideStub() {
			if (this.#stubNode) {
				main_core.Dom.remove(this.#stubNode);
			}
		}

		// One-shot attention glow on dashboard open; animation lives in aiassistant.marta's avatar.css.
		#playIntroGlow() {
			const trigger = document.querySelector(TRIGGER_SELECTOR);
			const avatarWrapper = trigger?.querySelector('.aiassistant-marta__avatar-wrapper');
			if (!avatarWrapper) {
				return;
			}
			main_core.Dom.remove(avatarWrapper.querySelector('.aiassistant-marta__glow-svg'));
			main_core.Dom.addClass(avatarWrapper, '--highlighting');
			const glow = main_core.Dom.create('img', {
				attrs: {
					className: 'aiassistant-marta__glow-svg',
					src: '/bitrix/js/aiassistant/marta/image/bitrixgpt-glow.webp',
					alt: '',
					role: 'presentation',
					'aria-hidden': 'true'
				}
			});
			main_core.Dom.prepend(glow, avatarWrapper);
			main_core.Event.bindOnce(glow, 'animationend', () => {
				main_core.Dom.removeClass(avatarWrapper, '--highlighting');
				main_core.Dom.remove(glow);
			});
		}
		#initTriggerDelegation() {
			main_core.Event.bind(this.#widthHostNode, 'click', event => {
				const trigger = event.target?.closest?.(TRIGGER_SELECTOR);
				if (trigger) {
					if (this.#isOpen) {
						this.#collapse();
					} else {
						this.#expand();
					}
				}
			});
		}
		#expand(options = {}) {
			this.#isOpen = true;
			main_core.Dom.addClass(this.#panelNode, EXPANDED_CLASS);
			this.#mountWidget().then(() => {
				if (options.skipSync !== true && this.#isOpen) {
					this.#syncMainChatState(true);
				}
				this.#applyPendingDialog();
			}).catch(error => {
				console.error('BitrixGptLauncher: failed to mount widget', error);
				this.#collapse({
					skipSync: true
				});
				ui_notification.UI.Notification.Center.notify({
					content: main_core.Loc.getMessage('BICONNECTOR_BITRIXGPT_LAUNCHER_MOUNT_ERROR', {
						'#BITRIXGPT_NAME#': this.#bitrixGptName
					})
				});
			});
		}
		#applyPendingDialog() {
			if (!this.#isOpen || this.#pendingDialogId === null) {
				return;
			}
			const dialogId = this.#pendingDialogId;
			this.#pendingDialogId = null;
			this.#panel?.changeDialog(dialogId).catch(error => {
				console.error('BitrixGptLauncher: failed to change dialog', error);
			});
		}
		#collapse(options = {}) {
			this.#isOpen = false;
			main_core.Dom.removeClass(this.#panelNode, EXPANDED_CLASS);
			this.hideStub();
			if (options.skipSync !== true) {
				this.#syncMainChatState(false);
			}
		}
		#syncMainChatState(isOpen) {
			if (!BX.userOptions || !main_core.Type.isFunction(BX.userOptions.save)) {
				return;
			}
			BX.userOptions.save('aiassistant', 'marta_is_open', null, isOpen ? 'Y' : 'N');
		}
		#mountWidget() {
			if (this.#mountPromise) {
				return this.#mountPromise;
			}
			this.#resetDialogStorage();
			this.#panel = this.#createPanel ? this.#createPanel() : new intranet_aiChatPanel.AiChatPanel({
				events: {
					onHideButtonClick: () => this.close(),
					onError: errors => console.error('BitrixGptLauncher: AI widget error', errors)
				}
			});
			this.#mountPromise = this.#panel.mount(this.#panelNode).catch(error => {
				this.#panel?.unmount();
				this.#panel = null;
				this.#mountPromise = null;
				throw error;
			});
			return this.#mountPromise;
		}
		#resetDialogStorage() {
			WIDGET_DIALOG_STORAGE_KEYS.forEach(key => {
				try {
					sessionStorage.removeItem(key);
				} catch {
					// sessionStorage may be unavailable (private mode, disabled storage).
				}
			});
		}
		#initResizeHandle() {
			// header.php sets --air-right-panel-width inline on .dashboard-layout for first paint;
			// drag updates must land on the same node or the cascade ignores them.
			this.#widthHostNode = this.#panelNode.closest('.dashboard-layout') || document.documentElement;
			this.#resizeHandleNode = main_core.Tag.render`
			<div
				class="dashboard-bitrixgpt-panel__resize-handle"
				role="separator"
				aria-orientation="vertical"
			></div>
		`;
			main_core.Dom.append(this.#resizeHandleNode, this.#panelNode);
			this.#boundOnPointerMove = this.#onPointerMove.bind(this);
			this.#boundOnPointerUp = this.#onPointerUp.bind(this);
			main_core.Event.bind(this.#resizeHandleNode, 'pointerdown', this.#onPointerDown.bind(this));
		}
		#onPointerDown(event) {
			if (!this.#isOpen) {
				return;
			}
			event.preventDefault();
			this.#isDragging = true;
			this.#dragStartX = event.clientX;
			this.#dragStartWidth = this.#panelNode.getBoundingClientRect().width;
			main_core.Dom.addClass(this.#panelNode, RESIZING_CLASS);
			this.#showDragOverlay();
			main_core.Event.bind(document, 'pointermove', this.#boundOnPointerMove);
			main_core.Event.bind(document, 'pointerup', this.#boundOnPointerUp);
			// pointercancel fires when the OS aborts the gesture (window switch, touch
			// gesture takeover). Without it `--resizing` stays on and listeners leak.
			main_core.Event.bind(document, 'pointercancel', this.#boundOnPointerUp);
		}
		#onPointerMove(event) {
			if (!this.#isDragging) {
				return;
			}
			const delta = this.#dragStartX - event.clientX;
			const desired = this.#dragStartWidth + delta;
			const maxWidth = Math.floor(window.innerWidth * MAX_WIDTH_FRACTION);
			this.#pendingWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, desired));

			// Coalesce layout writes to one per frame: the panel sits next to a heavy Superset
			// iframe, so writing --air-right-panel-width on every pointermove floods reflow.
			if (this.#resizeRafId === null) {
				this.#resizeRafId = requestAnimationFrame(() => {
					this.#resizeRafId = null;
					main_core.Dom.style(this.#widthHostNode, '--air-right-panel-width', `${this.#pendingWidth}px`);
				});
			}
		}
		#onPointerUp() {
			if (!this.#isDragging) {
				return;
			}
			this.#isDragging = false;

			// Flush any frame still pending so the final width lands before we measure/save it.
			if (this.#resizeRafId !== null) {
				cancelAnimationFrame(this.#resizeRafId);
				this.#resizeRafId = null;
				main_core.Dom.style(this.#widthHostNode, '--air-right-panel-width', `${this.#pendingWidth}px`);
			}
			main_core.Dom.removeClass(this.#panelNode, RESIZING_CLASS);
			this.#hideDragOverlay();
			main_core.Event.unbind(document, 'pointermove', this.#boundOnPointerMove);
			main_core.Event.unbind(document, 'pointerup', this.#boundOnPointerUp);
			main_core.Event.unbind(document, 'pointercancel', this.#boundOnPointerUp);
			const finalWidth = Math.round(this.#panelNode.getBoundingClientRect().width);
			if (finalWidth > 0 && finalWidth !== Math.round(this.#dragStartWidth)) {
				this.#saveWidth(finalWidth);
			}
		}
		#showDragOverlay() {
			if (!this.#dragOverlayNode) {
				this.#dragOverlayNode = main_core.Tag.render`
				<div class="dashboard-bitrixgpt-panel__drag-overlay"></div>
			`;
			}
			main_core.Dom.append(this.#dragOverlayNode, document.body);
		}
		#hideDragOverlay() {
			if (this.#dragOverlayNode) {
				main_core.Dom.remove(this.#dragOverlayNode);
			}
		}
		#saveWidth(width) {
			if (!BX.userOptions || !main_core.Type.isFunction(BX.userOptions.save)) {
				return;
			}
			BX.userOptions.save('intranet', 'right_panel_width', null, String(width));
		}
	}

	exports.BitrixGptLauncher = BitrixGptLauncher;

})(this.BX.BIConnector = this.BX.BIConnector || {}, BX, BX.Intranet, BX.UI.Notification);
//# sourceMappingURL=bitrixgpt-launcher.bundle.js.map
