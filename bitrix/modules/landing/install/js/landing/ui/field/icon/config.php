<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/icon.bundle.css',
	'js' => 'dist/icon.bundle.js',
	'rel' => [
		'landing.ui.card.iconoptionscard',
		'landing.ui.field.image',
		'landing.ui.panel.iconpanel',
		'main.core',
	],
	'skip_core' => false,
];