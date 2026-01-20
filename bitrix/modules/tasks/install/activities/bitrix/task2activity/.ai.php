<?php

use Bitrix\Bizproc\Integration\AiAssistant\ActivityAiPropertyConverter;
use Bitrix\Bizproc\Integration\AiAssistant\Interface\IBPActivityAiDescription;
use Bitrix\Bizproc\Internal\Entity\Activity\SettingCollection;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

class CBPAiTask2Activity extends CBPTask2Activity implements IBPActivityAiDescription
{
	public function __construct($name = 'task2activity')
	{
		parent::__construct($name);
	}

	public function getAiDescribedSettings(array $documentType): SettingCollection
	{
		return (new ActivityAiPropertyConverter())
			->convertMap($this->convertFields(self::getPropertiesDialogMap()), $documentType)
		;
	}

	private function convertFields(array $fields): array
	{
		return array_map(function(array $field): array
		{
			$type = (string)($field['Type'] ?? '');
			if (isset($field['UserField']) && $this->isTypeShouldPrefixUF($type))
			{
				$field['Type'] = ActivityAiPropertyConverter::UF_TYPE_PREFIX . $type;
			}

			if (isset($field['Map']) && is_array($field['Map']))
			{
				$field['Map'] = $this->convertFields($field['Map']);
			}

			return $field;
		}, $fields);
	}

	private function isTypeShouldPrefixUF(string $type): bool
	{
		return !ActivityAiPropertyConverter::isUfPrefixed($type) && !$this->isBaseType($type);
	}

	private function isBaseType(string $type): bool
	{
		return in_array($type, [
			'string',
			'int',
			'float',
			'boolean',
			'date',
			'time',
			'datetime',
			'enum',
		], true);
	}
}