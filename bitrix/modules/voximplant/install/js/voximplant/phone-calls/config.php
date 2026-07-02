<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\Loader::includeModule('rest');
\Bitrix\Main\Loader::includeModule('crm');
\Bitrix\Main\Loader::includeModule('voximplant');

return [
	'css' => 'dist/phone-calls.bundle.css',
	'js' => 'dist/phone-calls.bundle.js',
	'rel' => [
		'applayout',
		'crm_form_loader',
		'im.v2.lib.desktop-api',
		'intranet.desktop-download',
		'main.core',
		'main.core.events',
		'main.popup',
		'phone_number',
		'ui.dialogs.messagebox',
		'voximplant',
	],
	'skip_core' => false,
];