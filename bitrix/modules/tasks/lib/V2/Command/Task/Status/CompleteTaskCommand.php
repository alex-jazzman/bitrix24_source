<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Status;

use Bitrix\Main\Error;
use Bitrix\Main\Validation\Rule\PositiveNumber;
use Bitrix\Tasks\V2\Command\AbstractCommand;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;
use Bitrix\Tasks\V2\Result;
use Exception;

class CompleteTaskCommand extends AbstractCommand
{
	public function __construct(
		#[PositiveNumber]
		public readonly int $taskId,
		public readonly UpdateConfig $config,
	)
	{

	}

	protected function execute(): Result
	{
		$result = new Result();

		$statusService = Container::getInstance()->getStatusService();
		$consistencyResolver = Container::getInstance()->getConsistencyResolver();

		$handler = new CompleteTaskHandler($statusService, $consistencyResolver);

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