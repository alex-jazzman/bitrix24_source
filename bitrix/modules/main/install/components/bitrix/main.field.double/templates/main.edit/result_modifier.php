<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var $component DoubleUfComponent
 * @var $arResult array
 * @var $arParams array
 */

$component = $this->getComponent();

CJSCore::init(['uf']);

$attrList = [];

if($arResult['userField']['EDIT_IN_LIST'] !== 'Y')
{
	$attrList['disabled'] = 'disabled';
}

if($arResult['userField']['SETTINGS']['SIZE'] > 0)
{
	$attrList['size'] = (int)$arResult['userField']['SETTINGS']['SIZE'];
}

if(array_key_exists('attribute', $arResult['additionalParameters']))
{
	$attrList = array_merge($attrList, $arResult['additionalParameters']['attribute']);
}

if(isset($attrList['class']) && is_array($attrList['class']))
{
	$attrList['class'] = implode(' ', $attrList['class']);
}

$attrList['class'] = implode(' ',[
	$component->getHtmlBuilder()->getCssClassName(),
	($attrList['class'] ?? '')
]);

$attrList['name'] = $arResult['fieldName'];
$attrList['placeholder'] = (
	$arParams['userField']['placeholder']
	?? htmlspecialcharsback($arParams['~userField']['EDIT_FORM_LABEL'])
);

$attrList['type'] = 'text';

$precision = (int)($arResult['userField']['SETTINGS']['PRECISION'] ?? 0);
$decimalSeparator = $component->getDecimalSeparator();
// The form is redrawn after a failed check: the value comes from the request, not from the
// storage (@see \Bitrix\Main\Component\BaseUfComponent::getFieldValue()), and is shown as typed.
$isValueFromForm = !empty($arResult['additionalParameters']['bVarsFromForm']);

foreach($arResult['value'] as $key => $value)
{
	if($component->isMobileMode())
	{
		$attrList['name'] = str_replace('[]', '[' . $key . ']', $arResult['fieldName']);
	}

	$value = $component->formatValue($value, $precision, $decimalSeparator, $isValueFromForm);
	$attrList['value'] = $value;

	$arResult['value'][$key] = [
		'attrList' => $attrList,
		'value' => $value
	];
}
