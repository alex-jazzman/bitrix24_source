import { Event, Type } from 'main.core';
import { calculateToolbarPosition, resolveToolbarTop } from './toolbar-position';

export class ToolbarPositionTracker
{
	#state: Object;
	#getRoot: () => HTMLElement | null;
	#getAnchor: () => HTMLElement | null;
	#resizeObserver: Object | null;
	#boundSync: () => void;

	constructor({ state, getRoot, getAnchor }: {
		state: Object,
		getRoot: () => HTMLElement | null,
		getAnchor: () => HTMLElement | null,
	})
	{
		this.#state = state;
		this.#getRoot = getRoot;
		this.#getAnchor = getAnchor;
		this.#resizeObserver = null;
		this.#boundSync = () => this.sync();
	}

	start(): void
	{
		if (!Type.isUndefined(window.ResizeObserver))
		{
			this.#resizeObserver = new window.ResizeObserver(() => {
				this.sync();
			});
			const root = this.#getRoot();
			if (root instanceof HTMLElement)
			{
				this.#resizeObserver.observe(root);
				const actions = this.#resolveActionsScope(root)?.querySelector('.note-page-document-actions');
				if (actions instanceof HTMLElement)
				{
					this.#resizeObserver.observe(actions);
				}
			}
		}

		this.sync();
		Event.bind(window, 'scroll', this.#boundSync, { passive: true });
		Event.bind(window, 'resize', this.#boundSync, { passive: true });
	}

	#resolveActionsScope(root: HTMLElement): HTMLElement | null
	{
		const scope = root.closest('.note-editor-document-content');

		return scope instanceof HTMLElement ? scope : null;
	}

	stop(): void
	{
		Event.unbind(window, 'scroll', this.#boundSync);
		Event.unbind(window, 'resize', this.#boundSync);
		if (this.#resizeObserver)
		{
			this.#resizeObserver.disconnect();
			this.#resizeObserver = null;
		}
	}

	sync(): void
	{
		const root = this.#getRoot();
		const anchor = this.#getAnchor();
		if (!root || !anchor)
		{
			return;
		}

		const scope = root instanceof HTMLElement ? this.#resolveActionsScope(root) : null;
		const targetTop = resolveToolbarTop(10, scope);
		const {
			shouldFix,
			toolbarMaxWidth,
			toolbarLeft,
		} = calculateToolbarPosition({
			root,
			anchor,
			toolbarTop: targetTop,
		});

		this.#state.toolbarFixed = shouldFix;
		this.#state.toolbarTop = targetTop;
		this.#state.toolbarMaxWidth = toolbarMaxWidth;
		this.#state.toolbarLeft = toolbarLeft;
	}
}
