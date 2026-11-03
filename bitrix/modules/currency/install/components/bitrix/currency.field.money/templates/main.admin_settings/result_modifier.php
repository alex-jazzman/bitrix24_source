<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

use Bitrix\Currency\Helpers\Editor;
use Bitrix\Currency\UserField\Types\MoneyType;
use Bitrix\Main\UI\Extension;

Extension::load([
	'core_uf_money',
]);

$value = '';
$currency = '';

/** @var $arResult [] */
if (isset($arResult['additionalParameters']['bVarsFromForm']) && $arResult['additionalParameters']['bVarsFromForm'])
{
	$settings = $GLOBALS[$arResult['additionalParameters']['NAME']] ?? [];
	if (is_array($settings))
	{
		$value = $settings['DEFAULT_VALUE'] ?? '';
		$currency = $settings['DEFAULT_CURRENCY'] ?? '';
	}
}
elseif (isset($arResult['userField']) && is_array($arResult['userField']))
{
	$settings = $arResult['userField']['SETTINGS'] ?? [];
	if (is_array($settings))
	{
		$value = $settings['DEFAULT_VALUE'] ?? '';
		$currency = $settings['DEFAULT_CURRENCY'] ?? '';
	}
}
else
{
	$defaultValue = '';
	$defaultCurrency = '';
	$currencyList = Editor::getListCurrency();
	foreach ($currencyList as $currencyInfo)
	{
		if ($currencyInfo['BASE'] === 'Y')
		{
			$defaultCurrency = $currencyInfo['CURRENCY'];
		}
	}

	$value = MoneyType::formatToDB($defaultValue, $defaultCurrency);
	$currency = $defaultCurrency;
}

$arResult['value'] = $value;
$arResult['currency'] = $currency;
