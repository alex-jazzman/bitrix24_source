<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/detail-component.bundle.css',
	'js' => 'dist/detail-component.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.core.events',
		'main.popup',
		'market.install-store',
		'market.list-item',
		'market.popup-install',
		'market.popup-uninstall',
		'market.rating',
		'market.scope-list',
		'market.slider',
		'market.uninstall-store',
		'ui.design-tokens',
		'ui.ears',
		'ui.vue3.pinia',
	],
	'skip_core' => true,
];