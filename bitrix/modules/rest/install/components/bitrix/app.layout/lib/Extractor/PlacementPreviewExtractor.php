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
		if (empty($params['APP_VIEW']))
		{
			return;
		}

		$appInfo = Rest\AppTable::getByClientId((string)$params['APP_VIEW']);
		if (
			!$appInfo
			|| $appInfo['ACTIVE'] !== Rest\AppTable::ACTIVE
			|| $appInfo['INSTALLED'] !== Rest\AppTable::INSTALLED
		)
		{
			return;
		}

		$this->appInfo = $appInfo;
		$this->enabled = true;
	}

	public function run(): array
	{
		$placement = Rest\PlacementTable::getList(
			[
				'filter' => [
					'PLACEMENT' => \CRestUtil::PLACEMENT_APP_URI,
					'APP_ID' => $this->appInfo['ID'],
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
