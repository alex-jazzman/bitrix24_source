<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/uninstall-store.bundle.css',
	'js' => 'dist/uninstall-store.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.core.events',
		'ui.vue3.pinia',
	],
	'skip_core' => true,
];