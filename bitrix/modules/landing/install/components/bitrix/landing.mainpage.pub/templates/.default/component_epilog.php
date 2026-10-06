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

Manager::setPageView(
	'MetaOG',
	'<meta property="Bitrix24SiteType" content="mainpage" />'
);

$faviconPath = rtrim((string)($arResult['SITE_RELATIVE_URL'] ?? ''), '/') . '/favicon.ico';
Manager::setPageView(
	'BeforeHeadClose',
	'<link rel="icon" type="image/x-icon" href="' . \htmlspecialcharsbx($faviconPath) . '">'
);
