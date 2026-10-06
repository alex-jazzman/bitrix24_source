<?php

declare(strict_types=1);

use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Public\Activity\ReturnDocumentTrait;
use Bitrix\Crm\Integration\BizProc\Activity\Mixins\EventInitiatorTrait;
use Bitrix\Crm\Integration\BizProc\Trigger\CrmEntityTriggerTrait;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Type\DateTime;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!CBPRuntime::getRuntime()->includeActivityFile('CreateDocumentTrigger'))
{
	return;
}

if (!\Bitrix\Main\Loader::includeModule('crm'))
{
	return;
}

class CBPCrmEntityCreateTrigger extends CBPCreateDocumentTrigger
{
	use CrmEntityTriggerTrait;
	use EventInitiatorTrait;
	use ReturnDocumentTrait;

	private const EVENT_INITIATOR_ID = 'Initiator';
	private const EVENT_DATE_TIME_ID = 'EventDateTime';
	private const RETURN_ENTITY_TYPE_ID = 'EntityTypeId';
	private const RETURN_ENTITY_ID = 'EntityId';

	public function __construct($name)
	{
		parent::__construct($name);

		$this->arProperties['Document'] = '';
		$this->arProperties['ReturnDocument'] = null;
		$this->arProperties['IsAutomatedSolution'] = 'N';
		$this->arProperties[self::CATEGORY_ID_PROPERTY] = null;
		$this->arProperties[self::EVENT_INITIATOR_ID] = null;
		$this->arProperties[self::EVENT_DATE_TIME_ID] = null;

		$this->setPropertiesTypes([
			self::EVENT_INITIATOR_ID => ['Type' => FieldType::USER],
			self::EVENT_DATE_TIME_ID => ['Type' => FieldType::DATETIME],
		]);
	}

	public function execute(): int
	{
		parent::execute();

		$document = $this->getEventData()['Document'] ?? null;
		$initiatorUserId = $this->resolveEventInitiatorUserId();

		$this->setProperties([
			static::getReturnDocumentFieldName() => $document,
			self::EVENT_INITIATOR_ID => $initiatorUserId ? 'user_' . $initiatorUserId : null,
			self::EVENT_DATE_TIME_ID => (new DateTime())->format(DateTime::getFormat()),
			...static::buildReturnValues(is_array($document) ? $document : null),
		]);
		$this->setPropertiesTypes(
			static::buildReturnProperties(is_array($document) ? $document : null)
		);

		return CBPActivityExecutionStatus::Closed;
	}

	protected static function preparePropertiesDialogValues(
		array $documentType,
		array $properties,
		array $currentValues,
	): array
	{
		$document = static::resolveDocumentTypeFromDocument((string)($properties['Document'] ?? ''));

		$properties['Return'] = static::buildReturnProperties(
			$document,
		);

		return $properties;
	}

	private static function buildReturnProperties(?array $document): array
	{
		return [
			...static::buildReturnDocumentProperties($document),
			self::RETURN_ENTITY_TYPE_ID => [
				'Name' => Loc::getMessage('BP_CRM_ENTITY_CREATE_TRIGGER_ENTITY_TYPE_ID'),
				'Type' => FieldType::INT,
				'Default' => static::resolveEntityTypeIdByDocumentType($document),
			],
			self::RETURN_ENTITY_ID => [
				'Name' => Loc::getMessage('BP_CRM_ENTITY_CREATE_TRIGGER_ENTITY_ID'),
				'Type' => FieldType::INT,
				'Default' => null,
			],
		];
	}

	private static function buildReturnValues(?array $document): array
	{
		if (!$document)
		{
			return [
				self::RETURN_ENTITY_TYPE_ID => null,
				self::RETURN_ENTITY_ID => null,
			];
		}

		[$entityTypeId, $entityId] = CCrmBizProcHelper::resolveEntityId($document);

		return [
			self::RETURN_ENTITY_TYPE_ID => (int)$entityTypeId > 0 ? (int)$entityTypeId : null,
			self::RETURN_ENTITY_ID => (int)$entityId > 0 ? (int)$entityId : null,
		];
	}

	private static function resolveEntityTypeIdByDocumentType(?array $document): ?int
	{
		$entityTypeId = (int)CCrmOwnerType::ResolveID((string)($document[2] ?? ''));

		return $entityTypeId > 0 ? $entityTypeId : null;
	}
}
