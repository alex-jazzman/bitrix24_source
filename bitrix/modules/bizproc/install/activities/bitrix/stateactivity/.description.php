<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Dto\NodePorts;
use Bitrix\Bizproc\Activity\Dto\NodeSettings;
use Bitrix\Bizproc\Activity\Dto\Port;
use Bitrix\Bizproc\Activity\Dto\PortCollection;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$type = [ActivityType::ACTIVITY->value];
if (defined('Bitrix\Bizproc\Dev\ENV'))
{
	$type[] = ActivityType::NODE->value;
}

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('BPSA_DESCR_NAME'),
	description: Loc::GetMessage('BPSA_DESCR_DESCR'),
	type: $type,
))
	->setClass('StateActivity')
	->setJsClass('StateActivity')
	->setGroups([ ActivityGroup::WORKFLOW_STATE->value ])
	->setColorIndex(ActivityColorIndex::YELLOW->value)
	->setIcon(Outline::STAGE->name)
	->setNodeSettings(
		new NodeSettings(
			ports: new NodePorts(
				input: new PortCollection(new Port('i0')),
				output: new PortCollection(new Port('o0')),
				aux: new PortCollection(new Port('a0')),
			),
		)
	)
	->toArray()
;
