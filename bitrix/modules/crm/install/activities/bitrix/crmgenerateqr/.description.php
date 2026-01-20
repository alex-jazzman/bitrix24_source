<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('CRMBPGQR_DESCR_NAME'),
	description: Loc::getMessage('CRMBPGQR_DESCR_DESCR_1_MSGVER_1'),
	type: [ ActivityType::ACTIVITY->value, ActivityType::ROBOT->value, ActivityType::NODE->value ],
))
	->setCategory([
		'ID' => 'other',
	])
	->setClass('CrmGenerateQr')
	->setJsClass('BizProcActivity')
	->setFilter([
		'INCLUDE' => [
			[ 'crm', 'CCrmDocumentDeal' ],
			[ 'crm', 'CCrmDocumentLead' ],
			[ 'crm', \Bitrix\Crm\Integration\BizProc\Document\Dynamic::class ],
			[ 'crm', \Bitrix\Crm\Integration\BizProc\Document\SmartDocument::class ],
		],
	])
	->setRobotSettings([
		'CATEGORY' => 'employee',
		'GROUP' => [ 'other' ],
		'ASSOCIATED_TRIGGERS' => [
			'QR' => 1,
		],
		'SORT' => 3000,
		'IS_SUPPORTING_ROBOT' => true,
	])
	->setReturn([
		'PageLink' => [
			'NAME' => Loc::getMessage('CRMBPGQR_RETURN_PAGE_LINK'),
			'TYPE' => 'string',
		],
		'PageLinkBb' => [
			'NAME' => Loc::getMessage('CRMBPGQR_RETURN_PAGE_LINK_BB'),
			'TYPE' => 'string',
		],
		'PageLinkHtml' => [
			'NAME' => Loc::getMessage('CRMBPGQR_RETURN_PAGE_LINK_HTML'),
			'TYPE' => 'string',
		],
		'QrLink' => [
			'NAME' => Loc::getMessage('CRMBPGQR_RETURN_QR_LINK'),
			'TYPE' => 'string',
		],
		'QrLinkBb' => [
			'NAME' => Loc::getMessage('CRMBPGQR_RETURN_QR_LINK_BB'),
			'TYPE' => 'string',
		],
		'QrLinkHtml' => [
			'NAME' => Loc::getMessage('CRMBPGQR_RETURN_QR_LINK_HTML'),
			'TYPE' => 'string',
		],
		'QrImgHtml' => [
			'NAME' => Loc::getMessage('CRMBPGQR_RETURN_QR_IMG'),
			'TYPE' => 'string',
		],
	])
	->setGroups([
		ActivityGroup::OTHER_OPERATIONS->value,
		ActivityGroup::LEAD->value,
	])
	->setColorIndex(ActivityColorIndex::GREY->value)
	->setIcon(Outline::QR_CODE->name)
	->toArray()
;

