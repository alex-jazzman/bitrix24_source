<?php

namespace Bitrix\Seo\Analytics\Internals;

use Bitrix\Main\Type\Date;

class Expenses
{
	protected array $data = [];

	/**
	 * Expenses constructor.
	 * @param array $data
	 */
	public function __construct(array $data = [])
	{
		$this->prepareData($data);
	}

	/**
	 * @param array $data
	 * @return $this
	 */
	public function add(array $data): static
	{
		foreach ($this->getNumericFieldNames() as $name)
		{
			if (isset($data[$name]))
			{
				$value = $data[$name];
				if (is_array($value))
				{
					$value = array_sum(array_map(
						function ($value)
						{
							return is_numeric($value) ? $value : 0;
						},
						array_column($value, 'value')
					));
				}
				if (is_numeric($value))
				{
					$this->data[$name] += $value;
				}
			}
		}

		if (isset($data['currency']) && empty($this->data['currency']))
		{
			$this->data['currency'] = (string)$data['currency'];
		}

		if (isset($data['campaignId']))
		{
			$this->data['campaignId'] = (string)$data['campaignId'];
		}

		if (isset($data['campaignName']))
		{
			$this->data['campaignName'] = (string)$data['campaignName'];
		}

		if (isset($data['groupId']))
		{
			$this->data['groupId'] = (string)$data['groupId'];
		}

		if (isset($data['groupName']))
		{
			$this->data['groupName'] = (string)$data['groupName'];
		}

		if (isset($data['adId']))
		{
			$this->data['adId'] = (string)$data['adId'];
		}

		if (isset($data['adName']))
		{
			$this->data['adName'] = (string)$data['adName'];
		}

		if (isset($data['utmMedium']))
		{
			$this->data['utmMedium'] = (string)$data['utmMedium'];
		}

		if (isset($data['utmSource']))
		{
			$this->data['utmSource'] = (string)$data['utmSource'];
		}

		if (isset($data['utmCampaign']))
		{
			$this->data['utmCampaign'] = (string)$data['utmCampaign'];
		}

		if (isset($data['utmContent']))
		{
			$this->data['utmContent'] = (string)$data['utmContent'];
		}

		if (isset($data['date']) && $data['date'] instanceof Date)
		{
			$this->data['date'] = $data['date'];
		}

		return $this;
	}

	/**
	 * @return array
	 */
	public function toArray(): array
	{
		return $this->data;
	}

	/**
	 * @return int
	 */
	public function getImpressions(): int
	{
		return (int)($this->data['impressions'] ?? 0);
	}

	/**
	 * @return int
	 */
	public function getClicks(): int
	{
		return (int)($this->data['clicks'] ?? 0);
	}

	/**
	 * @return int
	 */
	public function getActions(): int
	{
		return (int)($this->data['actions'] ?? 0);
	}

	/**
	 * @return float
	 */
	public function getCpc(): float
	{
		return (float)($this->data['cpc'] ?? 0);
	}

	/**
	 * This is cost per 1000 impressions.
	 *
	 * @return float
	 */
	public function getCpm(): float
	{
		return (float)($this->data['cpm'] ?? 0);
	}

	/**
	 * @return float
	 */
	public function getSpend(): float
	{
		return $this->data['spend'];
	}

	/**
	 * @return string
	 */
	public function getCurrency(): string
	{
		return $this->data['currency'];
	}

	/**
	 * @return string
	 */
	public function getCampaignId(): string
	{
		return $this->data['campaignId'] ?? '';
	}

	/**
	 * @return string
	 */
	public function getCampaignName(): string
	{
		return $this->data['campaignName'];
	}

	/**
	 * @return string
	 */
	public function getGroupId(): string
	{
		return $this->data['groupId'] ?? '';
	}

	/**
	 * @return string
	 */
	public function getGroupName(): string
	{
		return $this->data['groupName'] ?? '';
	}

	/**
	 * @return string
	 */
	public function getAdId(): string
	{
		return $this->data['adId'] ?? '';
	}

	/**
	 * @return string
	 */
	public function getAdName(): string
	{
		return $this->data['adName'] ?? '';
	}

	/**
	 * Returns utm tag utm_medium if exists
	 *
	 * @return string
	 */
	public function getUtmMedium(): string
	{
		return $this->data['utmMedium'] ?? '';
	}

	/**
	 * Returns utm tag utm_source if exists
	 *
	 * @return string
	 */
	public function getUtmSource(): string
	{
		return $this->data['utmSource'] ?? '';
	}

	/**
	 * Returns utm tag utm_campaign if exists
	 *
	 * @return string
	 */
	public function getUtmCampaign(): string
	{
		return $this->data['utmCampaign'] ?? '';
	}

	/**
	 * Returns utm tag utm_content if exists
	 *
	 * @return string
	 */
	public function getUtmContent(): string
	{
		return $this->data['utmContent'] ?? '';
	}
	/**
	 * @return null|Date
	 */
	public function getDate(): ?Date
	{
		return $this->data['date'];
	}

	/**
	 * @param array $data
	 */
	protected function prepareData(array $data)
	{
		$this->data = [
			'impressions' => 0,
			'clicks' => 0,
			'actions' => 0,
			'cpc' => 0,
			'cpm' => 0,
			'spend' => 0,
			'currency' => '',
			'campaignId' => '',
			'campaignName' => '',
			'date' => null,
		];

		$this->add($data);
	}

	/**
	 * @return array
	 */
	protected function getNumericFieldNames(): array
	{
		return ['impressions', 'clicks', 'actions', 'cpc', 'cpm', 'spend'];
	}
}