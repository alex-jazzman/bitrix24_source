<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/spam-protection.bundle.css',
	'js' => 'dist/spam-protection.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.card.headercard',
		'landing.ui.card.messagecard',
		'landing.ui.field.radiobuttonfield',
		'landing.ui.form.formsettingsform',
		'landing.ui.panel.basepresetpanel',
		'landing.ui.panel.formsettingspanel',
		'main.core',
		'ui.buttons',
	],
	'skip_core' => false,
];