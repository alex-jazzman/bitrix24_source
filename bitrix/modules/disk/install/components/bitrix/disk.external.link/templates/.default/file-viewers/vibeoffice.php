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

$APPLICATION->includeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:disk.file.editor-vibeoffice',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'POPUP_COMPONENT_PARAMS' => [
			'EXTERNAL_LINK_MODE' => true,
			'TRUSTED_OPENING' => $component->getVibeofficeTrustedOpening(),
			'LINK_TO_DOWNLOAD' => $arResult['LINK_TO_DOWNLOAD'] ?? '',
			'DOWNLOAD_ALLOWED_BY_EXTERNAL_LINK' => (bool)($arResult['CAN_DOWNLOAD'] ?? false),
			'DOCUMENT_SESSION' => $arResult['DOCUMENT_SESSION'],
			'RESTRICTION_OUTCOME' => $arResult['RESTRICTION_OUTCOME'] ?? null,
		],
		'PLAIN_VIEW' => true,
		'IFRAME_MODE' => true,
		'PREVENT_LOADING_WITHOUT_IFRAME' => false,
		'USE_PADDING' => false,
	],
);
