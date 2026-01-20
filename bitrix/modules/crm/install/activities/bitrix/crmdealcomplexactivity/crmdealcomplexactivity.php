<?php

declare(strict_types=1);

use Bitrix\Bizproc\Internal\Entity\Activity\Interface\FixedDocumentComplexActivity;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!class_exists(\Bitrix\Bizproc\Public\Activity\BaseComplexActivity::class))
{
	return;
}

$runtime = CBPRuntime::GetRuntime();

/** @property-write string|null ErrorMessage */
class CBPCrmDealComplexActivity extends \Bitrix\Bizproc\Public\Activity\BaseComplexActivity
	implements FixedDocumentComplexActivity
{
	public static function getPropertiesDialogValues(
		$documentType,
		$activityName,
		&$workflowTemplate,
		&$workflowParameters,
		&$workflowVariables,
		$currentValues,
		&$errors
	): bool
	{
		// todo: realize logic, it is just an example

		$currentActivity = &\CBPWorkflowTemplateLoader::findActivityByName($workflowTemplate, $activityName);
		$currentActivity['Properties'] = [
			self::PARAM_LINKS => [],
			self::INPUT_ACTIVITY_NAMES => [],
			self::OUTPUT_ACTIVITY_NAMES => [],
		];

		return true;
	}

	public static function getDocumentTypeForNodeAction(): array
	{
		return CCrmBizProcHelper::ResolveDocumentType(CCrmOwnerType::Deal);
	}
}
