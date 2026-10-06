<?php

declare(strict_types=1);

use Bitrix\Bizproc\Public\Entity\Trigger\Section;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiAgentRestartTrigger extends \Bitrix\Bizproc\Activity\BaseTrigger
{
	private const RETURN_PARAM_RESTART_RUN_ID = 'restartRunId';
	private const RETURN_PARAM_PREVIOUS_RUN_ID = 'previousRunId';
	private const RETURN_PARAM_INITIATOR_ID = 'initiatorId';
	private const RETURN_PARAM_TIMESTAMP = 'timestamp';
	private const RETURN_PARAM_RUN_TYPE = 'runType';

	private const RUN_TYPE_RESTART = 'restart';

	private const VARIABLE_RUN_TYPE = 'runType';
	private const VARIABLE_RESTART_RUN_ID = 'restartRunId';

	private const AI_SECTION_ID = 'AI_AGENT';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			'Title' => '',
			//return
			self::RETURN_PARAM_RESTART_RUN_ID => null,
			self::RETURN_PARAM_PREVIOUS_RUN_ID => null,
			self::RETURN_PARAM_INITIATOR_ID => null,
			self::RETURN_PARAM_TIMESTAMP => null,
			self::RETURN_PARAM_RUN_TYPE => null,
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_RESTART_RUN_ID => [
				'Type' => \Bitrix\Bizproc\FieldType::STRING,
			],
			self::RETURN_PARAM_PREVIOUS_RUN_ID => [
				'Type' => \Bitrix\Bizproc\FieldType::STRING,
			],
			self::RETURN_PARAM_INITIATOR_ID => [
				'Type' => \Bitrix\Bizproc\FieldType::USER,
			],
			self::RETURN_PARAM_TIMESTAMP => [
				'Type' => \Bitrix\Bizproc\FieldType::INT,
			],
			self::RETURN_PARAM_RUN_TYPE => [
				'Type' => \Bitrix\Bizproc\FieldType::STRING,
			],
		]);
	}

	public function execute(): int
	{
		$nodeAvailabilityLocator = \Bitrix\Main\DI\ServiceLocator::getInstance();
		if ($nodeAvailabilityLocator->has(\Bitrix\Bizproc\Public\Service\AiAgent\NodeAvailabilityServiceInterface::class))
		{
			$nodeAvailabilityService = $nodeAvailabilityLocator->get(
				\Bitrix\Bizproc\Public\Service\AiAgent\NodeAvailabilityServiceInterface::class
			);
			if (!$nodeAvailabilityService->isAvailable())
			{
				$this->trackError($nodeAvailabilityService->getUnavailableError()->getMessage());

				return CBPActivityExecutionStatus::Closed;
			}
		}

		$context = $this->getRootActivity()->{\CBPDocument::PARAM_TRIGGER_EVENT_DATA} ?? [];

		$restartRunId = (string)($context[self::RETURN_PARAM_RESTART_RUN_ID] ?? '');
		$previousRunId = (string)($context[self::RETURN_PARAM_PREVIOUS_RUN_ID] ?? '');
		$initiatorId = (int)($context[self::RETURN_PARAM_INITIATOR_ID] ?? 0);
		$timestamp = (int)($context[self::RETURN_PARAM_TIMESTAMP] ?? 0);
		$runType = (string)($context[self::RETURN_PARAM_RUN_TYPE] ?? '');
		if ($runType === '')
		{
			$runType = self::RUN_TYPE_RESTART;
		}

		$this->{self::RETURN_PARAM_RESTART_RUN_ID} = $restartRunId;
		$this->{self::RETURN_PARAM_PREVIOUS_RUN_ID} = $previousRunId;
		if ($initiatorId)
		{
			$this->{self::RETURN_PARAM_INITIATOR_ID} = "user_{$initiatorId}";
		}
		$this->{self::RETURN_PARAM_TIMESTAMP} = $timestamp;
		$this->{self::RETURN_PARAM_RUN_TYPE} = $runType;

		// Keep the restart marker on the workflow itself so later steps can read it
		// even when the trigger return-property scope is limited to the input node.
		$this->setVariable(self::VARIABLE_RUN_TYPE, $runType);
		$this->setVariable(self::VARIABLE_RESTART_RUN_ID, $restartRunId);

		return CBPActivityExecutionStatus::Closed;
	}

	public static function getPropertiesMap(array $documentType, array $context = []): array
	{
		return [];
	}

	public function createApplyRules(): array
	{
		return [];
	}

	public function checkApplyRules(array $rules, \Bitrix\Bizproc\Activity\Trigger\TriggerParameters $parameters): \Bitrix\Bizproc\Result
	{
		return \Bitrix\Bizproc\Result::createOk();
	}

	protected function getSection(): ?Section
	{
		return new Section(self::AI_SECTION_ID);
	}

	protected static function getModuleId(): ?string
	{
		return 'ai';
	}
}
