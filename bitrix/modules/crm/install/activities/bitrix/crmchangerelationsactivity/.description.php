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
		name: Loc::getMessage('CRM_CTA_NAME') ?? '',
		description: Loc::getMessage('CRM_CTA_DESC') ?? '',
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmChangeRelationsActivity')
		->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
		->setCategory([
			'ID' => 'document',
			'OWN_ID' => 'crm',
			'OWN_NAME' => 'CRM',
		])
		->setFilter([
			'INCLUDE' => [
				['crm', \Bitrix\Crm\Integration\BizProc\Document\Dynamic::class],
				['crm', \Bitrix\Crm\Integration\BizProc\Document\SmartDocument::class],
			],
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'GROUP' => ['digitalWorkplace'],
		])
		->setNodeActionSettings([
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;