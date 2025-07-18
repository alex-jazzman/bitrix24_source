<?php declare(strict_types = 1);

namespace Bitrix\AI\ShareRole\Service\GridRole;

use Bitrix\AI\ShareRole\Repository\UserAccessRepository;
use Bitrix\AI\ShareRole\Service\GridRole\Dto\ShareDto;
use Bitrix\Main\Access\AccessCode;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\ObjectPropertyException;
use Bitrix\Main\SystemException;
use Bitrix\Main\UI\AccessRights\Exception\UnknownEntityTypeException;

class PartGridRoleService extends GridRoleService
{
	/**
	 * @throws ObjectPropertyException
	 * @throws SystemException
	 * @throws ArgumentException
	 */
	public function getShare(int $roleId, int $userId): array
	{
		$codesData = $this->shareRepository->getAccessCodesForRole($roleId);
		if (empty($codesData))
		{
			return [];
		}

		[$result, $userIdList] = $this->getShareData($codesData, $userId);

		if (empty($userIdList))
		{
			return $result;
		}

		return $this->fillUsers($result, $userIdList);
	}

	/**
	 * @return list<array{ACCESS_CODE: string}>
	 */
	protected function getShareData(array $codesData, int $userId): array
	{
		$accessRightsDataProvider = $this->getAccessRightsDataProvider();
		$userGroups = array_flip($this->userAccessRepository->getCodesForUserGroup($userId));

		$result = [];
		$userIdList = [];
		foreach ($codesData as $codeData)
		{
			if (empty($codeData['ACCESS_CODE']))
			{
				continue;
			}

			$code = $codeData['ACCESS_CODE'];
			if (UserAccessRepository::CODE_ALL_USER === $code)
			{
				$result = [
					new ShareDto($this->getAllUsersEntityName(), $code)
				];

				$userIdList = [];
				break;
			}

			$accessCode = new AccessCode($code);
			if ($accessCode->getEntityType() === AccessCode::TYPE_USER)
			{
				$userIdList[] = $accessCode->getEntityId();
				continue;
			}

			try
			{
				$entity = $accessRightsDataProvider->getEntity(
					$accessCode->getEntityType(),
					$accessCode->getEntityId()
				);
			}
			catch (UnknownEntityTypeException $exception)
			{
				$this->log('Not Found ' . $accessCode->getEntityType());
				continue;
			}

			$result[] = $this->getShareDTO($entity, $userGroups, $code);
		}

		return [$result, $userIdList];
	}

	protected function fillUsers(array $result, array $userIdList): array
	{
		$usersData = $this->userRepository->getMainUserData($userIdList);
		if (empty($usersData))
		{
			return $result;
		}

		$format = $this->getNameFormat();

		foreach ($usersData as $userData)
		{
			$result[] = new ShareDto(
				\CUser::formatName(
					$format,
					[
						'NAME' => $userData['NAME'] ?? '',
						'LAST_NAME' => $userData['LAST_NAME'] ?? '',
						'SECOND_NAME' => $userData['SECOND_NAME'] ?? '',
						'EMAIL' => $userData['EMAIL'] ?? '',
						'ID' => $userData['ID'] ?? '',
						'LOGIN' => $userData['LOGIN'] ?? '',
					],
					true,
					false
				),
				$this->getCodeForUser((int)$userData['ID']),
				$this->getUserPhotoUrl([
					'PERSONAL_PHOTO' => $userData['PERSONAL_PHOTO'],
					'PERSONAL_GENDER' => $userData['PERSONAL_GENDER']
				])
			);
		}

		return $result;
	}
}
