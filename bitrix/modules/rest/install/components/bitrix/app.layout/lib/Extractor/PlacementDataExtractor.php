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
		$this->enabled = ($params['PLACEMENT'] ?? Rest\PlacementTable::PLACEMENT_DEFAULT) === Rest\PlacementTable::PLACEMENT_DEFAULT
			&& empty($params['PLACEMENT_OPTIONS'])
		;
	}

	public function run(): array
	{
		$result = [];

		$requestOptions = $this->request->getQueryList()->toArrayRaw()
			?? $this->request->getQueryList()->toArray()
		;

		if (!empty($this->params['POPUP']) && $this->params['POPUP'] !== 'N')
		{
			$postParam = $this->request->getPost('param') ?? [];
			$requestOptions = array_merge($requestOptions, is_array($postParam) ? $postParam : []);

			$result['PARENT_SID'] = $this->request->get('parentsid');
		}

		$deniedParam = $this->request::getSystemParameters();
		$deniedParam[] = '_r';

		$result['PLACEMENT_OPTIONS'] = array_diff_key($requestOptions, array_flip($deniedParam));
		$result['~PLACEMENT_OPTIONS'] = $result['PLACEMENT_OPTIONS'];

		return $result;
	}
}
