<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = [
	'NAME' => Loc::getMessage('CRM_ACTIVITY_EVENT_ADD_NAME'),
	'DESCRIPTION' => Loc::getMessage('CRM_ACTIVITY_EVENT_ADD_DESC_1'),
	'TYPE' => ['activity', 'robot_activity', 'node'],
	'CLASS' => 'CrmEventAddActivity',
	'JSCLASS' => 'BizProcActivity',
	'CATEGORY' => [
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	],
	'FILTER' => [
		'INCLUDE' => [
			['crm'],
		],
	],
	'ROBOT_SETTINGS' => [
		'CATEGORY' => 'employee',
		'TITLE' => Loc::getMessage('CRM_ACTIVITY_EVENT_ADD_ROBOT_TITLE_1'),
		'GROUP' => ['employeeControl'],
		'SORT' => 1900,
	],
];

if (class_exists(ActivityColorIndex::class) && class_exists(Outline::class))
{
	$arActivityDescription += [
		'COLOR_INDEX' => ActivityColorIndex::BLUE->value,
		'GROUPS' => [
			ActivityGroup::SALES_CRM->value,
		],
		'NODE_ICON' => Outline::FILE_WITH_CLOCK->name,
	];
}
