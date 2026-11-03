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
		'sale.payment-pay.backend-provider',
		'sale.payment-pay.const',
		'sale.payment-pay.lib',
		'sale.payment-pay.mixins.application',
		'sale.payment-pay.mixins.payment-system',
		'ui.a11y',
		'ui.vue',
	],
	'skip_core' => true,
];