<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}
/** @var CBitrixComponentTemplate $this */
/** @var array $arParams */
/** @var array $arResult */
/** @global CDatabase $DB */
/** @global CUser $USER */
/** @global CMain $APPLICATION */
/** @global CIntranetToolbar $INTRANET_TOOLBAR */

global $INTRANET_TOOLBAR;

$component = $this->getComponent();
$isLegacyMode = !\Bitrix\Socialnetwork\V2\Feature::isNewProjectsOn();

if (CModule::IncludeModule('intranet'))
{
	$INTRANET_TOOLBAR->Show();
}

if ($isLegacyMode)
{
	$APPLICATION->IncludeComponent(
		'bitrix:socialnetwork.group.list',
		'',
		[
			'PATH_TO_GROUP' => $arResult['PATH_TO_GROUP'] ?? null,
			'PATH_TO_GROUP_CREATE' => $arParams['PATH_TO_GROUP_CREATE'] ?? null,
			'PATH_TO_GROUP_EDIT' => $arResult['PATH_TO_GROUP_EDIT'] ?? null,
			'PATH_TO_GROUP_DELETE' => $arResult['PATH_TO_GROUP_DELETE'] ?? null,
			'PATH_TO_USER' => $arParams['PATH_TO_USER'] ?? null,
			'PAGE' => 'groups_list',
			'SET_TITLE' => $arResult['SET_TITLE'] ?? null,
			'SET_NAV_CHAIN' => $arResult['SET_NAV_CHAIN'] ?? null,
			'USE_UI_TOOLBAR' => 'Y',
		],
		$component
	);

	return;
}

$APPLICATION->IncludeComponent(
	'bitrix:socialnetwork.project.list',
	'',
	[
		'PATH_TO_GROUP' => $arResult['PATH_TO_GROUP'] ?? null,
		'PATH_TO_GROUP_CREATE' => $arParams['PATH_TO_GROUP_CREATE'] ?? null,
		'PATH_TO_GROUP_EDIT' => $arResult['PATH_TO_GROUP_EDIT'] ?? null,
		'PATH_TO_GROUP_DELETE' => $arResult['PATH_TO_GROUP_DELETE'] ?? null,
		'PATH_TO_USER' => $arParams['PATH_TO_USER'] ?? null,
		'PAGE' => 'groups_list',
		'MODE' => \Bitrix\Socialnetwork\Component\WorkgroupList::MODE_COMMON,
		'SET_TITLE' => $arResult['SET_TITLE'] ?? null,
		'SET_NAV_CHAIN' => $arResult['SET_NAV_CHAIN'] ?? null,
		'USE_UI_TOOLBAR' => 'Y',
	],
	$component
);
