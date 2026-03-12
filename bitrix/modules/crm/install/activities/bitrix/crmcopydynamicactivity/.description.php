<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
	(new ActivityDescription(
		name: Loc::getMessage('CRM_CDA_NAME') ?? '',
		description: Loc::getMessage('CRM_CDA_DESC') ?? '',
		type: [
			ActivityType::ACTIVITY->value,
			ActivityType::ROBOT->value,
			ActivityType::NODE_ACTION->value,
		],
	))
		->setClass('CrmCopyDynamicActivity')
		->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
		->setCategory([
			'ID' => 'document',
			'OWN_ID' => 'crm',
			'OWN_NAME' => 'CRM',
		])
		->setReturn([
			'ItemId' => [
				'NAME' => Loc::getMessage('CRM_CDA_RETURN_ITEM_ID'),
				'TYPE' => FieldType::INT,
			],
		])
		->setFilter([
			'INCLUDE' => [
				['crm', \Bitrix\Crm\Integration\BizProc\Document\Dynamic::class],
			],
		])
		->setRobotSettings([
			'CATEGORY' => 'employee',
			'RESPONSIBLE_PROPERTY' => 'Responsible',
			'GROUP' => ['digitalWorkplace'],
		])
		->setNodeActionSettings([
			'HANDLES_DOCUMENT' => true,
		])
		->toArray()
;