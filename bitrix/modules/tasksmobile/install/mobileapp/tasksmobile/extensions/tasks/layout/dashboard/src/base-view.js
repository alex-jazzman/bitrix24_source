/**
 * @module tasks/layout/dashboard/base-view
 */
jn.define('tasks/layout/dashboard/base-view', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Onboarding, CaseName } = require('tasks/onboarding');

	/**
	 * @class TasksDashboardBaseView
	 * @abstract
	 */
	class TasksDashboardBaseView extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.bindRef = this.bindRef.bind(this);

			/** @type {StatefulList|Kanban|null} */
			this.viewComponent = null;
			this.completedTask = null;

			this.onSupposedlyCompletedTaskAppeared = this.onSupposedlyCompletedTaskAppeared.bind(this);
			this.onAllItemsPositionStable = this.onAllItemsPositionStable.bind(this);
		}

		componentDidMount()
		{
			this.showOnboarding();
		}

		showOnboarding()
		{
			if (this.viewComponent)
			{
				void Onboarding.tryToShow(CaseName.ON_EMPTY_TASK_LIST, {
					itemQuantity: this.getItems()?.length ?? 0,
					onShow: (ctx, onHide) => this.displayFloatingButtonAhaMoment({
						title: Loc.getMessage('M_ONBOARDING_NO_TASKS_TITLE'),
						description: Loc.getMessage('M_ONBOARDING_NO_TASKS_DESCRIPTION'),
						delay: 300,
						onHide,
					}),
				});

				BX.addCustomEvent('TasksDashboard::onSupposedlyCompletedTaskAppeared', this.onSupposedlyCompletedTaskAppeared);
				BX.addCustomEvent('UI.SimpleList::onAllItemsPositionStable', this.onAllItemsPositionStable);
			}
		}

		/**
		 * @param {object} task
		 */
		onSupposedlyCompletedTaskAppeared(task)
		{
			const completedTask = this.hasItem(task?.id) ? task : null;

			if (completedTask)
			{
				this.completedTask = completedTask;
			}
		}

		onAllItemsPositionStable()
		{
			if (!this.completedTask)
			{
				return;
			}

			void Onboarding.tryToShow(CaseName.SUPPOSEDLY_COMPLETED_TASKS, {
				onShow: (ctx, onHide) => this.displayItemAhaMoment(this.completedTask?.id, {
					title: Loc.getMessage('M_ONBOARDING_SUPPOSEDLY_COMPLETED_TASK_TITLE'),
					description: Loc.getMessage('M_ONBOARDING_SUPPOSEDLY_COMPLETED_TASK_DESCRIPTION'),
					delay: 1000,
					onHide,
				}),
			});
		}

		/**
		 * @protected
		 * @param {object} ref
		 */
		bindRef(ref)
		{
			if (ref)
			{
				this.viewComponent = ref;
			}
		}

		isLoading()
		{
			if (this.viewComponent)
			{
				return this.viewComponent.isLoading();
			}

			return true;
		}

		/**
		 * @public
		 * @abstract
		 * return {KanbanStage|null}
		 */
		getActiveStage()
		{}

		/**
		 * @public
		 * @abstract
		 * return {boolean}
		 */
		isAllStagesDisplayed()
		{}

		/**
		 * @public
		 * @abstract
		 * @param {object[]} buttons
		 */
		updateTopButtons(buttons)
		{}

		/**
		 * @public
		 * @abstract
		 * @param {object} params
		 */
		reload(params = {})
		{}

		/**
		 * @public
		 * @returns {Object[]|null}
		 */
		getItems()
		{
			if (this.viewComponent)
			{
				return this.viewComponent.getItems();
			}

			return null;
		}

		/**
		 * @public
		 * @param {string|number} id
		 * @return {boolean}
		 */
		hasItem(id)
		{
			if (this.viewComponent)
			{
				return this.viewComponent.hasItem(id);
			}

			return false;
		}

		/**
		 * @public
		 * @param {string[]|number[]} ids
		 * @return {Promise}
		 */
		updateItems(ids = [])
		{
			const existingIds = ids.filter((id) => this.hasItem(id));
			if (existingIds.length === 0)
			{
				return Promise.resolve();
			}

			if (this.viewComponent)
			{
				return this.viewComponent.updateItems(existingIds);
			}

			return Promise.resolve();
		}

		/**
		 * @public
		 * @param {object[]} items
		 */
		updateItemsData(items)
		{
			const existingItems = items.filter((item) => this.hasItem(item.id));
			if (existingItems.length === 0)
			{
				return Promise.resolve();
			}

			if (this.viewComponent)
			{
				return this.viewComponent.updateItemsData(existingItems);
			}

			return Promise.resolve();
		}

		replaceItems(items)
		{
			const existingItems = items.filter((item) => this.hasItem(item.guid));
			if (existingItems.length === 0)
			{
				return Promise.resolve();
			}

			if (this.viewComponent)
			{
				return this.viewComponent.replaceItems(existingItems.map((item) => ({
					...item,
					idToReplace: item.guid,
				})));
			}

			return Promise.resolve();
		}

		removeItems(items)
		{
			const existingItems = items.filter((item) => this.hasItem(item.id));
			if (existingItems.length === 0)
			{
				return Promise.resolve();
			}

			if (this.viewComponent)
			{
				return Promise.allSettled(items.map(({ id }) => this.viewComponent.removeItem(id)));
			}

			return Promise.resolve();
		}

		addItems(items)
		{
			const addedItemIds = items
				.map((item) => item.id)
				.filter((id) => !this.hasItem(id));

			if (addedItemIds.length === 0 || !this.viewComponent)
			{
				return Promise.resolve();
			}

			return this.viewComponent.updateItems(
				addedItemIds,
				false,
				true,
				true,
			);
		}

		addItemsWithoutServerRequest(items)
		{
			const nonExistingItems = items.filter((item) => !this.hasItem(item.id));
			if (nonExistingItems.length === 0)
			{
				return Promise.resolve();
			}

			if (this.viewComponent)
			{
				return this.viewComponent.updateItemsData(nonExistingItems);
			}

			return Promise.resolve();
		}

		restoreItems(items)
		{
			this.addItemsWithoutServerRequest(items);
		}

		async addCreatingItems(items)
		{
			await this.addItemsWithoutServerRequest(items);

			const itemIds = items.map((item) => item.id);
			await this.scrollToTopItem(itemIds, true, true);
		}

		async scrollToTopItem(itemIds, animated = true, blink = false)
		{
			await this.viewComponent?.scrollToTopItem(itemIds, animated, blink);
		}

		getItemRef(itemId)
		{
			return this.viewComponent?.getItemRef(itemId);
		}

		getItemRootViewRef(itemId)
		{
			return this.viewComponent?.getItemRootViewRef(itemId);
		}

		getItemMenuViewRef(itemId)
		{
			return this.viewComponent?.getItemMenuViewRef(itemId);
		}

		/**
		 * @param {Object} ahaMomentProps
		 * @returns {void}
		 */
		displayFloatingButtonAhaMoment(ahaMomentProps)
		{
			return this.viewComponent?.displayFloatingButtonAhaMoment({
				delay: 100,
				...ahaMomentProps,
			});
		}

		/**
		 * @param {number} itemId
		 * @param {Object} ahaMomentProps
		 * @returns {void}
		 */
		displayItemAhaMoment(itemId, ahaMomentProps)
		{
			return this.viewComponent?.displayItemAhaMoment({
				itemId,
				...ahaMomentProps,
			});
		}
	}

	module.exports = { TasksDashboardBaseView };
});
