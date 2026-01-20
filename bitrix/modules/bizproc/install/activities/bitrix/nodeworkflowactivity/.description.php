<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

$description =
	(new \Bitrix\Bizproc\Activity\ActivityDescription(
		Loc::getMessage('BPNWA_DESCR_NAME') ?? '',
		Loc::getMessage('BPNWA_DESCR_DESCR') ?? '',
		[
			\Bitrix\Bizproc\Activity\Enum\ActivityType::ACTIVITY->value, // visible only in the old editor
		]
	))
		->setClass('NodeWorkflowActivity')
		->setJsClass('NodeWorkflowActivity')
;

// compatibility
$arActivityDescription = $description->toArray();