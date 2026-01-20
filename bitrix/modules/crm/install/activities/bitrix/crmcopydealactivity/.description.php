<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_CDA_NAME'),
		description: Loc::getMessage('CRM_CDA_DESC_1'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmCopyDealActivity')
		->setJsClass('BizProcActivity')
		->setCategory([
			'ID' => 'document',
			'OWN_ID' => 'crm',
			'OWN_NAME' => 'CRM',
		])
		->setReturn([
			'DealId' => [
				'NAME' => Loc::getMessage('CRM_CDA_RETURN_DEAL_ID'),
				'TYPE' => 'int',
			],
		])
		->setFilter([
			'INCLUDE' => [
				['crm', 'CCrmDocumentDeal'],
			],
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'RESPONSIBLE_PROPERTY' => 'Responsible',
			'GROUP' => ['repeatSales'],
			'SORT' => 3200,
		])
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;
