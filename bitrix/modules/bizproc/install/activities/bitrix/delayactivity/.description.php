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
	name: Loc::GetMessage('BPDA_DESCR_NAME'),
	description: Loc::GetMessage('BPDA_DESCR_DESCR_1'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'other',
	])
	->setClass('DelayActivity')
	->setJsClass('DelayActivity')
	->setGroups([ ActivityGroup::WORKFLOW->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::PAUSE_M->name)
	->set('AI_DESCRIPTION', 'Suspends the process for the specified time, delaying the next activity.')
	->toArray()
;
