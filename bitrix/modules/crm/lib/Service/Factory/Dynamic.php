<?php

namespace Bitrix\Crm\Service\Factory;

use Bitrix\Crm\Binding\EntityContactTable;
use Bitrix\Crm\Category\Entity\Category;
use Bitrix\Crm\Category\Entity\ItemCategory;
use Bitrix\Crm\Field;
use Bitrix\Crm\Integration\Intranet\CustomSectionProvider;
use Bitrix\Crm\Item;
use Bitrix\Crm\Model\Dynamic\PrototypeItem;
use Bitrix\Crm\Model\Dynamic\PrototypeItemFieldsContext;
use Bitrix\Crm\Model\Dynamic\PrototypeItemIndex;
use Bitrix\Crm\Model\Dynamic\Type;
use Bitrix\Crm\Model\Dynamic\TypeTable;
use Bitrix\Crm\Model\ItemCategoryTable;
use Bitrix\Crm\Service;
use Bitrix\Crm\Service\Container;
use Bitrix\Crm\Service\Context;
use Bitrix\Crm\Service\EventHistory\TrackedObject;
use Bitrix\Crm\Service\Operation;
use Bitrix\Crm\Service\Operation\Action;
use Bitrix\Crm\StatusTable;
use Bitrix\Main\DI\ServiceLocator;
use Bitrix\Main\ORM\Objectify\EntityObject;

class Dynamic extends Service\Factory
{
	protected $itemClassName = Item\Dynamic::class;

	/** @var Type */
	protected $type;

	public function __construct(Type $type)
	{
		$this->type = $type;
	}

	public function getType(): Type
	{
		return $this->type;
	}

	/**
	 * @return PrototypeItem|string
	 * @throws \Bitrix\Main\ObjectNotFoundException
	 */
	public function getDataClass(): string
	{
		return ServiceLocator::getInstance()->get('crm.type.factory')->getItemDataClass($this->type);
	}

	protected function configureItem(Item $item, EntityObject $entityObject): void
	{
		parent::configureItem($item, $entityObject);

		$fieldNameMap =
			(new Item\FieldImplementation\Binding\FieldNameMap())
				->setSingleId(Item::FIELD_NAME_CONTACT_ID)
				->setMultipleIds(Item::FIELD_NAME_CONTACT_IDS)
				->setBindings(Item::FIELD_NAME_CONTACT_BINDINGS)
				->setBoundEntities(Item::FIELD_NAME_CONTACTS)
		;

		$contactBindingsImplementation = new Item\FieldImplementation\Binding(
			$entityObject,
			\CCrmOwnerType::Contact,
			$fieldNameMap,
			EntityContactTable::getEntity(),
			Container::getInstance()->getContactBroker(),
		);
		$contactBindingsImplementation->setBindingObjectDefaultValues([
			'ENTITY_TYPE_ID' => $this->getEntityTypeId(),
		]);

		$item->addImplementation($contactBindingsImplementation);
	}

	/**
	 * @return PrototypeItemIndex|string
	 * @throws \Bitrix\Main\ObjectNotFoundException
	 */
	public function getFulltextDataClass(): string
	{
		return $this->getDataClass()::getFullTextDataClass();
	}

	/**
	 * @return PrototypeItemFieldsContext|string
	 */
	public function getFieldsContextDataClass(): string
	{
		return $this->getDataClass()::getFieldsContextDataClass();
	}

	public function getEntityTypeId(): int
	{
		return $this->type->getEntityTypeId();
	}

	public function getEntityDescription(): string
	{
		return $this->type->getTitle();
	}

	public function getFieldsSettings(): array
	{
		$info =  [
			Item::FIELD_NAME_ID => [
				'TYPE' => Field::TYPE_INTEGER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
			],
			Item::FIELD_NAME_TITLE => [
				'TYPE' => Field::TYPE_STRING,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::HasDefaultValue, \CCrmFieldInfoAttr::CanNotBeEmptied],
				'CLASS' => Field\Title::class,
			],
			Item::FIELD_NAME_XML_ID => [
				'TYPE' => Field::TYPE_STRING,
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
			Item::FIELD_NAME_ASSIGNED => [
				'TYPE' => Field::TYPE_USER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::CanNotBeEmptied, \CCrmFieldInfoAttr::HasDefaultValue],
				'CLASS' => Field\Assigned::class,
			],
			Item::FIELD_NAME_OPENED => [
				'TYPE' => Field::TYPE_BOOLEAN,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::Required],
				'CLASS' => Field\Opened::class,
			],
			Item::FIELD_NAME_WEBFORM_ID => [
				'TYPE' => Field::TYPE_INTEGER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed],
			],
		];

		if ($this->isMultipleAssignedEnabled())
		{
			$info[Item::FIELD_NAME_ASSIGNED]['ATTRIBUTES'][] = \CCrmFieldInfoAttr::Multiple;
		}

		if ($this->isBeginCloseDatesEnabled())
		{
			$info[Item::FIELD_NAME_BEGIN_DATE] = [
				'TYPE' => Field::TYPE_DATE,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::CanNotBeEmptied, \CCrmFieldInfoAttr::HasDefaultValue],
			];

			$info[Item::FIELD_NAME_CLOSE_DATE] = [
				'TYPE' => Field::TYPE_DATE,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::CanNotBeEmptied, \CCrmFieldInfoAttr::HasDefaultValue],
				'CLASS' => Field\CloseDate::class,
			];
		}

		if ($this->isClientEnabled())
		{
			$info[Item::FIELD_NAME_COMPANY_ID] = [
				'TYPE' => Field::TYPE_CRM_COMPANY,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed],
				'SETTINGS' => [
					'parentEntityTypeId' => \CCrmOwnerType::Company,
				],
			];

			$info[Item::FIELD_NAME_CONTACT_ID] = [
				'TYPE' => Field::TYPE_CRM_CONTACT,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed, \CCrmFieldInfoAttr::Deprecated],
			];

			$info[Item::FIELD_NAME_CONTACT_IDS] = [
				'TYPE' => Field::TYPE_CRM_CONTACT,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed, \CCrmFieldInfoAttr::Multiple]
			];

			$info[Item::FIELD_NAME_CONTACTS] = [
				'TYPE' => Field::TYPE_CRM_CONTACT,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed, \CCrmFieldInfoAttr::Multiple]
			];
		}

		if ($this->isObserversEnabled())
		{
			$info[Item::FIELD_NAME_OBSERVERS] = [
				'TYPE' => Field::TYPE_USER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::Multiple],
				'CLASS' => Field\Observers::class,
			];
		}

		// first check category - only after if - stages.
		if($this->isCategoriesSupported())
		{
			$info[Item::FIELD_NAME_CATEGORY_ID] = [
				'TYPE' => Field::TYPE_CRM_CATEGORY,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed, \CCrmFieldInfoAttr::HasDefaultValue],
				'CLASS' => Field\Category::class,
			];
		}

		if($this->isStagesEnabled())
		{
			$info[Item::FIELD_NAME_MOVED_TIME] = [
				'TYPE' => Field::TYPE_DATETIME,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
				'CLASS' => Field\MovedTime::class,
			];
			$info[Item::FIELD_NAME_MOVED_BY] = [
				'TYPE' => Field::TYPE_USER,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::ReadOnly, \CCrmFieldInfoAttr::AutoGenerated],
				'CLASS' => Field\MovedBy::class,
			];
			$info[Item::FIELD_NAME_STAGE_ID] = [
				'TYPE' => Field::TYPE_CRM_STATUS,
				'CRM_STATUS_TYPE' => $this->getStagesEntityId(),
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::Progress],
				'CLASS' => Field\Stage::class,
			];
			$info[Item::FIELD_NAME_PREVIOUS_STAGE_ID] = [
				'TYPE' => Field::TYPE_CRM_STATUS,
				'CRM_STATUS_TYPE' => $this->getStagesEntityId(),
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::Progress, \CCrmFieldInfoAttr::ReadOnly],
				'CLASS' => Field\PreviousStageId::class,
			];
		}

		if ($this->isSourceEnabled())
		{
			$info[Item::FIELD_NAME_SOURCE_ID] = [
				'TYPE' => Field::TYPE_CRM_STATUS,
				'CRM_STATUS_TYPE' => StatusTable::ENTITY_ID_SOURCE,
			];
			$info[Item::FIELD_NAME_SOURCE_DESCRIPTION] = [
				'TYPE' => Field::TYPE_TEXT,
				'VALUE_TYPE' => Field::VALUE_TYPE_PLAIN_TEXT,
			];
		}

		if ($this->isLinkWithProductsEnabled())
		{
			$info[Item::FIELD_NAME_CURRENCY_ID] = [
				'TYPE' => Field::TYPE_CRM_CURRENCY,
				'ATTRIBUTES' => [
					\CCrmFieldInfoAttr::NotDisplayed,
					\CCrmFieldInfoAttr::HasDefaultValue,
					\CCrmFieldInfoAttr::CanNotBeEmptied,
				],
				'CLASS' => Field\CurrencyId::class,
			];
			// dynamic items don't have EXCH_RATE field
			$info[Item::FIELD_NAME_ACCOUNT_CURRENCY_ID] = [
				'TYPE' => Field::TYPE_CRM_CURRENCY,
				'ATTRIBUTES' => [
					\CCrmFieldInfoAttr::NotDisplayed,
					\CCrmFieldInfoAttr::Hidden,
					\CCrmFieldInfoAttr::ReadOnly,
					\CCrmFieldInfoAttr::HasDefaultValue,
				],
			];
			$info[Item::FIELD_NAME_IS_MANUAL_OPPORTUNITY] = [
				'TYPE' => Field::TYPE_BOOLEAN,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed],
			];
			$info[Item::FIELD_NAME_PRODUCTS] = [
				'TYPE' => Field::TYPE_CRM_PRODUCT_ROW,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::Multiple, \CCrmFieldInfoAttr::Hidden, \CCrmFieldInfoAttr::NotDisplayed],
				'CLASS' => Field\ProductRows::class,
			];
			$info[Item::FIELD_NAME_OPPORTUNITY] = [
				'TYPE' => Field::TYPE_DOUBLE,
				'CLASS' => Field\Opportunity::class,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed],
			];
			$info[Item::FIELD_NAME_TAX_VALUE] = [
				'TYPE' => Field::TYPE_DOUBLE,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::NotDisplayed],
				'CLASS' => Field\TaxValue::class,
			];
			$info[Item::FIELD_NAME_OPPORTUNITY_ACCOUNT] = [
				'TYPE' => Field::TYPE_DOUBLE,
				'ATTRIBUTES' => [
					\CCrmFieldInfoAttr::NotDisplayed,
					\CCrmFieldInfoAttr::Hidden,
					\CCrmFieldInfoAttr::ReadOnly,
				],
				'CLASS' => Field\OpportunityAccount::class,
			];
			$info[Item::FIELD_NAME_TAX_VALUE_ACCOUNT] = [
				'TYPE' => Field::TYPE_DOUBLE,
				'ATTRIBUTES' => [
					\CCrmFieldInfoAttr::NotDisplayed,
					\CCrmFieldInfoAttr::Hidden,
					\CCrmFieldInfoAttr::ReadOnly,
				],
				'CLASS' => Field\TaxValueAccount::class,
			];
		}

		if ($this->isMyCompanyEnabled())
		{
			$info[Item::FIELD_NAME_MYCOMPANY_ID] = [
				'TYPE' => Field::TYPE_CRM_COMPANY,
				'ATTRIBUTES' => [\CCrmFieldInfoAttr::HasDefaultValue],
				'SETTINGS' => [
					'isMyCompany' => true,
					'parentEntityTypeId' => \CCrmOwnerType::Company,
					'isEmbeddedEditorEnabled' => true,
				],
			];
		}

		if ($this->isLastActivitySupported())
		{
			$info[Item::FIELD_NAME_LAST_ACTIVITY_BY] = [
				'TYPE' => Field::TYPE_USER,
				'ATTRIBUTES' => [
					\CCrmFieldInfoAttr::ReadOnly,
					\CCrmFieldInfoAttr::AutoGenerated,
					\CCrmFieldInfoAttr::NotDisplayed,
				],
			];
			//LAST_ACTIVITY_TIME should be processed after LAST_ACTIVITY_BY
			$info[Item::FIELD_NAME_LAST_ACTIVITY_TIME] = [
				'TYPE' => Field::TYPE_DATETIME,
				'ATTRIBUTES' => [
					\CCrmFieldInfoAttr::ReadOnly,
					\CCrmFieldInfoAttr::AutoGenerated,
					\CCrmFieldInfoAttr::NotDisplayed,
				],
				'CLASS' => Field\LastActivityTime::class,
			];
		}

		return $info;
	}

	public function isCategoriesSupported(): bool
	{
		return true;
	}

	public function isCategoriesEnabled(): bool
	{
		return $this->type->getIsCategoriesEnabled();
	}

	public function isStagesEnabled(): bool
	{
		return $this->type->getIsStagesEnabled();
	}

	public function isBeginCloseDatesEnabled(): bool
	{
		return $this->type->getIsBeginCloseDatesEnabled();
	}

	public function isLinkWithProductsEnabled(): bool
	{
		return $this->type->getIsLinkWithProductsEnabled();
	}

	/**
	 * @inheritDoc
	 */
	public function getStagesEntityId(?int $categoryId = null): ?string
	{
		if (!$categoryId)
		{
			$categoryId = $this->createDefaultCategoryIfNotExist()->getId();
		}

		return $this->getEntityName() . '_STAGE_' . $categoryId;
	}

	public function createCategory(array $data = []): Category
	{
		$object = ItemCategoryTable::createObject($data);
		$object->setEntityTypeId($this->getEntityTypeId());

		return new ItemCategory($object);
	}

	protected function loadCategories(): array
	{
		return ItemCategoryTable::getItemCategoriesByEntityTypeId($this->getEntityTypeId());
	}

	public function isClientEnabled(): bool
	{
		return $this->type->getIsClientEnabled();
	}

	public function isObserversEnabled(): bool
	{
		return $this->type->getIsObserversEnabled();
	}

	final public function isCrmTrackingEnabled(): bool
	{
		return false;
//		return $this->type->getIsCrmTrackingEnabled();
	}

	public function isMyCompanyEnabled(): bool
	{
		return $this->type->getIsMycompanyEnabled();
	}

	public function isDocumentGenerationEnabled(): bool
	{
		return $this->type->getIsDocumentsEnabled();
	}

	public function isSourceEnabled(): bool
	{
		return $this->type->getIsSourceEnabled();
	}

	public function isUseInUserfieldEnabled(): bool
	{
		return $this->type->getIsUseInUserfieldEnabled();
	}

	public function isRecyclebinEnabled(): bool
	{
		return $this->type->getIsRecyclebinEnabled();
	}

	public function isAutomationEnabled(): bool
	{
		return ($this->type->getIsStagesEnabled() && $this->type->getIsAutomationEnabled());
	}

	public function isBizProcEnabled(): bool
	{
		return $this->type->getIsBizProcEnabled();
	}

	public function isLastActivitySupported(): bool
	{
		return (
			$this->isFieldExists(Item::FIELD_NAME_LAST_ACTIVITY_TIME)
			&& $this->isFieldExists(Item::FIELD_NAME_LAST_ACTIVITY_BY)
		);
	}

	protected function getTrackedFieldNames(): array
	{
		$trackedFieldNames = [
			Item::FIELD_NAME_TITLE,
			Item::FIELD_NAME_ASSIGNED,
		];

		if ($this->isLinkWithProductsEnabled())
		{
			$trackedFieldNames[] = Item::FIELD_NAME_CURRENCY_ID;
			$trackedFieldNames[] = Item::FIELD_NAME_IS_MANUAL_OPPORTUNITY;
		}

		if ($this->isStagesEnabled())
		{
			$trackedFieldNames[] = Item::FIELD_NAME_STAGE_ID;
		}

		if ($this->isSourceEnabled())
		{
			$trackedFieldNames[] = Item::FIELD_NAME_SOURCE_ID;
		}

		if($this->isCategoriesSupported())
		{
			$trackedFieldNames[] = Item::FIELD_NAME_CATEGORY_ID;
		}

		return $trackedFieldNames;
	}

	protected function getDependantTrackedObjects(): array
	{
		$objects = [];

		if ($this->isLinkWithProductsEnabled())
		{
			$productTrackedObject = new TrackedObject\Product();
			$productTrackedObject->makeThisObjectDependant(Item::FIELD_NAME_PRODUCTS);
			$objects[] = $productTrackedObject;
		}

		return $objects;
	}

	protected function configureAddOperation(Operation $operation): void
	{
		$eventManager = Service\Container::getInstance()->getRestEventManager();

		$operation
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Action\SendEvent($eventManager::EVENT_DYNAMIC_ITEM_ADD)
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Action\SendEvent($eventManager->getItemEventNameWithEntityTypeId(
					$eventManager::EVENT_DYNAMIC_ITEM_ADD,
					$this->getEntityTypeId()
				))
			)
			->addAction(
				OPERATION::ACTION_AFTER_SAVE,
				new Action\ClearCache(
					"crm_dynamic_type_{$this->getEntityTypeId()}",
				),
			)
		;
	}

	public function getUpdateOperation(Item $item, Context $context = null): Operation\Update
	{
		$operation = parent::getUpdateOperation($item, $context);

		$eventManager = Service\Container::getInstance()->getRestEventManager();

		return $operation
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Action\SendEvent($eventManager::EVENT_DYNAMIC_ITEM_UPDATE)
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Action\SendEvent($eventManager->getItemEventNameWithEntityTypeId(
					$eventManager::EVENT_DYNAMIC_ITEM_UPDATE,
					$this->getEntityTypeId()
				))
			)
			->addAction(
				OPERATION::ACTION_AFTER_SAVE,
				new Action\ClearCache(
					"crm_dynamic_type_{$this->getEntityTypeId()}",
				),
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\FillEntityFieldsContext()
			)
		;
	}

	public function getDeleteOperation(Item $item, Context $context = null): Operation\Delete
	{
		$operation = parent::getDeleteOperation($item, $context);

		$eventManager = Service\Container::getInstance()->getRestEventManager();

		return $operation
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Action\SendEvent($eventManager::EVENT_DYNAMIC_ITEM_DELETE)
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Action\SendEvent($eventManager->getItemEventNameWithEntityTypeId(
					$eventManager::EVENT_DYNAMIC_ITEM_DELETE,
					$this->getEntityTypeId()
				))
			)
			->addAction(
				OPERATION::ACTION_AFTER_SAVE,
				new Action\ClearCache(
					"crm_dynamic_type_{$this->getEntityTypeId()}",
				),
			)
			->addAction(
				Operation::ACTION_AFTER_SAVE,
				new Operation\Action\DeleteEntityFieldsContext()
			)
		;
	}

	/**
	 * Return list of additional fields for corresponding data manager.
	 *
	 * @return \Bitrix\Main\ORM\Fields\Field[]
	 */
	public function getAdditionalTableFields(): array
	{
		return [];
	}

	public function isCountersEnabled(): bool
	{
		/** @var TypeTable $typeDataClass */
		$typeDataClass = $this->type::$dataClass;

		if (!$typeDataClass::getEntity()->hasField('IS_COUNTERS_ENABLED'))
		{
			return false;
		}

		return $this->type->getIsCountersEnabled() ?? false;
	}

	public function isInCustomSection(): bool
	{
		return CustomSectionProvider::hasCustomSection($this);
	}
}