<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Service\Task;

use Bitrix\Tasks\Control\Exception\TaskNotExistsException;
use Bitrix\Tasks\V2\Entity\Task;
use Bitrix\Tasks\V2\Entity\User;
use Bitrix\Tasks\V2\Entity\UserCollection;
use Bitrix\Tasks\V2\Internals\Control\Task\Action\Update\Config\UpdateConfig;
use Bitrix\Tasks\V2\Internals\Repository\Mapper\Trait\CastTrait;
use Bitrix\Tasks\V2\Internals\Repository\TaskRepositoryInterface;

class MemberService
{
	use CastTrait;

	public function __construct(
		private readonly UpdateService $updateService,
		private readonly TaskRepositoryInterface $taskRepository,
	)
	{

	}

	public function delegate(
		int $taskId,
		int $responsibleId,
		UpdateConfig $config
	): array
	{
		$task = $this->taskRepository->getById($taskId);
		if ($task === null)
		{
			throw new TaskNotExistsException();
		}

		$data = [
			'id' => $taskId,
			'responsible' => $this->castMember($responsibleId),
			'status' => Task\Status::Pending->value,
		];

		$auditors = $task->auditors ?? new UserCollection();
		if (!$task->group?->isScrum() && !$auditors->findOneById((int)$task->responsible->id))
		{
			$auditors->add(User::mapFromId((int)$task->responsible->id));
			$data['auditors'] = $auditors->toArray();
		}

		$task = Task::mapFromArray($data);

		return $this->updateService->update($task, $config);
	}

	public function setAuditors(
		int $taskId,
		array $auditorIds,
		UpdateConfig $config,
	): array
	{
		$task = Task::mapFromArray([
			'id' => $taskId,
			'auditors' => $this->castMembers($auditorIds),
		]);

		return $this->updateService->update($task, $config);
	}

	public function setAccomplices(
		int $taskId,
		array $accompliceIds,
		UpdateConfig $config,
	): array
	{
		$task = Task::mapFromArray([
			'id' => $taskId,
			'accomplices' => $this->castMembers($accompliceIds),
		]);

		return $this->updateService->update($task, $config);
	}
}