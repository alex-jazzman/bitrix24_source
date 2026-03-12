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
use Bitrix\Bizproc\Activity\Dto\Complex;
use Bitrix\Bizproc\Activity\Dto\Complex\NodeActionDictionary;
use Bitrix\Bizproc\Activity\Dto\Complex\NodeAction;

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('CRM_COMPLEX_ACTIVITY_DYNAMIC_NAME') ?? '',
	description: Loc::GetMessage('CRM_COMPLEX_ACTIVITY_DYNAMIC_DESCRIPTION') ?? '',
	type: [ActivityType::NODE->value],
))
	->setClass('CrmDynamicComplexActivity')
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setExcluded(
		(bool)\Bitrix\Main\Config\Option::get('bizproc', 'complex_activity_excluded', 1), // temporary, remove when ready
	)
	->setIcon(Outline::SMART_PROCESS->name)
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setGroups([
		ActivityGroup::SALES_CRM->value,
	])
	->setComplexActivitySettings(
		new Complex\Settings(
			actionDictionary: new NodeActionDictionary(
				new NodeAction(
					activityCode: 'crmcreatedynamicactivity',
					sort: 100,
					presetId: 'dynamic',
				),
				new NodeAction(
					activityCode: 'setfieldactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DYNAMIC_DESCRIPTION_NODE_ACTION_CHANGE'),
					sort: 200,
				),
				new NodeAction(
					activityCode: 'crmchangerelationsactivity',
					sort: 300,
				),
				new NodeAction(
					activityCode: 'crmsetcompanyfield',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DYNAMIC_DESCRIPTION_NODE_ACTION_CHANGE_COMPANY'),
					sort: 400,
				),
				new NodeAction(
					activityCode: 'crmsetcontactfield',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DYNAMIC_DESCRIPTION_NODE_ACTION_CHANGE_CONTACT'),
					sort: 500,
				),
				new NodeAction(
					activityCode: 'crmsetobserverfield',
					sort: 600,
				),
				new NodeAction(
					activityCode: 'crmchangeresponsibleactivity',
					sort: 700,
				),
				new NodeAction(
					activityCode: 'crmchangerequisiteactivity',
					sort: 800,
				),
				new NodeAction(
					activityCode: 'crmchangestatusactivity',
					sort: 900,
				),
				new NodeAction(
					activityCode: 'crmcopydynamicactivity',
					sort: 1000,
				),
				new NodeAction(
					activityCode: 'crmgenerateentitydocumentactivity',
					sort: 1050,
				),
				new NodeAction(
					activityCode: 'crmaddproductrow',
					sort: 1100,
				),
				new NodeAction(
					activityCode: 'crmremoveproductrow',
					sort: 1200,
				),
				new NodeAction(
					activityCode: 'deletedocumentactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_DYNAMIC_DESCRIPTION_NODE_ACTION_DELETE_DEAL'),
					sort: 1300,
				),
			),
		),
	)
	->toArray()
;