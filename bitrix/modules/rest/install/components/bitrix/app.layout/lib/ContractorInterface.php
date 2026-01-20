<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

interface ContractorInterface
{
	public function isEnabled(): bool;

	public function run(): array;
}
