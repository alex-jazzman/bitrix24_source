<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Extractor;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Rest;
use Bitrix\Main;

class PlacementDataExtractor extends Extractor
{
	public function __construct(protected array $params, protected Main\HttpRequest $request)
	{
		$this->enabled = !empty($params['PLACEMENT'])
			&& $params['PLACEMENT'] !== Rest\PlacementTable::PLACEMENT_DEFAULT
		;
	}

	public function run(): array
	{
		$result = [];

		$requestOptions = $this->request->getQueryList()->toArrayRaw() ?? [];
		if (!empty($this->params['POPUP']) && $this->params['POPUP'] !== 'N')
		{
			$requestOptions = array_merge($requestOptions, $this->request->getPost('param') ?? []);

			$result['PARENT_SID'] = $this->request->get('parentsid');
		}

		$deniedParam = $this->request::getSystemParameters() + ['_r'];

		$result['PLACEMENT_OPTIONS'] = array_diff_key($requestOptions, array_flip($deniedParam));
		$result['~PLACEMENT_OPTIONS'] = $result['PLACEMENT_OPTIONS'];

		return $result;
	}
}
