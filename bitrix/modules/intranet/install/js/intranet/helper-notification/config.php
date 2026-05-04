<?php

use Bitrix\Intranet\Internal\Service\Notification\NewHelperNotificationService;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/helper-notification.bundle.css',
	'js' => 'dist/helper-notification.bundle.js',
	'rel' => [
		'main.core',
		'ui.banner-dispatcher',
		'ui.dialogs.tooltip',
		'ui.system.typography',
	],
	'skip_core' => false,
];
