<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/document-card.bundle.css',
	'js' => 'dist/document-card.bundle.js',
	'rel' => [
		'catalog.entity-card',
		'catalog.store-enable-wizard',
		'currency.currency-core',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.entity-selector',
		'ui.feedback.form',
		'ui.label',
	],
	'skip_core' => false,
];