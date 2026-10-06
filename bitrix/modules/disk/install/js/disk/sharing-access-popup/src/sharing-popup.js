import { Tag, Loc, Dom } from 'main.core';
import { Dialog, DialogBackground } from 'ui.system.dialog';
import { BitrixVue } from 'ui.vue3';

import { RootApp } from './components';
import { getAccessRights } from './api';
import { notify } from './utils/notify';

import './style.css';

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
					onAfterHide: () => {
						const onAfterHide = this.#onAfterHide;
						this.#reset();
						this.#runAfterHide(onAfterHide);
					},
				},
			});
		}

		if (!this.#app)
		{
			this.#mount();
		}

		this.#dialog.show();
	}

	#markPopup(): void
	{
		const popup = this.#container?.closest('.popup-window');
		if (popup)
		{
			Dom.addClass(popup, 'disk-sharing-access-popup');
		}
	}

	close(): void
	{
		this.#openGeneration += 1;
		if (this.#dialog)
		{
			this.#dialog.hide();

			return;
		}

		this.#reset();
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

	#reset(): void
	{
		this.#openGeneration += 1;
		this.#unmount();
		this.#dialog = null;
		this.#container = null;
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
