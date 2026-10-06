<?php

declare(strict_types=1);

use Bitrix\Bizproc\Activity\Mixins\ManualStartDocumentTrait;
use Bitrix\Bizproc\FieldType;
use Bitrix\Bizproc\Public\Entity\Trigger\Section;
use Bitrix\Crm\Category\DealCategory;
use Bitrix\Crm\Integration\BizProc\Activity\Mixins\EventInitiatorTrait;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\Type\DateTime;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (!CBPRuntime::getRuntime()->includeActivityFile('ManualStartTrigger'))
{
	return;
}

if (!\Bitrix\Main\Loader::includeModule('crm'))
{
	return;
}

class CBPCrmDealManualStartTrigger extends \CBPManualStartTrigger
{
	use EventInitiatorTrait;
	use ManualStartDocumentTrait;

	private const EVENT_INITIATOR_ID = 'Initiator';
	private const EVENT_DATE_TIME_ID = 'EventDateTime';

	private const PARAM_CATEGORY_ID = 'categoryId';

	public function __construct($name)
	{
		parent::__construct($name);
		$this->initManualStartDocumentProperties();

		$this->arProperties[self::PARAM_CATEGORY_ID] = null;
		$this->arProperties[self::EVENT_INITIATOR_ID] = null;
		$this->arProperties[self::EVENT_DATE_TIME_ID] = null;

		$this->setPropertiesTypes([
			self::EVENT_INITIATOR_ID => ['Type' => FieldType::USER],
			self::EVENT_DATE_TIME_ID => ['Type' => FieldType::DATETIME],
		]);
	}

	public function execute(): int
	{
		$initiatorUserId = $this->resolveEventInitiatorUserId();
		$this->setProperties([
			static::getReturnDocumentFieldName() => $this->getDocumentId(),
			self::EVENT_INITIATOR_ID => $initiatorUserId ? 'user_' . $initiatorUserId : null,
			self::EVENT_DATE_TIME_ID => (new DateTime())->format(DateTime::getFormat()),
		]);
		$this->setPropertiesTypes([
			static::getReturnDocumentFieldName() => $this->getReturnDocumentMapTypeForInstance(),
		]);

		return CBPActivityExecutionStatus::Closed;
	}

	protected static function resolveDocumentType(): ?array
	{
		if (!\Bitrix\Main\Loader::includeModule('crm'))
		{
			return null;
		}

		return CCrmBizProcHelper::ResolveDocumentType(CCrmOwnerType::Deal);
	}

	public static function getPropertiesMap(array $documentType, array $context = []): array
	{
		if (!\Bitrix\Main\Loader::includeModule(static::getModuleId()))
		{
			return [];
		}

		return [
			self::PARAM_CATEGORY_ID => [
				'Name' => Loc::getMessage('BP_CRM_DEAL_MANUAL_START_TRIGGER_FIELD_CATEGORY_ID'),
				'FieldName' => self::PARAM_CATEGORY_ID,
				'Type' => FieldType::SELECT,
				'Options' => DealCategory::getSelectListItems(),
				'Required' => true,
			],
		];
	}

	public static function validateProperties($arTestProperties = [], CBPWorkflowTemplateUser $user = null): array
	{
		$arErrors = [];
		if (!isset($arTestProperties[self::PARAM_CATEGORY_ID]))
		{
			$arErrors[] = [
				'code' => 'NotExist',
				'parameter' => self::PARAM_CATEGORY_ID,
				'message' => Loc::getMessage('BP_CRM_DEAL_MANUAL_START_TRIGGER_FIELD_CATEGORY_EMPTY'),
			];
		}

		return array_merge($arErrors, parent::ValidateProperties($arTestProperties, $user));
	}

	public function getSection(): ?Section
	{
		return new Section(
			static::getModuleId() . '|' . \CCrmOwnerType::DealName,
			$this->{self::PARAM_CATEGORY_ID} ?? 0,
		);
	}

	protected static function getModuleId(): string
	{
		return 'crm';
	}
}
