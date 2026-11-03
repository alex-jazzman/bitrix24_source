import { Tag, Loc, Dom } from 'main.core';
import { PopupManager } from 'main.popup';
import { Dialog, DialogBackground } from 'ui.system.dialog';
import { BitrixVue } from 'ui.vue3';

import { RootApp } from './components';
import { getAccessRights } from './api';
import { notify } from './utils/notify';

import './style.css';

type PendingHide = {
	generation: number,
	callback: ?Function,
};

export class SharingPopupDialog
{
	#dialog = null;
	#app = null;
	#container = null;
	#objectId = null;
	#uniqueCode = null;
	#initialTab = null;
	#mode = 'default';
	#onAfterHide = null;
	#initialAccessRights = null;
	#openGeneration = 0;
	#pendingHide: ?PendingHide = null;
	// a close of the window is under way and its handler has not been called yet
	#hiding = false;

	async open(params = {}): Promise<void>
	{
		const openGeneration = ++this.#openGeneration;
		const objectId = params.objectId;
		const uniqueCode = params.uniqueCode ?? null;
		const initialTab = params.initialTab ?? null;
		const mode = params.mode ?? 'default';
		const onAfterHide = params.onAfterHide ?? null;

		if (!objectId)
		{
			throw new Error('SharingPopupDialog.open: objectId is required');
		}

		let initialAccessRights;
		try
		{
			initialAccessRights = await getAccessRights({
				objectId,
				uniqueCode,
			});
		}
		catch
		{
			if (this.#isCurrentOpen(openGeneration))
			{
				notify('DISK_SHARING_ACCESS_POPUP_NOTIFY_ERROR_MESSAGE');
			}

			return;
		}

		if (!this.#isCurrentOpen(openGeneration))
		{
			return;
		}

		if (this.#dialog && !this.#canShowDialog())
		{
			this.#discardDialog();

			// the handler of the discarded close may have opened the popup anew
			if (!this.#isCurrentOpen(openGeneration))
			{
				return;
			}
		}
		else if (this.#app)
		{
			// the application is rebuilt inside a window that stays where it is: style.css keeps the window in
			// the centre of the viewport on its own, so the content may change height without being repositioned
			this.#unmount();
		}

		this.#objectId = objectId;
		this.#uniqueCode = uniqueCode;
		this.#initialTab = initialTab;
		this.#mode = mode;
		this.#onAfterHide = onAfterHide;
		this.#initialAccessRights = initialAccessRights;

		if (!this.#dialog)
		{
			this.#container = Tag.render`<div class="disk-sharing-access-popup__content"></div>`;
			this.#dialog = new Dialog({
				title: Loc.getMessage('DISK_SHARING_ACCESS_POPUP_ACCESS_DIALOG_TITLE'),
				content: this.#container,
				width: 550,
				hasOverlay: true,
				background: DialogBackground.vibrant,
				events: {
					onAfterShow: () => this.#markPopup(),
					// every hide is seen here first: close(), the close button, the overlay and Esc alike
					onHide: () => this.#handleHide(),
					onAfterHide: () => this.#handleAfterHide(),
				},
			});
		}

		if (!this.#app)
		{
			this.#mount();
		}

		this.#dialog.show();
	}

	#findPopupNode(): ?HTMLElement
	{
		return this.#container?.closest('.popup-window') ?? null;
	}

	#markPopup(): void
	{
		const popup = this.#findPopupNode();
		if (popup)
		{
			Dom.addClass(popup, 'disk-sharing-access-popup');
			// the window belongs to main.popup and is built outside the application tree
			popup.dataset.testid = 'disk-sharing-access-popup';
		}
	}

	close(): void
	{
		if (this.#hiding)
		{
			// a hide is already under way and #pendingHide holds the debt of its close: asking for one more
			// would land a second handler of the caller on a single close
			return;
		}

		if (this.#dialog)
		{
			// the hide begins here and #handleHide() captures it, as it does for a hide of the dialog itself
			this.#dialog.hide();

			return;
		}

		// there is no window to hide, so the openings in flight are devalued here
		++this.#openGeneration;
		const callback = this.#onAfterHide;
		this.#reset();
		this.#runAfterHide(callback);
	}

	// a window that is closing shows nothing on show(), and a destroyed one is gone from the popup registry
	#canShowDialog(): boolean
	{
		if (this.#hiding)
		{
			return false;
		}

		const popupId = this.#findPopupNode()?.id;

		return Boolean(popupId) && PopupManager.getPopupById(popupId) !== null;
	}

	// the dialog is left behind for a new one: its close is settled here, so nothing of it lands on the next
	#discardDialog(): void
	{
		// a hide that began holds the debt of its close: the handler of the caller is still owed
		const pendingHide = this.#pendingHide;

		this.#dialog.unsubscribeAll();
		this.#pendingHide = null;
		this.#hiding = false;
		this.#reset();

		if (pendingHide)
		{
			this.#runAfterHide(pendingHide.callback);
		}
	}

	// the single place a hide is captured: the generation devalues the openings in flight and the handler
	// is taken before a new open() replaces it
	#handleHide(): void
	{
		this.#pendingHide ??= { generation: ++this.#openGeneration, callback: this.#onAfterHide };
		this.#hiding = true;
	}

	#handleAfterHide(): void
	{
		const pendingHide = this.#pendingHide;

		// a hide that was captured is settled once: a landing of a hide nobody started is nothing to settle
		if (!pendingHide)
		{
			return;
		}

		this.#pendingHide = null;
		this.#hiding = false;

		if (pendingHide.generation === this.#openGeneration)
		{
			this.#reset();
		}

		this.#runAfterHide(pendingHide.callback);
	}

	#mount(): void
	{
		this.#app = BitrixVue.createApp(RootApp, {
			objectId: this.#objectId,
			uniqueCode: this.#uniqueCode,
			initialTab: this.#initialTab,
			initialAccessRights: this.#initialAccessRights,
			mode: this.#mode,
			closeDialog: this.close.bind(this),
		});
		this.#app.mount(this.#container);
	}

	#runAfterHide(onAfterHide: ?Function): void
	{
		if (typeof onAfterHide === 'function')
		{
			onAfterHide();
		}
	}

	#unmount(): void
	{
		if (this.#app)
		{
			this.#app.unmount();
			this.#app = null;
			this.#uniqueCode = null;
			this.#initialTab = null;
			this.#initialAccessRights = null;
			this.#mode = 'default';
		}
	}

	// called after the app is unmounted, so unmounting still reaches its nodes; the release is explicit but
	// idempotent today: ui.system.dialog builds its popup with cacheable: false, so main.popup destroys the
	// window itself right after a close
	#destroyDialog(): void
	{
		const popupId = this.#findPopupNode()?.id;
		if (popupId)
		{
			// the dialog keeps its popup private, but the window node carries the popup id
			PopupManager.getPopupById(popupId)?.destroy();
		}

		this.#dialog = null;
		this.#container = null;
	}

	#reset(): void
	{
		// the generation is left alone: the start of the hide has already devalued the openings in flight,
		// and one more increment would cancel an opening started after the close
		this.#unmount();
		this.#destroyDialog();
		this.#objectId = null;
		this.#initialTab = null;
		this.#initialAccessRights = null;
		this.#mode = 'default';
		this.#onAfterHide = null;
	}

	#isCurrentOpen(openGeneration: number): boolean
	{
		return this.#openGeneration === openGeneration;
	}
}
