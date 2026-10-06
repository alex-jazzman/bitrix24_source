<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => [
		'/bitrix/js/rpa/kanban/src/kanban.css'
	],
	'js' => '/bitrix/js/rpa/kanban/dist/kanban.bundle.js',
	'rel' => [
		'main.core',
		'main.kanban',
		'main.popup',
		'rpa.fieldspopup',
		'rpa.kanban',
		'rpa.manager',
		'ui.buttons',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.fonts.opensans',
		'ui.notification',
	],
	'skip_core' => false,
];