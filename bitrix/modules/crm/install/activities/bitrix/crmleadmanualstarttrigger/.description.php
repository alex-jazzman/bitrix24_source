<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (
	!class_exists(\Bitrix\Bizproc\Activity\ActivityDescription::class)
	|| !\Bitrix\Main\Loader::includeModule('crm')
)
{
	return;
}

use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$documentType = \CCrmBizProcHelper::ResolveDocumentType(\CCrmOwnerType::Lead);
$document = [
	'Name' => \CBPRuntime::getRuntime()->getDocumentService()->getDocumentTypeName($documentType),
	'Type' => FieldType::DOCUMENT,
	'Default' => $documentType,
];

$arActivityDescription =
	(new \Bitrix\Bizproc\Activity\ActivityDescription(
		Loc::getMessage('BP_CRM_CRM_LEAD_START_TRIGGER_NAME_MSG_V1') ?? '',
		Loc::getMessage('BP_CRM_CRM_LEAD_START_TRIGGER_DESCR') ?? '',
		[\Bitrix\Bizproc\Activity\Enum\ActivityType::TRIGGER->value],
	))
		->setClass('CrmLeadManualStartTrigger')
		->setCategory(['ID' => 'document'])
		->setGroups([
			ActivityGroup::STARTER->value,
			ActivityGroup::SALES_CRM->value,
		])
		->setColorIndex(ActivityColorIndex::ORANGE->value)
		->setIcon(Outline::LEAD->name)
		->setReturn([
			'ReturnDocument' => $document,
			'Initiator' => [
				'Name' => Loc::getMessage('BP_CRM_CRM_LEAD_START_TRIGGER_RETURN_INITIATOR') ?? '',
				'Type' => FieldType::USER,
				'Default' => null,
			],
			'EventDateTime' => [
				'Name' => Loc::getMessage('BP_CRM_CRM_LEAD_START_TRIGGER_RETURN_EVENT_DATE_TIME') ?? '',
				'Type' => FieldType::DATETIME,
				'Default' => null,
			],
		])
		->setAdditionalResult(['Return'])
		->toArray()
;
