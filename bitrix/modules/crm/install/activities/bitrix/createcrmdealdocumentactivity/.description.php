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
	'NODE_ACTION_SETTINGS' => [
		'INCLUDE' => ['crmdealcomplexactivity'],
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
