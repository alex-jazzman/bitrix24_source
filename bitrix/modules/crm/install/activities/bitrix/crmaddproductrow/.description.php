<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Crm\Activity\Access\CatalogAccessChecker;
use Bitrix\Crm\Integration\BizProc\Document\Dynamic;
use Bitrix\Crm\Integration\BizProc\Document\Order;
use Bitrix\Crm\Integration\BizProc\Document\Quote;
use Bitrix\Crm\Integration\BizProc\Document\SmartDocument;
use Bitrix\Crm\Integration\BizProc\Document\SmartInvoice;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_APR_NAME'),
		description: Loc::getMessage('CRM_APR_DESC_2'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setCategory([
			'ID' => 'document',
			'OWN_ID' => 'crm',
			'OWN_NAME' => 'CRM',
		])
		->setClass('CrmAddProductRow')
		->setJsClass('BizProcActivity')
		->setFilter([
			'INCLUDE' => [
				['crm', 'CCrmDocumentDeal'],
				['crm', SmartInvoice::class],
				['crm', SmartDocument::class],
				['crm', Quote::class],
				['crm', Order::class],
			],
		])
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'GROUP' => ['goods'],
			'SORT' => 400,
		])
		->toArray()
;

if (Loader::includeModule('crm'))
{
	if (!CatalogAccessChecker::hasAccess())
	{
		$arActivityDescription['EXCLUDED'] = true;
	}
	else
	{
		$arActivityDescription['FILTER']['INCLUDE'] = array_merge(
			$arActivityDescription['FILTER']['INCLUDE'],
			CCrmBizProcHelper::getDynamicDocumentTypesWithProducts()
		);
	}
}
