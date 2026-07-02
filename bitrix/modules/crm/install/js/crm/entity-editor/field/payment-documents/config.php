<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/payment-documents.bundle.css',
	'js' => 'dist/payment-documents.bundle.js',
	'rel' => [
		'catalog.tool-availability-manager',
		'currency.currency-core',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.dialogs.messagebox',
		'ui.hint',
		'ui.label',
	],
	'skip_core' => false,
];