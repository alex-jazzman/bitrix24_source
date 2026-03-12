<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\FieldType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Loader;
use Bitrix\Main\Config\Option;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

if (
	!class_exists(ActivityDescription::class)
	|| !enum_exists(ActivityGroup::class)
	|| !Loader::includeModule('ui')
	|| !enum_exists(Outline::class)
)
{
	return;
}

$isExcluded = !Loader::includeModule('im')
	|| Option::get('bizproc', 'bitrix_ai_day_plan_available', 'N') === 'N'
;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('IM_ACTIVITIES_GET_USER_MESSAGES_NAME'),
	description: Loc::getMessage('IM_ACTIVITIES_GET_USER_MESSAGES_DESCRIPTION'),
	type: [
		ActivityType::NODE->value,
	],
))
	->setClass('ImGetUserChatMessagesActivity')
	->setJsClass('BizProcActivity')
	->setReturn([
		'MessageCollectionJson' => [
			'NAME' => Loc::getMessage('IM_ACTIVITIES_GET_USER_MESSAGES_RETURN_MESSAGE_COLLECTION'),
			'TYPE' => FieldType::JSON,
		],
		'ChatCount' => [
			'NAME' => Loc::getMessage('IM_ACTIVITIES_GET_USER_MESSAGES_RETURN_CHAT_COUNT'),
			'TYPE' => FieldType::INT,
		],
		'ErrorMessage' => [
			'NAME' => Loc::getMessage('IM_ACTIVITIES_GET_USER_MESSAGES_RETURN_ERROR_MESSAGE'),
			'TYPE' => FieldType::STRING,
		],
	])
	->setGroups([
		ActivityGroup::INTERNAL_COMMUNICATION->value,
	])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setIcon(Outline::CHATS->name)
	->setExcluded($isExcluded)
	->toArray()
;
