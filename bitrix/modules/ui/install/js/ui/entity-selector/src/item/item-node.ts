import { ajax as Ajax, Dom, Runtime, Type, Event, Text } from 'main.core';
import { MemoryCache } from 'main.core.cache';
import { OrderedArray } from 'main.core.collections';
import { Loader } from 'main.loader';

import { Icon, type IconOptions } from 'ui.icon-set.api.core';

import { ItemNodeComparator } from './item-node-comparator';
import { Highlighter } from '../search/highlighter';
import { ItemBadge } from './item-badge';
import { MatchField } from '../search/match-field';
import { TextNode } from '../common/text-node';
import { Animation } from '../common/animation';
import { isItem } from './is-item';
import { encodeUrl } from '../common/encode-url';

import { type Item } from './item';
import { type Tab } from '../dialog/tabs/tab';
import { type Dialog } from '../dialog/dialog';
import { type ItemOptions } from './item-options';
import { type ItemNodeOptions } from './item-node-options';
import { type ItemBadgeOptions } from './item-badge-options';
import { type TextNodeOptions } from '../common/text-node-options';
import { type CaptionOptions } from './caption-options';
import { type BadgesOptions } from './badges-options';
import { type AvatarOptions } from './avatar-options';

export class RenderMode
{
	static PARTIAL = 'partial';
	static OVERRIDE = 'override';
}

export class ItemNode
{
	item: Item | null = null;
	tab: Tab | null = null;
	id: string;
	cache = new MemoryCache<HTMLElement>();
	parentNode: ItemNode | null = null;

	children: OrderedArray<ItemNode>;
	childItems: WeakMap<Item, ItemNode> = new WeakMap(); // for the fast access

	loaded: boolean = false;
	dynamic: boolean = false;
	dynamicPromise: Promise<any> | null = null;
	loader: Loader | null = null;
	open: boolean = false;
	autoOpen: boolean = false;
	focused: boolean = false;

	renderMode: RenderMode = RenderMode.PARTIAL;
	title: TextNode | null = null;
	subtitle: TextNode | null = null;
	supertitle: TextNode | null = null;
	caption: TextNode | null = null;
	captionOptions: Record<string, string | boolean | number | null> = {};
	avatar: string | null = null;
	avatarOptions: Record<string, string | boolean | number | null> | null = null;
	link: string | null = null;
	linkTitle: TextNode | null = null;
	textColor: string | null = null;
	badges: ItemBadge[] | null = null;
	badgesOptions: Record<string, string | boolean | number | null> = {};
	hidden: boolean = false;

	highlights: MatchField[] = [];

	rendered: boolean = false;
	renderWithDebounce = Runtime.debounce(this.render, 50, this);

	constructor(item: Item, nodeOptions: ItemNodeOptions)
	{
		const options: ItemNodeOptions = Type.isPlainObject(nodeOptions) ? nodeOptions : {};

		if (Type.isObject(item))
		{
			this.item = item;
		}

		let comparator = null;
		if (Type.isFunction(options.itemOrder))
		{
			comparator = options.itemOrder;
		}
		else if (Type.isPlainObject(options.itemOrder))
		{
			comparator = ItemNodeComparator.makeMultipleComparator(
				options.itemOrder as { [key: string]: 'asc' | 'desc' },
			);
		}

		this.id = Text.getRandom();
		this.children = new OrderedArray(comparator);

		this.renderMode = options.renderMode === RenderMode.OVERRIDE ? RenderMode.OVERRIDE : RenderMode.PARTIAL;
		if (this.renderMode === RenderMode.OVERRIDE)
		{
			this.setTitle('');
			this.setSubtitle('');
			this.setSupertitle('');
			this.setCaption('');
			this.setLinkTitle('');

			this.avatar = '';
			this.avatarOptions = {
				bgSize: null,
				bgColor: null,
				bgImage: null,
				border: null,
				borderRadius: null,
				outline: null,
				outlineOffset: null,
				icon: null,
				iconColor: null,
			};
			this.textColor = '';
			this.link = '';
			this.badges = [];
			this.captionOptions = {
				fitContent: null,
				maxWidth: null,
				justifyContent: null,
			};
			this.badgesOptions = {
				fitContent: null,
				maxWidth: null,
				justifyContent: null,
			};
		}

		this.setTitle(options.title);
		this.setSubtitle(options.subtitle);
		this.setSupertitle(options.supertitle);
		this.setCaption(options.caption);
		this.setCaptionOptions(options.captionOptions);
		this.setAvatar(options.avatar);
		this.setAvatarOptions(options.avatarOptions);
		this.setTextColor(options.textColor);
		this.setLink(options.link);
		this.setLinkTitle(options.linkTitle);
		this.setBadges(options.badges);
		this.setBadgesOptions(options.badgesOptions);

		this.setDynamic(options.dynamic);
		this.setOpen(options.open);
	}

	getItem(): Item
	{
		return this.item!;
	}

	isRoot(): boolean
	{
		return this.getParentNode() === null;
	}

	getId(): string
	{
		return this.id;
	}

	getDialog(): Dialog
	{
		return this.getTab().getDialog();
	}

	setTab(tab: Tab): void
	{
		this.tab = tab;
	}

	getTab(): Tab
	{
		return this.tab!;
	}

	getParentNode(): ItemNode | null
	{
		return this.parentNode;
	}

	setParentNode(parentNode: ItemNode | null): void
	{
		this.parentNode = parentNode;
	}

	getNextSibling(): ItemNode | null
	{
		if (!this.getParentNode())
		{
			return null;
		}

		const siblings = this.getParentNode()!.getChildren();
		const index = siblings.getIndex(this);

		return siblings.getByIndex(index + 1);
	}

	getPreviousSibling(): ItemNode | null
	{
		if (!this.getParentNode())
		{
			return null;
		}

		const siblings = this.getParentNode()!.getChildren();
		const index = siblings.getIndex(this);

		return siblings.getByIndex(index - 1);
	}

	addChildren(children: ItemOptions[] | null | undefined): void
	{
		if (!Type.isArray(children))
		{
			return;
		}

		children.forEach((childOptions: ItemOptions) => {
			delete childOptions.tabs;
			const childItem = this.getDialog().addItem(childOptions);

			const childNode = this.addItem(childItem, childOptions.nodeOptions);
			childNode.addChildren(childOptions.children);
		});
	}

	addChild(child: ItemNode): ItemNode | null
	{
		if (!(child instanceof ItemNode))
		{
			throw new TypeError('EntitySelector.ItemNode: an item must be an instance of EntitySelector.ItemNode.');
		}

		if (this.isChildOf(child) || child === this)
		{
			throw new Error('EntitySelector.ItemNode: a child item cannot be a parent of current item.');
		}

		if (this.getChildren().has(child) || this.childItems.has(child.getItem()))
		{
			return null;
		}

		this.getChildren().add(child);
		this.childItems.set(child.getItem(), child);

		child.setTab(this.getTab());
		child.setParentNode(this);

		if (this.isRendered())
		{
			this.renderWithDebounce();
		}

		return child;
	}

	getDepthLevel(): number
	{
		return this.isRoot() ? 0 : this.getParentNode()!.getDepthLevel() + 1;
	}

	addItem(item: Item, nodeOptions?: ItemNodeOptions): ItemNode
	{
		let itemNode = this.childItems.get(item);
		if (!itemNode)
		{
			itemNode = item.createNode(nodeOptions as ItemNodeOptions);
			this.addChild(itemNode);
		}

		return itemNode;
	}

	addItems(items: Item[] | Array<[Item, ItemNodeOptions]>): void
	{
		if (Type.isArray(items))
		{
			this.disableRender();

			items.forEach((item: Item | [Item, ItemNodeOptions]) => {
				if (Type.isArray(item) && item.length === 2)
				{
					this.addItem(item[0], item[1]);
				}
				else if (isItem(item))
				{
					this.addItem(item);
				}
			});

			this.enableRender();

			if (this.isRendered())
			{
				this.renderWithDebounce();
			}
		}
	}

	hasItem(item: Item): boolean
	{
		return this.childItems.has(item);
	}

	removeChild(child: ItemNode): boolean
	{
		if (!this.getChildren().has(child))
		{
			return false;
		}

		child.removeChildren();

		if (child.isFocused())
		{
			child.unfocus();
		}

		child.setParentNode(null);
		child.getItem().removeNode(child);

		this.getChildren().delete(child);
		this.childItems.delete(child.getItem());

		if (this.isRendered())
		{
			Dom.remove(child.getOuterContainer());
		}

		return true;
	}

	removeChildren(): void
	{
		if (!this.hasChildren())
		{
			return;
		}

		this.getChildren().forEach((node: ItemNode) => {
			node.removeChildren();

			if (node.isFocused())
			{
				node.unfocus();
			}

			node.setParentNode(null);
			node.getItem().removeNode(node);
		});

		this.getChildren().clear();
		this.childItems = new WeakMap();

		if (this.isRendered())
		{
			this.getChildrenContainer().textContent = '';
		}
	}

	hasChild(child: ItemNode): boolean
	{
		return this.getChildren().has(child);
	}

	isChildOf(parent: ItemNode): boolean
	{
		let parentNode = this.getParentNode();
		while (parentNode !== null)
		{
			if (parentNode === parent)
			{
				return true;
			}

			parentNode = parentNode!.getParentNode();
		}

		return false;
	}

	getFirstChild(): ItemNode | null
	{
		return this.children.getFirst();
	}

	getLastChild(): ItemNode | null
	{
		return this.children.getLast();
	}

	getChildren(): OrderedArray<ItemNode>
	{
		return this.children;
	}

	hasChildren(): boolean
	{
		return this.children.count() > 0;
	}

	loadChildren(): Promise<any>
	{
		if (!this.isDynamic())
		{
			throw new Error('EntitySelector.ItemNode.loadChildren: an item node is not dynamic.');
		}

		if (this.dynamicPromise)
		{
			return this.dynamicPromise;
		}

		this.dynamicPromise = Ajax.runAction('ui.entityselector.getChildren', {
			json: {
				parentItem: this.getItem().getAjaxJson(),
				dialog: this.getDialog().getAjaxJson(),
			},
			getParameters: {
				context: this.getDialog().getContext(),
			},
		});

		this.dynamicPromise!.then((response) => {
			if (response && response.data && Type.isPlainObject(response.data.dialog))
			{
				this.addChildren(response.data.dialog.items);
				this.render();
			}
			this.loaded = true;
		});

		this.dynamicPromise!.catch((error) => {
			this.loaded = false;
			this.dynamicPromise = null;
			console.error(error);
		});

		return this.dynamicPromise!;
	}

	setOpen(open: boolean | undefined): void
	{
		if (Type.isBoolean(open))
		{
			if (open && this.isDynamic() && !this.isLoaded())
			{
				this.setAutoOpen(true);
			}
			else
			{
				this.open = open;
			}
		}
	}

	isOpen(): boolean
	{
		return this.open;
	}

	isAutoOpen(): boolean
	{
		return this.autoOpen && this.isDynamic() && !this.isLoaded();
	}

	setAutoOpen(autoOpen: boolean | undefined): void
	{
		if (Type.isBoolean(autoOpen))
		{
			this.autoOpen = autoOpen;
		}
	}

	setDynamic(dynamic: boolean | undefined): void
	{
		if (Type.isBoolean(dynamic))
		{
			this.dynamic = dynamic;
		}
	}

	isDynamic(): boolean
	{
		return this.dynamic;
	}

	isLoaded(): boolean
	{
		return this.loaded;
	}

	getLoader(): Loader
	{
		if (this.loader === null)
		{
			this.loader = new Loader({
				target: this.getIndicatorContainer(),
				size: 30,
			});
		}

		return this.loader;
	}

	showLoader(): void
	{
		void this.getLoader().show();
		Dom.addClass(this.getIndicatorContainer(), 'ui-selector-item-indicator-hidden');
	}

	hideLoader(): void
	{
		void this.getLoader().hide();
		Dom.removeClass(this.getIndicatorContainer(), 'ui-selector-item-indicator-hidden');
	}

	destroyLoader(): void
	{
		this.getLoader().destroy();
		this.loader = null;
		Dom.removeClass(this.getIndicatorContainer(), 'ui-selector-item-indicator-hidden');
	}

	expand(): void
	{
		if (this.isOpen() || (!this.hasChildren() && !this.isDynamic()))
		{
			return;
		}

		if (this.isDynamic() && !this.isLoaded())
		{
			this.loadChildren().then(() => {
				this.destroyLoader();
				this.expand();
			});

			this.showLoader();

			return;
		}

		Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-open');
		Dom.attr(this.getOuterContainer(), 'aria-expanded', 'true');

		Dom.style(this.getChildrenContainer(), 'height', '0px');
		Dom.style(this.getChildrenContainer(), 'opacity', 0);

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				Dom.style(this.getChildrenContainer(), 'height', `${this.getChildrenContainer().scrollHeight}px`);
				Dom.style(this.getChildrenContainer(), 'opacity', 1);

				Animation.handleTransitionEnd(this.getChildrenContainer(), 'height')
					.then(() => {
						Dom.style(this.getChildrenContainer(), 'height', null);
						Dom.style(this.getChildrenContainer(), 'opacity', null);
						Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-open');
						Dom.attr(this.getOuterContainer(), 'aria-expanded', 'true');
						this.setOpen(true);
					})
					.catch(() => {
						// fail silently
					})
				;
			});
		});
	}

	collapse(): void
	{
		if (!this.isOpen())
		{
			return;
		}

		Dom.style(this.getChildrenContainer(), 'height', `${this.getChildrenContainer().offsetHeight}px`);

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				Dom.style(this.getChildrenContainer(), 'height', '0px');
				Dom.style(this.getChildrenContainer(), 'opacity', 0);

				Animation.handleTransitionEnd(this.getChildrenContainer(), 'height')
					.then(() => {
						Dom.style(this.getChildrenContainer(), 'height', null);
						Dom.style(this.getChildrenContainer(), 'opacity', null);
						Dom.removeClass(this.getOuterContainer(), 'ui-selector-item-box-open');
						Dom.attr(this.getOuterContainer(), 'aria-expanded', 'false');
						this.setOpen(false);
					})
					.catch(() => {
						// fail silently
					})
				;
			});
		});
	}

	render(appendChildren = false): void
	{
		if (this.isRoot())
		{
			this.renderRoot(appendChildren);

			return;
		}

		const titleNode = this.getTitleNode();
		if (titleNode)
		{
			titleNode.renderTo(this.getTitleContainer());
		}
		else
		{
			this.getTitleContainer().textContent = '';
		}

		const supertitleNode = this.getSupertitleNode();
		if (supertitleNode)
		{
			supertitleNode.renderTo(this.getSupertitleContainer());
		}
		else
		{
			this.getSupertitleContainer().textContent = '';
		}

		const subtitleNode = this.getSubtitleNode();
		if (subtitleNode)
		{
			subtitleNode.renderTo(this.getSubtitleContainer());
		}
		else
		{
			this.getSubtitleContainer().textContent = '';
		}

		const captionNode = this.getCaptionNode();
		if (captionNode)
		{
			captionNode.renderTo(this.getCaptionContainer());
		}
		else
		{
			this.getCaptionContainer().textContent = '';
		}

		const captionFitContent = this.getCaptionOption('fitContent');
		if (Type.isBoolean(captionFitContent))
		{
			Dom.style(this.getCaptionContainer(), 'flex-shrink', captionFitContent ? 0 : null);
		}

		const captionJustifyContent = this.getCaptionOption('justifyContent');
		if (Type.isStringFilled(captionJustifyContent) || captionJustifyContent === null)
		{
			Dom.style(this.getCaptionContainer(), {
				flexGrow: captionJustifyContent ? '1' : null,
				textAlign: captionJustifyContent || null,
			} as Record<string, string | number>);
		}

		const captionMaxWidth = this.getCaptionOption('maxWidth');
		if (Type.isString(captionMaxWidth) || Type.isNumber(captionMaxWidth))
		{
			Dom.style(
				this.getCaptionContainer(),
				'max-width',
				Type.isNumber(captionMaxWidth) ? `${captionMaxWidth}px` : captionMaxWidth,
			);
		}

		if (Type.isStringFilled(this.getTextColor()))
		{
			this.getTitleContainer().style.color = this.getTextColor()!;
		}
		else
		{
			this.getTitleContainer().style.removeProperty('color');
		}

		Dom.clean(this.getAvatarContainer());
		const avatar = this.getAvatar();
		if (Type.isStringFilled(avatar))
		{
			this.getAvatarContainer().style.backgroundImage = `url('${encodeUrl(avatar)}')`;
		}
		else
		{
			const bgImage = this.getAvatarOption('bgImage');
			if (Type.isStringFilled(bgImage))
			{
				this.getAvatarContainer().style.backgroundImage = bgImage;
			}
			else
			{
				this.getAvatarContainer().style.removeProperty('background-image');
			}
		}

		const bgColor = this.getAvatarOption('bgColor');
		if (Type.isStringFilled(bgColor))
		{
			this.getAvatarContainer().style.backgroundColor = bgColor;
		}
		else
		{
			this.getAvatarContainer().style.removeProperty('background-color');
		}

		const bgSize = this.getAvatarOption('bgSize');
		if (Type.isStringFilled(bgSize))
		{
			this.getAvatarContainer().style.backgroundSize = bgSize;
		}
		else
		{
			this.getAvatarContainer().style.removeProperty('background-size');
		}

		const border = this.getAvatarOption('border');
		if (Type.isStringFilled(border))
		{
			this.getAvatarContainer().style.border = border;
		}
		else
		{
			this.getAvatarContainer().style.removeProperty('border');
		}

		const borderRadius = this.getAvatarOption('borderRadius');
		if (Type.isStringFilled(borderRadius))
		{
			this.getAvatarContainer().style.borderRadius = borderRadius;
		}
		else
		{
			this.getAvatarContainer().style.removeProperty('border-radius');
		}

		const outline = this.getAvatarOption('outline');
		Dom.style(this.getAvatarContainer(), 'outline', outline as string | number | null);

		const outlineOffset = this.getAvatarOption('outlineOffset');
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

		Dom.clean(this.getBadgeContainer());
		this.getBadges().forEach((badge: ItemBadge) => {
			badge.renderTo(this.getBadgeContainer());
		});

		const badgesFitContent = this.getBadgesOption('fitContent');
		if (Type.isBoolean(badgesFitContent))
		{
			Dom.style(this.getBadgeContainer(), 'flex-shrink', badgesFitContent ? 0 : null);
		}

		const badgesJustifyContent = this.getBadgesOption('justifyContent');
		if (Type.isStringFilled(badgesJustifyContent) || badgesJustifyContent === null)
		{
			Dom.style(this.getBadgeContainer(), {
				flexGrow: badgesJustifyContent ? '1' : null,
				justifyContent: badgesJustifyContent || null,
			} as Record<string, string | number>);
		}

		const badgesMaxWidth = this.getBadgesOption('maxWidth');
		if (Type.isString(badgesMaxWidth) || Type.isNumber(badgesMaxWidth))
		{
			Dom.style(
				this.getBadgeContainer(),
				'max-width',
				Type.isNumber(badgesMaxWidth) ? `${badgesMaxWidth}px` : badgesMaxWidth,
			);
		}

		const linkTitleNode = this.getLinkTitleNode();
		if (linkTitleNode)
		{
			linkTitleNode.renderTo(this.getLinkTextContainer());
		}
		else
		{
			this.getLinkTextContainer().textContent = '';
		}

		Dom.attr(
			this.getOuterContainer(),
			'role',
			this.getTab().getItemsContainer().role === 'tree' ? 'treeitem' : 'option'
		);

		if (this.hasChildren() || this.isDynamic())
		{
			Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-has-children');
			if (this.getDepthLevel() >= this.getTab().getItemMaxDepth())
			{
				Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-max-depth');
			}
		}
		else if (this.getOuterContainer().classList.contains('ui-selector-item-box-has-children'))
		{
			Dom.removeClass(this.getOuterContainer(), [
				'ui-selector-item-box-has-children',
				'ui-selector-item-box-max-depth',
			]);
		}

		if (this.hasChildren())
		{
			const hasVisibleChild = this.getChildren()
				.getAll()
				.some((child: ItemNode) => {
					return child.isHidden() !== true;
				});

			if (!hasVisibleChild)
			{
				this.#setHidden(true);
			}
		}

		this.toggleVisibility();
		this.highlight();
		this.renderChildren(appendChildren);

		if (this.isAutoOpen())
		{
			this.setAutoOpen(false);

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					this.expand();
				});
			});
		}

		this.rendered = true;
	}

	/**
	 * @private
	 */
	renderRoot(appendChildren = false): void
	{
		const isTree = this.getChildren().getAll().some((child: ItemNode) => {
			return child.hasChildren() || child.isDynamic();
		});

		Dom.attr(this.getTab().getItemsContainer(), 'role', isTree ? 'tree' : 'listbox');

		this.renderChildren(appendChildren);
		this.rendered = true;

		const stub = this.getTab().getStub();
		if (stub && stub.isAutoShow() && (this.getDialog().isLoaded() || !this.getDialog().hasDynamicLoad()))
		{
			if (this.hasChildren())
			{
				stub.hide();
			}
			else
			{
				stub.show();
			}
		}
	}

	/**
	 * @private
	 */
	renderChildren(appendChildren = false): void
	{
		if (!appendChildren)
		{
			this.getChildrenContainer().textContent = '';
		}

		if (this.hasChildren())
		{
			let previousSibling: ItemNode | null = null;
			this.getChildren().forEach((child: ItemNode) => {
				child.render(appendChildren);
				const container = child.getOuterContainer();

				if (!appendChildren)
				{
					Dom.append(container, this.getChildrenContainer());
				}

				if (!container.parentNode)
				{
					if (previousSibling === null)
					{
						Dom.append(container, this.getChildrenContainer());
					}
					else
					{
						Dom.insertAfter(container, previousSibling.getOuterContainer());
					}
				}

				previousSibling = child;
			});
		}
	}

	isRendered(): boolean
	{
		return this.rendered && this.getDialog() && this.getDialog().isRendered();
	}

	enableRender(): void
	{
		this.rendered = true;
	}

	disableRender(): void
	{
		this.rendered = false;
	}

	getRenderMode(): RenderMode
	{
		return this.renderMode;
	}

	isHidden(): boolean
	{
		return this.hidden || this.getItem().isHidden();
	}

	setHidden(flag: boolean): void
	{
		if (!Type.isBoolean(flag) || this.isRoot())
		{
			return;
		}

		this.#setHidden(flag);

		if (this.isRendered())
		{
			this.toggleVisibility();

			let parentNode = this.getParentNode();
			const isHidden = this.isHidden();
			while (parentNode!.isRoot() === false)
			{
				if (isHidden)
				{
					const hasVisibleChild = parentNode!
						.getChildren()
						.getAll()
						.some((child: ItemNode) => {
							return child.isHidden() !== true;
						});

					if (!hasVisibleChild)
					{
						parentNode!.#setHidden(true);
					}

					parentNode!.toggleVisibility();
				}
				else
				{
					parentNode!.#setHidden(false);
					parentNode!.toggleVisibility();
					if (parentNode!.isHidden())
					{
						break;
					}
				}

				parentNode = parentNode!.getParentNode();
			}
		}
	}

	#setHidden(flag: boolean): void
	{
		if (Type.isBoolean(flag) && !this.isRoot())
		{
			this.hidden = flag;
		}
	}

	toggleVisibility(): void
	{
		if (this.isHidden())
		{
			Dom.addClass(this.getOuterContainer(), '--hidden');
		}
		else if (this.getOuterContainer().classList.contains('--hidden'))
		{
			Dom.removeClass(this.getOuterContainer(), '--hidden');
		}
	}

	lock(): void
	{
		if (this.hasChildren() || this.isDynamic())
		{
			return;
		}

		Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-locked');
	}

	unlock(): void
	{
		if (this.hasChildren() || this.isDynamic())
		{
			return;
		}

		Dom.removeClass(this.getOuterContainer(), 'ui-selector-item-box-locked');
	}

	getTitle(): string | null
	{
		const titleNode = this.getTitleNode();

		return titleNode === null ? null : titleNode!.getText();
	}

	getTitleNode(): TextNode | null
	{
		return this.title === null ? this.getItem().getTitleNode() : this.title;
	}

	setTitle(title: string | TextNodeOptions | null | undefined): void
	{
		if (Type.isString(title) || Type.isPlainObject(title))
		{
			this.title = new TextNode(title);
		}
		else if (title === null)
		{
			this.title = null;
		}
	}

	getSubtitle(): string | null
	{
		const subtitleNode = this.getSubtitleNode();

		return subtitleNode === null ? null : subtitleNode.getText();
	}

	getSubtitleNode(): TextNode | null
	{
		return this.subtitle === null ? this.getItem().getSubtitleNode() : this.subtitle;
	}

	setSubtitle(subtitle: string | TextNodeOptions | null | undefined): void
	{
		if (Type.isString(subtitle) || Type.isPlainObject(subtitle))
		{
			this.subtitle = new TextNode(subtitle);
		}
		else if (subtitle === null)
		{
			this.subtitle = null;
		}
	}

	getSupertitle(): string | null
	{
		const supertitleNode = this.getSupertitleNode();

		return supertitleNode === null ? null : supertitleNode.getText();
	}

	getSupertitleNode(): TextNode | null
	{
		return this.supertitle === null ? this.getItem().getSupertitleNode() : this.supertitle;
	}

	setSupertitle(supertitle: string | TextNodeOptions | null | undefined): void
	{
		if (Type.isString(supertitle) || Type.isPlainObject(supertitle))
		{
			this.supertitle = new TextNode(supertitle);
		}
		else if (supertitle === null)
		{
			this.supertitle = null;
		}
	}

	getCaption(): string | null
	{
		const caption = this.getCaptionNode();

		return caption === null ? null : caption!.getText();
	}

	getCaptionNode(): TextNode | null
	{
		return this.caption === null ? this.getItem().getCaptionNode() : this.caption;
	}

	setCaption(caption: string | TextNodeOptions | null | undefined): void
	{
		if (Type.isString(caption) || Type.isPlainObject(caption))
		{
			this.caption = new TextNode(caption);
		}
		else if (caption === null)
		{
			this.caption = null;
		}
	}

	getCaptionOption(option: string): string | boolean | number | null
	{
		if (!Type.isUndefined(this.captionOptions[option]))
		{
			return this.captionOptions[option];
		}

		return this.getItem().getCaptionOption(option);
	}

	setCaptionOption(option: string, value: string | boolean | number | null): void
	{
		if (Type.isStringFilled(option) && !Type.isUndefined(value))
		{
			this.captionOptions[option] = value;
		}
	}

	setCaptionOptions(options: { [key: string]: any } | null | undefined): void
	{
		if (Type.isPlainObject(options))
		{
			Object.keys(options).forEach((option: string) => {
				this.setCaptionOption(option, options[option] as string | boolean | number | null);
			});
		}
	}

	getAvatar(): string | null
	{
		return this.avatar === null ? this.getItem().getAvatar() : this.avatar;
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
		return this.avatarOptions === null || Type.isUndefined(this.avatarOptions[option])
			? this.getItem().getAvatarOption(option)
			: this.avatarOptions[option];
	}

	setAvatarOption(option: keyof AvatarOptions, value: string | boolean | number | null): void
	{
		if (Type.isStringFilled(option) && !Type.isUndefined(value))
		{
			if (this.avatarOptions === null)
			{
				this.avatarOptions = {};
			}

			this.avatarOptions[option] = value;
		}
	}

	setAvatarOptions(avatarOptions: AvatarOptions | null | undefined): void
	{
		if (Type.isPlainObject(avatarOptions))
		{
			Object.keys(avatarOptions).forEach((option: string) => {
				this.setAvatarOption(
					option as keyof AvatarOptions,
					(avatarOptions as Record<string, string | boolean | number | null>)[option],
				);
			});
		}
	}

	getTextColor(): string | null
	{
		return this.textColor === null ? this.getItem().getTextColor() : this.textColor;
	}

	setTextColor(textColor: string | null | undefined): void
	{
		if (Type.isString(textColor) || textColor === null)
		{
			this.textColor = textColor;
		}
	}

	getLink(): string | null
	{
		return this.link === null ? this.getItem().getLink() : this.getItem().replaceMacros(this.link!);
	}

	setLink(link: string | null | undefined): void
	{
		if (Type.isString(link) || link === null)
		{
			this.link = link;
		}
	}

	getLinkTitle(): string | null
	{
		const linkTitle = this.getLinkTitleNode();

		return linkTitle === null ? null : linkTitle!.getText();
	}

	getLinkTitleNode(): TextNode | null
	{
		return this.linkTitle === null ? this.getItem().getLinkTitleNode() : this.linkTitle;
	}

	setLinkTitle(title: string | TextNodeOptions | null | undefined): void
	{
		if (Type.isString(title) || Type.isPlainObject(title))
		{
			this.linkTitle = new TextNode(title);
		}
		else if (title === null)
		{
			this.linkTitle = null;
		}
	}

	getBadges(): ItemBadge[]
	{
		return this.badges === null ? this.getItem().getBadges() : this.badges;
	}

	setBadges(badges: ItemBadgeOptions[] | null | void): void
	{
		if (Type.isArray(badges))
		{
			this.badges = [];
			badges.forEach((badge) => {
				this.badges!.push(new ItemBadge(badge));
			});
		}
		else if (badges === null)
		{
			this.badges = null;
		}
	}

	getBadgesOption(option: string): string | boolean | number | null
	{
		if (!Type.isUndefined(this.badgesOptions[option]))
		{
			return this.badgesOptions[option];
		}

		return this.getItem().getBadgesOption(option);
	}

	setBadgesOption(option: string, value: string | boolean | number | null): void
	{
		if (Type.isStringFilled(option) && !Type.isUndefined(value))
		{
			this.badgesOptions[option] = value;
		}
	}

	setBadgesOptions(options: { [key: string]: any } | null | undefined): void
	{
		if (Type.isPlainObject(options))
		{
			Object.keys(options).forEach((option: string) => {
				this.setBadgesOption(option, options[option] as string | boolean | number | null);
			});
		}
	}

	getOuterContainer(): HTMLElement
	{
		return this.cache.remember('outer-container', () => {
			let className = '';

			const div = document.createElement('div');

			if (this.hasChildren() || this.isDynamic())
			{
				className += ' ui-selector-item-box-has-children';
				if (this.getDepthLevel() >= this.getTab().getItemMaxDepth())
				{
					className += ' ui-selector-item-box-max-depth';
				}

				div.ariaExpanded = this.isOpen().toString();
			}
			else if (this.getItem().isLocked())
			{
				className += ' ui-selector-item-box-locked';
			}
			else if (this.getItem().isSelected())
			{
				className += ' ui-selector-item-box-selected';
				div.ariaSelected = 'true';
			}
			else
			{
				div.ariaSelected = 'false';
			}

			if (this.isOpen())
			{
				className += ' ui-selector-item-box-open';
			}

			div.className = `ui-selector-item-box${className}`;
			div.id = this.getId();
			div.tabIndex = -1;

			if (!this.isRoot())
			{
				div.dataset.testid = `ui-selector-item-${this.getItem().getEntityId()}-${this.getItem().getId()}`;
			}

			if (!this.getDialog().hasTagSelector())
			{
				Event.bind(div, 'focusout', this.handleFocusOut.bind(this));
				Event.bind(div, 'focus', this.handleFocus.bind(this));
			}

			div.appendChild(this.getContainer());
			div.appendChild(this.getChildrenContainer());

			return div;
		});
	}

	getChildrenContainer(): HTMLElement
	{
		if (this.isRoot() && this.getTab())
		{
			return this.getTab().getItemsContainer();
		}

		return this.cache.remember('children-container', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item-children';
			div.role = 'group';

			return div;
		});
	}

	getContainer(): HTMLElement
	{
		return this.cache.remember('container', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item --ui-hoverable';
			div.dataset.testid = 'ui-selector-item-content';

			Event.bind(div, 'click', this.handleClick.bind(this));
			Event.bind(div, 'mouseenter', this.handleMouseEnter.bind(this));
			Event.bind(div, 'mouseleave', this.handleMouseLeave.bind(this));

			div.appendChild(this.getAvatarContainer());
			div.appendChild(this.getTitlesContainer());
			div.appendChild(this.getIndicatorContainer());

			if (Type.isStringFilled(this.getLink()))
			{
				div.appendChild(this.getLinkContainer());
			}

			return div;
		});
	}

	getAvatarContainer(): HTMLElement
	{
		return this.cache.remember('avatar', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item-avatar';
			div.ariaHidden = 'true';

			return div;
		});
	}

	getTitlesContainer(): HTMLElement
	{
		return this.cache.remember('titles', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item-titles';

			div.appendChild(this.getSupertitleContainer());
			div.appendChild(this.getTitleBoxContainer());
			div.appendChild(this.getSubtitleContainer());

			return div;
		});
	}

	getTitleBoxContainer(): HTMLElement
	{
		return this.cache.remember('title-box', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item-title-box';

			div.appendChild(this.getTitleContainer());
			div.appendChild(this.getBadgeContainer());
			div.appendChild(this.getCaptionContainer());

			return div;
		});
	}

	getTitleContainer(): HTMLElement
	{
		return this.cache.remember('title', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item-title';

			return div;
		});
	}

	getSubtitleContainer(): HTMLElement
	{
		return this.cache.remember('subtitle', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item-subtitle';

			return div;
		});
	}

	getSupertitleContainer(): HTMLElement
	{
		return this.cache.remember('supertitle', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item-supertitle';

			return div;
		});
	}

	getCaptionContainer(): HTMLElement
	{
		return this.cache.remember('caption', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item-caption';

			return div;
		});
	}

	getIndicatorContainer(): HTMLElement
	{
		return this.cache.remember('indicator', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item-indicator ui-icon-set__scope';
			div.ariaHidden = 'true';

			return div;
		});
	}

	getBadgeContainer(): HTMLElement
	{
		return this.cache.remember('badge', () => {
			const div = document.createElement('div');
			div.className = 'ui-selector-item-badges';

			return div;
		});
	}

	getLinkContainer(): HTMLElement
	{
		return this.cache.remember('link', () => {
			const anchor: HTMLAnchorElement = document.createElement('a');
			anchor.className = 'ui-selector-item-link';
			anchor.href = this.getLink()!;
			anchor.target = '_blank';
			anchor.title = '';
			anchor.ariaHidden = 'true';
			anchor.tabIndex = -1;

			Event.bind(anchor, 'click', this.handleLinkClick.bind(this));
			anchor.appendChild(this.getLinkTextContainer());

			return anchor;
		});
	}

	getLinkTextContainer(): HTMLElement
	{
		return this.cache.remember('link-text', () => {
			const span = document.createElement('span');
			span.className = 'ui-selector-item-link-text';

			return span;
		});
	}

	showLink(): void
	{
		if (Type.isStringFilled(this.getLink()))
		{
			Dom.addClass(this.getLinkContainer(), 'ui-selector-item-link--show');
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					Dom.addClass(this.getLinkContainer(), 'ui-selector-item-link--animate');
				});
			});
		}
	}

	hideLink(): void
	{
		if (Type.isStringFilled(this.getLink()))
		{
			Dom.removeClass(this.getLinkContainer(), ['ui-selector-item-link--show', 'ui-selector-item-link--animate']);
		}
	}

	setHighlights(highlights: MatchField[]): void
	{
		this.highlights = highlights;
	}

	getHighlights(): MatchField[]
	{
		return this.highlights;
	}

	highlight(): void
	{
		this.getHighlights().forEach((matchField) => {
			const field = matchField.getField();
			const fieldName = field!.getName();

			if (field!.isCustom())
			{
				const text = this.getItem().getCustomData().get(fieldName);
				this.getSubtitleContainer().innerHTML = Highlighter.mark(text, matchField.getMatches());
			}
			else if (field!.getName() === 'title')
			{
				this.getTitleContainer().innerHTML = Highlighter.mark(this.getItem().getTitleNode()!, matchField.getMatches());
			}
			else if (field!.getName() === 'subtitle')
			{
				this.getSubtitleContainer().innerHTML = Highlighter.mark(
					this.getItem().getSubtitleNode()!,
					matchField.getMatches(),
				);
			}
			else if (field!.getName() === 'supertitle')
			{
				this.getSupertitleContainer().innerHTML = Highlighter.mark(
					this.getItem().getSupertitleNode()!,
					matchField.getMatches(),
				);
			}
			else if (field!.getName() === 'caption')
			{
				this.getCaptionContainer().innerHTML = Highlighter.mark(
					this.getItem().getCaptionNode()!,
					matchField.getMatches(),
				);
			}
		});
	}

	select(): void
	{
		if (this.hasChildren() || this.isDynamic())
		{
			return;
		}

		Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-selected');
		Dom.attr(this.getOuterContainer(), 'aria-selected', 'true');
	}

	deselect(): void
	{
		if (this.hasChildren() || this.isDynamic())
		{
			return;
		}

		Dom.removeClass(this.getOuterContainer(), 'ui-selector-item-box-selected');
		Dom.attr(this.getOuterContainer(), 'aria-selected', 'false');
	}

	focus(focusVisible = false): void
	{
		if (this.isFocused())
		{
			return;
		}

		this.focused = true;

		Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-focused');

		if (!this.getDialog().hasTagSelector() && this.getDialog().getFocusTrap() !== null)
		{
			Dom.attr(this.getOuterContainer(), 'tabindex', 0);
			this.getOuterContainer().focus();

			if (focusVisible)
			{
				Dom.addClass(this.getOuterContainer(), '--focus-visible');
			}
			else
			{
				Dom.removeClass(this.getOuterContainer(), '--focus-visible');
			}
		}

		this.getDialog().emit('ItemNode:onFocus', { node: this });
	}

	unfocus(): void
	{
		if (!this.isFocused())
		{
			return;
		}

		this.focused = false;

		Dom.removeClass(this.getOuterContainer(), 'ui-selector-item-box-focused --focus-visible');
		Dom.attr(this.getOuterContainer(), 'tabindex', -1);

		this.getDialog().emit('ItemNode:onUnfocus', { node: this });
	}

	isFocused(): boolean
	{
		return this.focused;
	}

	click(): void
	{
		if (this.hasChildren() || this.isDynamic())
		{
			if (this.isOpen())
			{
				this.collapse();
			}
			else
			{
				this.expand();
			}

			this.getDialog().focusSearch();
		}
		else if (this.getItem().isSelected())
		{
			if (this.getItem().isDeselectable())
			{
				this.getItem().deselect({ node: this });
				this.getDialog().focusSearch();
			}

			if (!this.getItem().isSelected() && this.getDialog().shouldHideOnDeselect())
			{
				this.getDialog().hide();
			}
		}
		else
		{
			this.getItem().select({ node: this });

			if (this.getDialog().shouldClearSearchOnSelect())
			{
				this.getDialog().clearSearch();
				this.getDialog().focusSearch();
			}

			if (this.getItem().isSelected() && this.getDialog().shouldHideOnSelect())
			{
				this.getDialog().hide();
			}
		}
	}

	scrollIntoView(): void
	{
		const tabContainer = this.getTab().getContainer();
		const nodeContainer = this.getContainer();

		const tabRect = Dom.getPosition(tabContainer);
		const nodeRect = Dom.getPosition(nodeContainer);
		const margin = 9; // 'ui-selector-items' padding - 'ui-selector-item' margin = 10 - 1

		if (nodeRect.top < tabRect.top) // scroll up
		{
			tabContainer.scrollTop -= tabRect.top - nodeRect.top + margin;
		}
		else if (nodeRect.bottom > tabRect.bottom) // scroll down
		{
			tabContainer.scrollTop += nodeRect.bottom - tabRect.bottom + margin;
		}
	}

	#makeEllipsisTitle(): void
	{
		if (ItemNode.#isEllipsisActive(this.getTitleContainer()))
		{
			this.getContainer().setAttribute('title', ItemNode.#sanitizeTitle(this.getTitleContainer().textContent!));
		}
		else
		{
			Dom.attr(this.getContainer(), 'title', null);
		}

		const containers = [
			this.getSupertitleContainer(),
			this.getSubtitleContainer(),
			this.getCaptionContainer(),
			...this.getBadges().map((badge: ItemBadge) => badge.getContainer(this.getBadgeContainer())),
		];

		containers.forEach((container) => {
			if (ItemNode.#isEllipsisActive(container))
			{
				container.setAttribute('title', ItemNode.#sanitizeTitle(container.textContent!));
			}
			else
			{
				Dom.attr(container, 'title', null);
			}
		});
	}

	static #isEllipsisActive(element: HTMLElement): boolean
	{
		return element.offsetWidth < element.scrollWidth;
	}

	static #sanitizeTitle(text: string)
	{
		return text
			.replace(/[\t ]+/gm, ' ')
			.replace(/\n+/gm, '\n')
			.trim();
	}

	handleClick(): void
	{
		this.click();
	}

	handleLinkClick(event: MouseEvent): void
	{
		this.getDialog().emit('ItemNode:onLinkClick', { node: this, event });
		event.stopPropagation();
	}

	handleMouseEnter(): void
	{
		this.focus();
		this.showLink();
		this.#makeEllipsisTitle();
	}

	handleMouseLeave(): void
	{
		this.unfocus();
		this.hideLink();
	}

	handleFocusOut(): void
	{
		if (this.isFocused())
		{
			Dom.removeClass(this.getOuterContainer(), '--focus-visible');
		}
	}

	handleFocus(): void
	{
		if (this.isFocused() && this.getDialog().getFocusTrap() !== null)
		{
			Dom.addClass(this.getOuterContainer(), '--focus-visible');
		}
	}
}
