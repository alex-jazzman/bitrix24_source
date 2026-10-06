<?php
if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true) die();

/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */
/** @global CUser $USER */
/** @global CDatabase $DB */
/** @var CBitrixComponentTemplate $this */
/** @var string $templateName */
/** @var string $templateFile */
/** @var string $templateFolder */
/** @var string $componentPath */
/** @var CDiskExternalLinkComponent $component */

use Bitrix\Main\Localization\Loc;

Loc::loadMessages(__DIR__ . '/../template.php');

// The download card this page replaces printed the link preview into its own head; here the head belongs
// to the wrapper below, so the same set goes in through AddHeadString(). Kept off a password protected
// link exactly as the card kept it.
if (!empty($arResult['OPEN_GRAPH']) && empty($arResult['PROTECTED_BY_PASSWORD']))
{
	$openGraph = [
		'og:url' => $arResult['OPEN_GRAPH']['URL'],
		'og:site_name' => $arResult['SITE_NAME'],
		'og:title' => $arResult['OPEN_GRAPH']['TITLE'],
		'og:type' => 'website',
		'og:description' => $component->getMessage('DISK_EXT_LINK_OPEN_GRAPH_MADE_BY_B24'),
	];

	foreach ($openGraph as $property => $content)
	{
		$APPLICATION->AddHeadString(
			'<meta content="' . htmlspecialcharsbx((string)$content) . '" property="' . $property . '"/>'
		);
	}
}

$APPLICATION->includeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:disk.file.viewer-html',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => $arResult['HTML_VIEWER'] ?? [],
		'PLAIN_VIEW' => true,
		'IFRAME_MODE' => true,
		'PREVENT_LOADING_WITHOUT_IFRAME' => false,
		'USE_PADDING' => false,
	]
);
