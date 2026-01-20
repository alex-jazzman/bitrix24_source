<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPMST_DESCR_NAME') ?? '',
	description: Loc::getMessage('BPMST_DESCR_DESCR') ?? '',
	type: [],
))
	->setCategory([
		'ID' => 'document',
	])
	->setClass('ManualStartTrigger')
	->setAiDescription('The trigger that starts a workflow manually')
	->toArray()
;
