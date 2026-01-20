<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

$description =
	(new \Bitrix\Bizproc\Activity\ActivityDescription(
		Loc::getMessage('BPFCT_DESCR_NAME') ?? '',
		Loc::getMessage('BPFCT_DESCR_DESCR') ?? '',
		[\Bitrix\Bizproc\Activity\Enum\ActivityType::TRIGGER->value]
	))
		->setClass('FieldChangedTrigger')
		->setCategory(['ID' => 'document'])
		->setExcluded(true) // base trigger
;

// compatibility
$arActivityDescription = $description->toArray();
