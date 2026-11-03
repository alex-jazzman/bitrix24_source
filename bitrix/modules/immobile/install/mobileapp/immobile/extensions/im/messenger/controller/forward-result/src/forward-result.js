/**
 * @module im/messenger/controller/forward-result/src/forward-result
 */
jn.define('im/messenger/controller/forward-result/src/forward-result', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Notification } = require('im/messenger/lib/ui/notification');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { ForwardResultView } = require('im/messenger/controller/forward-result/src/result-view');

	const TOAST_LIFETIME_SECONDS = 4;
	const sessions = new Map();

	class ForwardResult
	{
		static show({ result, manager })
		{
			const session = sessions.get(result.operationId) ?? {
				manager,
				result,
				view: null,
				releaseTimer: null,
				detailsOpened: false,
			};
			session.result = result;
			sessions.set(result.operationId, session);
			session.view?.updateResult(result);

			const toastParams = {
				message: this.#getToastMessage(result),
				time: TOAST_LIFETIME_SECONDS,
				shouldCloseOnTap: true,
			};

			if (result.failedRecipients.length > 0 && !session.view)
			{
				toastParams.buttonText = Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_RESULT_DETAILS_BUTTON');
				toastParams.onButtonTap = () => {
					session.detailsOpened = true;
					if (session.releaseTimer)
					{
						clearTimeout(session.releaseTimer);
						session.releaseTimer = null;
					}

					void this.#openDetails(session);
				};
			}

			Notification.showToastWithParams(toastParams);
			if (!session.view)
			{
				session.releaseTimer = setTimeout(() => {
					if (!session.detailsOpened)
					{
						this.#releaseSession(result.operationId);
					}
				}, TOAST_LIFETIME_SECONDS * 1000);
			}
		}

		static #releaseSession(operationId)
		{
			const session = sessions.get(operationId);
			if (!session)
			{
				return;
			}

			if (session.releaseTimer)
			{
				clearTimeout(session.releaseTimer);
			}

			sessions.delete(operationId);
			session.view?.dispose();
			session.manager.release(operationId);
		}

		static async #openDetails(session)
		{
			let released = false;
			const releaseOnce = () => {
				if (released)
				{
					return;
				}

				released = true;
				this.#releaseSession(session.result.operationId);
			};

			try
			{
				const widget = await PageManager.openWidget('layout', {
					modal: true,
					titleParams: {
						type: 'dialog',
						text: Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_RESULT_TITLE'),
					},
					backdrop: {
						mediumPositionPercent: 70,
						onlyMediumPosition: true,
						horizontalSwipeAllowed: false,
						forceDismissOnSwipeDown: true,
					},
					onClose: releaseOnce,
				});
				widget.on('onViewHidden', releaseOnce);
				session.view = new ForwardResultView({
					result: session.result,
					onRetry: () => session.manager.retry(session.result.operationId),
				});
				widget.showComponent(session.view);
			}
			catch (error)
			{
				getLoggerWithContext('forward-result', 'ForwardResult').error('openDetails', error);
				releaseOnce();
			}
		}

		static #getToastMessage(result)
		{
			if (result.succeededRecipients === result.totalRecipients)
			{
				return Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_RESULT_SUCCESS');
			}

			return Loc.getMessage('IMMOBILE_MESSENGER_FORWARD_RESULT_PARTIAL', {
				'#SUCCESS_COUNT#': result.succeededRecipients,
				'#TOTAL_COUNT#': result.totalRecipients,
			});
		}
	}

	module.exports = { ForwardResult };
});
