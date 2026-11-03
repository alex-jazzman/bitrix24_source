/**
 * @module mail/message-grid/src/list-sync
 */
jn.define('mail/message-grid/src/list-sync', (require, exports, module) => {
	class MessageGridListSync
	{
		constructor()
		{
			this.listRef = null;
			// Row ids of the grid are numeric for a message and prefixed for a draft or a
			// conversation, so the set of removed rows is keyed by their string form.
			this.markedAsRemovedIds = new Set();
		}

		bindListRef(ref)
		{
			this.listRef = ref;
		}

		isReady()
		{
			return Boolean(this.listRef) && !this.listRef.isLoading();
		}

		reload(params = {})
		{
			if (!this.listRef)
			{
				return null;
			}

			const { skipUseCache = false, ...initialStateParams } = params;

			return this.listRef.reload(initialStateParams, { useCache: !skipUseCache });
		}

		updateFloatingButton(params)
		{
			this.listRef?.updateFloatingButton(params);
		}

		clearRemoved()
		{
			this.markedAsRemovedIds.clear();
		}

		removeItems(items = [])
		{
			if (items.length === 0 || !this.listRef)
			{
				return Promise.resolve(null);
			}

			const removedIds = items.map(({ id }) => id);

			items
				.filter((item) => item.isRemoved)
				.forEach(({ id }) => this.markedAsRemovedIds.add(String(id)));

			return this.listRef.deleteItem(removedIds);
		}

		updateItems(items = [])
		{
			if (items.length === 0 || !this.listRef)
			{
				return Promise.resolve(null);
			}

			return this.listRef.updateItemsData(items);
		}

		async addOrRestoreItems(items = [])
		{
			if (items.length === 0 || !this.listRef)
			{
				return null;
			}

			const uniqueItems = [...new Map(items.map((item) => [String(item.id), item])).values()];
			const restoredItems = [];
			const addedItems = [];

			uniqueItems.forEach((item) => {
				if (this.markedAsRemovedIds.has(String(item.id)))
				{
					restoredItems.push(item);
				}
				else if (!this.listRef.hasItem(item.id))
				{
					addedItems.push(item);
				}
			});

			if (restoredItems.length > 0)
			{
				await this.listRef.updateItemsData(restoredItems);
			}

			await this.prependUnseenItems(addedItems);

			uniqueItems.forEach(({ id }) => this.markedAsRemovedIds.delete(String(id)));

			return null;
		}

		/**
		 * @param {Array<{id: number|string}>} items rows the list has not shown yet
		 * @return {Promise}
		 */
		prependUnseenItems(items = [])
		{
			if (items.length === 0 || !this.listRef)
			{
				return Promise.resolve(null);
			}

			return this.listRef.updateItemsData(items);
		}
	}

	module.exports = { MessageGridListSync };
});
