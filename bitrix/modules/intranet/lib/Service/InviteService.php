<?php

namespace Bitrix\Intranet\Service;

use Bitrix\Intranet\Command;
use Bitrix\Intranet\CurrentUser;
use Bitrix\Intranet\Entity\Collection\UserCollection;
use Bitrix\Intranet\Entity\Type\InvitationsContainer;
use Bitrix\Intranet\Entity\Invitation;
use Bitrix\Intranet\Entity\User;
use Bitrix\Intranet\Enum\InvitationType;
use Bitrix\Intranet\Contract\Repository\UserRepository as UserRepositoryContract;
use Bitrix\Intranet\Exception\InvitationFailedException;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\Loader;
use Bitrix\Main\LoaderException;
use Bitrix\Main\ObjectPropertyException;
use Bitrix\Main\Result;
use Bitrix\Main\SystemException;
use Bitrix\Main\Error;
use Bitrix\Intranet\Invitation\Register;
use Bitrix\SocialNetwork\Collab\Analytics\CollabAnalytics;
use Bitrix\Socialnetwork\Internals\Registry\GroupRegistry;
use Bitrix\Socialnetwork\Item\Workgroup\Type;

class InviteService
{
	private UserRepositoryContract $userRepository;

	public function __construct()
	{
		$this->userRepository = ServiceContainer::getInstance()->userRepository();
	}

	public function inviteUser(User $user, InvitationType $type, string $formType): Invitation
	{
		return ServiceContainer::getInstance()->invitationRepository()->save(new Invitation(
			userId: $user->getId(),
			initialized: false,
			isMass: $formType === 'mass',
			isDepartment: $formType === 'group',
			isIntegrator: false,
			isRegister: false,
			id: null,
			originatorId: CurrentUser::get()->getId(),
			type: $type,
		));
	}

	public function inviteUsers(InvitationsContainer $invitationsContainer): UserCollection
	{
		$invitationItems = $invitationsContainer->backwardsCompatibility();

		$result = Register::inviteNewUsers(
			SITE_ID,
			$invitationItems,
			'email',
		);

		if (!$result->isSuccess())
		{
			throw new InvitationFailedException($result->getErrorCollection());
		}

		return $this->userRepository->findUsersByIds($result->getData());
	}

	/**
	 * @throws LoaderException
	 * @throws ArgumentException
	 * @throws ObjectPropertyException
	 * @throws SystemException
	 */
	public function inviteUsersToGroup(int $groupId, InvitationsContainer $inviteData): Result
	{
		$result = new Result();

		if (!Loader::includeModule('socialnetwork'))
		{
			throw new SystemException('Module "socialnetwork" is not installed');
		}

		$group = GroupRegistry::getInstance()->get($groupId);

		if ($group === null)
		{
			$result->addError(new Error('', 'socnetgroup_not_found'));

			return $result;
		}

		$invitationItems = $inviteData->backwardsCompatibility();
		if ($group->getType() === Type::Collab)
		{
			$invitationItems['COLLAB_GROUP'] = $group;
		}

		$result = Register::inviteNewUsers(
			SITE_ID,
			$invitationItems,
			'email',
		);

		if (!$result->isSuccess())
		{
			return $result;
		}

		$userCollection = $this->userRepository->findUsersByIds($result->getData());
		$inviteCommand = new Command\Invitation\InviteUserCollectionToGroupCommand(
			groupId: $groupId,
			userCollection: $userCollection,
		);
		$inviteToGroupResult = $inviteCommand->execute();

		if (!$inviteToGroupResult->isSuccess())
		{
			return $inviteToGroupResult;
		}

		if ($group->getType() === Type::Collab)
		{
			$this->sendAnalyticsInvitationsCollabs($groupId, $inviteToGroupResult, $invitationItems);
		}

		$result->setData($userCollection->all());

		return $result;
	}

	private function sendAnalyticsInvitationsCollabs(int $groupId, Result $inviteToGroupResult, array $invitationItems): void
	{
		/** @var InvitationType $type */
		$type = null;

		foreach ($inviteToGroupResult->getData() as $user)
		{
			$index = array_search($user->getEmail(), array_column($invitationItems['ITEMS'], 'EMAIL'));

			$type = InvitationType::PHONE;
			if ($index !== false)
			{
				$type = InvitationType::EMAIL;
			}

			CollabAnalytics::getInstance()->onUserInvitation($user->getId(), $groupId, $type->value);
		}
	}

	/**
	 * @param array<int> $userIds
	 * @return array<int, string|null>
	 */
	public function getFormattedInvitationNameByIds(array $userIds): array
	{
		$names = [];

		$this->userRepository->findUsersByIds($userIds)->forEach(
			function (User $user) use (&$names) {
				$names[$user->getId()] = $user->getAuthPhoneNumber() ?? $user->getEmail() ?? $user->getLogin();
		});

		return $names;
	}
}
