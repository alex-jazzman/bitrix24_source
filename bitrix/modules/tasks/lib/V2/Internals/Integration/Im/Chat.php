<?php

declare(strict_types=1);

namespace Bitrix\Tasks\V2\Internals\Integration\Im;

use Bitrix\Main\EventResult;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Tasks\Util\Type\DateTime;
use Bitrix\Tasks\V2\Entity\Group;
use Bitrix\Tasks\V2\Entity\Task;
use Bitrix\Tasks\V2\Entity\User;
use Bitrix\Tasks\V2\Entity\UserCollection;
use Bitrix\Tasks\V2\Internals\Container;

class Chat
{
	public const ENTITY_TYPE = 'TASKS_TASK';

	public static function register(): void
	{
		\Bitrix\Main\EventManager::getInstance()
			->registerEventHandler(
				fromModuleId: 'im',
				eventType: 'OnRegisterExternalChatTypes',
				toModuleId: 'tasks',
				toClass: self::class,
				toMethod: 'onRegisterType',
			)
		;

		\Bitrix\Main\EventManager::getInstance()
			->registerEventHandler(
				fromModuleId: 'im',
				eventType: 'OnFilterUsersByAccessExternalChatTasksTask',
				toModuleId: 'tasks',
				toClass: self::class,
				toMethod: 'onFilterUsersByAccess',
			)
		;
	}

	public static function unRegister(): void
	{
		\Bitrix\Main\EventManager::getInstance()
			->unRegisterEventHandler(
				fromModuleId: 'im',
				eventType: 'OnRegisterExternalChatTypes',
				toModuleId: 'tasks',
				toClass: self::class,
				toMethod: 'onRegisterType',
			)
		;

		\Bitrix\Main\EventManager::getInstance()
			->unRegisterEventHandler(
				fromModuleId: 'im',
				eventType: 'OnFilterUsersByAccessExternalChatTasksTask',
				toModuleId: 'tasks',
				toClass: self::class,
				toMethod: 'onFilterUsersByAccess',
			)
		;
	}

	public static function onRegisterType(
		\Bitrix\Im\V2\Chat\ExternalChat\Event\RegisterTypeEvent $event
	): EventResult
	{
		$parameters = [
			'type' => self::ENTITY_TYPE,
			'config' => new \Bitrix\Im\V2\Chat\ExternalChat\Config(
				hasOwnRecentSection: false,
				permissions: [
					\Bitrix\Im\V2\Permission\Action::Call->value => \Bitrix\Im\V2\Chat::ROLE_NONE,
					\Bitrix\Im\V2\Permission\Action::Extend->value => \Bitrix\Im\V2\Chat::ROLE_NONE,
					\Bitrix\Im\V2\Permission\Action::ChangeAvatar->value => \Bitrix\Im\V2\Chat::ROLE_NONE,
					\Bitrix\Im\V2\Permission\Action::ChangeDescription->value => \Bitrix\Im\V2\Chat::ROLE_NONE,
					\Bitrix\Im\V2\Permission\Action::ChangeColor->value => \Bitrix\Im\V2\Chat::ROLE_NONE,
					\Bitrix\Im\V2\Permission\Action::Rename->value => \Bitrix\Im\V2\Chat::ROLE_NONE,
			],
				isAutoJoinEnabled: true),
		];

		return new EventResult(EventResult::SUCCESS, $parameters);
	}

	public static function onFilterUsersByAccess(
		\Bitrix\Im\V2\Chat\ExternalChat\Event\FilterUsersByAccessEvent $event
	): EventResult
	{
		$userIds = $event->getUserIds();
		$taskId = (int)$event->getChat()->getEntityId();
		$usersWithAccess = Container::getInstance()
			->getTaskAccessService()
			->filterUsersWithAccess($taskId, $userIds)
		;

		return new EventResult(EventResult::SUCCESS, ['userIds' => $usersWithAccess]);
	}

	public function addChat(Task $task): ?int
	{
		if (!Loader::includeModule('im'))
		{
			return null;
		}

		$factory = \Bitrix\Im\V2\Chat\ChatFactory::getInstance();
		$result = $factory->addUniqueChat([
			'TYPE' => \Bitrix\Im\V2\Chat::IM_TYPE_EXTERNAL,
			'ENTITY_TYPE' => self::ENTITY_TYPE,
			'ENTITY_ID' => $task->getId(),
			'USERS' => $task->getMemberIds(),
		]);

		if (!$result->isSuccess())
		{
			return null;
		}

		return (int)$result->getResult()['CHAT_ID'];
	}

	public function updateChatMembers(Task $task): void
	{
		if (!Loader::includeModule('im'))
		{
			return;
		}

		if (!$task->chatId)
		{
			return;
		}

		\Bitrix\Im\V2\Chat::getInstance($task->chatId)
			?->addUsers($task->getMemberIds(), new \Bitrix\Im\V2\Relation\AddUsersConfig(withMessage: false))
		;
	}

	public function notifyChatCreatedForExistingTask(Task $task): void
	{
		$message = Loc::getMessage('TASKS_IM_TASK_CHAT_CREATED_FOR_EXISTING_TASK', [
			'#TITLE#' => $task->title,
		]);

		$this->sendMessage(
			task: $task,
			text: $message,
		);
	}

	public function notifyTaskCreated(Task $task, ?User $triggeredBy): void
	{
		$code = 'TASKS_IM_TASK_CREATED_' . $triggeredBy?->getGender()->value;
		$creatorId = $task->creator?->id ?? null;
		$creatorName = $task->creator?->name ?? '';

		$message = Loc::getMessage($code, [
			'#USER#' => '[USER='. $creatorId . ']' . $creatorName . '[/USER]',
			'#TITLE#' => $task->title,
		]);

		$this->sendMessage(task: $task, text: $message);
	}

	public function notifyResponsibleChanged(Task $task, ?User $triggeredBy, ?User $oldResponsible, ?User $newResponsible): void
	{
		$code = 'TASKS_IM_TASK_RESPONSIBLE_CHANGED_' . $triggeredBy?->getGender()->value;

		$message = Loc::getMessage($code, [
			'#USER#' => '[USER='. $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
			'#OLD_RESPONSIBLE#' => '[USER='. $oldResponsible?->id . ']' . $oldResponsible?->name . '[/USER]',
			'#NEW_RESPONSIBLE#' => '[USER='. $newResponsible?->id .']' . $newResponsible?->name . '[/USER]',
		]);

		$this->sendMessage(task: $task, text: $message);
	}

	public function notifyOwnerChanged(Task $task, ?User $triggeredBy, User $oldOwner, User $newOwner): void
	{
		$code = 'TASKS_IM_TASK_OWNER_CHANGED_' . $triggeredBy?->getGender()->value;

		$message = Loc::getMessage($code, [
			'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
			'#OLD_OWNER#' => '[USER=' . $oldOwner->id . ']' . $oldOwner->name . '[/USER]',
			'#NEW_OWNER#' => '[USER=' . $newOwner->id . ']' . $newOwner->name . '[/USER]',
		]);

		$this->sendMessage(task: $task, text: $message);
	}

	public function notifyDeadlineChanged(Task $task, ?User $triggeredBy, ?int $oldDeadlineTs, ?int $newDeadlineTs): void
	{
		$code = 'TASKS_IM_TASK_DEADLINE_ADDED_' . $triggeredBy?->getGender()->value;

		$message = Loc::getMessage($code, [
			'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
			'#NEW_DEADLINE#' => DateTime::createFromTimestamp($newDeadlineTs)->format('Y-m-d H:i'),
		]);

		if ($oldDeadlineTs !== null && $newDeadlineTs !== null) {
			$code = 'TASKS_IM_TASK_DEADLINE_CHANGED_' . $triggeredBy?->getGender()->value;

			$message = Loc::getMessage($code, [
				'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
				'#OLD_DEADLINE#' => DateTime::createFromTimestamp($oldDeadlineTs)->format('Y-m-d H:i'),
				'#NEW_DEADLINE#' => DateTime::createFromTimestamp($newDeadlineTs)->format('Y-m-d H:i'),
			]);
		} elseif ($oldDeadlineTs !== null && $newDeadlineTs === null) {
			$code = 'TASKS_IM_TASK_DEADLINE_REMOVED_' . $triggeredBy?->getGender()->value;

			$message = Loc::getMessage($code, [
				'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
			]);
		}

		$this->sendMessage(task: $task, text: $message);
	}

	public function notifyAuditorsChanged(Task $task, ?User $triggeredBy, ?UserCollection $oldAuditors, ?UserCollection $newAuditors): void
	{
		$oldAuditorsNames = array_map(fn($user) => '[USER=' . $user['id'] . ']' . $user['name'] . '[/USER]', $oldAuditors?->toArray() ?? []);
		$newAuditorsNames = array_map(fn($user) => '[USER=' . $user['id'] . ']' . $user['name'] . '[/USER]', $newAuditors?->toArray() ?? []);

		$newDiff = array_diff($newAuditorsNames, $oldAuditorsNames);
		$oldDiff = array_diff($oldAuditorsNames, $newAuditorsNames);

		if (!empty($newDiff)) {
			$code = 'TASKS_IM_TASK_AUDITORS_NEW_' . $triggeredBy?->getGender()->value;

			$message = Loc::getMessage($code, [
				'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
				'#NEW_AUDITORS#' => implode(', ', $newDiff),
			]);

			$this->sendMessage(task: $task, text: $message);
		}

		if (!empty($oldDiff)) {
			$code = 'TASKS_IM_TASK_AUDITORS_REMOVE_' . $triggeredBy?->getGender()->value;

			$message = Loc::getMessage($code, [
				'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
				'#OLD_AUDITORS#' => implode(', ', $oldDiff),
			]);

			$this->sendMessage(task: $task, text: $message);
		}
	}

	public function notifyAccomplicesChanged(Task $task, ?User $triggeredBy, ?UserCollection $oldAccomplices, ?UserCollection $newAccomplices): void
	{
		$oldAccomplicesNames = array_map(fn($user) => '[USER=' . $user['id'] . ']' . $user['name'] . '[/USER]', $oldAccomplices?->toArray() ?? []);
		$newAccomplicesNames = array_map(fn($user) => '[USER=' . $user['id'] . ']' . $user['name'] . '[/USER]', $newAccomplices?->toArray() ?? []);

		$newDiff = array_diff($newAccomplicesNames, $oldAccomplicesNames);
		$oldDiff = array_diff($oldAccomplicesNames, $newAccomplicesNames);

		if (!empty($newDiff))
		{
			$code = 'TASKS_IM_TASK_ACCOMPLICES_NEW_' . $triggeredBy?->getGender()->value;

			$message = Loc::getMessage($code, [
				'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
				'#NEW_ACCOMPLICES#' => implode(', ', $newDiff),
			]);

			$this->sendMessage(task: $task, text: $message);
		}

		if (!empty($oldDiff))
		{
			$code = 'TASKS_IM_TASK_ACCOMPLICES_REMOVE_' . $triggeredBy?->getGender()->value;

			$message = Loc::getMessage($code, [
				'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
				'#OLD_ACCOMPLICES#' => implode(', ', $oldDiff),
			]);

			$this->sendMessage(task: $task, text: $message);
		}
	}

	public function notifyGroupChanged(Task $task, ?User $triggeredBy, ?Group $oldGroup, ?Group $newGroup): void
	{
		$secretCode = !$newGroup?->isVisible ? 'SECRET_' : '';

		$code = 'TASKS_IM_TASK_GROUP_ADDED_' . $secretCode . $triggeredBy?->getGender()->value;

		$message = Loc::getMessage($code, [
			'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
			'#NEW_GROUP#' => $newGroup?->name,
		]);

		if ($oldGroup !== null && $newGroup !== null)
		{
			$secretCode = !$oldGroup->isVisible || !$newGroup->isVisible ? 'SECRET_' : '';

			$code = 'TASKS_IM_TASK_GROUP_CHANGED_' . $secretCode . $triggeredBy?->getGender()->value;

			$message = Loc::getMessage($code, [
				'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
				'#OLD_GROUP#' => $oldGroup->name,
				'#NEW_GROUP#' => $newGroup->name,
			]);
		}
		elseif ($oldGroup !== null && $newGroup === null)
		{
			$secretCode = !$oldGroup->isVisible ? 'SECRET_' : '';

			$code = 'TASKS_IM_TASK_GROUP_REMOVED_' . $secretCode . $triggeredBy?->getGender()->value;

			$message = Loc::getMessage($code, [
				'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]',
				'#GROUP#' => $oldGroup->name,
			]);
		}

		$this->sendMessage(task: $task, text: $message);
	}

	public function notifyTaskOverdue(Task $task, ?User $triggeredBy): void
	{
		$message = Loc::getMessage('TASKS_IM_TASK_OVERDUE', [
			'#TITLE#' => $task->title,
		]);

		$this->sendMessage(
			task: $task,
			text: $message,
		);
	}

	public function notifyTaskStatusChanged(Task $task, ?User $triggeredBy, Task\Status $oldStatus, ?Task\Status $newStatus): void
	{
		$replace = [
			'#TITLE#' => $task->title,
			'#USER#' => '[USER=' . $triggeredBy?->id . ']' . $triggeredBy?->name . '[/USER]'
		];

		$message = match($newStatus)
		{
			Task\Status::Completed => Loc::getMessage('TASKS_IM_TASK_STATUS_COMPLETED_' . $triggeredBy?->getGender()->value, $replace),
			Task\Status::InProgress => Loc::getMessage('TASKS_IM_TASK_STATUS_IN_PROGRESS_' . $triggeredBy?->getGender()->value, $replace),
			Task\Status::SupposedlyCompleted => Loc::getMessage('TASKS_IM_TASK_STATUS_SUSPEND_' . $triggeredBy?->getGender()->value, $replace),
			Task\Status::Deferred => Loc::getMessage('TASKS_IM_TASK_STATUS_DEFER_' . $triggeredBy?->getGender()->value, $replace),
			Task\Status::Pending => Loc::getMessage('TASKS_IM_TASK_STATUS_PENDING_' . $triggeredBy?->getGender()->value, $replace),
			default => null,
		};

		if ($message === null)
		{
			return;
		}

		$this->sendMessage(task: $task, text: $message);
	}

	private function sendMessage(Task $task, string|null $text): void
	{
		if (!Loader::includeModule('im'))
		{
			return;
		}

		if ($text === null)
		{
			return;
		}

		if ($task->chatId === null)
		{
			return;
		}

		$authorId = 0; // system user

		$chat = \Bitrix\Im\V2\Chat::getInstance($task->chatId);
		$message = (new \Bitrix\Im\V2\Message())
			->setMessage($text)
			->setAuthorId($authorId)
		;
		$chat->sendMessage($message);
	}
}
