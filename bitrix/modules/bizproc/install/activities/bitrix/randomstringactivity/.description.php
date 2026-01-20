<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPRNDSA_DESCR_NAME'),
	description: Loc::getMessage('BPRNDSA_DESCR_DESCR_MSGVER_1'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'other',
	])
	->setClass('RandomStringActivity')
	->setJsClass('BizProcActivity')
	->setReturn([
		'ResultString' => [
			'NAME' => Loc::getMessage('BPRNDSA_DESCR_RESULT_STRING'),
			'TYPE' => 'string',
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => [ 'other' ],
		'SORT' => 3900,
		'IS_SUPPORTING_ROBOT' => true,
	])
	->setGroups([ ActivityGroup::OTHER_OPERATIONS->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::DEVELOPER_RESOURCES->name)
	->toArray()
;
