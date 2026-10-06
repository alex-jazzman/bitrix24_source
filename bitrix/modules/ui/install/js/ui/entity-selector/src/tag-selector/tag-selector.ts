import { Dom, Tag, Text, Type, Loc, Browser } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { EventEmitter, BaseEvent } from 'main.core.events';
import { FocusKeys, FocusNavigator, FocusZone, type FocusZoneOptions } from 'ui.a11y';

import 'ui.icon-set.outline';

import { createDialog } from '../dialog/create-dialog';
import { TagItem } from './tag-item';

import { type Dialog } from '../dialog/dialog';
import { type TagSelectorOptions } from './tag-selector-options';
import { type ItemOptions } from '../item/item-options';
import { type TagItemOptions } from './tag-item-options';
import { type AvatarOptions } from '../item/avatar-options';

/**
 * @memberof BX.UI.EntitySelector
 */
export class TagSelector extends EventEmitter
{
	id: string;
	tags: TagItem[] = [];
	cache = new MemoryCache<HTMLElement>();
	rendered: boolean = false;

	multiple: boolean = true;
	readonly: boolean = false;
	locked: boolean = false;
	deselectable: boolean = true;

	addButtonCaption: string | null = null;
	addButtonCaptionMore: string | null = null;
	createButtonCaption: string | null = null;
	addButtonVisible: boolean = true;
	createButtonVisible: boolean = false;
	textBoxVisible: boolean = false;
	textBoxWidth: string | number | null = null;
	maxHeight: number | null = null;

	placeholder: string = '';
	textBoxAutoHide: boolean = false;
	textBoxOldValue = '';

	tagAvatar: string | null = null;
	tagAvatarOptions: AvatarOptions | null = null;
	tagTextColor: string | null = null;
	tagBgColor: string | null = null;
	tagFontWeight: string | null = null;
	tagMaxWidth: number | null = null;
	tagClickable: boolean | null = null;

	dialog: Dialog | null = null;
	focusZone: FocusZone | null = null;
	focusZoneOptions: Partial<FocusZoneOptions> = {};

	constructor(selectorOptions: TagSelectorOptions)
	{
		super();
		this.setEventNamespace('BX.UI.EntitySelector.TagSelector');

		const options = Type.isPlainObject(selectorOptions) ? selectorOptions : {};
		this.id = Type.isStringFilled(options.id) ? options.id : `ui-tag-selector-${Text.getRandom().toLowerCase()}`;
		this.multiple = Type.isBoolean(options.multiple) ? options.multiple : true;

		this.addButtonVisible = options.showAddButton !== false;
		this.createButtonVisible = options.showCreateButton === true;
		this.textBoxVisible = options.showTextBox === true;
		this.focusZoneOptions = Type.isPlainObject(options.focusZoneOptions) ? options.focusZoneOptions : {};

		this.setReadonly(options.readonly);
		this.setLocked(options.locked);
		this.setAddButtonCaption(options.addButtonCaption);
		this.setAddButtonCaptionMore(options.addButtonCaptionMore);
		this.setCreateButtonCaption(options.createButtonCaption);
		this.setPlaceholder(options.placeholder);
		this.setTextBoxAutoHide(options.textBoxAutoHide);
		this.setTextBoxWidth(options.textBoxWidth);
		this.setDeselectable(options.deselectable);
		this.setMaxHeight(options.maxHeight);

		this.setTagAvatar(options.tagAvatar);
		this.setTagAvatarOptions(options.tagAvatarOptions);
		this.setTagMaxWidth(options.tagMaxWidth);
		this.setTagTextColor(options.tagTextColor);
		this.setTagBgColor(options.tagBgColor);
		this.setTagFontWeight(options.tagFontWeight);
		this.setTagClickable(options.tagClickable);

		if (Type.isPlainObject(options.dialogOptions))
		{
			let selectedItems: Array<TagItemOptions | ItemOptions> = Type.isArray(options.items) ? options.items : [];
			if (Type.isArray(options.dialogOptions.selectedItems))
			{
				selectedItems = selectedItems.concat(options.dialogOptions.selectedItems);
			}

			const dialogOptions = Object.assign({}, options.dialogOptions, {
				tagSelectorOptions: null,
				selectedItems,
				multiple: this.isMultiple(),
				tagSelector: this,
			});

			createDialog(dialogOptions);
		}
		else if (Type.isArray(options.items))
		{
			for (const item of options.items)
			{
				this.addTag(item);
			}
		}

		this.subscribeFromOptions(options.events!);
	}

	getDialog(): Dialog | null
	{
		return this.dialog;
	}

	/**
	 * @internal
	 * @param dialog
	 */
	setDialog(dialog: Dialog | null): void
	{
		if (this.dialog === dialog)
		{
			return;
		}

		this.dialog?.unsubscribe('onShow', this.#handleDialogShowA11y);
		this.dialog?.unsubscribe('onHide', this.#handleDialogHideA11y);

		this.dialog = dialog;

		if (dialog === null)
		{
			return;
		}

		Dom.attr(this.getTextBox(), 'aria-expanded', 'false');
		Dom.attr(this.getTextBox(), 'aria-autocomplete', 'list');
		Dom.attr(this.getAddButtonLink(), 'aria-haspopup', 'dialog');
		Dom.attr(this.getAddButtonLink(), 'aria-expanded', 'false');

		dialog.subscribe('onShow', this.#handleDialogShowA11y);
		dialog.subscribe('onHide', this.#handleDialogHideA11y);
	}

	#handleDialogShowA11y = (): void => {
		Dom.attr(this.getTextBox(), 'aria-expanded', 'true');
		Dom.attr(this.getAddButtonLink(), 'aria-expanded', 'true');
	};

	#handleDialogHideA11y = (): void => {
		Dom.attr(this.getTextBox(), 'aria-expanded', 'false');
		Dom.attr(this.getAddButtonLink(), 'aria-expanded', 'false');
	};

	setReadonly(flag: boolean | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.readonly = flag;

			if (this.isRendered())
			{
				if (flag)
				{
					Dom.addClass(this.getOuterContainer(), 'ui-tag-selector-container-readonly');
				}
				else
				{
					Dom.removeClass(this.getOuterContainer(), 'ui-tag-selector-container-readonly');
				}
			}

			this.toggleFocusZone();
		}
	}

	isReadonly(): boolean
	{
		return this.readonly;
	}

	setLocked(flag: boolean | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.locked = flag;

			if (flag)
			{
				Dom.addClass(this.getOuterContainer(), 'ui-tag-selector-container-locked');
				this.getOuterContainer().inert = true;
				this.getTextBox().disabled = true;
			}
			else
			{
				Dom.removeClass(this.getOuterContainer(), 'ui-tag-selector-container-locked');
				this.getOuterContainer().inert = false;
				this.getTextBox().disabled = false;
			}

			this.toggleFocusZone();
		}
	}

	lock(): void
	{
		if (!this.isLocked())
		{
			this.setLocked(true);
		}
	}

	unlock(): void
	{
		if (this.isLocked())
		{
			this.setLocked(false);
		}
	}

	isLocked(): boolean
	{
		return this.locked;
	}

	isMultiple(): boolean
	{
		return this.multiple;
	}

	setDeselectable(flag: boolean | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			const changed = this.deselectable !== flag;
			this.deselectable = flag;

			if (changed)
			{
				this.updateTags();
			}
		}
	}

	isDeselectable(): boolean
	{
		return this.deselectable;
	}

	getTag(tagItem: TagItem | ItemOptions | TagItemOptions): TagItem | null
	{
		if (tagItem instanceof TagItem)
		{
			return this.getTags().find((tag) => tag === tagItem) || null;
		}

		if (Type.isPlainObject(tagItem))
		{
			const { id, entityId } = tagItem;

			return this.getTags().find((tag: TagItem) => tag.getId() === id && tag.getEntityId() === entityId) || null;
		}

		return null;
	}

	addTag(tagOptions: TagItemOptions): TagItem | null
	{
		if (!Type.isObjectLike(tagOptions))
		{
			throw new TypeError('TagSelector.addTag: wrong item options.');
		}

		if (this.getTag(tagOptions))
		{
			return null;
		}

		const tag = new TagItem(this, tagOptions);

		const event = new BaseEvent({ data: { tag } });
		this.emit('onBeforeTagAdd', event);

		if (event.isDefaultPrevented())
		{
			return null;
		}

		if (!this.isMultiple())
		{
			this.removeTags();
		}

		this.tags.push(tag);

		this.emit('onTagAdd', { tag });

		if (this.isRendered())
		{
			tag.render();
			this.getItemsContainer().insertBefore(tag.getContainer(), this.getTextBox());

			if (tagOptions.animate !== false)
			{
				void tag.show().then(() => {
					this.getContainer().scrollTop = this.getContainer().scrollHeight - this.getContainer().offsetHeight;
					this.emit('onAfterTagAdd', { tag });
					this.focusZone?.refreshElements();
				});
			}
			else
			{
				this.emit('onAfterTagAdd', { tag });
				this.focusZone?.refreshElements();
			}

			this.toggleAddButtonCaption();
		}
		else
		{
			this.emit('onAfterTagAdd', { tag });
			this.focusZone?.refreshElements();
		}

		return tag;
	}

	removeTag(item: TagItem | ItemOptions, animate = true): void
	{
		const tagItem = this.getTag(item);
		if (!tagItem)
		{
			return;
		}

		const event = new BaseEvent({ data: { tag: tagItem } });
		this.emit('onBeforeTagRemove', event);

		if (event.isDefaultPrevented())
		{
			return;
		}

		this.tags = this.tags.filter((el) => el !== tagItem);

		this.emit('onTagRemove', { tag: tagItem });

		if (this.isRendered())
		{
			FocusNavigator.focusNext(
				this.getOuterContainer(),
				{
					from: tagItem.getContentContainer(),
					wrap: true,
					tabbableOnly: false,
				},
			);

			void tagItem.remove(animate).then(() => {
				this.toggleAddButtonCaption();
				this.emit('onAfterTagRemove', { tag: tagItem });
				this.focusZone?.refreshElements();
			});
		}
		else
		{
			this.emit('onAfterTagRemove', { tag: tagItem });
			this.focusZone?.refreshElements();
		}
	}

	removeTags(): void
	{
		this.getTags().forEach((tag) => {
			this.removeTag(tag, false);
		});
	}

	getTags(): TagItem[]
	{
		return this.tags;
	}

	renderTo(node: HTMLElement): void
	{
		if (this.isRendered())
		{
			return;
		}

		this.rendered = true;

		this.getTags().forEach((tag: TagItem) => {
			tag.render();
			this.getItemsContainer().insertBefore(tag.getContainer(), this.getTextBox());
		});

		if (Type.isDomNode(node))
		{
			Dom.append(this.getOuterContainer(), node);
		}

		this.focusZone = new FocusZone(this.getOuterContainer(), {
			bindKeys: FocusKeys.ArrowHorizontal | FocusKeys.HomeAndEnd,
			...this.focusZoneOptions,
		});

		this.toggleFocusZone();
	}

	toggleFocusZone(): void
	{
		if (this.isRendered() && !this.isLocked() && !this.isReadonly())
		{
			this.focusZone?.activate();
		}
		else
		{
			this.focusZone?.deactivate();
		}
	}

	isRendered(): boolean
	{
		return this.rendered;
	}

	/**
	 * @private
	 */
	updateTags(): void
	{
		if (this.isRendered())
		{
			this.getTags().forEach((tag: TagItem) => {
				tag.render();
			});
		}
	}

	getOuterContainer(): HTMLElement
	{
		return this.cache.remember('outer-container', () => {
			let className = this.isReadonly() ? ' ui-tag-selector-container-readonly' : '';
			className += this.isLocked() ? ' ui-tag-selector-container-locked' : '';

			return Tag.render`
				<div class="ui-tag-selector-outer-container --air --ui-context-content-light${className}">${this.getContainer()}</div>
			`;
		});
	}

	getContainer(): HTMLElement
	{
		return this.cache.remember('container', () => {
			const style = this.getMaxHeight()
				? ` style="max-height: ${this.getMaxHeight()}px; -ms-overflow-style: -ms-autohiding-scrollbar;"`
				: '';

			return Tag.render`
				<div 
					class="ui-tag-selector-container" 
					onclick="${this.handleContainerClick.bind(this)}"
					${style}
				>
					${this.getItemsContainer()}
					${this.getCreateButton()}
				</div>
			`;
		});
	}

	getItemsContainer(): HTMLElement
	{
		return this.cache.remember('items-container', () => {
			return Tag.render`
				<div class="ui-tag-selector-items">
					${this.getTextBox()}
					${this.getAddButton()}
				</div>
			`;
		});
	}

	getTextBox(): HTMLInputElement
	{
		return this.cache.remember('text-box', () => {
			const className = this.textBoxVisible ? '' : ' ui-tag-selector-item-hidden';
			const input = Tag.render<HTMLInputElement>`
				<input 
					type="text"
					class="ui-tag-selector-item ui-tag-selector-text-box${className}"
					autocomplete="off"
					data-testid="ui-tag-selector-input"
					placeholder="${Text.encode(this.getPlaceholder())}"
					aria-label="${Text.encode(this.getPlaceholder() || Loc.getMessage('UI_TAG_SELECTOR_SEARCH_PLACEHOLDER') || '')}"
					oninput="${this.handleTextBoxInput.bind(this)}"
					onblur="${this.handleTextBoxBlur.bind(this)}"
					onkeyup="${this.handleTextBoxKeyUp.bind(this)}"
					onkeydown="${this.handleTextBoxKeyDown.bind(this)}"
					value=""
				>
			`;

			const width = this.getTextBoxWidth();
			if (width !== null)
			{
				Dom.style(input, 'min-width', Type.isStringFilled(width) ? width : `${width}px`);
			}

			if (this.isLocked())
			{
				input.disabled = true;
			}

			return input;
		}) as HTMLInputElement;
	}

	getItemsHeight(): number
	{
		return this.getItemsContainer().scrollHeight;
	}

	calcHeight(): number
	{
		if (this.getMaxHeight() !== null)
		{
			return Math.min(this.getItemsHeight(), this.getMaxHeight()!);
		}

		return Math.max(this.getItemsHeight(), this.getMinHeight());
	}

	getTextBoxValue(): string
	{
		return this.getTextBox().value;
	}

	clearTextBox(): void
	{
		this.getTextBox().value = '';
		this.textBoxOldValue = '';
	}

	showTextBox(): void
	{
		this.textBoxVisible = true;
		Dom.removeClass(this.getTextBox(), 'ui-tag-selector-item-hidden');
	}

	hideTextBox(): void
	{
		this.textBoxVisible = false;
		Dom.addClass(this.getTextBox(), 'ui-tag-selector-item-hidden');
	}

	tryAutoHideTextBox()
	{
		if (this.textBoxAutoHide)
		{
			this.clearTextBox();
			this.showAddButton();
			this.hideTextBox();
			this.getAddButtonLink().focus();
		}
	}

	focusTextBox(): void
	{
		this.getTextBox().focus();
	}

	setTextBoxAutoHide(autoHide: boolean | undefined): void
	{
		if (Type.isBoolean(autoHide))
		{
			this.textBoxAutoHide = autoHide;
		}
	}

	getTextBoxWidth(): string | number | null
	{
		return this.textBoxWidth;
	}

	setTextBoxWidth(width: string | number | null | undefined): void
	{
		if (Type.isStringFilled(width) || width === null)
		{
			this.textBoxWidth = width;
			if (this.isRendered())
			{
				Dom.style(this.getTextBox(), 'min-width', width);
			}
		}
		else if (Type.isNumber(width) && width > 0)
		{
			this.textBoxWidth = width;
			if (this.isRendered())
			{
				Dom.style(this.getTextBox(), 'min-width', `${width}px`);
			}
		}
	}

	getTagMaxWidth(): number | null
	{
		return this.tagMaxWidth;
	}

	setTagMaxWidth(width: number | null | undefined): void
	{
		if ((Type.isNumber(width) && width >= 0) || width === null)
		{
			this.tagMaxWidth = width;
			this.updateTags();
		}
	}

	getTagAvatar(): string | null
	{
		return this.tagAvatar;
	}

	setTagAvatar(tagAvatar: string | null | undefined): void
	{
		if (Type.isString(tagAvatar) || tagAvatar === null)
		{
			this.tagAvatar = tagAvatar;
			this.updateTags();
		}
	}

	getTagClickable(): boolean | null
	{
		return this.tagClickable;
	}

	setTagClickable(flag: boolean | null | undefined): void
	{
		if (Type.isBoolean(flag) || flag === null)
		{
			this.tagClickable = flag;
			this.updateTags();
		}
	}

	getTagAvatarOptions(): AvatarOptions | null
	{
		return this.tagAvatarOptions;
	}

	getTagAvatarOption(option: keyof AvatarOptions): string | boolean | number | null
	{
		if (this.tagAvatarOptions !== null && !Type.isUndefined(this.tagAvatarOptions[option]))
		{
			return this.tagAvatarOptions[option];
		}

		return null;
	}

	setTagAvatarOption(option: keyof AvatarOptions, value: string | boolean | number | null | undefined): void
	{
		if (Type.isStringFilled(option) && !Type.isUndefined(value))
		{
			if (this.tagAvatarOptions === null)
			{
				this.tagAvatarOptions = {};
			}

			this.tagAvatarOptions[option] = value as string;
			this.updateTags();
		}
	}

	setTagAvatarOptions(options: AvatarOptions | undefined): void
	{
		if (Type.isPlainObject(options))
		{
			(Object.keys(options) as Array<keyof AvatarOptions>).forEach((option: keyof AvatarOptions) => {
				this.setTagAvatarOption(option, options[option]);
			});
		}
	}

	getTagTextColor(): string | null
	{
		return this.tagTextColor;
	}

	setTagTextColor(textColor: string | null | undefined): void
	{
		if (Type.isString(textColor) || textColor === null)
		{
			this.tagTextColor = textColor;
			this.updateTags();
		}
	}

	getTagBgColor(): string | null
	{
		return this.tagBgColor;
	}

	setTagBgColor(bgColor: string | null | undefined): void
	{
		if (Type.isString(bgColor) || bgColor === null)
		{
			this.tagBgColor = bgColor;
			this.updateTags();
		}
	}

	getTagFontWeight(): string | null
	{
		return this.tagFontWeight;
	}

	setTagFontWeight(fontWeight: string | null | undefined): void
	{
		if (Type.isString(fontWeight) || fontWeight === null)
		{
			this.tagFontWeight = fontWeight;
			this.updateTags();
		}
	}

	getPlaceholder(): string
	{
		return this.placeholder;
	}

	setPlaceholder(placeholder: string | undefined): void
	{
		if (Type.isStringFilled(placeholder))
		{
			this.placeholder = placeholder;

			if (this.isRendered())
			{
				this.getTextBox().placeholder = placeholder;
				Dom.attr(this.getTextBox(), 'aria-label', placeholder);
			}
		}
	}

	getMaxHeight(): number | null
	{
		return this.maxHeight;
	}

	getMinHeight(): number
	{
		return 34;
	}

	setMaxHeight(height: number | null | undefined): void
	{
		if ((Type.isNumber(height) && height > 0) || height === null)
		{
			this.maxHeight = height;
			if (this.isRendered())
			{
				Dom.style(this.getContainer(), 'max-height', height! > 0 ? `${height}px` : null);
				Dom.style(this.getContainer(), '-ms-overflow-style', height! > 0 ? '-ms-autohiding-scrollbar' : null);
			}
		}
	}

	getAddButton(): HTMLElement
	{
		return this.cache.remember('add-button', () => {
			const className = this.addButtonVisible ? '' : ' ui-tag-selector-item-hidden';

			return Tag.render`
				<span
					class="ui-tag-selector-item ui-tag-selector-add-button${className}"
					data-testid="ui-tag-selector-add-item-button"
				>
					${this.getAddButtonLink()}
				</span>
			`;
		});
	}

	getAddButtonLink(): HTMLElement
	{
		return this.cache.remember('add-button-link', () => {
			const caption = Text.encode(this.getActualButtonCaption());

			return Tag.render`
				<button
					type="button"
					tabindex="0"
					class="ui-tag-selector-add-button-caption" 
					onclick="${this.handleAddButtonClick.bind(this)}"
				>${caption}</button>
			`;
		});
	}

	getAddButtonCaption(): string
	{
		return (
			this.addButtonCaption === null
				? (Loc.getMessage('UI_TAG_SELECTOR_ADD_BUTTON_CAPTION') || '')
				: this.addButtonCaption
		);
	}

	setAddButtonCaption(caption: string | undefined): void
	{
		if (Type.isStringFilled(caption))
		{
			this.addButtonCaption = caption;

			if (this.isRendered())
			{
				this.toggleAddButtonCaption();
			}
		}
	}

	getAddButtonCaptionMore(): string | null
	{
		return this.addButtonCaptionMore === null
			? this.isMultiple()
				? (Loc.getMessage('UI_TAG_SELECTOR_ADD_BUTTON_CAPTION') || '')
				: (Loc.getMessage('UI_TAG_SELECTOR_ADD_BUTTON_CAPTION_SINGLE') || '')
			: this.addButtonCaptionMore;
	}

	setAddButtonCaptionMore(caption: string | undefined): void
	{
		if (Type.isStringFilled(caption))
		{
			this.addButtonCaptionMore = caption;

			if (this.isRendered())
			{
				this.toggleAddButtonCaption();
			}
		}
	}

	toggleAddButtonCaption(): void
	{
		if (this.getAddButtonCaptionMore() === null)
		{
			return;
		}

		this.getAddButtonLink().textContent = this.getActualButtonCaption();
	}

	getActualButtonCaption(): string
	{
		return this.getTags().length > 0 && this.getAddButtonCaptionMore() !== null
			? this.getAddButtonCaptionMore()!
			: this.getAddButtonCaption();
	}

	showAddButton(): void
	{
		this.addButtonVisible = true;
		Dom.removeClass(this.getAddButton(), 'ui-tag-selector-item-hidden');
	}

	hideAddButton(): void
	{
		this.addButtonVisible = false;
		Dom.addClass(this.getAddButton(), 'ui-tag-selector-item-hidden');
	}

	getCreateButton(): HTMLElement
	{
		return this.cache.remember('create-button', () => {
			const className = this.createButtonVisible ? '' : ' ui-tag-selector-item-hidden';

			return Tag.render`
				<div class="ui-tag-selector-create-button${className}">
					<button
						type="button"
						tabindex="0"
						class="ui-tag-selector-create-button-caption"
						onclick="${this.handleCreateButtonClick.bind(this)}"
					>${Text.encode(this.getCreateButtonCaption())}</button>
				</div>
			`;
		});
	}

	showCreateButton(): void
	{
		this.createButtonVisible = true;
		Dom.removeClass(this.getCreateButton(), 'ui-tag-selector-item-hidden');
	}

	hideCreateButton(): void
	{
		this.createButtonVisible = false;
		Dom.addClass(this.getCreateButton(), 'ui-tag-selector-item-hidden');
	}

	getCreateButtonCaption(): string
	{
		return this.createButtonCaption === null
			? Loc.getMessage('UI_TAG_SELECTOR_CREATE_BUTTON_CAPTION')!
			: this.createButtonCaption;
	}

	setCreateButtonCaption(caption: string | undefined): void
	{
		if (Type.isStringFilled(caption))
		{
			this.createButtonCaption = caption;

			if (this.isRendered())
			{
				this.getCreateButton().children[0].textContent = caption;
			}
		}
	}

	handleContainerClick(event: MouseEvent): void
	{
		this.emit('onContainerClick', { event });
	}

	handleTextBoxInput(event: InputEvent): void
	{
		const newValue = this.getTextBoxValue();
		if (newValue !== this.textBoxOldValue)
		{
			this.textBoxOldValue = newValue;
			this.emit('onInput', { event });
		}
	}

	handleTextBoxBlur(event: FocusEvent): void
	{
		this.emit('onBlur', { event });

		this.tryAutoHideTextBox();
	}

	handleTextBoxKeyUp(event: KeyboardEvent): void
	{
		this.emit('onKeyUp', { event });
	}

	handleTextBoxKeyDown(event: KeyboardEvent): void
	{
		if (event.key === 'Enter')
		{
			// prevent a form submit
			event.preventDefault();

			if ((Browser.isMac() && event.metaKey) || event.ctrlKey)
			{
				this.emit('onMetaEnter', { event });
			}
			else
			{
				this.emit('onEnter', { event });
			}

			this.tryAutoHideTextBox();
		}

		this.emit('onKeyDown', { event });
	}

	handleAddButtonClick(event: MouseEvent): void
	{
		this.hideAddButton();
		this.showTextBox();
		this.focusTextBox();

		this.emit('onAddButtonClick', { event });
	}

	handleCreateButtonClick(event: MouseEvent): void
	{
		this.emit('onCreateButtonClick', { event });
	}
}
