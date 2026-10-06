<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/directorymenu.bundle.css',
	'js' => 'dist/directorymenu.bundle.js',
	'rel' => [
		'mail.favorites-filter-state',
		'main.core',
		'main.core.events',
		'ui.design-tokens',
		'ui.fonts.opensans',
		'ui.icon-set.outline',
		'ui.notification',
	],
	'skip_core' => false,
];