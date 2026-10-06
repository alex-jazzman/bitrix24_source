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
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;

if (\CBPRuntime::ACTIVITY_API_VERSION < 3)
{
	return;
}

if (!class_exists('CBPCrmEntityCreateTrigger'))
{
	\CBPRuntime::getRuntime()->includeActivityFile('crmentitycreatetrigger');
}

$presets = class_exists('CBPCrmEntityCreateTrigger') ? CBPCrmEntityCreateTrigger::getPresets() : [];

$arActivityDescription = (new ActivityDescription(
	name: '',
	description: '',
	type: [ActivityType::TRIGGER->value],
))
	->setClass('CrmEntityCreateTrigger')
	->setCategory(['ID' => 'document'])
	->setPresets($presets)
	->setReturn([
		'Initiator' => [
			'Name' => Loc::getMessage('BP_CRM_ENTITY_CREATE_TRIGGER_RETURN_INITIATOR') ?? '',
			'Type' => FieldType::USER,
			'Default' => null,
		],
		'EventDateTime' => [
			'Name' => Loc::getMessage('BP_CRM_ENTITY_CREATE_TRIGGER_RETURN_EVENT_DATE_TIME') ?? '',
			'Type' => FieldType::DATETIME,
			'Default' => null,
		],
	])
	->set('ADDITIONAL_RESULT', ['Return'])
	->setGroups([ActivityGroup::STARTER->value])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->toArray()
;
