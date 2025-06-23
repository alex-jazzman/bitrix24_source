<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Attention;

use Bitrix\Main\Error;
use Bitrix\Main\Validation\Rule\PositiveNumber;
use Bitrix\Tasks\V2\Command\AbstractCommand;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Exception\Task\UserOptionException;
use Bitrix\Tasks\V2\Result;

class UnmuteTaskCommand extends AbstractCommand
{
	public function __construct(
		#[PositiveNumber]
		public readonly int $taskId,
		#[PositiveNumber]
		public readonly int $userId,
	)
	{

	}

	protected function execute(): Result
	{
		$userOptionService = Container::getInstance()->getUserOptionService();

		$handler = new UnmuteTaskHandler($userOptionService);

		$result = new Result();

		try
		{
			$handler($this);
		}
		catch (UserOptionException $e)
		{
			return $result->addError(Error::createFromThrowable($e));
		}

		return $result;
	}
}