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
	name: Loc::getMessage('IMOL_MA_DESCR_NAME_2'),
	description: Loc::getMessage('IMOL_MA_DESCR_DESCR_2'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'interaction',
	])
	->setClass('ImOpenLinesMessageActivity')
	->setJsClass('BizProcActivity')
	->setFilter([
		'INCLUDE' => [
			[ 'crm' ],
		],
		'EXCLUDE' => [
			[ 'crm', \Bitrix\Crm\Integration\BizProc\Document\SmartDocument::class ],
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'client',
		'GROUP' => [ 'clientCommunication', 'delivery' ],
		'ASSOCIATED_TRIGGERS' => [
			'OPENLINE' => -2,
			'OPENLINE_ANSWER' => -1,
			'OPENLINE_ANSWER_CTRL' => 1,
			'OPENLINE_MSG' => 2,
		],
		'SORT' => 1200,
	])
	->setGroups([ ActivityGroup::CLIENT_COMMUNICATION->value ])
	->setColorIndex(ActivityColorIndex::GREEN->value)
	->setIcon(Outline::OPEN_CHANNELS->name)
	->toArray()
;
