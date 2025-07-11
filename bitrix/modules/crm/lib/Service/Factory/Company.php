<?php

namespace Bitrix\Crm\Service\Factory;

use Bitrix\Crm\Binding\ContactCompanyTable;
use Bitrix\Crm\Category\Entity\Category;
use Bitrix\Crm\Category\Entity\ClientDefaultCategory;
use Bitrix\Crm\Category\Entity\ItemCategory;
use Bitrix\Crm\CompanyTable;
use Bitrix\Crm\ContactTable;
use Bitrix\Crm\Field;
use Bitrix\Crm\Item;
use Bitrix\Crm\Model\ItemCategoryTable;
use Bitrix\Crm\Service;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Context;
use Bitrix\Crm\Service\Operation;
use Bitrix\Crm\Settings\CompanySettings;
use Bitrix\Crm\Statistics;
use Bitrix\Crm\StatusTable;
use Bitrix\Main\IO\Path;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\Objectify\EntityObject;

final class Company extends Service\Factory
{
	protected $itemClassName = Item\Company::class;

	public function __construct()
	{
		Loc::loadMessages(Path::combine(__DIR__, '..', '..', '..', 'classes', 'general', 'crm_company.php'));
	}

	public function isNewRoutingForDetailEnabled(): bool
	{
		return false;
	}

	public function isRecyclebinEnabled(): bool
	{
		return CompanySettings::getCurrent()->isRecycleBinEnabled();
	}

	public function isDeferredCleaningEnabled(): bool
	{
		return CompanySettings::getCurrent()->isDeferredCleaningEnabled();
	}

	public function isNewRoutingForAutomationEnabled(): bool
	{
		return false;
	}

	public function isUseInUserfieldEnabled(): bool
	{
		return true;
	}

	public function isCrmTrackingEnabled(): bool
	{
		return true;
	}

	public function isStagesSupported(): bool
	{
		return false;
	}

	public function isNewRoutingForListEnabled(): bool
	{
		return false;
	}

	public function isBizProcEnabled(): bool
	{
		return true;
	}

	public function isObserversEnabled(): bool
	{
		return true;
	}

	public function isMultiFieldsEnabled(): bool
	{
		return true;
	}

	public function getDataClass(): string
	{
		return CompanyTable::class;
	}

	protected function configureItem(Item $item, EntityObject $entityObject): void
	{
		parent::configureItem($item, $entityObject);

		$fieldNameMap =
			(new Item\FieldImplementation\Binding\FieldNameMap())
				// it's not a mistake, company has no CONTACT_ID field
				// ->setSingleId(Item::FIELD_NAME_CONTACT_ID)
				->setMultipleIds(Item::FIELD_NAME_CONTACT_IDS)
				->setBindings(Item::FIELD_NAME_CONTACT_BINDINGS)
				->setBoundEntities(Item::FIELD_NAME_CONTACTS)
		;

		$implementation = new Item\FieldImplementation\Binding(
			$entityObject,
			\CCrmOwnerType::Contact,
			$fieldNameMap,
			ContactCompanyTable::getEntity(),
			Container::getInstance()->getContactBroker(),
		);

		$implementation->configureUpdatingRefIdInBoundEntity(ContactTable::getEntity(), 'COMPANY_ID');

		$item->addImplementation($implementation);
	}

	/**
	 * @inheritDoc
	 */
	public function getFieldsMap(): array
	{
		return [
			Item::FIELD_NAME_CREATED_TIME => 'DATE_CREATE',
			Item::FIELD_NAME_UPDATED_TIME => 'DATE_MODIFY',
			Item::FIELD_NAME_CREATED_BY => 'CREATED_BY_ID',
			Item::FIELD_NAME_UPDATED_BY => 'MODIFY_BY_ID',
			Item::FIELD_NAME_TYPE_ID => 'COMPANY_TYPE',
			Item::FIELD_NAME_CONTACT_IDS => 'CONTACT_ID',
			Item::FIELD_NAME_OBSERVERS => 'OBSERVER_IDS',
		];
	}

	public function getEntityTypeId(): int
	{
		return \CCrmOwnerType::Company;
	}

	protected function getFieldsSettings(): array
	{
		return [
			Item::FIELD_NAME_ID => [
				'TYPE' => Field::TYPE_INTEGER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
			],
			Item::FIELD_NAME_TITLE => [
				'TYPE' => Field::TYPE_STRING,
				'ATTRIBUTES' => [
					\CCrmFieldInfoAttr::HasDefaultValue,
					\CCrmFieldInfoAttr::CanNotBeEmptied,
					],
				'CLASS' => Field\Title::class,
			],
			Item::FIELD_NAME_TYPE_ID => [
				'TYPE' => Field::TYPE_CRM_STATUS,
				'CRM_STATUS_TYPE' => StatusTable::ENTITY_ID_COMPANY_TYPE,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::HasDefaultValue],
			],
			Item::FIELD_NAME_CATEGORY_ID => [
				'TYPE' => Field::TYPE_CRM_CATEGORY,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed, \CCrmFieldInfoAttr::HasDefaultValue],
				'CLASS' => Field\Category::class,
			],
			Item\Company::FIELD_NAME_LOGO => [
				'TYPE' => Field::TYPE_FILE,
				'VALUE_TYPE' => Field::VALUE_TYPE_IMAGE,
			],
			//only for backwards compatibility. not used anymore.
			Item\Company::FIELD_NAME_BANKING_DETAILS => [
				'TYPE' => Field::TYPE_STRING,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::Deprecated],
			],
			Item\Company::FIELD_NAME_INDUSTRY => [
				'TYPE' => Field::TYPE_CRM_STATUS,
				'CRM_STATUS_TYPE' => StatusTable::ENTITY_ID_INDUSTRY,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::HasDefaultValue],
			],
			Item\Company::FIELD_NAME_EMPLOYEES => [
				'TYPE' => Field::TYPE_CRM_STATUS,
				'CRM_STATUS_TYPE' => StatusTable::ENTITY_ID_EMPLOYEES,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::HasDefaultValue],
			],
			Item::FIELD_NAME_CURRENCY_ID => [
				'TYPE' => Field::TYPE_CRM_CURRENCY,
				'ATTRIBUTES' => [
					\CCrmFieldInfoAttr::NotDisplayed,
					\CCrmFieldInfoAttr::HasDefaultValue,
					\CCrmFieldInfoAttr::CanNotBeEmptied,
				],
				'CLASS' => Field\CurrencyId::class,
			],
			Item\Company::FIELD_NAME_REVENUE => [
				'TYPE' => Field::TYPE_DOUBLE,
			],
			Item::FIELD_NAME_OPENED => [
				'TYPE' => Field::TYPE_BOOLEAN,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::Required],
				'CLASS' => Field\Opened::class,
			],
			Item::FIELD_NAME_COMMENTS => [
				'TYPE' => Field::TYPE_TEXT,
				'VALUE_TYPE' => Field::VALUE_TYPE_BB,
				'ATTRIBUTES' => [],
				'CLASS' => Field\Comments::class,
			],
			Item::FIELD_NAME_HAS_PHONE => [
				'TYPE' => Field::TYPE_BOOLEAN,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
				'CLASS' => Field\HasPhone::class,
			],
			Item::FIELD_NAME_HAS_EMAIL => [
				'TYPE' => Field::TYPE_BOOLEAN,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
				'CLASS' => Field\HasEmail::class,
			],
			Item::FIELD_NAME_HAS_IMOL => [
				'TYPE' => Field::TYPE_BOOLEAN,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
				'CLASS' => Field\HasImol::class,
			],
			Item\Company::FIELD_NAME_IS_MY_COMPANY => [
				'TYPE' => Field::TYPE_BOOLEAN,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::Immutable, \CCrmFieldInfoAttr::HasDefaultValue],
				'CLASS' => Field\IsMyCompany::class,
			],
			Item::FIELD_NAME_ASSIGNED => [
				'TYPE' => Field::TYPE_USER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::CanNotBeEmptied, \CCrmFieldInfoAttr::HasDefaultValue],
				'CLASS' => Field\Assigned::class,
			],
			Item::FIELD_NAME_CREATED_BY => [
				'TYPE' => Field::TYPE_USER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
				'CLASS' => Field\CreatedBy::class,
			],
			Item::FIELD_NAME_UPDATED_BY => [
				'TYPE' => Field::TYPE_USER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
				'CLASS' => Field\UpdatedBy::class,
			],
			Item::FIELD_NAME_LAST_ACTIVITY_BY => [
				'TYPE' => Field::TYPE_USER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
			],
			Item::FIELD_NAME_CREATED_TIME => [
				'TYPE' => Field::TYPE_DATETIME,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
				'CLASS' => Field\CreatedTime::class,
			],
			Item::FIELD_NAME_UPDATED_TIME => [
				'TYPE' => Field::TYPE_DATETIME,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
				'CLASS' => Field\UpdatedTime::class,
			],
			Item::FIELD_NAME_LAST_ACTIVITY_TIME => [
				'TYPE' => Field::TYPE_DATETIME,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
				'CLASS' => Field\LastActivityTime::class,
			],
			Item::FIELD_NAME_CONTACT_IDS => [
				'TYPE' => Field::TYPE_CRM_CONTACT,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed, \CCrmFieldInfoAttr::Multiple],
				'CLASS' => Field\ContactIds::class,
			],
			Item::FIELD_NAME_CONTACTS => [
				'TYPE' => Field::TYPE_CRM_CONTACT,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed, \CCrmFieldInfoAttr::Multiple]
			],
			Item::FIELD_NAME_LEAD_ID => [
				'TYPE' => Field::TYPE_CRM_LEAD,
				'SETTINGS' => [
					'parentEntityTypeId' => \CCrmOwnerType::Lead,
				],
				'CLASS' => Field\LeadId::class,
			],
			Item::FIELD_NAME_ORIGINATOR_ID => [
				'TYPE' => Field::TYPE_STRING,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed],
			],
			Item::FIELD_NAME_ORIGIN_ID => [
				'TYPE' => Field::TYPE_STRING,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed],
			],
			Item::FIELD_NAME_ORIGIN_VERSION => [
				'TYPE' => Field::TYPE_STRING,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed],
			],
			Item::FIELD_NAME_FM => [
				'TYPE' => Field::TYPE_CRM_MULTIFIELD,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::Multiple],
				'CLASS' => Field\Multifield::class,
			],
			Item::FIELD_NAME_OBSERVERS => [
				'TYPE' => Field::TYPE_USER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::Multiple],
				'CLASS' => Field\Observers::class,
			],
			Item::FIELD_LAST_COMMUNICATION_TIME => [
				'TYPE' => Field::TYPE_STRING,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly],
			],
		];
	}

	//region categories

	/**
	 * Returns true if this entity supports categories.
	 *
	 * @return bool
	 */
	public function isCategoriesSupported(): bool
	{
		return true;
	}

	public function createCategory(array $data = []): Category
	{
		$object = ItemCategoryTable::createObject($data);
		$object->setEntityTypeId($this->getEntityTypeId());

		return new ItemCategory($object);
	}

	protected function loadCategories(): array
	{
		$categories = ItemCategoryTable::getItemCategoriesByEntityTypeId($this->getEntityTypeId());

		Service\Container::getInstance()->getLocalization()->loadMessages();
		$defaultCategory = new ClientDefaultCategory(
			$this->getEntityTypeId(),
			Loc::getMessage("CRM_TYPE_CATEGORY_DEFAULT_NAME"),
			0
		);

		array_unshift($categories, $defaultCategory);

		return $categories;
	}

	//endregion

	protected function getTrackedFieldNames(): array
	{
		return [
			Item::FIELD_NAME_TITLE,
			Item::FIELD_NAME_FM,
			Item\Company::FIELD_NAME_BANKING_DETAILS,
			Item::FIELD_NAME_TYPE_ID,
			Item\Company::FIELD_NAME_INDUSTRY,
			Item\Company::FIELD_NAME_REVENUE,
			Item::FIELD_NAME_CURRENCY_ID,
			Item\Company::FIELD_NAME_EMPLOYEES,
			Item::FIELD_NAME_COMMENTS,
			Item\Company::FIELD_NAME_IS_MY_COMPANY,
			Item::FIELD_NAME_ASSIGNED,
		];
	}

	protected function getDependantTrackedObjects(): array
	{
		return [];
	}

	protected function configureAddOperation(Operation $operation): void
	{
		$operation
			->addAction(
				Operation::ACTION_BEFORE_SAVE,
				new Operation\Action\Compatible\SendEvent\WithCancel\Update(
					'OnBeforeCrmCompanyAdd',
					'CRM_COMPANY_CREATION_CANCELED',
				),
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\ClearCache('b_crm_company'),
			)
		;

		if ($operation->getItem()->getCategoryId() === 0)
		{
			$operation
				->addAction(
					Operation::ACTION_AFTER_SAVE,
					new Operation\Action\Compatible\SocialNetwork\ProcessAdd(),
				)
			;
		}

		if ($operation->getItem()->getIsMyCompany())
		{
			$operation
				->addAction(
					Operation::ACTION_AFTER_SAVE,
					new Operation\Action\ClearDefaultMyCompanyCache(),
				)
			;
		}

		$operation
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\Compatible\SendEvent('OnAfterCrmCompanyAdd'),
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\Compatible\SendEvent\ExternalAdd('OnAfterExternalCrmCompanyAdd'),
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\Compatible\SocialNetwork\ProcessSendNotification\WhenAddingEntity(),
			)
		;
	}

	public function getUpdateOperation(Item $item, Context $context = null): Operation\Update
	{
		$operation = parent::getUpdateOperation($item, $context);

		$operation
			->addAction(
				Operation::ACTION_BEFORE_SAVE,
				new Operation\Action\Compatible\SendEvent\WithCancel\Update(
					'OnBeforeCrmCompanyUpdate',
					'CRM_COMPANY_UPDATE_CANCELED',
				),
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\ClearCache(
					null,
					'crm_entity_name_' . $this->getEntityTypeId() . '_',
					[Item::FIELD_NAME_TITLE],
				)
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\FillEntityFieldsContext()
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\ResetEntityCommunicationSettingsInActivities(),
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\Compatible\SocialNetwork\ProcessSendNotification\WhenUpdatingEntity(),
			)
		;

		if ($operation->getItem()->getCategoryId() === 0)
		{
			$operation
				->addAction(
					Operation::ACTION_AFTER_SAVE,
					new Operation\Action\Compatible\SocialNetwork\ProcessUpdate(),
				)
			;
		}

		if ($operation->getItem()->isChanged(Item\Company::FIELD_NAME_IS_MY_COMPANY))
		{
			$operation
				->addAction(
					Operation::ACTION_AFTER_SAVE,
					new Operation\Action\ClearDefaultMyCompanyCache(),
				)
			;
		}

		$operation
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\Compatible\SendEvent('OnAfterCrmCompanyUpdate'),
			)
		;

		return $operation;
	}

	public function getDeleteOperation(Item $item, Context $context = null): Operation\Delete
	{
		$operation = parent::getDeleteOperation($item, $context);

		$operation
			->addAction(
				Operation::ACTION_BEFORE_SAVE,
				new Operation\Action\Compatible\SendEvent\WithCancel\Delete('OnBeforeCrmCompanyDelete')
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\ClearCache(
					'b_crm_company',
					'crm_entity_name_' . $this->getEntityTypeId() . '_'
				)
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\Compatible\SocialNetwork\ProcessDelete(),
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\ClearEntitySelectorPrepareRequisiteDataCache(),
			)
		;

		if ($operation->getItem()->getIsMyCompany())
		{
			$operation
				->addAction(
					Operation::ACTION_AFTER_SAVE,
					new Operation\Action\ClearDefaultMyCompanyCache(),
				)
			;
		}

		$operation
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\Compatible\SendEvent\Delete('OnAfterCrmCompanyDelete')
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\DeleteEntityFieldsContext()
			)
		;

		return $operation;
	}

	protected function getStatisticsFacade(): ?Statistics\OperationFacade
	{
		return new Statistics\OperationFacade\Company();
	}

	public function isCountersEnabled(): bool
	{
		return true;
	}

	public function isCommunicationRoutingSupported(): bool
	{
		return true;
	}
}
