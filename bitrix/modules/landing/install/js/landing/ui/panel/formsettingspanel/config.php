<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/formsettingspanel.bundle.css',
	'js' => 'dist/formsettingspanel.bundle.js',
	'rel' => [
		'bitrix24.phoneverify',
		'crm.form.client',
		'landing.backend',
		'landing.env',
		'landing.history',
		'landing.loc',
		'landing.pageobject',
		'landing.ui.button.sidebarbutton',
		'landing.ui.panel.basepresetpanel',
		'landing.ui.panel.fieldspanel',
		'landing.ui.panel.stylepanel',
		'main.core',
		'main.loader',
		'ui.alerts',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.fonts.opensans',
		'ui.hint',
		'ui.switcher',
		'ui.tour',
	],
	'skip_core' => false,
];