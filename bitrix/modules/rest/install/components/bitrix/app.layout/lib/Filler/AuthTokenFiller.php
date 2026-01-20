<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Filler;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;
use Bitrix\Rest;
use Bitrix\Rest\Component\AppLayout\Exception;

class AuthTokenFiller extends FillerBase
{
	protected bool $enabled = true;
	protected array $app;
	protected bool $accessGranted = false;
	protected bool $needCheckAuth;
	protected ?\CUser $currentUser = null;
	protected ?array $token = null;

	public function __construct(
		protected array $params,
		protected array $result,
		protected Main\HttpRequest $request,
	)
	{
		parent::__construct($params, $result, $request);

		$this->app = $result['APPLICATION'];
		$this->needCheckAuth = $this->params['PLACEMENT'] !== Rest\Api\UserFieldType::PLACEMENT_UF_TYPE;

		global $USER;
		if ($USER instanceof \CUser)
		{
			$this->currentUser = $USER;
		}
	}

	public function run(): array
	{
		if ($this->needCheckAuth)
		{
			$this->checkAuth();
		}

		return [
			'AUTH' => $this->token,
			'APPLICATION_ACCESS_GRANTED' => $this->accessGranted,
		];
	}

	private function checkAuth(): void
	{
		if ($this->currentUser === null)
		{
			throw new Exception\AccessDeniedException();
		}
		$this->accessGranted = \CRestUtil::checkAppAccess($this->app['ID']);
		if ($this->accessGranted !== true)
		{
			throw new Exception\AccessDeniedException();
		}

		$app = $this->app;
		$authAttempts = 2;
		while ((--$authAttempts) > 0)
		{
			$auth = Rest\Application::getAuthProvider()->get(
				$app['CLIENT_ID'],
				$app['SCOPE'],
				[],
				$this->currentUser->GetID()
			);

			if (!empty($auth['access_token']))
			{
				Rest\AppTable::setSkipRemoteUpdate(true);
				$result = \CRestUtil::updateAppStatus($auth + ['client_id' => $app['CLIENT_ID']]);
				Rest\AppTable::setSkipRemoteUpdate(false);
				if ($result?->isSuccess() && $app['STATUS'] === Rest\AppTable::STATUS_PAID)
				{
					Rest\AppTable::callAppPaymentEvent($app['ID']);
				}

				$this->token = $auth;

				return;
			}

			if (empty($auth['error']))
			{
				throw new Exception\AuthUnknownException();
			}

			if ($auth['error'] === 'ERROR_OAUTH' && $auth['error_description'] === 'Subscription has been ended')
			{
				throw new Exception\SubscriptionRequiredException();
			}

			if ($auth['error'] == 'ERROR_OAUTH' && $auth['error_description'] === 'Application not installed')
			{
				$queryFields = [
					'CLIENT_ID' => $app['CLIENT_ID'],
					'VERSION' => $app['VERSION'],
					'BY_SUBSCRIPTION' => $app['STATUS'] === Rest\AppTable::STATUS_SUBSCRIPTION ? 'Y' : 'N',
				];

				Rest\OAuthService::getEngine()->getClient()->installApplication($queryFields);
				continue;
			}

			if ($auth['error'] === 'PAYMENT_REQUIRED')
			{
				Rest\AppTable::updateAppStatusInfo();
				$app = Rest\AppTable::getByClientId($this->app['ID']);

				continue;
			}

			throw new Exception\AuthExternalException($auth['error'], $auth['error_description'] ?? '');
		}

		throw new Exception\AuthUnknownException();
	}
}
