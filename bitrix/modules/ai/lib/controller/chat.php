<?php declare(strict_types=1);

namespace Bitrix\AI\Controller;

use Bitrix\AI\Chatbot\Dto\ChatInitDto;
use Bitrix\AI\Chatbot\Enum\ChatInputStatus;
use Bitrix\AI\Chatbot\Message;
use Bitrix\AI\Chatbot\Service\ChatService;
use Bitrix\AI\Facade\User;
use Bitrix\AI\Parameter\DefaultParameter;
use Bitrix\Main\AccessDeniedException;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\Engine\Action;
use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Error;
use Bitrix\Main\Loader;
use Bitrix\Main\LoaderException;
use Bitrix\Main\ObjectNotFoundException;
use Bitrix\Main\ObjectPropertyException;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Main\Validation\Engine\AutoWire\ValidationParameter;

class Chat extends Controller
{
	/**
	 * @throws SystemException
	 */
	protected function processBeforeAction(Action $action): bool
	{
		if ($action->getName() !== 'init')
		{
			$arguments = $action->getArguments();
			$chatService = $arguments['chatService'] ?? null;
			$chatId = $arguments['chatId'] ?? null;
			if (empty($chatService) || empty($chatId))
			{
				return false;
			}
			$checkPermissionsResult = $this->checkPermissions($chatService, (int)$chatId);
			if (!$checkPermissionsResult->isSuccess())
			{
				$this->addErrors($checkPermissionsResult->getErrors());

				return false;
			}
		}

		return parent::processBeforeAction($action); // TODO: Change the autogenerated stub
	}

	public function getAutoWiredParameters(): array
	{
		return [
			new DefaultParameter(),
			new ValidationParameter(
				ChatInitDto::class,
				function (): ChatInitDto {
					$request = $this->getRequest();

					return ChatInitDto::createFromRequest($request, User::getCurrentUserId());
				}
			),
		];
	}

	/**
	 * Create or retrieve a chat
	 */
	public function initAction(ChatService $chatService, ChatInitDto $chatInitDto): ?array
	{
		try
		{
			$chat = $chatService->initChat($chatInitDto);
			$messages = $chatService->getMessages($chat->getId());
		}
		catch (SystemException $exception)
		{
			$this->addError(new Error($exception->getMessage()));

			return null;
		}

		return [
			'chat' => [
				'id' => $chat->getId(),
				'inputStatus' => $chat->getInputStatus(),
			],
			'messages' => $messages,
			'userPhoto' => User::getUserPhoto(User::getCurrentUserId()),
		];
	}

	/**
	 * Get chat messages
	 */
	public function getMessagesAction(ChatService $chatService, int $chatId, int $offsetMessageId = 0, int $limit = 10): array
	{
		$messages = $chatService->getMessages($chatId, $limit, $offsetMessageId);

		return [
			'messages' => $messages,
		];
	}



	/**
	 * Send a message
	 */
	public function sendMessageAction(ChatService $chatService, int $chatId, array $messageData): ?array
	{
		if (!empty($messageData['messageId']) && isset($messageData['buttonId']))
		{
			$command = $chatService->getCommandData($chatId, (int)$messageData['messageId'], (int)$messageData['buttonId']);
			$message = new Message\ButtonClickedMessage(
				$messageData['content'],
				(int)$messageData['messageId'],
				(int)$messageData['buttonId'],
				$command
			);
		}
		else
		{
			$message = new Message\DefaultMessage($messageData['content']);
		}

		try
		{
			$chatService->setChatInputStatus($chatId,ChatInputStatus::Lock);
			if (!empty($messageData['messageId']) && isset($messageData['buttonId']))
			{
				$chatService->buttonClicked($chatId, (int)$messageData['messageId'], (int)$messageData['buttonId']);
			}
			$messageId = $chatService->sendMessage($chatId, User::getCurrentUserId(), $message);
			$messageDto = $chatService->getMessageById($chatId, $messageId);

			return [
				'message' => $messageDto,
			];
		}
		catch (ObjectNotFoundException|AccessDeniedException|LoaderException|ArgumentException $e)
		{
			$this->addError(new Error($e->getMessage()));

			return null;
		}
	}


	/**
	 * Mark message as viewed
	 */
	public function markMessageAsViewedAction(ChatService $chatService, int $chatId, array $messagesIds): void
	{
		foreach ($messagesIds as $messageId)
		{
			if (!is_numeric($messageId))
			{
				$this->addError(new Error('MessageIds contains invalid ids.'));

				return;
			}
		}

		$chatService->markMessageAsViewed($chatId, $messagesIds);
	}

	private function checkPermissions(ChatService $chatService, int $chatId): Result
	{
		$checkResult = new Result();

		if (empty($chatId))
		{
			$checkResult->addError(new Error('ChatId is required.'));

			return $checkResult;
		}
		$chat = $chatService->getChatById($chatId);
		if ($chat === null)
		{
			$checkResult->addError(new Error("ChatId: {$chatId} not found."));

			return $checkResult;
		}
		$userId = User::getCurrentUserId();
		if ($chat->getAuthorId() !== $userId)
		{
			$checkResult->addError(new Error("User '{$userId}' does not have permissions to chat {$chat->getId()}."));

			return $checkResult;
		}

		return $checkResult;
	}
}
