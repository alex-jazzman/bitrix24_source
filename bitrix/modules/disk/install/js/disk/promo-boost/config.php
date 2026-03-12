<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Disk\Integration\Baas\BaasAvailableServices;
use Bitrix\Disk\Integration\Baas\BaasSessionBoostService;
use Bitrix\Intranet\Util;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;


$userId = (int)CurrentUser::get()->getId();

return [
	'css' => 'dist/promo-boost.bundle.css',
	'js' => 'dist/promo-boost.bundle.js',
	'rel' => [
		'ui.design-tokens',
		'disk.onlyoffice-session-restrictions',
		'main.core',
	],
	'skip_core' => false,
	'settings' => [
		'canDisplay' => Loader::includeModule('intranet') && Util::isIntranetUser($userId),
		'sessionBoostServiceCode' => BaasSessionBoostService::SERVICE_CODE,
		'availableServices' => array_keys(BaasAvailableServices::get()),
	]
];
