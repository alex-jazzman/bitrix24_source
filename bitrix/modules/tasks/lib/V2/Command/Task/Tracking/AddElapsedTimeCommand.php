<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Tracking;

use Bitrix\Main\Error;
use Bitrix\Tasks\V2\Command\AbstractCommand;
use Bitrix\Tasks\V2\Entity\Task\ElapsedTime;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Exception\Task\ElapsedTimeException;
use Bitrix\Tasks\V2\Result;

class AddElapsedTimeCommand extends AbstractCommand
{
	public function __construct(
		public readonly ElapsedTime $elapsedTime
	)
	{

	}
	protected function execute(): Result
	{
		$result = new Result();

		$elapsedTimeService = Container::getInstance()->getElapsedTimeService();

		$handler = new AddElapsedTimeHandler($elapsedTimeService);

		try
		{
			$elapsedTime = $handler($this);

			return $result->setObject($elapsedTime);
		}
		catch (ElapsedTimeException $e)
		{
			return $result->addError(Error::createFromThrowable($e));
		}
	}
}