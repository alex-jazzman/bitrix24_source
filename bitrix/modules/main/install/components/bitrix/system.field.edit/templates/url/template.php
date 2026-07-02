<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var array $arParams
 */

$arUserField = $arParams['arUserField'];
if($arUserField['MULTIPLE'] === 'Y')
{
	$arUserField['FIELD_NAME'] = str_replace('[]', '', $arUserField['FIELD_NAME']);
}

echo \CUserTypeUrl::GetPublicEdit($arUserField);