<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/list-apps.bundle.css',
	'js' => 'dist/list-apps.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.core.events',
		'market.categories',
		'market.install-store',
		'market.list-item',
		'market.market-links',
		'ui.ears',
		'ui.vue3',
		'ui.vue3.pinia',
	],
	'skip_core' => true,
];