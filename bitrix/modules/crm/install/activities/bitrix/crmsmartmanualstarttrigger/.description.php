<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!class_exists(\Bitrix\Bizproc\Activity\ActivityDescription::class))
{
	return;
}

use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription =
	(new \Bitrix\Bizproc\Activity\ActivityDescription(
		Loc::getMessage('BP_CRM_CRM_SMART_START_TRIGGER_NAME') ?? '',
		Loc::getMessage('BP_CRM_CRM_SMART_START_TRIGGER_DESCR') ?? '',
		[\Bitrix\Bizproc\Activity\Enum\ActivityType::TRIGGER->value]
	))
		->setClass('CrmSmartManualStartTrigger')
		->setCategory(['ID' => 'document'])
		->setGroups([ ActivityGroup::STARTER->value ])
		->setColorIndex(ActivityColorIndex::ORANGE->value)
		->setIcon(Outline::SMART_PROCESS->name)
		->setAdditionalResult(['Return'])
		->toArray()
;
