/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_core_events) {
	'use strict';

	class Item {
		#count = 0;
		#nameOriginal = '';
		#name = '';
		#counterElement;
		#itemElement;
		#container;
		#isActive;
		#isExpanded = true;
		#path;
		#shiftWidthInPixels = 20;
		#maxNestingLevel = 6;
		#zeroLevelShiftWidth = 29;
		#childrenContainer;
		#toggleButton;
		#childItems = [];
		#menu;
		getContainer() {
			return this.#container;
		}
		getItemElement() {
			return this.#itemElement;
		}
		setCount(number) {
			this.#count = number;
			this.#counterElement.textContent = number;
			if (number === 0) {
				main_core.Dom.addClass(this.#counterElement, 'ui-sidepanel-menu-link-text-counter-hidden');
			} else {
				main_core.Dom.removeClass(this.#counterElement, 'ui-sidepanel-menu-link-text-counter-hidden');
			}
		}
		getCount() {
			return Number(this.#count);
		}
		disableActivity() {
			this.#isActive = false;
			main_core.Dom.removeClass(this.#itemElement, 'mail-menu-directory-item--active');
		}
		getPath() {
			return this.#path;
		}
		enableActivity() {
			this.#isActive = true;
			main_core.Dom.addClass(this.#itemElement, 'mail-menu-directory-item--active');
		}
		isActive() {
			return this.#isActive;
		}
		collapse() {
			if (!this.#childrenContainer) {
				return;
			}
			this.#isExpanded = false;
			const container = this.#childrenContainer;
			main_core.Dom.style(container, 'maxHeight', `${container.scrollHeight}px`);
			requestAnimationFrame(() => {
				main_core.Dom.style(container, 'maxHeight', '0');
			});
			main_core.Dom.attr(this.#itemElement, 'aria-expanded', 'false');
			const icon = this.#toggleButton.querySelector('.mail-menu-directory-toggle-icon');
			main_core.Dom.removeClass(icon, '--chevron-down-l');
			main_core.Dom.addClass(icon, '--chevron-top-l');
			this.#setChildrenTabIndex('-1');
		}
		expand() {
			if (!this.#childrenContainer) {
				return;
			}
			this.#isExpanded = true;
			const container = this.#childrenContainer;
			main_core.Dom.style(container, 'maxHeight', 'none');
			const fullHeight = container.scrollHeight;
			main_core.Dom.style(container, 'maxHeight', '0');
			requestAnimationFrame(() => {
				main_core.Dom.style(container, 'maxHeight', `${fullHeight}px`);
				const onEnd = () => {
					main_core.Dom.style(container, 'maxHeight', '');
					main_core.Event.unbind(container, 'transitionend', onEnd);
				};
				main_core.Event.bind(container, 'transitionend', onEnd);
			});
			main_core.Dom.attr(this.#itemElement, 'aria-expanded', 'true');
			const icon = this.#toggleButton.querySelector('.mail-menu-directory-toggle-icon');
			main_core.Dom.removeClass(icon, '--chevron-top-l');
			main_core.Dom.addClass(icon, '--chevron-down-l');
			this.#setChildrenTabIndex('0');
		}
		#setChildrenTabIndex(value) {
			const items = this.#childrenContainer.querySelectorAll('li[tabindex]');
			items.forEach(item => {
				main_core.Dom.attr(item, 'tabindex', value);
			});
		}
		toggle() {
			if (!this.#childrenContainer) {
				return;
			}
			if (this.#isExpanded) {
				this.collapse();
			} else {
				this.expand();
			}
			this.#menu.onToggleFolder(this.#path, this.#isExpanded);
		}

		/**
		 * So as not to break the menu with incorrectly synchronized directories.
		 *
		 * @param directory (directory structure).
		 * @returns {boolean}
		 */
		static checkProperties(directory) {
			if (directory.path === undefined || directory.name === undefined) {
				return false;
			}
			return true;
		}
		constructor(directory, menu, systemDirs, nestingLevel = 0) {
			this.#path = directory.path;
			this.#menu = menu;
			let iconClass = 'default';
			switch (this.#path) {
				case systemDirs.inbox:
					{
						iconClass = 'inbox';
						break;
					}
				case systemDirs.spam:
					{
						iconClass = 'spam';
						break;
					}
				case systemDirs.outcome:
					{
						iconClass = 'outcome';
						break;
					}
				case systemDirs.trash:
					{
						iconClass = 'trash';
						break;
					}
				case systemDirs.drafts:
					{
						iconClass = 'drafts';
						break;
					}
			}
			this.#nameOriginal = directory.name;
			this.#name = this.#nameOriginal.charAt(0).toUpperCase() + this.#nameOriginal.slice(1);
			const itemContainer = main_core.Tag.render`<div title="${this.#name}" class="mail-menu-directory-item-container"></div>`;
			const itemElement = main_core.Tag.render`
			<li tabindex="0" class="ui-sidepanel-menu-item ui-sidepanel-menu-counter-white mail-menu-directory-item-${iconClass}">
							<a class="ui-sidepanel-menu-link mail-menu-directory-link">
								<div class="ui-sidepanel-menu-link-text">
									<span class="ui-sidepanel-menu-link-text-item">${this.#name}</span>
								</div>
								<span class="ui-sidepanel-menu-link-text-counter">${directory.count}</span>
							</a>
						</li>
		`;
			const linkElement = itemElement.querySelector('.ui-sidepanel-menu-link');
			const clampedLevel = Math.min(nestingLevel, this.#maxNestingLevel);
			main_core.Dom.style(linkElement, 'marginLeft', `${this.#zeroLevelShiftWidth + this.#shiftWidthInPixels * clampedLevel + 5}px`);
			const iconSetMap = {
				inbox: '--o-mail',
				outcome: '--o-mail-send',
				spam: '--o-alert',
				trash: '--o-trashcan',
				drafts: '--o-document-sign',
				default: '--o-folder'
			};
			const iconSetClass = iconSetMap[iconClass];
			if (iconSetClass) {
				const icon = main_core.Tag.render`<span class="ui-icon-set ${iconSetClass} mail-menu-directory-item-icon"></span>`;
				const linkText = itemElement.querySelector('.ui-sidepanel-menu-link-text');
				main_core.Dom.prepend(icon, linkText);
			}
			main_core.Dom.append(itemElement, itemContainer);
			main_core.Event.bind(itemElement, 'click', () => {
				if (!this.isActive()) {
					menu.chooseFunction(directory.path);
					this.enableActivity();
				}
			});
			main_core.Event.bind(itemElement, 'keydown', event => {
				switch (event.key) {
					case 'Enter':
						{
							event.preventDefault();
							itemElement.click();
							itemElement.focus();
							break;
						}
					case ' ':
						{
							event.preventDefault();
							this.toggle();
							break;
						}
					case 'ArrowDown':
					case 'ArrowUp':
						{
							event.preventDefault();
							menu.moveFocus(itemElement, event.key === 'ArrowDown' ? 1 : -1);
							break;
						}
				}
			});
			const counterElement = itemElement.querySelector('.ui-sidepanel-menu-link-text-counter');
			this.#counterElement = counterElement;
			this.#itemElement = itemElement;
			this.#container = itemContainer;
			this.setCount(directory.count);
			if (directory.items && directory.items.length > 0) {
				const childrenContainer = main_core.Tag.render`<div class="mail-menu-directory-children"></div>`;
				for (let i = 0; i < directory.items.length; i++) {
					if (!Item.checkProperties(directory.items[i])) {
						continue;
					}
					const childItem = new Item(directory.items[i], menu, systemDirs, nestingLevel + 1);
					this.#childItems.push(childItem);
					main_core.Dom.append(childItem.getContainer(), childrenContainer);
				}
				if (this.#childItems.length > 0) {
					const paddingLeft = this.#zeroLevelShiftWidth + this.#shiftWidthInPixels * clampedLevel;
					const toggleLeft = paddingLeft - 20;
					const lineLeft = toggleLeft + 10;
					main_core.Dom.attr(itemElement, 'aria-expanded', 'true');
					const toggleButton = main_core.Tag.render`<button type="button" tabindex="-1" class="mail-menu-directory-toggle" aria-label="${this.#name}"><span class="ui-icon-set --chevron-down-l mail-menu-directory-toggle-icon"></span></button>`;
					main_core.Dom.style(toggleButton, 'left', `${toggleLeft}px`);
					main_core.Event.bind(toggleButton, 'click', event => {
						event.stopPropagation();
						this.toggle();
					});
					main_core.Dom.insertAfter(toggleButton, itemElement);
					this.#toggleButton = toggleButton;
					if (nestingLevel < this.#maxNestingLevel) {
						const treeLine = main_core.Tag.render`<div class="mail-menu-directory-tree-line"></div>`;
						main_core.Dom.style(treeLine, 'left', `${lineLeft}px`);
						main_core.Dom.prepend(treeLine, childrenContainer);
					}
					main_core.Dom.append(childrenContainer, itemContainer);
					this.#childrenContainer = childrenContainer;
				}
			}
			menu.includeItem(this, this.#path);
		}
	}

	class DirectoryMenu {
		#activeDir = '';
		#menu = main_core.Tag.render`<ul class="ui-mail-left-directory-menu" data-test-id="mail_directory-menu__folder-list"></ul>`;
		#directoryCounters = [];
		#items = new Map();
		#systemDirs = [];
		#sortMode = 'default';
		#collapsedFolders = {};
		#mailboxId = 0;
		#saveTimer = null;
		getActiveDir() {
			return this.#activeDir;
		}
		setActiveDir(path) {
			this.#activeDir = path;
		}
		clearActiveMenuButtons() {
			for (const item of this.#items.values()) {
				item.disableActivity();
			}
		}
		rebuildMenu(dirsWithUnseenMailCounters) {
			this.#directoryCounters = dirsWithUnseenMailCounters;
			this.cleanItems();
			this.buildMenu();
			this.#applyCollapsedState();
			this.#applySortMode();
			this.setDirectory(this.getActiveDir());
		}
		cleanItems() {
			for (const item of this.#items.values()) {
				main_core.Dom.remove(item.getContainer());
			}
			this.#items.clear();
		}
		includeItem(item, directoryPath) {
			this.#items.set(directoryPath, item);
			main_core.Dom.append(item.getContainer(), this.#menu);
		}
		chooseFunction(path) {
			this.clearActiveMenuButtons();
			this.setActiveDir(path);
			this.setFilterDir(path);
		}
		buildMenu(firstBuild = false) {
			for (let i = 0; i < this.#directoryCounters.length; i++) {
				const directory = this.#directoryCounters[i];
				const path = directory.path;
				if (!Item.checkProperties(directory)) {
					continue;
				}
				if (this.#systemDirs.inbox === path && firstBuild) {
					BX.Mail.Home.FilterToolbar.setCount(directory.count);
				}
				new Item(directory, this, this.#systemDirs);
			}
			this.#updateNestingClass();
		}
		#updateNestingClass() {
			const hasNesting = this.#directoryCounters.some(dir => dir.items?.some(child => Item.checkProperties(child)));
			const modifierClass = 'mail-left-directory-menu--no-nesting';
			if (hasNesting) {
				main_core.Dom.removeClass(this.#menu, modifierClass);
			} else {
				main_core.Dom.addClass(this.#menu, modifierClass);
			}
		}
		setFilterDir(name) {
			const event = new main_core_events.BaseEvent({
				data: {
					directory: name
				}
			});
			main_core_events.EventEmitter.emit('BX.DirectoryMenu:onChangeFilter', event);
			name = BX.Mail.Home.Counters.getShortcut(name);
			const filter = this.filter;
			if (Boolean(filter) && filter instanceof BX.Main.Filter) {
				const FilterApi = filter.getApi();
				FilterApi.setFields({
					DIR: name
				});
				FilterApi.apply();
			}
		}
		changeCounter(dirPath, number, mode) {
			const item = this.#items.get(dirPath);
			if (item === undefined) {
				return;
			}
			if (mode === 'set') {
				item.setCount(Number(number));
			} else {
				item.setCount(item.getCount() + Number(number));
			}
		}
		setCounters(counters) {
			for (const path in counters) {
				if (counters.hasOwnProperty(path)) {
					this.changeCounter(path, counters[path], 'set');
				}
			}
		}
		setDirectory(path) {
			this.clearActiveMenuButtons();
			if (path === undefined) {
				return;
			}
			const item = this.#items.get(path);
			if (item) {
				this.setActiveDir(path);
				item.enableActivity();
			}
		}
		constructor(config = {
			dirsWithUnseenMailCounters: {},
			filterId: '',
			systemDirs: {
				spam: 'Spam',
				trash: 'Trash',
				outcome: 'Outcome',
				drafts: 'Drafts',
				inbox: 'Inbox'
			}
		}) {
			this.filter = BX.Main.filterManager.getById(config.filterId);
			this.#systemDirs = config.systemDirs;
			this.#mailboxId = config.mailboxId || 0;
			this.#collapsedFolders = config.collapsedFolders || {};
			main_core_events.EventEmitter.subscribe('BX.Main.Filter:apply', event => {
				const dir = BX.Mail.Home.Counters.getDirPath(this.filter.getFilterFieldsValues().DIR);
				main_core_events.EventEmitter.emit('BX.DirectoryMenu:onChangeFilter', new main_core_events.BaseEvent({
					data: {
						directory: dir
					}
				}));
				this.setDirectory(dir);
			});
			this.#directoryCounters = config.dirsWithUnseenMailCounters;
			this.buildMenu(true);
			this.#applyCollapsedState();
			if (config.sortMode && config.sortMode !== 'default') {
				this.#sortMode = config.sortMode;
				this.#applySortMode();
			}
			main_core_events.EventEmitter.subscribe('BX.Mail.FolderSort:onChange', event => {
				const {
					mode
				} = event.data;
				this.#sortMode = mode;
				this.#applySortMode();
			});
		}
		#applySortMode() {
			if (this.#sortMode === 'default') {
				this.#reorderByDefault();
				return;
			}
			this.#sortContainer(this.#menu);
		}
		#sortContainer(container) {
			const items = [...container.querySelectorAll(':scope > .mail-menu-directory-item-container')];
			items.sort((a, b) => {
				const nameA = (main_core.Dom.attr(a, 'title') || '').toLowerCase();
				const nameB = (main_core.Dom.attr(b, 'title') || '').toLowerCase();
				return this.#sortMode === 'alpha_asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
			});
			for (const item of items) {
				main_core.Dom.append(item, container);
				const children = item.querySelector('.mail-menu-directory-children');
				if (children) {
					this.#sortContainer(children);
				}
			}
		}
		#reorderByDefault() {
			this.#reorderContainer(this.#directoryCounters, this.#menu);
		}
		#reorderContainer(directories, container) {
			for (const directory of directories) {
				const item = this.#items.get(directory.path);
				if (!item || item.getContainer().parentNode !== container) {
					continue;
				}
				main_core.Dom.append(item.getContainer(), container);
				if (directory.items?.length > 0) {
					const children = item.getContainer().querySelector('.mail-menu-directory-children');
					if (children) {
						this.#reorderContainer(directory.items, children);
					}
				}
			}
		}
		moveFocus(currentElement, direction) {
			const items = [...this.#menu.querySelectorAll('li[tabindex="0"]')].filter(el => el.offsetParent !== null);
			const index = items.indexOf(currentElement);
			if (index === -1) {
				return;
			}
			const next = items[index + direction];
			if (next) {
				next.focus();
			}
		}
		onToggleFolder(path, isExpanded) {
			if (isExpanded) {
				delete this.#collapsedFolders[path];
			} else {
				this.#collapsedFolders[path] = false;
			}
			this.#saveCollapsedState();
		}
		#applyCollapsedState() {
			for (const [path, item] of this.#items) {
				if (this.#collapsedFolders[path] === false) {
					item.collapse();
				}
			}
		}
		#saveCollapsedState() {
			if (this.#mailboxId <= 0) {
				return;
			}
			clearTimeout(this.#saveTimer);
			this.#saveTimer = setTimeout(() => {
				this.#sendCollapsedState();
			}, 2000);
		}
		#sendCollapsedState() {
			this.#saveTimer = null;
			BX.ajax.runAction('mail.mailboxsettings.saveFolderExpandState', {
				data: {
					mailboxId: this.#mailboxId,
					collapsedFolders: JSON.stringify(this.#collapsedFolders)
				}
			});
		}
		getNode() {
			return this.#menu;
		}
	}

	exports.DirectoryMenu = DirectoryMenu;

})(this.BX.Mail = this.BX.Mail || {}, BX, BX.Event);
//# sourceMappingURL=directorymenu.bundle.js.map
