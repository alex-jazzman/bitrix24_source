<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/application.bundle.css',
	'js' => 'dist/application.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'sale.checkout.const',
		'sale.checkout.controller',
		'sale.checkout.lib',
		'sale.checkout.model',
		'sale.checkout.view.alert',
		'sale.checkout.view.element.button',
		'sale.checkout.view.empty-cart',
		'sale.checkout.view.payment',
		'sale.checkout.view.product',
		'sale.checkout.view.property',
		'sale.checkout.view.successful',
		'sale.checkout.view.total',
		'sale.checkout.view.user-consent',
		'ui.a11y',
		'ui.design-tokens.air',
		'ui.vue',
		'ui.vue.vuex',
	],
	'skip_core' => false,
];