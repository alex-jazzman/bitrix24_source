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
	name: Loc::GetMessage('BPEDA_DESCR_NAME'),
	description: Loc::GetMessage('BPEDA_DESCR_DESCR_1'),
	type: $type,
))
	->setClass('EventDrivenActivity')
	->setJsClass('EventDrivenActivity')
	->setGroups([ ActivityGroup::WORKFLOW_STATE->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::ACTION_REQUIRED->name)
	->setNodeSettings(
		new NodeSettings(
			ports: new NodePorts(
				output: new PortCollection(new Port('o0')),
				topAux: new PortCollection(new Port('t0')),
			),
		)
	)
	->setSort(100)
	->setPresets([
		[
			'ID' => 'CMD',
			'NAME' => 'Command',
			'PROPERTIES' => [ 'InitialActivity' => 'HandleExternalEventActivity' ],
		],
		[
			'ID' => 'DELAY',
			'NAME' => 'Delay',
			'PROPERTIES' => [ 'InitialActivity' => 'DelayActivity' ],
			'NODE_ICON' => Outline::PAUSE_M->name,
		],
	])
	->toArray()
;
