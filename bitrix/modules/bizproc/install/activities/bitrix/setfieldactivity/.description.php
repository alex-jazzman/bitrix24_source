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
		name: Loc::getMessage('BPSFA_DESCR_NAME_MGVER_1'),
		description: Loc::getMessage('BPSFA_DESCR_DESCR_1'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setCategory([
			'ID' => 'document',
		])
		->setClass('SetFieldActivity')
		->setJsClass('BizProcActivity')
		->setReturn([
			'ErrorMessage' => [
				'NAME' => Loc::getMessage('BPSFA_DESCR_ERROR_MESSAGE'),
				'TYPE' => 'string',
			],
		])
		->setFilter([
			'EXCLUDE' => [
				['tasks'],
			],
		])
		->setRobotSettings([
			'TITLE' => Loc::getMessage('BPSFA_DESCR_ROBOT_TITLE_2'),
			'CATEGORY' => 'employee',
			'GROUP' => ['elementControl'],
			'ASSOCIATED_TRIGGERS' => [
				'FIELD_CHANGED' => 1,
			],
			'SORT' => 2400,
		])
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;
