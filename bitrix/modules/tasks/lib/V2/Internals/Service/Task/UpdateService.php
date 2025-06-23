<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Service\Task;

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Validation\ValidationService;
use Bitrix\Tasks\Control\Exception\TaskNotExistsException;
use Bitrix\Tasks\Control\Exception\TaskUpdateException;
use Bitrix\Tasks\Internals\TaskObject;
use Bitrix\Tasks\V2\Internals\Container;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\CollectCounter;
use Bitrix\Tasks\V2\Internals\Exception\CommandValidateException;
use Bitrix\Tasks\V2\Internals\Repository\Compatibility;
use Bitrix\Tasks\Internals\Task\ScenarioTable;
use Bitrix\Tasks\Internals\Task\Status;
use Bitrix\Tasks\V2\Command\Task\UpdateTaskCommand;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\AddCounterEvent;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\AutoClose;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\CleanCache;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\CloseResult;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Pin;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\PostComment;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\RunIntegration;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\RunUpdateEvent;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\SendNotification;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\SendPush;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\StopTimer;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateDependencies;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateHistoryLog;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateLegacyFiles;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateMembers;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateParameters;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateSearchIndex;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateSync;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateTags;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateTopic;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateUserOptions;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\UpdateViews;
use Bitrix\Tasks\V2\Internals\Repository\TaskRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Service\Esg\EgressInterface;
use Bitrix\Tasks\V2\Entity;
use Bitrix\Tasks\V2\Internals\Service\Task\Prepare\Update\EntityFieldService;
use CTaskLog;

class UpdateService
{
	public function __construct(
		private readonly TaskRepositoryInterface $repository,
		private readonly EgressInterface $egressController,
		private readonly ValidationService $validationService,
	)
	{

	}

	/**
	 * @throws TaskNotExistsException
	 * @throws TaskUpdateException
	 */
	public function update(
		Entity\Task $task,
		UpdateConfig $config,
	): array
	{
		$this->loadMessages();

		$entityBefore = $this->repository->getById($task->getId());
		if ($entityBefore === null)
		{
			throw new TaskNotExistsException();
		}

		// we do validation here, because we need merge states and get new entity to check
		$this->validate($entityBefore, $task);

		$compatibilityRepository = Container::getInstance()->getTaskCompatabilityRepository();

		$fullTaskData = $compatibilityRepository->getTaskData($task->getId());

		/**
		 * @var Entity\Task $task
		 * @var array $fields
		 */
		[$task, $fields] = (new EntityFieldService())->prepare($task, $config, $fullTaskData);

		$taskObjectBeforeUpdate = $compatibilityRepository->getTaskObject($task->getId());

		(new CollectCounter())($task->getId());

		$id = $this->repository->save($task);

		$fields['ID'] = $id;

		$changes = $this->getChanges($fields, $fullTaskData);

		(new UpdateMembers($config))($fields, $fullTaskData, $changes);

		(new UpdateParameters($config))($fields, $fullTaskData);

		(new UpdateLegacyFiles($config))($fields, $fullTaskData, $changes);

		(new UpdateTags($config))($fields, $fullTaskData, $changes);

		(new UpdateDependencies($config))($fields, $fullTaskData);

		/**
		 * @var array $sourceTaskData
		 * @var array $fullTaskData
		 * @var TaskObject $task
		 * @var array $fields
		 */
		[$sourceTaskData, $fullTaskData, $task, $fields] = $this->reload($fields, $fullTaskData);

		(new StopTimer())($fullTaskData);

		(new UpdateHistoryLog($config))($fullTaskData, $changes);

		(new AutoClose($config))($fields, $fullTaskData);

		(new SendNotification($config))($fields, $fullTaskData, $sourceTaskData, $task);

		(new UpdateSearchIndex())($fullTaskData, $fields);

		(new UpdateSync())($fields, $sourceTaskData);

		$fields = (new RunUpdateEvent($config))($fields, $sourceTaskData);

		(new CleanCache($config))($fullTaskData);

		(new UpdateViews())($fullTaskData, $sourceTaskData);

		(new UpdateUserOptions())($fields, $sourceTaskData);

		(new AddCounterEvent($config))($fullTaskData, $sourceTaskData);

		(new CloseResult($config))($fullTaskData);

		(new Pin())($fullTaskData, $sourceTaskData);

		(new UpdateTopic())($fullTaskData, $sourceTaskData);

		(new PostComment($config))($fields, $sourceTaskData, $changes);

		(new SendPush($config))($fullTaskData, $sourceTaskData, $changes);

		(new RunIntegration($config))($fields, $taskObjectBeforeUpdate);

		// get task object with prepopulated data
		$taskAfterUpdate = $this->repository->getById($task->getId());
		if ($taskAfterUpdate === null)
		{
			throw new TaskNotExistsException();
		}

		// notify external services about updated task
		$this->egressController->process(new UpdateTaskCommand(
			task: $taskAfterUpdate,
			config: $config,
			taskBeforeUpdate: $entityBefore,
		));

		return [$taskAfterUpdate, $fields];
	}

	private function getChanges(array $fields, array $fullTaskData): array
	{
		if (isset($fullTaskData['DURATION_PLAN']))
		{
			unset($fullTaskData['DURATION_PLAN']);
		}

		if (isset($fields['DURATION_PLAN']))
		{
			// at this point, $arFields['DURATION_PLAN'] in seconds
			$fields['DURATION_PLAN_SECONDS'] = $fields['DURATION_PLAN'];
			unset($fields['DURATION_PLAN']);
		}

		return CTaskLog::GetChanges($fullTaskData, $fields);
	}

	/**
	 * @throws TaskNotExistsException
	 */
	private function reload(array $fields, array $fullTaskData): array
	{
		$compatibilityRepository = Container::getInstance()->getTaskCompatabilityRepository();

		$sourceTaskData = $fullTaskData;

		$fullTaskData = $compatibilityRepository->getTaskData($fullTaskData['ID']);

		$currentStatus = (int)$fullTaskData['REAL_STATUS'];
		$prevStatus = (int)$sourceTaskData['REAL_STATUS'];
		$statusChanged =
			$currentStatus !== $prevStatus
			&& $currentStatus >= Status::NEW
			&& $currentStatus <= Status::DECLINED;

		if ($statusChanged)
		{
			$fullTaskData['STATUS_CHANGED'] = true;

			if ($currentStatus === Status::DECLINED)
			{
				$fullTaskData['DECLINE_REASON'] = $fields['DECLINE_REASON'];
			}
		}

		$fields['ID'] = $fullTaskData['ID'];

		$task = $compatibilityRepository->getTaskObject($fullTaskData['ID']);

		$scenarioObject = $task->getScenario();

		$fields['SCENARIO'] = is_null($scenarioObject) ? ScenarioTable::SCENARIO_DEFAULT
			: $scenarioObject->getScenario();

		return [$sourceTaskData, $fullTaskData, $task, $fields];
	}

	/**
	 * @throws CommandValidateException
	 */
	private function validate(Entity\Task $entityBefore, Entity\Task $entityAfter): void
	{
		$props = array_filter($entityAfter->toArray());

		$validationResult = $this->validationService->validate($entityBefore->cloneWith($props));
		if (!$validationResult->isSuccess())
		{
			throw new CommandValidateException($validationResult->getError()?->getMessage());
		}
	}

	private function loadMessages(): void
	{
		Loc::loadMessages($_SERVER['DOCUMENT_ROOT'] . BX_ROOT . '/modules/tasks/lib/control/task.php');
	}
}