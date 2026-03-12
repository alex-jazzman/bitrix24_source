<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = [
	'NAME' => Loc::getMessage('BPDAF_DESCR_NAME2'),
	'DESCRIPTION' => Loc::getMessage('BPDAF_DESCR_DESCR2'),
	'TYPE' => ['activity', 'node'],
	'CLASS' => 'DiskAddFolderActivity',
	'JSCLASS' => 'BizProcActivity',
	'CATEGORY' => [
		'ID' => 'document',
		'OWN_ID' => 'disk',
		'OWN_NAME' => Loc::getMessage('BPDAF_DESCR_CATEGORY'),
	],
	'RETURN' => [
		'ObjectId' => [
			'NAME' => Loc::getMessage('BPDAF_DESCR_OBJECT_ID'),
			'TYPE' => 'int',
		],
		'DetailUrl' => [
			'NAME' => Loc::getMessage('BPDAF_DESCR_DETAIL_URL'),
			'TYPE' => 'string',
		],
	],
];

if (class_exists(ActivityColorIndex::class) && class_exists(Outline::class))
{
	$arActivityDescription += [
		'COLOR_INDEX' => ActivityColorIndex::BLUE->value,
		'GROUPS' => [
			ActivityGroup::OTHER_OPERATIONS->value,
		],
		'NODE_ICON' => Outline::FOLDER_PLUS->name,
	];
}
