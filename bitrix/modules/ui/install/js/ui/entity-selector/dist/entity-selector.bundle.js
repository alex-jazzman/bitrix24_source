/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, ui_designTokens, ui_iconSet_solid, main_core, main_core_cache, main_core_events, main_popup, main_loader, ui_a11y, main_core_collections, ui_iconSet_api_core) {
	'use strict';

	class ItemNodeComparator {
		static makeMultipleComparator(order) {
			const props = Object.keys(order).map(property => `get${main_core.Text.capitalize(property)}`);
			const directions = [];
			Object.values(order).forEach(element => {
				const direction = element.toLowerCase().trim();
				let ascOrdering = true;
				let nullsOrdering = true;
				switch (direction) {
					case 'desc':
					case 'desc nulls first':
						{
							ascOrdering = false;
							break;
						}
					case 'asc nulls first':
						{
							nullsOrdering = false;
							break;
						}
					case 'desc nulls last':
						{
							ascOrdering = false;
							nullsOrdering = false;
							break;
						}
				}
				directions.push({
					ascOrdering,
					nullsOrdering
				});
			});
			const numberOfProperties = props.length;
			return (nodeA, nodeB) => {
				let i = 0;
				let result = 0;
				while (result === 0 && i < numberOfProperties) {
					const propertyGetter = props[i];
					const direction = directions[i];
					result = this.compareItemNodes(nodeA, nodeB, propertyGetter, direction.ascOrdering, direction.nullsOrdering);
					i += 1;
				}
				return result;
			};
		}
		static compareItemNodes(nodeA, nodeB, propertyGetter, ascOrdering, nullsOrdering) {
			const itemA = nodeA.getItem();
			const itemB = nodeB.getItem();
			const valueA = itemA[propertyGetter]();
			const valueB = itemB[propertyGetter]();
			let result = 0;
			if (valueA !== null && valueB === null) {
				result = nullsOrdering ? -1 : 1;
			} else if (valueA === null && valueB !== null) {
				result = nullsOrdering ? 1 : -1;
			} else if (valueA === null && valueB === null) {
				result = ascOrdering ? -1 : 1;
			} else if (main_core.Type.isString(valueA)) {
				result = valueA.localeCompare(valueB);
			} else {
				result = valueA - valueB;
			}
			const sortOrder = ascOrdering ? 1 : -1;
			return result * sortOrder;
		}
	}

	class TextNodeType {
		static TEXT = 'text';
		static HTML = 'html';
		static isValid(type) {
			return main_core.Type.isString(type) && (type === this.HTML || type === this.TEXT);
		}
	}

	class TextNode {
		text = null;
		type = null;
		constructor(options) {
			if (main_core.Type.isPlainObject(options)) {
				if (main_core.Type.isString(options.text)) {
					this.text = options.text;
				}
				if (TextNodeType.isValid(options.type)) {
					this.type = options.type;
				}
			} else if (main_core.Type.isString(options)) {
				this.text = options;
			}
		}
		getText() {
			return this.text;
		}
		getType() {
			return this.type;
		}
		isNullable() {
			return this.getText() === null;
		}
		renderTo(element) {
			const text = this.getText();
			if (text === null) {
				return;
			}
			if (this.getType() === null || this.getType() === TextNodeType.TEXT) {
				element.textContent = text;
			} else if (this.getType() === TextNodeType.HTML) {
				element.innerHTML = text;
			}
		}
		toString() {
			return this.getText() ?? '';
		}
		toJSON() {
			if (this.getType() === null) {
				return this.getText();
			}
			return {
				text: this.getText(),
				type: this.getType()
			};
		}
	}

	class Highlighter {
		static mark(text, matches) {
			let encode = true;
			if (text instanceof TextNode) {
				if (text.getType() === 'html') {
					encode = false;
				}
				text = text.getText();
			}
			if (!main_core.Type.isStringFilled(text) || !matches || matches.count() === 0) {
				return text;
			}
			const str = text;
			let result = '';
			let offset = 0;
			let chunk = '';
			matches.forEach(match => {
				if (offset > match.getStartIndex()) {
					return;
				}
				chunk = str.substring(offset, match.getStartIndex());
				result += encode ? main_core.Text.encode(chunk) : chunk;
				result += '<span class="ui-selector-highlight-mark">';
				chunk = str.substring(match.getStartIndex(), match.getEndIndex());
				result += encode ? main_core.Text.encode(chunk) : chunk;
				result += '</span>';
				offset = match.getEndIndex();
			});
			chunk = str.substring(offset);
			result += encode ? main_core.Text.encode(chunk) : chunk;
			return result;
		}
	}

	class ItemBadge {
		title = null;
		textColor = null;
		bgColor = null;
		border = null;
		containers = new WeakMap();
		constructor(badgeOptions) {
			const options = main_core.Type.isPlainObject(badgeOptions) ? badgeOptions : {};
			this.setTitle(options.title);
			this.setTextColor(options.textColor);
			this.setBgColor(options.bgColor);
			this.setBorder(options.border ?? null);
		}
		getTitle() {
			const titleNode = this.getTitleNode();
			return titleNode !== null && !titleNode.isNullable() ? titleNode.getText() : '';
		}
		getTitleNode() {
			return this.title;
		}
		setTitle(title) {
			if (main_core.Type.isStringFilled(title) || main_core.Type.isPlainObject(title) || title === null) {
				this.title = title === null ? null : new TextNode(title);
			}
		}
		getTextColor() {
			return this.textColor;
		}
		setTextColor(textColor) {
			if (main_core.Type.isString(textColor) || textColor === null) {
				this.textColor = textColor;
			}
		}
		getBgColor() {
			return this.bgColor;
		}
		setBgColor(bgColor) {
			if (main_core.Type.isString(bgColor) || bgColor === null) {
				this.bgColor = bgColor;
			}
		}
		getBorder() {
			return this.border;
		}
		setBorder(border) {
			if (main_core.Type.isString(border) || border === null) {
				this.border = border;
			}
		}
		getContainer(target) {
			let container = this.containers.get(target);
			if (!container) {
				container = document.createElement('span');
				container.className = 'ui-selector-item-badge';
				this.containers.set(target, container);
			}
			return container;
		}
		renderTo(target) {
			const container = this.getContainer(target);
			const titleNode = this.getTitleNode();
			if (titleNode) {
				titleNode.renderTo(container);
			} else {
				container.textContent = '';
			}
			main_core.Dom.style(container, 'color', this.getTextColor());
			main_core.Dom.style(container, 'background-color', this.getBgColor());
			main_core.Dom.style(container, 'border', this.getBorder());
			main_core.Dom.append(container, target);
		}
		toJSON() {
			return {
				title: this.getTitleNode(),
				textColor: this.getTextColor(),
				bgColor: this.getBgColor(),
				border: this.getBorder()
			};
		}
	}

	class Animation {
		static handleTransitionEnd(element, propertyName) {
			const properties = main_core.Type.isArray(propertyName) ? new Set(propertyName) : new Set([propertyName]);
			const computed = getComputedStyle(element);
			const durations = computed.transitionDuration.split(',').map(v => parseFloat(v) * 1000);
			const delays = computed.transitionDelay.split(',').map(v => parseFloat(v) * 1000);
			const timeout = Math.max(...durations.map((d, i) => d + (delays[i] ?? delays[0] ?? 0)), 0) + 50;
			return new Promise(resolve => {
				let finished = false;
				let timer = null;
				const finish = event => {
					if (finished) {
						return;
					}
					finished = true;
					if (timer !== null) {
						clearTimeout(timer);
					}
					main_core.Event.unbind(element, 'transitionend', handler);
					resolve(event);
				};
				const handler = event => {
					if (event.target !== element || !properties.has(event.propertyName)) {
						return;
					}
					properties.delete(event.propertyName);
					if (properties.size === 0) {
						finish(event);
					}
				};
				if (timeout <= 50) {
					queueMicrotask(() => finish(null));
					return;
				}
				main_core.Event.bind(element, 'transitionend', handler);
				timer = setTimeout(() => {
					finish(null);
				}, timeout);
			});
		}
		static handleAnimationEnd(element, animationName) {
			return new Promise(resolve => {
				const handler = event => {
					if (!animationName || event.animationName === animationName) {
						resolve(event);
						main_core.Event.unbind(element, 'animationend', handler);
					}
				};
				main_core.Event.bind(element, 'animationend', handler);
			});
		}
	}

	function isItem(item) {
		return item instanceof Item;
	}

	const regexp = /^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\W\w]*?[^;])*),(.+)$/;
	const isDataUri = str => {
		return main_core.Type.isString(str) ? str.match(regexp) !== null : false;
	};
	function encodeUrl(url) {
		if (isDataUri(url)) {
			return url;
		}
		return encodeURI(url);
	}

	class RenderMode {
		static PARTIAL = 'partial';
		static OVERRIDE = 'override';
	}
	class ItemNode {
		item = null;
		tab = null;
		id;
		cache = new main_core_cache.MemoryCache();
		parentNode = null;
		children;
		childItems = new WeakMap();
		loaded = false;
		dynamic = false;
		dynamicPromise = null;
		loader = null;
		open = false;
		autoOpen = false;
		focused = false;
		renderMode = RenderMode.PARTIAL;
		title = null;
		subtitle = null;
		supertitle = null;
		caption = null;
		captionOptions = {};
		avatar = null;
		avatarOptions = null;
		link = null;
		linkTitle = null;
		textColor = null;
		badges = null;
		badgesOptions = {};
		hidden = false;
		highlights = [];
		rendered = false;
		renderWithDebounce = main_core.Runtime.debounce(this.render, 50, this);
		constructor(item, nodeOptions) {
			const options = main_core.Type.isPlainObject(nodeOptions) ? nodeOptions : {};
			if (main_core.Type.isObject(item)) {
				this.item = item;
			}
			let comparator = null;
			if (main_core.Type.isFunction(options.itemOrder)) {
				comparator = options.itemOrder;
			} else if (main_core.Type.isPlainObject(options.itemOrder)) {
				comparator = ItemNodeComparator.makeMultipleComparator(options.itemOrder);
			}
			this.id = main_core.Text.getRandom();
			this.children = new main_core_collections.OrderedArray(comparator);
			this.renderMode = options.renderMode === RenderMode.OVERRIDE ? RenderMode.OVERRIDE : RenderMode.PARTIAL;
			if (this.renderMode === RenderMode.OVERRIDE) {
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
					iconColor: null
				};
				this.textColor = '';
				this.link = '';
				this.badges = [];
				this.captionOptions = {
					fitContent: null,
					maxWidth: null,
					justifyContent: null
				};
				this.badgesOptions = {
					fitContent: null,
					maxWidth: null,
					justifyContent: null
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
		getItem() {
			return this.item;
		}
		isRoot() {
			return this.getParentNode() === null;
		}
		getId() {
			return this.id;
		}
		getDialog() {
			return this.getTab().getDialog();
		}
		setTab(tab) {
			this.tab = tab;
		}
		getTab() {
			return this.tab;
		}
		getParentNode() {
			return this.parentNode;
		}
		setParentNode(parentNode) {
			this.parentNode = parentNode;
		}
		getNextSibling() {
			if (!this.getParentNode()) {
				return null;
			}
			const siblings = this.getParentNode().getChildren();
			const index = siblings.getIndex(this);
			return siblings.getByIndex(index + 1);
		}
		getPreviousSibling() {
			if (!this.getParentNode()) {
				return null;
			}
			const siblings = this.getParentNode().getChildren();
			const index = siblings.getIndex(this);
			return siblings.getByIndex(index - 1);
		}
		addChildren(children) {
			if (!main_core.Type.isArray(children)) {
				return;
			}
			children.forEach(childOptions => {
				delete childOptions.tabs;
				const childItem = this.getDialog().addItem(childOptions);
				const childNode = this.addItem(childItem, childOptions.nodeOptions);
				childNode.addChildren(childOptions.children);
			});
		}
		addChild(child) {
			if (!(child instanceof ItemNode)) {
				throw new TypeError('EntitySelector.ItemNode: an item must be an instance of EntitySelector.ItemNode.');
			}
			if (this.isChildOf(child) || child === this) {
				throw new Error('EntitySelector.ItemNode: a child item cannot be a parent of current item.');
			}
			if (this.getChildren().has(child) || this.childItems.has(child.getItem())) {
				return null;
			}
			this.getChildren().add(child);
			this.childItems.set(child.getItem(), child);
			child.setTab(this.getTab());
			child.setParentNode(this);
			if (this.isRendered()) {
				this.renderWithDebounce();
			}
			return child;
		}
		getDepthLevel() {
			return this.isRoot() ? 0 : this.getParentNode().getDepthLevel() + 1;
		}
		addItem(item, nodeOptions) {
			let itemNode = this.childItems.get(item);
			if (!itemNode) {
				itemNode = item.createNode(nodeOptions);
				this.addChild(itemNode);
			}
			return itemNode;
		}
		addItems(items) {
			if (main_core.Type.isArray(items)) {
				this.disableRender();
				items.forEach(item => {
					if (main_core.Type.isArray(item) && item.length === 2) {
						this.addItem(item[0], item[1]);
					} else if (isItem(item)) {
						this.addItem(item);
					}
				});
				this.enableRender();
				if (this.isRendered()) {
					this.renderWithDebounce();
				}
			}
		}
		hasItem(item) {
			return this.childItems.has(item);
		}
		removeChild(child) {
			if (!this.getChildren().has(child)) {
				return false;
			}
			child.removeChildren();
			if (child.isFocused()) {
				child.unfocus();
			}
			child.setParentNode(null);
			child.getItem().removeNode(child);
			this.getChildren().delete(child);
			this.childItems.delete(child.getItem());
			if (this.isRendered()) {
				main_core.Dom.remove(child.getOuterContainer());
			}
			return true;
		}
		removeChildren() {
			if (!this.hasChildren()) {
				return;
			}
			this.getChildren().forEach(node => {
				node.removeChildren();
				if (node.isFocused()) {
					node.unfocus();
				}
				node.setParentNode(null);
				node.getItem().removeNode(node);
			});
			this.getChildren().clear();
			this.childItems = new WeakMap();
			if (this.isRendered()) {
				this.getChildrenContainer().textContent = '';
			}
		}
		hasChild(child) {
			return this.getChildren().has(child);
		}
		isChildOf(parent) {
			let parentNode = this.getParentNode();
			while (parentNode !== null) {
				if (parentNode === parent) {
					return true;
				}
				parentNode = parentNode.getParentNode();
			}
			return false;
		}
		getFirstChild() {
			return this.children.getFirst();
		}
		getLastChild() {
			return this.children.getLast();
		}
		getChildren() {
			return this.children;
		}
		hasChildren() {
			return this.children.count() > 0;
		}
		loadChildren() {
			if (!this.isDynamic()) {
				throw new Error('EntitySelector.ItemNode.loadChildren: an item node is not dynamic.');
			}
			if (this.dynamicPromise) {
				return this.dynamicPromise;
			}
			this.dynamicPromise = main_core.ajax.runAction('ui.entityselector.getChildren', {
				json: {
					parentItem: this.getItem().getAjaxJson(),
					dialog: this.getDialog().getAjaxJson()
				},
				getParameters: {
					context: this.getDialog().getContext()
				}
			});
			this.dynamicPromise.then(response => {
				if (response && response.data && main_core.Type.isPlainObject(response.data.dialog)) {
					this.addChildren(response.data.dialog.items);
					this.render();
				}
				this.loaded = true;
			});
			this.dynamicPromise.catch(error => {
				this.loaded = false;
				this.dynamicPromise = null;
				console.error(error);
			});
			return this.dynamicPromise;
		}
		setOpen(open) {
			if (main_core.Type.isBoolean(open)) {
				if (open && this.isDynamic() && !this.isLoaded()) {
					this.setAutoOpen(true);
				} else {
					this.open = open;
				}
			}
		}
		isOpen() {
			return this.open;
		}
		isAutoOpen() {
			return this.autoOpen && this.isDynamic() && !this.isLoaded();
		}
		setAutoOpen(autoOpen) {
			if (main_core.Type.isBoolean(autoOpen)) {
				this.autoOpen = autoOpen;
			}
		}
		setDynamic(dynamic) {
			if (main_core.Type.isBoolean(dynamic)) {
				this.dynamic = dynamic;
			}
		}
		isDynamic() {
			return this.dynamic;
		}
		isLoaded() {
			return this.loaded;
		}
		getLoader() {
			if (this.loader === null) {
				this.loader = new main_loader.Loader({
					target: this.getIndicatorContainer(),
					size: 30
				});
			}
			return this.loader;
		}
		showLoader() {
			void this.getLoader().show();
			main_core.Dom.addClass(this.getIndicatorContainer(), 'ui-selector-item-indicator-hidden');
		}
		hideLoader() {
			void this.getLoader().hide();
			main_core.Dom.removeClass(this.getIndicatorContainer(), 'ui-selector-item-indicator-hidden');
		}
		destroyLoader() {
			this.getLoader().destroy();
			this.loader = null;
			main_core.Dom.removeClass(this.getIndicatorContainer(), 'ui-selector-item-indicator-hidden');
		}
		expand() {
			if (this.isOpen() || !this.hasChildren() && !this.isDynamic()) {
				return;
			}
			if (this.isDynamic() && !this.isLoaded()) {
				this.loadChildren().then(() => {
					this.destroyLoader();
					this.expand();
				});
				this.showLoader();
				return;
			}
			main_core.Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-open');
			main_core.Dom.attr(this.getOuterContainer(), 'aria-expanded', 'true');
			main_core.Dom.style(this.getChildrenContainer(), 'height', '0px');
			main_core.Dom.style(this.getChildrenContainer(), 'opacity', 0);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					main_core.Dom.style(this.getChildrenContainer(), 'height', `${this.getChildrenContainer().scrollHeight}px`);
					main_core.Dom.style(this.getChildrenContainer(), 'opacity', 1);
					Animation.handleTransitionEnd(this.getChildrenContainer(), 'height').then(() => {
						main_core.Dom.style(this.getChildrenContainer(), 'height', null);
						main_core.Dom.style(this.getChildrenContainer(), 'opacity', null);
						main_core.Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-open');
						main_core.Dom.attr(this.getOuterContainer(), 'aria-expanded', 'true');
						this.setOpen(true);
					}).catch(() => {
					});
				});
			});
		}
		collapse() {
			if (!this.isOpen()) {
				return;
			}
			main_core.Dom.style(this.getChildrenContainer(), 'height', `${this.getChildrenContainer().offsetHeight}px`);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					main_core.Dom.style(this.getChildrenContainer(), 'height', '0px');
					main_core.Dom.style(this.getChildrenContainer(), 'opacity', 0);
					Animation.handleTransitionEnd(this.getChildrenContainer(), 'height').then(() => {
						main_core.Dom.style(this.getChildrenContainer(), 'height', null);
						main_core.Dom.style(this.getChildrenContainer(), 'opacity', null);
						main_core.Dom.removeClass(this.getOuterContainer(), 'ui-selector-item-box-open');
						main_core.Dom.attr(this.getOuterContainer(), 'aria-expanded', 'false');
						this.setOpen(false);
					}).catch(() => {
					});
				});
			});
		}
		render(appendChildren = false) {
			if (this.isRoot()) {
				this.renderRoot(appendChildren);
				return;
			}
			const titleNode = this.getTitleNode();
			if (titleNode) {
				titleNode.renderTo(this.getTitleContainer());
			} else {
				this.getTitleContainer().textContent = '';
			}
			const supertitleNode = this.getSupertitleNode();
			if (supertitleNode) {
				supertitleNode.renderTo(this.getSupertitleContainer());
			} else {
				this.getSupertitleContainer().textContent = '';
			}
			const subtitleNode = this.getSubtitleNode();
			if (subtitleNode) {
				subtitleNode.renderTo(this.getSubtitleContainer());
			} else {
				this.getSubtitleContainer().textContent = '';
			}
			const captionNode = this.getCaptionNode();
			if (captionNode) {
				captionNode.renderTo(this.getCaptionContainer());
			} else {
				this.getCaptionContainer().textContent = '';
			}
			const captionFitContent = this.getCaptionOption('fitContent');
			if (main_core.Type.isBoolean(captionFitContent)) {
				main_core.Dom.style(this.getCaptionContainer(), 'flex-shrink', captionFitContent ? 0 : null);
			}
			const captionJustifyContent = this.getCaptionOption('justifyContent');
			if (main_core.Type.isStringFilled(captionJustifyContent) || captionJustifyContent === null) {
				main_core.Dom.style(this.getCaptionContainer(), {
					flexGrow: captionJustifyContent ? '1' : null,
					textAlign: captionJustifyContent || null
				});
			}
			const captionMaxWidth = this.getCaptionOption('maxWidth');
			if (main_core.Type.isString(captionMaxWidth) || main_core.Type.isNumber(captionMaxWidth)) {
				main_core.Dom.style(this.getCaptionContainer(), 'max-width', main_core.Type.isNumber(captionMaxWidth) ? `${captionMaxWidth}px` : captionMaxWidth);
			}
			if (main_core.Type.isStringFilled(this.getTextColor())) {
				this.getTitleContainer().style.color = this.getTextColor();
			} else {
				this.getTitleContainer().style.removeProperty('color');
			}
			main_core.Dom.clean(this.getAvatarContainer());
			const avatar = this.getAvatar();
			if (main_core.Type.isStringFilled(avatar)) {
				this.getAvatarContainer().style.backgroundImage = `url('${encodeUrl(avatar)}')`;
			} else {
				const bgImage = this.getAvatarOption('bgImage');
				if (main_core.Type.isStringFilled(bgImage)) {
					this.getAvatarContainer().style.backgroundImage = bgImage;
				} else {
					this.getAvatarContainer().style.removeProperty('background-image');
				}
			}
			const bgColor = this.getAvatarOption('bgColor');
			if (main_core.Type.isStringFilled(bgColor)) {
				this.getAvatarContainer().style.backgroundColor = bgColor;
			} else {
				this.getAvatarContainer().style.removeProperty('background-color');
			}
			const bgSize = this.getAvatarOption('bgSize');
			if (main_core.Type.isStringFilled(bgSize)) {
				this.getAvatarContainer().style.backgroundSize = bgSize;
			} else {
				this.getAvatarContainer().style.removeProperty('background-size');
			}
			const border = this.getAvatarOption('border');
			if (main_core.Type.isStringFilled(border)) {
				this.getAvatarContainer().style.border = border;
			} else {
				this.getAvatarContainer().style.removeProperty('border');
			}
			const borderRadius = this.getAvatarOption('borderRadius');
			if (main_core.Type.isStringFilled(borderRadius)) {
				this.getAvatarContainer().style.borderRadius = borderRadius;
			} else {
				this.getAvatarContainer().style.removeProperty('border-radius');
			}
			const outline = this.getAvatarOption('outline');
			main_core.Dom.style(this.getAvatarContainer(), 'outline', outline);
			const outlineOffset = this.getAvatarOption('outlineOffset');
			main_core.Dom.style(this.getAvatarContainer(), 'outline-offset', outlineOffset);
			const icon = {
				icon: this.getAvatarOption('icon'),
				size: bgSize ?? undefined,
				color: this.getAvatarOption('iconColor') ?? undefined
			};
			if (ui_iconSet_api_core.Icon.isValid(icon)) {
				main_core.Dom.style(this.getAvatarContainer(), 'background-image', 'none');
				main_core.Dom.append(new ui_iconSet_api_core.Icon(icon).render(), this.getAvatarContainer());
			}
			main_core.Dom.clean(this.getBadgeContainer());
			this.getBadges().forEach(badge => {
				badge.renderTo(this.getBadgeContainer());
			});
			const badgesFitContent = this.getBadgesOption('fitContent');
			if (main_core.Type.isBoolean(badgesFitContent)) {
				main_core.Dom.style(this.getBadgeContainer(), 'flex-shrink', badgesFitContent ? 0 : null);
			}
			const badgesJustifyContent = this.getBadgesOption('justifyContent');
			if (main_core.Type.isStringFilled(badgesJustifyContent) || badgesJustifyContent === null) {
				main_core.Dom.style(this.getBadgeContainer(), {
					flexGrow: badgesJustifyContent ? '1' : null,
					justifyContent: badgesJustifyContent || null
				});
			}
			const badgesMaxWidth = this.getBadgesOption('maxWidth');
			if (main_core.Type.isString(badgesMaxWidth) || main_core.Type.isNumber(badgesMaxWidth)) {
				main_core.Dom.style(this.getBadgeContainer(), 'max-width', main_core.Type.isNumber(badgesMaxWidth) ? `${badgesMaxWidth}px` : badgesMaxWidth);
			}
			const linkTitleNode = this.getLinkTitleNode();
			if (linkTitleNode) {
				linkTitleNode.renderTo(this.getLinkTextContainer());
			} else {
				this.getLinkTextContainer().textContent = '';
			}
			main_core.Dom.attr(this.getOuterContainer(), 'role', this.getTab().getItemsContainer().role === 'tree' ? 'treeitem' : 'option');
			if (this.hasChildren() || this.isDynamic()) {
				main_core.Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-has-children');
				if (this.getDepthLevel() >= this.getTab().getItemMaxDepth()) {
					main_core.Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-max-depth');
				}
			} else if (this.getOuterContainer().classList.contains('ui-selector-item-box-has-children')) {
				main_core.Dom.removeClass(this.getOuterContainer(), ['ui-selector-item-box-has-children', 'ui-selector-item-box-max-depth']);
			}
			if (this.hasChildren()) {
				const hasVisibleChild = this.getChildren().getAll().some(child => {
					return child.isHidden() !== true;
				});
				if (!hasVisibleChild) {
					this.#setHidden(true);
				}
			}
			this.toggleVisibility();
			this.highlight();
			this.renderChildren(appendChildren);
			if (this.isAutoOpen()) {
				this.setAutoOpen(false);
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						this.expand();
					});
				});
			}
			this.rendered = true;
		}
		renderRoot(appendChildren = false) {
			const isTree = this.getChildren().getAll().some(child => {
				return child.hasChildren() || child.isDynamic();
			});
			main_core.Dom.attr(this.getTab().getItemsContainer(), 'role', isTree ? 'tree' : 'listbox');
			this.renderChildren(appendChildren);
			this.rendered = true;
			const stub = this.getTab().getStub();
			if (stub && stub.isAutoShow() && (this.getDialog().isLoaded() || !this.getDialog().hasDynamicLoad())) {
				if (this.hasChildren()) {
					stub.hide();
				} else {
					stub.show();
				}
			}
		}
		renderChildren(appendChildren = false) {
			if (!appendChildren) {
				this.getChildrenContainer().textContent = '';
			}
			if (this.hasChildren()) {
				let previousSibling = null;
				this.getChildren().forEach(child => {
					child.render(appendChildren);
					const container = child.getOuterContainer();
					if (!appendChildren) {
						main_core.Dom.append(container, this.getChildrenContainer());
					}
					if (!container.parentNode) {
						if (previousSibling === null) {
							main_core.Dom.append(container, this.getChildrenContainer());
						} else {
							main_core.Dom.insertAfter(container, previousSibling.getOuterContainer());
						}
					}
					previousSibling = child;
				});
			}
		}
		isRendered() {
			return this.rendered && this.getDialog() && this.getDialog().isRendered();
		}
		enableRender() {
			this.rendered = true;
		}
		disableRender() {
			this.rendered = false;
		}
		getRenderMode() {
			return this.renderMode;
		}
		isHidden() {
			return this.hidden || this.getItem().isHidden();
		}
		setHidden(flag) {
			if (!main_core.Type.isBoolean(flag) || this.isRoot()) {
				return;
			}
			this.#setHidden(flag);
			if (this.isRendered()) {
				this.toggleVisibility();
				let parentNode = this.getParentNode();
				const isHidden = this.isHidden();
				while (parentNode.isRoot() === false) {
					if (isHidden) {
						const hasVisibleChild = parentNode.getChildren().getAll().some(child => {
							return child.isHidden() !== true;
						});
						if (!hasVisibleChild) {
							parentNode.#setHidden(true);
						}
						parentNode.toggleVisibility();
					} else {
						parentNode.#setHidden(false);
						parentNode.toggleVisibility();
						if (parentNode.isHidden()) {
							break;
						}
					}
					parentNode = parentNode.getParentNode();
				}
			}
		}
		#setHidden(flag) {
			if (main_core.Type.isBoolean(flag) && !this.isRoot()) {
				this.hidden = flag;
			}
		}
		toggleVisibility() {
			if (this.isHidden()) {
				main_core.Dom.addClass(this.getOuterContainer(), '--hidden');
			} else if (this.getOuterContainer().classList.contains('--hidden')) {
				main_core.Dom.removeClass(this.getOuterContainer(), '--hidden');
			}
		}
		lock() {
			if (this.hasChildren() || this.isDynamic()) {
				return;
			}
			main_core.Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-locked');
		}
		unlock() {
			if (this.hasChildren() || this.isDynamic()) {
				return;
			}
			main_core.Dom.removeClass(this.getOuterContainer(), 'ui-selector-item-box-locked');
		}
		getTitle() {
			const titleNode = this.getTitleNode();
			return titleNode === null ? null : titleNode.getText();
		}
		getTitleNode() {
			return this.title === null ? this.getItem().getTitleNode() : this.title;
		}
		setTitle(title) {
			if (main_core.Type.isString(title) || main_core.Type.isPlainObject(title)) {
				this.title = new TextNode(title);
			} else if (title === null) {
				this.title = null;
			}
		}
		getSubtitle() {
			const subtitleNode = this.getSubtitleNode();
			return subtitleNode === null ? null : subtitleNode.getText();
		}
		getSubtitleNode() {
			return this.subtitle === null ? this.getItem().getSubtitleNode() : this.subtitle;
		}
		setSubtitle(subtitle) {
			if (main_core.Type.isString(subtitle) || main_core.Type.isPlainObject(subtitle)) {
				this.subtitle = new TextNode(subtitle);
			} else if (subtitle === null) {
				this.subtitle = null;
			}
		}
		getSupertitle() {
			const supertitleNode = this.getSupertitleNode();
			return supertitleNode === null ? null : supertitleNode.getText();
		}
		getSupertitleNode() {
			return this.supertitle === null ? this.getItem().getSupertitleNode() : this.supertitle;
		}
		setSupertitle(supertitle) {
			if (main_core.Type.isString(supertitle) || main_core.Type.isPlainObject(supertitle)) {
				this.supertitle = new TextNode(supertitle);
			} else if (supertitle === null) {
				this.supertitle = null;
			}
		}
		getCaption() {
			const caption = this.getCaptionNode();
			return caption === null ? null : caption.getText();
		}
		getCaptionNode() {
			return this.caption === null ? this.getItem().getCaptionNode() : this.caption;
		}
		setCaption(caption) {
			if (main_core.Type.isString(caption) || main_core.Type.isPlainObject(caption)) {
				this.caption = new TextNode(caption);
			} else if (caption === null) {
				this.caption = null;
			}
		}
		getCaptionOption(option) {
			if (!main_core.Type.isUndefined(this.captionOptions[option])) {
				return this.captionOptions[option];
			}
			return this.getItem().getCaptionOption(option);
		}
		setCaptionOption(option, value) {
			if (main_core.Type.isStringFilled(option) && !main_core.Type.isUndefined(value)) {
				this.captionOptions[option] = value;
			}
		}
		setCaptionOptions(options) {
			if (main_core.Type.isPlainObject(options)) {
				Object.keys(options).forEach(option => {
					this.setCaptionOption(option, options[option]);
				});
			}
		}
		getAvatar() {
			return this.avatar === null ? this.getItem().getAvatar() : this.avatar;
		}
		setAvatar(avatar) {
			if (main_core.Type.isString(avatar) || avatar === null) {
				this.avatar = avatar;
			}
		}
		getAvatarOption(option) {
			return this.avatarOptions === null || main_core.Type.isUndefined(this.avatarOptions[option]) ? this.getItem().getAvatarOption(option) : this.avatarOptions[option];
		}
		setAvatarOption(option, value) {
			if (main_core.Type.isStringFilled(option) && !main_core.Type.isUndefined(value)) {
				if (this.avatarOptions === null) {
					this.avatarOptions = {};
				}
				this.avatarOptions[option] = value;
			}
		}
		setAvatarOptions(avatarOptions) {
			if (main_core.Type.isPlainObject(avatarOptions)) {
				Object.keys(avatarOptions).forEach(option => {
					this.setAvatarOption(option, avatarOptions[option]);
				});
			}
		}
		getTextColor() {
			return this.textColor === null ? this.getItem().getTextColor() : this.textColor;
		}
		setTextColor(textColor) {
			if (main_core.Type.isString(textColor) || textColor === null) {
				this.textColor = textColor;
			}
		}
		getLink() {
			return this.link === null ? this.getItem().getLink() : this.getItem().replaceMacros(this.link);
		}
		setLink(link) {
			if (main_core.Type.isString(link) || link === null) {
				this.link = link;
			}
		}
		getLinkTitle() {
			const linkTitle = this.getLinkTitleNode();
			return linkTitle === null ? null : linkTitle.getText();
		}
		getLinkTitleNode() {
			return this.linkTitle === null ? this.getItem().getLinkTitleNode() : this.linkTitle;
		}
		setLinkTitle(title) {
			if (main_core.Type.isString(title) || main_core.Type.isPlainObject(title)) {
				this.linkTitle = new TextNode(title);
			} else if (title === null) {
				this.linkTitle = null;
			}
		}
		getBadges() {
			return this.badges === null ? this.getItem().getBadges() : this.badges;
		}
		setBadges(badges) {
			if (main_core.Type.isArray(badges)) {
				this.badges = [];
				badges.forEach(badge => {
					this.badges.push(new ItemBadge(badge));
				});
			} else if (badges === null) {
				this.badges = null;
			}
		}
		getBadgesOption(option) {
			if (!main_core.Type.isUndefined(this.badgesOptions[option])) {
				return this.badgesOptions[option];
			}
			return this.getItem().getBadgesOption(option);
		}
		setBadgesOption(option, value) {
			if (main_core.Type.isStringFilled(option) && !main_core.Type.isUndefined(value)) {
				this.badgesOptions[option] = value;
			}
		}
		setBadgesOptions(options) {
			if (main_core.Type.isPlainObject(options)) {
				Object.keys(options).forEach(option => {
					this.setBadgesOption(option, options[option]);
				});
			}
		}
		getOuterContainer() {
			return this.cache.remember('outer-container', () => {
				let className = '';
				const div = document.createElement('div');
				if (this.hasChildren() || this.isDynamic()) {
					className += ' ui-selector-item-box-has-children';
					if (this.getDepthLevel() >= this.getTab().getItemMaxDepth()) {
						className += ' ui-selector-item-box-max-depth';
					}
					div.ariaExpanded = this.isOpen().toString();
				} else if (this.getItem().isLocked()) {
					className += ' ui-selector-item-box-locked';
				} else if (this.getItem().isSelected()) {
					className += ' ui-selector-item-box-selected';
					div.ariaSelected = 'true';
				} else {
					div.ariaSelected = 'false';
				}
				if (this.isOpen()) {
					className += ' ui-selector-item-box-open';
				}
				div.className = `ui-selector-item-box${className}`;
				div.id = this.getId();
				div.tabIndex = -1;
				if (!this.isRoot()) {
					div.dataset.testid = `ui-selector-item-${this.getItem().getEntityId()}-${this.getItem().getId()}`;
				}
				if (!this.getDialog().hasTagSelector()) {
					main_core.Event.bind(div, 'focusout', this.handleFocusOut.bind(this));
					main_core.Event.bind(div, 'focus', this.handleFocus.bind(this));
				}
				div.appendChild(this.getContainer());
				div.appendChild(this.getChildrenContainer());
				return div;
			});
		}
		getChildrenContainer() {
			if (this.isRoot() && this.getTab()) {
				return this.getTab().getItemsContainer();
			}
			return this.cache.remember('children-container', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item-children';
				div.role = 'group';
				return div;
			});
		}
		getContainer() {
			return this.cache.remember('container', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item --ui-hoverable';
				div.dataset.testid = 'ui-selector-item-content';
				main_core.Event.bind(div, 'click', this.handleClick.bind(this));
				main_core.Event.bind(div, 'mouseenter', this.handleMouseEnter.bind(this));
				main_core.Event.bind(div, 'mouseleave', this.handleMouseLeave.bind(this));
				div.appendChild(this.getAvatarContainer());
				div.appendChild(this.getTitlesContainer());
				div.appendChild(this.getIndicatorContainer());
				if (main_core.Type.isStringFilled(this.getLink())) {
					div.appendChild(this.getLinkContainer());
				}
				return div;
			});
		}
		getAvatarContainer() {
			return this.cache.remember('avatar', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item-avatar';
				div.ariaHidden = 'true';
				return div;
			});
		}
		getTitlesContainer() {
			return this.cache.remember('titles', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item-titles';
				div.appendChild(this.getSupertitleContainer());
				div.appendChild(this.getTitleBoxContainer());
				div.appendChild(this.getSubtitleContainer());
				return div;
			});
		}
		getTitleBoxContainer() {
			return this.cache.remember('title-box', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item-title-box';
				div.appendChild(this.getTitleContainer());
				div.appendChild(this.getBadgeContainer());
				div.appendChild(this.getCaptionContainer());
				return div;
			});
		}
		getTitleContainer() {
			return this.cache.remember('title', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item-title';
				return div;
			});
		}
		getSubtitleContainer() {
			return this.cache.remember('subtitle', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item-subtitle';
				return div;
			});
		}
		getSupertitleContainer() {
			return this.cache.remember('supertitle', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item-supertitle';
				return div;
			});
		}
		getCaptionContainer() {
			return this.cache.remember('caption', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item-caption';
				return div;
			});
		}
		getIndicatorContainer() {
			return this.cache.remember('indicator', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item-indicator ui-icon-set__scope';
				div.ariaHidden = 'true';
				return div;
			});
		}
		getBadgeContainer() {
			return this.cache.remember('badge', () => {
				const div = document.createElement('div');
				div.className = 'ui-selector-item-badges';
				return div;
			});
		}
		getLinkContainer() {
			return this.cache.remember('link', () => {
				const anchor = document.createElement('a');
				anchor.className = 'ui-selector-item-link';
				anchor.href = this.getLink();
				anchor.target = '_blank';
				anchor.title = '';
				anchor.ariaHidden = 'true';
				anchor.tabIndex = -1;
				main_core.Event.bind(anchor, 'click', this.handleLinkClick.bind(this));
				anchor.appendChild(this.getLinkTextContainer());
				return anchor;
			});
		}
		getLinkTextContainer() {
			return this.cache.remember('link-text', () => {
				const span = document.createElement('span');
				span.className = 'ui-selector-item-link-text';
				return span;
			});
		}
		showLink() {
			if (main_core.Type.isStringFilled(this.getLink())) {
				main_core.Dom.addClass(this.getLinkContainer(), 'ui-selector-item-link--show');
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						main_core.Dom.addClass(this.getLinkContainer(), 'ui-selector-item-link--animate');
					});
				});
			}
		}
		hideLink() {
			if (main_core.Type.isStringFilled(this.getLink())) {
				main_core.Dom.removeClass(this.getLinkContainer(), ['ui-selector-item-link--show', 'ui-selector-item-link--animate']);
			}
		}
		setHighlights(highlights) {
			this.highlights = highlights;
		}
		getHighlights() {
			return this.highlights;
		}
		highlight() {
			this.getHighlights().forEach(matchField => {
				const field = matchField.getField();
				const fieldName = field.getName();
				if (field.isCustom()) {
					const text = this.getItem().getCustomData().get(fieldName);
					this.getSubtitleContainer().innerHTML = Highlighter.mark(text, matchField.getMatches());
				} else if (field.getName() === 'title') {
					this.getTitleContainer().innerHTML = Highlighter.mark(this.getItem().getTitleNode(), matchField.getMatches());
				} else if (field.getName() === 'subtitle') {
					this.getSubtitleContainer().innerHTML = Highlighter.mark(this.getItem().getSubtitleNode(), matchField.getMatches());
				} else if (field.getName() === 'supertitle') {
					this.getSupertitleContainer().innerHTML = Highlighter.mark(this.getItem().getSupertitleNode(), matchField.getMatches());
				} else if (field.getName() === 'caption') {
					this.getCaptionContainer().innerHTML = Highlighter.mark(this.getItem().getCaptionNode(), matchField.getMatches());
				}
			});
		}
		select() {
			if (this.hasChildren() || this.isDynamic()) {
				return;
			}
			main_core.Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-selected');
			main_core.Dom.attr(this.getOuterContainer(), 'aria-selected', 'true');
		}
		deselect() {
			if (this.hasChildren() || this.isDynamic()) {
				return;
			}
			main_core.Dom.removeClass(this.getOuterContainer(), 'ui-selector-item-box-selected');
			main_core.Dom.attr(this.getOuterContainer(), 'aria-selected', 'false');
		}
		focus(focusVisible = false) {
			if (this.isFocused()) {
				return;
			}
			this.focused = true;
			main_core.Dom.addClass(this.getOuterContainer(), 'ui-selector-item-box-focused');
			if (!this.getDialog().hasTagSelector() && this.getDialog().getFocusTrap() !== null) {
				main_core.Dom.attr(this.getOuterContainer(), 'tabindex', 0);
				this.getOuterContainer().focus();
				if (focusVisible) {
					main_core.Dom.addClass(this.getOuterContainer(), '--focus-visible');
				} else {
					main_core.Dom.removeClass(this.getOuterContainer(), '--focus-visible');
				}
			}
			this.getDialog().emit('ItemNode:onFocus', {
				node: this
			});
		}
		unfocus() {
			if (!this.isFocused()) {
				return;
			}
			this.focused = false;
			main_core.Dom.removeClass(this.getOuterContainer(), 'ui-selector-item-box-focused --focus-visible');
			main_core.Dom.attr(this.getOuterContainer(), 'tabindex', -1);
			this.getDialog().emit('ItemNode:onUnfocus', {
				node: this
			});
		}
		isFocused() {
			return this.focused;
		}
		click() {
			if (this.hasChildren() || this.isDynamic()) {
				if (this.isOpen()) {
					this.collapse();
				} else {
					this.expand();
				}
				this.getDialog().focusSearch();
			} else if (this.getItem().isSelected()) {
				if (this.getItem().isDeselectable()) {
					this.getItem().deselect({
						node: this
					});
					this.getDialog().focusSearch();
				}
				if (!this.getItem().isSelected() && this.getDialog().shouldHideOnDeselect()) {
					this.getDialog().hide();
				}
			} else {
				this.getItem().select({
					node: this
				});
				if (this.getDialog().shouldClearSearchOnSelect()) {
					this.getDialog().clearSearch();
					this.getDialog().focusSearch();
				}
				if (this.getItem().isSelected() && this.getDialog().shouldHideOnSelect()) {
					this.getDialog().hide();
				}
			}
		}
		scrollIntoView() {
			const tabContainer = this.getTab().getContainer();
			const nodeContainer = this.getContainer();
			const tabRect = main_core.Dom.getPosition(tabContainer);
			const nodeRect = main_core.Dom.getPosition(nodeContainer);
			const margin = 9;
			if (nodeRect.top < tabRect.top)
				{
					tabContainer.scrollTop -= tabRect.top - nodeRect.top + margin;
				} else if (nodeRect.bottom > tabRect.bottom)
				{
					tabContainer.scrollTop += nodeRect.bottom - tabRect.bottom + margin;
				}
		}
		#makeEllipsisTitle() {
			if (ItemNode.#isEllipsisActive(this.getTitleContainer())) {
				this.getContainer().setAttribute('title', ItemNode.#sanitizeTitle(this.getTitleContainer().textContent));
			} else {
				main_core.Dom.attr(this.getContainer(), 'title', null);
			}
			const containers = [this.getSupertitleContainer(), this.getSubtitleContainer(), this.getCaptionContainer(), ...this.getBadges().map(badge => badge.getContainer(this.getBadgeContainer()))];
			containers.forEach(container => {
				if (ItemNode.#isEllipsisActive(container)) {
					container.setAttribute('title', ItemNode.#sanitizeTitle(container.textContent));
				} else {
					main_core.Dom.attr(container, 'title', null);
				}
			});
		}
		static #isEllipsisActive(element) {
			return element.offsetWidth < element.scrollWidth;
		}
		static #sanitizeTitle(text) {
			return text.replace(/[\t ]+/gm, ' ').replace(/\n+/gm, '\n').trim();
		}
		handleClick() {
			this.click();
		}
		handleLinkClick(event) {
			this.getDialog().emit('ItemNode:onLinkClick', {
				node: this,
				event
			});
			event.stopPropagation();
		}
		handleMouseEnter() {
			this.focus();
			this.showLink();
			this.#makeEllipsisTitle();
		}
		handleMouseLeave() {
			this.unfocus();
			this.hideLink();
		}
		handleFocusOut() {
			if (this.isFocused()) {
				main_core.Dom.removeClass(this.getOuterContainer(), '--focus-visible');
			}
		}
		handleFocus() {
			if (this.isFocused() && this.getDialog().getFocusTrap() !== null) {
				main_core.Dom.addClass(this.getOuterContainer(), '--focus-visible');
			}
		}
	}

	class SearchFieldIndex {
		field = null;
		indexes = [];
		constructor(field, indexes = []) {
			this.field = field;
			this.addIndexes(indexes);
		}
		getField() {
			return this.field;
		}
		getIndexes() {
			return this.indexes;
		}
		addIndex(index) {
			this.getIndexes().push(index);
		}
		addIndexes(indexes) {
			for (const index of indexes) {
				this.addIndex(index);
			}
		}
	}

	class WordIndex {
		word = '';
		startIndex = 0;
		constructor(word, startIndex) {
			this.setWord(word);
			this.setStartIndex(startIndex);
		}
		getWord() {
			return this.word;
		}
		setWord(word) {
			if (main_core.Type.isStringFilled(word)) {
				this.word = word;
			}
			return this;
		}
		getStartIndex() {
			return this.startIndex;
		}
		setStartIndex(index) {
			if (main_core.Type.isNumber(index) && index >= 0) {
				this.startIndex = index;
			}
			return this;
		}
	}

	const rsAstralRange = '\\ud800-\\udfff';
	const rsComboMarksRange = '\\u0300-\\u036f';
	const reComboHalfMarksRange = '\\ufe20-\\ufe2f';
	const rsComboSymbolsRange = '\\u20d0-\\u20ff';
	const rsComboMarksExtendedRange = '\\u1ab0-\\u1aff';
	const rsComboMarksSupplementRange = '\\u1dc0-\\u1dff';
	const rsComboRange = rsComboMarksRange + reComboHalfMarksRange + rsComboSymbolsRange + rsComboMarksExtendedRange + rsComboMarksSupplementRange;
	const rsDingbatRange = '\\u2700-\\u27bf';
	const rsLowerRange = 'a-z\\xdf-\\xf6\\xf8-\\xff';
	const rsMathOpRange = '\\xac\\xb1\\xd7\\xf7';
	const rsNonCharRange = '\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf';
	const rsPunctuationRange = '\\u2000-\\u206f';
	const rsSpaceRange = ' \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000';
	const rsUpperRange = 'A-Z\\xc0-\\xd6\\xd8-\\xde';
	const rsVarRange = '\\ufe0e\\ufe0f';
	const rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
	const rsApos = '[\'\u2019]';
	const rsBreak = `[${rsBreakRange}]`;
	const rsCombo = `[${rsComboRange}]`;
	const rsDigit = '\\d';
	const rsDingbat = `[${rsDingbatRange}]`;
	const rsLower = `[${rsLowerRange}]`;
	const rsMisc = `[^${rsAstralRange}${rsBreakRange + rsDigit + rsDingbatRange + rsLowerRange + rsUpperRange}]`;
	const rsFitz = '\\ud83c[\\udffb-\\udfff]';
	const rsModifier = `(?:${rsCombo}|${rsFitz})`;
	const rsNonAstral = `[^${rsAstralRange}]`;
	const rsRegional = '(?:\\ud83c[\\udde6-\\uddff]){2}';
	const rsSurrPair = '[\\ud800-\\udbff][\\udc00-\\udfff]';
	const rsUpper = `[${rsUpperRange}]`;
	const rsZWJ = '\\u200d';
	const rsMiscLower = `(?:${rsLower}|${rsMisc})`;
	const rsMiscUpper = `(?:${rsUpper}|${rsMisc})`;
	const rsOptContrLower = `(?:${rsApos}(?:d|ll|m|re|s|t|ve))?`;
	const rsOptContrUpper = `(?:${rsApos}(?:D|LL|M|RE|S|T|VE))?`;
	const reOptMod = `${rsModifier}?`;
	const rsOptVar = `[${rsVarRange}]?`;
	const rsOptJoin = `(?:${rsZWJ}(?:${[rsNonAstral, rsRegional, rsSurrPair].join('|')})${rsOptVar + reOptMod})*`;
	const rsOrdLower = '\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])';
	const rsOrdUpper = '\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])';
	const rsSeq = rsOptVar + reOptMod + rsOptJoin;
	const rsEmoji = `(?:${[rsDingbat, rsRegional, rsSurrPair].join('|')})${rsSeq}`;
	const unicodeWordsRegExp = new RegExp([`${rsUpper}?${rsLower}+${rsOptContrLower}(?=${[rsBreak, rsUpper, '$'].join('|')})`, `${rsMiscUpper}+${rsOptContrUpper}(?=${[rsBreak, rsUpper + rsMiscLower, '$'].join('|')})`, `${rsUpper}?${rsMiscLower}+${rsOptContrLower}`, `${rsUpper}+${rsOptContrUpper}`, rsOrdUpper, rsOrdLower, `${rsDigit}+`, rsEmoji].join('|'), 'g');

	const asciiWordRegExp = /[^\x00-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g;
	const hasUnicodeWordRegExp = /[a-z][A-Z]|[A-Z]{2}[a-z]|\d[A-Za-z]|[A-Za-z]\d|[^\d A-Za-z]/;
	const nonWhitespaceRegExp = /\S+/g;
	const specialChars = '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}';
	const specialCharsRegExp = new RegExp(`[${specialChars}]`);
	class SearchIndex {
		indexes = [];
		addIndex(fieldIndex) {
			if (fieldIndex instanceof SearchFieldIndex) {
				this.getIndexes().push(fieldIndex);
			}
		}
		getIndexes() {
			return this.indexes;
		}
		static create(item) {
			const index = new SearchIndex();
			const entity = item.getEntity();
			if (!item.isSearchable() || !entity.isSearchable() || item.isHidden()) {
				return index;
			}
			const searchFields = entity.getSearchFields();
			searchFields.forEach(field => {
				if (!field.isSearchable()) {
					return;
				}
				if (field.isSystem()) {
					if (field.getName() === 'title') {
						const textNode = item.getTitleNode();
						const stripTags = textNode !== null && textNode.getType() === 'html';
						index.addIndex(this.createIndex(field, item.getTitle(), stripTags));
					} else if (field.getName() === 'subtitle') {
						const textNode = item.getSubtitleNode();
						const stripTags = textNode !== null && textNode.getType() === 'html';
						index.addIndex(this.createIndex(field, item.getSubtitle(), stripTags));
					} else if (field.getName() === 'supertitle') {
						const textNode = item.getSupertitleNode();
						const stripTags = textNode !== null && textNode.getType() === 'html';
						index.addIndex(this.createIndex(field, item.getSupertitle(), stripTags));
					} else if (field.getName() === 'caption') {
						const textNode = item.getCaptionNode();
						const stripTags = textNode !== null && textNode.getType() === 'html';
						index.addIndex(this.createIndex(field, item.getCaption(), stripTags));
					}
				} else {
					const customData = item.getCustomData().get(field.getName());
					if (!main_core.Type.isUndefined(customData)) {
						index.addIndex(this.createIndex(field, customData));
					}
				}
			});
			return index;
		}
		static createIndex(field, text, stripTags = false) {
			if (!main_core.Type.isStringFilled(text)) {
				return null;
			}
			if (stripTags) {
				text = text.replace(/<\/?[^>]+>/g, match => ' '.repeat(match.length));
				text = text.replace(/&(?:#\d+|#x[\dA-Fa-f]+|[\dA-Za-z]+);/g, match => ' '.repeat(match.length));
			}
			let index = null;
			if (field.getType() === 'string') {
				const wordIndexes = this.splitText(text);
				if (main_core.Type.isArrayFilled(wordIndexes)) {
					this.fillComplexWords(wordIndexes);
					this.fillNonCharWords(wordIndexes, text);
					index = new SearchFieldIndex(field, wordIndexes);
				}
			} else if (field.getType() === 'email') {
				const position = text.indexOf('@');
				if (position !== -1) {
					index = new SearchFieldIndex(field, [new WordIndex(text.toLowerCase(), 0), new WordIndex(text.substr(position + 1).toLowerCase(), position + 1)]);
				}
			}
			return index;
		}
		static splitText(text) {
			if (!main_core.Type.isStringFilled(text)) {
				return [];
			}
			return this.hasUnicodeWord(text) ? this.splitUnicodeText(text) : this.splitAsciiText(text);
		}
		static splitUnicodeText(text) {
			return this.splitTextInternal(text, unicodeWordsRegExp);
		}
		static splitAsciiText(text) {
			return this.splitTextInternal(text, asciiWordRegExp);
		}
		static hasUnicodeWord(text) {
			return hasUnicodeWordRegExp.test(text);
		}
		static splitTextInternal(text, regExp) {
			let match;
			const result = [];
			regExp.lastIndex = 0;
			while ((match = regExp.exec(text)) !== null) {
				if (match.index === regExp.lastIndex) {
					regExp.lastIndex++;
				}
				result.push(new WordIndex(match[0].toLowerCase(), match.index));
			}
			return result;
		}
		static fillComplexWords(indexes) {
			if (indexes.length < 2) {
				return;
			}
			let complexWord = null;
			let startIndex = null;
			indexes.forEach((currentIndex, currentArrayIndex) => {
				const nextIndex = indexes[currentArrayIndex + 1];
				if (nextIndex) {
					const sameWord = currentIndex.getStartIndex() + currentIndex.getWord().length === nextIndex.getStartIndex();
					if (sameWord) {
						if (complexWord === null) {
							complexWord = currentIndex.getWord();
							startIndex = currentIndex.getStartIndex();
						}
						complexWord += nextIndex.getWord();
					} else if (complexWord !== null) {
						indexes.push(new WordIndex(complexWord, startIndex));
						complexWord = null;
						startIndex = null;
					}
				} else if (complexWord !== null) {
					indexes.push(new WordIndex(complexWord, startIndex));
					complexWord = null;
					startIndex = null;
				}
			});
		}
		static fillNonCharWords(indexes, text) {
			if (!specialCharsRegExp.test(text)) {
				return;
			}
			let match;
			while ((match = nonWhitespaceRegExp.exec(text)) !== null) {
				if (match.index === nonWhitespaceRegExp.lastIndex) {
					nonWhitespaceRegExp.lastIndex++;
				}
				const word = match[0];
				if (specialCharsRegExp.test(word)) {
					indexes.push(new WordIndex(word.toLowerCase(), match.index));
					for (let i = 0; i < word.length; i++) {
						const char = word[i];
						if (!specialChars.includes(char)) {
							break;
						}
						const wordToIndex = word.substr(i + 1);
						if (wordToIndex.length) {
							indexes.push(new WordIndex(wordToIndex.toLowerCase(), match.index + i + 1));
						}
					}
				}
			}
			nonWhitespaceRegExp.lastIndex = 0;
		}
	}

	class SearchField {
		name = null;
		type = 'string';
		searchable = true;
		system = false;
		sort = null;
		constructor(fieldOptions) {
			const options = main_core.Type.isPlainObject(fieldOptions) ? fieldOptions : {};
			if (!main_core.Type.isStringFilled(options.name)) {
				throw new Error('EntitySelector.SearchField: "name" parameter is required.');
			}
			this.name = options.name;
			this.setType(options.type);
			this.setSystem(options.system);
			this.setSort(options.sort);
			this.setSearchable(options.searchable);
		}
		getName() {
			return this.name;
		}
		getType() {
			return this.type;
		}
		setType(type) {
			if (main_core.Type.isStringFilled(type)) {
				this.type = type;
			}
		}
		getSort() {
			return this.sort;
		}
		setSort(sort) {
			if (main_core.Type.isNumber(sort) || sort === null) {
				this.sort = sort;
			}
		}
		setSearchable(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.searchable = flag;
			}
		}
		isSearchable() {
			return this.searchable;
		}
		setSystem(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.system = flag;
			}
		}
		isCustom() {
			return !this.isSystem();
		}
		isSystem() {
			return this.system;
		}
	}

	class EntityFilter {
		id = null;
		options = {};
		constructor(filterOptions) {
			const options = main_core.Type.isPlainObject(filterOptions) ? filterOptions : {};
			this.id = options.id;
			this.options = main_core.Type.isPlainObject(options.options) ? options.options : this.options;
		}
		getId() {
			return this.id;
		}
		getOptions() {
			return this.options;
		}
		toJSON() {
			return {
				id: this.getId(),
				options: this.getOptions()
			};
		}
	}

	class Entity {
		static extensions = null;
		static defaultOptions = null;
		id;
		options = {};
		searchable = true;
		searchFields;
		dynamicLoad = false;
		dynamicSearch = false;
		dynamicSearchMatchMode = 'exact';
		substituteEntityId = null;
		fillRecentItems = true;
		searchCacheLimits = [];
		filters = new Map();
		itemOptions = {};
		tagOptions = {};
		badgeOptions = [];
		textNodes = new Map();
		constructor(entityOptions) {
			let options = main_core.Type.isPlainObject(entityOptions) ? entityOptions : {};
			if (!main_core.Type.isStringFilled(options.id)) {
				throw new Error('EntitySelector.Entity: "id" parameter is required.');
			}
			const defaultOptions = Entity.getEntityDefaultOptions(options.id) || {};
			options = main_core.Runtime.merge(JSON.parse(JSON.stringify(defaultOptions)), options);
			this.id = options.id.toLowerCase();
			this.options = main_core.Type.isPlainObject(options.options) ? options.options : {};
			this.itemOptions = main_core.Type.isPlainObject(options.itemOptions) ? options.itemOptions : {};
			this.tagOptions = main_core.Type.isPlainObject(options.tagOptions) ? options.tagOptions : {};
			this.badgeOptions = main_core.Type.isArray(options.badgeOptions) ? options.badgeOptions : [];
			this.substituteEntityId = main_core.Type.isStringFilled(options.substituteEntityId) ? options.substituteEntityId : null;
			this.fillRecentItems = main_core.Type.isBoolean(options.fillRecentItems) ? options.fillRecentItems : true;
			if (main_core.Type.isArray(options.filters)) {
				options.filters.forEach(filterOptions => {
					this.addFilter(filterOptions);
				});
			}
			this.searchFields = new main_core_collections.OrderedArray((fieldA, fieldB) => {
				if (fieldA.getSort() !== null && fieldB.getSort() === null) {
					return -1;
				}
				if (fieldA.getSort() === null && fieldB.getSort() !== null) {
					return 1;
				}
				if (fieldA.getSort() === null && fieldB.getSort() === null) {
					return -1;
				}
				return fieldA.getSort() - fieldB.getSort();
			});
			this.setSearchable(options.searchable);
			this.setDynamicLoad(options.dynamicLoad);
			this.setDynamicSearch(options.dynamicSearch);
			this.setDynamicSearchMatchMode(options.dynamicSearchMatchMode);
			this.setSearchFields(options.searchFields);
			this.setSearchCacheLimits(options.searchCacheLimits);
		}
		static getDefaultOptions() {
			if (this.defaultOptions === null) {
				this.defaultOptions = {};
				for (const extension of this.getExtensions()) {
					const settings = main_core.Extension.getSettings(extension);
					const entities = settings.get('entities', []);
					for (const entity of entities) {
						if (main_core.Type.isStringFilled(entity.id) && main_core.Type.isPlainObject(entity.options)) {
							this.defaultOptions[entity.id] = JSON.parse(JSON.stringify(entity.options));
						}
					}
				}
			}
			return this.defaultOptions;
		}
		static getExtensions() {
			if (this.extensions === null) {
				const settings = main_core.Extension.getSettings('ui.entity-selector');
				this.extensions = settings.get('extensions', []);
			}
			return this.extensions;
		}
		static getEntityDefaultOptions(entityId) {
			return this.getDefaultOptions()[entityId] || null;
		}
		static getItemOptions(entityId, entityType) {
			if (!main_core.Type.isStringFilled(entityId)) {
				return null;
			}
			const options = this.getEntityDefaultOptions(entityId);
			const itemOptions = options && options.itemOptions ? options.itemOptions : null;
			if (main_core.Type.isUndefined(entityType)) {
				return itemOptions;
			}
			return itemOptions && !main_core.Type.isUndefined(itemOptions[entityType]) ? itemOptions[entityType] : null;
		}
		static getTagOptions(entityId, entityType) {
			if (!main_core.Type.isStringFilled(entityId)) {
				return null;
			}
			const options = this.getEntityDefaultOptions(entityId);
			const tagOptions = options && options.tagOptions ? options.tagOptions : null;
			if (main_core.Type.isUndefined(entityType)) {
				return tagOptions;
			}
			return tagOptions && !main_core.Type.isUndefined(tagOptions[entityType]) ? tagOptions[entityType] : null;
		}
		getId() {
			return this.id;
		}
		getOptions() {
			return this.options;
		}
		getItemOptions() {
			return this.itemOptions;
		}
		static getItemOption(entityId, option, entityType) {
			return this.getOptionInternal(this.getItemOptions(entityId), option, entityType);
		}
		getItemOption(option, entityType) {
			return Entity.getOptionInternal(this.itemOptions, option, entityType);
		}
		getTagOptions() {
			return this.tagOptions;
		}
		static getTagOption(entityId, option, entityType) {
			return this.getOptionInternal(this.getTagOptions(entityId), option, entityType);
		}
		getTagOption(option, entityType) {
			return Entity.getOptionInternal(this.tagOptions, option, entityType);
		}
		static getOptionInternal(options, option, type) {
			if (!main_core.Type.isPlainObject(options)) {
				return null;
			}
			const map = options;
			if (map[type] && !main_core.Type.isUndefined(map[type][option])) {
				return map[type][option];
			}
			if (map['default'] && !main_core.Type.isUndefined(map['default'][option])) {
				return map['default'][option];
			}
			return null;
		}
		getBadges(item) {
			const entityTypeBadges = this.getItemOption('badges', item.getEntityType()) || [];
			const badges = [...entityTypeBadges];
			this.badgeOptions.forEach(badge => {
				if (main_core.Type.isPlainObject(badge.conditions)) {
					for (const condition in badge.conditions) {
						if (item.getCustomData().get(condition) !== badge.conditions[condition]) {
							return;
						}
					}
					badges.push(badge);
				}
			});
			return badges;
		}
		getOptionTextNode(option, entityType) {
			if (!main_core.Type.isString(option)) {
				return null;
			}
			if (!main_core.Type.isString(entityType)) {
				entityType = 'default';
			}
			let optionNodes = this.textNodes.get(option);
			let node = optionNodes ? optionNodes.get(entityType) : undefined;
			if (main_core.Type.isUndefined(node)) {
				if (!optionNodes) {
					optionNodes = new Map();
					this.textNodes.set(option, optionNodes);
				}
				const itemOption = this.getItemOption(option, entityType);
				node = main_core.Type.isString(itemOption) || main_core.Type.isPlainObject(itemOption) ? new TextNode(itemOption) : null;
				optionNodes.set(entityType, node);
			}
			return node;
		}
		isSearchable() {
			return this.searchable;
		}
		setSearchable(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.searchable = flag;
			}
		}
		getSearchFields() {
			return this.searchFields;
		}
		setSearchFields(searchFields) {
			this.searchFields.clear();
			const titleField = new SearchField({
				name: 'title',
				searchable: true,
				system: true,
				type: 'string'
			});
			const subtitleField = new SearchField({
				name: 'subtitle',
				searchable: true,
				system: true,
				type: 'string'
			});
			this.searchFields.add(titleField);
			this.searchFields.add(subtitleField);
			const customFields = main_core.Type.isArray(searchFields) ? searchFields : [];
			for (const fieldOptions of customFields) {
				const field = new SearchField(fieldOptions);
				if (field.isSystem())
					{
						if (field.getName() === 'title') {
							this.searchFields.delete(titleField);
						} else if (field.getName() === 'subtitle') {
							this.searchFields.delete(subtitleField);
						}
					}
				this.searchFields.add(field);
			}
			this.searchFields.forEach((field, index) => {
				field.setSort(index);
			});
		}
		setSearchCacheLimits(limits) {
			if (main_core.Type.isArrayFilled(limits)) {
				for (const limit of limits) {
					if (main_core.Type.isStringFilled(limit)) {
						this.searchCacheLimits.push(new RegExp(limit, 'i'));
					}
				}
			}
		}
		getSearchCacheLimits() {
			return this.searchCacheLimits;
		}
		hasDynamicLoad() {
			return this.dynamicLoad;
		}
		setDynamicLoad(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.dynamicLoad = flag;
			}
		}
		hasDynamicSearch() {
			return this.dynamicSearch;
		}
		setDynamicSearch(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.dynamicSearch = flag;
			}
		}
		setDynamicSearchMatchMode(mode) {
			if (mode === 'all' || mode === 'exact') {
				this.dynamicSearchMatchMode = mode;
			}
		}
		getDynamicSearchMatchMode() {
			return this.dynamicSearchMatchMode;
		}
		getFilters() {
			return [...this.filters.values()];
		}
		addFilters(filters) {
			if (main_core.Type.isArray(filters)) {
				filters.forEach(filterOptions => {
					this.addFilter(filterOptions);
				});
			}
		}
		addFilter(filterOptions) {
			if (main_core.Type.isPlainObject(filterOptions)) {
				const filter = new EntityFilter(filterOptions);
				this.filters.set(filter.getId(), filter);
			}
		}
		getFilter(id) {
			return this.filters.get(id) || null;
		}
		getSubstituteEntityId() {
			return this.substituteEntityId;
		}
		shouldFillRecentItems() {
			return this.fillRecentItems;
		}
		toJSON() {
			return {
				id: this.getId(),
				options: this.getOptions(),
				searchable: this.isSearchable(),
				dynamicLoad: this.hasDynamicLoad(),
				dynamicSearch: this.hasDynamicSearch(),
				filters: this.getFilters(),
				substituteEntityId: this.getSubstituteEntityId(),
				fillRecentItems: this.shouldFillRecentItems()
			};
		}
	}

	class TypeUtils {
		static createMapFromOptions(options) {
			if (main_core.Type.isPlainObject(options)) {
				return new Map(Object.entries(options));
			}
			const map = new Map();
			if (main_core.Type.isArrayFilled(options)) {
				options.forEach(element => {
					if (main_core.Type.isArray(element) && element.length === 2 && main_core.Type.isString(element[0])) {
						map.set(element[0], element[1]);
					}
				});
			}
			return map;
		}
		static convertMapToObject(map) {
			const obj = {};
			if (main_core.Type.isMap(map)) {
				map.forEach((value, key) => {
					if (main_core.Type.isString(key)) {
						obj[key] = value;
					}
				});
			}
			return obj;
		}
	}

	class Item {
		id;
		entityId;
		entityType;
		title = null;
		subtitle = null;
		supertitle = null;
		caption = null;
		captionOptions = {};
		avatar = null;
		avatarOptions = null;
		textColor = null;
		link = null;
		linkTitle = null;
		tagOptions;
		badges = null;
		badgesOptions = {};
		dialog;
		nodes = new Set();
		selected = false;
		searchable = true;
		saveable = true;
		deselectable = true;
		hidden = false;
		locked = false;
		searchIndex = null;
		customData;
		sort = null;
		contextSort = null;
		globalSort = null;
		constructor(itemOptions) {
			const options = main_core.Type.isPlainObject(itemOptions) ? itemOptions : {};
			if (!main_core.Type.isStringFilled(options.id) && !main_core.Type.isNumber(options.id)) {
				throw new Error('EntitySelector.Item: "id" parameter is required.');
			}
			if (!main_core.Type.isStringFilled(options.entityId)) {
				throw new Error('EntitySelector.Item: "entityId" parameter is required.');
			}
			this.id = options.id;
			this.entityId = options.entityId.toLowerCase();
			this.entityType = main_core.Type.isStringFilled(options.entityType) ? options.entityType : 'default';
			this.locked = main_core.Type.isBoolean(options.locked) ? options.locked : false;
			this.selected = main_core.Type.isBoolean(options.selected) && !this.locked ? options.selected : false;
			this.customData = TypeUtils.createMapFromOptions(options.customData);
			this.tagOptions = TypeUtils.createMapFromOptions(options.tagOptions);
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
			this.setSearchable(options.searchable);
			this.setSaveable(options.saveable);
			this.setDeselectable(options.deselectable);
			this.setHidden(options.hidden);
			this.setContextSort(options.contextSort);
			this.setGlobalSort(options.globalSort);
			this.setSort(options.sort);
		}
		getId() {
			return this.id;
		}
		getEntityId() {
			return this.entityId;
		}
		getEntity() {
			let entity = this.getDialog().getEntity(this.getEntityId());
			if (entity === null) {
				entity = new Entity({
					id: this.getEntityId()
				});
				this.getDialog().addEntity(entity);
			}
			return entity;
		}
		getEntityType() {
			return this.entityType;
		}
		getTitle() {
			const titleNode = this.getTitleNode();
			return titleNode !== null && !titleNode.isNullable() ? titleNode.getText() : '';
		}
		getTitleNode() {
			return this.title;
		}
		setTitle(title) {
			if (main_core.Type.isStringFilled(title) || main_core.Type.isPlainObject(title) || title === null) {
				this.title = title === null ? null : new TextNode(title);
				this.resetSearchIndex();
				this.#renderNodes();
			}
		}
		getSubtitle() {
			const subtitleNode = this.getSubtitleNode();
			return subtitleNode === null ? null : subtitleNode.getText();
		}
		getSubtitleNode() {
			return this.subtitle === null ? this.getEntityTextNode('subtitle') : this.subtitle;
		}
		setSubtitle(subtitle) {
			if (main_core.Type.isString(subtitle) || main_core.Type.isPlainObject(subtitle) || subtitle === null) {
				this.subtitle = subtitle === null ? null : new TextNode(subtitle);
				this.resetSearchIndex();
				this.#renderNodes();
			}
		}
		getSupertitle() {
			const supertitleNode = this.getSupertitleNode();
			return supertitleNode === null ? null : supertitleNode.getText();
		}
		getSupertitleNode() {
			return this.supertitle === null ? this.getEntityTextNode('supertitle') : this.supertitle;
		}
		setSupertitle(supertitle) {
			if (main_core.Type.isString(supertitle) || main_core.Type.isPlainObject(supertitle) || supertitle === null) {
				this.supertitle = supertitle === null ? null : new TextNode(supertitle);
				this.resetSearchIndex();
				this.#renderNodes();
			}
		}
		getCaption() {
			const captionNode = this.getCaptionNode();
			return captionNode === null ? null : captionNode.getText();
		}
		getCaptionNode() {
			return this.caption === null ? this.getEntityTextNode('caption') : this.caption;
		}
		setCaption(caption) {
			if (main_core.Type.isString(caption) || main_core.Type.isPlainObject(caption) || caption === null) {
				this.caption = caption === null ? null : new TextNode(caption);
				this.resetSearchIndex();
				this.#renderNodes();
			}
		}
		getCaptionOption(option) {
			if (!main_core.Type.isUndefined(this.captionOptions[option])) {
				return this.captionOptions[option];
			}
			const captionOptions = this.getEntityItemOption('captionOptions');
			if (main_core.Type.isPlainObject(captionOptions) && !main_core.Type.isUndefined(captionOptions[option])) {
				return captionOptions[option];
			}
			return null;
		}
		setCaptionOption(option, value) {
			if (main_core.Type.isStringFilled(option) && !main_core.Type.isUndefined(value)) {
				this.captionOptions[option] = value;
				this.#renderNodes();
			}
		}
		setCaptionOptions(options) {
			if (main_core.Type.isPlainObject(options)) {
				Object.keys(options).forEach(option => {
					this.setCaptionOption(option, options[option]);
				});
			}
		}
		getAvatar() {
			return this.avatar === null ? this.getEntityItemOption('avatar') : this.avatar;
		}
		setAvatar(avatar) {
			if (main_core.Type.isString(avatar) || avatar === null) {
				this.avatar = avatar;
				this.#renderNodes();
			}
		}
		getAvatarOption(option) {
			if (this.avatarOptions !== null && !main_core.Type.isUndefined(this.avatarOptions[option])) {
				return this.avatarOptions[option];
			}
			const avatarOptions = this.getEntityItemOption('avatarOptions');
			if (main_core.Type.isPlainObject(avatarOptions) && !main_core.Type.isUndefined(avatarOptions[option])) {
				return avatarOptions[option];
			}
			return null;
		}
		setAvatarOption(option, value) {
			if (main_core.Type.isStringFilled(option) && !main_core.Type.isUndefined(value)) {
				if (this.avatarOptions === null) {
					this.avatarOptions = {};
				}
				this.avatarOptions[option] = value;
				this.#renderNodes();
			}
		}
		setAvatarOptions(options) {
			if (main_core.Type.isPlainObject(options)) {
				Object.keys(options).forEach(option => {
					this.setAvatarOption(option, options[option]);
				});
			}
		}
		getTextColor() {
			return this.textColor === null ? this.getEntityItemOption('textColor') : this.textColor;
		}
		setTextColor(textColor) {
			if (main_core.Type.isString(textColor) || textColor === null) {
				this.textColor = textColor;
				this.#renderNodes();
			}
		}
		getLink() {
			const link = this.link === null ? this.getEntityItemOption('link') : this.link;
			return this.replaceMacros(link);
		}
		setLink(link) {
			if (main_core.Type.isString(link) || link === null) {
				this.link = link;
				this.#renderNodes();
			}
		}
		getLinkTitle() {
			const linkTitleNode = this.getLinkTitleNode();
			return linkTitleNode === null ? main_core.Loc.getMessage('UI_SELECTOR_ITEM_LINK_TITLE') || '' : linkTitleNode.getText();
		}
		getLinkTitleNode() {
			return this.linkTitle === null ? this.getEntityTextNode('linkTitle') : this.linkTitle;
		}
		setLinkTitle(linkTitle) {
			if (main_core.Type.isString(linkTitle) || main_core.Type.isPlainObject(linkTitle) || linkTitle === null) {
				this.linkTitle = linkTitle === null ? null : new TextNode(linkTitle);
				this.#renderNodes();
			}
		}
		getBadges() {
			if (this.badges !== null) {
				return this.badges;
			}
			const badges = this.getEntity().getBadges(this);
			if (main_core.Type.isArray(badges)) {
				this.badges = [];
				for (const badge of badges) {
					this.badges.push(new ItemBadge(badge));
				}
			} else {
				this.badges = [];
			}
			return this.badges;
		}
		setBadges(badges) {
			if (main_core.Type.isArray(badges)) {
				this.badges = [];
				for (const badge of badges) {
					this.badges.push(new ItemBadge(badge));
				}
				this.#renderNodes();
			} else if (badges === null) {
				this.badges = null;
				this.#renderNodes();
			}
		}
		getBadgesOption(option) {
			if (!main_core.Type.isUndefined(this.badgesOptions[option])) {
				return this.badgesOptions[option];
			}
			const badgesOptions = this.getEntityItemOption('badgesOptions');
			if (main_core.Type.isPlainObject(badgesOptions) && !main_core.Type.isUndefined(badgesOptions[option])) {
				return badgesOptions[option];
			}
			return null;
		}
		setBadgesOption(option, value) {
			if (main_core.Type.isStringFilled(option) && !main_core.Type.isUndefined(value)) {
				this.badgesOptions[option] = value;
				this.#renderNodes();
			}
		}
		setBadgesOptions(options) {
			if (main_core.Type.isPlainObject(options)) {
				Object.keys(options).forEach(option => {
					this.setBadgesOption(option, options[option]);
				});
			}
		}
		setDialog(dialog) {
			this.dialog = dialog;
		}
		getDialog() {
			return this.dialog;
		}
		createNode(nodeOptions) {
			const itemNode = new ItemNode(this, nodeOptions);
			this.nodes.add(itemNode);
			return itemNode;
		}
		removeNode(node) {
			this.nodes.delete(node);
		}
		getNodes() {
			return this.nodes;
		}
		select(selectOptions = {}) {
			if (this.selected) {
				return;
			}
			const options = main_core.Type.isBoolean(selectOptions)
			? {
				emitEvents: !selectOptions,
				animate: !selectOptions
			} : selectOptions;
			const {
				emitEvents,
				animate,
				node
			} = {
				emitEvents: true,
				animate: true,
				node: null,
				...options
			};
			const dialog = this.getDialog();
			if (dialog && emitEvents) {
				const event = new main_core_events.BaseEvent({
					data: {
						item: this,
						node
					}
				});
				dialog.emit('Item:onBeforeSelect', event);
				if (event.isDefaultPrevented()) {
					return;
				}
			}
			if (this.isLocked()) {
				return;
			}
			this.selected = true;
			if (dialog) {
				dialog.handleItemSelect(this, animate);
			}
			if (this.isRendered()) {
				for (const itemNode of this.getNodes()) {
					itemNode.select();
				}
			}
			if (dialog && emitEvents) {
				dialog.emit('Item:onSelect', {
					item: this,
					node
				});
				dialog.saveRecentItem(this);
			}
		}
		deselect(deselectOptions = {}) {
			if (!this.selected) {
				return;
			}
			const options = main_core.Type.isBoolean(deselectOptions)
			? {
				emitEvents: !deselectOptions,
				animate: !deselectOptions
			} : deselectOptions;
			const {
				emitEvents,
				animate,
				node
			} = {
				emitEvents: true,
				animate: true,
				node: null,
				...options
			};
			const dialog = this.getDialog();
			if (dialog && emitEvents) {
				const event = new main_core_events.BaseEvent({
					data: {
						item: this,
						node
					}
				});
				dialog.emit('Item:onBeforeDeselect', event);
				if (event.isDefaultPrevented()) {
					return;
				}
			}
			this.selected = false;
			if (this.isRendered()) {
				this.getNodes().forEach(itemNode => {
					itemNode.deselect();
				});
			}
			if (dialog) {
				dialog.handleItemDeselect(this, animate);
			}
			if (dialog && emitEvents) {
				dialog.emit('Item:onDeselect', {
					item: this,
					node
				});
			}
		}
		isSelected() {
			return this.selected;
		}
		setSearchable(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.searchable = flag;
			}
		}
		isSearchable() {
			return this.searchable;
		}
		setSaveable(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.saveable = flag;
			}
		}
		isSaveable() {
			return this.saveable;
		}
		setDeselectable(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.deselectable = flag;
				const tagSelector = this.getDialog()?.getTagSelector() || null;
				if (tagSelector !== null) {
					const tag = tagSelector.getTag({
						id: this.getId(),
						entityId: this.getEntityId()
					});
					if (tag) {
						tag.setDeselectable(flag);
					}
				}
			}
		}
		isDeselectable() {
			return this.deselectable;
		}
		setHidden(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.hidden = flag;
				if (this.isRendered()) {
					this.getNodes().forEach(node => {
						node.setHidden(flag);
					});
				}
			}
		}
		isHidden() {
			return this.hidden;
		}
		lock() {
			if (this.locked) {
				return;
			}
			const dialog = this.getDialog();
			if (dialog) {
				const event = new main_core_events.BaseEvent({
					data: {
						item: this
					}
				});
				dialog.emit('Item:onBeforeLock', event);
				if (event.isDefaultPrevented()) {
					return;
				}
			}
			if (this.isSelected()) {
				return;
			}
			this.locked = true;
			if (this.isRendered()) {
				for (const node of this.getNodes()) {
					node.lock();
				}
			}
			if (dialog) {
				dialog.emit('Item:onLock', {
					item: this
				});
			}
		}
		unlock() {
			if (!this.locked) {
				return;
			}
			const dialog = this.getDialog();
			if (dialog) {
				const event = new main_core_events.BaseEvent({
					data: {
						item: this
					}
				});
				dialog.emit('Item:onBeforeUnlock', event);
				if (event.isDefaultPrevented()) {
					return;
				}
			}
			this.locked = false;
			if (this.isRendered()) {
				for (const node of this.getNodes()) {
					node.unlock();
				}
			}
			if (dialog) {
				dialog.emit('Item:onUnlock', {
					item: this
				});
			}
		}
		isLocked() {
			return this.locked;
		}
		setContextSort(sort) {
			if (main_core.Type.isNumber(sort) || sort === null) {
				this.contextSort = sort;
			}
		}
		getContextSort() {
			return this.contextSort;
		}
		setGlobalSort(sort) {
			if (main_core.Type.isNumber(sort) || sort === null) {
				this.globalSort = sort;
			}
		}
		getGlobalSort() {
			return this.globalSort;
		}
		setSort(sort) {
			if (main_core.Type.isNumber(sort) || sort === null) {
				this.sort = sort;
			}
		}
		getSort() {
			return this.sort;
		}
		getSearchIndex() {
			if (this.searchIndex === null) {
				this.searchIndex = SearchIndex.create(this);
			}
			return this.searchIndex;
		}
		resetSearchIndex() {
			this.searchIndex = null;
		}
		getCustomData() {
			return this.customData;
		}
		setCustomData(property, value) {
			if (main_core.Type.isNull(property)) {
				this.customData = new Map();
				this.#renderNodes();
			} else if (main_core.Type.isPlainObject(property)) {
				Object.entries(property).forEach(item => {
					const [currentKey, currentValue] = item;
					this.customData.set(currentKey, currentValue);
				});
				this.#renderNodes();
			} else if (main_core.Type.isString(property)) {
				if (main_core.Type.isNull(value)) {
					this.customData.delete(property);
					this.#renderNodes();
				} else if (!main_core.Type.isUndefined(value)) {
					this.customData.set(property, value);
					this.#renderNodes();
				}
			}
		}
		isRendered() {
			return this.getDialog() && this.getDialog().isRendered();
		}
		#renderNodes() {
			if (this.isRendered()) {
				for (const node of this.getNodes()) {
					node.render();
				}
			}
		}
		getEntityItemOption(option) {
			return this.getEntity().getItemOption(option, this.getEntityType());
		}
		getEntityTagOption(option) {
			return this.getEntity().getTagOption(option, this.getEntityType());
		}
		getEntityTextNode(option) {
			return this.getEntity().getOptionTextNode(option, this.getEntityType());
		}
		getTagOptions() {
			return this.tagOptions;
		}
		getTagOption(option) {
			const value = this.getTagOptions().get(option);
			if (!main_core.Type.isUndefined(value)) {
				return value;
			}
			return null;
		}
		getTagGlobalOption(option, useItemOptions = false) {
			if (!main_core.Type.isStringFilled(option)) {
				return null;
			}
			let value = this.getTagOption(option);
			if (value === null && useItemOptions === true && this[option] !== null) {
				value = this[option];
			}
			if (value === null && this.getDialog().getTagSelector()) {
				const fn = `getTag${main_core.Text.toPascalCase(option)}`;
				if (main_core.Type.isFunction(this.getDialog().getTagSelector()[fn])) {
					value = this.getDialog().getTagSelector()[fn]();
				}
			}
			if (value === null) {
				value = this.getEntityTagOption(option);
			}
			if (value === null && useItemOptions === true) {
				value = this.getEntityItemOption(option);
			}
			return value;
		}
		getTagBgColor() {
			return this.getTagGlobalOption('bgColor');
		}
		getTagTextColor() {
			return this.getTagGlobalOption('textColor');
		}
		getTagMaxWidth() {
			return this.getTagGlobalOption('maxWidth');
		}
		getTagFontWeight() {
			return this.getTagGlobalOption('fontWeight');
		}
		getTagAvatar() {
			return this.getTagGlobalOption('avatar', true);
		}
		getTagAvatarOptions() {
			return this.getTagGlobalOption('avatarOptions', true);
		}
		getTagLink() {
			return this.replaceMacros(this.getTagGlobalOption('link', true));
		}
		replaceMacros(str) {
			if (!main_core.Type.isStringFilled(str)) {
				return str;
			}
			const id = String(this.getId());
			return str.replace(/#id#/i, id).replace(/#element_id#/i, id);
		}
		createTag() {
			const titleNode = this.getTitleNode();
			return {
				id: this.getId(),
				entityId: this.getEntityId(),
				entityType: this.getEntityType(),
				title: this.getTagOption('title') || titleNode && titleNode.toJSON() || '',
				deselectable: this.isDeselectable(),
				avatar: this.getTagAvatar(),
				avatarOptions: this.getTagAvatarOptions(),
				link: this.getTagLink(),
				maxWidth: this.getTagMaxWidth(),
				textColor: this.getTagTextColor(),
				bgColor: this.getTagBgColor(),
				fontWeight: this.getTagFontWeight(),
				onclick: this.getTagOption('onclick')
			};
		}
		getAjaxJson() {
			return this.toJSON();
		}
		toJSON() {
			return {
				id: this.getId(),
				entityId: this.getEntityId(),
				entityType: this.getEntityType(),
				selected: this.isSelected(),
				deselectable: this.isDeselectable(),
				searchable: this.isSearchable(),
				saveable: this.isSaveable(),
				hidden: this.isHidden(),
				locked: this.isLocked(),
				title: this.getTitleNode(),
				link: this.getLink(),
				linkTitle: this.getLinkTitleNode(),
				subtitle: this.getSubtitleNode(),
				supertitle: this.getSupertitleNode(),
				caption: this.getCaptionNode(),
				avatar: this.getAvatar(),
				textColor: this.getTextColor(),
				sort: this.getSort(),
				contextSort: this.getContextSort(),
				globalSort: this.getGlobalSort(),
				customData: TypeUtils.convertMapToObject(this.getCustomData()),
				tagOptions: TypeUtils.convertMapToObject(this.getTagOptions()),
				badges: this.getBadges()
			};
		}
	}

	let BaseStub = function () {
		function BaseStub(tab, options) {
			babelHelpers.classCallCheck(this, BaseStub);
			babelHelpers.defineProperty(this, "tab", void 0);
			babelHelpers.defineProperty(this, "autoShow", true);
			babelHelpers.defineProperty(this, "cache", new main_core_cache.MemoryCache());
			babelHelpers.defineProperty(this, "content", null);
			babelHelpers.defineProperty(this, "options", {});
			this.options = main_core.Type.isPlainObject(options) ? options : {};
			this.tab = tab;
			this.autoShow = this.getOption('autoShow', true);
		}
		return babelHelpers.createClass(BaseStub, [{
			key: "render",
			value: function render() {
				throw new Error('You must implement render() method.');
			}
		}, {
			key: "getTab",
			value: function getTab() {
				return this.tab;
			}
		}, {
			key: "getOuterContainer",
			value: function getOuterContainer() {
				return this.cache.remember('outer-container', () => {
					return main_core.Tag.render`
				<div class="ui-selector-tab-stub">${this.render()}</div>
			`;
				});
			}
		}, {
			key: "isAutoShow",
			value: function isAutoShow() {
				return this.autoShow;
			}
		}, {
			key: "show",
			value: function show() {
				main_core.Dom.append(this.getOuterContainer(), this.getTab().getContainer());
			}
		}, {
			key: "hide",
			value: function hide() {
				main_core.Dom.remove(this.getOuterContainer());
			}
		}, {
			key: "getOptions",
			value: function getOptions() {
				return this.options;
			}
		}, {
			key: "getOption",
			value: function getOption(option, defaultValue) {
				if (!main_core.Type.isUndefined(this.options[option])) {
					return this.options[option];
				}
				if (!main_core.Type.isUndefined(defaultValue)) {
					return defaultValue;
				}
				return null;
			}
		}]);
	}();

	function _callSuper$4(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$4() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$4() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$4 = function () { return !!t; })(); }
	let DefaultStub = function (_BaseStub) {
		function DefaultStub(...args) {
			var _this;
			babelHelpers.classCallCheck(this, DefaultStub);
			_this = _callSuper$4(this, DefaultStub, [...args]);
			babelHelpers.defineProperty(_this, "content", null);
			return _this;
		}
		babelHelpers.inherits(DefaultStub, _BaseStub);
		return babelHelpers.createClass(DefaultStub, [{
			key: "getContainer",
			value: function getContainer() {
				return this.cache.remember('container', () => {
					const subtitle = this.getOption('subtitle');
					const title = main_core.Type.isStringFilled(this.getOption('title')) ? this.getOption('title') : this.getDefaultTitle();
					const icon = this.getOption('icon') || this.getTab().getIcon('default');
					let iconOpacity = 35;
					if (main_core.Type.isNumber(this.getOption('iconOpacity'))) {
						iconOpacity = Math.min(100, Math.max(0, this.getOption('iconOpacity')));
					}
					const iconStyle = main_core.Type.isStringFilled(icon) && !ui_iconSet_api_core.Icon.isValid({
						icon
					}) ? `style="background-image: url('${encodeUrl(icon)}'); opacity: ${iconOpacity / 100};"` : '';
					const arrow = this.getOption('arrow', false) && this.getTab().getDialog().getActiveFooter() !== null;
					return main_core.Tag.render`
				<div class="ui-selector-tab-default-stub">
					<div class="ui-selector-tab-default-stub-icon" ${iconStyle}></div>
					<div class="ui-selector-tab-default-stub-titles">
						<div class="ui-selector-tab-default-stub-title">${title}</div>
						${subtitle ? main_core.Tag.render`<div class="ui-selector-tab-default-stub-subtitle">${subtitle}</div>` : ''}
					</div>
					${arrow ? main_core.Tag.render`<div class="ui-selector-tab-default-stub-arrow"></div>` : ''}
				</div>
			`;
				});
			}
		}, {
			key: "getDefaultTitle",
			value: function getDefaultTitle() {
				const titleNode = this.getTab().getTitleNode();
				if (titleNode === null) {
					return main_core.Loc.getMessage('UI_SELECTOR_TAB_STUB_TITLE').replace(/#TAB_TITLE#/, '');
				}
				const titleContainer = main_core.Tag.render`<span class="ui-selector-tab-default-stub-title"></span>`;
				titleNode.renderTo(titleContainer);
				return main_core.Loc.getMessage('UI_SELECTOR_TAB_STUB_TITLE').replace(/#TAB_TITLE#/, titleContainer.innerHTML);
			}
		}, {
			key: "render",
			value: function render() {
				return this.getContainer();
			}
		}]);
	}(BaseStub);

	class Tab {
		id;
		title = null;
		rootNode = null;
		dialog = null;
		stub = null;
		visible = true;
		rendered = false;
		locked = false;
		selected = false;
		hovered = false;
		icon = {};
		textColor = {};
		bgColor = {};
		itemMaxDepth = 5;
		header = null;
		showDefaultHeader = true;
		footer = null;
		showDefaultFooter = true;
		showAvatars = null;
		cache = new main_core_cache.MemoryCache();
		constructor(dialog, tabOptions) {
			const options = main_core.Type.isPlainObject(tabOptions) ? tabOptions : {};
			if (!main_core.Type.isStringFilled(options.id)) {
				throw new Error('EntitySelector.Tab: "id" parameter is required.');
			}
			this.setDialog(dialog);
			this.id = options.id;
			this.showDefaultHeader = options.showDefaultHeader !== false;
			this.showDefaultFooter = options.showDefaultFooter !== false;
			this.rootNode = new ItemNode(null, {
				itemOrder: options.itemOrder
			});
			this.rootNode.setTab(this);
			this.setVisible(options.visible);
			this.setTitle(options.title);
			this.setItemMaxDepth(options.itemMaxDepth);
			this.setIcon(options.icon ?? ui_iconSet_api_core.Outline.ARROW_RIGHT_L);
			this.setTextColor(options.textColor);
			this.setBgColor(options.bgColor);
			this.setStub(options.stub, options.stubOptions);
			this.setHeader(options.header, options.headerOptions);
			this.setFooter(options.footer, options.footerOptions);
			this.setShowAvatars(options.showAvatars);
		}
		getId() {
			return this.id;
		}
		getTabPanelId() {
			return `${this.getDialog().getId()}-tabpanel-${this.getId()}`;
		}
		getListBoxId() {
			return `${this.getDialog().getId()}-listbox-${this.getId()}`;
		}
		getLabelId() {
			return `${this.getDialog().getId()}-tab-${this.getId()}`;
		}
		setDialog(dialog) {
			this.dialog = dialog;
		}
		getDialog() {
			return this.dialog;
		}
		getStub() {
			return this.stub;
		}
		setStub(stub, stubOptions) {
			let instance = null;
			const options = main_core.Type.isPlainObject(stubOptions) ? stubOptions : {};
			if (main_core.Type.isString(stub) || main_core.Type.isFunction(stub)) {
				const className = main_core.Type.isString(stub) ? main_core.Reflection.getClass(stub) : stub;
				if (main_core.Type.isFunction(className)) {
					const StubClass = className;
					instance = new StubClass(this, options);
					if (!(instance instanceof BaseStub)) {
						console.error('EntitySelector: stub is not an instance of BaseStub.');
						instance = null;
					}
				}
			}
			if (!instance && stub !== false) {
				instance = new DefaultStub(this, options);
			}
			this.stub = instance;
		}
		getHeader() {
			return this.header;
		}
		setHeader(headerContent, headerOptions) {
			let header = null;
			if (headerContent !== null) {
				header = this.getDialog().createHeader(this, headerContent, headerOptions);
				if (header === null) {
					return;
				}
			}
			if (this.isRendered() && this.getHeader() !== null) {
				main_core.Dom.remove(this.getHeader().getContainer());
				this.getDialog().adjustHeader();
			}
			this.header = header;
			if (this.isRendered()) {
				this.getDialog().appendHeader(header);
				this.getDialog().adjustHeader();
			}
		}
		canShowDefaultHeader() {
			return this.showDefaultHeader;
		}
		enableDefaultHeader() {
			this.showDefaultHeader = true;
			this.getDialog().adjustHeader();
		}
		disableDefaultHeader() {
			this.showDefaultHeader = false;
			this.getDialog().adjustHeader();
		}
		getFooter() {
			return this.footer;
		}
		setFooter(footerContent, footerOptions) {
			let footer = null;
			if (footerContent !== null) {
				footer = this.getDialog().createFooter(this, footerContent, footerOptions);
				if (footer === null) {
					return;
				}
			}
			if (this.isRendered() && this.getFooter() !== null) {
				main_core.Dom.remove(this.getFooter().getContainer());
				this.getDialog().adjustFooter();
			}
			this.footer = footer;
			if (this.isRendered()) {
				this.getDialog().appendFooter(footer);
				this.getDialog().adjustFooter();
			}
		}
		canShowDefaultFooter() {
			return this.showDefaultFooter;
		}
		enableDefaultFooter() {
			this.showDefaultFooter = true;
			this.getDialog().adjustFooter();
		}
		disableDefaultFooter() {
			this.showDefaultFooter = false;
			this.getDialog().adjustFooter();
		}
		setShowAvatars(flag) {
			if (main_core.Type.isBoolean(flag) || flag === null) {
				this.showAvatars = flag;
				if (this.isRendered()) {
					this.renderContainer();
				}
			}
		}
		shouldShowAvatars() {
			return this.showAvatars ?? this.getDialog().shouldShowAvatars();
		}
		getRootNode() {
			return this.rootNode;
		}
		setTitle(title) {
			if (main_core.Type.isStringFilled(title) || main_core.Type.isPlainObject(title) || title === null) {
				this.title = title === null ? null : new TextNode(title);
				if (this.isRendered()) {
					this.renderLabel();
				}
			}
		}
		getTitle() {
			const titleNode = this.getTitleNode();
			return titleNode !== null && !titleNode.isNullable() ? titleNode.getText() : '';
		}
		getTitleNode() {
			return this.title;
		}
		setIcon(icon) {
			return this.setProperty('icon', icon);
		}
		getIcon(state) {
			return this.getPropertyByState('icon', state);
		}
		setBgColor(bgColor) {
			return this.setProperty('bgColor', bgColor);
		}
		getBgColor(state) {
			return this.getPropertyByState('bgColor', state);
		}
		setTextColor(textColor) {
			return this.setProperty('textColor', textColor);
		}
		getTextColor(state) {
			return this.getPropertyByState('textColor', state);
		}
		setProperty(name, states) {
			const property = this[name];
			if (!property) {
				return;
			}
			if (main_core.Type.isPlainObject(states)) {
				Object.keys(states).forEach(state => {
					if (main_core.Type.isStringFilled(states[state])) {
						property[state] = states[state];
					}
				});
			} else if (main_core.Type.isStringFilled(states)) {
				property['default'] = states;
			}
		}
		getPropertyByState(name, state) {
			const property = this[name];
			const labelState = main_core.Type.isStringFilled(state) ? state : 'default';
			if (!main_core.Type.isUndefined(property) && !main_core.Type.isUndefined(property[labelState])) {
				return property[labelState];
			}
			return null;
		}
		getPropertyByCurrentState(name) {
			const property = this[name];
			if (this.isSelected() && this.isHovered() && property.selectedHovered) {
				return property.selectedHovered;
			}
			if (this.isSelected() && property.selected) {
				return property.selected;
			}
			if (this.isHovered() && property.hovered) {
				return property.hovered;
			}
			if (property.default) {
				return property.default;
			}
			return null;
		}
		setItemMaxDepth(depth) {
			if (main_core.Type.isNumber(depth) && depth > 0) {
				this.itemMaxDepth = depth;
			}
		}
		getItemMaxDepth() {
			return this.itemMaxDepth;
		}
		getContainer() {
			return this.cache.remember('container', () => {
				return main_core.Tag.render`
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
		getLabelContainer() {
			return this.cache.remember('label', () => {
				const className = this.isVisible() ? '' : ' ui-selector-tab-label-hidden';
				return main_core.Tag.render`
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
		getIconContainer() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`
				<span class="ui-selector-tab-icon" role="none"></span>
			`;
			});
		}
		getTitleContainer() {
			return this.cache.remember('title', () => {
				return main_core.Tag.render`
				<span class="ui-selector-tab-title"></span>
			`;
			});
		}
		getItemsContainer() {
			return this.cache.remember('items', () => {
				return main_core.Tag.render`
				<div
					class="ui-selector-items"
					aria-multiselectable="${this.getDialog().isMultiple() ? 'true' : 'false'}"
					id="${this.getListBoxId()}"
					aria-labelledby="${this.getLabelId()}"
				></div>
			`;
			});
		}
		getListBoxContainer() {
			return this.getItemsContainer();
		}
		render() {
			this.getRootNode().render();
			this.rendered = true;
		}
		renderLabel() {
			main_core.Dom.style(this.getTitleContainer(), 'color', this.getPropertyByCurrentState('textColor'));
			main_core.Dom.style(this.getLabelContainer(), 'background-color', this.getPropertyByCurrentState('bgColor'));
			const icon = this.getPropertyByCurrentState('icon');
			main_core.Dom.clean(this.getIconContainer());
			try {
				main_core.Dom.append(new ui_iconSet_api_core.Icon({
					icon: icon
				}).render(), this.getIconContainer());
				main_core.Dom.style(this.getIconContainer(), 'mask-image', 'none');
				main_core.Dom.style(this.getIconContainer(), 'background-color', 'transparent');
			} catch {
				main_core.Dom.style(this.getIconContainer(), 'mask-image', icon ? `url('${encodeUrl(icon)}')` : null);
			}
			const titleNode = this.getTitleNode();
			if (titleNode) {
				this.getTitleNode().renderTo(this.getTitleContainer());
			} else {
				this.getTitleContainer().textContent = '';
			}
		}
		renderContainer() {
			const className = 'ui-selector-tab-content--hide-avatars';
			if (this.shouldShowAvatars()) {
				main_core.Dom.removeClass(this.getContainer(), className);
			} else {
				main_core.Dom.addClass(this.getContainer(), className);
			}
		}
		isVisible() {
			return this.visible;
		}
		setVisible(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.visible = flag;
				if (this.isRendered()) {
					if (this.visible) {
						main_core.Dom.removeClass(this.getLabelContainer(), 'ui-selector-tab-label-hidden');
					} else {
						main_core.Dom.addClass(this.getLabelContainer(), 'ui-selector-tab-label-hidden');
					}
				}
			}
		}
		isRendered() {
			return this.rendered && this.getDialog() && this.getDialog().isRendered();
		}
		select() {
			if (this.isSelected()) {
				return;
			}
			main_core.Dom.addClass(this.getContainer(), 'ui-selector-tab-content-active');
			main_core.Dom.attr(this.getLabelContainer(), 'aria-selected', 'true');
			main_core.Dom.attr(this.getDialog().getTagSelector()?.getTextBox(), 'aria-controls', this.getListBoxId());
			if (this.isVisible()) {
				main_core.Dom.addClass(this.getLabelContainer(), 'ui-selector-tab-label-active');
				this.renderLabel();
			}
			this.selected = true;
			this.getHeader()?.show();
			this.getFooter()?.show();
			this.getDialog().emit('Tab:onSelect', {
				tab: this
			});
		}
		deselect() {
			if (!this.isSelected()) {
				return;
			}
			main_core.Dom.removeClass(this.getContainer(), 'ui-selector-tab-content-active');
			if (this.isVisible()) {
				main_core.Dom.removeClass(this.getLabelContainer(), 'ui-selector-tab-label-active');
			}
			main_core.Dom.attr(this.getLabelContainer(), 'aria-selected', 'false');
			main_core.Dom.attr(this.getDialog().getTagSelector()?.getTextBox(), 'aria-controls', null);
			this.selected = false;
			if (this.isVisible()) {
				this.renderLabel();
			}
			this.getHeader()?.hide();
			this.getFooter()?.hide();
			this.getDialog().emit('Tab:onDeselect', {
				tab: this
			});
		}
		hover() {
			if (this.isHovered()) {
				return;
			}
			main_core.Dom.addClass(this.getLabelContainer(), 'ui-selector-tab-label-hover');
			this.hovered = true;
			this.renderLabel();
		}
		unhover() {
			if (!this.isHovered()) {
				return;
			}
			main_core.Dom.removeClass(this.getLabelContainer(), 'ui-selector-tab-label-hover');
			this.hovered = false;
			this.renderLabel();
		}
		isSelected() {
			return this.selected;
		}
		isHovered() {
			return this.hovered;
		}
		lock() {
			this.locked = true;
			main_core.Dom.addClass(this.getContainer(), 'ui-selector-tab-content-locked');
		}
		unlock() {
			this.locked = false;
			main_core.Dom.removeClass(this.getContainer(), 'ui-selector-tab-content-locked');
		}
		isLocked() {
			return this.locked;
		}
		handleLabelClick() {
			this.getDialog().selectTab(this.getId());
		}
		handleLabelMouseEnter() {
			this.hover();
		}
		handleLabelMouseLeave() {
			this.unhover();
		}
	}

	class EntityError extends main_core.BaseError {
		#entityId;
		setEntityId(entityId) {
			if (main_core.Type.isStringFilled(entityId)) {
				this.#entityId = entityId;
			}
		}
		getEntityId() {
			return this.#entityId;
		}
	}

	class EntityErrorCollection {
		#errors = [];
		static create(errorOptions) {
			const errorCollection = new this();
			errorOptions.forEach(errorOption => {
				if (!main_core.Type.isStringFilled(errorOption.entityId)) {
					return;
				}
				const error = new EntityError();
				error.setEntityId(errorOption.entityId);
				if (main_core.Type.isStringFilled(errorOption.message)) {
					error.setMessage(errorOption.message);
				}
				if (!main_core.Type.isNil(errorOption.code)) {
					error.setCode(errorOption.code);
				}
				if (main_core.Type.isArrayFilled(errorOption.customData)) {
					error.setCustomData(errorOption.customData);
				}
				errorCollection.add(error);
			});
			return errorCollection;
		}
		getByEntityId(entityId) {
			return this.#errors.filter(error => error.getEntityId() === entityId);
		}
		add(item) {
			this.#errors.push(item);
		}
		has(item) {
			return this.#errors.includes(item);
		}
		clear() {
			this.#errors = [];
		}
		getIndex(item) {
			return this.#errors.indexOf(item);
		}
		getByIndex(index) {
			if (main_core.Type.isNumber(index) && index >= 0) {
				const error = this.#errors[index];
				return main_core.Type.isUndefined(error) ? null : error;
			}
			return null;
		}
		[Symbol.iterator]() {
			return this.#errors[Symbol.iterator]();
		}
	}

	function createDialog(dialogOptions) {
		return new Dialog(dialogOptions);
	}

	function isTagSelector(selector) {
		return selector instanceof TagSelector;
	}

	class TagItem {
		id;
		entityId;
		entityType;
		title = null;
		avatar = null;
		avatarOptions = null;
		maxWidth = null;
		textColor = null;
		bgColor = null;
		fontWeight = null;
		link = null;
		onclick = null;
		clickable = null;
		deselectable = null;
		customData;
		cache = new main_core_cache.MemoryCache();
		selector;
		rendered = false;
		constructor(selector, itemOptions) {
			if (!isTagSelector(selector)) {
				throw new TypeError('TagSelector.TagItem: "selector" parameter is not an instance of TagSelector.');
			}
			const options = main_core.Type.isPlainObject(itemOptions) ? itemOptions : {};
			if (!main_core.Type.isStringFilled(options.id) && !main_core.Type.isNumber(options.id)) {
				throw new Error('TagSelector.TagItem: "id" parameter is required.');
			}
			if (!main_core.Type.isStringFilled(options.entityId)) {
				throw new Error('TagSelector.TagItem: "entityId" parameter is required.');
			}
			this.selector = selector;
			this.id = options.id;
			this.entityId = options.entityId.toLowerCase();
			this.entityType = main_core.Type.isStringFilled(options.entityType) ? options.entityType : 'default';
			this.customData = TypeUtils.createMapFromOptions(options.customData);
			this.onclick = main_core.Type.isFunction(options.onclick) ? options.onclick : null;
			this.link = main_core.Type.isStringFilled(options.link) ? options.link : null;
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
		getId() {
			return this.id;
		}
		getEntityId() {
			return this.entityId;
		}
		getEntityType() {
			return this.entityType;
		}
		getSelector() {
			return this.selector;
		}
		getTitle() {
			return this.getTitleNode() && !this.getTitleNode().isNullable() ? this.getTitleNode().getText() : '';
		}
		getTitleNode() {
			return this.title;
		}
		setTitle(title) {
			if (main_core.Type.isStringFilled(title) || main_core.Type.isPlainObject(title) || title === null) {
				this.title = title === null ? null : new TextNode(title);
			}
		}
		getAvatar() {
			if (this.avatar !== null) {
				return this.avatar;
			}
			if (this.getSelector().getTagAvatar() !== null) {
				return this.getSelector().getTagAvatar();
			}
			if (this.getEntityTagOption('avatar') !== null) {
				return this.getEntityTagOption('avatar');
			}
			return this.getEntityItemOption('avatar');
		}
		setAvatar(avatar) {
			if (main_core.Type.isString(avatar) || avatar === null) {
				this.avatar = avatar;
			}
		}
		getAvatarOption(option) {
			if (this.avatarOptions !== null && !main_core.Type.isUndefined(this.avatarOptions[option])) {
				return this.avatarOptions[option];
			}
			const selectorAvatarOption = this.getSelector().getTagAvatarOption(option);
			if (selectorAvatarOption !== null) {
				return selectorAvatarOption[option];
			}
			const entityTagAvatarOptions = this.getEntityTagOption('avatarOptions');
			if (main_core.Type.isPlainObject(entityTagAvatarOptions) && !main_core.Type.isUndefined(entityTagAvatarOptions[option])) {
				return entityTagAvatarOptions[option];
			}
			const entityItemAvatarOptions = this.getEntityItemOption('avatarOptions');
			if (main_core.Type.isPlainObject(entityItemAvatarOptions) && !main_core.Type.isUndefined(entityItemAvatarOptions[option])) {
				return entityItemAvatarOptions[option];
			}
			return null;
		}
		setAvatarOption(option, value) {
			if (main_core.Type.isStringFilled(option) && !main_core.Type.isUndefined(value)) {
				if (this.avatarOptions === null) {
					this.avatarOptions = {};
				}
				this.avatarOptions[option] = value;
			}
		}
		setAvatarOptions(options) {
			if (main_core.Type.isPlainObject(options)) {
				Object.keys(options).forEach(option => {
					this.setAvatarOption(option, options[option]);
				});
			}
		}
		getTextColor() {
			if (this.textColor !== null) {
				return this.textColor;
			}
			if (this.getSelector().getTagTextColor() !== null) {
				return this.getSelector().getTagTextColor();
			}
			return this.getEntityTagOption('textColor');
		}
		setTextColor(textColor) {
			if (main_core.Type.isString(textColor) || textColor === null) {
				this.textColor = textColor;
			}
		}
		getBgColor() {
			if (this.bgColor !== null) {
				return this.bgColor;
			}
			if (this.getSelector().getTagBgColor() !== null) {
				return this.getSelector().getTagBgColor();
			}
			return this.getEntityTagOption('bgColor');
		}
		setBgColor(bgColor) {
			if (main_core.Type.isString(bgColor) || bgColor === null) {
				this.bgColor = bgColor;
			}
		}
		getFontWeight() {
			if (this.fontWeight !== null) {
				return this.fontWeight;
			}
			if (this.getSelector().getTagFontWeight() !== null) {
				return this.getSelector().getTagFontWeight();
			}
			return this.getEntityTagOption('fontWeight');
		}
		setFontWeight(fontWeight) {
			if (main_core.Type.isString(fontWeight) || fontWeight === null) {
				this.fontWeight = fontWeight;
			}
		}
		getMaxWidth() {
			if (this.maxWidth !== null) {
				return this.maxWidth;
			}
			if (this.getSelector().getTagMaxWidth() !== null) {
				return this.getSelector().getTagMaxWidth();
			}
			return this.getEntityTagOption('maxWidth');
		}
		setMaxWidth(width) {
			if (main_core.Type.isNumber(width) && width >= 0 || width === null) {
				this.maxWidth = width;
			}
		}
		setDeselectable(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.deselectable = flag;
				if (this.isRendered()) {
					main_core.Dom.toggleClass(this.getContainer(), 'ui-tag-selector-tag-readonly', !flag);
				}
			}
		}
		isDeselectable() {
			if (this.getSelector().isReadonly()) {
				return false;
			}
			return this.deselectable === null ? this.getSelector().isDeselectable() : this.deselectable;
		}
		getCustomData() {
			return this.customData;
		}
		getLink() {
			return this.link;
		}
		getOnclick() {
			return this.onclick;
		}
		setClickable(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.clickable = flag;
			}
		}
		isClickable() {
			if (this.clickable !== null) {
				return this.clickable;
			}
			if (this.getSelector().getTagClickable() !== null) {
				return this.getSelector().getTagClickable();
			}
			if (this.getEntityTagOption('clickable') !== null) {
				return this.getEntityTagOption('clickable');
			}
			if (this.getEntityItemOption('clickable') !== null) {
				return this.getEntityItemOption('clickable');
			}
			return false;
		}
		render() {
			const titleNode = this.getTitleNode();
			if (titleNode) {
				titleNode.renderTo(this.getTitleContainer());
				const title = this.getTitleContainer().textContent;
				this.getContentContainer().setAttribute('title', TagItem.#sanitizeTitle(title));
			} else {
				this.getTitleContainer().textContent = '';
				main_core.Dom.attr(this.getContentContainer(), 'title', null);
			}
			const avatar = this.getAvatar();
			const bgImage = this.getAvatarOption('bgImage');
			if (main_core.Type.isStringFilled(avatar)) {
				main_core.Dom.style(this.getAvatarContainer(), 'background-image', `url('${encodeUrl(avatar)}')`);
			} else {
				main_core.Dom.style(this.getAvatarContainer(), 'background-image', bgImage);
			}
			const bgColor = this.getAvatarOption('bgColor');
			const bgSize = this.getAvatarOption('bgSize');
			const border = this.getAvatarOption('border');
			const borderRadius = this.getAvatarOption('borderRadius');
			const outline = this.getAvatarOption('outline');
			const outlineOffset = this.getAvatarOption('outlineOffset');
			main_core.Dom.clean(this.getAvatarContainer());
			main_core.Dom.style(this.getAvatarContainer(), 'background-color', bgColor);
			main_core.Dom.style(this.getAvatarContainer(), 'background-size', bgSize);
			main_core.Dom.style(this.getAvatarContainer(), 'border', border);
			main_core.Dom.style(this.getAvatarContainer(), 'border-radius', borderRadius);
			main_core.Dom.style(this.getAvatarContainer(), 'outline', outline);
			main_core.Dom.style(this.getAvatarContainer(), 'outline-offset', outlineOffset);
			const icon = {
				icon: this.getAvatarOption('icon'),
				size: bgSize ?? undefined,
				color: this.getAvatarOption('iconColor') ?? undefined
			};
			if (ui_iconSet_api_core.Icon.isValid(icon)) {
				main_core.Dom.style(this.getAvatarContainer(), 'background-image', 'none');
				main_core.Dom.append(new ui_iconSet_api_core.Icon(icon).render(), this.getAvatarContainer());
			}
			const hasAvatar = avatar || bgColor && bgColor !== 'none' || bgImage && bgImage !== 'none' || ui_iconSet_api_core.Icon.isValid(icon);
			if (hasAvatar) {
				main_core.Dom.addClass(this.getContainer(), 'ui-tag-selector-tag--has-avatar');
			} else {
				main_core.Dom.removeClass(this.getContainer(), 'ui-tag-selector-tag--has-avatar');
			}
			const maxWidth = this.getMaxWidth();
			if (maxWidth > 0) {
				main_core.Dom.style(this.getContainer(), 'max-width', `${maxWidth}px`);
			} else {
				main_core.Dom.style(this.getContainer(), 'max-width', null);
			}
			if (this.isDeselectable()) {
				main_core.Dom.removeClass(this.getContainer(), 'ui-tag-selector-tag-readonly');
			} else {
				main_core.Dom.addClass(this.getContainer(), 'ui-tag-selector-tag-readonly');
			}
			main_core.Dom.style(this.getTitleContainer(), 'color', this.getTextColor());
			main_core.Dom.style(this.getTitleContainer(), 'font-weight', this.getFontWeight());
			main_core.Dom.style(this.getContainer(), 'background-color', this.getBgColor());
			this.rendered = true;
		}
		static #sanitizeTitle(text) {
			return text.replaceAll(/[\t ]+/gm, ' ').replaceAll(/\n+/gm, '\n').trim();
		}
		getContainer() {
			return this.cache.remember('container', () => {
				return main_core.Tag.render`
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
		getContentContainer() {
			return this.cache.remember('content-container', () => {
				if (main_core.Type.isStringFilled(this.getLink())) {
					return main_core.Tag.render`
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
				const className = this.isClickable() || this.getOnclick() !== null ? ' ui-tag-selector-tag-content--clickable' : '';
				return main_core.Tag.render`
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
		getAvatarContainer() {
			return this.cache.remember('avatar', () => {
				return main_core.Tag.render`
				<div class="ui-tag-selector-tag-avatar"></div>
			`;
			});
		}
		getTitleContainer() {
			return this.cache.remember('title', () => {
				return main_core.Tag.render`
				<div class="ui-tag-selector-tag-title"></div>
			`;
			});
		}
		getRemoveIcon() {
			return this.cache.remember('remove-icon', () => {
				return main_core.Tag.render`
				<div
					class="ui-tag-selector-tag-remove ui-icon-set__scope"
					onclick="${this.handleRemoveIconClick.bind(this)}"
					aria-hidden="true"
					data-testid="ui-tag-selector-remove-item-button"
					data-item-entity-id="${main_core.Text.encode(this.getEntityId())}"
					data-item-id="${main_core.Text.encode(this.getId())}"
				></div>
			`;
			});
		}
		getEntityTagOption(option) {
			return Entity.getTagOption(this.getEntityId(), option, this.getEntityType());
		}
		getEntityItemOption(option) {
			return Entity.getItemOption(this.getEntityId(), option, this.getEntityType());
		}
		isRendered() {
			return this.rendered && this.getSelector() && this.getSelector().isRendered();
		}
		remove(animate = true) {
			if (!animate) {
				main_core.Dom.remove(this.getContainer());
				return Promise.resolve();
			}
			return new Promise(resolve => {
				main_core.Dom.style(this.getContainer(), 'width', `${this.getContainer().offsetWidth}px`);
				main_core.Dom.addClass(this.getContainer(), 'ui-tag-selector-tag--remove');
				Animation.handleAnimationEnd(this.getContainer(), 'ui-tag-selector-tag-remove').then(() => {
					main_core.Dom.remove(this.getContainer());
					resolve();
				}).catch(() => {
				});
			});
		}
		show() {
			return new Promise(resolve => {
				main_core.Dom.addClass(this.getContainer(), 'ui-tag-selector-tag--show');
				Animation.handleAnimationEnd(this.getContainer(), 'ui-tag-selector-tag-show').then(() => {
					main_core.Dom.removeClass(this.getContainer(), 'ui-tag-selector-tag--show');
					resolve();
				}).catch(() => {
				});
			});
		}
		handleContainerClick() {
			const fn = this.getOnclick();
			if (main_core.Type.isFunction(fn)) {
				fn(this);
			}
			const selector = this.getSelector();
			selector.emit('TagItem:onClick', {
				item: this
			});
		}
		handleRemoveIconClick(event) {
			event.stopPropagation();
			if (this.isDeselectable()) {
				this.getSelector().removeTag(this);
			}
		}
		handleKeyDown(event) {
			if ((event.key === 'Delete' || event.key === 'Backspace') && this.isDeselectable()) {
				this.getSelector().removeTag(this);
				event.stopPropagation();
				event.preventDefault();
			}
		}
	}

	function _callSuper$3(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$3() ? Reflect.construct(o, [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$3() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$3 = function () { return !!t; })(); }
	function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration$1(e, t), t.set(e, a); }
	function _checkPrivateRedeclaration$1(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand$1(s, a)); }
	function _assertClassBrand$1(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	var _handleDialogShowA11y = new WeakMap();
	var _handleDialogHideA11y = new WeakMap();
	let TagSelector = function (_EventEmitter) {
		function TagSelector(selectorOptions) {
			var _this;
			babelHelpers.classCallCheck(this, TagSelector);
			_this = _callSuper$3(this, TagSelector);
			babelHelpers.defineProperty(_this, "id", void 0);
			babelHelpers.defineProperty(_this, "tags", []);
			babelHelpers.defineProperty(_this, "cache", new main_core_cache.MemoryCache());
			babelHelpers.defineProperty(_this, "rendered", false);
			babelHelpers.defineProperty(_this, "multiple", true);
			babelHelpers.defineProperty(_this, "readonly", false);
			babelHelpers.defineProperty(_this, "locked", false);
			babelHelpers.defineProperty(_this, "deselectable", true);
			babelHelpers.defineProperty(_this, "addButtonCaption", null);
			babelHelpers.defineProperty(_this, "addButtonCaptionMore", null);
			babelHelpers.defineProperty(_this, "createButtonCaption", null);
			babelHelpers.defineProperty(_this, "addButtonVisible", true);
			babelHelpers.defineProperty(_this, "createButtonVisible", false);
			babelHelpers.defineProperty(_this, "textBoxVisible", false);
			babelHelpers.defineProperty(_this, "textBoxWidth", null);
			babelHelpers.defineProperty(_this, "maxHeight", null);
			babelHelpers.defineProperty(_this, "placeholder", '');
			babelHelpers.defineProperty(_this, "textBoxAutoHide", false);
			babelHelpers.defineProperty(_this, "textBoxOldValue", '');
			babelHelpers.defineProperty(_this, "tagAvatar", null);
			babelHelpers.defineProperty(_this, "tagAvatarOptions", null);
			babelHelpers.defineProperty(_this, "tagTextColor", null);
			babelHelpers.defineProperty(_this, "tagBgColor", null);
			babelHelpers.defineProperty(_this, "tagFontWeight", null);
			babelHelpers.defineProperty(_this, "tagMaxWidth", null);
			babelHelpers.defineProperty(_this, "tagClickable", null);
			babelHelpers.defineProperty(_this, "dialog", null);
			babelHelpers.defineProperty(_this, "focusZone", null);
			babelHelpers.defineProperty(_this, "focusZoneOptions", {});
			_classPrivateFieldInitSpec(_this, _handleDialogShowA11y, () => {
				main_core.Dom.attr(_this.getTextBox(), 'aria-expanded', 'true');
				main_core.Dom.attr(_this.getAddButtonLink(), 'aria-expanded', 'true');
			});
			_classPrivateFieldInitSpec(_this, _handleDialogHideA11y, () => {
				main_core.Dom.attr(_this.getTextBox(), 'aria-expanded', 'false');
				main_core.Dom.attr(_this.getAddButtonLink(), 'aria-expanded', 'false');
			});
			_this.setEventNamespace('BX.UI.EntitySelector.TagSelector');
			const options = main_core.Type.isPlainObject(selectorOptions) ? selectorOptions : {};
			_this.id = main_core.Type.isStringFilled(options.id) ? options.id : `ui-tag-selector-${main_core.Text.getRandom().toLowerCase()}`;
			_this.multiple = main_core.Type.isBoolean(options.multiple) ? options.multiple : true;
			_this.addButtonVisible = options.showAddButton !== false;
			_this.createButtonVisible = options.showCreateButton === true;
			_this.textBoxVisible = options.showTextBox === true;
			_this.focusZoneOptions = main_core.Type.isPlainObject(options.focusZoneOptions) ? options.focusZoneOptions : {};
			_this.setReadonly(options.readonly);
			_this.setLocked(options.locked);
			_this.setAddButtonCaption(options.addButtonCaption);
			_this.setAddButtonCaptionMore(options.addButtonCaptionMore);
			_this.setCreateButtonCaption(options.createButtonCaption);
			_this.setPlaceholder(options.placeholder);
			_this.setTextBoxAutoHide(options.textBoxAutoHide);
			_this.setTextBoxWidth(options.textBoxWidth);
			_this.setDeselectable(options.deselectable);
			_this.setMaxHeight(options.maxHeight);
			_this.setTagAvatar(options.tagAvatar);
			_this.setTagAvatarOptions(options.tagAvatarOptions);
			_this.setTagMaxWidth(options.tagMaxWidth);
			_this.setTagTextColor(options.tagTextColor);
			_this.setTagBgColor(options.tagBgColor);
			_this.setTagFontWeight(options.tagFontWeight);
			_this.setTagClickable(options.tagClickable);
			if (main_core.Type.isPlainObject(options.dialogOptions)) {
				let selectedItems = main_core.Type.isArray(options.items) ? options.items : [];
				if (main_core.Type.isArray(options.dialogOptions.selectedItems)) {
					selectedItems = selectedItems.concat(options.dialogOptions.selectedItems);
				}
				const dialogOptions = Object.assign({}, options.dialogOptions, {
					tagSelectorOptions: null,
					selectedItems,
					multiple: _this.isMultiple(),
					tagSelector: _this
				});
				createDialog(dialogOptions);
			} else if (main_core.Type.isArray(options.items)) {
				for (const item of options.items) {
					_this.addTag(item);
				}
			}
			_this.subscribeFromOptions(options.events);
			return _this;
		}
		babelHelpers.inherits(TagSelector, _EventEmitter);
		return babelHelpers.createClass(TagSelector, [{
			key: "getDialog",
			value: function getDialog() {
				return this.dialog;
			}
		}, {
			key: "setDialog",
			value: function setDialog(dialog) {
				if (this.dialog === dialog) {
					return;
				}
				this.dialog?.unsubscribe('onShow', _classPrivateFieldGet(_handleDialogShowA11y, this));
				this.dialog?.unsubscribe('onHide', _classPrivateFieldGet(_handleDialogHideA11y, this));
				this.dialog = dialog;
				if (dialog === null) {
					return;
				}
				main_core.Dom.attr(this.getTextBox(), 'aria-expanded', 'false');
				main_core.Dom.attr(this.getTextBox(), 'aria-autocomplete', 'list');
				main_core.Dom.attr(this.getAddButtonLink(), 'aria-haspopup', 'dialog');
				main_core.Dom.attr(this.getAddButtonLink(), 'aria-expanded', 'false');
				dialog.subscribe('onShow', _classPrivateFieldGet(_handleDialogShowA11y, this));
				dialog.subscribe('onHide', _classPrivateFieldGet(_handleDialogHideA11y, this));
			}
		}, {
			key: "setReadonly",
			value: function setReadonly(flag) {
				if (main_core.Type.isBoolean(flag)) {
					this.readonly = flag;
					if (this.isRendered()) {
						if (flag) {
							main_core.Dom.addClass(this.getOuterContainer(), 'ui-tag-selector-container-readonly');
						} else {
							main_core.Dom.removeClass(this.getOuterContainer(), 'ui-tag-selector-container-readonly');
						}
					}
					this.toggleFocusZone();
				}
			}
		}, {
			key: "isReadonly",
			value: function isReadonly() {
				return this.readonly;
			}
		}, {
			key: "setLocked",
			value: function setLocked(flag) {
				if (main_core.Type.isBoolean(flag)) {
					this.locked = flag;
					if (flag) {
						main_core.Dom.addClass(this.getOuterContainer(), 'ui-tag-selector-container-locked');
						this.getOuterContainer().inert = true;
						this.getTextBox().disabled = true;
					} else {
						main_core.Dom.removeClass(this.getOuterContainer(), 'ui-tag-selector-container-locked');
						this.getOuterContainer().inert = false;
						this.getTextBox().disabled = false;
					}
					this.toggleFocusZone();
				}
			}
		}, {
			key: "lock",
			value: function lock() {
				if (!this.isLocked()) {
					this.setLocked(true);
				}
			}
		}, {
			key: "unlock",
			value: function unlock() {
				if (this.isLocked()) {
					this.setLocked(false);
				}
			}
		}, {
			key: "isLocked",
			value: function isLocked() {
				return this.locked;
			}
		}, {
			key: "isMultiple",
			value: function isMultiple() {
				return this.multiple;
			}
		}, {
			key: "setDeselectable",
			value: function setDeselectable(flag) {
				if (main_core.Type.isBoolean(flag)) {
					const changed = this.deselectable !== flag;
					this.deselectable = flag;
					if (changed) {
						this.updateTags();
					}
				}
			}
		}, {
			key: "isDeselectable",
			value: function isDeselectable() {
				return this.deselectable;
			}
		}, {
			key: "getTag",
			value: function getTag(tagItem) {
				if (tagItem instanceof TagItem) {
					return this.getTags().find(tag => tag === tagItem) || null;
				}
				if (main_core.Type.isPlainObject(tagItem)) {
					const {
						id,
						entityId
					} = tagItem;
					return this.getTags().find(tag => tag.getId() === id && tag.getEntityId() === entityId) || null;
				}
				return null;
			}
		}, {
			key: "addTag",
			value: function addTag(tagOptions) {
				if (!main_core.Type.isObjectLike(tagOptions)) {
					throw new TypeError('TagSelector.addTag: wrong item options.');
				}
				if (this.getTag(tagOptions)) {
					return null;
				}
				const tag = new TagItem(this, tagOptions);
				const event = new main_core_events.BaseEvent({
					data: {
						tag
					}
				});
				this.emit('onBeforeTagAdd', event);
				if (event.isDefaultPrevented()) {
					return null;
				}
				if (!this.isMultiple()) {
					this.removeTags();
				}
				this.tags.push(tag);
				this.emit('onTagAdd', {
					tag
				});
				if (this.isRendered()) {
					tag.render();
					this.getItemsContainer().insertBefore(tag.getContainer(), this.getTextBox());
					if (tagOptions.animate !== false) {
						void tag.show().then(() => {
							this.getContainer().scrollTop = this.getContainer().scrollHeight - this.getContainer().offsetHeight;
							this.emit('onAfterTagAdd', {
								tag
							});
							this.focusZone?.refreshElements();
						});
					} else {
						this.emit('onAfterTagAdd', {
							tag
						});
						this.focusZone?.refreshElements();
					}
					this.toggleAddButtonCaption();
				} else {
					this.emit('onAfterTagAdd', {
						tag
					});
					this.focusZone?.refreshElements();
				}
				return tag;
			}
		}, {
			key: "removeTag",
			value: function removeTag(item, animate = true) {
				const tagItem = this.getTag(item);
				if (!tagItem) {
					return;
				}
				const event = new main_core_events.BaseEvent({
					data: {
						tag: tagItem
					}
				});
				this.emit('onBeforeTagRemove', event);
				if (event.isDefaultPrevented()) {
					return;
				}
				this.tags = this.tags.filter(el => el !== tagItem);
				this.emit('onTagRemove', {
					tag: tagItem
				});
				if (this.isRendered()) {
					ui_a11y.FocusNavigator.focusNext(this.getOuterContainer(), {
						from: tagItem.getContentContainer(),
						wrap: true,
						tabbableOnly: false
					});
					void tagItem.remove(animate).then(() => {
						this.toggleAddButtonCaption();
						this.emit('onAfterTagRemove', {
							tag: tagItem
						});
						this.focusZone?.refreshElements();
					});
				} else {
					this.emit('onAfterTagRemove', {
						tag: tagItem
					});
					this.focusZone?.refreshElements();
				}
			}
		}, {
			key: "removeTags",
			value: function removeTags() {
				this.getTags().forEach(tag => {
					this.removeTag(tag, false);
				});
			}
		}, {
			key: "getTags",
			value: function getTags() {
				return this.tags;
			}
		}, {
			key: "renderTo",
			value: function renderTo(node) {
				if (this.isRendered()) {
					return;
				}
				this.rendered = true;
				this.getTags().forEach(tag => {
					tag.render();
					this.getItemsContainer().insertBefore(tag.getContainer(), this.getTextBox());
				});
				if (main_core.Type.isDomNode(node)) {
					main_core.Dom.append(this.getOuterContainer(), node);
				}
				this.focusZone = new ui_a11y.FocusZone(this.getOuterContainer(), {
					bindKeys: ui_a11y.FocusKeys.ArrowHorizontal | ui_a11y.FocusKeys.HomeAndEnd,
					...this.focusZoneOptions
				});
				this.toggleFocusZone();
			}
		}, {
			key: "toggleFocusZone",
			value: function toggleFocusZone() {
				if (this.isRendered() && !this.isLocked() && !this.isReadonly()) {
					this.focusZone?.activate();
				} else {
					this.focusZone?.deactivate();
				}
			}
		}, {
			key: "isRendered",
			value: function isRendered() {
				return this.rendered;
			}
		}, {
			key: "updateTags",
			value: function updateTags() {
				if (this.isRendered()) {
					this.getTags().forEach(tag => {
						tag.render();
					});
				}
			}
		}, {
			key: "getOuterContainer",
			value: function getOuterContainer() {
				return this.cache.remember('outer-container', () => {
					let className = this.isReadonly() ? ' ui-tag-selector-container-readonly' : '';
					className += this.isLocked() ? ' ui-tag-selector-container-locked' : '';
					return main_core.Tag.render`
				<div class="ui-tag-selector-outer-container --air --ui-context-content-light${className}">${this.getContainer()}</div>
			`;
				});
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				return this.cache.remember('container', () => {
					const style = this.getMaxHeight() ? ` style="max-height: ${this.getMaxHeight()}px; -ms-overflow-style: -ms-autohiding-scrollbar;"` : '';
					return main_core.Tag.render`
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
		}, {
			key: "getItemsContainer",
			value: function getItemsContainer() {
				return this.cache.remember('items-container', () => {
					return main_core.Tag.render`
				<div class="ui-tag-selector-items">
					${this.getTextBox()}
					${this.getAddButton()}
				</div>
			`;
				});
			}
		}, {
			key: "getTextBox",
			value: function getTextBox() {
				return this.cache.remember('text-box', () => {
					const className = this.textBoxVisible ? '' : ' ui-tag-selector-item-hidden';
					const input = main_core.Tag.render`
				<input 
					type="text"
					class="ui-tag-selector-item ui-tag-selector-text-box${className}"
					autocomplete="off"
					data-testid="ui-tag-selector-input"
					placeholder="${main_core.Text.encode(this.getPlaceholder())}"
					aria-label="${main_core.Text.encode(this.getPlaceholder() || main_core.Loc.getMessage('UI_TAG_SELECTOR_SEARCH_PLACEHOLDER') || '')}"
					oninput="${this.handleTextBoxInput.bind(this)}"
					onblur="${this.handleTextBoxBlur.bind(this)}"
					onkeyup="${this.handleTextBoxKeyUp.bind(this)}"
					onkeydown="${this.handleTextBoxKeyDown.bind(this)}"
					value=""
				>
			`;
					const width = this.getTextBoxWidth();
					if (width !== null) {
						main_core.Dom.style(input, 'min-width', main_core.Type.isStringFilled(width) ? width : `${width}px`);
					}
					if (this.isLocked()) {
						input.disabled = true;
					}
					return input;
				});
			}
		}, {
			key: "getItemsHeight",
			value: function getItemsHeight() {
				return this.getItemsContainer().scrollHeight;
			}
		}, {
			key: "calcHeight",
			value: function calcHeight() {
				if (this.getMaxHeight() !== null) {
					return Math.min(this.getItemsHeight(), this.getMaxHeight());
				}
				return Math.max(this.getItemsHeight(), this.getMinHeight());
			}
		}, {
			key: "getTextBoxValue",
			value: function getTextBoxValue() {
				return this.getTextBox().value;
			}
		}, {
			key: "clearTextBox",
			value: function clearTextBox() {
				this.getTextBox().value = '';
				this.textBoxOldValue = '';
			}
		}, {
			key: "showTextBox",
			value: function showTextBox() {
				this.textBoxVisible = true;
				main_core.Dom.removeClass(this.getTextBox(), 'ui-tag-selector-item-hidden');
			}
		}, {
			key: "hideTextBox",
			value: function hideTextBox() {
				this.textBoxVisible = false;
				main_core.Dom.addClass(this.getTextBox(), 'ui-tag-selector-item-hidden');
			}
		}, {
			key: "tryAutoHideTextBox",
			value: function tryAutoHideTextBox() {
				if (this.textBoxAutoHide) {
					this.clearTextBox();
					this.showAddButton();
					this.hideTextBox();
					this.getAddButtonLink().focus();
				}
			}
		}, {
			key: "focusTextBox",
			value: function focusTextBox() {
				this.getTextBox().focus();
			}
		}, {
			key: "setTextBoxAutoHide",
			value: function setTextBoxAutoHide(autoHide) {
				if (main_core.Type.isBoolean(autoHide)) {
					this.textBoxAutoHide = autoHide;
				}
			}
		}, {
			key: "getTextBoxWidth",
			value: function getTextBoxWidth() {
				return this.textBoxWidth;
			}
		}, {
			key: "setTextBoxWidth",
			value: function setTextBoxWidth(width) {
				if (main_core.Type.isStringFilled(width) || width === null) {
					this.textBoxWidth = width;
					if (this.isRendered()) {
						main_core.Dom.style(this.getTextBox(), 'min-width', width);
					}
				} else if (main_core.Type.isNumber(width) && width > 0) {
					this.textBoxWidth = width;
					if (this.isRendered()) {
						main_core.Dom.style(this.getTextBox(), 'min-width', `${width}px`);
					}
				}
			}
		}, {
			key: "getTagMaxWidth",
			value: function getTagMaxWidth() {
				return this.tagMaxWidth;
			}
		}, {
			key: "setTagMaxWidth",
			value: function setTagMaxWidth(width) {
				if (main_core.Type.isNumber(width) && width >= 0 || width === null) {
					this.tagMaxWidth = width;
					this.updateTags();
				}
			}
		}, {
			key: "getTagAvatar",
			value: function getTagAvatar() {
				return this.tagAvatar;
			}
		}, {
			key: "setTagAvatar",
			value: function setTagAvatar(tagAvatar) {
				if (main_core.Type.isString(tagAvatar) || tagAvatar === null) {
					this.tagAvatar = tagAvatar;
					this.updateTags();
				}
			}
		}, {
			key: "getTagClickable",
			value: function getTagClickable() {
				return this.tagClickable;
			}
		}, {
			key: "setTagClickable",
			value: function setTagClickable(flag) {
				if (main_core.Type.isBoolean(flag) || flag === null) {
					this.tagClickable = flag;
					this.updateTags();
				}
			}
		}, {
			key: "getTagAvatarOptions",
			value: function getTagAvatarOptions() {
				return this.tagAvatarOptions;
			}
		}, {
			key: "getTagAvatarOption",
			value: function getTagAvatarOption(option) {
				if (this.tagAvatarOptions !== null && !main_core.Type.isUndefined(this.tagAvatarOptions[option])) {
					return this.tagAvatarOptions[option];
				}
				return null;
			}
		}, {
			key: "setTagAvatarOption",
			value: function setTagAvatarOption(option, value) {
				if (main_core.Type.isStringFilled(option) && !main_core.Type.isUndefined(value)) {
					if (this.tagAvatarOptions === null) {
						this.tagAvatarOptions = {};
					}
					this.tagAvatarOptions[option] = value;
					this.updateTags();
				}
			}
		}, {
			key: "setTagAvatarOptions",
			value: function setTagAvatarOptions(options) {
				if (main_core.Type.isPlainObject(options)) {
					Object.keys(options).forEach(option => {
						this.setTagAvatarOption(option, options[option]);
					});
				}
			}
		}, {
			key: "getTagTextColor",
			value: function getTagTextColor() {
				return this.tagTextColor;
			}
		}, {
			key: "setTagTextColor",
			value: function setTagTextColor(textColor) {
				if (main_core.Type.isString(textColor) || textColor === null) {
					this.tagTextColor = textColor;
					this.updateTags();
				}
			}
		}, {
			key: "getTagBgColor",
			value: function getTagBgColor() {
				return this.tagBgColor;
			}
		}, {
			key: "setTagBgColor",
			value: function setTagBgColor(bgColor) {
				if (main_core.Type.isString(bgColor) || bgColor === null) {
					this.tagBgColor = bgColor;
					this.updateTags();
				}
			}
		}, {
			key: "getTagFontWeight",
			value: function getTagFontWeight() {
				return this.tagFontWeight;
			}
		}, {
			key: "setTagFontWeight",
			value: function setTagFontWeight(fontWeight) {
				if (main_core.Type.isString(fontWeight) || fontWeight === null) {
					this.tagFontWeight = fontWeight;
					this.updateTags();
				}
			}
		}, {
			key: "getPlaceholder",
			value: function getPlaceholder() {
				return this.placeholder;
			}
		}, {
			key: "setPlaceholder",
			value: function setPlaceholder(placeholder) {
				if (main_core.Type.isStringFilled(placeholder)) {
					this.placeholder = placeholder;
					if (this.isRendered()) {
						this.getTextBox().placeholder = placeholder;
						main_core.Dom.attr(this.getTextBox(), 'aria-label', placeholder);
					}
				}
			}
		}, {
			key: "getMaxHeight",
			value: function getMaxHeight() {
				return this.maxHeight;
			}
		}, {
			key: "getMinHeight",
			value: function getMinHeight() {
				return 34;
			}
		}, {
			key: "setMaxHeight",
			value: function setMaxHeight(height) {
				if (main_core.Type.isNumber(height) && height > 0 || height === null) {
					this.maxHeight = height;
					if (this.isRendered()) {
						main_core.Dom.style(this.getContainer(), 'max-height', height > 0 ? `${height}px` : null);
						main_core.Dom.style(this.getContainer(), '-ms-overflow-style', height > 0 ? '-ms-autohiding-scrollbar' : null);
					}
				}
			}
		}, {
			key: "getAddButton",
			value: function getAddButton() {
				return this.cache.remember('add-button', () => {
					const className = this.addButtonVisible ? '' : ' ui-tag-selector-item-hidden';
					return main_core.Tag.render`
				<span
					class="ui-tag-selector-item ui-tag-selector-add-button${className}"
					data-testid="ui-tag-selector-add-item-button"
				>
					${this.getAddButtonLink()}
				</span>
			`;
				});
			}
		}, {
			key: "getAddButtonLink",
			value: function getAddButtonLink() {
				return this.cache.remember('add-button-link', () => {
					const caption = main_core.Text.encode(this.getActualButtonCaption());
					return main_core.Tag.render`
				<button
					type="button"
					tabindex="0"
					class="ui-tag-selector-add-button-caption" 
					onclick="${this.handleAddButtonClick.bind(this)}"
				>${caption}</button>
			`;
				});
			}
		}, {
			key: "getAddButtonCaption",
			value: function getAddButtonCaption() {
				return this.addButtonCaption === null ? main_core.Loc.getMessage('UI_TAG_SELECTOR_ADD_BUTTON_CAPTION') || '' : this.addButtonCaption;
			}
		}, {
			key: "setAddButtonCaption",
			value: function setAddButtonCaption(caption) {
				if (main_core.Type.isStringFilled(caption)) {
					this.addButtonCaption = caption;
					if (this.isRendered()) {
						this.toggleAddButtonCaption();
					}
				}
			}
		}, {
			key: "getAddButtonCaptionMore",
			value: function getAddButtonCaptionMore() {
				return this.addButtonCaptionMore === null ? this.isMultiple() ? main_core.Loc.getMessage('UI_TAG_SELECTOR_ADD_BUTTON_CAPTION') || '' : main_core.Loc.getMessage('UI_TAG_SELECTOR_ADD_BUTTON_CAPTION_SINGLE') || '' : this.addButtonCaptionMore;
			}
		}, {
			key: "setAddButtonCaptionMore",
			value: function setAddButtonCaptionMore(caption) {
				if (main_core.Type.isStringFilled(caption)) {
					this.addButtonCaptionMore = caption;
					if (this.isRendered()) {
						this.toggleAddButtonCaption();
					}
				}
			}
		}, {
			key: "toggleAddButtonCaption",
			value: function toggleAddButtonCaption() {
				if (this.getAddButtonCaptionMore() === null) {
					return;
				}
				this.getAddButtonLink().textContent = this.getActualButtonCaption();
			}
		}, {
			key: "getActualButtonCaption",
			value: function getActualButtonCaption() {
				return this.getTags().length > 0 && this.getAddButtonCaptionMore() !== null ? this.getAddButtonCaptionMore() : this.getAddButtonCaption();
			}
		}, {
			key: "showAddButton",
			value: function showAddButton() {
				this.addButtonVisible = true;
				main_core.Dom.removeClass(this.getAddButton(), 'ui-tag-selector-item-hidden');
			}
		}, {
			key: "hideAddButton",
			value: function hideAddButton() {
				this.addButtonVisible = false;
				main_core.Dom.addClass(this.getAddButton(), 'ui-tag-selector-item-hidden');
			}
		}, {
			key: "getCreateButton",
			value: function getCreateButton() {
				return this.cache.remember('create-button', () => {
					const className = this.createButtonVisible ? '' : ' ui-tag-selector-item-hidden';
					return main_core.Tag.render`
				<div class="ui-tag-selector-create-button${className}">
					<button
						type="button"
						tabindex="0"
						class="ui-tag-selector-create-button-caption"
						onclick="${this.handleCreateButtonClick.bind(this)}"
					>${main_core.Text.encode(this.getCreateButtonCaption())}</button>
				</div>
			`;
				});
			}
		}, {
			key: "showCreateButton",
			value: function showCreateButton() {
				this.createButtonVisible = true;
				main_core.Dom.removeClass(this.getCreateButton(), 'ui-tag-selector-item-hidden');
			}
		}, {
			key: "hideCreateButton",
			value: function hideCreateButton() {
				this.createButtonVisible = false;
				main_core.Dom.addClass(this.getCreateButton(), 'ui-tag-selector-item-hidden');
			}
		}, {
			key: "getCreateButtonCaption",
			value: function getCreateButtonCaption() {
				return this.createButtonCaption === null ? main_core.Loc.getMessage('UI_TAG_SELECTOR_CREATE_BUTTON_CAPTION') : this.createButtonCaption;
			}
		}, {
			key: "setCreateButtonCaption",
			value: function setCreateButtonCaption(caption) {
				if (main_core.Type.isStringFilled(caption)) {
					this.createButtonCaption = caption;
					if (this.isRendered()) {
						this.getCreateButton().children[0].textContent = caption;
					}
				}
			}
		}, {
			key: "handleContainerClick",
			value: function handleContainerClick(event) {
				this.emit('onContainerClick', {
					event
				});
			}
		}, {
			key: "handleTextBoxInput",
			value: function handleTextBoxInput(event) {
				const newValue = this.getTextBoxValue();
				if (newValue !== this.textBoxOldValue) {
					this.textBoxOldValue = newValue;
					this.emit('onInput', {
						event
					});
				}
			}
		}, {
			key: "handleTextBoxBlur",
			value: function handleTextBoxBlur(event) {
				this.emit('onBlur', {
					event
				});
				this.tryAutoHideTextBox();
			}
		}, {
			key: "handleTextBoxKeyUp",
			value: function handleTextBoxKeyUp(event) {
				this.emit('onKeyUp', {
					event
				});
			}
		}, {
			key: "handleTextBoxKeyDown",
			value: function handleTextBoxKeyDown(event) {
				if (event.key === 'Enter') {
					event.preventDefault();
					if (main_core.Browser.isMac() && event.metaKey || event.ctrlKey) {
						this.emit('onMetaEnter', {
							event
						});
					} else {
						this.emit('onEnter', {
							event
						});
					}
					this.tryAutoHideTextBox();
				}
				this.emit('onKeyDown', {
					event
				});
			}
		}, {
			key: "handleAddButtonClick",
			value: function handleAddButtonClick(event) {
				this.hideAddButton();
				this.showTextBox();
				this.focusTextBox();
				this.emit('onAddButtonClick', {
					event
				});
			}
		}, {
			key: "handleCreateButtonClick",
			value: function handleCreateButtonClick(event) {
				this.emit('onCreateButtonClick', {
					event
				});
			}
		}]);
	}(main_core_events.EventEmitter);

	class Navigation {
		dialog;
		lockedTab = null;
		enabled = false;
		#focusZone = null;
		static keyMap = {
			Down: 'ArrowDown',
			Up: 'ArrowUp',
			Left: 'ArrowLeft',
			Right: 'ArrowRight',
			Spacebar: 'Space',
			' ': 'Space'
		};
		constructor(dialog) {
			this.dialog = dialog;
			this.dialog.subscribe('onShow', this.handleDialogShow.bind(this));
			this.dialog.subscribe('onHide', this.handleDialogHide.bind(this));
			this.dialog.subscribe('onDestroy', this.handleDialogDestroy.bind(this));
		}
		getDialog() {
			return this.dialog;
		}
		enable() {
			if (!this.isEnabled()) {
				this.bindEvents();
				this.#focusZone = new ui_a11y.FocusZone(this.getDialog().getLabelsContainer());
				this.#focusZone.activate();
			}
			this.enabled = true;
		}
		disable() {
			if (this.isEnabled()) {
				this.unbindEvents();
				this.unlockTab();
				this.#focusZone?.deactivate();
				this.#focusZone = null;
			}
			this.enabled = false;
		}
		isEnabled() {
			return this.enabled;
		}
		bindEvents() {
			const tagSelector = this.getDialog().getTagSelector();
			if (tagSelector === null) {
				main_core.Event.bind(document, 'keydown', this.#handleKeyDown);
			} else {
				tagSelector.subscribe('onKeyDown', this.#handleTagSelectorKeyDown);
			}
			main_core.Event.bind(this.getDialog().getLabelsContainer(), 'keydown', this.#handleLabelsKeyDown);
		}
		unbindEvents() {
			const tagSelector = this.getDialog().getTagSelector();
			if (tagSelector === null) {
				main_core.Event.unbind(document, 'keydown', this.#handleKeyDown);
			} else {
				tagSelector.unsubscribe('onKeyDown', this.#handleTagSelectorKeyDown);
			}
			main_core.Event.unbind(this.getDialog().getLabelsContainer(), 'keydown', this.#handleLabelsKeyDown);
		}
		#handleTagSelectorKeyDown = event => {
			this.#handleKeyDown(event.getData().event);
		};
		#handleLabelsKeyDown = event => {
			const keyName = Navigation.keyMap[event.key] || event.key;
			if (keyName === 'ArrowLeft') {
				this.getDialog().expandLabels(false);
				event.stopPropagation();
			} else if (keyName === 'ArrowRight') {
				this.getDialog().collapseLabels(false);
				event.preventDefault();
			} else if (keyName === 'Tab' && !this.getDialog().hasTagSelector() && !this.getActiveNode()) {
				const firstNode = this.getFirstNode();
				this.focusOnNode(firstNode);
				event.preventDefault();
			}
			event.stopPropagation();
		};
		getNextNode() {
			if (!this.getActiveNode()) {
				return null;
			}
			let nextNode = null;
			let currentNode = this.getActiveNode();
			if (currentNode.hasChildren() && currentNode.isOpen()) {
				nextNode = currentNode.getFirstChild();
			}
			while (nextNode === null && currentNode !== null) {
				nextNode = currentNode.getNextSibling();
				if (nextNode) {
					break;
				}
				currentNode = currentNode.getParentNode();
			}
			return nextNode;
		}
		getPreviousNode() {
			const activeNode = this.getActiveNode();
			if (activeNode === null) {
				return null;
			}
			let previousNode = activeNode.getPreviousSibling();
			if (previousNode !== null) {
				while (previousNode.hasChildren() && previousNode.isOpen()) {
					const lastChild = previousNode.getLastChild();
					if (lastChild === null) {
						break;
					}
					previousNode = lastChild;
				}
			} else if (activeNode.getParentNode() && !activeNode.getParentNode().isRoot()) {
				previousNode = activeNode.getParentNode();
			}
			return previousNode;
		}
		getFirstNode() {
			const tab = this.getDialog().getActiveTab();
			return tab && tab.getRootNode().getFirstChild();
		}
		getLastNode() {
			const tab = this.getDialog().getActiveTab();
			if (!tab) {
				return null;
			}
			let lastNode = tab.getRootNode().getLastChild();
			if (lastNode !== null) {
				while (lastNode.hasChildren() && lastNode.isOpen()) {
					const lastChild = lastNode.getLastChild();
					if (lastChild === null) {
						break;
					}
					lastNode = lastChild;
				}
			}
			return lastNode;
		}
		getActiveNode() {
			return this.getDialog().getFocusedNode();
		}
		focusOnNode(node) {
			if (node) {
				const focusVisible = !this.getDialog().hasTagSelector();
				node.focus(focusVisible);
				node.scrollIntoView();
			}
		}
		lockTab() {
			const activeTab = this.getDialog().getActiveTab();
			if (this.lockedTab === activeTab) {
				return;
			}
			if (this.lockedTab !== null) {
				this.unlockTab();
			}
			this.lockedTab = activeTab;
			this.lockedTab.lock();
			main_core.Event.bind(document, 'mousemove', this.#handleMouseMove);
		}
		unlockTab() {
			if (this.lockedTab === null) {
				return;
			}
			this.lockedTab.unlock();
			this.lockedTab = null;
			main_core.Event.unbind(document, 'mousemove', this.#handleMouseMove);
		}
		handleDialogShow() {
			this.enable();
		}
		handleDialogHide() {
			this.disable();
		}
		handleDialogDestroy() {
			this.disable();
		}
		#handleMouseMove = () => {
			this.unlockTab();
		};
		#handleKeyDown = event => {
			if (!this.getDialog().isOpen()) {
				this.unbindEvents();
				return;
			}
			if (event.metaKey || event.ctrlKey || event.altKey) {
				return;
			}
			const activeTab = this.getDialog().getActiveTab();
			if (!activeTab) {
				return;
			}
			const keyName = Navigation.keyMap[event.key] || event.key;
			if (activeTab === this.getDialog().getSearchTab() && ['ArrowLeft', 'ArrowRight'].includes(keyName)) {
				return;
			}
			const handler = this[`handle${keyName}Press`];
			if (handler) {
				handler.call(this, event);
				if (keyName !== 'Tab') {
					this.lockTab();
				}
			}
		};
		isFocusInLabels(event) {
			return this.getDialog().getLabelsContainer().contains(event.target);
		}
		handleArrowDownPress(event) {
			if (this.getActiveNode()) {
				const nextNode = this.getNextNode();
				if (nextNode) {
					this.focusOnNode(nextNode);
				} else {
					const firstNode = this.getFirstNode();
					this.focusOnNode(firstNode);
				}
			} else {
				const firstNode = this.getFirstNode();
				this.focusOnNode(firstNode);
			}
			event.preventDefault();
		}
		handleArrowUpPress(event) {
			if (this.getActiveNode()) {
				const previousNode = this.getPreviousNode();
				if (previousNode) {
					this.focusOnNode(previousNode);
				} else {
					const lastNode = this.getLastNode();
					this.focusOnNode(lastNode);
				}
			} else {
				const lastNode = this.getLastNode();
				this.focusOnNode(lastNode);
			}
			event.preventDefault();
		}
		handleArrowRightPress(event) {
			const activeNode = this.getActiveNode();
			if (activeNode) {
				activeNode.expand();
			}
			event.preventDefault();
		}
		handleArrowLeftPress(event) {
			const activeNode = this.getActiveNode();
			if (!activeNode) {
				return;
			}
			if (activeNode.isOpen()) {
				activeNode.collapse();
				event.preventDefault();
			} else {
				const parentNode = activeNode.getParentNode();
				if (parentNode && !parentNode.isRoot()) {
					this.focusOnNode(parentNode);
					event.preventDefault();
				}
			}
		}
		handleEnterPress(event) {
			const activeNode = this.getActiveNode();
			if (activeNode) {
				activeNode.click();
			}
			event.preventDefault();
		}
		handleSpacePress(event) {
			const activeNode = this.getActiveNode();
			if (!this.getDialog().hasTagSelector() && this.getDialog().getPopup().getPopupContainer().contains(ui_a11y.FocusNavigator.getActiveElement())) {
				if (activeNode) {
					activeNode.click();
				}
				event.preventDefault();
			}
		}
		handleTabPress(event) {
			if (this.getDialog().isTagSelectorOutside()) {
				if (event.shiftKey) {
					ui_a11y.FocusNavigator.focusLast(this.getDialog().getContainer());
				} else {
					ui_a11y.FocusNavigator.focusFirst(this.getDialog().getContainer());
				}
				event.preventDefault();
			}
		}
	}

	class SliderIntegration {
		dialog;
		sliders = new Set();
		constructor(dialog) {
			this.dialog = dialog;
			this.dialog.subscribe('onShow', this.handleDialogShow.bind(this));
			this.dialog.subscribe('onHide', this.handleDialogHide.bind(this));
			this.dialog.subscribe('onDestroy', this.handleDialogDestroy.bind(this));
			this.handleSliderOpen = this.handleSliderOpen.bind(this);
			this.handleSliderClose = this.handleSliderClose.bind(this);
			this.handleSliderDestroy = this.handleSliderDestroy.bind(this);
		}
		getDialog() {
			return this.dialog;
		}
		bindEvents() {
			this.unbindEvents();
			const topWindow = top;
			if (topWindow.BX) {
				topWindow.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onOpen', this.handleSliderOpen);
				topWindow.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onCloseComplete', this.handleSliderClose);
				topWindow.BX.Event.EventEmitter.subscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
			}
		}
		unbindEvents() {
			const topWindow = top;
			if (topWindow.BX) {
				topWindow.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onOpen', this.handleSliderOpen);
				topWindow.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onCloseComplete', this.handleSliderClose);
				topWindow.BX.Event.EventEmitter.unsubscribe('SidePanel.Slider:onDestroy', this.handleSliderDestroy);
			}
		}
		isDialogInSlider(slider) {
			if (slider.getFrameWindow()) {
				return slider.getFrameWindow().document.contains(this.getDialog().getContainer());
			} else {
				return slider.getContainer().contains(this.getDialog().getContainer());
			}
		}
		handleDialogShow() {
			this.bindEvents();
		}
		handleDialogHide() {
			this.sliders.clear();
			this.unbindEvents();
			this.getDialog().unfreeze();
		}
		handleDialogDestroy() {
			this.sliders.clear();
			this.unbindEvents();
		}
		handleSliderOpen(event) {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider();
			if (!this.isDialogInSlider(slider)) {
				this.sliders.add(slider);
				this.getDialog().freeze();
			}
		}
		handleSliderClose(event) {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider();
			this.sliders.delete(slider);
			this.#unfreezeDialog();
		}
		handleSliderDestroy(event) {
			const [sliderEvent] = event.getData();
			const slider = sliderEvent.getSlider();
			if (this.isDialogInSlider(slider)) {
				this.unbindEvents();
				this.dialog.destroy();
			} else {
				this.sliders.delete(slider);
				this.#unfreezeDialog();
			}
		}
		#unfreezeDialog() {
			if (this.sliders.size > 0) {
				return;
			}
			setTimeout(() => {
				if (this.sliders.size === 0 && this.getDialog().destroyed !== true) {
					this.getDialog().unfreeze();
				}
			}, 0);
		}
	}

	function isDialog(dialog) {
		return dialog instanceof Dialog;
	}

	let BaseHeader = function () {
		function BaseHeader(context, options) {
			babelHelpers.classCallCheck(this, BaseHeader);
			babelHelpers.defineProperty(this, "dialog", void 0);
			babelHelpers.defineProperty(this, "tab", null);
			babelHelpers.defineProperty(this, "container", null);
			babelHelpers.defineProperty(this, "cache", new main_core_cache.MemoryCache());
			babelHelpers.defineProperty(this, "options", {});
			this.options = main_core.Type.isPlainObject(options) ? options : {};
			if (isDialog(context)) {
				this.dialog = context;
			} else {
				this.tab = context;
				this.dialog = this.tab.getDialog();
			}
		}
		return babelHelpers.createClass(BaseHeader, [{
			key: "getDialog",
			value: function getDialog() {
				return this.dialog;
			}
		}, {
			key: "getTab",
			value: function getTab() {
				return this.tab;
			}
		}, {
			key: "show",
			value: function show() {
				main_core.Dom.addClass(this.getContainer(), 'ui-selector-header--show');
			}
		}, {
			key: "hide",
			value: function hide() {
				main_core.Dom.removeClass(this.getContainer(), 'ui-selector-header--show');
			}
		}, {
			key: "getOptions",
			value: function getOptions() {
				return this.options;
			}
		}, {
			key: "getOption",
			value: function getOption(option, defaultValue) {
				if (!main_core.Type.isUndefined(this.options[option])) {
					return this.options[option];
				}
				if (!main_core.Type.isUndefined(defaultValue)) {
					return defaultValue;
				}
				return null;
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				if (this.container === null) {
					this.container = main_core.Tag.render`
				<div class="ui-selector-header">${this.render()}</div>
			`;
				}
				return this.container;
			}
		}, {
			key: "render",
			value: function render() {
				throw new Error('You must implement render() method.');
			}
		}]);
	}();

	function _callSuper$2(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$2() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$2() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$2 = function () { return !!t; })(); }
	let DefaultHeader = function (_BaseHeader) {
		function DefaultHeader(context, options) {
			var _this;
			babelHelpers.classCallCheck(this, DefaultHeader);
			_this = _callSuper$2(this, DefaultHeader, [context, options]);
			babelHelpers.defineProperty(_this, "content", null);
			_this.setContent(_this.getOption('content'));
			return _this;
		}
		babelHelpers.inherits(DefaultHeader, _BaseHeader);
		return babelHelpers.createClass(DefaultHeader, [{
			key: "render",
			value: function render() {
				const container = main_core.Tag.render`<div>${this.getContent() ?? ''}</div>`;
				const className = this.getOption('containerClass', 'ui-selector-header-default');
				const containerStyles = this.getOption('containerStyles', {});
				main_core.Dom.addClass(container, className);
				main_core.Dom.style(container, containerStyles);
				return container;
			}
		}, {
			key: "getContent",
			value: function getContent() {
				return this.content;
			}
		}, {
			key: "setContent",
			value: function setContent(content) {
				if (main_core.Type.isStringFilled(content) || main_core.Type.isDomNode(content) || main_core.Type.isArrayFilled(content)) {
					this.content = content;
				}
			}
		}]);
	}(BaseHeader);

	let BaseFooter = function () {
		function BaseFooter(context, options) {
			babelHelpers.classCallCheck(this, BaseFooter);
			babelHelpers.defineProperty(this, "dialog", void 0);
			babelHelpers.defineProperty(this, "tab", null);
			babelHelpers.defineProperty(this, "container", null);
			babelHelpers.defineProperty(this, "cache", new main_core_cache.MemoryCache());
			babelHelpers.defineProperty(this, "options", {});
			this.options = main_core.Type.isPlainObject(options) ? options : {};
			if (isDialog(context)) {
				this.dialog = context;
			} else {
				this.tab = context;
				this.dialog = this.tab.getDialog();
			}
		}
		return babelHelpers.createClass(BaseFooter, [{
			key: "getDialog",
			value: function getDialog() {
				return this.dialog;
			}
		}, {
			key: "getTab",
			value: function getTab() {
				return this.tab;
			}
		}, {
			key: "show",
			value: function show() {
				main_core.Dom.addClass(this.getContainer(), 'ui-selector-footer--show');
			}
		}, {
			key: "hide",
			value: function hide() {
				main_core.Dom.removeClass(this.getContainer(), 'ui-selector-footer--show');
			}
		}, {
			key: "getOptions",
			value: function getOptions() {
				return this.options;
			}
		}, {
			key: "getOption",
			value: function getOption(option, defaultValue) {
				if (!main_core.Type.isUndefined(this.options[option])) {
					return this.options[option];
				}
				if (!main_core.Type.isUndefined(defaultValue)) {
					return defaultValue;
				}
				return null;
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				if (this.container === null) {
					this.container = main_core.Tag.render`
				<div class="ui-selector-footer">${this.render()}</div>
			`;
				}
				return this.container;
			}
		}, {
			key: "render",
			value: function render() {
				throw new Error('You must implement render() method.');
			}
		}]);
	}();

	function _callSuper$1(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct$1() ? Reflect.construct(o, e || [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct$1() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct$1 = function () { return !!t; })(); }
	let DefaultFooter = function (_BaseFooter) {
		function DefaultFooter(context, options) {
			var _this;
			babelHelpers.classCallCheck(this, DefaultFooter);
			_this = _callSuper$1(this, DefaultFooter, [context, options]);
			babelHelpers.defineProperty(_this, "content", null);
			_this.setContent(_this.getOption('content'));
			return _this;
		}
		babelHelpers.inherits(DefaultFooter, _BaseFooter);
		return babelHelpers.createClass(DefaultFooter, [{
			key: "render",
			value: function render() {
				const container = main_core.Tag.render`<div>${this.getContent() ?? ''}</div>`;
				const className = this.getOption('containerClass', 'ui-selector-footer-default');
				const containerStyles = this.getOption('containerStyles', {});
				main_core.Dom.addClass(container, className);
				main_core.Dom.style(container, containerStyles);
				return container;
			}
		}, {
			key: "getContent",
			value: function getContent() {
				return this.content;
			}
		}, {
			key: "setContent",
			value: function setContent(content) {
				if (main_core.Type.isStringFilled(content) || main_core.Type.isDomNode(content) || main_core.Type.isArrayFilled(content)) {
					this.content = content;
				}
			}
		}]);
	}(BaseFooter);

	class RecentTab extends Tab {
		constructor(dialog, tabOptions) {
			const defaults = {
				title: main_core.Loc.getMessage('UI_SELECTOR_RECENT_TAB_TITLE') || '',
				itemOrder: {
					sort: 'asc'
				},
				visible: !dialog.isDropdownMode(),
				stub: !dialog.isDropdownMode(),
				icon: ui_iconSet_api_core.Outline.SEARCH
			};
			const options = {
				...defaults,
				...tabOptions,
				id: 'recents'
			};
			super(dialog, options);
		}
	}

	const comparator = (a, b) => {
		if (a.getStartIndex() === b.getStartIndex()) {
			return a.getEndIndex() > b.getEndIndex() ? -1 : 1;
		}
		return a.getStartIndex() > b.getStartIndex() ? 1 : -1;
	};
	class MatchField {
		field = null;
		matchIndexes = new main_core_collections.OrderedArray(comparator);
		constructor(field, indexes = []) {
			this.field = field;
			this.addIndexes(indexes);
		}
		getField() {
			return this.field;
		}
		getMatches() {
			return this.matchIndexes;
		}
		addIndex(matchIndex) {
			this.matchIndexes.add(matchIndex);
		}
		addIndexes(matchIndexes) {
			if (main_core.Type.isArray(matchIndexes)) {
				for (const matchIndex of matchIndexes) {
					this.addIndex(matchIndex);
				}
			}
		}
	}

	class MatchResult {
		item;
		matchFields = new Map();
		sort = null;
		constructor(item, matchIndexes = []) {
			this.item = item;
			this.addIndexes(matchIndexes);
		}
		getItem() {
			return this.item;
		}
		getMatchFields() {
			return this.matchFields;
		}
		getSort() {
			return this.sort;
		}
		addIndex(matchIndex) {
			let matchField = this.matchFields.get(matchIndex.getField());
			if (!matchField) {
				matchField = new MatchField(matchIndex.getField());
				this.matchFields.set(matchIndex.getField(), matchField);
				const fieldSort = matchIndex.getField().getSort();
				if (fieldSort !== null) {
					this.sort = this.sort === null ? fieldSort : Math.min(this.sort, fieldSort);
				}
			}
			matchField.addIndex(matchIndex);
		}
		addIndexes(matchIndexes) {
			for (const matchIndex of matchIndexes) {
				this.addIndex(matchIndex);
			}
		}
	}

	class MatchIndex {
		field = null;
		queryWord = null;
		startIndex = null;
		endIndex = null;
		constructor(field, queryWord, startIndex) {
			this.field = field;
			this.queryWord = queryWord;
			this.startIndex = startIndex;
			this.endIndex = startIndex + queryWord.length;
		}
		getField() {
			return this.field;
		}
		getQueryWord() {
			return this.queryWord;
		}
		getStartIndex() {
			return this.startIndex;
		}
		getEndIndex() {
			return this.endIndex;
		}
	}

	const collator = new Intl.Collator(undefined, {
		sensitivity: 'base'
	});
	class SearchEngine {
		static matchItems(items, searchQuery, options = {}) {
			const matchResults = [];
			const queryWords = searchQuery.getQueryWords();
			let limit = searchQuery.getResultLimit();
			const matchAll = options.matchAll === true;
			for (const item of items) {
				if (limit === 0) {
					break;
				}
				if (item.isSelected() || !item.isSearchable() || item.isHidden() || !item.getEntity().isSearchable()) {
					continue;
				}
				const matchResult = this.matchItem(item, queryWords);
				if (matchResult) {
					matchResults.push(matchResult);
					limit--;
				} else if (matchAll && item.getEntity().getDynamicSearchMatchMode() === 'all') {
					matchResults.push(new MatchResult(item, []));
					limit--;
				}
			}
			return matchResults;
		}
		static matchItem(item, queryWords) {
			let matches = [];
			for (const queryWord of queryWords) {
				const results = this.matchWord(item, queryWord);
				if (results.length === 0) {
					return null;
				}
				matches = matches.concat(results);
			}
			if (matches.length > 0) {
				return new MatchResult(item, matches);
			} else {
				return null;
			}
		}
		static matchWord(item, queryWord) {
			const searchIndexes = item.getSearchIndex().getIndexes();
			const matches = [];
			for (const fieldIndex of searchIndexes) {
				const indexes = fieldIndex.getIndexes();
				for (const index of indexes) {
					const word = index.getWord().substring(0, queryWord.length);
					if (collator.compare(queryWord, word) === 0) {
						matches.push(new MatchIndex(fieldIndex.getField(), queryWord, index.getStartIndex()));
					}
				}
				if (matches.length > 0) {
					break;
				}
			}
			return matches;
		}
	}

	class SearchQuery {
		queryWords = [];
		query = '';
		cacheable = true;
		dynamicSearchEntities = [];
		resultLimit = 100;
		constructor(query) {
			this.query = query.trim().replaceAll(/\s\s+/g, ' ');
			this.queryWords = main_core.Type.isStringFilled(this.query) ? this.query.split(' ') : [];
		}
		getQueryWords() {
			return this.queryWords;
		}
		getQuery() {
			return this.query;
		}
		isEmpty() {
			return this.getQueryWords().length === 0;
		}
		setCacheable(flag) {
			if (main_core.Type.isBoolean(flag)) {
				this.cacheable = flag;
			}
		}
		isCacheable() {
			return this.cacheable;
		}
		setResultLimit(limit) {
			if (main_core.Type.isNumber(limit) && limit >= 0) {
				this.resultLimit = limit;
			}
		}
		getResultLimit() {
			return this.resultLimit;
		}
		hasDynamicSearch() {
			return this.getDynamicSearchEntities().length > 0;
		}
		hasDynamicSearchEntity(entityId) {
			return this.getDynamicSearchEntities().includes(entityId);
		}
		setDynamicSearchEntities(entities) {
			if (main_core.Type.isArrayFilled(entities)) {
				for (const entityId of entities) {
					if (main_core.Type.isStringFilled(entityId) && !this.hasDynamicSearchEntity(entityId)) {
						this.dynamicSearchEntities.push(entityId);
					}
				}
			}
			return this.dynamicSearchEntities;
		}
		getDynamicSearchEntities() {
			return this.dynamicSearchEntities;
		}
		getAjaxJson() {
			return this.toJSON();
		}
		toJSON() {
			return {
				queryWords: this.getQueryWords(),
				query: this.getQuery(),
				dynamicSearchEntities: this.getDynamicSearchEntities()
			};
		}
	}

	class SearchLoader {
		tab;
		loader = null;
		cache = new main_core_cache.MemoryCache();
		constructor(tab) {
			this.tab = tab;
		}
		getTab() {
			return this.tab;
		}
		getLoader() {
			if (this.loader === null) {
				this.loader = new main_loader.Loader({
					target: this.getIconContainer(),
					size: 32
				});
			}
			return this.loader;
		}
		getContainer() {
			return this.cache.remember('container', () => {
				return main_core.Tag.render`
				<div class="ui-selector-search-loader">
					${this.getBoxContainer()}
					${this.getSpacerContainer()}
				</div>
			`;
			});
		}
		getBoxContainer() {
			return this.cache.remember('box-container', () => {
				return main_core.Tag.render`
				<div class="ui-selector-search-loader-box">
					${this.getIconContainer()}
					${this.getTextContainer()}
				</div>
			`;
			});
		}
		getIconContainer() {
			return this.cache.remember('icon', () => {
				return main_core.Tag.render`<div class="ui-selector-search-loader-icon"></div>`;
			});
		}
		getTextContainer() {
			return this.cache.remember('text', () => {
				return main_core.Tag.render`
				<div class="ui-selector-search-loader-text">${main_core.Loc.getMessage('UI_SELECTOR_SEARCH_LOADER_TEXT')}</div>
			`;
			});
		}
		getSpacerContainer() {
			return this.cache.remember('spacer', () => {
				return main_core.Tag.render`<div class="ui-selector-search-loader-spacer"></div>`;
			});
		}
		show() {
			if (!this.getContainer().parentNode) {
				main_core.Dom.append(this.getContainer(), this.getTab().getContainer());
			}
			void this.getLoader().show();
			main_core.Dom.attr(this.getTab().getContainer(), 'aria-busy', 'true');
			main_core.Dom.addClass(this.getContainer(), 'ui-selector-search-loader--show');
			requestAnimationFrame(() => {
				main_core.Dom.addClass(this.getContainer(), 'ui-selector-search-loader--animate');
			});
		}
		hide() {
			if (this.loader === null) {
				return;
			}
			main_core.Dom.attr(this.getTab().getContainer(), 'aria-busy', 'false');
			main_core.Dom.removeClass(this.getContainer(), ['ui-selector-search-loader--show', 'ui-selector-search-loader--animate']);
			void this.getLoader().hide();
		}
		isShown() {
			return this.loader !== null && this.loader.isShown();
		}
	}

	class SearchResultsAnnouncer {
		#delay;
		#timerId = null;
		#pendingMessage = null;
		constructor(delay = 500) {
			this.#delay = delay;
		}
		announce(message) {
			this.#pendingMessage = message;
			if (this.#timerId !== null) {
				clearTimeout(this.#timerId);
			}
			this.#timerId = setTimeout(() => {
				this.#flush();
			}, this.#delay);
		}
		cancel() {
			if (this.#timerId !== null) {
				clearTimeout(this.#timerId);
				this.#timerId = null;
			}
			this.#pendingMessage = null;
		}
		#flush() {
			this.#timerId = null;
			const message = this.#pendingMessage;
			this.#pendingMessage = null;
			if (message !== null) {
				ui_a11y.LiveAnnouncer.announce(message);
			}
		}
	}

	class SearchTabFooter extends BaseFooter {
		loader = null;
		constructor(tab, options) {
			super(tab, options);
			this.getDialog().subscribe('onSearch', this.handleOnSearch.bind(this));
			const tagSelector = this.getDialog().getTagSelector();
			if (tagSelector) {
				tagSelector.subscribe('onMetaEnter', this.handleMetaEnter.bind(this));
			}
		}
		render() {
			return main_core.Tag.render`
			<button type="button" tabindex="0" class="ui-selector-search-footer" onclick="${this.handleClick.bind(this)}">
				<span class="ui-selector-search-footer-box">
					${this.getLabelContainer()}
					${this.getQueryContainer()}
					${this.getLoaderContainer()}
				</span>
				<span class="ui-selector-search-footer-cmd">${main_core.Browser.isMac() ? '&#8984;+Enter' : 'Ctrl+Enter'}</span>
			</button>
		`;
		}
		getLoader() {
			if (this.loader === null) {
				this.loader = new main_loader.Loader({
					target: this.getLoaderContainer(),
					size: 17,
					color: 'rgba(82, 92, 105, 0.9)'
				});
			}
			return this.loader;
		}
		showLoader() {
			void this.getLoader().show();
		}
		hideLoader() {
			void this.getLoader().hide();
		}
		setLabel(label) {
			if (main_core.Type.isString(label)) {
				this.getLabelContainer().textContent = label;
			}
		}
		getLabelContainer() {
			return this.cache.remember('label', () => {
				return main_core.Tag.render`
				<span class="ui-selector-search-footer-label">${this.getOption('label', main_core.Loc.getMessage('UI_SELECTOR_CREATE_ITEM_LABEL'))}</span>
			`;
			});
		}
		getQueryContainer() {
			return this.cache.remember('name-container', () => {
				return main_core.Tag.render`
				<span class="ui-selector-search-footer-query"></span>
			`;
			});
		}
		getLoaderContainer() {
			return this.cache.remember('loader', () => {
				return main_core.Tag.render`
				<span class="ui-selector-search-footer-loader"></span>
			`;
			});
		}
		createItem() {
			const tagSelector = this.getDialog().getTagSelector();
			if (tagSelector && tagSelector.isLocked()) {
				return;
			}
			const finalize = () => {
				this.hideLoader();
				if (this.getDialog().getTagSelector()) {
					this.getDialog().getTagSelector().unlock();
					this.getDialog().focusSearch();
				}
			};
			this.showLoader();
			if (tagSelector) {
				tagSelector.lock();
			}
			this.getDialog().emitAsync('Search:onItemCreateAsync', {
				searchQuery: this.getTab().getLastSearchQuery()
			}).then(() => {
				this.getTab().clearResults();
				this.getDialog().clearSearch();
				if (this.getDialog().getActiveTab() === this.getTab()) {
					this.getDialog().selectFirstTab();
				}
				finalize();
			}).catch(() => {
				finalize();
			});
		}
		handleClick() {
			this.createItem();
		}
		handleMetaEnter(event) {
			const keyboardEvent = event.getData().event;
			keyboardEvent.stopPropagation();
			if (this.getDialog().getActiveTab() !== this.getTab()) {
				return;
			}
			this.handleClick();
		}
		handleOnSearch(event) {
			const {
				query
			} = event.getData();
			this.getQueryContainer().textContent = query;
		}
	}

	class SearchTab extends Tab {
		lastSearchQuery = null;
		queryCache = new Set();
		queryXhr = null;
		searchLoader = new SearchLoader(this);
		allowCreateItem = false;
		loadWithDebounce;
		resultsAnnouncer = new SearchResultsAnnouncer();
		constructor(dialog, tabOptions, searchOptions) {
			const defaults = {
				title: main_core.Loc.getMessage('UI_SELECTOR_SEARCH_TAB_TITLE') ?? '',
				visible: false,
				stub: true,
				stubOptions: {
					autoShow: false,
					title: main_core.Loc.getMessage('UI_SELECTOR_SEARCH_STUB_TITLE'),
					subtitle: main_core.Loc.getMessage('UI_SELECTOR_SEARCH_STUB_SUBTITLE_MSGVER_1')
				}
			};
			const options = {
				...defaults,
				...tabOptions
			};
			options.id = 'search';
			options.stubOptions.autoShow = false;
			super(dialog, options);
			searchOptions = main_core.Type.isPlainObject(searchOptions) ? searchOptions : {};
			this.setAllowCreateItem(searchOptions.allowCreateItem, searchOptions.footerOptions);
			this.loadWithDebounce = main_core.Runtime.debounce(() => {
				this.load(this.getLastSearchQuery());
			}, 500);
			dialog.subscribe('onHide', () => this.getResultsAnnouncer().cancel());
			dialog.subscribe('onDestroy', () => this.getResultsAnnouncer().cancel());
		}
		search(query) {
			const searchQuery = new SearchQuery(query);
			const dynamicEntities = this.getDynamicEntities(searchQuery);
			searchQuery.setDynamicSearchEntities(dynamicEntities);
			if (searchQuery.isEmpty()) {
				this.getSearchLoader().hide();
				return;
			}
			this.lastSearchQuery = searchQuery;
			const matchResults = SearchEngine.matchItems(this.getDialog().getItems(), searchQuery);
			this.clearResults();
			this.appendResults(matchResults);
			if (this.getDialog().shouldFocusOnFirst()) {
				this.getDialog().focusOnFirstNode();
			}
			if (this.shouldLoad(searchQuery)) {
				this.loadWithDebounce();
				if (!this.isEmptyResult()) {
					this.getStub().hide();
				}
			} else if (!this.getSearchLoader().isShown()) {
				this.toggleEmptyResult();
				this.#announceResultsCount();
			}
		}
		#announceResultsCount() {
			const count = this.getRootNode().getChildren().count();
			const message = main_core.Loc.getMessage('UI_SELECTOR_SEARCH_RESULTS_COUNT', {
				'#COUNT#': String(count)
			});
			if (main_core.Type.isStringFilled(message)) {
				this.getResultsAnnouncer().announce(message);
			}
		}
		getResultsAnnouncer() {
			return this.resultsAnnouncer;
		}
		getLastSearchQuery() {
			return this.lastSearchQuery;
		}
		setAllowCreateItem(flag, options) {
			if (main_core.Type.isBoolean(flag)) {
				this.allowCreateItem = flag;
				if (flag) {
					this.setFooter(SearchTabFooter, options);
				} else {
					this.setFooter(null);
				}
			}
		}
		canCreateItem() {
			return this.allowCreateItem;
		}
		appendResults(matchResults) {
			matchResults.sort((a, b) => {
				const matchSortA = a.getSort();
				const matchSortB = b.getSort();
				if (matchSortA !== null && matchSortB !== null && matchSortA !== matchSortB) {
					return matchSortA - matchSortB;
				}
				if (matchSortA !== null && matchSortB === null) {
					return -1;
				}
				if (matchSortA === null && matchSortB !== null) {
					return 1;
				}
				const contextSortA = a.getItem().getContextSort();
				const contextSortB = b.getItem().getContextSort();
				if (contextSortA !== null && contextSortB === null) {
					return -1;
				}
				if (contextSortA === null && contextSortB !== null) {
					return 1;
				}
				if (contextSortA !== null && contextSortB !== null) {
					return contextSortB - contextSortA;
				}
				const globalSortA = a.getItem().getGlobalSort();
				const globalSortB = b.getItem().getGlobalSort();
				if (globalSortA !== null && globalSortB === null) {
					return -1;
				}
				if (globalSortA === null && globalSortB !== null) {
					return 1;
				}
				if (globalSortA !== null && globalSortB !== null) {
					return globalSortB - globalSortA;
				}
				return 0;
			});
			this.getRootNode().disableRender();
			matchResults.forEach(matchResult => {
				const item = matchResult.getItem();
				if (!this.getRootNode().hasItem(item)) {
					const node = this.getRootNode().addItem(item);
					node.setHighlights([...matchResult.getMatchFields().values()]);
				}
			});
			this.getRootNode().enableRender();
			this.getRootNode().render(true);
		}
		getDynamicEntities(searchQuery) {
			const result = [];
			this.getDialog().getEntities().forEach(entity => {
				if (entity.isSearchable()) {
					const hasCacheLimit = entity.getSearchCacheLimits().some(pattern => {
						return pattern.test(searchQuery.getQuery());
					});
					if (hasCacheLimit) {
						result.push(entity.getId());
					}
				}
			});
			return result;
		}
		isQueryCacheable(searchQuery) {
			return searchQuery.isCacheable() && !searchQuery.hasDynamicSearch();
		}
		isQueryLoaded(searchQuery) {
			let found = false;
			this.queryCache.forEach(query => {
				if (!found && searchQuery.getQuery().startsWith(query)) {
					found = true;
				}
			});
			return found;
		}
		addCacheQuery(searchQuery) {
			if (this.isQueryCacheable(searchQuery)) {
				this.queryCache.add(searchQuery.getQuery());
			}
		}
		removeCacheQuery(searchQuery) {
			this.queryCache.delete(searchQuery.getQuery());
		}
		shouldLoad(searchQuery) {
			if (!this.isQueryCacheable(searchQuery)) {
				return true;
			}
			if (!this.getDialog().hasDynamicSearch()) {
				return false;
			}
			return !this.isQueryLoaded(searchQuery);
		}
		load(searchQuery) {
			if (!this.shouldLoad(searchQuery)) {
				return;
			}
			this.addCacheQuery(searchQuery);
			this.getStub()?.hide();
			this.getSearchLoader().show();
			main_core.ajax.runAction('ui.entityselector.doSearch', {
				json: {
					dialog: this.getDialog().getAjaxJson(),
					searchQuery: searchQuery.getAjaxJson()
				},
				onrequeststart: xhr => {
					this.queryXhr = xhr;
				},
				getParameters: {
					context: this.getDialog().getContext()
				}
			}).then(response => {
				this.getSearchLoader().hide();
				if (!response || !response.data || !response.data.dialog || !response.data.dialog.items) {
					this.removeCacheQuery(searchQuery);
					this.toggleEmptyResult();
					this.#announceResultsCount();
					this.getDialog().emit('SearchTab:onLoad', {
						searchTab: this
					});
					return;
				}
				if (response.data.searchQuery && response.data.searchQuery.cacheable === false) {
					this.removeCacheQuery(searchQuery);
					if (this.getLastSearchQuery()?.getQuery() !== searchQuery.getQuery()) {
						this.loadWithDebounce();
					}
				}
				if (main_core.Type.isArrayFilled(response.data.dialog.items)) {
					const items = new Set();
					response.data.dialog.items.forEach(itemOptions => {
						delete itemOptions.tabs;
						delete itemOptions.children;
						const item = this.getDialog().addItem(itemOptions);
						items.add(item);
					});
					const isTabEmpty = this.isEmptyResult();
					const matchResults = SearchEngine.matchItems([...items.values()], this.getLastSearchQuery(), {
						matchAll: true
					});
					this.appendResults(matchResults);
					if (isTabEmpty && this.getDialog().shouldFocusOnFirst()) {
						this.getDialog().focusOnFirstNode();
					}
				}
				if (main_core.Type.isArrayFilled(response.data.dialog.errors)) {
					this.getDialog().emitEntityErrors(response.data.dialog.errors);
				}
				this.toggleEmptyResult();
				this.#announceResultsCount();
				this.getDialog().emit('SearchTab:onLoad', {
					searchTab: this
				});
			}).catch(error => {
				this.removeCacheQuery(searchQuery);
				this.getSearchLoader().hide();
				this.toggleEmptyResult();
				this.#announceResultsCount();
				console.error(error);
			});
		}
		getSearchLoader() {
			return this.searchLoader;
		}
		clearResults() {
			this.getRootNode().removeChildren();
		}
		isEmptyResult() {
			return !this.getRootNode().hasChildren();
		}
		toggleEmptyResult() {
			if (this.isEmptyResult()) {
				this.getStub()?.show();
			} else {
				this.getStub()?.hide();
			}
		}
	}

	function _callSuper(t, o, e) { return o = babelHelpers.getPrototypeOf(o), babelHelpers.possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, [], babelHelpers.getPrototypeOf(t).constructor) : o.apply(t, e)); }
	function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function () { return !!t; })(); }
	function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
	function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
	function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
	class LoadState {
		static UNSENT = 'UNSENT';
		static LOADING = 'LOADING';
		static DONE = 'DONE';
	}
	class TagSelectorMode {
		static INSIDE = 'INSIDE';
		static OUTSIDE = 'OUTSIDE';
	}
	const instances = new Map();
	var _Dialog_brand = new WeakSet();
	let Dialog = function (_EventEmitter) {
		function Dialog(dialogOptions) {
			var _this;
			babelHelpers.classCallCheck(this, Dialog);
			_this = _callSuper(this, Dialog);
			_classPrivateMethodInitSpec(_this, _Dialog_brand);
			babelHelpers.defineProperty(_this, "id", void 0);
			babelHelpers.defineProperty(_this, "items", new Map());
			babelHelpers.defineProperty(_this, "tabs", new Map());
			babelHelpers.defineProperty(_this, "entities", new Map());
			babelHelpers.defineProperty(_this, "targetNode", null);
			babelHelpers.defineProperty(_this, "popup", null);
			babelHelpers.defineProperty(_this, "cache", new main_core_cache.MemoryCache());
			babelHelpers.defineProperty(_this, "multiple", true);
			babelHelpers.defineProperty(_this, "hideOnSelect", null);
			babelHelpers.defineProperty(_this, "hideOnDeselect", null);
			babelHelpers.defineProperty(_this, "addTagOnSelect", null);
			babelHelpers.defineProperty(_this, "clearSearchOnSelect", true);
			babelHelpers.defineProperty(_this, "context", null);
			babelHelpers.defineProperty(_this, "selectedItems", new Set());
			babelHelpers.defineProperty(_this, "preselectedItems", []);
			babelHelpers.defineProperty(_this, "undeselectedItems", []);
			babelHelpers.defineProperty(_this, "dropdownMode", false);
			babelHelpers.defineProperty(_this, "frozen", false);
			babelHelpers.defineProperty(_this, "frozenProps", {});
			babelHelpers.defineProperty(_this, "hideByEsc", true);
			babelHelpers.defineProperty(_this, "autoHide", true);
			babelHelpers.defineProperty(_this, "autoHideHandler", null);
			babelHelpers.defineProperty(_this, "offsetTop", 5);
			babelHelpers.defineProperty(_this, "offsetLeft", 0);
			babelHelpers.defineProperty(_this, "cacheable", true);
			babelHelpers.defineProperty(_this, "width", 565);
			babelHelpers.defineProperty(_this, "height", 420);
			babelHelpers.defineProperty(_this, "maxLabelWidth", 160);
			babelHelpers.defineProperty(_this, "minLabelWidth", 38);
			babelHelpers.defineProperty(_this, "alwaysShowLabels", false);
			babelHelpers.defineProperty(_this, "showAvatars", true);
			babelHelpers.defineProperty(_this, "compactView", false);
			babelHelpers.defineProperty(_this, "activeTab", null);
			babelHelpers.defineProperty(_this, "recentTab", void 0);
			babelHelpers.defineProperty(_this, "searchTab", void 0);
			babelHelpers.defineProperty(_this, "rendered", false);
			babelHelpers.defineProperty(_this, "loadState", LoadState.UNSENT);
			babelHelpers.defineProperty(_this, "loader", null);
			babelHelpers.defineProperty(_this, "ariaLabel", null);
			babelHelpers.defineProperty(_this, "tagSelector", null);
			babelHelpers.defineProperty(_this, "tagSelectorMode", null);
			babelHelpers.defineProperty(_this, "tagSelectorHeight", null);
			babelHelpers.defineProperty(_this, "saveRecentItemsWithDebounce", main_core.Runtime.debounce(_this.saveRecentItems, 2000, _this));
			babelHelpers.defineProperty(_this, "recentItemsToSave", []);
			babelHelpers.defineProperty(_this, "recentItemsLimit", null);
			babelHelpers.defineProperty(_this, "navigation", void 0);
			babelHelpers.defineProperty(_this, "header", null);
			babelHelpers.defineProperty(_this, "footer", null);
			babelHelpers.defineProperty(_this, "popupOptions", {});
			babelHelpers.defineProperty(_this, "focusOnFirst", true);
			babelHelpers.defineProperty(_this, "focusedNode", null);
			babelHelpers.defineProperty(_this, "clearUnavailableItems", false);
			babelHelpers.defineProperty(_this, "overlappingObserver", null);
			babelHelpers.defineProperty(_this, "offsetAnimation", true);
			babelHelpers.defineProperty(_this, "customData", Object.create(null));
			babelHelpers.defineProperty(_this, "destroyed", false);
			_this.setEventNamespace('BX.UI.EntitySelector.Dialog');
			const options = main_core.Type.isPlainObject(dialogOptions) ? dialogOptions : {};
			_this.id = main_core.Type.isStringFilled(options.id) ? options.id : `ui-selector-${main_core.Text.getRandom().toLowerCase()}`;
			_this.multiple = main_core.Type.isBoolean(options.multiple) ? options.multiple : true;
			_this.context = main_core.Type.isStringFilled(options.context) ? options.context : null;
			_this.clearUnavailableItems = options.clearUnavailableItems === true;
			_this.compactView = options.compactView === true;
			_this.dropdownMode = main_core.Type.isBoolean(options.dropdownMode) ? options.dropdownMode : false;
			_this.alwaysShowLabels = main_core.Type.isBoolean(options.alwaysShowLabels) ? options.alwaysShowLabels : false;
			_this.ariaLabel = main_core.Type.isStringFilled(options.ariaLabel) ? options.ariaLabel : null;
			if (main_core.Type.isArray(options.entities)) {
				for (const entity of options.entities) {
					_this.addEntity(entity);
				}
			}
			if (options.tagSelector instanceof TagSelector) {
				_this.tagSelectorMode = TagSelectorMode.OUTSIDE;
				_this.setTagSelector(options.tagSelector);
			} else if (options.enableSearch === true) {
				const defaultOptions = {
					placeholder: main_core.Loc.getMessage('UI_TAG_SELECTOR_SEARCH_PLACEHOLDER'),
					maxHeight: 102,
					textBoxWidth: 105
				};
				const customOptions = main_core.Type.isPlainObject(options.tagSelectorOptions) ? options.tagSelectorOptions : {};
				const mandatoryOptions = {
					dialogOptions: null,
					showTextBox: true,
					showAddButton: false,
					showCreateButton: false,
					multiple: _this.isMultiple()
				};
				const tagSelectorOptions = Object.assign(defaultOptions, customOptions, mandatoryOptions);
				const tagSelector = new TagSelector(tagSelectorOptions);
				_this.tagSelectorMode = TagSelectorMode.INSIDE;
				_this.setTagSelector(tagSelector);
			}
			_this.setTargetNode(options.targetNode);
			_this.setHideOnSelect(options.hideOnSelect);
			_this.setHideOnDeselect(options.hideOnDeselect);
			_this.setAddTagOnSelect(options.addTagOnSelect);
			_this.setClearSearchOnSelect(options.clearSearchOnSelect);
			_this.setWidth(options.width);
			void _this.setHeight(options.height);
			_this.setAutoHide(options.autoHide);
			_this.setAutoHideHandler(options.autoHideHandler);
			_this.setHideByEsc(options.hideByEsc);
			_this.setOffsetLeft(options.offsetLeft);
			_this.setOffsetTop(options.offsetTop);
			_this.setCacheable(options.cacheable);
			_this.setFocusOnFirst(options.focusOnFirst);
			_this.setShowAvatars(options.showAvatars);
			_this.setRecentItemsLimit(options.recentItemsLimit);
			_this.setOffsetAnimation(options.offsetAnimation);
			_this.recentTab = new RecentTab(_this, options.recentTabOptions);
			_this.searchTab = new SearchTab(_this, options.searchTabOptions, options.searchOptions);
			_this.addTab(_this.recentTab);
			_this.addTab(_this.searchTab);
			_this.setPreselectedItems(options.preselectedItems);
			_this.setUndeselectedItems(options.undeselectedItems);
			_this.setOptions(options);
			const preload = options.preload === true || _this.getPreselectedItems().length > 0;
			if (preload) {
				_this.load();
			}
			if (main_core.Type.isPlainObject(options.popupOptions)) {
				const allowedOptions = new Set(['overlay', 'bindOptions', 'targetContainer', 'zIndexOptions', 'events', 'animation', 'className', 'focusTrap', 'ariaLabel', 'ariaLabelledBy', 'role']);
				const sourcePopupOptions = options.popupOptions;
				const popupOptions = {};
				for (const option of Object.keys(sourcePopupOptions)) {
					if (allowedOptions.has(option)) {
						popupOptions[option] = sourcePopupOptions[option];
					}
				}
				_this.popupOptions = popupOptions;
			}
			_this.navigation = new Navigation(_this);
			new SliderIntegration(_this);
			_this.subscribe('ItemNode:onFocus', _this.handleItemNodeFocus.bind(_this));
			_this.subscribe('ItemNode:onUnfocus', _this.handleItemNodeUnfocus.bind(_this));
			_this.subscribeFromOptions(options.events ?? {});
			instances.set(_this.id, _this);
			return _this;
		}
		babelHelpers.inherits(Dialog, _EventEmitter);
		return babelHelpers.createClass(Dialog, [{
			key: "show",
			value: function show() {
				this.load();
				this.getPopup().show();
			}
		}, {
			key: "hide",
			value: function hide() {
				this.getPopup().close();
			}
		}, {
			key: "destroy",
			value: function destroy() {
				if (this.destroyed) {
					return;
				}
				this.destroyed = true;
				this.emit('onDestroy');
				this.disconnectTabOverlapping();
				instances.delete(this.getId());
				if (this.isRendered()) {
					this.getPopup().destroy();
				}
				for (const property in this) {
					if (this.hasOwnProperty(property)) {
						delete this[property];
					}
				}
				Object.setPrototypeOf(this, null);
				this.destroyed = true;
			}
		}, {
			key: "isOpen",
			value: function isOpen() {
				return this.popup !== null && this.popup.isShown();
			}
		}, {
			key: "adjustPosition",
			value: function adjustPosition() {
				if (this.isRendered()) {
					this.getPopup().adjustPosition();
				}
			}
		}, {
			key: "search",
			value: function search(queryString) {
				const query = main_core.Type.isStringFilled(queryString) ? queryString.trim() : '';
				const event = new main_core_events.BaseEvent({
					data: {
						query
					}
				});
				this.emit('onBeforeSearch', event);
				if (event.isDefaultPrevented()) {
					return;
				}
				if (!main_core.Type.isStringFilled(query)) {
					this.selectFirstTab();
					if (this.getSearchTab()) {
						this.getSearchTab().clearResults();
					}
				} else if (this.getSearchTab()) {
					this.selectTab(this.getSearchTab().getId());
					this.getSearchTab().search(query);
				}
				this.emit('onSearch', {
					query
				});
			}
		}, {
			key: "addItem",
			value: function addItem(options) {
				if (!main_core.Type.isPlainObject(options)) {
					throw new TypeError('EntitySelector.addItem: wrong item options.');
				}
				let item = this.getItem(options);
				if (!item) {
					item = new Item(options);
					const undeselectable = this.getUndeselectedItems().some(itemId => {
						return itemId[0] === item.getEntityId() && String(itemId[1]) === String(item.getId());
					});
					if (undeselectable) {
						item.setDeselectable(false);
					}
					item.setDialog(this);
					const entity = this.getEntity(item.getEntityId());
					if (entity === null) {
						this.addEntity({
							id: item.getEntityId()
						});
					}
					let entityItems = this.items.get(item.getEntityId());
					if (!entityItems) {
						entityItems = new Map();
						this.items.set(item.getEntityId(), entityItems);
					}
					entityItems.set(String(item.getId()), item);
					if (item.isSelected()) {
						this.handleItemSelect(item);
					}
				}
				let tabs = [];
				if (main_core.Type.isArray(options.tabs)) {
					tabs = options.tabs;
				} else if (main_core.Type.isStringFilled(options.tabs)) {
					tabs = [options.tabs];
				}
				const children = main_core.Type.isArray(options.children) ? options.children : [];
				tabs.forEach(tabId => {
					const tab = this.getTab(tabId);
					if (tab) {
						const itemNode = tab.getRootNode().addItem(item, options.nodeOptions);
						itemNode.addChildren(children);
					}
				});
				return item;
			}
		}, {
			key: "removeItem",
			value: function removeItem(itemToRemove) {
				const item = this.getItem(itemToRemove);
				if (item) {
					this.handleItemDeselect(item);
					for (const node of item.getNodes()) {
						node.getParentNode().removeChild(node);
					}
					const entityItems = this.getEntityItemsInternal(item.getEntityId());
					if (entityItems) {
						entityItems.delete(String(item.getId()));
						if (entityItems.size === 0) {
							this.items.delete(item.getEntityId());
						}
					}
				}
				return item;
			}
		}, {
			key: "removeItems",
			value: function removeItems() {
				this.getItemsInternal().forEach(items => {
					items.forEach(item => {
						this.removeItem(item);
					});
				});
			}
		}, {
			key: "getItem",
			value: function getItem(item) {
				let id = null;
				let entityId = null;
				if (main_core.Type.isArray(item) && item.length === 2) {
					[entityId, id] = item;
				} else if (item instanceof Item) {
					id = item.getId();
					entityId = item.getEntityId();
				} else if (main_core.Type.isObjectLike(item)) {
					({
						id,
						entityId
					} = item);
				}
				const entityItems = this.getEntityItemsInternal(entityId);
				if (entityItems) {
					return entityItems.get(String(id)) || null;
				}
				return null;
			}
		}, {
			key: "getSelectedItems",
			value: function getSelectedItems() {
				return [...this.selectedItems];
			}
		}, {
			key: "getItems",
			value: function getItems() {
				const items = [];
				this.getItemsInternal().forEach(entityItems => {
					Array.prototype.push.apply(items, [...entityItems.values()]);
				});
				return items;
			}
		}, {
			key: "getItemsInternal",
			value: function getItemsInternal() {
				return this.items;
			}
		}, {
			key: "getEntityItems",
			value: function getEntityItems(entityId) {
				const items = this.getEntityItemsInternal(entityId);
				return items === null ? [] : [...items.values()];
			}
		}, {
			key: "getEntityItemsInternal",
			value: function getEntityItemsInternal(entityId) {
				return this.items.get(entityId) || null;
			}
		}, {
			key: "validateItemIds",
			value: function validateItemIds(itemIds) {
				if (!main_core.Type.isArrayFilled(itemIds)) {
					return [];
				}
				const result = [];
				for (const itemId of itemIds) {
					if (!main_core.Type.isArray(itemId) || itemId.length !== 2) {
						continue;
					}
					const [entityId, id] = itemId;
					if (main_core.Type.isStringFilled(entityId) && (main_core.Type.isStringFilled(id) || main_core.Type.isNumber(id))) {
						result.push(itemId);
					}
				}
				return result;
			}
		}, {
			key: "addTab",
			value: function addTab(newTab) {
				const tab = main_core.Type.isPlainObject(newTab) ? new Tab(this, newTab) : newTab;
				if (!(tab instanceof Tab)) {
					throw new TypeError('EntitySelector: a tab must be an instance of EntitySelector.Tab.');
				}
				if (this.getTab(tab.getId())) {
					console.error(`EntitySelector: the "${tab.getId()}" tab is already existed.`);
					return tab;
				}
				tab.setDialog(this);
				this.tabs.set(tab.getId(), tab);
				if (this.isRendered()) {
					this.insertTab(tab);
				}
				return tab;
			}
		}, {
			key: "getTabs",
			value: function getTabs() {
				return [...this.tabs.values()];
			}
		}, {
			key: "getTab",
			value: function getTab(id) {
				return this.tabs.get(id) || null;
			}
		}, {
			key: "getRecentTab",
			value: function getRecentTab() {
				return this.recentTab;
			}
		}, {
			key: "getSearchTab",
			value: function getSearchTab() {
				return this.searchTab;
			}
		}, {
			key: "selectTab",
			value: function selectTab(id) {
				const newActiveTab = this.getTab(id);
				if (!newActiveTab || newActiveTab === this.getActiveTab()) {
					return newActiveTab;
				}
				const currentActiveTab = this.getActiveTab();
				currentActiveTab?.deselect();
				this.activeTab = newActiveTab;
				newActiveTab.select();
				if (newActiveTab.isVisible()) {
					main_core.Dom.attr(newActiveTab.getLabelContainer(), 'tabindex', '0');
					if (currentActiveTab) {
						main_core.Dom.attr(currentActiveTab.getLabelContainer(), 'tabindex', '-1');
					}
				}
				if (!newActiveTab.isRendered()) {
					newActiveTab.render();
				}
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						if (this.destroyed) {
							return;
						}
						this.focusSearch();
					});
				});
				this.clearNodeFocus();
				if (this.shouldFocusOnFirst()) {
					this.focusOnFirstNode();
				}
				this.adjustHeader();
				this.adjustFooter();
				return newActiveTab;
			}
		}, {
			key: "insertTab",
			value: function insertTab(tab) {
				tab.renderLabel();
				tab.renderContainer();
				main_core.Dom.append(tab.getLabelContainer(), this.getLabelsContainer());
				main_core.Dom.append(tab.getContainer(), this.getTabContentsContainer());
				if (tab.getHeader()) {
					main_core.Dom.append(tab.getHeader().getContainer(), this.getHeaderContainer());
				}
				if (tab.getFooter()) {
					main_core.Dom.append(tab.getFooter().getContainer(), this.getFooterContainer());
				}
			}
		}, {
			key: "selectFirstTab",
			value: function selectFirstTab(onlyVisible = true) {
				const tabs = this.getTabs();
				for (const tab of tabs) {
					if (!onlyVisible || tab.isVisible()) {
						return this.selectTab(tab.getId());
					}
				}
				if (this.isDropdownMode()) {
					return this.selectTab(this.getRecentTab().getId());
				}
				return null;
			}
		}, {
			key: "selectLastTab",
			value: function selectLastTab(onlyVisible = true) {
				const tabs = this.getTabs();
				for (let i = tabs.length - 1; i >= 0; i--) {
					const tab = tabs[i];
					if (!onlyVisible || tab.isVisible()) {
						return this.selectTab(tab.getId());
					}
				}
				if (this.isDropdownMode()) {
					return this.selectTab(this.getRecentTab().getId());
				}
				return null;
			}
		}, {
			key: "getActiveTab",
			value: function getActiveTab() {
				return this.activeTab;
			}
		}, {
			key: "getNextTab",
			value: function getNextTab(onlyVisible = true) {
				let nextTab = null;
				let activeFound = false;
				const tabs = this.getTabs();
				for (const tab of tabs) {
					if (onlyVisible && !tab.isVisible()) {
						continue;
					}
					if (tab === this.getActiveTab()) {
						activeFound = true;
					} else if (activeFound) {
						nextTab = tab;
						break;
					}
				}
				return nextTab;
			}
		}, {
			key: "getPreviousTab",
			value: function getPreviousTab(onlyVisible = true) {
				let previousTab = null;
				let activeFound = false;
				const tabs = this.getTabs();
				for (let i = tabs.length - 1; i >= 0; i--) {
					const tab = tabs[i];
					if (onlyVisible && !tab.isVisible()) {
						continue;
					}
					if (tab === this.getActiveTab()) {
						activeFound = true;
					} else if (activeFound) {
						previousTab = tab;
						break;
					}
				}
				return previousTab;
			}
		}, {
			key: "removeTab",
			value: function removeTab(id) {
				const tab = this.getTab(id);
				if (!tab) {
					return;
				}
				tab.getRootNode().removeChildren();
				this.tabs.delete(id);
				main_core.Dom.remove(tab.getLabelContainer());
				main_core.Dom.remove(tab.getContainer());
				main_core.Dom.remove(tab.getHeader()?.getContainer());
				main_core.Dom.remove(tab.getFooter()?.getContainer());
				this.selectFirstTab();
			}
		}, {
			key: "addEntity",
			value: function addEntity(newEntity) {
				const entity = main_core.Type.isPlainObject(newEntity) ? new Entity(newEntity) : newEntity;
				if (!(entity instanceof Entity)) {
					throw new TypeError('EntitySelector: an entity must be an instance of EntitySelector.Entity.');
				}
				if (this.hasEntity(entity.getId())) {
					console.error(`EntitySelector: the "${entity.getId()}" entity is already existed.`);
					return entity;
				}
				this.entities.set(entity.getId(), entity);
				return entity;
			}
		}, {
			key: "getEntity",
			value: function getEntity(id) {
				return this.entities.get(id) || null;
			}
		}, {
			key: "hasEntity",
			value: function hasEntity(id) {
				return this.entities.has(id);
			}
		}, {
			key: "getEntities",
			value: function getEntities() {
				return [...this.entities.values()];
			}
		}, {
			key: "removeEntity",
			value: function removeEntity(id) {
				this.removeEntityItems(id);
				this.entities.delete(id);
			}
		}, {
			key: "removeEntityItems",
			value: function removeEntityItems(id) {
				const items = this.getEntityItemsInternal(id);
				if (items) {
					items.forEach(item => {
						this.removeItem(item);
					});
				}
			}
		}, {
			key: "getHeader",
			value: function getHeader() {
				return this.header;
			}
		}, {
			key: "getActiveHeader",
			value: function getActiveHeader() {
				const activeTab = this.getActiveTab();
				if (!activeTab) {
					return null;
				}
				if (activeTab.getHeader()) {
					return activeTab.getHeader();
				}
				return this.getHeader() && activeTab.canShowDefaultHeader() ? this.getHeader() : null;
			}
		}, {
			key: "adjustHeader",
			value: function adjustHeader() {
				if (!this.getActiveTab()) {
					return;
				}
				if (this.getActiveTab().getHeader()) {
					if (this.getHeader()) {
						this.getHeader().hide();
					}
					this.getActiveTab().getHeader().show();
				} else if (this.getHeader()) {
					if (this.getActiveTab().canShowDefaultHeader()) {
						this.getHeader().show();
					} else {
						this.getHeader().hide();
					}
				}
			}
		}, {
			key: "setHeader",
			value: function setHeader(headerContent, headerOptions) {
				let header = null;
				if (headerContent !== null) {
					header = Dialog.createHeader(this, headerContent, headerOptions);
					if (header === null) {
						return null;
					}
				}
				if (this.isRendered() && this.getHeader() !== null) {
					main_core.Dom.remove(this.getHeader()?.getContainer());
					this.adjustHeader();
				}
				this.header = header;
				if (this.isRendered()) {
					this.appendHeader(header);
					this.adjustHeader();
				}
				return header;
			}
		}, {
			key: "appendHeader",
			value: function appendHeader(header) {
				if (header instanceof BaseHeader) {
					main_core.Dom.append(header.getContainer(), this.getHeaderContainer());
				}
			}
		}, {
			key: "createHeader",
			value: function createHeader(context, headerContent, headerOptions) {
				return Dialog.createHeader(context, headerContent, headerOptions);
			}
		}, {
			key: "getFooter",
			value: function getFooter() {
				return this.footer;
			}
		}, {
			key: "getActiveFooter",
			value: function getActiveFooter() {
				const activeTab = this.getActiveTab();
				if (!activeTab) {
					return null;
				}
				if (activeTab.getFooter()) {
					return activeTab.getFooter();
				}
				return this.getFooter() && activeTab.canShowDefaultFooter() ? this.getFooter() : null;
			}
		}, {
			key: "adjustFooter",
			value: function adjustFooter() {
				const activeTab = this.getActiveTab();
				if (!activeTab) {
					return;
				}
				if (activeTab.getFooter()) {
					if (this.getFooter()) {
						this.getFooter().hide();
					}
					activeTab.getFooter().show();
				} else if (this.getFooter()) {
					if (activeTab.canShowDefaultFooter()) {
						this.getFooter().show();
					} else {
						this.getFooter().hide();
					}
				}
			}
		}, {
			key: "setFooter",
			value: function setFooter(footerContent, footerOptions) {
				let footer = null;
				if (footerContent !== null) {
					footer = Dialog.createFooter(this, footerContent, footerOptions);
					if (footer === null) {
						return null;
					}
				}
				if (this.isRendered() && this.getFooter() !== null) {
					main_core.Dom.remove(this.getFooter().getContainer());
					this.adjustFooter();
				}
				this.footer = footer;
				if (this.isRendered()) {
					this.appendFooter(footer);
					this.adjustFooter();
				}
				return footer;
			}
		}, {
			key: "appendFooter",
			value: function appendFooter(footer) {
				if (footer instanceof BaseFooter) {
					main_core.Dom.append(footer.getContainer(), this.getFooterContainer());
				}
			}
		}, {
			key: "createFooter",
			value: function createFooter(context, footerContent, footerOptions) {
				return Dialog.createFooter(context, footerContent, footerOptions);
			}
		}, {
			key: "getId",
			value: function getId() {
				return this.id;
			}
		}, {
			key: "getContext",
			value: function getContext() {
				return this.context;
			}
		}, {
			key: "getNavigation",
			value: function getNavigation() {
				return this.navigation;
			}
		}, {
			key: "deselectAll",
			value: function deselectAll() {
				this.getSelectedItems().forEach(item => {
					item.deselect();
				});
			}
		}, {
			key: "isMultiple",
			value: function isMultiple() {
				return this.multiple;
			}
		}, {
			key: "setTargetNode",
			value: function setTargetNode(node) {
				if (!main_core.Type.isDomNode(node) && !main_core.Type.isNull(node) && !main_core.Type.isObject(node)) {
					return;
				}
				this.targetNode = node;
				if (this.isRendered()) {
					this.getPopup().setBindElement(this.targetNode);
					this.getPopup().adjustPosition();
				}
			}
		}, {
			key: "getTargetNode",
			value: function getTargetNode() {
				if (this.targetNode === null && this.getTagSelectorMode() === TagSelectorMode.OUTSIDE) {
					return this.getTagSelector().getOuterContainer();
				}
				return this.targetNode;
			}
		}, {
			key: "setHideOnSelect",
			value: function setHideOnSelect(flag) {
				if (main_core.Type.isBoolean(flag)) {
					this.hideOnSelect = flag;
				}
			}
		}, {
			key: "shouldHideOnSelect",
			value: function shouldHideOnSelect() {
				if (this.hideOnSelect !== null) {
					return this.hideOnSelect;
				}
				return !this.isMultiple();
			}
		}, {
			key: "setHideOnDeselect",
			value: function setHideOnDeselect(flag) {
				if (main_core.Type.isBoolean(flag)) {
					this.hideOnDeselect = flag;
				}
			}
		}, {
			key: "shouldHideOnDeselect",
			value: function shouldHideOnDeselect() {
				if (this.hideOnDeselect !== null) {
					return this.hideOnDeselect;
				}
				return false;
			}
		}, {
			key: "setClearSearchOnSelect",
			value: function setClearSearchOnSelect(flag) {
				if (main_core.Type.isBoolean(flag)) {
					this.clearSearchOnSelect = flag;
				}
			}
		}, {
			key: "shouldClearSearchOnSelect",
			value: function shouldClearSearchOnSelect() {
				return this.clearSearchOnSelect;
			}
		}, {
			key: "setAddTagOnSelect",
			value: function setAddTagOnSelect(flag) {
				if (main_core.Type.isBoolean(flag)) {
					this.addTagOnSelect = flag;
				}
			}
		}, {
			key: "shouldAddTagOnSelect",
			value: function shouldAddTagOnSelect() {
				if (this.addTagOnSelect !== null) {
					return this.addTagOnSelect;
				}
				return this.isMultiple() || this.isTagSelectorOutside();
			}
		}, {
			key: "setShowAvatars",
			value: function setShowAvatars(flag) {
				if (main_core.Type.isBoolean(flag)) {
					this.showAvatars = flag;
					if (this.isRendered()) {
						this.getTabs().forEach(tab => {
							tab.renderContainer();
						});
					}
				}
			}
		}, {
			key: "shouldShowAvatars",
			value: function shouldShowAvatars() {
				return this.showAvatars;
			}
		}, {
			key: "setRecentItemsLimit",
			value: function setRecentItemsLimit(recentItemsLimit) {
				if (main_core.Type.isNumber(recentItemsLimit) && recentItemsLimit > 0) {
					this.recentItemsLimit = recentItemsLimit;
				}
			}
		}, {
			key: "getRecentItemsLimit",
			value: function getRecentItemsLimit() {
				return this.recentItemsLimit;
			}
		}, {
			key: "setOffsetAnimation",
			value: function setOffsetAnimation(flag) {
				if (main_core.Type.isBoolean(flag)) {
					this.offsetAnimation = flag;
					if (this.isRendered() && !this.offsetAnimation) {
						main_core.Dom.removeClass(this.getPopup().getPopupContainer(), 'ui-selector-popup-offset-animation');
					}
				}
			}
		}, {
			key: "isCompactView",
			value: function isCompactView() {
				return this.compactView;
			}
		}, {
			key: "setAutoHide",
			value: function setAutoHide(enable) {
				if (main_core.Type.isBoolean(enable)) {
					this.autoHide = enable;
					if (this.isRendered()) {
						this.getPopup().setAutoHide(enable);
					}
				}
			}
		}, {
			key: "isAutoHide",
			value: function isAutoHide() {
				return this.autoHide;
			}
		}, {
			key: "setAutoHideHandler",
			value: function setAutoHideHandler(handler) {
				if (main_core.Type.isFunction(handler) || handler === null) {
					this.autoHideHandler = handler;
				}
			}
		}, {
			key: "setHideByEsc",
			value: function setHideByEsc(enable) {
				if (main_core.Type.isBoolean(enable)) {
					this.hideByEsc = enable;
					if (this.isRendered()) {
						this.getPopup().setClosingByEsc(enable);
					}
				}
			}
		}, {
			key: "shouldHideByEsc",
			value: function shouldHideByEsc() {
				return this.hideByEsc;
			}
		}, {
			key: "getWidth",
			value: function getWidth() {
				return this.width;
			}
		}, {
			key: "setWidth",
			value: function setWidth(width) {
				if (main_core.Type.isNumber(width) && width > 0) {
					this.width = width;
					if (this.isRendered()) {
						main_core.Dom.style(this.getContainer(), 'width', `${width}px`);
					}
				}
			}
		}, {
			key: "getHeight",
			value: function getHeight() {
				return this.height;
			}
		}, {
			key: "setHeight",
			value: function setHeight(height) {
				if (main_core.Type.isNumber(height) && height > 0) {
					this.height = height;
					if (this.isRendered()) {
						main_core.Dom.style(this.getContainer(), 'height', `${height}px`);
						return Animation.handleTransitionEnd(this.getContainer(), 'height');
					} else {
						return Promise.resolve();
					}
				}
				return Promise.resolve();
			}
		}, {
			key: "getOffsetLeft",
			value: function getOffsetLeft() {
				return this.offsetLeft;
			}
		}, {
			key: "setOffsetLeft",
			value: function setOffsetLeft(offset) {
				if (main_core.Type.isNumber(offset) && offset >= 0) {
					this.offsetLeft = offset;
					if (this.isRendered()) {
						this.getPopup().setOffset({
							offsetLeft: offset
						});
						this.adjustPosition();
					}
				}
			}
		}, {
			key: "getOffsetTop",
			value: function getOffsetTop() {
				return this.offsetTop;
			}
		}, {
			key: "setOffsetTop",
			value: function setOffsetTop(offset) {
				if (main_core.Type.isNumber(offset) && offset >= 0) {
					this.offsetTop = offset;
					if (this.isRendered()) {
						this.getPopup().setOffset({
							offsetTop: offset
						});
						this.adjustPosition();
					}
				}
			}
		}, {
			key: "getZindex",
			value: function getZindex() {
				return this.getPopup().getZindex();
			}
		}, {
			key: "isCacheable",
			value: function isCacheable() {
				return this.cacheable;
			}
		}, {
			key: "setCacheable",
			value: function setCacheable(cacheable) {
				if (main_core.Type.isBoolean(cacheable)) {
					this.cacheable = cacheable;
					if (this.isRendered()) {
						this.getPopup().setCacheable(cacheable);
					}
				}
			}
		}, {
			key: "shouldFocusOnFirst",
			value: function shouldFocusOnFirst() {
				return this.focusOnFirst;
			}
		}, {
			key: "setFocusOnFirst",
			value: function setFocusOnFirst(flag) {
				if (main_core.Type.isBoolean(flag)) {
					this.focusOnFirst = flag;
				}
			}
		}, {
			key: "focusOnFirstNode",
			value: function focusOnFirstNode() {
				if (this.getActiveTab()) {
					const itemNode = this.getActiveTab().getRootNode().getFirstChild();
					if (itemNode) {
						itemNode.focus(ui_a11y.FocusMonitor.Instance.getLastInputModality() === 'keyboard');
						return itemNode;
					}
				}
				return null;
			}
		}, {
			key: "getFocusedNode",
			value: function getFocusedNode() {
				return this.focusedNode;
			}
		}, {
			key: "clearNodeFocus",
			value: function clearNodeFocus() {
				if (this.focusedNode) {
					if (this.hasTagSelector()) {
						main_core.Dom.attr(this.getActiveDescendantControl(this.focusedNode), 'aria-activedescendant', null);
					}
					this.focusedNode.unfocus();
					this.focusedNode = null;
				}
			}
		}, {
			key: "getActiveDescendantControl",
			value: function getActiveDescendantControl(itemNode) {
				if (this.hasTagSelector()) {
					return this.getTagSelector()?.getTextBox() || null;
				}
				return itemNode.getTab().getListBoxContainer();
			}
		}, {
			key: "getFocusTrap",
			value: function getFocusTrap() {
				return this.getPopup().getFocusTrap();
			}
		}, {
			key: "isDropdownMode",
			value: function isDropdownMode() {
				return this.dropdownMode;
			}
		}, {
			key: "setPreselectedItems",
			value: function setPreselectedItems(itemIds) {
				this.preselectedItems = this.validateItemIds(itemIds);
			}
		}, {
			key: "getPreselectedItems",
			value: function getPreselectedItems() {
				return this.preselectedItems;
			}
		}, {
			key: "setUndeselectedItems",
			value: function setUndeselectedItems(itemIds) {
				this.undeselectedItems = this.validateItemIds(itemIds);
			}
		}, {
			key: "getUndeselectedItems",
			value: function getUndeselectedItems() {
				return this.undeselectedItems;
			}
		}, {
			key: "setCustomData",
			value: function setCustomData(property, value) {
				if (main_core.Type.isNull(property)) {
					this.customData = Object.create(null);
				} else if (main_core.Type.isPlainObject(property)) {
					Object.entries(property).forEach(item => {
						const [currentKey, currentValue] = item;
						this.setCustomData(currentKey, currentValue);
					});
				} else if (main_core.Type.isString(property)) {
					if (main_core.Type.isNull(value)) {
						delete this.customData[property];
					} else if (!main_core.Type.isUndefined(value)) {
						this.customData[property] = value;
					}
				}
			}
		}, {
			key: "getCustomData",
			value: function getCustomData(property) {
				if (main_core.Type.isUndefined(property)) {
					return this.customData;
				}
				if (main_core.Type.isStringFilled(property)) {
					return this.customData[property];
				}
				return undefined;
			}
		}, {
			key: "setOptions",
			value: function setOptions(dialogOptions) {
				const options = main_core.Type.isPlainObject(dialogOptions) ? dialogOptions : {};
				this.setCustomData(options.customData);
				if (main_core.Type.isArray(options.tabs)) {
					options.tabs.forEach(tab => {
						this.addTab(tab);
					});
				}
				if (main_core.Type.isArray(options.selectedItems)) {
					options.selectedItems.forEach(itemOptions => {
						const options = Object.assign({}, main_core.Type.isPlainObject(itemOptions) ? itemOptions : {});
						options.selected = true;
						this.addItem(options);
					});
				}
				if (main_core.Type.isArray(options.items)) {
					options.items.forEach(itemOptions => {
						this.addItem(itemOptions);
					});
				}
				this.setHeader(options.header, options.headerOptions);
				this.setFooter(options.footer, options.footerOptions);
			}
		}, {
			key: "getMaxLabelWidth",
			value: function getMaxLabelWidth() {
				return this.maxLabelWidth;
			}
		}, {
			key: "getMinLabelWidth",
			value: function getMinLabelWidth() {
				return this.minLabelWidth;
			}
		}, {
			key: "expandLabels",
			value: function expandLabels(animate = true) {
				const freeSpace = parseInt(this.getPopup().getPopupContainer().style.left, 10);
				if (freeSpace > this.getMinLabelWidth()) {
					main_core.Dom.removeClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-hide');
					if (animate) {
						main_core.Dom.addClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-show');
						main_core.Dom.style(this.getLabelsContainer(), 'max-width', `${Math.min(freeSpace, this.getMaxLabelWidth())}px`);
						Animation.handleTransitionEnd(this.getLabelsContainer(), 'max-width').then(() => {
							main_core.Dom.removeClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-show');
							main_core.Dom.addClass(this.getLabelsContainer(), 'ui-selector-tab-labels--active');
						}).catch(() => {
						});
					} else {
						main_core.Dom.style(this.getLabelsContainer(), 'max-width', `${Math.min(freeSpace, this.getMaxLabelWidth())}px`);
					}
				} else {
					main_core.Dom.addClass(this.getLabelsContainer(), 'ui-selector-tab-labels--active');
				}
			}
		}, {
			key: "collapseLabels",
			value: function collapseLabels(animate = true) {
				main_core.Dom.removeClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-show');
				main_core.Dom.removeClass(this.getLabelsContainer(), 'ui-selector-tab-labels--active');
				if (animate) {
					main_core.Dom.addClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-hide');
					Animation.handleTransitionEnd(this.getLabelsContainer(), 'max-width').then(() => {
						main_core.Dom.removeClass(this.getLabelsContainer(), 'ui-selector-tab-labels--animate-hide');
					}).catch(() => {
					});
				}
				main_core.Dom.style(this.getLabelsContainer(), 'max-width', null);
			}
		}, {
			key: "getTagSelector",
			value: function getTagSelector() {
				return this.tagSelector;
			}
		}, {
			key: "getTagSelectorMode",
			value: function getTagSelectorMode() {
				return this.tagSelectorMode;
			}
		}, {
			key: "isTagSelectorInside",
			value: function isTagSelectorInside() {
				return this.getTagSelector() !== null && this.getTagSelectorMode() === TagSelectorMode.INSIDE;
			}
		}, {
			key: "isTagSelectorOutside",
			value: function isTagSelectorOutside() {
				return this.getTagSelector() !== null && this.getTagSelectorMode() === TagSelectorMode.OUTSIDE;
			}
		}, {
			key: "hasTagSelector",
			value: function hasTagSelector() {
				return this.getTagSelector() !== null;
			}
		}, {
			key: "getTagSelectorQuery",
			value: function getTagSelectorQuery() {
				return this.getTagSelector() ? this.getTagSelector().getTextBoxValue() : '';
			}
		}, {
			key: "setTagSelector",
			value: function setTagSelector(tagSelector) {
				this.tagSelector = tagSelector;
				this.tagSelector.subscribe('onInput', main_core.Runtime.debounce(this.handleTagSelectorInput, 200, this));
				this.tagSelector.subscribe('onAddButtonClick', this.handleTagSelectorAddButtonClick.bind(this));
				this.tagSelector.subscribe('onTagRemove', this.handleTagSelectorTagRemove.bind(this));
				this.tagSelector.subscribe('onAfterTagRemove', this.handleTagSelectorAfterTagRemove.bind(this));
				this.tagSelector.subscribe('onAfterTagAdd', this.handleTagSelectorAfterTagAdd.bind(this));
				this.tagSelector.subscribe('onContainerClick', this.handleTagSelectorClick.bind(this));
				main_core.Dom.attr(this.tagSelector.getTextBox(), 'role', 'combobox');
				this.tagSelector.setDialog(this);
			}
		}, {
			key: "focusSearch",
			value: function focusSearch() {
				if (this.getTagSelector()) {
					if (this.getActiveTab() !== this.getSearchTab()) {
						this.getTagSelector().clearTextBox();
					}
					this.getTagSelector().focusTextBox();
				}
			}
		}, {
			key: "clearSearch",
			value: function clearSearch() {
				if (this.getTagSelector()) {
					this.getTagSelector().clearTextBox();
					if (this.getActiveTab() === this.getSearchTab()) {
						this.selectFirstTab();
					}
				}
			}
		}, {
			key: "getLoader",
			value: function getLoader() {
				if (this.loader === null) {
					this.loader = new main_loader.Loader({
						target: this.getTabsContainer(),
						size: 100
					});
				}
				return this.loader;
			}
		}, {
			key: "showLoader",
			value: function showLoader() {
				void this.getLoader().show();
				main_core.Dom.attr(this.getTabsContainer(), 'aria-busy', 'true');
			}
		}, {
			key: "hideLoader",
			value: function hideLoader() {
				if (this.loader !== null) {
					void this.getLoader().hide();
					main_core.Dom.attr(this.getTabsContainer(), 'aria-busy', 'false');
				}
			}
		}, {
			key: "destroyLoader",
			value: function destroyLoader() {
				if (this.loader !== null) {
					this.getLoader().destroy();
				}
				this.loader = null;
			}
		}, {
			key: "getPopup",
			value: function getPopup() {
				if (this.popup !== null) {
					return this.popup;
				}
				this.getTabs().forEach(tab => {
					this.insertTab(tab);
				});
				const popupOptions = {
					...this.popupOptions
				};
				const userEvents = popupOptions.events;
				delete popupOptions.events;
				this.popup = new main_popup.Popup({
					contentPadding: 0,
					padding: 0,
					offsetTop: this.getOffsetTop(),
					offsetLeft: this.getOffsetLeft(),
					animation: {
						showClassName: 'ui-selector-popup-animation-show',
						closeClassName: 'ui-selector-popup-animation-close',
						closeAnimationType: 'animation'
					},
					bindElement: this.getTargetNode(),
					bindOptions: {
						forceBindPosition: true
					},
					focusTrap: _assertClassBrand(_Dialog_brand, this, _getFocusTrapOptions).call(this),
					autoHide: this.isAutoHide(),
					autoHideHandler: this.handleAutoHide.bind(this),
					closeByEsc: this.shouldHideByEsc(),
					cacheable: this.isCacheable(),
					events: {
						onFirstShow: this.handlePopupFirstShow.bind(this),
						onShow: this.handlePopupShow.bind(this),
						onAfterShow: this.handlePopupAfterShow.bind(this),
						onAfterClose: this.handlePopupAfterClose.bind(this),
						onDestroy: this.handlePopupDestroy.bind(this)
					},
					content: this.getContainer(),
					ariaLabel: this.getAriaLabel(),
					...popupOptions
				});
				this.popup.subscribeFromOptions(userEvents ?? {});
				this.rendered = true;
				this.selectFirstTab();
				return this.popup;
			}
		}, {
			key: "getAriaLabel",
			value: function getAriaLabel() {
				if (this.ariaLabel !== null) {
					return this.ariaLabel;
				}
				const knownEntities = ['USER', 'PROJECT', 'DEPARTMENT'];
				const entityIds = [...new Set(this.getEntities().map(entity => entity.getId().toUpperCase())
				.filter(id => !id.startsWith('META-')))];
				if (entityIds.length > 0 && entityIds.every(id => knownEntities.includes(id))) {
					const phraseId = `UI_SELECTOR_DIALOG_ARIA_LABEL_${knownEntities.filter(id => entityIds.includes(id)).join('_')}`;
					const label = main_core.Loc.getMessage(phraseId);
					if (main_core.Type.isStringFilled(label)) {
						return label;
					}
				}
				return main_core.Loc.getMessage('UI_SELECTOR_DIALOG_ARIA_LABEL_DEFAULT') ?? '';
			}
		}, {
			key: "isRendered",
			value: function isRendered() {
				return this.rendered;
			}
		}, {
			key: "getContainer",
			value: function getContainer() {
				return this.cache.remember('container', () => {
					let searchContainer = '';
					if (this.getTagSelectorMode() === TagSelectorMode.INSIDE) {
						searchContainer = main_core.Tag.render`<div class="ui-selector-search"></div>`;
						this.getTagSelector().renderTo(searchContainer);
					}
					const className = this.isCompactView() ? ' ui-selector-dialog--compact-view' : '';
					return main_core.Tag.render`
				<div
					class="ui-selector-dialog${className}"
					data-testid="ui-selector-dialog"
					style="width:${this.getWidth()}px; height:${this.getHeight()}px;"
				>
					${this.getHeaderContainer()}
					${searchContainer}
					${this.getTabsContainer()}
					${this.getFooterContainer()}
				</div>
			`;
				});
			}
		}, {
			key: "getTabsContainer",
			value: function getTabsContainer() {
				return this.cache.remember('tabs-container', () => {
					return main_core.Tag.render`
				<div class="ui-selector-tabs">
					${this.getTabContentsContainer()}
					${this.getLabelsContainer()}
				</div>
			`;
				});
			}
		}, {
			key: "getTabContentsContainer",
			value: function getTabContentsContainer() {
				return this.cache.remember('tab-contents', () => {
					return main_core.Tag.render`<div class="ui-selector-tab-contents"></div>`;
				});
			}
		}, {
			key: "getLabelsContainer",
			value: function getLabelsContainer() {
				return this.cache.remember('labels-container', () => {
					return main_core.Tag.render`
				<div
					role="tablist"
					aria-orientation="vertical"
					class="ui-selector-tab-labels"
					onmouseenter="${this.alwaysShowLabels ? null : this.handleLabelsMouseEnter.bind(this)}"
					onmouseleave="${this.alwaysShowLabels ? null : this.handleLabelsMouseLeave.bind(this)}"
				></div>
			`;
				});
			}
		}, {
			key: "getHeaderContainer",
			value: function getHeaderContainer() {
				return this.cache.remember('header', () => {
					const header = this.getHeader() && this.getHeader().getContainer();
					return main_core.Tag.render`
				<div class="ui-selector-header-container">${header || ''}</div>
			`;
				});
			}
		}, {
			key: "getFooterContainer",
			value: function getFooterContainer() {
				return this.cache.remember('footer', () => {
					const footer = this.getFooter() && this.getFooter().getContainer();
					return main_core.Tag.render`
				<div class="ui-selector-footer-container">${footer || ''}</div>
			`;
				});
			}
		}, {
			key: "freeze",
			value: function freeze() {
				if (this.isFrozen()) {
					return;
				}
				this.frozenProps = {
					autoHide: this.isAutoHide(),
					hideByEsc: this.shouldHideByEsc()
				};
				this.setAutoHide(false);
				this.setHideByEsc(false);
				this.getNavigation().disable();
				main_core.Dom.addClass(this.getContainer(), 'ui-selector-dialog--freeze');
				this.frozen = true;
			}
		}, {
			key: "unfreeze",
			value: function unfreeze() {
				if (!this.isFrozen()) {
					return;
				}
				this.setAutoHide(this.frozenProps.autoHide !== false);
				this.setHideByEsc(this.frozenProps.hideByEsc !== false);
				this.getNavigation().enable();
				main_core.Dom.removeClass(this.getContainer(), 'ui-selector-dialog--freeze');
				this.frozen = false;
			}
		}, {
			key: "isFrozen",
			value: function isFrozen() {
				return this.frozen;
			}
		}, {
			key: "load",
			value: function load() {
				if (this.loadState !== LoadState.UNSENT || !this.hasDynamicLoad()) {
					return;
				}
				if (this.getTagSelector()) {
					this.getTagSelector().lock();
				}
				setTimeout(() => {
					if (this.destroyed) {
						return;
					}
					if (this.isLoading()) {
						this.showLoader();
					}
				}, 400);
				this.loadState = LoadState.LOADING;
				main_core.ajax.runAction('ui.entityselector.load', {
					json: {
						dialog: this.getAjaxJson()
					},
					getParameters: {
						context: this.getContext()
					}
				}).then(response => {
					if (this.destroyed) {
						return;
					}
					if (response && response.data && main_core.Type.isPlainObject(response.data.dialog)) {
						this.loadState = LoadState.DONE;
						const entities = main_core.Type.isArrayFilled(response.data.dialog.entities) ? response.data.dialog.entities : [];
						entities.forEach(entityOptions => {
							const entity = this.getEntity(entityOptions.id);
							if (entity) {
								entity.setDynamicSearch(entityOptions.dynamicSearch);
							}
						});
						this.setOptions(response.data.dialog);
						this.getPreselectedItems().forEach(preselectedItem => {
							const item = this.getItem(preselectedItem);
							if (item) {
								item.select(true);
							}
						});
						const recentItems = response.data.dialog.recentItems;
						if (main_core.Type.isArray(recentItems)) {
							const nodeOptionsMap = new Map();
							const itemsOptions = response.data.dialog.items;
							if (main_core.Type.isArray(itemsOptions)) {
								itemsOptions.forEach(itemOptions => {
									if (itemOptions.nodeOptions) {
										const item = this.getItem(itemOptions);
										if (item) {
											const nodeOptions = {
												...itemOptions.nodeOptions
											};
											delete nodeOptions.dynamic;
											delete nodeOptions.open;
											delete nodeOptions.itemOrder;
											nodeOptionsMap.set(item, nodeOptions);
										}
									}
								});
							}
							const items = recentItems.map(recentItem => {
								const item = this.getItem(recentItem);
								return [item, nodeOptionsMap.get(item)];
							});
							this.getRecentTab().getRootNode().addItems(items);
						}
						if (!this.getRecentTab().getRootNode().hasChildren() && this.getRecentTab().getStub()) {
							this.getRecentTab().getStub().show();
						}
						if (this.getTagSelector()) {
							this.getTagSelector().unlock();
						}
						if (this.isRendered()) {
							if (this.isDropdownMode() && this.getActiveTab() === this.getRecentTab()) {
								this.selectFirstTab();
							} else if (!this.getActiveTab()) {
								this.selectFirstTab();
							}
						}
						this.focusSearch();
						this.destroyLoader();
						if (this.shouldFocusOnFirst()) {
							this.focusOnFirstNode();
						}
						if (main_core.Type.isArrayFilled(response.data.dialog.errors)) {
							this.emitEntityErrors(response.data.dialog.errors);
						}
						this.emit('onLoad');
					}
				}).catch(error => {
					this.loadState = LoadState.UNSENT;
					if (this.getTagSelector()) {
						this.getTagSelector().unlock();
					}
					this.focusSearch();
					this.destroyLoader();
					this.emit('onLoadError', {
						error
					});
					console.error(error);
				});
			}
		}, {
			key: "isLoaded",
			value: function isLoaded() {
				return this.loadState === LoadState.DONE;
			}
		}, {
			key: "isLoading",
			value: function isLoading() {
				return this.loadState === LoadState.LOADING;
			}
		}, {
			key: "hasDynamicLoad",
			value: function hasDynamicLoad() {
				let hasDynamicLoad = false;
				this.entities.forEach(entity => {
					hasDynamicLoad = hasDynamicLoad || entity.hasDynamicLoad();
				});
				return hasDynamicLoad;
			}
		}, {
			key: "hasDynamicSearch",
			value: function hasDynamicSearch() {
				let hasDynamicSearch = false;
				this.entities.forEach(entity => {
					hasDynamicSearch = hasDynamicSearch || entity.isSearchable() && entity.hasDynamicSearch();
				});
				return hasDynamicSearch;
			}
		}, {
			key: "saveRecentItem",
			value: function saveRecentItem(item) {
				if (this.getContext() === null || !item.isSaveable()) {
					return;
				}
				this.recentItemsToSave.push(item);
				this.saveRecentItemsWithDebounce();
			}
		}, {
			key: "saveRecentItems",
			value: function saveRecentItems() {
				if (!main_core.Type.isArrayFilled(this.recentItemsToSave)) {
					return;
				}
				main_core.ajax.runAction('ui.entityselector.saveRecentItems', {
					json: {
						dialog: this.getAjaxJson(),
						recentItems: this.recentItemsToSave.map(item => item.getAjaxJson())
					},
					getParameters: {
						context: this.getContext()
					}
				}).then(response => {}).catch(error => {
					console.error(error);
				});
				this.recentItemsToSave = [];
			}
		}, {
			key: "shouldClearUnavailableItems",
			value: function shouldClearUnavailableItems() {
				return this.clearUnavailableItems;
			}
		}, {
			key: "handleTagSelectorInput",
			value: function handleTagSelectorInput() {
				if (this.getTagSelectorMode() === TagSelectorMode.OUTSIDE && !this.isOpen()) {
					this.show();
				}
				const query = this.getTagSelector().getTextBoxValue();
				this.search(query);
				this.adjustByTagSelector();
			}
		}, {
			key: "handleTagSelectorAddButtonClick",
			value: function handleTagSelectorAddButtonClick() {
				this.show();
			}
		}, {
			key: "handleTagSelectorTagRemove",
			value: function handleTagSelectorTagRemove(event) {
				const {
					tag
				} = event.getData();
				const item = this.getItem({
					id: tag.getId(),
					entityId: tag.getEntityId()
				});
				if (item) {
					item.deselect();
				}
				this.focusSearch();
			}
		}, {
			key: "handleTagSelectorAfterTagRemove",
			value: function handleTagSelectorAfterTagRemove() {
				this.adjustByTagSelector();
			}
		}, {
			key: "handleTagSelectorAfterTagAdd",
			value: function handleTagSelectorAfterTagAdd() {
				this.adjustByTagSelector();
			}
		}, {
			key: "adjustByTagSelector",
			value: function adjustByTagSelector() {
				if (this.getTagSelectorMode() === TagSelectorMode.OUTSIDE) {
					this.adjustPosition();
				} else if (this.getTagSelectorMode() === TagSelectorMode.INSIDE) {
					const newTagSelectorHeight = this.getTagSelector().calcHeight();
					if (newTagSelectorHeight > 0) {
						const offset = newTagSelectorHeight - (this.tagSelectorHeight || this.getTagSelector().getMinHeight());
						this.tagSelectorHeight = newTagSelectorHeight;
						if (offset !== 0) {
							const height = this.getHeight();
							this.setHeight(height + offset).then(() => {
								this.adjustPosition();
							}).catch(() => {
							});
						}
					}
				}
			}
		}, {
			key: "handleTagSelectorClick",
			value: function handleTagSelectorClick() {
				this.focusSearch();
			}
		}, {
			key: "handleItemSelect",
			value: function handleItemSelect(item, animate = true) {
				const shouldAnimate = this.isMultiple() ? animate : this.getSelectedItems().length === 0;
				if (!this.isMultiple()) {
					this.deselectAll();
					if (this.getSelectedItems().length > 0) {
						console.error('EntitySelector: some items are still selected.', this.getSelectedItems());
					}
				}
				if (this.getTagSelector() && this.shouldAddTagOnSelect()) {
					const tag = item.createTag();
					tag.animate = shouldAnimate;
					this.getTagSelector().addTag(tag);
				}
				this.selectedItems.add(item);
			}
		}, {
			key: "handleItemDeselect",
			value: function handleItemDeselect(item, animate = true) {
				const shouldAnimate = animate && this.isMultiple();
				this.selectedItems.delete(item);
				this.getTagSelector()?.removeTag({
					id: item.getId(),
					entityId: item.getEntityId()
				}, shouldAnimate);
			}
		}, {
			key: "handlePopupAfterShow",
			value: function handlePopupAfterShow() {
				this.focusSearch();
				this.adjustByTagSelector();
				this.emit('onShow');
			}
		}, {
			key: "handlePopupFirstShow",
			value: function handlePopupFirstShow() {
				this.emit('onFirstShow');
				this.observeTabOverlapping();
			}
		}, {
			key: "handlePopupShow",
			value: function handlePopupShow() {
				if (this.offsetAnimation) {
					requestAnimationFrame(() => {
						requestAnimationFrame(() => {
							if (this.destroyed) {
								return;
							}
							main_core.Dom.addClass(this.getPopup().getPopupContainer(), 'ui-selector-popup-offset-animation');
						});
					});
				}
				if (this.alwaysShowLabels) {
					setTimeout(() => {
						if (this.destroyed) {
							return;
						}
						this.expandLabels(false);
					}, 0);
				}
			}
		}, {
			key: "handleAutoHide",
			value: function handleAutoHide(event) {
				const target = event.target;
				const el = this.getPopup().getPopupContainer();
				if (target === el || el.contains(target)) {
					return false;
				}
				if (this.isTagSelectorOutside() && target === this.getTagSelector().getTextBox() && main_core.Type.isStringFilled(this.getTagSelector().getTextBoxValue())) {
					return false;
				}
				if (this.autoHideHandler !== null) {
					const result = this.autoHideHandler(event, this);
					if (main_core.Type.isBoolean(result)) {
						return result;
					}
				}
				return true;
			}
		}, {
			key: "observeTabOverlapping",
			value: function observeTabOverlapping() {
				this.disconnectTabOverlapping();
				this.overlappingObserver = new MutationObserver(() => {
					if (this.getLabelsContainer().offsetWidth > 0) {
						const left = parseInt(this.getPopup().getPopupContainer().style.left, 10);
						if (left < this.getMinLabelWidth()) {
							main_core.Dom.style(this.getPopup().getPopupContainer(), 'left', `${this.getMinLabelWidth()}px`);
							this.collapseLabels(false);
						} else if (this.alwaysShowLabels) {
							this.expandLabels(false);
						}
					}
				});
				this.overlappingObserver.observe(this.getPopup().getPopupContainer(), {
					attributes: true,
					attributeFilter: ['style']
				});
			}
		}, {
			key: "disconnectTabOverlapping",
			value: function disconnectTabOverlapping() {
				if (this.overlappingObserver) {
					this.overlappingObserver.disconnect();
				}
			}
		}, {
			key: "handlePopupAfterClose",
			value: function handlePopupAfterClose() {
				if (this.isTagSelectorOutside()) {
					if (this.getActiveTab() && this.getActiveTab() === this.getSearchTab()) {
						this.selectFirstTab();
					}
					this.getTagSelector().clearTextBox();
					this.getTagSelector().showAddButton();
					this.getTagSelector().hideTextBox();
					ui_a11y.FocusNavigator.focusTarget(this.getTagSelector().getAddButtonLink());
				}
				if (this.offsetAnimation) {
					main_core.Dom.removeClass(this.getPopup().getPopupContainer(), 'ui-selector-popup-offset-animation');
				}
				this.emit('onHide');
			}
		}, {
			key: "handlePopupDestroy",
			value: function handlePopupDestroy() {
				this.destroy();
			}
		}, {
			key: "handleLabelsMouseEnter",
			value: function handleLabelsMouseEnter() {
				this.expandLabels();
			}
		}, {
			key: "handleLabelsMouseLeave",
			value: function handleLabelsMouseLeave() {
				this.collapseLabels();
			}
		}, {
			key: "handleItemNodeFocus",
			value: function handleItemNodeFocus(event) {
				const {
					node
				} = event.getData();
				if (this.focusedNode === node) {
					return;
				}
				this.clearNodeFocus();
				this.focusedNode = node;
				if (this.hasTagSelector()) {
					main_core.Dom.attr(this.getActiveDescendantControl(node), 'aria-activedescendant', node.getId());
				}
			}
		}, {
			key: "handleItemNodeUnfocus",
			value: function handleItemNodeUnfocus() {
				this.clearNodeFocus();
			}
		}, {
			key: "getAjaxJson",
			value: function getAjaxJson() {
				return {
					id: this.getId(),
					context: this.getContext(),
					entities: this.getEntities(),
					preselectedItems: this.getPreselectedItems(),
					recentItemsLimit: this.getRecentItemsLimit(),
					clearUnavailableItems: this.shouldClearUnavailableItems()
				};
			}
		}, {
			key: "emitEntityErrors",
			value: function emitEntityErrors(errorOptions) {
				const errorCollection = EntityErrorCollection.create(errorOptions);
				this.emit('Entity:onError', {
					errors: [...errorCollection]
				});
				this.getEntities().forEach(entity => {
					const entityId = entity.getId();
					this.emit(`Entity:${entityId}:onError`, {
						errors: errorCollection.getByEntityId(entityId)
					});
				});
			}
		}], [{
			key: "getById",
			value: function getById(id) {
				return instances.get(id) || null;
			}
		}, {
			key: "getInstances",
			value: function getInstances() {
				return [...instances.values()];
			}
		}, {
			key: "createHeader",
			value: function createHeader(context, headerContent, headerOptions) {
				if (!main_core.Type.isStringFilled(headerContent) && !main_core.Type.isArrayFilled(headerContent) && !main_core.Type.isDomNode(headerContent) && !main_core.Type.isFunction(headerContent)) {
					return null;
				}
				let header = null;
				const options = main_core.Type.isPlainObject(headerOptions) ? headerOptions : {};
				if (main_core.Type.isFunction(headerContent) || main_core.Type.isString(headerContent)) {
					const className = main_core.Type.isString(headerContent) ? main_core.Reflection.getClass(headerContent) : headerContent;
					if (main_core.Type.isFunction(className)) {
						const HeaderClass = className;
						header = new HeaderClass(context, options);
						if (!(header instanceof BaseHeader)) {
							console.error('EntitySelector: header is not an instance of BaseHeader.');
							header = null;
						}
					}
				}
				if (headerContent !== null && !header) {
					header = new DefaultHeader(context, {
						...options,
						content: headerContent
					});
				}
				return header;
			}
		}, {
			key: "createFooter",
			value: function createFooter(context, footerContent, footerOptions) {
				if (!main_core.Type.isStringFilled(footerContent) && !main_core.Type.isArrayFilled(footerContent) && !main_core.Type.isDomNode(footerContent) && !main_core.Type.isFunction(footerContent)) {
					return null;
				}
				let footer = null;
				const options = main_core.Type.isPlainObject(footerOptions) ? footerOptions : {};
				if (main_core.Type.isFunction(footerContent) || main_core.Type.isString(footerContent)) {
					const className = main_core.Type.isString(footerContent) ? main_core.Reflection.getClass(footerContent) : footerContent;
					if (main_core.Type.isFunction(className)) {
						const FooterClass = className;
						footer = new FooterClass(context, options);
						if (!(footer instanceof BaseFooter)) {
							console.error('EntitySelector: footer is not an instance of BaseFooter.');
							footer = null;
						}
					}
				}
				if (footerContent !== null && !footer) {
					footer = new DefaultFooter(context, {
						...options,
						content: footerContent
					});
				}
				return footer;
			}
		}]);
	}(main_core_events.EventEmitter);
	function _getFocusTrapOptions() {
		if (this.isTagSelectorOutside()) {
			return {
				initialFocus: false,
				restoreFocus: false,
				startBoundary: this.getTagSelector().getTextBox(),
				endBoundary: this.getTagSelector().getTextBox()
			};
		}
		if (!this.hasTagSelector() && ui_a11y.InteractivityChecker.isTextInput(ui_a11y.FocusNavigator.getActiveElement())) {
			return false;
		}
		return true;
	}

	const EntitySelector = {
		Dialog,
		Item,
		Tab,
		Entity,
		TagSelector,
		TagItem,
		BaseHeader,
		DefaultHeader,
		BaseFooter,
		DefaultFooter,
		BaseStub,
		DefaultStub,
		EntityError
	};

	exports.BaseFooter = BaseFooter;
	exports.BaseHeader = BaseHeader;
	exports.BaseStub = BaseStub;
	exports.DefaultFooter = DefaultFooter;
	exports.DefaultHeader = DefaultHeader;
	exports.DefaultStub = DefaultStub;
	exports.Dialog = Dialog;
	exports.Entity = Entity;
	exports.EntityError = EntityError;
	exports.EntitySelector = EntitySelector;
	exports.Item = Item;
	exports.Tab = Tab;
	exports.TagItem = TagItem;
	exports.TagSelector = TagSelector;

})(this.BX.UI.EntitySelector = this.BX.UI.EntitySelector || {}, window, window, BX, BX.Cache, BX.Event, BX.Main, BX, BX.UI.Accessibility, BX.Collections, BX.UI.IconSet);
//# sourceMappingURL=entity-selector.bundle.js.map
