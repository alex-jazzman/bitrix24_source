<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$settings = [];

if (\Bitrix\Main\Loader::includeModule('crm'))
{
	$config =  \Bitrix\Crm\MessageSender\UI\Editor\GlobalConfig::getInstance();

	$settings = [
		'maxVisibleChannels' => $config->getMaxVisibleChannels(),
		'minVisibleChannels' => $config->getMinVisibleChannels(),
	];
}

return [
	'css' => 'dist/channel-selector.bundle.css',
	'js' => 'dist/channel-selector.bundle.js',
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
