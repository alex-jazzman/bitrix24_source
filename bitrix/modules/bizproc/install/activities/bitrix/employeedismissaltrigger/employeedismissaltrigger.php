<?php

declare(strict_types=1);

use Bitrix\Bizproc\Activity\Trigger\TriggerParameters;
use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Public\Entity\Trigger\Section;
use Bitrix\Bizproc\Result;
use Bitrix\Main\Type\DateTime;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPEmployeeDismissalTrigger extends \Bitrix\Bizproc\Activity\BaseTrigger
{
	private const RETURN_PARAM_USER_ID = 'userId';
	private const RETURN_PARAM_FIRED_AT = 'firedAt';
	private const RETURN_PARAM_NAME = 'name';
	private const RETURN_PARAM_LAST_NAME = 'lastName';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->arProperties = [
			'Title' => '',
			self::RETURN_PARAM_USER_ID => null,
			self::RETURN_PARAM_FIRED_AT => null,
			self::RETURN_PARAM_NAME => '',
			self::RETURN_PARAM_LAST_NAME => '',
		];

		$this->setPropertiesTypes([
			self::RETURN_PARAM_USER_ID => [
				'Type' => FieldType::USER,
			],
			self::RETURN_PARAM_FIRED_AT => [
				'Type' => FieldType::DATETIME,
			],
			self::RETURN_PARAM_NAME => [
				'Type' => FieldType::STRING,
			],
			self::RETURN_PARAM_LAST_NAME => [
				'Type' => FieldType::STRING,
			],
		]);
	}

	public function execute(): int
	{
		$context = $this->getEventData();

		$userId = (int)($context[self::RETURN_PARAM_USER_ID] ?? 0);
		if ($userId > 0)
		{
			$this->arProperties[self::RETURN_PARAM_USER_ID] = "user_{$userId}";
		}

		$firedAt = $context[self::RETURN_PARAM_FIRED_AT] ?? null;
		$firedAtTimestamp = filter_var($firedAt, FILTER_VALIDATE_INT);
		if ($firedAtTimestamp !== false && $firedAtTimestamp > 0)
		{
			$this->arProperties[self::RETURN_PARAM_FIRED_AT] = DateTime::createFromTimestamp($firedAtTimestamp);
		}
		elseif (is_string($firedAt) && DateTime::isCorrect($firedAt))
		{
			$this->arProperties[self::RETURN_PARAM_FIRED_AT] = new DateTime($firedAt);
		}

		$this->arProperties[self::RETURN_PARAM_NAME] = (string)($context[self::RETURN_PARAM_NAME] ?? '');
		$this->arProperties[self::RETURN_PARAM_LAST_NAME] = (string)($context[self::RETURN_PARAM_LAST_NAME] ?? '');

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

	public function checkApplyRules(array $rules, TriggerParameters $parameters): Result
	{
		return Result::createOk();
	}

	protected function getSection(): ?Section
	{
		return null;
	}

	protected static function getModuleId(): ?string
	{
		return 'bizproc';
	}
}
