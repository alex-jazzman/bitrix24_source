/**
 * @bxjs_lang_path extension.php
 * @module crm/entity-tab/sort
 */

jn.define('crm/entity-tab/sort', (require, exports, module) => {
	const { Loc } = require('loc');
	const { getEntityMessage } = require('crm/loc');
	const { Icon } = require('ui-system/blocks/icon');

	/**
	 * @class TypeSort
	 */
	const TypeSort = {
		Id: 'BY_ID',
		LastActivityTime: 'BY_LAST_ACTIVITY_TIME',
	};

	class ItemsSortManager
	{
		static createFromEntityTypeObject(entityTypeObject, saveSortTypePath)
		{
			const data = { saveSortTypePath };
			if (entityTypeObject)
			{
				data.sortType = entityTypeObject.data.sortType;
				data.entityTypeId = entityTypeObject.id;
				data.isLastActivityEnabled = entityTypeObject.isLastActivityEnabled;
				data.categoryId = entityTypeObject.data.currentCategoryId;
			}
			else
			{
				data.sortType = null;
				data.entityTypeId = null;
				data.isLastActivityEnabled = false;
				data.categoryId = 0;
			}

			return new ItemsSortManager(data);
		}

		constructor({ entityTypeId, categoryId, sortType, saveSortTypePath, isLastActivityEnabled })
		{
			this.entityTypeId = entityTypeId;
			this.categoryId = categoryId;
			// A list is ordered where there is an order to choose: `Kanban\Entity::getSortSettings()`
			// answers with a type for every list (`BY_ID` at the least), and the second one is offered
			// only where the last activity is kept - the very condition `SetSortTypeAction` refuses the
			// save by, and the one the "---" menu of the legacy mode shows its row by.
			this.supported = Boolean(isLastActivityEnabled);
			this.typeSort = sortType || TypeSort.LastActivityTime;
			this.savePath = saveSortTypePath;
			this.isLastActivityEnabled = isLastActivityEnabled;
			/** @type {Promise|null} the save the drawer waits for before it applies the filter */
			this.saving = null;
		}

		getSortType()
		{
			return this.typeSort;
		}

		/**
		 * Whether this list is ordered at all: the filter drawer shows the section only where it is.
		 *
		 * @return {boolean}
		 */
		isSupported()
		{
			return this.supported;
		}

		/**
		 * Reading half of the `ListSorting` contract the filter drawer drives
		 * (`layout/ui/field-filter`).
		 *
		 * @return {string}
		 */
		getType()
		{
			return this.getSortType();
		}

		/**
		 * Writing half of the same contract: the drawer names the type instead of toggling it,
		 * because it shows both of them as rows.
		 *
		 * Answers with the save, because the drawer applies the filter right after the tap and the
		 * list is then requested with the order the server holds.
		 *
		 * @param {string} type
		 * @return {Promise}
		 */
		setType(type)
		{
			if (type === this.getSortType())
			{
				return this.whenSaved();
			}

			return this.saveSortType(type);
		}

		/**
		 * The save under way, for whoever has to wait for it - the drawer before it applies the filter.
		 * An order nobody is saving is an order already there, and the wait for it costs nothing.
		 *
		 * @return {Promise}
		 */
		whenSaved()
		{
			return this.saving ?? Promise.resolve();
		}

		getSortMenuAction(callback)
		{
			return {
				id: 'kanban-sort-toggle',
				title: Loc.getMessage('M_CRM_ENTITY_TAB_SORT_TOGGLE_TEXT'),
				checked: (this.typeSort === TypeSort.LastActivityTime),
				sectionCode: 'action',
				icon: Icon.PING,
				onItemSelected: this.onItemSelected.bind(this, callback),
			};
		}

		onItemSelected(callback)
		{
			this.toggleSortType(callback);
		}

		/**
		 * The "---" menu offers one row and flips the order on a tap; the drawer offers both as
		 * rows and names the one it wants - hence two entry points over one save.
		 *
		 * @param {Function} [callback]
		 */
		toggleSortType(callback = null)
		{
			const type = (
				this.getSortType() === TypeSort.LastActivityTime
					? TypeSort.Id
					: TypeSort.LastActivityTime
			);

			this.saveSortType(type, callback);
		}

		/**
		 * The pointer moves at once and goes back if the server refuses the change: the filter drawer
		 * draws the order from `getType()` on the render that follows the tap, so an order that waits
		 * for the answer is an order the user does not see move.
		 *
		 * @param {string} type
		 * @param {Function} [callback]
		 */
		saveSortType(type, callback = null)
		{
			const data = {
				entityTypeId: this.entityTypeId,
				categoryId: this.categoryId,
				type,
			};
			const previousType = this.typeSort;

			this.typeSort = type;

			// one save after another, and only when there is a previous one to wait for: two saves in
			// flight order the same list, and the refusal of the older one would put back an order the
			// user has already changed
			const request = () => BX.ajax.runAction(this.savePath, { data });
			const save = (this.saving ? this.saving.then(request) : request())
				.then((response) => {
					if (response.errors.length > 0)
					{
						this.rollbackTo(previousType, type);
						console.error(response);

						return;
					}

					this.showNotify(type);

					if (callback)
					{
						callback(type);
					}
				})
				.catch((response) => {
					this.rollbackTo(previousType, type);
					console.error(response);
				})
			;

			// the queue holds what the next save waits for, so it holds the promise that ends with the
			// forgetting and not the one before it: comparing the field with `save` never matched, the
			// queue never emptied, and every save behind the first one reached the server a microtask
			// late instead of on the frame of the tap
			const settled = save.finally(() => {
				// a newer save is already the one to wait for, and forgetting it here would let the one
				// after it order the same list in parallel
				if (this.saving === settled)
				{
					this.saving = null;
				}
			});

			this.saving = settled;

			return settled;
		}

		/**
		 * Puts the order back where a save was refused - but only while the list still shows the order
		 * that save had set: a newer pick has already answered the question this rollback is about.
		 *
		 * @param {string} previousType
		 * @param {string} savedType
		 */
		rollbackTo(previousType, savedType)
		{
			if (this.typeSort === savedType)
			{
				this.typeSort = previousType;
			}
		}

		showNotify(type)
		{
			let message = 'M_CRM_ENTITY_TAB_SORT_BY_ID_MESSAGE';
			let title = 'M_CRM_ENTITY_TAB_SORT_BY_ID_TITLE';

			if (type === TypeSort.LastActivityTime)
			{
				message = 'M_CRM_ENTITY_TAB_SORT_BY_LAST_ACTIVITY_MESSAGE';
				title = 'M_CRM_ENTITY_TAB_SORT_BY_LAST_ACTIVITY_TITLE';
			}

			Notify.showUniqueMessage(
				getEntityMessage(message, this.entityTypeId),
				Loc.getMessage(title),
				{ time: 5 },
			);
		}
	}

	module.exports = { TypeSort, ItemsSortManager };
});
