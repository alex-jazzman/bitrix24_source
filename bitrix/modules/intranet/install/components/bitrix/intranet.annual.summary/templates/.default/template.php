<?php

use Bitrix\Main\Page\Asset;
use Bitrix\Main\UI\Extension;
use Bitrix\Main\Web\Json;

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

global $APPLICATION;

$asset = Asset::getInstance();
$asset->addString('<meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">');
$APPLICATION->SetPageProperty("BodyClass", "annual-summary-page");
Extension::load(['intranet.notify-banner.annual-summary']);

$APPLICATION->SetTitle($arResult['FEATURE_TITLE']);

Asset::getInstance()->addString(
	'<meta property="og:title" content="' . $arResult['FEATURE_TITLE'] . '" />',
);
Asset::getInstance()->addString(
	'<meta property="og:description" content="' . $arResult['FEATURE_DESCRIPTION'] . '" />',
);
Asset::getInstance()->addString(
	'<meta property="og:type" content="website" />',
);
Asset::getInstance()->addString(
	'<meta property="og:site_name" content="' . $arResult['SITE_NAME'] . '" />',
);
Asset::getInstance()->addString(
	'<meta property="og:url" content="' . $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['SERVER_NAME'] . $_SERVER['REQUEST_URI'] . '" />',
);
Asset::getInstance()->addString(
	'<meta property="og:image" content="' . $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['SERVER_NAME'] . '/bitrix/images/intranet/annual-summary/rich.png" />',
);
?>

<script>
	BX.ready(() => {
		new BX.Intranet.NotifyBanner.AnnualSummary(<?= Json::encode($arResult['TOP_FEATURES'])?>, <?= Json::encode($arResult['FEATURES_OPTIONS'])?>).show();
	});
</script>
