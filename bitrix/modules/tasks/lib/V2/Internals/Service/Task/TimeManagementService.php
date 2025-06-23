<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Service\Task;

use Bitrix\Tasks\Control\Exception\TaskNotFoundException;
use Bitrix\Tasks\Integration\Pull\PushCommand;
use Bitrix\Tasks\V2\Entity\Task;
use Bitrix\Tasks\V2\Entity\Task\Elapsed\Source;
use Bitrix\Tasks\V2\Entity\Task\ElapsedTime;
use Bitrix\Tasks\V2\Entity\Task\Timer;
use Bitrix\Tasks\V2\Internals\Exception\Task\TimerNotFoundException;
use Bitrix\Tasks\V2\Internals\Repository\TimerRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Service\CacheService;
use Bitrix\Tasks\V2\Internals\Service\PushService;
use Bitrix\Tasks\V2\Entity\Task\Status;
use Bitrix\Tasks\V2\Entity\UserCollection;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;
use Bitrix\Tasks\V2\Internals\Repository\ElapsedTimeRepositoryInterface;
use Bitrix\Tasks\V2\Internals\Repository\TaskRepositoryInterface;
use Bitrix\Tasks\Util\User;

class TimeManagementService
{
	public function __construct(
		private readonly TaskRepositoryInterface $taskRepository,
		private readonly TimerRepositoryInterface $timerRepository,
		private readonly ElapsedTimeRepositoryInterface $elapsedTimeRepository,
		private readonly TimerService $timerService,
		private readonly PlannerService $plannerService,
		private readonly StatusService $statusService,
		private readonly ElapsedTimeService $elapsedTimeService,
		private readonly PushService $pushService,
		private readonly CacheService $cacheService,
	)
	{

	}

	public function startTimer(
		int $userId,
		int $taskId,
		bool $syncPlan = true,
		bool $canStart = false,
		bool $canRenew = false,
	): Timer
	{
		try
		{
			$this->stopTimer($userId, $taskId);
		}
		catch (TimerNotFoundException)
		{

		}

		$task = $this->taskRepository->getById($taskId);
		if ($task === null)
		{
			throw new TaskNotFoundException('Task not found');
		}

		$timer = $this->timerService->start($userId, $taskId);

		$affectedUsers = $this->getAffectedUserIds($task, $userId);

		$this->cacheService->clearByTagMulti('tasks_user', $affectedUsers);

		if ($syncPlan)
		{
			$this->plannerService->merge($userId, [$taskId], []);
		}

		if ($task->status !== Status::InProgress)
		{
			if ($canStart)
			{
				$this->statusService->start($taskId, new UpdateConfig($userId));
			}
			elseif ($canRenew)
			{
				$this->statusService->renew($taskId, new UpdateConfig($userId));
			}
		}

		$timeSpent = $this->elapsedTimeRepository->getSum($taskId);

		$parameters = [
			'taskId' => $taskId,
			'timeElapsed' => $timeSpent + (time() - (int)$timer->startedAtTs),
		];

		$this->pushService->addEventByParameters(
			UserCollection::mapFromIds([$userId]),
			PushCommand::TASK_TIMER_STARTED,
			$parameters,
		);

		return $timer;
	}

	public function stopTimer(int $userId, int $taskId = 0): Timer
	{
		$timer = $this->timerService->stop($userId, $taskId);
		if ($timer === null || $timer->seconds <= 0)
		{
			throw new TimerNotFoundException();
		}

		$userOffset = User::getTimeZoneOffset($userId);

		$startTs = $timer->startedAtTs + $userOffset;
		$stopTs = $startTs + $timer->seconds;

		$elapsedTime = new ElapsedTime(
			userId:      $userId,
			taskId:      $taskId,
			seconds:     $timer->seconds,
			source:      Source::System,
			text:        '',
			createdAtTs: $startTs,
			startTs:     $startTs,
			stopTs:      $stopTs,
		);

		[, $timeSpent] = $this->elapsedTimeService->add($elapsedTime);

		if ($taskId <= 0)
		{
			return $timer;
		}

		$task = $this->taskRepository->getById($taskId);
		if ($task === null)
		{
			throw new TaskNotFoundException('Task not found');
		}

		$affectedUserIds = $this->getAffectedUserIds($task, $userId);

		$this->cacheService->clearByTagMulti('tasks_user', $affectedUserIds);

		$timeElapsed = [
			$userId => $timeSpent,
		];

		$timers = $this->timerRepository->getByUserIds($affectedUserIds, $taskId);

		foreach ($affectedUserIds as $affectedUserId)
		{
			if ($affectedUserId === $userId)
			{
				continue;
			}

			$timeElapsed[$affectedUserId] = $timeSpent;

			$userTimer = $timers->findOneById($affectedUserId);
			if ($userTimer !== null && $userTimer->startedAtTs > 0)
			{
				$timeElapsed[$affectedUserId] += time() - $userTimer->startedAtTs;
			}
		}

		$parameters = [
			'taskId' => $taskId,
			'userId' => $userId,
			'timeElapsed' => $timeElapsed,
		];

		$this->pushService->addEventByParameters(
			UserCollection::mapFromIds($affectedUserIds),
			PushCommand::TASK_TIMER_STOPPED,
			$parameters
		);

		return $timer;
	}

	private function getAffectedUserIds(Task $task, int $userId): array
	{
		$responsibleId = (int)$task->responsible?->getId();
		$accomplices = $task->accomplices->getIdList();

		return array_unique(
			array_merge(
				[$userId, $responsibleId],
				$accomplices
			)
		);
	}
}