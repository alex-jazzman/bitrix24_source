/**
 * @module crm/entity-actions/change-stage
 */
jn.define('crm/entity-actions/change-stage', (require, exports, module) => {
	const { Type } = require('crm/type');
	const { NotifyManager } = require('notify-manager');
	const { requireLazy } = require('require-lazy');
	const store = require('statemanager/redux/store');
	const { fetchCrmKanbanList } = require('crm/statemanager/redux/slices/kanban-settings');

	/**
	 * @function getActionToChangeStage
	 * @returns {Object}
	 */
	const getActionToChangeStage = () => {
		const loadCategoryList = async (entityTypeId) => {
			NotifyManager.showLoadingIndicator();
			try
			{
				const response = await store.dispatch(fetchCrmKanbanList({ entityTypeId })).unwrap();

				return response.data;
			}
			finally
			{
				NotifyManager.hideLoadingIndicatorWithoutFallback();
			}
		};

		/**
		 * @function onAction
		 * @param params.title string
		 * @param params.entityTypeId number
		 * @param {PerfPoint} [perfPoint]
		 * @returns {Promise}
		 */
		const onAction = async (params, perfPoint = null) => {
			const { title, entityTypeId, layoutWidget, allowedCategoryIds } = params;
			let selectedCategoryId = null;

			if (!Type.isEntitySupportedById(entityTypeId))
			{
				return null;
			}

			perfPoint?.start();
			try
			{
				perfPoint?.startPoint('Load Categories');
				const { categories: loadedCategories } = await loadCategoryList(entityTypeId);
				perfPoint?.endPoint('Load Categories');

				const categories = Array.isArray(loadedCategories) && Array.isArray(allowedCategoryIds)
					? loadedCategories.filter((category) => allowedCategoryIds.includes(category.id))
					: loadedCategories;

				if (!Array.isArray(categories) || categories.length === 0)
				{
					return null;
				}

				if (categories.length === 1)
				{
					return categories[0].id;
				}

				perfPoint?.startPoint('Load Category View');
				const { CategoryListView } = await requireLazy('crm:category-list-view');
				perfPoint?.endPoint('Load Category View');

				const getSelectedCategoryId = () => new Promise((resolve, reject) => {
					perfPoint?.startPoint('Open Category Widget');
					let openingPromise = CategoryListView.open(
						{
							entityTypeId,
							allowedCategoryIds,
							readOnly: true,
							currentCategoryId: null,
							showPreselectedCategory: false,
							showCounters: false,
							showTunnels: false,
							onSelectCategory: (category, categoryListLayout) => {
								selectedCategoryId = category.categoryId;
								categoryListLayout.close();
							},
							onViewHidden: () => {
								resolve(selectedCategoryId);
							},
						},
						{ title },
						layoutWidget,
					);
					if (perfPoint)
					{
						openingPromise = openingPromise.finally(() => {
							perfPoint.endPoint('Open Category Widget');
							perfPoint.end();
						});
					}

					openingPromise.catch(reject);
				});

				selectedCategoryId = await getSelectedCategoryId();

				return selectedCategoryId;
			}
			finally
			{
				if (perfPoint)
				{
					perfPoint.endPoint('Load Categories');
					perfPoint.endPoint('Load Category View');
					perfPoint.endPoint('Open Category Widget');
					perfPoint.end();
				}
			}
		};

		return { onAction };
	};

	module.exports = { getActionToChangeStage };
});
