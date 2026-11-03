<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/dod.bundle.css',
	'js' => 'dist/dod.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.loader',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.fonts.opensans',
		'ui.forms',
		'ui.layout-form',
		'ui.notification',
		'ui.sidepanel.layout',
		'ui.sidepanel.menu',
	],
	'skip_core' => false,
];