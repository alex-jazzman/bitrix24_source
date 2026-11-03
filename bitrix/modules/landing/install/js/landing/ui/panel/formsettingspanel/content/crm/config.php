<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/crm.bundle.css',
	'js' => 'dist/crm.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.card.headercard',
		'landing.ui.field.basefield',
		'landing.ui.field.radiobuttonfield',
		'landing.ui.form.formsettingsform',
		'landing.ui.panel.basepresetpanel',
		'landing.ui.panel.formsettingspanel.content.crm.schememanager',
		'main.core',
		'main.core.events',
		'ui.buttons',
		'ui.dialogs.messagebox',
	],
	'skip_core' => false,
];