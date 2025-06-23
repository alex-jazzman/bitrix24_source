<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/side-panel.bundle.css',
	'js' => 'dist/side-panel.bundle.js',
	'rel' => [
		'fx',
		'main.pageobject',
		'clipboard',
		'ui.fonts.opensans',
		'popup',
		'ui.icon-set.actions',
		'ui.icon-set.main',
	],
	'skip_core' => false,
];
