<?php

namespace Bitrix\Crm\Integration\UI\EntityEditor;

use Bitrix\Crm\Entity\EntityEditorConfig;
use Bitrix\Crm\Integration\UI\EntityEditor\Configuration\Section;
use Bitrix\Main\ArgumentException;
use Bitrix\Main\InvalidOperationException;
use ReturnTypeWillChange;

final class Configuration
{
	/**
	 * @var array<string, Section>
	 */
	private array $sections = [];
	private ?EntityEditorConfig $entityEditorConfig = null;

	public function __construct(array $sections)
	{
		foreach ($sections as $section)
		{
			$this->addSection($section);
		}
	}

	public function setEntityEditorConfig(EntityEditorConfig $config): self
	{
		$this->entityEditorConfig = $config;

		return $this;
	}

	public static function fromArray(array $configuration): self
	{
		$sections = array_map([Section::class, 'fromArray'], $configuration);
		$sections = array_filter($sections, static fn (?Section $section) => $section !== null);

		return new self($sections);
	}

	public function addSection(Section $section): self
	{
		$this->sections[$section->getName()] = $section;

		return $this;
	}

	public function removeSection(string $name): self
	{
		unset($this->sections[$name]);

		return $this;
	}

	public function getSection(string $name): ?Section
	{
		return $this->sections[$name] ?? null;
	}

	public function clearSections(): self
	{
		$this->sections = [];

		return $this;
	}

	public function getSections(): array
	{
		return $this->sections;
	}

	public function removeElements(array $elements): self
	{
		foreach ($this->sections as $section)
		{
			foreach ($elements as $element)
			{
				$section->removeElement($element);
			}
		}

		return $this;
	}

	public function toArray(): array
	{
		$result = array_map(static fn (Section $section) => $section->toArray(), $this->sections);

		return array_values($result);
	}

	/**
	 * @throws InvalidOperationException
	 * @throws ArgumentException
	 */
	public function save(): bool
	{
		if ($this->entityEditorConfig === null)
		{
			throw new InvalidOperationException('Must set entityEditorConfig before saving the configuration');
		}

		return $this->entityEditorConfig->set($this->toArray());
	}

	public function hasSections(): bool
	{
		return count($this->sections) > 0;
	}
}
