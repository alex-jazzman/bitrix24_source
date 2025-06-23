<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Service\Task;

use Bitrix\Main\Localization\Loc;
use Bitrix\Tasks\Control\Exception\TaskNotExistsException;
use Bitrix\Tasks\Control\Exception\TaskStopDeleteException;
use Bitrix\Tasks\Control\Exception\WrongTaskIdException;
use Bitrix\Tasks\V2\Command\Task\DeleteTaskCommand;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\AddCounterEvent;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\AddCrmEvent;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\CleanCache;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\CollectCounter;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\Config\DeleteConfig;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\DeleteScenario;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\FullDeleteRelations;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\MoveToRecyclebin;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\PushHandler;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\RecountSort;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\RunBeforeDeleteEvent;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\RunDeleteEvent;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\RunIntegration;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\SendNotification;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\SoftDeleteRelations;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\StopTimer;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\SyncHandler;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\UnlinkTags;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\UpdateParents;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Delete\UpdateTemplates;
use Bitrix\Tasks\V2\Internals\Repository\TaskRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Service\Esg\EgressInterface;

class DeleteService
{
	public function __construct(
		private readonly TaskRepositoryInterface $repository,
		private readonly EgressInterface $egressController,
	)
	{
		
	}
	public function delete(int $taskId, DeleteConfig $config): void
	{
		if ($taskId <= 0)
		{
			throw new WrongTaskIdException();
		}

		if (!$this->repository->getById($taskId))
		{
			throw new TaskNotExistsException();
		}

		$this->loadMessages();

		$compatibilityRepository = Container::getInstance()->getTaskCompatabilityRepository();

		$fullTaskData = $compatibilityRepository->getTaskData($taskId);

		$isCanceled = !(new RunBeforeDeleteEvent($config))($fullTaskData);
		if ($isCanceled)
		{
			throw new TaskStopDeleteException();
		}

		$taskBefore = $compatibilityRepository->getTaskObject($taskId);

		(new MoveToRecyclebin($config))($fullTaskData);

		(new CollectCounter())($fullTaskData);

		(new AddCrmEvent($config))($fullTaskData);

		(new StopTimer())($fullTaskData);

		(new SoftDeleteRelations($config))($fullTaskData);

		(new FullDeleteRelations($config))($fullTaskData);

		(new CleanCache())($fullTaskData);

		(new RecountSort())($fullTaskData);

		(new UpdateParents())($fullTaskData);

		(new UpdateTemplates())($fullTaskData);

		(new SyncHandler($config))($fullTaskData);

		(new PushHandler($config))($fullTaskData);

		(new RunDeleteEvent($config))($fullTaskData);

		$this->repository->delete($taskId, $config->getRuntime()->isMovedToRecyclebin());

		(new DeleteScenario())($fullTaskData);

		(new UnlinkTags($config))($fullTaskData);

		(new SendNotification($config))($taskBefore);

		(new AddCounterEvent())($fullTaskData);

		(new RunIntegration($config))($fullTaskData);

		// notify external services about a deleted task
		$this->egressController->process(
			new DeleteTaskCommand(
				taskId: $taskId,
				config: $config,
			)
		);
	}
	
	private function loadMessages(): void
	{
		Loc::loadMessages($_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/tasks/lib/control/task.php');
	}
}