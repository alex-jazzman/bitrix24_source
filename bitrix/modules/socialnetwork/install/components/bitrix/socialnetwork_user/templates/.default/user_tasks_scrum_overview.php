<?php
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) {
	die();
}

/** @var CBitrixComponentTemplate $this */
/** @var array $arParams */
/** @var array $arResult */
/** @global CDatabase $DB */
/** @global CUser $USER */
/** @global CMain $APPLICATION */

use Bitrix\Main\Localization\Loc;
use Bitrix\Socialnetwork\Component\WorkgroupList;
use Bitrix\Tasks\Helper\Analytics;
use Bitrix\Tasks\TourGuide;

$pageId = 'user_tasks_scrum_overview';
include('util_menu.php');
include('util_profile.php');

Loc::loadLanguageFile($_SERVER['DOCUMENT_ROOT'] . $this->getFolder() . '/result_modifier.php');

$userId = $arResult['VARIABLES']['user_id'];
$isLegacyMode = !\Bitrix\Socialnetwork\V2\Feature::isNewProjectsOn();

if (!CSocNetFeatures::IsActiveFeature(SONET_ENTITY_USER, $userId, 'tasks'))
{
	echo Loc::getMessage(
		'SU_T_TASKS_UNAVAILABLE',
		[
			'#A_BEGIN#' =>
				'<a href="'
				. str_replace(['#user_id#', '#USER_ID#'], $userId, $arResult['PATH_TO_USER_FEATURES'])
				. '">'
			,
			'#A_END#' => '</a>',
		]
	);
}
elseif (\CModule::IncludeModule('tasks'))
{
	$userReplace = ['user_id' => $userId];

	$firstScrumCreationTour = TourGuide\FirstScrumCreation::getInstance($userId);
	$popupData = $firstScrumCreationTour->getCurrentStepPopupData();
	$showTour = $firstScrumCreationTour->proceed();
	if ($showTour)
	{
		$logger = Analytics::getInstance();
		if (method_exists($logger, 'onFirstProjectCreation'))
		{
			$logger->onFirstProjectCreation();
		}
	}

	if ($isLegacyMode)
	{
		$APPLICATION->IncludeComponent(
			'bitrix:ui.sidepanel.wrapper',
			'',
			[
				'POPUP_COMPONENT_NAME' => 'bitrix:socialnetwork.group.list',
				'POPUP_COMPONENT_TEMPLATE_NAME' => '',
				'POPUP_COMPONENT_PARAMS' => [
					'USER_ID' => $userId,
					'PATH_TO_GROUP' => $arResult['PATH_TO_GROUP'] ?? '',
					'PATH_TO_GROUP_CREATE' => $arParams['PATH_TO_GROUP_CREATE'] ?? '',
					'PATH_TO_GROUP_EDIT' => $arResult['PATH_TO_GROUP_EDIT'] ?? '',
					'PATH_TO_GROUP_DELETE' => $arResult['PATH_TO_GROUP_DELETE'] ?? '',
					'PATH_TO_GROUP_TASKS' => $arParams['PATH_TO_GROUP_TASKS'] ?? '',
					'PATH_TO_USER' => $arResult['PATH_TO_USER'] ?? '',
					'PATH_TO_USER_TASKS' => $arResult['PATH_TO_USER_TASKS'] ?? '',
					'PATH_TO_USER_TASKS_TEMPLATES' => $arResult['PATH_TO_USER_TASKS_TEMPLATES'] ?? '',
					'PAGE' => $pageId,
					'MODE' => WorkgroupList::MODE_TASKS_SCRUM,
					'TOURS' => [
						'firstScrumCreation' => [
							'targetNodeId' => 'projectAddButton',
							'popupData' => $popupData,
							'show' => $showTour,
						],
					],
					'SET_TITLE' => $arResult['SET_TITLE'],
					'MARK_SECTION_SCRUM_LIST' => 'Y',
				],
				'POPUP_COMPONENT_PARENT' => $component,
				'USE_UI_TOOLBAR' => 'Y',
			]
		);

		return;
	}

	$APPLICATION->IncludeComponent(
		'bitrix:ui.sidepanel.wrapper',
		'',
		[
			'POPUP_COMPONENT_NAME' => 'bitrix:socialnetwork.project.list',
			'POPUP_COMPONENT_TEMPLATE_NAME' => '',
			'POPUP_COMPONENT_PARAMS' => [
				'USER_ID' => $userId,
				'PATH_TO_GROUP' => $arResult['PATH_TO_GROUP'] ?? '',
				'PATH_TO_GROUP_CREATE' => $arParams['PATH_TO_GROUP_CREATE'] ?? '',
				'PATH_TO_GROUP_EDIT' => $arResult['PATH_TO_GROUP_EDIT'] ?? '',
				'PATH_TO_GROUP_DELETE' => $arResult['PATH_TO_GROUP_DELETE'] ?? '',
				'PATH_TO_GROUP_TASKS' => $arParams['PATH_TO_GROUP_TASKS'] ?? '',
				'PATH_TO_USER' => $arResult['PATH_TO_USER'] ?? '',
				'PATH_TO_USER_TASKS' => $arResult['PATH_TO_USER_TASKS'] ?? '',
				'PATH_TO_USER_TASKS_TEMPLATES' => $arResult['PATH_TO_USER_TASKS_TEMPLATES'] ?? '',
				'PAGE' => $pageId,
				'MODE' => WorkgroupList::MODE_TASKS_SCRUM,
				'TOURS' => [
					'firstScrumCreation' => [
						'targetNodeId' => 'projectAddButton',
						'popupData' => $popupData,
						'show' => $showTour,
					],
				],
				'SET_TITLE' => $arResult['SET_TITLE'],
				'MARK_SECTION_SCRUM_LIST' => 'Y',
			],
			'POPUP_COMPONENT_PARENT' => $component,
			'USE_UI_TOOLBAR' => 'Y',
		]
	);
}
