<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Ui\Public\Enum\IconSet\Outline;
use Bitrix\Main\Localization\Loc;

$type = [ActivityType::ACTIVITY->value];
if (defined('Bitrix\Bizproc\Dev\ENV'))
{
	$type[] = ActivityType::NODE->value;
}

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPWA_DESCR_NAME'),
	description: Loc::getMessage('BPWA_DESCR_DESCR'),
	type: $type,
))
	->setCategory([
		'ID' => 'logic',
	])
	->setClass('WhileActivity')
	->setJsClass('WhileActivity')
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setNodeSettings(new \Bitrix\Bizproc\Activity\Dto\NodeSettings(
		ports: new \Bitrix\Bizproc\Activity\Dto\NodePorts(
			input: new \Bitrix\Bizproc\Activity\Dto\PortCollection(
				new \Bitrix\Bizproc\Activity\Dto\Port('i0'),
			),
			output: new \Bitrix\Bizproc\Activity\Dto\PortCollection(
				new \Bitrix\Bizproc\Activity\Dto\Port('o1', 1, 'out'),
				new \Bitrix\Bizproc\Activity\Dto\Port('o0', 2, '->>'),
			),
		)
	))
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setGroups([ActivityGroup::WORKFLOW->value])
	->setIcon(Outline::REPEAT_CYCLE->name)
	->toArray()
;
