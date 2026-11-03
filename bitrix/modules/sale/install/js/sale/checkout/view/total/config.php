<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/total.bundle.css',
	'js' => 'dist/total.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'currency.currency-core',
		'main.core.events',
		'sale.checkout.const',
		'sale.checkout.lib',
		'ui.a11y',
		'ui.vue',
	],
	'skip_core' => true,
];