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
	|| !enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityNodeType')
	|| \Bitrix\Bizproc\Activity\Enum\ActivityType::tryFrom('node') === null
	|| \Bitrix\Bizproc\Activity\Enum\ActivityGroup::tryFrom('hr') === null
	|| \Bitrix\Bizproc\Activity\Enum\ActivityNodeType::tryFrom('simple') === null
	|| !enum_exists('\Bitrix\Bizproc\Activity\Enum\ActivityColorIndex')
	|| \Bitrix\Bizproc\Activity\Enum\ActivityColorIndex::tryFrom(2) === null
	|| !enum_exists('\Bitrix\Ui\Public\Enum\IconSet\Outline')
	|| \Bitrix\Ui\Public\Enum\IconSet\Outline::tryFrom('o-my-plan') === null
)
{
	return;
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	Loc::getMessage('TIMEMAN_SAVE_DAY_PLAN_ACTIVITY_NAME') ?? '',
	Loc::getMessage('TIMEMAN_SAVE_DAY_PLAN_ACTIVITY_DESCRIPTION') ?? '',
	[ActivityType::NODE->value],
))
	->setClass('SaveDayPlanActivity')
	->setJsClass('BizProcActivity')
	->setNodeType(ActivityNodeType::SIMPLE->value)
	->setGroups([ActivityGroup::HR->value, ActivityGroup::TEAM_MANAGEMENT->value])
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->setIcon(Outline::MY_PLAN->name)
	->toArray()
;
