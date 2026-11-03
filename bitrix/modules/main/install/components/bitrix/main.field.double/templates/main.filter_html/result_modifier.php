<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

use Bitrix\Main\Text\HtmlFilter;

/**
 * @var DoubleUfComponent $component
 * @var array $arResult
 */

$component = $this->getComponent();
$value = $component->formatValue(
	$arResult['additionalParameters']['VALUE'],
	(int)($arResult['userField']['SETTINGS']['PRECISION'] ?? 0),
	null,
	true,
);

$arResult['value'] = HtmlFilter::encode($value);
