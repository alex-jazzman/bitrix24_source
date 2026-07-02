<?php

declare(strict_types=1);

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
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('SN_GET_PROJECT_INFO_NAME'),
	description: Loc::getMessage('SN_GET_PROJECT_INFO_DESCR'),
	type: [ActivityType::NODE->value],
))
	->setClass('SocialnetworkGetProjectInfoActivity')
	->setJsClass('BizProcActivity')
	->setGroups([ActivityGroup::PROJECT->value])
	->setReturn([
		'ProjectName' => [
			'NAME' => Loc::getMessage('SN_GET_PROJECT_INFO_RETURN_FIELD_PROJECT_NAME'),
			'TYPE' => FieldType::STRING,
		],
		'ProjectChatId' => [
			'NAME' => Loc::getMessage('SN_GET_PROJECT_INFO_RETURN_FIELD_PROJECT_CHAT_ID'),
			'TYPE' => FieldType::INT,
		],
		'CanMembersViewAllTasks' => [
			'NAME' => Loc::getMessage('SN_GET_PROJECT_INFO_FIELD_CAN_MEMBERS_VIEW_ALL_TASKS'),
			'TYPE' => FieldType::BOOL,
		],
	])
	->setIcon(Outline::TASK_LIST->name)
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->toArray()
;
