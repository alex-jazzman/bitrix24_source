<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var $component StringUfComponent
 * @var array $arResult
 */

use Bitrix\Main\UserField\Types\StringType;

$component = $this->getComponent();

$arResult['additionalParameters']['VALIGN'] = (
$arResult['userField']['MULTIPLE'] === 'Y' ? 'top' : 'middle'
);

$attrList = [];

if ($arResult['userField']['SETTINGS']['MAX_LENGTH'] > 0)
{
	$attrList['maxlength'] = $arResult['userField']['SETTINGS']['MAX_LENGTH'];
}

if($arResult['userField']['EDIT_IN_LIST'] !== 'Y')
{
	$attrList['disabled'] = 'disabled';
}

$values = (
is_array($arResult['userField']['VALUE'])
	? (count($arResult['userField']['VALUE']) ? $arResult['userField']['VALUE'] : [0 => null])
	: [$arResult['userField']['VALUE']]
);

foreach($values as $key => $value)
{
	$defaultValue = $arResult['userField']['SETTINGS']['DEFAULT_VALUE'] ?? '';
	if(
		(!isset($arResult['userField']['ENTITY_VALUE_ID']) || $arResult['userField']['ENTITY_VALUE_ID'] < 1)
		&& is_string($defaultValue)
		&& mb_strlen($defaultValue)
	)
	{
		$value = $defaultValue;
	}

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
		$valueAttrList['valign'] = 'middle';
		$valueAttrList['size'] = (int)$arResult['userField']['SETTINGS']['SIZE'];
	}

	$valueAttrList['name'] = str_replace('[]', '[' . $key . ']', $arResult['fieldName']);

	$arResult['value'][$key] = [
		'attrList' => $valueAttrList,
		'tag' => $tag,
	];

	if(!$isMultiline)
	{
		$arResult['value'][$key]['attrList']['value'] = $value;
	}
	else
	{
		$arResult['value'][$key]['value'] = $value;
	}
}
