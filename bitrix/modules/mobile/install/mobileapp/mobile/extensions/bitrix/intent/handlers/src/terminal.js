/**
 * @module intent/handlers/src/terminal
 */
jn.define('intent/handlers/src/terminal', (require, exports, module) => {
	const { WidgetPresenter } = require('in-app-url/widget-presenter');

	/**
	 * @type {IntentActionEntry[]}
	 */
	const intentActions = [
		{
			codes: ['terminal', 'preset_terminal'],
			action: () => {
				// the code is applied at app start, where there is no current widget to open into,
				// so the section is presented in the default stack of PageManager
				new WidgetPresenter()
					.setComponentName('crm:crm.terminal.list')
					.setTitleParams({ useLargeTitleMode: true })
					.setCanOpenInDefault()
					.open()
					.catch(console.error);
			},
		},
	];

	module.exports = { intentActions };
});
