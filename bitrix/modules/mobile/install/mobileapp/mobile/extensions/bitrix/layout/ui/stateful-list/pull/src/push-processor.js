/**
 * @module layout/ui/stateful-list/pull/src/push-processor
 */
jn.define('layout/ui/stateful-list/pull/src/push-processor', (require, exports, module) => {
	const { debounce } = require('utils/function');
	const { command } = require('layout/ui/stateful-list/pull/src/command');
	const { Type } = require('type');

	const queueItemsStatus = {
		WAITING: 'WAITING',
		EXECUTED: 'EXECUTED',
	};

	class PushProcessor
	{
		constructor(data)
		{
			this.eventCallbacks = data.eventCallbacks;
			this.onQueueStarted = data.onQueueStarted;
			this.onQueueFinished = data.onQueueFinished;

			if (Type.isFunction(data.setListActiveListener))
			{
				data.setListActiveListener(this.setIsActive.bind(this));
			}

			this.queue = [];
			this.isActive = true;
			this.isProcessing = false;
			this.debounceExecuteNextInQueue = debounce(this.executeNextInQueue, 200, this);
		}

		setIsActive(isActive)
		{
			this.isActive = isActive;

			if (isActive && this.queue.length > 0)
			{
				this.executeNextInQueue();
			}
		}

		addToQueue(eventName, items)
		{
			if (this.eventCallbacks[eventName])
			{
				this.queue.push({
					eventName,
					items,
					status: queueItemsStatus.WAITING,
				});
				this.debounceExecuteNextInQueue();
			}
		}

		removeFirstAndExecNext()
		{
			this.removeFirstCallbackFromQueue();
			this.executeNextInQueue();
		}

		removeFirstCallbackFromQueue()
		{
			if (this.queue.length > 0)
			{
				this.queue.shift();
			}
		}

		executeNextInQueue()
		{
			if (!this.isActive)
			{
				return;
			}

			if (this.queue.length > 0 && this.queue[0].status === queueItemsStatus.WAITING)
			{
				if (!this.isProcessing)
				{
					this.isProcessing = true;
					if (Type.isFunction(this.onQueueStarted))
					{
						this.onQueueStarted();
					}
				}

				this.optimizeQueue();
				const firstInQueue = this.queue[0];
				firstInQueue.status = queueItemsStatus.EXECUTED;
				const result = this.eventCallbacks[firstInQueue.eventName](firstInQueue.items);
				if (result instanceof Promise)
				{
					result.then((response) => {
						this.removeFirstAndExecNext();
					})
						.catch((errors) => {
							console.error(errors);
							this.removeFirstAndExecNext();
						});
				}
				else
				{
					this.removeFirstAndExecNext();
				}
			}
			else if (this.queue.length === 0 && this.isProcessing)
			{
				this.isProcessing = false;
				if (Type.isFunction(this.onQueueFinished))
				{
					this.onQueueFinished();
				}
			}
		}

		optimizeQueue()
		{
			const hasReloadCommand = this.queue.some((item) => item.eventName === command.RELOAD);
			if (hasReloadCommand)
			{
				this.queue = [
					{
						eventName: command.RELOAD,
						status: queueItemsStatus.WAITING,
					},
				];

				return;
			}

			const deletedItems = [];
			const updatedItems = [];
			const addedItems = [];

			this.queue.forEach((queueItem) => {
				let currentItems = null;
				switch (queueItem.eventName)
				{
					case command.ADDED:
						currentItems = addedItems;
						break;
					case command.UPDATED:
					case command.VIEW:
						currentItems = updatedItems;
						break;
					case command.DELETED:
						currentItems = deletedItems;
						break;
					default:
						currentItems = null;
				}

				if (currentItems)
				{
					queueItem.items.forEach((item) => {
						if (!currentItems.some((element) => element.id === item.id))
						{
							currentItems.push(item);
						}
					});
				}
			});

			if (deletedItems.length > 0 && (addedItems.length > 0 || updatedItems.length > 0))
			{
				deletedItems.forEach((deletedItem) => {
					const indexInUpdated = updatedItems.findIndex((item) => item.id === deletedItem.id);
					if (indexInUpdated > -1)
					{
						updatedItems.splice(indexInUpdated, 1);
					}

					const indexInAdded = addedItems.findIndex((item) => item.id === deletedItem.id);
					if (indexInAdded > -1)
					{
						addedItems.splice(indexInAdded, 1);
					}
				});
			}

			if (addedItems.length > 0 || updatedItems.length > 0)
			{
				addedItems.forEach((addedItem) => {
					const indexInUpdated = updatedItems.findIndex((item) => item.id === addedItem.id);
					if (indexInUpdated > -1)
					{
						updatedItems.splice(indexInUpdated, 1);
					}
				});
			}

			this.queue = [];
			if (deletedItems.length > 0)
			{
				this.queue.push({
					eventName: command.DELETED,
					items: deletedItems,
					status: queueItemsStatus.WAITING,
				});
			}

			if (addedItems.length > 0)
			{
				this.queue.push({
					eventName: command.ADDED,
					items: addedItems,
					status: queueItemsStatus.WAITING,
				});
			}

			if (updatedItems.length > 0)
			{
				this.queue.push({
					eventName: command.UPDATED,
					items: updatedItems,
					status: queueItemsStatus.WAITING,
				});
			}
		}
	}

	module.exports = { PushProcessor, queueItemsStatus };
});
