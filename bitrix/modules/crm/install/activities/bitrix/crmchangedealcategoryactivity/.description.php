<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

$arActivityDescription = [
	'NAME' => Loc::getMessage('CRM_CDCA_NAME_1'),
	'DESCRIPTION' => Loc::getMessage('CRM_CDCA_DESC_1'),
	'TYPE' => [
		'activity',
		'robot_activity',
		enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityType')
			? Bitrix\Bizproc\Activity\Enum\ActivityType::NODE_ACTION->value
			: 'node_action'
		,
	],
	'CLASS' => 'CrmChangeDealCategoryActivity',
	'JSCLASS' => 'BizProcActivity',
	'CATEGORY' => [
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	],
	'FILTER' => [
		'INCLUDE' => [
			['crm', 'CCrmDocumentDeal'],
		],
	],
	'ROBOT_SETTINGS' => [
		'CATEGORY' => 'employee',
		'GROUP' => ['elementControl'],
		'SORT' => 2800,
	],
	'NODE_ACTION_SETTINGS' => [
		'INCLUDE' => ['crmdealcomplexactivity'],
		'HANDLES_DOCUMENT' => true,
	],
	'AI_DESCRIPTION' => 'Moves deal to the specified category and stage and stops all current unfinished robots and workflows',
];
