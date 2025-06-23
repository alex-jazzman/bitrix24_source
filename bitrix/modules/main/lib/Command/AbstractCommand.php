<?php

declare(strict_types=1);

namespace Bitrix\Main\Command;

use Bitrix\Main\Command\Exception\CommandException;
use Bitrix\Main\Command\Exception\CommandValidationException;
use Bitrix\Main\Error;
use Bitrix\Main\Result;

abstract class AbstractCommand implements CommandInterface
{
	/**
	 * {@inheritDoc}
	 */
	final public function run(): Result
	{
		if (!$this->validate())
		{
			throw new CommandValidationException($this->getValidationErrors());
		}

		if ($errorResult = $this->beforeRun())
		{
			return $errorResult;
		}

		try
		{
			$result = $this->execute();
		}
		catch (\Exception $e)
		{
			throw new CommandException($this, 'Command has unprocessed exception', previous: $e);
		}

		$this->afterRun();

		return $result;
	}

	abstract protected function execute(): Result;

	protected function validate(): bool
	{
		return true;
	}

	/**
	 * If the method returns a value then the command should not be executed
	 */
	protected function beforeRun(): ?Result
	{
		return null;
	}

	protected function afterRun(): void
	{
	}

	/**
	 * @return Error[]
	 */
	private function getValidationErrors(): array
	{
		return [];
	}
}
