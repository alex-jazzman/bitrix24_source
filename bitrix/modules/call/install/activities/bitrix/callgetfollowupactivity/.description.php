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
use Bitrix\Main\Config\Option;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

if (
	!class_exists(ActivityDescription::class)
	|| !enum_exists(ActivityGroup::class)
	|| !Loader::includeModule('ui')
	|| !enum_exists(Outline::class)
)
{
	return;
}

$isExcluded = !Loader::includeModule('call')
	|| Option::get('bizproc', 'bitrix_ai_day_plan_available', 'N') === 'N'
;

$arActivityDescription =
	(new ActivityDescription(
		Loc::getMessage('CALL_GET_FOLLOWUP_ACTIVITY_DESCRIPTION_NAME') ?? '',
		Loc::getMessage('CALL_GET_FOLLOWUP_ACTIVITY_DESCRIPTION_DESCRIPTION') ?? '',
		[ActivityType::NODE->value]
	))
		->setClass('CallGetFollowUpActivity')
		->setGroups([ActivityGroup::INTERNAL_COMMUNICATION->value])
		->setColorIndex(ActivityColorIndex::BLUE->value)
		->setIcon(Outline::PHONE_OUT->name)
		->setExcluded($isExcluded)
		->setReturn([
			'FollowUp' => [
				'NAME' => Loc::getMessage('CALL_GET_FOLLOWUP_ACTIVITY_DESCRIPTION_RETURN_FOLLOWUPS'),
				'TYPE' => FieldType::STRING,
			],
			'ErrorMessage' => [
				'NAME' => Loc::getMessage('CALL_GET_FOLLOWUP_ACTIVITY_DESCRIPTION_RETURN_ERROR_MESSAGE'),
				'TYPE' => FieldType::STRING,
			],
			'FollowUpCount' => [
				'NAME' => Loc::getMessage('CALL_GET_FOLLOWUP_ACTIVITY_DESCRIPTION_RETURN_FOLLOWUP_COUNT'),
				'TYPE' => FieldType::INT,
			],
		])
		->toArray()
;