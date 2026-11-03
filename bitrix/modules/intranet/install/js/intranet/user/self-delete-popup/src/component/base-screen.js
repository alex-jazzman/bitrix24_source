import { Dom, Loc, Tag, Text as MainCoreText } from 'main.core';
import { AirButtonStyle, Button, ButtonSize } from 'ui.buttons';
import { Icon, IconHoverMode, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';
import { Headline, Text as TypographyText } from 'ui.system.typography';

import { SelfDeletePopupElementId } from '../const';

export class BaseScreen
{
	#options = {};
	#actions = {};

	constructor(options, actions)
	{
		this.#options = options;
		this.#actions = actions;
	}

	render(): { content: HTMLElement }
	{
		const closeIcon = new Icon({
			icon: Outline.CROSS_L,
			size: 24,
			hoverMode: IconHoverMode.DEFAULT,
		});

		const descriptionNode = Tag.render`
			<div class="intranet-self-delete-popup__description">
				${Headline.render(this.getTitle(), {
					size: 'lg',
					className: 'intranet-self-delete-popup__title',
				})}
			</div>
		`;

		const contentNode = Tag.render`
			<div class="intranet-self-delete-popup__content"></div>
		`;

		const content = Tag.render`
			<div class="intranet-self-delete-popup">
				<button
					id="${SelfDeletePopupElementId.CloseButton}"
					type="button"
					class="intranet-self-delete-popup__close-btn"
					aria-label="${MainCoreText.encode(Loc.getMessage('INTRANET_SELF_DELETE_POPUP_CANCEL') ?? 'INTRANET_SELF_DELETE_POPUP_CANCEL')}"
					data-testid="${SelfDeletePopupElementId.CloseButton}"
					onclick="${() => this.getActions().cancel()}"
				>
					${closeIcon.render()}
				</button>
				<div class="intranet-self-delete-popup__hero">
					${descriptionNode}
				</div>
				${contentNode}
			</div>
		`;

		const buttons = this.getButtons();

		this.renderDescription().forEach((descriptionItem) => descriptionNode?.append(descriptionItem));

		const body = this.renderBody();

		if (body)
		{
			contentNode?.append(body);
		}
		else if (contentNode)
		{
			Dom.addClass(contentNode, '--empty');
		}

		if (buttons.length > 0)
		{
			const footerButtonsNode = Tag.render`
				<div class="intranet-self-delete-popup__footer-buttons" data-role="footer-buttons"></div>
			`;
			const footer = Tag.render`
				<div class="intranet-self-delete-popup__footer">
					${footerButtonsNode}
				</div>
			`;

			buttons.forEach((button) => {
				Dom.append(button.render(), footerButtonsNode);
			});

			Dom.append(footer, content);
		}

		return {
			content,
		};
	}

	getOptions(): Object
	{
		return this.#options;
	}

	getActions(): Object
	{
		return this.#actions;
	}

	createParagraph(message): HTMLElement
	{
		return TypographyText.render(message, {
			tag: 'p',
			size: 'md',
			className: 'intranet-self-delete-popup__paragraph',
		});
	}

	createButton(config): Button
	{
		const className = [
			'intranet-self-delete-popup__button',
			config.className ?? '',
		].filter(Boolean).join(' ');

		const button = new Button({
			text: config.text,
			useAirDesign: true,
			style: config.style,
			size: ButtonSize.MEDIUM,
			className,
			noCaps: true,
			disabled: config.disabled ?? false,
			props: config.id ? { id: config.id } : {},
			dataset: config.id ? { testid: config.id } : {},
			onclick: () => config.onClick(button),
		});

		return button;
	}

	renderDescription(): Array<HTMLElement>
	{
		return this.getDescriptionMessages().map((message) => this.createParagraph(message));
	}

	renderBody(): ?HTMLElement
	{
		return null;
	}

	getTitle(): string
	{
		throw new Error('BaseScreen.getTitle must be implemented');
	}

	getDescriptionMessages(): Array<string>
	{
		throw new Error('BaseScreen.getDescriptionMessages must be implemented');
	}

	getButtons(): Array<Button>
	{
		throw new Error('BaseScreen.getButtons must be implemented');
	}

	getFilledButtonStyle(): string
	{
		return AirButtonStyle.FILLED;
	}

	getOutlineButtonStyle(): string
	{
		return AirButtonStyle.OUTLINE_NO_ACCENT;
	}
}
