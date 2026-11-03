<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */

use Bitrix\Currency\Helpers\Editor;
use Bitrix\Currency\UserField\Types\MoneyType;

$currencyList = Editor::getListCurrency();
$defaultCurrency = '';

foreach ($currencyList as $currency => $currencyInfo)
{
	if ($defaultCurrency === '' || $currencyInfo['BASE'] === 'Y')
	{
		$defaultCurrency = $currency;
	}

	$arResult['CURRENCY_LIST'][$currency] = $currencyInfo['NAME'];
}

$arResult['VALUE_NUMBER'] = '';
$configuredCurrency = $arResult['userField']['SETTINGS']['DEFAULT_CURRENCY'] ?? '';
$arResult['VALUE_CURRENCY'] = isset($arResult['CURRENCY_LIST'][$configuredCurrency])
	? $configuredCurrency
	: $defaultCurrency;

if (!empty($arResult['additionalParameters']['VALUE']))
{
	[$value, $currency] = MoneyType::unFormatFromDb($arResult['additionalParameters']['VALUE']);
	$arResult['VALUE_NUMBER'] = htmlspecialcharsbx($value);
	if ($currency !== '')
	{
		if (!isset($arResult['CURRENCY_LIST'][$currency]))
		{
			$arResult['CURRENCY_LIST'][$currency] = $currency;
		}
		$arResult['VALUE_CURRENCY'] = $currency;
	}
}
