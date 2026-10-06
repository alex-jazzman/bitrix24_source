<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/market.bundle.css',
	'js' => 'dist/market.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'market.list-apps',
		'market.main',
		'market.toolbar',
		'ui.vue3',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];
