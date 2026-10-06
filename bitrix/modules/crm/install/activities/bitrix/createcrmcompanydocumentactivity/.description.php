<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\Enum\ActivityType;

$isActivityTypeAvailable = enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityType');

$arActivityDescription = [
	'NAME' => GetMessage('CRM_ACTIVITY_CREATE_COMPANY_NAME'),
	'DESCRIPTION' => GetMessage('CRM_ACTIVITY_CREATE_COMPANY_DESC'),
	'TYPE' => [
		$isActivityTypeAvailable
			? ActivityType::ACTIVITY->value
			: 'activity'
		,
		$isActivityTypeAvailable
			? ActivityType::NODE_ACTION->value
			: 'node_action'
		,
	],
	'CLASS' => 'CreateCrmCompanyDocumentActivity',
	'JSCLASS' => 'BizProcActivity',
	'CATEGORY' => [
		'ID' => 'document',
		"OWN_ID" => 'crm',
		"OWN_NAME" => 'CRM',
	],
	'RETURN' => [
		'CompanyId' => [
			'NAME' => GetMessage('CRM_ACTIVITY_CREATE_COMPANY_ID'),
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
			['id' => 'crm_company', 'title' => GetMessage('CRM_ACTIVITY_OBJECT_COMPANY')],
		],
		'CREATES_DOCUMENT' => true,
	];
}