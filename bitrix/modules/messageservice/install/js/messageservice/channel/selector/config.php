<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [];

if (\Bitrix\Main\Loader::includeModule('messageservice'))
{
	$config = \Bitrix\Main\DI\ServiceLocator::getInstance()->get(\Bitrix\MessageService\Infrastructure\UI\Message\Editor\GlobalConfig::class);

	$settings = [
		...$settings,
		'maxVisibleChannels' => $config->getMaxVisibleChannels(),
		'minVisibleChannels' => $config->getMinVisibleChannels(),
		'contactCenterUrl' => \Bitrix\MessageService\Integration\ImOpenLines::getContactCenterUrl(),
	];
}

return [
	'css' => 'dist/selector.bundle.css',
	'js' => 'dist/selector.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.buttons',
		'ui.icon-set.api.core',
	],
	'skip_core' => false,
	'settings' => $settings,
];
