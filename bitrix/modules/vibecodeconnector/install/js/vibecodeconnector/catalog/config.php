<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Vibecodeconnector\Internal\Integration\Socialservices\NetworkService;
use Bitrix\Vibecodeconnector\Internal\Service\Catalog\OpenApp\OpenAppSettings;
use Bitrix\Vibecodeconnector\Internal\Service\Endpoint\BaseEndpointProvider;
use Bitrix\Vibecodeconnector\Internal\Service\Endpoint\CloudEndpointProvider;
use Bitrix\Vibecodeconnector\Public\Provider\CatalogProvider;
use Bitrix\Vibecodeconnector\Public\Service\AvailabilityService;

$isEmpty = false;
$openAppInIframe = false;
$vibecodeUrl = null;
$marketUrl = null;
$newAppsCount = 0;
if (Loader::includeModule('vibecodeconnector'))
{
	$serviceLocator = ServiceLocator::getInstance();
	$vibecodeUrl =
		$serviceLocator->get(NetworkService::class)->isCloudPortal()
			? $serviceLocator->get(CloudEndpointProvider::class)->getCloudUrl()
			: $serviceLocator->get(BaseEndpointProvider::class)->getBaseUrl()
	;

	$userId = (int)CurrentUser::get()->getId();
	if ($userId > 0)
	{
		$openAppInIframe = (new OpenAppSettings())->isOpenInIframeEnabled();

		// same predicate as the CheckCatalogAvailability prefilter of the catalog actions
		if (ServiceLocator::getInstance()->get(AvailabilityService::class)->isAvailableForUser($userId))
		{
			$provider = new CatalogProvider();
			$isEmpty = $provider->isEmptyForUser($userId);
			$newAppsCount = $provider->countNewAppsForUser($userId);
		}
	}
}
if (Loader::includeModule('intranet'))
{
	$marketUrl = \Bitrix\Intranet\Binding\Marketplace::getMainDirectory();
}

// the profile path differs per site context (extranet, multi-site): same source as
// \Bitrix\Socialnetwork\ComponentHelper::getUserSEFUrl(), read without the hard module dependency
$siteDir = defined('SITE_DIR') ? SITE_DIR : '/';
$userPage = Option::get('socialnetwork', 'user_page', $siteDir . 'company/personal/', defined('SITE_ID') ? SITE_ID : false);

$settings = [
	'isEmpty' => $isEmpty,
	'openAppInIframe' => $openAppInIframe,
	'vibecodeUrl' => $vibecodeUrl,
	'marketUrl' => $marketUrl,
	'newAppsCount' => $newAppsCount,
	'userProfilePathTemplate' => $userPage . 'user/#user_id#/',
];

return [
	'js' => './dist/catalog.bundle.js',
	'css' => './dist/catalog.bundle.css',
	'rel' => [
		'im.public',
		'intranet.user.mini-profile',
		'main.core',
		'main.core.events',
		'main.popup',
		'main.sidepanel',
		'ui.analytics',
		'ui.buttons',
		'ui.cnt',
		'ui.date-picker',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.icon-set.api.core',
		'ui.icon-set.outline',
		'ui.icon-set.small-outline',
		'ui.icon-set.solid',
		'ui.notification',
		'ui.switcher',
		'ui.system.chip',
		'ui.system.dialog',
		'ui.system.input',
		'ui.system.menu',
		'ui.system.skeleton',
		'ui.system.typography',
		'ui.tooltip',
	],
	'skip_core' => false,
	'settings' => $settings,
];
