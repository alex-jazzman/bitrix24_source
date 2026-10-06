<?php

declare(strict_types=1);

use Bitrix\Bizproc\Public\Entity\Trigger\Section;
use Bitrix\Main\Type\DateTime;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiAgentStartTrigger extends \Bitrix\Bizproc\Activity\BaseTrigger
{
	private const RETURN_PARAM_STARTED_BY = 'startedBy';
	private const RETURN_PARAM_EVENT_DATE_TIME = 'EventDateTime';
	private const AI_SECTION_ID = 'AI_AGENT';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			'Title' => '',
			//return
			self::RETURN_PARAM_STARTED_BY => null,
			self::RETURN_PARAM_EVENT_DATE_TIME => null,
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_STARTED_BY => [
				'Type' => \Bitrix\Bizproc\FieldType::USER,
			],
			self::RETURN_PARAM_EVENT_DATE_TIME => [
				'Type' => \Bitrix\Bizproc\FieldType::DATETIME,
			],
		]);
	}

	public function execute(): int
	{
		$nodeAvailabilityLocator = \Bitrix\Main\DI\ServiceLocator::getInstance();
		if ($nodeAvailabilityLocator->has(\Bitrix\Bizproc\Public\Service\AiAgent\NodeAvailabilityServiceInterface::class))
		{
			$nodeAvailabilityService = $nodeAvailabilityLocator->get(
				\Bitrix\Bizproc\Public\Service\AiAgent\NodeAvailabilityServiceInterface::class,
			);
			if (!$nodeAvailabilityService->isAvailable())
			{
				$this->trackError($nodeAvailabilityService->getUnavailableError()->getMessage());

				return CBPActivityExecutionStatus::Closed;
			}
		}

		$this->{self::RETURN_PARAM_EVENT_DATE_TIME} = (new DateTime())->format(DateTime::getFormat());

		$context = $this->getRootActivity()->{\CBPDocument::PARAM_TRIGGER_EVENT_DATA} ?? [];
		$startedByInt = (int)($context[self::RETURN_PARAM_STARTED_BY] ?? 0);
		if ($startedByInt)
		{
			$this->{self::RETURN_PARAM_STARTED_BY} = "user_{$startedByInt}";
		}

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
