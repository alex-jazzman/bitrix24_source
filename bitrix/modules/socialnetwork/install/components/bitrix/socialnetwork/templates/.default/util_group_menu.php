<?php
if(!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED!==true)
{
	die();
}

use Bitrix\Socialnetwork\V2\Public\Provider\ProjectProvider;

/** @var CBitrixComponentTemplate $this */
/** @var CBitrixComponent $component */
/** @var array $arParams */
/** @var array $arResult */
/** @global CDatabase $DB */
/** @global CUser $USER */
/** @global CMain $APPLICATION */

$groupId = (int)$arResult['VARIABLES']['group_id'];

$projectProvider = new ProjectProvider();
if ($projectProvider->isProject($groupId))
{
	return;
}

$APPLICATION->includeComponent(
	'bitrix:socialnetwork.group_menu',
	'',
	[
		'GROUP_VAR' => $arResult['ALIASES']['group_id'],
		'PAGE_VAR' => $arResult['ALIASES']['page'],
		'PATH_TO_GROUP' => $arResult['PATH_TO_GROUP'],
		'PATH_TO_GROUP_MODS' => $arResult['PATH_TO_GROUP_MODS'],
		'PATH_TO_GROUP_USERS' => $arResult['PATH_TO_GROUP_USERS'],
		'PATH_TO_GROUP_EDIT' => $arResult['PATH_TO_GROUP_EDIT'],
		'PATH_TO_GROUP_REQUEST_SEARCH' => $arResult['PATH_TO_GROUP_REQUEST_SEARCH'],
		'PATH_TO_GROUP_REQUESTS' => $arResult['PATH_TO_GROUP_REQUESTS'],
		'PATH_TO_GROUP_REQUESTS_OUT' => $arResult['PATH_TO_GROUP_REQUESTS_OUT'],
		'PATH_TO_GROUP_BAN' => $arResult['PATH_TO_GROUP_BAN'],
		'PATH_TO_GROUP_BLOG' => $arResult['PATH_TO_GROUP_BLOG'],
		'PATH_TO_GROUP_MICROBLOG' => $arResult['PATH_TO_GROUP_MICROBLOG'],
		'PATH_TO_GROUP_PHOTO' => $arResult['PATH_TO_GROUP_PHOTO'],
		'PATH_TO_GROUP_FORUM' => $arResult['PATH_TO_GROUP_FORUM'],
		'PATH_TO_GROUP_CALENDAR' => $arResult['PATH_TO_GROUP_CALENDAR'],
		'PATH_TO_GROUP_FILES' => $arResult['PATH_TO_GROUP_FILES'],
		'PATH_TO_GROUP_TASKS' => $arResult['PATH_TO_GROUP_TASKS'],
		'PATH_TO_GROUP_CONTENT_SEARCH' => $arResult['PATH_TO_GROUP_CONTENT_SEARCH'],
		'GROUP_ID' => $groupId,
		'PAGE_ID' => $pageId ?? null,
		'USE_MAIN_MENU' => $arParams['USE_MAIN_MENU'],
		'MAIN_MENU_TYPE' => $arParams['MAIN_MENU_TYPE'],
	],
	$component,
	['HIDE_ICONS' => 'Y']
);

$APPLICATION->includeComponent(
	'bitrix:socialnetwork.admin.set',
	'',
	[],
	$component,
	['HIDE_ICONS' => 'Y']
);
