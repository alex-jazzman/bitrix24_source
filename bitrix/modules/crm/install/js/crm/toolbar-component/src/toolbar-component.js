import { Router } from 'crm.router';
import { PULL } from 'pull.client';
import { ajax as Ajax, Dom, Event, Loc, Reflection, Type } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Menu } from 'main.popup';
import { BaseButton, Button, ButtonIcon } from 'ui.buttons';
import { Guide } from 'ui.tour';

import 'ui.hint';

import './style.css';

const MENU_ID_PREFIX = 'toolbar-category-';

let instance = null;

class ToolbarEvents
{
	static TYPE_UPDATED = 'TypeUpdated';
	static CATEGORIES_UPDATED = 'CategoriesUpdated';
	static AUTOMATED_SOLUTION_UPDATED = 'CategoriesUpdated';
}

/**
 * @memberOf BX.Crm
 */
export default class ToolbarComponent extends EventEmitter
{
	#categoryMenuStateByMenu: WeakMap<Menu, Object> = new WeakMap();

	constructor()
	{
		super();

		this.initHints();
		this.setEventNamespace('BX.Crm.ToolbarComponent');

		Event.ready(this.bindEvents.bind(this));
	}

	static get Instance(): ToolbarComponent
	{
		if ((window.top !== window) && Reflection.getClass('top.BX.Crm.ToolbarComponent'))
		{
			return window.top.BX.Crm.ToolbarComponent.Instance;
		}

		if (instance === null)
		{
			instance = new ToolbarComponent();
		}

		return instance;
	}

	initHints(): void
	{
		BX.UI.Hint.init(BX('ui-toolbar-after-title-buttons'));
	}

	bindEvents(): void
	{
		const buttonNode = document.querySelector('[data-role="bx-crm-toolbar-categories-button"]');
		if (buttonNode)
		{
			const toolbar =	BX.UI.ToolbarManager.getDefaultToolbar();
			const button = toolbar.getButton(Dom.attr(buttonNode, 'data-btn-uniqid'));
			const entityTypeId = Number(buttonNode.dataset.entityTypeId);
			const menu = button?.getMenuWindow();
			if (menu)
			{
				this.#attachCategoryMenuLifecycle(menu);
			}

			if (button.counterNode && button.counterNode.innerText > 99)
			{
				button.counterNode.innerText = '99+';
			}

			if (button && entityTypeId > 0)
			{
				if (PULL)
				{
					PULL.subscribe({
						moduleId: 'crm',
						command: 'CRM_CATEGORIES_UPDATED',
						callback: (data) => {
							if (data.entityTypeId !== entityTypeId)
							{
								return;
							}

							this.#reloadCategoriesMenu(button, entityTypeId, buttonNode.dataset.categoryId);
						},
					});

					PULL.extendWatch('CRM_CATEGORIES_UPDATED');
				}

				this.subscribeCategoriesUpdatedEvent(() => {
					this.#reloadCategoriesMenu(button, entityTypeId, buttonNode.dataset.categoryId);
				});
			}
		}

		this.#bindAutomationGuide();
	}

	emitTypeUpdatedEvent(data): void
	{
		this.emit(ToolbarEvents.TYPE_UPDATED, data);
	}

	emitAutomatedSolutionUpdatedEvent(data: Object): void
	{
		this.emit(ToolbarEvents.AUTOMATED_SOLUTION_UPDATED, data);
	}

	emitCategoriesUpdatedEvent(data): void
	{
		this.emit(ToolbarEvents.CATEGORIES_UPDATED, data);
	}

	subscribeTypeUpdatedEvent(callback): void
	{
		this.subscribe(ToolbarEvents.TYPE_UPDATED, callback);
	}

	subscribeCategoriesUpdatedEvent(callback): void
	{
		this.subscribe(ToolbarEvents.CATEGORIES_UPDATED, callback);
	}

	subscribeAutomatedSolutionUpdatedEvent(callback): void
	{
		this.subscribe(ToolbarEvents.AUTOMATED_SOLUTION_UPDATED, callback);
	}

	unsubscribeAutomatedSolutionUpdatedEvent(callback): void
	{
		this.unsubscribe(ToolbarEvents.AUTOMATED_SOLUTION_UPDATED, callback);
	}

	getSettingsButton(): ?Button
	{
		const toolbar: ?BX.UI.Toolbar = BX.UI.ToolbarManager.getDefaultToolbar();
		if (!toolbar)
		{
			return null;
		}

		for (const [key: string, button: Button] of Object.entries(toolbar.getButtons()))
		{
			if (button.getIcon() === ButtonIcon.SETTING)
			{
				return button;
			}
		}

		return null;
	}

	#bindAutomationGuide(): void
	{
		const hash = document.location.hash;
		let guide = null;

		if (hash === '#robots')
		{
			const robotsBtn = document.querySelector('.robot-button-container');
			if (robotsBtn)
			{
				guide = new Guide({
					steps: [
						{
							target: robotsBtn,
							title: Loc.getMessage('CRM_TOOLBAR_COMPONENT_ROBOTS_GUIDE_TEXT_1'),
							text: '',
						},
					],
					onEvents: true,
				});
			}
		}
		else if (hash === '#scripts')
		{
			const scriptsBtn = document.querySelector('.intranet-binding-menu-btn');
			if (scriptsBtn)
			{
				guide = new Guide({
					steps: [
						{
							target: scriptsBtn,
							title: Loc.getMessage('CRM_TOOLBAR_COMPONENT_SCRIPTS_GUIDE_TEXT'),
							article: '13281632',
							text: '',
						},
					],
					onEvents: true,
				});
			}
		}

		if (guide)
		{
			guide.start();
			guide.getPopup().setAutoHide(true);
			guide.getPopup().setClosingByEsc(true);
		}
	}

	#reloadCategoriesMenu(button: BaseButton, entityTypeId: number, categoryId: ?number): void
	{
		if (!button.getMenuWindow())
		{
			return;
		}

		Ajax.runAction('crm.controller.category.list', {
			data: {
				entityTypeId,
				isCategoryMenu: true,
			},
		}).then((response) => {
			const menu = button.getMenuWindow();
			if (!menu)
			{
				return;
			}

			let startKey = 0;
			const items = [];
			const categories = response.data.categories;

			menu.menuItems.forEach((item) => {
				if (item.id.indexOf(MENU_ID_PREFIX) !== 0)
				{
					items.push(item.options);
				}
				else if (item.id === 'toolbar-category-all')
				{
					items.push(item.options);
					startKey = 1;
				}
			});

			categories.forEach((category) => {
				const link = entityTypeId === BX.CrmEntityType.enumeration.deal
					? Router.Instance.getDealKanbanUrl(category.id)?.toString()
					: Router.Instance.getItemListUrlInCurrentView(entityTypeId, category.id)?.toString()
				;

				items.splice(startKey, 0, this.#formatCategoryMenuItem(category, link));

				if (category.id >= 0 && categoryId >= 0 && Number(categoryId) === Number(category.id))
				{
					button.setText(category.name);
				}

				startKey++;
			});

			const menuState = this.#categoryMenuStateByMenu.get(menu);
			const sourceBindOptions = menuState?.bindOptions ?? menu.getParams().bindOptions ?? {};
			const bindOptions = {
				...sourceBindOptions,
				forceBindPosition: true,
			};
			const options = {
				...menu.getParams(),
				items,
				bindOptions,
			};

			menu.destroy();

			Event.unbindAll(button.getContainer(), 'click');

			button.menuWindow = new Menu(options);
			this.#attachCategoryMenuLifecycle(button.menuWindow, true);
			this.#setCategoryMenuMaxWidth(button.menuWindow);
			Event.bind(button.getContainer(), 'click', button.menuWindow.show.bind(button.menuWindow));

			if (entityTypeId === BX.CrmEntityType.enumeration.deal)
			{
				this.#reloadAddButtonMenu(categories);
			}

			this.#tryRedirectToDefaultCategory(items, categoryId);
		}).catch((response) => {
			console.log('error trying reload categories', response.errors);
		});
	}

	#formatCategoryMenuItem(category: Object, href: ?string): Object
	{
		const content = Dom.create('span', {
			props: {
				className: 'crm-toolbar-category-menu-item-content',
			},
			children: [
				Dom.create('span', {
					props: {
						className: 'crm-toolbar-category-menu-item-name',
					},
					text: category.name,
				}),
			],
		});

		if (category.counter > 0)
		{
			Dom.append(Dom.create('span', {
				props: {
					className: 'crm-toolbar-category-menu-item-counter main-buttons-item-counter',
				},
				text: String(category.counter),
			}), content);
		}

		return {
			id: `${MENU_ID_PREFIX}${category.id}`,
			html: content,
			title: category.name,
			className: 'menu-popup-no-icon crm-toolbar-category-menu-item',
			href: href || null,
			dataset: {
				isDefault: category.isDefault === true || category.isDefault === 'Y',
				categoryId: category.id,
			},
		};
	}

	#attachCategoryMenuLifecycle(menu: Menu, isBindStateInstalled: boolean = false): void
	{
		if (this.#categoryMenuStateByMenu.has(menu))
		{
			return;
		}

		const popup = menu.getPopupWindow();
		const sourceBindOptions = menu.getParams().bindOptions ?? {};
		const state = {
			bindOptions: {
				...sourceBindOptions,
				forceBindPosition: true,
			},
			isBindStateInstalled,
			isResizeBound: false,
			resizeHandler: null,
		};
		state.resizeHandler = () => {
			if (!popup.isShown())
			{
				return;
			}

			this.#setCategoryMenuMaxWidth(menu);
			this.#adjustCategoryMenuPosition(menu);
		};
		this.#categoryMenuStateByMenu.set(menu, state);

		popup.subscribe('onBeforeShow', () => {
			this.#setCategoryMenuMaxWidth(menu);
		});
		popup.subscribe('onShow', () => {
			if (!state.isResizeBound)
			{
				Event.bind(window, 'resize', state.resizeHandler);
				state.isResizeBound = true;
			}

			this.#adjustCategoryMenuPosition(menu);
		});
		popup.subscribe('onAfterClose', () => {
			this.#unbindCategoryMenuResize(menu);
		});
		popup.subscribe('onDestroy', () => {
			this.#unbindCategoryMenuResize(menu);
			this.#categoryMenuStateByMenu.delete(menu);
		});
		popup.subscribe('onBeforeAdjustPosition', (event) => {
			const viewportWidth = document.documentElement.clientWidth;
			const scrollLeft = window.pageXOffset;
			const popupWidth = popup.getPopupContainer().offsetWidth;
			const minLeft = scrollLeft + 16;
			const maxLeft = scrollLeft + viewportWidth - 16 - popupWidth;

			// eslint-disable-next-line no-param-reassign
			event.left = Math.min(Math.max(event.left, minLeft), maxLeft);
		});
	}

	#setCategoryMenuMaxWidth(menu: Menu): void
	{
		const viewportWidth = document.documentElement.clientWidth;
		menu.getPopupWindow().setMaxWidth(Math.min(400, viewportWidth - 32));
	}

	#adjustCategoryMenuPosition(menu: Menu): void
	{
		const state = this.#categoryMenuStateByMenu.get(menu);
		if (!state)
		{
			return;
		}

		if (!state.isBindStateInstalled)
		{
			menu.getPopupWindow().adjustPosition(state.bindOptions);
			state.isBindStateInstalled = true;

			return;
		}

		menu.getPopupWindow().adjustPosition();
	}

	#unbindCategoryMenuResize(menu: Menu): void
	{
		const state = this.#categoryMenuStateByMenu.get(menu);
		if (state?.isResizeBound)
		{
			Event.unbind(window, 'resize', state.resizeHandler);
			state.isResizeBound = false;
		}
	}

	#reloadAddButtonMenu(categories: Array)
	{
		const addButtonNode = document.querySelector('.ui-btn-split.ui-btn-success');
		if (!addButtonNode)
		{
			return;
		}

		const addButtonId = addButtonNode.dataset.btnUniqid;
		const toolbar =	BX.UI.ToolbarManager.getDefaultToolbar();
		const button = toolbar.getButton(addButtonId, 'data-btn-uniqid');
		if (!button)
		{
			return;
		}

		const menu = button.menuWindow;
		if (!menu)
		{
			return;
		}

		const menuItemsIds = menu
			.getMenuItems()
			.map((item) => item.id)
			.filter((id) => Type.isInteger(id));
		const categoryIds = new Set(categories.map((item) => item.id));
		const idsToRemove = menuItemsIds.filter((id) => !categoryIds.has(id));
		const newCategories = categories.filter((item) => !menuItemsIds.includes(item.id) && item.id > 0);

		// remove menu item(s)
		if (idsToRemove.length > 0)
		{
			idsToRemove.forEach((idToRemove) => menu.removeMenuItem(idToRemove));
		}

		// add new item(s)
		if (newCategories.length > 0)
		{
			const targetItemId = menu
				.getMenuItems()
				.map((item) => item.id)
				.filter((id) => Type.isString(id))
				.at(1);

			newCategories.forEach((item) => {
				menu.addMenuItem({
					id: item.id,
					text: item.name,
					onclick()
					{
						BX.SidePanel.Instance.open(`/crm/deal/details/0/?category_id=${item.id}`);
					},
				}, targetItemId);
			});
		}
	}

	#tryRedirectToDefaultCategory(items: Array, currentCategoryId: number): void
	{
		const tryToRedirect = () => {
			const isStaticCategory = currentCategoryId <= 0;
			const isCurrentCategoryDefined = items.some(
				(row) => Number(row?.dataset?.categoryId) === Number(currentCategoryId),
			);

			if (!isCurrentCategoryDefined && !isStaticCategory)
			{
				const defaultPage = items.find((row) => row?.dataset?.isDefault);
				if (Type.isObject(defaultPage) && Type.isStringFilled(defaultPage.href))
				{
					window.location.href = defaultPage.href;
				}
			}
		};

		// wait until all sliders are closed before redirecting
		if (BX.SidePanel.Instance.getTopSlider())
		{
			EventEmitter.subscribeOnce(BX.SidePanel.Instance.getTopSlider(), 'SidePanel.Slider:onCloseComplete', () => {
				this.#tryRedirectToDefaultCategory(items, currentCategoryId);
			});

			return;
		}

		tryToRedirect();
	}
}
