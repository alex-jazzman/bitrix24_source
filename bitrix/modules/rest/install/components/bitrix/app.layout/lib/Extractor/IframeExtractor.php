<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Extractor;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;

class IframeExtractor extends Extractor
{
	private array $iframeParams = [];

	public function __construct(protected array $params, protected Main\HttpRequest $request)
	{
		if (($params['IFRAME'] ?? false) !== true)
		{
			return;
		}

		$postParams = $request->getPost('PARAMS');
		if (!empty($postParams['params']) && is_array($postParams['params']))
		{
			$this->iframeParams = $postParams['params'];
			$this->enabled = true;
		}
	}

	public function run(): array
	{
		$result = $this->iframeParams;
		if (isset($result['PLACEMENT_OPTIONS']) && !isset($result['~PLACEMENT_OPTIONS']))
		{
			$result['~PLACEMENT_OPTIONS'] = $result['PLACEMENT_OPTIONS'];
		}
		elseif (isset($this->params['PLACEMENT_OPTIONS']) && !isset($this->params['~PLACEMENT_OPTIONS']))
		{
			$result['~PLACEMENT_OPTIONS'] = $this->params['PLACEMENT_OPTIONS'];
		}
		$result['LAZYLOAD'] = true;

		return $result;
	}
}
