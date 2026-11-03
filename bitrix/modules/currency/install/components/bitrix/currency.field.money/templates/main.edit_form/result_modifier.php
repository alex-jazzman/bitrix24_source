<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Currency\CurrencyManager;
use Bitrix\Main\UI\Extension;

Extension::load([
	'core_uf_money',
]);

$arResult['defaultCurrency'] = $arResult['userField']['SETTINGS']['DEFAULT_CURRENCY']
	?? CurrencyManager::getBaseCurrency();
