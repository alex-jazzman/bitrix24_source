<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

$arActivityDescription = [
	'NAME' => GetMessage('CRM_ACTIVITY_CREATE_DEAL_NAME'),
	'DESCRIPTION' => GetMessage('CRM_ACTIVITY_CREATE_DEAL_DESC'),
	'TYPE' => [
		'activity',
		enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityType')
			? \Bitrix\Bizproc\Activity\Enum\ActivityType::NODE_ACTION->value
			: 'node_action'
		,
	],
	'CLASS' => 'CreateCrmDealDocumentActivity',
	'JSCLASS' => 'BizProcActivity',
	'CATEGORY' => [
		'ID' => 'document',
		"OWN_ID" => 'crm',
		"OWN_NAME" => 'CRM',
	],
	'RETURN' => [
		'DealId' => [
			'NAME' => GetMessage('CRM_ACTIVITY_CREATE_DEAL_ID'),
			'TYPE' => 'int',
		],
		'ErrorMessage' => [
			'NAME' => GetMessage('CRM_ACTIVITY_CREATE_MESSAGE'),
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
			['id' => 'crm_deal', 'title' => GetMessage('CRM_ACTIVITY_OBJECT_DEAL')],
		],
		'CREATES_DOCUMENT' => true,
	];
}
