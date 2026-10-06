<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Internal\Access\AccessController;
use Bitrix\Bizproc\Internal\Access\Permission\PermissionDictionary;
use Bitrix\Bizproc\Public\Command\SaveRolePermissionsCommand;
use Bitrix\Bizproc\Public\Provider\PermissionMatrixProvider;
use Bitrix\Main\Engine\Controller;
use Bitrix\Main\Error;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;

if (!Loader::includeModule('bizproc') || !Loader::includeModule('ui'))
{
	return;
}

class BizprocConfigPermissionsAjaxController extends Controller
{
	/**
	 * @return null|array{USER_GROUPS: array, ACCESS_RIGHTS: array} DTO-01
	 */
	public function getPermissionsAction(): ?array
	{
		if (!$this->checkAccess())
		{
			return null;
		}

		return (new PermissionMatrixProvider())->getData();
	}

	/**
	 * @param array[] $userGroups full desired state of the delegate's area
	 * @param array<int, int|string> $deletedUserGroups
	 *
	 * @return null|array{USER_GROUPS: array, ACCESS_RIGHTS: array} DTO-01
	 */
	public function savePermissionsAction(
		array $userGroups = [],
		array $deletedUserGroups = [],
		array $parameters = [],
		array $accessRights = [],
	): ?array
	{
		if (!$this->checkAccess())
		{
			return null;
		}

		$provider = new PermissionMatrixProvider();
		$command = new SaveRolePermissionsCommand(
			(int)$this->getCurrentUser()?->getId(),
			$provider->decodeUserGroups($userGroups),
			array_map('intval', $deletedUserGroups),
		);

		$result = $command->run();
		if (!$result->isSuccess())
		{
			$this->errorCollection->add($result->getErrors());

			return null;
		}

		return $provider->getData();
	}

	private function checkAccess(): bool
	{
		if (
			PermissionMatrixProvider::isConfigurationFeatureEnabled()
			&& AccessController::getCurrent()->check((string)PermissionDictionary::BIZPROC_TEMPLATE_CONFIGURE_RIGHTS)
		)
		{
			return true;
		}

		$this->errorCollection[] = new Error(Loc::getMessage('BIZPROC_CONFIG_PERMISSIONS_ACCESS_DENIED'));

		return false;
	}
}
