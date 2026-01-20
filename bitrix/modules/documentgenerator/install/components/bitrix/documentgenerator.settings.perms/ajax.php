<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !==true)
{
	die();
}

use Bitrix\DocumentGenerator\Engine\CheckPermissions;
use Bitrix\DocumentGenerator\Engine\CheckPermissionsFeature;
use Bitrix\DocumentGenerator\Integration\UI\AccessRights\V2\AccessRightsProvider;
use Bitrix\DocumentGenerator\Integration\UI\AccessRights\V2\Models\RightModel;
use Bitrix\DocumentGenerator\Model\Role;
use Bitrix\DocumentGenerator\Model\RoleAccess;
use Bitrix\DocumentGenerator\Model\RolePermission;
use Bitrix\DocumentGenerator\Model\RoleTable;
use Bitrix\DocumentGenerator\Repository\RoleRepository;
use Bitrix\DocumentGenerator\UserPermissions;
use Bitrix\Main\Engine\JsonController;
use Bitrix\Main\Loader;
use Bitrix\Main\Request;
use Bitrix\UI\AccessRights\V2\AccessRightsBuilder;
use Bitrix\UI\AccessRights\V2\Dto\Controller\AccessRightsSaveResponse;
use Bitrix\UI\AccessRights\V2\Dto\Controller\UserGroupDto;

Loader::requireModule('documentgenerator');
Loader::requireModule('ui');

final class DocumentGeneratorSettingsPermsAjaxController extends JsonController
{
	private readonly RoleRepository $roleRepository;
	private readonly AccessRightsBuilder $accessRightsBuilder;

	public function __construct(Request $request = null)
	{
		parent::__construct($request);

		$this->roleRepository = new RoleRepository();
		$this->accessRightsBuilder = new AccessRightsBuilder(new AccessRightsProvider($this->roleRepository));
	}

	protected function getDefaultPreFilters(): array
	{
		return [
			...parent::getDefaultPreFilters(),

			new CheckPermissions(UserPermissions::ENTITY_SETTINGS),
			new CheckPermissionsFeature(),
		];
	}

	public function saveAction(array $userGroups, array $deletedUserGroups, array $parameters = []): ?AccessRightsSaveResponse
	{
		$roleCollection = $this->roleRepository->fetchByIds($deletedUserGroups);
		foreach ($roleCollection->getAll() as $role)
		{
			$deleteResult = $role->delete();
			if (!$deleteResult->isSuccess())
			{
				$this->addError($deleteResult->getError());

				return null;
			}
		}

		$userGroupDTOs = UserGroupDto::fromArrayList($userGroups);
		foreach ($userGroupDTOs as $userGroupDTO)
		{
			$isNew = (int)$userGroupDTO->id <= 0;

			$roleModel = $isNew
				? RoleTable::createObject()
				: Role::wakeUp((int)$userGroupDTO->id);

			$roleModel->setName($userGroupDTO->title);

			if (!$isNew)
			{
				$roleModel->removeAllPermissions();
				$roleModel->removeAllAccesses();
			}

			foreach ($userGroupDTO->accessRights as $accessRight)
			{
				/** @var RightModel $decodedValue */
				$decodedValue = $this->accessRightsBuilder->decodeAccessCode($accessRight);
				if (empty($decodedValue->attribute))
				{
					continue;
				}

				$permissionModel = (new RolePermission())
					->setRole($roleModel)
					->setEntity($decodedValue->entityId)
					->setAction($decodedValue->actionId)
					->setPermission($decodedValue->attribute);

				$roleModel->addToPermissions($permissionModel);
			}

			foreach ($userGroupDTO->accessCodes as $accessCode)
			{
				$accessCodeModel = (new RoleAccess())
					->setRole($roleModel)
					->setAccessCode($accessCode->accessCode);

				$roleModel->addToAccesses($accessCodeModel);
			}

			$saveResult = $roleModel->save();
			if (!$saveResult->isSuccess())
			{
				$this->addError($saveResult->getError());

				return null;
			}
		}

		return new AccessRightsSaveResponse($this->accessRightsBuilder->buildUserGroups());
	}
}
