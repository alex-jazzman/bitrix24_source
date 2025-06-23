<?php

declare(strict_types=1);


namespace Bitrix\Tasks\V2\Internals\Control\Task\Action\Add;

use Bitrix\Main\ArgumentException;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\SystemException;
use Bitrix\Tasks\Control\Exception\TaskAddException;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Trait\ConfigTrait;
use Bitrix\Tasks\Control\Handler\TaskFieldHandler;
use Bitrix\Tasks\Internals\TaskObject;
use Exception;

class Insert
{
	use ConfigTrait;

	/**
	 * @throws TaskAddException
	 */
	public function __invoke(array $fields): TaskObject
	{
		try
		{
			$task = $this->insert($fields);
		}
		catch (Exception $exception)
		{
			// $this->handleAnalytics($fields, false);
			(new SendAnalytics($this->config))($fields, false);

			throw new TaskAddException($exception->getMessage());
		}

		return $task;
	}

	/**
	 * @throws TaskAddException
	 * @throws SystemException
	 * @throws ArgumentException
	 */
	private function insert(array $fields): TaskObject
	{
		$handler = new TaskFieldHandler($this->config->getUserId(), $fields);
		$fields = $handler->skipTimeZoneFields(...$this->config->getSkipTimeZoneFields())->getFieldsToDb();

		$task = new TaskObject($fields);
		$result = $task->save();

		if (!$result->isSuccess())
		{
			$messages = $result->getErrorMessages();
			$message = Loc::getMessage('TASKS_UNKNOWN_ADD_ERROR');
			if (!empty($messages))
			{
				$message = array_shift($messages);
			}

			throw new TaskAddException($message);
		}

		return $task;
	}
}
