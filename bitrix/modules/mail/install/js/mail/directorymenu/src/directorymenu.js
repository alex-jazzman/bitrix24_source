import { Tag, Dom } from 'main.core';
import { EventEmitter, BaseEvent } from 'main.core.events';
import 'ui.design-tokens';
import 'ui.fonts.opensans';
import 'ui.icon-set.outline';

import { Item } from './item.js';

import './css/style.css';
import './css/ui-wrappermenu.css';

export class DirectoryMenu
{
	#activeDir = '';
	#menu = Tag.render`<ul class="ui-mail-left-directory-menu" data-test-id="mail_directory-menu__folder-list"></ul>`;
	#directoryCounters = [];
	#items = new Map();
	#systemDirs = [];
	#sortMode = 'default';
	#collapsedFolders = {};
	#mailboxId = 0;
	#saveTimer = null;

	getActiveDir()
	{
		return this.#activeDir;
	}

	setActiveDir(path)
	{
		this.#activeDir = path;
	}

	clearActiveMenuButtons()
	{
		for (const item of this.#items.values())
		{
			item.disableActivity();
		}
	}

	rebuildMenu(dirsWithUnseenMailCounters)
	{
		this.#directoryCounters = dirsWithUnseenMailCounters;
		this.cleanItems();
		this.buildMenu();
		this.#applyCollapsedState();
		this.#applySortMode();
		this.setDirectory(this.getActiveDir());
	}

	cleanItems()
	{
		for (const item of this.#items.values())
		{
			Dom.remove(item.getContainer());
		}
		this.#items.clear();
	}

	includeItem(item, directoryPath)
	{
		this.#items.set(directoryPath, item);
		Dom.append(item.getContainer(), this.#menu);
	}

	chooseFunction(path)
	{
		this.clearActiveMenuButtons();
		this.setActiveDir(path);
		this.setFilterDir(path);
	}

	buildMenu(firstBuild = false)
	{
		for (let i = 0; i < this.#directoryCounters.length; i++)
		{
			const directory = this.#directoryCounters[i];
			const path = directory.path;
			if (!Item.checkProperties(directory))
			{
				continue;
			}

			if (this.#systemDirs.inbox === path && firstBuild)
			{
				BX.Mail.Home.FilterToolbar.setCount(directory.count);
			}

			new Item(directory, this, this.#systemDirs);
		}

		this.#updateNestingClass();
	}

	#updateNestingClass()
	{
		const hasNesting = this.#directoryCounters.some(
			(dir) => dir.items?.some((child) => Item.checkProperties(child)),
		);
		const modifierClass = 'mail-left-directory-menu--no-nesting';

		if (hasNesting)
		{
			Dom.removeClass(this.#menu, modifierClass);
		}
		else
		{
			Dom.addClass(this.#menu, modifierClass);
		}
	}

	setFilterDir(name)
	{
		const event = new BaseEvent({ data: { directory: name } });
		EventEmitter.emit('BX.DirectoryMenu:onChangeFilter', event);

		name = BX.Mail.Home.Counters.getShortcut(name);

		const filter = this.filter;
		if (Boolean(filter) && (filter instanceof BX.Main.Filter))
		{
			const FilterApi = filter.getApi();
			FilterApi.setFields({
				DIR: name,
			});
			FilterApi.apply();
		}
	}

	changeCounter(dirPath, number, mode)
	{
		const item = this.#items.get(dirPath);

		if (item === undefined)

		
    { return;
		}

		if (mode === 'set')
		{
			item.setCount(Number(number));
		}
		else
		{
			item.setCount(item.getCount() + Number(number));
		}
	}

	setCounters(counters)
	{
		for (const path in counters)
		{
			if (counters.hasOwnProperty(path))
			{
				this.changeCounter(path, counters[path], 'set');
			}
		}
	}

	setDirectory(path)
	{
		this.clearActiveMenuButtons();
		if (path === undefined)

		
    { return;
		}
		const item = this.#items.get(path);
		if (item)
		{
			this.setActiveDir(path);
			item.enableActivity();
		}
	}

	constructor(config = {
		dirsWithUnseenMailCounters: {},
		filterId: '',
		systemDirs:
		{
			spam: 'Spam',
			trash: 'Trash',
			outcome: 'Outcome',
			drafts: 'Drafts',
			inbox: 'Inbox',
		},
	})
	{
		this.filter = BX.Main.filterManager.getById(config.filterId);
		this.#systemDirs = config.systemDirs;
		this.#mailboxId = config.mailboxId || 0;
		this.#collapsedFolders = config.collapsedFolders || {};

		EventEmitter.subscribe('BX.Main.Filter:apply', (event) => {
			const dir = BX.Mail.Home.Counters.getDirPath(this.filter.getFilterFieldsValues().DIR);

			EventEmitter.emit('BX.DirectoryMenu:onChangeFilter', new BaseEvent({ data: { directory: dir } }));
			this.setDirectory(dir);
		});

		this.#directoryCounters = config.dirsWithUnseenMailCounters;

		this.buildMenu(true);

		this.#applyCollapsedState();

		if (config.sortMode && config.sortMode !== 'default')
		{
			this.#sortMode = config.sortMode;
			this.#applySortMode();
		}

		EventEmitter.subscribe('BX.Mail.FolderSort:onChange', (event) => {
			const { mode } = event.data;
			this.#sortMode = mode;
			this.#applySortMode();
		});
	}

	#applySortMode()
	{
		if (this.#sortMode === 'default')
		{
			this.#reorderByDefault();

			return;
		}

		this.#sortContainer(this.#menu);
	}

	#sortContainer(container)
	{
		const items = [...container.querySelectorAll(':scope > .mail-menu-directory-item-container')];

		items.sort((a, b) => {
			const nameA = (Dom.attr(a, 'title') || '').toLowerCase();
			const nameB = (Dom.attr(b, 'title') || '').toLowerCase();

			return this.#sortMode === 'alpha_asc'
				? nameA.localeCompare(nameB)
				: nameB.localeCompare(nameA);
		});

		for (const item of items)
		{
			Dom.append(item, container);

			const children = item.querySelector('.mail-menu-directory-children');
			if (children)
			{
				this.#sortContainer(children);
			}
		}
	}

	#reorderByDefault()
	{
		this.#reorderContainer(this.#directoryCounters, this.#menu);
	}

	#reorderContainer(directories, container)
	{
		for (const directory of directories)
		{
			const item = this.#items.get(directory.path);
			if (!item || item.getContainer().parentNode !== container)
			{
				continue;
			}

			Dom.append(item.getContainer(), container);

			if (directory.items?.length > 0)
			{
				const children = item.getContainer().querySelector('.mail-menu-directory-children');
				if (children)
				{
					this.#reorderContainer(directory.items, children);
				}
			}
		}
	}

	moveFocus(currentElement, direction)
	{
		const items = [...this.#menu.querySelectorAll('li[tabindex="0"]')]
			.filter((el) => el.offsetParent !== null);

		const index = items.indexOf(currentElement);
		if (index === -1)
		{
			return;
		}

		const next = items[index + direction];
		if (next)
		{
			next.focus();
		}
	}

	onToggleFolder(path, isExpanded)
	{
		if (isExpanded)
		{
			delete this.#collapsedFolders[path];
		}
		else
		{
			this.#collapsedFolders[path] = false;
		}

		this.#saveCollapsedState();
	}

	#applyCollapsedState()
	{
		for (const [path, item] of this.#items)
		{
			if (this.#collapsedFolders[path] === false)
			{
				item.collapse();
			}
		}
	}

	#saveCollapsedState()
	{
		if (this.#mailboxId <= 0)
		{
			return;
		}

		clearTimeout(this.#saveTimer);
		this.#saveTimer = setTimeout(() => {
			this.#sendCollapsedState();
		}, 2000);
	}

	#sendCollapsedState()
	{
		this.#saveTimer = null;

		BX.ajax.runAction('mail.mailboxsettings.saveFolderExpandState', {
			data: {
				mailboxId: this.#mailboxId,
				collapsedFolders: JSON.stringify(this.#collapsedFolders),
			},
		});
	}

	getNode()
	{
		return this.#menu;
	}
}
