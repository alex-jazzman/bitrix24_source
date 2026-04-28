<?php

declare(strict_types=1);

use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$description = (new \Bitrix\Bizproc\Activity\ActivityDescription(
	Loc::getMessage('BPSCT_DESCR_NAME'),
	Loc::getMessage('BPSCT_DESCR_DESCR'),
	[\Bitrix\Bizproc\Activity\Enum\ActivityType::TRIGGER->value]
))
	->setClass('ScheduledTrigger')
	->setGroups([\Bitrix\Bizproc\Activity\Enum\ActivityGroup::STARTER->value])
	->setIcon(\Bitrix\Ui\Public\Enum\IconSet\Outline::CALENDAR_WITH_SLOTS->name)
	->setColorIndex(\Bitrix\Bizproc\Activity\Enum\ActivityColorIndex::GREY->value)
;

// compatibility
$arActivityDescription = $description->toArray();
