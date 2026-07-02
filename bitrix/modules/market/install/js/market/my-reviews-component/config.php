<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/my-reviews-component.bundle.css',
	'js' => 'dist/my-reviews-component.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.popup',
		'market.market-links',
		'ui.alerts',
		'ui.buttons',
		'ui.forms',
		'ui.icon-set.actions',
		'ui.notification',
		'ui.vue3',
	],
	'skip_core' => true,
];