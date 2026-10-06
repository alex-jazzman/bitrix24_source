<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('BPSA_DESCR_NAME'),
	description: Loc::GetMessage('BPSA_DESCR_DESCR'),
	type: [ActivityType::ACTIVITY->value],
))
	->setClass('StateActivity')
	->setJsClass('StateActivity')
	->toArray()
;
