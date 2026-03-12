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
	name: Loc::getMessage('CRM_BP_OPAY_NAME_1') ?? '',
	description: Loc::getMessage('CRM_BP_OPAY_DESC_2') ?? '',
	type: [
		ActivityType::ACTIVITY->value,
		ActivityType::ROBOT->value,
		ActivityType::NODE->value,
	],
))
	->setClass('CrmOrderPayActivity')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setCategory([
		'ID' => 'document',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setFilter([
		'INCLUDE' => [
			['crm', 'CCrmDocumentDeal'],
			['crm', \Bitrix\Crm\Integration\BizProc\Document\SmartInvoice::class],
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => ['payment'],
		'ASSOCIATED_TRIGGERS' => [
			'INVOICE' => -2,
			'ORDER_PAID' => -1,
		],
		'SORT' => 800,
	])
	->setGroups([
		ActivityGroup::PAYMENT->value,
	])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::PAYMENT_TERMINAL->name)
	->toArray()
;