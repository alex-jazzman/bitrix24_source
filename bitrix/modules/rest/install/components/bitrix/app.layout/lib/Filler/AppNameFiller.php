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


class AppNameFiller extends FillerBase
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

		$this->app = $result['APPLICATION'];
		$this->placement = (string)$this->params['PLACEMENT'] ?? null;
		$this->placementData = $this->result['PLACEMENT_DATA'] ?? null;
	}

	public function run(): array
	{
		$app = $this->app;

		$supposedNames = [
			$app['APP_NAME'],
			$app['MENU_NAME'],
			$app['MENU_NAME_DEFAULT'],
			$app['MENU_NAME_LICENSE'],
		];

		if ($this->placement !== Rest\PlacementTable::PLACEMENT_DEFAULT)
		{
			array_unshift(
				$supposedNames,
				$this->getPlacementTitle()
			);
		}

		$appName = null;
		foreach ($supposedNames as $name)
		{
			if (!empty($name))
			{
				$appName = $name;
				break;
			}
		}

		if ($appName === null)
		{
			throw new Exception\AppNotFoundInMarketplaceException();
		}

		return [
			'APP_NAME' => $appName,
		];
	}

	private function getPlacementTitle(): string
	{
		if (is_array($this->placementData) && isset($this->placementData['TITLE']))
		{
			return !empty($this->placementData['TITLE'])
				? $this->placementData['TITLE']
				: Rest\PlacementTable::getDefaultTitle((int)$this->placementData['ID'])
			;
		}

		throw new Exception\PlacementNotInstalledException();
	}
}
