<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Vibecodeconnector\Infrastructure\Integration\Main\CatalogOnboardingSpotlight;
use Bitrix\Vibecodeconnector\Internal\Integration\Bitrix24\VibePlusCatalogRedirect;
use Bitrix\Vibecodeconnector\Public\Provider\CatalogProvider;
use Bitrix\Vibecodeconnector\Public\Service\AvailabilityService;
use Bitrix\Vibecodeconnector\Public\Service\NewAppsBadgeAvailability;

$rawPreview = $_GET['previewUserId'] ?? null;
$requestedPreviewUserId = is_numeric($rawPreview) && (int)$rawPreview > 0 ? (int)$rawPreview : null;
$previewUserId = null;

$isCatalogAllowed = false;
$catalogMustBeShown = false;
$newAppsCount = 0;
$isNewAppsBadgeAvailable = false;
$vibePlusPromoterCode = null;
if (Loader::includeModule('vibecodeconnector'))
{
	$userId = (int)CurrentUser::get()->getId();
	if ($requestedPreviewUserId !== null && $requestedPreviewUserId !== $userId && CurrentUser::get()->isAdmin())
	{
		$previewUserId = $requestedPreviewUserId;
	}
	// the same predicate the catalog actions are prefiltered by: the client must not offer
	// a catalog every server action would deny
	$availabilityService = ServiceLocator::getInstance()->get(AvailabilityService::class);
	$isCatalogAllowed = $availabilityService->isAvailableForUser($userId);
	if ($isCatalogAllowed)
	{
		$vibePlusPromoterCode = (new VibePlusCatalogRedirect())->getPromoterCodeForUser($userId);
		if ($vibePlusPromoterCode === null)
		{
			$catalogMustBeShown = (new CatalogOnboardingSpotlight($availabilityService))->mustBeShownForUser($userId);

			$catalogProvider = new CatalogProvider();
			$newAppsCount = $catalogProvider->countNewAppsForUser($previewUserId ?? $userId);
			// the count itself feeds the catalog popup either way; the badge on the button is drawn only
			// while the app chats do not announce the novelties instead
			$isNewAppsBadgeAvailable = (new NewAppsBadgeAvailability())->isAvailable();
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
		'ui.notification',
		'vibecodeconnector.catalog-popup',
	],
	'settings' => [
		'isCatalogAllowed' => $isCatalogAllowed,
		'previewUserId' => $previewUserId,
		'catalog_must_be_shown' => $catalogMustBeShown,
		'newAppsCount' => $newAppsCount,
		'isNewAppsBadgeAvailable' => $isNewAppsBadgeAvailable,
		'vibePlusPromoterCode' => $vibePlusPromoterCode,
	],
	'skip_core' => false,
];
