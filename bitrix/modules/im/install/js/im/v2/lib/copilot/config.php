<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => [
		'./dist/copilot.bundle.js',
	],
	'rel' => [
		'main.core',
		'im.v2.const',
		'im.v2.application.core',
	],
	'skip_core' => false,
	'settings' => [
		'copilotRolesAvailable' => \Bitrix\Main\Config\Option::get('im', 'im_copilot_chat_roles_available', 'N'),
	]
];