import { Dom, Event, Loc, Tag, Type } from 'main.core';
import { AiChatPanel } from 'intranet.ai-chat-panel';
import { UI } from 'ui.notification';
import './launcher.css';

const EXPANDED_CLASS = '--expanded';
const RESIZING_CLASS = '--resizing';
const TRIGGER_SELECTOR = '[data-bitrixgpt-trigger]';
const MIN_WIDTH = 320;
const MAX_WIDTH_FRACTION = 0.4;

// Widget restores last opened dialog from these sessionStorage keys.
// Without reset embed pages open a stale dialog instead of the latest from recent.
const WIDGET_DIALOG_STORAGE_KEYS = [
	'im-ai-assistant-widget-copilotWidgetLastDialogId',
	'im-ai-marta-widget-copilotWidgetLastDialogId',
];

type LauncherOptions = {
	panelNode: HTMLElement,
	initiallyOpen?: boolean,
	bitrixGptName?: string,
	createPanel?: () => AiChatPanel,
};

export class BitrixGptLauncher
{
	static #instance: ?BitrixGptLauncher = null;

	#panelNode: HTMLElement;
	#panel: ?AiChatPanel = null;
	#isOpen: boolean = false;
	#mountPromise: ?Promise<void> = null;
	#bitrixGptName: string = '';
	#createPanel: ?() => AiChatPanel = null;
	#pendingDialogId: ?string = null;
	#stubNode: ?HTMLElement = null;
	#stubContentNode: ?HTMLElement = null;

	#resizeHandleNode: ?HTMLElement = null;
	#dragOverlayNode: ?HTMLElement = null;
	#widthHostNode: HTMLElement;
	#isDragging: boolean = false;
	#dragStartX: number = 0;
	#dragStartWidth: number = 0;
	#boundOnPointerMove: ?Function = null;
	#boundOnPointerUp: ?Function = null;
	#resizeRafId: ?number = null;
	#pendingWidth: number = 0;

	constructor(options: LauncherOptions)
	{
		if (!Type.isDomNode(options.panelNode))
		{
			throw new Error('BitrixGptLauncher: panelNode is required');
		}

		this.#panelNode = options.panelNode;
		this.#bitrixGptName = Type.isStringFilled(options.bitrixGptName) ? options.bitrixGptName : '';
		this.#createPanel = Type.isFunction(options.createPanel) ? options.createPanel : null;

		this.#initResizeHandle();
		this.#initTriggerDelegation();
		this.#playIntroGlow();

		if (options.initiallyOpen === true)
		{
			// skipSync: this is page bootstrap, not a user action — don't overwrite user intent.
			// Defer to idle so the mount doesn't add first-paint jank on top of the synchronous
			// dashboard render.
			const schedule = window.requestIdleCallback || ((cb) => setTimeout(cb, 0));
			schedule(() => this.#expand({ skipSync: true }));
		}
	}

	static init(options: LauncherOptions): BitrixGptLauncher
	{
		if (!BitrixGptLauncher.#instance)
		{
			BitrixGptLauncher.#instance = new BitrixGptLauncher(options);
		}

		return BitrixGptLauncher.#instance;
	}

	static getInstance(): ?BitrixGptLauncher
	{
		return BitrixGptLauncher.#instance;
	}

	isOpen(): boolean
	{
		return this.#isOpen;
	}

	open(): void
	{
		if (!this.#isOpen)
		{
			this.#expand();
		}
	}

	close(): void
	{
		if (this.#isOpen)
		{
			this.#collapse();
		}
	}

	/**
	 * Switches the open panel to the chat. A panel closed by the user stays closed:
	 * the chat is applied on its next open.
	 */
	async openDialog(chatId: number): Promise<void>
	{
		const dialogId = `chat${chatId}`;
		this.hideStub();

		if (!this.#isOpen || !this.#mountPromise)
		{
			this.#pendingDialogId = dialogId;

			return;
		}

		try
		{
			await this.#mountPromise;
		}
		catch
		{
			this.#pendingDialogId = dialogId;

			return;
		}

		if (!this.#isOpen)
		{
			this.#pendingDialogId = dialogId;

			return;
		}

		this.#pendingDialogId = null;
		await this.#panel?.changeDialog(dialogId);
	}

	showStub(content: HTMLElement): void
	{
		if (!this.#stubNode)
		{
			this.#stubContentNode = Tag.render`<div class="dashboard-bitrixgpt-panel__stub-content"></div>`;

			// The stub covers the whole widget including its hide button, so it carries its own way back to the chat.
			const closeTitle = Loc.getMessage('JS_CORE_WINDOW_CLOSE') ?? '';
			const closeButton = Tag.render`<button type="button" class="dashboard-bitrixgpt-panel__stub-close"></button>`;
			Dom.attr(closeButton, { 'aria-label': closeTitle, title: closeTitle });
			Event.bind(closeButton, 'click', () => this.hideStub());

			this.#stubNode = Tag.render`
				<div class="dashboard-bitrixgpt-panel__stub" role="status" aria-live="polite"></div>
			`;
			Dom.append(closeButton, this.#stubNode);
			Dom.append(this.#stubContentNode, this.#stubNode);
		}

		Dom.clean(this.#stubContentNode);
		Dom.append(content, this.#stubContentNode);

		if (this.#stubNode.parentNode !== this.#panelNode)
		{
			Dom.append(this.#stubNode, this.#panelNode);
		}
	}

	hideStub(): void
	{
		if (this.#stubNode)
		{
			Dom.remove(this.#stubNode);
		}
	}

	// One-shot attention glow on dashboard open; animation lives in aiassistant.marta's avatar.css.
	#playIntroGlow(): void
	{
		const trigger = document.querySelector(TRIGGER_SELECTOR);
		const avatarWrapper = trigger?.querySelector('.aiassistant-marta__avatar-wrapper');
		if (!avatarWrapper)
		{
			return;
		}

		Dom.remove(avatarWrapper.querySelector('.aiassistant-marta__glow-svg'));
		Dom.addClass(avatarWrapper, '--highlighting');

		const glow = Dom.create('img', {
			attrs: {
				className: 'aiassistant-marta__glow-svg',
				src: '/bitrix/js/aiassistant/marta/image/bitrixgpt-glow.webp',
				alt: '',
				role: 'presentation',
				'aria-hidden': 'true',
			},
		});

		Dom.prepend(glow, avatarWrapper);

		Event.bindOnce(glow, 'animationend', () => {
			Dom.removeClass(avatarWrapper, '--highlighting');
			Dom.remove(glow);
		});
	}

	#initTriggerDelegation(): void
	{
		Event.bind(this.#widthHostNode, 'click', (event: MouseEvent) => {
			const trigger = event.target?.closest?.(TRIGGER_SELECTOR);
			if (trigger)
			{
				if (this.#isOpen)
				{
					this.#collapse();
				}
				else
				{
					this.#expand();
				}
			}
		});
	}

	#expand(options: { skipSync?: boolean } = {}): void
	{
		this.#isOpen = true;
		Dom.addClass(this.#panelNode, EXPANDED_CLASS);

		this.#mountWidget()
			.then(() => {
				if (options.skipSync !== true && this.#isOpen)
				{
					this.#syncMainChatState(true);
				}

				this.#applyPendingDialog();
			})
			.catch((error) => {
				console.error('BitrixGptLauncher: failed to mount widget', error);
				this.#collapse({ skipSync: true });
				UI.Notification.Center.notify({
					content: Loc.getMessage('BICONNECTOR_BITRIXGPT_LAUNCHER_MOUNT_ERROR', { '#BITRIXGPT_NAME#': this.#bitrixGptName }),
				});
			});
	}

	#applyPendingDialog(): void
	{
		if (!this.#isOpen || this.#pendingDialogId === null)
		{
			return;
		}

		const dialogId = this.#pendingDialogId;
		this.#pendingDialogId = null;
		this.#panel?.changeDialog(dialogId).catch((error) => {
			console.error('BitrixGptLauncher: failed to change dialog', error);
		});
	}

	#collapse(options: { skipSync?: boolean } = {}): void
	{
		this.#isOpen = false;
		Dom.removeClass(this.#panelNode, EXPANDED_CLASS);
		this.hideStub();

		if (options.skipSync !== true)
		{
			this.#syncMainChatState(false);
		}
	}

	#syncMainChatState(isOpen: boolean): void
	{
		if (!BX.userOptions || !Type.isFunction(BX.userOptions.save))
		{
			return;
		}
		BX.userOptions.save('aiassistant', 'marta_is_open', null, isOpen ? 'Y' : 'N');
	}

	#mountWidget(): Promise<void>
	{
		if (this.#mountPromise)
		{
			return this.#mountPromise;
		}

		this.#resetDialogStorage();

		this.#panel = this.#createPanel ? this.#createPanel() : new AiChatPanel({
			events: {
				onHideButtonClick: () => this.close(),
				onError: (errors) => console.error('BitrixGptLauncher: AI widget error', errors),
			},
		});

		this.#mountPromise = this.#panel.mount(this.#panelNode)
			.catch((error) => {
				this.#panel?.unmount();
				this.#panel = null;
				this.#mountPromise = null;

				throw error;
			});

		return this.#mountPromise;
	}

	#resetDialogStorage(): void
	{
		WIDGET_DIALOG_STORAGE_KEYS.forEach((key) => {
			try
			{
				sessionStorage.removeItem(key);
			}
			catch
			{
				// sessionStorage may be unavailable (private mode, disabled storage).
			}
		});
	}

	#initResizeHandle(): void
	{
		// header.php sets --air-right-panel-width inline on .dashboard-layout for first paint;
		// drag updates must land on the same node or the cascade ignores them.
		this.#widthHostNode = this.#panelNode.closest('.dashboard-layout') || document.documentElement;

		this.#resizeHandleNode = Tag.render`
			<div
				class="dashboard-bitrixgpt-panel__resize-handle"
				role="separator"
				aria-orientation="vertical"
			></div>
		`;
		Dom.append(this.#resizeHandleNode, this.#panelNode);

		this.#boundOnPointerMove = this.#onPointerMove.bind(this);
		this.#boundOnPointerUp = this.#onPointerUp.bind(this);

		Event.bind(this.#resizeHandleNode, 'pointerdown', this.#onPointerDown.bind(this));
	}

	#onPointerDown(event: PointerEvent): void
	{
		if (!this.#isOpen)
		{
			return;
		}

		event.preventDefault();

		this.#isDragging = true;
		this.#dragStartX = event.clientX;
		this.#dragStartWidth = this.#panelNode.getBoundingClientRect().width;

		Dom.addClass(this.#panelNode, RESIZING_CLASS);
		this.#showDragOverlay();

		Event.bind(document, 'pointermove', this.#boundOnPointerMove);
		Event.bind(document, 'pointerup', this.#boundOnPointerUp);
		// pointercancel fires when the OS aborts the gesture (window switch, touch
		// gesture takeover). Without it `--resizing` stays on and listeners leak.
		Event.bind(document, 'pointercancel', this.#boundOnPointerUp);
	}

	#onPointerMove(event: PointerEvent): void
	{
		if (!this.#isDragging)
		{
			return;
		}

		const delta = this.#dragStartX - event.clientX;
		const desired = this.#dragStartWidth + delta;
		const maxWidth = Math.floor(window.innerWidth * MAX_WIDTH_FRACTION);
		this.#pendingWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, desired));

		// Coalesce layout writes to one per frame: the panel sits next to a heavy Superset
		// iframe, so writing --air-right-panel-width on every pointermove floods reflow.
		if (this.#resizeRafId === null)
		{
			this.#resizeRafId = requestAnimationFrame(() => {
				this.#resizeRafId = null;
				Dom.style(this.#widthHostNode, '--air-right-panel-width', `${this.#pendingWidth}px`);
			});
		}
	}

	#onPointerUp(): void
	{
		if (!this.#isDragging)
		{
			return;
		}

		this.#isDragging = false;

		// Flush any frame still pending so the final width lands before we measure/save it.
		if (this.#resizeRafId !== null)
		{
			cancelAnimationFrame(this.#resizeRafId);
			this.#resizeRafId = null;
			Dom.style(this.#widthHostNode, '--air-right-panel-width', `${this.#pendingWidth}px`);
		}

		Dom.removeClass(this.#panelNode, RESIZING_CLASS);
		this.#hideDragOverlay();

		Event.unbind(document, 'pointermove', this.#boundOnPointerMove);
		Event.unbind(document, 'pointerup', this.#boundOnPointerUp);
		Event.unbind(document, 'pointercancel', this.#boundOnPointerUp);

		const finalWidth = Math.round(this.#panelNode.getBoundingClientRect().width);
		if (finalWidth > 0 && finalWidth !== Math.round(this.#dragStartWidth))
		{
			this.#saveWidth(finalWidth);
		}
	}

	#showDragOverlay(): void
	{
		if (!this.#dragOverlayNode)
		{
			this.#dragOverlayNode = Tag.render`
				<div class="dashboard-bitrixgpt-panel__drag-overlay"></div>
			`;
		}
		Dom.append(this.#dragOverlayNode, document.body);
	}

	#hideDragOverlay(): void
	{
		if (this.#dragOverlayNode)
		{
			Dom.remove(this.#dragOverlayNode);
		}
	}

	#saveWidth(width: number): void
	{
		if (!BX.userOptions || !Type.isFunction(BX.userOptions.save))
		{
			return;
		}
		BX.userOptions.save('intranet', 'right_panel_width', null, String(width));
	}
}
