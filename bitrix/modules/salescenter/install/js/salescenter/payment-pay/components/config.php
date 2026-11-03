<?php

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
		'sale.payment-pay.const',
		'sale.payment-pay.lib',
		'sale.payment-pay.mixins.application',
		'sale.payment-pay.mixins.payment-system',
		'sale.user-consent-a11y',
		'salescenter.payment-pay.backend-provider',
		'salescenter.payment-pay.user-consent',
		'ui.vue',
	],
	'skip_core' => false,
];
