<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'sale.checkout.const',
		'ui.entity-selector',
		'ui.type',
		'ui.vue',
	],
	'skip_core' => false,
];