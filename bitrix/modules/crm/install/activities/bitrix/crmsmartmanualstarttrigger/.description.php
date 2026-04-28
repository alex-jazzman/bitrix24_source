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

$presets = [
	[
		'ID' => 'automatedSolution',
		'NAME' => Loc::getMessage('BP_CRM_CRM_AUTOMATED_SOLUTION_START_TRIGGER_NAME'),
		'DESCRIPTION' => Loc::getMessage('BP_CRM_CRM_AUTOMATED_SOLUTION_START_TRIGGER_DESCR'),
		'PROPERTIES' => [
			'onlyAutomatedSolution' => 'Y',
		],
	],
	[
		'ID' => 'smart',
		'NAME' => Loc::getMessage('BP_CRM_CRM_SMART_START_TRIGGER_NAME') ?? '',
		'DESCRIPTION' => Loc::getMessage('BP_CRM_CRM_SMART_START_TRIGGER_DESCR') ?? '',
		'PROPERTIES' => [
			'onlyAutomatedSolution' => 'N',
		],
	],
];

$arActivityDescription =
	(new \Bitrix\Bizproc\Activity\ActivityDescription(
		Loc::getMessage('BP_CRM_CRM_SMART_START_TRIGGER_NAME') ?? '',
		Loc::getMessage('BP_CRM_CRM_SMART_START_TRIGGER_DESCR') ?? '',
		[\Bitrix\Bizproc\Activity\Enum\ActivityType::TRIGGER->value]
	))
		->setClass('CrmSmartManualStartTrigger')
		->setCategory(['ID' => 'document'])
		->setPresets($presets)
		->setGroups([ ActivityGroup::STARTER->value ])
		->setColorIndex(ActivityColorIndex::ORANGE->value)
		->setIcon(Outline::SMART_PROCESS->name)
		->setAdditionalResult(['Return'])
		->toArray()
;
