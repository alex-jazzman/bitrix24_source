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

$isExcluded = !Loader::includeModule('im');

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('IM_ACTIVITIES_SEND_CHANNEL_POST_NAME'),
	description: Loc::getMessage('IM_ACTIVITIES_SEND_CHANNEL_POST_DESCRIPTION'),
	type: [
		ActivityType::NODE->value,
	],
))
	->setClass('ImSendChannelPostActivity')
	->setJsClass('BizProcActivity')
	->setReturn([
		'PostCollectionJson' => [
			'NAME' => Loc::getMessage('IM_ACTIVITIES_SEND_CHANNEL_POST_RETURN_COLLECTION'),
			'TYPE' => FieldType::JSON,
		],
		'OperationStatus' => [
			'NAME' => Loc::getMessage('IM_ACTIVITIES_SEND_CHANNEL_POST_RETURN_STATUS'),
			'TYPE' => FieldType::STRING,
		],
		'ErrorText' => [
			'NAME' => Loc::getMessage('IM_ACTIVITIES_SEND_CHANNEL_POST_RETURN_ERROR'),
			'TYPE' => FieldType::STRING,
		],
	])
	->setGroups([
		ActivityGroup::INTERNAL_COMMUNICATION->value,
	])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setIcon(Outline::SPEAKER->name)
	->setExcluded($isExcluded)
	->toArray()
;
