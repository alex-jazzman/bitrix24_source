<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/radiobuttonfield.bundle.css',
	'js' => 'dist/radiobuttonfield.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.component.internal',
		'landing.ui.field.basefield',
		'main.core',
		'ui.buttons',
		'ui.design-tokens',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];
