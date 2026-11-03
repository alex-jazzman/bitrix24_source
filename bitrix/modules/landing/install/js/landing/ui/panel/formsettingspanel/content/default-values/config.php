<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/default-values.bundle.css',
	'js' => 'dist/default-values.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.ui.card.headercard',
		'landing.ui.card.messagecard',
		'landing.ui.field.defaultvaluefield',
		'landing.ui.form.formsettingsform',
		'landing.ui.panel.basepresetpanel',
		'main.core',
	],
	'skip_core' => false,
];