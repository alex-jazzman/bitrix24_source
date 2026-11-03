<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Text\HtmlFilter;

/**
 * @var DoubleUfComponent $component
 * @var array $arResult
 */

$component = $this->getComponent();
$precision = (int)($arResult['userField']['SETTINGS']['PRECISION'] ?? 0);
$values = [];
foreach ($arResult['value'] as $value)
{
	$values[] = $component->formatValue($value, $precision);
}

$arResult['value'] = HtmlFilter::encode(implode(', ', $values));
