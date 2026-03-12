<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPTA1_DESCR_NAME') ?? '',
	description: Loc::getMessage('BPTA1_DESCR_DESCR') ?? '',
	type: [
		ActivityType::ACTIVITY->value,
		ActivityType::NODE->value,
	],
))
	->setCategory([
		'ID' => 'other',
	])
	->setClass('TerminateActivity')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setGroups([
		ActivityGroup::WORKFLOW->value,
	])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::STOP_M->name)
	->toArray()
;