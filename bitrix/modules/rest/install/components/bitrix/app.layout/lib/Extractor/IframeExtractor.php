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
	public function __construct(protected array $params, protected Main\HttpRequest $request)
	{
		$this->enabled = !empty($params['IFRAME']) && $params['IFRAME'] === true;
	}

	public function run(): array
	{
		$result = [];
		$componentParams = $this->request->getPost('PARAMS');
		if (!empty($componentParams['params']) && is_array($componentParams['params']))
		{
			$result = $componentParams['params'];
		}
		if (isset($this->params['PLACEMENT_OPTIONS']) && !isset($this->params['~PLACEMENT_OPTIONS']))
		{
			$result['~PLACEMENT_OPTIONS'] = $this->params['PLACEMENT_OPTIONS'];
		}
		$result['LAZYLOAD'] = true;

		return $result;
	}
}
