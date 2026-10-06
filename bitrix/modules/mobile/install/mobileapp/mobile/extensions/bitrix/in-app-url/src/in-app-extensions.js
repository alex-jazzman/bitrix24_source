/**
 * @module in-app-url/src/in-app-extensions
 */
jn.define('in-app-url/src/in-app-extensions', (require, exports, module) => {
	/**
	 * Register your routes extensions here,
	 * and don't forget to add them into deps.php
	 */
	const extensions = [
		'mail/in-app-url/routes',
		'sign/in-app-url/routes',
		'crm/in-app-url/routes',
		'tasks/in-app-url/routes',
		'im/in-app-url/routes',
		'calendar/in-app-url/routes',
		'stafftrack/in-app-url/routes',
		'lists/in-app-url/routes',
		'bizproc/in-app-url/routes',
		'disk/in-app-url/routes',
		'in-app-url/routes',
		'in-app-url/routes/development-routes',
		'in-app-url/routes/market',
		'in-app-url/routes/timeman',
		'in-app-url/routes/stafftrack',
		'in-app-url/routes/settings',
		'in-app-url/routes/bitrix24',
		'in-app-url/routes/note',
		'intranet/in-app-url/routes',
		'call/in-app-url/routes',
	];

	module.exports = { extensions };
});
