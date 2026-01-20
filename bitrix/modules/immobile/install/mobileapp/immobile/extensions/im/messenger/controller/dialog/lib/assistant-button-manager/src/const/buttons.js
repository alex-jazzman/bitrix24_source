/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/const/buttons
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/const/buttons', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Loc } = require('im/messenger/loc');

	const { AssistantButtonType, AssistantButtonDesign, AssistantButtonSize, AssistantButtonMode } = require('im/messenger/controller/dialog/lib/assistant-button-manager/const/type');

	/** @type AssistantButton */
	const ReasoningButton = {
		id: AssistantButtonType.reasoning,
		text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ASSISTANT_BUTTON_REASONING'),
		testId: buildTestId(AssistantButtonType.reasoning),
		iconName: Icon.AI_STARS.getIconName(),
		size: AssistantButtonSize.S,
		design: AssistantButtonDesign.grey,
		mode: AssistantButtonMode.outline,
		rounded: false,
		dropdown: false,
	};

	/** @type AssistantButton */
	const MCPButton = {
		id: AssistantButtonType.mcp,
		text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ASSISTANT_BUTTON_MCP'),
		testId: buildTestId(AssistantButtonType.mcp),
		iconName: Icon.APPS.getIconName(),
		size: AssistantButtonSize.S,
		design: AssistantButtonDesign.grey,
		mode: AssistantButtonMode.outline,
		rounded: true,
		dropdown: false,
	};

	/**
	 * @param {string} type
	 */
	function buildTestId(type)
	{
		return `button-${type}`;
	}

	module.exports = {
		ReasoningButton,
		MCPButton,
	};
});
