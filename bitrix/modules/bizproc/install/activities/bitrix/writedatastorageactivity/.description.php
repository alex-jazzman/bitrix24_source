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
	name: Loc::getMessage('BIZPROC_WRITE_DATA_ACTIVITY_NAME') ?? '',
	description: Loc::getMessage('BIZPROC_WRITE_DATA_ACTIVITY_DESCRIPTION') ?? '',
	type: [ ActivityType::NODE->value ],
))
	->setClass('WriteDataStorageActivity')
	->setCategory([
		'ID' => 'other',
		'OWN_ID' => 'storage',
		'OWN_NAME' => Loc::getMessage('BIZPROC_STORAGE_CATEGORY'),
	])
	->set('AI_DESCRIPTION', Loc::getMessage('BIZPROC_WRITE_DATA_ACTIVITY_DESCRIPTION'))
	->setGroups([ ActivityGroup::STORAGE->value ])
	->setColorIndex(ActivityColorIndex::CYAN->value)
	->setIcon(Outline::PLUS_M->name)
	->setSort(200)
	->toArray()
;
