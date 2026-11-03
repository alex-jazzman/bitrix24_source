/**
 * @module im/messenger/application/lib/forward-message-manager/src/forward-message-manager
 */
jn.define('im/messenger/application/lib/forward-message-manager/src/forward-message-manager', (
	require,
	exports,
	module,
) => {
	const { Uuid } = require('utils/uuid');
	const { EventType } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { ForwardMessageOperation } = require(
		'im/messenger/application/lib/forward-message-manager/src/forward-message-operation',
	);
	const {
		ForwardResultMapper,
		ForwardDeliveryStatus,
	} = require('im/messenger/application/lib/forward-message-manager/src/result-mapper');

	const MAX_CONCURRENT_RECIPIENTS = 3;
	const MAX_RECIPIENTS = 20;

	class ForwardMessageManager
	{
		/**
		 * @param {ForwardMessageManagerOptions} options
		 */
		constructor({
			sendingService,
			uuidFactory = () => Uuid.getV4(),
			onOperationFinished = () => {},
			platformProvider = () => Application.getPlatform(),
		} = {})
		{
			this.sendingService = sendingService;
			this.uuidFactory = uuidFactory;
			this.onOperationFinished = onOperationFinished;
			this.platformProvider = platformProvider;
			this.operations = new Map();
			this.queue = [];
			this.inFlightTasks = new Set();
			this.activeRecipients = 0;
			this.isAppPaused = Application.isBackground();
			this.isPausedOnIos = this.isAppPaused && this.#isIos();
			this.pendingFinishedOperations = new Map();
			this.appActiveWaiters = new Set();
			this.isDestroyed = false;
			this.logger = getLoggerWithContext('forward-message-manager', this);

			this.handleAppPaused = this.handleAppPaused.bind(this);
			this.handleAppActive = this.handleAppActive.bind(this);
			BX.addCustomEvent(EventType.app.paused, this.handleAppPaused);
			BX.addCustomEvent(EventType.app.active, this.handleAppActive);
		}

		/**
		 * @param {ForwardMessageStartParams} params
		 * @return {string}
		 */
		start({ fromDialogId, messageIds, recipients })
		{
			if (!Array.isArray(messageIds) || messageIds.length === 0)
			{
				throw new TypeError('ForwardMessageManager.start: messageIds are required');
			}

			if (!Array.isArray(recipients) || recipients.length < 2 || recipients.length > MAX_RECIPIENTS)
			{
				throw new RangeError(`ForwardMessageManager.start: recipients must contain 2-${MAX_RECIPIENTS} items`);
			}

			const operation = new ForwardMessageOperation({
				operationId: this.uuidFactory(),
				fromDialogId,
				messageIds: [...messageIds],
				recipients: recipients.map((recipient) => ({ ...recipient })),
				uuidFactory: this.uuidFactory,
			});
			this.operations.set(operation.id, operation);

			for (const recipientState of operation.recipients)
			{
				this.queue.push({
					operationId: operation.id,
					dialogId: recipientState.recipient.id,
					deliveryUuids: recipientState.deliveries.map(({ uuid }) => uuid),
				});
			}

			this.#pumpQueue();

			return operation.id;
		}

		async retry(operationId)
		{
			const operation = this.operations.get(operationId);
			if (!operation || !operation.finalized)
			{
				throw new Error('ForwardMessageManager.retry: operation is unavailable');
			}

			const tasks = operation.getRetryTasks();
			if (tasks.length === 0)
			{
				throw new Error('ForwardMessageManager.retry: operation has no retryable deliveries');
			}

			const completion = operation.beginRetry(tasks);
			for (const task of tasks)
			{
				this.queue.push({
					operationId,
					...task,
				});
			}

			this.#pumpQueue();

			return completion;
		}

		getResult(operationId)
		{
			return this.operations.get(operationId)?.result ?? null;
		}

		release(operationId)
		{
			const operation = this.operations.get(operationId);
			if (operation && !operation.finalized)
			{
				operation.releaseWhenFinalized = true;

				return;
			}

			this.pendingFinishedOperations.delete(operationId);
			this.operations.delete(operationId);
		}

		handleAppPaused()
		{
			this.isAppPaused = true;
			for (const operation of this.operations.values())
			{
				if (!operation.finalized)
				{
					operation.interruptedByBackground = true;
				}
			}

			if (this.#isIos())
			{
				this.isPausedOnIos = true;
			}
		}

		handleAppActive()
		{
			if (!this.isAppPaused)
			{
				return;
			}

			const shouldInterruptIosOperations = this.isPausedOnIos;
			this.isAppPaused = false;
			this.isPausedOnIos = false;
			this.#resolveAppActiveWaiters(true);
			if (shouldInterruptIosOperations)
			{
				this.#interruptIosOperations();
			}

			this.#notifyPendingFinishedOperations();
			this.#pumpQueue();
		}

		unsubscribeEvents()
		{
			BX.removeCustomEvent(EventType.app.paused, this.handleAppPaused);
			BX.removeCustomEvent(EventType.app.active, this.handleAppActive);
			this.isDestroyed = true;
			this.queue = [];
			for (const operation of this.operations.values())
			{
				operation.cancelCompletion();
			}
			for (const task of this.inFlightTasks)
			{
				task.hasActiveSlot = false;
			}
			this.inFlightTasks.clear();
			this.activeRecipients = 0;
			this.#resolveAppActiveWaiters(false);
			this.pendingFinishedOperations.clear();
			this.operations.clear();
		}

		/**
		 * @return {Promise<boolean>}
		 */
		waitForAppActive()
		{
			if (this.isDestroyed)
			{
				return Promise.resolve(false);
			}

			if (!this.isAppPaused)
			{
				return Promise.resolve(true);
			}

			return new Promise((resolve) => {
				this.appActiveWaiters.add(resolve);
			});
		}

		#interruptIosOperations()
		{
			for (const operation of this.operations.values())
			{
				if (operation.finalized)
				{
					continue;
				}

				for (const recipientState of operation.recipients)
				{
					if ([ForwardDeliveryStatus.queued, ForwardDeliveryStatus.inFlight].includes(recipientState.status))
					{
						ForwardResultMapper.markInterrupted(recipientState);
					}
				}

				this.#finalizeIfComplete(operation);
			}

			for (const task of this.inFlightTasks)
			{
				const recipientState = this.operations.get(task.operationId)?.getRecipient(task.dialogId);
				if (recipientState?.status !== ForwardDeliveryStatus.inFlight)
				{
					this.#releaseActiveTask(task);
				}
			}
		}

		#pumpQueue()
		{
			if (this.isDestroyed || this.isPausedOnIos)
			{
				return;
			}

			while (this.activeRecipients < MAX_CONCURRENT_RECIPIENTS && this.queue.length > 0)
			{
				const task = this.queue.shift();
				const operation = this.operations.get(task.operationId);
				const recipientState = operation?.getRecipient(task.dialogId);
				if (!operation || operation.finalized || recipientState?.status !== ForwardDeliveryStatus.queued)
				{
					continue;
				}

				task.hasActiveSlot = true;
				this.inFlightTasks.add(task);
				this.activeRecipients++;
				void this.#sendRecipient(operation, recipientState, task)
					.catch((error) => this.logger.error('sendRecipient', error))
					.finally(() => {
						this.#releaseActiveTask(task);
						this.#pumpQueue();
					})
				;
			}
		}

		#releaseActiveTask(task)
		{
			this.inFlightTasks.delete(task);
			if (!task.hasActiveSlot)
			{
				return;
			}

			task.hasActiveSlot = false;
			this.activeRecipients--;
		}

		async #sendRecipient(operation, recipientState, task)
		{
			const deliverySet = new Set(task.deliveryUuids);
			const deliveries = recipientState.deliveries.filter(({ uuid }) => deliverySet.has(uuid));
			const requestToken = ++recipientState.requestToken;
			recipientState.status = ForwardDeliveryStatus.inFlight;
			for (const delivery of deliveries)
			{
				delivery.status = ForwardDeliveryStatus.inFlight;
				delivery.attempts++;
			}

			try
			{
				const response = await this.sendingService.sendForwardMessages({
					dialogId: recipientState.recipient.id,
					forwardIds: operation.getForwardIds(recipientState, task.deliveryUuids),
				});
				if (recipientState.status === ForwardDeliveryStatus.inFlight
					&& recipientState.requestToken === requestToken)
				{
					ForwardResultMapper.applyResponse(recipientState, deliveries, response);
				}
			}
			catch (error)
			{
				if (recipientState.status === ForwardDeliveryStatus.inFlight
					&& recipientState.requestToken === requestToken)
				{
					ForwardResultMapper.applyError(recipientState, deliveries, error);
				}
			}

			this.#finalizeIfComplete(operation);
		}

		#finalizeIfComplete(operation)
		{
			if (this.isDestroyed || operation.finalized || !operation.isComplete())
			{
				return;
			}

			operation.finalized = true;
			operation.result = ForwardResultMapper.createOperationResult(operation);
			const attempt = operation.attemptKind;
			operation.resolveCompletion(operation.result);
			if (this.isAppPaused)
			{
				this.pendingFinishedOperations.set(operation.id, attempt);

				return;
			}

			this.#notifyOperationFinished(operation, attempt);
		}

		#notifyPendingFinishedOperations()
		{
			const pendingOperations = [...this.pendingFinishedOperations];
			this.pendingFinishedOperations.clear();
			for (const [operationId, attempt] of pendingOperations)
			{
				const operation = this.operations.get(operationId);
				if (operation)
				{
					this.#notifyOperationFinished(operation, attempt);
				}
			}
		}

		#notifyOperationFinished(operation, attempt)
		{
			Promise.resolve(this.onOperationFinished(operation.result, {
				attempt,
				fromDialogId: operation.fromDialogId,
			})).catch((error) => {
				this.logger.error('onOperationFinished', error);
			}).finally(() => {
				if (
					operation.releaseWhenFinalized
					&& operation.finalized
					&& operation.getRetryTasks().length === 0
				)
				{
					this.operations.delete(operation.id);
				}
			});
		}

		#resolveAppActiveWaiters(isActive)
		{
			for (const resolve of this.appActiveWaiters)
			{
				resolve(isActive);
			}
			this.appActiveWaiters.clear();
		}

		#isIos()
		{
			return String(this.platformProvider()).toLowerCase() === 'ios';
		}
	}

	module.exports = { ForwardMessageManager };
});
