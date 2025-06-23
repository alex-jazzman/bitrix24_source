<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Service\Task\Prepare\Add;

use Bitrix\Tasks\Control\Handler\TariffFieldHandler;
use Bitrix\Tasks\Control\Handler\TaskFieldHandler;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\CheckUserFields;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\Config\AddConfig;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\PrepareFields;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Add\RunBeforeAddEvent;
use Bitrix\Tasks\V2\Entity;

class EntityFieldService
{
	public function prepare(Entity\Task $task, AddConfig $config): array
	{
		$mapper = Container::getInstance()->getOrmTaskMapper();
		$fields = $mapper->mapFromEntity($task);

		$fields = (new PrepareFields($config))($fields);
		$fields = (new RunBeforeAddEvent($config))($fields);

		(new CheckUserFields($config))($fields);

		$tariff = new TariffFieldHandler($fields);

		$fields = $tariff->getFields();

		$fields = $this->applyRestrictions($fields);

		$handler = new TaskFieldHandler($config->getUserId(), $fields);

		$dbFields = $handler
			->skipTimeZoneFields(...$config->getSkipTimeZoneFields())
			->getFieldsToDb();

		return [$mapper->mapToEntity($dbFields), $fields];
	}

	private function applyRestrictions(array $fields): array
	{
		$tariffService = Container::getInstance()->getTariffService();
		if (!$tariffService->isProjectAvailable((int)($fields['GROUP_ID'] ?? 0)))
		{
			unset($fields['GROUP_ID']);
		}

		if (!$tariffService->isStakeholderAvailable())
		{
			unset($fields['ACCOMPLICES'], $fields['AUDITORS']);
		}

		return $fields;
	}
}