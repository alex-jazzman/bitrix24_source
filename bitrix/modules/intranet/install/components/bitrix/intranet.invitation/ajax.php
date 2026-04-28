<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die;
}

require_once($_SERVER["DOCUMENT_ROOT"] . $componentPath . "/analytics.php");

use Bitrix\Bitrix24\CurrentUser;
use Bitrix\Bitrix24\Integration\Network\RegisterSettingsSynchronizer;
use Bitrix\Intranet\Component\UserProfile;
use Bitrix\Intranet\Entity\User;
use Bitrix\Intranet\Infrastructure\Controller\ActionFilter\InviteLimitControl;
use Bitrix\Intranet\Infrastructure\Controller\ActionFilter\PortalCreatorEmailConfirmationControl;
use Bitrix\Intranet\Internal\Integration\Socialnetwork\ExternalAuthType;
use Bitrix\Intranet\Internal\Integration\Bitrix24\Integrator\PartnerInfo;
use Bitrix\Intranet\Public\Type\EmailInvitation;
use Bitrix\Intranet\Public\Type\PhoneInvitation;
use Bitrix\Intranet\Repository\HrDepartmentRepository;
use Bitrix\Intranet\Repository\UserRepository;
use Bitrix\Intranet\Service\UserService;
use Bitrix\Intranet\User\Access\UserAccessController;
use Bitrix\Intranet\User\Access\UserActionDictionary;
use Bitrix\Intranet\Util;
use Bitrix\Main\Engine\AutoWire\ExactParameter;
use Bitrix\Main\Engine\AutoWire\Parameter;
use Bitrix\Main\Engine\Response\AjaxJson;
use Bitrix\Main\Error;
use Bitrix\Main\Loader;
use Bitrix\Main\ModuleManager;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Config\Option;
use Bitrix\Main\Response;
use Bitrix\Socialnetwork\Integration\UI\EntitySelector;
use Bitrix\Main\HttpResponse;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Engine\ActionFilter;
use Bitrix\Intranet;
use Bitrix\Main\PhoneNumber\Parser;

class CIntranetInvitationComponentAjaxController extends \Bitrix\Main\Engine\Controller
{
	private Analytics $analytics;
	private Intranet\Integration\HumanResources\PermissionInvitation $permission;
	private Intranet\Contract\Repository\DepartmentRepository $departmentRepository;

	public function __construct(?\Bitrix\Main\Request $request = null)
	{
		parent::__construct($request);

		$this->departmentRepository = new HrDepartmentRepository();
		$this->permission = Intranet\Integration\HumanResources\PermissionInvitation::createByCurrentUser();
	}

	/**
	 * @return Parameter[]
	 * @throws \Bitrix\Main\Engine\AutoWire\BinderArgumentException
	 */
	public function getAutoWiredParameters(): array
	{
		return [
			new ExactParameter(
				Intranet\Public\Type\Collection\InvitationCollection::class,
				'invitationCollection',
				function ($className, $invitations, ?string $tab) {
					return $this->createInvitations($invitations, $tab ?? '');
				},
			),
			new ExactParameter(
				Intranet\Entity\Collection\DepartmentCollection::class,
				'departmentCollection',
				function ($className, $departmentIds) {
					$departmentCollection = $this->departmentRepository->findAllByIds($departmentIds);
					$departmentCollection = $departmentCollection->filter(function ($department) {
						return $this->permission->canInviteToDepartment($department);
					});

					if ($departmentCollection->empty())
					{
						$departmentCollection->add($this->getRootDepartment());
					}

					return $departmentCollection;
				},
			),
			new ExactParameter(
				Intranet\Public\Type\Collection\InvitationCollection::class,
				'invitationCollection',
				function ($className, $invitationText, ?string $tab) {
					return $this->createInvitations($this->parseInvitationFromText($invitationText), $tab ?? '');
				},
			),
		];
	}

	protected function getDefaultPreFilters(): array
	{
		return array_merge(
			parent::getDefaultPreFilters(),
			[
				new Intranet\ActionFilter\UserType(['employee']),
				new Intranet\Infrastructure\Controller\ActionFilter\InviteIntranetAccessControl(),
				new PortalCreatorEmailConfirmationControl(),
				new InviteLimitControl(),
			],
		);
	}

	public function configureActions(): array
	{
		return [
			'getSliderContent' => [
				'-prefilters' => [
					ActionFilter\Csrf::class,
					Intranet\Infrastructure\Controller\ActionFilter\InviteIntranetAccessControl::class,
					PortalCreatorEmailConfirmationControl::class,
					InviteLimitControl::class,
				],
			],
			'extranet' => [
				'-prefilters' => [
					Intranet\Infrastructure\Controller\ActionFilter\InviteIntranetAccessControl::class,
				],
				'+prefilters' => [
					new Intranet\Infrastructure\Controller\ActionFilter\InviteExtranetAccessControl(
						$this->request->getPost('workgroupIds'),
					),
					new Intranet\Infrastructure\Controller\ActionFilter\ActiveUserInvitation(
						new UserRepository(),
					),
					new Intranet\Infrastructure\Controller\ActionFilter\UserInvitedIntranet(
						new UserRepository(),
					),
				],
			],
			'self' => [
				'-prefilters' => [
					InviteLimitControl::class,
					PortalCreatorEmailConfirmationControl::class,
				],
			],
			'getInviteLink' => [
				'-prefilters' => [
					InviteLimitControl::class,
					PortalCreatorEmailConfirmationControl::class,
				],
			],
			'invite' => [
				'+prefilters' => [
					Intranet\Infrastructure\Controller\ActionFilter\EmailDailyLimit::createByDefault(),
					new Intranet\Infrastructure\Controller\ActionFilter\ActiveUserInvitation(
						new UserRepository(),
					),
					new Intranet\Infrastructure\Controller\ActionFilter\UserInvitedExtranet(
						new UserRepository(),
					),
				],
			],
			'massInvite' => [
				'+prefilters' => [
					Intranet\Infrastructure\Controller\ActionFilter\EmailDailyLimit::createByDefault(),
					new Intranet\Infrastructure\Controller\ActionFilter\ActiveUserInvitation(
						new UserRepository(),
					),
					new Intranet\Infrastructure\Controller\ActionFilter\UserInvitedExtranet(
						new UserRepository(),
					),
				],
			],
			'inviteWithGroupDp' => [
				'+prefilters' => [
					Intranet\Infrastructure\Controller\ActionFilter\EmailDailyLimit::createByDefault(),
					new Intranet\Infrastructure\Controller\ActionFilter\ActiveUserInvitation(
						new UserRepository(),
					),
					new Intranet\Infrastructure\Controller\ActionFilter\UserInvitedExtranet(
						new UserRepository(),
					),
					new Intranet\Infrastructure\Controller\ActionFilter\UserInvitationValidation(
						Parser::getInstance(),
					),
				],
			],
		];
	}

	public function processAfterAction(\Bitrix\Main\Engine\Action $action, $result)
	{
		parent::processAfterAction($action, $result);

		if ($action->getName() === 'getSliderContent' && !$this->errorCollection->isEmpty())
		{
			$errorText = '';
			foreach ($this->errorCollection as $error)
			{
				/** @var Error $error */
				$errorText .= '<span style="color: red">' . $error->getMessage() . '</span><br/>';
			}

			return (new HttpResponse())->setContent($errorText);
		}

		return $result;
	}

	public function getSliderContentAction(string $componentParams = ''): HttpResponse
	{
		$params
			= $componentParams
				? Json::decode($componentParams)
				: [];

		$content = $GLOBALS['APPLICATION']->includeComponent(
			'bitrix:ui.sidepanel.wrapper',
			'',
			[
				'RETURN_CONTENT' => true,
				'POPUP_COMPONENT_NAME' => 'bitrix:intranet.invitation',
				'POPUP_COMPONENT_TEMPLATE_NAME' => '',
				'POPUP_COMPONENT_PARAMS' => [
					'USER_OPTIONS' => $params['USER_OPTIONS'] ?? [],
				],
				'IFRAME_MODE' => true,
				'USE_UI_TOOLBAR' => 'Y',
			],
		);

		$response = new HttpResponse();
		$response->setContent($content);

		return $response;
	}

	protected function isExtranetInstalled(): bool
	{
		$bExtranetInstalled = ModuleManager::IsModuleInstalled("extranet");
		if ($bExtranetInstalled)
		{
			$extranetSiteId = Option::get("extranet", "extranet_site");
			if (empty($extranetSiteId))
			{
				$bExtranetInstalled = false;
			}
		}

		return $bExtranetInstalled;
	}

	protected function isInvitationBySmsAvailable(): bool
	{
		return Loader::includeModule("bitrix24") && Option::get('bitrix24', 'phone_invite_allowed', 'N') === 'Y';
	}

	protected function getRootDepartment(): ?Intranet\Entity\Department
	{
		return $this->permission->findFirstPossibleAvailableDepartment();
	}

	protected function prepareUsersForResponse($userIds): array
	{
		if (
			empty($userIds)
			|| !Loader::includeModule("socialnetwork")

		) {
			return [];
		}

		$userOptions = isset($_POST["userOptions"]) && is_array($_POST["userOptions"]) ? $_POST["userOptions"] : [];

		return EntitySelector\UserProvider::makeItems(EntitySelector\UserProvider::getUsers([
			'userId' => $userIds,
		]), $userOptions);
	}

	protected function prepareGroupIds($groups): array
	{
		$formattedGroups = [];
		foreach ($groups as $key => $id)
		{
			$formattedGroups[$key] = "SG" . $id;
		}

		return $formattedGroups;
	}

	protected function isRestoreUsersAccessAvailable(): bool
	{
		$access = UserAccessController::createByDefault();

		return ($access->check(UserActionDictionary::RESTORE));
	}

	private function isSelectedDepartments(
		Intranet\Entity\Department $rootDepartment,
		Intranet\Entity\Collection\DepartmentCollection $selectedDepartments,
	): bool {
		if ($selectedDepartments->empty())
		{
			return false;
		}

		return !($selectedDepartments->count() === 1
			&& $rootDepartment->getId() === $selectedDepartments->first()?->getId());
	}

	/**
	 * @throws \Bitrix\Main\ArgumentNullException
	 * @throws \Bitrix\Main\ArgumentException
	 */
	private function createInvitations(
		array $formData,
		string $formType,
	): Intranet\Public\Type\Collection\InvitationCollection {
		$invitationCollection = new Intranet\Public\Type\Collection\InvitationCollection();

		foreach ($formData as $invitationData)
		{
			if (isset($invitationData['EMAIL']) || isset($invitationData['email']))
			{
				$invitation = new EmailInvitation(
					$invitationData['EMAIL'] ?? $invitationData['email'],
					$invitationData['NAME'] ?? null,
					$invitationData['LAST_NAME'] ?? null,
					$formType,
				);
			}
			elseif ((isset($invitationData['PHONE']) || isset($invitationData['phone'])) && $this->isInvitationBySmsAvailable())
			{
				$invitation = new PhoneInvitation(
					$invitationData['PHONE'] ?? $invitationData['phone'],
					$invitationData['NAME'] ?? null,
					$invitationData['LAST_NAME'] ?? null,
					$invitationData['PHONE_COUNTRY'] ?? null,
					$formType,
				);
			}
			else
			{
				throw new \Bitrix\Main\ArgumentNullException('EMAIL');
			}

			$invitationCollection->add($invitation);
		}

		return $invitationCollection;
	}

	/**
	 * @throws \Bitrix\Main\ArgumentNullException
	 * @throws \Bitrix\Main\ArgumentException
	 * @throws \Bitrix\Main\ObjectPropertyException
	 * @throws \Bitrix\Main\SystemException
	 * @throws \Bitrix\HumanResources\Exception\WrongStructureItemException
	 */
	public function inviteAction(
		Intranet\Public\Type\Collection\InvitationCollection $invitationCollection,
		?Intranet\Entity\Collection\DepartmentCollection $departmentCollection = null,
	): array
	{
		$departmentCollection ??= $this->getDefaultDepartmentCollection();

		try
		{
			$invitationService = new Intranet\Public\Facade\Invitation\IntranetInvitationFacade($departmentCollection);
			$userCollection = $invitationService->inviteByCollection($invitationCollection);

			\CIntranetInviteDialog::logAction(
				$userCollection->map(fn($user) => $user->getId()),
				'intranet',
				'invite_user',
				'invite_dialog',
			);

			$userCollection->forEach(function (Intranet\Entity\User $user) use ($invitationCollection, $departmentCollection) {
				$isEmail = (bool)$user->getEmail();
				$this->getAnalyticsInstance()->sendInvitation(
					$user->getId(),
					Analytics::ANALYTIC_INVITATION_TYPE_C_SUB_SECTION_EMAIL,
					true,
					$isEmail ? $invitationCollection->countEmailInvitation() : 0,
					$isEmail ? 0 : $invitationCollection->countPhoneInvitation(),
					isSelectedDepartments: $this->isSelectedDepartments(
						$this->getRootDepartment(),
						$departmentCollection,
					),
				);
			});


			return $userCollection->map(fn($user) => $user->getId());
		}
		catch (Intranet\Exception\ErrorCollectionException $exception)
		{
			$this->errorCollection = $exception->getErrors();

			$this->getAnalyticsInstance()->sendInvitation(
				0,
				Analytics::ANALYTIC_INVITATION_TYPE_C_SUB_SECTION_EMAIL,
				false,
				isSelectedDepartments: $this->isSelectedDepartments($this->getRootDepartment(), $departmentCollection),
			);

			$this->errorCollection = $exception->getErrors();

			return [];
		}
	}

	public function inviteWithGroupDpAction(
		Intranet\Public\Type\Collection\InvitationCollection $invitationCollection,
		?Intranet\Entity\Collection\DepartmentCollection $departmentCollection = null,
		array $workgroupIds = [],
		?array $firedUserList = []
	): array
	{
		$departmentCollection ??= $this->getDefaultDepartmentCollection();

		$withDepartments = $this->isSelectedDepartments(
			$this->getRootDepartment(),
			$departmentCollection,
		);
		$withGroups = !empty($workgroupIds);

		try
		{
			$invitationService = new Intranet\Public\Facade\Invitation\IntranetInvitationFacade($departmentCollection, $workgroupIds);
			$userCollection = $invitationService->inviteByCollection($invitationCollection);

			\CIntranetInviteDialog::logAction(
				$userCollection->map(fn($user) => $user->getId()),
				'intranet',
				'invite_user',
				'invite_dialog',
			);

			foreach ($userCollection->toArray() as $user)
			{
				$this->getAnalyticsInstance()->sendInvitationByContacts(
					isSuccess: true,
					totalCount: $invitationCollection->count(),
					withDepartments: $withDepartments,
					withGroups: $withGroups,
					invitedUser: $user,
				);
			}

			$response = [
				'invitedUserIds' => $userCollection->map(fn($user) => $user->getId()),
			];

			if (!empty($firedUserList))
			{
				$response = array_merge($response, $this->getFiredUsersResponse($firedUserList));
			}

			return $response;
		}
		catch (Intranet\Exception\ErrorCollectionException $exception)
		{
			$this->getAnalyticsInstance()->sendInvitationByContacts(
				isSuccess: false,
				totalCount: $invitationCollection->count(),
				withDepartments: $withDepartments,
				withGroups: $withGroups,
			);

			$this->errorCollection = $exception->getErrors();

			return [];
		}
	}

	private function parseInvitationFromText(string $text): array
	{
		$data = preg_split("/[\n\r\t\\,;\\ ]+/", trim($text));
		$invitations = [];
		$errorFormatItems = [];
		$errorLengthItems = [];
		foreach ($data as $item)
		{
			if (check_email($item))
			{
				if (mb_strlen($item) > 50)
				{
					$errorLengthItems[] = $item;
				}
				else
				{
					$invitations[] = [
						"EMAIL" => $item,
					];
				}
			}
			elseif ($this->isInvitationBySmsAvailable() && preg_match("/^[\d+][\d\(\)\ -]{4,22}\d$/", $item))
			{
				$invitations[] = [
					"PHONE" => $item,
				];
			}
			else
			{
				$errorFormatItems[] = $item;
			}
		}

		if (!empty($errorFormatItems))
		{
			$errorMessage = Loc::getMessage("BX24_INVITE_DIALOG_ERROR_"
				. ($this->isInvitationBySmsAvailable() ? "EMAIL_OR_PHONE" : "EMAIL"))
				. ": " . implode(", ", $errorFormatItems);
			throw new \Exception($errorMessage);
		}

		if (!empty($errorLengthItems))
		{
			$errorMessage = Loc::getMessage("INTRANET_INVITE_DIALOG_ERROR_LENGTH")
				. ": " . implode(", ", $errorLengthItems);
			throw new \Exception($errorMessage);
		}

		return $invitations;
	}

	public function massInviteAction(
		Intranet\Public\Type\Collection\InvitationCollection $invitationCollection,
		Intranet\Entity\Collection\DepartmentCollection $departmentCollection,
	)
	{
		try
		{
			$invitationService = new Intranet\Public\Facade\Invitation\IntranetInvitationFacade($departmentCollection);
			$userCollection = $invitationService->inviteByCollection($invitationCollection);

			\CIntranetInviteDialog::logAction(
				$userCollection->map(fn($user) => $user->getId()),
				'intranet',
				'invite_user',
				'invite_dialog',
			);

			$userCollection->forEach(function (Intranet\Entity\User $user) use ($invitationCollection, $departmentCollection) {
				$this->getAnalyticsInstance()->sendInvitation(
					$user->getId(),
					Analytics::ANALYTIC_INVITATION_TYPE_C_SUB_SECTION_MASS,
					true,
					$invitationCollection->countEmailInvitation(),
					$invitationCollection->countPhoneInvitation(),
					isSelectedDepartments: $this->isSelectedDepartments(
						$this->getRootDepartment(),
						$departmentCollection,
					),
				);
			});

			return $userCollection->map(fn($user) => $user->getId());
		}
		catch (Intranet\Exception\ErrorCollectionException $exception)
		{
			$this->getAnalyticsInstance()->sendInvitation(
				0,
				Analytics::ANALYTIC_INVITATION_TYPE_C_SUB_SECTION_MASS,
				false,
				isSelectedDepartments: $this->isSelectedDepartments(
					$this->getRootDepartment(),
					$departmentCollection,
				),
			);

			$this->errorCollection = $exception->getErrors();

			return [];
		}
	}

	public function extranetAction(
		Intranet\Public\Type\Collection\InvitationCollection $invitationCollection,
		array $workgroupIds = [],
		?array $firedUserList = []
	): array
	{
		if (!$this->isExtranetInstalled())
		{
			return [];
		}

		$invitationService = new Intranet\Public\Facade\Invitation\ExtranetInvitationFacade($workgroupIds);
		$userCollection = $invitationService->inviteByCollection($invitationCollection);

		\CIntranetInviteDialog::logAction(
			$userCollection->map(fn($user) => $user->getId()),
			'extranet',
			'invite_user',
			'invite_dialog',
		);

		$response = [
			'invitedUserIds' => $userCollection->map(fn($user) => $user->getId()),
		];

		if (!empty($firedUserList))
		{
			$response = array_merge($response, $this->getFiredUsersResponse($firedUserList));
		}

		return $response;
	}

	public function selfAction(): ?string
	{
		$request = \Bitrix\Main\Context::getCurrent()->getRequest();
		$allowRegister = $request->getPost('allow_register');

		if ($allowRegister)
		{
			$current = Intranet\Invitation::getRegisterSettings()['REGISTER'] ?? '';

			if ($current !== $allowRegister)
			{
				$this->getAnalyticsInstance()->sendChangeQuickRegistration($allowRegister === 'Y');
			}
		}

		$isCurrentUserAdmin = Intranet\CurrentUser::get()->isAdmin();
		$settings = [
			"REGISTER" => $allowRegister,
			"INVITE_TOKEN_SECRET" => $request->getPost('allow_register_secret'),
		];

		if ($isCurrentUserAdmin)
		{
			$settings["REGISTER_CONFIRM"] = $request->getPost('allow_register_confirm');
			$settings["REGISTER_WHITELIST"] = $request->getPost('allow_register_whitelist');
		}

		Intranet\Invitation::setRegisterSettings($settings);

		if (Loader::includeModule("bitrix24"))
		{
			RegisterSettingsSynchronizer::sendToNetwork();
		}

		return Loc::getMessage("BX24_INVITE_DIALOG_SELF_SUCCESS", ["#SITE_DIR#" => SITE_DIR]);
	}

	private function checkFiredUsersAndGetData(array $emails): ?array
	{
		$users = (new UserRepository())
			->findActivatedUsersByLogins(
				$emails,
				(new ExternalAuthType())->getAllTypeList(),
			)
			->filter(fn(User $user) => $user->getActive() === false)
			->map(fn($user) => [
				'id' => $user->getId(),
				'login' => $user->getLogin(),
				'email' => $user->getEmail(),
				'name' => $user->getFormattedName(),
				'photo' => UserProfile::getUserPhoto($user->getPersonalPhoto(), 40),
				'role' => $user->getRole(),
				'phoneNumber' => $user->getPhoneNumber(),
				'position' => $user->getWorkPosition(),
				'profileUrl' => (new UserService())->getDetailUrl($user->getId()),
			])
		;

		if (!empty($users))
		{
			return $users;
		}

		return null;
	}

	public function addAction(
		?Intranet\Entity\Collection\DepartmentCollection $departmentCollection = null,
	)
	{
		$departmentCollection ??= $this->getDefaultDepartmentCollection();

		$userData = $_POST;

		if (!empty($userData['ADD_EMAIL']))
		{
			$firedUserList = $this->checkFiredUsersAndGetData([$userData['ADD_EMAIL']]);

			if ($firedUserList)
			{
				return $this->getFiredUsersResponse($firedUserList);
			}
		}

		$userData["DEPARTMENT_ID"] = $departmentCollection->map(fn (Intranet\Entity\Department $department) => $department->getIblockSectionId());

		$idAdded = CIntranetInviteDialog::AddNewUser(SITE_ID, $userData, $strError, 'register');
		$withDepartments = $this->isSelectedDepartments(
			$this->getRootDepartment(),
			$departmentCollection,
		);

		if ($idAdded && isset($_POST["SONET_GROUPS_CODE"]) && is_array($_POST["SONET_GROUPS_CODE"]))
		{
			CIntranetInviteDialog::RequestToSonetGroups(
				$idAdded,
				$this->prepareGroupIds($_POST["SONET_GROUPS_CODE"]),
				"",
			);
		}

		if (!empty($strError))
		{
			$strError = str_replace("<br>", " ", $strError);
			$this->addError(new \Bitrix\Main\Error($strError));
			$this->getAnalyticsInstance()->sendRegistration(
				isSuccess: false,
				withDepartments: $withDepartments,
				withGroups: isset($_POST['SONET_GROUPS_CODE']) && is_array($_POST['SONET_GROUPS_CODE']),
				withInvite: isset($_POST['ADD_SEND_PASSWORD']) && ($_POST['ADD_SEND_PASSWORD'] === 'N'),
			);

			return false;
		}

		$this->getAnalyticsInstance()->sendRegistration(
			isSuccess: true,
			withDepartments: $withDepartments,
			withGroups: isset($_POST['SONET_GROUPS_CODE']) && is_array($_POST['SONET_GROUPS_CODE']),
			withInvite: isset($_POST['ADD_SEND_PASSWORD']) && ($_POST['ADD_SEND_PASSWORD'] === 'N'),
			invitedUser: (new UserRepository())->getUserById($idAdded),
		);

		$res = $this->prepareUsersForResponse([$idAdded]);

		CIntranetInviteDialog::logAction($idAdded, 'intranet', 'add_user', 'add_dialog');

		return $res;
	}

	public function inviteIntegratorAction()
	{
		if (!Loader::includeModule("bitrix24"))
		{
			return false;
		}

		if (!check_email($_POST["integrator_email"] ?? ''))
		{
			$this->addError(new \Bitrix\Main\Error(Loc::getMessage("BX24_INVITE_DIALOG_ERROR_EMAIL")));

			return false;
		}

		if (!Integrator::isMoreIntegratorsAvailable())
		{
			$this->addError(
				new \Bitrix\Main\Error(
					Loc::getMessage(
						"BX24_INVITE_DIALOG_INTEGRATOR_COUNT_ERROR",
						[
							"#LINK_START#" => "",
							"#LINK_END#" => "",
						],
					),
				),
			);

			return false;
		}

		$error = new \Bitrix\Main\Error('');
		$checkResult = Integrator::checkPartnerEmail($_POST['integrator_email'], $error);

		if (!$checkResult->isSuccess())
		{
			$this->addError($error);

			return false;
		}

		$messageText = Loc::getMessage("BX24_INVITE_DIALOG_INTEGRATOR_INVITE_TEXT");

		$strError = "";
		$newIntegratorId = CIntranetInviteDialog::inviteIntegrator(SITE_ID, $_POST["integrator_email"], $messageText, $strError);

		if (!empty($strError))
		{
			$this->getAnalyticsInstance()->sendInvitation(
				0,
				Analytics::ANALYTIC_INVITATION_TYPE_C_SUB_SECTION_INTEGRATOR,
				false,
			);
			$this->addError(new \Bitrix\Main\Error($strError));

			return false;
		}

		if ($newIntegratorId > 0)
		{
			$this->getAnalyticsInstance()->sendInvitation(
				$newIntegratorId,
				Analytics::ANALYTIC_INVITATION_TYPE_C_SUB_SECTION_INTEGRATOR,
			true,
				1,
			);
		}

		(new PartnerInfo())->addByResponseAndUserId(
			$checkResult->getData(),
			$newIntegratorId,
		);

		CIntranetInviteDialog::logAction($newIntegratorId, 'intranet', 'invite_user', 'integrator_dialog');

		return $this->prepareUsersForResponse([$newIntegratorId]);
	}

	private function getFiredUsersResponse(array $firedUserList): array
	{
		$isRestoreUsersAccessAvailable = $this->isRestoreUsersAccessAvailable();

		if (!$isRestoreUsersAccessAvailable)
		{
			$firedUserList = array_map(
				fn($user) => ['login' => $user['login']],
				$firedUserList
			);
		}

		return [
			'isRestoreUsersAccessAvailable' => $isRestoreUsersAccessAvailable,
			'firedUserList' => $firedUserList,
		];
	}

	private function getAnalyticsInstance(): Analytics
	{
		if (!isset($this->analytics))
		{
			$this->analytics = new Analytics();
		}

		return $this->analytics;
	}

	/**
	 * @throws \Bitrix\Main\LoaderException
	 * @throws \Psr\Container\NotFoundExceptionInterface
	 * @throws \Bitrix\Main\ObjectNotFoundException
	 */
	public function getInviteLinkAction(array $departmentsId = [], string $analyticsType = ''): AjaxJson
	{
		$departmentsId = array_map(fn($departmentId) => (int)$departmentId, $departmentsId);
		$departmentsId = array_filter($departmentsId, fn($departmentId) => $departmentId > 0);

		if (count($departmentsId) <= 0)
		{
			$rootDepartment = $this->getRootDepartment();
			$departmentsId = [$rootDepartment->getId()];
		}

		$analyticsParams = [
			'st' => [
				'tool' => 'Invitation',
				'category' => 'invitation_by_link',
				'event' => 'openLink',
				'type' => in_array($analyticsType, ['by_link', 'by_local_email_program']) ?  $analyticsType : '',
			],
		];

		$linkGenerator = Intranet\Service\InviteLinkGenerator::createByDepartmentsIds($departmentsId, $analyticsParams);
		$link = $linkGenerator->getShortLink();

		return AjaxJson::createSuccess([
			'invitationLink' => $link,
		]);
	}

	public function restoreFiredUsersAction(array $userIds = []): Response
	{
		if (!$this->isRestoreUsersAccessAvailable())
		{
			$this->addError(new Error('no permissions', 403));

			return AjaxJson::createError($this->errorCollection);
		}

		$restoredUserIds = [];

		foreach ($userIds as $userId)
		{
			$res = Util::activateUser([
				'userId' => $userId,
				'currentUserId' => Intranet\CurrentUser::get()->getId(),
				'isCurrentUserAdmin' => Intranet\CurrentUser::get()->isAdmin(),
			]);

			if ($res)
			{
				$restoredUserIds[] = $userId;
			}
		}

		return AjaxJson::createSuccess([
			'restoredUserIds' => $restoredUserIds,
		]);
	}

	/**
	 * @throws \Bitrix\Main\ArgumentException
	 * @throws \Bitrix\Main\ObjectPropertyException
	 * @throws \Bitrix\Main\SystemException
	 */
	private function getDefaultDepartmentCollection(): Intranet\Entity\Collection\DepartmentCollection
	{
		$departmentCollection = new Intranet\Entity\Collection\DepartmentCollection();
		$departmentCollection->add($this->getRootDepartment());

		return $departmentCollection;
	}
}
