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
	name: Loc::GetMessage('BP_FRA_DESCR_NAME'),
	description: Loc::GetMessage('BP_FRA_DESCR_DESCR'),
	type: [ ActivityType::ACTIVITY->value ],
))
	->setCategory([
		'ID' => 'other',
	])
	->setClass('FixResultActivity')
	->setJsClass('BizProcActivity')
	->setReturn([
		'ErrorMessage' => [
			'NAME' => Loc::GetMessage('BP_FRA_DESCR_ERROR_MESSAGE'),
			'TYPE' => 'string',
		],
	])
	->setGroups([ActivityGroup::WORKFLOW->value])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::FLAG->name)
	->toArray()
;
