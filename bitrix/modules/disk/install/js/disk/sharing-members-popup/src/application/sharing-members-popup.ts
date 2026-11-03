import { Dom, Loc, Tag } from 'main.core';
import { Dialog, DialogBackground } from 'ui.system.dialog';
import { type App as VueApp, BitrixVue } from 'ui.vue3';
import { createPinia, disposePinia, getActivePinia, type Pinia, setActivePinia } from 'ui.vue3.pinia';

import { loadSharing, type SharingReadMode } from '../feature/load-sharing/load-sharing';
import { notifyError } from '../lib/notify/notify';
import { useSharingStore } from '../model/sharing/sharing';

import { App } from './app';

import '../style.css';

export type SharingMembersPopupParams = {
	objectId: number,
	objectName: string,
	mode: SharingReadMode,
	onAfterHide?: () => void,
};

const ScopeClass = 'disk-sharing-members-popup';

/**
 * A disposed instance keeps no public mark of its own, so every popup puts the one it disposes
 * here: the instances popups dispose are the ones another popup may hold as the previous context.
 */
const disposedPinias: WeakSet<Pinia> = new WeakSet();

/**
 * The context each popup has taken over. A popup opened above another one remembers that one, so
 * the chain leads from the topmost popup down to the context of the page itself.
 */
const previousPinias: WeakMap<Pinia, Pinia> = new WeakMap();

// the nearest living context below the popup: the disposed ones in between are stepped over
function findLivingPrevious(pinia: Pinia): Pinia | undefined
{
	let previous = previousPinias.get(pinia);

	while (previous !== undefined && disposedPinias.has(previous))
	{
		previous = previousPinias.get(previous);
	}

	return previous;
}

/**
 * The single entry point of the sharing popup: the mode is a parameter, there is no method
 * per mode. The dialog appears only after the data is read, so an unsuccessful response
 * leaves nothing on screen but the error notification.
 */
export class SharingMembersPopup
{
	#dialog: Dialog | null = null;
	#app: VueApp | null = null;
	#pinia: Pinia | null = null;
	#container: HTMLElement | null = null;
	#onAfterHide: (() => void) | null = null;
	#openGeneration: number = 0;

	async open(params: SharingMembersPopupParams): Promise<void>
	{
		const openGeneration = ++this.#openGeneration;
		const result = await loadSharing(params.mode, params.objectId);

		if (!this.#isCurrentOpen(openGeneration))
		{
			return;
		}

		if (!result.isLoaded)
		{
			notifyError(result.errorMessage);

			return;
		}

		this.#onAfterHide = params.onAfterHide ?? null;

		const pinia = this.#ensurePinia();
		const store = useSharingStore(pinia);
		store.$reset();
		store.setObject(params.objectId, params.objectName);
		store.fill(result.snapshot);

		const container = this.#ensureDialog();

		if (this.#app === null)
		{
			this.#mount(container, pinia);
		}

		this.#dialog?.show();
	}

	close(): void
	{
		this.#openGeneration += 1;

		if (this.#dialog !== null)
		{
			this.#dialog.hide();

			return;
		}

		this.#reset();
	}

	// The dialog is built on the first opening and dropped again once it is hidden.
	#ensureDialog(): HTMLElement
	{
		if (this.#container !== null)
		{
			return this.#container;
		}

		const container: HTMLElement = Tag.render`<div class="${ScopeClass}__content"></div>`;
		this.#dialog = new Dialog({
			title: this.#getTitle(),
			content: container,
			hasOverlay: true,
			background: DialogBackground.vibrant,
			// every event of the dialog is declared as required, so the unused ones are stubbed here
			events: {
				onShow: () => {},
				onHide: () => {},
				onAfterShow: () => this.#markPopup(),
				onAfterHide: () => {
					const onAfterHide = this.#onAfterHide;
					this.#reset();
					onAfterHide?.();
				},
			},
		});
		this.#container = container;

		return container;
	}

	/**
	 * The dialog builds its own popup window, so the scope class is put on it after showing. The
	 * title of the dialog is drawn but never bound to the window, and the dialog has no option for
	 * an accessible name, so the name of the phrase goes straight onto the node.
	 */
	#markPopup(): void
	{
		const popup = this.#container?.closest<HTMLElement>('.popup-window');
		if (popup)
		{
			Dom.addClass(popup, ScopeClass);
			Dom.attr(popup, 'aria-label', this.#getTitle());
		}
	}

	#getTitle(): string
	{
		return Loc.getMessage('JS_DISK_SHARING_MEMBERS_POPUP_TITLE') ?? '';
	}

	// A dedicated Pinia keeps the popup state out of the host page.
	#ensurePinia(): Pinia
	{
		if (this.#pinia === null)
		{
			// mounting the app makes our instance the active one, so the page context is kept to be put back
			const previous = getActivePinia();
			this.#pinia = createPinia();

			if (previous !== undefined)
			{
				previousPinias.set(this.#pinia, previous);
			}
		}

		return this.#pinia;
	}

	#mount(container: HTMLElement, pinia: Pinia): void
	{
		const app = BitrixVue.createApp(App, { closeDialog: this.close.bind(this) });
		app.use(pinia);
		app.mount(container);
		this.#app = app;
	}

	#unmount(): void
	{
		if (this.#app !== null)
		{
			this.#app.unmount();
			this.#app = null;
		}

		if (this.#pinia !== null)
		{
			const pinia = this.#pinia;
			this.#pinia = null;
			disposePinia(pinia);
			disposedPinias.add(pinia);

			// a disposed instance must not stay the global context of the page, so the context goes
			// back down the chain: another popup may have disposed the one taken over directly
			if (getActivePinia() === pinia)
			{
				setActivePinia(findLivingPrevious(pinia));
			}
		}
	}

	#reset(): void
	{
		this.#openGeneration += 1;
		this.#unmount();
		this.#dialog = null;
		this.#container = null;
		this.#onAfterHide = null;
	}

	#isCurrentOpen(openGeneration: number): boolean
	{
		return this.#openGeneration === openGeneration;
	}
}
