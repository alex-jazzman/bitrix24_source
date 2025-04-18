<?php

namespace Bitrix\Crm\Badge;

class ValueItem
{
	private string $value;
	private string $textValue;
	private string $textColor;
	private string $backgroundColor;
	private ?string $hint = null;

	public function __construct(
		string $value,
		string $textValue,
		string $textColor,
		string $backgroundColor,
		?string $hint = null,
	)
	{
		$this->value = $value;
		$this->textValue = $textValue;
		$this->textColor = $textColor;
		$this->backgroundColor = $backgroundColor;
		$this->hint = $hint;
	}

	public function toArray(): array
	{
		return [
			'value' => $this->getValue(),
			'textValue' => $this->getTextValue(),
			'textColor' => $this->getTextColor(),
			'backgroundColor' => $this->getBackgroundColor(),
			'hint' => $this->getHint(),
		];
	}

	public function getValue(): string
	{
		return $this->value;
	}

	public function getTextValue(): string
	{
		return mb_strtoupper($this->textValue);
	}

	public function getTextColor(): string
	{
		return $this->textColor;
	}

	public function getBackgroundColor(): string
	{
		return $this->backgroundColor;
	}

	public function getHint(): ?string
	{
		return $this->hint;
	}
}
