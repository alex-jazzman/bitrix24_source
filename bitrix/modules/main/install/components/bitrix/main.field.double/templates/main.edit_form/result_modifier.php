<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var DoubleUfComponent $component
 * @var array $arResult
 */

$component = $this->getComponent();

$arResult['additionalParameters']['VALIGN'] = (
	$arResult['userField']['MULTIPLE'] === 'Y' ? 'top' : 'middle'
);

$entityValueId = (int)($arResult['userField']['ENTITY_VALUE_ID'] ?? 0);
$precision = (int)($arResult['userField']['SETTINGS']['PRECISION'] ?? 0);
$decimalSeparator = $component->getDecimalSeparator();
// The form is redrawn after a failed check: the value is the one the user has just typed
// (@see \CUserTypeManager::GetEditFormHTML()), so neither the default value nor the formatting
// of the stored value may replace it.
$isValueFromForm = !empty($arResult['additionalParameters']['bVarsFromForm']);

foreach($arResult['value'] as $key => $value)
{
	if(
		!$isValueFromForm
		&& $entityValueId < 1
		&& (string)$arResult['userField']['SETTINGS']['DEFAULT_VALUE'] !== ''
	)
	{
		$value = htmlspecialcharsbx(
			$arResult['userField']['SETTINGS']['DEFAULT_VALUE'] ?? null
		);
	}

	$value = $component->formatValue($value, $precision, $decimalSeparator, $isValueFromForm);

	$attrList = [
		'type' => 'text',
		'size' => $arResult['userField']['SETTINGS']['SIZE'] ?? '',
		'value' => $value,
		'name' => str_replace('[]', '[' . $key . ']', $arResult['fieldName'])
	];

	if($arResult['userField']['EDIT_IN_LIST'] !== 'Y')
	{
		$attrList['disabled'] = 'disabled';
	}

	$arResult['value'][$key] = [
		'attrList' => $attrList,
		'value' => $value,
	];
}



