<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user-consent.bundle.css',
	'js' => 'dist/user-consent.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'sale.checkout.const',
		'sale.user-consent-a11y',
		'ui.vue',
	],
	'skip_core' => false,
];