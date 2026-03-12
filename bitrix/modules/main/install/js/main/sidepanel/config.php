<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/side-panel.bundle.css',
	'js' => 'dist/side-panel.bundle.js',
	'rel' => [
		'clipboard',
		'ui.fonts.opensans',
		'popup',
		'ui.design-tokens.air',
		'ui.icon-set.actions',
		'ui.icon-set.main',
		'ui.icon-set.outline',
		'ui.system.skeleton',
	],
	'skip_core' => false,
];
