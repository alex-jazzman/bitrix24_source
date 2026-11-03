<?php

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die;

use Bitrix\Intranet\Internal\Integration\Bitrix24\Integrator\PartnerInfo;
use Bitrix\Intranet\Internal\Integration\Im\Notification\Message;
use Bitrix\Intranet\Internal\Integration\Im\Notification\NotifySender;
use Bitrix\Intranet\Entity\Collection\DepartmentCollection;
use Bitrix\Intranet\Public\Service\IntegratorService;
use Bitrix\Intranet\Public\Command\User\TransferToIntranetCommand;
use Bitrix\Intranet\Invitation;
use Bitrix\Intranet\Service\ServiceContainer;
use Bitrix\Intranet\User;
use Bitrix\Main\Loader;
use Bitrix\Main\Localization\Loc;
use Bitrix\Bitrix24\Integrator;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Engine\Response\Component;
use Bitrix\UI;

class CIntranetUserProfileComponentAjaxController extends \Bitrix\Main\Engine\Controller
{
	protected $userId;

	protected function processBeforeAction(\Bitrix\Main\Engine\Action $action)
	{
		parent::processBeforeAction($action);

		if ($action->getName() === 'showWidget')
		{
			return true;
		}

		if (!$this->getRequest()->isPost() || !$this->getRequest()->getPost('signedParameters'))
		{
			return false;
		}

		$parameters = $this->getUnsignedParameters();

		if (isset($parameters['ID']))
		{
			$this->userId = $parameters['ID'];
		}
		else
		{
			return false;
		}

		return true;
	}

	protected function canEditProfile()
	{
		global $USER;

		if (Loader::includeModule("socialnetwork"))
		{
			$currentUserPerms = \CSocNetUserPerms::initUserPerms(
				$USER->GetID(),
				$this->userId,
				\CSocNetUser::isCurrentUserModuleAdmin(SITE_ID, false),
			);

			if (
				$currentUserPerms["IsCurrentUser"]
				|| (
					$currentUserPerms["Operations"]["modifyuser"]
					&& $currentUserPerms["Operations"]["modifyuser_main"]
				)
			)
			{
				return true;
			}
		}

		return false;
	}

	/**
	 * @deprecated use \Bitrix\Intranet\Infrastructure\Controller\User::fireAction
	 */
	public function fireUserAction()
	{
		$currentUser = CurrentUser::get();

		$result = \Bitrix\Intranet\Util::deactivateUser([
			'userId' => $this->userId,
			'currentUserId' => $currentUser->getId(),
			'isCurrentUserAdmin' => $currentUser->isAdmin(),
		]);

		if ($result && $this->userId > 0)
		{
			$deactivateUser = new User($this->userId);
			Invitation::fullSyncCounterByUser($deactivateUser->fetchOriginatorUser());
		}

		return $result;
	}

	/**
	 * @deprecated use \Bitrix\Intranet\Infrastructure\Controller\User::restoreAction
	 */
	public function hireUserAction()
	{
		$currentUser = CurrentUser::get();

		return \Bitrix\Intranet\Util::activateUser([
			'userId' => $this->userId,
			'currentUserId' => $currentUser->getId(),
			'isCurrentUserAdmin' => $currentUser->isAdmin(),
		]);
	}

	public function confirmNotifyUserAction($userId, $isAccept): bool
	{
		return Invitation::confirmUserRequest((int)$userId, $isAccept === 'Y')->isSuccess();
	}

	/**
	 * @deprecated use \Bitrix\Intranet\Infrastructure\Controller\User::deleteAction
	 */
	public function deleteUserAction()
	{
		global $APPLICATION;

		if (!$this->canEditProfile())
		{
			return false;
		}

		$userData = \Bitrix\Main\UserTable::query()
			->setSelect(['ID', 'CONFIRM_CODE', 'ACTIVE'])
			->addFilter('ID', $this->userId)
			->fetch()
		;

		if (empty($userData['CONFIRM_CODE']) || $userData['ACTIVE'] !== 'Y')
		{
			$this->addError(new \Bitrix\Main\Error(GetMessage('INTRANET_USER_PROFILE_DELETE_ERROR')));

			return false;
		}

		$user = new CUser();
		$res = $user->Delete($this->userId);

		if (!$res)
		{
			$error = "";
			if (!empty($user->LAST_ERROR))
			{
				$error = $user->LAST_ERROR;
			}
			else
			{
				$ex = $APPLICATION->GetException();
				$error = ($ex instanceof CApplicationException)
					? $ex->GetString() : GetMessage('INTRANET_USER_PROFILE_DELETE_ERROR');
			}

			$this->addError(new \Bitrix\Main\Error($error));

			return false;
		}

		return true;
	}

	public function moveToIntranetAction($departmentIds, $isEmail = false)
	{
		if (
			!(
				Loader::includeModule("bitrix24") && \CBitrix24::IsPortalAdmin(CurrentUser::get()->getId())
				|| CurrentUser::get()->isAdmin()
			)
		)
		{
			return false;
		}

		if (!is_array($departmentIds) || empty($departmentIds))
		{
			$this->addError(new \Bitrix\Main\Error(Loc::getMessage("INTRANET_USER_PROFILE_EMPTY_DEPARTMENT_ERROR")));

			return false;
		}

		if ($isEmail == 'Y')
		{
			$ID_TRANSFERRED = CIntranetInviteDialog::TransferEmailUser($this->userId, [
				'UF_DEPARTMENT' => $departmentIds,
			]);

			if (!$ID_TRANSFERRED)
			{
				if($e = $GLOBALS["APPLICATION"]->GetException())
				{
					$strError = $e->GetString();

					return [$strError];
				}
			}
			else
			{
				return $ID_TRANSFERRED;
			}
		}
		else
		{
			$nodeIds = $this->normalizePromotionDepartmentIds($departmentIds);
			$isPromoted = false;
			if ($nodeIds !== [])
			{
				try
				{
					$repository = ServiceContainer::getInstance();
					$user = $repository->userRepository()->getUserById((int)$this->userId);
					$departments = $repository->hrDepartmentRepository()->findAllByIds($nodeIds);
					$isPromoted = $user !== null
						&& $this->hasExactPromotionDepartments($nodeIds, $departments)
						&& (new TransferToIntranetCommand($user, $departments))->run()->isSuccess();
				}
				catch (\Throwable)
				{
				}
			}

			if (!$isPromoted)
			{
				$this->addError(new \Bitrix\Main\Error(
					Loc::getMessage('INTRANET_USER_PROFILE_DEPARTMENT_ASSIGN_ERROR'),
				));

				return false;
			}

			if (NotifySender::isAvailable())
			{
				$message = new Message(
					toUserId: (int)$this->userId,
					fromUserId: 0,
					notifyTag: '',
					notifyType: IM_NOTIFY_SYSTEM,
					notifyModule: 'intranet',
					notifyEvent: 'default',
					notifyMessage: Loc::getMessage('INTRANET_USER_PROFILE_MOVE_TO_INTRANET_NOTIFY_MESSAGE'),
				);
				$message->setTitle(Loc::getMessage('INTRANET_USER_PROFILE_MOVE_TO_INTRANET_NOTIFY_TITLE'));
				(new NotifySender())->send($message);
			}

			\CIntranetEventHandlers::ClearAllUsersCache($this->userId);

			return Loc::getMessage("INTRANET_USER_PROFILE_MOVE_TO_INTRANET_SUCCESS");
		}
	}

	protected function normalizePromotionDepartmentIds(array $departmentIds): array
	{
		$nodeIds = [];
		foreach ($departmentIds as $departmentId)
		{
			if (is_int($departmentId))
			{
				$nodeId = $departmentId;
			}
			elseif (is_string($departmentId) && preg_match('/^[0-9]+$/D', $departmentId) === 1)
			{
				$normalizedId = ltrim($departmentId, '0');
				$nodeId = (int)$normalizedId;
				if ((string)$nodeId !== $normalizedId)
				{
					return [];
				}
			}
			else
			{
				return [];
			}

			if ($nodeId <= 0)
			{
				return [];
			}

			$nodeIds[] = $nodeId;
		}

		return array_values(array_unique($nodeIds));
	}

	protected function hasExactPromotionDepartments(array $nodeIds, DepartmentCollection $departments): bool
	{
		$foundIds = array_map(
			static fn ($department) => $department->getId(),
			$departments->all(),
		);
		sort($foundIds);
		sort($nodeIds);

		return $foundIds === $nodeIds;
	}

	public function loadPhotoAction()
	{
		if (!$this->canEditProfile())
		{
			return false;
		}

		$userData = \Bitrix\Main\UserTable::getList([
			'select' => ['ID', 'PERSONAL_PHOTO'],
			'filter' => [
				'=ID' => $this->userId,
			],
		])->fetch();

		$user = new CUser();
		$newPhotoFile = $this->getRequest()->getFile('newPhoto');

		//region delete after ui 22.1200.0
		if (class_exists(UI\Avatar\Mask\Helper::class)
			&& ($maskInfo = UI\Avatar\Mask\Helper::getDataFromRequest('newPhoto', $this->getRequest()))
		)
		{
			[$newPhotoFile, $newPhotoMaskFile] = $maskInfo;
		}
		//endregion

		if (isset($userData['PERSONAL_PHOTO']) && $userData['PERSONAL_PHOTO'] > 0)
		{
			$newPhotoFile['old_file'] = $userData['PERSONAL_PHOTO'];
			$newPhotoFile['del'] = $userData['PERSONAL_PHOTO'];
		}

		$res = $user->Update($this->userId, ['PERSONAL_PHOTO' => $newPhotoFile]);

		if (!$res)
		{
			$this->addError(new \Bitrix\Main\Error($user->LAST_ERROR));

			return false;
		}

		if (Loader::includeModule('intranet'))
		{
			\Bitrix\Intranet\Composite\CacheProvider::deleteUserCache();
		}

		$newUserData = \Bitrix\Main\UserTable::getList([
			'select' => ['ID', 'PERSONAL_PHOTO'],
			'filter' => [
				'=ID' => $this->userId,
			],
		])->fetch();


		if (
			//region TODO: delete after ui 22.1200.0
			!isset($newPhotoMaskFile)
			&& class_exists(UI\Avatar\Mask\Helper::class)
			&& method_exists(UI\Avatar\Mask\Helper::class, 'getMaskedFile')
			//endregion
			&& ($newPhotoMaskFile = UI\Avatar\Mask\Helper::getMaskedFile('newPhoto'))
		)
		{
			UI\Avatar\Mask\Helper::save($newUserData["PERSONAL_PHOTO"], $newPhotoMaskFile);
		}

		if ($newUserData['PERSONAL_PHOTO'] > 0)
		{
			$file = \CFile::GetFileArray($newUserData['PERSONAL_PHOTO']);
			if ($file !== false)
			{
				$fileTmp = \CFile::ResizeImageGet(
					$file,
					['width' => 512, 'height' => 512],
					BX_RESIZE_IMAGE_PROPORTIONAL,
					false,
					false,
					true,
				);

				return $fileTmp['src'];
			}
		}
	}

	public function deletePhotoAction()
	{
		if (!$this->canEditProfile())
		{
			return false;
		}

		$userData = \Bitrix\Main\UserTable::getList([
			"select" => ['ID', 'PERSONAL_PHOTO'],
			"filter" => [
				"=ID" => $this->userId,
			],
		])->fetch();

		if (!$userData["PERSONAL_PHOTO"])
		{
			return;
		}

		$fields = [
			"PERSONAL_PHOTO" => [
				"old_file" => $userData["PERSONAL_PHOTO"],
				"del" => $userData["PERSONAL_PHOTO"],
			],
		];

		$user = new CUser();
		$res = $user->Update($this->userId, $fields);

		if (!$res)
		{
			$this->addError(new \Bitrix\Main\Error($user->LAST_ERROR));

			return false;
		}
	}

	protected function getGroupsId(&$employeesGroupId, &$portalAdminGroupId)
	{
		[$employeesGroupId, $portalAdminGroupId] = \Bitrix\Intranet\Util::getGroupsId();
	}

	public function setAdminRightsAction()
	{
		$currentUser = CurrentUser::get();

		return \Bitrix\Intranet\Util::setAdminRights([
			'userId' => $this->userId,
			'currentUserId' => $currentUser->getId(),
			'isCurrentUserAdmin' => $currentUser->isAdmin(),
		]);
	}

	public function removeAdminRightsAction()
	{
		$currentUser = CurrentUser::get();

		return \Bitrix\Intranet\Util::removeAdminRights([
			'userId' => $this->userId,
			'currentUserId' => $currentUser->getId(),
			'isCurrentUserAdmin' => $currentUser->isAdmin(),
		]);
	}

	public function sendSmsForAppAction($phone = "")
	{
		return false;
	}

	public function setIntegratorRightsAction()
	{
		global $USER;

		if (!(Loader::includeModule("bitrix24") && \CBitrix24::IsPortalAdmin(CurrentUser::get()->getId())))
		{
			return false;
		}

		$userData = \Bitrix\Main\UserTable::getList([
			"select" => ['ID', 'EMAIL', 'UF_DEPARTMENT', 'ACTIVE'],
			"filter" => [
				"=ID" => $this->userId,
			],
		])->fetch();

		if (!check_email($userData["EMAIL"]))
		{
			$this->addError(new \Bitrix\Main\Error(Loc::getMessage("INTRANET_USER_PROFILE_EMAIL_ERROR")));

			return false;
		}

		if (!Integrator::isMoreIntegratorsAvailable())
		{
			$message = IntegratorService::createByDefault()->isRenamedIntegrator()
				? Loc::getMessage('INTRANET_USER_PROFILE_INTEGRATOR_COUNT_ERROR_RENAMED')
				: Loc::getMessage('INTRANET_USER_PROFILE_INTEGRATOR_COUNT_ERROR');
			$this->addError(new \Bitrix\Main\Error($message));

			return false;
		}

		$error = new \Bitrix\Main\Error('');
		$checkResult = Integrator::checkPartnerEmail($userData['EMAIL'], $error);

		if (!$checkResult->isSuccess())
		{
			$this->addError($error);

			return false;
		}

		$fields = ["ACTIVE" => "Y"];

		if (empty($userData["UF_DEPARTMENT"]))
		{
			$departmentRepository = \Bitrix\Intranet\Service\ServiceContainer::getInstance()
				->departmentRepository()
			;
			if ($department = $departmentRepository->getRootDepartment())
			{
				$fields["UF_DEPARTMENT"][] = $department->getId();
			}
		}

		//prepare groups
		$arGroups = [1];
		$groupId = CGroup::GetIDByCode("PORTAL_ADMINISTRATION_" . SITE_ID);
		if ($groupId)
		{
			$arGroups[] = $groupId;
		}

		$integratorGroupId = \Bitrix\Bitrix24\Integrator::getIntegratorGroupId();
		$arGroups[] = $integratorGroupId;
		$fields["GROUP_ID"] = $arGroups;

		$USER->Update($this->userId, $fields);

		(new PartnerInfo())->addByResponseAndUserId(
			$checkResult->getData(),
			$this->userId,
		);

		ServiceContainer::getInstance()->getUserService()->clearCache();

		return true;
	}

	public function fieldsSettingsAction($fieldsView = [], $fieldsEdit = [])
	{
		if (
			!(
				Loader::includeModule("bitrix24")
				&& \CBitrix24::IsPortalAdmin(CurrentUser::get()->getId())
				|| CurrentUser::get()->isAdmin()
			)
		)
		{
			return false;
		}

		$newFieldsView = [];

		if (is_array($fieldsView))
		{
			foreach ($fieldsView as $field)
			{
				$newFieldsView[] = $field["VALUE"];

				if ($field['VALUE'] === 'UF_DEPARTMENT')
				{
					$newFieldsView[] = 'DEPARTMENT';
				}
			}
		}
		Option::set("intranet", "user_profile_view_fields", implode(",", $newFieldsView), SITE_ID);

		$newFieldsEdit = [];

		if (is_array($fieldsEdit))
		{
			foreach ($fieldsEdit as $field)
			{
				$newFieldsEdit[] = $field["VALUE"];
			}
		}
		Option::set("intranet", "user_profile_edit_fields", implode(",", $newFieldsEdit), SITE_ID);

		return true;
	}

	public function onUserFieldAddAction($fieldName = "")
	{
		if (!CurrentUser::get()->isAdmin())
		{
			return false;
		}

		if (empty($fieldName))
		{
			return false;
		}

		$viewFieldsSettings = Option::get("intranet", "user_profile_view_fields", false);
		if ($viewFieldsSettings !== false)
		{
			$viewFieldsSettings = explode(",", $viewFieldsSettings);
			$viewFieldsSettings[] = $fieldName;
			Option::set("intranet", "user_profile_view_fields", implode(",", $viewFieldsSettings), SITE_ID);
		}

		$editFieldsSettings = Option::get("intranet", "user_profile_edit_fields", false);
		if ($editFieldsSettings !== false)
		{
			$editFieldsSettings = explode(",", $editFieldsSettings);
			$editFieldsSettings[] = $fieldName;
			Option::set("intranet", "user_profile_edit_fields", implode(",", $editFieldsSettings), SITE_ID);
		}

		return true;
	}

	public function showWidgetAction(string $targetId, string $siteTemplateId, array $urls): Component
	{
		return new Component(
			'bitrix:intranet.user.profile',
			'widget',
			[
				'ID' => CurrentUser::get()->getId(),
				'TARGET_ID' => $targetId,
				'SITE_TEMPLATE_ID' => $siteTemplateId,
				'PATH_TO_USER_PROFILE' => $urls['PATH_TO_USER_PROFILE'] ?? '',
				'PATH_TO_USER_COMMON_SECURITY' => $urls['PATH_TO_USER_COMMON_SECURITY'] ?? '',
			],
		);
	}
}
