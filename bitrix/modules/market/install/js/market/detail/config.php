<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/detail.bundle.css',
	'js' => 'dist/detail.bundle.js',
	'rel' => [
		'main.core',
		'market.detail-component',
		'ui.vue3',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];
