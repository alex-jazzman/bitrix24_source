/**
 * @module mail/message-grid/src/conversation-stateful-list
 */
jn.define('mail/message-grid/src/conversation-stateful-list', (require, exports, module) => {
	const { StatefulList } = require('layout/ui/stateful-list');
	const { requireLazy } = require('require-lazy');
	const { PerfPoint } = require('debug/prism');
	const {
		ConversationExtensionGate,
		createConversationExtensionLoader,
	} = require('mail/message-grid/src/conversation-extension-gate');

	const CONVERSATION_EXTENSION = 'mail:message-grid/conversation';
	const loadConversationExtensionOnce = createConversationExtensionLoader(
		() => requireLazy(CONVERSATION_EXTENSION, false),
	);

	class ConversationStatefulList extends StatefulList
	{
		constructor(props)
		{
			super(props);

			this.conversationGate = new ConversationExtensionGate({
				load: props.loadConversationExtension
					?? loadConversationExtensionOnce,
				onLoaded: (extension) => props.onConversationExtensionLoaded?.(extension),
				onFailed: (error) => props.onConversationExtensionFailed?.(error),
				createActivationPerfPoint: () => (
					new PerfPoint('Mail Conversation Grid Activation', 'first grouped response').start()
				),
			});
		}

		drawListFromCache(response, blockPage, append)
		{
			void this.conversationGate.hold(response, (readyResponse) => {
				this.props.onGridResponseReady?.(readyResponse?.data, 'cache');
				super.drawListFromCache(readyResponse, blockPage, append);
			}, 'cache');
		}

		drawListFromAjax(response, blockPage, append)
		{
			void this.conversationGate.hold(response, (readyResponse) => {
				this.props.onGridResponseReady?.(readyResponse?.data, 'ajax');
				super.drawListFromAjax(readyResponse, blockPage, append);
			}, 'ajax');
		}

		componentWillUnmount()
		{
			this.conversationGate.destroy();
			super.componentWillUnmount();
		}
	}

	module.exports = { ConversationStatefulList, loadConversationExtensionOnce };
});
