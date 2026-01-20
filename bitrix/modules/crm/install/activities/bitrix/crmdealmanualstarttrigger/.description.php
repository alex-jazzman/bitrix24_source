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

$documentType = \CCrmBizProcHelper::ResolveDocumentType(\CCrmOwnerType::Deal);
$document = [
	'Name' => \CBPRuntime::getRuntime()->getDocumentService()->getDocumentTypeName($documentType),
	'Type' => FieldType::DOCUMENT,
	'Default' => $documentType,
];

$arActivityDescription =
	(new \Bitrix\Bizproc\Activity\ActivityDescription(
		Loc::getMessage('BP_CRM_CRM_DEAL_START_TRIGGER_NAME') ?? '',
		Loc::getMessage('BP_CRM_CRM_DEAL_START_TRIGGER_DESCR') ?? '',
		[\Bitrix\Bizproc\Activity\Enum\ActivityType::TRIGGER->value]
	))
		->setClass('CrmDealManualStartTrigger')
		->setCategory(['ID' => 'document'])
		->setGroups([ ActivityGroup::STARTER->value ])
		->setColorIndex(ActivityColorIndex::ORANGE->value)
		->setIcon(Outline::HANDSHAKE->name)
		->setReturn([
			'ReturnDocument' => $document,
		])
		->setAdditionalResult(['Return'])
		->toArray()
;
