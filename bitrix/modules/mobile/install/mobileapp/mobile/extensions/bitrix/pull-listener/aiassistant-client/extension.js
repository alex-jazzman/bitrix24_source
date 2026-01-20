/**
 * @module pull-listener/aiassistant-client
 */
jn.define('pull-listener/aiassistant-client', (require, exports, module) => {
	const { PullEventId } = require('pull-listener/aiassistant-client/src/const');
	const { PullEvent } = require('pull-listener/event');
	const { PullEventClient } = require('pull-listener/client');

	const moduleId = {
		aiassistant: 'aiassistant',
	};

	const command = {
		openChatMobile: 'openChatMobile',
		showFeedbackFormMobile: 'showFeedbackFormMobile',
	};

	const eventName = 'ImMobile.Messenger.Dialog:open';
	const context = 'im.messenger';
	const formId = 'aiAssistant';

	class MartaAIPullEventClient extends PullEventClient
	{
		registerPullEvents()
		{
			return [
				new PullEvent({
					id: PullEventId.AI_OPEN_CHAT_MOBILE,
					moduleId: moduleId.aiassistant,
					command: command.openChatMobile,
					callback: this.openChatMobile.bind(this),
				}),
				new PullEvent({
					id: PullEventId.AI_SHOW_FEEDBACK_FORM_MOBILE,
					moduleId: moduleId.aiassistant,
					command: command.showFeedbackFormMobile,
					callback: this.showFeedbackFormMobile.bind(this),
				}),
			];
		}

		openChatMobile(params)
		{
			BX.postComponentEvent(eventName, [{ dialogId: params?.chatId }], context);
		}

		showFeedbackFormMobile(params = {})
		{
			requireLazy('layout/ui/feedback-form-opener')
				.then(({ FeedbackForm }) => {
					if (FeedbackForm)
					{
						new FeedbackForm({
							formId,
							senderPage: 'mobile_marta',
							extraHiddenFields: params,
						}).openInBackdrop();
					}
				})
				.catch((error) => console.error('AI Assistant feedback error', error, params));
		}
	}

	module.exports = {
		MartaAIPullEventClient,
		PullEventId,
	};
});
