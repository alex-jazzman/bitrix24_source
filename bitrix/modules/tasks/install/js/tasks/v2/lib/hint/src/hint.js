import { Popup, PopupManager, PopupOptions } from 'main.popup';

export class Hint
{
	#delay: number = 2000;

	async showHint(options: PopupOptions): Promise<void>
	{
		this.#destroy(options.id);

		const baseOptions = {
			className: 'tasks-hint',
			background: 'var(--ui-color-bg-content-inapp)',
			angle: true,
			autoHide: true,
			autoHideHandler: () => true,
			cacheable: false,
			animation: 'fading',
			...options,
		};

		const popup = new Popup(baseOptions);

		popup.show();

		setTimeout(() => popup.close(), this.#delay);
	}

	#destroy(popupId: string): void
	{
		PopupManager.getPopupById(popupId)?.destroy();
	}
}
