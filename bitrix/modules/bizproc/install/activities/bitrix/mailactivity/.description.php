<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActionArea;
use Bitrix\Bizproc\Activity\Enum\ActionGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPMA_DESCR_NAME'),
	description: Loc::getMessage('BPMA_DESCR_DESCR_1'),
	type: [
		ActivityType::ACTIVITY->value,
		ActivityType::ROBOT->value,
		ActivityType::NODE_ACTION->value,
	],
))
	->setClass('MailActivity')
	->setJsClass('BizProcActivity')
	->setCategory([
		'ID' => 'interaction',
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'TITLE' => Loc::getMessage('BPMA_DESCR_ROBOT_TITLE'),
		'RESPONSIBLE_PROPERTY' => 'MailUserToArray',
		'GROUP' => ['informingEmployee'],
		'SORT' => 1000,
	])
	->setNodeActionSettings([
		'HANDLES_DOCUMENT' => false,
		'ACTION_GROUP' => ActionGroup::SEND->value,
		'ACTION_AREA' => ActionArea::MAIL->value,
	])
	->toArray()
;
