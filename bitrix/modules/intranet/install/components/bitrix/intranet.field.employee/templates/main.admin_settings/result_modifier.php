<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arResult
 * @var array $additionalParameters
 */

if ($arResult['additionalParameters']['bVarsFromForm'] ?? false)
{
	$name = $arResult['additionalParameters']['NAME'] ?? '';

	$defaultValue = $GLOBALS[$name]['DEFAULT_VALUE'] ?? [];
}
elseif (is_array($arResult['userField'] ?? null))
{
	$defaultValue = $arResult['userField']['SETTINGS']['DEFAULT_VALUE'] ?? [];
}
else
{
	$defaultValue = [];
}

$arResult['values']['defaultValue'] = $defaultValue;
