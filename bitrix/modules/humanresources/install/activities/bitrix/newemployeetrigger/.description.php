<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (
	!class_exists(\Bitrix\Bizproc\Activity\ActivityDescription::class)
	|| !enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityType')
	|| !enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityGroup')
	|| \Bitrix\Bizproc\Activity\Enum\ActivityType::tryFrom('trigger') === null
	|| \Bitrix\Bizproc\Activity\Enum\ActivityGroup::tryFrom('starter') === null
	|| \Bitrix\Bizproc\Activity\Enum\ActivityGroup::tryFrom('hr') === null
	|| \Bitrix\Bizproc\Activity\Enum\ActivityGroup::tryFrom('team_management') === null
	|| !enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityColorIndex')
	|| \Bitrix\Bizproc\Activity\Enum\ActivityColorIndex::tryFrom(2) === null
	|| !enum_exists('\Bitrix\Ui\Public\Enum\IconSet\Outline')
	|| \Bitrix\Ui\Public\Enum\IconSet\Outline::tryFrom('o-add-person') === null
)
{
	return;
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription =
	(new ActivityDescription(
		(string)Loc::getMessage('HUMAN_RESOURCES_NEW_EMPLOYEE_TRIGGER_NAME'),
		(string)Loc::getMessage('HUMAN_RESOURCES_NEW_EMPLOYEE_TRIGGER_DESCR'),
		[ActivityType::TRIGGER->value],
	))
		->setClass('NewEmployeeTrigger')
		->setGroups([
			ActivityGroup::STARTER->value,
			ActivityGroup::HR->value,
			ActivityGroup::TEAM_MANAGEMENT->value,
		])
		->setReturn([
			'USER' => [
				'Name' => (string)Loc::getMessage('HUMAN_RESOURCES_NEW_EMPLOYEE_TRIGGER_RETURN_FIELD_USER'),
				'Type' => FieldType::USER,
			],
			'EventDateTime' => [
				'Name' => (string)Loc::getMessage('HUMAN_RESOURCES_NEW_EMPLOYEE_TRIGGER_RETURN_FIELD_EVENT_DATE_TIME'),
				'Type' => FieldType::DATETIME,
			],
		])
		->setIcon(Outline::ADD_PERSON->name)
		->setColorIndex(ActivityColorIndex::ORANGE->value)
		->toArray()
;
