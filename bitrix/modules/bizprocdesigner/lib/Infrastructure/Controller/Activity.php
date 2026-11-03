<?php

declare(strict_types=1);

namespace Bitrix\BizprocDesigner\Infrastructure\Controller;

use Bitrix\Bizproc\Internal\Service\Container;
use Bitrix\Bizproc\Public\Activity\ActivityControlsBuilder;
use Bitrix\Bizproc\Public\Activity\ActivityControlsProjectContext;
use Bitrix\Bizproc\Public\Activity\Interface\NodeFilterMetadataProvider;
use Bitrix\Bizproc\Public\Service\TemplateAccessService;
use Bitrix\Bizproc\Workflow\Template\Entity\WorkflowTemplateTable;
use Bitrix\Bizproc\Workflow\Template\WorkflowTemplateDraftTable;
use Bitrix\BizprocDesigner\Internal\Trait\ActivitySettingsDecoder;
use Bitrix\BizprocDesigner\Public\Command;
use Bitrix\BizprocDesigner\Public\Document\DocumentFieldsResolver;
use Bitrix\BizprocDesigner\Public\Service\Activity\TriggerUpgradeResolver;
use Bitrix\Main\Engine\ActionFilter\Attribute\Rule\CloseSession;
use Bitrix\Main\Engine\JsonController;
use Bitrix\Main\Loader;
use Bitrix\Bizproc\Api\Enum\ErrorMessage;

class Activity extends JsonController
{
	use ActivitySettingsDecoder;

	private ?TemplateAccessService $accessService = null;

	protected function init()
	{
		parent::init();
		Loader::requireModule('bizproc');
	}

	#[CloseSession]
	public function getNodeFilterMetadataAction(
		string $activityType,
		array $documentType = [],
		bool $onlyDynamicEntities = false,
		bool $includeRelatedEntityTypes = false,
		?string $contextActivityType = null,
	): ?array
	{
		$user = new \CBPWorkflowTemplateUser(\CBPWorkflowTemplateUser::CurrentUser);
		$canWrite = \CBPDocument::CanUserOperateDocumentType(
			\CBPCanUserOperateOperation::CreateWorkflow,
			$user->getId(),
			$documentType,
		);
		if (!$canWrite)
		{
			$this->errorCollection->setError(ErrorMessage::ACCESS_DENIED->getError());

			return null;
		}

		if (!Container::instance()->getActivitySearcherService()->includeActivityFile($activityType))
		{
			$this->errorCollection->setError(ErrorMessage::ACTIVITY_NOT_FOUND->getError());

			return null;
		}

		$className = 'CBP' . $activityType;
		if (!is_a($className, NodeFilterMetadataProvider::class, true))
		{
			$this->errorCollection->setError(ErrorMessage::ACTIVITY_NOT_FOUND->getError());

			return null;
		}

		$metadata = self::requestNodeFilterMetadata(
			$className,
			$documentType,
			$onlyDynamicEntities,
			$includeRelatedEntityTypes,
			$contextActivityType,
		);

		return [
			'entityTypeOptions' => $metadata['entityTypeOptions'] ?? [],
			'filterFieldsMap' => $metadata['filterFieldsMap'] ?? [],
			'documentTypeMap' => $metadata['documentTypeMap'] ?? [],
			// Optional part of the provider contract: an implementation that names no badge for its
			// types answers the same as before, and the client reads the absence as an empty map.
			'entityTypeBadges' => $metadata['entityTypeBadges'] ?? [],
		];
	}

	private static function requestNodeFilterMetadata(
		string $className,
		array $documentType,
		bool $onlyDynamicEntities,
		bool $includeRelatedEntityTypes,
		?string $contextActivityType,
	): array
	{
		$parametersCount = (new \ReflectionMethod($className, 'getNodeFilterMetadata'))->getNumberOfParameters();
		if ($parametersCount >= 4)
		{
			return $className::getNodeFilterMetadata(
				$documentType,
				$onlyDynamicEntities,
				$includeRelatedEntityTypes,
				$contextActivityType,
			);
		}

		if ($parametersCount >= 3)
		{
			return $className::getNodeFilterMetadata(
				$documentType,
				$onlyDynamicEntities,
				$includeRelatedEntityTypes,
			);
		}

		return $className::getNodeFilterMetadata($documentType, $onlyDynamicEntities);
	}

	public function getSettingsControlsAction(
		array $documentType,
		array $activity,
		array $workflow = [],
		array $options = [],
	): ?array
	{
		// Same object authorization as the sibling actions: the client-supplied documentType reaches
		// getPropertiesMap(), whose controls expose document metadata (categories, stages) in Options.
		$user = new \CBPWorkflowTemplateUser(\CBPWorkflowTemplateUser::CurrentUser);
		$canWrite = \CBPDocument::CanUserOperateDocumentType(
			\CBPCanUserOperateOperation::CreateWorkflow,
			$user->getId(),
			$documentType,
		);
		if (!$canWrite)
		{
			$this->errorCollection->setError(ErrorMessage::ACCESS_DENIED->getError());

			return null;
		}

		$brokenLinks = [];
		$activityName = (string)($activity['Name'] ?? '');
		$hideEditorComment = (bool)($options['hideEditorComment'] ?? false);
		[
			'template' => $workflowTemplate,
			'parameters' => $workflowParameters,
			'variables' => $workflowVariables,
			'constants' => $workflowConstants,
		] = $this->decodeActivitySettings($workflow, $documentType);

		$activity = $this->applyTriggerUpgrade($activity, $documentType);

		$description = Container::instance()->getActivitySearcherService()->searchByCode($activity['Type']);
		$result = [
			'brokenLinks' => $brokenLinks,
			'controls' => null,
			'useDocumentContext' => $description?->getFilter() !== null,
		];
		$configurator = \CBPActivity::createConfigurator(
			$activity['Type'],
			$activity['Properties'],
			$documentType,
			['Template' => $workflowTemplate],
		);


		if (!$configurator->getActivityType())
		{
			return $result;
		}

		$propertiesMap = $configurator->getPropertiesMap();

		if ($activityName && $workflowTemplate)
		{
			$documentFieldsResolver = new DocumentFieldsResolver();

			$analyzer =
				(new \Bitrix\Bizproc\Public\Service\Template\ActivityUsageAnalyzer($workflowTemplate))
					->setParameters($workflowParameters)
					->setVariables($workflowVariables)
					->setConstants($workflowConstants)
					->setGlobalConstants(\Bitrix\Bizproc\Workflow\Type\GlobalConst::getAll($documentType))
					->setGlobalVariables(\Bitrix\Bizproc\Workflow\Type\GlobalVar::getAll($documentType))
					->setDocumentFields($documentFieldsResolver->getFields($documentType))
					->setReturnDocumentFieldsResolver($documentFieldsResolver->getFields(...))
			;
			$brokenLinks = $analyzer->analyzeUsages($activityName);
		}

		$trustedProjectContext = [
			'properties' => [],
			'constants' => [],
		];
		if (ActivityControlsBuilder::hasProjectControls($propertiesMap))
		{
			$trustedProjectContext = $this->loadTrustedProjectContext(
				$options,
				$activityName,
				$documentType,
				(int)$user->getId(),
			);
		}

		$controlsBuilder = new ActivityControlsBuilder(
			$configurator,
			$activity,
			new ActivityControlsProjectContext(
				userId: (int)$user->getId(),
				workflowConstants: $trustedProjectContext['constants'],
				trustedPropertyValues: $trustedProjectContext['properties'],
			),
		);
		$controls = $controlsBuilder->build();

		if ($hideEditorComment)
		{
			$controls = array_values(array_filter(
				$controls,
				static fn($control) => ($control->toArray()['property']['FieldName'] ?? '') !== 'activity_editor_comment',
			));
		}

		$result['controls'] = $controls;
		$result['brokenLinks'] = $brokenLinks;

		return $result;
	}

	public function saveSettingsAction(): ?array
	{
		$user = new \CBPWorkflowTemplateUser(\CBPWorkflowTemplateUser::CurrentUser);

		$json = $this->getRequest()->getJsonList();
		$currentRequest = $json->toArray();
		$documentType = (array)$currentRequest['documentType'];
		$canWrite = \CBPDocument::CanUserOperateDocumentType(
			\CBPCanUserOperateOperation::CreateWorkflow,
			$user->getId(),
			$documentType
		);

		if (!$canWrite)
		{
			$this->errorCollection->setError(ErrorMessage::ACCESS_DENIED->getError());

			return null;
		}

		$activityName = (string)($currentRequest['id'] ?? $currentRequest['activity_id'] ?? '');
		$isActivated = $currentRequest['activated'] ?? 'Y';

		[
			'template' => $workflowTemplate,
			'parameters' => $workflowParameters,
			'variables' => $workflowVariables,
			'constants' => $workflowConstants,
			'properties' => $activityProperties,
		] = $this->decodeActivitySettings($currentRequest, $documentType);

		/** @var Command\Activity\Settings\SaveCommandResult $result */
		$result =
			(new Command\Activity\Settings\SaveCommand(
				new Command\Activity\Settings\SaveCommandDto(
					activity: new Command\Activity\Settings\SaveCommandActivityDto(
						type: (string)($currentRequest['activityType'] ?? ''),
						name: $activityName,
						properties: $activityProperties,
						title: \CBPHelper::stringify($activityProperties['title'] ?? ''),
						editorComment: \CBPHelper::stringify($currentRequest['activity_editor_comment'] ?? ''),
						isActivated: ($isActivated === 'Y'),
					),
					documentType: $documentType,
					template: $workflowTemplate,
					variables: $workflowVariables,
					parameters: $workflowParameters,
					constants: $workflowConstants,
				)
			))
				->run()
		;

		if (!$result->isSuccess())
		{
			$this->addErrors($result->getErrors());

			return null;
		}

		return $result->getSettings()?->toArray();
	}

	/**
	 * The settings form of a node saved with a deprecated trigger class is built from the class that
	 * replaces it, otherwise the owner of such a node would not see the controls the new class added and
	 * could only re-save it blindly. Nothing is written into the template here: the type of the node changes
	 * on save (see {@see \Bitrix\BizprocDesigner\Public\Command\Activity\Settings\SaveCommandHandler}).
	 */
	private function applyTriggerUpgrade(array $activity, array $documentType): array
	{
		$properties = is_array($activity['Properties'] ?? null) ? $activity['Properties'] : [];

		$upgradeResolver = new TriggerUpgradeResolver();
		$upgrade = $upgradeResolver->resolveUpgradedType(
			(string)($activity['Type'] ?? ''),
			$upgradeResolver->resolveNodeDocumentType([$properties['Document'] ?? null], $documentType),
		);

		$activity['Type'] = $upgrade['type'];
		$activity['Properties'] = $upgradeResolver->applyUpgradeProperties($properties, $upgrade['properties']);

		return $activity;
	}

	protected function accessService(): TemplateAccessService
	{
		return $this->accessService ??= new TemplateAccessService();
	}

	private function loadTrustedProjectContext(
		array $options,
		string $activityName,
		array $documentType,
		int $userId,
	): array
	{
		$emptyContext = [
			'properties' => [],
			'constants' => [],
		];
		$templateId = (int)($options['templateId'] ?? 0);
		if ($templateId <= 0 || $activityName === '')
		{
			return $emptyContext;
		}

		$templateData = $this->loadTrustedTemplateData(
			$templateId,
			(int)($options['draftId'] ?? 0),
			$documentType,
			$userId,
		);
		$template = $templateData['TEMPLATE'] ?? null;
		if (!is_array($template))
		{
			return $emptyContext;
		}

		$activity = \CBPWorkflowTemplateLoader::findActivityByName($template, $activityName);
		if (!is_array($activity))
		{
			return $emptyContext;
		}

		return [
			'properties' => is_array($activity['Properties'] ?? null) ? $activity['Properties'] : [],
			'constants' => is_array($templateData['CONSTANTS'] ?? null) ? $templateData['CONSTANTS'] : [],
		];
	}

	private function loadTrustedTemplateData(int $templateId, int $draftId, array $documentType, int $userId): array
	{
		if (!$this->accessService()->canEdit($templateId, $userId, $documentType))
		{
			return [];
		}

		if ($draftId > 0)
		{
			$metadata = $this->loadTemplateMetadata($templateId);
			if (!is_array($metadata) || !$this->isSameDocumentType($metadata, $documentType))
			{
				return [];
			}

			$templateData = $this->loadDraftTemplateData($templateId, $draftId);
			if ($templateData !== [])
			{
				return $templateData;
			}
		}

		$row = WorkflowTemplateTable::query()
			->where('ID', $templateId)
			->whereNull('SYSTEM_CODE')
			->setSelect(['MODULE_ID', 'ENTITY', 'DOCUMENT_TYPE', 'TEMPLATE', 'CONSTANTS'])
			->setLimit(1)
			->fetch()
		;

		if (!is_array($row) || !$this->isSameDocumentType($row, $documentType))
		{
			return [];
		}

		return $row;
	}

	private function loadTemplateMetadata(int $templateId): array|false
	{
		return WorkflowTemplateTable::query()
			->where('ID', $templateId)
			->whereNull('SYSTEM_CODE')
			->setSelect(['MODULE_ID', 'ENTITY', 'DOCUMENT_TYPE'])
			->setLimit(1)
			->fetch()
		;
	}

	private function loadDraftTemplateData(int $templateId, int $draftId): array
	{
		if ($draftId <= 0)
		{
			return [];
		}

		$row = WorkflowTemplateDraftTable::query()
			->where('ID', $draftId)
			->where('TEMPLATE_ID', $templateId)
			->setSelect(['TEMPLATE_DATA'])
			->setLimit(1)
			->fetch()
		;

		return is_array($row['TEMPLATE_DATA'] ?? null) ? $row['TEMPLATE_DATA'] : [];
	}

	private function isSameDocumentType(array $templateRow, array $documentType): bool
	{
		return (string)($templateRow['MODULE_ID'] ?? '') === (string)($documentType[0] ?? '')
			&& (string)($templateRow['ENTITY'] ?? '') === (string)($documentType[1] ?? '')
			&& (string)($templateRow['DOCUMENT_TYPE'] ?? '') === (string)($documentType[2] ?? '')
		;
	}
}
