<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/other.bundle.css',
	'js' => 'dist/other.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.pageobject',
		'landing.ui.card.basecard',
		'landing.ui.card.headercard',
		'landing.ui.field.basefield',
		'landing.ui.field.textfield',
		'landing.ui.form.formsettingsform',
		'landing.ui.panel.basepresetpanel',
		'main.core',
		'main.core.events',
		'ui.design-tokens',
		'ui.entity-selector',
	],
	'skip_core' => false,
];