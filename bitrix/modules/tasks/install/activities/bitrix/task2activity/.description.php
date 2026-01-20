<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Tasks\Helper\RestrictionUrl;
use Bitrix\Tasks\Integration\Bitrix24;

$arActivityDescription = (
	new ActivityDescription(
		name: Loc::getMessage('BPTA2_DESCR_NAME_1'),
		description: Loc::getMessage('BPTA2_DESCR_DESCR_1'),
		type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE_ACTION->value ],
	)
)
	->setClass('Task2Activity')
	->setJsClass(ActivityDescription::DEFAULT_ACTIVITY_JS_CLASS)
	->setCategory([ 'ID' => 'interaction' ])
	->setReturn([
		'TaskId' => [
			'NAME' => Loc::getMessage('BPTA2_DESCR_TASKID'),
			'TYPE' => 'int',
		],
		'ClosedDate' => [
			'NAME' => Loc::getMessage('BPTA2_DESCR_CLOSEDDATE'),
			'TYPE' => 'datetime',
		],
		'ClosedBy' => [
			'NAME' => Loc::getMessage('BPTA2_DESCR_CLOSEDBY'),
			'TYPE' => 'user',
		],
		'IsDeleted' => [
			'NAME' => Loc::getMessage('BPTA2_DESCR_IS_DELETED'),
			'TYPE' => 'bool',
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'RESPONSIBLE_PROPERTY' => 'Fields.RESPONSIBLE_ID',
		'GROUP' => ['employeeControl', 'taskManagement'],
		'ASSOCIATED_TRIGGERS' => [
			'TASK_STATUS' => 1,
		],
		'SORT' => 2100,
	])
	->setNodeActionSettings([
		'INCLUDE' => ['taskscomplexactivity'],
		'HANDLES_DOCUMENT' => true,
	])
	->setExcluded(!Loader::includeModule('tasks'))
;

if (
	isset($documentType)
	&& $documentType[0] === 'crm'
	&& !Bitrix24::checkFeatureEnabled(Bitrix24\FeatureDictionary::TASK_CRM_INTEGRATION)
)
{
	$arActivityDescription->set('LOCKED', [ 'INFO_CODE' => RestrictionUrl::TASK_LIMIT_CRM_INTEGRATION ]);
}

$arActivityDescription = $arActivityDescription->toArray();
