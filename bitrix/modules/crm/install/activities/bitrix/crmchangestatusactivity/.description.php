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
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
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
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->set('AI_DESCRIPTION', 'Changes element status and completes workflow')
		->toArray()
;
