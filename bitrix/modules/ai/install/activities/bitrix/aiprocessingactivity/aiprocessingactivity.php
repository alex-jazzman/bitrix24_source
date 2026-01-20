<?php

use Bitrix\Bizproc\Activity\PropertiesDialog;
use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Public\Event\ParameterBuilder\AI\Context\ChatHistoryEventParametersBuilder;
use Bitrix\Main\Loader;
use Bitrix\AI\Payload;
use Bitrix\Main\Error;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\DI\ServiceLocator;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiProcessingActivity extends CBPActivity implements IBPEventActivity, IBPActivityExternalEventListener
{
	private const MODULE_ID = 'ai';
	private const PARAM_PROMPT = 'prompt';
	private const PARAM_ENGINE = 'engine';
	private const RETURN_PARAM_AI_RESULT = 'aiResult';
	private const RETURN_PARAM_ERROR_MESSAGE = 'errorMessage';
	private const PARAM_RETURN_TYPE = 'returnType';
	private const PARAM_JSON_SCHEMA = 'jsonSchema';
	private const PARAM_JSON_PATH = 'jsonPath';
	private const QUEUE_JOB_SUCCESS = 'onQueueJobExecute';
	private const QUEUE_JOB_FAIL = 'onQueueJobFail';

	public const RETURN_TYPE_STRING = 'text';
	public const RETURN_TYPE_JSON = 'json';
	private const DEFAULT_EXPIRES_IN = 300;
	private const SCHEDULER_EVENT_PARAM = 'SchedulerService';
	private const SCHEDULER_EVENT_ON_AGENT = 'OnAgent';

	private const LISTEN_EVENTS = [
		self::QUEUE_JOB_SUCCESS,
		self::QUEUE_JOB_FAIL,
	];
	private ?string $queueHash = null;
	private int $timeoutSubscriptionId = 0;

	public function __construct($name)
	{
		parent::__construct($name);

		Loader::includeModule('ai');

		$this->arProperties = [
			'Title' => '',
			self::PARAM_PROMPT => '',
			self::PARAM_ENGINE => null,
			self::PARAM_RETURN_TYPE => null,
			self::PARAM_JSON_SCHEMA => null,
			self::PARAM_JSON_PATH => null,
			self::RETURN_PARAM_AI_RESULT => null,
			self::RETURN_PARAM_ERROR_MESSAGE => null,
		];

		$this->setPropertiesTypes(
			[
				self::RETURN_PARAM_AI_RESULT => [
					'Type' => FieldType::STRING,
				],
				self::RETURN_PARAM_ERROR_MESSAGE => [
					'Type' => FieldType::STRING,
				],
			],
		);
	}

	public function reInitialize(): void
	{
		parent::reInitialize();

		$this->queueHash = null;
		$this->{self::RETURN_PARAM_AI_RESULT} = null;
		$this->{self::RETURN_PARAM_ERROR_MESSAGE} = null;
		$this->timeoutSubscriptionId = 0;
	}

	public function cancel(): int
	{
		$this->unsubscribe($this);

		return CBPActivityExecutionStatus::Closed;
	}

	public function execute(): int
	{
		if (empty($this->{self::PARAM_PROMPT}) || !CBPHelper::hasStringRepresentation($this->{self::PARAM_PROMPT}))
		{
			$this->logError(Loc::getMessage('AI_PROCESSING_ACTIVITY_EMPTY_PROMPT'));

			return CBPActivityExecutionStatus::Closed;
		}

		if (
			empty($this->{self::PARAM_ENGINE})
			|| !CBPHelper::hasStringRepresentation($this->{self::PARAM_ENGINE})
			|| !array_key_exists((string)$this->{self::PARAM_ENGINE}, self::getAvailableAiEngines())
		)
		{
			$this->logError(Loc::getMessage('AI_PROCESSING_ACTIVITY_EMPTY_ENGINE'));

			return CBPActivityExecutionStatus::Closed;
		}

		if (!Loader::includeModule('ai'))
		{
			$this->logError(Loc::getMessage('AI_PROCESSING_ACTIVITY_MODULE_NOT_INSTALLED'));

			return CBPActivityExecutionStatus::Closed;
		}

		$engine = \Bitrix\AI\Engine::getByCode($this->{self::PARAM_ENGINE}, $this->makeAiContext());
		if (!$engine)
		{
			$this->logError(Loc::getMessage('AI_PROCESSING_ACTIVITY_ENGINE_NOT_FOUND'));

			return CBPActivityExecutionStatus::Closed;
		}

		$engine
			->setParameters(['collect_context' => true])
			->setPayload((new Payload\Text($this->getUserPromptWithSystemPrePrompt())))
			->setResponseJsonMode($this->{self::PARAM_RETURN_TYPE} === self::RETURN_TYPE_JSON)
			->onSuccess(
				function(\Bitrix\AI\Result $result, ?string $queueHash = null) {
					$this->queueHash = $queueHash;
				},
			)
			->onError(
				function(Error $processingError) {
					$this->logError(
						Loc::getMessage(
							'AI_PROCESSING_ACTIVITY_QUEUE_ERROR',
							[
								'#ERROR#' => $processingError->getMessage(),
							],
						),
					);
				},
			)
			->completionsInQueue()
		;

		if ($this->queueHash === null)
		{
			return CBPActivityExecutionStatus::Closed;
		}

		$this->subscribe($this);

		return CBPActivityExecutionStatus::Executing;
	}

	public function subscribe(IBPActivityExternalEventListener $eventHandler): void
	{
		$schedulerService = $this->workflow->getService('SchedulerService');
		foreach (self::LISTEN_EVENTS as $eventName)
		{
			$schedulerService->subscribeOnEvent(
				$this->workflow->getInstanceId(),
				$this->name,
				self::MODULE_ID,
				$eventName,
				$this->queueHash,
			);
		}

		$this->workflow->addEventHandler($this->name, $eventHandler);
		if ($this->getExpiresIn())
		{
			$this->timeoutSubscriptionId = (int)$schedulerService->subscribeOnTime(
				$this->workflow->getInstanceId(),
				$this->name,
				time() + $this->getExpiresIn(),
			);
		}
	}

	public function unsubscribe(IBPActivityExternalEventListener $eventHandler): void
	{
		$schedulerService = $this->workflow->getService('SchedulerService');
		foreach (self::LISTEN_EVENTS as $eventName)
		{
			$schedulerService->unSubscribeOnEvent(
				$this->workflow->getInstanceId(),
				$this->name,
				self::MODULE_ID,
				$eventName,
				$this->queueHash,
			);
		}

		$this->workflow->removeEventHandler($this->name, $eventHandler);
		if ($this->timeoutSubscriptionId > 0)
		{
			$schedulerService->unSubscribeOnTime($this->timeoutSubscriptionId);
		}
	}

	public function onExternalEvent($arEventParameters = []): void
	{
		if ($this->executionStatus === CBPActivityExecutionStatus::Closed)
		{
			return;
		}

		if ($this->queueHash === null)
		{
			return;
		}

		if (($arEventParameters[self::SCHEDULER_EVENT_PARAM] ?? null) === self::SCHEDULER_EVENT_ON_AGENT)
		{
			$this->logError(Loc::getMessage('AI_PROCESSING_ACTIVITY_EXECUTION_TIMEOUT_ERROR'));
			$this->unsubscribe($this);
			$this->workflow->closeActivity($this);

			return;
		}

		$eventName = $arEventParameters['eventName'] ?? '';
		if (!in_array($eventName, self::LISTEN_EVENTS, true))
		{
			return;
		}

		if ($this->isQueueHashIncorrect($arEventParameters))
		{
			return;
		}

		if ($eventName === self::QUEUE_JOB_SUCCESS)
		{
			$this->handleSuccessEventResult($arEventParameters);
		}
		elseif ($eventName === self::QUEUE_JOB_FAIL)
		{
			$this->handleFailEventResult($arEventParameters);
		}

		$this->unsubscribe($this);
		$this->workflow->closeActivity($this);
	}

	public static function validateProperties($arTestProperties = [], CBPWorkflowTemplateUser $user = null): array
	{
		$arErrors = [];

		if (empty($arTestProperties[self::PARAM_PROMPT]))
		{
			$arErrors[] = [
				'code' => 'NotExist',
				'parameter' => self::PARAM_PROMPT,
				'message' => Loc::getMessage('AI_PROCESSING_ACTIVITY_EMPTY_PROMPT'),
			];
		}

		if (
			empty($arTestProperties[self::PARAM_ENGINE])
			|| !array_key_exists($arTestProperties[self::PARAM_ENGINE], self::getAvailableAiEngines())
		)
		{
			$arErrors[] = [
				'code' => 'NotExist',
				'parameter' => self::PARAM_ENGINE,
				'message' => Loc::getMessage('AI_PROCESSING_ACTIVITY_EMPTY_ENGINE'),
			];
		}

		$returnType = $arTestProperties[self::PARAM_RETURN_TYPE] ?? null;
		if (empty($returnType))
		{
			$arErrors[] = [
				'code' => 'NotExist',
				'parameter' => self::PARAM_RETURN_TYPE,
				'message' => Loc::getMessage('AI_PROCESSING_ACTIVITY_EMPTY_RETURN_TYPE'),
			];
		}
		elseif ($returnType === self::RETURN_TYPE_JSON)
		{
			\Bitrix\Bizproc\Public\Helper\JsonHelper::validateJsonSchema(
				(string)($arTestProperties[self::PARAM_JSON_SCHEMA] ?? ''),
				self::PARAM_JSON_SCHEMA,
				$arErrors,
			);
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
		$formName = "",
		$popupWindow = null,
		$siteId = '',
	): PropertiesDialog
	{
		$returnType = $arCurrentValues[self::PARAM_RETURN_TYPE] ?? self::getDefaultReturnType();

		$dialog = new PropertiesDialog(
			__FILE__, [
			'documentType' => $documentType,
			'activityName' => $activityName,
			'workflowTemplate' => $arWorkflowTemplate,
			'workflowParameters' => $arWorkflowParameters,
			'workflowVariables' => $arWorkflowVariables,
			'currentValues' => $arCurrentValues,
			'formName' => $formName,
			'siteId' => $siteId,
		],
		);

		$dialog->setMap(static::getPropertiesMap($documentType, ['returnType' => $returnType]));

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
				$errors,
			);

			if (!empty($errors))
			{
				return false;
			}

			$properties[$id] = $value;
		}

		$errors = self::validateProperties(
			$properties,
			new CBPWorkflowTemplateUser(CBPWorkflowTemplateUser::CurrentUser),
		);

		if ($errors)
		{
			return false;
		}

		$properties[self::PARAM_JSON_PATH] = \Bitrix\Bizproc\Public\Helper\JsonHelper::buildJsonPath(
			$properties[self::PARAM_JSON_SCHEMA],
			$activityName
		);

		$currentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($arWorkflowTemplate, $activityName);
		$currentActivity['Properties'] = $properties;

		return true;
	}

	protected static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [
			self::PARAM_PROMPT => [
				'Name' => Loc::getMessage('AI_PROCESSING_ACTIVITY_FIELD_PROMPT_NAME'),
				'FieldName' => self::PARAM_PROMPT,
				'Type' => FieldType::STRING,
				'Required' => true,
			],
			self::PARAM_ENGINE => [
				'Name' => Loc::getMessage('AI_PROCESSING_ACTIVITY_FIELD_ENGINE_NAME'),
				'FieldName' => self::PARAM_ENGINE,
				'Type' => FieldType::SELECT,
				'Required' => true,
				'Options' => self::getAvailableAiEngines(),
				'Default' => self::getDefaultAiEngineCode(),
				'Settings' => ['ShowEmptyValue' => false],
			],
			self::PARAM_RETURN_TYPE => [
				'Name' => Loc::getMessage('AI_PROCESSING_ACTIVITY_FIELD_RETURN_TYPE'),
				'FieldName' => self::PARAM_RETURN_TYPE,
				'Type' => FieldType::SELECT,
				'Required' => true,
				'Options' => self::getAvailableReturnTypes(),
				'Default' => self::getDefaultReturnType(),
				'Settings' => ['ShowEmptyValue' => false],
			],
			self::PARAM_JSON_SCHEMA => [
				'Name' => Loc::getMessage('AI_PROCESSING_ACTIVITY_FIELD_JSON_SCHEMA_NAME'),
				'FieldName' => self::PARAM_JSON_SCHEMA,
				'Type' => FieldType::TEXT,
				'Required' => false,
				'Multiple' => false,
				'Default' => '',
				'Description' => Loc::getMessage('AI_PROCESSING_ACTIVITY_FIELD_JSON_SCHEMA_DESC'),
			],
		];
	}

	private function getUserPromptWithSystemPrePrompt(): string
	{
		$userPrompt = (string)$this->{self::PARAM_PROMPT};
		if (class_exists('\Bitrix\Bizproc\Public\Integration\AI\Service\ObfuscationService'))
		{
			$userPrompt = ServiceLocator::getInstance()
				->get(\Bitrix\Bizproc\Public\Integration\AI\Service\ObfuscationService::class)
				->prepareTextForSending($userPrompt)
			;
		}

		return "{$this->getSystemPrompt()}\n___\n{$userPrompt}";
	}

	private function getSystemPrompt(): string
	{
		return "Do not use markdown. \n" . $this->getJsonOutputSchemaIfNeeded();
	}

	private function getJsonOutputSchemaIfNeeded(): string
	{
		if ($this->{self::PARAM_RETURN_TYPE} === self::RETURN_TYPE_STRING)
		{
			return 'Only plain-text.';
		}

		return "Answer by JSON declared in this schema ```{$this->{self::PARAM_JSON_SCHEMA}}```.\n";
	}

	private function isQueueHashIncorrect(array $arEventParameters): bool
	{
		$eventQueueHash = $this->extractFirstStringFromEventParams($arEventParameters);

		return $eventQueueHash !== $this->queueHash;
	}

	private function handleSuccessEventResult(array $arEventParameters): void
	{
		$result = $this->extractAiResultFromEventParams($arEventParameters);
		if ($result === null)
		{
			$this->logError(Loc::getMessage('AI_PROCESSING_ACTIVITY_QUEUE_UNEXPECTED_RESULT'));
		}
		else
		{
			$processed = \Bitrix\Bizproc\Public\Helper\JsonHelper::processResult(
				$result->getPrettifiedData(),
				$this->{self::PARAM_RETURN_TYPE} ?? '',
			);
			$this->writeToTrackingService(
				Loc::getMessage(
					'AI_PROCESSING_ACTIVITY_QUEUE_RESULT',
					[
						'#RESULT#' => $processed,
					],
				),
			);

			$this->prepareJsonSchemaFields();

			$this->{self::RETURN_PARAM_AI_RESULT} = $processed;
		}
	}

	private function handleFailEventResult(array $arEventParameters): void
	{
		$error = $this->extractErrorFromParams($arEventParameters);
		if ($error instanceof Error)
		{
			$this->logError(
				Loc::getMessage(
					'AI_PROCESSING_ACTIVITY_QUEUE_FAIL',
					[
						'#MESSAGE#' => $error->getMessage(),
						'#CODE#' => $error->getCode(),
					],
				),
			);
		}
		else
		{
			$this->logError(Loc::getMessage('AI_PROCESSING_ACTIVITY_QUEUE_UNEXPECTED_FAIL'));
		}
	}

	private function extractErrorFromParams(array $arEventParameters): ?Error
	{
		foreach ($arEventParameters as $key => $value)
		{
			if (is_numeric($key) && $value instanceof Error)
			{
				return $value;
			}
		}

		return null;
	}

	private function extractFirstStringFromEventParams(array $arEventParameters): ?string
	{
		foreach ($arEventParameters as $key => $value)
		{
			if (is_numeric($key) && is_string($value))
			{
				return $value;
			}
		}

		return null;
	}

	private function extractAiResultFromEventParams(array $arEventParameters): ?\Bitrix\AI\Result
	{
		foreach ($arEventParameters as $key => $value)
		{
			if (is_numeric($key) && $value instanceof \Bitrix\AI\Result)
			{
				return $value;
			}
		}

		return null;
	}

	/**
	 * @return array<string, string>
	 * @throws \Bitrix\Main\LoaderException
	 */
	private static function getAvailableAiEngines(): array
	{
		if (!Loader::includeModule('ai'))
		{
			return [];
		}

		$textCategory = \Bitrix\AI\Engine::CATEGORIES['text'];
		$providerParams = \Bitrix\AI\Tuning\Defaults::getProviderSelectFieldParams($textCategory);
		$options = $providerParams['options'] ?? [];
		$availableEngines = [];
		$context = new \Bitrix\AI\Context('bizproc', 'chatHistory');
		foreach ($options as $engineCode => $engineName)
		{
			$engine = \Bitrix\AI\Engine::getByCode($engineCode, $context);
			if ($engine)
			{
				$availableEngines[$engineCode] = $engineName;
			}
		}

		return $availableEngines;
	}

	private static function getDefaultAiEngineCode(): ?string
	{
		if (!Loader::includeModule('ai'))
		{
			return null;
		}

		$textCategory = \Bitrix\AI\Engine::CATEGORIES['text'];
		$context = new \Bitrix\AI\Context('bizproc', 'chatHistory');

		return \Bitrix\AI\Engine::getByCategory($textCategory, $context)?->getCode();
	}

	private function makeAiContext(): \Bitrix\AI\Context
	{
		if (!class_exists('\Bitrix\Bizproc\Public\Event\ParameterBuilder\AI\Context\ChatHistoryEventParametersBuilder'))
		{
			return \Bitrix\AI\Context::getFake();
		}

		$workflowTriggerData = (array)($this->getRootActivity()->{\CBPDocument::PARAM_TRIGGER_EVENT_DATA} ?? []);
		$builder = new ChatHistoryEventParametersBuilder($workflowTriggerData);
		if (!$builder->isSupported())
		{
			return \Bitrix\AI\Context::getFake();
		}

		$context = new \Bitrix\AI\Context($builder->getContextModule(), $builder->getContextId());
		$context->setParameters($builder->getParams());

		return $context;
	}

	private static function getAvailableReturnTypes(): array
	{
		return [
			self::RETURN_TYPE_STRING => Loc::getMessage('AI_PROCESSING_ACTIVITY_RETURN_TYPE_STRING'),
			self::RETURN_TYPE_JSON => Loc::getMessage('AI_PROCESSING_ACTIVITY_RETURN_TYPE_JSON'),
		];
	}

	private static function getDefaultReturnType(): string
	{
		return self::RETURN_TYPE_STRING;
	}

	public function __get(mixed $name)
	{
		if ($this->getPropertyType($name)['Type'] === FieldType::JSON)
		{
			return \Bitrix\Bizproc\Public\Helper\JsonHelper::extractValueByPath(
				explode('.', $name),
				$this->{self::RETURN_PARAM_AI_RESULT}
			);
		}

		return parent::__get($name);
	}

	private function prepareJsonSchemaFields(): void
	{
		if ($this->{self::PARAM_RETURN_TYPE} === self::RETURN_TYPE_JSON)
		{
			$virtualFields = \Bitrix\Bizproc\Public\Helper\JsonHelper::buildJsonPath(
				$this->{self::PARAM_JSON_SCHEMA},
				$this->getName(),
			);

			foreach ($virtualFields as $field)
			{
				$this->setPropertiesTypes(
					[
						$field['Id'] => [
							'Type' => FieldType::JSON,
						],
					],
				);
			}
		}
	}

	private function logError(?string $message): void
	{
		if (empty($message))
		{
			return;
		}

		$this->trackError($message);
		$this->{self::RETURN_PARAM_ERROR_MESSAGE} = $message;
	}

	private function getExpiresIn(): int
	{
		return (int)\Bitrix\Main\Config\Option::get('ai', 'ai_processing_expires_in', self::DEFAULT_EXPIRES_IN);
	}
}
