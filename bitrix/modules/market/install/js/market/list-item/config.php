<?
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/list-item.bundle.js',
	],
	'css' => [
		'./dist/list-item.bundle.css',
	],
	'rel' => [
		'main.core',
		'main.popup',
		'market.install-store',
		'market.market-links',
		'market.popup-install',
		'market.popup-uninstall',
		'market.rating-stars',
		'market.uninstall-store',
		'ui.icon-set.api.vue',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];