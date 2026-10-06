import { Tag, Type, Dom, Text } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { Icon, type IconOptions } from 'ui.icon-set.api.core';

import { Entity } from '../entity/entity';
import { TextNode } from '../common/text-node';
import { Animation } from '../common/animation';
import { TypeUtils } from '../common/type-utils';
import { encodeUrl } from '../common/encode-url';
import { isTagSelector } from './is-tag-selector';

import { type TagSelector } from './tag-selector';
import { type TagItemOptions } from './tag-item-options';
import { type TextNodeOptions } from '../common/text-node-options';
import { type AvatarOptions } from '../item/avatar-options';

export class TagItem
{
	id: string | number;
	entityId: string;
	entityType: string;
	title: TextNode | null = null;

	avatar: string | null = null;
	avatarOptions: AvatarOptions | null = null;
	maxWidth: number | null = null;
	textColor: string | null = null;
	bgColor: string | null = null;
	fontWeight: string | null = null;

	link: string | null = null;
	onclick: Function | null = null;
	clickable: boolean | null = null;

	deselectable: boolean | null = null;
	customData: Map<string, any>;

	cache = new MemoryCache<HTMLElement>();
	selector: TagSelector;
	rendered: boolean = false;

	constructor(selector: TagSelector, itemOptions: TagItemOptions)
	{
		if (!isTagSelector(selector))
		{
			throw new TypeError('TagSelector.TagItem: "selector" parameter is not an instance of TagSelector.');
		}

		const options: Partial<TagItemOptions> = Type.isPlainObject(itemOptions) ? itemOptions : {};
		if (!Type.isStringFilled(options.id) && !Type.isNumber(options.id))
		{
			throw new Error('TagSelector.TagItem: "id" parameter is required.');
		}

		if (!Type.isStringFilled(options.entityId))
		{
			throw new Error('TagSelector.TagItem: "entityId" parameter is required.');
		}

		this.selector = selector;
		this.id = options.id;
		this.entityId = options.entityId.toLowerCase();
		this.entityType = Type.isStringFilled(options.entityType) ? options.entityType : 'default';
		this.customData = TypeUtils.createMapFromOptions(options.customData);

		this.onclick = Type.isFunction(options.onclick) ? options.onclick : null;
		this.link = Type.isStringFilled(options.link) ? options.link : null;

		this.setTitle(options.title);
		this.setDeselectable(options.deselectable);

		this.setAvatar(options.avatar);
		this.setAvatarOptions(options.avatarOptions);
		this.setMaxWidth(options.maxWidth);
		this.setTextColor(options.textColor);
		this.setBgColor(options.bgColor);
		this.setFontWeight(options.fontWeight);
		this.setClickable(options.clickable);
	}

	getId(): string | number
	{
		return this.id!;
	}

	getEntityId(): string
	{
		return this.entityId!;
	}

	getEntityType(): string
	{
		return this.entityType;
	}

	getSelector(): TagSelector
	{
		return this.selector;
	}

	getTitle(): string
	{
		return this.getTitleNode() && !this.getTitleNode()!.isNullable() ? this.getTitleNode()!.getText()! : '';
	}

	getTitleNode(): TextNode | null
	{
		return this.title;
	}

	setTitle(title: string | TextNodeOptions | null | undefined): void
	{
		if (Type.isStringFilled(title) || Type.isPlainObject(title) || title === null)
		{
			this.title = title === null ? null : new TextNode(title);
		}
	}

	getAvatar(): string | null
	{
		if (this.avatar !== null)
		{
			return this.avatar;
		}

		if (this.getSelector().getTagAvatar() !== null)
		{
			return this.getSelector().getTagAvatar();
		}

		if (this.getEntityTagOption('avatar') !== null)
		{
			return this.getEntityTagOption('avatar');
		}

		return this.getEntityItemOption('avatar');
	}

	setAvatar(avatar: string | null | undefined): void
	{
		if (Type.isString(avatar) || avatar === null)
		{
			this.avatar = avatar;
		}
	}

	getAvatarOption(option: keyof AvatarOptions): string | boolean | number | null
	{
		if (this.avatarOptions !== null && !Type.isUndefined(this.avatarOptions[option]))
		{
			return this.avatarOptions[option];
		}

		const selectorAvatarOption = this.getSelector().getTagAvatarOption(option) as
			| Record<keyof AvatarOptions, string | boolean | number | null>
			| null
		;

		if (selectorAvatarOption !== null)
		{
			return selectorAvatarOption[option];
		}

		const entityTagAvatarOptions: Record<string, string | boolean | number | null> = this.getEntityTagOption('avatarOptions');
		if (Type.isPlainObject(entityTagAvatarOptions) && !Type.isUndefined(entityTagAvatarOptions[option]))
		{
			return entityTagAvatarOptions[option];
		}

		const entityItemAvatarOptions: Record<string, string | boolean | number | null> = this.getEntityItemOption('avatarOptions');
		if (Type.isPlainObject(entityItemAvatarOptions) && !Type.isUndefined(entityItemAvatarOptions[option]))
		{
			return entityItemAvatarOptions[option];
		}

		return null;
	}

	setAvatarOption(option: keyof AvatarOptions, value: string | boolean | number | null): void
	{
		if (Type.isStringFilled(option) && !Type.isUndefined(value))
		{
			if (this.avatarOptions === null)
			{
				this.avatarOptions = {};
			}

			(this.avatarOptions as Record<keyof AvatarOptions, string | boolean | number | null>)[option] = value;
		}
	}

	setAvatarOptions(options: AvatarOptions | null | undefined): void
	{
		if (Type.isPlainObject(options))
		{
			(Object.keys(options) as Array<keyof AvatarOptions>).forEach((option: keyof AvatarOptions) => {
				this.setAvatarOption(option, (options as Record<string, string | boolean | number | null>)[option]);
			});
		}
	}

	getTextColor(): string | null
	{
		if (this.textColor !== null)
		{
			return this.textColor;
		}

		if (this.getSelector().getTagTextColor() !== null)
		{
			return this.getSelector().getTagTextColor();
		}

		return this.getEntityTagOption('textColor');
	}

	setTextColor(textColor: string | null | undefined): void
	{
		if (Type.isString(textColor) || textColor === null)
		{
			this.textColor = textColor;
		}
	}

	getBgColor(): string | null
	{
		if (this.bgColor !== null)
		{
			return this.bgColor;
		}

		if (this.getSelector().getTagBgColor() !== null)
		{
			return this.getSelector().getTagBgColor();
		}

		return this.getEntityTagOption('bgColor');
	}

	setBgColor(bgColor: string | null | undefined): void
	{
		if (Type.isString(bgColor) || bgColor === null)
		{
			this.bgColor = bgColor;
		}
	}

	getFontWeight(): string | null
	{
		if (this.fontWeight !== null)
		{
			return this.fontWeight;
		}

		if (this.getSelector().getTagFontWeight() !== null)
		{
			return this.getSelector().getTagFontWeight();
		}

		return this.getEntityTagOption('fontWeight');
	}

	setFontWeight(fontWeight: string | null | undefined): void
	{
		if (Type.isString(fontWeight) || fontWeight === null)
		{
			this.fontWeight = fontWeight;
		}
	}

	getMaxWidth(): number | null
	{
		if (this.maxWidth !== null)
		{
			return this.maxWidth;
		}

		if (this.getSelector().getTagMaxWidth() !== null)
		{
			return this.getSelector().getTagMaxWidth();
		}

		return this.getEntityTagOption('maxWidth');
	}

	setMaxWidth(width: number | null | undefined): void
	{
		if ((Type.isNumber(width) && width >= 0) || width === null)
		{
			this.maxWidth = width;
		}
	}

	setDeselectable(flag: boolean | null | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.deselectable = flag;

			if (this.isRendered())
			{
				Dom.toggleClass(this.getContainer(), 'ui-tag-selector-tag-readonly', !flag);
			}
		}
	}

	isDeselectable(): boolean
	{
		if (this.getSelector().isReadonly())
		{
			return false;
		}

		return this.deselectable === null ? this.getSelector().isDeselectable() : this.deselectable!;
	}

	getCustomData(): Map<string, any>
	{
		return this.customData;
	}

	getLink(): string | null
	{
		return this.link;
	}

	getOnclick(): Function | null
	{
		return this.onclick;
	}

	setClickable(flag: boolean | null | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.clickable = flag;
		}
	}

	isClickable(): boolean
	{
		if (this.clickable !== null)
		{
			return this.clickable;
		}

		if (this.getSelector().getTagClickable() !== null)
		{
			return this.getSelector().getTagClickable()!;
		}

		if (this.getEntityTagOption('clickable') !== null)
		{
			return this.getEntityTagOption('clickable');
		}

		if (this.getEntityItemOption('clickable') !== null)
		{
			return this.getEntityItemOption('clickable');
		}

		return false;
	}

	render(): void
	{
		const titleNode = this.getTitleNode();
		if (titleNode)
		{
			titleNode.renderTo(this.getTitleContainer());

			const title = this.getTitleContainer().textContent;
			this.getContentContainer().setAttribute('title', TagItem.#sanitizeTitle(title!));
		}
		else
		{
			this.getTitleContainer().textContent = '';
			Dom.attr(this.getContentContainer(), 'title', null);
		}

		const avatar = this.getAvatar();
		const bgImage = this.getAvatarOption('bgImage');
		if (Type.isStringFilled(avatar))
		{
			Dom.style(this.getAvatarContainer(), 'background-image', `url('${encodeUrl(avatar)}')`);
		}
		else
		{
			Dom.style(this.getAvatarContainer(), 'background-image', bgImage as string | number | null);
		}

		const bgColor = this.getAvatarOption('bgColor');
		const bgSize = this.getAvatarOption('bgSize');
		const border = this.getAvatarOption('border');
		const borderRadius = this.getAvatarOption('borderRadius');
		const outline = this.getAvatarOption('outline');
		const outlineOffset = this.getAvatarOption('outlineOffset');

		Dom.clean(this.getAvatarContainer());
		Dom.style(this.getAvatarContainer(), 'background-color', bgColor as string | number | null);
		Dom.style(this.getAvatarContainer(), 'background-size', bgSize as string | number | null);
		Dom.style(this.getAvatarContainer(), 'border', border as string | number | null);
		Dom.style(this.getAvatarContainer(), 'border-radius', borderRadius as string | number | null);
		Dom.style(this.getAvatarContainer(), 'outline', outline as string | number | null);
		Dom.style(this.getAvatarContainer(), 'outline-offset', outlineOffset as string | number | null);

		const icon = {
			icon: this.getAvatarOption('icon'),
			size: bgSize ?? undefined,
			color: this.getAvatarOption('iconColor') ?? undefined,
		} as IconOptions;

		if (Icon.isValid(icon))
		{
			Dom.style(this.getAvatarContainer(), 'background-image', 'none');
			Dom.append(new Icon(icon).render(), this.getAvatarContainer());
		}

		const hasAvatar = (
			avatar || (bgColor && bgColor !== 'none') || (bgImage && bgImage !== 'none') || Icon.isValid(icon)
		);

		if (hasAvatar)
		{
			Dom.addClass(this.getContainer(), 'ui-tag-selector-tag--has-avatar');
		}
		else
		{
			Dom.removeClass(this.getContainer(), 'ui-tag-selector-tag--has-avatar');
		}

		const maxWidth = this.getMaxWidth();
		if ((maxWidth as number) > 0)
		{
			Dom.style(this.getContainer(), 'max-width', `${maxWidth}px`);
		}
		else
		{
			Dom.style(this.getContainer(), 'max-width', null);
		}

		if (this.isDeselectable())
		{
			Dom.removeClass(this.getContainer(), 'ui-tag-selector-tag-readonly');
		}
		else
		{
			Dom.addClass(this.getContainer(), 'ui-tag-selector-tag-readonly');
		}

		Dom.style(this.getTitleContainer(), 'color', this.getTextColor());
		Dom.style(this.getTitleContainer(), 'font-weight', this.getFontWeight());
		Dom.style(this.getContainer(), 'background-color', this.getBgColor());

		this.rendered = true;
	}

	static #sanitizeTitle(text: string): string
	{
		return text
			.replaceAll(/[\t ]+/gm, ' ')
			.replaceAll(/\n+/gm, '\n')
			.trim();
	}

	getContainer(): HTMLElement
	{
		return this.cache.remember('container', () => {
			return Tag.render`
				<div
					class="ui-tag-selector-item ui-tag-selector-tag"
					onkeydown="${this.handleKeyDown.bind(this)}"
					data-testid="ui-tag-selector-tag-${this.getEntityId()}-${this.getId()}"
				>
					${this.getContentContainer()}
					${this.getRemoveIcon()}
				</div>
			`;
		});
	}

	getContentContainer(): HTMLElement
	{
		return this.cache.remember('content-container', () => {
			if (Type.isStringFilled(this.getLink()))
			{
				return Tag.render`
					<a
						class="ui-tag-selector-tag-content"
						onclick="${this.handleContainerClick.bind(this)}"
						href="${this.getLink()}"
						target="_blank"
					>
						${this.getAvatarContainer()}
						${this.getTitleContainer()}
					</a>
				`;
			}

			const className = (
				this.isClickable() || this.getOnclick() !== null ? ' ui-tag-selector-tag-content--clickable' : ''
			);

			return Tag.render`
				<button
					type="button"
					tabindex="-1"
					class="ui-tag-selector-tag-content${className}"
					onclick="${this.handleContainerClick.bind(this)}"
				>
					${this.getAvatarContainer()}
					${this.getTitleContainer()}
				</button>
			`;
		});
	}

	getAvatarContainer(): HTMLElement
	{
		return this.cache.remember('avatar', () => {
			return Tag.render`
				<div class="ui-tag-selector-tag-avatar"></div>
			`;
		});
	}

	getTitleContainer(): HTMLElement
	{
		return this.cache.remember('title', () => {
			return Tag.render`
				<div class="ui-tag-selector-tag-title"></div>
			`;
		});
	}

	getRemoveIcon(): HTMLElement
	{
		return this.cache.remember('remove-icon', () => {
			return Tag.render`
				<div
					class="ui-tag-selector-tag-remove ui-icon-set__scope"
					onclick="${this.handleRemoveIconClick.bind(this)}"
					aria-hidden="true"
					data-testid="ui-tag-selector-remove-item-button"
					data-item-entity-id="${Text.encode(this.getEntityId())}"
					data-item-id="${Text.encode(this.getId() as string)}"
				></div>
			`;
		});
	}

	getEntityTagOption(option: string): any
	{
		return Entity.getTagOption(this.getEntityId(), option, this.getEntityType());
	}

	getEntityItemOption(option: string): any
	{
		return Entity.getItemOption(this.getEntityId(), option, this.getEntityType());
	}

	isRendered(): boolean
	{
		return this.rendered && this.getSelector() && this.getSelector().isRendered();
	}

	remove(animate: boolean = true): Promise<void>
	{
		if (!animate)
		{
			Dom.remove(this.getContainer());

			return Promise.resolve();
		}

		return new Promise<void>((resolve) => {
			Dom.style(this.getContainer(), 'width', `${this.getContainer().offsetWidth}px`);
			Dom.addClass(this.getContainer(), 'ui-tag-selector-tag--remove');
			Animation.handleAnimationEnd(this.getContainer(), 'ui-tag-selector-tag-remove')
				.then(() => {
					Dom.remove(this.getContainer());
					resolve();
				})
				.catch(() => {
					// Fail silently
				});
		});
	}

	show(): Promise<void>
	{
		return new Promise<void>((resolve) => {
			Dom.addClass(this.getContainer(), 'ui-tag-selector-tag--show');
			Animation.handleAnimationEnd(this.getContainer(), 'ui-tag-selector-tag-show')
				.then(() => {
					Dom.removeClass(this.getContainer(), 'ui-tag-selector-tag--show');
					resolve();
				})
				.catch(() => {
					// Fail silently
				});
		});
	}

	handleContainerClick(): void
	{
		const fn = this.getOnclick();
		if (Type.isFunction(fn))
		{
			fn(this);
		}

		const selector = this.getSelector();
		selector.emit('TagItem:onClick', { item: this });
	}

	handleRemoveIconClick(event: MouseEvent): void
	{
		event.stopPropagation();
		if (this.isDeselectable())
		{
			this.getSelector().removeTag(this);
		}
	}

	handleKeyDown(event: KeyboardEvent): void
	{
		if ((event.key === 'Delete' || event.key === 'Backspace') && this.isDeselectable())
		{
			this.getSelector().removeTag(this);
			event.stopPropagation();
			// Backspace outside an editable element triggers history-back navigation in WebKit.
			event.preventDefault();
		}
	}
}
