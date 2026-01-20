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
	name: Loc::GetMessage('BPEDT_DESCR_NAME') ?? '',
	description: Loc::GetMessage('BPEDT_DESCR_DESCR') ?? '',
	type: [ ActivityType::TRIGGER->value ],
))
	->setCategory([
		'ID' => 'document',
	])
	->setClass('EditDocumentTrigger')
	->set('AI_DESCRIPTION', 'The trigger fires on a document change event')
	->toArray()
;
