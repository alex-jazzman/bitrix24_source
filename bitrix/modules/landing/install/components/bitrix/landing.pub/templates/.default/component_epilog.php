<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use \Bitrix\Landing\Manager;

if (!isset($arResult['LANDING']))
{
	return;
}

$landing = $arResult['LANDING'];

/** @var array $arParams */
/** @var \LandingPubComponent $component */
/** @var \Bitrix\Landing\Landing $landing */

$landingId = $landing->getId();
$bodyTag = Manager::getPageView('BodyTag');
if (mb_stripos($bodyTag, 'data-landing-id=') === false)
{
	Manager::setPageView(
		'BodyTag',
		'data-landing-id="' . $landingId . '"'
	);
}

// set meta og:image
$metaOG = Manager::getPageView('MetaOG');
if (mb_strpos($metaOG, '"og:image"') === false)
{
	$preview = \htmlspecialcharsbx((string)$landing->getPreview());
	Manager::setPageView(
		'MetaOG',
		'<meta property="og:image" content="' . $preview . '" />' .
		'<meta property="twitter:image" content="' . $preview . '" />'
	);
}

$siteType = mb_strtolower((string)$arParams['TYPE']);
Manager::setPageView(
	'MetaOG',
	'<meta property="Bitrix24SiteType" content="' . \htmlspecialcharsbx($siteType) . '" />'
);

$faviconPath = rtrim((string)($arResult['SITE_RELATIVE_URL'] ?? ''), '/') . '/favicon.ico';
Manager::setPageView(
	'BeforeHeadClose',
	'<link rel="icon" type="image/x-icon" href="' . \htmlspecialcharsbx($faviconPath) . '">'
);

if (\Bitrix\Landing\Connector\Mobile::isMobileHit())
{
	$scope = \Bitrix\Landing\Site\Type::getCurrentScopeId();
	Manager::setPageView(
		'BodyTag',
		'data-scope="'. $scope .'"'
	);
}

// we set canonical, only if user no setup it before
$headBlock = \Bitrix\Landing\Hook\Page\HeadBlock::getLastInsertedCode();
if (mb_strpos($headBlock, '"canonical"') === false)
{
	$component->setCanonical($landing);
}
