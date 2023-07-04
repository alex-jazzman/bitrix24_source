<?php

/* ORMENTITYANNOTATION:MyWebstor\Hms\ClinicTable */
namespace MyWebstor\Hms {
	/**
	 * EO_Clinic
	 * @see \MyWebstor\Hms\ClinicTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\EO_Clinic setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\EO_Clinic setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\EO_Clinic resetXmlId()
	 * @method \MyWebstor\Hms\EO_Clinic unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\EO_Clinic setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\EO_Clinic resetTitle()
	 * @method \MyWebstor\Hms\EO_Clinic unsetTitle()
	 * @method \string fillTitle()
	 * @method \int getCompanyId()
	 * @method \MyWebstor\Hms\EO_Clinic setCompanyId(\int|\Bitrix\Main\DB\SqlExpression $companyId)
	 * @method bool hasCompanyId()
	 * @method bool isCompanyIdFilled()
	 * @method bool isCompanyIdChanged()
	 * @method \int remindActualCompanyId()
	 * @method \int requireCompanyId()
	 * @method \MyWebstor\Hms\EO_Clinic resetCompanyId()
	 * @method \MyWebstor\Hms\EO_Clinic unsetCompanyId()
	 * @method \int fillCompanyId()
	 * @method \Bitrix\Crm\Company getCompany()
	 * @method \Bitrix\Crm\Company remindActualCompany()
	 * @method \Bitrix\Crm\Company requireCompany()
	 * @method \MyWebstor\Hms\EO_Clinic setCompany(\Bitrix\Crm\Company $object)
	 * @method \MyWebstor\Hms\EO_Clinic resetCompany()
	 * @method \MyWebstor\Hms\EO_Clinic unsetCompany()
	 * @method bool hasCompany()
	 * @method bool isCompanyFilled()
	 * @method bool isCompanyChanged()
	 * @method \Bitrix\Crm\Company fillCompany()
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
	 * @method \MyWebstor\Hms\EO_Clinic set($fieldName, $value)
	 * @method \MyWebstor\Hms\EO_Clinic reset($fieldName)
	 * @method \MyWebstor\Hms\EO_Clinic unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\EO_Clinic wakeUp($data)
	 */
	class EO_Clinic {
		/* @var \MyWebstor\Hms\ClinicTable */
		static public $dataClass = '\MyWebstor\Hms\ClinicTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Clinic_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \int[] getCompanyIdList()
	 * @method \int[] fillCompanyId()
	 * @method \Bitrix\Crm\Company[] getCompanyList()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection getCompanyCollection()
	 * @method \Bitrix\Crm\EO_Company_Collection fillCompany()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\EO_Clinic $object)
	 * @method bool has(\MyWebstor\Hms\EO_Clinic $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Clinic getByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Clinic[] getAll()
	 * @method bool remove(\MyWebstor\Hms\EO_Clinic $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Clinic_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\EO_Clinic current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Clinic_Collection merge(?EO_Clinic_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Clinic_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\ClinicTable */
		static public $dataClass = '\MyWebstor\Hms\ClinicTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Clinic_Query query()
	 * @method static EO_Clinic_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Clinic_Result getById($id)
	 * @method static EO_Clinic_Result getList(array $parameters = [])
	 * @method static EO_Clinic_Entity getEntity()
	 * @method static \MyWebstor\Hms\EO_Clinic createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Clinic_Collection createCollection()
	 * @method static \MyWebstor\Hms\EO_Clinic wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Clinic_Collection wakeUpCollection($rows)
	 */
	class ClinicTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Clinic_Result exec()
	 * @method \MyWebstor\Hms\EO_Clinic fetchObject()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Clinic_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\EO_Clinic fetchObject()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection fetchCollection()
	 */
	class EO_Clinic_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\EO_Clinic createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Clinic_Collection createCollection()
	 * @method \MyWebstor\Hms\EO_Clinic wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Clinic_Collection wakeUpCollection($rows)
	 */
	class EO_Clinic_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\OfficeTable */
namespace MyWebstor\Hms {
	/**
	 * EO_Office
	 * @see \MyWebstor\Hms\OfficeTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\EO_Office setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\EO_Office setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\EO_Office resetXmlId()
	 * @method \MyWebstor\Hms\EO_Office unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\EO_Office setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\EO_Office resetTitle()
	 * @method \MyWebstor\Hms\EO_Office unsetTitle()
	 * @method \string fillTitle()
	 * @method \int getClinicId()
	 * @method \MyWebstor\Hms\EO_Office setClinicId(\int|\Bitrix\Main\DB\SqlExpression $clinicId)
	 * @method bool hasClinicId()
	 * @method bool isClinicIdFilled()
	 * @method bool isClinicIdChanged()
	 * @method \int remindActualClinicId()
	 * @method \int requireClinicId()
	 * @method \MyWebstor\Hms\EO_Office resetClinicId()
	 * @method \MyWebstor\Hms\EO_Office unsetClinicId()
	 * @method \int fillClinicId()
	 * @method \MyWebstor\Hms\EO_Clinic getClinic()
	 * @method \MyWebstor\Hms\EO_Clinic remindActualClinic()
	 * @method \MyWebstor\Hms\EO_Clinic requireClinic()
	 * @method \MyWebstor\Hms\EO_Office setClinic(\MyWebstor\Hms\EO_Clinic $object)
	 * @method \MyWebstor\Hms\EO_Office resetClinic()
	 * @method \MyWebstor\Hms\EO_Office unsetClinic()
	 * @method bool hasClinic()
	 * @method bool isClinicFilled()
	 * @method bool isClinicChanged()
	 * @method \MyWebstor\Hms\EO_Clinic fillClinic()
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
	 * @method \MyWebstor\Hms\EO_Office set($fieldName, $value)
	 * @method \MyWebstor\Hms\EO_Office reset($fieldName)
	 * @method \MyWebstor\Hms\EO_Office unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\EO_Office wakeUp($data)
	 */
	class EO_Office {
		/* @var \MyWebstor\Hms\OfficeTable */
		static public $dataClass = '\MyWebstor\Hms\OfficeTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Office_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \int[] getClinicIdList()
	 * @method \int[] fillClinicId()
	 * @method \MyWebstor\Hms\EO_Clinic[] getClinicList()
	 * @method \MyWebstor\Hms\EO_Office_Collection getClinicCollection()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection fillClinic()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\EO_Office $object)
	 * @method bool has(\MyWebstor\Hms\EO_Office $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Office getByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Office[] getAll()
	 * @method bool remove(\MyWebstor\Hms\EO_Office $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Office_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\EO_Office current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Office_Collection merge(?EO_Office_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Office_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\OfficeTable */
		static public $dataClass = '\MyWebstor\Hms\OfficeTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Office_Query query()
	 * @method static EO_Office_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Office_Result getById($id)
	 * @method static EO_Office_Result getList(array $parameters = [])
	 * @method static EO_Office_Entity getEntity()
	 * @method static \MyWebstor\Hms\EO_Office createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Office_Collection createCollection()
	 * @method static \MyWebstor\Hms\EO_Office wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Office_Collection wakeUpCollection($rows)
	 */
	class OfficeTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Office_Result exec()
	 * @method \MyWebstor\Hms\EO_Office fetchObject()
	 * @method \MyWebstor\Hms\EO_Office_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Office_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\EO_Office fetchObject()
	 * @method \MyWebstor\Hms\EO_Office_Collection fetchCollection()
	 */
	class EO_Office_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\EO_Office createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Office_Collection createCollection()
	 * @method \MyWebstor\Hms\EO_Office wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Office_Collection wakeUpCollection($rows)
	 */
	class EO_Office_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\DoctorTable */
namespace MyWebstor\Hms {
	/**
	 * EO_Doctor
	 * @see \MyWebstor\Hms\DoctorTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\EO_Doctor setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getXmlId()
	 * @method \MyWebstor\Hms\EO_Doctor setXmlId(\string|\Bitrix\Main\DB\SqlExpression $xmlId)
	 * @method bool hasXmlId()
	 * @method bool isXmlIdFilled()
	 * @method bool isXmlIdChanged()
	 * @method \string remindActualXmlId()
	 * @method \string requireXmlId()
	 * @method \MyWebstor\Hms\EO_Doctor resetXmlId()
	 * @method \MyWebstor\Hms\EO_Doctor unsetXmlId()
	 * @method \string fillXmlId()
	 * @method \int getOfficeId()
	 * @method \MyWebstor\Hms\EO_Doctor setOfficeId(\int|\Bitrix\Main\DB\SqlExpression $officeId)
	 * @method bool hasOfficeId()
	 * @method bool isOfficeIdFilled()
	 * @method bool isOfficeIdChanged()
	 * @method \int remindActualOfficeId()
	 * @method \int requireOfficeId()
	 * @method \MyWebstor\Hms\EO_Doctor resetOfficeId()
	 * @method \MyWebstor\Hms\EO_Doctor unsetOfficeId()
	 * @method \int fillOfficeId()
	 * @method \Bitrix\Main\EO_User getUser()
	 * @method \Bitrix\Main\EO_User remindActualUser()
	 * @method \Bitrix\Main\EO_User requireUser()
	 * @method \MyWebstor\Hms\EO_Doctor setUser(\Bitrix\Main\EO_User $object)
	 * @method \MyWebstor\Hms\EO_Doctor resetUser()
	 * @method \MyWebstor\Hms\EO_Doctor unsetUser()
	 * @method bool hasUser()
	 * @method bool isUserFilled()
	 * @method bool isUserChanged()
	 * @method \Bitrix\Main\EO_User fillUser()
	 * @method \MyWebstor\Hms\EO_Office getOffice()
	 * @method \MyWebstor\Hms\EO_Office remindActualOffice()
	 * @method \MyWebstor\Hms\EO_Office requireOffice()
	 * @method \MyWebstor\Hms\EO_Doctor setOffice(\MyWebstor\Hms\EO_Office $object)
	 * @method \MyWebstor\Hms\EO_Doctor resetOffice()
	 * @method \MyWebstor\Hms\EO_Doctor unsetOffice()
	 * @method bool hasOffice()
	 * @method bool isOfficeFilled()
	 * @method bool isOfficeChanged()
	 * @method \MyWebstor\Hms\EO_Office fillOffice()
	 * @method \string getUserTitle()
	 * @method \string remindActualUserTitle()
	 * @method \string requireUserTitle()
	 * @method bool hasUserTitle()
	 * @method bool isUserTitleFilled()
	 * @method \MyWebstor\Hms\EO_Doctor unsetUserTitle()
	 * @method \string fillUserTitle()
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
	 * @method \MyWebstor\Hms\EO_Doctor set($fieldName, $value)
	 * @method \MyWebstor\Hms\EO_Doctor reset($fieldName)
	 * @method \MyWebstor\Hms\EO_Doctor unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\EO_Doctor wakeUp($data)
	 */
	class EO_Doctor {
		/* @var \MyWebstor\Hms\DoctorTable */
		static public $dataClass = '\MyWebstor\Hms\DoctorTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Doctor_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getXmlIdList()
	 * @method \string[] fillXmlId()
	 * @method \int[] getOfficeIdList()
	 * @method \int[] fillOfficeId()
	 * @method \Bitrix\Main\EO_User[] getUserList()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection getUserCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillUser()
	 * @method \MyWebstor\Hms\EO_Office[] getOfficeList()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection getOfficeCollection()
	 * @method \MyWebstor\Hms\EO_Office_Collection fillOffice()
	 * @method \string[] getUserTitleList()
	 * @method \string[] fillUserTitle()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\EO_Doctor $object)
	 * @method bool has(\MyWebstor\Hms\EO_Doctor $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Doctor getByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Doctor[] getAll()
	 * @method bool remove(\MyWebstor\Hms\EO_Doctor $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Doctor_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\EO_Doctor current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Doctor_Collection merge(?EO_Doctor_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Doctor_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\DoctorTable */
		static public $dataClass = '\MyWebstor\Hms\DoctorTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Doctor_Query query()
	 * @method static EO_Doctor_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Doctor_Result getById($id)
	 * @method static EO_Doctor_Result getList(array $parameters = [])
	 * @method static EO_Doctor_Entity getEntity()
	 * @method static \MyWebstor\Hms\EO_Doctor createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Doctor_Collection createCollection()
	 * @method static \MyWebstor\Hms\EO_Doctor wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Doctor_Collection wakeUpCollection($rows)
	 */
	class DoctorTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Doctor_Result exec()
	 * @method \MyWebstor\Hms\EO_Doctor fetchObject()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Doctor_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\EO_Doctor fetchObject()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection fetchCollection()
	 */
	class EO_Doctor_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\EO_Doctor createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Doctor_Collection createCollection()
	 * @method \MyWebstor\Hms\EO_Doctor wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Doctor_Collection wakeUpCollection($rows)
	 */
	class EO_Doctor_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\AppointmentTable */
namespace MyWebstor\Hms {
	/**
	 * EO_Appointment
	 * @see \MyWebstor\Hms\AppointmentTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\EO_Appointment setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\EO_Appointment setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\EO_Appointment resetTitle()
	 * @method \MyWebstor\Hms\EO_Appointment unsetTitle()
	 * @method \string fillTitle()
	 * @method \int getDoctorId()
	 * @method \MyWebstor\Hms\EO_Appointment setDoctorId(\int|\Bitrix\Main\DB\SqlExpression $doctorId)
	 * @method bool hasDoctorId()
	 * @method bool isDoctorIdFilled()
	 * @method bool isDoctorIdChanged()
	 * @method \int remindActualDoctorId()
	 * @method \int requireDoctorId()
	 * @method \MyWebstor\Hms\EO_Appointment resetDoctorId()
	 * @method \MyWebstor\Hms\EO_Appointment unsetDoctorId()
	 * @method \int fillDoctorId()
	 * @method \int getOfficeId()
	 * @method \MyWebstor\Hms\EO_Appointment setOfficeId(\int|\Bitrix\Main\DB\SqlExpression $officeId)
	 * @method bool hasOfficeId()
	 * @method bool isOfficeIdFilled()
	 * @method bool isOfficeIdChanged()
	 * @method \int remindActualOfficeId()
	 * @method \int requireOfficeId()
	 * @method \MyWebstor\Hms\EO_Appointment resetOfficeId()
	 * @method \MyWebstor\Hms\EO_Appointment unsetOfficeId()
	 * @method \int fillOfficeId()
	 * @method \int getClinicId()
	 * @method \MyWebstor\Hms\EO_Appointment setClinicId(\int|\Bitrix\Main\DB\SqlExpression $clinicId)
	 * @method bool hasClinicId()
	 * @method bool isClinicIdFilled()
	 * @method bool isClinicIdChanged()
	 * @method \int remindActualClinicId()
	 * @method \int requireClinicId()
	 * @method \MyWebstor\Hms\EO_Appointment resetClinicId()
	 * @method \MyWebstor\Hms\EO_Appointment unsetClinicId()
	 * @method \int fillClinicId()
	 * @method \Bitrix\Main\Type\DateTime getDateFrom()
	 * @method \MyWebstor\Hms\EO_Appointment setDateFrom(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateFrom)
	 * @method bool hasDateFrom()
	 * @method bool isDateFromFilled()
	 * @method bool isDateFromChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateFrom()
	 * @method \Bitrix\Main\Type\DateTime requireDateFrom()
	 * @method \MyWebstor\Hms\EO_Appointment resetDateFrom()
	 * @method \MyWebstor\Hms\EO_Appointment unsetDateFrom()
	 * @method \Bitrix\Main\Type\DateTime fillDateFrom()
	 * @method \int getDuration()
	 * @method \MyWebstor\Hms\EO_Appointment setDuration(\int|\Bitrix\Main\DB\SqlExpression $duration)
	 * @method bool hasDuration()
	 * @method bool isDurationFilled()
	 * @method bool isDurationChanged()
	 * @method \int remindActualDuration()
	 * @method \int requireDuration()
	 * @method \MyWebstor\Hms\EO_Appointment resetDuration()
	 * @method \MyWebstor\Hms\EO_Appointment unsetDuration()
	 * @method \int fillDuration()
	 * @method \Bitrix\Main\Type\DateTime getDateTo()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateTo()
	 * @method \Bitrix\Main\Type\DateTime requireDateTo()
	 * @method bool hasDateTo()
	 * @method bool isDateToFilled()
	 * @method \MyWebstor\Hms\EO_Appointment unsetDateTo()
	 * @method \Bitrix\Main\Type\DateTime fillDateTo()
	 * @method \MyWebstor\Hms\EO_Doctor getDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor remindActualDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor requireDoctor()
	 * @method \MyWebstor\Hms\EO_Appointment setDoctor(\MyWebstor\Hms\EO_Doctor $object)
	 * @method \MyWebstor\Hms\EO_Appointment resetDoctor()
	 * @method \MyWebstor\Hms\EO_Appointment unsetDoctor()
	 * @method bool hasDoctor()
	 * @method bool isDoctorFilled()
	 * @method bool isDoctorChanged()
	 * @method \MyWebstor\Hms\EO_Doctor fillDoctor()
	 * @method \MyWebstor\Hms\EO_Office getOffice()
	 * @method \MyWebstor\Hms\EO_Office remindActualOffice()
	 * @method \MyWebstor\Hms\EO_Office requireOffice()
	 * @method \MyWebstor\Hms\EO_Appointment setOffice(\MyWebstor\Hms\EO_Office $object)
	 * @method \MyWebstor\Hms\EO_Appointment resetOffice()
	 * @method \MyWebstor\Hms\EO_Appointment unsetOffice()
	 * @method bool hasOffice()
	 * @method bool isOfficeFilled()
	 * @method bool isOfficeChanged()
	 * @method \MyWebstor\Hms\EO_Office fillOffice()
	 * @method \MyWebstor\Hms\EO_Clinic getClinic()
	 * @method \MyWebstor\Hms\EO_Clinic remindActualClinic()
	 * @method \MyWebstor\Hms\EO_Clinic requireClinic()
	 * @method \MyWebstor\Hms\EO_Appointment setClinic(\MyWebstor\Hms\EO_Clinic $object)
	 * @method \MyWebstor\Hms\EO_Appointment resetClinic()
	 * @method \MyWebstor\Hms\EO_Appointment unsetClinic()
	 * @method bool hasClinic()
	 * @method bool isClinicFilled()
	 * @method bool isClinicChanged()
	 * @method \MyWebstor\Hms\EO_Clinic fillClinic()
	 * @method \int getContactId()
	 * @method \int remindActualContactId()
	 * @method \int requireContactId()
	 * @method bool hasContactId()
	 * @method bool isContactIdFilled()
	 * @method \MyWebstor\Hms\EO_Appointment unsetContactId()
	 * @method \int fillContactId()
	 * @method \Bitrix\Crm\Contact getContact()
	 * @method \Bitrix\Crm\Contact remindActualContact()
	 * @method \Bitrix\Crm\Contact requireContact()
	 * @method \MyWebstor\Hms\EO_Appointment setContact(\Bitrix\Crm\Contact $object)
	 * @method \MyWebstor\Hms\EO_Appointment resetContact()
	 * @method \MyWebstor\Hms\EO_Appointment unsetContact()
	 * @method bool hasContact()
	 * @method bool isContactFilled()
	 * @method bool isContactChanged()
	 * @method \Bitrix\Crm\Contact fillContact()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact getContacts()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact remindActualContacts()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact requireContacts()
	 * @method \MyWebstor\Hms\EO_Appointment setContacts(\MyWebstor\Hms\Binding\EO_AppointmentContact $object)
	 * @method \MyWebstor\Hms\EO_Appointment resetContacts()
	 * @method \MyWebstor\Hms\EO_Appointment unsetContacts()
	 * @method bool hasContacts()
	 * @method bool isContactsFilled()
	 * @method bool isContactsChanged()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact fillContacts()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection getContactBindings()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection requireContactBindings()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection fillContactBindings()
	 * @method bool hasContactBindings()
	 * @method bool isContactBindingsFilled()
	 * @method bool isContactBindingsChanged()
	 * @method void addToContactBindings(\MyWebstor\Hms\Binding\EO_AppointmentContact $appointmentContact)
	 * @method void removeFromContactBindings(\MyWebstor\Hms\Binding\EO_AppointmentContact $appointmentContact)
	 * @method void removeAllContactBindings()
	 * @method \MyWebstor\Hms\EO_Appointment resetContactBindings()
	 * @method \MyWebstor\Hms\EO_Appointment unsetContactBindings()
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
	 * @method \MyWebstor\Hms\EO_Appointment set($fieldName, $value)
	 * @method \MyWebstor\Hms\EO_Appointment reset($fieldName)
	 * @method \MyWebstor\Hms\EO_Appointment unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\EO_Appointment wakeUp($data)
	 */
	class EO_Appointment {
		/* @var \MyWebstor\Hms\AppointmentTable */
		static public $dataClass = '\MyWebstor\Hms\AppointmentTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms {
	/**
	 * EO_Appointment_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \int[] getDoctorIdList()
	 * @method \int[] fillDoctorId()
	 * @method \int[] getOfficeIdList()
	 * @method \int[] fillOfficeId()
	 * @method \int[] getClinicIdList()
	 * @method \int[] fillClinicId()
	 * @method \Bitrix\Main\Type\DateTime[] getDateFromList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateFrom()
	 * @method \int[] getDurationList()
	 * @method \int[] fillDuration()
	 * @method \Bitrix\Main\Type\DateTime[] getDateToList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateTo()
	 * @method \MyWebstor\Hms\EO_Doctor[] getDoctorList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getDoctorCollection()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection fillDoctor()
	 * @method \MyWebstor\Hms\EO_Office[] getOfficeList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getOfficeCollection()
	 * @method \MyWebstor\Hms\EO_Office_Collection fillOffice()
	 * @method \MyWebstor\Hms\EO_Clinic[] getClinicList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getClinicCollection()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection fillClinic()
	 * @method \int[] getContactIdList()
	 * @method \int[] fillContactId()
	 * @method \Bitrix\Crm\Contact[] getContactList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getContactCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillContact()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact[] getContactsList()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection getContactsCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection fillContacts()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection[] getContactBindingsList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection getContactBindingsCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection fillContactBindings()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\EO_Appointment $object)
	 * @method bool has(\MyWebstor\Hms\EO_Appointment $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Appointment getByPrimary($primary)
	 * @method \MyWebstor\Hms\EO_Appointment[] getAll()
	 * @method bool remove(\MyWebstor\Hms\EO_Appointment $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\EO_Appointment_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\EO_Appointment current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Appointment_Collection merge(?EO_Appointment_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Appointment_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\AppointmentTable */
		static public $dataClass = '\MyWebstor\Hms\AppointmentTable';
	}
}
namespace MyWebstor\Hms {
	/**
	 * @method static EO_Appointment_Query query()
	 * @method static EO_Appointment_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Appointment_Result getById($id)
	 * @method static EO_Appointment_Result getList(array $parameters = [])
	 * @method static EO_Appointment_Entity getEntity()
	 * @method static \MyWebstor\Hms\EO_Appointment createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\EO_Appointment_Collection createCollection()
	 * @method static \MyWebstor\Hms\EO_Appointment wakeUpObject($row)
	 * @method static \MyWebstor\Hms\EO_Appointment_Collection wakeUpCollection($rows)
	 */
	class AppointmentTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Appointment_Result exec()
	 * @method \MyWebstor\Hms\EO_Appointment fetchObject()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Appointment_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\EO_Appointment fetchObject()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fetchCollection()
	 */
	class EO_Appointment_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\EO_Appointment createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\EO_Appointment_Collection createCollection()
	 * @method \MyWebstor\Hms\EO_Appointment wakeUpObject($row)
	 * @method \MyWebstor\Hms\EO_Appointment_Collection wakeUpCollection($rows)
	 */
	class EO_Appointment_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Schedule\WorktimeTable */
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_Worktime
	 * @see \MyWebstor\Hms\Schedule\WorktimeTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \int getScheduleId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setScheduleId(\int|\Bitrix\Main\DB\SqlExpression $scheduleId)
	 * @method bool hasScheduleId()
	 * @method bool isScheduleIdFilled()
	 * @method bool isScheduleIdChanged()
	 * @method \int remindActualScheduleId()
	 * @method \int requireScheduleId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetScheduleId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetScheduleId()
	 * @method \int fillScheduleId()
	 * @method \int getDoctorId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setDoctorId(\int|\Bitrix\Main\DB\SqlExpression $doctorId)
	 * @method bool hasDoctorId()
	 * @method bool isDoctorIdFilled()
	 * @method bool isDoctorIdChanged()
	 * @method \int remindActualDoctorId()
	 * @method \int requireDoctorId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetDoctorId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetDoctorId()
	 * @method \int fillDoctorId()
	 * @method \int getOfficeId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setOfficeId(\int|\Bitrix\Main\DB\SqlExpression $officeId)
	 * @method bool hasOfficeId()
	 * @method bool isOfficeIdFilled()
	 * @method bool isOfficeIdChanged()
	 * @method \int remindActualOfficeId()
	 * @method \int requireOfficeId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetOfficeId()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetOfficeId()
	 * @method \int fillOfficeId()
	 * @method \Bitrix\Main\Type\DateTime getWorktimeFrom()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setWorktimeFrom(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $worktimeFrom)
	 * @method bool hasWorktimeFrom()
	 * @method bool isWorktimeFromFilled()
	 * @method bool isWorktimeFromChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualWorktimeFrom()
	 * @method \Bitrix\Main\Type\DateTime requireWorktimeFrom()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetWorktimeFrom()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetWorktimeFrom()
	 * @method \Bitrix\Main\Type\DateTime fillWorktimeFrom()
	 * @method \Bitrix\Main\Type\DateTime getWorktimeTo()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setWorktimeTo(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $worktimeTo)
	 * @method bool hasWorktimeTo()
	 * @method bool isWorktimeToFilled()
	 * @method bool isWorktimeToChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualWorktimeTo()
	 * @method \Bitrix\Main\Type\DateTime requireWorktimeTo()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetWorktimeTo()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetWorktimeTo()
	 * @method \Bitrix\Main\Type\DateTime fillWorktimeTo()
	 * @method \string getColor()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setColor(\string|\Bitrix\Main\DB\SqlExpression $color)
	 * @method bool hasColor()
	 * @method bool isColorFilled()
	 * @method bool isColorChanged()
	 * @method \string remindActualColor()
	 * @method \string requireColor()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetColor()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetColor()
	 * @method \string fillColor()
	 * @method \string getDescription()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setDescription(\string|\Bitrix\Main\DB\SqlExpression $description)
	 * @method bool hasDescription()
	 * @method bool isDescriptionFilled()
	 * @method bool isDescriptionChanged()
	 * @method \string remindActualDescription()
	 * @method \string requireDescription()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetDescription()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetDescription()
	 * @method \string fillDescription()
	 * @method \string getBreaks()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setBreaks(\string|\Bitrix\Main\DB\SqlExpression $breaks)
	 * @method bool hasBreaks()
	 * @method bool isBreaksFilled()
	 * @method bool isBreaksChanged()
	 * @method \string remindActualBreaks()
	 * @method \string requireBreaks()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetBreaks()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetBreaks()
	 * @method \string fillBreaks()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule getSchedule()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule remindActualSchedule()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule requireSchedule()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setSchedule(\MyWebstor\Hms\Schedule\EO_Schedule $object)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetSchedule()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetSchedule()
	 * @method bool hasSchedule()
	 * @method bool isScheduleFilled()
	 * @method bool isScheduleChanged()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule fillSchedule()
	 * @method \MyWebstor\Hms\EO_Doctor getDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor remindActualDoctor()
	 * @method \MyWebstor\Hms\EO_Doctor requireDoctor()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setDoctor(\MyWebstor\Hms\EO_Doctor $object)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetDoctor()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetDoctor()
	 * @method bool hasDoctor()
	 * @method bool isDoctorFilled()
	 * @method bool isDoctorChanged()
	 * @method \MyWebstor\Hms\EO_Doctor fillDoctor()
	 * @method \MyWebstor\Hms\EO_Office getOffice()
	 * @method \MyWebstor\Hms\EO_Office remindActualOffice()
	 * @method \MyWebstor\Hms\EO_Office requireOffice()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime setOffice(\MyWebstor\Hms\EO_Office $object)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime resetOffice()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unsetOffice()
	 * @method bool hasOffice()
	 * @method bool isOfficeFilled()
	 * @method bool isOfficeChanged()
	 * @method \MyWebstor\Hms\EO_Office fillOffice()
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
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime set($fieldName, $value)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime reset($fieldName)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime wakeUp($data)
	 */
	class EO_Worktime {
		/* @var \MyWebstor\Hms\Schedule\WorktimeTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\WorktimeTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_Worktime_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \int[] getScheduleIdList()
	 * @method \int[] fillScheduleId()
	 * @method \int[] getDoctorIdList()
	 * @method \int[] fillDoctorId()
	 * @method \int[] getOfficeIdList()
	 * @method \int[] fillOfficeId()
	 * @method \Bitrix\Main\Type\DateTime[] getWorktimeFromList()
	 * @method \Bitrix\Main\Type\DateTime[] fillWorktimeFrom()
	 * @method \Bitrix\Main\Type\DateTime[] getWorktimeToList()
	 * @method \Bitrix\Main\Type\DateTime[] fillWorktimeTo()
	 * @method \string[] getColorList()
	 * @method \string[] fillColor()
	 * @method \string[] getDescriptionList()
	 * @method \string[] fillDescription()
	 * @method \string[] getBreaksList()
	 * @method \string[] fillBreaks()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule[] getScheduleList()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection getScheduleCollection()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection fillSchedule()
	 * @method \MyWebstor\Hms\EO_Doctor[] getDoctorList()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection getDoctorCollection()
	 * @method \MyWebstor\Hms\EO_Doctor_Collection fillDoctor()
	 * @method \MyWebstor\Hms\EO_Office[] getOfficeList()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection getOfficeCollection()
	 * @method \MyWebstor\Hms\EO_Office_Collection fillOffice()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Schedule\EO_Worktime $object)
	 * @method bool has(\MyWebstor\Hms\Schedule\EO_Worktime $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime getByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Schedule\EO_Worktime $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Worktime_Collection merge(?EO_Worktime_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Worktime_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Schedule\WorktimeTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\WorktimeTable';
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * @method static EO_Worktime_Query query()
	 * @method static EO_Worktime_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Worktime_Result getById($id)
	 * @method static EO_Worktime_Result getList(array $parameters = [])
	 * @method static EO_Worktime_Entity getEntity()
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime_Collection createCollection()
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Schedule\EO_Worktime_Collection wakeUpCollection($rows)
	 */
	class WorktimeTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Worktime_Result exec()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Worktime_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection fetchCollection()
	 */
	class EO_Worktime_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection createCollection()
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime wakeUpObject($row)
	 * @method \MyWebstor\Hms\Schedule\EO_Worktime_Collection wakeUpCollection($rows)
	 */
	class EO_Worktime_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Schedule\ScheduleTable */
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_Schedule
	 * @see \MyWebstor\Hms\Schedule\ScheduleTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getActive()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setActive(\string|\Bitrix\Main\DB\SqlExpression $active)
	 * @method bool hasActive()
	 * @method bool isActiveFilled()
	 * @method bool isActiveChanged()
	 * @method \string remindActualActive()
	 * @method \string requireActive()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetActive()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetActive()
	 * @method \string fillActive()
	 * @method \int getClinicId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setClinicId(\int|\Bitrix\Main\DB\SqlExpression $clinicId)
	 * @method bool hasClinicId()
	 * @method bool isClinicIdFilled()
	 * @method bool isClinicIdChanged()
	 * @method \int remindActualClinicId()
	 * @method \int requireClinicId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetClinicId()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetClinicId()
	 * @method \int fillClinicId()
	 * @method \string getMode()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setMode(\string|\Bitrix\Main\DB\SqlExpression $mode)
	 * @method bool hasMode()
	 * @method bool isModeFilled()
	 * @method bool isModeChanged()
	 * @method \string remindActualMode()
	 * @method \string requireMode()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetMode()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetMode()
	 * @method \string fillMode()
	 * @method \Bitrix\Main\Type\DateTime getDateCreate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setDateCreate(\Bitrix\Main\Type\DateTime|\Bitrix\Main\DB\SqlExpression $dateCreate)
	 * @method bool hasDateCreate()
	 * @method bool isDateCreateFilled()
	 * @method bool isDateCreateChanged()
	 * @method \Bitrix\Main\Type\DateTime remindActualDateCreate()
	 * @method \Bitrix\Main\Type\DateTime requireDateCreate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetDateCreate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetDateCreate()
	 * @method \Bitrix\Main\Type\DateTime fillDateCreate()
	 * @method \string getParticipants()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setParticipants(\string|\Bitrix\Main\DB\SqlExpression $participants)
	 * @method bool hasParticipants()
	 * @method bool isParticipantsFilled()
	 * @method bool isParticipantsChanged()
	 * @method \string remindActualParticipants()
	 * @method \string requireParticipants()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetParticipants()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetParticipants()
	 * @method \string fillParticipants()
	 * @method \Bitrix\Main\Type\Date getPlanDate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setPlanDate(\Bitrix\Main\Type\Date|\Bitrix\Main\DB\SqlExpression $planDate)
	 * @method bool hasPlanDate()
	 * @method bool isPlanDateFilled()
	 * @method bool isPlanDateChanged()
	 * @method \Bitrix\Main\Type\Date remindActualPlanDate()
	 * @method \Bitrix\Main\Type\Date requirePlanDate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetPlanDate()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetPlanDate()
	 * @method \Bitrix\Main\Type\Date fillPlanDate()
	 * @method \string getNumber()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setNumber(\string|\Bitrix\Main\DB\SqlExpression $number)
	 * @method bool hasNumber()
	 * @method bool isNumberFilled()
	 * @method bool isNumberChanged()
	 * @method \string remindActualNumber()
	 * @method \string requireNumber()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetNumber()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetNumber()
	 * @method \string fillNumber()
	 * @method \int getAssignedById()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setAssignedById(\int|\Bitrix\Main\DB\SqlExpression $assignedById)
	 * @method bool hasAssignedById()
	 * @method bool isAssignedByIdFilled()
	 * @method bool isAssignedByIdChanged()
	 * @method \int remindActualAssignedById()
	 * @method \int requireAssignedById()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetAssignedById()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetAssignedById()
	 * @method \int fillAssignedById()
	 * @method \string getComment()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setComment(\string|\Bitrix\Main\DB\SqlExpression $comment)
	 * @method bool hasComment()
	 * @method bool isCommentFilled()
	 * @method bool isCommentChanged()
	 * @method \string remindActualComment()
	 * @method \string requireComment()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetComment()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetComment()
	 * @method \string fillComment()
	 * @method \MyWebstor\Hms\EO_Clinic getClinic()
	 * @method \MyWebstor\Hms\EO_Clinic remindActualClinic()
	 * @method \MyWebstor\Hms\EO_Clinic requireClinic()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setClinic(\MyWebstor\Hms\EO_Clinic $object)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetClinic()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetClinic()
	 * @method bool hasClinic()
	 * @method bool isClinicFilled()
	 * @method bool isClinicChanged()
	 * @method \MyWebstor\Hms\EO_Clinic fillClinic()
	 * @method \Bitrix\Main\EO_User getAssignedBy()
	 * @method \Bitrix\Main\EO_User remindActualAssignedBy()
	 * @method \Bitrix\Main\EO_User requireAssignedBy()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule setAssignedBy(\Bitrix\Main\EO_User $object)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetAssignedBy()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetAssignedBy()
	 * @method bool hasAssignedBy()
	 * @method bool isAssignedByFilled()
	 * @method bool isAssignedByChanged()
	 * @method \Bitrix\Main\EO_User fillAssignedBy()
	 * @method \string getAssignedByFullName()
	 * @method \string remindActualAssignedByFullName()
	 * @method \string requireAssignedByFullName()
	 * @method bool hasAssignedByFullName()
	 * @method bool isAssignedByFullNameFilled()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetAssignedByFullName()
	 * @method \string fillAssignedByFullName()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection getShiftWork()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection requireShiftWork()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection fillShiftWork()
	 * @method bool hasShiftWork()
	 * @method bool isShiftWorkFilled()
	 * @method bool isShiftWorkChanged()
	 * @method void addToShiftWork(\MyWebstor\HMS\Schedule\EO_ShiftWork $shiftWork)
	 * @method void removeFromShiftWork(\MyWebstor\HMS\Schedule\EO_ShiftWork $shiftWork)
	 * @method void removeAllShiftWork()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule resetShiftWork()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unsetShiftWork()
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
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule set($fieldName, $value)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule reset($fieldName)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule wakeUp($data)
	 */
	class EO_Schedule {
		/* @var \MyWebstor\Hms\Schedule\ScheduleTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\ScheduleTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_Schedule_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getActiveList()
	 * @method \string[] fillActive()
	 * @method \int[] getClinicIdList()
	 * @method \int[] fillClinicId()
	 * @method \string[] getModeList()
	 * @method \string[] fillMode()
	 * @method \Bitrix\Main\Type\DateTime[] getDateCreateList()
	 * @method \Bitrix\Main\Type\DateTime[] fillDateCreate()
	 * @method \string[] getParticipantsList()
	 * @method \string[] fillParticipants()
	 * @method \Bitrix\Main\Type\Date[] getPlanDateList()
	 * @method \Bitrix\Main\Type\Date[] fillPlanDate()
	 * @method \string[] getNumberList()
	 * @method \string[] fillNumber()
	 * @method \int[] getAssignedByIdList()
	 * @method \int[] fillAssignedById()
	 * @method \string[] getCommentList()
	 * @method \string[] fillComment()
	 * @method \MyWebstor\Hms\EO_Clinic[] getClinicList()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection getClinicCollection()
	 * @method \MyWebstor\Hms\EO_Clinic_Collection fillClinic()
	 * @method \Bitrix\Main\EO_User[] getAssignedByList()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection getAssignedByCollection()
	 * @method \Bitrix\Main\EO_User_Collection fillAssignedBy()
	 * @method \string[] getAssignedByFullNameList()
	 * @method \string[] fillAssignedByFullName()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection[] getShiftWorkList()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection getShiftWorkCollection()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection fillShiftWork()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Schedule\EO_Schedule $object)
	 * @method bool has(\MyWebstor\Hms\Schedule\EO_Schedule $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule getByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Schedule\EO_Schedule $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_Schedule_Collection merge(?EO_Schedule_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_Schedule_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Schedule\ScheduleTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\ScheduleTable';
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * @method static EO_Schedule_Query query()
	 * @method static EO_Schedule_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_Schedule_Result getById($id)
	 * @method static EO_Schedule_Result getList(array $parameters = [])
	 * @method static EO_Schedule_Entity getEntity()
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule_Collection createCollection()
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Schedule\EO_Schedule_Collection wakeUpCollection($rows)
	 */
	class ScheduleTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_Schedule_Result exec()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_Schedule_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection fetchCollection()
	 */
	class EO_Schedule_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection createCollection()
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule wakeUpObject($row)
	 * @method \MyWebstor\Hms\Schedule\EO_Schedule_Collection wakeUpCollection($rows)
	 */
	class EO_Schedule_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Schedule\FillingMethodTable */
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_FillingMethod
	 * @see \MyWebstor\Hms\Schedule\FillingMethodTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getTitle()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod resetTitle()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod unsetTitle()
	 * @method \string fillTitle()
	 * @method \string getType()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod setType(\string|\Bitrix\Main\DB\SqlExpression $type)
	 * @method bool hasType()
	 * @method bool isTypeFilled()
	 * @method bool isTypeChanged()
	 * @method \string remindActualType()
	 * @method \string requireType()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod resetType()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod unsetType()
	 * @method \string fillType()
	 * @method \string getSegments()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod setSegments(\string|\Bitrix\Main\DB\SqlExpression $segments)
	 * @method bool hasSegments()
	 * @method bool isSegmentsFilled()
	 * @method bool isSegmentsChanged()
	 * @method \string remindActualSegments()
	 * @method \string requireSegments()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod resetSegments()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod unsetSegments()
	 * @method \string fillSegments()
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
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod set($fieldName, $value)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod reset($fieldName)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod wakeUp($data)
	 */
	class EO_FillingMethod {
		/* @var \MyWebstor\Hms\Schedule\FillingMethodTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\FillingMethodTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * EO_FillingMethod_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \string[] getTypeList()
	 * @method \string[] fillType()
	 * @method \string[] getSegmentsList()
	 * @method \string[] fillSegments()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Schedule\EO_FillingMethod $object)
	 * @method bool has(\MyWebstor\Hms\Schedule\EO_FillingMethod $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod getByPrimary($primary)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Schedule\EO_FillingMethod $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_FillingMethod_Collection merge(?EO_FillingMethod_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_FillingMethod_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Schedule\FillingMethodTable */
		static public $dataClass = '\MyWebstor\Hms\Schedule\FillingMethodTable';
	}
}
namespace MyWebstor\Hms\Schedule {
	/**
	 * @method static EO_FillingMethod_Query query()
	 * @method static EO_FillingMethod_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_FillingMethod_Result getById($id)
	 * @method static EO_FillingMethod_Result getList(array $parameters = [])
	 * @method static EO_FillingMethod_Entity getEntity()
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection createCollection()
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection wakeUpCollection($rows)
	 */
	class FillingMethodTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_FillingMethod_Result exec()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_FillingMethod_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod fetchObject()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection fetchCollection()
	 */
	class EO_FillingMethod_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection createCollection()
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod wakeUpObject($row)
	 * @method \MyWebstor\Hms\Schedule\EO_FillingMethod_Collection wakeUpCollection($rows)
	 */
	class EO_FillingMethod_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\HMS\Schedule\ShiftWorkTable */
namespace MyWebstor\HMS\Schedule {
	/**
	 * EO_ShiftWork
	 * @see \MyWebstor\HMS\Schedule\ShiftWorkTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getId()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork setId(\int|\Bitrix\Main\DB\SqlExpression $id)
	 * @method bool hasId()
	 * @method bool isIdFilled()
	 * @method bool isIdChanged()
	 * @method \string getTitle()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork setTitle(\string|\Bitrix\Main\DB\SqlExpression $title)
	 * @method bool hasTitle()
	 * @method bool isTitleFilled()
	 * @method bool isTitleChanged()
	 * @method \string remindActualTitle()
	 * @method \string requireTitle()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork resetTitle()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork unsetTitle()
	 * @method \string fillTitle()
	 * @method \string getWorktimes()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork setWorktimes(\string|\Bitrix\Main\DB\SqlExpression $worktimes)
	 * @method bool hasWorktimes()
	 * @method bool isWorktimesFilled()
	 * @method bool isWorktimesChanged()
	 * @method \string remindActualWorktimes()
	 * @method \string requireWorktimes()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork resetWorktimes()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork unsetWorktimes()
	 * @method \string fillWorktimes()
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
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork set($fieldName, $value)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork reset($fieldName)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork wakeUp($data)
	 */
	class EO_ShiftWork {
		/* @var \MyWebstor\HMS\Schedule\ShiftWorkTable */
		static public $dataClass = '\MyWebstor\HMS\Schedule\ShiftWorkTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\HMS\Schedule {
	/**
	 * EO_ShiftWork_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getIdList()
	 * @method \string[] getTitleList()
	 * @method \string[] fillTitle()
	 * @method \string[] getWorktimesList()
	 * @method \string[] fillWorktimes()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\HMS\Schedule\EO_ShiftWork $object)
	 * @method bool has(\MyWebstor\HMS\Schedule\EO_ShiftWork $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork getByPrimary($primary)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork[] getAll()
	 * @method bool remove(\MyWebstor\HMS\Schedule\EO_ShiftWork $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_ShiftWork_Collection merge(?EO_ShiftWork_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_ShiftWork_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\HMS\Schedule\ShiftWorkTable */
		static public $dataClass = '\MyWebstor\HMS\Schedule\ShiftWorkTable';
	}
}
namespace MyWebstor\HMS\Schedule {
	/**
	 * @method static EO_ShiftWork_Query query()
	 * @method static EO_ShiftWork_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_ShiftWork_Result getById($id)
	 * @method static EO_ShiftWork_Result getList(array $parameters = [])
	 * @method static EO_ShiftWork_Entity getEntity()
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork createObject($setDefaultValues = true)
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection createCollection()
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork wakeUpObject($row)
	 * @method static \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection wakeUpCollection($rows)
	 */
	class ShiftWorkTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_ShiftWork_Result exec()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork fetchObject()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_ShiftWork_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork fetchObject()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection fetchCollection()
	 */
	class EO_ShiftWork_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork createObject($setDefaultValues = true)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection createCollection()
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork wakeUpObject($row)
	 * @method \MyWebstor\HMS\Schedule\EO_ShiftWork_Collection wakeUpCollection($rows)
	 */
	class EO_ShiftWork_Entity extends \Bitrix\Main\ORM\Entity {}
}
/* ORMENTITYANNOTATION:MyWebstor\Hms\Binding\AppointmentContactTable */
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentContact
	 * @see \MyWebstor\Hms\Binding\AppointmentContactTable
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int getAppointmentId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setAppointmentId(\int|\Bitrix\Main\DB\SqlExpression $appointmentId)
	 * @method bool hasAppointmentId()
	 * @method bool isAppointmentIdFilled()
	 * @method bool isAppointmentIdChanged()
	 * @method \int getContactId()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setContactId(\int|\Bitrix\Main\DB\SqlExpression $contactId)
	 * @method bool hasContactId()
	 * @method bool isContactIdFilled()
	 * @method bool isContactIdChanged()
	 * @method \int getSort()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setSort(\int|\Bitrix\Main\DB\SqlExpression $sort)
	 * @method bool hasSort()
	 * @method bool isSortFilled()
	 * @method bool isSortChanged()
	 * @method \int remindActualSort()
	 * @method \int requireSort()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact resetSort()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact unsetSort()
	 * @method \int fillSort()
	 * @method \boolean getIsPrimary()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setIsPrimary(\boolean|\Bitrix\Main\DB\SqlExpression $isPrimary)
	 * @method bool hasIsPrimary()
	 * @method bool isIsPrimaryFilled()
	 * @method bool isIsPrimaryChanged()
	 * @method \boolean remindActualIsPrimary()
	 * @method \boolean requireIsPrimary()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact resetIsPrimary()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact unsetIsPrimary()
	 * @method \boolean fillIsPrimary()
	 * @method \MyWebstor\Hms\EO_Appointment getAppointment()
	 * @method \MyWebstor\Hms\EO_Appointment remindActualAppointment()
	 * @method \MyWebstor\Hms\EO_Appointment requireAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setAppointment(\MyWebstor\Hms\EO_Appointment $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact resetAppointment()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact unsetAppointment()
	 * @method bool hasAppointment()
	 * @method bool isAppointmentFilled()
	 * @method bool isAppointmentChanged()
	 * @method \MyWebstor\Hms\EO_Appointment fillAppointment()
	 * @method \Bitrix\Crm\Contact getContact()
	 * @method \Bitrix\Crm\Contact remindActualContact()
	 * @method \Bitrix\Crm\Contact requireContact()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact setContact(\Bitrix\Crm\Contact $object)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact resetContact()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact unsetContact()
	 * @method bool hasContact()
	 * @method bool isContactFilled()
	 * @method bool isContactChanged()
	 * @method \Bitrix\Crm\Contact fillContact()
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
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact set($fieldName, $value)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact reset($fieldName)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact unset($fieldName)
	 * @method void addTo($fieldName, $value)
	 * @method void removeFrom($fieldName, $value)
	 * @method void removeAll($fieldName)
	 * @method \Bitrix\Main\ORM\Data\Result delete()
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method mixed[] collectValues($valuesType = \Bitrix\Main\ORM\Objectify\Values::ALL, $fieldsMask = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL)
	 * @method \Bitrix\Main\ORM\Data\AddResult|\Bitrix\Main\ORM\Data\UpdateResult|\Bitrix\Main\ORM\Data\Result save()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact wakeUp($data)
	 */
	class EO_AppointmentContact {
		/* @var \MyWebstor\Hms\Binding\AppointmentContactTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentContactTable';
		/**
		 * @param bool|array $setDefaultValues
		 */
		public function __construct($setDefaultValues = true) {}
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * EO_AppointmentContact_Collection
	 *
	 * Custom methods:
	 * ---------------
	 *
	 * @method \int[] getAppointmentIdList()
	 * @method \int[] getContactIdList()
	 * @method \int[] getSortList()
	 * @method \int[] fillSort()
	 * @method \boolean[] getIsPrimaryList()
	 * @method \boolean[] fillIsPrimary()
	 * @method \MyWebstor\Hms\EO_Appointment[] getAppointmentList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection getAppointmentCollection()
	 * @method \MyWebstor\Hms\EO_Appointment_Collection fillAppointment()
	 * @method \Bitrix\Crm\Contact[] getContactList()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection getContactCollection()
	 * @method \Bitrix\Crm\EO_Contact_Collection fillContact()
	 *
	 * Common methods:
	 * ---------------
	 *
	 * @property-read \Bitrix\Main\ORM\Entity $entity
	 * @method void add(\MyWebstor\Hms\Binding\EO_AppointmentContact $object)
	 * @method bool has(\MyWebstor\Hms\Binding\EO_AppointmentContact $object)
	 * @method bool hasByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact getByPrimary($primary)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact[] getAll()
	 * @method bool remove(\MyWebstor\Hms\Binding\EO_AppointmentContact $object)
	 * @method void removeByPrimary($primary)
	 * @method void fill($fields = \Bitrix\Main\ORM\Fields\FieldTypeMask::ALL) flag or array of field names
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection wakeUp($data)
	 * @method \Bitrix\Main\ORM\Data\Result save($ignoreEvents = false)
	 * @method void offsetSet() ArrayAccess
	 * @method void offsetExists() ArrayAccess
	 * @method void offsetUnset() ArrayAccess
	 * @method void offsetGet() ArrayAccess
	 * @method void rewind() Iterator
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact current() Iterator
	 * @method mixed key() Iterator
	 * @method void next() Iterator
	 * @method bool valid() Iterator
	 * @method int count() Countable
	 * @method EO_AppointmentContact_Collection merge(?EO_AppointmentContact_Collection $collection)
	 * @method bool isEmpty()
	 */
	class EO_AppointmentContact_Collection implements \ArrayAccess, \Iterator, \Countable {
		/* @var \MyWebstor\Hms\Binding\AppointmentContactTable */
		static public $dataClass = '\MyWebstor\Hms\Binding\AppointmentContactTable';
	}
}
namespace MyWebstor\Hms\Binding {
	/**
	 * @method static EO_AppointmentContact_Query query()
	 * @method static EO_AppointmentContact_Result getByPrimary($primary, array $parameters = [])
	 * @method static EO_AppointmentContact_Result getById($id)
	 * @method static EO_AppointmentContact_Result getList(array $parameters = [])
	 * @method static EO_AppointmentContact_Entity getEntity()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact createObject($setDefaultValues = true)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection createCollection()
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact wakeUpObject($row)
	 * @method static \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection wakeUpCollection($rows)
	 */
	class AppointmentContactTable extends \Bitrix\Main\ORM\Data\DataManager {}
	/**
	 * Common methods:
	 * ---------------
	 *
	 * @method EO_AppointmentContact_Result exec()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection fetchCollection()
	 *
	 * Custom methods:
	 * ---------------
	 *
	 */
	class EO_AppointmentContact_Query extends \Bitrix\Main\ORM\Query\Query {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact fetchObject()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection fetchCollection()
	 */
	class EO_AppointmentContact_Result extends \Bitrix\Main\ORM\Query\Result {}
	/**
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact createObject($setDefaultValues = true)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection createCollection()
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact wakeUpObject($row)
	 * @method \MyWebstor\Hms\Binding\EO_AppointmentContact_Collection wakeUpCollection($rows)
	 */
	class EO_AppointmentContact_Entity extends \Bitrix\Main\ORM\Entity {}
}