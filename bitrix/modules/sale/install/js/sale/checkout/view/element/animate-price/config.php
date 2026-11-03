<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/animate-price.bundle.css',
	'js' => 'dist/animate-price.bundle.js',
	'rel' => [
		'currency.currency-core',
		'main.core',
		'sale.checkout.view.element.animate-price',
		'ui.vue',
	],
	'skip_core' => false,
];