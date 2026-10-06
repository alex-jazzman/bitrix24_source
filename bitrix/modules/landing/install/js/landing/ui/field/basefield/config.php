<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/basefield.bundle.css',
	'js' => 'dist/basefield.bundle.js',
	'rel' => [
		'landing.ui.component.internal',
		'main.core',
		'main.core.events',
		'ui.design-tokens',
	],
	'skip_core' => false,
];