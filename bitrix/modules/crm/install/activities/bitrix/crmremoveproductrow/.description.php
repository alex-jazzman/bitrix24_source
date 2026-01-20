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
use Bitrix\Crm\Integration\BizProc\Document\SmartDocument;
use Bitrix\Crm\Integration\BizProc\Document\SmartInvoice;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_RMPR_NAME_MSGVER_1'),
		description: Loc::getMessage('CRM_RMPR_DESC_2_MSGVER_1'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmRemoveProductRow')
		->setJsClass('BizProcActivity')
		->setCategory([
			'ID' => 'document',
			'OWN_ID' => 'crm',
			'OWN_NAME' => 'CRM',
		])
		->setFilter([
			'INCLUDE' => [
				['crm', 'CCrmDocumentDeal'],
				['crm', SmartInvoice::class],
				['crm', Quote::class],
				['crm', Order::class],
				['crm', SmartDocument::class],
			],
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'GROUP' => ['goods'],
			'SORT' => 700,
		])
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;

if (Loader::includeModule('crm'))
{
	$arActivityDescription['FILTER']['INCLUDE'] = array_merge(
		$arActivityDescription['FILTER']['INCLUDE'],
		CCrmBizProcHelper::getDynamicDocumentTypesWithProducts()
	);
}
