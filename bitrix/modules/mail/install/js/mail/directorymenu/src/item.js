import { Tag, Dom, Event } from 'main.core';

export class Item
{
	#count = 0;
	#nameOriginal = '';
	#name = '';
	#counterElement: null;
	#itemElement: null;
	#container: null;
	#isActive: false;
	#isExpanded = true;
	#path : '';
	#shiftWidthInPixels = 20;
	#maxNestingLevel = 6;
	#zeroLevelShiftWidth = 29;
	#childrenContainer: null;
	#toggleButton: null;
	#childItems = [];
	#menu: null;

	getContainer()
	{
		return this.#container;
	}

	getItemElement()
	{
		return this.#itemElement;
	}

	setCount(number)
	{
		this.#count = number;
		this.#counterElement.textContent = number;

		if (number === 0)
		{
			Dom.addClass(this.#counterElement, 'ui-sidepanel-menu-link-text-counter-hidden');
		}
		else
		{
			Dom.removeClass(this.#counterElement, 'ui-sidepanel-menu-link-text-counter-hidden');
		}
	}

	getCount()
	{
		return Number(this.#count);
	}

	disableActivity()
	{
		this.#isActive = false;
		Dom.removeClass(this.#itemElement, 'mail-menu-directory-item--active');
	}

	getPath()
	{
		return this.#path;
	}

	enableActivity()
	{
		this.#isActive = true;
		Dom.addClass(this.#itemElement, 'mail-menu-directory-item--active');
	}

	isActive()
	{
		return this.#isActive;
	}

	collapse()
	{
		if (!this.#childrenContainer)
		{
			return;
		}

		this.#isExpanded = false;
		const container = this.#childrenContainer;
		Dom.style(container, 'maxHeight', `${container.scrollHeight}px`);
		requestAnimationFrame(() => {
			Dom.style(container, 'maxHeight', '0');
		});

		Dom.attr(this.#itemElement, 'aria-expanded', 'false');
		const icon = this.#toggleButton.querySelector('.mail-menu-directory-toggle-icon');
		Dom.removeClass(icon, '--chevron-down-l');
		Dom.addClass(icon, '--chevron-top-l');

		this.#setChildrenTabIndex('-1');
	}

	expand()
	{
		if (!this.#childrenContainer)
		{
			return;
		}

		this.#isExpanded = true;
		const container = this.#childrenContainer;
		Dom.style(container, 'maxHeight', 'none');
		const fullHeight = container.scrollHeight;
		Dom.style(container, 'maxHeight', '0');

		requestAnimationFrame(() => {
			Dom.style(container, 'maxHeight', `${fullHeight}px`);
			const onEnd = () => {
				Dom.style(container, 'maxHeight', '');
				Event.unbind(container, 'transitionend', onEnd);
			};
			Event.bind(container, 'transitionend', onEnd);
		});

		Dom.attr(this.#itemElement, 'aria-expanded', 'true');
		const icon = this.#toggleButton.querySelector('.mail-menu-directory-toggle-icon');
		Dom.removeClass(icon, '--chevron-top-l');
		Dom.addClass(icon, '--chevron-down-l');

		this.#setChildrenTabIndex('0');
	}

	#setChildrenTabIndex(value)
	{
		const items = this.#childrenContainer.querySelectorAll('li[tabindex]');
		items.forEach((item) => {
			Dom.attr(item, 'tabindex', value);
		});
	}

	toggle()
	{
		if (!this.#childrenContainer)
		{
			return;
		}

		if (this.#isExpanded)
		{
			this.collapse();
		}
		else
		{
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
	static checkProperties(directory)
	{
		if (directory.path === undefined || directory.name === undefined)
		{
			return false;
		}

		return true;
	}

	constructor(directory, menu, systemDirs, nestingLevel = 0)
	{
		this.#path = directory.path;
		this.#menu = menu;

		let iconClass = 'default';
		switch (this.#path)
		{
			case systemDirs.inbox: {
				iconClass = 'inbox';

				break;
			}

			case systemDirs.spam: {
				iconClass = 'spam';

				break;
			}

			case systemDirs.outcome: {
				iconClass = 'outcome';

				break;
			}

			case systemDirs.trash: {
				iconClass = 'trash';

				break;
			}

			case systemDirs.drafts: {
				iconClass = 'drafts';

				break;
			}

			default: {
				break;
			}
		}

		this.#nameOriginal = directory.name;

		this.#name = this.#nameOriginal.charAt(0).toUpperCase() + this.#nameOriginal.slice(1);

		const itemContainer = Tag.render`<div title="${this.#name}" class="mail-menu-directory-item-container"></div>`;
		const itemElement = Tag.render`
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
		Dom.style(linkElement, 'marginLeft', `${this.#zeroLevelShiftWidth + (this.#shiftWidthInPixels * clampedLevel) + 5}px`);

		const iconSetMap = {
			inbox: '--o-mail',
			outcome: '--o-mail-send',
			spam: '--o-alert',
			trash: '--o-trashcan',
			drafts: '--o-document-sign',
			default: '--o-folder',
		};

		const iconSetClass = iconSetMap[iconClass];
		if (iconSetClass)
		{
			const icon = Tag.render`<span class="ui-icon-set ${iconSetClass} mail-menu-directory-item-icon"></span>`;
			const linkText = itemElement.querySelector('.ui-sidepanel-menu-link-text');
			Dom.prepend(icon, linkText);
		}

		Dom.append(itemElement, itemContainer);

		Event.bind(itemElement, 'click', () => {
			if (!this.isActive())
			{
				menu.chooseFunction(directory.path);
				this.enableActivity();
			}
		});

		Event.bind(itemElement, 'keydown', (event) => {
			switch (event.key)
			{
				case 'Enter': {
					event.preventDefault();
					itemElement.click();
					itemElement.focus();

					break;
				}

				case ' ': {
					event.preventDefault();
					this.toggle();

					break;
				}
				case 'ArrowDown':
				case 'ArrowUp': {
					event.preventDefault();
					menu.moveFocus(itemElement, event.key === 'ArrowDown' ? 1 : -1);

					break;
				}

				default: {
					break;
				}
			}
		});

		const counterElement = itemElement.querySelector('.ui-sidepanel-menu-link-text-counter');

		this.#counterElement = counterElement;
		this.#itemElement = itemElement;
		this.#container = itemContainer;

		this.setCount(directory.count);

		if (directory.items && directory.items.length > 0)
		{
			const childrenContainer = Tag.render`<div class="mail-menu-directory-children"></div>`;

			for (let i = 0; i < directory.items.length; i++)
			{
				if (!Item.checkProperties(directory.items[i]))
				{
					continue;
				}
				const childItem = new Item(directory.items[i], menu, systemDirs, nestingLevel + 1);
				this.#childItems.push(childItem);
				Dom.append(childItem.getContainer(), childrenContainer);
			}

			if (this.#childItems.length > 0)
			{
				const paddingLeft = this.#zeroLevelShiftWidth + (this.#shiftWidthInPixels * clampedLevel);
				const toggleLeft = paddingLeft - 20;
				const lineLeft = toggleLeft + 10;

				Dom.attr(itemElement, 'aria-expanded', 'true');
				const toggleButton = Tag.render`<button type="button" tabindex="-1" class="mail-menu-directory-toggle" aria-label="${this.#name}"><span class="ui-icon-set --chevron-down-l mail-menu-directory-toggle-icon"></span></button>`;
				Dom.style(toggleButton, 'left', `${toggleLeft}px`);

				Event.bind(toggleButton, 'click', (event) => {
					event.stopPropagation();
					this.toggle();
				});

				Dom.insertAfter(toggleButton, itemElement);
				this.#toggleButton = toggleButton;

				if (nestingLevel < this.#maxNestingLevel)
				{
					const treeLine = Tag.render`<div class="mail-menu-directory-tree-line"></div>`;
					Dom.style(treeLine, 'left', `${lineLeft}px`);
					Dom.prepend(treeLine, childrenContainer);
				}
				Dom.append(childrenContainer, itemContainer);
				this.#childrenContainer = childrenContainer;
			}
		}

		menu.includeItem(this, this.#path);
	}
}
