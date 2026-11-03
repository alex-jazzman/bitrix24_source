<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\Enum\ActionArea;
use Bitrix\Bizproc\Activity\Enum\ActionGroup;
use Bitrix\Bizproc\Internal\Config\NodeVariableActionsFeature;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = [
	'NAME' => Loc::getMessage('BPSGVA_DESCR_NAME_MGVER_1'),
	'DESCRIPTION' => Loc::getMessage('BPSGVA_DESCR_DESCR_1'),
	'TYPE' => NodeVariableActionsFeature::isEnabled()
		? ['activity', 'robot_activity', 'node_action']
		: ['activity', 'robot_activity'],
	'CLASS' => 'SetGlobalVariableActivity',
	'JSCLASS' => 'BizProcActivity',
	'CATEGORY' => [
		'ID' => 'other',
	],
	'ROBOT_SETTINGS' => [
		'TITLE' => Loc::getMessage('BPSGVA_DESCR_ROBOT_TITLE_2'),
		'CATEGORY' => 'employee',
		'GROUP' => ['modificationData'],
		'SORT' => 5200,
	],
	'NODE_ACTION_SETTINGS' => [
		'ACTION_GROUP' => ActionGroup::UPDATE->value,
		'ACTION_AREA' => ActionArea::BIZPROC->value,
		'ACTION_OBJECTS' => [
			['id' => 'global_variable', 'title' => Loc::getMessage('BPSGVA_DESCR_OBJECT_GLOBAL_VARIABLE')],
		],
	],
];
