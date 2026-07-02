<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$hasImConnector = \Bitrix\Main\Loader::includeModule('imconnector');

return [
	'css' => 'dist/messagesender.bundle.css',
	'js' => 'dist/messagesender.bundle.js',
	'rel' => [
		'crm.data-structures',
		'crm.router',
		'crm_common',
		'main.core',
		'main.core.events',
		'main.sidepanel',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.info-helper',
		'ui.notification',
		'ui.notification.center',
	],
	'skip_core' => false,
	'settings' => [
		'marketUrl' => Bitrix\Crm\Integration\Market\Router::getBasePath() . 'category/integration_sms/',
		'canUseNotifications' => $hasImConnector && \Bitrix\ImConnector\Limit::canUseConnector('notifications'),
	],
];
