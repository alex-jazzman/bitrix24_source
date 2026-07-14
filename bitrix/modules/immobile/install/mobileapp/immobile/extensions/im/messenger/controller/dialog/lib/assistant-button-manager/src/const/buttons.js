/**
 * @module im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons
 */
jn.define('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/buttons', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Loc } = require('im/messenger/loc');

	const {
		AssistantButtonType,
		AssistantButtonDesign,
		AssistantButtonSize,
		AssistantButtonMode,
	} = require('im/messenger/controller/dialog/lib/assistant-button-manager/src/const/type');

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
	const ModeMenuButton = {
		id: AssistantButtonType.menu,
		text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ASSISTANT_BUTTON_MODE'),
		testId: buildTestId(AssistantButtonType.menu),
		viewId: AssistantButtonType.menu,
		iconName: Icon.AI_STARS.getIconName(),
		size: AssistantButtonSize.S,
		design: AssistantButtonDesign.grey,
		mode: AssistantButtonMode.outline,
		rounded: true,
		dropdown: false,
	};

	/** @type AssistantButton */
	const MCPButton = {
		id: AssistantButtonType.mcp,
		text: '',
		testId: buildTestId(AssistantButtonType.mcp),
		iconName: Icon.MCP.getIconName(),
		size: AssistantButtonSize.S,
		design: AssistantButtonDesign.grey,
		mode: AssistantButtonMode.outline,
		rounded: true,
		dropdown: false,
	};

	/** @type AssistantButton */
	const SearchModeButton = {
		id: AssistantButtonType.search,
		text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ASSISTANT_BUTTON_SEARCH_MODE'),
		testId: buildTestId(AssistantButtonType.search),
		iconName: Icon.AI_INTERNET_SEARCH.getIconName(),
		size: AssistantButtonSize.S,
		design: AssistantButtonDesign.grey,
		mode: AssistantButtonMode.outline,
		rounded: true,
		dropdown: false,
	};

	/** @type AssistantButton */
	const AgentButton = {
		id: AssistantButtonType.agent,
		text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ASSISTANT_BUTTON_AGENT'),
		testId: buildTestId(AssistantButtonType.agent),
		viewId: AssistantButtonType.agent,
		iconName: Icon.LIST_AI.getIconName(),
		size: AssistantButtonSize.S,
		design: AssistantButtonDesign.grey,
		mode: AssistantButtonMode.outline,
		rounded: true,
		dropdown: false,
	};

	/** @type AssistantButton */
	const MarketButton = {
		id: AssistantButtonType.market,
		text: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_ASSISTANT_BUTTON_MARKET'),
		testId: buildTestId(AssistantButtonType.market),
		viewId: AssistantButtonType.market,
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
		ModeMenuButton,
		MCPButton,
		SearchModeButton,
		AgentButton,
		MarketButton,
	};
});
