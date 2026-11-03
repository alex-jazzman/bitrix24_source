<?
if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true)die();

use Bitrix\Intranet\Entity\User;
use Bitrix\Intranet\Internal\Access\Otp\UserPermission;
use Bitrix\Intranet\Internal\Integration\Security\PersonalOtp;
use Bitrix\Intranet\Public\Provider\Otp\DayListProvider;
use Bitrix\Intranet\Repository\UserRepository;
use Bitrix\Main\Loader;
use Bitrix\Security\Mfa\OtpException;

class CIntranetUserOtpConnectedAjaxController extends \Bitrix\Main\Engine\Controller
{
	protected $userId;

	protected function processBeforeAction(\Bitrix\Main\Engine\Action $action)
	{
		parent::processBeforeAction($action);

		if (!$this->getRequest()->isPost() || !$this->getRequest()->getPost('signedParameters'))
		{
			return false;
		}

		$parameters = $this->getUnsignedParameters();

		if (isset($parameters['USER_ID']))
		{
			$this->userId = $parameters['USER_ID'];
		}
		else
		{
			return false;
		}

		if (Loader::includeModule("security"))
		{
			$this->isOtpMandotary = !\CSecurityUser::IsUserSkipMandatoryRights($this->userId);
		}

		return true;
	}

	protected function canEditOtp()
	{
		global $USER;

		return (int)$USER->GetID() === (int)$this->userId;
	}

	protected function canDeactivateOtp()
	{
		global $USER;

		return (int)$USER->GetID() === (int)$this->userId
			|| $USER->CanDoOperation('security_edit_user_otp');
	}

	protected function canActivateOtp()
	{
		global $USER;

		return (int)$USER->GetID() === (int)$this->userId
			|| $USER->CanDoOperation('security_edit_user_otp');
	}

	protected function isIntegrator()
	{
		global $USER;

		if (
			Loader::includeModule('bitrix24')
			&& \Bitrix\Bitrix24\Integrator::isIntegrator($USER->GetID())
		)
		{
			return true;
		}

		return false;
	}

	protected function getTargetUser(): ?User
	{
		return (new UserRepository())->getUserById((int)$this->userId);
	}

	protected function isAllowedOtpPeriod(User $user, mixed $numDays): bool
	{
		return (new DayListProvider())->isAllowedRawPeriod($user, $numDays);
	}

	public function deactivateOtpAction($numDays)
	{
		global $USER;

		if (!Loader::includeModule("security"))
		{
			$this->addError(new \Bitrix\Main\Error("Module Security is not installed"));
			return false;
		}

		if (
			!$this->canDeactivateOtp()
			|| $this->isIntegrator()
		)
		{
			$this->addError(new \Bitrix\Main\Error("No rights"));
			return false;
		}

		if (
			$USER->GetID() == $this->userId
			&& !$USER->CanDoOperation('security_edit_user_otp')
			&& $this->isOtpMandotary
		)
		{
			$this->addError(new \Bitrix\Main\Error("No rights"));
			return false;
		}

		$user = $this->getTargetUser();

		if ($user === null)
		{
			$this->addError(new \Bitrix\Main\Error("User not found"));
			return false;
		}

		if (!$this->isAllowedOtpPeriod($user, $numDays))
		{
			$this->addError(new \Bitrix\Main\Error("Invalid period"));
			return false;
		}

		try
		{
			(new PersonalOtp($user))->deactivate((int)$numDays);
		}
		catch (OtpException $exception)
		{
			$this->addError(new \Bitrix\Main\Error($exception->getMessage()));

			return false;
		}

		return true;
	}

	public function activateOtpAction()
	{
		if (!Loader::includeModule("security"))
		{
			$this->addError(new \Bitrix\Main\Error("Module Security is not installed"));
			return false;
		}

		if (!$this->canActivateOtp())
		{
			$this->addError(new \Bitrix\Main\Error("No rights"));
			return false;
		}

		$res = \CSecurityUser::ActivateUserOtp($this->userId);
		if ($res)
		{
			return true;
		}
		else
		{
			$this->addError(new \Bitrix\Main\Error("Deactivation Error"));
			return false;
		}
	}

	public function deferOtpAction($numDays)
	{
		if (!Loader::includeModule("security"))
		{
			$this->addError(new \Bitrix\Main\Error("Module Security is not installed"));
			return false;
		}

		$user = $this->getTargetUser();

		if ($user === null)
		{
			$this->addError(new \Bitrix\Main\Error("User not found"));
			return false;
		}

		if (
			$this->isIntegrator()
			|| !(new UserPermission($user))->canDefer()
		)
		{
			$this->addError(new \Bitrix\Main\Error("No rights"));
			return false;
		}

		if (!$this->isAllowedOtpPeriod($user, $numDays))
		{
			$this->addError(new \Bitrix\Main\Error("Invalid period"));
			return false;
		}

		$res = \CSecurityUser::DeferUserOtp($this->userId, (int)$numDays);

		if ($res)
		{
			return true;
		}
		else
		{
			$this->addError(new \Bitrix\Main\Error("Error"));
			return false;
		}
	}
}
