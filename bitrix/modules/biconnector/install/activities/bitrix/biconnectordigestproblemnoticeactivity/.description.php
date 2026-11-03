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
	name: Loc::getMessage('BPBDPN_DESCR_NAME'),
	description: Loc::getMessage('BPBDPN_DESCR_DESCR'),
	type: [ActivityType::NODE->value],
))
	->setClass('BIConnectorDigestProblemNoticeActivity')
	->setGroups([ActivityGroup::OTHER_OPERATIONS->value])
	->setIcon(Outline::NOTIFICATION->name)
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setReturn([
		'BI_DIGEST_PROBLEM_NOTICE' => [
			'NAME' => Loc::getMessage('BPBDPN_DESCR_PROBLEM_NOTICE'),
			'TYPE' => FieldType::TEXT,
		],
		'BI_DIGEST_PROBLEM_FINGERPRINT' => [
			'NAME' => Loc::getMessage('BPBDPN_DESCR_PROBLEM_FINGERPRINT'),
			'TYPE' => FieldType::STRING,
		],
		'BI_DIGEST_PROBLEM_COUNT' => [
			'NAME' => Loc::getMessage('BPBDPN_DESCR_PROBLEM_COUNT'),
			'TYPE' => FieldType::INT,
		],
	])
	->setExcluded(
		Option::get('bizproc', 'bitrix_ai_bi_dashboard_available', 'N') === 'N',
	)
	->toArray();
