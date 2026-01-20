<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Crm\Integration\BizProc\Document\Dynamic;
use Bitrix\Crm\Integration\BizProc\Document\SmartDocument;
use Bitrix\Crm\Integration\BizProc\Document\SmartInvoice;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_SOF_NAME_1'),
		description: Loc::getMessage('CRM_SOF_DESC_1'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmSetObserverField')
		->setJsClass('BizProcActivity')
		->setCategory([
			'ID' => 'document',
			'OWN_ID' => 'crm',
			'OWN_NAME' => 'CRM',
		])
		->setFilter([
			'INCLUDE' => [
				['crm', 'CCrmDocumentLead'],
				['crm', 'CCrmDocumentDeal'],
				['crm', 'CCrmDocumentContact'],
				['crm', 'CCrmDocumentCompany'],
				['crm', SmartDocument::class],
				['crm', Dynamic::class],
				['crm', SmartInvoice::class],
			],
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'GROUP' => ['elementControl'],
			'SORT' => 2500,
		])
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;
