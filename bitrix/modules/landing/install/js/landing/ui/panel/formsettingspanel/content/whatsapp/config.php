<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/whatsapp.bundle.css',
	'js' => 'dist/whatsapp.bundle.js',
	'rel' => [
		'crm.form.client',
		'landing.loc',
		'landing.ui.card.headercard',
		'landing.ui.card.messagecard',
		'landing.ui.field.textfield',
		'landing.ui.form.formsettingsform',
		'landing.ui.panel.basepresetpanel',
		'landing.ui.panel.formsettingspanel',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];