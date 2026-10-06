<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/detail.bundle.css',
	'js' => 'dist/detail.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'market.mobile.rating-stars',
		'market.mobile.utils',
		'ui.system.typography.vue',
		'ui.vue3.components.button',
	],
	'skip_core' => true,
];
