import { Dom, Event, Runtime } from 'main.core';

const ExtensionName = 'mail.grid.migration-progress-panel';
const AnchorSelector = '[data-role="mailbox-migration-progress-anchor"]';
const HoverDelay = 200;

type MigrationProgressPanel = {
	bindAnchor(anchor: HTMLElement, mailboxId: number): void,
	unbindAnchor(anchor: HTMLElement): void,
	open(anchor: HTMLElement, interactive?: boolean): void,
	destroy(): void,
};

type MigrationProgressPanelExtension = {
	MigrationProgressPanel: {
		getInstance(gridId: string): MigrationProgressPanel,
	},
};

type ExtensionLoader = () => Promise<MigrationProgressPanelExtension>;

const defaultExtensionLoader: ExtensionLoader = () => Runtime.loadExtension(ExtensionName);

export class MigrationProgressPanelLoader
{
	static #instances = new Map();
	#gridId;
	#grid;
	#panel = null;
	#extensionLoader;
	#extensionPromise = null;
	#pendingAnchor = null;
	#pendingInteractive = false;
	#hoverTimer = null;
	#epoch = 0;
	#destroyed = false;
	#listeners = [];

	constructor(gridId: string, extensionLoader: ExtensionLoader = defaultExtensionLoader)
	{
		this.#gridId = gridId;
		this.#extensionLoader = extensionLoader;
		this.#grid = document.getElementById(gridId);
		if (this.#grid)
		{
			const grid = this.#grid;
			['mouseover', 'mouseout', 'focusin', 'focusout', 'click', 'keydown'].forEach((name) => {
				const listener = (event) => this.#handleTrigger(event);
				Event.bind(grid, name, listener);
				this.#listeners.push(() => Event.unbind(grid, name, listener));
			});
		}
	}

	static getInstance(gridId: string): MigrationProgressPanelLoader
	{
		if (!this.#instances.has(gridId))
		{
			this.#instances.set(gridId, new MigrationProgressPanelLoader(gridId));
		}

		return this.#instances.get(gridId);
	}

	static destroyInstance(gridId: string): void
	{
		this.#instances.get(gridId)?.destroy();
	}

	bindAnchor(anchor: HTMLElement, mailboxId: number): void
	{
		Dom.attr(anchor, {
			'data-role': 'mailbox-migration-progress-anchor',
			'data-mailbox-id': String(mailboxId),
			'data-testid': 'mail-migration-progress-chip',
			role: 'button',
			tabindex: '0',
			'aria-expanded': 'false',
			'aria-controls': `mail-migration-progress-content-${this.#gridId}`,
		});
	}

	unbindAnchor(anchor: HTMLElement): void
	{
		this.#cancelPendingOpen(anchor);
		this.#panel?.unbindAnchor(anchor);
		[
			'data-role',
			'data-mailbox-id',
			'data-testid',
			'role',
			'tabindex',
			'aria-expanded',
			'aria-controls',
		].forEach((name) => anchor.removeAttribute(name));
	}

	destroy(): void
	{
		this.#destroyed = true;
		this.#epoch++;
		this.#clearHoverTimer();
		this.#pendingAnchor = null;
		this.#listeners.splice(0).forEach((unsubscribe) => unsubscribe());
		this.#panel?.destroy();
		this.#panel = null;
		this.#grid = null;
		MigrationProgressPanelLoader.#instances.delete(this.#gridId);
	}

	#handleTrigger(event): void
	{
		const target = event.target instanceof Element ? event.target : null;
		const anchor = target?.closest(AnchorSelector);
		if (!anchor)
		{
			return;
		}

		switch (event.type)
		{
			case 'mouseover':
				if (!anchor.contains(event.relatedTarget))
				{
					this.#clearHoverTimer();
					this.#hoverTimer = setTimeout(() => {
						this.#hoverTimer = null;
						this.#requestOpen(anchor, false);
					}, HoverDelay);
				}
				break;
			case 'mouseout':
				if (!anchor.contains(event.relatedTarget) && !anchor.contains(document.activeElement))
				{
					this.#cancelPendingOpen(anchor);
				}
				break;
			case 'focusout':
				if (!anchor.contains(event.relatedTarget))
				{
					this.#cancelPendingOpen(anchor);
				}
				break;
			case 'click':
			case 'focusin':
				this.#requestOpen(anchor, true);
				break;
			case 'keydown':
				if (event.key === 'Enter' || event.key === ' ')
				{
					event.preventDefault();
					this.#requestOpen(anchor, true);
				}
				break;
			default:
				break;
		}
	}

	#requestOpen(anchor: HTMLElement, interactive: boolean): void
	{
		this.#clearHoverTimer();
		if (this.#destroyed || !anchor.isConnected)
		{
			return;
		}

		if (this.#pendingAnchor !== anchor)
		{
			this.#pendingInteractive = interactive;
		}
		else
		{
			this.#pendingInteractive ||= interactive;
		}
		this.#pendingAnchor = anchor;
		const epoch = ++this.#epoch;
		this.#extensionPromise ??= this.#extensionLoader();
		const loading = this.#extensionPromise;
		void loading.then((extension) => {
			if (this.#destroyed)
			{
				return;
			}

			if (epoch !== this.#epoch || this.#pendingAnchor !== anchor || !anchor.isConnected)
			{
				return;
			}

			this.#panel ??= extension.MigrationProgressPanel.getInstance(this.#gridId);
			this.#clearHoverTimer();
			this.#listeners.splice(0).forEach((unsubscribe) => unsubscribe());
			this.#panel.bindAnchor(anchor, Number(anchor.dataset.mailboxId));
			this.#panel.open(anchor, this.#pendingInteractive);
			this.#pendingAnchor = null;
			this.#pendingInteractive = false;
		}).catch(() => {
			if (this.#extensionPromise === loading)
			{
				this.#extensionPromise = null;
			}

			if (epoch === this.#epoch)
			{
				this.#pendingAnchor = null;
				this.#pendingInteractive = false;
			}
		});
	}

	#cancelPendingOpen(anchor: HTMLElement): void
	{
		this.#clearHoverTimer();
		if (this.#pendingAnchor === anchor)
		{
			this.#epoch++;
			this.#pendingAnchor = null;
			this.#pendingInteractive = false;
		}
	}

	#clearHoverTimer(): void
	{
		if (this.#hoverTimer !== null)
		{
			clearTimeout(this.#hoverTimer);
			this.#hoverTimer = null;
		}
	}
}
