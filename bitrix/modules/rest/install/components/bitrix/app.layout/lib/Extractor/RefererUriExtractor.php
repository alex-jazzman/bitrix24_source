<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Extractor;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;

class RefererUriExtractor extends Extractor
{
	public function __construct(protected array $params, protected Main\HttpRequest $request)
	{
		$this->enabled = true;
	}

	public function run(): array
	{
		$refererPathQuery = $this->resolveSameOriginRefererPathQuery();
		if ($refererPathQuery === null)
		{
			return [];
		}

		$placementOptions = $this->params['PLACEMENT_OPTIONS'] ?? [];
		$placementOptions = is_array($placementOptions) ? $placementOptions : [];

		$rawPlacementOptions = $this->params['~PLACEMENT_OPTIONS'] ?? [];
		$rawPlacementOptions = is_array($rawPlacementOptions) ? $rawPlacementOptions : [];

		if (!empty($placementOptions['URI']) || !empty($rawPlacementOptions['URI']))
		{
			return [];
		}

		$placementOptions['URI'] = $refererPathQuery;
		$rawPlacementOptions['URI'] = $refererPathQuery;

		return [
			'PLACEMENT_OPTIONS' => $placementOptions,
			'~PLACEMENT_OPTIONS' => $rawPlacementOptions,
		];
	}

	private function resolveSameOriginRefererPathQuery(): ?string
	{
		$refererHeader = (string)($this->request->getHeader('referer') ?? '');
		if ($refererHeader === '')
		{
			return null;
		}

		$referer = new Main\Web\Uri($refererHeader);
		if ($referer->getPath() === '')
		{
			return null;
		}

		$serverPort = (int)Main\Context::getCurrent()->getServer()->getServerPort();
		$requestScheme = $this->request->isHttps() ? 'https' : 'http';

		if (
			$referer->getScheme() === $requestScheme
			&& $referer->getHost() === $this->request->getHttpHost()
			&& $referer->getPort() === $serverPort
		)
		{
			return $referer->getPathQuery();
		}

		return null;
	}
}
