<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var array $arResult */
/** @var CMain $APPLICATION */
/** @var CBitrixComponent $component */

$activityId = (int)($arResult['VARIABLES']['activity_id'] ?? 0);

$APPLICATION->IncludeComponent(
	'bitrix:crm.activity.details.wrapper',
	'',
	[
		'activityId' => $activityId,
	],
	$component,
);
