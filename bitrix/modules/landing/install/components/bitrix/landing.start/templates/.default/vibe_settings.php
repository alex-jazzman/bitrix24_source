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

$arParams = Page::prepareEditComponentParams($arParams, $vibe);
$pages = [
	'PAGE_URL_LANDING_EDIT' => $arParams['PAGE_URL_LANDING_EDIT'],
	'PAGE_URL_LANDING_DESIGN' => $arParams['PAGE_URL_LANDING_DESIGN'],
];

$siteId = $vibe->getSiteId();
$landingId = $vibe->getLandingId();

$APPLICATION->includeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:landing.settings',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => [
			'SITE_ID' => $siteId,
			'LANDING_ID' => $landingId,
			'TYPE' => Type::SCOPE_CODE_VIBE,
			'PAGES' => $pages,
		],
		'USE_PADDING' => false,
		'HIDE_TOOLBAR' => 'Y',
	]
);
?>
