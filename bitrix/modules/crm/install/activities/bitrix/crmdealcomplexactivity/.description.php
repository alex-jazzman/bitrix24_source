<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('CRM_COMPLEX_ACTIVITY_DEAL_NAME') ?? '',
	description: Loc::GetMessage('CRM_COMPLEX_ACTIVITY_DEAL_DESCRIPTION') ?? '',
	type: [
		ActivityType::NODE->value,
	],
))
	->setCategory([
		'ID' => 'crm',
		'OWN_ID' => 'crm',
		'OWN_NAME' => 'CRM',
	])
	->setClass('CrmDealComplexActivity')
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setExcluded(
		(bool)\Bitrix\Main\Config\Option::get('bizproc', 'complex_activity_excluded', 1), // temporary, remove when ready
	)
	->setIcon(Outline::HANDSHAKE->name)
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setGroups([
		ActivityGroup::SALES_CRM->value,
	])
	->setComplexActivitySettings(
		new Bitrix\Bizproc\Activity\Dto\Complex\Settings(
			actionDictionary: new Bitrix\Bizproc\Activity\Dto\Complex\NodeActionDictionary(
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'createcrmdealdocumentactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DEAL_DESCRIPTION_NODE_ACTION_CREATE_DEAL'),
					sort: 100,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'setfieldactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DEAL_DESCRIPTION_NODE_ACTION_CHANGE_DEAL'),
					sort: 200,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmchangeresponsibleactivity',
					sort: 300,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmsetobserverfield',
					sort: 350,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmchangestatusactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DEAL_DESCRIPTION_NODE_ACTION_CHANGE_STATUS'),
					sort: 400,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmchangedealcategoryactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DEAL_DESCRIPTION_NODE_ACTION_CHANGE_CATEGORY'),
					sort: 500,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmsetcontactfield',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DEAL_DESCRIPTION_NODE_ACTION_CHANGE_CONTACT'),
					sort: 600,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmsetcompanyfield',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DEAL_DESCRIPTION_NODE_ACTION_CHANGE_COMPANY'),
					sort: 700,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmchangerequisiteactivity',
					sort: 800,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmcopydealactivity',
					sort: 900,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmconvertdocumentactivity',
					sort: 1000,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmgenerateentitydocumentactivity',
					sort: 1050,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmaddproductrow',
					sort: 1100,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'crmremoveproductrow',
					sort: 1200,
				),
				new Bitrix\Bizproc\Activity\Dto\Complex\NodeAction(
					activityCode: 'deletedocumentactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DEAL_DESCRIPTION_NODE_ACTION_DELETE_DEAL'),
					sort: 1300,
				),
			),
		),
	)
	->toArray()
;
