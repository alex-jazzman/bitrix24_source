/**
 * @module mail/message-grid/src/list-sync
 */
jn.define('mail/message-grid/src/list-sync', (require, exports, module) => {
	class MessageGridListSync
	{
		constructor()
		{
			this.listRef = null;
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
			const markedAsRemovedIds = items
				.filter((item) => item.isRemoved)
				.map(({ id }) => id);

			if (markedAsRemovedIds.length > 0)
			{
				markedAsRemovedIds.forEach((id) => this.markedAsRemovedIds.add(id));
			}

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

			const restoredItems = [];
			const addedItems = [];

			items.forEach((item) => {
				if (this.markedAsRemovedIds.has(item.id))
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

			if (addedItems.length > 0)
			{
				await this.listRef.updateItemsData(addedItems);
			}

			items.forEach(({ id }) => this.markedAsRemovedIds.delete(id));

			return null;
		}
	}

	module.exports = { MessageGridListSync };
});
