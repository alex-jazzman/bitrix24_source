<?php

declare(strict_types=1);

use Bitrix\Bizproc\Public\Entity\Trigger\Section;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiAgentStartTrigger extends \Bitrix\Bizproc\Activity\BaseTrigger
{
	private const RETURN_PARAM_STARTED_BY = 'startedBy';
	private const AI_SECTION_ID = 'AI_AGENT';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			'Title' => '',
			//return
			self::RETURN_PARAM_STARTED_BY => null,
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_STARTED_BY => [
				'Type' => \Bitrix\Bizproc\FieldType::USER,
			],
		]);
	}

	public function execute(): int
	{
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
