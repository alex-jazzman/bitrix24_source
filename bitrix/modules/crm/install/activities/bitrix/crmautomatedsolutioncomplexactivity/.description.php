<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!class_exists(\Bitrix\Bizproc\Activity\Dto\Complex\Settings::class))
{
	return;
}

if (!\Bitrix\Main\Loader::includeModule('crm'))
{
	return;
}

use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Crm\Integration\BizProc\Activity\DynamicComplexActivityDescription;
use Bitrix\Main\Localization\Loc;

$arActivityDescription = DynamicComplexActivityDescription::create(
	name: Loc::getMessage('CRM_COMPLEX_ACTIVITY_AUTOMATED_SOLUTION_NAME') ?? '',
	description: Loc::getMessage('CRM_COMPLEX_ACTIVITY_AUTOMATED_SOLUTION_DESCRIPTION') ?? '',
	class: 'CrmAutomatedSolutionComplexActivity',
	groups: [ActivityGroup::DIGITAL_WORKPLACE->value],
	actionNames: [
		'change' => Loc::getMessage('CRM_COMPLEX_ACTIVITY_AUTOMATED_SOLUTION_NODE_ACTION_CHANGE'),
		'changeCompany' => Loc::getMessage('CRM_COMPLEX_ACTIVITY_AUTOMATED_SOLUTION_NODE_ACTION_CHANGE_COMPANY'),
		'changeContact' => Loc::getMessage('CRM_COMPLEX_ACTIVITY_AUTOMATED_SOLUTION_NODE_ACTION_CHANGE_CONTACT'),
		'delete' => Loc::getMessage('CRM_COMPLEX_ACTIVITY_AUTOMATED_SOLUTION_NODE_ACTION_DELETE'),
		'addComment' => Loc::getMessage('CRM_COMPLEX_ACTIVITY_AUTOMATED_SOLUTION_NODE_ACTION_ADD_COMMENT'),
	],
	createDynamicActivityPresetId: 'dynamicAutomatedSolution',
	relationsEnabled: true,
);
