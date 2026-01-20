<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (
	!class_exists(\Bitrix\Bizproc\Activity\ActivityDescription::class)
	|| !enum_exists(\Bitrix\Bizproc\Activity\Enum\ActivityType::class)
	|| !enum_exists(\Bitrix\Bizproc\Activity\Enum\ActivityGroup::class)
	|| !enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityColorIndex')
	|| \Bitrix\Bizproc\Activity\Enum\ActivityColorIndex::tryFrom(2) == null
	|| !enum_exists('\Bitrix\Ui\Public\Enum\IconSet\Outline')
	|| \Bitrix\Ui\Public\Enum\IconSet\Outline::tryFrom('o-vacation') == null
)
{
	return;
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription =
	(new ActivityDescription(
		(string)Loc::getMessage('TIMEMAN_ABSENCE_VACATION_NAME'),
		(string)Loc::getMessage('TIMEMAN_ABSENCE_VACATION_DESCR'),
		[ActivityType::TRIGGER->value],
	))
		->setClass('AbsenceVacationTrigger')
		->setGroups([ActivityGroup::STARTER->value])
		->setReturn([
			'USER' => [
				'Name' => (string)Loc::getMessage('TIMEMAN_ABSENCE_VACATION_RETURN_FIELD_USER_ID'),
				'Type' => FieldType::USER,
			],
			'ACTIVE_FROM' => [
				'Name' => (string)Loc::getMessage('TIMEMAN_ABSENCE_VACATION_RETURN_FIELD_ACTIVE_FROM'),
				'Type' => FieldType::DATETIME,
			],
			'ACTIVE_TO' => [
				'Name' => (string)Loc::getMessage('TIMEMAN_ABSENCE_VACATION_RETURN_FIELD_ACTIVE_TO'),
				'Type' => FieldType::DATETIME,
			],
		])
		->setIcon(Outline::VACATION->name)
		->setColorIndex(ActivityColorIndex::ORANGE->value)
		->toArray()
;
