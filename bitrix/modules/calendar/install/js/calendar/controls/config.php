<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/controls.bundle.css',
	'js' => 'dist/controls.bundle.js',
	'rel' => [
		'calendar.categorymanager',
		'calendar.controls',
		'calendar.entry',
		'calendar.planner',
		'calendar.roomsmanager',
		'calendar.util',
		'intranet.control-button',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'main.sidepanel',
		'ui.avatar',
		'ui.buttons',
		'ui.date-picker',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.icons.b24',
		'ui.info-helper',
		'ui.navigationpanel',
	],
	'skip_core' => false,
	'lang' => '/bitrix/modules/calendar/classes/general/editeventform_js.php'
];
