<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Dto\NodeSettings;
use Bitrix\Bizproc\Activity\Dto\NodeSettingsParam;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('BPWA_DESCR_NAME_1'),
	description: Loc::GetMessage('BPWA_DESCR_DESCR_1'),
	type: [ActivityType::ACTIVITY->value, ActivityType::NODE->value],
))
	->setClass('EmptyBlockActivity')
	->setJsClass('EmptyBlockActivity')
	->setCategory(['ID' => 'other'])
	->setGroups([ActivityGroup::WORKFLOW->value])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::BOTTLENECK->name)
	->setSort(100)
	->setNodeType(ActivityNodeType::FRAME->value)
	->setNodeSettings(
		new NodeSettings(
			400,
			400,
			null,
			new NodeSettingsParam('frameColorName', 'grey'),
			new NodeSettingsParam('frameTextAlign', 'none'),
			new NodeSettingsParam('frameSeparatorPosition', 100),
			new NodeSettingsParam('frameContent', ''),
			new NodeSettingsParam('frameContentFiles', []),
		)
	)
	->setPresets([
		[
			'ID' => 'FRAME',
			'NAME' => Loc::GetMessage('BPWA_DESCR_PRESET_FRAME_NAME'),
		],
	])
	->toArray()
;
