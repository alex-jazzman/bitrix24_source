<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Filler;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;
use Bitrix\Main\Web\Uri;
use Bitrix\Rest\PlacementTable;
use Bitrix\Rest\Public\Enum\HttpMethod;

class EmbeddingViewFiller extends FillerBase
{
	public function __construct(
		protected array $params,
		protected array $result,
		protected Main\HttpRequest $request,
	)
	{
		parent::__construct($params, $result, $request);
	}

	public function run(): array
	{
		$isPost = $this->result['EMBEDDING_METHOD'] === HttpMethod::Post;
		$payload = $this->result['EMBEDDING_PAYLOAD'];

		$actionUrl = $this->result['EMBEDDING_URL'];
		if (!$isPost && !empty($payload))
		{
			$uri = new Uri($actionUrl);
			$uri->addParams($payload);
			$actionUrl = $uri->getUri();
		}

		$frameName = $this->result['CURRENT_HOST'] . '|' . ($this->result['CURRENT_HOST_SECURE'] ? 1 : 0) . '|' . $this->result['APP_SID'];
		$isNonDefaultPlacement = $this->params['PLACEMENT'] !== PlacementTable::PLACEMENT_DEFAULT;

		$frameStyle = [];
		$param = is_array($this->params['PARAM'] ?? null) ? $this->params['PARAM'] : [];
		if (isset($param['FRAME_HEIGHT']))
		{
			$frameStyle[] = 'height:' . $param['FRAME_HEIGHT'];
		}
		if (isset($param['FRAME_WIDTH']))
		{
			$frameStyle[] = 'width:' . $param['FRAME_WIDTH'];
		}
		elseif (isset($this->params['MOBILE']) && $this->params['MOBILE'] === 'Y')
		{
			$frameStyle[] = 'width: 100%';
		}

		return [
			'EMBEDDING_IS_POST' => $isPost,
			'EMBEDDING_ACTION_URL' => $actionUrl,
			'EMBEDDING_FRAME_NAME' => $frameName,
			'EMBEDDING_IS_NON_DEFAULT_PLACEMENT' => $isNonDefaultPlacement,
			'EMBEDDING_FRAME_STYLE' => $frameStyle,
		];
	}
}
