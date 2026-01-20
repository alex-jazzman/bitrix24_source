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

$arActivityDescription =
	(new ActivityDescription(
		Loc::getMessage('BIZPROC_DELETE_DATA_ACTIVITY_NAME') ?? '',
		Loc::getMessage('BIZPROC_DELETE_DATA_ACTIVITY_DESCRIPTION') ?? '',
		[ ActivityType::NODE->value ]
	))
	->setClass('DeleteDataStorageActivity')
	->setCategory(['ID' => 'storage'])
	->set('AI_DESCRIPTION', Loc::getMessage('BIZPROC_DELETE_DATA_ACTIVITY_DESCRIPTION'))
	->setGroups([ ActivityGroup::STORAGE->value ])
	->setColorIndex(ActivityColorIndex::CYAN->value)
	->setIcon(Outline::TRASHCAN->name)
	->setSort(400)
	->toArray()
;