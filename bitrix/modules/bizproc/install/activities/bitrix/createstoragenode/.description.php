<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription =
	(new \Bitrix\Bizproc\Activity\ActivityDescription(
		Loc::getMessage('BPCSN_DESCRIPTION_NAME') ?? '',
		Loc::getMessage('BPCSN_DESCRIPTION_TEXT') ?? '',
		[\Bitrix\Bizproc\Activity\Enum\ActivityType::NODE->value]
	))
		->setClass('CreateStorageNode')
		->setGroups([ ActivityGroup::STORAGE->value ])
		->set('AI_DESCRIPTION', Loc::getMessage('BPCSN_DESCRIPTION_TEXT') ?? '')
		->setColorIndex(ActivityColorIndex::CYAN->value)
		->setIcon(Outline::DATABASE->name)
		->setReturn([
			'StorageId' => [
				'NAME' => Loc::getMessage('BPCSN_DESCRIPTION_STORAGE_ID'),
				'TYPE' => 'int'
			]
		])
		->setAdditionalResult(['StorageFields'])
		->setSort(100)
		->toArray()
;
