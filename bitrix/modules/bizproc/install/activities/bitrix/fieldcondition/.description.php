<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPFC_DESCR_NAME'),
	description: Loc::getMessage('BPFC_DESCR_DESCR'),
	type: [ActivityType::CONDITION->value],
))
	->setFilter([
		'EXCLUDE' => [
			['bizproc', \Bitrix\Bizproc\Public\Entity\Document\Workflow::class],
		],
	])
	->toArray()
;
