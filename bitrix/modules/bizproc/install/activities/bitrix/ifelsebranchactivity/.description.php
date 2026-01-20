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
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPIEBA_DESCR_NAME'),
	description: Loc::getMessage('BPIEBA_DESCR_DESCR'),
	type: [ActivityType::ACTIVITY->value, ActivityType::NODE->value],
))
	->setClass('IfElseBranchActivity')
	->setJsClass('IfElseBranchActivity')
	->set('SORT', 100)
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setNodeSettings(new \Bitrix\Bizproc\Activity\Dto\NodeSettings(
		width: 230,
		height: 46,
		ports: new \Bitrix\Bizproc\Activity\Dto\NodePorts(
			input: new \Bitrix\Bizproc\Activity\Dto\PortCollection(
				new \Bitrix\Bizproc\Activity\Dto\Port('i0'),
			),
			output: new \Bitrix\Bizproc\Activity\Dto\PortCollection(
				new \Bitrix\Bizproc\Activity\Dto\Port('o0', title: 'true'),
				new \Bitrix\Bizproc\Activity\Dto\Port('o1', 1, 'false'),
			),
		)
	))
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setGroups([ActivityGroup::WORKFLOW->value])
	->setIcon(Outline::CONDITION->name)
	->toArray()
;
