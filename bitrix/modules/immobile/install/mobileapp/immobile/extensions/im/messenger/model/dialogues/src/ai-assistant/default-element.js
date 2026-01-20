/**
 * @module im/messenger/model/dialogues/ai-assistant/default-element
 */

jn.define('im/messenger/model/dialogues/ai-assistant/default-element', (require, exports, module) => {
	const aiAssistantNotifyPanelDefaultElement = Object.freeze({
		isClosedNotifyPanel: false,
	});

	const aiAssistantMCPDefaultElement = Object.freeze({
		selectedAuthId: null,
		name: '',
		iconUrl: '',
	});

	module.exports = {
		aiAssistantNotifyPanelDefaultElement,
		aiAssistantMCPDefaultElement,
	};
});
