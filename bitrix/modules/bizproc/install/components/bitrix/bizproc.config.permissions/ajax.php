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
			// What the page could not express, this save must not delete: the answer comes from the render that
			// built this payload, not from the portal state at the moment of writing it.
			preserveInexpressibleValues: !PermissionMatrixProvider::pageCouldExpressOwnSentinel($parameters),
		);

		$result = $command->run();
		if (!$result->isSuccess())
		{
			$this->errorCollection->add($result->getErrors());

			return null;
		}

		// The page keeps the answer of its own render for every following save, so the matrix it gets back is
		// built in that same mode: otherwise the two halves part ways for the rest of the session.
		return $provider->getDataForSaveResponse($parameters);
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
