<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Crm\Integration\BizProc\Document\Dynamic;
use Bitrix\Crm\Integration\BizProc\Document\Invoice;
use Bitrix\Crm\Integration\BizProc\Document\Order;
use Bitrix\Crm\Integration\BizProc\Document\Quote;
use Bitrix\Crm\Integration\BizProc\Document\SmartDocument;
use Bitrix\Crm\Integration\BizProc\Document\SmartInvoice;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_CHANGE_RESPONSIBLE_NAME_1'),
		description: Loc::getMessage('CRM_CHANGE_RESPONSIBLE_DESC_1'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmChangeResponsibleActivity')
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
				['crm', Invoice::class],
				['crm', Dynamic::class],
				['crm', Quote::class],
				['crm', SmartInvoice::class],
				['crm', SmartDocument::class],
			],
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'RESPONSIBLE_PROPERTY' => 'Responsible',
			'GROUP' => ['elementControl'],
			'ASSOCIATED_TRIGGERS' => [
				'RESP_CHANGED' => 1,
			],
			'SORT' => 2600,
		])
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;
