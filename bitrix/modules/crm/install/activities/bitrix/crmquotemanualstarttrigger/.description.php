<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

if (!Loader::includeModule('crm'))
{
	return;
}

$documentType = \CCrmBizProcHelper::ResolveDocumentType(\CCrmOwnerType::Quote);

$arActivityDescription =
	(new ActivityDescription(
		Loc::getMessage('CRM_QUOTE_MANUAL_START_TRIGGER_NAME') ?? '',
		Loc::getMessage('CRM_QUOTE_MANUAL_START_TRIGGER_DESCRIPTION') ?? '',
		[ActivityType::TRIGGER->value],
	))
		->setClass('CrmQuoteManualStartTrigger')
		->setGroups([ActivityGroup::STARTER->value])
		->setColorIndex(ActivityColorIndex::ORANGE->value)
		->setIcon(Outline::SUITCASE->name)
		->setReturn([
			'ReturnDocument' => [
				'Name' => \CBPRuntime::getRuntime()->getDocumentService()->getDocumentTypeName($documentType),
				'Type' => FieldType::DOCUMENT,
				'Default' => $documentType,
			],
		])
		->setAdditionalResult(['Return'])
		->toArray()
;