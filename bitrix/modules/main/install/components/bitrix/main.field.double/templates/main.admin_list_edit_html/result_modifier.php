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
	null,
	!empty($arResult['additionalParameters']['bVarsFromForm']),
);

$attrList = [
	'size' => (int)$arResult['userField']['SETTINGS']['SIZE'],
	'value' => $value,
	'name' => $arResult['additionalParameters']['NAME'],
	'type' => 'text',
];

$arResult['value'] = [
	'attrList' => $attrList,
	'value' => $value,
];
