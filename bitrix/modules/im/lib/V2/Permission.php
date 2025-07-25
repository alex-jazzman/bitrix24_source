<?php

namespace Bitrix\Im\V2;

use Bitrix\Im\V2\Chat\ExternalChat\ExternalTypeRegistry;
use Bitrix\Im\V2\Chat\GeneralChannel;
use Bitrix\Im\V2\Chat\GeneralChat;
use Bitrix\Im\V2\Chat\Type;
use Bitrix\Im\V2\Entity\User\User;
use Bitrix\Im\V2\Entity\User\UserType;
use Bitrix\Im\V2\Permission\Action;
use Bitrix\Im\V2\Permission\ActionGroup;
use Bitrix\Im\V2\Permission\GlobalAction;
use Bitrix\Main\Engine\Response\Converter;

class Permission
{
	public const TYPE_DEFAULT = 'DEFAULT';

	private static array $permissionsByChatTypes;
	private static array $permissionsByUserTypes;
	private static array $groupDefinitions;

	private bool $jsonFormat;
	private Converter $converter;

	public function __construct(bool $jsonFormat = true)
	{
		$this->jsonFormat = $jsonFormat;
		$this->converter = new Converter(Converter::KEYS | Converter::VALUES | Converter::RECURSIVE | Converter::TO_CAMEL | Converter::LC_FIRST);
	}

	public function getByChatTypes(): array
	{
		if (!isset(self::$permissionsByChatTypes))
		{
			$this->loadByChatTypes();
		}

		if ($this->jsonFormat)
		{
			return $this->converter->process(self::$permissionsByChatTypes);
		}

		return self::$permissionsByChatTypes;
	}

	private function loadByChatTypes(): void
	{
		$this->loadByChatTypesInternal();
		$this->loadByChatTypesExternal();
		$default = self::$permissionsByChatTypes[self::TYPE_DEFAULT];

		foreach (self::$permissionsByChatTypes as $code => $value)
		{
			self::$permissionsByChatTypes[$code] = array_merge($default, $value);
		}
	}

	private function loadByChatTypesInternal(): void
	{
		$generalChat = GeneralChat::get();
		$roleForPostToGeneral = Chat::ROLE_MEMBER;
		if ($generalChat !== null)
		{
			$roleForPostToGeneral = $generalChat->getManageMessages();
		}

		$generalChannel = GeneralChannel::get();
		$roleForPostToGeneralChannel = Chat::ROLE_MEMBER;
		if ($generalChannel !== null)
		{
			$roleForPostToGeneralChannel = $generalChannel->getManageMessages();
		}

		$default = $this->getDefaultByChatTypes();

		self::$permissionsByChatTypes[self::TYPE_DEFAULT] = $default;

		self::$permissionsByChatTypes[Type::Private->value] = [
			Action::ChangeAvatar->value => Chat::ROLE_NONE,
			Action::Rename->value => Chat::ROLE_NONE,
			Action::Mute->value => Chat::ROLE_NONE,
			Action::Leave->value => Chat::ROLE_NONE,
			Action::LeaveOwner->value => Chat::ROLE_NONE,
			Action::UserList->value => Chat::ROLE_NONE,
			Action::ChangeMessagesAutoDeleteDelay->value => Chat::ROLE_MEMBER,
		];

		self::$permissionsByChatTypes[Type::General->value] = [
			Action::ChangeAvatar->value => Chat::ROLE_NONE,
			Action::Rename->value => Chat::ROLE_NONE,
			Action::Extend->value => Chat::ROLE_NONE,
			Action::Leave->value => Chat::ROLE_NONE,
			Action::LeaveOwner->value => Chat::ROLE_NONE,
			Action::Send->value => $roleForPostToGeneral,
			Action::DeleteOthersMessage->value => Chat::ROLE_MANAGER,
		];

		self::$permissionsByChatTypes[Type::GeneralChannel->value] = [
			Action::ChangeAvatar->value => Chat::ROLE_NONE,
			Action::Rename->value => Chat::ROLE_NONE,
			Action::Extend->value => Chat::ROLE_NONE,
			Action::Leave->value => Chat::ROLE_NONE,
			Action::LeaveOwner->value => Chat::ROLE_NONE,
			Action::Send->value => $roleForPostToGeneralChannel,
			Action::DeleteOthersMessage->value => Chat::ROLE_MANAGER,
			Action::Call->value => Chat::ROLE_NONE,
			Action::CreateTask->value => Chat::ROLE_NONE,
			Action::CreateMeeting->value => Chat::ROLE_NONE,
		];

		self::$permissionsByChatTypes[Type::Copilot->value] = [
			Action::Call->value => Chat::ROLE_NONE,
			Action::Delete->value => Chat::ROLE_OWNER,
			Action::LeaveOwner->value => Chat::ROLE_NONE,
		];

		self::$permissionsByChatTypes[Type::Announcement->value] = [
			Action::LeaveOwner->value => Chat::ROLE_OWNER,
			Action::Send->value => Chat::ROLE_MANAGER,
		];

		self::$permissionsByChatTypes[Type::Channel->value] = [
			Action::Call->value => Chat::ROLE_NONE,
			Action::CreateTask->value => Chat::ROLE_NONE,
			Action::CreateMeeting->value => Chat::ROLE_NONE,
			Action::DeleteOthersMessage->value => Chat::ROLE_MANAGER,
			Action::Update->value => Chat::ROLE_OWNER,
			Action::Delete->value => Chat::ROLE_OWNER,
		];

		self::$permissionsByChatTypes[Type::OpenChannel->value] = [
			Action::Call->value => Chat::ROLE_NONE,
			Action::CreateTask->value => Chat::ROLE_NONE,
			Action::CreateMeeting->value => Chat::ROLE_NONE,
			Action::DeleteOthersMessage->value => Chat::ROLE_MANAGER,
			Action::Update->value => Chat::ROLE_OWNER,
			Action::Delete->value => Chat::ROLE_OWNER,
		];

		self::$permissionsByChatTypes[Type::Comment->value] = [
			Action::Call->value => Chat::ROLE_NONE,
			Action::Extend->value => Chat::ROLE_NONE,
			Action::DeleteOthersMessage->value => Chat::ROLE_MANAGER,
			Action::Delete->value => Chat::ROLE_OWNER,
			Action::PinChat->value => Chat::ROLE_NONE,
			Action::HideChat->value => Chat::ROLE_NONE,
		];

		self::$permissionsByChatTypes[Type::Support24Notifier->value] = [
			Action::ChangeAvatar->value => Chat::ROLE_NONE,
			Action::Rename->value => Chat::ROLE_NONE,
			Action::LeaveOwner->value => Chat::ROLE_NONE,
		];

		self::$permissionsByChatTypes[Type::Support24Question->value] = [
			Action::ChangeAvatar->value => Chat::ROLE_NONE,
			Action::Extend->value => Chat::ROLE_NONE,
			Action::Call->value => Chat::ROLE_NONE,
			Action::Mute->value => Chat::ROLE_NONE,
			Action::Leave->value => Chat::ROLE_NONE,
			Action::LeaveOwner->value => Chat::ROLE_NONE,
			Action::UserList->value => Chat::ROLE_NONE,
		];

		self::$permissionsByChatTypes[Type::NetworkDialog->value] =
			self::$permissionsByChatTypes[Type::Support24Question->value]
		;

		self::$permissionsByChatTypes[Type::Sonet->value] = [
			Action::ChangeAvatar->value => Chat::ROLE_NONE,
			Action::Rename->value => Chat::ROLE_NONE,
			Action::Extend->value => Chat::ROLE_NONE,
			Action::Leave->value => Chat::ROLE_NONE,
			Action::LeaveOwner->value => Chat::ROLE_NONE,
			Action::ChangeMessagesAutoDeleteDelay->value => Chat::ROLE_MANAGER,
		];

		self::$permissionsByChatTypes[Type::Collab->value] = [
			Action::ChangeAvatar->value => Chat::ROLE_NONE,
			Action::Rename->value => Chat::ROLE_NONE,
			Action::Update->value => Chat::ROLE_OWNER,
			Action::Delete->value => Chat::ROLE_OWNER,
			Action::LeaveOwner->value => Chat::ROLE_NONE,
			Action::UpdateInviteLink->value => Chat::ROLE_OWNER,
			Action::CreateDocumentSign->value => Chat::ROLE_MEMBER,
			Action::CreateCalendarSlots->value => Chat::ROLE_MEMBER,
			Action::ChangeMessagesAutoDeleteDelay->value => Chat::ROLE_MANAGER,
		];

		self::$permissionsByChatTypes[Type::Tasks->value] = [
			Action::ChangeMessagesAutoDeleteDelay->value => Chat::ROLE_MANAGER,
		];

		self::$permissionsByChatTypes[Type::Calendar->value] = [
			Action::ChangeMessagesAutoDeleteDelay->value => Chat::ROLE_MANAGER,
		];

		self::$permissionsByChatTypes[Type::Crm->value] = [
			Action::ChangeAvatar->value => Chat::ROLE_NONE,
			Action::Rename->value => Chat::ROLE_NONE,
			Action::LeaveOwner->value => Chat::ROLE_NONE,
		];

		self::$permissionsByChatTypes[Type::Call->value] = [
			Action::Extend->value => Chat::ROLE_NONE,
			Action::Call->value => Chat::ROLE_NONE,
			Action::Mute->value => Chat::ROLE_NONE,
			Action::Leave->value => Chat::ROLE_NONE,
			Action::LeaveOwner->value => Chat::ROLE_NONE,
		];

		self::$permissionsByChatTypes[Type::Chat->value] = [
			Action::Update->value => Chat::ROLE_OWNER,
			Action::Delete->value => Chat::ROLE_OWNER,
			Action::ChangeMessagesAutoDeleteDelay->value => Chat::ROLE_MANAGER,
		];

		self::$permissionsByChatTypes[Type::OpenChat->value] = [
			Action::Update->value => Chat::ROLE_OWNER,
			Action::Delete->value => Chat::ROLE_OWNER,
			Action::ChangeMessagesAutoDeleteDelay->value => Chat::ROLE_MANAGER,
		];

		self::$permissionsByChatTypes[Type::Videoconference->value] = [
			Action::Update->value => Chat::ROLE_OWNER,
			Action::Delete->value => Chat::ROLE_OWNER,
		];

		self::$permissionsByChatTypes[Type::Lines->value] = [
			Action::LeaveOwner->value => Chat::ROLE_NONE,
			Action::Call->value => Chat::ROLE_NONE,
			Action::ChangeOwner->value => Chat::ROLE_NONE,
			Action::ChangeManagers->value => Chat::ROLE_NONE,
			Action::Mute->value => Chat::ROLE_NONE,
			Action::PinChat->value => Chat::ROLE_NONE,
			Action::HideChat->value => Chat::ROLE_NONE,
		];
	}

	private function getDefaultByChatTypes(): array
	{
		return [
			Action::ChangeAvatar->value => Chat::ROLE_MEMBER,
			Action::Rename->value => Chat::ROLE_MEMBER,
			Action::Extend->value => Chat::ROLE_MEMBER,
			Action::Call->value => Chat::ROLE_MEMBER,
			Action::Mute->value => Chat::ROLE_MEMBER,
			Action::Leave->value => Chat::ROLE_MEMBER,
			Action::LeaveOwner->value => Chat::ROLE_MEMBER,
			Action::Send->value => Chat::ROLE_MEMBER,
			Action::UserList->value => Chat::ROLE_MEMBER,
			Action::CreateTask->value => Chat::ROLE_MEMBER,
			Action::CreateMeeting->value => Chat::ROLE_MEMBER,
			Action::DeleteOthersMessage->value => Chat::ROLE_NONE,
			Action::Update->value => Chat::ROLE_NONE,
			Action::Delete->value => Chat::ROLE_NONE,
			Action::UpdateInviteLink->value => Chat::ROLE_NONE,
			Action::CreateDocumentSign->value => Chat::ROLE_NONE,
			Action::CreateCalendarSlots->value => Chat::ROLE_NONE,
			Action::ChangeMessagesAutoDeleteDelay->value => Chat::ROLE_NONE,
			Action::PinChat->value => Chat::ROLE_MEMBER,
			Action::HideChat->value => Chat::ROLE_MEMBER,
		];
	}

	private function loadByChatTypesExternal(): void
	{
		$externalTypes = ExternalTypeRegistry::getInstance()->getConfigs();
		foreach ($externalTypes as $externalType => $config)
		{
			if (!empty($config->permissions))
			{
				self::$permissionsByChatTypes[$externalType] = $config->permissions;
			}
		}
	}

	public function getByUserTypes(): array
	{
		if (isset(self::$permissionsByUserTypes))
		{
			if ($this->jsonFormat)
			{
				return $this->converter->process(self::$permissionsByUserTypes);
			}

			return self::$permissionsByUserTypes;
		}

		self::$permissionsByUserTypes = [
			UserType::USER->value => [
				GlobalAction::GetChannels->value => true,
				GlobalAction::CreateChannel->value => true,
				GlobalAction::CreateConference->value => true,
				GlobalAction::CreateCopilot->value => true,
				GlobalAction::CreateChat->value => true,
				GlobalAction::GetMarket->value => true,
				GlobalAction::GetOpenlines->value => true,
				GlobalAction::CreateCollab->value => true,
				GlobalAction::LeaveCollab->value => true,
				GlobalAction::ChangeMessagesAutoDeleteDelay->value => true,
			],
			UserType::EXTRANET->value => [
				GlobalAction::GetChannels->value => false,
				GlobalAction::CreateChannel->value => false,
				GlobalAction::CreateConference->value => false,
				GlobalAction::CreateCopilot->value => false,
				GlobalAction::CreateChat->value => false,
				GlobalAction::GetMarket->value => false,
				GlobalAction::GetOpenlines->value => false,
				GlobalAction::CreateCollab->value => false,
				GlobalAction::LeaveCollab->value => false,
				GlobalAction::ChangeMessagesAutoDeleteDelay->value => false,
			],
			UserType::COLLABER->value => [
				GlobalAction::GetChannels->value => false,
				GlobalAction::CreateChannel->value => false,
				GlobalAction::CreateConference->value => false,
				GlobalAction::CreateCopilot->value => true,
				GlobalAction::CreateChat->value => false,
				GlobalAction::GetMarket->value => false,
				GlobalAction::GetOpenlines->value => false,
				GlobalAction::CreateCollab->value => false,
				GlobalAction::LeaveCollab->value => false,
				GlobalAction::ChangeMessagesAutoDeleteDelay->value => false,
			],
		];

		if ($this->jsonFormat)
		{
			return $this->converter->process(self::$permissionsByUserTypes);
		}

		return self::$permissionsByUserTypes;
	}

	protected static function canDoByUserType(UserType $type, GlobalAction $action): bool
	{
		$permissionService = new static(false);
		$permissions = $permissionService->getByUserTypes();

		return $permissions[$type->value][$action->value] ?? true;
	}

	public static function canDoGlobalAction(int $userId, GlobalAction $action, mixed $target): bool
	{
		$action = self::specifyGlobalAction($action, $target);
		$user = User::getInstance($userId);

		return self::canDoByUserType($user->getType(), $action);
	}

	protected static function specifyGlobalAction(GlobalAction $action, mixed $target): GlobalAction
	{
		if ($action === GlobalAction::CreateChat && is_array($target))
		{
			$type = $target['TYPE'] ?? Chat::IM_TYPE_CHAT;
			$entityType = $target['ENTITY_ID'] ?? null;

			if ($type === Chat::IM_TYPE_CHAT && $entityType === Chat::ENTITY_TYPE_VIDEOCONF)
			{
				return GlobalAction::CreateConference;
			}

			if ($type === Chat::IM_TYPE_CHANNEL || $type === Chat::IM_TYPE_OPEN_CHANNEL)
			{
				return GlobalAction::CreateChannel;
			}

			if ($type === Chat::IM_TYPE_COPILOT)
			{
				return GlobalAction::CreateCopilot;
			}

			return GlobalAction::CreateChat;
		}

		return $action;
	}

	public static function getRoleForActionByType(string $type, Action $action): string
	{
		$permissionService = new static(false);
		$permissions = $permissionService->getByChatTypes();
		$permissionsByType = $permissions[$type] ?? $permissions[self::TYPE_DEFAULT];

		return $permissionsByType[$action->value] ?? Chat::ROLE_GUEST;
	}

	public static function canDoActionByUserType(int $userId, Action $action, mixed $target): bool
	{
		$globalAction = $action->getRelatedGlobalAction();

		if (!isset($globalAction))
		{
			return true;
		}

		return self::canDoGlobalAction($userId, $globalAction, $target);
	}

	public function getActionGroupDefinitions(): array
	{
		if (isset(self::$groupDefinitions))
		{
			if ($this->jsonFormat)
			{
				return $this->converter->process(self::$groupDefinitions);
			}

			return self::$groupDefinitions;
		}

		self::$groupDefinitions = ActionGroup::getDefinitions();

		if ($this->jsonFormat)
		{
			return $this->converter->process(self::$groupDefinitions);
		}

		return self::$groupDefinitions;
	}

	public function getDefaultPermissionForGroupActions(): array
	{
		$channelDefaultPermissions = ActionGroup::getDefaultPermissions();
		$channelDefaultPermissions[ActionGroup::ManageMessages->value] = Chat::ROLE_MANAGER;
		$channelDefaultPermissions[ActionGroup::ManageUi->value] = Chat::ROLE_MANAGER;

		$defaultPermissionsByTypes = [
			self::TYPE_DEFAULT => ActionGroup::getDefaultPermissions(),
			Type::Channel->value => $channelDefaultPermissions,
			Type::OpenChannel->value => $channelDefaultPermissions,
		];

		if ($this->jsonFormat)
		{
			return $this->converter->process($defaultPermissionsByTypes);
		}

		return $defaultPermissionsByTypes;
	}

	public static function specifyAction(Action $action, Chat $targetChat, mixed $target): Action
	{
		if ($action !== Action::Kick)
		{
			return $action;
		}

		if (!is_int($target))
		{
			return $action;
		}

		$currentUserId = $targetChat->getContext()->getUserId();

		if ($target === $currentUserId)
		{
			if ($currentUserId === $targetChat->getAuthorId())
			{
				return Action::LeaveOwner;
			}

			return Action::Leave;
		}

		return Action::Kick;
	}

	public static function compareRole(string $userRole, string $needRole): bool
	{
		if ($needRole === Chat::ROLE_NONE)
		{
			return false;
		}

		$ascendingRoles = [Chat::ROLE_GUEST, Chat::ROLE_MEMBER, Chat::ROLE_MANAGER, Chat::ROLE_OWNER];
		$userRolePos = array_search($userRole, $ascendingRoles, true);
		$needRolePos = array_search($needRole, $ascendingRoles, true);

		if ($userRolePos === false || $needRolePos === false)
		{
			return false;
		}

		return $userRolePos >= $needRolePos;
	}
}
