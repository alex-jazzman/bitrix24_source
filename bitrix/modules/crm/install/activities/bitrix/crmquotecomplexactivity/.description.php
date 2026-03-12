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
use Bitrix\Bizproc\Activity\Dto\Complex\Settings;
use Bitrix\Bizproc\Activity\Dto\Complex\NodeActionDictionary;
use Bitrix\Bizproc\Activity\Dto\Complex\NodeAction;

$arActivityDescription = (new ActivityDescription(
	name: Loc::getMessage('CRM_COMPLEX_ACTIVITY_QUOTE_NAME') ?? '',
	description: Loc::getMessage('CRM_COMPLEX_ACTIVITY_QUOTE_DESCRIPTION') ?? '',
	type: [ActivityType::NODE->value],
))
	->setClass('CrmQuoteComplexActivity')
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setExcluded(
		(bool)\Bitrix\Main\Config\Option::get('bizproc', 'complex_activity_excluded', 1), // temporary, remove when ready
	)
	->setIcon(Outline::SUITCASE->name)
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setGroups([
		ActivityGroup::SALES_CRM->value,
	])
	->setComplexActivitySettings(
		new Settings(
			actionDictionary: new NodeActionDictionary(
				new NodeAction(
					activityCode: 'crmcreatequoteactivity',
					sort: 100,
				),
				new NodeAction(
					activityCode: 'setfieldactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_QUOTE_DESCRIPTION_NODE_ACTION_CHANGE'),
					sort: 200,
				),
				new NodeAction(
					activityCode: 'crmsetcompanyfield',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_QUOTE_DESCRIPTION_NODE_ACTION_SET_COMPANY'),
					sort: 300,
				),
				new NodeAction(
					activityCode: 'crmsetcontactfield',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_QUOTE_DESCRIPTION_NODE_ACTION_SET_CONTACT'),
					sort: 400,
				),
				new NodeAction(
					activityCode: 'crmchangeresponsibleactivity',
					sort: 500,
				),
				new NodeAction(
					activityCode: 'crmchangerequisiteactivity',
					sort: 600,
				),
				new NodeAction(
					activityCode: 'crmchangestatusactivity',
					sort: 700,
				),
				new NodeAction(
					activityCode: 'crmgenerateentitydocumentactivity',
					sort: 750,
				),
				new NodeAction(
					activityCode: 'crmaddproductrow',
					sort: 800,
				),
				new NodeAction(
					activityCode: 'crmremoveproductrow',
					sort: 900,
				),
				new NodeAction(
					activityCode: 'deletedocumentactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_QUOTE_DESCRIPTION_NODE_ACTION_DELETE'),
					sort: 1000,
				),
			),
		),
	)
	->toArray()
;