<?php

declare(strict_types=1);

namespace Bitrix\Vibecodeconnector\Internal\Integration\Rest;

use Bitrix\Main\Application;
use Bitrix\Main\License;
use Bitrix\Main\Loader;
use Bitrix\Rest\Marketplace\Url;
use Throwable;

class PurchaseUrlProvider
{
	private const SELF_HOSTED_REGIONS = ['de', 'eu', 'in'];
	private const BOX_SUBSCRIPTION_URLS = ['ru' => 'https://www.1c-bitrix.ru/buy/products/b24.php#tab-section-5'];

	protected License $license;

	public function __construct(?License $license = null)
	{
		$this->license = $license ?? Application::getInstance()->getLicense();
	}

	public function getTariffBuyUrl(): ?string
	{
		return $this->filterUrl(function(): string {
			if (Loader::includeModule('bitrix24'))
			{
				return \CBitrix24::PATH_LICENSE_ALL;
			}

			if ($this->license->isCis())
			{
				return $this->license->getDomainStoreLicense() . '/key_update.php';
			}

			$region = $this->license->getRegion();
			$domain = in_array($region, self::SELF_HOSTED_REGIONS, true) ? $region : 'com';

			return "https://www.bitrix24.{$domain}/prices/self-hosted.php";
		});
	}

	public function getSubscriptionBuyUrl(): ?string
	{
		return $this->filterUrl(function(): ?string {
			if (!Loader::includeModule('bitrix24'))
			{
				return self::BOX_SUBSCRIPTION_URLS[$this->license->getRegion()] ?? null;
			}

			return Loader::includeModule('rest') ? $this->resolveSubscriptionBuyUrl() : null;
		});
	}

	public function isVibecodeTariffAvailable(): bool
	{
		return false;
	}

	protected function resolveSubscriptionBuyUrl(): string
	{
		return Url::getSubscriptionBuyUrl();
	}

	private function filterUrl(callable $resolve): ?string
	{
		try
		{
			$url = $resolve();
		}
		catch (Throwable)
		{
			return null;
		}

		return trim((string)$url) === '' ? null : $url;
	}
}
