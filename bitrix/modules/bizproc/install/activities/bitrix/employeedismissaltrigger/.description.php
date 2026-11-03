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
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription
	= (new ActivityDescription(
		(string)Loc::getMessage('BIZPROC_EMPLOYEE_DISMISSAL_TRIGGER_TITLE'),
		(string)Loc::getMessage('BIZPROC_EMPLOYEE_DISMISSAL_TRIGGER_DESCRIPTION'),
		[ActivityType::TRIGGER->value],
	))
		->setClass('EmployeeDismissalTrigger')
		->setGroups([
			ActivityGroup::STARTER->value,
		])
		->setReturn([
			'userId' => [
				'Name' => (string)Loc::getMessage('BIZPROC_EMPLOYEE_DISMISSAL_TRIGGER_USER_ID'),
				'Type' => FieldType::USER,
			],
			'firedAt' => [
				'Name' => (string)Loc::getMessage('BIZPROC_EMPLOYEE_DISMISSAL_TRIGGER_FIRED_AT'),
				'Type' => FieldType::DATETIME,
			],
			'name' => [
				'Name' => (string)Loc::getMessage('BIZPROC_EMPLOYEE_DISMISSAL_TRIGGER_NAME'),
				'Type' => FieldType::STRING,
			],
			'lastName' => [
				'Name' => (string)Loc::getMessage('BIZPROC_EMPLOYEE_DISMISSAL_TRIGGER_LAST_NAME'),
				'Type' => FieldType::STRING,
			],
		])
		->setIcon(Outline::DELETE_PERSON->name)
		->setColorIndex(ActivityColorIndex::ORANGE->value)
		->toArray()
;
