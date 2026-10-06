<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$isActivityTypeAvailable = enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityType');

$arActivityDescription = [
	'NAME' => GetMessage('CRM_ACTIVITY_CREATE_LEAD_NAME'),
	'DESCRIPTION' => GetMessage('CRM_ACTIVITY_CREATE_LEAD_DESC'),
	'TYPE' => [
		$isActivityTypeAvailable
			? \Bitrix\Bizproc\Activity\Enum\ActivityType::ACTIVITY->value
			: 'activity'
		,
		$isActivityTypeAvailable
			? \Bitrix\Bizproc\Activity\Enum\ActivityType::NODE_ACTION->value
			: 'node_action'
		,
	],
	'CLASS' => 'CreateCrmLeadDocumentActivity',
	'JSCLASS' => 'BizProcActivity',
	'CATEGORY' => [
		'ID' => 'document',
		"OWN_ID" => 'crm',
		"OWN_NAME" => 'CRM',
	],
	'RETURN' => [
		'LeadId' => [
			'NAME' => GetMessage('CRM_ACTIVITY_CREATE_LEAD_ID'),
			'TYPE' => 'int',
		],
		'ErrorMessage' => [
			'NAME' => GetMessage('CRM_ACTIVITY_CREATE_ERROR_MESSAGE'),
			'TYPE' => 'string',
		],
	],
];

if (
	enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionGroup')
	&& enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionArea')
)
{
	$arActivityDescription['NODE_ACTION_SETTINGS'] = [
		'HANDLES_DOCUMENT' => false,
		'ACTION_GROUP' => \Bitrix\Bizproc\Activity\Enum\ActionGroup::CREATE->value,
		'ACTION_AREA' => \Bitrix\Bizproc\Activity\Enum\ActionArea::CRM->value,
		'ACTION_OBJECTS' => [
			['id' => 'crm_lead', 'title' => GetMessage('CRM_ACTIVITY_OBJECT_LEAD')],
		],
		'CREATES_DOCUMENT' => true,
	];
}