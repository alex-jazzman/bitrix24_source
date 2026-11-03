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
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityNodeType;
use Bitrix\Bizproc\Activity\Enum\ActivityType;
use Bitrix\Main\Localization\Loc;
use Bitrix\Ui\Public\Enum\IconSet\Outline;
use Bitrix\Bizproc\Activity\Dto\Complex\BlockAvailability;
use Bitrix\Bizproc\Activity\Dto\Complex\Settings;
use Bitrix\Bizproc\Activity\Dto\Complex\NodeActionDictionary;
use Bitrix\Bizproc\Activity\Dto\Complex\NodeAction;

$relationActionArgs = [];
$availableBlocksArgs = [];
$additionalResult = ['FilterReturnPropertiesMap'];
if (property_exists(Settings::class, 'relationAction'))
{
	$relationActionArgs['relationAction'] = new NodeAction(
		activityCode: 'crmgetrelationdataactivity',
	);
	$additionalResult[] = 'RelationReturnPropertiesMap';
	if (method_exists(BlockAvailability::class, 'legacyDefault'))
	{
		$availableBlocksArgs['availableBlocks'] = BlockAvailability::legacyDefault(filter: true, relations: true);
	}
}
elseif (method_exists(BlockAvailability::class, 'legacyDefault'))
{
	$availableBlocksArgs['availableBlocks'] = BlockAvailability::legacyDefault(filter: true, relations: false);
}

$arActivityDescription = (new ActivityDescription(
	name: Loc::GetMessage('CRM_COMPLEX_ACTIVITY_SMART_INVOICE_NAME') ?? '',
	description: Loc::GetMessage('CRM_COMPLEX_ACTIVITY_SMART_INVOICE_DESCRIPTION_1') ?? '',
	type: [ActivityType::NODE->value],
))
	->setClass('CrmSmartInvoiceComplexActivity')
	->setNodeType(ActivityNodeType::COMPLEX->value)
	->setExcluded(
		(bool)\Bitrix\Main\Config\Option::get('bizproc', 'complex_activity_excluded', 1), // temporary, remove when ready
	)
	->setIcon(Outline::INVOICE->name)
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->setGroups([
		ActivityGroup::SALES_CRM->value,
		ActivityGroup::PAYMENT->value,
	])
	->setComplexActivitySettings(
		new Settings(
			...$relationActionArgs,
			...$availableBlocksArgs,
			actionDictionary: new NodeActionDictionary(
				new NodeAction(
					activityCode: 'crmcreatesmartinvoiceactivity',
					sort: 100,
				),
				new NodeAction(
					activityCode: 'crmcreatetodoactivity',
					sort: 125,
				),
				new NodeAction(
					activityCode: 'setfieldactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_SMART_INVOICE_DESCRIPTION_NODE_ACTION_CHANGE'),
					sort: 200,
				),
				new NodeAction(
					activityCode: 'crmsetcompanyfield',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_SMART_INVOICE_DESCRIPTION_NODE_ACTION_SET_COMPANY'),
					sort: 300,
				),
				new NodeAction(
					activityCode: 'crmsetcontactfield',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_SMART_INVOICE_DESCRIPTION_NODE_ACTION_SET_CONTACT'),
					sort: 400,
				),
				new NodeAction(
					activityCode: 'crmsetobserverfield',
					sort: 500,
				),
				new NodeAction(
					activityCode: 'crmchangeresponsibleactivity',
					sort: 600,
				),
				new NodeAction(
					activityCode: 'crmchangerequisiteactivity',
					sort: 700,
				),
				new NodeAction(
					activityCode: 'crmcreaterequisiteactivity',
					sort: 750,
				),
				new NodeAction(
					activityCode: 'crmchangestatusactivity',
					sort: 800,
				),
				new NodeAction(
					activityCode: 'crmgenerateentitydocumentactivity',
					sort: 850,
				),
				new NodeAction(
					activityCode: 'crmtimelinecommentadd',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_SMART_INVOICE_DESCRIPTION_NODE_ACTION_ADD_COMMENT'),
					sort: 851,
				),
				new NodeAction(
					activityCode: 'crmaddproductrow',
					sort: 900,
				),
				new NodeAction(
					activityCode: 'crmgetproductrowactivity',
					sort: 950,
				),
				new NodeAction(
					activityCode: 'crmremoveproductrow',
					sort: 1000,
				),
				new NodeAction(
					activityCode: 'deletedocumentactivity',
					customName: Loc::getMessage('CRM_COMPLEX_ACTIVITY_SMART_INVOICE_DESCRIPTION_NODE_ACTION_DELETE'),
					sort: 1100,
				),
			),
		),
	)
	->setAdditionalResult($additionalResult)
	->set('PROPERTIES', ['BaseSettingsAction' => 'setfieldactivity'])
	->toArray()
;
