<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = [
	'NAME' => Loc::getMessage('BPCA1_DESCR_NAME2'),
	'DESCRIPTION' => Loc::getMessage('BPCA1_DESCR_DESCR2'),
	'TYPE' => ['activity', 'node'],
	'CLASS' => 'Calendar2Activity',
	'JSCLASS' => 'BizProcActivity',
	'CATEGORY' => [
		'ID' => 'interaction',
	],
];

if (class_exists(ActivityColorIndex::class))
{
	$arActivityDescription += [
		'COLOR_INDEX' => ActivityColorIndex::BLUE->value,
		'GROUPS' => [
			'other_operations',
		],
		'NODE_ICON' => 'PLANNING_2',
	];
}
