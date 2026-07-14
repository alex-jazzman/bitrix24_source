<?php

declare(strict_types=1);

namespace Bitrix\Note\Internal\Model;

use Bitrix\Main\Web\Json;

class Document extends EO_Document
{
	public function getMarkdown(): array|string
	{
		$value = $this->sysGetValue('MARKDOWN');
		if (is_array($value))
		{
			return $value;
		}
		if ($value === null || $value === '')
		{
			return [];
		}

		if ($this->getContentFormat() === 'md')
		{
			return (string)$value;
		}

		try
		{
			$decoded = Json::decode($value);
		}
		catch (\Bitrix\Main\ArgumentException)
		{
			return [];
		}

		return is_array($decoded) ? $decoded : [];
	}

	public function setMarkdown($value): self
	{
		if (is_array($value))
		{
			$value = Json::encode($value);
		}

		$this->sysSetValue('MARKDOWN', $value);

		return $this;
	}
}
