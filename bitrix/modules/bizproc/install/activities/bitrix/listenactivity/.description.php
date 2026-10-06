<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$type = [ActivityType::ACTIVITY->value];
if (defined('Bitrix\Bizproc\Dev\ENV'))
{
	$type[] = ActivityType::NODE->value;
}

$arActivityDescription =
	(new ActivityDescription(
		Loc::getMessage('BPLA_DESCR_NAME_MSGVER_1') ?? '',
		Loc::getMessage('BPLA_DESCR_DESCR') ?? '',
		$type,
	))
		->setClass('ListenActivity')
		->setJsClass('ListenActivity')
		->setCategory(['ID' => 'logic'])
		->setGroups([ ActivityGroup::WORKFLOW->value ])
		->setColorIndex(ActivityColorIndex::GREY->value)
		->setIcon(Outline::TIMER->name)
		->setSort(100)
		->toArray()
;
