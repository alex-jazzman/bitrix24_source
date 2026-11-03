<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/epic.bundle.css',
	'js' => 'dist/epic.bundle.js',
	'rel' => [
		'color_picker',
		'main.core',
		'main.core.events',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.fonts.opensans',
		'ui.label',
		'ui.notification',
		'ui.sidepanel.layout',
	],
	'skip_core' => false,
];