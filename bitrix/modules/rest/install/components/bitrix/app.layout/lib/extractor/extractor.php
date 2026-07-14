<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Extractor;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Rest;

abstract class Extractor implements Rest\Component\AppLayout\ContractorInterface
{
	protected bool $enabled = false;

	public function isEnabled(): bool
	{
		return $this->enabled;
	}
}
