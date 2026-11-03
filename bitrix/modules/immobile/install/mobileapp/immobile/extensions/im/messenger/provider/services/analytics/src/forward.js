/**
 * @module im/messenger/provider/services/analytics/src/forward
 */
jn.define('im/messenger/provider/services/analytics/src/forward', (require, exports, module) => {
	const { Type } = require('type');
	const { AnalyticsEvent } = require('analytics');

	const { Analytics } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');
	const MAX_FORWARD_RECIPIENTS = 20;
	const RESULT_REASON_BY_FAILURE_GROUP = Object.freeze({
		retryable: 'transientUnknown',
		storageFull: 'storage',
		fileUnavailable: 'fileUnavailable',
		chatUnavailable: 'chatUnavailable',
		notWritable: 'notWritable',
	});

	/**
	 * @class ForwardAnalytics
	 * @description Events of the forward recipient picker (c_section=forward)
	 */
	class ForwardAnalytics
	{
		constructor()
		{
			/**
			 * @private
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();

			/** @private */
			this.logger = getLoggerWithContext('analytics-service', this);
		}

		/**
		 * @param {{ fromDialogId: DialogId, tab: string }} params
		 */
		sendStartSearch({ fromDialogId, tab })
		{
			try
			{
				const dialog = this.#getDialog(fromDialogId);
				if (!dialog)
				{
					return;
				}

				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(AnalyticsHelper.getCategoryByChatType(dialog.type))
					.setEvent(Analytics.Event.startSearch)
					.setSection(Analytics.Section.forward)
					.setSubSection(tab)
					.setP1(AnalyticsHelper.getP1ByDialog(dialog))
					.setP2(AnalyticsHelper.getP2ByUserType())
					.send()
				;
			}
			catch (error)
			{
				this.logger.error('sendStartSearch error', error);
			}
		}

		/**
		 * @param {{
		 *     fromDialogId: DialogId,
		 *     recipientDialogId: DialogId,
		 *     tab: ?string,
		 *     isSearchResult: boolean,
		 *     position: number,
		 * }} params
		 */
		sendSelectRecipient({ fromDialogId, recipientDialogId, tab, isSearchResult, position })
		{
			try
			{
				const dialog = this.#getDialog(fromDialogId);
				if (!dialog)
				{
					return;
				}

				const event = new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(AnalyticsHelper.getCategoryByChatType(dialog.type))
					.setEvent(Analytics.Event.selectRecipient)
					.setType(this.#getRecipientType({ recipientDialogId, tab, isSearchResult }))
					.setSection(Analytics.Section.forward)
					.setP1(AnalyticsHelper.getP1ByDialog(dialog))
					.setP2(AnalyticsHelper.getP2ByUserType())
				;

				if (position > 0)
				{
					event.setP3(`position_${position}`);
				}

				event.send();
			}
			catch (error)
			{
				this.logger.error('sendSelectRecipient error', error);
			}
		}

		/**
		 * @param {{
		 *     fromDialogId: DialogId,
		 *     result: ForwardOperationResult,
		 *     attempt: 'initial' | 'retry',
		 * }} params
		 */
		sendOperationResult({ fromDialogId, result, attempt })
		{
			try
			{
				const dialog = this.#getDialog(fromDialogId);
				if (!dialog)
				{
					return;
				}

				const unsuccessfulCount = result.totalRecipients - result.succeededRecipients;
				let status = Analytics.Status.success;
				if (unsuccessfulCount === result.totalRecipients)
				{
					status = Analytics.Status.error;
				}
				else if (unsuccessfulCount > 0)
				{
					status = Analytics.Status.partial;
				}

				const reasonGroups = result.failedRecipients
					.flatMap(({ deliveries }) => deliveries ?? [])
					.map(({ failureGroup }) => RESULT_REASON_BY_FAILURE_GROUP[failureGroup])
					.filter(Type.isStringFilled)
				;
				const reasons = [...new Set(reasonGroups)].sort().join(',') || 'none';

				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(AnalyticsHelper.getCategoryByChatType(dialog.type))
					.setEvent(Analytics.Event.forwardResult)
					.setType(Analytics.Type.ForwardResult[attempt])
					.setStatus(status)
					.setSection(Analytics.Section.forward)
					.setElement(result.totalRecipients === MAX_FORWARD_RECIPIENTS
						? Analytics.Element.ForwardResult.limitReached
						: Analytics.Element.ForwardResult.limitNotReached)
					.setP1(AnalyticsHelper.getP1ByDialog(dialog))
					.setP2(AnalyticsHelper.getP2ByUserType())
					.setP3(`recipients_${result.totalRecipients}`)
					.setP4(`unsuccessful_${unsuccessfulCount}`)
					.setP5(`reasons_${reasons}`)
					.send()
				;
			}
			catch (error)
			{
				this.logger.error('sendOperationResult error', error);
			}
		}

		/**
		 * @private
		 * @param {{ recipientDialogId: DialogId, tab: ?string, isSearchResult: boolean }} params
		 * @return {string}
		 */
		#getRecipientType({ recipientDialogId, tab, isSearchResult })
		{
			if (DialogHelper.createByDialogId(recipientDialogId)?.isNotes)
			{
				return Analytics.Type.ForwardRecipient.notes;
			}

			if (isSearchResult)
			{
				return Analytics.Type.ForwardRecipient.searchResult;
			}

			// the picker without tabs (old app builds and guests) reports the legacy source
			return Type.isStringFilled(tab) ? tab : Analytics.Type.ForwardRecipient.recent;
		}

		/**
		 * @private
		 * @param {DialogId} dialogId
		 * @return {?DialoguesModelState}
		 */
		#getDialog(dialogId)
		{
			return this.store.getters['dialoguesModel/getById'](dialogId) ?? null;
		}
	}

	module.exports = { ForwardAnalytics };
});
