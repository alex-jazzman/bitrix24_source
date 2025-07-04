<?php

namespace Bitrix\Im\V2\Chat;

use Bitrix\Im\Notify;
use Bitrix\Im\Color;
use Bitrix\Im\V2\Analytics\ChatAnalytics;
use Bitrix\Im\V2\Call\CallToken;
use Bitrix\Im\V2\Chat;
use Bitrix\Im\V2\Chat\Copilot\CopilotPopupItem;
use Bitrix\Im\V2\Chat\Param\Params;
use Bitrix\Im\V2\Entity\File\ChatAvatar;
use Bitrix\Im\V2\Entity\User\User;
use Bitrix\Im\V2\Entity\User\UserCollection;
use Bitrix\Im\V2\Entity\User\UserPopupItem;
use Bitrix\Im\V2\Entity\User\UserType;
use Bitrix\Im\V2\Integration\AI\RoleManager;
use Bitrix\Im\V2\Integration\HumanResources\Structure;
use Bitrix\Im\V2\Logger;
use Bitrix\Im\V2\Message;
use Bitrix\Im\V2\Message\Send\PushService;
use Bitrix\Im\V2\Message\Send\SendingConfig;
use Bitrix\Im\V2\Relation;
use Bitrix\Im\V2\Relation\AddUsersConfig;
use Bitrix\Im\V2\Rest\PopupData;
use Bitrix\Im\V2\Rest\PopupDataAggregatable;
use Bitrix\Im\V2\Result;
use Bitrix\Im\V2\Service\Context;
use Bitrix\Imbot\Bot\CopilotChatBot;
use Bitrix\ImBot\Bot\Network;
use Bitrix\ImBot\Bot\Support24;
use Bitrix\ImBot\Bot\SupportBox;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Pull\Event;
use Bitrix\Im\V2\Message\Delete\DisappearService;

class GroupChat extends Chat implements PopupDataAggregatable
{
	protected function getDefaultType(): string
	{
		return self::IM_TYPE_CHAT;
	}

	public function setType(string $type): Chat
	{
		$this->type = $type;

		return $this;
	}

	/**
	 * Allows to send mention notification.
	 * @return bool
	 */
	public function allowMention(): bool
	{
		return true;
	}

	protected function needToSendGreetingMessages(): bool
	{
		return !$this->getEntityType();
	}

	protected function checkAccessInternal(int $userId): Result
	{
		$result = new Result();

		if ($this->getRelationByUserId($userId) === null)
		{
			$result->addError(new ChatError(ChatError::ACCESS_DENIED));
		}

		return $result;
	}

	public function linkToStructureNodes(array $structureNodes): void
	{
		if (empty($structureNodes))
		{
			return;
		}

		(new Structure($this))->link($structureNodes);
	}

	public function unlinkStructureNodes(array $structureNodes): void
	{
		if (empty($structureNodes))
		{
			return;
		}

		(new Structure($this))->unlink($structureNodes);
	}

	public function add(array $params, ?Context $context = null): Result
	{
		$result = new Result;
		$skipAddMessage = ($params['SKIP_ADD_MESSAGE'] ?? 'N') === 'Y';
		$forceSendGreetingMessages = ($params['SEND_GREETING_MESSAGES'] ?? 'N') === 'Y';
		$paramsResult = $this->prepareParams($params);
		if ($paramsResult->isSuccess())
		{
			$params = $paramsResult->getResult();
		}
		else
		{
			return $result->addErrors($paramsResult->getErrors());
		}

		$chat = new static($params);
		$chat->onBeforeAdd();
		$chat->save();

		if (!$chat->getChatId())
		{
			return $result->addError(new ChatError(ChatError::CREATION_ERROR));
		}

		$addedUsers = $usersToInvite = $chat->getUserIds() ?? [];
		if ($chat->getAuthorId())
		{
			$addedUsers[$chat->getAuthorId()] = $chat->getAuthorId();
			unset($usersToInvite[$chat->getAuthorId()]);
		}
		$addUsersConfig = new AddUsersConfig($params['MANAGERS'] ?? [], false);
		$chat->addUsersToRelation($addedUsers, $addUsersConfig);
		$needToSendGreetingMessages = !$skipAddMessage && ($chat->needToSendGreetingMessages() || $forceSendGreetingMessages);
		if ($needToSendGreetingMessages)
		{
			$chat->sendGreetingMessage($this->getContext()->getUserId());
			$chat->sendBanner($this->getContext()->getUserId());
		}

		if (!$skipAddMessage)
		{
			$chat->sendMessageUsersAdd($usersToInvite, $addUsersConfig);
		}
		$chat->linkToStructureNodes($params['STRUCTURE_NODES'] ?? []);
		$chat->sendEventUsersAdd($addedUsers);

		if (!$skipAddMessage)
		{
			$chat->sendDescriptionMessage();
		}
		$chat->addIndex();

		$result->setResult([
			'CHAT_ID' => $chat->getChatId(),
			'CHAT' => $chat,
		]);

		$chat->onAfterAdd();
		$chat->onUserAddAfterChatAdd($usersToInvite);

		return $result;
	}

	protected function onBeforeAdd(?Context $context = null): void
	{
		$userIds = $this->getUserIds() ?? [];
		$containsExtranet = UserCollection::hasUserByType($userIds, UserType::EXTRANET);
		$this->setExtranet($containsExtranet)->setContext($context);
		if (UserCollection::hasUserByType($userIds, UserType::COLLABER))
		{
			$this->getChatParams()->addParamByName(Params::CONTAINS_COLLABER, true, false);
		}

		$this->setUserCount(count($userIds));
	}

	protected function onAfterAdd(?Context $context = null): void
	{
		Message\Delete\DisappearService::sendMessageAfterChatAdd($this);

		self::cleanCache($this->getChatId());
		$this->isFilledNonCachedData = false;
	}

	protected function onUserAddAfterChatAdd(array $addedUsers): void
	{
		return;
	}

	protected function filterParams(array $params): array
	{
		if (
			isset($params['MESSAGES_AUTO_DELETE_DELAY'])
			&& (int)$params['MESSAGES_AUTO_DELETE_DELAY'] !== 0
			&& !DisappearService::checkAvailability($this->getExtendedType(false))->isSuccess()
		)
		{
			unset($params['MESSAGES_AUTO_DELETE_DELAY']);
		}

		return $params;
	}

	protected function validateAuthorId(int $authorId): Result
	{
		$result = new Result();
		if ($authorId <= 0)
		{
			return $result->addError(
				new ChatError(
					ChatError::AUTHOR_ID_EMPTY,
					'Using AUTHOR_ID = 0 is deprecated and will be disallowed soon. Please provide a valid user ID.'
				)
			);
		}

		if (!User::getInstance($authorId)->isExist())
		{
			return $result->addError(
				new ChatError(
					ChatError::AUTHOR_NOT_EXISTS,
					'The specified AUTHOR_ID does not match any existing user. Please provide a valid user ID.'
				)
			);
		}

		return $result;
	}

	protected function prepareParams(array $params = []): Result
	{
		$result = new Result();
		$params = $this->filterParams($params);

		$params['AUTHOR_ID'] = (int)($params['AUTHOR_ID'] ?? $this->getContext()->getUserId());
		$validateAuthorIdResult = $this->validateAuthorId((int)$params['AUTHOR_ID']);
		if (!$validateAuthorIdResult->isSuccess())
		{
			(new Logger('chat-creation-author-id-error'))->logErrors($validateAuthorIdResult->getErrorCollection());
		}

		$users = $params['USERS'] ?? [];
		$managers = $params['MANAGERS'] ?? [];
		$params['USERS'] = is_array($users) ? $users : [];
		$params['MANAGERS'] = is_array($managers) ? $managers : [];
		[$users, $structureNodes] = Structure::splitEntities($params['MEMBER_ENTITIES'] ?? []);

		$params['MANAGERS'] = array_unique(array_merge($params['MANAGERS'], [$params['AUTHOR_ID']]));
		$params['USERS'] = array_unique(array_merge($params['USERS'], $params['MANAGERS'], $users));
		$params['STRUCTURE_NODES'] = $structureNodes;

		if (
			isset($params['AVATAR'])
			&& !is_numeric((string)$params['AVATAR'])
		)
		{
			$params['AVATAR'] = ChatAvatar::saveAvatarByString($params['AVATAR']);
		}

		return $result->setResult($params);
	}

	protected function addUsersToRelation(array $usersToAdd, AddUsersConfig $config): void
	{
		$isHideHistory = $config->hideHistory ?? \CIMSettings::GetStartChatMessage() == \CIMSettings::START_MESSAGE_LAST;
		$config = $config->setHideHistory($isHideHistory);
		parent::addUsersToRelation($usersToAdd, $config);
	}

	public function addManagers(array $userIds, bool $sendPush = true): self
	{
		return $this->changeManagers($userIds, true, $sendPush);
	}

	public function deleteManagers(array $userIds, bool $sendPush = true): self
	{
		return $this->changeManagers($userIds, false, $sendPush);
	}

	protected function changeManagers(array $userIds, bool $isManager, bool $sendPush = true): self
	{
		$usersMap = [];
		foreach ($userIds as $userId)
		{
			$usersMap[(int)$userId] = $isManager;
		}

		$this->changeManagersByMap($usersMap, $sendPush);

		return $this;
	}

	/**
	 * @param bool[] $usersMap
	 * @param bool $sendPush
	 * @return self
	 */
	public function changeManagersByMap(array $usersMap, bool $sendPush = true): self
	{
		$relations = $this->getRelations();

		foreach ($usersMap as $userId => $isManager)
		{
			$relation = $relations->getByUserId($userId, $this->getChatId());
			if ($relation === null)
			{
				continue;
			}

			$relation->setManager($isManager);

			if ($this->chatId !== null)
			{
				(new ChatAnalytics($this))->addEditPermissions();
			}
		}

		$relations->save(true);

		if ($sendPush)
		{
			$this->sendPushManagersChange();
		}

		return $this;
	}

	protected function sendPushManagersChange(): void
	{
		$push = [
			'module_id' => 'im',
			'command' => 'chatManagers',
			'params' => [
				'dialogId' => $this->getDialogId(),
				'chatId' => $this->getId(),
				'list' => $this->getManagerList()
			],
			'extra' => \Bitrix\Im\Common::getPullExtra()
		];
		\Bitrix\Pull\Event::add($this->getRelations()->getUserIds(), $push);
	}

	protected function getPushService(Message $message, SendingConfig $config): PushService
	{
		return new Message\Send\Push\GroupPushService($message, $config);
	}

	public function checkTitle(): Result
	{
		if (!$this->getTitle())
		{
			$this->setTitle($this->generateTitle());
		}

		return new Result;
	}

	protected function generateTitle(): string
	{
		if (Color::isEnabled() && $this->getColor())
		{
			$colorCodeKey = 'im_chat_color_' . $this->getColor();
			$colorCodeCount = \CGlobalCounter::GetValue($colorCodeKey, \CGlobalCounter::ALL_SITES);
			if ($colorCodeCount >= Color::MAX_COLOR_COUNT)
			{
				$colorCodeCount = 0;
				\CGlobalCounter::Set($colorCodeKey, 1, \CGlobalCounter::ALL_SITES, '', false);
			}

			$chatTitle = Loc::getMessage('IM_CHAT_NAME_FORMAT', [
				'#COLOR#' => Color::getName($this->getColor()),
				'#NUMBER#' => ++$colorCodeCount,
			]);
			\CGlobalCounter::Set($colorCodeKey, $colorCodeCount, \CGlobalCounter::ALL_SITES, '', false);
		}
		else
		{
			$userIds = [];
			if ($this->getUserIds() && count($this->getUserIds()))
			{
				$userIds = $this->getUserIds();
			}
			$userIds = \CIMContactList::PrepareUserIds($userIds);
			$users = \CIMContactList::GetUserData([
				'ID' => array_values($userIds),
				'DEPARTMENT' => 'N',
				'USE_CACHE' => 'N'
			]);

			$usersNames = [];
			foreach ($users['users'] as $user)
			{
				$usersNames[] = htmlspecialcharsback($user['name']);
			}

			$chatTitle = Loc::getMessage('IM_CHAT_NAME_FORMAT_USERS', [
				'#USERS_NAMES#' => implode(', ', $usersNames),
			]);
		}

		return mb_substr($chatTitle, 0, 255);
	}

	public function sendPushUpdateMessage(Message $message): void
	{
		$pushFormat = new Message\PushFormat($message);
		$push = $pushFormat->formatMessageUpdate();
		$push['params']['dialogId'] = $this->getDialogId();
		if ($this->getType() === self::IM_TYPE_COMMENT)
		{
			\CPullWatch::AddToStack('IM_PUBLIC_COMMENT_' . $message->getChat()->getParentChatId(), $push);
		}
		else
		{
			Event::add($this->getUsersForPush(true, false), $push);
		}
		if ($this->needToSendPublicPull())
		{
			\CPullWatch::AddToStack('IM_PUBLIC_' . $message->getChatId(), $push);
		}
		if ($this->getType() === Chat::IM_TYPE_OPEN_CHANNEL && $message->getId() === $message->getChat()->getLastMessageId())
		{
			OpenChannelChat::sendSharedPull($push);
		}
	}

	protected function sendGreetingMessage(?int $authorId = null)
	{
		if (!$authorId)
		{
			$authorId = $this->getAuthorId();
		}
		$author = \Bitrix\Im\V2\Entity\User\User::getInstance($authorId);

		$replace = ['#USER_NAME#' => "[USER={$authorId}][/USER]"];
		$messageText =  Loc::getMessage($this->getCodeGreetingMessage($author), $replace);

		if ($messageText)
		{
			\CIMMessage::Add([
				'MESSAGE_TYPE' => $this->getType(),
				'TO_CHAT_ID' => $this->getChatId(),
				'FROM_USER_ID' => $author->getId(),
				'MESSAGE' => $messageText,
				'SYSTEM' => 'Y',
				'PUSH' => 'N',
				'SKIP_COUNTER_INCREMENTS' => 'Y',
				'PARAMS' => [
					'NOTIFY' => 'N',
				],
			]);
		}

		if ($authorId !== $this->getAuthorId())
		{
			$this->sendMessageAuthorChange($author);
		}
	}

	protected function getCodeGreetingMessage(\Bitrix\Im\V2\Entity\User\User $author): string
	{
		return 'IM_CHAT_CREATE_' . $author->getGender();
	}

	protected function sendMessageAuthorChange(\Bitrix\Im\V2\Entity\User\User $author): void
	{
		$messageText = Loc::getMessage(
			'IM_CHAT_APPOINT_OWNER_' . $author->getGender(),
			[
				'#USER_1_NAME#' => htmlspecialcharsback($author->getName()),
				'#USER_2_NAME#' => htmlspecialcharsback($this->getAuthor()->getName())
			]
		);

		\CIMMessage::Add([
			'MESSAGE_TYPE' => $this->getType(),
			'TO_CHAT_ID' => $this->getChatId(),
			'FROM_USER_ID' => $author->getId(),
			'MESSAGE' => $messageText,
			'SYSTEM' => 'Y',
			'PUSH' => 'N'
		]);
	}

	protected function sendBanner(?int $authorId = null): void
	{
		if (!$authorId)
		{
			$authorId = $this->getAuthorId();
		}
		$author = \Bitrix\Im\V2\Entity\User\User::getInstance($authorId);

		if (
			in_array($this->getType(), [self::IM_TYPE_CHAT, self::IM_TYPE_OPEN, self::IM_TYPE_COPILOT], true)
			&& empty($this->getEntityType())
		)
		{
			\CIMMessage::Add([
				'MESSAGE_TYPE' => $this->getType(),
				'TO_CHAT_ID' => $this->getChatId(),
				'FROM_USER_ID' => $author->getId(),
				'MESSAGE' => Loc::getMessage('IM_CHAT_CREATE_WELCOME_MSGVER_1'),
				'SYSTEM' => 'Y',
				'PUSH' => 'N',
				'PARAMS' => [
					'COMPONENT_ID' => 'ChatCreationMessage',
					'NOTIFY' => 'N',
				],
				'SKIP_COUNTER_INCREMENTS' => 'Y',
			]);
		}
	}

	protected function sendInviteMessage(?int $authorId = null): void
	{
		if (!$authorId)
		{
			$authorId = $this->getAuthorId();
		}
		$author = \Bitrix\Im\V2\Entity\User\User::getInstance($authorId);

		$userIds = array_unique($this->getUserIds());
		if (count($userIds) < 2)
		{
			return;
		}

		$userIds = \CIMContactList::PrepareUserIds($userIds);
		$users = \CIMContactList::GetUserData([
			'ID' => array_values($userIds),
			'DEPARTMENT' => 'N',
			'USE_CACHE' => 'N'
		]);

		if (!isset($users['users']) || count($users['users']) < 2)
		{
			return;
		}

		$usersNames = [];

		if ($authorId !== $this->getAuthorId())
		{
			$usersNames[] = htmlspecialcharsback($this->getAuthor()->getName());
		}

		foreach ($users['users'] as $user)
		{
			if ($user['name'] !== $author->getName())
			{
				$usersNames[] = htmlspecialcharsback($user['name']);
			}
		}

		$messageText = Loc::getMessage(
			'IM_CHAT_JOIN_' . $author->getGender(),
			[
				'#USER_1_NAME#' => htmlspecialcharsback($author->getName()),
				'#USER_2_NAME#' => implode(', ', array_unique($usersNames))
			]
		);

		\CIMMessage::Add([
			'MESSAGE_TYPE' => $this->getType(),
			'TO_CHAT_ID' => $this->getChatId(),
			'FROM_USER_ID' => $author->getId(),
			'MESSAGE' => $messageText,
			'SYSTEM' => 'Y',
		]);
	}

	protected function prepareMessage(Message $message): void
	{
		parent::prepareMessage($message);

		if (!$message->getAuthorId() && !$message->isSystem())
		{
			$message->setAuthorId($this->getContext()->getUserId());
		}

		if ($message->isSystem())
		{
			$message->setAuthorId(0);
		}

		$message->setNotifyModule('im')->setNotifyEvent(Notify::EVENT_GROUP);
	}

	public function getMultidialogData(): array
	{
		if (!Loader::includeModule('imbot'))
		{
			return [];
		}

		if ($this->getEntityType() !== Support24::CHAT_ENTITY_TYPE && $this->getEntityType() !== Network::CHAT_ENTITY_TYPE)
		{
			return [];
		}

		$userId = $this
			->getRelations()
			->filter(fn (Relation $relation) => !$relation->getUser()->isBot())
			->getAny()
			?->getUserId() ?? 0
		;

		if ($this->getEntityType() === Support24::CHAT_ENTITY_TYPE)
		{
			if (Loader::includeModule('bitrix24') && Support24::isEnabled())
			{
				return Support24::getMultidialog($this->getId(), $this->getAuthorId(), $userId) ?? [];
			}

			return SupportBox::getMultidialog($this->getId(), $this->getAuthorId(), $userId) ?? [];
		}

		if ($this->getEntityType() === Network::CHAT_ENTITY_TYPE)
		{
			return Network::getMultidialog($this->getId(), $this->getAuthorId(), $userId) ?? [];
		}

		return [];
	}

	protected function sendDescriptionMessage(?int $authorId = null): void
	{
		if (!$this->getDescription())
		{
			return;
		}

		if (!$authorId)
		{
			$authorId = $this->getAuthorId();
		}

		\CIMMessage::Add([
			'MESSAGE_TYPE' => $this->getType(),
			'TO_CHAT_ID' => $this->getChatId(),
			'FROM_USER_ID' => $authorId,
			'MESSAGE' => htmlspecialcharsback($this->getDescription()),
		]);
	}

	protected function getCopilotRoles(): array
	{
		if (
			Loader::includeModule('imbot')
			&& $this->getRelationFacade()?->getByUserId(CopilotChatBot::getBotId()) !== null
		)
		{
			$copilotRoles = (new RoleManager())->getMainRole($this->getChatId());
		}

		return isset($copilotRoles) ? [$this->getDialogId() => $copilotRoles] : [];
	}

	public function getPopupData(array $excludedList = []): PopupData
	{
		$userId = $this->getContext()->getUserId();

		return parent::getPopupData($excludedList)
			->add(new UserPopupItem([$userId]))
			->add(new CopilotPopupItem($this->getCopilotRoles(), Chat\Copilot\Entity::Chats))
			->add(new Chat\MessagesAutoDelete\MessagesAutoDeleteConfigs([$this->getChatId()]))
			->add(new CallToken($this->getId(), $userId))
		;
	}

	protected function needToSendMessageUserDelete(): bool
	{
		return true;
	}
}