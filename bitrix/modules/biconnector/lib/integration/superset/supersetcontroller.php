<?php

namespace Bitrix\BIConnector\Integration\Superset;


use Bitrix\BIConnector\Integration\Superset\Integrator\Request\IntegratorResponse;
use Bitrix\BIConnector\Integration\Superset\Model\SupersetUserTable;
use Bitrix\BIConnector\Integration\Superset\Integrator\Integrator;
use Bitrix\BIConnector\Integration\Superset\Repository\DashboardGroupRepository;
use Bitrix\BIConnector\Integration\Superset\Repository\DashboardRepository;
use Bitrix\BIConnector\Integration\Superset\Repository\SupersetUserRepository;
use Bitrix\Main;

final class SupersetController
{
	private DashboardRepository $dashboardRepository;
	private DashboardGroupRepository $dashboardGroupRepository;

	public function __construct(private Integrator $integrator)
	{
		$this->initRepositories();
	}

	private function initRepositories(): void
	{
		$this->dashboardRepository = new DashboardRepository($this->integrator);
		$this->dashboardGroupRepository = new DashboardGroupRepository($this->integrator);
	}

	public function getDashboardRepository(): DashboardRepository
	{
		return $this->dashboardRepository;
	}

	public function getUnionDashboardGroupRepository(): DashboardGroupRepository
	{
		return $this->dashboardGroupRepository;
	}

	/**
	 * Calls on every BI-constructor page hit and call superset if it's need to up
	 *
	 * @return void
	 */
	public function initializeOrCheckSupersetStatus(): void
	{
		SupersetInitializer::initializeOrCheckSupersetStatus();
	}

	public function isSupersetEnabled(): bool
	{
		return SupersetInitializer::isSupersetReady();
	}

	public function createUser(int $userId): Main\Result
	{
		$result = new Main\Result();

		$user = (new SupersetUserRepository)->getById($userId);
		if (!$user)
		{
			$result->addError(new Main\Error("User with id \"{$userId}\" not found"));
			return $result;
		}

		if ($user->clientId)
		{
			$result->setData([
				'user' => $user,
				'response' => new IntegratorResponse(200),
			]);

			return $result;
		}

		$response = $this->integrator->createUser($user);
		if ($response->hasErrors())
		{
			return $result->addErrors($response->getErrors())->setData(['response' => $response]);
		}

		$data = $response->getData();

		$addResult = SupersetUserTable::addClientId($user->id, $data['client_id']);
		if ($addResult->isSuccess())
		{
			$user->clientId = (string)$data['client_id'];
			$user->updated = true;

			$result->setData([
				'user' => $user,
				'response' => $response,
			]);
		}
		else
		{
			$result->addErrors($addResult->getErrors());
		}

		return $result;
	}

	public function getLoginUrl(): ?string
	{
		$response = $this->integrator->getLoginUrl();
		if ($response->hasErrors())
		{
			return null;
		}

		$data = $response->getData();
		return $data['url'];
	}

	public function isExternalServiceAvailable(): bool
	{
		return $this->integrator->ping();
	}
}