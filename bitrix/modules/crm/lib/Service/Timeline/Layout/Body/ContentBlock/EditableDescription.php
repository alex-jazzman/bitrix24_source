<?php

namespace Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock;

use Bitrix\Crm\Service\Timeline\Layout\Body\ContentBlock;
use Bitrix\Crm\Service\Timeline\Layout\Mixin\Actionable;

class EditableDescription extends ContentBlock
{
	use Actionable;

	public const HEIGHT_SHORT = 'short';
	public const HEIGHT_LONG = 'long';

	public const BG_COLOR_YELLOW = 'yellow';
	public const BG_COLOR_WHITE = 'white';

	public const AI_NONE = '';
	public const AI_SUCCESS = 'success';
	public const AI_IN_PROGRESS = 'in_progress';

	protected ?string $headerText = null;
	protected ?string $text = null;
	protected ?string $backgroundColor = null;
	protected ?bool $editable = true;
	protected ?bool $copied = false;
	protected string $height = self::HEIGHT_LONG;
	protected string $copilotStatus = self::AI_NONE;
	protected array $copilotSettings = [];
	protected ?bool $useBBCodeEditor = null;

	public function getRendererName(): string
	{
		return 'EditableDescription';
	}

	public function getHeaderText(): ?string
	{
		return $this->headerText;
	}

	public function setHeaderText(?string $headerText): self
	{
		$this->headerText = $headerText;

		return $this;
	}

	public function getText(): ?string
	{
		return $this->text;
	}

	public function setText(?string $text): self
	{
		$this->text = $text;

		return $this;
	}

	public function getEditable(): bool
	{
		return $this->editable;
	}

	public function setEditable(bool $editable): self
	{
		$this->editable = $editable;

		return $this;
	}

	public function getCopied(): bool
	{
		return $this->copied;
	}

	public function setCopied(bool $copied): self
	{
		$this->copied = $copied;

		return $this;
	}
	
	public function getCopilotStatus(): string
	{
		return $this->copilotStatus;
	}
	
	public function setCopilotStatus(string $copilotStatus): self
	{
		$this->copilotStatus = $copilotStatus;
		
		return $this;
	}

	public function getHeight(): string
	{
		return $this->height;
	}

	public function getUseBBCodeEditor(): ?bool
	{
		return $this->useBBCodeEditor;
	}

	public function setHeight(string $height): self
	{
		$this->height = $height;

		return $this;
	}

	public function getBackgroundColor(): ?string
	{
		return $this->backgroundColor;
	}

	public function setBackgroundColor(string $backgroundColor): self
	{
		$this->backgroundColor = $backgroundColor;

		return $this;
	}

	public function getCopilotSettings(): array
	{
		return $this->copilotSettings;
	}

	public function setCopilotSettings(array $copilotSettings): self
	{
		$this->copilotSettings = $copilotSettings;

		return $this;
	}

	public function setUseBBCodeEditor(bool $useBBCodeEditor): self
	{
		$this->useBBCodeEditor = $useBBCodeEditor;

		return $this;
	}

	protected function getProperties(): array
	{
		return [
			'headerText' => $this->getHeaderText(),
			'text' => html_entity_decode($this->getText()),
			'saveAction' => $this->getAction(),
			'editable' => $this->getEditable(),
			'copied' => $this->getCopied(),
			'height' => $this->getHeight(),
			'backgroundColor' => $this->getBackgroundColor(),
			'copilotStatus' => $this->getCopilotStatus(),
			'copilotSettings' => $this->getCopilotSettings(),
			'useBBCodeEditor' => $this->getUseBBCodeEditor(),
		];
	}
}
