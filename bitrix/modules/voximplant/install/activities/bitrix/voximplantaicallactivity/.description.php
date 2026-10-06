<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

$arActivityDescription =
	(new ActivityDescription(
		Loc::getMessage('BPVAICA_DESCR_NAME') ?? '',
		Loc::getMessage('BPVAICA_DESCR_DESCR') ?? '',
		[ActivityType::NODE->value],
	))
		->setClass('VoximplantAiCallActivity')
		->setJsClass('BizProcActivity')
		->setCategory(['ID' => 'interaction'])
		->setFilter([
			'EXCLUDE' => [
				['tasks'],
				['rpa'],
			],
		])
		->setRobotSettings([
			'CATEGORY' => 'client',
			'GROUP' => ['clientCommunication'],
			'SORT' => 1200,
		])
		->setExcluded(
			!(
				Loader::includeModule('voximplant')
				&& CVoxImplantOutgoing::CanUseAiCall()
			)
		)
		->setReturn([
			'Result' => [
				'NAME' => Loc::getMessage('BPVAICA_DESCR_RESULT'),
				'TYPE' => 'bool',
			],
			'ResultText' => [
				'NAME' => Loc::getMessage('BPVAICA_DESCR_RESULT_TEXT'),
				'TYPE' => 'string',
			],
			'ResultCode' => [
				'NAME' => Loc::getMessage('BPVAICA_DESCR_RESULT_CODE'),
				'TYPE' => 'string',
			],
		])
		->setColorIndex(ActivityColorIndex::PINK->value)
		->setGroups([ActivityGroup::CLIENT_COMMUNICATION->value, ActivityGroup::AI->value])
		->setIcon('PHONE_OUT')
		->toArray()
;
