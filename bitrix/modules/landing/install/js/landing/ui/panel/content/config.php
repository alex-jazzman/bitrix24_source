<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/content.bundle.css',
	'js' => 'dist/content.bundle.js',
	'rel' => [
		'landing.ui.panel.base',
		'landing.utils',
		'main.core',
		'ui.design-tokens',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];