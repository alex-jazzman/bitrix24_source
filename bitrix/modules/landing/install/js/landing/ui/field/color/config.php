<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/color_field.bundle.css',
	'js' => 'dist/color_field.bundle.js',
	'rel' => [
		'landing.backend',
		'landing.env',
		'landing.pageobject',
		'landing.ui.field.basefield',
		'landing.ui.field.image',
		'landing.ui.field.textfield',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];