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
	name: Loc::getMessage('BPBDC_DESCR_NAME'),
	description: Loc::getMessage('BPBDC_DESCR_DESCR'),
	type: [ActivityType::NODE->value],
))
	->setClass('BIConnectorDashboardResultActivity')
	->setGroups([ActivityGroup::OTHER_OPERATIONS->value])
	->setIcon(Outline::DOCUMENT_LINK->name)
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setReturn([
		'BI_DASHBOARD_RESULT_READY' => [
			'NAME' => Loc::getMessage('BPBDC_DESCR_RESULT_READY'),
			'TYPE' => FieldType::BOOL,
		],
		'BI_DASHBOARD_RESULT_REASON_CLASS' => [
			'NAME' => Loc::getMessage('BPBDC_DESCR_RESULT_REASON_CLASS'),
			'TYPE' => FieldType::STRING,
		],
		'BI_DASHBOARD_RESULT_REASON' => [
			'NAME' => Loc::getMessage('BPBDC_DESCR_RESULT_REASON'),
			'TYPE' => FieldType::STRING,
		],
		'BI_DASHBOARD_RESULT_REASON_CODE' => [
			'NAME' => Loc::getMessage('BPBDC_DESCR_RESULT_REASON_CODE'),
			'TYPE' => FieldType::STRING,
		],
		'BI_DASHBOARD_RESULT_URL_STRING' => [
			'NAME' => Loc::getMessage('BPBDC_DESCR_RESULT_URL_STRING'),
			'TYPE' => FieldType::STRING,
		],
		'BI_DASHBOARD_RESULT_PINNED_CONTEXT' => [
			'NAME' => Loc::getMessage('BPBDC_DESCR_RESULT_PINNED_CONTEXT'),
			'TYPE' => FieldType::STRING,
		],
		// Declared and never filled: the activity is offered in the designer catalogue, so a template
		// of somebody else may already reference it, and unpublishing it breaks that expression silently.
		'BI_DASHBOARD_RESULT_FILE' => [
			'NAME' => Loc::getMessage('BPBDC_DESCR_RESULT_FILE'),
			'TYPE' => FieldType::FILE,
		],
	])
	->setExcluded(
		Option::get('bizproc', 'bitrix_ai_bi_dashboard_available', 'N') === 'N',
	)
	->toArray();
