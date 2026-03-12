<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

if (
	!\Bitrix\Main\Loader::includeModule('bizproc')
	|| version_compare(ModuleManager::getVersion('bizproc'), '26.0.0', '<')
	|| version_compare(ModuleManager::getVersion('ui'), '26.0.0', '<')
)
{
	return;
}

$showInCatalog = \Bitrix\Main\Config\Option::get('bizproc', 'bitrix_ai_day_plan_available', 'N') === 'Y';

$arActivityDescription = (new ActivityDescription(
	Loc::getMessage('BPCA1_DESCR_NAME2'),
	Loc::getMessage('BPCA1_DESCR_DESCR2'),
	[
		\Bitrix\Bizproc\Activity\Enum\ActivityType::NODE->value,
	],
))
	->setClass('CalendarGetInform')
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setGroups([\Bitrix\Bizproc\Activity\Enum\ActivityGroup::OTHER_OPERATIONS->value])
	->setIcon(\Bitrix\Ui\Public\Enum\IconSet\Outline::PLANNING_2->name)
	->setExcluded(!$showInCatalog)
	->setReturn(
		[
			'ResultJson' => [
				'NAME' => Loc::getMessage('BPCA1_DESCR_RESULT_JSON'),
				'TYPE' => 'string',
			],
			'ResultJsonAi' => [
				'NAME' => Loc::getMessage('BPCA1_DESCR_RESULT_JSON_AI'),
				'TYPE' => 'string',
			],
			'EventsCount' => [
				'NAME' => Loc::getMessage('BPCA1_DESCR_RESULT_EVENTS'),
				'TYPE' => 'string',
			],
		],
	)
	->toArray()
;
