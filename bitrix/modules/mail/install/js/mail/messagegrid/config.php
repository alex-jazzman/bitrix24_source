<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/messagegrid.bundle.css',
	'js' => 'dist/messagegrid.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.design-tokens',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];