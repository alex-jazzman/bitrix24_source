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

$arActivityDescription =
	(new ActivityDescription(
		Loc::getMessage('AI_ACTIVITY_AGENT_START_TRIGGER_MSGVER_1') ?? '',
		Loc::getMessage('AI_ACTIVITY_AGENT_START_TRIGGER_DESCRIPTION') ?? '',
		[ActivityType::TRIGGER->value],
	))
		->setClass('AiAgentStartTrigger')
		->setReturn([
			'startedBy' => [
				'Name' => Loc::getMessage('AI_ACTIVITY_AGENT_START_TRIGGER_STARTED_BY') ?? '',
				'Type' => \Bitrix\Bizproc\FieldType::USER,
			],
		])
		->setExcluded(\Bitrix\Main\Config\Option::get('bizproc', 'feature_ai_agents', 'N') === 'N')
		->setGroups([ ActivityGroup::STARTER->value ])
		->setColorIndex(ActivityColorIndex::PINK->value)
		->setIcon(Outline::AI_ROBOT->name)
		->toArray()
;