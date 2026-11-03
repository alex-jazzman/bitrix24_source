<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/callback.bundle.css',
	'js' => 'dist/callback.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.card.headercard',
		'landing.ui.card.messagecard',
		'landing.ui.field.textfield',
		'landing.ui.form.formsettingsform',
		'landing.ui.panel.basepresetpanel',
		'main.core',
		'main.core.events',
	],
	'skip_core' => false,
];