/**
 * @module im/messenger/controller/dialog/lib/text-format/src/config
 */
jn.define('im/messenger/controller/dialog/lib/text-format/src/config', (require, exports, module) => {
	const { Feature } = require('im/messenger/lib/feature');
	const { TextFormatActionRegistry } = require('im/messenger/controller/dialog/lib/text-format/src/registry');
	const { BoldAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/bold');
	const { ItalicAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/italic');
	const { UnderlineAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/underline');
	const { StrikethroughAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/strikethrough');
	const { LinkAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/link');
	const { CodeAction } = require('im/messenger/controller/dialog/lib/text-format/src/action/code');
	const { FormatMenu } = require('im/messenger/controller/dialog/lib/text-format/src/menu/format');

	const formatActionRegistry = new TextFormatActionRegistry();
	formatActionRegistry.register(new BoldAction());
	formatActionRegistry.register(new ItalicAction());
	formatActionRegistry.register(new UnderlineAction());
	formatActionRegistry.register(new StrikethroughAction());
	formatActionRegistry.register(new LinkAction());
	formatActionRegistry.register(new CodeAction());

	/**
	 * @returns {Array}
	 */
	function getTextActionsConfig()
	{
		const formatItems = formatActionRegistry.getAllConfigs();
		if (Feature.isChatDialogTextFieldMultiLevelActionsSupported)
		{
			const formatMenu = new FormatMenu(formatItems);

			return [formatMenu.getConfig()];
		}

		return formatItems;
	}

	/**
	 * @param {string} actionId
	 * @returns {BaseAction|null}
	 */
	function getFormatActionById(actionId)
	{
		return formatActionRegistry.getById(actionId);
	}

	module.exports = {
		getTextActionsConfig,
		getFormatActionById,
	};
});
