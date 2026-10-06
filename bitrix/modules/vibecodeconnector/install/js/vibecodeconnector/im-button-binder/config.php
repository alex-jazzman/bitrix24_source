<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Vibecodeconnector\Infrastructure\Integration\Main\CatalogOnboardingSpotlight;
use Bitrix\Vibecodeconnector\Internal\Integration\Bitrix24\VibePlusCatalogUpsellProvider;
use Bitrix\Vibecodeconnector\Public\Provider\CatalogProvider;
use Bitrix\Vibecodeconnector\Public\Service\AvailabilityService;

$previewUserId = null;
$rawPreview = $_GET['previewUserId'] ?? null;
if (is_numeric($rawPreview) && (int)$rawPreview > 0)
{
	$previewUserId = (int)$rawPreview;
}

$isCatalogAllowed = false;
$catalogMustBeShown = false;
$newAppsCount = 0;
$vibePlusPromoterCode = null;
if (Loader::includeModule('vibecodeconnector'))
{
	$userId = (int)CurrentUser::get()->getId();
	// the same predicate the catalog actions are prefiltered by: the client must not offer
	// a catalog every server action would deny
	$availabilityService = ServiceLocator::getInstance()->get(AvailabilityService::class);
	$isCatalogAllowed = $availabilityService->isAvailableForUser($userId);
	if ($isCatalogAllowed)
	{
		$vibePlusPromoterCode = (new VibePlusCatalogUpsellProvider())->getPromoterCode($userId);
		if ($vibePlusPromoterCode === null)
		{
			$catalogMustBeShown = (new CatalogOnboardingSpotlight($availabilityService))->mustBeShownForUser($userId);

			$countUserId = ($previewUserId !== null && $previewUserId !== $userId && CurrentUser::get()->isAdmin())
				? $previewUserId
				: $userId;
			$catalogProvider = new CatalogProvider();
			$newAppsCount = $catalogProvider->countNewAppsForUser($countUserId);
		}
	}
}

if (!$isCatalogAllowed || $vibePlusPromoterCode !== null)
{
	// When the catalog will not open, the binder must not be able to query it on behalf of anyone.
	$previewUserId = null;
}

return [
	'js' => './dist/binder.bundle.js',
	'css' => './dist/binder.bundle.css',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.info-helper',
		'vibecodeconnector.catalog-popup',
	],
	'settings' => [
		'isCatalogAllowed' => $isCatalogAllowed,
		'previewUserId' => $previewUserId,
		'catalog_must_be_shown' => $catalogMustBeShown,
		'newAppsCount' => $newAppsCount,
		'vibePlusPromoterCode' => $vibePlusPromoterCode,
	],
	'skip_core' => false,
];
