<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!class_exists(\Bitrix\Bizproc\Activity\Dto\Complex\Settings::class))
{
	return;
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Dto\Complex\BlockAvailability;
use Bitrix\Bizproc\Activity\Dto\Complex\NodeAction;
use Bitrix\Bizproc\Activity\Dto\Complex\NodeActionDictionary;
use Bitrix\Bizproc\Activity\Dto\Complex\Settings;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;

// Filter is offered because the node publishes FilterReturnPropertiesMap; relations needs a
// declared relationAction, which this node has none of. Everything else stays on the default.
// Older bizproc versions have no BlockAvailability::legacyDefault().
$availableBlocksArgs = [];
if (method_exists(BlockAvailability::class, 'legacyDefault'))
{
	$availableBlocksArgs['availableBlocks'] = BlockAvailability::legacyDefault(filter: true, relations: false);
}

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
			...$availableBlocksArgs,
			actionDictionary: new NodeActionDictionary(
				new NodeAction(
					activityCode: 'createcrmcompanydocumentactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_COMPANY_DESCRIPTION_NODE_ACTION_CREATE_COMPANY'),
					sort: 100,
				),
				new NodeAction(
					activityCode: 'crmcreatetodoactivity',
					sort: 125,
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
					activityCode: 'crmtimelinecommentadd',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_COMPANY_DESCRIPTION_NODE_ACTION_ADD_COMMENT'),
					sort: 551,
				),
				new NodeAction(
					activityCode: 'deletedocumentactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_COMPANY_DESCRIPTION_NODE_ACTION_DELETE_COMPANY'),
					sort: 600,
				),
			),
		),
	)
	->setAdditionalResult(['FilterReturnPropertiesMap'])
	->toArray()
;
