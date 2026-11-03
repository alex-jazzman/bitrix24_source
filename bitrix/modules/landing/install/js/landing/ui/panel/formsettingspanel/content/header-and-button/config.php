<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/header-and-button.bundle.css',
	'js' => 'dist/header-and-button.bundle.js',
	'rel' => [
		'helper',
		'landing.ui.card.headercard',
		'landing.ui.card.messagecard',
		'landing.ui.field.textfield',
		'landing.ui.field.variablesfield',
		'landing.ui.form.formsettingsform',
		'landing.ui.panel.basepresetpanel',
		'main.core',
	],
	'skip_core' => false,
];