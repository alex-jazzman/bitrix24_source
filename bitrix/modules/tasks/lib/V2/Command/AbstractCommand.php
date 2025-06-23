<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command;

use Bitrix\Main\Validation\ValidationResult;
use Bitrix\Tasks\DI\Container;
use Bitrix\Tasks\V2\Internals\Exception\CommandException;
use Bitrix\Tasks\V2\Internals\Exception\CommandValidateException;
use Bitrix\Tasks\V2\Result;
use Exception;

abstract class AbstractCommand implements CommandInterface
{
	abstract protected function execute(): Result;

	protected function validate(): ValidationResult
	{
		return Container::getInstance()->getValidationService()->validate($this);
	}

	protected function beforeRun(): void
	{
	}

	protected function afterRun(): void
	{
	}

	/**
	 * @throws CommandException
	 * @throws CommandValidateException
	 */
	public function run(): Result
	{
		$validationResult = $this->validate();
		if (!$validationResult->isSuccess())
		{
			$error = $validationResult->getError();

			throw new CommandValidateException("[{$error?->getCode()}]: {$error?->getMessage()}");
		}

		try
		{
			$this->beforeRun();

			$result = $this->execute();

			$this->afterRun();

			return $result;
		}
		catch (Exception $e)
		{
			throw new CommandException($e->getMessage(), $e->getCode());
		}
	}

	public function runInBackground(): bool
	{
		return false;
	}

	public function runWithDelay(int $milliseconds): bool
	{
		return false;
	}
}
