<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Config\Option;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Vibecodeconnector\Internal\Service\Catalog\OpenApp\OpenAppSettings;
use Bitrix\Vibecodeconnector\Internal\Service\Vibecode\VibecodeBrandResolver;

$openAppInIframe = false;
$loaderBrand = 'bitrix24';
if (Loader::includeModule('vibecodeconnector') && (int)CurrentUser::get()->getId() > 0)
{
	$openAppInIframe = (new OpenAppSettings())->isOpenInIframeEnabled();
	$loaderBrand = (new VibecodeBrandResolver())->resolve()->value;
}

$siteDir = defined('SITE_DIR') ? SITE_DIR : '/';
$userPage = Option::get(
	'socialnetwork',
	'user_page',
	$siteDir . 'company/personal/',
	defined('SITE_ID') ? SITE_ID : false,
);

return [
	'js' => './dist/open-app.bundle.js',
	'css' => './dist/open-app.bundle.css',
	'rel' => [
		'intranet.user.mini-profile',
		'main.core',
		'main.sidepanel',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.tooltip',
	],
	'settings' => [
		'openAppInIframe' => $openAppInIframe,
		'loaderBrand' => $loaderBrand,
		'userProfilePathTemplate' => $userPage . 'user/#user_id#/',
	],
	'skip_core' => false,
];
