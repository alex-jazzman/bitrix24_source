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
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;
use Bitrix\Main\Loader;
use Bitrix\Booking\Internals\Container;

$presets = [
	[
		'ID' => 'booking_ai_call_confirmation',
		'NAME' => Loc::getMessage('BOOKING_AICT_PRESET_CONFIRMATION'),
		'DESCRIPTION' => Loc::getMessage('BOOKING_AICT_PRESET_CONFIRMATION_DESC'),
		'PROPERTIES' => ['Scenario' => 'confirmation'],
		'NODE_ICON' => Outline::CALL_BACK->name,
		'COLOR_INDEX' => ActivityColorIndex::GREEN->value,
		'GROUPS' => [ActivityGroup::STARTER->value, ActivityGroup::BOOKING->value],
	],
	[
		'ID' => 'booking_ai_call_reminder',
		'NAME' => Loc::getMessage('BOOKING_AICT_PRESET_REMINDER'),
		'DESCRIPTION' => Loc::getMessage('BOOKING_AICT_PRESET_REMINDER_DESC'),
		'PROPERTIES' => ['Scenario' => 'reminder'],
		'NODE_ICON' => Outline::CALL_BACK->name,
		'COLOR_INDEX' => ActivityColorIndex::GREEN->value,
		'GROUPS' => [ActivityGroup::STARTER->value, ActivityGroup::BOOKING->value],
	],
	[
		'ID' => 'booking_ai_call_delayed',
		'NAME' => Loc::getMessage('BOOKING_AICT_PRESET_DELAYED'),
		'DESCRIPTION' => Loc::getMessage('BOOKING_AICT_PRESET_DELAYED_DESC'),
		'PROPERTIES' => ['Scenario' => 'delayed'],
		'NODE_ICON' => Outline::CALL_BACK->name,
		'COLOR_INDEX' => ActivityColorIndex::GREEN->value,
		'GROUPS' => [ActivityGroup::STARTER->value, ActivityGroup::BOOKING->value],
	],
	[
		'ID' => 'booking_ai_call_cancellation',
		'NAME' => Loc::getMessage('BOOKING_AICT_PRESET_CANCELLATION'),
		'DESCRIPTION' => Loc::getMessage('BOOKING_AICT_PRESET_CANCELLATION_DESC'),
		'PROPERTIES' => ['Scenario' => 'cancellation'],
		'NODE_ICON' => Outline::CALL_BACK->name,
		'COLOR_INDEX' => ActivityColorIndex::GREEN->value,
		'GROUPS' => [ActivityGroup::STARTER->value, ActivityGroup::BOOKING->value],
	],
];

$arActivityDescription = (new ActivityDescription(
	name: '',
	description: '',
	type: [ActivityType::TRIGGER->value],
))
	->setClass('BookingAiCallTrigger')
	->setPresets($presets)
	->setGroups([ActivityGroup::STARTER->value, ActivityGroup::BOOKING->value])
	->setSort(50)
	->setReturn([
		'PhoneNumber' => [
			'Name' => Loc::getMessage('BOOKING_AICT_RETURN_PHONE_NUMBER'),
			'Type' => FieldType::STRING,
		],
		'Prompt' => [
			'Name' => Loc::getMessage('BOOKING_AICT_RETURN_PROMPT'),
			'Type' => FieldType::STRING,
		],
		'BookingMessageId' => [
			'Name' => Loc::getMessage('BOOKING_AICT_RETURN_BOOKING_MESSAGE_ID'),
			'Type' => FieldType::INT,
		],
	])
	->setExcluded(
		!(
			Loader::includeModule('booking')
			&& Container::getAiCallAvailabilityService()->isAvailable()
		)
	)
	->toArray()
;
