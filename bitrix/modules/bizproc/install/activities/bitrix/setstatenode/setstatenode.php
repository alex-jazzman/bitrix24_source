<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main\Localization\Loc;

class CBPSetStateNode extends CBPActivity implements IBPConfigurableActivity
{
	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			"Title" => "",
			"TargetStateName" => "",
			'CancelCurrentState' => 'N'
		];
	}

	public function execute()
	{
		$rootNode = $this->getRootActivity();
		if (!($rootNode instanceof CBPNodeWorkflowActivity))
		{
			return CBPActivityExecutionStatus::Closed;
		}

		$targetState = (string)$this->TargetStateName;
		$rootNode->setNextState($targetState);

		if ($this->CancelCurrentState == 'Y')
		{
			$this->writeToTrackingService(GetMessage("BPSSA_EXECUTE_CANCEL"));

			return CBPActivityExecutionStatus::Cancelled;
		}

		return CBPActivityExecutionStatus::Closed;
	}

	public static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			'TargetStateName' => [
				'Name' => Loc::getMessage('BPSFA_PD_STATE'),
				'FieldName' => 'target_state_name',
				'Type' => \Bitrix\Bizproc\FieldType::CUSTOM,
				'CustomType' => 'stateSelector',
				'Required' => true,
				'AllowSelection' => true,
			],
			'CancelCurrentState' => [
				'Name' => Loc::getMessage('BPSSA_CANCEL_CURRENT_STATE'),
				'FieldName' => 'cancel_current_state',
				'Type' => \Bitrix\Bizproc\FieldType::BOOL,
				'Required' => false,
				'AllowSelection' => false,
			],
		];
	}

	public static function validateProperties($arTestProperties = [], CBPWorkflowTemplateUser $user = null)
	{
		$arErrors = [];

		if (empty($arTestProperties["TargetStateName"]))
		{
			$arErrors[] = [
				"code" => "emptyState",
				"parameter" => "TargetStateName",
				"message" => GetMessage('BPSSA_ERROR_EMPTY_STATE')
			];
		}

		return array_merge($arErrors, parent::validateProperties($arTestProperties, $user));
	}

	public static function GetPropertiesDialogValues($documentType, $activityName, &$arWorkflowTemplate, &$arWorkflowParameters, &$arWorkflowVariables, $arCurrentValues, &$errors)
	{
		$errors = [];

		$state = $arCurrentValues["target_state_name"] ?? null;
		$cancelCurrentState = (($arCurrentValues['cancel_current_state'] ?? '') === 'Y') ? 'Y' : 'N';
		$arProperties = [
			'TargetStateName' => $state,
			'CancelCurrentState' => $cancelCurrentState
		];

		$errors = self::ValidateProperties($arProperties, new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser));
		if ($errors)
		{
			return false;
		}

		$arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
		$arCurrentActivity["Properties"] = $arProperties;

		return true;
	}
}
