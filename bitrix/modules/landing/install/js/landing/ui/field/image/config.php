<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/image.bundle.css',
	'js' => 'dist/image.bundle.js',
	'rel' => [
		'landing.env',
		'landing.imageuploader',
		'landing.loc',
		'landing.main',
		'landing.metrika',
		'landing.ui.button.aiimagebutton',
		'landing.ui.button.basebutton',
		'landing.ui.field.textfield',
		'landing.ui.panel.stylepanel',
		'main.core',
		'ui.fonts.opensans',
		'ui.forms',
	],
	'skip_core' => false,
];