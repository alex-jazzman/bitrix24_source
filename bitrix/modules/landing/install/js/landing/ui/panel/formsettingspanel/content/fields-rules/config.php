<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/fields-rules.bundle.css',
	'js' => 'dist/fields-rules.bundle.js',
	'rel' => [
		'landing.loc',
		'landing.pageobject',
		'landing.ui.card.headercard',
		'landing.ui.component.actionpanel',
		'landing.ui.component.iconbutton',
		'landing.ui.component.internal',
		'landing.ui.field.basefield',
		'landing.ui.field.radiobuttonfield',
		'landing.ui.field.textfield',
		'landing.ui.form.formsettingsform',
		'landing.ui.panel.basepresetpanel',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.design-tokens',
		'ui.fonts.opensans',
	],
	'skip_core' => false,
];