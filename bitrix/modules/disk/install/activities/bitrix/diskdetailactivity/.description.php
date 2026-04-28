<?php

use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

$category = [
	'ID' => 'document',
	'OWN_ID' => 'disk',
	'OWN_NAME' => Loc::getMessage('BPDD_DESCR_CATEGORY'),
];

$return = [
	'ObjectId' => [
		'NAME' => 'ID',
		'TYPE' => 'int',
	],
	'Type' => [
		'NAME' => Loc::getMessage('BPDD_DESCR_TYPE'),
		'TYPE' => 'string',
	],
	'Name' => [
		'NAME' => Loc::getMessage('BPDD_DESCR_NAME'),
		'TYPE' => 'string',
	],
	'SizeBytes' => [
		'NAME' => Loc::getMessage('BPDD_DESCR_SIZE_BYTES'),
		'TYPE' => 'int',
	],
	'SizeFormatted' => [
		'NAME' => Loc::getMessage('BPDD_DESCR_SIZE_FORMATTED'),
		'TYPE' => 'string',
	],
	'DetailUrl' => [
		'NAME' => Loc::getMessage('BPDD_DESCR_DETAIL_URL'),
		'TYPE' => 'string',
	],
	'DownloadUrl' => [
		'NAME' => Loc::getMessage('BPDD_DESCR_DOWNLOAD_URL'),
		'TYPE' => 'string',
	],
];

if (
	class_exists(ActivityDescription::class)
	&& method_exists(ActivityDescription::class, 'setIcon')
)
{
	$description =
		(new ActivityDescription(
			Loc::getMessage('BPDD_DESCR_NAME2'),
			Loc::getMessage('BPDD_DESCR_DESCR2'),
			[ActivityType::ACTIVITY->value, ActivityType::NODE->value]
		))
			->setClass('DiskDetailActivity')
			->setJsClass('BizProcActivity')
			->setCategory($category)
			->setReturn($return)
			->setIcon(Outline::FOLDER_WITH_CARD->name)
			->setColorIndex(ActivityColorIndex::BLUE->value)
			->setGroups([\Bitrix\Bizproc\Activity\Enum\ActivityGroup::OTHER_OPERATIONS->value])
	;

	$arActivityDescription = $description->toArray();

	return $description;
}

$arActivityDescription = [
	'NAME' => Loc::getMessage('BPDD_DESCR_NAME2'),
	'DESCRIPTION' => Loc::getMessage('BPDD_DESCR_DESCR2'),
	'TYPE' => 'activity',
	'CLASS' => 'DiskDetailActivity',
	'JSCLASS' => 'BizProcActivity',
	'CATEGORY' => $category,
	'RETURN' => $return,
];
