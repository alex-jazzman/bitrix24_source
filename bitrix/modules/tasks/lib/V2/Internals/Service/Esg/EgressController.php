<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Service\Esg;

use Bitrix\Tasks\V2\Command\AbstractCommand;
use Bitrix\Tasks\V2\Command\Task\AddTaskCommand;
use Bitrix\Tasks\V2\Command\Task\DeleteTaskCommand;
use Bitrix\Tasks\V2\Command\Task\UpdateTaskCommand;
use Bitrix\Tasks\V2\Entity\Task;
use Bitrix\Tasks\V2\Entity\User;
use Bitrix\Tasks\V2\Internals\Integration\Im\Chat;
use Bitrix\Tasks\V2\Internals\Repository\UserRepositoryInterface;
use Exception;

class EgressController implements EgressInterface
{
	private Chat $chatIntegration;
	private UserRepositoryInterface $userRepository;

	public function __construct(Chat $chatIntegration, UserRepositoryInterface $userRepository)
	{
		$this->chatIntegration = $chatIntegration;
		$this->userRepository = $userRepository;
	}

	public function processAddTaskCommand(AddTaskCommand $command): Task
	{
		// create new chat
		$chatId = $this->chatIntegration->addChat($command->task);

		if ($chatId === null)
		{
			throw new Exception('There was an error while saving task chat');
		}

		$createdTask = $command->task->cloneWith(['chatId' => $chatId]);

		$this->chatIntegration->notifyTaskCreated(
			task: $createdTask,
			triggeredBy: $this->userRepository->getByIds([$command->config->getUserId()])->getFirstEntity(),
		);

		return $createdTask;
	}

	public function createChatForExistingTask(Task $task): Task
	{
		// create new chat
		$chatId = $this->chatIntegration->addChat($task);

		if ($chatId === null)
		{
			throw new Exception('There was an error while creating new task chat');
		}

		$updatedTask = $task->cloneWith(['chatId' => $chatId]);

		$this->chatIntegration->notifyChatCreatedForExistingTask(
			task: $task,
		);

		return $updatedTask;
	}

	public function process(AbstractCommand $command): void
	{
		match (true)
		{
			$command instanceof UpdateTaskCommand => $this->processTaskUpdateCommand($command),
			$command instanceof DeleteTaskCommand => $this->processTaskDeleteCommand($command),
			default => '',
		};
	}

	protected function processTaskUpdateCommand(UpdateTaskCommand $command): void
	{
		$taskBeforeUpdate = $command->taskBeforeUpdate;

		if ($taskBeforeUpdate === null)
		{
			return;
		}

		$changes = $command->task->diff($taskBeforeUpdate);
		$triggeredBy = $this->userRepository->getByIds([$command->config->getUserId()])->getFirstEntity();

		foreach ($changes as $key => $change)
		{
			match ($key)
			{
				'responsible' => $this->handleTaskMembersChanged(
					task: $command->task,
					triggeredBy: $triggeredBy,
					taskBeforeUpdate: $taskBeforeUpdate,
					key: 'responsible',
				),
				'creator' => $this->handleTaskMembersChanged(
					task: $command->task,
					triggeredBy: $triggeredBy,
					taskBeforeUpdate: $taskBeforeUpdate,
					key: 'creator',
				),
				'deadlineTs' => $this->chatIntegration->notifyDeadlineChanged(
					task: $command->task,
					triggeredBy: $triggeredBy,
					oldDeadlineTs: $taskBeforeUpdate->deadlineTs,
					newDeadlineTs: $command->task->deadlineTs,
				),
				'auditors' => $this->handleTaskMembersChanged(
					task: $command->task,
					triggeredBy: $triggeredBy,
					taskBeforeUpdate: $taskBeforeUpdate,
					key: 'auditors',
				),
				'accomplices' => $this->handleTaskMembersChanged(
					task: $command->task,
					triggeredBy: $triggeredBy,
					taskBeforeUpdate: $taskBeforeUpdate,
					key: 'accomplices',
				),
				'group' => $this->chatIntegration->notifyGroupChanged(
					task: $command->task,
					triggeredBy: $triggeredBy,
					oldGroup: $taskBeforeUpdate->group,
					newGroup: $command->task->group,
				),
				'status' => $this->chatIntegration->notifyTaskStatusChanged(
					task: $command->task,
					triggeredBy: $triggeredBy,
					oldStatus: $taskBeforeUpdate->status,
					newStatus: $command->task->status,
				),
				default => '',
			};
		}
	}

	protected function handleTaskMembersChanged(Task $task, ?User $triggeredBy, Task $taskBeforeUpdate, string $key): void
	{
		match ($key)
		{
			'responsible' => $this->chatIntegration->notifyResponsibleChanged(
				task: $task,
				triggeredBy: $triggeredBy,
				oldResponsible: $taskBeforeUpdate->responsible,
				newResponsible: $task->responsible,
			),
			'creator' => $this->chatIntegration->notifyOwnerChanged(
				task: $task,
				triggeredBy: $triggeredBy,
				oldOwner: $taskBeforeUpdate->creator,
				newOwner: $task->creator,
			),
			'auditors' => $this->chatIntegration->notifyAuditorsChanged(
				task: $task,
				triggeredBy: $triggeredBy,
				oldAuditors: $taskBeforeUpdate->auditors,
				newAuditors: $task->auditors,
			),
			'accomplices' => $this->chatIntegration->notifyAccomplicesChanged(
				task: $task,
				triggeredBy: $triggeredBy,
				oldAccomplices: $taskBeforeUpdate->accomplices,
				newAccomplices: $task->accomplices,
			),
			default => false,
		};

		$this->chatIntegration->updateChatMembers($task);
	}

	private function processTaskDeleteCommand(DeleteTaskCommand $command): void
	{
		// todo: ???
	}
}
