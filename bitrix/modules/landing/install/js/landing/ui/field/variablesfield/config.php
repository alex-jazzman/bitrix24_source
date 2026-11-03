<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/variablesfield.bundle.css',
	'js' => 'dist/variablesfield.bundle.js',
	'rel' => [
		'landing.pageobject',
		'landing.ui.field.textfield',
		'main.core',
		'main.popup',
	],
	'skip_core' => false,
];