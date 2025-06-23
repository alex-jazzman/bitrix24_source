<?php

namespace Bitrix\Crm\Integration\AI\Operation\Payload\Payload;

use Bitrix\Crm\Entity\FieldDataProvider;
use Bitrix\Crm\Integration\AI\Operation\Payload\CalcMarkersInterface;
use Bitrix\Crm\Integration\AI\Operation\Payload\PayloadInterface;
use Bitrix\Crm\Service\Context;
use Bitrix\Main\UserField\Types\EnumType;

final class ExtractFormFields extends AbstractPayload implements CalcMarkersInterface
{
	public function getPayloadCode(): string
	{
		return 'extract_form_fields';
	}
	
	public function setMarkers(array $markers): PayloadInterface
	{
		$this->markers = array_merge($markers, $this->calcMarkers());
		
		return $this;
	}

	public function calcMarkers(): array
	{
		// sent to AI all available fields, regardless of user
		$fieldData = (new FieldDataProvider(
			$this->identifier->getEntityTypeId(),
			Context::SCOPE_AI)
		)->getFieldData();
		
		return [
			'current_day' => $this->getCurrentDay(),
			'current_month' => $this->getCurrentMonth(),
			'current_year' => $this->getCurrentYear(),
			'fields' => $this->getFields($fieldData),
			'enum_fields_values' =>  $this->getEnumFieldsValues($fieldData),
		];
	}

	private function getFields(array $fieldData): array
	{
		$fields = [
			// unallocated data
			'comment' => 'list[string]',
		];

		foreach ($fieldData as $fieldDescription)
		{
			$type = $fieldDescription['MULTIPLE']
				? 'list[' . $fieldDescription['TYPE'] . ']'
				: $fieldDescription['TYPE']
			;
			
			$fields[$fieldDescription['NAME']] = "$type or null";
		}

		return $fields;
	}

	private function getEnumFieldsValues(array $fieldData): ?array
	{
		$enumFields = array_filter(
			$fieldData,
			static fn(array $data) => $data['TYPE'] === EnumType::USER_TYPE_ID
		);

		if (!$enumFields)
		{
			return null;
		}

		$result = [];
		foreach ($enumFields as $row)
		{
			$result[$row['NAME']] = array_values($row['VALUES']);
		}

		return $result;
	}
}
