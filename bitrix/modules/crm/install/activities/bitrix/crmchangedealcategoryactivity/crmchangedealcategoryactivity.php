<?php

use Bitrix\Bizproc\Activity\Mixins\TargetDocumentResolverTrait;
use Bitrix\Bizproc\WorkflowInstanceTable;
use Bitrix\Crm;
use Bitrix\Crm\Integration\Analytics\Dictionary;
use Bitrix\Bizproc\Activity\Mixins\ChecksResolvedTargetAccessTrait;
use Bitrix\Main\Localization\Loc;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPCrmChangeDealCategoryActivity extends CBPActivity
{
	use TargetDocumentResolverTrait;
	use ChecksResolvedTargetAccessTrait;

	private static $cycleCounter = [];
	const CYCLE_LIMIT = 3;

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			'Title' => '',
			'CategoryId' => 0,
			'StageId' => null,
		];
	}

	/**
	 * USER_ID is always passed: without it MoveToCategory takes the ambient context user with no
	 * scope check and, when there is none, writes no MODIFY_BY_ID at all - after which the author
	 * of the timeline comes from the entity fields and ends up being the deal responsible.
	 */
	protected function buildMoveOptions(): array
	{
		return [
			'ENABLE_WORKFLOW_CHECK' => false,
			'PREFERRED_STAGE_ID' => CBPHelper::stringify($this->StageId),
			'USER_ID' => $this->resolveAuthorId(),
		];
	}

	protected function resolveAuthorId(): int
	{
		$starterId = $this->resolveStarterId();

		return $starterId > 0 ? $starterId : $this->resolveAuthorFromContext();
	}

	/**
	 * The acting person, or 0 when there is none. Unlike resolveAuthorId() it never falls back to
	 * the system user: whoever passes this on as the automation initiator has to be able to say
	 * "nobody", or the next link of the chain loses its own chance to resolve a live user.
	 */
	protected function resolveInitiatorId(): int
	{
		$starterId = $this->resolveStarterId();

		return $starterId > 0 ? $starterId : $this->resolveInitiatorFromContext();
	}

	protected function resolveStarterId(): int
	{
		// Attribute the move to the workflow starter when no explicit ModifiedBy. method_exists
		// guards bizproc shipping the method (26.1500.0) later than the trait above (26.1100.0).
		$modifiedBy = method_exists($this, 'getModifiedByOrStarter')
			? $this->getModifiedByOrStarter()
			: $this->ModifiedBy
		;

		// Stringified first: stripUserPrefix() keeps a list a list, and casting one to int gives 1.
		return (int)CBPHelper::stripUserPrefix(CBPHelper::stringify($modifiedBy));
	}

	protected function resolveAuthorFromContext(): int
	{
		$initiatorId = $this->resolveInitiatorFromContext();

		return $initiatorId > 0 ? $initiatorId : Crm\Service\SystemUser::getDefaultAuthorId();
	}

	protected function resolveInitiatorFromContext(): int
	{
		$context = Crm\Service\Container::getInstance()->getContext();

		$explicitUserId = (int)($context->getExplicitUserId() ?? 0);
		if ($explicitUserId > 0)
		{
			return $explicitUserId;
		}

		if (!$context->isNonInteractiveScope())
		{
			return $context->getUserId();
		}

		return 0;
	}

	public function Execute()
	{
		if (!CModule::IncludeModule('crm'))
		{
			return CBPActivityExecutionStatus::Closed;
		}

		$this->logDebug();

		$documentId = $this->resolveTargetDocumentId();
		//check deal only.
		if (!CBPHelper::isEqualDocumentEntity($documentId, ['crm', 'CCrmDocumentDeal']))
		{
			return CBPActivityExecutionStatus::Closed;
		}

		if (!$this->canUpdateResolvedTarget($documentId))
		{
			$this->logResolvedTargetAccessDenied();

			return CBPActivityExecutionStatus::Closed;
		}

		$this->checkCycling($documentId);

		$sourceDealId = explode('_', $documentId[2])[1];
		$sourceFields = [];

		if ($sourceDealId > 0)
		{
			$dbResult = \CCrmDeal::GetListEx(
				[],
				['=ID' => $sourceDealId, 'CHECK_PERMISSIONS' => 'N'],
				false,
				false,
				['ID', 'ASSIGNED_BY_ID', 'STAGE_ID', 'CATEGORY_ID']
			);
			$sourceFields = $dbResult->Fetch();
		}

		if (!$sourceFields)
		{
			$this->trackError(Loc::getMessage('CRM_CDCA_NO_SOURCE_FIELDS'));

			return CBPActivityExecutionStatus::Closed;
		}

		$moveOptions = $this->buildMoveOptions();

		$resultError = \CCrmDeal::MoveToCategory(
			$sourceDealId,
			(int)$this->CategoryId,
			$moveOptions
		);

			if ($resultError === Crm\Category\DealCategoryChangeError::NONE)
			{
				$documentType = $this->resolveTargetDocumentType($documentId);
				\CCrmBizProcHelper::sendOperationsAnalytics(
					Dictionary::EVENT_ENTITY_EDIT,
					$this,
					$documentType[2] ?? '',
			);

			$this->terminateDocumentWorkflows($documentId);

			//Fake document update for clearing document cache
			/** @var CBPDocumentService $ds */
			$ds = $this->workflow->GetService('DocumentService');
			$ds->UpdateDocument($documentId, []);

			$dbResult = \CCrmDeal::GetListEx(
				[],
				['=ID' => $sourceDealId, 'CHECK_PERMISSIONS' => 'N'],
				false,
				false,
				['ID', 'ASSIGNED_BY_ID', 'STAGE_ID', 'CATEGORY_ID']
			);
			$newFields = $dbResult->Fetch();

			if ($newFields)
			{
				//Region automation
				$starter = new \Bitrix\Crm\Automation\Starter(\CCrmOwnerType::Deal, $sourceDealId);
				$starter->setContextToBizproc();
				// Carry the acting person into the target funnel: without an initiator the next
				// robot of the chain writes history under the responsible user again.
				$initiatorId = $this->resolveInitiatorId();
				if ($initiatorId > 0)
				{
					$starter->setUserId($initiatorId);
				}
				$starter->runOnUpdate($newFields, $sourceFields);
				//End region
			}

			return CBPActivityExecutionStatus::Closed;
		}

		$this->trackError($this->resolveMoveCategoryErrorText($resultError));

		return CBPActivityExecutionStatus::Closed;
	}

	private function terminateDocumentWorkflows(array $documentId): void
	{
		$instanceIds = \CCrmBizProcHelper::getDocumentNotNodesInstanceIds($documentId);

		$errors = [];
		foreach ($instanceIds as $instanceId)
		{
			\CBPDocument::TerminateWorkflow(
				$instanceId,
				$documentId,
				$errors,
				Loc::getMessage('CRM_CDCA_MOVE_TERMINATION_TITLE')
			);
		}
	}

	private function logDebug()
	{
		if ($this->workflow->isDebug())
		{
			$this->writeDebugInfo($this->getDebugInfo([
				'StageId' => Crm\Category\DealCategory::getStageName($this->StageId),
			]));
		}
	}

	private function checkCycling(array $documentId)
	{
		$key = $this->GetName();
		$documentIdKey = implode('@', $documentId);

		if (!isset(self::$cycleCounter[$key][$documentIdKey]))
		{
			self::$cycleCounter[$key][$documentIdKey] = 0;
		}

		self::$cycleCounter[$key][$documentIdKey]++;
		if (self::$cycleCounter[$key][$documentIdKey] > self::CYCLE_LIMIT)
		{
			$this->WriteToTrackingService(
				Loc::getMessage("CRM_CDCA_CYCLING_ERROR"),
				0,
				CBPTrackingType::Error
			);

			throw new Exception(Loc::getMessage('CRM_CDCA_CYCLING_EXCEPTION_MESSAGE'));
		}

		return true;
	}

	public static function ValidateProperties($arTestProperties = [], CBPWorkflowTemplateUser $user = null)
	{
		$errors = [];

		if ($arTestProperties["CategoryId"] === null || $arTestProperties["CategoryId"] === '')
		{
			$errors[] = ["code" => "NotExist", "parameter" => "CategoryId", "message" => Loc::getMessage("CRM_CDCA_EMPTY_CATEGORY")];
		}

		return array_merge($errors, parent::ValidateProperties($arTestProperties, $user));
	}

	public static function GetPropertiesDialog($documentType, $activityName, $arWorkflowTemplate, $arWorkflowParameters, $arWorkflowVariables, $arCurrentValues = null, $formName = '', $popupWindow = null, $siteId = '')
	{
		if (!CModule::IncludeModule("crm"))
		{
			return '';
		}

		$dialog = new \Bitrix\Bizproc\Activity\PropertiesDialog(__FILE__, [
			'documentType' => $documentType,
			'activityName' => $activityName,
			'workflowTemplate' => $arWorkflowTemplate,
			'workflowParameters' => $arWorkflowParameters,
			'workflowVariables' => $arWorkflowVariables,
			'currentValues' => $arCurrentValues,
			'formName' => $formName,
			'siteId' => $siteId,
		]);

		$dialog->setMap(static::getPropertiesDialogMap());

		return $dialog;
	}

	public static function GetPropertiesDialogValues($documentType, $activityName, &$arWorkflowTemplate, &$arWorkflowParameters, &$arWorkflowVariables, $arCurrentValues, &$errors)
	{
		$arProperties = ['CategoryId' => $arCurrentValues['category_id']];

		if ($arProperties['CategoryId'] === '' && static::isExpression($arCurrentValues['category_id_text']))
		{
			$arProperties['CategoryId'] = $arCurrentValues['category_id_text'];
		}

		$documentService = CBPRuntime::GetRuntime(true)->getDocumentService();
		$field = $documentService->getFieldTypeObject($documentType, static::getPropertiesDialogMap()['StageId']);
		if ($field)
		{
			$arProperties['StageId'] = $field->extractValue(
				['Field' => 'stage_id'],
				$arCurrentValues,
				$errors
			);
		}

		$errors = self::ValidateProperties($arProperties, new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser));
		if (count($errors) > 0)
		{
			return false;
		}

		$arCurrentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
		$arCurrentActivity["Properties"] = $arProperties;

		return true;
	}

	protected static function getPropertiesDialogMap(): array
	{
		return [
			'CategoryId' => [
				'Name' => Loc::getMessage('CRM_CDCA_CATEGORY'),
				'FieldName' => 'category_id',
				'Type' => 'deal_category',
				'Required' => true,
				'AiDescription' => 'ID of the category to which the deal will be moved',
			],
			'StageId' => [
				'Name' => Loc::getMessage('CRM_CDCA_STAGE'),
				'FieldName' => 'stage_id',
				'Type' => 'deal_stage',
				'AiDescription' => 'The stage ID to which the deal will be moved, for a category other than the default category, the category name is included in the stage name',
			],
		];
	}

	protected static function getPropertiesMap(array $documentType, array $context = []): array
	{
		$map = static::getPropertiesDialogMap();
		$map['StageId']['Type'] = \Bitrix\Bizproc\FieldType::STRING;

		return $map;
	}

	private function resolveMoveCategoryErrorText($errorCode)
	{
		switch ($errorCode)
		{
			case Crm\Category\DealCategoryChangeError::CATEGORY_NOT_FOUND:
			{
				$text = Loc::getMessage('CRM_CDCA_MOVE_ERROR_CATEGORY_NOT_FOUND');
				break;
			}
			case Crm\Category\DealCategoryChangeError::CATEGORY_NOT_CHANGED:
			{
				$text = Loc::getMessage('CRM_CDCA_MOVE_ERROR_CATEGORY_NOT_CHANGED');
				break;
			}
			case Crm\Category\DealCategoryChangeError::RESPONSIBLE_NOT_FOUND:
			{
				$text = Loc::getMessage('CRM_CDCA_MOVE_ERROR_RESPONSIBLE_NOT_FOUND');
				break;
			}
			case Crm\Category\DealCategoryChangeError::STAGE_NOT_FOUND:
			{
				$text = Loc::getMessage('CRM_CDCA_MOVE_ERROR_STAGE_NOT_FOUND');
				break;
			}
			case Crm\Category\DealCategoryChangeError::RESTRICTION_APPLIED:
			{
				$text = Crm\Restriction\RestrictionManager::getWebFormResultsRestriction()->getErrorMessage();
				break;
			}

			default:
			{
				$text = Loc::getMessage('CRM_CDCA_MOVE_ERROR', ['#ERROR_CODE#' => $errorCode]);
			}
		}

		return $text;
	}
}
