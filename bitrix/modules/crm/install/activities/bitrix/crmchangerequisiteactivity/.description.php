<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Crm\Integration\BizProc\Document\SmartB2eDocument;
use Bitrix\Crm\Integration\BizProc\Document\SmartDocument;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_CRQ_NAME_1'),
		description: Loc::getMessage('CRM_CRQ_DESC_1'),
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmChangeRequisiteActivity')
		->setJsClass('BizProcActivity')
		->setFilter([
			'INCLUDE' => [
				['crm'],
			],
			'EXCLUDE' => [
				['crm', SmartDocument::class],
				['crm', SmartB2eDocument::class],
			],
		])
		->setCategory([
			'ID' => 'document',
			'OWN_ID' => 'crm',
			'OWN_NAME' => 'CRM',
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'GROUP' => ['paperwork', 'payment'],
			'SORT' => 1600,
		])
		->setNodeActionSettings([
			'INCLUDE' => ['crmdealcomplexactivity'],
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;
