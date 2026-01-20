<?php

declare(strict_types=1);

namespace Bitrix\Rest\Component\AppLayout\Filler;

if(!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Rest;

class SubscriptionFiller extends FillerBase
{
	public function run(): array
	{
		return [
			'SUBSCRIPTION_FINISH' => Rest\Marketplace\Client::getSubscriptionFinalDate()
		];
	}
}
