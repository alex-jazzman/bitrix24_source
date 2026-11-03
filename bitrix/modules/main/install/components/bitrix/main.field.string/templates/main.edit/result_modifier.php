<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var $component StringUfComponent
 * @var array $arResult
 * @var array $arParams
 */

use Bitrix\Main\Text\HtmlFilter;
use Bitrix\Main\UserField\Types\StringType;

$component = $this->getComponent();

CJSCore::init(['uf']);

$attrList = [];

if($arResult['userField']['SETTINGS']['MAX_LENGTH'] > 0)
{
	$attrList['maxlength'] = (int)$arResult['userField']['SETTINGS']['MAX_LENGTH'];
}

if($arResult['userField']['EDIT_IN_LIST'] !== 'Y')
{
	$attrList['disabled'] = 'disabled';
}

if(array_key_exists('attribute', $arResult['additionalParameters']))
{
	$attrList = array_merge($attrList, $arResult['additionalParameters']['attribute']);
}

if(isset($attrList['class']) && is_array($attrList['class']))
{
	$attrList['class'] = implode(' ', $attrList['class']);
}

$attrList['class'] = implode(' ', [
	$component->getHtmlBuilder()->getCssClassName(),
	($attrList['class'] ?? '')
]);

$attrList['name'] = $arResult['fieldName'];
$attrList['tabindex'] = '0';

$i = 0;

foreach($arResult['value'] as $key => $value)
{
	$valueAttrList = $attrList;
	$isMultiline = (
		$arResult['userField']['SETTINGS']['ROWS'] >= 2
		|| StringType::isMultilineValue($value)
	);
	if ($isMultiline)
	{
		$tag = 'textarea';
		$valueAttrList['cols'] = (int)$arResult['userField']['SETTINGS']['SIZE'];
		$valueAttrList['rows'] = max(2, (int)$arResult['userField']['SETTINGS']['ROWS']);
	}
	else
	{
		$tag = 'input';
		$valueAttrList['type'] = 'text';
		if($arResult['userField']['SETTINGS']['SIZE'] > 0)
		{
			$valueAttrList['size'] = (int)$arResult['userField']['SETTINGS']['SIZE'];
		}
	}

	$valueAttrList['value'] = $value;

	$arResult['fieldValues'][$key] = [
		'attrList' => $valueAttrList,
		'tag' => $tag
	];

	if($component->isMobileMode())
	{
		$valueAttrList['data-bx-type'] = 'text';
		$valueAttrList['placeholder'] = HtmlFilter::encode(
			$arParams['userField']['placeholder'] ?: $arParams['userField']['EDIT_FORM_LABEL']
		);
		$valueAttrList['name'] = str_replace('[]', '[' . $key . ']', $arResult['fieldName']);
		$valueAttrList['id'] = $arParams['userField']['~id'] . '_' . $i++;
		$valueAttrList['size'] = (int)$arResult['userField']['SETTINGS']['SIZE'];
		$valueAttrList['value'] = $value;
		$arResult['fieldValues'][$key]['attrList'] = $valueAttrList;
	}
}
