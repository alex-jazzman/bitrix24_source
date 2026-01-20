<?php

if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die;
}

use Bitrix\Mail\Access\MailAccessController;
use Bitrix\Mail\Access\MailActionDictionary;
use Bitrix\Mail\Access\Service\RolePermissionService;
use Bitrix\Mail\Access\Service\RoleRelationService;
use Bitrix\Main;
use Bitrix\Main\Localization\Loc;

if (!Main\Loader::includeModule('mail'))
{
	return;
}

class MailConfigPermissionsAjaxController extends Main\Engine\Controller
{
	public function savePermissionsAction(array $userGroups = [], ?array $deletedUserGroups = null): ?array
	{
		if (
			!$this->getCurrentUser()
			|| !MailAccessController::can($this->getCurrentUser()->getId(), MailActionDictionary::ACTION_CONFIG_PERMISSIONS_EDIT)
			|| !\Bitrix\Mail\Helper\LicenseManager::isAccessRightsEnabled()
		)
		{
			$this->addError(new Main\Error(
				Loc::getMessage('MAIL_CONFIG_PERMISSIONS_SAVE_PERMISSIONS_NO_ACCESS_ERROR'),
				'ACCESS_DENIED',
			));

			return null;
		}

		try
		{
			$permissionService = new RolePermissionService();
			$relationService = new RoleRelationService();

			if (!empty($userGroups))
			{
				$updatedUserGroups = $permissionService->saveRolePermissions($userGroups);

				$relationService->saveRoleRelations($updatedUserGroups);
			}

			if (is_array($deletedUserGroups) && !empty($deletedUserGroups))
			{
				$permissionService->deleteRoles($deletedUserGroups);
			}

			return [
				'USER_GROUPS' => $permissionService->getUserGroups(),
			];
		}
		catch (\Exception $e)
		{
			$this->addError(new Main\Error(Loc::getMessage('MAIL_CONFIG_PERMISSIONS_DB_ERROR'), $e->getCode()));
		}

		return null;
	}
}
