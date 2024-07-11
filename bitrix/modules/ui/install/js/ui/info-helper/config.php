<?php

use Bitrix\Main\Loader;
use Bitrix\UI\FeaturePromoter;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/info-helper.bundle.css',
	'js' => 'dist/info-helper.bundle.js',
	'rel' => [
		'main.loader',
		'ui.popup-with-header',
		'ui.analytics',
		'main.core',
	],
	'skip_core' => false,
	'settings' => [
		'popupProviderEnabled' => (new FeaturePromoter\PopupProviderAvailabilityChecker())->isAvailable(),
		'licenseType' => Loader::includeModule('bitrix24') ? strtoupper(\CBitrix24::getLicenseType()) : null,
	],
];