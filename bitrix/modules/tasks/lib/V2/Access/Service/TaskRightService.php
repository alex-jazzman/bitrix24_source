<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Access\Service;

use Bitrix\Tasks\Access\Model\TaskModel;
use Bitrix\Tasks\DI\Attribute\Inject;
use Bitrix\Tasks\V2\Access\Factory\ControllerFactoryInterface;
use Bitrix\Tasks\V2\Access\Factory\Type;

class TaskRightService
{
	public function __construct(
		#[Inject(locatorCode: 'tasks.access.controller.factory')]
		private readonly ControllerFactoryInterface $controllerFactory,
	)
	{

	}

	public function get(array $rules, int $taskId, int $userId): array
	{
		$controller = $this->controllerFactory->create(Type::Task, $userId);
		if ($controller === null)
		{
			return [];
		}

		$ruleChunks = [];
		foreach ($rules as $name => $rule)
		{
			$ruleChunks[$rule][] = $name;
		}

		$rules = array_fill_keys(array_keys($ruleChunks), []);

		$item = TaskModel::createFromId($taskId);

		$access = $controller->batchCheck($rules, $item);

		$result = [];
		foreach ($access as $rule => $value)
		{
			$actions = $ruleChunks[$rule];
			foreach ($actions as $name)
			{
				$result[$name] = $value;
			}
		}

		return $result;
	}
}