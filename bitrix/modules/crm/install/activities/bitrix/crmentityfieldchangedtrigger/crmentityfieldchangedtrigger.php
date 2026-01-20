<?php

declare(strict_types=1);

use Bitrix\Bizproc\Automation\Helper;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!CBPRuntime::getRuntime()->includeActivityFile('FieldChangedTrigger'))
{
	return;
}

class CBPCrmEntityFieldChangedTrigger extends CBPFieldChangedTrigger
{
	public function __construct($name)
	{
		parent::__construct($name);

		// return
		$this->arProperties['ReturnDocument'] = null;
		$this->arProperties['ChangedFields'] = null;
	}

	public function execute(): int
	{
		parent::execute();

		$context = $this->getEventData();

		$availableTrackedFields = static::getTrackedFields($this->getRawProperty('Document') ?? '');
		$document = $context['Document'] ?? null;

		$this->setProperties([
			'ReturnDocument' => $document,
			'ChangedFields' => array_values(
				array_intersect($context['Fields'] ?? [], array_keys($availableTrackedFields))
			),
		]);

		$this->setPropertiesTypes([
			'ReturnDocument' => static::getReturnDocumentMapType($document),
			'ChangedFields' => static::getChangedFieldsDocumentMapType($availableTrackedFields),
		]);

		return CBPActivityExecutionStatus::Closed;
	}

	public static function getPropertiesDialogValues(
		$documentType,
		$activityName,
		&$workflowTemplate,
		&$workflowParameters,
		&$workflowVariables,
		$currentValues,
		&$errors,
	): bool
	{
		$result = parent::getPropertiesDialogValues(
			$documentType,
			$activityName,
			$workflowTemplate,
			$workflowParameters,
			$workflowVariables,
			$currentValues,
			$errors
		);

		if (!$result)
		{
			return false;
		}

		$currentActivity = &CBPWorkflowTemplateLoader::FindActivityByName($workflowTemplate, $activityName);
		$properties = $currentActivity['Properties'];

		$properties['Return'] = [
			'ReturnDocument' => static::getReturnDocumentMapType(
				static::resolveDocumentTypeFromDocument($properties['Document'] ?? '')
			),
			'ChangedFields' => static::getChangedFieldsDocumentMapType(
				array_intersect_key(
					static::getTrackedFields($properties['Document'] ?? ''),
					array_flip($properties['Fields'] ?? [])
				)
			),
		];

		$currentActivity['Properties'] = $properties;

		return true;
	}

	private static function getReturnDocumentMapType(?array $document = null): array
	{
		return [
			'Name' =>
				$document
					? static::getDocumentName($document)
					: (\Bitrix\Main\Localization\Loc::getMessage('BP_CRM_FCT_DOCUMENT') ?? '')
			,
			'Type' => \Bitrix\Bizproc\FieldType::DOCUMENT,
			'Default' => $document,
		];
	}

	private static function getChangedFieldsDocumentMapType(array $fields): array
	{
		return [
			'Name' => \Bitrix\Main\Localization\Loc::getMessage('BP_CRM_FCT_CHANGED_FIELDS') ?? '',
			'Type' => \Bitrix\Bizproc\FieldType::SELECT,
			'Options' => $fields,
			'Multiple' => true,
		];
	}

	private static function getPresetEntities(): array
	{
		if (!\Bitrix\Main\Loader::includeModule('crm'))
		{
			return [];
		}

		return [CCrmOwnerType::DealName, CCrmOwnerType::OrderName];
	}

	public static function getPropertiesMap(array $documentType, array $context = []): array
	{
		$document = $context['Properties']['Document'] ?? $context['Document'] ?? '';

		$map = parent::getPropertiesMap($documentType, $context);
		$presetEntities = static::getPresetEntities();

		if (in_array($document, $presetEntities, true))
		{
			// only one hidden option from preset
			$map['Document']['Hidden'] = true;
			$map['Document']['Settings'] = array_merge($map['Document']['Settings'] ?? [], ['ShowEmptyValue' => false]);
			$map['Document']['Options'] = [$document => $map['Document']['Options'][$document]];
		}
		else
		{
			// remove preset entities
			$map['Document']['Options'] = array_filter(
				$map['Document']['Options'],
				static fn($key) => !in_array($key, $presetEntities, true),
				ARRAY_FILTER_USE_KEY
			);
		}

		return $map;
	}

	protected static function getAvailableDocuments(): array
	{
		if (!\Bitrix\Main\Loader::includeModule('crm'))
		{
			return [];
		}

		$documents = [];

		// Factory is not returned for orders
		$typesMap = \Bitrix\Crm\Service\Container::getInstance()->getTypesMap();
		foreach ($typesMap->getFactories() as $factory)
		{
			$entityTypeId = $factory->getEntityTypeId();
			$documentType = CCrmBizProcHelper::resolveDocumentType($entityTypeId);
			if (!$documentType)
			{
				continue;
			}

			$name = CCrmOwnerType::resolveName($entityTypeId);
			$documents[$name] = ['id' => $name, 'name' => static::getDocumentName($documentType)];
		}

		$orderTypeId = CCrmOwnerType::Order;
		$factory = \Bitrix\Crm\Service\Container::getInstance()->getFactory($orderTypeId);
		if ($factory)
		{
			$orderDocumentType = CCrmBizProcHelper::resolveDocumentType($orderTypeId);
			if ($orderDocumentType)
			{
				$name = CCrmOwnerType::resolveName($orderTypeId);
				$documents[$name] = [
					'id' => $name, 'name' => static::getDocumentName($orderDocumentType),
				];
			}
		}

		return $documents;
	}

	protected static function getDocumentName(array $documentType)
	{
		return CBPRuntime::getRuntime()->getDocumentService()->getDocumentTypeName($documentType);
	}

	protected static function getTrackedFields(string $document): array
	{
		$documentType = static::resolveDocumentTypeFromDocument($document);
		if ($documentType)
		{
			$fields = Helper::getDocumentFields(static::resolveDocumentTypeFromDocument($document));
			if (is_array($fields))
			{
				$filter = static function ($field) use ($document)
				{
					$id = $field['Id'];
					$type = $field['Type'];

					if (
						($document === \CCrmOwnerType::OrderName && str_starts_with($id, 'UF_'))
						|| str_contains($id, '.')
						|| str_starts_with($id, 'EVENT_')
						|| str_starts_with($id, 'PHONE_')
						|| str_starts_with($id, 'WEB_')
						|| str_starts_with($id, 'EMAIL_')
						|| str_starts_with($id, 'IM_')
						|| str_starts_with($id, 'UTM_')
						|| str_contains($id, 'OPPORTUNITY')
						|| str_contains($id, 'CURRENCY_ID')
						|| str_contains($id, 'ASSIGNED_BY')
						|| str_contains($id, 'RESPONSIBLE')
						|| str_contains($id, '_PRINTABLE')
						|| in_array($id, static::getIgnoredFieldIds(), true)
						|| in_array($type, static::getIgnoredFieldTypes(), true)
					)
					{
						return false;
					}

					return true;
				};

				$result = [];
				foreach (array_filter($fields, $filter) as $field)
				{
					$result[$field['Id']] = $field['Name'];
				}

				return $result;
			}
		}

		return [];
	}

	protected static function resolveDocumentTypeFromDocument(string $document): ?array
	{
		if (!\Bitrix\Main\Loader::includeModule('crm'))
		{
			return null;
		}

		return CCrmBizProcHelper::ResolveDocumentType(CCrmOwnerType::resolveID($document));
	}

	private static function getIgnoredFieldIds(): array
	{
		return [
			'ID',
			'LEAD_ID',
			'DEAL_ID',
			'CONTACT_ID',
			'CONTACT_IDS',
			'COMPANY_ID',
			'CREATED_BY_ID',
			'MODIFY_BY_ID',
			'DATE_CREATE',
			'DATE_MODIFY',
			'WEBFORM_ID',
			'STATUS_ID',
			'CATEGORY_ID',
			'ORIGINATOR_ID',
			'ORIGIN_ID',

			// not compatible
			'CRM_ID',
			'URL',
			'URL_BB',
			'TIME_CREATE',
			'PRODUCT_IDS',
			'TRACKING_SOURCE_ID',
		];
	}

	private static function getIgnoredFieldTypes(): array
	{
		return ['phone', 'web', 'email', 'im'];
	}
}
