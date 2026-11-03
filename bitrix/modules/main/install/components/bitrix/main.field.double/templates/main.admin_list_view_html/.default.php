<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var DoubleUfComponent $component
 * @var array $arResult
 */

$component = $this->getComponent();
$value = $component->formatValue(
	$arResult['additionalParameters']['VALUE'],
	(int)($arResult['userField']['SETTINGS']['PRECISION'] ?? 0),
);

if ($value !== '')
{
	print $value;
}
else
{
	print '&nbsp;';
}
