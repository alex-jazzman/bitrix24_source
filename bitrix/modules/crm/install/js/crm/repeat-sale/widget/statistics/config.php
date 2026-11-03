<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Service\Container;
use Bitrix\Main\Loader;

$settings = [];
if (Loader::includeModule('crm'))
{
	$settings['dealListUrl'] = (string)Container::getInstance()->getRouter()->getItemListUrl(CCrmOwnerType::Deal);
}

return [
	'css' => './dist/statistics.bundle.css',
	'js' => './dist/statistics.bundle.js',
	'rel' => [
		'crm.integration.analytics',
		'crm.repeat-sale.widget',
		'main.core',
		'main.core.events',
		'main.popup',
		'ui.analytics',
		'ui.design-tokens',
		'ui.hint',
		'ui.icon-set.api.core',
		'ui.lottie',
	],
	'skip_core' => false,
	'settings' => $settings,
];
