import { Loc, Text, Dom, ajax as Ajax, Tag, Event, Runtime, Type } from 'main.core';
import { MemoryCache, type BaseCache } from 'main.core.cache';
import { SidePanel } from 'main.sidepanel';
import Utils from './utils';

export class GroupPanel
{
	#refs: BaseCache<HTMLElement> = new MemoryCache();
	#status: 'initial' | 'loading' | 'loaded' = 'initial';
	#xhr = null;
	#isExtranetInstalled: boolean = true;

	constructor(options)
	{
		const groupsLink = document.getElementById('menu-all-groups-link');
		Event.bind(groupsLink, 'click', this.#handleGroupsLinkClick.bind(this));

		this.#isExtranetInstalled = (
			Type.isBoolean(options.isExtranetInstalled)
				? options.isExtranetInstalled
				: this.#isExtranetInstalled
		);
	}

	getContainer(): HTMLElement
	{
		return this.#refs.remember('container', () => {
			return Tag.render`
				<div class="group-panel-content">
					<div class="group-panel-header">
						${this.getFilterContainer()}
					</div>
					${this.getItemsContainer()}
				</div>
			`;
		});
	}

	getItemsContainer(): HTMLElement
	{
		return this.#refs.remember('items-container', () => {
			return Tag.render`
				<div class="group-panel-items"
					role="tabpanel"
					onclick="${this.#handleItemsClick.bind(this)}"
				></div>
			`;
		});
	}

	getFilterContainer(): HTMLElement
	{
		return this.#refs.remember('filter-container', () => {
			const container = Tag.render`
				<span class="group-panel-header-filters" role="tablist"
					aria-label="${Loc.getMessagePlural('MENU_MY_WORKGROUPS')}"
				></span>
			`;

			const filters = [
				{ filter: 'all', label: Loc.getMessage('MENU_MY_WORKGROUPS'), selected: true },
				...(this.#isExtranetInstalled
					? [{ filter: 'extranet', label: Loc.getMessage('MENU_MY_WORKGROUPS_EXTRANET') }]
					: []
				),
				{ filter: 'favorites', label: Loc.getMessage('MENU_MY_WORKGROUPS_FAVORITES'), hasCounter: true },
			];

			filters.forEach((f) => {
				const tab = Tag.render`
					<button type="button"
						class="group-panel-header-filter group-panel-header-filter-${f.filter}"
						role="tab"
						tabindex="${f.selected ? '0' : '-1'}"
						aria-selected="${f.selected ? 'true' : 'false'}"
						data-filter="${f.filter}"
					>${f.label}${f.hasCounter ? this.getCounterContainer() : ''}</button>
				`;

				Event.bind(tab, 'click', this.#handleFilterClick.bind(this));
				Event.bind(tab, 'keydown', this.#handleFilterKeydown.bind(this));

				Dom.append(tab, container);
			});

			return container;
		});
	}

	getCounterContainer(): HTMLElement
	{
		return this.#refs.remember('counter-container', () => {
			return Tag.render`<span class="group-panel-header-filter-counter"></span>`;
		});
	}

	#handleGroupsLinkClick(event): void
	{
		SidePanel.Instance.open('my-groups', {
			cacheable: false,
			contentCallback: () => {
				return Runtime.loadExtension('ui.sidepanel.layout').then((exports) => {
					const { Layout } = exports;

					return Layout.createContent({
						title: Loc.getMessage('MENU_MY_WORKGROUPS'),
						design: {
							section: true,
							margin: true,
						},
						buttons: () => [],
						content: () => {
							if (this.#status === 'loaded')
							{
								return this.getContainer();
							}

							return this.#loadContent();
						},
					});
				});
			},
			events: {
				onClose: () => {
					if (this.#xhr && this.#status !== 'loaded')
					{
						this.#status = 'initial';
						this.#xhr.abort();
					}
				},
			},
		});
	}

	async #loadContent(): Promise<HTMLElement>
	{
		this.#status = 'loading';

		const response = await Ajax.runAction('intranet.leftmenu.getGroups', {
			onrequeststart: (xhr): void => {
				this.#xhr = xhr;
			},
		});

		const { groups, filter } = response.data;
		for (const group of groups)
		{
			const classes = ['group-panel-item'];
			classes.push(group.extranet ? 'group-panel-item-extranet' : 'group-panel-item-intranet');
			if (group.favorite)
			{
				classes.push('group-panel-item-favorite');
			}

			const dom = Tag.render`
				<a href="${encodeURI(group.url)}" 
					class="${classes.join(' ')}" 
					data-id="${group.id}" 
					data-slider-ignore-autobinding="true"
				>
					<span class="group-panel-item-text" title="${Text.encode(group.title)}">${Text.encode(group.title)}</span>
					<button type="button"
						class="group-panel-item-star"
						aria-label="${Loc.getMessage('MENU_TOGGLE_FAVORITE_ARIA')}"
						aria-pressed="${group.favorite ? 'true' : 'false'}"
					></button>
				</a>
			`;

			Dom.append(dom, this.getItemsContainer());
		}

		Dom.addClass(this.getContainer(), `group-panel-content-${filter}`);
		Dom.attr(this.getContainer(), { 'data-filter': filter });

		this.#status = 'loaded';

		return this.getContainer();
	}

	#handleFilterClick(event): void
	{
		const filterElement = event.target.closest('[role="tab"]') || event.target;

		const currentFilter = this.getContainer().dataset.filter || 'all';
		const newFilter = filterElement.dataset.filter || 'all';

		if (currentFilter !== newFilter)
		{
			this.getContainer().dataset.filter = newFilter;
			this.saveFilter(newFilter);

			const tabs = this.getFilterContainer().querySelectorAll('[role="tab"]');
			tabs.forEach((tab) => {
				const isSelected = tab.dataset.filter === newFilter;
				Dom.attr(tab, 'aria-selected', String(isSelected));
				Dom.attr(tab, 'tabindex', isSelected ? '0' : '-1');
			});

			if (Utils.prefersReducedMotion())
			{
				Dom.removeClass(this.getContainer(), `group-panel-content-${currentFilter}`);
				Dom.addClass(this.getContainer(), `group-panel-content-${newFilter}`);
			}
			else
			{
				new BX.easing({
					duration: 50,
					start: { opacity: 1 },
					finish: { opacity: 0 },
					transition: BX.easing.transitions.linear,

					step: (state) => {
						Dom.style(this.getItemsContainer(), 'opacity', state.opacity / 100);
					},

					complete: () => {
						Dom.removeClass(this.getContainer(), `group-panel-content-${currentFilter}`);
						Dom.addClass(this.getContainer(), `group-panel-content-${newFilter}`);

						new BX.easing({
							duration: 50,
							start: { opacity: 0 },
							finish: { opacity: 1 },
							transition: BX.easing.transitions.linear,
							step: (state) => {
								Dom.style(this.getItemsContainer(), 'opacity', state.opacity / 100);
							},
							complete: () => {
								Dom.style(this.getItemsContainer(), 'opacity', null);
							},
						}).animate();
					},
				}).animate();
			}
		}

		event.stopPropagation();
	}

	#handleFilterKeydown(event): void
	{
		const tabs = [...this.getFilterContainer().querySelectorAll('[role="tab"]')];
		const currentIndex = tabs.indexOf(event.target);
		let newIndex = currentIndex;

		switch (event.key)
		{
			case 'ArrowRight':
			case 'ArrowDown': {
				event.preventDefault();
				newIndex = (currentIndex + 1) % tabs.length;

				break;
			}
			case 'ArrowLeft':
			case 'ArrowUp': {
				event.preventDefault();
				newIndex = (currentIndex - 1 + tabs.length) % tabs.length;

				break;
			}

			case 'Home': {
				event.preventDefault();
				newIndex = 0;

				break;
			}

			case 'End': {
				event.preventDefault();
				newIndex = tabs.length - 1;

				break;
			}

			default: {
				return;
			}
		}

		tabs.forEach((tab, i) => {
			Dom.attr(tab, 'tabindex', i === newIndex ? '0' : '-1');
			Dom.attr(tab, 'aria-selected', i === newIndex ? 'true' : 'false');
		});
		tabs[newIndex].focus();
		tabs[newIndex].click();
	}

	#handleItemsClick(event): void
	{
		if (!Dom.hasClass(event.target, 'group-panel-item-star'))
		{
			return;
		}

		const star = event.target;
		const item = star.parentNode;
		const groupId = item.dataset.id;

		const action = Dom.hasClass(item, 'group-panel-item-favorite') ? 'removeFromFavorites' : 'addToFavorites';
		Dom.toggleClass(item, 'group-panel-item-favorite');

		const isFav = Dom.hasClass(item, 'group-panel-item-favorite');
		Dom.attr(star, 'aria-pressed', String(isFav));

		this.#animateStart(star);
		this.#animateCounter(action === 'addToFavorites');

		void Ajax.runAction(`intranet.leftmenu.${action}`, {
			data: {
				groupId,
			},
		});

		event.preventDefault();
	}

	#animateStart(star): void
	{
		if (Utils.prefersReducedMotion())
		{
			return;
		}

		const flyingStar = star.cloneNode();
		Dom.style(flyingStar, 'margin-left', `-${star.offsetWidth}px`);
		Dom.append(flyingStar, star.parentNode);

		new BX.easing({
			duration: 200,
			start: { opacity: 100, scale: 100 },
			finish: { opacity: 0, scale: 300 },
			step: (state) => {
				Dom.style(flyingStar, 'transform', `scale(${state.scale / 100})`);
				Dom.style(flyingStar, 'opacity', state.opacity / 100);
			},
			complete: () => {
				flyingStar.parentNode.removeChild(flyingStar);
			},
		}).animate();
	}

	#animateCounter(positive): void
	{
		if (Utils.prefersReducedMotion())
		{
			return;
		}

		this.getCounterContainer().innerHTML = positive === false ? '-1' : '+1';

		new BX.easing({
			duration: 400,
			start: { opacity: 100, top: 0 },
			finish: { opacity: 0, top: -20 },
			transition: BX.easing.transitions.linear,
			step: (state) => {
				Dom.style(this.getCounterContainer(), 'top', `${state.top}px`);
				Dom.style(this.getCounterContainer(), 'opacity', state.opacity / 100);
			},
			complete: () => {
				Dom.style(this.getCounterContainer(), 'top', null);
				Dom.style(this.getCounterContainer(), 'opacity', null);
			},
		}).animate();
	}

	saveFilter(filter)
	{
		void Ajax.runAction('intranet.leftmenu.setGroupFilter', {
			data: {
				filter,
			},
		});
	}
}
