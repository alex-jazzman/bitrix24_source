<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/textfield.bundle.css',
	'js' => 'dist/textfield.bundle.js',
	'rel' => [
		'landing.ui.component.internal',
		'landing.ui.field.basefield',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];