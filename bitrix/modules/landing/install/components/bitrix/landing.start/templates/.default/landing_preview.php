<?php

use Bitrix\Landing\Manager;
use Bitrix\Landing\Site\PortalPreview;
use Bitrix\Landing\Site\Type;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

/** @var array $arResult */
/** @var array $arParams */
/** @var CBitrixComponent $component */
/** @var CMain $APPLICATION */

// the route formally exists in every section, so the scope is checked before the page is looked up;
// every refusal looks the same - the address must not tell why it was refused
$landing = Type::isPublicScope($arParams['TYPE'])
	? PortalPreview::resolvePage(
		(int)$arResult['VARS']['site_show'],
		(int)$arResult['VARS']['landing_edit']
	)
	: null
;

if ($landing === null)
{
	Manager::getApplication()->showAuthForm(
		Loc::getMessage('LANDING_CMP_ACCESS_DENIED2')
	);

	return;
}

// the sandboxed document has an opaque origin, the pull client could not connect from it anyway;
// /pub/site/index.php skips the start the same way
if (!defined('BX_PULL_SKIP_INIT'))
{
	define('BX_PULL_SKIP_INIT', true);
}

$APPLICATION->IncludeComponent(
	'bitrix:landing.pub',
	'',
	[
		'SITE_ID' => $landing->getSiteId(),
		'LID' => $landing->getId(),
		'SITE_TYPE' => $arParams['TYPE'],
		'PORTAL_PREVIEW' => 'Y',
		'CHECK_PERMISSIONS' => 'Y',
		'NOT_CHECK_DOMAIN' => 'Y',
		'PAGE_URL_LANDING_VIEW' => $arParams['PAGE_URL_LANDING_VIEW'],
		'PAGE_URL_SITE_SHOW' => $arParams['PAGE_URL_SITE_SHOW'],
		'PAGE_URL_SITES' => $arParams['PAGE_URL_SITES'],
	],
	$component,
	[
		'HIDE_ICONS' => 'Y',
	]
);
