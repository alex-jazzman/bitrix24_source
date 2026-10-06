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
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Internal\Config\WorkflowStateGroupFeature;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('BPSA_DESCR_NAME'),
	description: Loc::GetMessage('BPSA_DESCR_DESCR'),
	type: [ActivityType::NODE->value],
))
	->setClass('StateNode')
	->setExcluded(!WorkflowStateGroupFeature::isAvailable())
	->setGroups([ ActivityGroup::WORKFLOW_STATE->value ])
	->setColorIndex(ActivityColorIndex::YELLOW->value)
	->setIcon(Outline::STAGE->name)
	->setNodeType(ActivityNodeType::OPERATORS->value)
	->setNodeSettings(
		new NodeSettings(
			ports: new NodePorts(
				//input: new PortCollection(new Port('i0')),
				output: new PortCollection(
					new Port('o0', title: 'Вход'),
					new Port('o1', title: 'Выход'),
					new Port('o2', title: 'Ожидание'),
				),
			),
		)
	)
	->toArray()
;
