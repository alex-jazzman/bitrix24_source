<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;
use Bitrix\Rest;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPWHA_DESCR_NAME_1'),
	description: Loc::getMessage('BPWHA_DESCR_DESCR_1'),
	type: [
		ActivityType::ACTIVITY->value,
		ActivityType::ROBOT->value,
		ActivityType::NODE->value,
	],
))
	->setClass('WebHookActivity')
	->setJsClass('BizProcActivity')
	->setCategory(['ID' => 'other'])
	->setRobotSettings([
		'CATEGORY' => 'other',
		'GROUP' => ['other'],
		'ASSOCIATED_TRIGGERS' => [
			'WEBHOOK' => 1,
		],
		'SORT' => 4000,
	])
	->setExcluded(!Main\Loader::includeModule('rest') || !Rest\Engine\Access::isAvailable())
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setGroups([ActivityGroup::OTHER_OPERATIONS->value])
	->setIcon(Outline::WEBHOOK->name)
	->toArray()
;
