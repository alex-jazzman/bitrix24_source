<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/analytics.bundle.css',
	'js' => 'dist/analytics.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.card.headercard',
		'landing.ui.card.messagecard',
		'landing.ui.field.accordionfield',
		'landing.ui.panel.basepresetpanel',
		'main.core',
		'ui.design-tokens',
	],
	'skip_core' => false,
];