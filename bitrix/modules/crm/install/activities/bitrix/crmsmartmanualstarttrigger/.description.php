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
use Bitrix\Bizproc\FieldType;
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
		'GROUPS' => [
			ActivityGroup::STARTER->value,
			ActivityGroup::DIGITAL_WORKPLACE->value,
		],
	],
	[
		'ID' => 'smart',
		'NAME' => Loc::getMessage('BP_CRM_CRM_SMART_START_TRIGGER_NAME') ?? '',
		'DESCRIPTION' => Loc::getMessage('BP_CRM_CRM_SMART_START_TRIGGER_DESCR') ?? '',
		'PROPERTIES' => [
			'onlyAutomatedSolution' => 'N',
		],
		'GROUPS' => [
			ActivityGroup::STARTER->value,
			ActivityGroup::SALES_CRM->value,
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
		// The document is not declared here: it depends on the smart process the node is set to and comes from the
		// per-node Return map the settings dialog saves.
		->setReturn([
			'Initiator' => [
				'Name' => Loc::getMessage('BP_CRM_CRM_SMART_START_TRIGGER_RETURN_INITIATOR') ?? '',
				'Type' => FieldType::USER,
				'Default' => null,
			],
			'EventDateTime' => [
				'Name' => Loc::getMessage('BP_CRM_CRM_SMART_START_TRIGGER_RETURN_EVENT_DATE_TIME') ?? '',
				'Type' => FieldType::DATETIME,
				'Default' => null,
			],
		])
		->setAdditionalResult(['Return'])
		->toArray()
;
