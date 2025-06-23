<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Command\Task\Audit;

use Bitrix\Main\Error;
use Bitrix\Main\Validation\Rule\PositiveNumber;
use Bitrix\Tasks\V2\Command\AbstractCommand;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Result;
use Exception;

class UnwatchTaskCommand extends AbstractCommand
{
	public function __construct(
		#[PositiveNumber]
		public readonly int $taskId,
		#[PositiveNumber]
		public readonly int $userId,
		#[PositiveNumber]
		public readonly int $auditorId,
	)
	{

	}

	protected function execute(): Result
	{
		$result = new Result();

		$memberRepository = Container::getInstance()->getTaskMemberRepository();
		$consistencyResolver = Container::getInstance()->getConsistencyResolver();
		$updateService = Container::getInstance()->getUpdateService();

		$handler = new UnwatchTaskHandler(
			$memberRepository,
			$consistencyResolver,
			$updateService
		);

		try
		{
			$handler($this);
		}
		catch (Exception $e)
		{
			return $result->addError(Error::createFromThrowable($e));
		}

		return $result;
	}
}