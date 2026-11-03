<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var array $arResult
 */

use Bitrix\Main\UserField\Types\StringType;

$attrList = [];

$isMultiline = (
	$arResult['userField']['SETTINGS']['ROWS'] >= 2
	|| StringType::isMultilineValue($arResult['additionalParameters']['VALUE'] ?? null)
);

if(!$isMultiline)
{
	$tag = 'input';
	$attrList = [
		'size' => (int)$arResult['userField']['SETTINGS']['SIZE'],
	];
}
else
{
	$tag = 'textarea';
	$attrList = [
		'cols' => (int)$arResult['userField']['SETTINGS']['SIZE'],
		'rows' => max(2, (int)$arResult['userField']['SETTINGS']['ROWS'])
	];
}

$attrList['name'] = $arResult['additionalParameters']['NAME'];

if($arResult['userField']['SETTINGS']['MAX_LENGTH'] > 0)
{
	$attrList['maxlength'] = (int)$arResult['userField']['SETTINGS']['MAX_LENGTH'];
}

$arResult['fieldValues'] = [
	'attrList' => $attrList,
	'tag' => $tag
];
