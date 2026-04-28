<?php

use Bitrix\Main\Loader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$baseCurrencyId = '';
if (\Bitrix\Main\Loader::includeModule('booking'))
{
	if (Loader::includeModule('crm'))
	{
		$baseCurrencyId = \CCrmCurrency::GetBaseCurrencyID() ?? '';
	}
}

$currencies = [];
if (\Bitrix\Main\Loader::includeModule('currency'))
{
	$currencyIterator = \Bitrix\Currency\CurrencyTable::getList([
		'select' => ['CURRENCY'],
	]);

	while (['CURRENCY' => $currency] = $currencyIterator->fetch())
	{
		$currencies[] = [
			'CURRENCY' => $currency,
			'FORMAT' => \CCurrencyLang::GetFormatDescription($currency),
		];
	}
}

return [
	'js' => 'dist/currency-format.bundle.js',
	'rel' => [
		'main.core',
		'currency.currency-core',
	],
	'skip_core' => false,
	'settings' => [
		'baseCurrencyId' => $baseCurrencyId,
		'currencies' => $currencies,
	],
];
