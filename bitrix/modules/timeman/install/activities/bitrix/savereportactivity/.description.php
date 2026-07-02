<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (
	!enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityColorIndex')
	|| !enum_exists('\Bitrix\Ui\Public\Enum\IconSet\Outline')
)
{
	return;
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription
	= (new ActivityDescription(
	(string)Loc::getMessage('TIMEMAN_SAVE_REPORT_NAME'),
	(string)Loc::getMessage('TIMEMAN_SAVE_REPORT_DESCR'),
	[ActivityType::NODE->value],
))
	->setGroups([ActivityGroup::TEAM_MANAGEMENT->value])
	->setClass('SaveReportActivity')
	->setIcon(Outline::TIMER->name)
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->toArray()
;
