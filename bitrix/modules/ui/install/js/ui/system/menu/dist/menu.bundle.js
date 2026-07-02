/* eslint-disable */
this.BX = this.BX || {};
this.BX.UI = this.BX.UI || {};
(function (exports, main_core, main_popup, ui_iconSet_api_core, ui_iconSet_main, ui_buttons, ui_cnt) {
	'use strict';

	class Mouse {
		#needTo = new WeakSet();
		#needCount = 0;
		#delta = {
			top: 0,
			left: 0
		};
		#position = {
			top: 0,
			left: 0
		};
		need(needTo) {
			if (this.#needTo.has(needTo)) {
				return;
			}
			this.#needTo.add(needTo);
			this.#needCount++;
			main_core.Event.bind(window, 'mousemove', this.#update);
		}
		notNeed(needTo) {
			if (!this.#needTo.has(needTo)) {
				return;
			}
			this.#needTo.delete(needTo);
			this.#needCount--;
			if (this.#needCount === 0) {
				main_core.Event.unbind(window, 'mousemove', this.#update);
			}
		}
		getPosition() {
			return this.#position;
		}
		getDelta() {
			return this.#delta;
		}
		#update = event => {
			const position = {
				top: event.clientY + window.scrollY,
				left: event.clientX + window.scrollX
			};
			this.#delta = {
				top: position.top - this.#position.top,
				left: position.left - this.#position.left
			};
			this.#position = position;
		};
	}
	const mouse = new Mouse();

	const MenuItemDesign = Object.freeze({
		Default: 'default',
		Accent1: 'accent-1',
		Accent2: 'accent-2',
		Alert: 'alert',
		Copilot: 'copilot',
		Disabled: 'disabled',
		BitrixGPT: 'bitrix-gpt'
	});
	const MenuSectionDesign = Object.freeze({
		Default: 'default',
		Accent: 'accent'
	});
	const MenuRichHeaderDesign = Object.freeze({
		Default: 'default',
		Copilot: 'copilot'
	});

	class MenuItem {
		#options;
		#callbacks;
		#subMenu;
		#element;
		#showTimeout;
		#closeTimeout;
		#subMenuHovered;
		constructor(options, callbacks) {
			const defaultItemOptions = {
				closeOnSubItemClick: true
			};
			this.#options = {
				...defaultItemOptions,
				...options
			};
			this.#callbacks = callbacks;
		}
		getOptions() {
			return this.#options;
		}
		getSubMenu() {
			return this.#subMenu;
		}
		render() {
			if (this.#element) {
				return this.#element;
			}
			const uiButtonOptions = this.#options.uiButtonOptions;
			const isUiButton = Boolean(uiButtonOptions);
			const classNameIsUiButton = isUiButton ? ' --is-ui-button' : '';
			const classNameDesign = this.#options.design ? ` --${this.#options.design}` : '';
			this.#element = main_core.Tag.render`
			<div class="ui-popup-menu-item${classNameIsUiButton}${classNameDesign}">
				${isUiButton ? new ui_buttons.Button(uiButtonOptions).render() : main_core.Tag.render`
						<button
							class="ui-popup-menu-item-action"
							title="${main_core.Text.encode(this.#options.title)}"
							onclick="${this.#options.onClick}"
							onmouseenter="${this.#onMouseEnter}"
							onmouseleave="${this.#onMouseLeave}"
						>${this.#renderHeader()}${this.#renderButtons()}</button>
					`}
			</div>
		`;
			return this.#element;
		}
		showSubMenu = () => {
			this.#subMenuHovered = false;
			this.#subMenu ??= new Menu({
				...this.#options.subMenu,
				targetContainer: this.#callbacks.getTargetContainer(),
				autoHide: false,
				items: this.#options.subMenu.items.map(itemOptions => {
					if (!itemOptions) {
						return null;
					}
					return {
						...itemOptions,
						onClick: () => this.#onSubMenuItemClick(itemOptions)
					};
				}),
				offsetLeft: this.#element.offsetWidth,
				offsetTop: -this.#element.offsetHeight,
				bindOptions: {
					forceBindPosition: true,
					forceTop: true,
					forceLeft: true
				},
				events: {
					onFirstShow: this.#onFirstShow,
					onShow: this.#onShow,
					onClose: this.#onClose,
					onDestroy: this.#onClose
				}
			});
			this.#subMenu.show(this.#element);
		};
		adjustSubMenu = () => {
			if (!this.#subMenu) {
				return;
			}
			let offsetLeft = this.#element.offsetWidth;
			let offsetTop = -this.#element.offsetHeight;
			this.#subMenu.getPopup().setOffset({
				offsetLeft,
				offsetTop
			});
			this.#subMenu.getPopup().adjustPosition();
			const targetContainer = this.#callbacks.getTargetContainer();
			const targetIsBody = targetContainer === document.body;
			const targetRect = {
				...targetContainer.getBoundingClientRect().toJSON(),
				...(targetIsBody ? {
					top: 0
				} : null),
				...(targetIsBody ? {
					right: window.innerWidth
				} : null),
				...(targetIsBody ? {
					bottom: window.innerHeight
				} : null),
				...(targetIsBody ? {
					left: 0
				} : null)
			};
			let popupRect = this.#subMenu.getPopupContainer().getBoundingClientRect();
			if (popupRect.right >= targetRect.right) {
				offsetLeft = -popupRect.width;
			}
			if (popupRect.bottom >= targetRect.bottom) {
				offsetTop = -popupRect.height;
			}
			this.#subMenu.getPopup().setOffset({
				offsetLeft,
				offsetTop
			});
			this.#subMenu.getPopup().adjustPosition();
			popupRect = this.#subMenu.getPopupContainer().getBoundingClientRect();
			if (popupRect.left <= targetRect.left) {
				offsetLeft = this.#element.offsetWidth;
			}
			if (popupRect.top <= targetRect.top) {
				offsetTop = -this.#element.offsetHeight;
			}
			this.#subMenu.getPopup().setOffset({
				offsetLeft,
				offsetTop
			});
			this.#subMenu.getPopup().adjustPosition();
		};
		closeSubMenu = () => {
			clearTimeout(this.#showTimeout);
			this.#subMenu?.close();
		};
		closeSubMenuWithTimeout() {
			clearTimeout(this.#closeTimeout);
			this.#closeTimeout = setTimeout(this.closeSubMenu, 200);
		}
		destroy() {
			this.#subMenu?.destroy();
		}
		#onMouseEnter = () => {
			if (this.#options.design === MenuItemDesign.Disabled) {
				return;
			}
			this.#subMenuHovered = false;
			this.#callbacks.onMouseEnter?.();
			if (this.#options.subMenu) {
				clearTimeout(this.#closeTimeout);
				this.#showTimeout = setTimeout(this.showSubMenu, 200);
			}
		};
		#onMouseLeave = event => {
			clearTimeout(this.#showTimeout);
			const subMenuContainer = this.#subMenu?.getPopupContainer();
			if (!this.#subMenuHovered && subMenuContainer && !subMenuContainer.contains(event.relatedTarget)) {
				const subMenuLeft = subMenuContainer.getBoundingClientRect().left + window.scrollX;
				const distance = mouse.getPosition().left - subMenuLeft;
				const distanceDelta = Math.abs(distance) - Math.abs(distance + mouse.getDelta().left);
				if (distanceDelta <= 1) {
					this.closeSubMenu();
				} else {
					this.closeSubMenuWithTimeout();
				}
			}
		};
		#onSubMenuItemClick(item) {
			item.onClick?.();
			if (!item.subMenu && this.#options.closeOnSubItemClick) {
				this.#callbacks.onSubMenuItemClick?.();
			}
		}
		#onFirstShow = () => {
			main_core.Event.bind(this.#subMenu.getPopupContainer(), 'mouseenter', () => {
				clearTimeout(this.#closeTimeout);
				this.#subMenuHovered = true;
			});
		};
		#onShow = () => {
			this.adjustSubMenu();
			main_core.Dom.addClass(this.#element, '--hovered');
			mouse.need(this);
		};
		#onClose = () => {
			main_core.Dom.removeClass(this.#element, '--hovered');
			mouse.notNeed(this);
		};
		#renderHeader() {
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-header">
				${this.#renderTitle()}
				${this.#renderSubtitle()}
			</div>
		`;
		}
		#renderTitle() {
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-title">
				${this.#renderLock()}
				<div class="ui-popup-menu-item-title-text">${main_core.Text.encode(this.#options.title)}</div>
				${this.#renderBadgeText()}
			</div>
		`;
		}
		#renderLock() {
			if (!this.#options.isLocked) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-lock">
				<div class="ui-icon-set --${ui_iconSet_api_core.Outline.LOCK_L}"></div>
			</div>
		`;
		}
		#renderBadgeText() {
			if (!main_core.Type.isStringFilled(this.#options.badgeText?.title)) {
				return '';
			}
			const color = this.#options.badgeText.color;
			const style = color ? `--badge-color: ${color};` : '';
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-badge-text" style="${style}">
				${main_core.Text.encode(this.#options.badgeText.title)}
			</div>
		`;
		}
		#renderSubtitle() {
			if (!main_core.Type.isStringFilled(this.#options.subtitle)) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-subtitle">${main_core.Text.encode(this.#options.subtitle)}</div>
		`;
		}
		#renderButtons() {
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-buttons">
				${this.#renderCheck()}
				${this.#renderExtra()}
				${this.#renderCounter()}
				${this.#renderIcon()}
				${this.#renderArrow()}
			</div>
		`;
		}
		#renderCheck() {
			if (!main_core.Type.isBoolean(this.#options.isSelected)) {
				return '';
			}
			if (!this.#options.isSelected) {
				return main_core.Tag.render`
				<div class="ui-popup-menu-item-check"></div>
			`;
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-check">
				<div class="ui-icon-set --${ui_iconSet_api_core.Outline.CHECK_L}"></div>
			</div>
		`;
		}
		#renderExtra() {
			if (!this.#options.extraIcon) {
				return '';
			}
			const extra = main_core.Tag.render`
			<div class="ui-popup-menu-item-extra ${this.#options.extraIcon.isSelected ? '--selected' : ''}">
				<div class="ui-icon-set --${this.#options.extraIcon.icon}"></div>
			</div>
		`;
			main_core.Event.bind(extra, 'click', event => {
				this.#options.extraIcon.onClick();
				event.stopPropagation();
			}, true);
			return extra;
		}
		#renderCounter() {
			if (!this.#options.counter) {
				return '';
			}
			if (!this.#options.counter.value) {
				return main_core.Tag.render`
				<div class="ui-popup-menu-item-counter"></div>
			`;
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-counter">
				${new ui_cnt.Counter({
			color: ui_cnt.CounterColor.DANGER,
			...this.#options.counter
		}).render()}
			</div>
		`;
		}
		#renderIcon() {
			if (this.#options.icon) {
				return main_core.Tag.render`
				<div class="ui-popup-menu-item-icon">
					<div class="ui-icon-set --${this.#options.icon}"></div>
				</div>
			`;
			}
			if (this.#options.svg) {
				return main_core.Tag.render`
				<div class="ui-popup-menu-item-svg">
					${this.#options.svg}
				</div>
			`;
			}
			return '';
		}
		#renderArrow() {
			if (!this.#options.subMenu) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-item-arrow">
				<div class="ui-icon-set --${ui_iconSet_api_core.Outline.CHEVRON_RIGHT_L}"></div>
			</div>
		`;
		}
	}

	class Menu {
		#options;
		#items;
		#popup;
		#container;
		constructor(options) {
			const defaultOptions = {
				noAllPaddings: true,
				autoHide: true,
				closeByEsc: true,
				autoHideHandler: this.#shouldHide,
				closeOnItemClick: true
			};
			this.#options = {
				...defaultOptions,
				...options
			};
		}
		getOptions() {
			return this.#options;
		}
		getPopup() {
			return this.#popup;
		}
		getPopupContainer() {
			return this.#popup.getPopupContainer();
		}
		show(bindElement) {
			this.#items ??= this.#prepareItems(this.#options.items);
			this.#popup ??= new main_popup.Popup({
				...this.#options,
				content: this.#render(),
				events: {
					...this.#options.events,
					onClose: this.#onPopupClose,
					onDestroy: this.#onPopupDestroy,
					onBeforeAdjustPosition: this.#onBeforeAdjustPosition
				}
			});
			this.#popup.setBindElement(bindElement ?? this.#options.bindElement);
			this.#popup.show();
		}
		updateItems(itemsOptions) {
			const openedItem = this.#items?.find(item => item.getSubMenu()?.getPopup()?.isShown());
			this.#items?.forEach(item => item.destroy());
			this.#items = this.#prepareItems(itemsOptions);
			this.#render();
			if (openedItem && !openedItem?.getSubMenu().getOptions().closeOnItemClick) {
				this.#items.find(item => item.getOptions().id === openedItem.getOptions().id)?.showSubMenu();
			}
		}
		close() {
			this.#popup.close();
		}
		destroy() {
			this.#items?.forEach(item => item.destroy());
			this.#popup.destroy();
		}
		#shouldHide = event => {
			const notSelfClick = !this.getPopupContainer().contains(event.target);
			const notSubMenuClick = !this.#items.some(item => {
				return item.getSubMenu()?.getPopupContainer()?.contains(event.target);
			});
			return notSelfClick && notSubMenuClick;
		};
		#onPopupClose = () => {
			this.#items.forEach(item => item.closeSubMenu());
			this.#options.events?.onClose?.();
		};
		#onPopupDestroy = () => {
			this.#options.events?.onDestroy?.();
			this.destroy();
		};
		#onBeforeAdjustPosition = () => {
			this.#items.forEach(item => item.adjustSubMenu());
		};
		#prepareItems(itemsOptions) {
			const items = itemsOptions.map(itemOptions => {
				if (!itemOptions) {
					return null;
				}
				const item = new MenuItem({
					...itemOptions,
					onClick: () => this.#onItemClick(itemOptions)
				}, {
					getTargetContainer: () => this.getPopup().getTargetContainer(),
					onMouseEnter: () => items.filter(it => it !== item).forEach(it => it.closeSubMenuWithTimeout()),
					onSubMenuItemClick: this.#onSubMenuItemClick
				});
				return item;
			}).filter(it => it);
			return items;
		}
		#onItemClick = itemOptions => {
			itemOptions.onClick?.();
			if (!itemOptions.subMenu && this.#options.closeOnItemClick) {
				this.close();
			}
		};
		#onSubMenuItemClick = () => {
			if (this.#options.closeOnItemClick) {
				this.close();
			}
		};
		#render() {
			this.#container ??= main_core.Tag.render`
			<div class="ui-popup-menu-container"></div>
		`;
			const itemsContainer = main_core.Tag.render`
			<div class="ui-popup-menu-items">
				${this.#renderRichHeader()}
				${this.#renderItems()}
			</div>
		`;
			main_core.Dom.clean(this.#container);
			main_core.Dom.append(itemsContainer, this.#container);
			return this.#container;
		}
		#renderRichHeader() {
			if (!this.#options.richHeader) {
				return '';
			}
			const design = this.#options.richHeader.design ?? MenuRichHeaderDesign.Default;
			const richHeader = main_core.Tag.render`
			<div class="ui-popup-menu-rich-header --${design}">
				<div class="ui-popup-menu-rich-header-image">
					<div class="ui-icon-set --${this.#getRichHeaderIcon(design)}"></div>
				</div>
				<div class="ui-popup-menu-rich-header-header">
					${this.#renderRichHeaderSubtitle()}
					<div class="ui-popup-menu-rich-header-title">
						${this.#options.richHeader.title}
					</div>
				</div>
				<div class="ui-popup-menu-rich-header-buttons">
					${this.#renderRichHeaderIcon()}
				</div>
			</div>
		`;
			if (this.#options.richHeader.onClick) {
				main_core.Event.bind(richHeader, 'click', this.#options.richHeader.onClick);
			}
			return richHeader;
		}
		#getRichHeaderIcon(design) {
			return {
				[MenuRichHeaderDesign.Default]: ui_iconSet_api_core.Main.DIAMOND,
				[MenuRichHeaderDesign.Copilot]: ui_iconSet_api_core.Main.COPILOT_AI
			}[design] ?? ui_iconSet_api_core.Main.DIAMOND;
		}
		#renderRichHeaderSubtitle() {
			if (!this.#options.richHeader.subtitle) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-rich-header-subtitle">
				${this.#options.richHeader.subtitle}
			</div>
		`;
		}
		#renderRichHeaderIcon() {
			if (!this.#options.richHeader.icon) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-rich-header-icon">
				<div class="ui-icon-set --${this.#options.richHeader.icon}"></div>
			</div>
		`;
		}
		#renderItems() {
			const baseSection = 'base';
			const itemsBySection = this.#items.reduce((result, item) => {
				const sectionCode = item.getOptions().sectionCode ?? baseSection;
				const sectionItems = result[sectionCode] ?? [];
				return {
					...result,
					[sectionCode]: [...sectionItems, item]
				};
			}, {});
			return [...(itemsBySection[baseSection]?.map(item => item.render()) ?? []), ...(this.#options.sections?.flatMap((options, index) => {
				const items = itemsBySection[options.code];
				if (!items) {
					return null;
				}
				const isFirstSection = !itemsBySection[baseSection] && index === 0;
				const withoutTitle = !options.title;
				return [!(isFirstSection && withoutTitle) && this.#renderSection(options), ...(items.map(item => item.render()) ?? [])];
			}) ?? []).filter(it => it)];
		}
		#renderSection(options) {
			return main_core.Tag.render`
			<div class="ui-popup-menu-section --${options.design ?? MenuSectionDesign.Default}">
				${this.#renderSectionTitle(options.title)}
				<div class="ui-popup-menu-section-divider"></div>
			</div>
		`;
		}
		#renderSectionTitle(title) {
			if (!title) {
				return '';
			}
			return main_core.Tag.render`
			<div class="ui-popup-menu-section-title">${title}</div>
		`;
		}
	}

	exports.Menu = Menu;
	exports.MenuItemDesign = MenuItemDesign;
	exports.MenuRichHeaderDesign = MenuRichHeaderDesign;
	exports.MenuSectionDesign = MenuSectionDesign;

})(this.BX.UI.System = this.BX.UI.System || {}, BX, BX.Main, BX.UI.IconSet, window, BX.UI, BX.UI);
//# sourceMappingURL=menu.bundle.js.map
