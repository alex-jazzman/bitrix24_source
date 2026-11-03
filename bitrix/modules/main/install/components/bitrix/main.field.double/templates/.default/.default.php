<?php

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true) die();

/**
 * @var DoubleUfComponent $component
 * @var array $arResult
 */

$component = $this->getComponent();
$precision = (int)($arResult['userField']['SETTINGS']['PRECISION'] ?? 0);
$isFirst = true;
foreach($arResult['value'] as $value)
{
	if(!$isFirst)
	{
		print '<br>';
	}
	$isFirst = false;
	print $component->formatValue($value, $precision);
}
