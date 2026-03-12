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
	name: Loc::getMessage('BPAA2_DESCR_NAME'),
	description: Loc::getMessage('BPAA2_DESCR_DESCR'),
	type: [
		ActivityType::ACTIVITY->value,
		ActivityType::NODE->value,
	],
))
	->setClass('AbsenceActivity')
	->setJsClass('BizProcActivity')
	->setCategory(['ID' => 'interaction'])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setGroups([ActivityGroup::OTHER_OPERATIONS->value])
	->setIcon(Outline::DELETE_EVENT->name)
	->toArray()
;
