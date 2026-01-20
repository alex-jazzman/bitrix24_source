<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Filler;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Main;
use Bitrix\Rest\Component\AppLayout\ContractorInterface;

abstract class FillerBase implements ContractorInterface
{
	protected bool $enabled = true;

	public function __construct(
		protected array $params,
		protected array $result,
		protected Main\HttpRequest $request,
	)
	{

	}

	public function isEnabled(): bool
	{
		return $this->enabled;
	}

	abstract public function run(): array;
}
