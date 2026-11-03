/**
 * @module im/messenger/controller/dialog/lib/slash-command
 */
jn.define('im/messenger/controller/dialog/lib/slash-command', (require, exports, module) => {
	const {
		SlashCommandProvider,
		SlashCommandProviderState,
	} = require('im/messenger/controller/dialog/lib/slash-command/provider');
	const { SlashCommandManager } = require('im/messenger/controller/dialog/lib/slash-command/manager');

	module.exports = { SlashCommandProvider, SlashCommandProviderState, SlashCommandManager };
});
