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
		'BI_DASHBOARD_RESULT_FILE' => [
			'NAME' => Loc::getMessage('BPBDC_DESCR_RESULT_FILE'),
			'TYPE' => FieldType::FILE,
		],
		'BI_DASHBOARD_RESULT_URL_STRING' => [
			'NAME' => Loc::getMessage('BPBDC_DESCR_RESULT_URL_STRING'),
			'TYPE' => FieldType::STRING,
		],
	])
	->setExcluded(
		Option::get('bizproc', 'bitrix_ai_bi_dashboard_available', 'N') === 'N',
	)
	->toArray();
