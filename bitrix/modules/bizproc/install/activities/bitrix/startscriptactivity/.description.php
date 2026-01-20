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
	name: Loc::getMessage('BP_SSA_DESCR_NAME'),
	description: Loc::getMessage('BP_SSA_DESCR_DESCR'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'document',
	])
	->setClass('StartScriptActivity')
	->setJsClass('BizProcActivity')
	->setFilter([
		'INCLUDE' => [
			[ 'crm' ],
		],
	])
	->setGroups([ ActivityGroup::WORKFLOW->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::BUSINESS_PROCESS->name)
	->toArray()
;
