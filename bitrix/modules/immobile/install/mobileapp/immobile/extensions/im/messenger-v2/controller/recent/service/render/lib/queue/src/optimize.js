/**
 * @module im/messenger-v2/controller/recent/service/render/lib/queue/optimize
 */
jn.define('im/messenger-v2/controller/recent/service/render/lib/queue/optimize', (require, exports, module) => {
	const { Type } = require('type');
	const { QueueOperation } = require('im/messenger-v2/controller/recent/service/render/lib/queue/const');
	/**
	 * @desc Optimizes the rendering queue by merging consecutive upsertItems operations of the same type.
	 *
	 * @example
	 * // Original queue:
	 * const queue = [
	 *   { operation: 'setItems', items: [{id: '1', message: {text:'A'}}] },
	 *   { operation: 'upsertItems', items: [{id: '1', message: {text:'B'}}] },
	 *   { operation: 'upsertItems', items: [{id: '2', message: {text:'C'}}] },
	 *   { operation: 'upsertItems', items: [{id: '1', message: {text:'D'}}] },
	 *   { operation: 'removeItems', ids: ['1'] },
	 *   { operation: 'upsertItems', items: [{id: '3', message: {text:'E'}}] }
	 * ];
	 *
	 * // Optimized result:
	 * const result = [
	 *   { operation: 'setItems', items: [{id: '1',message: {text:'A'}}] },
	 *   {
	 *     operation: 'upsertItems',
	 *     items: [
	 *       {id: '1', message: {text:'D'}}, // updated version
	 *       {id: '2', message: {text:'C'}}  // new element
	 *     ]
	 *   },
	 *   { operation: 'removeItems', ids: ['1'] },
	 *   { operation: 'upsertItems', items: [{id: '3', message: {text:'E'}}] }
	 * ];
	 *
	 * @param {Array<RecentQueueItem>}queue
	 * @return {Array<RecentQueueItem>}
	 */
	function optimizeQueue(queue)
	{
		if (!Type.isArrayFilled(queue))
		{
			return [];
		}

		if (queue.length === 1)
		{
			return queue;
		}

		const optimizedQueue = [];
		let currentGroup = null;

		for (const currentItem of queue)
		{
			const operation = currentItem.operation;

			const isUpsert = operation === QueueOperation.upsertItems;

			if (!isUpsert)
			{
				if (currentGroup)
				{
					optimizedQueue.push(currentGroup);
					currentGroup = null;
				}
				optimizedQueue.push({ ...currentItem });
				continue;
			}

			if (!currentGroup)
			{
				currentGroup = { ...currentItem };
				continue;
			}

			currentGroup = mergeUpsertOperations(currentGroup, currentItem);
		}

		if (currentGroup)
		{
			optimizedQueue.push(currentGroup);
		}

		return optimizedQueue;
	}

	function mergeUpsertOperations(target, source)
	{
		return {
			...target,
			...mergeItems(target, source),
			...mergeIds(target, source),
			...mergeOptions(target, source),
		};
	}

	/**
	 * @param {RecentQueueItem} target
	 * @param {RecentQueueItem} source
	 * @return {{items: Array<RecentModelState>}}
	 */
	function mergeItems(target, source)
	{
		if (!source.items)
		{
			return { items: [...(target.items ?? [])] };
		}

		if (!target.items)
		{
			return { items: [...(source.items ?? [])] };
		}

		const itemsMap = new Map();

		target.items.forEach((item) => itemsMap.set(item.id, item));

		source.items.forEach((item) => itemsMap.set(item.id, item));

		return { items: [...itemsMap.values()] };
	}

	/**
	 * @param {RecentQueueItem} target
	 * @param {RecentQueueItem} source
	 * @return {{ids: Array<string>}}
	 */
	function mergeIds(target, source)
	{
		if (!source.ids)
		{
			return { ids: [...(target.ids ?? [])] };
		}

		if (!target.ids)
		{
			return { ids: [...(source.ids ?? [])] };
		}

		const idsSet = new Set([...target.ids, ...source.ids]);

		return { ids: [...idsSet] };
	}

	/**
	 * @param {RecentQueueItem} target
	 * @param {RecentQueueItem} source
	 * @return {{options}|{options: (*)}}
	 */
	function mergeOptions(target, source)
	{
		return {
			options: {
				...target.options,
				...source.options,
			},
		};
	}

	module.exports = { optimizeQueue };
});
