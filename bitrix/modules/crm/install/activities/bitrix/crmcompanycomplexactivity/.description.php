<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Dto\Complex\NodeAction;
use Bitrix\Bizproc\Activity\Dto\Complex\NodeActionDictionary;
use Bitrix\Bizproc\Activity\Dto\Complex\Settings;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('CRM_COMPLEX_ACTIVITY_COMPANY_NAME') ?? '',
	description: Loc::GetMessage('CRM_COMPLEX_ACTIVITY_COMPANY_DESCRIPTION') ?? '',
	type: [
		ActivityType::NODE->value,
	],
))
	->setClass('CrmCompanyComplexActivity')
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setExcluded(
		(bool)\Bitrix\Main\Config\Option::get('bizproc', 'complex_activity_excluded', 1), // temporary, remove when ready
	)
	->setIcon(Outline::COMPANY->name)
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setGroups([
		ActivityGroup::SALES_CRM->value,
		ActivityGroup::CLIENT_BASE->value
	])
	->setComplexActivitySettings(
		new Settings(
			actionDictionary: new NodeActionDictionary(
				new NodeAction(
					activityCode: 'createcrmcompanydocumentactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_COMPANY_DESCRIPTION_NODE_ACTION_CREATE_COMPANY'),
					sort: 100,
				),
				new NodeAction(
					activityCode: 'setfieldactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_COMPANY_DESCRIPTION_NODE_ACTION_CHANGE_COMPANY'),
					sort: 200,
				),
				new NodeAction(
					activityCode: 'crmsetobserverfield',
					sort: 300,
				),
				new NodeAction(
					activityCode: 'crmchangeresponsibleactivity',
					sort: 400,
				),
				new NodeAction(
					activityCode: 'crmchangerequisiteactivity',
					sort: 500,
				),
				new NodeAction(
					activityCode: 'crmgenerateentitydocumentactivity',
					sort: 550,
				),
				new NodeAction(
					activityCode: 'deletedocumentactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_COMPANY_DESCRIPTION_NODE_ACTION_DELETE_COMPANY'),
					sort: 600,
				),
			),
		),
	)
	->toArray()
;
