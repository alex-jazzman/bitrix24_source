<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/self-delete-popup.bundle.js',
	'css' => './dist/self-delete-popup.bundle.css',
	'rel' => [
		'im.public',
		'im.v2.lib.opener',
		'main.core',
		'ui.buttons',
		'ui.entity-selector',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.notification',
		'ui.system.dialog',
		'ui.system.typography',
	],
	'settings' => [
		'supportEmail' => \Bitrix\Intranet\Public\Service\User\SelfDeleteService::getSupportEmail(),
	],
	'skip_core' => false,
];
