import { Cache, Dom, Tag, Type } from 'main.core';
import { AirButtonStyle, Button, ButtonColor, ButtonTag } from 'ui.buttons';
import { FeaturePromotersRegistry } from 'ui.info-helper';
import type {
	ButtonConfig,
	MoreLinkConfig,
	SalePopupTemplateOptions,
	TextConfig,
	ResultContent,
	SalePopupTemplateItemConfig,
} from '../types/template';
import { BaseTemplate } from './base-template';

export class SaleTemplate extends BaseTemplate
{
	#cache = new Cache.MemoryCache();
	options: SalePopupTemplateOptions;
	#analyticsCallback: ?Function;

	constructor(options: SalePopupTemplateOptions = {})
	{
		super();
		this.options = options;
		this.#analyticsCallback = Type.isFunction(options.analyticsCallback) ? options.analyticsCallback : null;
	}

	getContent(): Array<ResultContent>
	{
		return this.#cache.remember('popup-content', () => {
			const content = [];

			this.options.items.forEach((item, index) => {
				const itemContent = this.#getItemContent(item);

				if (item.styles?.color)
				{
					Dom.style(itemContent, 'color', item.styles.color);
				}

				content.push({
					html: itemContent,
					background: item.styles?.background,
					margin: index === 0 ? '12px 0 0 0' : null,
					borderColor: item.styles?.borderColor,
				});
			});

			return content;
		});
	}

	#getItemContent(config: SalePopupTemplateItemConfig): HTMLElement
	{
		return Tag.render`
			<div class="ui-popupconstructor-content-item-wrapper --noflex">
				<div class="ui-popupconstructor-content-item-wrapper__header">
					<div class="ui-popupconstructor-content-item-wrapper-title">
						${config.icon ? this.#getIcon(config.icon) : null}
						${config.title ? this.#getTitle(config.title) : null}
					</div>
					<div class="ui-popupconstructor-content-item__header-button">
						${config.button ? this.#getButton(config.button) : null}
					</div>
				</div>
				<div>
					${config.description ? this.#getDescription(config.description) : null}
					${config.more ? this.#getMoreLink(config.more, config.button) : null}
				</div>
			</div>
		`;
	}

	#getTitle(config: TextConfig): HTMLElement
	{
		const title = Tag.render`
			<div class="ui-popupconstructor-content-item__title">${config.text}</div>
		`;

		this.#setTextStyles(title, config);

		return title;
	}

	#getIcon(config: Object): HTMLElement
	{
		const icon = Tag.render`
			<div class="ui-popupconstructor-content-item__icon ui-icon-set --${config.name}"></div>
		`;

		if (config.color)
		{
			Dom.style(icon, 'background-color', config.color);
		}

		return icon;
	}

	#getDescription(config: TextConfig): HTMLElement
	{
		const description = Tag.render`
			<div class="ui-popupconstructor-content-item__description">
				${config.text}
			</div>
		`;

		this.#setTextStyles(description, config);

		return description;
	}

	#getMoreLink(config: MoreLinkConfig, configMainButton: ButtonConfig): HTMLElement
	{
		const onclick = () => {
			if (config.code)
			{
				FeaturePromotersRegistry.getPromoter({
					code: config.code,
				}).show();
			}
			else if (config.articleId)
			{
				top.BX.Helper.show(`redirect=detail&code=${config.articleId}`);
			}

			if (this.#analyticsCallback)
			{
				this.#analyticsCallback('click-more', configMainButton.url);
			}
		};

		const moreLink = Tag.render`
			<div class="ui-popupconstructor-content-item__more-link" onclick="${onclick}">${config.text.text}</div>
		`;
		this.#setTextStyles(moreLink, config.text);

		return moreLink;
	}

	#getButton(config: ButtonConfig): HTMLElement
	{
		const buttonTag = config.target ? ButtonTag.BUTTON : ButtonTag.LINK;

		const button = new Button({
			text: config.text,
			size: Button.Size.EXTRA_SMALL,
			useAirDesign: true,
			style: config?.airStyle ?? AirButtonStyle.FILLED,
			color: ButtonColor.PRIMARY,
			noCaps: true,
			tag: buttonTag,
			link: config.target ? null : config.url,
			wide: true,
			events: {
				mousedown: () => {
					if (this.#analyticsCallback)
					{
						this.#analyticsCallback(config?.analyticsEvent ?? 'click-button', config.url);
					}
				},
			},
			onclick: () => {
				if (config.target)
				{
					window.open(config.url, config.target);
				}
			},
		});

		if (config.backgroundColor)
		{
			Dom.style(button.render(), 'background-color', config.backgroundColor);
			button.setColor(Button.Color.LIGHT);
		}

		return button.render();
	}

	#getButtonDescription(config: TextConfig): HTMLElement
	{
		const buttonDescription = Tag.render`
			<div class="ui-popupconstructor-content-item__button-description">
				${config.text}
			</div>
		`;

		this.#setTextStyles(buttonDescription, config);

		return buttonDescription;
	}

	#setTextStyles(element: HTMLElement, config: TextConfig): void
	{
		if (config.color)
		{
			Dom.style(element, 'color', config.color);
		}

		if (config.fontSize)
		{
			Dom.style(element, 'font-size', config.fontSize);
		}

		if (config.weight)
		{
			Dom.style(element, 'font-weight', config.weight);
		}
	}
}
