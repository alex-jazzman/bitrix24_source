<?php

namespace Bitrix\Tasks\Flow\Provider;

use Bitrix\Main\ArgumentException;
use Bitrix\Main\ObjectPropertyException;
use Bitrix\Main\SystemException;
use Bitrix\Main\UserTable;
use Bitrix\Tasks\Flow\User\User;
use Bitrix\Tasks\Flow\User\Tool;

final class UserProvider
{
	private const ADMIN_GROUP_ID = 1;

	private static int $defaultAdminId;
	private static array $users = [];

	private Tool $userTool;

	public function __construct()
	{
		$this->userTool = new Tool();
	}

	public static function getDefaultAdminId(): int
	{
		if (!isset(self::$defaultAdminId))
		{
			self::$defaultAdminId = self::calculateDefaultAdminId();
		}

		return self::$defaultAdminId;
	}

	private static function calculateDefaultAdminId(): int
	{
		$adminId = (int)\Bitrix\Tasks\Util\User::getAdminId();
		if ($adminId !== 0)
		{
			return $adminId;
		}

		$query = UserTable::query()
			->setSelect(['ID'])
			->where('GROUPS.GROUP_ID', self::ADMIN_GROUP_ID)
			->setOrder(['ID' => 'ASC'])
			->setLimit(1)
		;

		return (int)$query->fetchObject()?->getId();
	}

	/**
	 * @throws ObjectPropertyException
	 * @throws SystemException
	 * @throws ArgumentException
	 */
	public function getUsersInfo(array $userIds): array
	{
		$users = [];

		foreach ($userIds as $key => $userId)
		{
			$userData = $this->getFromCache($userId);
			if ($userData)
			{
				$users[$userId] = new User(
					$userData['id'],
					$userData['name'],
					$userData['photo'],
					$userData['pathToProfile'],
				);
				unset($userIds[$key]);
			}
		}
		if (!$userIds)
		{
			return $users;
		}

		$usersData = $this->getUsers($userIds);

		foreach ($usersData as $userData)
		{
			$photoId = $userData['PERSONAL_PHOTO'] ?: 0;
			$photo = $photoId ? $this->userTool->resizePhoto($photoId, 100, 100) : [];
			$name = $this->userTool->formatName($userData);
			$pathToProfile = $this->userTool->getPathToProfile($userData['ID']);

			$users[$userData['ID']] = $user = new User(
				$userData['ID'],
				$name,
				$photo,
				$pathToProfile,
			);

			self::$users[$userData['ID']] = $user->toArray();
		}

		return $users;
	}

	/**
	 * @throws ObjectPropertyException
	 * @throws SystemException
	 * @throws ArgumentException
	 */
	private function getUsers(array $userIds): array
	{
		$select = [
			'ID',
			'PERSONAL_PHOTO',
			'NAME',
			'LAST_NAME',
			'SECOND_NAME',
			'EXTERNAL_AUTH_ID',
			'UF_DEPARTMENT'
		];

		return UserTable::query()
			->setSelect($select)
			->whereIn('ID', $userIds)
			->exec()
			->fetchAll();
	}

	private function getFromCache(int $userId): array
	{
		if (array_key_exists($userId, self::$users))
		{
			return self::$users[$userId];
		}

		return [];
	}
}
