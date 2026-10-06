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
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('SN_ADD_BOT_TO_PROJECT_CHAT_NAME'),
	description: Loc::getMessage('SN_ADD_BOT_TO_PROJECT_CHAT_DESCR'),
	type: [ActivityType::ACTIVITY->value, ActivityType::NODE->value],
))
	->setClass('SocialnetworkAddBotToProjectChatActivity')
	->setJsClass('BizProcActivity')
	->setCategory(['ID' => 'other'])
	->setGroups([ActivityGroup::PROJECT->value])
	->setIcon(Outline::GROUP->name)
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->toArray()
;
