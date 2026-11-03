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
		'sale.payment-pay.const',
		'sale.payment-pay.lib',
		'ui.a11y',
	],
	'skip_core' => false,
];