<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/actions.bundle.css',
	'js' => 'dist/actions.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.card.headercard',
		'landing.ui.card.messagecard',
		'landing.ui.component.internal',
		'landing.ui.field.basefield',
		'landing.ui.field.presetfield',
		'landing.ui.field.radiobuttonfield',
		'landing.ui.field.textfield',
		'landing.ui.panel.basepresetpanel',
		'main.core',
		'main.core.events',
		'ui.design-tokens',
	],
	'skip_core' => false,
];