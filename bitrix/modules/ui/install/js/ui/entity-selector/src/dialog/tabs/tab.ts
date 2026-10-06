import { Type, Tag, Dom, Reflection } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { Icon, Outline } from 'ui.icon-set.api.core';
import 'ui.icon-set.outline';

import { ItemNode } from '../../item/item-node';
import { BaseStub } from './base-stub';
import { DefaultStub } from './default-stub';
import { BaseHeader } from '../header/base-header';
import { BaseFooter } from '../footer/base-footer';
import { TextNode } from '../../common/text-node';
import { encodeUrl } from '../../common/encode-url';

import { type Dialog } from '../dialog';
import { type TabLabelState, type TabLabelStates, type TabOptions } from './tab-options';
import { type HeaderContent, type HeaderOptions } from '../header/header-content';
import { type FooterContent, type FooterOptions } from '../footer/footer-content';
import { type TextNodeOptions } from '../../common/text-node-options';

/**
 * @memberof BX.UI.EntitySelector
 */
export class Tab
{
	id: string;
	title: TextNode | null = null;
	rootNode: ItemNode = null!;

	dialog: Dialog = null!;
	stub: BaseStub | null = null;

	visible: boolean = true;
	rendered: boolean = false;
	locked: boolean = false;
	selected: boolean = false;
	hovered: boolean = false;

	icon: TabLabelStates = {};
	textColor: TabLabelStates = {};
	bgColor: TabLabelStates = {};

	itemMaxDepth: number = 5;

	header: BaseHeader | null = null;
	showDefaultHeader = true;
	footer: BaseFooter | null = null;
	showDefaultFooter = true;
	showAvatars: boolean | null = null;
	cache = new MemoryCache<HTMLElement>();

	constructor(dialog: Dialog, tabOptions: TabOptions)
	{
		const options: Partial<TabOptions> = Type.isPlainObject(tabOptions) ? tabOptions : {};

		if (!Type.isStringFilled(options.id))
		{
			throw new Error('EntitySelector.Tab: "id" parameter is required.');
		}

		this.setDialog(dialog);
		this.id = options.id;
		this.showDefaultHeader = options.showDefaultHeader !== false;
		this.showDefaultFooter = options.showDefaultFooter !== false;

		this.rootNode = new ItemNode(null!, { itemOrder: options.itemOrder });
		this.rootNode.setTab(this);

		this.setVisible(options.visible);
		this.setTitle(options.title);
		this.setItemMaxDepth(options.itemMaxDepth);
		this.setIcon(options.icon ?? Outline.ARROW_RIGHT_L);
		this.setTextColor(options.textColor);
		this.setBgColor(options.bgColor);
		this.setStub(options.stub, options.stubOptions);
		this.setHeader(options.header, options.headerOptions);
		this.setFooter(options.footer, options.footerOptions);
		this.setShowAvatars(options.showAvatars);
	}

	getId(): string
	{
		return this.id;
	}

	getTabPanelId(): string
	{
		return `${this.getDialog().getId()}-tabpanel-${this.getId()}`;
	}

	getListBoxId(): string
	{
		return `${this.getDialog().getId()}-listbox-${this.getId()}`;
	}

	getLabelId(): string
	{
		return `${this.getDialog().getId()}-tab-${this.getId()}`;
	}

	/**
	 * @internal
	 */
	setDialog(dialog: Dialog): void
	{
		this.dialog = dialog;
	}

	getDialog(): Dialog
	{
		return this.dialog;
	}

	getStub(): BaseStub | null
	{
		return this.stub;
	}

	setStub(stub?: boolean | string | Function, stubOptions?: { [option: string]: any }): void
	{
		let instance: BaseStub | null = null;
		const options = Type.isPlainObject(stubOptions) ? stubOptions : {};

		if (Type.isString(stub) || Type.isFunction(stub))
		{
			const className = Type.isString(stub) ? Reflection.getClass(stub) : stub;
			if (Type.isFunction(className))
			{
				const StubClass = className as new (tab: Tab, options: { [option: string]: any }) => BaseStub;
				instance = new StubClass(this, options);
				if (!(instance instanceof BaseStub))
				{
					console.error('EntitySelector: stub is not an instance of BaseStub.');
					instance = null;
				}
			}
		}

		if (!instance && stub !== false)
		{
			instance = new DefaultStub(this, options);
		}

		this.stub = instance;
	}

	getHeader(): BaseHeader | null
	{
		return this.header;
	}

	setHeader(headerContent: HeaderContent | null | undefined, headerOptions?: HeaderOptions)
	{
		/** @var {BaseHeader} */
		let header: BaseHeader | null = null;
		if (headerContent !== null)
		{
			header = this.getDialog().createHeader(this, headerContent, headerOptions);
			if (header === null)
			{
				return;
			}
		}

		if (this.isRendered() && this.getHeader() !== null)
		{
			Dom.remove(this.getHeader()!.getContainer());
			this.getDialog().adjustHeader();
		}

		this.header = header;

		if (this.isRendered())
		{
			this.getDialog().appendHeader(header!);
			this.getDialog().adjustHeader();
		}
	}

	canShowDefaultHeader(): boolean
	{
		return this.showDefaultHeader;
	}

	enableDefaultHeader(): void
	{
		this.showDefaultHeader = true;
		this.getDialog().adjustHeader();
	}

	disableDefaultHeader(): void
	{
		this.showDefaultHeader = false;
		this.getDialog().adjustHeader();
	}

	getFooter(): BaseFooter | null
	{
		return this.footer;
	}

	setFooter(footerContent: FooterContent | null | undefined, footerOptions?: FooterOptions)
	{
		/** @var {BaseFooter} */
		let footer: BaseFooter | null = null;
		if (footerContent !== null)
		{
			footer = this.getDialog().createFooter(this, footerContent, footerOptions);
			if (footer === null)
			{
				return;
			}
		}

		if (this.isRendered() && this.getFooter() !== null)
		{
			Dom.remove(this.getFooter()!.getContainer());
			this.getDialog().adjustFooter();
		}

		this.footer = footer;

		if (this.isRendered())
		{
			this.getDialog().appendFooter(footer!);
			this.getDialog().adjustFooter();
		}
	}

	canShowDefaultFooter(): boolean
	{
		return this.showDefaultFooter;
	}

	enableDefaultFooter(): void
	{
		this.showDefaultFooter = true;
		this.getDialog().adjustFooter();
	}

	disableDefaultFooter(): void
	{
		this.showDefaultFooter = false;
		this.getDialog().adjustFooter();
	}

	setShowAvatars(flag: boolean | null | undefined): void
	{
		if (Type.isBoolean(flag) || flag === null)
		{
			this.showAvatars = flag;

			if (this.isRendered())
			{
				this.renderContainer();
			}
		}
	}

	shouldShowAvatars(): boolean
	{
		return this.showAvatars ?? this.getDialog().shouldShowAvatars();
	}

	getRootNode(): ItemNode
	{
		return this.rootNode;
	}

	setTitle(title: string | null | undefined | TextNodeOptions): void
	{
		if (Type.isStringFilled(title) || Type.isPlainObject(title) || title === null)
		{
			this.title = title === null ? null : new TextNode(title);

			if (this.isRendered())
			{
				this.renderLabel();
			}
		}
	}

	getTitle(): string
	{
		const titleNode = this.getTitleNode();

		return titleNode !== null && !titleNode.isNullable() ? titleNode.getText()! : '';
	}

	getTitleNode(): TextNode | null
	{
		return this.title;
	}

	setIcon(icon: TabLabelStates | string | undefined): void
	{
		return this.setProperty('icon', icon);
	}

	getIcon(state?: TabLabelState): string | null
	{
		return this.getPropertyByState('icon', state);
	}

	setBgColor(bgColor: TabLabelStates | string | undefined): void
	{
		return this.setProperty('bgColor', bgColor);
	}

	getBgColor(state?: TabLabelState): string | null
	{
		return this.getPropertyByState('bgColor', state);
	}

	setTextColor(textColor: TabLabelStates | string | undefined): void
	{
		return this.setProperty('textColor', textColor);
	}

	getTextColor(state?: TabLabelState): string | null
	{
		return this.getPropertyByState('textColor', state);
	}

	/**
	 * @private
	 */
	setProperty(name: 'icon' | 'bgColor' | 'textColor', states: TabLabelStates | string | undefined): void
	{
		const property: TabLabelStates = this[name];
		if (!property)
		{
			return;
		}

		if (Type.isPlainObject(states))
		{
			(Object.keys(states) as Array<keyof TabLabelStates>).forEach((state) => {
				if (Type.isStringFilled(states[state]))
				{
					property[state] = states[state];
				}
			});
		}
		else if (Type.isStringFilled(states))
		{
			property['default'] = states;
		}
	}

	/**
	 * @private
	 */
	getPropertyByState(name: 'icon' | 'bgColor' | 'textColor', state?: TabLabelState): string | null
	{
		const property: TabLabelStates = this[name];
		const labelState: keyof TabLabelStates = Type.isStringFilled(state) ? state : 'default';

		if (!Type.isUndefined(property) && !Type.isUndefined(property[labelState]))
		{
			return property[labelState];
		}

		return null;
	}

	/**
	 * @private
	 */
	getPropertyByCurrentState(name: 'icon' | 'bgColor' | 'textColor'): string | null
	{
		const property: TabLabelStates = this[name];
		if (this.isSelected() && this.isHovered() && property.selectedHovered)
		{
			return property.selectedHovered;
		}

		if (this.isSelected() && property.selected)
		{
			return property.selected;
		}

		if (this.isHovered() && property.hovered)
		{
			return property.hovered;
		}

		if (property.default)
		{
			return property.default;
		}

		return null;
	}

	setItemMaxDepth(depth: number | undefined): void
	{
		if (Type.isNumber(depth) && depth > 0)
		{
			this.itemMaxDepth = depth;
		}
	}

	getItemMaxDepth(): number
	{
		return this.itemMaxDepth;
	}

	getContainer(): HTMLElement
	{
		return this.cache.remember('container', () => {
			return Tag.render`
				<div
					class="ui-selector-tab-content"
					role="tabpanel"
					tabindex="-1"
					id="${this.getTabPanelId()}"
					aria-labelledby="${this.getLabelId()}"
				>${this.getItemsContainer()}</div>
			`;
		});
	}

	getLabelContainer(): HTMLElement
	{
		return this.cache.remember('label', () => {
			const className = this.isVisible() ? '' : ' ui-selector-tab-label-hidden';

			return Tag.render`
				<button
					type="button"
					role="tab"
					id="${this.getLabelId()}"
					aria-controls="${this.getTabPanelId()}"
					aria-selected="false"
					tabindex="-1"
					data-testid="ui-selector-tab-${this.getId()}"
					class="ui-selector-tab-label${className} --ui-hoverable"
					onclick="${this.handleLabelClick.bind(this)}"
					onmouseenter="${this.handleLabelMouseEnter.bind(this)}"
					onmouseleave="${this.handleLabelMouseLeave.bind(this)}"
				>
					${this.getIconContainer()}
					${this.getTitleContainer()}
				</button>
			`;
		});
	}

	getIconContainer(): HTMLElement
	{
		return this.cache.remember('icon', () => {
			return Tag.render`
				<span class="ui-selector-tab-icon" role="none"></span>
			`;
		});
	}

	getTitleContainer(): HTMLElement
	{
		return this.cache.remember('title', () => {
			return Tag.render`
				<span class="ui-selector-tab-title"></span>
			`;
		});
	}

	getItemsContainer(): HTMLElement
	{
		return this.cache.remember('items', () => {
			return Tag.render`
				<div
					class="ui-selector-items"
					aria-multiselectable="${this.getDialog().isMultiple() ? 'true' : 'false'}"
					id="${this.getListBoxId()}"
					aria-labelledby="${this.getLabelId()}"
				></div>
			`;
		});
	}

	getListBoxContainer(): HTMLElement
	{
		return this.getItemsContainer();
	}

	render(): void
	{
		this.getRootNode().render();
		this.rendered = true;
	}

	/** @internal */
	renderLabel(): void
	{
		Dom.style(this.getTitleContainer(), 'color', this.getPropertyByCurrentState('textColor'));
		Dom.style(this.getLabelContainer(), 'background-color', this.getPropertyByCurrentState('bgColor'));

		const icon = this.getPropertyByCurrentState('icon');
		Dom.clean(this.getIconContainer());
		try
		{
			Dom.append(new Icon({ icon: icon! }).render(), this.getIconContainer());
			Dom.style(this.getIconContainer(), 'mask-image', 'none');
			Dom.style(this.getIconContainer(), 'background-color', 'transparent');
		}
		catch
		{
			Dom.style(this.getIconContainer(), 'mask-image', icon ? `url('${encodeUrl(icon)}')` : null);
		}

		const titleNode = this.getTitleNode();
		if (titleNode)
		{
			this.getTitleNode()!.renderTo(this.getTitleContainer());
		}
		else
		{
			this.getTitleContainer().textContent = '';
		}
	}

	/** @internal */
	renderContainer(): void
	{
		const className = 'ui-selector-tab-content--hide-avatars';
		if (this.shouldShowAvatars())
		{
			Dom.removeClass(this.getContainer(), className);
		}
		else
		{
			Dom.addClass(this.getContainer(), className);
		}
	}

	isVisible(): boolean
	{
		return this.visible;
	}

	setVisible(flag: boolean | undefined): void
	{
		if (Type.isBoolean(flag))
		{
			this.visible = flag;

			if (this.isRendered())
			{
				if (this.visible)
				{
					Dom.removeClass(this.getLabelContainer(), 'ui-selector-tab-label-hidden');
				}
				else
				{
					Dom.addClass(this.getLabelContainer(), 'ui-selector-tab-label-hidden');
				}
			}
		}
	}

	isRendered(): boolean
	{
		return this.rendered && this.getDialog() && this.getDialog().isRendered();
	}

	/**
	 * @internal
	 */
	select(): void
	{
		if (this.isSelected())
		{
			return;
		}

		Dom.addClass(this.getContainer(), 'ui-selector-tab-content-active');

		Dom.attr(this.getLabelContainer(), 'aria-selected', 'true');
		Dom.attr(this.getDialog().getTagSelector()?.getTextBox(), 'aria-controls', this.getListBoxId());

		if (this.isVisible())
		{
			Dom.addClass(this.getLabelContainer(), 'ui-selector-tab-label-active');
			this.renderLabel();
		}

		this.selected = true;

		this.getHeader()?.show();
		this.getFooter()?.show();

		this.getDialog().emit('Tab:onSelect', { tab: this });
	}

	/**
	 * @internal
	 */
	deselect(): void
	{
		if (!this.isSelected())
		{
			return;
		}

		Dom.removeClass(this.getContainer(), 'ui-selector-tab-content-active');
		if (this.isVisible())
		{
			Dom.removeClass(this.getLabelContainer(), 'ui-selector-tab-label-active');
		}

		Dom.attr(this.getLabelContainer(), 'aria-selected', 'false');
		Dom.attr(this.getDialog().getTagSelector()?.getTextBox(), 'aria-controls', null);

		this.selected = false;

		if (this.isVisible())
		{
			this.renderLabel();
		}

		this.getHeader()?.hide();
		this.getFooter()?.hide();

		this.getDialog().emit('Tab:onDeselect', { tab: this });
	}

	hover(): void
	{
		if (this.isHovered())
		{
			return;
		}

		Dom.addClass(this.getLabelContainer(), 'ui-selector-tab-label-hover');
		this.hovered = true;

		this.renderLabel();
	}

	unhover(): void
	{
		if (!this.isHovered())
		{
			return;
		}

		Dom.removeClass(this.getLabelContainer(), 'ui-selector-tab-label-hover');
		this.hovered = false;

		this.renderLabel();
	}

	isSelected(): boolean
	{
		return this.selected;
	}

	isHovered(): boolean
	{
		return this.hovered;
	}

	lock(): void
	{
		this.locked = true;
		Dom.addClass(this.getContainer(), 'ui-selector-tab-content-locked');
	}

	unlock(): void
	{
		this.locked = false;
		Dom.removeClass(this.getContainer(), 'ui-selector-tab-content-locked');
	}

	isLocked(): boolean
	{
		return this.locked;
	}

	handleLabelClick(): void
	{
		this.getDialog().selectTab(this.getId());
	}

	handleLabelMouseEnter(): void
	{
		this.hover();
	}

	handleLabelMouseLeave(): void
	{
		this.unhover();
	}
}
