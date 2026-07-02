/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_buttons) {
	'use strict';

	const TitleEditorEvents = {
		beforeStartEditing: 'beforeStartEditing',
		startEditing: 'startEditing',
		finishEditing: 'finishEditing'
	};
	class TitleEditor extends main_core.Event.EventEmitter {
		// #dataContainer: ?HTMLElement;
		#initialTitle;
		#defaultTitle;
		#toolbarNode;
		#titleNode;
		#inputNode;
		// #dataNode: ?HTMLElement;
		#editTitleButtonNode;
		#editTitleResultButtonsContainer;
		#titleIconButtonsContainer;
		#saveTitleButton;
		#cancelTitleEditButton;
		#isInit = false;
		constructor(options) {
			super(options);
			this.setEventNamespace('UI.Toolbar.TitleEditor');
			this.#init(options);
		}
		#init(params) {
			// if (!params.selector)
			// {
			// 	return;
			// }
			//
			// this.dataContainer = document.querySelector(params.selector);
			// if (!this.dataContainer)
			// {
			// 	return;
			// }
			//
			// Dom.style(this.dataContainer, 'display', 'none');

			this.#toolbarNode = document.getElementById('uiToolbarContainer');
			this.#titleNode = document.querySelector('.ui-wrap-title-name');
			this.#inputNode = document.querySelector('.ui-toolbar-edit-title-input');
			this.#editTitleButtonNode = document.querySelector('.ui-toolbar-edit-title-button');
			this.#editTitleResultButtonsContainer = document.getElementById('ui-toolbar-title-edit-result-buttons');
			this.#saveTitleButton = document.getElementById('ui-toolbar-save-title-button');
			this.#cancelTitleEditButton = document.getElementById('ui-toolbar-cancel-title-edit-button');
			this.#titleIconButtonsContainer = document.getElementById('ui-toolbar-title-item-box-buttons');
			this.#initialTitle = this.#titleNode.textContent;
			this.#defaultTitle = params.defaultTitle;

			// bind(this.dataNode, 'bxchange', this.onDataNodeChange.bind(this));
			main_core.bind(this.#editTitleButtonNode, 'click', this.startEdit.bind(this));
			main_core.bind(this.#inputNode, 'keyup', this.onKeyUp.bind(this));
			main_core.bind(this.#inputNode, 'blur', event => {
				if (event.relatedTarget === this.#cancelTitleEditButton) {
					this.cancelEdit();
					return;
				}
				this.finishEdit();
			});
			main_core.bind(this.#saveTitleButton, 'click', this.finishEdit.bind(this));
			main_core.bind(this.#cancelTitleEditButton, 'click', this.cancelEdit.bind(this));
			this.#isInit = true;
			if (!params.disabled) {
				this.enable();
			}
		}
		enable(isDisable = false) {
			if (!this.#isInit) {
				return;
			}
			this.changeDisplay(this.#editTitleButtonNode, isDisable === false);
			// this.titleNode.textContent = isDisable === false
			// 	? (this.dataNode.value ?? this.defaultTitle)
			// 	: this.initialTitle
			// ;

			this.#titleNode.textContent = this.#initialTitle;
		}
		disable() {
			this.enable(true);
		}

		// onDataNodeChange()
		// {
		// 	this.#titleNode.textContent = this.#dataNode.value;
		// }

		onKeyUp(event) {
			if (event.key === 'Enter') {
				this.finishEdit();
				event.preventDefault();
				return false;
			}
			return true;
		}
		startEdit() {
			// this.inputNode.value = this.dataNode.value || this.titleNode.textContent;

			const event = new main_core.Event.BaseEvent();
			this.emit(TitleEditorEvents.beforeStartEditing, event);
			if (event.isDefaultPrevented()) {
				return;
			}
			this.#inputNode.value = this.#titleNode.textContent;
			this.changeDisplay(this.#titleNode, false);
			this.changeDisplay(this.#editTitleButtonNode, false);
			this.changeDisplay(this.#inputNode, true);
			this.changeDisplay(this.#titleIconButtonsContainer, false);
			main_core.Dom.addClass(this.#editTitleResultButtonsContainer, '--show');
			main_core.Dom.addClass(this.#toolbarNode, '--title-editing');
			this.#inputNode.focus();
			this.emit(TitleEditorEvents.startEditing);
		}
		finishEdit() {
			// this.dataNode.value = this.inputNode.value;
			this.#titleNode.textContent = this.#inputNode.value;
			this.changeDisplay(this.#inputNode, false);
			this.changeDisplay(this.#editTitleButtonNode, true);
			this.changeDisplay(this.#titleNode, true);
			this.changeDisplay(this.#titleIconButtonsContainer, true);
			main_core.Dom.removeClass(this.#editTitleResultButtonsContainer, '--show');
			main_core.Dom.removeClass(this.#toolbarNode, '--title-editing');
			this.emit(TitleEditorEvents.finishEditing, {
				updatedTitle: this.#inputNode.value
			});
		}
		cancelEdit() {
			this.changeDisplay(this.#inputNode, false);
			this.changeDisplay(this.#editTitleButtonNode, true);
			this.changeDisplay(this.#titleNode, true);
			this.changeDisplay(this.#titleIconButtonsContainer, true);
			main_core.Dom.removeClass(this.#editTitleResultButtonsContainer, '--show');
			main_core.Dom.removeClass(this.#toolbarNode, '--title-editing');
		}
		changeDisplay(node, isShow) {
			const displayValue = isShow ? '' : 'none';
			main_core.Dom.style(node, 'display', displayValue);
			return displayValue;
		}
	}

	class ToolbarStar {
		constructor() {
			this.initialized = false;
			this.currentPageInMenu = false;
			this.starContNode = null;
			main_core.ready(() => this.init());
			main_core.Event.EventEmitter.subscribe('onFrameDataProcessed', () => {
				this.init();
			});
			// BX.addCustomEvent('onFrameDataProcessed', () => this.init());
		}
		init() {
			this.starContNode = document.getElementById('uiToolbarStar');
			if (!this.starContNode || this.initialized) {
				return false;
			}
			this.initialized = true;
			let currentFullPath = main_core.Dom.attr(this.starContNode, 'data-bx-url');
			if (!main_core.Type.isStringFilled(currentFullPath)) {
				currentFullPath = document.location.pathname + document.location.search;
			}
			currentFullPath = main_core.Uri.removeParam(currentFullPath, ['IFRAME', 'IFRAME_TYPE']);
			top.BX.addCustomEvent('BX.Bitrix24.LeftMenuClass:onSendMenuItemData', params => {
				this.processMenuItemData(params);
			});
			top.BX.addCustomEvent('BX.Bitrix24.LeftMenuClass:onStandardItemChangedSuccess', params => {
				this.onStandardItemChangedSuccess(params);
			});
			top.BX.onCustomEvent('UI.Toolbar:onRequestMenuItemData', [{
				currentFullPath,
				context: window
			}]);
			return true;
		}
		processMenuItemData(params) {
			if (params.context && params.context !== window) {
				return;
			}
			this.currentPageInMenu = params.currentPageInMenu;
			if (main_core.Type.isObjectLike(params.currentPageInMenu)) {
				main_core.Dom.addClass(this.starContNode, 'ui-toolbar-star-active');
			}
			this.#setLabel(main_core.Loc.getMessage(main_core.Dom.hasClass(this.starContNode, 'ui-toolbar-star-active') ? 'UI_TOOLBAR_DELETE_PAGE_FROM_LEFT_MENU' : 'UI_TOOLBAR_ADD_PAGE_TO_LEFT_MENU'));

			// default page
			if (main_core.Type.isDomNode(this.currentPageInMenu) && main_core.Dom.attr(this.currentPageInMenu, 'data-type') !== 'standard') {
				this.#setLabel(main_core.Loc.getMessage('UI_TOOLBAR_STAR_TITLE_DEFAULT_PAGE'));
				main_core.bind(this.starContNode, 'click', () => {
					this.showMessage(main_core.Loc.getMessage('UI_TOOLBAR_STAR_TITLE_DEFAULT_PAGE_DELETE_ERROR'));
				});
				return true;
			}

			// any page
			main_core.bind(this.starContNode, 'click', () => {
				let pageTitle = document.getElementById('pagetitle')?.innerText || '';
				const titleTemplate = this.starContNode.getAttribute('data-bx-title-template');
				if (main_core.Type.isStringFilled(titleTemplate)) {
					pageTitle = titleTemplate.replace(/#page_title#/i, pageTitle);
				}
				let pageLink = this.starContNode.getAttribute('data-bx-url');
				if (!main_core.Type.isStringFilled(pageLink)) {
					pageLink = document.location.pathname + document.location.search;
				}
				pageLink = main_core.Uri.removeParam(pageLink, ['IFRAME', 'IFRAME_TYPE']);
				top.BX.onCustomEvent('UI.Toolbar:onStarClick', [{
					isActive: main_core.Dom.hasClass(this.starContNode, 'ui-toolbar-star-active'),
					context: window,
					pageTitle,
					pageLink
				}]);
			});
		}
		onStandardItemChangedSuccess(params) {
			if (!main_core.Type.isBoolean(params.isActive) || !this.starContNode || params.context && params.context !== window) {
				return;
			}
			if (params.isActive) {
				this.showMessage(main_core.Loc.getMessage('UI_TOOLBAR_ITEM_WAS_ADDED_TO_LEFT'));
				this.#setLabel(main_core.Loc.getMessage('UI_TOOLBAR_DELETE_PAGE_FROM_LEFT_MENU'));
				main_core.Dom.addClass(this.starContNode, 'ui-toolbar-star-active');
			} else {
				this.showMessage(main_core.Loc.getMessage('UI_TOOLBAR_ITEM_WAS_DELETED_FROM_LEFT'));
				this.#setLabel(main_core.Loc.getMessage('UI_TOOLBAR_ADD_PAGE_TO_LEFT_MENU'));
				main_core.Dom.removeClass(this.starContNode, 'ui-toolbar-star-active');
			}
		}
		#setLabel(text) {
			this.starContNode.title = text;
			main_core.Dom.attr(this.starContNode, 'aria-label', text);
		}
		showMessage(message) {
			let popup = main_popup.PopupWindowManager.create('left-menu-message', this.starContNode, {
				content: message,
				darkMode: true,
				offsetTop: 2,
				offsetLeft: 0,
				angle: true,
				autoHide: true,
				events: {
					onPopupClose: () => {
						if (popup) {
							popup.destroy();
							popup = null;
						}
					}
				}
			});
			popup.show();
			setTimeout(() => {
				if (popup) {
					popup.destroy();
					popup = null;
				}
			}, 3000);
		}
	}

	const ToolbarEvents = {
		beforeStartEditing: 'beforeStartEditing',
		startEditing: 'startEditing',
		finishEditing: 'finishEditing'
	};
	class Toolbar extends main_core.Event.EventEmitter {
		#copyLinkButton;
		#fullscreenButton;
		#titleEditor;
		static TitleEditor = TitleEditor;
		static Star = ToolbarStar;

		// eslint-disable-next-line sonarjs/cognitive-complexity
		constructor(options = {}) {
			super(options);
			this.setEventNamespace('BX.UI.Toolbar');
			this.titleMinWidth = main_core.Type.isNumber(options.titleMinWidth) ? options.titleMinWidth : 158;
			this.titleMaxWidth = main_core.Type.isNumber(options.titleMaxWidth) ? options.titleMaxWidth : '';
			this.filterMinWidth = main_core.Type.isNumber(options.filterMinWidth) ? options.filterMinWidth : 300;
			this.filterMaxWidth = main_core.Type.isNumber(options.filterMaxWidth) ? options.filterMaxWidth : 748;
			this.id = main_core.Type.isStringFilled(options.id) ? options.id : main_core.Text.getRandom();
			this.toolbarContainer = options.target;
			if (!main_core.Type.isDomNode(this.toolbarContainer)) {
				throw new Error('BX.UI.Toolbar: "target" parameter is required.');
			}
			this.titleContainer = this.toolbarContainer.querySelector('.ui-toolbar-title-box');
			this.filterContainer = this.toolbarContainer.querySelector('.ui-toolbar-filter-box');
			this.filterButtons = this.toolbarContainer.querySelector('.ui-toolbar-filter-buttons');
			this.rightButtons = this.toolbarContainer.querySelector('.ui-toolbar-right-buttons');
			this.afterTitleButtons = this.toolbarContainer.querySelector('.ui-toolbar-after-title-buttons');
			this.#copyLinkButton = this.toolbarContainer.querySelector('#ui-toolbar-copy-link-button');
			if (this.#copyLinkButton) {
				main_core.Event.bind(this.#copyLinkButton, 'click', this.#getClickOnCopyLinkButtonHandler());
			}
			this.#fullscreenButton = this.toolbarContainer.querySelector('#uiToolbarFullscreen');
			if (this.#fullscreenButton) {
				main_core.Event.bind(this.#fullscreenButton, 'click', this.#handleFullscreenToggle);
			}
			if (!this.filterContainer) {
				this.filterMinWidth = 0;
				this.filterMaxWidth = 0;
			}
			this.buttons = Object.create(null);
			this.buttonIds = main_core.Type.isArray(options.buttonIds) ? options.buttonIds : [];
			if (this.buttonIds.length > 0) {
				this.buttonIds.forEach(buttonId => {
					const button = ui_buttons.ButtonManager.createByUniqId(buttonId);
					if (button) {
						const container = button.getContainer();
						container.originalWidth = container.offsetWidth;
						if (!button.getIcon() && !main_core.Type.isStringFilled(button.getDataSet().toolbarCollapsedIcon)) {
							if (button.getColor() === ui_buttons.ButtonColor.PRIMARY) {
								button.setDataSet({
									toolbarCollapsedIcon: ui_buttons.ButtonIcon.ADD
								});
							} else {
								console.warn(`BX.UI.Toolbar: the button "${button.getText()}" doesn't have an icon for collapsed mode. ` + 'Use the "data-toolbar-collapsed-icon" attribute.');
							}
						}
						this.buttons[buttonId] = button;
					} else {
						console.warn(`BX.UI.Toolbar: the button "${buttonId}" wasn't initialized.`);
					}
				});
			}
			this.windowWidth = document.body.offsetWidth;
			this.reduceItemsWidth();
			main_core.bind(window, 'resize', () => {
				if (this.isWindowIncreased()) {
					this.increaseItemsWidth();
				} else {
					this.reduceItemsWidth();
				}
			});
			if (options.titleEditor?.active === true) {
				this.#titleEditor = this.#initTitleEditor(options.titleEditor);
			}
			BX.UI.Hint.init(this.getContainer());
		}
		getButtons() {
			return this.buttons;
		}
		getButton(id) {
			return id in this.buttons ? this.buttons[id] : null;
		}
		getId() {
			return this.id;
		}
		isWindowIncreased() {
			const previous = this.windowWidth;
			const current = document.body.offsetWidth;
			this.windowWidth = current;
			return current > previous;
		}
		getContainerSize() {
			return this.toolbarContainer.offsetWidth;
		}
		getInnerTotalWidth() {
			return this.toolbarContainer.scrollWidth;
		}
		reduceItemsWidth() {
			if (this.getInnerTotalWidth() <= this.getContainerSize()) {
				return;
			}
			const buttons = Object.values(this.getButtons()).reverse();
			for (const button of buttons) {
				if (!button.getIcon() && !main_core.Type.isStringFilled(button.getDataSet()?.toolbarCollapsedIcon)) {
					continue;
				}
				if (button.isCollapsed()) {
					continue;
				}
				button.setCollapsed(true);
				if (!button.getIcon()) {
					button.setIcon(button.getDataSet().toolbarCollapsedIcon);
				}
				if (this.getInnerTotalWidth() <= this.getContainerSize()) {
					return;
				}
			}
		}
		increaseItemsWidth() {
			const buttons = Object.values(this.getButtons());
			for (const button of buttons) {
				const item = button.getContainer();
				if (!button.isCollapsed()) {
					continue;
				}
				const newInnerWidth = this.titleMinWidth + this.filterMinWidth + (this.afterTitleButtons?.offsetWidth || 0) + (this.filterButtons?.offsetWidth || 0) + (this.rightButtons?.offsetWidth || 0) + (item.originalWidth - item.offsetWidth);
				if (newInnerWidth > this.getContainerSize()) {
					break;
				}
				button.setCollapsed(false);
				if (button.getIcon() === button.getDataSet().toolbarCollapsedIcon) {
					const icon = main_core.Type.isStringFilled(button.options.icon) ? button.options.icon : null;
					button.setIcon(icon);
				}
			}
		}
		setTitle(title) {
			if (!this.titleContainer) {
				return;
			}
			const pagetitle = this.titleContainer.querySelector('#pagetitle');
			if (pagetitle) {
				pagetitle.textContent = title;
			}
		}
		getContainer() {
			return this.toolbarContainer;
		}
		getRightButtonsContainer() {
			return this.rightButtons;
		}
		getTitleEditor() {
			return this.#titleEditor;
		}
		#handleFullscreenToggle = () => {
			const siteTemplate = main_core.Reflection.getClass('BX.Intranet.Bitrix24.Template');
			if (!siteTemplate) {
				return;
			}
			const willBeFullscreen = !siteTemplate.isFullscreen();
			siteTemplate.toggleFullscreen();
			main_core.Dom.attr(this.#fullscreenButton, 'aria-pressed', willBeFullscreen ? 'true' : 'false');
			main_core.Dom.toggleClass(this.#fullscreenButton, 'ui-toolbar-fullscreen-active', willBeFullscreen);
			BX.UI.Hint.hide(this.#fullscreenButton);
			main_core.unbindAll(this.#fullscreenButton, 'mouseenter');
			main_core.unbindAll(this.#fullscreenButton, 'mouseleave');
			this.#fullscreenButton.removeAttribute('data-hint-init');
			if (willBeFullscreen) {
				this.#fullscreenButton.removeAttribute('data-hint');
				return;
			}
			const hintText = main_core.Loc.getMessage('UI_TOOLBAR_FOCUS_MODE_HINT');
			if (main_core.Type.isStringFilled(hintText)) {
				main_core.Dom.attr(this.#fullscreenButton, 'data-hint', hintText);
				BX.UI.Hint.initNode(this.#fullscreenButton);
			}
		};
		#getClickOnCopyLinkButtonHandler() {
			let popup = null;
			return () => {
				if (popup !== null) {
					return;
				}
				const dataLink = main_core.Dom.attr(this.#copyLinkButton, 'data-link');
				const currentPageLink = window.location.href;
				let linkToCopy = main_core.Type.isStringFilled(dataLink) ? dataLink : currentPageLink;
				linkToCopy = main_core.Uri.removeParam(linkToCopy, ['IFRAME', 'IFRAME_TYPE']);
				const message = main_core.Dom.attr(this.#copyLinkButton, 'data-message');
				popup = new main_popup.Popup({
					bindElement: this.#copyLinkButton,
					angle: true,
					darkMode: true,
					content: message,
					autoHide: true,
					cacheable: false
				});
				popup.setOffset({
					offsetLeft: main_core.Dom.getPosition(this.#copyLinkButton).width / 2
				});
				popup.show();
				BX.clipboard.copy(linkToCopy);
				setTimeout(() => {
					popup = null;
				}, 1000);
			};
		}
		#initTitleEditor(options) {
			const titleEditorOptions = main_core.Type.isPlainObject(options) ? options : {};
			const titleEditor = new TitleEditor({
				...titleEditorOptions
			});
			titleEditor.subscribe(TitleEditorEvents.beforeStartEditing, editorEvent => {
				const toolbarEvent = new main_core.Event.BaseEvent();
				this.emit(TitleEditorEvents.beforeStartEditing, toolbarEvent);
				if (toolbarEvent.isDefaultPrevented()) {
					editorEvent.preventDefault();
				}
			});
			titleEditor.subscribe(TitleEditorEvents.startEditing, () => {
				this.emit(TitleEditorEvents.startEditing);
			});
			titleEditor.subscribe(TitleEditorEvents.finishEditing, event => {
				const updatedTitle = event.getData().updatedTitle;
				this.emit(TitleEditorEvents.finishEditing, {
					updatedTitle
				});
			});
			return titleEditor;
		}
	}

	class Manager {
		constructor() {
			this.toolbars = {};
		}
		create(options) {
			const toolbar = new Toolbar(options);
			if (this.get(toolbar.getId())) {
				throw new Error("The toolbar instance with the same 'id' already exists.");
			}
			this.toolbars[toolbar.getId()] = toolbar;
			return toolbar;
		}
		getDefaultToolbar() {
			return this.get('default-toolbar');
		}
		get(id) {
			return id in this.toolbars ? this.toolbars[id] : null;
		}
	}
	const ToolbarManager = new Manager();

	exports.Toolbar = Toolbar;
	exports.ToolbarEvents = ToolbarEvents;
	exports.ToolbarManager = ToolbarManager;
	exports.ToolbarStar = ToolbarStar;

})(this.BX.UI = this.BX.UI || {}, BX, BX.Main, BX.UI);
//# sourceMappingURL=ui.toolbar.bundle.js.map
