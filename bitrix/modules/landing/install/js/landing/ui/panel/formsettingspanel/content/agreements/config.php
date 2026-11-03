<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/agreements.bundle.css',
	'js' => 'dist/agreements.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.card.headercard',
		'landing.ui.card.messagecard',
		'landing.ui.field.agreementslist',
		'landing.ui.form.formsettingsform',
		'landing.ui.panel.basepresetpanel',
		'main.core',
	],
	'skip_core' => false,
];