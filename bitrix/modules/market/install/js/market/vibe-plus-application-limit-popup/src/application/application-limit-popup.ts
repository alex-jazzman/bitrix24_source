import { Tag, Type } from 'main.core';
import { Popup } from 'main.popup';
import { BitrixVue } from 'ui.vue3';

import { ApplicationLimitPopupComponent } from '../component/application-limit-popup/application-limit-popup';
import {
	createApplicationLimitPreviewAction,
	type ApplicationLimitAction,
	type ApplicationLimitDto,
} from '../model/application-limit/types';

type ShowOptions = {
	onAction: (action: ApplicationLimitAction) => void,
	onClose?: () => void,
};

export class ApplicationLimitPopup
{
	#popup: Popup | null = null;
	#application: any = null;
	#closeCallbacks: Set<Function> = new Set();

	show(dto: ApplicationLimitDto, options: ShowOptions): boolean
	{
		if (this.#popup?.isShown())
		{
			if (Type.isFunction(options.onClose))
			{
				this.#closeCallbacks.add(options.onClose);
			}

			return true;
		}

		if (Type.isFunction(options.onClose))
		{
			this.#closeCallbacks.add(options.onClose);
		}

		const mountPoint = Tag.render`<div class="market-vibe-plus-application-limit-popup-mount"></div>`;
		this.#application = BitrixVue.createApp(ApplicationLimitPopupComponent, {
			dto,
			onAction: options.onAction,
			onClose: () => this.close(),
		});
		this.#application.mount(mountPoint);

		this.#popup = new Popup({
			id: 'market-vibe-plus-application-limit-popup',
			className: 'market-vibe-plus-application-limit-popup-window',
			content: mountPoint,
			width: Math.min(905, document.documentElement.clientWidth - 32),
			contentNoPaddings: true,
			borderRadius: '24px',
			contentBorderRadius: '24px',
			background: 'transparent',
			contentBackground: 'transparent',
			overlay: {
				backgroundColor: '#000000',
				opacity: 50,
				blur: '0',
			},
			fixed: true,
			closeByEsc: true,
			autoHide: false,
			closeIcon: false,
			cacheable: false,
			disableScroll: true,
			ariaLabelledBy: 'market-vibe-plus-application-limit-popup-title',
			focusTrap: {
				initialFocus: ['[data-autofocus]', 'first-tabbable', 'container'],
				restoreFocus: true,
			},
			events: {
				onAfterClose: () => this.#handleAfterClose(),
			},
		});
		this.#popup.show();

		return true;
	}

	showPreview(dto: ApplicationLimitDto): boolean
	{
		return this.show(dto, {
			onAction: createApplicationLimitPreviewAction(() => this.close()),
		});
	}

	close(): void
	{
		this.#popup?.close();
	}

	#handleAfterClose(): void
	{
		this.#application?.unmount();
		this.#application = null;
		this.#popup = null;

		const callbacks = [...this.#closeCallbacks];
		this.#closeCallbacks.clear();
		callbacks.forEach((callback) => callback());
	}
}
