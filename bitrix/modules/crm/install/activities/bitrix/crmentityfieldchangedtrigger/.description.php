<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

if (!class_exists('CBPCrmEntityFieldChangedTrigger'))
{
	\CBPRuntime::getRuntime()->includeActivityFile('crmentityfieldchangedtrigger');
}

$presets = class_exists('CBPCrmEntityFieldChangedTrigger') ? CBPCrmEntityFieldChangedTrigger::getPresets() : [];

$arActivityDescription = (new ActivityDescription(
	name: '',
	description: '',
	type: [ ActivityType::TRIGGER->value ],
))
	->setClass('CrmEntityFieldChangedTrigger')
	->setCategory(['ID' => 'document'])
	->setPresets($presets)
	->setReturn([
		'Initiator' => [
			'Name' => Loc::getMessage('BP_CRM_ENTITY_FIELD_CHANGED_TRIGGER_RETURN_INITIATOR') ?? '',
			'Type' => \Bitrix\Bizproc\FieldType::USER,
			'Default' => null,
		],
		'EventDateTime' => [
			'Name' => Loc::getMessage('BP_CRM_ENTITY_FIELD_CHANGED_TRIGGER_RETURN_EVENT_DATE_TIME') ?? '',
			'Type' => \Bitrix\Bizproc\FieldType::DATETIME,
			'Default' => null,
		],
	])
	->set('ADDITIONAL_RESULT', ['Return'])
	->setGroups([ActivityGroup::STARTER->value])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->toArray()
;
