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
	name: Loc::getMessage('BPBDA_DESCR_NAME'),
	description: Loc::getMessage('BPBDA_DESCR_DESCR'),
	type: [ActivityType::NODE->value],
))
	->setClass('BIConnectorDigestAnswerActivity')
	->setGroups([ActivityGroup::OTHER_OPERATIONS->value])
	->setIcon(Outline::CIRCLE_CHECK->name)
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setReturn([
		'BI_DIGEST_ANSWER_OUTCOME' => [
			'NAME' => Loc::getMessage('BPBDA_DESCR_ANSWER_OUTCOME'),
			'TYPE' => FieldType::STRING,
		],
		'BI_DIGEST_ANSWER_REASON_CODE' => [
			'NAME' => Loc::getMessage('BPBDA_DESCR_ANSWER_REASON_CODE'),
			'TYPE' => FieldType::STRING,
		],
	])
	->setExcluded(
		Option::get('bizproc', 'bitrix_ai_bi_dashboard_available', 'N') === 'N',
	)
	->toArray();
