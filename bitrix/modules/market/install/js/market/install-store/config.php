<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/install-store.bundle.css',
	'js' => 'dist/install-store.bundle.js',
	'rel' => [
		'main.core',
		'ui.vue3',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];