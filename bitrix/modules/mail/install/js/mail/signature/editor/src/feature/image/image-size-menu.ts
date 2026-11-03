import { Dom, Loc, Type } from 'main.core';
import { Alert, AlertDesign } from 'ui.system.alert';
import { Menu, type MenuOptions } from 'ui.system.menu';

import { SignatureImageVariant } from '../../const/signature-image';
import {
	type SignatureImageDto,
	type SignatureImageVariantName,
} from '../../infrastructure/service/signature-image/types';

type SizeMenu = {
	show(bindElement: HTMLElement, options?: { viaKeyboard?: boolean }): void,
	close(): void,
	destroy(): void,
	getPopupContainer(): HTMLElement,
};

type SizeAlert = {
	render(): HTMLElement,
	destroy(): void,
};

type SizeMenuItem = {
	id: string,
	title: string,
	subtitle: string,
	onClick(): void,
};

type SizeMenuOptions = {
	ariaLabel: string,
	items: SizeMenuItem[],
	events: {
		onShow(): void,
		onClose(): void,
		onDestroy(): void,
	},
};

export type ImageSizeMenuOptions = {
	menuFactory?: (options: SizeMenuOptions) => SizeMenu,
	alertFactory?: (content: string) => SizeAlert,
};

export class ImageSizeMenu
{
	#menuFactory: (options: SizeMenuOptions) => SizeMenu;
	#alertFactory: (content: string) => SizeAlert;
	#menu: SizeMenu | null = null;
	#alert: SizeAlert | null = null;
	#resolve: ((variant: SignatureImageVariantName | null) => void) | null = null;
	#selection: SignatureImageVariantName | null = null;

	constructor(options: ImageSizeMenuOptions = {})
	{
		this.#menuFactory = options.menuFactory ?? ((menuOptions: SizeMenuOptions): SizeMenu => {
			return new Menu(menuOptions as unknown as MenuOptions) as SizeMenu;
		});
		this.#alertFactory = options.alertFactory ?? ((content: string): SizeAlert => {
			return new Alert({ design: AlertDesign.tintedWarning, content });
		});
	}

	choose(image: SignatureImageDto, anchor: HTMLElement | null): Promise<SignatureImageVariantName | null>
	{
		this.destroy();

		const bindElement = this.#resolveBindElement(anchor);
		if (!bindElement)
		{
			return Promise.resolve(null);
		}

		return new Promise((resolve) => {
			this.#resolve = resolve;
			this.#selection = null;
			this.#menu = this.#menuFactory({
				ariaLabel: Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_SIZE_MENU') || '',
				items: this.#buildItems(image),
				events: {
					onShow: (): void => this.#showGifAlert(image),
					onClose: (): void => this.#finish(this.#selection),
					onDestroy: (): void => this.#finish(null),
				},
			});
			this.#menu.show(bindElement);
		});
	}

	destroy(): void
	{
		const menu = this.#menu;
		this.#menu = null;
		this.#destroyAlert();
		this.#resolveSelection(null);
		menu?.destroy();
	}

	#buildItems(image: SignatureImageDto): SizeMenuItem[]
	{
		return [
			this.#buildItem(image, SignatureImageVariant.Small, 'MAIL_SIGNATURE_EDITOR_IMAGE_SIZE_SMALL'),
			this.#buildItem(image, SignatureImageVariant.Medium, 'MAIL_SIGNATURE_EDITOR_IMAGE_SIZE_MEDIUM'),
			this.#buildItem(image, SignatureImageVariant.Original, 'MAIL_SIGNATURE_EDITOR_IMAGE_SIZE_ORIGINAL'),
		];
	}

	#buildItem(image: SignatureImageDto, variant: SignatureImageVariantName, messageCode: string): SizeMenuItem
	{
		const width = this.#resolveWidth(image, variant);

		return {
			id: `mail-signature-editor-image-size-${variant}`,
			title: Loc.getMessage(messageCode) || '',
			subtitle: Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_SIZE_WIDTH', { '#WIDTH#': String(width) }) || '',
			onClick: (): void => {
				this.#selection = variant;
				this.#menu?.close();
			},
		};
	}

	#resolveWidth(image: SignatureImageDto, variant: SignatureImageVariantName): number
	{
		const width = image.variants[variant];
		if (!Type.isInteger(width) || width <= 0)
		{
			return image.width;
		}

		return Math.min(width, image.width);
	}

	#showGifAlert(image: SignatureImageDto): void
	{
		if (!image.animated || this.#alert || !this.#menu)
		{
			return;
		}

		this.#alert = this.#alertFactory(Loc.getMessage('MAIL_SIGNATURE_EDITOR_IMAGE_GIF_WARNING') || '');
		const container = this.#alert.render();
		container.setAttribute('role', 'status');
		container.setAttribute('aria-live', 'polite');
		container.setAttribute('aria-atomic', 'true');
		Dom.addClass(container, 'mail-signature-image-size-menu__gif-alert');
		Dom.prepend(container, this.#menu.getPopupContainer());
	}

	#finish(selection: SignatureImageVariantName | null): void
	{
		const menu = this.#menu;
		this.#menu = null;
		this.#destroyAlert();
		this.#resolveSelection(selection);
		menu?.destroy();
	}

	#destroyAlert(): void
	{
		this.#alert?.destroy();
		this.#alert = null;
	}

	#resolveSelection(selection: SignatureImageVariantName | null): void
	{
		const resolve = this.#resolve;
		this.#resolve = null;
		this.#selection = null;
		resolve?.(selection);
	}

	#resolveBindElement(anchor: HTMLElement | null): HTMLElement | null
	{
		const sourceMenu = anchor?.closest('[role="menu"]');
		const labelledBy = sourceMenu?.getAttribute('aria-labelledby')?.split(/\s+/) ?? [];
		for (const id of labelledBy)
		{
			const trigger = document.getElementById(id);
			if (trigger instanceof HTMLElement && trigger.isConnected)
			{
				return trigger;
			}
		}

		if (anchor?.isConnected)
		{
			return anchor;
		}

		const activeElement = document.activeElement;

		return activeElement instanceof HTMLElement
			&& activeElement !== document.body
			&& activeElement.isConnected
			? activeElement
			: null;
	}
}
