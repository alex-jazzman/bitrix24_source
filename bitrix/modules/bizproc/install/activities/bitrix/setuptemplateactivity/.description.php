<?php

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
		->setExcluded(\Bitrix\Main\Config\Option::get('bizproc', 'feature_ai_agents', 'N') === 'N')
		->setGroups([ ActivityGroup::WORKFLOW->value ])
		->setColorIndex(ActivityColorIndex::ORANGE->value)
		->setIcon(Outline::SETTINGS->name)
		->set('SORT', 100)
		->toArray()
;
