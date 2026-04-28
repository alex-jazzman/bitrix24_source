import { Tag, Dom, Type, Text, Loc, Event } from 'main.core';
import { Text as TextElement } from 'ui.system.typography';
import { Icon, Outline } from 'ui.icon-set.api.core';

import 'ui.icon-set.outline';

import { AlertDesign } from './alert-design';

import './alert.css';

export type AlertOptions = {
	design?: AlertDesign;
	hasCloseButton?: boolean;
	leftImage?: string | null;
	content?: HTMLElement | string;
	events?: {
		closeButtonClick?: (() => void) | null;
	},
}

type AlertContainerRefs = {
	root: HTMLElement;
	content: HTMLElement;
}

export class Alert
{
	#design: string;
	#leftImage: ?string;
	#hasCloseButton: boolean;
	#content: HTMLElement | string | null;
	#container: ?AlertContainerRefs;
	#onCloseButtonClick: ?(() => void);
	#closeButton: ?HTMLElement;

	constructor(options: AlertOptions = {})
	{
		this.#design = AlertDesign.tinted;
		if (options.design)
		{
			this.design = options.design;
		}
		this.#hasCloseButton = options.hasCloseButton === true;
		this.#content = options.content || null;
		this.#leftImage = options.leftImage || null;
		this.#onCloseButtonClick = options.events?.closeButtonClick || null;
	}

	render(): HTMLElement
	{
		if (this.#container)
		{
			return this.#container.root;
		}

		this.#container = Tag.render`
			<div class="ui-system-alert ui-system-alert__scope">
				<div class="ui-system-alert-inner">
					<div class="ui-system-alert__left-image"></div>
					<div ref="content" class="ui-system-alert__content"></div>
				</div>
			</div>
		`;

		this.design = this.#design;
		this.leftImage = this.#leftImage;
		this.hasCloseButton = this.#hasCloseButton;
		this.content = this.#content;

		return this.#container.root;
	}

	destroy(): void
	{
		if (this.#closeButton && this.#onCloseButtonClick)
		{
			Event.unbind(this.#closeButton, 'click', this.#onCloseButtonClick);
		}

		if (this.#container?.root)
		{
			Dom.remove(this.#container.root);
		}

		this.#closeButton = null;
		this.#container = null;
		this.#content = null;
		this.#onCloseButtonClick = null;
	}

	get content(): HTMLElement | string | null
	{
		return this.#content;
	}

	set content(content: HTMLElement | string)
	{
		if (this.#container)
		{
			this.#container.content.innerHTML = '';

			if (Type.isString(content))
			{
				Dom.append(TextElement.render(content, { size: '2xs' }), this.#container.content);
			}
			else if (Type.isDomNode(content))
			{
				Dom.append(content, this.#container.content);
			}
		}

		this.#content = content;
	}

	get design(): string
	{
		return this.#design;
	}

	set design(design: string)
	{
		if (!Object.values(AlertDesign).includes(design))
		{
			return;
		}

		this.#updateContainerDesignClassname(design);

		this.#design = design;
	}

	get leftImage(): ?string
	{
		return this.#leftImage;
	}

	set leftImage(image: ?string)
	{
		if (this.#container?.root)
		{
			if (image)
			{
				Dom.style(this.#container.root, '--ui-alert-left-image', `url(${Text.encode(image)})`);
				Dom.addClass(this.#container.root, '--has-left-image');
			}
			else
			{
				Dom.style(this.#container.root, '--ui-alert-left-image', 'none');
				Dom.removeClass(this.#container.root, '--has-left-image');
			}
		}

		this.#leftImage = image;
	}

	get hasCloseButton(): boolean
	{
		return this.#hasCloseButton;
	}

	set hasCloseButton(value: boolean)
	{
		if (this.#container?.root)
		{
			if (value === true)
			{
				if (!this.#closeButton)
				{
					this.#closeButton = this.#renderCloseButton();
				}

				Dom.append(this.#closeButton, this.#container.root);
				Dom.addClass(this.#container.root, '--has-close-button');
			}
			else
			{
				if (this.#closeButton)
				{
					Dom.remove(this.#closeButton);
				}

				Dom.removeClass(this.#container.root, '--has-close-button');
			}
		}

		this.#hasCloseButton = value === true;
	}

	get onClose(): ?(() => void)
	{
		return this.#onCloseButtonClick;
	}

	set onClose(callback: ?(() => void))
	{
		if (this.#closeButton && this.#onCloseButtonClick)
		{
			Event.unbind(this.#closeButton, 'click', this.#onCloseButtonClick);
		}

		this.#onCloseButtonClick = Type.isFunction(callback) ? callback : null;

		if (this.#closeButton && this.#onCloseButtonClick)
		{
			Event.bind(this.#closeButton, 'click', this.#onCloseButtonClick);
		}
	}

	get container(): ?HTMLElement
	{
		return this.#container?.root || null;
	}

	#updateContainerDesignClassname(design: string): void
	{
		if (this.#container?.root)
		{
			Dom.removeClass(this.#container.root, `--${this.#design}`);
			Dom.addClass(this.#container.root, `--${design}`);
		}
	}

	#renderCloseButton(): HTMLElement
	{
		const icon = new Icon({
			icon: Outline.CROSS_S,
			size: 24,
		});

		const button = Tag.render`
			<button
				class="ui-system-alert__close-button --ui-hoverable"
				aria-label="${Text.encode(Loc.getMessage('UI_SYSTEM_ALERT_CLOSE_BUTTON_LABEL_ARIA'))}"
				title="${Text.encode(Loc.getMessage('UI_SYSTEM_ALERT_CLOSE_BUTTON_LABEL_ARIA'))}"
			>${icon.render()}</button>
		`;

		if (this.#onCloseButtonClick)
		{
			Event.bind(button, 'click', this.#onCloseButtonClick);
		}

		return button;
	}
}
