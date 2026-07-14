import { Tag, Loc, Dom, Extension } from 'main.core';
import { Dialog, DialogBackground } from 'ui.system.dialog';
import { BitrixVue } from 'ui.vue3';

import { RootApp } from './components';

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

	open(params = {}): void
	{
		this.#objectId = params.objectId;
		this.#uniqueCode = params.uniqueCode ?? null;
		this.#initialTab = params.initialTab ?? null;
		this.#mode = params.mode ?? 'default';
		this.#onAfterHide = params.onAfterHide ?? null;

		if (!this.#objectId)
		{
			throw new Error('SharingPopupDialog.open: objectId is required');
		}

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
						this.#runAfterHide();
						this.#reset();
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
		this.#dialog?.hide();
	}

	#mount(): void
	{
		this.#app = BitrixVue.createApp(RootApp, {
			objectId: this.#objectId,
			uniqueCode: this.#uniqueCode,
			initialTab: this.#initialTab,
			mode: this.#mode,
			closeDialog: this.close.bind(this),
		});
		this.#app.mount(this.#container);
	}

	#runAfterHide(): void
	{
		if (typeof this.#onAfterHide === 'function')
		{
			this.#onAfterHide();
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
			this.#mode = 'default';
		}
	}

	#reset(): void
	{
		this.#unmount();
		this.#dialog = null;
		this.#container = null;
		this.#objectId = null;
		this.#initialTab = null;
		this.#mode = 'default';
		this.#onAfterHide = null;
	}
}
