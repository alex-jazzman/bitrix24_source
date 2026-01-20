<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

if ($arResult['ALLOW_QRCODE_AUTH'] && isset($arResult['QRCODE']['uniqueId'], $arResult['QRCODE']['channelTag']))
{
	$arResult['QRCODE_TEXT'] = 'https://b24.to/a/'. SITE_ID .'/'. $arResult['QRCODE']['uniqueId'] .'/'. $arResult['QRCODE']['channelTag'] .'/';
}