/**
 * @module im/messenger/provider/services/analytics/vote
 */
jn.define('im/messenger/provider/services/analytics/vote', (require, exports, module) => {
	const { AnalyticsEvent } = require('analytics');
	const { Analytics } = require('im/messenger/const');
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { AnalyticsHelper } = require('im/messenger/provider/services/analytics/helper');

	/**
	 * @class VoteAnalytics
	 */
	class VoteAnalytics
	{
		constructor()
		{
			this.store = serviceLocator.get('core').getStore();
		}

		/**
		 * @param {DialogId} dialogId
		 */
		sendClickToOpenCreateVote(dialogId)
		{
			/** @type {DialoguesModelState} */
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			const dialogHelper = DialogHelper.createByModel(dialog);
			const category = AnalyticsHelper.getCategoryByChat(dialog);

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.clickCreatePoll)
				.setSection()
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.setP5(AnalyticsHelper.getFormattedChatId(dialog.chatId))
			;

			this.#setProjectAwareP4(analytics, dialog, dialogHelper, category);

			analytics.send();
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number} voteId
		 * @param {Object} voteData
		 */
		sendOnVotePublished(dialogId, voteId, voteData)
		{
			this.#sendVotePublished(dialogId, voteId, voteData.settings.isAnonymous);
			this.#sendAnswersCountSetting(voteId, Object.keys(voteData.questions[0].answers).length);
			this.#sendMultipleSetting(voteId, voteData.questions[0].isMultipleChoice);
			this.#sendCancelingSetting(voteId, voteData.settings.isRevoteEnabled);
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number} voteId
		 * @param {boolean} isAnonymous
		 */
		#sendVotePublished(dialogId, voteId, isAnonymous)
		{
			/** @type {DialoguesModelState} */
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			const dialogHelper = DialogHelper.createByModel(dialog);
			const category = AnalyticsHelper.getCategoryByChat(dialog);

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.publishPoll)
				.setType(isAnonymous ? Analytics.Type.voteAnonymous : Analytics.Type.votePublic)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.setP3(this.#getP3ByVoteId(voteId))
				.setP5(AnalyticsHelper.getFormattedChatId(dialog.chatId))
			;

			this.#setProjectAwareP4(analytics, dialog, dialogHelper, category);

			analytics.send();
		}

		/**
		 * @param {number} voteId
		 * @param {number} answersCount
		 */
		#sendAnswersCountSetting(voteId, answersCount)
		{
			this.#getBaseSettingEvent(voteId)
				.setEvent(Analytics.Event.setOptions)
				.setType(answersCount === 2 ? Analytics.Type.voteAnswersTwo : Analytics.Type.voteAnswersMultiple)
				.send()
			;
		}

		/**
		 * @param {number} voteId
		 * @param {boolean} isMultipleChoice
		 */
		#sendMultipleSetting(voteId, isMultipleChoice)
		{
			this.#getBaseSettingEvent(voteId)
				.setEvent(Analytics.Event.isMultipleChoice)
				.setType(isMultipleChoice ? 'Y' : 'N')
				.send()
			;
		}

		/**
		 * @param {number} voteId
		 * @param {boolean} isRevoteEnabled
		 */
		#sendCancelingSetting(voteId, isRevoteEnabled)
		{
			this.#getBaseSettingEvent(voteId)
				.setEvent(Analytics.Event.setCancelVote)
				.setType(isRevoteEnabled ? 'Y' : 'N')
				.send()
			;
		}

		/**
		 * @param {number} voteId
		 * @return {AnalyticsEvent}
		 */
		#getBaseSettingEvent(voteId)
		{
			return (
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory('poll_settings')
					.setP3(this.#getP3ByVoteId(voteId))
			);
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number} voteId
		 */
		sendVoteVoted(dialogId, voteId)
		{
			/** @type {DialoguesModelState} */
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			const category = AnalyticsHelper.getCategoryByChat(dialog);

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.vote)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.setP3(this.#getP3ByVoteId(voteId))
			;

			analytics.send();
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number} voteId
		 * @param {object} voteData
		 */
		sendVoteFinished(dialogId, voteId, voteData)
		{
			/** @type {DialoguesModelState} */
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);

			const dialogHelper = DialogHelper.createByModel(dialog);
			const category = AnalyticsHelper.getCategoryByChat(dialog);

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.finishPoll)
				.setType(Analytics.Type.voteFinisherUser)
				.setSection(Analytics.Section.chatWindow)
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.setP3(this.#getP3ByVoteId(voteId))
				.setP5(AnalyticsHelper.getFormattedChatId(dialog.chatId))
			;

			// finish_poll reports no project axis, only the channel one (symmetric to the backend
			// transcript events), so the projectId_ p4 is intentionally not set here.
			this.#setParentChatP4(analytics, dialog, dialogHelper);

			if (voteData.isNestedSection)
			{
				analytics.setElement(Analytics.Element.more);
			}

			analytics.send();
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number} voteId
		 * @param {object} params
		 */
		sendVoteCancelled(dialogId, voteId, params)
		{
			/** @type {DialoguesModelState} */
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			const category = AnalyticsHelper.getCategoryByChat(dialog);

			const analytics = new AnalyticsEvent()
				.setTool(Analytics.Tool.im)
				.setCategory(category)
				.setEvent(Analytics.Event.cancelVote)
				.setSection(Analytics.Section.chatWindow)
				.setSubSection(Analytics.SubSection.contextMenu)
				.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				.setP2(AnalyticsHelper.getP2ByUserType())
				.setP3(this.#getP3ByVoteId(voteId))
			;

			if (params.isNestedSection)
			{
				analytics.setElement(Analytics.Element.more);
			}

			analytics.send();
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number} voteId
		 */
		sendVoteResultLinkCopied(dialogId, voteId)
		{
			this.#getVoteLinkCopiedEvent(dialogId, voteId)
				.setType(Analytics.Type.voteLinkCopySourceResult)
				.send()
			;
		}

		/**
		 * @param {DialogId} dialogId
		 * @param {number} voteId
		 * @param {boolean} isNestedSection
		 */
		sendVoteMessageLinkCopied(dialogId, voteId, isNestedSection)
		{
			this.#getVoteLinkCopiedEvent(dialogId, voteId, isNestedSection)
				.setType(Analytics.Type.voteLinkCopySourceMessage)
				.send()
			;
		}

		/**
		 * @return {AnalyticsEvent}
		 */
		#getVoteLinkCopiedEvent(dialogId, voteId, isNestedSection)
		{
			const analyticsEvent = (
				new AnalyticsEvent()
					.setTool(Analytics.Tool.im)
					.setCategory(Analytics.Category.chat)
					.setEvent(Analytics.Event.copyPollLink)
					.setSection(Analytics.Section.chatWindow)
					.setSubSection(Analytics.SubSection.contextMenu)
					.setP2(AnalyticsHelper.getP2ByUserType())
					.setP3(this.#getP3ByVoteId(voteId))
			);

			if (isNestedSection)
			{
				analyticsEvent.setElement(Analytics.Element.more);
			}

			if (dialogId)
			{
				/** @type {DialoguesModelState} */
				const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
				const category = AnalyticsHelper.getCategoryByChat(dialog);

				analyticsEvent
					.setCategory(category)
					.setP1(AnalyticsHelper.getP1ByDialog(dialog))
				;
			}

			return analyticsEvent;
		}

		#getP3ByVoteId(voteId)
		{
			return `pollId_${voteId}`;
		}

		/**
		 * @desc Sets p4 = parentChatId_ for a channel or a comment chat, the branch every poll
		 *       event keeps. Events that also carry the project axis add it via #setProjectAwareP4.
		 * @param {AnalyticsEvent} analytics
		 * @param {DialoguesModelState} dialog
		 * @param {DialogHelper|null} dialogHelper
		 * @returns {boolean} whether p4 was set
		 */
		#setParentChatP4(analytics, dialog, dialogHelper)
		{
			if (!dialogHelper?.isChannelOrComment)
			{
				return false;
			}

			analytics.setP4(AnalyticsHelper.getFormattedParentChatId(dialog.parentChatId));

			return true;
		}

		/**
		 * @desc Sets p4 by chat-type priority: channel/comment -> parentChatId_, otherwise
		 *       projectId_ for a chat inside a collab subtree (Variant B). No p4 elsewhere.
		 * @param {AnalyticsEvent} analytics
		 * @param {DialoguesModelState} dialog
		 * @param {DialogHelper|null} dialogHelper
		 * @param {string} category
		 */
		#setProjectAwareP4(analytics, dialog, dialogHelper, category)
		{
			if (this.#setParentChatP4(analytics, dialog, dialogHelper))
			{
				return;
			}

			if (category === Analytics.Category.project)
			{
				const projectId = AnalyticsHelper.getFormattedProjectId(dialog);
				if (projectId)
				{
					analytics.setP4(projectId);
				}
			}
		}
	}

	module.exports = { VoteAnalytics };
});
