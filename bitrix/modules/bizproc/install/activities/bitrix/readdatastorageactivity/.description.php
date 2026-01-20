<?php

declare(strict_types=1);

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
	name: Loc::getMessage('BIZPROC_READ_DATA_ACTIVITY_NAME'),
	description: Loc::getMessage('BIZPROC_READ_DATA_ACTIVITY_DESCRIPTION'),
	type: [ ActivityType::NODE->value ],
))
	->setClass('ReadDataStorageActivity')
	->setJsClass('BizProcActivity')
	->set('ADDITIONAL_RESULT', [ 'OutputFields' ])
	->setGroups([ ActivityGroup::STORAGE->value ])
	->setColorIndex(ActivityColorIndex::CYAN->value)
	->setIcon(Outline::DATA_READING->name)
	->setSort(300)
	->toArray()
;
