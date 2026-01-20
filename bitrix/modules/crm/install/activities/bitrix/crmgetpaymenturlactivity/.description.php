<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('CRM_BP_GPU_DESC_NAME'),
	description: Loc::getMessage('CRM_BP_GPU_DESC_DESC_1_MSGVER_1'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('CrmGetPaymentUrlActivity')
	->setJsClass('BizProcActivity')
	->setReturn([
		'Url' => [
			'NAME' => Loc::getMessage('CRM_BP_GPU_RETURN_URL'),
			'TYPE' => 'string',
		],
	])
	->setFilter([
		'INCLUDE' => [
			[ 'crm', 'CCrmDocumentDeal' ],
			[ 'crm', \Bitrix\Crm\Integration\BizProc\Document\SmartInvoice::class ],
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => [ 'payment' ],
		'SORT' => 700,
		'IS_SUPPORTING_ROBOT' => true,
	])
	->setGroups([ ActivityGroup::PAYMENT->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::PAYMENT_TERMINAL->name)
	->toArray()
;
