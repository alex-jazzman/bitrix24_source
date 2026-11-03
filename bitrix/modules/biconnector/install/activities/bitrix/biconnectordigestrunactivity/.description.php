<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true) {
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Ui\Public\Enum\IconSet\Outline;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Config\Option;
use Bitrix\Bizproc\FieldType;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('BPBDR_DESCR_NAME'),
	description: Loc::getMessage('BPBDR_DESCR_DESCR'),
	type: [ActivityType::NODE->value],
))
	->setClass('BIConnectorDigestRunActivity')
	->setGroups([ActivityGroup::OTHER_OPERATIONS->value])
	->setIcon(Outline::FLAG->name)
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setReturn([
		'BI_DIGEST_RUN_CAN_CONTINUE' => [
			'NAME' => Loc::getMessage('BPBDR_DESCR_RUN_CAN_CONTINUE'),
			'TYPE' => FieldType::BOOL,
		],
		'BI_DIGEST_RUN_REASON_CLASS' => [
			'NAME' => Loc::getMessage('BPBDR_DESCR_RUN_REASON_CLASS'),
			'TYPE' => FieldType::STRING,
		],
		'BI_DIGEST_RUN_REASON' => [
			'NAME' => Loc::getMessage('BPBDR_DESCR_RUN_REASON'),
			'TYPE' => FieldType::STRING,
		],
		'BI_DIGEST_RUN_ID' => [
			'NAME' => Loc::getMessage('BPBDR_DESCR_RUN_ID'),
			'TYPE' => FieldType::STRING,
		],
		'BI_DIGEST_RUN_RECIPIENTS' => [
			'NAME' => Loc::getMessage('BPBDR_DESCR_RUN_RECIPIENTS'),
			'TYPE' => FieldType::USER,
			'MULTIPLE' => true,
		],
		'BI_DIGEST_RUN_VIEWER_RECIPIENTS' => [
			'NAME' => Loc::getMessage('BPBDR_DESCR_RUN_VIEWER_RECIPIENTS'),
			'TYPE' => FieldType::USER,
			'MULTIPLE' => true,
		],
	])
	->setExcluded(
		Option::get('bizproc', 'bitrix_ai_bi_dashboard_available', 'N') === 'N',
	)
	->toArray();

$arActivityDescription['SIDE_EFFECT'] = [
	'targets' => [],
	'safeValues' => [],
	'defaultMode' => 'skip',
];
