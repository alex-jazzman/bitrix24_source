/**
 * @module crm/onboarding/src/condition
 */
jn.define('crm/onboarding/src/condition', (require, exports, module) => {
	const { ConditionBase } = require('onboarding/condition');
	const { Type } = require('type');
	const { TypeId } = require('crm/type');
	const {
		fetchCrmKanbanList,
		selectByEntityTypeId,
		selectStagesIdsBySemantics,
		getCrmKanbanUniqId,
	} = require('crm/statemanager/redux/slices/kanban-settings');
	const { selectEntities } = require('crm/statemanager/redux/slices/stage-settings');
	const { selectById: selectStageCounterById } = require('crm/statemanager/redux/slices/stage-counters');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { hasSMSProviderConnection, getProductGrid } = require('crm/onboarding/src/utils');

	class Condition extends ConditionBase
	{
		/**
		 * @param {Array} allowedTypes
		 */
		static matchesOneOfEntityType(allowedTypes)
		{
			return async (context) => {
				if (!context || !context.entityType)
				{
					return false;
				}

				if (Type.isArrayFilled(allowedTypes))
				{
					return allowedTypes.includes(context.entityType);
				}

				return false;
			};
		}

		static canImportEntity()
		{
			return async (context) => {
				if (!context || !context.canImport)
				{
					return false;
				}

				return true;
			};
		}

		static hasCommunicationMethodsAtLeast(quantity)
		{
			return async (context) => {
				if (!context || !context?.methods)
				{
					return false;
				}

				const enableMethods = context.methods ? Object.values(context.methods).filter(Boolean).length : 0;

				return enableMethods >= Number(quantity);
			};
		}

		/**
		 * @param {Number} neededQuantity
		 */
		static hasItemsQuantityAtLeast(neededQuantity)
		{
			return async (context) => {
				if (!context || !context?.items)
				{
					return false;
				}

				return context.items.length >= Number(neededQuantity);
			};
		}

		/**
		 * @param {Number} neededAmount
		 */
		static hasTabCountersAtLeast(neededAmount)
		{
			return async (context) => {
				if (!context || !context?.tabs)
				{
					return false;
				}
				const tabs = Type.isArray(context.tabs) ? context.tabs : [];
				const total = Condition.#getTotalActiveCounters(tabs);

				return total >= Number(neededAmount);
			};
		}

		/**
		 * @param {Number} minQuantity
		 */
		static hasCategoriesAtLeast(minQuantity)
		{
			return async (context) => {
				if (!context || !context?.entityTypeId)
				{
					return false;
				}

				await dispatch(fetchCrmKanbanList({ entityTypeId: context.entityTypeId }));
				const categories = selectByEntityTypeId(store.getState(), context.entityTypeId);

				return categories.length >= Number(minQuantity);
			};
		}

		/**
		 * @param {Number} minQuantity
		 * @param {Number} entityTypeId
		 * @param {Boolean} shouldSkipFinalStages
		 */
		static hasActiveStagesAtLeast(minQuantity, entityTypeId, shouldSkipFinalStages = true)
		{
			return async (context) => {
				const allStages = selectEntities(store.getState());
				await dispatch(fetchCrmKanbanList({ entityTypeId: context.entityTypeId }));
				const stageIdsBySemantics = selectStagesIdsBySemantics(
					store.getState(),
					getCrmKanbanUniqId(entityTypeId, 0),
				) || {};

				const filteredStagesBySemanticIds = Condition.#filterStagesByIds(allStages, stageIdsBySemantics);

				const filteredStages = Object.values(filteredStagesBySemanticIds);

				if (!Type.isArray(filteredStages) || filteredStages.length === 0 || !Number.isFinite(Number(minQuantity)))
				{
					return false;
				}

				const needed = Number(minQuantity);
				const positiveStagesCount = Condition.#countPositiveStages(filteredStages, shouldSkipFinalStages);

				return positiveStagesCount >= needed;
			};
		}

		static #filterStagesByIds(stages, stageIdsBySemantics)
		{
			const allowedIds = Object.values(stageIdsBySemantics).reduce((set, arr) => {
				if (Type.isArray(arr))
				{
					arr.forEach((id) => set.add(Number(id)));
				}

				return set;
			}, new Set());

			return Object.fromEntries(
				Object.entries(stages).filter(([key]) => allowedIds.has(Number(key))),
			);
		}

		static isClientRelatedEntity()
		{
			return async (context) => {
				if (!context || !context.entityTypeId)
				{
					return false;
				}

				return context.entityTypeId === TypeId.Contact
					|| context.entityTypeId === TypeId.Company
					|| context.isClientEnabled;
			};
		}

		static hasOpenLineAccess()
		{
			return async (context) => {
				return Boolean(context && context.hasOpenLinesAccess);
			};
		}

		static hasSMSProviderConnection()
		{
			return async (context) => {
				if (!context || !context?.entityId || !context?.entityTypeId)
				{
					return false;
				}

				return hasSMSProviderConnection(context.entityId, context.entityTypeId);
			};
		}

		static hasUnpaidProducts()
		{
			return async (context) => {
				if (!context || !context?.entityId || !context?.entityTypeId)
				{
					return false;
				}

				const result = await getProductGrid(context.entityId, context.entityTypeId);

				if (!result || !Type.isArrayFilled(result?.grid?.products))
				{
					return false;
				}

				return true;
			};
		}

		static hasCustomPresets()
		{
			return async (context) => {
				if (!context || !context?.hasCustomPresets)
				{
					return false;
				}

				return context.hasCustomPresets;
			};
		}

		static #countPositiveStages(allStages, shouldSkipFinalStages)
		{
			let positiveStagesCount = 0;

			allStages.forEach((stage) => {
				if (!stage)
				{
					return;
				}

				if (shouldSkipFinalStages && stage.semantics !== 'P')
				{
					return;
				}

				const stageId = stage.id;
				if (!stageId)
				{
					return;
				}

				const counter = selectStageCounterById(store.getState(), stageId);

				const value = counter?.count ? Number(counter.count) : 0;

				if (value > 0)
				{
					positiveStagesCount += 1;
				}
			});

			return positiveStagesCount;
		}

		static #getTotalActiveCounters(tabs)
		{
			return tabs.reduce((sum, tab) => {
				if (!tab || !tab?.label)
				{
					return sum;
				}

				const counter = Number(tab.label);

				return sum + (Number.isFinite(counter) ? counter : 0);
			}, 0);
		}
	}

	module.exports = {
		Condition,
	};
});
