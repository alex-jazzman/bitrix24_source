<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'currency.currency-core',
		'main.core',
		'sale.checkout.const',
		'sale.checkout.lib',
		'sale.checkout.view.element.button',
		'ui.vue',
	],
	'skip_core' => false,
];