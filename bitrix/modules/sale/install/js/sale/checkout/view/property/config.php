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
		'sale.checkout.const',
		'sale.checkout.view.element.input',
		'sale.checkout.view.property',
		'ui.vue',
	],
	'skip_core' => false,
];