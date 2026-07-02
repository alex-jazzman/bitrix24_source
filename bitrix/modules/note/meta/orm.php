<?php

/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\CollectionTable:note/lib/Internal/Model/CollectionTable.php */
namespace Bitrix\Note\Internal\Model {
	/**
	 * Collection
	 * @see \Bitrix\Note\Internal\Model\CollectionTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\Collection setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getName()
	 * @method \Bitrix\Note\Internal\Model\Collection setName(\string|\Bitrix\Main\DB\SqlExpression $name)
	 * @method bool hasName()
	 * @method bool isNameFilled()
	 * @method bool isNameChanged()
	 * @method \string remindActualName()
	 * @method \string requireName()
	 * @method \Bitrix\Note\Internal\Model\Collection resetName()
	 * @method \Bitrix\Note\Internal\Model\Collection unsetName()
	 * @method \string fillName()
	 * @method \int getCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\Collection setCreatedBy(\int|\Bitrix\Main\DB\SqlExpression $createdBy)
	 * @method bool hasCreatedBy()
	 * @method bool isCreatedByFilled()
	 * @method bool isCreatedByChanged()
	 * @method \int remindActualCreatedBy()
	 * @method \int requireCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\Collection resetCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\Collection unsetCreatedBy()
	 * @method \int fillCreatedBy()
	 * @method \int getPosition()
	 * @method \Bitrix\Note\Internal\Model\Collection setPosition(\int|\Bitrix\Main\DB\SqlExpression $position)
	 * @method bool hasPosition()
	 * @method bool isPositionFilled()
	 * @method bool isPositionChanged()
	 * @method \int remindActualPosition()
	 * @method \int requirePosition()
	 * @method \Bitrix\Note\Internal\Model\Collection resetPosition()
	 * @method \Bitrix\Note\Internal\Model\Collection unsetPosition()
	 * @method \int fillPosition()
	 * @method \Bitrix\Main\Type\DateTime getCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\Collection setCreatedAt(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $createdAt)
	 * @method bool hasCreatedAt()
	 * @method bool isCreatedAtFilled()
	 * @method bool isCreatedAtChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime requireCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\Collection resetCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\Collection unsetCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime fillCreatedAt()
	 * @method \int getUpdatedBy()
	 * @method \Bitrix\Note\Internal\Model\Collection setUpdatedBy(\int|\Bitrix\Main\DB\SqlExpression $updatedBy)
	 * @method bool hasUpdatedBy()
	 * @method bool isUpdatedByFilled()
	 * @method bool isUpdatedByChanged()
	 * @method \int remindActualUpdatedBy()
	 * @method \int requireUpdatedBy()
	 * @method \Bitrix\Note\Internal\Model\Collection resetUpdatedBy()
	 * @method \Bitrix\Note\Internal\Model\Collection unsetUpdatedBy()
	 * @method \int fillUpdatedBy()
	 * @method \Bitrix\Main\Type\DateTime getUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\Collection setUpdatedAt(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $updatedAt)
	 * @method bool hasUpdatedAt()
	 * @method bool isUpdatedAtFilled()
	 * @method bool isUpdatedAtChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualUpdatedAt()
	 * @method \Bitrix\Main\Type\DateTime requireUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\Collection resetUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\Collection unsetUpdatedAt()
	 * @method \Bitrix\Main\Type\DateTime fillUpdatedAt()
	 * @method \int getPolicyLevel()
	 * @method \Bitrix\Note\Internal\Model\Collection setPolicyLevel(\int|\Bitrix\Main\DB\SqlExpression $policyLevel)
	 * @method bool hasPolicyLevel()
	 * @method bool isPolicyLevelFilled()
	 * @method bool isPolicyLevelChanged()
	 * @method \int remindActualPolicyLevel()
	 * @method \int requirePolicyLevel()
	 * @method \Bitrix\Note\Internal\Model\Collection resetPolicyLevel()
	 * @method \Bitrix\Note\Internal\Model\Collection unsetPolicyLevel()
	 * @method \int fillPolicyLevel()
	 * @method \boolean getIsArchived()
	 * @method \Bitrix\Note\Internal\Model\Collection setIsArchived(\boolean|\Bitrix\Main\DB\SqlExpression $isArchived)
	 * @method bool hasIsArchived()
	 * @method bool isIsArchivedFilled()
	 * @method bool isIsArchivedChanged()
	 * @method \boolean remindActualIsArchived()
	 * @method \boolean requireIsArchived()
	 * @method \Bitrix\Note\Internal\Model\Collection resetIsArchived()
	 * @method \Bitrix\Note\Internal\Model\Collection unsetIsArchived()
	 * @method \boolean fillIsArchived()
	 * @method \Bitrix\Main\EO_User getCreatedByUser()
	 * @method \Bitrix\Main\EO_User remindActualCreatedByUser()
	 * @method \Bitrix\Main\EO_User requireCreatedByUser()
	 * @method \Bitrix\Note\Internal\Model\Collection setCreatedByUser(\Bitrix\Main\EO_User $object)
	 * @method \Bitrix\Note\Internal\Model\Collection resetCreatedByUser()
	 * @method \Bitrix\Note\Internal\Model\Collection unsetCreatedByUser()
	 * @method bool hasCreatedByUser()
	 * @method bool isCreatedByUserFilled()
	 * @method bool isCreatedByUserChanged()
	 * @method \Bitrix\Main\EO_User fillCreatedByUser()
	 * @method \Bitrix\Main\EO_User getUpdatedByUser()
	 * @method \Bitrix\Main\EO_User remindActualUpdatedByUser()
	 * @method \Bitrix\Main\EO_User requireUpdatedByUser()
	 * @method \Bitrix\Note\Internal\Model\Collection setUpdatedByUser(\Bitrix\Main\EO_User $object)
	 * @method \Bitrix\Note\Internal\Model\Collection resetUpdatedByUser()
	 * @method \Bitrix\Note\Internal\Model\Collection unsetUpdatedByUser()
	 * @method bool hasUpdatedByUser()
	 * @method bool isUpdatedByUserFilled()
	 * @method bool isUpdatedByUserChanged()
	 * @method \Bitrix\Main\EO_User fillUpdatedByUser()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\Collection set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\Collection reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\Collection unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\Collection wakeUp($data)
	 */
	class EO_Collection extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\CollectionTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\CollectionTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Collections
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getNameList()
	 * @method \string[] fillName()
	 * @method \int[] getCreatedByList()
	 * @method \int[] fillCreatedBy()
	 * @method \int[] getPositionList()
	 * @method \int[] fillPosition()
	 * @method \Bitrix\Main\Type\DateTime[] getCreatedAtList()
	 * @method \Bitrix\Main\Type\DateTime[] fillCreatedAt()
	 * @method \int[] getUpdatedByList()
	 * @method \int[] fillUpdatedBy()
	 * @method \Bitrix\Main\Type\DateTime[] getUpdatedAtList()
	 * @method \Bitrix\Main\Type\DateTime[] fillUpdatedAt()
	 * @method \int[] getPolicyLevelList()
	 * @method \int[] fillPolicyLevel()
	 * @method \boolean[] getIsArchivedList()
	 * @method \boolean[] fillIsArchived()
	 * @method \Bitrix\Main\EO_User[] getCreatedByUserList()
	 * @method \Bitrix\Note\Internal\Model\Collections getCreatedByUserCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillCreatedByUser()
	 * @method \Bitrix\Main\EO_User[] getUpdatedByUserList()
	 * @method \Bitrix\Note\Internal\Model\Collections getUpdatedByUserCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillUpdatedByUser()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\Collection $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\Collection $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\Collection getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\Collection[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\Collection $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\Collections wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\Collection current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\Collections merge(?\Bitrix\Note\Internal\Model\Collections $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\Collection|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\Collections filter(callable $callback)
	 */
	class EO_Collection_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\CollectionTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\CollectionTable';
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Collection_Result exec()
	 * @method \Bitrix\Note\Internal\Model\Collection fetchObject()
	 * @method \Bitrix\Note\Internal\Model\Collections fetchCollection()
	 */
	class EO_Collection_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\Collection fetchObject()
	 * @method \Bitrix\Note\Internal\Model\Collections fetchCollection()
	 */
	class EO_Collection_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\Collection createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\Collections createCollection()
	 * @method \Bitrix\Note\Internal\Model\Collection wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\Collections wakeUpCollection($rows)
	 */
	class EO_Collection_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\ImportMapTable:note/lib/Internal/Model/ImportMapTable.php */
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_ImportMap
	 * @see \Bitrix\Note\Internal\Model\ImportMapTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getSourceType()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap setSourceType(\string|\Bitrix\Main\DB\SqlExpression $sourceType)
	 * @method bool hasSourceType()
	 * @method bool isSourceTypeFilled()
	 * @method bool isSourceTypeChanged()
	 * @method \string remindActualSourceType()
	 * @method \string requireSourceType()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap resetSourceType()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap unsetSourceType()
	 * @method \string fillSourceType()
	 * @method \string getExternalId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap setExternalId(\string|\Bitrix\Main\DB\SqlExpression $externalId)
	 * @method bool hasExternalId()
	 * @method bool isExternalIdFilled()
	 * @method bool isExternalIdChanged()
	 * @method \string remindActualExternalId()
	 * @method \string requireExternalId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap resetExternalId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap unsetExternalId()
	 * @method \string fillExternalId()
	 * @method \int getDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap setDocumentId(\int|\Bitrix\Main\DB\SqlExpression $documentId)
	 * @method bool hasDocumentId()
	 * @method bool isDocumentIdFilled()
	 * @method bool isDocumentIdChanged()
	 * @method \int remindActualDocumentId()
	 * @method \int requireDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap resetDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap unsetDocumentId()
	 * @method \int fillDocumentId()
	 * @method \int getCollectionId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap setCollectionId(\int|\Bitrix\Main\DB\SqlExpression $collectionId)
	 * @method bool hasCollectionId()
	 * @method bool isCollectionIdFilled()
	 * @method bool isCollectionIdChanged()
	 * @method \int remindActualCollectionId()
	 * @method \int requireCollectionId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap resetCollectionId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap unsetCollectionId()
	 * @method \int fillCollectionId()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\EO_ImportMap wakeUp($data)
	 */
	class EO_ImportMap extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\ImportMapTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\ImportMapTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_ImportMap_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getSourceTypeList()
	 * @method \string[] fillSourceType()
	 * @method \string[] getExternalIdList()
	 * @method \string[] fillExternalId()
	 * @method \int[] getDocumentIdList()
	 * @method \int[] fillDocumentId()
	 * @method \int[] getCollectionIdList()
	 * @method \int[] fillCollectionId()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\EO_ImportMap $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\EO_ImportMap $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\EO_ImportMap $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\EO_ImportMap_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap_Collection merge(?\Bitrix\Note\Internal\Model\EO_ImportMap_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap_Collection filter(callable $callback)
	 */
	class EO_ImportMap_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\ImportMapTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\ImportMapTable';
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_ImportMap_Result exec()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap_Collection fetchCollection()
	 */
	class EO_ImportMap_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap_Collection fetchCollection()
	 */
	class EO_ImportMap_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportMap_Collection wakeUpCollection($rows)
	 */
	class EO_ImportMap_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\DocumentTable:note/lib/Internal/Model/DocumentTable.php */
namespace Bitrix\Note\Internal\Model {
	/**
	 * Document
	 * @see \Bitrix\Note\Internal\Model\DocumentTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\Document setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getCollectionId()
	 * @method \Bitrix\Note\Internal\Model\Document setCollectionId(\int|\Bitrix\Main\DB\SqlExpression $collectionId)
	 * @method bool hasCollectionId()
	 * @method bool isCollectionIdFilled()
	 * @method bool isCollectionIdChanged()
	 * @method \int remindActualCollectionId()
	 * @method \int requireCollectionId()
	 * @method \Bitrix\Note\Internal\Model\Document resetCollectionId()
	 * @method \Bitrix\Note\Internal\Model\Document unsetCollectionId()
	 * @method \int fillCollectionId()
	 * @method null|\int getParentId()
	 * @method \Bitrix\Note\Internal\Model\Document setParentId(null|\int|\Bitrix\Main\DB\SqlExpression $parentId)
	 * @method bool hasParentId()
	 * @method bool isParentIdFilled()
	 * @method bool isParentIdChanged()
	 * @method null|\int remindActualParentId()
	 * @method null|\int requireParentId()
	 * @method \Bitrix\Note\Internal\Model\Document resetParentId()
	 * @method \Bitrix\Note\Internal\Model\Document unsetParentId()
	 * @method null|\int fillParentId()
	 * @method \string getTitle()
	 * @method \Bitrix\Note\Internal\Model\Document setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \Bitrix\Note\Internal\Model\Document resetTitle()
	 * @method \Bitrix\Note\Internal\Model\Document unsetTitle()
	 * @method \string fillTitle()
	 * @method \string getMarkdown()
	 * @method \Bitrix\Note\Internal\Model\Document setMarkdown(\string|\Bitrix\Main\DB\SqlExpression $markdown)
	 * @method bool hasMarkdown()
	 * @method bool isMarkdownFilled()
	 * @method bool isMarkdownChanged()
	 * @method \string remindActualMarkdown()
	 * @method \string requireMarkdown()
	 * @method \Bitrix\Note\Internal\Model\Document resetMarkdown()
	 * @method \Bitrix\Note\Internal\Model\Document unsetMarkdown()
	 * @method \string fillMarkdown()
	 * @method null|\string getYjsState()
	 * @method \Bitrix\Note\Internal\Model\Document setYjsState(null|\string|\Bitrix\Main\DB\SqlExpression $yjsState)
	 * @method bool hasYjsState()
	 * @method bool isYjsStateFilled()
	 * @method bool isYjsStateChanged()
	 * @method null|\string remindActualYjsState()
	 * @method null|\string requireYjsState()
	 * @method \Bitrix\Note\Internal\Model\Document resetYjsState()
	 * @method \Bitrix\Note\Internal\Model\Document unsetYjsState()
	 * @method null|\string fillYjsState()
	 * @method \string getContentFormat()
	 * @method \Bitrix\Note\Internal\Model\Document setContentFormat(\string|\Bitrix\Main\DB\SqlExpression $contentFormat)
	 * @method bool hasContentFormat()
	 * @method bool isContentFormatFilled()
	 * @method bool isContentFormatChanged()
	 * @method \string remindActualContentFormat()
	 * @method \string requireContentFormat()
	 * @method \Bitrix\Note\Internal\Model\Document resetContentFormat()
	 * @method \Bitrix\Note\Internal\Model\Document unsetContentFormat()
	 * @method \string fillContentFormat()
	 * @method \int getPosition()
	 * @method \Bitrix\Note\Internal\Model\Document setPosition(\int|\Bitrix\Main\DB\SqlExpression $position)
	 * @method bool hasPosition()
	 * @method bool isPositionFilled()
	 * @method bool isPositionChanged()
	 * @method \int remindActualPosition()
	 * @method \int requirePosition()
	 * @method \Bitrix\Note\Internal\Model\Document resetPosition()
	 * @method \Bitrix\Note\Internal\Model\Document unsetPosition()
	 * @method \int fillPosition()
	 * @method \boolean getIsArchived()
	 * @method \Bitrix\Note\Internal\Model\Document setIsArchived(\boolean|\Bitrix\Main\DB\SqlExpression $isArchived)
	 * @method bool hasIsArchived()
	 * @method bool isIsArchivedFilled()
	 * @method bool isIsArchivedChanged()
	 * @method \boolean remindActualIsArchived()
	 * @method \boolean requireIsArchived()
	 * @method \Bitrix\Note\Internal\Model\Document resetIsArchived()
	 * @method \Bitrix\Note\Internal\Model\Document unsetIsArchived()
	 * @method \boolean fillIsArchived()
	 * @method \int getCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\Document setCreatedBy(\int|\Bitrix\Main\DB\SqlExpression $createdBy)
	 * @method bool hasCreatedBy()
	 * @method bool isCreatedByFilled()
	 * @method bool isCreatedByChanged()
	 * @method \int remindActualCreatedBy()
	 * @method \int requireCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\Document resetCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\Document unsetCreatedBy()
	 * @method \int fillCreatedBy()
	 * @method \int getUpdatedBy()
	 * @method \Bitrix\Note\Internal\Model\Document setUpdatedBy(\int|\Bitrix\Main\DB\SqlExpression $updatedBy)
	 * @method bool hasUpdatedBy()
	 * @method bool isUpdatedByFilled()
	 * @method bool isUpdatedByChanged()
	 * @method \int remindActualUpdatedBy()
	 * @method \int requireUpdatedBy()
	 * @method \Bitrix\Note\Internal\Model\Document resetUpdatedBy()
	 * @method \Bitrix\Note\Internal\Model\Document unsetUpdatedBy()
	 * @method \int fillUpdatedBy()
	 * @method \Bitrix\Main\Type\DateTime getCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\Document setCreatedAt(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $createdAt)
	 * @method bool hasCreatedAt()
	 * @method bool isCreatedAtFilled()
	 * @method bool isCreatedAtChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime requireCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\Document resetCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\Document unsetCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime fillCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime getUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\Document setUpdatedAt(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $updatedAt)
	 * @method bool hasUpdatedAt()
	 * @method bool isUpdatedAtFilled()
	 * @method bool isUpdatedAtChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualUpdatedAt()
	 * @method \Bitrix\Main\Type\DateTime requireUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\Document resetUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\Document unsetUpdatedAt()
	 * @method \Bitrix\Main\Type\DateTime fillUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\Collection getCollection()
	 * @method \Bitrix\Note\Internal\Model\Collection remindActualCollection()
	 * @method \Bitrix\Note\Internal\Model\Collection requireCollection()
	 * @method \Bitrix\Note\Internal\Model\Document setCollection(\Bitrix\Note\Internal\Model\Collection $object)
	 * @method \Bitrix\Note\Internal\Model\Document resetCollection()
	 * @method \Bitrix\Note\Internal\Model\Document unsetCollection()
	 * @method bool hasCollection()
	 * @method bool isCollectionFilled()
	 * @method bool isCollectionChanged()
	 * @method \Bitrix\Note\Internal\Model\Collection fillCollection()
	 * @method \Bitrix\Note\Internal\Model\Document getParent()
	 * @method \Bitrix\Note\Internal\Model\Document remindActualParent()
	 * @method \Bitrix\Note\Internal\Model\Document requireParent()
	 * @method \Bitrix\Note\Internal\Model\Document setParent(\Bitrix\Note\Internal\Model\Document $object)
	 * @method \Bitrix\Note\Internal\Model\Document resetParent()
	 * @method \Bitrix\Note\Internal\Model\Document unsetParent()
	 * @method bool hasParent()
	 * @method bool isParentFilled()
	 * @method bool isParentChanged()
	 * @method \Bitrix\Note\Internal\Model\Document fillParent()
	 * @method \Bitrix\Main\EO_User getCreatedByUser()
	 * @method \Bitrix\Main\EO_User remindActualCreatedByUser()
	 * @method \Bitrix\Main\EO_User requireCreatedByUser()
	 * @method \Bitrix\Note\Internal\Model\Document setCreatedByUser(\Bitrix\Main\EO_User $object)
	 * @method \Bitrix\Note\Internal\Model\Document resetCreatedByUser()
	 * @method \Bitrix\Note\Internal\Model\Document unsetCreatedByUser()
	 * @method bool hasCreatedByUser()
	 * @method bool isCreatedByUserFilled()
	 * @method bool isCreatedByUserChanged()
	 * @method \Bitrix\Main\EO_User fillCreatedByUser()
	 * @method \Bitrix\Main\EO_User getUpdatedByUser()
	 * @method \Bitrix\Main\EO_User remindActualUpdatedByUser()
	 * @method \Bitrix\Main\EO_User requireUpdatedByUser()
	 * @method \Bitrix\Note\Internal\Model\Document setUpdatedByUser(\Bitrix\Main\EO_User $object)
	 * @method \Bitrix\Note\Internal\Model\Document resetUpdatedByUser()
	 * @method \Bitrix\Note\Internal\Model\Document unsetUpdatedByUser()
	 * @method bool hasUpdatedByUser()
	 * @method bool isUpdatedByUserFilled()
	 * @method bool isUpdatedByUserChanged()
	 * @method \Bitrix\Main\EO_User fillUpdatedByUser()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\Document set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\Document reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\Document unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\Document wakeUp($data)
	 */
	class EO_Document extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\DocumentTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\DocumentTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Documents
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getCollectionIdList()
	 * @method \int[] fillCollectionId()
	 * @method null|\int[] getParentIdList()
	 * @method null|\int[] fillParentId()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \string[] getMarkdownList()
	 * @method \string[] fillMarkdown()
	 * @method null|\string[] getYjsStateList()
	 * @method null|\string[] fillYjsState()
	 * @method \string[] getContentFormatList()
	 * @method \string[] fillContentFormat()
	 * @method \int[] getPositionList()
	 * @method \int[] fillPosition()
	 * @method \boolean[] getIsArchivedList()
	 * @method \boolean[] fillIsArchived()
	 * @method \int[] getCreatedByList()
	 * @method \int[] fillCreatedBy()
	 * @method \int[] getUpdatedByList()
	 * @method \int[] fillUpdatedBy()
	 * @method \Bitrix\Main\Type\DateTime[] getCreatedAtList()
	 * @method \Bitrix\Main\Type\DateTime[] fillCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime[] getUpdatedAtList()
	 * @method \Bitrix\Main\Type\DateTime[] fillUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\Collection[] getCollectionList()
	 * @method \Bitrix\Note\Internal\Model\Documents getCollectionCollection()
	 * @method \Bitrix\Note\Internal\Model\Collections fillCollection()
	 * @method \Bitrix\Note\Internal\Model\Document[] getParentList()
	 * @method \Bitrix\Note\Internal\Model\Documents getParentCollection()
	 * @method \Bitrix\Note\Internal\Model\Documents fillParent()
	 * @method \Bitrix\Main\EO_User[] getCreatedByUserList()
	 * @method \Bitrix\Note\Internal\Model\Documents getCreatedByUserCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillCreatedByUser()
	 * @method \Bitrix\Main\EO_User[] getUpdatedByUserList()
	 * @method \Bitrix\Note\Internal\Model\Documents getUpdatedByUserCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillUpdatedByUser()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\Document $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\Document $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\Document getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\Document[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\Document $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\Documents wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\Document current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\Documents merge(?\Bitrix\Note\Internal\Model\Documents $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\Document|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\Documents filter(callable $callback)
	 */
	class EO_Document_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\DocumentTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\DocumentTable';
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Document_Result exec()
	 * @method \Bitrix\Note\Internal\Model\Document fetchObject()
	 * @method \Bitrix\Note\Internal\Model\Documents fetchCollection()
	 */
	class EO_Document_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\Document fetchObject()
	 * @method \Bitrix\Note\Internal\Model\Documents fetchCollection()
	 */
	class EO_Document_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\Document createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\Documents createCollection()
	 * @method \Bitrix\Note\Internal\Model\Document wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\Documents wakeUpCollection($rows)
	 */
	class EO_Document_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\UnresolvedMentionTable:note/lib/Internal/Model/UnresolvedMentionTable.php */
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_UnresolvedMention
	 * @see \Bitrix\Note\Internal\Model\UnresolvedMentionTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention setDocumentId(\int|\Bitrix\Main\DB\SqlExpression $documentId)
	 * @method bool hasDocumentId()
	 * @method bool isDocumentIdFilled()
	 * @method bool isDocumentIdChanged()
	 * @method \int remindActualDocumentId()
	 * @method \int requireDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention resetDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention unsetDocumentId()
	 * @method \int fillDocumentId()
	 * @method \string getSourceType()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention setSourceType(\string|\Bitrix\Main\DB\SqlExpression $sourceType)
	 * @method bool hasSourceType()
	 * @method bool isSourceTypeFilled()
	 * @method bool isSourceTypeChanged()
	 * @method \string remindActualSourceType()
	 * @method \string requireSourceType()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention resetSourceType()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention unsetSourceType()
	 * @method \string fillSourceType()
	 * @method \string getExternalId()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention setExternalId(\string|\Bitrix\Main\DB\SqlExpression $externalId)
	 * @method bool hasExternalId()
	 * @method bool isExternalIdFilled()
	 * @method bool isExternalIdChanged()
	 * @method \string remindActualExternalId()
	 * @method \string requireExternalId()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention resetExternalId()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention unsetExternalId()
	 * @method \string fillExternalId()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\EO_UnresolvedMention wakeUp($data)
	 */
	class EO_UnresolvedMention extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\UnresolvedMentionTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\UnresolvedMentionTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_UnresolvedMention_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getDocumentIdList()
	 * @method \int[] fillDocumentId()
	 * @method \string[] getSourceTypeList()
	 * @method \string[] fillSourceType()
	 * @method \string[] getExternalIdList()
	 * @method \string[] fillExternalId()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\EO_UnresolvedMention $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\EO_UnresolvedMention $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\EO_UnresolvedMention $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\EO_UnresolvedMention_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention_Collection merge(?\Bitrix\Note\Internal\Model\EO_UnresolvedMention_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention_Collection filter(callable $callback)
	 */
	class EO_UnresolvedMention_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\UnresolvedMentionTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\UnresolvedMentionTable';
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_UnresolvedMention_Result exec()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention_Collection fetchCollection()
	 */
	class EO_UnresolvedMention_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention_Collection fetchCollection()
	 */
	class EO_UnresolvedMention_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\EO_UnresolvedMention_Collection wakeUpCollection($rows)
	 */
	class EO_UnresolvedMention_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\NoteDocumentSearchTable:note/lib/Internal/Model/NoteDocumentSearchTable.php */
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_NoteDocumentSearch
	 * @see \Bitrix\Note\Internal\Model\NoteDocumentSearchTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch setDocumentId(\int|\Bitrix\Main\DB\SqlExpression $documentId)
	 * @method bool hasDocumentId()
	 * @method bool isDocumentIdFilled()
	 * @method bool isDocumentIdChanged()
	 * @method \int remindActualDocumentId()
	 * @method \int requireDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch resetDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch unsetDocumentId()
	 * @method \int fillDocumentId()
	 * @method \string getBody()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch setBody(\string|\Bitrix\Main\DB\SqlExpression $body)
	 * @method bool hasBody()
	 * @method bool isBodyFilled()
	 * @method bool isBodyChanged()
	 * @method \string remindActualBody()
	 * @method \string requireBody()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch resetBody()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch unsetBody()
	 * @method \string fillBody()
	 * @method \Bitrix\Main\Type\DateTime getUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch setUpdatedAt(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $updatedAt)
	 * @method bool hasUpdatedAt()
	 * @method bool isUpdatedAtFilled()
	 * @method bool isUpdatedAtChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualUpdatedAt()
	 * @method \Bitrix\Main\Type\DateTime requireUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch resetUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch unsetUpdatedAt()
	 * @method \Bitrix\Main\Type\DateTime fillUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\Document getDocument()
	 * @method \Bitrix\Note\Internal\Model\Document remindActualDocument()
	 * @method \Bitrix\Note\Internal\Model\Document requireDocument()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch setDocument(\Bitrix\Note\Internal\Model\Document $object)
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch resetDocument()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch unsetDocument()
	 * @method bool hasDocument()
	 * @method bool isDocumentFilled()
	 * @method bool isDocumentChanged()
	 * @method \Bitrix\Note\Internal\Model\Document fillDocument()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch wakeUp($data)
	 */
	class EO_NoteDocumentSearch extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\NoteDocumentSearchTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\NoteDocumentSearchTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_NoteDocumentSearch_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getDocumentIdList()
	 * @method \int[] fillDocumentId()
	 * @method \string[] getBodyList()
	 * @method \string[] fillBody()
	 * @method \Bitrix\Main\Type\DateTime[] getUpdatedAtList()
	 * @method \Bitrix\Main\Type\DateTime[] fillUpdatedAt()
	 * @method \Bitrix\Note\Internal\Model\Document[] getDocumentList()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch_Collection getDocumentCollection()
	 * @method \Bitrix\Note\Internal\Model\Documents fillDocument()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\EO_NoteDocumentSearch $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\EO_NoteDocumentSearch $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\EO_NoteDocumentSearch $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch_Collection merge(?\Bitrix\Note\Internal\Model\EO_NoteDocumentSearch_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch_Collection filter(callable $callback)
	 */
	class EO_NoteDocumentSearch_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\NoteDocumentSearchTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\NoteDocumentSearchTable';
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_NoteDocumentSearch_Result exec()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch_Collection fetchCollection()
	 */
	class EO_NoteDocumentSearch_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch_Collection fetchCollection()
	 */
	class EO_NoteDocumentSearch_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\EO_NoteDocumentSearch_Collection wakeUpCollection($rows)
	 */
	class EO_NoteDocumentSearch_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\DocumentAccessTable:note/lib/Internal/Model/DocumentAccessTable.php */
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_DocumentAccess
	 * @see \Bitrix\Note\Internal\Model\DocumentAccessTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess setDocumentId(\int|\Bitrix\Main\DB\SqlExpression $documentId)
	 * @method bool hasDocumentId()
	 * @method bool isDocumentIdFilled()
	 * @method bool isDocumentIdChanged()
	 * @method \int remindActualDocumentId()
	 * @method \int requireDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess resetDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess unsetDocumentId()
	 * @method \int fillDocumentId()
	 * @method \string getSubjectCode()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess setSubjectCode(\string|\Bitrix\Main\DB\SqlExpression $subjectCode)
	 * @method bool hasSubjectCode()
	 * @method bool isSubjectCodeFilled()
	 * @method bool isSubjectCodeChanged()
	 * @method \string remindActualSubjectCode()
	 * @method \string requireSubjectCode()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess resetSubjectCode()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess unsetSubjectCode()
	 * @method \string fillSubjectCode()
	 * @method \int getLevel()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess setLevel(\int|\Bitrix\Main\DB\SqlExpression $level)
	 * @method bool hasLevel()
	 * @method bool isLevelFilled()
	 * @method bool isLevelChanged()
	 * @method \int remindActualLevel()
	 * @method \int requireLevel()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess resetLevel()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess unsetLevel()
	 * @method \int fillLevel()
	 * @method \int getCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess setCreatedBy(\int|\Bitrix\Main\DB\SqlExpression $createdBy)
	 * @method bool hasCreatedBy()
	 * @method bool isCreatedByFilled()
	 * @method bool isCreatedByChanged()
	 * @method \int remindActualCreatedBy()
	 * @method \int requireCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess resetCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess unsetCreatedBy()
	 * @method \int fillCreatedBy()
	 * @method \Bitrix\Main\Type\DateTime getCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess setCreatedAt(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $createdAt)
	 * @method bool hasCreatedAt()
	 * @method bool isCreatedAtFilled()
	 * @method bool isCreatedAtChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime requireCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess resetCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess unsetCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime fillCreatedAt()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\EO_DocumentAccess wakeUp($data)
	 */
	class EO_DocumentAccess extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\DocumentAccessTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\DocumentAccessTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_DocumentAccess_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getDocumentIdList()
	 * @method \int[] fillDocumentId()
	 * @method \string[] getSubjectCodeList()
	 * @method \string[] fillSubjectCode()
	 * @method \int[] getLevelList()
	 * @method \int[] fillLevel()
	 * @method \int[] getCreatedByList()
	 * @method \int[] fillCreatedBy()
	 * @method \Bitrix\Main\Type\DateTime[] getCreatedAtList()
	 * @method \Bitrix\Main\Type\DateTime[] fillCreatedAt()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\EO_DocumentAccess $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\EO_DocumentAccess $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\EO_DocumentAccess $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\EO_DocumentAccess_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess_Collection merge(?\Bitrix\Note\Internal\Model\EO_DocumentAccess_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess_Collection filter(callable $callback)
	 */
	class EO_DocumentAccess_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\DocumentAccessTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\DocumentAccessTable';
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_DocumentAccess_Result exec()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess_Collection fetchCollection()
	 */
	class EO_DocumentAccess_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess_Collection fetchCollection()
	 */
	class EO_DocumentAccess_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentAccess_Collection wakeUpCollection($rows)
	 */
	class EO_DocumentAccess_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\DocumentUpdateTable:note/lib/Internal/Model/DocumentUpdateTable.php */
namespace Bitrix\Note\Internal\Model {
	/**
	 * DocumentUpdate
	 * @see \Bitrix\Note\Internal\Model\DocumentUpdateTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getDocumentId()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate setDocumentId(\int|\Bitrix\Main\DB\SqlExpression $documentId)
	 * @method bool hasDocumentId()
	 * @method bool isDocumentIdFilled()
	 * @method bool isDocumentIdChanged()
	 * @method \int remindActualDocumentId()
	 * @method \int requireDocumentId()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate resetDocumentId()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate unsetDocumentId()
	 * @method \int fillDocumentId()
	 * @method \int getUserId()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate setUserId(\int|\Bitrix\Main\DB\SqlExpression $userId)
	 * @method bool hasUserId()
	 * @method bool isUserIdFilled()
	 * @method bool isUserIdChanged()
	 * @method \int remindActualUserId()
	 * @method \int requireUserId()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate resetUserId()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate unsetUserId()
	 * @method \int fillUserId()
	 * @method \string getPatch()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate setPatch(\string|\Bitrix\Main\DB\SqlExpression $patch)
	 * @method bool hasPatch()
	 * @method bool isPatchFilled()
	 * @method bool isPatchChanged()
	 * @method \string remindActualPatch()
	 * @method \string requirePatch()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate resetPatch()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate unsetPatch()
	 * @method \string fillPatch()
	 * @method \Bitrix\Main\Type\DateTime getCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate setCreatedAt(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $createdAt)
	 * @method bool hasCreatedAt()
	 * @method bool isCreatedAtFilled()
	 * @method bool isCreatedAtChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime requireCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate resetCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate unsetCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime fillCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\Document getDocument()
	 * @method \Bitrix\Note\Internal\Model\Document remindActualDocument()
	 * @method \Bitrix\Note\Internal\Model\Document requireDocument()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate setDocument(\Bitrix\Note\Internal\Model\Document $object)
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate resetDocument()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate unsetDocument()
	 * @method bool hasDocument()
	 * @method bool isDocumentFilled()
	 * @method bool isDocumentChanged()
	 * @method \Bitrix\Note\Internal\Model\Document fillDocument()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\DocumentUpdate wakeUp($data)
	 */
	class EO_DocumentUpdate extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\DocumentUpdateTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\DocumentUpdateTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_DocumentUpdate_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getDocumentIdList()
	 * @method \int[] fillDocumentId()
	 * @method \int[] getUserIdList()
	 * @method \int[] fillUserId()
	 * @method \string[] getPatchList()
	 * @method \string[] fillPatch()
	 * @method \Bitrix\Main\Type\DateTime[] getCreatedAtList()
	 * @method \Bitrix\Main\Type\DateTime[] fillCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\Document[] getDocumentList()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection getDocumentCollection()
	 * @method \Bitrix\Note\Internal\Model\Documents fillDocument()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\DocumentUpdate $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\DocumentUpdate $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\DocumentUpdate $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection merge(?\Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection filter(callable $callback)
	 */
	class EO_DocumentUpdate_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\DocumentUpdateTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\DocumentUpdateTable';
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_DocumentUpdate_Result exec()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection fetchCollection()
	 */
	class EO_DocumentUpdate_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection fetchCollection()
	 */
	class EO_DocumentUpdate_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\DocumentUpdate wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentUpdate_Collection wakeUpCollection($rows)
	 */
	class EO_DocumentUpdate_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\CollectionAccessTable:note/lib/Internal/Model/CollectionAccessTable.php */
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_CollectionAccess
	 * @see \Bitrix\Note\Internal\Model\CollectionAccessTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getCollectionId()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess setCollectionId(\int|\Bitrix\Main\DB\SqlExpression $collectionId)
	 * @method bool hasCollectionId()
	 * @method bool isCollectionIdFilled()
	 * @method bool isCollectionIdChanged()
	 * @method \int remindActualCollectionId()
	 * @method \int requireCollectionId()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess resetCollectionId()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess unsetCollectionId()
	 * @method \int fillCollectionId()
	 * @method \string getSubjectCode()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess setSubjectCode(\string|\Bitrix\Main\DB\SqlExpression $subjectCode)
	 * @method bool hasSubjectCode()
	 * @method bool isSubjectCodeFilled()
	 * @method bool isSubjectCodeChanged()
	 * @method \string remindActualSubjectCode()
	 * @method \string requireSubjectCode()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess resetSubjectCode()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess unsetSubjectCode()
	 * @method \string fillSubjectCode()
	 * @method \int getLevel()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess setLevel(\int|\Bitrix\Main\DB\SqlExpression $level)
	 * @method bool hasLevel()
	 * @method bool isLevelFilled()
	 * @method bool isLevelChanged()
	 * @method \int remindActualLevel()
	 * @method \int requireLevel()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess resetLevel()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess unsetLevel()
	 * @method \int fillLevel()
	 * @method \int getCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess setCreatedBy(\int|\Bitrix\Main\DB\SqlExpression $createdBy)
	 * @method bool hasCreatedBy()
	 * @method bool isCreatedByFilled()
	 * @method bool isCreatedByChanged()
	 * @method \int remindActualCreatedBy()
	 * @method \int requireCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess resetCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess unsetCreatedBy()
	 * @method \int fillCreatedBy()
	 * @method \Bitrix\Main\Type\DateTime getCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess setCreatedAt(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $createdAt)
	 * @method bool hasCreatedAt()
	 * @method bool isCreatedAtFilled()
	 * @method bool isCreatedAtChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime requireCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess resetCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess unsetCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime fillCreatedAt()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\EO_CollectionAccess wakeUp($data)
	 */
	class EO_CollectionAccess extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\CollectionAccessTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\CollectionAccessTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_CollectionAccess_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getCollectionIdList()
	 * @method \int[] fillCollectionId()
	 * @method \string[] getSubjectCodeList()
	 * @method \string[] fillSubjectCode()
	 * @method \int[] getLevelList()
	 * @method \int[] fillLevel()
	 * @method \int[] getCreatedByList()
	 * @method \int[] fillCreatedBy()
	 * @method \Bitrix\Main\Type\DateTime[] getCreatedAtList()
	 * @method \Bitrix\Main\Type\DateTime[] fillCreatedAt()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\EO_CollectionAccess $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\EO_CollectionAccess $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\EO_CollectionAccess $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\EO_CollectionAccess_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess_Collection merge(?\Bitrix\Note\Internal\Model\EO_CollectionAccess_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess_Collection filter(callable $callback)
	 */
	class EO_CollectionAccess_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\CollectionAccessTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\CollectionAccessTable';
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_CollectionAccess_Result exec()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess_Collection fetchCollection()
	 */
	class EO_CollectionAccess_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess_Collection fetchCollection()
	 */
	class EO_CollectionAccess_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\EO_CollectionAccess_Collection wakeUpCollection($rows)
	 */
	class EO_CollectionAccess_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\ImportSessionTable:note/lib/Internal/Model/ImportSessionTable.php */
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_ImportSession
	 * @see \Bitrix\Note\Internal\Model\ImportSessionTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession setCreatedBy(\int|\Bitrix\Main\DB\SqlExpression $createdBy)
	 * @method bool hasCreatedBy()
	 * @method bool isCreatedByFilled()
	 * @method bool isCreatedByChanged()
	 * @method \int remindActualCreatedBy()
	 * @method \int requireCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession resetCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession unsetCreatedBy()
	 * @method \int fillCreatedBy()
	 * @method \string getStatus()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession setStatus(\string|\Bitrix\Main\DB\SqlExpression $status)
	 * @method bool hasStatus()
	 * @method bool isStatusFilled()
	 * @method bool isStatusChanged()
	 * @method \string remindActualStatus()
	 * @method \string requireStatus()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession resetStatus()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession unsetStatus()
	 * @method \string fillStatus()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\EO_ImportSession wakeUp($data)
	 */
	class EO_ImportSession extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\ImportSessionTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\ImportSessionTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_ImportSession_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getCreatedByList()
	 * @method \int[] fillCreatedBy()
	 * @method \string[] getStatusList()
	 * @method \string[] fillStatus()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\EO_ImportSession $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\EO_ImportSession $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\EO_ImportSession $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\EO_ImportSession_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession_Collection merge(?\Bitrix\Note\Internal\Model\EO_ImportSession_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession_Collection filter(callable $callback)
	 */
	class EO_ImportSession_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\ImportSessionTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\ImportSessionTable';
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_ImportSession_Result exec()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession_Collection fetchCollection()
	 */
	class EO_ImportSession_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession_Collection fetchCollection()
	 */
	class EO_ImportSession_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\EO_ImportSession_Collection wakeUpCollection($rows)
	 */
	class EO_ImportSession_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\DocumentFileTable:note/lib/Internal/Model/DocumentFileTable.php */
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_DocumentFile
	 * @see \Bitrix\Note\Internal\Model\DocumentFileTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getDocumentId()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile setDocumentId(\int|\Bitrix\Main\DB\SqlExpression $documentId)
	 * @method bool hasDocumentId()
	 * @method bool isDocumentIdFilled()
	 * @method bool isDocumentIdChanged()
	 * @method \int getFileId()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile setFileId(\int|\Bitrix\Main\DB\SqlExpression $fileId)
	 * @method bool hasFileId()
	 * @method bool isFileIdFilled()
	 * @method bool isFileIdChanged()
	 * @method \int getCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile setCreatedBy(\int|\Bitrix\Main\DB\SqlExpression $createdBy)
	 * @method bool hasCreatedBy()
	 * @method bool isCreatedByFilled()
	 * @method bool isCreatedByChanged()
	 * @method \int remindActualCreatedBy()
	 * @method \int requireCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile resetCreatedBy()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile unsetCreatedBy()
	 * @method \int fillCreatedBy()
	 * @method \Bitrix\Main\Type\DateTime getCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile setCreatedAt(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $createdAt)
	 * @method bool hasCreatedAt()
	 * @method bool isCreatedAtFilled()
	 * @method bool isCreatedAtChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime requireCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile resetCreatedAt()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile unsetCreatedAt()
	 * @method \Bitrix\Main\Type\DateTime fillCreatedAt()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\EO_DocumentFile wakeUp($data)
	 */
	class EO_DocumentFile extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\DocumentFileTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\DocumentFileTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * EO_DocumentFile_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getDocumentIdList()
	 * @method \int[] getFileIdList()
	 * @method \int[] getCreatedByList()
	 * @method \int[] fillCreatedBy()
	 * @method \Bitrix\Main\Type\DateTime[] getCreatedAtList()
	 * @method \Bitrix\Main\Type\DateTime[] fillCreatedAt()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\EO_DocumentFile $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\EO_DocumentFile $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\EO_DocumentFile $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\EO_DocumentFile_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile_Collection merge(?\Bitrix\Note\Internal\Model\EO_DocumentFile_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile_Collection filter(callable $callback)
	 */
	class EO_DocumentFile_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\DocumentFileTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\DocumentFileTable';
	}
}
namespace Bitrix\Note\Internal\Model {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_DocumentFile_Result exec()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile_Collection fetchCollection()
	 */
	class EO_DocumentFile_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile fetchObject()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile_Collection fetchCollection()
	 */
	class EO_DocumentFile_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\EO_DocumentFile_Collection wakeUpCollection($rows)
	 */
	class EO_DocumentFile_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\Access\PermissionTable:note/lib/Internal/Model/Access/PermissionTable.php */
namespace Bitrix\Note\Internal\Model\Access {
	/**
	 * EO_Permission
	 * @see \Bitrix\Note\Internal\Model\Access\PermissionTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getRoleId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission setRoleId(\int|\Bitrix\Main\DB\SqlExpression $roleId)
	 * @method bool hasRoleId()
	 * @method bool isRoleIdFilled()
	 * @method bool isRoleIdChanged()
	 * @method \int remindActualRoleId()
	 * @method \int requireRoleId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission resetRoleId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission unsetRoleId()
	 * @method \int fillRoleId()
	 * @method \string getPermissionId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission setPermissionId(\string|\Bitrix\Main\DB\SqlExpression $permissionId)
	 * @method bool hasPermissionId()
	 * @method bool isPermissionIdFilled()
	 * @method bool isPermissionIdChanged()
	 * @method \string remindActualPermissionId()
	 * @method \string requirePermissionId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission resetPermissionId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission unsetPermissionId()
	 * @method \string fillPermissionId()
	 * @method \int getValue()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission setValue(\int|\Bitrix\Main\DB\SqlExpression $value)
	 * @method bool hasValue()
	 * @method bool isValueFilled()
	 * @method bool isValueChanged()
	 * @method \int remindActualValue()
	 * @method \int requireValue()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission resetValue()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission unsetValue()
	 * @method \int fillValue()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\Access\EO_Permission wakeUp($data)
	 */
	class EO_Permission extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\Access\PermissionTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\Access\PermissionTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model\Access {
	/**
	 * EO_Permission_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getRoleIdList()
	 * @method \int[] fillRoleId()
	 * @method \string[] getPermissionIdList()
	 * @method \string[] fillPermissionId()
	 * @method \int[] getValueList()
	 * @method \int[] fillValue()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\Access\EO_Permission $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\Access\EO_Permission $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\Access\EO_Permission $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\Access\EO_Permission_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission_Collection merge(?\Bitrix\Note\Internal\Model\Access\EO_Permission_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission_Collection filter(callable $callback)
	 */
	class EO_Permission_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\Access\PermissionTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\Access\PermissionTable';
	}
}
namespace Bitrix\Note\Internal\Model\Access {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Permission_Result exec()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission fetchObject()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission_Collection fetchCollection()
	 */
	class EO_Permission_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission fetchObject()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission_Collection fetchCollection()
	 */
	class EO_Permission_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Permission_Collection wakeUpCollection($rows)
	 */
	class EO_Permission_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\Access\RoleTable:note/lib/Internal/Model/Access/RoleTable.php */
namespace Bitrix\Note\Internal\Model\Access {
	/**
	 * EO_Role
	 * @see \Bitrix\Note\Internal\Model\Access\RoleTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getName()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role setName(\string|\Bitrix\Main\DB\SqlExpression $name)
	 * @method bool hasName()
	 * @method bool isNameFilled()
	 * @method bool isNameChanged()
	 * @method \string remindActualName()
	 * @method \string requireName()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role resetName()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role unsetName()
	 * @method \string fillName()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\Access\EO_Role wakeUp($data)
	 */
	class EO_Role extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\Access\RoleTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\Access\RoleTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model\Access {
	/**
	 * EO_Role_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getNameList()
	 * @method \string[] fillName()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\Access\EO_Role $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\Access\EO_Role $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\Access\EO_Role $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\Access\EO_Role_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role_Collection merge(?\Bitrix\Note\Internal\Model\Access\EO_Role_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role_Collection filter(callable $callback)
	 */
	class EO_Role_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\Access\RoleTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\Access\RoleTable';
	}
}
namespace Bitrix\Note\Internal\Model\Access {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Role_Result exec()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role fetchObject()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role_Collection fetchCollection()
	 */
	class EO_Role_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role fetchObject()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role_Collection fetchCollection()
	 */
	class EO_Role_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_Role_Collection wakeUpCollection($rows)
	 */
	class EO_Role_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:Bitrix\Note\Internal\Model\Access\RoleRelationTable:note/lib/Internal/Model/Access/RoleRelationTable.php */
namespace Bitrix\Note\Internal\Model\Access {
	/**
	 * EO_RoleRelation
	 * @see \Bitrix\Note\Internal\Model\Access\RoleRelationTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getRoleId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation setRoleId(\int|\Bitrix\Main\DB\SqlExpression $roleId)
	 * @method bool hasRoleId()
	 * @method bool isRoleIdFilled()
	 * @method bool isRoleIdChanged()
	 * @method \int remindActualRoleId()
	 * @method \int requireRoleId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation resetRoleId()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation unsetRoleId()
	 * @method \int fillRoleId()
	 * @method \string getRelation()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation setRelation(\string|\Bitrix\Main\DB\SqlExpression $relation)
	 * @method bool hasRelation()
	 * @method bool isRelationFilled()
	 * @method bool isRelationChanged()
	 * @method \string remindActualRelation()
	 * @method \string requireRelation()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation resetRelation()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation unsetRelation()
	 * @method \string fillRelation()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @property-read array $primary
	 * @property-read int $state @see \Bitrix\Main\ORM\Objectify\State
	 * @property-read \Bitrix\Main\Type\Dictionary $customData
	 * @property \Bitrix\Main\Authentication\Context $authContext
	 * @method mixed get($fieldName)
	 * @method mixed remindActual($fieldName)
	 * @method mixed require($fieldName)
	 * @method bool has($fieldName)
	 * @method bool isFilled($fieldName)
	 * @method bool isChanged($fieldName)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation set($fieldName, $value)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation reset($fieldName)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method mixed fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Note\Internal\Model\Access\EO_RoleRelation wakeUp($data)
	 */
	class EO_RoleRelation extends \Bitrix\Main\ORM\Objectify\EntityObject {
		/* @var \Bitrix\Note\Internal\Model\Access\RoleRelationTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\Access\RoleRelationTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Note\Internal\Model\Access {
	/**
	 * EO_RoleRelation_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getRoleIdList()
	 * @method \int[] fillRoleId()
	 * @method \string[] getRelationList()
	 * @method \string[] fillRelation()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Note\Internal\Model\Access\EO_RoleRelation $object)
	 * @method bool has(\Bitrix\Note\Internal\Model\Access\EO_RoleRelation $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation getByPrimary($primary)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation[] getAll()
	 * @method bool remove(\Bitrix\Note\Internal\Model\Access\EO_RoleRelation $object)
	 * @method void removeByPrimary($primary)
	 * @method array|\Bitrix\Main\ORM\Objectify\Collection|null fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Note\Internal\Model\Access\EO_RoleRelation_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation_Collection merge(?\Bitrix\Note\Internal\Model\Access\EO_RoleRelation_Collection $collection)
	 * @method bool isEmpty()
	 * @method array collectValues(int $valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, int $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL, bool $recursive = false)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation|null find(callable $callback)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation_Collection filter(callable $callback)
	 */
	class EO_RoleRelation_Collection extends \Bitrix\Main\ORM\Objectify\Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Note\Internal\Model\Access\RoleRelationTable */
		static public $dataClass = '\Bitrix\Note\Internal\Model\Access\RoleRelationTable';
	}
}
namespace Bitrix\Note\Internal\Model\Access {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_RoleRelation_Result exec()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation fetchObject()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation_Collection fetchCollection()
	 */
	class EO_RoleRelation_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation fetchObject()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation_Collection fetchCollection()
	 */
	class EO_RoleRelation_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation createObject($setDefaultValues = true)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation_Collection createCollection()
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation wakeUpObject($row)
	 * @method \Bitrix\Note\Internal\Model\Access\EO_RoleRelation_Collection wakeUpCollection($rows)
	 */
	class EO_RoleRelation_Entity extends \Bitrix\Main\ORM\Entity {}
}