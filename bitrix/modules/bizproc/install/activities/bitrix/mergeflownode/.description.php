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

$arActivityDescription =
	(new ActivityDescription(
		Loc::getMessage('BPMFN_DESCRIPTION_NAME') ?? '',
		Loc::getMessage('BPMFN_DESCRIPTION_TEXT') ?? '',
		[ActivityType::NODE->value],
	))
		->setClass('MergeFlowNode')
		->setGroups([ ActivityGroup::WORKFLOW->value ])
		->setColorIndex(ActivityColorIndex::GREY->value)
		->setIcon(Outline::MERGE->name)
		->set('SORT', 100)
		->toArray()
;
