<?php

use Bitrix\Bizproc\Public\Activity\Interface\ActivityContentBlockProviderInterface;
use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\Api\Enum\ErrorMessage;
use Bitrix\Bizproc\Api\Request\WorkflowTemplateService\SetConstantsRequest;
use Bitrix\Bizproc\Api\Response\WorkflowTemplateService\SetConstantsResponse;
use Bitrix\Bizproc\Error;
use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\FileUploader\SetupTemplateUploaderController;
use Bitrix\Bizproc\Integration\Push\PushWorker;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\Block;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\BlockCollection;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\Constant;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\ConstantConfiguration;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\Delimiter;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\DelimiterType;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\Description;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\EntitySelector\SelectorProvider;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\Item;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\ItemCollection;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\ItemType;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\Title;
use Bitrix\Bizproc\Internal\Entity\Activity\SetupTemplateActivity\TitleWithIcon;
use Bitrix\Bizproc\Internal\Event\SetupTemplateCurrentDataEvent;
use Bitrix\Bizproc\Internal\Event\SetupTemplateUserInputEvent;
use Bitrix\Bizproc\Internal\Event\SetupTemplateValidationEvent;
use Bitrix\Bizproc\Internal\Integration\BI\Dashboard\DocumentFieldTypes\BIDashboardType;
use Bitrix\Bizproc\Internal\Integration\Rag\DocumentFieldTypes\RagKnowledgeBaseType;
use Bitrix\Bizproc\Internal\Integration\Tasks\DocumentFieldTypes\ProjectType;
use Bitrix\Bizproc\Internal\Integration\UI\UploaderHelper;
use Bitrix\Bizproc\Internal\Service\DocumentField\AccessValidationService;
use Bitrix\Bizproc\Internal\Service\Pilot\SettingsFreezeGate;
use Bitrix\Bizproc\Internal\Service\SetupTemplate\SetupTemplateConstantsService;
use Bitrix\Bizproc\Workflow\Template\Entity\EO_WorkflowTemplate;
use Bitrix\Bizproc\WorkflowTemplateTable;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\ErrorCollection;
use Bitrix\Main\Event;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Web\Json;
use Bitrix\UI\FileUploader\Uploader;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPSetupTemplateActivity extends CBPActivity implements IBPEventActivity, IBPActivityExternalEventListener, ActivityContentBlockProviderInterface
{
	private const PARAM_BLOCKS = 'blocks';
	private const PARAM_BLOCK_ITEMS = 'items';
	private const PARAM_BLOCK_ITEMS_ITEM_TYPE = 'itemType';
	private const PUSH_COMMAND = 'setupTemplateActivityBlocks';
	private const ERROR_MESSAGE = 'message';
	private const ERROR_CODE = 'code';
	private const ERROR_CONSTANT = 'constant';
	private const ERROR_CODE_NOT_EXIST = 'NotExist';
	private const ERROR_CODE_INVALID_STRUCTURE = 'InvalidStructJson';
	private const ERROR_CODE_UNKNOWN_ITEM_TYPE = 'UnknownItemType';
	private const ERROR_CODE_UNKNOWN_FIELD_TYPE = 'UnknownFieldType';
	private const EXPIRES_IN = 24 * 60 * 60;
	private const CONSTANT_SETTINGS_ENTITYSELECTOR_SELECTOR_ID = 'selectorId';
	private const CONSTANT_SETTINGS_ENTITYSELECTOR_SELECTOR = 'selector';
	private int $subscriptionId = 0;

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			'Title' => '',
			self::PARAM_BLOCKS => null,
		];
	}

	public static function getContentBlock(array $properties, ?\Bitrix\Bizproc\Activity\Dto\ContentBlockContext $context = null): ?\Bitrix\Bizproc\Activity\Dto\ContentBlock
	{
		$constantsCount = count(
			self::extractBlockItemsByType($properties[self::PARAM_BLOCKS] ?? null, ItemType::Constant)
		);
		if ($constantsCount === 0)
		{
			return null;
		}

		return new \Bitrix\Bizproc\Activity\Dto\ContentBlock(
			(string)Loc::getMessage(
				'BIZPROC_SETUP_TEMPLATE_ACTIVITY_CONTENT_BLOCK_CONSTANTS',
				['#count#' => $constantsCount],
			),
		);
	}

	/**
	 * Leniently extracts raw block items of the given type from the blocks property value.
	 *
	 * Unlike validateAndParseBlocks(), performs no validation on purpose: the canvas label must
	 * degrade gracefully on partially invalid data and stay cheap, since it runs per node on every
	 * diagram render.
	 *
	 * @return list<array>
	 */
	private static function extractBlockItemsByType(mixed $rawBlocks, ItemType $type): array
	{
		try
		{
			$blocks = is_string($rawBlocks) ? Json::decode($rawBlocks) : $rawBlocks;
		}
		catch (\Bitrix\Main\ArgumentException)
		{
			return [];
		}

		if (!is_array($blocks))
		{
			return [];
		}

		$items = [];
		foreach ($blocks as $block)
		{
			if (!is_array($block))
			{
				continue;
			}

			foreach ((array)($block[self::PARAM_BLOCK_ITEMS] ?? []) as $item)
			{
				if (
					is_array($item)
					&& ($item[self::PARAM_BLOCK_ITEMS_ITEM_TYPE] ?? null) === $type->value
				)
				{
					$items[] = $item;
				}
			}
		}

		return $items;
	}

	public static function validateProperties($arTestProperties = [], CBPWorkflowTemplateUser $user = null): array
	{
		$arErrors = [];
		if (empty($arTestProperties[self::PARAM_BLOCKS]))
		{
			$arErrors[] = self::makeValidationError(
				Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_PROPERTY_BLOCKS_EMPTY')
			);
		}
		else
		{
			self::validateAndParseBlocks($arTestProperties[self::PARAM_BLOCKS], $arErrors);
		}

		return array_merge($arErrors, parent::ValidateProperties($arTestProperties, $user));
	}

	public static function getPropertiesDialog(
		$documentType,
		$activityName,
		$arWorkflowTemplate,
		$arWorkflowParameters,
		$arWorkflowVariables,
		$arCurrentValues = null,
		$formName = '',
		$popupWindow = null,
		$siteId = '',
	): PropertiesDialog
	{
		$dialog = new PropertiesDialog(__FILE__, [
			'documentType' => $documentType,
			'activityName' => $activityName,
			'workflowTemplate' => $arWorkflowTemplate,
			'workflowParameters' => $arWorkflowParameters,
			'workflowVariables' => $arWorkflowVariables,
			'currentValues' => $arCurrentValues,
			'formName' => $formName,
			'siteId' => $siteId,
		]);

		$dialog->setMap(static::getPropertiesMap($documentType));
		$dialog->setRuntimeData([
			'constantConfigurationList' => self::getConstantConfigurationList($documentType),
		]);

		return $dialog;
	}

	public static function getPropertiesDialogValues(
		$documentType,
		$activityName,
		&$arWorkflowTemplate,
		&$arWorkflowParameters,
		&$arWorkflowVariables,
		$arCurrentValues,
		&$errors,
	): bool
	{
		$errors = [];
		$properties = [];

		$documentService = CBPRuntime::getRuntime()->getDocumentService();
		foreach (static::getPropertiesMap($documentType) as $id => $property)
		{
			$value = $documentService->getFieldInputValue(
				$documentType,
				$property,
				$property['FieldName'],
				$arCurrentValues,
				$errors
			);

			if (!empty($errors))
			{
				return false;
			}

			$properties[$id] = $value;
		}

		$errors = self::validateProperties(
			$properties,
			new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser)
		);

		if (!empty($errors))
		{
			return false;
		}

		$collection = self::validateAndParseBlocks($properties[self::PARAM_BLOCKS], $errors);

		if (!empty($errors))
		{
			return false;
		}

		$properties[self::PARAM_BLOCKS] = $collection->toArray();

		$currentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
		$currentActivity['Properties'] = $properties;

		return true;
	}

	protected static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			self::PARAM_BLOCKS => [
				'Name' => Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_PROPERTY_BLOCKS'),
				'FieldName' => self::PARAM_BLOCKS,
				'Type' => FieldType::CUSTOM,
				'Getter' => static function($dialog, $property, $currentActivity)
				{
					$value = $currentActivity['Properties'][self::PARAM_BLOCKS] ?? null;

					return is_array($value) ? Json::encode($value) : $value;
				},
			],
		];
	}

	public function execute(): int
	{
		// the values belong to the template and not to the employee, so a frozen template opens the form
		// for nobody: the step runs on the values already saved, the same way for everyone
		if ((new SettingsFreezeGate())->isFrozen($this->getWorkflowTemplateId()))
		{
			return CBPActivityExecutionStatus::Closed;
		}

		if (empty($this->{self::PARAM_BLOCKS}))
		{
			$this->trackError(Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_PROPERTY_BLOCKS_EMPTY'));

			return CBPActivityExecutionStatus::Closed;
		}

		$userId = $this->getUserIdOnExecute();
		if (empty($userId))
		{
			$this->trackError(Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_NO_STARTER_USER'));

			return CBPActivityExecutionStatus::Closed;
		}

		$parsingErrors = [];
		$blocks = self::validateAndParseBlocks($this->{self::PARAM_BLOCKS}, $parsingErrors);
		if (!empty($parsingErrors))
		{
			$messages = array_map(static fn($error) => $error[self::ERROR_MESSAGE] ?? null, $parsingErrors);
			$this->trackError(implode(" \n", $messages));

			return CBPActivityExecutionStatus::Closed;
		}

		if ($blocks === null)
		{
			$this->trackError(Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_PROPERTY_BLOCKS_EMPTY'));

			return CBPActivityExecutionStatus::Closed;
		}

		$this->sendCurrentData($userId, $blocks);
		$this->subscribe($this);

		return CBPActivityExecutionStatus::Executing;
	}

	public function cancel(): int
	{
		$this->unsubscribe($this);

		return CBPActivityExecutionStatus::Closed;
	}

	private function sendPush(
		int $userId,
		BlockCollection $blocks,
		?string $templateName = null,
		?string $templateDescription = null,
	)
	{
		if (!Loader::includeModule('pull'))
		{
			return;
		}

		(new PushWorker())
			->send(
				self::PUSH_COMMAND,
				[
					'blocks' => $blocks->toArray(),
					'templateId' => $this->getWorkflowTemplateId(),
					'instanceId' => $this->workflow->getInstanceId(),
					'templateName' => $templateName,
					'templateDescription' => $templateDescription,
				],
				[$userId],
			)
		;
	}

	private function sendCurrentData(
		int $userId,
		BlockCollection $blocks,
	): void
	{
		$model = $this->getTemplateNameAndDescriptionModel();
		$blocksWithValues = $this->appendConstantInfoToBlocks($blocks);

		$this->sendCurrentDataEvent(
			blocks: $blocksWithValues,
			templateName: $model?->getName(),
			templateDescription: $model?->getDescription(),
		);

		$this->sendPush(
			userId: $userId,
			blocks: $blocksWithValues,
			templateName: $model?->getName(),
			templateDescription: $model?->getDescription(),
		);
	}

	public function subscribe(IBPActivityExternalEventListener $eventHandler): void
	{
		$schedulerService = $this->workflow->getService('SchedulerService');
		foreach ($this->getListenEvents() as $event)
		{
			$schedulerService->subscribeOnEvent(
				$this->workflow->getInstanceId(),
				$this->name,
				$event->getModuleId(),
				$event->getEventType(),
				$this->workflow->getInstanceId(),
			);
		}

		$expiresAt = time() + self::EXPIRES_IN;
		$this->subscriptionId = (int)$schedulerService->subscribeOnTime($this->workflow->getInstanceId(), $this->name, $expiresAt);

		$this->workflow->addEventHandler($this->name, $eventHandler);
	}

	public function unsubscribe(IBPActivityExternalEventListener $eventHandler): void
	{
		$schedulerService = $this->workflow->getService('SchedulerService');
		foreach ($this->getListenEvents() as $event)
		{
			$schedulerService->unSubscribeOnEvent(
				$this->workflow->getInstanceId(),
				$this->name,
				$event->getModuleId(),
				$event->getEventType(),
				$this->workflow->getInstanceId(),
			);
		}

		$this->workflow->removeEventHandler($this->name, $eventHandler);
		if ($this->subscriptionId > 0)
		{
			$schedulerService->unSubscribeOnTime($this->subscriptionId);
		}
	}

	public function onExternalEvent($arEventParameters = []): void
	{
		if ($this->executionStatus === CBPActivityExecutionStatus::Closed)
		{
			return;
		}

		if (($arEventParameters['SchedulerService'] ?? null) === 'OnAgent')
		{
			$this->unsubscribe($this);
			$this->workflow->terminate();

			return;
		}

		$eventName = $arEventParameters['eventName'] ?? '';
		if (!in_array($eventName, $this->getListenEventNames(), true))
		{
			return;
		}

		$continueWorkflow = match ($eventName)
		{
			SetupTemplateUserInputEvent::EVENT_NAME => $this->handleUserInputEvent($arEventParameters),
			default => false,
		};

		if (!$continueWorkflow)
		{
			return;
		}

		$this->unsubscribe($this);
		$this->workflow->closeActivity($this);
	}

	private function setConstants(array $constantValues, BlockCollection $blocks): SetConstantsResponse
	{
		[$preparedValues, $allTempFileIds] = $this->getFileConstantsFilesIds($constantValues, $blocks);

		$result = (new SetupTemplateConstantsService())
			->setConstants(
				new SetConstantsRequest(
					templateId: $this->getWorkflowTemplateId(),
					requestConstants: $this->appendOtherTemplateConstantsDefaults($preparedValues),
					complexDocumentType: $this->getDocumentType(),
					userId: $this->getUserIdOnExecute(),
				)
			);

		if ($result->isSuccess())
		{
			$this->makeTempFilesPersistent($allTempFileIds);
		}

		return $result;
	}

	private function sendValidationEvent(?ErrorCollection $errors = null): void
	{
		(new SetupTemplateValidationEvent())
			->setTemplateId($this->getWorkflowTemplateId())
			->setUserId($this->getUserIdOnExecute())
			->setErrors($errors)
			->send()
		;
	}

	/**
	 * @return list<Event>
	 */
	private function getListenEvents(): array
	{
		return [
			new SetupTemplateUserInputEvent(),
		];
	}

	/**
	 * @return list<string>
	 */
	private function getListenEventNames(): array
	{
		return array_map(
			static fn(Event $event): string => $event->getEventType(),
			$this->getListenEvents(),
		);
	}

	private function getUserIdOnExecute(): int
	{
		return (int)$this->workflow->getStartedBy();
	}

	/**
	 * Builds a setup-block subset that keeps only the constants with the given codes while
	 * preserving the structural items (title/description/delimiter/... any non-Constant item)
	 * of every block that retains at least one requested constant. Blocks without any requested
	 * constant are dropped entirely, and item order inside a kept block is preserved.
	 *
	 * Used by the AI-agent upgrade fill scenario (P3.T2) to render only the NEW required
	 * constants of the reference template in the existing setup-template UI, without
	 * starting a setup workflow. Structural items are kept so the wizard shows section
	 * headers and hints, not bare fields. Parsing is delegated to validateAndParseBlocks()
	 * so the block/constant contract is not duplicated.
	 *
	 * @param string|array|null $inputBlocks Raw blocks (JSON string or array) from the
	 *   reference SetupTemplateActivity 'blocks' property.
	 * @param list<string> $constantCodes Constant codes to keep.
	 * @return array Filtered blocks as an array (empty when nothing matches).
	 */
	public static function filterBlocksByConstantCodes(string|array|null $inputBlocks, array $constantCodes): array
	{
		$errors = [];
		$collection = self::validateAndParseBlocks($inputBlocks, $errors);
		if ($collection === null || !empty($errors))
		{
			return [];
		}

		$keep = array_fill_keys(array_map('strval', $constantCodes), true);

		$filtered = new BlockCollection();
		foreach ($collection as $block)
		{
			$items = new ItemCollection();
			$hasRequestedConstant = false;
			foreach ($block->items as $item)
			{
				if ($item instanceof Constant)
				{
					if (isset($keep[$item->id]))
					{
						$items->add($item);
						$hasRequestedConstant = true;
					}

					continue;
				}

				// Keep structural items (title/description/delimiter/...) so kept blocks
				// render with their headers and hints instead of bare constant fields.
				$items->add($item);
			}

			if ($hasRequestedConstant)
			{
				$filtered->add(new Block($items));
			}
		}

		return $filtered->toArray();
	}

	/**
	 * @return list<string>|null
	 */
	public static function collectConstantCodes(string|array|null $inputBlocks): ?array
	{
		$errors = [];
		$blocks = self::validateAndParseBlocks($inputBlocks, $errors);
		if ($blocks === null || !empty($errors))
		{
			return null;
		}

		$constantCodes = [];
		foreach ($blocks as $block)
		{
			foreach ($block->items as $item)
			{
				if ($item instanceof Constant)
				{
					$constantCodes[] = $item->id;
				}
			}
		}

		return array_values(array_unique($constantCodes));
	}

	/**
	 * Instance-free field-definition validation of submitted constant values against setup blocks.
	 *
	 * Mirrors the field-type/format portion of validateConstants() but without the running-instance
	 * concerns (file uploader, access checks): it only decides which submitted values are invalid
	 * for their setup-block field definition. Used by the AI-agent upgrade pre-commit re-validation
	 * (P3.T2) so an invalid value re-shows the review master instead of being written and only
	 * caught by the post-apply best-effort fill(). Emptiness is not reported here — a missing
	 * required value is the caller's separate "still missing required" check. When a field type
	 * cannot be resolved without an instance (rare) the constant is left to that best-effort fill()
	 * rather than false-blocking an otherwise valid upgrade.
	 *
	 * @param array $documentType Complex document type the constants belong to.
	 * @param string|array|null $inputBlocks Raw setup blocks (JSON string or array).
	 * @param array<string, mixed> $constantValues Submitted values keyed by constant code.
	 * @return list<string> Codes of submitted values that fail their field-type validation.
	 */
	public static function collectInvalidConstantCodes(
		array $documentType,
		string|array|null $inputBlocks,
		array $constantValues,
	): array
	{
		if ($constantValues === [])
		{
			return [];
		}

		$errors = [];
		$blocks = self::validateAndParseBlocks($inputBlocks, $errors);
		if ($blocks === null || !empty($errors))
		{
			return [];
		}

		$documentService = CBPRuntime::getRuntime()->getDocumentService();

		$invalid = [];
		foreach ($blocks as $block)
		{
			foreach ($block->items as $item)
			{
				if (!$item instanceof Constant || !array_key_exists($item->id, $constantValues))
				{
					continue;
				}

				if (CBPHelper::isEmptyValue($constantValues[$item->id]))
				{
					continue;
				}

				$fieldType = $documentService->getFieldTypeObject($documentType, $item->toFieldTypeArray());
				if ($fieldType === null)
				{
					continue;
				}

				$itemErrors = [];
				$fieldType->extractValue(['Field' => $item->id], $constantValues, $itemErrors);
				if (!empty($itemErrors))
				{
					$invalid[] = $item->id;
				}
			}
		}

		return $invalid;
	}

	protected static function validateAndParseBlocks(string|array|null $inputBlocks, array &$errors): ?BlockCollection
	{
		if (empty($inputBlocks) || (!is_string($inputBlocks) && !is_array($inputBlocks)))
		{
			$errors[] = self::makeValidationError(
				Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_PROPERTY_BLOCKS_EMPTY'),
				self::ERROR_CODE_INVALID_STRUCTURE,
			);

			return null;
		}

		if (is_string($inputBlocks) && !Json::validate($inputBlocks))
		{
			$errors[] = self::makeValidationError(
				Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_PROPERTY_BLOCKS_EMPTY'),
				self::ERROR_CODE_INVALID_STRUCTURE,
			);

			return null;
		}

		$arrayBlocks = is_string($inputBlocks) ? Json::decode($inputBlocks) : $inputBlocks;

		if (empty($arrayBlocks) || !is_array($arrayBlocks))
		{
			$errors[] = self::makeValidationError(
				Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_PROPERTY_BLOCKS_EMPTY'),
				self::ERROR_CODE_INVALID_STRUCTURE,
			);

			return null;
		}

		$blockErrors = [];
		$collection = new BlockCollection();

		foreach ($arrayBlocks as $blockIdx => $arrayBlock)
		{
			$blockPosition = $blockIdx + 1;

			if (
				!is_array($arrayBlock)
				|| !array_key_exists(self::PARAM_BLOCK_ITEMS, $arrayBlock)
				|| empty($arrayBlock[self::PARAM_BLOCK_ITEMS])
				|| !is_array($arrayBlock[self::PARAM_BLOCK_ITEMS])
			)
			{
				$blockErrors[] = self::makeValidationError(
					Loc::getMessage(
						'BIZPROC_SETUP_TEMPLATE_ACTIVITY_PROPERTY_BLOCK_ITEMS_EMPTY',
						['#blockPosition#' => $blockPosition],
					)
				);

				continue;
			}

			$itemErrors = [];
			$itemCollection = self::validateAndParseBlockItems(
				$arrayBlock[self::PARAM_BLOCK_ITEMS],
				$blockPosition,
				$itemErrors
			);

			if (!empty($itemErrors))
			{
				$blockErrors = array_merge($blockErrors, $itemErrors);

				continue;
			}

			$block = new Block($itemCollection);
			$collection->add($block);
		}

		if (!empty($blockErrors))
		{
			$errors = array_merge($errors, $blockErrors);

			return null;
		}

		return $collection;
	}

	protected static function validateAndParseBlockItems(
		array $arrayItems,
		int $blockPosition,
		array &$errors,
	): ItemCollection
	{
		$itemCollection = new ItemCollection();

		foreach ($arrayItems as $itemIdx => $arrayItem)
		{
			$itemPosition = $itemIdx + 1;

			if (
				!is_array($arrayItem)
				|| !array_key_exists(self::PARAM_BLOCK_ITEMS_ITEM_TYPE, $arrayItem)
				|| empty($arrayItem[self::PARAM_BLOCK_ITEMS_ITEM_TYPE])
			)
			{
				$errors[] = self::makeValidationError(
					Loc::getMessage(
						'BIZPROC_SETUP_TEMPLATE_ACTIVITY_PROPERTY_BLOCK_ITEMS_ITEM_TYPE_EMPTY',
						[
							'#itemPosition#' => $itemPosition,
							'#blockPosition#' => $blockPosition,
						],
					)
				);

				continue;
			}

			$itemErrors = [];

			$item = match ($arrayItem[self::PARAM_BLOCK_ITEMS_ITEM_TYPE])
			{
				ItemType::Title->value => self::validateTitle($arrayItem, $blockPosition, $itemPosition, $itemErrors),
				ItemType::Description->value => self::validateDescription($arrayItem, $blockPosition, $itemPosition, $itemErrors),
				ItemType::Delimiter->value => self::validateDelimiter($arrayItem, $blockPosition, $itemPosition, $itemErrors),
				ItemType::Constant->value => self::validateConstant($arrayItem, $blockPosition, $itemPosition, $itemErrors),
				ItemType::TitleWithIcon->value => self::validateTitleWithIcon($arrayItem, $blockPosition, $itemPosition, $itemErrors),
				default => self::invalidTypeError($blockPosition, $itemPosition, $itemErrors),
			};

			if (is_null($item))
			{
				$errors = array_merge($errors, $itemErrors);

				continue;
			}

			$itemCollection->add($item);
		}

		return $itemCollection;
	}

	protected static function requireString(
		array $item,
		string $key,
		int $blockPosition,
		int $itemPosition,
		string $labelKey,
		array &$errors,
	): void
	{
		if (!array_key_exists($key, $item) || is_null($item[$key]) || $item[$key] === '')
		{
			$errors[] = self::makeValidationError(
				Loc::getMessage(
				'BIZPROC_SETUP_TEMPLATE_ACTIVITY_VALIDATOR_REQUIRE',
					[
						'#name#' => Loc::getMessage($labelKey),
						'#itemPosition#' => $itemPosition,
						'#blockPosition#' => $blockPosition,
					],
				)
			);
		}
		elseif (!is_string($item[$key]))
		{
			$errors[] = self::makeValidationError(
				Loc::getMessage(
					'BIZPROC_SETUP_TEMPLATE_ACTIVITY_VALIDATOR_IS_STRING',
					[
						'#name#' => Loc::getMessage($labelKey),
						'#itemPosition#' => $itemPosition,
						'#blockPosition#' => $blockPosition,
					]
				),
			);
		}
	}

	protected static function validateConstant(
		array $arrayItem,
		int $blockPosition,
		int $itemPosition,
		array &$errors,
	): ?Item
	{
		$props = [
			'id' => 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_CONSTANT_MENU',
			'name' => 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_CONSTANT_EDIT_NAME',
			'constantType' => 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_CONSTANT_EDIT_TYPE',
		];

		foreach ($props as $key => $label)
		{
			self::requireString(
				$arrayItem,
				$key,
				$blockPosition,
				$itemPosition,
				$label,
				$errors
			);
		}

		if (
			array_key_exists('description', $arrayItem)
			&& !is_null($arrayItem['description'])
			&& $arrayItem['description'] !== ''
			&& !is_string($arrayItem['description'])
		)
		{
			$errors[] = self::makeValidationError(
				Loc::getMessage(
					'BIZPROC_SETUP_TEMPLATE_ACTIVITY_VALIDATOR_IS_STRING',
					[
						'#name#' => Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_CONSTANT_EDIT_DESCRIPTION'),
						'#itemPosition#' => $itemPosition,
						'#blockPosition#' => $blockPosition,
					]
				),
			);
		}

		$propBools = [
			'multiple' => 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_CONSTANT_EDIT_MULTIPLE',
			'required' => 'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_CONSTANT_EDIT_REQUIRED',
		];

		foreach ($propBools as $key => $label)
		{
			if (
				array_key_exists($key, $arrayItem)
				&& !is_null($arrayItem[$key])
				&& !is_bool($arrayItem[$key])
			)
			{
				$errors[] = self::makeValidationError(
					Loc::getMessage(
						'BIZPROC_SETUP_TEMPLATE_ACTIVITY_VALIDATOR_IS_BOOL',
						[
							'#name#' => Loc::getMessage($label),
							'#itemPosition#' => $itemPosition,
							'#blockPosition#' => $blockPosition,
						]
					),
				);
			}
		}

		if (
			array_key_exists('options', $arrayItem)
			&& !empty($arrayItem['options'])
		)
		{
			$options = $arrayItem['options'];
			$isOptionsMap = is_array($options);
			if ($isOptionsMap)
			{
				foreach ($options as $optionValue => $optionLabel)
				{
					if (!is_string($optionLabel) || trim((string)$optionValue) === '')
					{
						$isOptionsMap = false;
						break;
					}
				}
			}

			if (!$isOptionsMap)
			{
				$errors[] = self::makeValidationError(
					Loc::getMessage(
						'BIZPROC_SETUP_TEMPLATE_ACTIVITY_VALIDATOR_IS_ARRAY',
						[
							'#name#' => Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_CONSTANT_EDIT_OPTIONS'),
							'#itemPosition#' => $itemPosition,
							'#blockPosition#' => $blockPosition,
						]
					),
				);
			}
		}

		if (
			array_key_exists('settings', $arrayItem)
			&& !is_null($arrayItem['settings'])
			&& !is_array($arrayItem['settings'])
		)
		{
			$errors[] = self::makeValidationError(
				Loc::getMessage(
					'BIZPROC_SETUP_TEMPLATE_ACTIVITY_VALIDATOR_IS_ARRAY',
					[
						'#name#' => Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_CONSTANT_EDIT_SETTINGS'),
						'#itemPosition#' => $itemPosition,
						'#blockPosition#' => $blockPosition,
					]
				),
			);
		}

		$constantType = $arrayItem['constantType'] ?? null;
		if ($constantType === FieldType::ENTITYSELECTOR)
		{
			$settings = $arrayItem['settings'] ?? [];
			$settings = is_array($settings) ? $settings : [];

			$selectorProvider = ServiceLocator::getInstance()->get(SelectorProvider::class);
			$selectorId = $settings[self::CONSTANT_SETTINGS_ENTITYSELECTOR_SELECTOR_ID] ?? null;
			if (!$selectorProvider->isExists($selectorId))
			{
				$errors[] = self::makeValidationError(
					Loc::getMessage(
						'BIZPROC_SETUP_TEMPLATE_ACTIVITY_VALIDATOR_ENUM',
						[
							'#name#' => Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_CONSTANT_EDIT_ENTITY_SELECTOR_SELECTOR_ID'),
							'#itemPosition#' => $itemPosition,
							'#blockPosition#' => $blockPosition,
						]
					),
				);
			}
		}

		if (!empty($errors))
		{
			return null;
		}

		return new Constant(
			$arrayItem['id'],
			$arrayItem['name'],
			$arrayItem['constantType'],
			$arrayItem['description'] ?? '',
			$arrayItem['multiple'] ?? false,
			$arrayItem['required'] ?? false,
			$arrayItem['options'] ?? [],
			$arrayItem['settings'] ?? [],
			self::normalizeConstantDefault($arrayItem['default'] ?? ''),
		);
	}

	/**
	 * Value the form is filled with: the value stored in the template constant wins, the default of
	 * the setup wizard is the fallback for a constant that was never filled.
	 *
	 * A single bool reaches the form canonicalized: the storage may hold any synonym the server
	 * recognises, so both the positive and the negative ones become Y or N and keep their meaning
	 * against the wizard default. Only a value outside the known synonyms means nothing to a bool
	 * and counts as never filled. A native bool is canonicalized whatever the multiplicity — for a
	 * multiple value element by element — so a stored native value keeps its meaning instead of
	 * being read as an empty one. Otherwise multiplicity decides which path is taken, not the
	 * runtime form of the stored value: the synonyms of a multiple bool stay as they are.
	 */
	private static function resolveConstantDefault(
		string $constantType,
		bool $multiple,
		mixed $storedValue,
		string|array $wizardDefault,
	): string|array
	{
		if ($constantType === FieldType::BOOL && is_bool($storedValue))
		{
			$storedValue = self::canonicalizeNativeBool($storedValue);
		}
		elseif ($constantType === FieldType::BOOL && is_array($storedValue))
		{
			$storedValue = array_map(
				static fn(mixed $value): mixed => self::canonicalizeNativeBool($value),
				$storedValue,
			);
		}
		elseif (is_scalar($storedValue))
		{
			$storedValue = (string)$storedValue;
		}

		// the same definition of emptiness the apply path uses, so a legitimate zero is a value here too
		if (CBPHelper::isEmptyValue($storedValue) || (!is_string($storedValue) && !is_array($storedValue)))
		{
			return $wizardDefault;
		}

		if ($constantType === FieldType::BOOL && !$multiple)
		{
			if (!is_string($storedValue))
			{
				return $wizardDefault;
			}

			// the synonyms of BoolType::extractValue; anything outside both sets is never filled
			$synonym = mb_strtolower($storedValue);
			if (in_array($synonym, ['y', 'yes', 'true', '1'], true))
			{
				return 'Y';
			}

			if (in_array($synonym, ['n', 'no', 'false', '0'], true))
			{
				return 'N';
			}

			return $wizardDefault;
		}

		return $storedValue;
	}

	/**
	 * A native bool of a template built outside the wizard, cast the way BoolType::extractValue does:
	 * a plain string cast would turn false into the empty string and lose the stored "no", and the
	 * switcher of the form reads a value that is not a string as an empty one. Anything but a native
	 * bool is left to the caller.
	 */
	private static function canonicalizeNativeBool(mixed $value): mixed
	{
		if (!is_bool($value))
		{
			return $value;
		}

		return $value ? 'Y' : 'N';
	}

	/**
	 * Keeps a multiple constant default as an array (each element cast to string) and a single
	 * default as a string. Casting the whole array to string would store the literal "Array".
	 */
	private static function normalizeConstantDefault(mixed $default): string|array
	{
		if (is_array($default))
		{
			return array_values(array_map(static fn($value): string => (string)$value, $default));
		}

		return (string)($default ?? '');
	}

	protected static function validateDelimiter(
		array $arrayItem,
		int $blockPosition,
		int $itemPosition,
		array &$errors,
	): ?Item
	{
		self::requireString(
			$arrayItem,
			'delimiterType',
			$blockPosition,
			$itemPosition,
			'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_DELIMITER_ITEM',
			$errors
		);

		if (
			array_key_exists('delimiterType', $arrayItem)
			&& is_string($arrayItem['delimiterType'])
			&& is_null(DelimiterType::tryFrom($arrayItem['delimiterType']))
		)
		{
			$errors[] = self::makeValidationError(
				Loc::getMessage(
					'BIZPROC_SETUP_TEMPLATE_ACTIVITY_VALIDATOR_ENUM',
					[
						'#name#' => Loc::getMessage(
							'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_DELIMITER_ITEM'
						),
						'#itemPosition#' => $itemPosition,
						'#blockPosition#' => $blockPosition,
					]
				),
			);
		}

		return
			empty($errors)
				? new Delimiter(DelimiterType::from($arrayItem['delimiterType']))
				: null
		;
	}

	protected static function validateDescription(
		array $arrayItem,
		int $blockPosition,
		int $itemPosition,
		array &$errors,
	): ?Item
	{
		self::requireString(
			$arrayItem,
			'text',
			$blockPosition,
			$itemPosition,
			'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_DESCRIPTION_ITEM',
			$errors
		);

		return
			empty($errors)
				? new Description($arrayItem['text'])
				: null
		;
	}

	protected static function validateTitle(
		array $arrayItem,
		int $blockPosition,
		int $itemPosition,
		array &$errors,
	):  ?Item
	{
		self::requireString(
			$arrayItem,
			'text',
			$blockPosition,
			$itemPosition,
			'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_NAME_ITEM',
			$errors
		);

		return
			empty($errors)
				? new Title($arrayItem['text'])
				: null
		;
	}

	protected static function invalidTypeError(int $blockPosition, int $itemPosition, array &$errors): ?Item
	{
		$errors[] = self::makeValidationError(
			Loc::getMessage(
				'BIZPROC_SETUP_TEMPLATE_ACTIVITY_PROPERTY_BLOCK_ITEMS_ITEM_TYPE_UNKNOWN',
				[
					'#itemPosition#' => $itemPosition,
					'#blockPosition#' => $blockPosition,
				]
			),
			self::ERROR_CODE_UNKNOWN_ITEM_TYPE,
		);

		return null;
	}

	private static function makeValidationError(?string $message, string $code = self::ERROR_CODE_NOT_EXIST): array
	{
		return [
			self::ERROR_MESSAGE => $message,
			self::ERROR_CODE => $code,
		];
	}

	/**
	 * Fills in default values for setup-block constants that were not passed by the caller.
	 *
	 * Needed for scenario/auto-start flows (e.g. DayPlannerStarter) that submit setup without
	 * constant values: required constants with a configured default must pass validation instead
	 * of failing the "required & empty" check before defaults are applied in setConstants().
	 * Scoped to block constants only, so template-only constants are not added to the input and
	 * do not trigger the "unknown id" diff in validateConstants().
	 */
	private function appendBlockConstantsDefaults(array $constantValues, BlockCollection $blocks): array
	{
		foreach ($blocks as $block)
		{
			foreach ($block->items as $item)
			{
				if (!$item instanceof Constant)
				{
					continue;
				}

				if (!array_key_exists($item->id, $constantValues))
				{
					$constantValues[$item->id] = self::autoFilledConstantValue($item);
				}
			}
		}

		return $constantValues;
	}

	/**
	 * An empty default of a required bool would fail the "required & empty" check, while the form itself
	 * submits N for the same state (each row of a multiple bool publishes its own N), so N is what the
	 * auto-fill path takes. An empty value of an optional bool is a legitimate "not set" and is left
	 * alone, as is any constant outside the blocks of the wizard.
	 */
	private static function autoFilledConstantValue(Constant $item): mixed
	{
		if (
			$item->constantType === FieldType::BOOL
			&& $item->required
			&& CBPHelper::isEmptyValue($item->default)
		)
		{
			return $item->multiple ? ['N'] : 'N';
		}

		return self::normalizeConstantValueForApply($item->constantType, $item->multiple, $item->default);
	}

	/**
	 * Multiple user constant default is stored as an array of tokens (["user_4", "group_hr1", ...]),
	 * but the apply path (GetFieldInputValue -> User::extractValueMultiple -> CBPHelper::usersStringToArray)
	 * expects a delimited string; a raw sequential array without Index is collapsed to its first element.
	 * Join the tokens with ";" so every selected user/department survives. Only multiple user defaults are
	 * touched; other types and single values are returned unchanged.
	 */
	private static function normalizeConstantValueForApply(string $constantType, bool $multiple, mixed $value): mixed
	{
		if ($constantType === FieldType::USER && $multiple && is_array($value))
		{
			return implode(';', array_map(static fn($token): string => (string)$token, $value));
		}

		return $value;
	}

	private function appendOtherTemplateConstantsDefaults(array $constantValues): array
	{
		$constants = (array)\CBPWorkflowTemplateLoader::getTemplateConstants($this->getWorkflowTemplateId());
		$allConstantValues = [];
		foreach ($constants as $constantId => $constant)
		{
			if (array_key_exists($constantId, $constantValues))
			{
				$allConstantValues[$constantId] = $constantValues[$constantId];
			}
			else
			{
				$allConstantValues[$constantId] = self::normalizeConstantValueForApply(
					(string)($constant['Type'] ?? ''),
					\CBPHelper::getBool($constant['Multiple'] ?? false),
					$constant['Default'] ?? null,
				);
			}
		}

		return $allConstantValues;
	}

	private function validateConstants(
		array $constants,
		int $userId,
		BlockCollection $blocks,
		bool $skipAccessValidation = false,
	): ErrorCollection
	{
		$errors = [];
		$constantIdList = [];

		foreach ($blocks as $block)
		{
			foreach ($block->items as $item)
			{
				if (!$item instanceof Constant)
				{
					continue;
				}

				$constantIdList[] = $item->id;
				$constantValue = $constants[$item->id] ?? null;
				$customDataError = [self::ERROR_CONSTANT => $item->id];

				// the same definition of emptiness the prefill and apply paths use, so a zero is a value here too
				if ($item->required === true && CBPHelper::isEmptyValue($constantValue))
				{
					$errors[] = new Error(
						Loc::getMessage('BIZPROC_CONSTANT_EMPTY_PROP', ['#PROPERTY#' => $item->name]),
						self::ERROR_CODE_NOT_EXIST,
						$customDataError
					);

					continue;
				}

				$typeClass = CBPRuntime::getRuntime()
					->getDocumentService()
					->getTypeClass($this->getDocumentType(), $item->constantType)
				;

				if (is_null($typeClass))
				{
					$errors[] = new Error(
						Loc::getMessage('BIZPROC_CONSTANT_FIELD_TYPE_UNKNOWN'),
						self::ERROR_CODE_UNKNOWN_FIELD_TYPE,
						$customDataError
					);

					continue;
				}

				$fieldType = new FieldType($item->toFieldTypeArray(), $this->getDocumentType(), $typeClass);

				$fileValidationResult = $this->validateFileConstant($item, $constantValue);
				if (!$fileValidationResult->isSuccess())
				{
					$errors = array_merge($errors, $fileValidationResult->getErrors());
				}

				$itemErrors = [];
				$value = $fieldType->extractValue(['Field' => $item->id], $constants, $itemErrors);

				foreach ($itemErrors as $error)
				{
					$errors[] = new Error($error[self::ERROR_MESSAGE], $error[self::ERROR_CODE], $customDataError);
				}

				if (!$skipAccessValidation)
				{
					$accessValidationResult = (new AccessValidationService())
						->isUserHasAccessToValue($fieldType->getTypeClass(), $userId, $value)
					;
					$errors = array_merge($errors, $accessValidationResult->getErrorCollection()->getValues());
				}
			}
		}

		$diff = array_diff(array_keys($constants), $constantIdList);

		if (!empty($diff))
		{
			$errors[] = new Error(
				Loc::getMessage('BIZPROC_CONSTANT_UNKNOWN_ID', ['#constantIdList#' => implode(', ', $diff)]),
				self::ERROR_CODE_NOT_EXIST
			);
		}

		return $this->toErrorCollection($errors);
	}

	private function toErrorCollection(array $errors): ErrorCollection
	{
		$errorCollection = new ErrorCollection();

		foreach ($errors as $error)
		{
			if (!$error instanceof \Bitrix\Main\Error)
			{
				$error = new \Bitrix\Main\Error($error[self::ERROR_MESSAGE], $error[self::ERROR_CODE]);
			}

			$errorCollection->setError($error);
		}

		return $errorCollection;
	}

	/**
	 * @param array|null $documentType
	 * @return array<ConstantConfiguration>
	 */
	private static function getConstantConfigurationList(?array $documentType): array
	{
		$documentService = CBPRuntime::getRuntime()->getDocumentService();
		$types = $documentService->GetDocumentFieldTypes($documentType);

		$allowedTypes = [
			FieldType::INT,
			FieldType::STRING,
			FieldType::TEXT,
			FieldType::SELECT,
			FieldType::USER,
			RagKnowledgeBaseType::getType(),
			ProjectType::getType(),
			FieldType::FILE,
			FieldType::TIME,
			FieldType::BOOL,
			FieldType::DATE,
			FieldType::DATETIME,
			BIDashboardType::getType(),
		];

		$constantConfigurationList = [];
		foreach ($types as $type => $options)
		{
			if (empty($options['Name'] ?? null) || !in_array($type, $allowedTypes, true))
			{
				continue;
			}

			$constantConfigurationList[] = new ConstantConfiguration(
				title: $options['Name'],
				type: $type,
				options: [],
			);
		}

		$entitySelectorType = CBPHelper::getEntitySelectorTypeInfo();
		if (!empty($entitySelectorType['Name']))
		{
			$selectorProvider = ServiceLocator::getInstance()->get(SelectorProvider::class);

			$selectors = $selectorProvider->getAll();
			if (!empty($selectors))
			{
				$constantConfigurationList[] = new ConstantConfiguration(
					title: $entitySelectorType['Name'],
					type: FieldType::ENTITYSELECTOR,
					options: [
						'selectors' => $selectors,
					],
				);
			}
		}

		return $constantConfigurationList;
	}

	private function appendConstantInfoToBlocks(BlockCollection $blocks): BlockCollection
	{
		$patchedCollection = new BlockCollection();
		foreach ($blocks as $block)
		{
			$patchedCollection->add(new Block($this->appendConstantInfoToItemCollection($block->items)));
		}

		return $patchedCollection;
	}

	private function appendConstantInfoToItemCollection(ItemCollection $items): ItemCollection
	{
		$patchedItems = new ItemCollection();
		foreach ($items as $item)
		{
			$patchedItems->add($this->appendConstantInfoToItem($item));
		}

		return $patchedItems;
	}

	private function appendConstantInfoToItem(Item $item): Item
	{
		if (!$item instanceof Constant)
		{
			return $item;
		}

		$defaultValue = self::resolveConstantDefault(
			$item->constantType,
			$item->multiple,
			$this->getConstant($item->id),
			$item->default,
		);

		$settings = $item->settings;
		if (!is_array($settings))
		{
			$settings = [];
		}

		if ($item->constantType === FieldType::ENTITYSELECTOR)
		{
			$selectorProvider = ServiceLocator::getInstance()->get(SelectorProvider::class);
			$selectorId = $item->settings[self::CONSTANT_SETTINGS_ENTITYSELECTOR_SELECTOR_ID] ?? null;
			$selectorConfiguration = $selectorProvider->getById($selectorId);

			$settings[self::CONSTANT_SETTINGS_ENTITYSELECTOR_SELECTOR] = $selectorConfiguration?->toArray() ?? [];
		}

		return new Constant(
			id: $item->id,
			name: $item->name,
			constantType: $item->constantType,
			description: $item->description,
			multiple: $item->multiple,
			required: $item->required,
			options: $item->options,
			settings: $settings,
			default: $defaultValue,
		);
	}

	private function getTemplateNameAndDescriptionModel(): ?EO_WorkflowTemplate
	{
		return WorkflowTemplateTable::query()
			->where('ID', $this->workflow->getTemplateId())
			->setLimit(1)
			->setSelect(['NAME', 'DESCRIPTION'])
			->fetchObject()
		;
	}

	private static function validateTitleWithIcon(
		array $arrayItem,
		int $blockPosition,
		int $itemPosition,
		array &$errors,
	): ?TitleWithIcon
	{
		self::requireString(
			$arrayItem,
			'text',
			$blockPosition,
			$itemPosition,
			'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_NAME_ITEM',
			$errors
		);

		self::requireString(
			$arrayItem,
			'icon',
			$blockPosition,
			$itemPosition,
			'BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_ICON_ITEM',
			$errors
		);

		$icon = $arrayItem['icon'] ?? '';
		if (!in_array($icon, TitleWithIcon::getAllowedIconValues(), true))
		{
			$errors[] = self::makeValidationError(
				Loc::getMessage(
					'BIZPROC_SETUP_TEMPLATE_ACTIVITY_VALIDATOR_ENUM',
					[
						'#name#' => Loc::getMessage('BIZPROC_SETUP_TEMPLATE_ACTIVITY_LABEL_ICON_ITEM'),
						'#itemPosition#' => $itemPosition,
						'#blockPosition#' => $blockPosition,
					]
				),
			);
		}

		return empty($errors) ? new TitleWithIcon($arrayItem['text'], $icon) : null;
	}
	private function validateFileConstant(Constant $constant, mixed $value): \Bitrix\Main\Result
	{
		if ($constant->constantType !== FieldType::FILE)
		{
			return new \Bitrix\Main\Result();
		}

		if (!Loader::includeModule('ui'))
		{
			return (new \Bitrix\Main\Result())
				->addError(Error::fromCode(Error::MODULE_NOT_INSTALLED, ['moduleName' => 'ui']))
				;
		}

		[$tempFiles, $persistentFiles] = $this->splitFiles($value);

		$tempFilesValidationResult = $this->validateUploadedFiles($tempFiles);
		$persistentValidationResult = $this->validatePersistentFiles($persistentFiles, $constant->id);

		return (new \Bitrix\Main\Result())
			->addErrors($tempFilesValidationResult->getErrors())
			->addErrors($persistentValidationResult->getErrors())
			;
	}

	private function splitFiles(mixed $value): array
	{
		$arrayValue = is_array($value) ? $value : [$value];

		return UploaderHelper::splitFiles($arrayValue);
	}

	private function getFileConstantsFilesIds(array $constantValues, BlockCollection $blocks): array
	{
		$allTempFileIds = [];
		if (!Loader::includeModule('ui'))
		{
			return [$constantValues, $allTempFileIds];
		}

		$uploader = $this->getConstantsUploader();

		foreach ($constantValues as $constantId => $constantValue)
		{
			if (empty($constantValue))
			{
				continue;
			}

			$constant = $this->getConstantById($blocks, $constantId);
			if ($constant?->constantType !== FieldType::FILE)
			{
				continue;
			}

			[$tempFiles, $persistentFiles] = $this->splitFiles($constantValue);
			$allTempFileIds = array_merge($allTempFileIds, $tempFiles);
			$pendingFiles = $uploader->getPendingFiles($tempFiles);
			$ids = array_merge($persistentFiles, $pendingFiles->getFileIds());
			$constantValues[$constantId] = array_map(static fn($id) => \CBPDocument::signParameters([$id]), $ids);
		}

		return [$constantValues, $allTempFileIds];
	}

	private function getConstantById(BlockCollection $blocks, string $id): ?Constant
	{
		foreach ($blocks as $block)
		{
			foreach ($block->items as $item)
			{
				if ($item instanceof Constant && $item->id === $id)
				{
					return $item;
				}
			}
		}

		return null;
	}

	private function getConstantsUploader(): Uploader
	{
		$controller = new SetupTemplateUploaderController([
			SetupTemplateUploaderController::OPTION_TEMPLATE_ID => $this->workflow->getTemplateId(),
		]);

		return new Uploader($controller);
	}

	private function makeTempFilesPersistent(array $tempFileIds): void
	{
		if (!Loader::includeModule('ui') || empty($tempFileIds))
		{
			return;
		}

		$uploader = $this->getConstantsUploader();
		$pendingFiles = $uploader->getPendingFiles($tempFileIds);
		$pendingFiles->makePersistent();
	}

	private function validateUploadedFiles(array $tempFiles): \Bitrix\Main\Result
	{
		$uploader = $this->getConstantsUploader();
		$pendingFiles = $uploader->getPendingFiles($tempFiles);

		return UploaderHelper::validatePendingFiles($pendingFiles, $tempFiles);
	}

	private function validatePersistentFiles(array $persistentFiles, string $constantId): \Bitrix\Main\Result
	{
		$currentFileIds = $this->getConstantCurrentValueAsIntArray($constantId);
		foreach ($persistentFiles as $fileId)
		{
			if (!in_array((int)$fileId, $currentFileIds, true))
			{
				return (new \Bitrix\Main\Result())
					->addError(ErrorMessage::INVALID_FILE->getError())
					;
			}
		}

		return new \Bitrix\Main\Result();
	}

	/**
	 * @param string $constantId
	 *
	 * @return list<int>
	 */
	private function getConstantCurrentValueAsIntArray(string $constantId): array
	{
		$currentFileIds = $this->getConstantType($constantId)['Default'] ?? [];
		$currentFileIds = is_array($currentFileIds) ? $currentFileIds : [$currentFileIds];
		$currentFileIds = array_map(static fn($id) => (int)$id, $currentFileIds);

		return array_filter($currentFileIds);
	}

	private function handleUserInputEvent(array $eventParameters): bool
	{
		$instanceId = $eventParameters[0] ?? null;
		$userId = $eventParameters[1] ?? null;
		$templateId = $eventParameters[2] ?? null;
		$constantValues = (array)($eventParameters[3] ?? []);
		$skipAccessValidation = (bool)($eventParameters[4] ?? false);
		$applyDefaults = (bool)($eventParameters[5] ?? false);
		if (
			$templateId !== $this->getWorkflowTemplateId()
			|| $userId !== $this->getUserIdOnExecute()
			|| $instanceId !== $this->workflow->getInstanceId()
		)
		{
			return false;
		}

		$errors = [];
		$blocks = $this->validateAndParseBlocks($this->{self::PARAM_BLOCKS}, $errors);
		if (!empty($errors))
		{
			$this->sendValidationEvent($this->toErrorCollection($errors));

			return false;
		}

		if ($applyDefaults)
		{
			$constantValues = $this->appendBlockConstantsDefaults($constantValues, $blocks);
		}

		$errors = $this->validateConstants($constantValues, $userId, $blocks, $skipAccessValidation);
		if (!$errors->isEmpty())
		{
			$this->sendValidationEvent($errors);

			return false;
		}

		$result = $this->setConstants($constantValues, $blocks);
		$this->sendValidationEvent($result->getErrorCollection());

		return $result->isSuccess();
	}

	private function sendCurrentDataEvent(
		BlockCollection $blocks,
		?string $templateName = null,
		?string $templateDescription = null,
	): void
	{
		(new SetupTemplateCurrentDataEvent())
			->setTemplateId($this->getWorkflowTemplateId())
			->setUserId($this->getUserIdOnExecute())
			->setInstanceId($this->workflow->getInstanceId())
			->setBlocks($blocks)
			->setTemplateName($templateName)
			->setTemplateDescription($templateDescription)
			->send()
		;
	}
}
