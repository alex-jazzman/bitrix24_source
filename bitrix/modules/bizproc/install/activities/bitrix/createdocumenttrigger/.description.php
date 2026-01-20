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
	name: Loc::GetMessage('BPCDT_DESCR_NAME'),
	description: Loc::GetMessage('BPCDT_DESCR_DESCR'),
	type: [],
))
	->setCategory([
		'ID' => 'document',
	])
	->setClass('CreateDocumentTrigger')
	->set('AI_DESCRIPTION', 'The trigger fires on a document creation event')
	->toArray()
;
