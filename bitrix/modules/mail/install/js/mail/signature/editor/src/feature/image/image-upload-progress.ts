import { Loc, Tag } from 'main.core';
import { Popup, type PopupOptions } from 'main.popup';
import { Loader } from 'ui.loader';

type ProgressPopup = {
	show(): void,
	destroy(): void,
};

type ProgressLoader = {
	render(): void,
	show(): void,
};

export type ImageUploadProgressOptions = {
	popupFactory?: (options: PopupOptions) => ProgressPopup,
	loaderFactory?: (target: HTMLElement) => ProgressLoader,
};

export class ImageUploadProgress
{
	#popupFactory: (options: PopupOptions) => ProgressPopup;
	#loaderFactory: (target: HTMLElement) => ProgressLoader;
	#popup: ProgressPopup | null = null;
	#container: HTMLElement | null = null;

	constructor(options: ImageUploadProgressOptions = {})
	{
		this.#popupFactory = options.popupFactory ?? ((popupOptions) => new Popup(popupOptions));
		this.#loaderFactory = options.loaderFactory ?? ((target) => new Loader({
			target,
			type: 'BULLET',
			size: 'S',
		}));
	}

	show(anchor: HTMLElement | null): void
	{
		this.destroy();
		if (!anchor?.isConnected)
		{
			return;
		}

		const loaderTarget = Tag.render`<span class="mail-signature-image-upload-progress__loader"></span>`;
		const container = Tag.render`
			<div
				class="mail-signature-image-upload-progress"
				role="status"
				aria-live="polite"
				aria-busy="true"
				data-testid="mail-signature-editor-image-upload-progress"
			>
				${loaderTarget}
				<span>${Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_UPLOADING') || ''}</span>
			</div>
		`;
		this.#container = container;
		const loader = this.#loaderFactory(loaderTarget);
		loader.render();
		loader.show();

		this.#popup = this.#popupFactory({
			bindElement: anchor,
			content: container,
			className: 'mail-signature-image-upload-progress-popup',
			closeIcon: false,
			closeByEsc: false,
			autoHide: false,
			overlay: false,
			focusTrap: false,
			cacheable: false,
			angle: true,
			padding: 0,
			contentPadding: 0,
		});
		this.#popup.show();
	}

	destroy(): void
	{
		this.#container?.setAttribute('aria-busy', 'false');
		this.#container = null;
		this.#popup?.destroy();
		this.#popup = null;
	}
}
