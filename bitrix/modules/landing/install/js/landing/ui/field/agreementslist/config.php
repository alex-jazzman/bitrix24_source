<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/agreementslist.bundle.css',
	'js' => 'dist/agreementslist.bundle.js',
	'rel' => [
		'crm.form.client',
		'landing.backend',
		'landing.ui.component.actionpanel',
		'landing.ui.component.listitem',
		'landing.ui.field.basefield',
		'landing.ui.field.radiobuttonfield',
		'landing.ui.field.smallswitch',
		'landing.ui.field.textareafield',
		'landing.ui.form.formsettingsform',
		'landing.ui.panel.formsettingspanel',
		'main.core',
		'main.loader',
		'main.popup',
		'ui.design-tokens',
		'ui.design-tokens.air',
		'ui.draganddrop.draggable',
		'ui.hint',
	],
	'skip_core' => false,
];
