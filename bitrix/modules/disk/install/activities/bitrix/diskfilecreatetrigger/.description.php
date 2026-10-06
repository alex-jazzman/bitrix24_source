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

if (\CBPRuntime::ACTIVITY_API_VERSION < 4)
{
	return;
}

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('DISK_FILE_CREATE_TRIGGER_DESCR_NAME'),
	description: Loc::getMessage('DISK_FILE_CREATE_TRIGGER_DESCR_DESCR'),
	type: [ActivityType::TRIGGER->value],
))
	->setClass('DiskFileCreateTrigger')
	->setAdditionalResult(['Return'])
	->setGroups([ActivityGroup::STARTER->value])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->toArray()
;
