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
	name: Loc::GetMessage('BPSSA_DESCR_NAME_1'),
	description: Loc::GetMessage('BPSSA_DESCR_DESCR_1'),
	type: [ActivityType::NODE->value],
))
	->setClass('SetStateNode')
	->setNodeType(ActivityNodeType::OPERATORS->value)
	->setExcluded(!WorkflowStateGroupFeature::isAvailable())
	->setGroups([ ActivityGroup::WORKFLOW_STATE->value ])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::STAGE_PLUS->name)
	->toArray()
;
