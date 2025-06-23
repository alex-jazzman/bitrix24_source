<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Tracking;

use Bitrix\Main\Error;
use Bitrix\Main\Validation\Rule\Min;
use Bitrix\Main\Validation\Rule\PositiveNumber;
use Bitrix\Tasks\V2\Command\AbstractCommand;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Exception\Task\TimerNotFoundException;
use Bitrix\Tasks\V2\Result;

class StopTimerCommand extends AbstractCommand
{
	public function __construct(
		#[PositiveNumber]
		public readonly int $userId,
		#[Min(0)]
		public readonly int $taskId,
	)
	{

	}

	protected function execute(): Result
	{
		$result = new Result();

		$timeManagementService = Container::getInstance()->getTimeManagementService();

		$handler = new StopTimerHandler($timeManagementService);

		try
		{
			$timer = $handler($this);

			return $result->setObject($timer);
		}
		catch (TimerNotFoundException $e)
		{
			return $result->addError(Error::createFromThrowable($e));
		}
	}
}