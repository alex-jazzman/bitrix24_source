<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/methodology.bundle.css',
	'js' => 'dist/methodology.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.dialogs.messagebox',
		'ui.fonts.opensans',
		'ui.hint',
		'ui.manual',
		'ui.popupcomponentsmaker',
	],
	'skip_core' => false,
];