<?php

declare(strict_types=1);

namespace Bitrix\Intranet\User\Access\Model;

use Bitrix\Intranet\Entity\User;
use Bitrix\Intranet\Enum\InvitationStatus;
use Bitrix\Intranet\Service\ServiceContainer;
use Bitrix\Main\Access\AccessibleItem;
use Bitrix\Main\Access\Exception\AccessException;
use Bitrix\Main\Access\Exception\UnknownActionException;

final class TargetUserModel implements AccessibleItem
{
	private ?User $user = null;

	private static $cachedTargetUserModel = [];

	public static function createFromId(int $itemId): TargetUserModel
	{
		if (isset(self::$cachedTargetUserModel[$itemId]))
		{
			return self::$cachedTargetUserModel[$itemId];
		}

		$model = new self();
		$userRepository = ServiceContainer::getInstance()->userRepository();
		$model->user = $userRepository->getUserById($itemId);
		self::$cachedTargetUserModel[$itemId] = $model;

		return $model;
	}

	public static function createFromArray(array $user): TargetUserModel
	{
		if (!isset($user['ID']))
		{
			throw new AccessException('user id is not set');
		}

		if (isset(self::$cachedTargetUserModel[$user['ID']]))
		{
			return self::$cachedTargetUserModel[$user['ID']];
		}

		$model = new self();
		$model->user = User::initByArray($user);
		self::$cachedTargetUserModel[$user['ID']] = $model;

		return $model;
	}

	public static function createFromUserEntity(User $user): TargetUserModel
	{
		if (!$user->getId())
		{
			throw new AccessException('user id is not set');
		}

		if (isset(self::$cachedTargetUserModel[$user->getId()]))
		{
			return self::$cachedTargetUserModel[$user->getId()];
		}

		$model = new self();
		$model->user = $user;
		self::$cachedTargetUserModel[$user->getId()] = $model;

		return $model;
	}

	public function getId(): int
	{
		return $this->user?->getId() ?? 0;
	}

	public function isIntegrator(): bool
	{
		return $this->user?->isIntegrator() ?? false;
	}

	public function isAdmin(): bool
	{
		return $this->user?->isAdmin() ?? false;
	}

	public function getInviteStatus(): ?InvitationStatus
	{
		$a = $this->user?->getInviteStatus();
		return $this->user?->getInviteStatus();
	}
}
