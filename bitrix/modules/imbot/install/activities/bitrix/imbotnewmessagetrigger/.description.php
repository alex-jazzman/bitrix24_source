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
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPCDT_DESCR_NAME') ?? '',
	description: Loc::getMessage('BPCDT_DESCR_DESCR') ?? '',
	type: [ ActivityType::TRIGGER->value ],
))
	->setCategory([
		'ID' => 'trigger',
	])
	->setClass('ImBotNewMessageTrigger')
	->setExcluded(!Loader::includeModule('imbot'))
	->setReturn([
		'Message' => [
			'NAME' => Loc::getMessage('BPCDT_DESCR_MESSAGE_RESULT'),
			'TYPE' => 'string',
		],
		'SenderId' => [
			'NAME' => Loc::getMessage('BPCDT_DESCR_MESSAGE_SENDER'),
			'TYPE' => 'user',
		],
		'ActualBotId' => [
			'NAME' => Loc::getMessage('BPCDT_DESCR_MESSAGE_ACTUAL_BOT_ID'),
			'TYPE' => 'int',
		],
	])
	->setAiDescription('The trigger fires when a new message is received from a bot')
	->setGroups([
		ActivityGroup::INTERNAL_COMMUNICATION->value,
		ActivityGroup::STARTER->value,
	])
	->setColorIndex(ActivityColorIndex::ORANGE->value)
	->setIcon(Outline::MESSAGE->name)
	->toArray()
;
