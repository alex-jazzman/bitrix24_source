/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/const/type
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/const/type', (require, exports, module) => {
	const AssistantButtonType = {
		reasoning: 'reasoning',
		mcp: 'mcp',
	};

	const AssistantButtonDesign = {
		primary: 'primary',
		success: 'success',
		alert: 'alert',
		black: 'black',
		grey: 'grey',
		disabledAlike: 'disabled-alike',
	};

	const AssistantButtonSize = {
		S: 'S',
		M: 'M',
	};

	const AssistantButtonMode = {
		solid: 'solid',
		outline: 'outline',
	};

	module.exports = { AssistantButtonType, AssistantButtonDesign, AssistantButtonSize, AssistantButtonMode };
});
