<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPSNMA_DESCR_NAME'),
	description: Loc::getMessage('BPSNMA_DESCR_DESCR_1'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value ],
))
	->setCategory([ 'ID' => 'interaction' ])
	->setClass('SocNetMessageActivity')
	->setJsClass('BizProcActivity')
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'TITLE' => Loc::getMessage('BPSNMA_DESCR_ROBOT_TITLE_1'),
		'RESPONSIBLE_PROPERTY' => 'MessageUserTo',
		'GROUP' => [ 'informingEmployee' ],
		'SORT' => 700,
	])
	->toArray()
;
