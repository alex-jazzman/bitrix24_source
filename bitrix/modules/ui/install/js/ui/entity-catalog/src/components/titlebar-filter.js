import { Dom, Tag, Text, Loc } from 'main.core';
import { BaseEvent } from 'main.core.events';
import { type MenuItemOptions, MenuManager, type Menu } from 'main.popup';

import { type FilterData } from '../types/filter';

import '../css/titlebar-filter.css';

let menuSequence = 0;

export const TitleBarFilter = {
	emits: ['onApplyFilters'],
	name: 'ui-entity-catalog-titlebar-filter',
	props: {
		filters: {
			type: Array,
			required: true,
		},
		multiple: {
			type: Boolean,
			default: false,
		},
	},
	data(): Object
	{
		return {
			appliedFilters: this.getAppliedFilters(),
			allFilters: this.filters,
			menuOpen: false,
			activeMenuId: '',
			filterOpenLabel: Loc.getMessage('UI_JS_ENTITY_CATALOG_FILTER_OPEN_ARIA'),
		};
	},
	methods: {
		showMenu(event: MouseEvent): Menu
		{
			const openedWithKeyboard = event.detail === 0;
			const menuId = `ui-entity-catalog-titlebar-filter-menu-${++menuSequence}`;
			this.activeMenuId = menuId;
			const menu = MenuManager.create({
				id: menuId,
				bindElement: this.$el,
				minWidth: 271,
				autoHide: true,
				contentColor: 'white',
				draggable: false,
				cacheable: false,
				focusTrap: { initialFocus: 'container' },
				items: this.getItems(),
			});

			menu.subscribe('onShow', () => {
				if (this.activeMenuId !== menuId)
				{
					return;
				}

				this.menuOpen = true;
				if (openedWithKeyboard)
				{
					menu.getNavigation().focusFirst();
				}
			});
			menu.subscribe('onClose', () => {
				if (this.activeMenuId !== menuId)
				{
					return;
				}

				this.menuOpen = false;
				this.activeMenuId = '';
				if (openedWithKeyboard)
				{
					this.$el?.focus({ preventScroll: true });
				}
			});
			menu.show();

			return menu;
		},
		getItems(): MenuItemOptions[]
		{
			const items = [];

			for (const key in this.allFilters)
			{
				const html = Tag.render`
					<div style="display: flex">
						<div>${Text.encode(this.filters[key].text)}</div>
					</div>
				`;

				if (this.allFilters[key].applied)
				{
					Dom.append(Tag.render`<div class="ui-entity-catalog__filter-block_selected"></div>`, html);
				}

				items.push({
					html,
					onclick: (event, item) => {
						if (this.allFilters[key].applied)
						{
							delete this.appliedFilters[this.allFilters[key].id];
						}
						else
						{
							if (!this.multiple)
							{
								this.clearAllAction();
							}

							this.appliedFilters[this.allFilters[key].id] = this.allFilters[key];
						}

						this.allFilters[key].applied = !this.allFilters[key].applied;
						this.$emit('onApplyFilters', new BaseEvent({data: this.appliedFilters}));


						item.getMenuWindow().close();
					},
				});
			}

			items.push({
				delimiter: true,
			});

			items.push(this.getClearAllFilter());

			return items;
		},
		getClearAllFilter(): MenuItemOptions
		{
			return {
				html: `
					<div style="display: flex">
						<div>${Loc.getMessage('UI_JS_ENTITY_CATALOG_RESET_FILTER')}</div>
					</div>
				`,
				onclick: (event, item) => {
					this.clearAllAction();
					this.$emit('onApplyFilters', new BaseEvent({data: this.appliedFilters}));

					item.getMenuWindow().close();
				},
			};
		},
		clearAllAction()
		{
			this.appliedFilters = {};
			this.allFilters = this.allFilters.map(filter => ({...filter, applied: false}));
		},
		getAppliedFilters(): Object<string, FilterData>
		{
			const appliedFilters = {};

			for (const key in this.filters)
			{
				if (this.filters[key].applied)
				{
					appliedFilters[this.filters[key].id] = this.filters[key];
				}
			}

			if (Object.keys(appliedFilters).length > 0)
			{
				this.$emit('onApplyFilters', new BaseEvent({data: appliedFilters}));
			}

			return appliedFilters;
		}
	},
	template: `
		<button
			type="button"
			data-testid="entity-catalog-filter-open"
			:class="{
				'ui-entity-catalog__titlebar_btn-filter': true,
				'--active': Object.keys(appliedFilters).length > 0
			}"
			aria-haspopup="menu"
			:aria-expanded="menuOpen"
			:aria-label="filterOpenLabel"
			@click="showMenu"
		></button>
	`,
};
