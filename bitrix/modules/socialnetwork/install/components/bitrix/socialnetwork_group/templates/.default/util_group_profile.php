<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

/** @var CBitrixComponent $component */
/** @var array $arParams */
/** @var array $arResult */
/** @global CMain $APPLICATION */

if (
	(defined('SONET_GROUP_NEEDED') && SONET_GROUP_NEEDED === true)
	|| (
		!defined('SITE_TEMPLATE_ID')
		|| (SITE_TEMPLATE_ID !== 'bitrix24' && SITE_TEMPLATE_ID !== 'air')
	)
)
{
	$arGroup = $APPLICATION->IncludeComponent(
		"bitrix:socialnetwork.group",
		"short",
		Array(
			"PATH_TO_USER" => $arParams["PATH_TO_USER"],
			"PATH_TO_GROUP" => $arResult["PATH_TO_GROUP"],
			"PATH_TO_GROUP_EDIT" => $arResult["PATH_TO_GROUP_EDIT"],
			"PATH_TO_GROUP_CREATE" => $arResult["PATH_TO_GROUP_CREATE"],
			"PATH_TO_GROUP_REQUEST_SEARCH" => $arResult["PATH_TO_GROUP_REQUEST_SEARCH"],
			"PATH_TO_USER_REQUEST_GROUP" => $arResult["PATH_TO_USER_REQUEST_GROUP"],
			"PATH_TO_GROUP_REQUESTS" => $arResult["PATH_TO_GROUP_REQUESTS"],
			"PATH_TO_GROUP_REQUESTS_OUT" => $arResult["PATH_TO_GROUP_REQUESTS_OUT"],
			"PATH_TO_GROUP_MODS" => $arResult["PATH_TO_GROUP_MODS"],
			"PATH_TO_GROUP_USERS" => $arResult["PATH_TO_GROUP_USERS"],
			"PATH_TO_USER_LEAVE_GROUP" => $arResult["PATH_TO_USER_LEAVE_GROUP"],
			"PATH_TO_GROUP_DELETE" => $arResult["PATH_TO_GROUP_DELETE"],
			"PATH_TO_GROUP_FEATURES" => $arResult["PATH_TO_GROUP_FEATURES"],
			"PATH_TO_GROUP_BAN" => $arResult["PATH_TO_GROUP_BAN"],
			"PATH_TO_SEARCH" => $arResult["PATH_TO_SEARCH"],
			"PATH_TO_MESSAGE_TO_GROUP" => $arResult["PATH_TO_MESSAGE_TO_GROUP"],
			"PAGE_VAR" => $arResult["ALIASES"]["page"] ?? null,
			"USER_VAR" => $arResult["ALIASES"]["user_id"] ?? null,
			"GROUP_VAR" => $arResult["ALIASES"]["group_id"] ?? null,
			"SET_TITLE" => "N",
			"SET_NAV_CHAIN" => "N",
			"SHORT_FORM" => "Y",
			"USER_ID" => $arResult["VARIABLES"]["user_id"] ?? null,
			"GROUP_ID" => $arResult["VARIABLES"]["group_id"],
			"ITEMS_COUNT" => $arParams["ITEM_MAIN_COUNT"],
			"GROUP_PROPERTY" => $arResult["GROUP_PROPERTY"]
		),
		$component,
		array("HIDE_ICONS" => "Y")
	);
}
