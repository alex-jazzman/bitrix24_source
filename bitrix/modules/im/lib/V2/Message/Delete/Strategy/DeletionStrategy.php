<?php

namespace Bitrix\Im\V2\Message\Delete\Strategy;

use Bitrix\Disk\SystemUser;
use Bitrix\Im\V2\Chat;
use Bitrix\Im\V2\Entity\File\FileCollection;
use Bitrix\Im\V2\Message\Delete\DeletionMode;
use Bitrix\Im\V2\MessageCollection;
use Bitrix\Im\V2\Result;
use Bitrix\Im\V2\Sync\Event;
use Bitrix\Im\V2\Sync\Logger;

abstract class DeletionStrategy
{
	protected MessageCollection $messages;
	protected Chat $chat;
	protected ?FileCollection $files = null;

	final protected function __construct(MessageCollection $messages)
	{
		$this->messages = $messages;
		$chatId = $messages->getCommonChatId();
		$this->chat = Chat::getInstance($chatId);
	}

	public static function getInstance(MessageCollection $messages, DeletionMode $deletionMode): DeletionStrategy
	{
		return match ($deletionMode)
		{
			DeletionMode::Soft => (new SoftDeletionStrategy($messages)),
			DeletionMode::Complete => (new CompleteDeletionStrategy($messages)),
			default => (new NoneDeletionStrategy($messages)),
		};
	}

	/**
	 * @throws InterruptedExecutionException
	 */
	abstract protected function onBeforeDelete(): void;

	/**
	 * @throws InterruptedExecutionException
	 */
	abstract protected function onAfterDelete(): void;

	/**
	 * @throws InterruptedExecutionException
	 */
	abstract protected function execute(): void;

	protected function logToSync(string $event): void
	{
		$ids = $this->messages->getIds();

		foreach ($ids as $id)
		{
			Logger::getInstance()->add(
				new Event($event, Event::MESSAGE_ENTITY, $id),
				fn () => $this->chat->getRelations()->getUserIds(),
				$this->chat
			);
		}
	}

	protected function deleteFiles(): void
	{
		if (!isset($this->files))
		{
			return;
		}

		foreach ($this->files as $file)
		{
			$file->getDiskFile()?->delete(SystemUser::SYSTEM_USER_ID);
		}
	}

	/**
	 * @throws InterruptedExecutionException
	 */
	protected function checkResult(Result $result): void
	{
		if (!$result->isSuccess())
		{
			throw new InterruptedExecutionException($result);
		}
	}

	final public function delete(): Result
	{
		$result = new Result();

		try
		{
			$this->onBeforeDelete();
			$this->execute();
			$this->onAfterDelete();
		}
		catch (InterruptedExecutionException $exception)
		{
			$result = $exception->getResult();
		}
		finally
		{
			return $result;
		}
	}
}