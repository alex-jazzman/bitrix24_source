<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$arResult['additionalParameters']['VALIGN'] = (
$arResult['userField']['MULTIPLE'] === 'Y' ? 'top' : 'middle'
);

$entityValueId = (int)($arResult['userField']['ENTITY_VALUE_ID'] ?? 0);
$defaultValue = $arResult['userField']['SETTINGS']['DEFAULT_VALUE'] ?? null;
if ($entityValueId < 1 && mb_strlen($defaultValue))
{
	$value = htmlspecialcharsbx(
		$arResult['additionalParameters']['SETTINGS']['DEFAULT_VALUE'] ?? null
	);
}

foreach($arResult['value'] as $key => $value)
{
	if (!empty($arUserField['SETTINGS']['VALUE']))
	{
		$value = round(
			(double)$arResult['additionalParameters']['VALUE'],
			$arResult['userField']['SETTINGS']['PRECISION']
		);
	}

	$attrList = [
		'type' => 'text',
		'size' => $arResult['additionalParameters']['SETTINGS']['SIZE'] ?? '',
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



