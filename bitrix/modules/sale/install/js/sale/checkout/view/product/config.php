<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/registry.bundle.css',
	'js' => 'dist/registry.bundle.js',
	'rel' => [
		'catalog.sku-tree',
		'currency.currency-core',
		'main.core',
		'main.core.events',
		'sale.checkout.const',
		'sale.checkout.lib',
		'sale.checkout.view.element.animate-price',
		'sale.checkout.view.element.button',
		'sale.checkout.view.element.input',
		'sale.checkout.view.mixins',
		'ui.a11y',
		'ui.vue',
	],
	'skip_core' => false,
];