<?php

use Bitrix\Landing\Site\Type;
use Bitrix\Landing\Vibe\Integration\Intranet\Page;
use Bitrix\Landing\Vibe\Vibe;
use Bitrix\Main\HttpContext;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arParams */
/** @var array $arResult */
/** @var \CMain $APPLICATION */
/** @var CBitrixComponent $component */

$moduleId = $arResult['VARS']['vibe_module'] ?? '';
$embedId = $arResult['VARS']['vibe_embed'] ?? '';
$vibe = new Vibe($moduleId, $embedId);

$error = Page::checkVibeReadyToComponent($vibe, true);
if ($error !== null)
{
	ShowError($error);

	return;
}

if (!$vibe->canEdit())
{
	ShowError("Can`t edit vibe $moduleId/$embedId");

	return;
}

$siteId = $vibe->getSiteId();
$landingId = $vibe->getLandingId();

$arParams = Page::prepareEditComponentParams($arParams, $vibe);

$settingType = $arResult['VARS']['setting_type'] ?? null;
if ($settingType === 'page')
{
	$APPLICATION->IncludeComponent(
		'bitrix:landing.landing_edit',
		'.default',
		arParams: [
			'SITE_ID' => $siteId,
			'LANDING_ID' => $landingId,
			// 'PAGE_URL_LANDINGS' => $arParams['PAGE_URL_SITE_SHOW'],
			// 'PAGE_URL_LANDING_VIEW' => $arParams['PAGE_URL_LANDING_VIEW'],
			// 'PAGE_URL_SITE_EDIT' => $arParams['PAGE_URL_SITE_EDIT'],
			// 'PAGE_URL_FOLDER_EDIT' => $arParams['PAGE_URL_FOLDER_EDIT'],
			'TYPE' => Type::SCOPE_CODE_VIBE,
		],
		parentComponent: $component
	);
}
elseif ($settingType === 'page_design')
{
	$APPLICATION->IncludeComponent(
		'bitrix:landing.landing_edit',
		'design',
		[
			'SITE_ID' => $siteId,
			'LANDING_ID' => $landingId,
			'TYPE' => Type::SCOPE_CODE_VIBE,
		],
		$component
	);
}
?>
