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
use Bitrix\Call\Integration\AI\CallAISettings;
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

$copilotNameReplace = ['#COPILOT_NAME#' => CallAISettings::getCopilotName()];

$arActivityDescription =
	(new ActivityDescription(
		Loc::getMessage('CALL_GET_FOLLOWUP_ACTIVITY_DESCRIPTION_NAME_MSGVER_1', $copilotNameReplace) ?? '',
		Loc::getMessage('CALL_GET_FOLLOWUP_ACTIVITY_DESCRIPTION_DESCRIPTION_MSGVER_1', $copilotNameReplace) ?? '',
		[ActivityType::NODE->value]
	))
		->setClass('CallGetFollowUpActivity')
		->setGroups([ActivityGroup::INTERNAL_COMMUNICATION->value])
		->setColorIndex(ActivityColorIndex::BLUE->value)
		->setIcon(Outline::PHONE_OUT->name)
		->setExcluded($isExcluded)
		->setReturn([
			'FollowUp' => [
				'NAME' => Loc::getMessage('CALL_GET_FOLLOWUP_ACTIVITY_DESCRIPTION_RETURN_FOLLOWUPS_MSGVER_1', $copilotNameReplace),
				'TYPE' => FieldType::STRING,
			],
			'ErrorMessage' => [
				'NAME' => Loc::getMessage('CALL_GET_FOLLOWUP_ACTIVITY_DESCRIPTION_RETURN_ERROR_MESSAGE'),
				'TYPE' => FieldType::STRING,
			],
			'FollowUpCount' => [
				'NAME' => Loc::getMessage('CALL_GET_FOLLOWUP_ACTIVITY_DESCRIPTION_RETURN_FOLLOWUP_COUNT_MSGVER_1', $copilotNameReplace),
				'TYPE' => FieldType::INT,
			],
		])
		->toArray()
;
