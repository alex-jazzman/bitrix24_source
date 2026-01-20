<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('BPDDA_DESCR_NAME'),
		description: Loc::getMessage('BPDDA_DESCR_DESCR_1'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setCategory([
			'ID' => 'document',
		])
		->setClass('DeleteDocumentActivity')
		->setJsClass('BizProcActivity')
		->setFilter([
			'EXCLUDE' => [
				['tasks'],
			],
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'TITLE' => Loc::getMessage('BPDDA_DESCR_ROBOT_TITLE_1'),
			'GROUP' => ['elementControl'],
			'SORT' => 2900,
		])
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;
