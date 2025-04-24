/**
 * @module im/messenger/controller/selector/dialog/opener
 */
jn.define('im/messenger/controller/selector/dialog/opener', (require, exports, module) => {
	const { EntitySelectorWidget } = require('selector/widget');
	const { DialogSelectorProvider } = require('im/messenger/controller/selector/dialog/provider');
	const { Loc } = require('loc');

	/**
	 * @param {Object} options
	 * @param {Object} [options.providerOptions]
	 * @param {Function} options.onItemSelected
	 */
	function openDialogSelector({
		title,
		providerOptions,
		onItemSelected,
	})
	{
		const entitySelectorWidget = new EntitySelectorWidget({
			widgetParams: {
				titleParams: {
					text: title ?? Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECTOR_DEFAULT_TITLE'),
					type: 'dialog',
				},
				backdrop: {
					mediumPositionPercent: 85,
					horizontalSwipeAllowed: false,
					onlyMediumPosition: true,
				},
			},
			events: {
				onItemSelected,
			},
			allowMultipleSelection: false,
			closeOnSelect: true,

			provider: {
				class: DialogSelectorProvider,
				options: providerOptions ?? {},
			},

			sectionTitles: {
				recent: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_SELECTOR_SEARCH_PLACEHOLDER'),
			},
		});

		entitySelectorWidget.show();
	}

	module.exports = { openDialogSelector };
});
