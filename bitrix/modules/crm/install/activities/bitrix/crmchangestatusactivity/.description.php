<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Crm\Integration\BizProc\Document\SmartDocument;
use Bitrix\Crm\Integration\BizProc\Document\SmartInvoice;
use Bitrix\Crm\Integration\BizProc\Document\Quote;
use Bitrix\Crm\Integration\BizProc\Document\Dynamic;
use Bitrix\Crm\Integration\BizProc\Document\Order;
use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActionArea;
use Bitrix\Bizproc\Activity\Enum\ActionGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$description =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_CHANGE_STATUS_NAME_1'),
		description: Loc::getMessage('CRM_CHANGE_STATUS_DESC_2'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmChangeStatusActivity')
		->setJsClass('BizProcActivity')
		->setCategory([
			'ID' => 'document',
			'OWN_ID' => 'crm',
			'OWN_NAME' => 'CRM',
		])
		->setFilter([
			'INCLUDE' => [
				['crm', 'CCrmDocumentDeal'],
				['crm', 'CCrmDocumentLead'],
				['crm', Order::class],
				['crm', Dynamic::class],
				['crm', Quote::class],
				['crm', SmartInvoice::class],
				['crm', SmartDocument::class],
			],
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'GROUP' => ['elementControl'],
			'SORT' => 2700,
		])
		->set('AI_DESCRIPTION', 'Changes element status and completes workflow')
;

if (
	enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionGroup')
	&& enum_exists('\Bitrix\Bizproc\Activity\Enum\ActionArea')
)
{
	$description->setNodeActionSettings([
		'HANDLES_DOCUMENT' => true,
		'ACTION_GROUP' => ActionGroup::CHANGE_STATUS->value,
		'ACTION_AREA' => ActionArea::CRM->value,
		'ACTION_OBJECTS' => [
			['id' => 'crm_deal', 'title' => Loc::getMessage('CRM_ACTIVITY_OBJECT_DEAL')],
			['id' => 'crm_lead', 'title' => Loc::getMessage('CRM_ACTIVITY_OBJECT_LEAD')],
			['id' => 'crm_quote', 'title' => Loc::getMessage('CRM_ACTIVITY_OBJECT_QUOTE')],
			['id' => 'crm_order', 'title' => Loc::getMessage('CRM_ACTIVITY_OBJECT_ORDER')],
			['id' => 'crm_invoice', 'title' => Loc::getMessage('CRM_ACTIVITY_OBJECT_INVOICE')],
		],
	]);
}

$arActivityDescription = $description->toArray();
