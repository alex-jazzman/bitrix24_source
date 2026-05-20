<?php

use Bitrix\Catalog\StoreDocumentTable;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Catalog\Config\State;
use Bitrix\Catalog\Store\EnableWizard\TariffChecker;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$limitInfo = null;
if (\Bitrix\Main\Loader::includeModule('catalog'))
{
	$limitInfo = \Bitrix\Catalog\Config\State::getCrmExceedingProductLimit();
}

$isInstallMobileApp = (bool)\CUserOptions::GetOption('mobile', 'iOsLastActivityDate')
	|| (bool)\CUserOptions::GetOption('mobile', 'AndroidLastActivityDate')
;
$isEnabledQrAuth = $isInstallMobileApp || (bool)\CUserOptions::GetOption('product-selector', 'barcodeQrAuth');

$isShowedBarcodeSpotlightInfo = \CUserOptions::GetOption('spotlight', 'view_date_selector_barcode_scanner_info');

return [
	'css' => 'dist/product-selector.bundle.css',
	'js' => 'dist/product-selector.bundle.js',
	'rel' => [
		'ui.design-tokens',
		'ui.forms',
		'fileinput',
		'catalog.sku-tree',
		'main.loader',
		'ui.info-helper',
		'catalog.barcode-scanner',
		'ui.qrauthorization',
		'ui.tour',
		'spotlight',
		'main.core.events',
		'ui.entity-selector',
		'ui.icon-set.main',
		'catalog.tool-availability-manager',
		'ui.notification',
		'main.core',
		'catalog.product-selector',
		'catalog.product-model',
		'catalog.external-catalog-placement',
	],
	'skip_core' => false,
	'settings' => [
		'isExternalCatalog' => State::isExternalCatalog(),
		'is1cPlanRestricted' => TariffChecker::isOnecInventoryManagementRestricted(),
		'limitInfo' => $limitInfo,
		'isInstallMobileApp' => $isInstallMobileApp,
		'isEnabledQrAuth' => $isEnabledQrAuth,
		'isShowedBarcodeSpotlightInfo' => $isShowedBarcodeSpotlightInfo,
		'errorAdminHint' =>
			Loader::includeModule('bitrix24')
				? Loc::getMessage('CATALOG_SELECTOR_SEARCH_POPUP_DISABLED_ADMIN_B4_HINT')
				: Loc::getMessage('CATALOG_SELECTOR_SEARCH_POPUP_DISABLED_ADMIN_HINT')
		,
	],
];
