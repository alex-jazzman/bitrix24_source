<?php

use Bitrix\BIConnector\Access\AccessController;
use Bitrix\BIConnector\Access\ActionDictionary;
use Bitrix\BIConnector\Integration\Superset\Integrator\Integrator;
use Bitrix\BIConnector\Integration\Superset\Model\SupersetDashboardTable;
use Bitrix\BIConnector\Integration\Superset\SupersetController;
use Bitrix\BIConnector\Integration\Superset\SupersetInitializer;
use Bitrix\BIConnector\Superset\Dashboard\ExternalFilter\RlsRuleBuilder;
use Bitrix\BIConnector\Internal\Services\Share\SharePasswordService;
use Bitrix\BIConnector\Public\Command\DashboardView\AddSupersetDashboardViewCommand;
use Bitrix\BIConnector\Public\Provider\ShareProvider;
use Bitrix\Main\Application;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\Engine\ActionFilter;
use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Error;
use Bitrix\Main\Loader;
use Bitrix\Main\Web\Json;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!Loader::includeModule('biconnector'))
{
	return;
}

class SupersetDashboardShareAjax extends \Bitrix\Main\Engine\Controller
{
	private function getShareProvider(): ShareProvider
	{
		return ServiceLocator::getInstance()->get('biconnector.provider.share');
	}

	private function getPasswordService(): SharePasswordService
	{
		return ServiceLocator::getInstance()->get('biconnector.service.sharePassword');
	}

	protected function getDefaultPreFilters(): array
	{
		return [
			new ActionFilter\HttpMethod([ActionFilter\HttpMethod::METHOD_POST]),
			new ActionFilter\Csrf(),
		];
	}

	public function checkPasswordAction(string $token, string $password = '', string $passwordHash = ''): ?array
	{
		$share = $this->getShareProvider()->getByToken($token);
		if (!$share || !$share->isValid())
		{
			$this->addError(new Error('Share not found or expired.', 'SHARE_INVALID'));

			return null;
		}

		if (!AccessController::getInstance($share->getCreatedById())->check(ActionDictionary::ACTION_BIC_DASHBOARD_SHARE))
		{
			$this->addError(new Error('Share is no longer available.', 'SHARE_UNAVAILABLE'));

			return null;
		}

		$passwordService = $this->getPasswordService();

		if ($passwordService->isLoginLocked($share))
		{
			$this->addError(new Error(
				'Too many failed attempts.',
				'LOGIN_LOCKED',
				['minutes' => $passwordService->getRemainingLockMinutes($share)],
			));

			return null;
		}

		$passwordValid = !empty($passwordHash)
			? $passwordService->checkPasswordHash($share, $passwordHash)
			: $passwordService->checkPassword($share, $password)
		;

		if (!$passwordValid)
		{
			$passwordService->registerFailedLoginAttempt($share);

			if ($passwordService->isLoginLocked($share))
			{
				$this->addError(new Error(
					'Too many failed attempts.',
					'LOGIN_LOCKED',
					['minutes' => $passwordService->getRemainingLockMinutes($share)],
				));

				return null;
			}

			$this->addError(new Error('Wrong password.', 'WRONG_PASSWORD'));

			return null;
		}

		$passwordService->resetLoginAttempts($share);

		$superset = new SupersetController(Integrator::getInstance());
		$dashboard = $superset->getDashboardRepository()->getById($share->getDashboardId(), true);

		if (!$dashboard)
		{
			$this->addError(new Error('Dashboard not found.', 'DASHBOARD_NOT_FOUND'));

			return null;
		}

		if ($dashboard->getStatus() === SupersetDashboardTable::DASHBOARD_STATUS_DRAFT)
		{
			$this->addError(new Error('Dashboard not found.', 'DASHBOARD_NOT_FOUND'));

			return null;
		}

		$notReadyStatuses = [
			SupersetDashboardTable::DASHBOARD_STATUS_NOT_INSTALLED,
			SupersetDashboardTable::DASHBOARD_STATUS_LOAD,
			SupersetDashboardTable::DASHBOARD_STATUS_FAILED,
		];

		if (in_array($dashboard->getStatus(), $notReadyStatuses, true))
		{
			$supersetStatus = SupersetInitializer::getSupersetStatus();

			$terminalStatuses = [
				SupersetInitializer::SUPERSET_STATUS_DELETED,
				SupersetInitializer::SUPERSET_STATUS_LIMIT_EXCEEDED,
			];

			if (in_array($supersetStatus, $terminalStatuses, true))
			{
				$this->addError(new Error('Dashboard credentials unavailable.', 'DASHBOARD_UNAVAILABLE'));

				return null;
			}

			$isSupersetReady = $supersetStatus === SupersetInitializer::SUPERSET_STATUS_READY;

			if (!$isSupersetReady)
			{
				Application::getInstance()->addBackgroundJob(function() use ($dashboard) {
					SupersetInitializer::saveInitData($dashboard->getId());
					SupersetInitializer::startupSuperset();
				});
			}
			elseif ($dashboard->getStatus() === SupersetDashboardTable::DASHBOARD_STATUS_NOT_INSTALLED)
			{
				$appId = $dashboard->getAppId();
				if ($appId)
				{
					Application::getInstance()->addBackgroundJob(function() use ($appId) {
						\Bitrix\BIConnector\Superset\MarketDashboardManager::getInstance()
							->installApplication($appId);
					});
				}
			}

			return [
				'status' => 'INSTALLING',
				'dashboardId' => $dashboard->getId(),
			];
		}

		$externalFilterValues = $this->decodeJson($share->getExternalFilterValues());
		$rlsRules = RlsRuleBuilder::buildRules($externalFilterValues);
		$dashboard->loadCredentials($rlsRules, 60 * 5);

		if (!$dashboard->isSupersetDashboardCredentialsLoad())
		{
			$this->addError(new Error('Dashboard credentials unavailable.', 'DASHBOARD_UNAVAILABLE'));

			return null;
		}

		$urlParams = $this->decodeJson($share->getUrlParameterValues());

		$nativeFilter = new \Bitrix\BIConnector\Superset\Dashboard\EmbeddedFilter\NativeFilterBuilder($dashboard);

		$result = [
			'embeddedParams' => [
				'guestToken' => $dashboard->getEmbeddedCredentials()->guestToken,
				'uuid' => $dashboard->getEmbeddedCredentials()->uuid,
				'supersetDomain' => $dashboard->getEmbeddedCredentials()->supersetDomain,
				'nativeFilters' => $nativeFilter->getFormattedFilter(),
			],
		];

		if (!empty($externalFilterValues))
		{
			$result['lockedExternalFilters'] = $externalFilterValues;
		}

		if (!empty($urlParams))
		{
			$result['urlParams'] = $urlParams;
		}

		(new AddSupersetDashboardViewCommand(
			$share->getDashboardId(),
			(int)CurrentUser::get()->getId(),
		))->run();

		return $result;
	}

	public function refreshShareTokenAction(string $token, string $passwordHash = ''): ?array
	{
		$share = $this->getShareProvider()->getByToken($token);
		if (!$share || !$share->isValid())
		{
			$this->addError(new Error('Share not found or expired.', 'SHARE_INVALID'));

			return null;
		}

		$creatorId = $share->getCreatedById();
		if (!AccessController::getInstance($creatorId)->check(ActionDictionary::ACTION_BIC_DASHBOARD_SHARE))
		{
			$this->addError(new Error('Share is no longer available.', 'SHARE_UNAVAILABLE'));

			return null;
		}

		$passwordService = $this->getPasswordService();

		if ($passwordService->isLoginLocked($share))
		{
			$this->addError(new Error(
				'Too many failed attempts.',
				'LOGIN_LOCKED',
				['minutes' => $passwordService->getRemainingLockMinutes($share)],
			));

			return null;
		}

		if (!$passwordService->checkPasswordHash($share, $passwordHash))
		{
			$passwordService->registerFailedLoginAttempt($share);

			if ($passwordService->isLoginLocked($share))
			{
				$this->addError(new Error(
					'Too many failed attempts.',
					'LOGIN_LOCKED',
					['minutes' => $passwordService->getRemainingLockMinutes($share)],
				));

				return null;
			}

			$this->addError(new Error('Wrong password.', 'WRONG_PASSWORD'));

			return null;
		}

		$passwordService->resetLoginAttempts($share);

		$superset = new SupersetController(Integrator::getInstance());
		$dashboard = $superset->getDashboardRepository()->getById($share->getDashboardId(), true);

		if (!$dashboard)
		{
			$this->addError(new Error('Dashboard not found.', 'DASHBOARD_NOT_FOUND'));

			return null;
		}

		if ($dashboard->getStatus() === \Bitrix\BIConnector\Integration\Superset\Model\SupersetDashboardTable::DASHBOARD_STATUS_DRAFT)
		{
			$this->addError(new Error('Dashboard not found.', 'DASHBOARD_NOT_FOUND'));

			return null;
		}

		$externalFilterValues = $this->decodeJson($share->getExternalFilterValues());
		$rlsRules = RlsRuleBuilder::buildRules($externalFilterValues);
		$dashboard->loadCredentials($rlsRules, 300);

		if (!$dashboard->isSupersetDashboardCredentialsLoad())
		{
			$this->addError(new Error('Dashboard credentials unavailable.', 'DASHBOARD_UNAVAILABLE'));

			return null;
		}

		return [
			'guestToken' => $dashboard->getEmbeddedCredentials()->guestToken,
		];
	}

	private function decodeJson(?string $json): ?array
	{
		if (empty($json))
		{
			return null;
		}

		try
		{
			return Json::decode($json);
		}
		catch (\Exception)
		{
			return null;
		}
	}
}
