import { Extension } from 'main.core';
import { Button, ButtonIcon, ButtonManager, ButtonSize } from 'ui.buttons';

import './vibecode-button.css';

export type VibecodeBrand = 'bitrix24' | 'alaio';

export class VibecodeButton
{
	#button: Button;

	constructor()
	{
		const settings = Extension.getSettings('vibecodeconnector.vibecode-button');
		const href = settings.get('href');
		const brand: VibecodeBrand = settings.get('brand') === 'alaio' ? 'alaio' : 'bitrix24';
		const brandName: string = settings.get('brandName') ?? '';

		this.#button = new Button({
			useAirDesign: true,
			link: href,
			text: brandName,
			icon: ButtonIcon.VIBECODE,
			size: ButtonSize.SMALL,
			className: 'vibecodeconnector-vibecode-button',
			dataset: { vibecodeBrand: brand, testid: 'vibecode-button' },
			props: { target: '_blank', rel: 'noopener noreferrer' },
		} as ConstructorParameters<typeof Button>[0]);
		this.#button.addClass('--ui-context-edge-dark');
		this.#button.startShimmer();
	}

	render(): HTMLElement
	{
		return this.#button.render();
	}

	setCollapsed(collapsed: boolean = true): this
	{
		this.#button.setCollapsed(collapsed);

		return this;
	}
}

function startServerButtonsShimmer(): void
{
	const selector = '.vibecodeconnector-vibecode-button[data-btn-uniqid]';
	const start = (node: HTMLAnchorElement): void => {
		if (node.querySelector('.ui-button__shimmer'))
		{
			return;
		}

		const button = ButtonManager.createFromNode(node);
		if (button instanceof Button)
		{
			button.startShimmer();
		}
	};

	const attachWithin = (root: ParentNode): void => {
		root.querySelectorAll<HTMLAnchorElement>(selector).forEach((node) => start(node));
	};

	attachWithin(document);
	new MutationObserver((mutations) => {
		mutations.forEach(({ addedNodes }) => {
			addedNodes.forEach((node) => {
				if (node instanceof Element)
				{
					if (node.matches(selector))
					{
						start(node as HTMLAnchorElement);
					}
					attachWithin(node);
				}
			});
		});
	}).observe(document.documentElement, { childList: true, subtree: true });
}

startServerButtonsShimmer();
