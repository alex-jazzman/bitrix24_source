<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Vibecodeconnector\Internal\Service\Catalog\Item\CatalogItemSettings;
use Bitrix\Vibecodeconnector\Internal\Service\Embed\EmbedCreateSettings;
use Bitrix\Vibecodeconnector\Internal\Service\Endpoint\VibecodeUrlProvider;
use Bitrix\Vibecodeconnector\Internal\Service\Vibecode\VibecodeBrandResolver;
use Bitrix\Vibecodeconnector\Public\Provider\CatalogProvider;
use Bitrix\Vibecodeconnector\Public\Service\AvailabilityService;

$isEmpty = false;
$createInIframe = false;
$itemClickOpensChat = false;
$vibecodeUrl = null;
$dashboardUrl = null;
$marketUrl = null;
$newAppsCount = 0;
$catalogBrand = 'bitrix24';
$brandName = '';
if (Loader::includeModule('vibecodeconnector'))
{
	$resolvedBrand = (new VibecodeBrandResolver())->resolve();
	$catalogBrand = $resolvedBrand->value;
	$brandName = $resolvedBrand->getDisplayName();
	$itemClickOpensChat = (new CatalogItemSettings())->isClickOpensChatEnabled();
	$urlProvider = new VibecodeUrlProvider();
	$vibecodeUrl = $urlProvider->getEndpointUrl();

	$userId = (int)CurrentUser::get()->getId();
	$dashboardUrl = $urlProvider->getDashboardUrl($userId);
	if ($userId > 0)
	{
		$createInIframe = (new EmbedCreateSettings())->isEnabled();

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

$settings = [
	'isEmpty' => $isEmpty,
	'createInIframe' => $createInIframe,
	'itemClickOpensChat' => $itemClickOpensChat,
	'vibecodeUrl' => $vibecodeUrl,
	'dashboardUrl' => $dashboardUrl,
	'marketUrl' => $marketUrl,
	'newAppsCount' => $newAppsCount,
	'catalogBrand' => $catalogBrand,
	'brandName' => $brandName,
];

return [
	'js' => './dist/catalog.bundle.js',
	'css' => './dist/catalog.bundle.css',
	'rel' => [
		'im.public',
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
		'ui.icon-set.solid',
		'ui.notification',
		'ui.switcher',
		'ui.system.chip',
		'ui.system.dialog',
		'ui.system.input',
		'ui.system.menu',
		'ui.system.skeleton',
		'ui.system.typography',
		'vibecodeconnector.app-creation',
		'vibecodeconnector.open-app',
	],
	'skip_core' => false,
	'settings' => $settings,
];
