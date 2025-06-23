<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Deadline;

use Bitrix\Main\Error;
use Bitrix\Main\Validation\Rule\Min;
use Bitrix\Main\Validation\Rule\PositiveNumber;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;
use Bitrix\Tasks\V2\Result;
use Bitrix\Tasks\V2\Command\AbstractCommand;
use Exception;

class UpdateDeadlineCommand extends AbstractCommand
{
	public function __construct(
		#[PositiveNumber]
		public readonly int          $taskId,
		#[Min(0)]
		public readonly int          $deadlineTs,
		public readonly UpdateConfig $config,
	)
	{

	}

	protected function execute(): Result
	{
		$result = new Result();

		$consistencyResolver = Container::getInstance()->getConsistencyResolver();
		$updateService = Container::getInstance()->getUpdateService();

		$handler = new UpdateDeadlineHandler($consistencyResolver, $updateService);

		try
		{
			$task = $handler($this);

			return $result->setObject($task);
		}
		catch (Exception $e)
		{
			return $result->addError(Error::createFromThrowable($e));
		}
	}
}
