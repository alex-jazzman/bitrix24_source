<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Crm\Integration\BizProc\Document\Dynamic;
use Bitrix\Crm\Integration\BizProc\Document\Order;
use Bitrix\Crm\Integration\BizProc\Document\Quote;
use Bitrix\Crm\Integration\BizProc\Document\SmartInvoice;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_ACTIVITY_SET_COMPANY_NAME_1'),
		description: Loc::getMessage('CRM_ACTIVITY_SET_COMPANY_DESC_1'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmSetCompanyField')
		->setJsClass('BizProcActivity')
		->setCategory([
			'ID' => 'document',
			'OWN_ID' => 'crm',
			'OWN_NAME' => 'CRM',
		])
		->setReturn([
			'ErrorMessage' => [
				'NAME' => Loc::getMessage('CRM_ACTIVITY_SET_COMPANY_ERROR_MESSAGE'),
				'TYPE' => 'string',
			],
		])
		->setFilter([
			'INCLUDE' => [
				['crm', 'CCrmDocumentLead'],
				['crm', 'CCrmDocumentDeal'],
				['crm', 'CCrmDocumentContact'],
				['crm', Dynamic::class],
				['crm', Quote::class],
				['crm', SmartInvoice::class],
				['crm', Order::class],
			],
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'GROUP' => ['clientData'],
			'SORT' => 4600,
		])
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;
