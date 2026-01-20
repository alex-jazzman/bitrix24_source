<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Extractor;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Rest;
use Bitrix\Main;

class PlacementPreviewExtractor extends Extractor
{
	private array $appInfo;

	public function __construct(array $params, protected Main\HttpRequest $request)
	{
		$this->enabled = isset($params['APP_VIEW']);

		if ($this->enabled)
		{
			$clientId = (string) $params['APP_VIEW'];
			$appInfo = Rest\AppTable::getByClientId($clientId);

			if (!empty($appInfo))
			{
				$this->appInfo = $appInfo;
			}
		}
		$this->enabled = $this->enabled && !empty($this->appInfo);
	}

	public function run(): array
	{
		$appInfo = $this->appInfo;

		if ($appInfo['ACTIVE'] !== Rest\AppTable::ACTIVE || $appInfo['INSTALLED'] !== Rest\AppTable::INSTALLED)
		{
			return [];
		}

		$placement = Rest\PlacementTable::getList(
			[
				'filter' => [
					'PLACEMENT' => \CRestUtil::PLACEMENT_APP_URI,
					'APP_ID' => $appInfo['ID']
				],
			]
		)->fetch();

		if (empty($placement))
		{
			return [];
		}

		$result = [
			'ID' => $placement['APP_ID'],
			'PLACEMENT' => $placement['PLACEMENT'],
			'PLACEMENT_ID' => $placement['ID'],
		];

		$requestParams = $this->request->getQuery('params');
		if (!empty($requestParams))
		{
			$result['PLACEMENT_OPTIONS'] = $result['~PLACEMENT_OPTIONS'] = $requestParams;
		}

		return $result;
	}
}
