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
	|| !enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityColorIndex')
	|| \Bitrix\Bizproc\Activity\Enum\ActivityColorIndex::tryFrom(1) == null
	|| !enum_exists('\Bitrix\Ui\Public\Enum\IconSet\Outline')
	|| \Bitrix\Ui\Public\Enum\IconSet\Outline::tryFrom('o-important-task') == null
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
		(string)Loc::getMessage('TASKS_EXPIRED_NAME'),
		(string)Loc::getMessage('TASKS_EXPIRED_DESCR'),
		[ActivityType::TRIGGER->value],
	))
		->setClass('TasksExpiredTrigger')
		->setGroups([ActivityGroup::STARTER->value])
		->setReturn([
			'TASK_ID' => [
				'Name' => (string)Loc::getMessage('TASKS_EXPIRED_RETURN_FIELD_TASK_ID'),
				'Type' => FieldType::INT
			],
			'TASK_TITLE' => [
				'Name' => (string)Loc::getMessage('TASKS_EXPIRED_RETURN_FIELD_TASK_TITLE'),
				'Type' => FieldType::STRING
			],
			'TASK_CREATED_DATE' => [
				'Name' => (string)Loc::getMessage('TASKS_EXPIRED_RETURN_FIELD_TASK_CREATED_DATE'),
				'Type' => FieldType::DATETIME
			],
			'TASK_RESPONSIBLE' => [
				'Name' => (string)Loc::getMessage('TASKS_EXPIRED_RETURN_FIELD_TASK_RESPONSIBLE'),
				'Type' => FieldType::USER
			],
		])
		->setIcon(Outline::IMPORTANT_TASK->name)
		->setColorIndex(ActivityColorIndex::BLUE->value)
		->toArray()
;
