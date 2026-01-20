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
	name: Loc::getMessage('IM_ACTIVITIES_CREATE_GROUP_CHAT_NAME'),
	description: Loc::getMessage('IM_ACTIVITIES_CREATE_GROUP_CHAT_DESCRIPTION'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'other',
	])
	->setClass('ImCreateGroupChatActivity')
	->setJsClass('BizProcActivity')
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => [ 'informingEmployee' ],
		'SORT' => 925,
	])
	->setReturn([
		'ChatId' => [
			'NAME' => Loc::getMessage('IM_ACTIVITIES_CREATE_GROUP_CHAT_RETURN_ID'),
			'TYPE' => 'int',
		],
	])
	->setGroups([ ActivityGroup::INTERNAL_COMMUNICATION->value ])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setIcon(Outline::CHATS->name)
	->toArray()
;
