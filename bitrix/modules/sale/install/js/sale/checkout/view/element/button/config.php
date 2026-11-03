<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.core.events',
		'sale.checkout.const',
		'sale.checkout.view.mixins',
		'ui.vue',
	],
	'skip_core' => true,
];