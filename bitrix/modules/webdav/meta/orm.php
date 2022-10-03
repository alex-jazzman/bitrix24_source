<?php

/* ORMENTITYANNOTATION:Bitrix\Webdav\FolderInviteTable:webdav/lib/folderinvite.php:a81c9769b56358cd1135aa4e9c745ea5 */
namespace Bitrix\Webdav {
	/**
	 * EO_FolderInvite
	 * @see \Bitrix\Webdav\FolderInviteTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \Bitrix\Webdav\EO_FolderInvite setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getInviteUserId()
	 * @method \Bitrix\Webdav\EO_FolderInvite setInviteUserId(\int|\Bitrix\Main\DB\SqlExpression $inviteUserId)
	 * @method bool hasInviteUserId()
	 * @method bool isInviteUserIdFilled()
	 * @method bool isInviteUserIdChanged()
	 * @method \int remindActualInviteUserId()
	 * @method \int requireInviteUserId()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetInviteUserId()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetInviteUserId()
	 * @method \int fillInviteUserId()
	 * @method \Bitrix\Main\EO_User getInviteUser()
	 * @method \Bitrix\Main\EO_User remindActualInviteUser()
	 * @method \Bitrix\Main\EO_User requireInviteUser()
	 * @method \Bitrix\Webdav\EO_FolderInvite setInviteUser(\Bitrix\Main\EO_User $object)
	 * @method \Bitrix\Webdav\EO_FolderInvite resetInviteUser()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetInviteUser()
	 * @method bool hasInviteUser()
	 * @method bool isInviteUserFilled()
	 * @method bool isInviteUserChanged()
	 * @method \Bitrix\Main\EO_User fillInviteUser()
	 * @method \int getUserId()
	 * @method \Bitrix\Webdav\EO_FolderInvite setUserId(\int|\Bitrix\Main\DB\SqlExpression $userId)
	 * @method bool hasUserId()
	 * @method bool isUserIdFilled()
	 * @method bool isUserIdChanged()
	 * @method \int remindActualUserId()
	 * @method \int requireUserId()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetUserId()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetUserId()
	 * @method \int fillUserId()
	 * @method \Bitrix\Main\EO_User getUser()
	 * @method \Bitrix\Main\EO_User remindActualUser()
	 * @method \Bitrix\Main\EO_User requireUser()
	 * @method \Bitrix\Webdav\EO_FolderInvite setUser(\Bitrix\Main\EO_User $object)
	 * @method \Bitrix\Webdav\EO_FolderInvite resetUser()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetUser()
	 * @method bool hasUser()
	 * @method bool isUserFilled()
	 * @method bool isUserChanged()
	 * @method \Bitrix\Main\EO_User fillUser()
	 * @method \int getIblockId()
	 * @method \Bitrix\Webdav\EO_FolderInvite setIblockId(\int|\Bitrix\Main\DB\SqlExpression $iblockId)
	 * @method bool hasIblockId()
	 * @method bool isIblockIdFilled()
	 * @method bool isIblockIdChanged()
	 * @method \int remindActualIblockId()
	 * @method \int requireIblockId()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetIblockId()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetIblockId()
	 * @method \int fillIblockId()
	 * @method \int getSectionId()
	 * @method \Bitrix\Webdav\EO_FolderInvite setSectionId(\int|\Bitrix\Main\DB\SqlExpression $sectionId)
	 * @method bool hasSectionId()
	 * @method bool isSectionIdFilled()
	 * @method bool isSectionIdChanged()
	 * @method \int remindActualSectionId()
	 * @method \int requireSectionId()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetSectionId()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetSectionId()
	 * @method \int fillSectionId()
	 * @method \int getLinkSectionId()
	 * @method \Bitrix\Webdav\EO_FolderInvite setLinkSectionId(\int|\Bitrix\Main\DB\SqlExpression $linkSectionId)
	 * @method bool hasLinkSectionId()
	 * @method bool isLinkSectionIdFilled()
	 * @method bool isLinkSectionIdChanged()
	 * @method \int remindActualLinkSectionId()
	 * @method \int requireLinkSectionId()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetLinkSectionId()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetLinkSectionId()
	 * @method \int fillLinkSectionId()
	 * @method \string getDescription()
	 * @method \Bitrix\Webdav\EO_FolderInvite setDescription(\string|\Bitrix\Main\DB\SqlExpression $description)
	 * @method bool hasDescription()
	 * @method bool isDescriptionFilled()
	 * @method bool isDescriptionChanged()
	 * @method \string remindActualDescription()
	 * @method \string requireDescription()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetDescription()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetDescription()
	 * @method \string fillDescription()
	 * @method \boolean getIsApproved()
	 * @method \Bitrix\Webdav\EO_FolderInvite setIsApproved(\boolean|\Bitrix\Main\DB\SqlExpression $isApproved)
	 * @method bool hasIsApproved()
	 * @method bool isIsApprovedFilled()
	 * @method bool isIsApprovedChanged()
	 * @method \boolean remindActualIsApproved()
	 * @method \boolean requireIsApproved()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetIsApproved()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetIsApproved()
	 * @method \boolean fillIsApproved()
	 * @method \boolean getIsDeleted()
	 * @method \Bitrix\Webdav\EO_FolderInvite setIsDeleted(\boolean|\Bitrix\Main\DB\SqlExpression $isDeleted)
	 * @method bool hasIsDeleted()
	 * @method bool isIsDeletedFilled()
	 * @method bool isIsDeletedChanged()
	 * @method \boolean remindActualIsDeleted()
	 * @method \boolean requireIsDeleted()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetIsDeleted()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetIsDeleted()
	 * @method \boolean fillIsDeleted()
	 * @method \boolean getCanForward()
	 * @method \Bitrix\Webdav\EO_FolderInvite setCanForward(\boolean|\Bitrix\Main\DB\SqlExpression $canForward)
	 * @method bool hasCanForward()
	 * @method bool isCanForwardFilled()
	 * @method bool isCanForwardChanged()
	 * @method \boolean remindActualCanForward()
	 * @method \boolean requireCanForward()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetCanForward()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetCanForward()
	 * @method \boolean fillCanForward()
	 * @method \boolean getCanEdit()
	 * @method \Bitrix\Webdav\EO_FolderInvite setCanEdit(\boolean|\Bitrix\Main\DB\SqlExpression $canEdit)
	 * @method bool hasCanEdit()
	 * @method bool isCanEditFilled()
	 * @method bool isCanEditChanged()
	 * @method \boolean remindActualCanEdit()
	 * @method \boolean requireCanEdit()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetCanEdit()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetCanEdit()
	 * @method \boolean fillCanEdit()
	 * @method \Bitrix\Main\Type\DateTime getCreatedTimestamp()
	 * @method \Bitrix\Webdav\EO_FolderInvite setCreatedTimestamp(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $createdTimestamp)
	 * @method bool hasCreatedTimestamp()
	 * @method bool isCreatedTimestampFilled()
	 * @method bool isCreatedTimestampChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualCreatedTimestamp()
	 * @method \Bitrix\Main\Type\DateTime requireCreatedTimestamp()
	 * @method \Bitrix\Webdav\EO_FolderInvite resetCreatedTimestamp()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetCreatedTimestamp()
	 * @method \Bitrix\Main\Type\DateTime fillCreatedTimestamp()
	 * @method \int getCount()
	 * @method \int remindActualCount()
	 * @method \int requireCount()
	 * @method bool hasCount()
	 * @method bool isCountFilled()
	 * @method \Bitrix\Webdav\EO_FolderInvite unsetCount()
	 * @method \int fillCount()
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
	 * @method \Bitrix\Webdav\EO_FolderInvite set($fieldName, $value)
	 * @method \Bitrix\Webdav\EO_FolderInvite reset($fieldName)
	 * @method \Bitrix\Webdav\EO_FolderInvite unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \Bitrix\Webdav\EO_FolderInvite wakeUp($data)
	 */
	class EO_FolderInvite {
		/* @var \Bitrix\Webdav\FolderInviteTable */
		static public $dataClass = '\Bitrix\Webdav\FolderInviteTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace Bitrix\Webdav {
	/**
	 * EO_FolderInvite_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getInviteUserIdList()
	 * @method \int[] fillInviteUserId()
	 * @method \Bitrix\Main\EO_User[] getInviteUserList()
	 * @method \Bitrix\Webdav\EO_FolderInvite_Collection getInviteUserCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillInviteUser()
	 * @method \int[] getUserIdList()
	 * @method \int[] fillUserId()
	 * @method \Bitrix\Main\EO_User[] getUserList()
	 * @method \Bitrix\Webdav\EO_FolderInvite_Collection getUserCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillUser()
	 * @method \int[] getIblockIdList()
	 * @method \int[] fillIblockId()
	 * @method \int[] getSectionIdList()
	 * @method \int[] fillSectionId()
	 * @method \int[] getLinkSectionIdList()
	 * @method \int[] fillLinkSectionId()
	 * @method \string[] getDescriptionList()
	 * @method \string[] fillDescription()
	 * @method \boolean[] getIsApprovedList()
	 * @method \boolean[] fillIsApproved()
	 * @method \boolean[] getIsDeletedList()
	 * @method \boolean[] fillIsDeleted()
	 * @method \boolean[] getCanForwardList()
	 * @method \boolean[] fillCanForward()
	 * @method \boolean[] getCanEditList()
	 * @method \boolean[] fillCanEdit()
	 * @method \Bitrix\Main\Type\DateTime[] getCreatedTimestampList()
	 * @method \Bitrix\Main\Type\DateTime[] fillCreatedTimestamp()
	 * @method \int[] getCountList()
	 * @method \int[] fillCount()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\Bitrix\Webdav\EO_FolderInvite $object)
	 * @method bool has(\Bitrix\Webdav\EO_FolderInvite $object)
	 * @method bool hasByPrimary($primary)
	 * @method \Bitrix\Webdav\EO_FolderInvite getByPrimary($primary)
	 * @method \Bitrix\Webdav\EO_FolderInvite[] getAll()
	 * @method bool remove(\Bitrix\Webdav\EO_FolderInvite $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \Bitrix\Webdav\EO_FolderInvite_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \Bitrix\Webdav\EO_FolderInvite current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 */
	class EO_FolderInvite_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \Bitrix\Webdav\FolderInviteTable */
		static public $dataClass = '\Bitrix\Webdav\FolderInviteTable';
	}
}
namespace Bitrix\Webdav {
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_FolderInvite_Result exec()
	 * @method \Bitrix\Webdav\EO_FolderInvite fetchObject()
	 * @method \Bitrix\Webdav\EO_FolderInvite_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_FolderInvite_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \Bitrix\Webdav\EO_FolderInvite fetchObject()
	 * @method \Bitrix\Webdav\EO_FolderInvite_Collection fetchCollection()
	 */
	class EO_FolderInvite_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \Bitrix\Webdav\EO_FolderInvite createObject($setDefaultValues = true)
	 * @method \Bitrix\Webdav\EO_FolderInvite_Collection createCollection()
	 * @method \Bitrix\Webdav\EO_FolderInvite wakeUpObject($row)
	 * @method \Bitrix\Webdav\EO_FolderInvite_Collection wakeUpCollection($rows)
	 */
	class EO_FolderInvite_Entity extends \Bitrix\Main\ORM\Entity {}
}