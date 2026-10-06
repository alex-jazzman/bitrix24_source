<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/messagegrid.bundle.css',
	'js' => 'dist/messagegrid.bundle.js',
	'rel' => [
		'mail.favorites-filter-state',
		'main.core',
		'main.core.events',
		'ui.a11y',
		'ui.buttons',
		'ui.design-tokens',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];