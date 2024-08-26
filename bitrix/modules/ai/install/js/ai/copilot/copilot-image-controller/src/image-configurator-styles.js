import { Tag, Loc, Event, Dom } from 'main.core';
import { BaseEvent, EventEmitter } from 'main.core.events';

import './css/image-configurator-styles.css';

type StyleItem = {
	title: string;
	value: string;
	classNameModifier: string;
}

const styleItems: StyleItem[] = [
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_NONE'),
		value: 'None',
		classNameModifier: 'none',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_CINEMATIC_DEFAULT'),
		value: 'cinematic-default',
		classNameModifier: 'cinematic-default',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_SAI_CINEMATIC'),
		value: 'sai-cinematic',
		classNameModifier: 'sai-cinematic',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_SAI_ENHANCE'),
		value: 'sai-enhance',
		classNameModifier: 'sai-enhance',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_SAI_LINE_ART'),
		value: 'sai-line art',
		classNameModifier: 'sai-line-art',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_SAI_PHOTOGRAPHIC'),
		value: 'sai-photographic',
		classNameModifier: 'sai-photographic',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_SAI_TEXTURE'),
		value: 'sai-texture',
		classNameModifier: 'sai-texture',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ADS_ADVERTISING'),
		value: 'ads-advertising',
		classNameModifier: 'ads-advertising',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ADS_AUTOMOTIVE'),
		value: 'ads-automotive',
		classNameModifier: 'ads-automotive',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ADS_CORPORATE'),
		value: 'ads-corporate',
		classNameModifier: 'ads-corporate',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ADS_FASHION_EDITORIAL'),
		value: 'ads-fashion editorial',
		classNameModifier: 'ads-fashion-editorial',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ADS_FOOD_PHOTOGRAPHY'),
		value: 'ads-food photography',
		classNameModifier: 'ads-food-photography',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ADS_LUXURY'),
		value: 'ads-luxury',
		classNameModifier: 'ads-luxury',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ADS_REAL_ESTATE'),
		value: 'ads-real-estate',
		classNameModifier: 'ads-real-estate',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ADS_RETAIL'),
		value: 'ads-retail',
		classNameModifier: 'ads-retail',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ABSTRACT'),
		value: 'artstyle-abstract',
		classNameModifier: 'artstyle-abstract',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ABSTRACT_EXPRESSIONISM'),
		value: 'artstyle-abstract expressionism',
		classNameModifier: 'artstyle-abstract-expressionism',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ART_DECO'),
		value: 'artstyle-art deco',
		classNameModifier: 'artstyle-art-deco',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_ART_NOUVEAU'),
		value: 'artstyle-art nouveau',
		classNameModifier: 'artstyle-art-nouveau',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_CONSTRUCTIVIST'),
		value: 'artstyle-constructivist',
		classNameModifier: 'artstyle-constructivist',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_CUBIST'),
		value: 'artstyle-cubist',
		classNameModifier: 'artstyle-cubist',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_EXPRESSIONIST'),
		value: 'artstyle-expressionist',
		classNameModifier: 'artstyle-expressionist',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_GRAFFITI'),
		value: 'artstyle-graffiti',
		classNameModifier: 'artstyle-graffiti',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_HYPERREALISM'),
		value: 'artstyle-hyperrealism',
		classNameModifier: 'artstyle-hyperrealism',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_IMPRESSIONIST'),
		value: 'artstyle-impressionist',
		classNameModifier: 'artstyle-impressionist',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_POINTILLISM'),
		value: 'artstyle-pointillism',
		classNameModifier: 'artstyle-pointillism',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_POP_ART'),
		value: 'artstyle-pop art',
		classNameModifier: 'artstyle-pop-art',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_PSYCHEDELIC'),
		value: 'artstyle-psychedelic',
		classNameModifier: 'artstyle-psychedelic',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_RENAISSANCE'),
		value: 'artstyle-renaissance',
		classNameModifier: 'artstyle-renaissance',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_STEAMPUNK'),
		value: 'artstyle-steampunk',
		classNameModifier: 'artstyle-steampunk',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_SURREALIST'),
		value: 'artstyle-surrealist',
		classNameModifier: 'artstyle-surrealist',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_TYPOGRAPHY'),
		value: 'artstyle-typography',
		classNameModifier: 'artstyle-typography',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_WATERCOLOR'),
		value: 'artstyle-watercolor',
		classNameModifier: 'artstyle-watercolor',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_MISK_MINIMALIST'),
		value: 'misc-minimalist',
		classNameModifier: 'misc-minimalist',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_PAPERCRAFT_COLLAGE'),
		value: 'papercraft-collage',
		classNameModifier: 'papercraft-collage',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_PAPERCRAFT_PAPERCUT_COLLAGE'),
		value: 'papercraft-papercut collage',
		classNameModifier: 'papercraft-papercut-collage',
	},
	{
		title: Loc.getMessage('AI_COPILOT_IMAGE_STYLE_PHOTO_HDR'),
		value: 'photo-hdr',
		classNameModifier: 'photo-hdr',
	},
];

const ImageConfiguratorStylesEvents = Object.freeze({
	select: 'select',
});

type renderStyleItemOptions = {
	value: string;
	title: string;
	classNameModifier: string;
}

export class ImageConfiguratorStyles extends EventEmitter
{
	#mainStylesCount: number = styleItems.length;
	#currentMainStylesCount: number = 9;
	#selectedStyle: string | null = null;
	#isExpanded: boolean = false;
	#styleList: HTMLElement | null = null;
	#container: HTMLElement | null = null;

	constructor(options)
	{
		super(options);

		this.#selectedStyle = styleItems[0].value;
		this.setEventNamespace('AI.Copilot.ImageConfiguratorStyles');
	}

	getSelectedStyle(): string
	{
		return this.#selectedStyle;
	}

	render(): HTMLElement
	{
		this.#container = Tag.render`
			<div class="ai__image-configurator-styles">
				${this.#renderHeader()}
				${this.#renderStylesList()}
			</div>
		`;

		requestAnimationFrame(() => {
			const styleListStyles = getComputedStyle(this.#styleList);
			const paddingTop = styleListStyles.getPropertyValue('padding-top');
			const paddingBottom = styleListStyles.getPropertyValue('padding-bottom');
			const padding = parseFloat(paddingTop) + parseFloat(paddingBottom);

			Dom.style(this.#styleList, 'height', `${this.#styleList.offsetHeight - padding + 4}px`);
		});

		return this.#container;
	}

	#renderHeader(): HTMLElement
	{
		const expandListBtn = this.#isShowExpandBtn() ? this.#renderExpandListBtn() : null;

		return Tag.render`
			<header class="ai__image-configurator-styles_header">
				<div
					class="ai__image-configurator-styles_title"
					title="${Loc.getMessage('AI_COPILOT_IMAGE_POPULAR_STYLES')}"
				>
					${Loc.getMessage('AI_COPILOT_IMAGE_POPULAR_STYLES')}
				</div>
				${expandListBtn}
			</header>
		`;
	}

	#isShowExpandBtn(): boolean
	{
		return this.#mainStylesCount > this.#currentMainStylesCount;
	}

	#renderExpandListBtn(): HTMLElement
	{
		const expandListBtn = Tag.render`
			<div
				class="ai__image-configurator-styles_all-styles"
				title="${Loc.getMessage('AI_COPILOT_IMAGE_ALL_STYLES')}"
			>
				${Loc.getMessage('AI_COPILOT_IMAGE_ALL_STYLES')}
			</div>
		`;

		Event.bind(expandListBtn, 'click', () => {
			this.#isExpanded = !this.#isExpanded;

			if (this.#isExpanded)
			{
				Dom.addClass(this.#styleList, '--expanded');
				this.#currentMainStylesCount = Object.values(styleItems).length;
				this.#styleList.innerHTML = '';
				this.#styleList.append(...this.#renderStyleItems());
			}
			else
			{
				Dom.removeClass(this.#styleList, '--expanded');
			}
		});

		return expandListBtn;
	}

	#renderStylesList(): HTMLElement
	{
		this.#styleList = Tag.render`
			<div class="ai__image-configurator-styles_list">
				${this.#renderStyleItems()}
			</div>
		`;

		return this.#styleList;
	}

	#renderStyleItems(): HTMLElement[]
	{
		return styleItems.slice(0, this.#currentMainStylesCount).map((styleItem) => {
			return this.#renderStyleItem(styleItem);
		});
	}

	#renderStyleItem(options: renderStyleItemOptions): HTMLElement
	{
		const radioButton = Tag.render`
			<input
				${options.value === this.#selectedStyle ? 'checked' : ''}
				id="${options.value}"
				name="ai__image-configurator-style"
				type="radio"
				class="ai__image-configurator-style_item-radio-btn"
			/>
		`;
		const item = Tag.render`
			<div title="${options.title}" class="ai__image-configurator-styles_item --style-${options.classNameModifier}">
				${radioButton}
				<label for="${options.value}" class="ai__image-configurator-styles_item-inner">
					<div class="ai__image-configurator-styles_item-title">${options.title}</div>
				</label>
			</div>
		`;

		Event.bind(radioButton, 'input', () => {
			this.#selectedStyle = options.value;
			this.emit(ImageConfiguratorStylesEvents.select, new BaseEvent({
				data: options.value,
			}));
		});

		return item;
	}
}
