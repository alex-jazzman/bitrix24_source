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
	name: Loc::getMessage('BPBDG_DESCR_NAME'),
	description: Loc::getMessage('BPBDG_DESCR_DESCR'),
	type: [ActivityType::NODE->value],
))
	->setClass('BIConnectorDigestGreetingActivity')
	->setGroups([ActivityGroup::OTHER_OPERATIONS->value])
	->setIcon(Outline::PERSON_CHECKS->name)
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setReturn([
		'BI_DIGEST_GREETING_RECIPIENTS' => [
			'NAME' => Loc::getMessage('BPBDG_DESCR_GREETING_RECIPIENTS'),
			'TYPE' => FieldType::USER,
			'MULTIPLE' => true,
		],
	])
	->setExcluded(
		Option::get('bizproc', 'bitrix_ai_bi_dashboard_available', 'N') === 'N',
	)
	->toArray();
