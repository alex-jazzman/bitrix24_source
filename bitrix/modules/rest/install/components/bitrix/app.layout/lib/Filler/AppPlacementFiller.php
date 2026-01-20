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

class AppPlacementFiller extends FillerBase
{
	protected array $app;
	protected ?string $placement = null;
	protected ?int $placementId = null;
	protected ?\CUser $currentUser = null;

	public function __construct(
		protected array $params,
		protected array $result,
		protected Main\HttpRequest $request,
	)
	{
		parent::__construct($params, $result, $request);

		if (!empty($this->params['PLACEMENT'])
			&& $this->params['PLACEMENT'] !== Rest\PlacementTable::PLACEMENT_DEFAULT
		)
		{
			$this->enabled = true;

			$this->app = $result['APPLICATION'];
			$this->placement = (string)$this->params['PLACEMENT'];
			$this->placementId = (int)$this->params['PLACEMENT_ID'] ?? null;

			global $USER;
			if ($USER instanceof \CUser)
			{
				$this->currentUser = $USER;
			}
		}
		else
		{
			$this->enabled = false;
		}
	}

	public function run(): array
	{
		$placement = $this->getPlacementData($this->app);
		return [
			'PLACEMENT_DATA' => $placement,
			'PRESET_OPTIONS' => $placement['OPTIONS'] ?? null,
		];
	}

	private function getPlacementData(array $app): array
	{
		$query = Rest\PlacementTable::query()
			->setSelect(['ID', 'TITLE', 'PLACEMENT_HANDLER', 'OPTIONS', 'LANG_ALL'])
		;

		if ($this->placementId > 0)
		{
			$query->where('ID', $this->placementId);
		}

		$userFilter = [Rest\PlacementTable::DEFAULT_USER_ID_VALUE];
		if ($this->currentUser !== null)
		{
			$userFilter[] = $this->currentUser->GetID();
		};
		$query
			->where('APP_ID', $app['ID'])
			->where('PLACEMENT', $this->placement)
			->whereIn('USER_ID',  $userFilter)
		;

		$placementVariants = $query->fetchCollection();

		foreach ($placementVariants as $handler)
		{
			$placementHandlerInfo = [
				'ID' => $handler->getId(),
				'TITLE' => $handler->getTitle(),
				'OPTIONS' => $handler->getOptions(),
				'PLACEMENT_HANDLER' => $handler->getPlacementHandler(),
				'LANG_ALL' => [],
			];

			foreach (($handler->getLangAll() ?? []) as $lang)
			{
				$placementHandlerInfo['LANG_ALL'][$lang->getLanguageId()] = [
					'TITLE' => $lang->getTitle(),
					'DESCRIPTION' => $lang->getDescription(),
					'GROUP_NAME' => $lang->getGroupName(),
				];
			}

			$placementHandlerInfo = Rest\Lang::mergeFromLangAll($placementHandlerInfo);

			if (isset($placementHandlerInfo['TITLE']) && trim($placementHandlerInfo['TITLE']) !== '')
			{
				break;
			}
		}

		if (isset($placementHandlerInfo))
		{
			return $placementHandlerInfo;
		}

		throw new Exception\PlacementNotInstalledException();
	}
}
