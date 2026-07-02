<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$type = [];
if (defined('Bitrix\Bizproc\Dev\ENV'))
{
	$type[] = ActivityType::NODE->value;
}

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPIEA_DESCR_NAME'),
	description: Loc::getMessage('BPIEA_DESCR_DESCR'),
	type: $type,
))
	->setClass('SwitchNode')
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setGroups([ActivityGroup::WORKFLOW->value])
	->setIcon(Outline::FILTER->name)
	->toArray()
;
