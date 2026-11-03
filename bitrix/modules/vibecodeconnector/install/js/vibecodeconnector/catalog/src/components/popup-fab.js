import { Loc } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { bindAppCreation } from 'vibecodeconnector.app-creation';

import { getIconName } from '../utils/icons.js';
import { isEmbedCreateEnabled } from '../utils/links';

export type CatalogPopupFabOptions = {
	onCreateClosed?: () => void,
};

export class CatalogPopupFab
{
	#options: CatalogPopupFabOptions;
	#node: HTMLElement | null = null;
	#unbind: (() => void) | null = null;

	constructor(options: CatalogPopupFabOptions = {})
	{
		this.#options = options;
	}

	render(): HTMLElement
	{
		this.#node ??= this.#renderButton();

		return this.#node;
	}

	destroy(): void
	{
		this.#unbind?.();
		this.#unbind = null;
		this.#node = null;
	}

	#renderButton(): HTMLElement
	{
		const fab = new Button({
			className: 'vibecode-catalog__fab',
			size: ButtonSize.EXTRA_LARGE,
			useAirDesign: true,
			style: AirButtonStyle.TINTED,
			icon: getIconName('plus'),
			props: {
				type: 'button',
				'aria-label': Loc.getMessage(
					isEmbedCreateEnabled()
						? 'VIBECODECONNECTOR_CATALOG_CREATE_LABEL'
						: 'VIBECODECONNECTOR_CATALOG_ADD_APP_LABEL',
				),
			},
		}).render();

		this.#unbind = bindAppCreation(fab, {
			analytics: {
				tool: 'intranet',
				category: 'vibecode_catalog',
				c_section: 'fab',
			},
			onClose: () => this.#options.onCreateClosed?.(),
		});

		return fab;
	}
}
