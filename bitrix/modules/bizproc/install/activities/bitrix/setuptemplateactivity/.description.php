<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityContentBlockColor;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\Public\Feature\AiAgent\AiAgentSectionFlag;
use Bitrix\Main\Config\Feature;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

if (!class_exists(ActivityDescription::class))
{
	return;
}

$arActivityDescription =
	(new ActivityDescription(
		Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_NAME') ?? '',
		Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_DESCRIPTION') ?? '',
		[ActivityType::NODE->value],
	))
		->setClass('SetupTemplateActivity')
		->setJsClass('BizProcActivity')
		->setNodeType(ActivityNodeType::SERVICE->value)
		->setExcluded(Feature::isDisabled(AiAgentSectionFlag::class))
		->setGroups([ ActivityGroup::WORKFLOW->value ])
		->setColorIndex(ActivityColorIndex::SETTINGS->value)
		->setContentBlockColor(ActivityContentBlockColor::DEFAULT->value)
		->setIcon(Outline::SETTINGS->name)
		->set('SORT', 100)
		->toArray()
;
