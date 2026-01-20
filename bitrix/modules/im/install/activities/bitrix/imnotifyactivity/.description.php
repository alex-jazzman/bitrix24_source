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
	name: Loc::getMessage('BPIMNA_DESCR_NAME'),
	description: Loc::getMessage('BPIMNA_DESCR_DESCR'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'interaction',
	])
	->setClass('IMNotifyActivity')
	->setJsClass('BizProcActivity')
	->setGroups([ ActivityGroup::INTERNAL_COMMUNICATION->value ])
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->setIcon(Outline::NOTIFICATION->name)
	->toArray()
;
