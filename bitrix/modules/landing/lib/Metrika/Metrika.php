<?php
declare(strict_types=1);

namespace Bitrix\Landing\Metrika;

use Bitrix\Main\Analytics\AnalyticsEvent;
use Bitrix\Main\Web\Json;
use Bitrix\Main\Web\Uri;

class Metrika
{
	private const TOOL = 'landing';
	private const ERROR_PARAM = 'errorType';

	private array $data = [];
	private AnalyticsEvent $event;

	public function __construct(Categories $category, Events $event)
	{
		$this->event = new AnalyticsEvent($event->value, self::TOOL, $category->value);
		$this->event->setStatus(Statuses::Success->value);

		$this->data['tool'] = self::TOOL;
		$this->data['status'] = Statuses::Success->value;
		$this->data['category'] = $category->value;
		$this->data['event'] = $event->value;
	}

	public function setType(?Types $type): self
	{
		if ($type)
		{
			$this->event->setType($type->value);
			$this->data['type'] = $type->value;
		}

		return $this;
	}

	public function setStatus(?Statuses $status): self
	{
		if (isset($status))
		{
			$this->event->setStatus($status->value);
			$this->data['status'] = $status->value;
		}

		return $this;
	}

	public function setSection(?Sections $section): self
	{
		if ($section)
		{
			$this->event->setSection($section->value);
			$this->data['c_section'] = $section->value;
		}

		return $this;
	}

	public function setSubSection(?string $subSection): self
	{
		if (isset($subSection))
		{
			$this->event->setSubSection($subSection);
			$this->data['c_sub_section'] = $subSection;
		}

		return $this;
	}

	public function setElement(?string $element): self
	{
		if (isset($element))
		{
			$this->event->setElement($element);
			$this->data['c_element'] = $element;
		}

		return $this;
	}

	public function setParams(array $params): self
	{
		$params = array_slice($params, 0, 5);
		$i = 1;
		foreach ($params as $param => $value)
		{
			$paramString = $param . '_' . str_replace(['_', ' '], '-', (string)$value);
			$this->event->{'setP' . $i++}($paramString);
		}

		$this->data['params'] = $params;

		return $this;
	}

	/**
	 * @param string $error
	 * @param Statuses|null $status - custom error status. If note pass - use default Error
	 * @return $this
	 */
	public function setError(string $error, ?Statuses $status = null): self
	{
		$params = $this->data['params'] ?? [];
		if (count($params) >= 5)
		{
			$params = array_slice($params, 0, 4);
		}
		$params[self::ERROR_PARAM] = $error;

		$this->setStatus($status ?? Statuses::Error);

		return $this->setParams($params);
	}

	public function send(): void
	{
		$this->event->send();
	}

	public function getSendingScript(bool $addTag = false): string
	{
		$data = Json::encode($this->data);
		$script = <<<script
			if (typeof BX.Landing.Metrika !== 'undefined')
			{
				const metrika = new BX.Landing.Metrika();
				metrika.sendData($data);
			}
		script;

		return $addTag
			? "<script>$script</script>"
			: $script;
	}

	/**
	 * Add analytic get params to URL
	 * @param string $url
	 * @return string
	 */
	public function parametrizeUri(string $url): string
	{
		$uri = new Uri($url);
		$add = [];
		foreach ($this->data as $param => $value)
		{
			if ($value !== null)
			{
				$add["st[{$param}]"] = $value;
			}
		}
		$uri->addParams($add);

		return $uri->getUri();
	}
}
