<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)
{
	die();
}

use Bitrix\Lists\Copy\Integration\Group;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Localization\Loc;
use Bitrix\Socialnetwork\V2\Public\Provider\ProjectProvider;

/** @var CBitrixComponentTemplate $this */
/** @var CBitrixComponent $component */
/** @var array $arParams */
/** @var array $arResult */
/** @global CDatabase $DB */
/** @global CUser $USER */
/** @global CMain $APPLICATION */

$pageId = 'group_group_lists';
$groupId = (int)$arResult['VARIABLES']['group_id'];

$projectProvider = (class_exists(ProjectProvider::class) ?  new ProjectProvider() : null);
if (!$projectProvider || !$projectProvider->isProject($groupId))
{
	$templatePath = '/bitrix/components/bitrix/socialnetwork_group/templates/';

	include($_SERVER['DOCUMENT_ROOT'] . $templatePath . '.default/util_group_menu.php');
	include($_SERVER['DOCUMENT_ROOT'] . $templatePath . '.default/util_group_profile.php');
}

$iblockTypeId = Option::get('lists', 'socnet_iblock_type_id');

$APPLICATION->IncludeComponent('bitrix:lists.element.navchain', '.default', [
	'IBLOCK_TYPE_ID' => $iblockTypeId,
	'SOCNET_GROUP_ID' => $groupId,
	'ADD_NAVCHAIN_GROUP' => 'Y',
	'PATH_TO_GROUP' => $arResult['PATH_TO_GROUP'],
	'LISTS_URL' => $arResult['PATH_TO_GROUP_LISTS'],
	'ADD_NAVCHAIN_LIST' => 'N',
	'ADD_NAVCHAIN_SECTIONS' => 'N',
	'ADD_NAVCHAIN_ELEMENT' => 'N',
], $component);

$APPLICATION->includeComponent(
	'bitrix:socialnetwork.copy.checker',
	'',
	[
		'moduleId' => Group::MODULE_ID,
		'queueId' => $groupId,
		'stepperClassName' => Group::STEPPER_CLASS,
		'checkerOption' => Group::CHECKER_OPTION,
		'errorOption' => Group::ERROR_OPTION,
		'titleMessage' => Loc::getMessage('LISTS_STEPPER_PROGRESS_TITLE'),
		'errorMessage' => Loc::getMessage('LISTS_STEPPER_PROGRESS_ERROR'),
	],
	$component,
	['HIDE_ICONS' => 'Y']
);

$APPLICATION->IncludeComponent('bitrix:lists.lists', '.default', [
	'IBLOCK_TYPE_ID' => $iblockTypeId,
	'LISTS_URL' => $arResult['PATH_TO_GROUP_LISTS'],
	'LIST_URL' => $arResult['PATH_TO_GROUP_LIST_VIEW'],
	'LIST_EDIT_URL' => $arResult['PATH_TO_GROUP_LIST_EDIT'],
	'CACHE_TYPE' => $arParams['CACHE_TYPE'],
	'CACHE_TIME' => $arParams['CACHE_TIME'],
	'LINE_ELEMENT_COUNT' => 3,
	'SOCNET_GROUP_ID' => $groupId,
	'TITLE_TEXT' => Loc::getMessage('LISTS_SOCNET_TAB'),
], $component);
