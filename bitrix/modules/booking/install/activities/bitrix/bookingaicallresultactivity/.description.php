<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Booking\Internals\Container;

$arActivityDescription = (new ActivityDescription(
	Loc::getMessage('BOOKING_AICR_DESCR_NAME') ?? '',
	Loc::getMessage('BOOKING_AICR_DESCR_DESCR') ?? '',
	[ActivityType::ACTIVITY->value, ActivityType::NODE->value],
))
	->setClass('BookingAiCallResultActivity')
	->setExcluded(!Loader::includeModule('booking'))
	->setColorIndex(ActivityColorIndex::GREEN->value)
	->setGroups([ActivityGroup::BOOKING->value])
	->setExcluded(
		!(
			Loader::includeModule('booking')
			&& Container::getAiCallMessageSender()->canUse()
		)
	)
	->toArray()
;
