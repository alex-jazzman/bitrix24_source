<?php

if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) die();

/**
 * @var array $arResult
 */

$value = '';

if($arResult['additionalParameters']['VALUE'] <> '')
{
	$value = round(
		(double)$arResult['additionalParameters']['VALUE'],
		$arResult['userField']['SETTINGS']['PRECISION']
	);
}

$arResult['value'] = $value;