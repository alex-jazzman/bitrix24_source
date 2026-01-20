<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Filler;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Rest;
use Bitrix\Rest\Component\AppLayout\Exception;

class AppBodyFiller extends FillerBase
{
	public function run(): array
	{
		$app = Rest\AppTable::getByClientId($this->params['CODE']);

		if (!is_array($app))
		{
			throw new Exception\AppNotFoundException();
		}

		if ($app['ACTIVE'] !== Rest\AppTable::ACTIVE || empty($app['CLIENT_ID']))
		{
			throw new Exception\AppNotFoundInMarketplaceException();
		}

		$detailUrl = str_replace("#code#", (string) $app['ID'], $this->params['DETAIL_URL']);
		return [
			'APPLICATION' => $app,
			'DETAIL_URL' => $detailUrl,
			'APP_ID' => $app['ID'],
			'APP_NAME' => $app['APP_NAME'],
			'APP_STATUS' => Rest\AppTable::getAppStatusInfo($app, $detailUrl)
		];
	}
}
