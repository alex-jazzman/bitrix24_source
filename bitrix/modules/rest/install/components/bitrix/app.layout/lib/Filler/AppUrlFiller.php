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

class AppUrlFiller extends FillerBase
{
	protected array $app;
	protected ?string $placement = null;
	protected ?array $placementData = null;

	public function __construct(
		protected array $params,
		protected array $result,
		protected Main\HttpRequest $request,
	)
	{
		parent::__construct($params, $result, $request);

		$this->enabled = true;
		$this->app = $result['APPLICATION'];
		$this->placement = (string)$this->params['PLACEMENT'] ?? null;
		$this->placementData = $this->result['PLACEMENT_DATA'] ?? null;
	}

	public function run(): array
	{
		$app = $this->app;
		$installationMode = false;
		$url = $app['URL'];

		if ($app['INSTALLED'] !== Rest\AppTable::INSTALLED && $app['URL_INSTALL'] <> '')
		{
			if ($this->canCurrentUserInstall())
			{
				$installationMode = true;
				$url = $app['URL_INSTALL'];
			}
			else
			{
				throw new Exception\AppNotInstalledException();
			}
		}
		elseif (!empty($this->placementData['PLACEMENT_HANDLER']))
		{
			$url = $this->placementData['PLACEMENT_HANDLER'];
		}
		elseif (($app['STATUS'] === Rest\AppTable::STATUS_DEMO || $app['STATUS'] === Rest\AppTable::STATUS_TRIAL)
			&& $app['URL_DEMO'] <> ''
		)
		{
			$url = $app['URL_DEMO'];
		}

		if (empty($url))
		{
			throw new Exception\AppHandlerNotDefinedException();
		}

		return [
			'APP_URL' => $url,
			'APP_IS_IN_INSTALLATION_MODE' => $installationMode,
		];
	}

	private function canCurrentUserInstall(): bool
	{
		return \CRestUtil::isAdmin()
			|| \CRestUtil::canInstallApplication($this->app)
		;
	}
}
