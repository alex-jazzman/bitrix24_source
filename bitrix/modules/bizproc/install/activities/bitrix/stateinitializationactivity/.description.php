<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('BPSIA_DESCR_NAME_1'),
	description: Loc::GetMessage('BPSIA_DESCR_DESCR_1'),
	type: [ActivityType::ACTIVITY->value],
))
	->setClass('StateInitializationActivity')
	->setJsClass('StateInitializationActivity')
	->toArray()
;
