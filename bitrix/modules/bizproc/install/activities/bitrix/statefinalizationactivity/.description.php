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
	name: Loc::GetMessage('BPSFA_DESCR_NAME_1'),
	description: Loc::GetMessage('BPSFA_DESCR_DESCR_1'),
	type: $type,
))
	->setClass('StateFinalizationActivity')
	->setJsClass('StateFinalizationActivity')
	->setGroups([ ActivityGroup::WORKFLOW_STATE->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::LOG_OUT->name)
	->setNodeSettings(
		new NodeSettings(
			ports: new NodePorts(
				output: new PortCollection(new Port('o0')),
				topAux: new PortCollection(new Port('t0')),
			),
		)
	)
	->toArray()
;

