<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/info-popup.bundle.css',
	'js' => 'dist/info-popup.bundle.js',
	'rel' => [
		'currency.currency-core',
		'main.core',
		'main.popup',
		'ui.vue3',
	],
	'skip_core' => false,
];