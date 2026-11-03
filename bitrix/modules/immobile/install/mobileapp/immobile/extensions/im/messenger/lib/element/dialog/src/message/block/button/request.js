/**
 * @module im/messenger/lib/element/dialog/message/block/button/request
 */
jn.define('im/messenger/lib/element/dialog/message/block/button/request', (require, exports, module) => {
	const { Type } = require('type');
	const { PerfPoint } = require('debug/prism');
	const { RestMethod } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { runAction } = require('im/messenger/lib/rest');
	const { UuidManager } = require('im/messenger/lib/uuid-manager');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	const logger = getLoggerWithContext('dialog-element--custom-message', 'RequestButton');

	/**
	 * @class RequestButton
	 */
	class RequestButton
	{
		/**
		 * In-memory guard against a duplicated submit of the same form button
		 * while the previous request is still in progress (EVENT-03, direction 2).
		 * Key format: `${messageId}|${elementId}|${buttonId}`.
		 *
		 * @type {Set<string>}
		 */
		static #activeSubmits = new Set();

		/**
		 * Builds the submit meta for a form request button.
		 * The callback sends the form submit to the backend (API-01) and returns
		 * the runAction promise as is, so the caller can react to success or error.
		 * The network error is logged here and must not be shown to the user
		 * as a technical one.
		 *
		 * While the request is in progress the form is locked transiently:
		 * the lock flags live only in the local block model and are never sent
		 * to the server. A repeated tap on the same button during an active
		 * submit is ignored (the callback returns null without a new request).
		 *
		 * `elementId`, `buttonId` and `values` come from the callback argument:
		 * the tap handler passes them along with `messageId` and `dialogLocator`.
		 * A call without `elementId` (legacy callback contract) is denied without
		 * a network request: the backend requires `blockId` (API-01).
		 *
		 * @param {string} messageId
		 * @param {string} actionId
		 * @param {object} actionParams
		 * @return {RequestButtonMetaData}
		 */
		static getMeta(messageId, actionId, actionParams)
		{
			return {
				/**
				 * @param {{
				 *     elementId?: string,
				 *     buttonId?: string,
				 *     values?: Record<string, string | Array<string>>,
				 * }} params
				 * @return {Promise<{status: string}>|null}
				 */
				callback: ({ elementId, buttonId, values } = {}) => {
					if (Type.isNil(elementId))
					{
						logger.warn('RequestButton.submit skipped: no elementId in the callback argument', messageId);

						return null;
					}

					const submitValues = values ?? {};
					const submitButtonId = buttonId ?? actionId;
					const submitKey = `${messageId}|${elementId}|${submitButtonId}`;

					if (RequestButton.#activeSubmits.has(submitKey))
					{
						logger.warn('RequestButton.submit skipped: already in progress', messageId, elementId, submitButtonId);

						return null;
					}

					const point = new PerfPoint('IM Block Form Submit', `message ${messageId}`).start();

					const requestData = {
						messageId,
						blockId: elementId,
						buttonId: submitButtonId,
						values: submitValues,
						actionUuid: UuidManager.getInstance().getActionUuid(),
					};

					logger.log('RequestButton.submit request', {
						messageId,
						blockId: requestData.blockId,
						buttonId: requestData.buttonId,
						valueFieldIds: Object.keys(submitValues),
					});

					RequestButton.#activeSubmits.add(submitKey);

					try
					{
						point.startPoint('Lock Form');
						const lockPromise = RequestButton.#lockForm(messageId, elementId, submitButtonId) ?? Promise.resolve();
						lockPromise.finally(() => point.endPoint('Lock Form'));

						point.startPoint('Server Submit');

						// the user input must not reach the device log (only field ids),
						// so `values` is masked in the network layer log as well
						return runAction(
							RestMethod.imV2ChatMessageBlockFormSubmit,
							{ data: requestData },
							{ maskDataKeysInLog: ['values'] },
						)
							.then((result) => {
								point.endPoint('Server Submit', { status: 'success' });
								logger.log('RequestButton.submit accepted', messageId, requestData.blockId);

								return result;
							})
							.catch((errors) => {
								point.endPoint('Server Submit', { status: 'error' });
								logger.error('RequestButton.submit error', errors);

								throw errors;
							})
							.finally(() => {
								RequestButton.#activeSubmits.delete(submitKey);
								point.startPoint('Unlock Form');
								const unlockPromise = RequestButton.#unlockForm(messageId, elementId) ?? Promise.resolve();
								unlockPromise.finally(() => {
									point.endPoint('Unlock Form');
									point.end();
								});
							});
					}
					catch (error)
					{
						// a synchronous failure between the dedupe key registration and
						// the runAction call must not keep the key in the set forever
						// (the button would silently die until the JS context restart)
						// and must not leave the perf points open
						RequestButton.#activeSubmits.delete(submitKey);
						point.endPoint('Lock Form', { status: 'error' });
						point.endPoint('Server Submit', { status: 'error' });
						point.end();

						throw error;
					}
				},
			};
		}

		/**
		 * Locks the form transiently for the time of the submit request:
		 * fields become disabled, the tapped button shows a loader, the rest
		 * of the form buttons become disabled. Every property changed by the
		 * lock is marked with the client-only `isTransientDisabled` flag,
		 * so the unlock restores only what the lock has changed.
		 *
		 * The lock goes through `messagesModel/blockModel/updateElement`,
		 * so the message is re-rendered by the existing block update chain
		 * and nothing is sent to the server.
		 *
		 * @param {string|number} messageId
		 * @param {string} elementId
		 * @param {string} tappedButtonId
		 * @return {Promise<void>|null}
		 */
		static #lockForm(messageId, elementId, tappedButtonId)
		{
			const store = RequestButton.#getStore();
			const element = RequestButton.#getBlockElement(store, messageId, elementId);
			if (!element)
			{
				return null;
			}

			const lockButton = (button) => {
				if (button.disabled)
				{
					return button;
				}

				return {
					...button,
					disabled: true,
					hasLoader: String(button.id) === String(tappedButtonId),
					isTransientDisabled: true,
				};
			};

			const lockedElement = {
				...element,
				elements: (element.elements ?? []).map((field) => {
					if (field.disabled)
					{
						return field;
					}

					return { ...field, disabled: true, isTransientDisabled: true };
				}),
				// a non-array button row is kept as is, symmetric to the normalizer guard
				buttons: (element.buttons ?? []).map((row) => (Array.isArray(row) ? row.map(lockButton) : row)),
			};

			return RequestButton.#updateBlockElement(store, messageId, element.id, lockedElement);
		}

		/**
		 * Removes the transient lock from the form after the submit request
		 * has been settled. Only the fields and buttons that still carry
		 * the `isTransientDisabled` flag are restored: if a real server update
		 * replaced the element during the submit (TPL-01 `disabled`), the flags
		 * are gone and the server state stays untouched.
		 *
		 * @param {string|number} messageId
		 * @param {string} elementId
		 * @return {Promise<void>|null}
		 */
		static #unlockForm(messageId, elementId)
		{
			const store = RequestButton.#getStore();
			const element = RequestButton.#getBlockElement(store, messageId, elementId);
			if (!element)
			{
				return null;
			}

			const fields = element.elements ?? [];
			const buttonRows = element.buttons ?? [];

			const isTransientLocked = (item) => item.isTransientDisabled === true;
			const hasTransientLock = fields.some(isTransientLocked)
				|| buttonRows.some((row) => Array.isArray(row) && row.some(isTransientLocked));

			if (!hasTransientLock)
			{
				return null;
			}

			const unlockButton = (button) => {
				if (!isTransientLocked(button))
				{
					return button;
				}

				const { isTransientDisabled, hasLoader, ...restButton } = button;

				return { ...restButton, disabled: false };
			};

			const unlockedElement = {
				...element,
				elements: fields.map((field) => {
					if (!isTransientLocked(field))
					{
						return field;
					}

					const { isTransientDisabled, ...restField } = field;

					return { ...restField, disabled: false };
				}),
				// a non-array button row is kept as is, symmetric to the normalizer guard
				buttons: buttonRows.map((row) => (Array.isArray(row) ? row.map(unlockButton) : row)),
			};

			return RequestButton.#updateBlockElement(store, messageId, element.id, unlockedElement);
		}

		/**
		 * @return {object|null}
		 */
		static #getStore()
		{
			return serviceLocator.get('core')?.getStore() ?? null;
		}

		/**
		 * @param {object|null} store
		 * @param {string|number} messageId
		 * @param {string} elementId
		 * @return {BaseBlockElementType|null}
		 */
		static #getBlockElement(store, messageId, elementId)
		{
			if (!store)
			{
				return null;
			}

			const block = store.getters['messagesModel/blockModel/getByMessageId'](messageId);
			const element = block?.elements?.find((item) => String(item.id) === String(elementId));

			return element ?? null;
		}

		/**
		 * The current message text is passed along so the silent text update
		 * inside the action stays a no-op.
		 *
		 * `elementId` must be the id of the element already resolved
		 * from the block model (not the raw native event id):
		 * the model action compares ids strictly, without a string cast.
		 *
		 * @param {object} store
		 * @param {string|number} messageId
		 * @param {string|number} elementId
		 * @param {BaseBlockElementType} element
		 * @return {Promise<void>}
		 */
		static #updateBlockElement(store, messageId, elementId, element)
		{
			const text = store.getters['messagesModel/getById'](messageId)?.text;

			return store.dispatch('messagesModel/blockModel/updateElement', {
				messageId,
				elementId,
				element,
				text,
			}).catch((error) => {
				logger.error('RequestButton.updateBlockElement error', error);
			});
		}
	}

	module.exports = {
		RequestButton,
	};
});
