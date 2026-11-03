<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/linkurl.bundle.css',
	'js' => 'dist/linkurl.bundle.js',
	'rel' => [
		'landing.ui.field.textfield',
		'main.core',
		'ui.design-tokens',
		'ui.entity-selector',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];