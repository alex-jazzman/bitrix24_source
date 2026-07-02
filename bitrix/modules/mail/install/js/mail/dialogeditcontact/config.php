<?
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/dialogeditcontact.bundle.css',
	'js' => 'dist/dialogeditcontact.bundle.js',
	'rel' => [
		'/bitrix/js/ui/forms/ui.forms.css',
		'mail.avatar',
		'mail.sidepanelwrapper',
		'main.core',
		'main.core.events',
		'ui.alerts',
		'ui.dialogs.messagebox',
		'ui.forms',
	],
	'skip_core' => false,
];