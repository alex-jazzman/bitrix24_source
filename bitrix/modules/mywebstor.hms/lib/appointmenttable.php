<?

namespace MyWebstor\Hms;

use Bitrix\Crm\ContactTable;
use Bitrix\Crm\PhaseSemantics;
use Bitrix\Crm\ProductRowTable;
use Bitrix\Crm\StatusTable;
use Bitrix\Main\Application;
use Bitrix\Main\Config\Option;
use Bitrix\Main\DB\SqlExpression;
use Bitrix\Main\Entity\DataManager;
use Bitrix\Main\Entity\DatetimeField;
use Bitrix\Main\Entity\ExpressionField;
use Bitrix\Main\Entity\IntegerField;
use Bitrix\Main\Entity\Query\Filter\ConditionTree;
use Bitrix\Main\Entity\Query\Join;
use Bitrix\Main\Entity\ReferenceField;
use Bitrix\Main\Entity\StringField;
use Bitrix\Main\Entity\TextField;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ORM\EntityError;
use Bitrix\Main\ORM\Event;
use Bitrix\Main\ORM\EventResult;
use Bitrix\Main\ORM\Fields\FieldTypeMask;
use Bitrix\Main\ORM\Fields\Relations\CascadePolicy;
use Bitrix\Main\ORM\Fields\Relations\OneToMany;
use Bitrix\Main\ORM\Objectify\State;
use Bitrix\Main\ORM\Objectify\Values;
use Bitrix\Main\SystemException;
use Bitrix\Main\Type\DateTime;
use Bitrix\Main\UserTable;
use MyWebstor\Hms\Binding\AppointmentContactTable;
use MyWebstor\Hms\Binding\AppointmentDealTable;
use MyWebstor\Hms\Binding\AppointmentReserveDateTable;
use MyWebstor\Hms\Binding\AppointmentReserveDoctorTable;
use MyWebstor\Hms\Binding\AppointmentReserveOfficeTable;
use MyWebstor\Hms\Binding\AppointmentReserveSpecializationTable;
use MyWebstor\Hms\Object\Appointment;

Loc::loadMessages(__FILE__);

class AppointmentTable extends DataManager {
    public const STATUS_RESERVE = "RESERVE";

    public static function getTableName() {
        return 'hms_appointment';
    }

    public static function getObjectClass() {
        return Appointment::class;
    }

    public static function getMap($fieldName = null) {
        $map = array(
            'ID' => (new IntegerField('ID'))
                ->configurePrimary()
                ->configureAutocomplete()
                ->configureDefaultValue(0)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_ID_FIELD')),
            'XML_ID' => (new StringField('XML_ID'))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_XML_ID_FIELD')),
            'RESERVE_XML_ID' => (new StringField('RESERVE_XML_ID'))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_RESERVE_XML_ID_FIELD')),
            'DATE_CREATE' => (new DatetimeField('DATE_CREATE'))
                ->configureDefaultValue(function () {
                    return new DateTime();
                })
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_DATE_CREATE_FIELD')),
            'TITLE' => (new TextField('TITLE'))
                ->configureRequired()
                ->configureSize(255)
                ->configureDefaultValue(array(__CLASS__, 'getDefaultTitle'))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_TITLE_FIELD')),
            'REAL_STATUS_ID' => (new StringField('REAL_STATUS_ID'))
                ->configureColumnName('STATUS_ID')
                ->configureSize(50)
                ->configureDefaultValue(function () {
                    $statusList = \CCrmStatus::GetStatusList('HMS_APPOINTMENT_STATUS');
                    unset($statusList["RESERVE"]);
                    return !empty($statusList) ? key($statusList) : null;
                })
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_REAL_STATUS_ID_FIELD')),
            'SOURCE_TYPE' => (new StringField('SOURCE_TYPE'))
                ->configureSize(3)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_SOURCE_TYPE_FIELD')),
            'SOURCE_ID' => (new IntegerField('SOURCE_ID'))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_SOURCE_ID_FIELD')),
            'CLINIC_ID' => (new IntegerField('CLINIC_ID'))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_CLINIC_ID_FIELD')),
            'DOCTOR_ID' => (new IntegerField('DOCTOR_ID'))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_DOCTOR_ID_FIELD')),
            'OFFICE_ID' => (new IntegerField('OFFICE_ID'))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_OFFICE_ID_FIELD')),
            'SPECIALIZATION_ID' => (new IntegerField('SPECIALIZATION_ID'))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_SPECIALIZATION_ID_FIELD')),
            'DATE_FROM' => (new DatetimeField('DATE_FROM'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_DATE_FROM_FIELD')),
            'DURATION' => (new IntegerField('DURATION'))
                ->configureRequired()
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_DURATION_FIELD')),
            'COMMENTS' => (new TextField('COMMENTS'))
                ->addSaveDataModifier(array(__CLASS__, "normalizeComment"))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_COMMENTS_FIELD')),
            'ASSIGNED_BY_ID' => (new IntegerField('ASSIGNED_BY_ID'))
                ->configureRequired()
                ->configureDefaultValue(function () {
                    /**
                     * @var \CUser $USER
                     */
                    global $USER;
                    return $USER->GetID();
                })
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_ASSIGNED_BY_ID_FIELD')),

            'DATE_TO' => (new ExpressionField(
                'DATE_TO',
                'IF(%s != \'' . self::STATUS_RESERVE . '\', DATE_ADD(%s, INTERVAL %s MINUTE), NULL)',
                array(
                    'STATUS_ID',
                    'DATE_FROM',
                    'DURATION'
                )
            ))
                ->configureValueType(DatetimeField::class)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_DATE_TO_FIELD')),
            'STATUS_ID' => (new ExpressionField(
                'STATUS_ID',
                join(array(
                    '(CASE WHEN (',
                    StatusTable::query()
                        ->setCustomBaseTableAlias('subquery_status_exists')
                        ->setSelect(array(
                            'STATUS_ID'
                        ))
                        ->setFilter(array(
                            "ENTITY_ID" => "HMS_APPOINTMENT_STATUS",
                            "STATUS_ID" => new SqlExpression("%s")
                        ))
                        ->setLimit(1)
                        ->getQuery(),
                    ') IS NOT NULL THEN UPPER(%s) ELSE (',
                    StatusTable::query()
                        ->setCustomBaseTableAlias('subquery_status_default')
                        ->setSelect(array(
                            'STATUS_ID'
                        ))
                        ->setFilter(array(
                            "ENTITY_ID" => "HMS_APPOINTMENT_STATUS"
                        ))
                        ->setOrder(array(
                            'SORT' => 'ASC'
                        ))
                        ->setLimit(1)
                        ->getQuery(),
                    ') END)',
                )),
                array(
                    'REAL_STATUS_ID',
                    'REAL_STATUS_ID'
                )
            ))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_STATUS_ID_FIELD')),
            'CLINIC' => (new ReferenceField(
                'CLINIC',
                ClinicTable::class,
                Join::on('this.CLINIC_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_CLINIC_FIELD')),
            'DOCTOR' => (new ReferenceField(
                'DOCTOR',
                DoctorTable::class,
                Join::on('this.DOCTOR_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_DOCTOR_FIELD')),
            'OFFICE' => (new ReferenceField(
                'OFFICE',
                OfficeTable::class,
                Join::on('this.OFFICE_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_OFFICE_FIELD')),
            'SPECIALIZATION' => (new ReferenceField(
                'SPECIALIZATION',
                SpecializationTable::class,
                Join::on('this.SPECIALIZATION_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_SPECIALIZATION_FIELD')),
            'STATUS' => (new ReferenceField(
                'STATUS',
                StatusTable::class,
                Join::on('this.STATUS_ID', 'ref.STATUS_ID')
                    ->where('ref.ENTITY_ID', 'HMS_APPOINTMENT_STATUS')
            ))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_STATUS_FIELD')),
            'CONTACT_ID' => (new ExpressionField(
                'CONTACT_ID',
                '(' . AppointmentContactTable::query()
                    ->setCustomBaseTableAlias('subquery_appointment_contact')
                    ->setSelect(array(
                        'CONTACT_ID'
                    ))
                    ->setFilter(array(
                        'APPOINTMENT_ID' => new SqlExpression("%s"),
                    ))
                    ->setOrder(array(
                        'IS_PRIMARY' => 'DESC',
                        'SORT' => 'DESC'
                    ))
                    ->setLimit(1)
                    ->getQuery() . ')',
                array(
                    'ID'
                )
            ))
                ->configureValueType(IntegerField::class)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_CONTACT_ID_FIELD')),
            'CONTACT' => (new ReferenceField(
                'CONTACT',
                ContactTable::class,
                Join::on('this.CONTACT_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_CONTACT_FIELD')),
            'ASSIGNED_BY' => (new ReferenceField(
                'ASSIGNED_BY',
                UserTable::class,
                Join::on('this.ASSIGNED_BY_ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_ASSIGNED_BY_FIELD')),
            'CONTACT_BINDINGS' => (new OneToMany(
                'CONTACT_BINDINGS',
                AppointmentContactTable::class,
                'APPOINTMENT'
            ))
                ->configureCascadeDeletePolicy(CascadePolicy::FOLLOW)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_CONTACT_BINDINGS_FIELD')),
            'PRODUCT_ROWS' => (new OneToMany(
                'PRODUCT_ROWS',
                ProductRowTable::class,
                'APPOINTMENT_OWNER'
            ))
                ->configureCascadeDeletePolicy(CascadePolicy::FOLLOW)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_PRODUCT_ROWS_FIELD')),
            'RESERVE_DOCTOR' => (new OneToMany(
                'RESERVE_DOCTOR',
                AppointmentReserveDoctorTable::class,
                'APPOINTMENT'
            ))
                ->configureCascadeDeletePolicy(CascadePolicy::FOLLOW)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_RESERVE_DOCTOR_FIELD')),
            'RESERVE_OFFICE' => (new OneToMany(
                'RESERVE_OFFICE',
                AppointmentReserveOfficeTable::class,
                'APPOINTMENT'
            ))
                ->configureCascadeDeletePolicy(CascadePolicy::FOLLOW)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_RESERVE_OFFICE_FIELD')),
            'RESERVE_SPECIALIZATION' => (new OneToMany(
                'RESERVE_SPECIALIZATION',
                AppointmentReserveSpecializationTable::class,
                'APPOINTMENT'
            ))
                ->configureCascadeDeletePolicy(CascadePolicy::FOLLOW)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_RESERVE_SPECIALIZATION_FIELD')),
            'RESERVE_DATE' => (new OneToMany(
                'RESERVE_DATE',
                AppointmentReserveDateTable::class,
                'APPOINTMENT'
            ))
                ->configureCascadeDeletePolicy(CascadePolicy::FOLLOW)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_RESERVE_DATE_FIELD')),
            'RECEIVE' => (new ReferenceField(
                'RECEIVE',
                ReceiveTable::class,
                Join::on('this.ID', 'ref.ID')
            ))
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_RECEIVE_FIELD')),
            'DEALS' => (new OneToMany(
                'DEALS',
                AppointmentDealTable::class,
                'APPOINTMENT'
            ))
                ->configureCascadeDeletePolicy(CascadePolicy::FOLLOW)
                ->configureTitle(Loc::getMessage('HMS_APPOINTMENT_ENTITY_DEALS_FIELD')),

        );
        if (!$fieldName) return $map;

        return $map[$fieldName];
    }

    /**
     * @param Appointment $row
     */
    public static function getDefaultTitle($row) {
        $title = trim($row->getTitle());

        if (!$title) {
            $appointmentID = $row->getId();

            if (!$appointmentID) {
                $dbConnection = Application::getConnection();
                $dbConnection->query("ANALYZE TABLE `" . static::getTableName() . "`"); // Fix MySQL 8 AUTO_INCREMENT updating
                $autoIncrementQuery = $dbConnection->query("SELECT `AUTO_INCREMENT` AS 'NEXT_APPOINTMENT_ID' FROM `INFORMATION_SCHEMA`.`TABLES` WHERE `TABLE_NAME` = '" . static::getTableName() . "' AND `TABLE_SCHEMA` = '" . $dbConnection->getDatabase() . "'");
                if (
                    !($autoIncrement = $autoIncrementQuery->fetch())
                    || !($appointmentID = $autoIncrement["NEXT_APPOINTMENT_ID"])
                )
                    throw new SystemException("Unexpected error!");
            }

            $title = Loc::getMessage("HMS_APPOINTMENT_ENTITY_DEFAULT_TITLE", array("#APPOINTMENT_ID#" => $appointmentID));
        }

        return $title;
    }

    public static function onBeforeAdd(Event $event) {
        /** @var Appointment $object */
        $object = $event->getParameter("object");

        $event->addResult(static::checkDateAndDuration($object));
        $event->addResult(static::fillSpecializationByDoctor($object));
    }

    public static function onBeforeUpdate(Event $event) {
        /** @var Appointment $object */
        $object = $event->getParameter("object");

        $event->addResult(static::checkDateAndDuration($object));
        $event->addResult(static::fillSpecializationByDoctor($object));
    }

    /**
     * @param Appointment $appointmentObject
     */
    protected static function checkDateAndDuration($appointmentObject) {
        $result = new EventResult;

        if ($appointmentObject->getRealStatusId() === static::STATUS_RESERVE)
            return $result;

        $appointment = $appointmentObject->collectValues(
            Values::CURRENT,
            FieldTypeMask::FLAT
        );

        /** @var DateTime $dateFrom */
        $dateFrom = $appointment["DATE_FROM"];
        if (isset($dateFrom)) {
            $dateFrom->setTime(
                (int)$dateFrom->format("G"),
                (int)$dateFrom->format("i"),
                0,
                0
            );

            if ((int)$dateFrom->format("i") % 5 === 0) {
                $result->modifyFields(array(
                    "DATE_FROM" => clone $dateFrom
                ));
            } else {
                $result->addError(
                    new EntityError(Loc::getMessage("HMS_APPOINTMENT_DATE_FROM_ERROR_BASE_STEP"))
                );
                return $result;
            }
        }

        /** @var int $duration */
        $duration = $appointment["DURATION"];
        if (isset($duration) && is_int($duration)) {
            if ($duration <= 0) {
                $result->addError(
                    new EntityError(Loc::getMessage("HMS_APPOINTMENT_DATE_FROM_ERROR_ZERO_DURATION"))
                );
            }
            if ($duration % 5 !== 0) {
                $result->addError(
                    new EntityError(Loc::getMessage("HMS_APPOINTMENT_DATE_FROM_ERROR_BASE_DURATION"))
                );
                return $result;
            }
        }

        $isCheckAppointmentIntersect = Option::get("mywebstor.hms", "hms_check_appointment_intersect", "N") === "Y";
        if (
            (empty($dateFrom) && empty($duration)) ||
            !$isCheckAppointmentIntersect ||
            $appointmentObject->customData->get("IS_INTEGRATION") === true
        ) return $result;

        if (empty($dateFrom))
            $dateFrom = $appointmentObject->fillDateFrom();
        if (empty($duration))
            $duration = $appointmentObject->fillDuration();

        $dateTo = clone $dateFrom;
        $dateTo->setTime(
            (int)$dateTo->format("G"),
            (int)$dateTo->format("i") + (int)$duration,
            0,
            0
        );

        $intersectAppointmentQuery = static::query();
        $intersectAppointmentQuery
            ->where("DATE_TO", ">", $dateFrom)
            ->where("DATE_FROM", "<", $dateTo)
            ->where("STATUS.SEMANTICS", PhaseSemantics::PROCESS)
            ->whereNot("STATUS_ID", static::STATUS_RESERVE);

        $doctorOfficeCondition = new ConditionTree;
        $doctorOfficeCondition
            ->logic(ConditionTree::LOGIC_OR);

        if (($doctorID = $appointmentObject->fillDoctorId()))
            $doctorOfficeCondition
                ->where("DOCTOR_ID", $doctorID);
        if (($officeID = $appointmentObject->fillOfficeId()))
            $doctorOfficeCondition
                ->where("OFFICE_ID", $officeID);

        if (!in_array($appointmentObject->state, array(State::RAW, State::DELETED)))
            $intersectAppointmentQuery
                ->whereNot("ID", $appointmentObject->getId());

        $intersectAppointmentQuery
            ->where($doctorOfficeCondition)
            ->setSelect(array(
                "ID",
                "TITLE",
                "DATE_FROM",
                "DATE_TO"
            ));

        $intersectAppointmentCollection = $intersectAppointmentQuery->fetchCollection();
        foreach ($intersectAppointmentCollection as $intersectAppointmentObject) {
            $result->addError(
                new EntityError(
                    Loc::getMessage("HMS_APPOINTMENT_ERROR_INTERSECT_APPOINTMENT", array(
                        "#APPOINTMENT_TITLE#" => $intersectAppointmentObject->getTitle(),
                        "#DATE_FROM#" => $intersectAppointmentObject->getDateFrom()->disableUserTime(),
                        "#DATE_TO#" => $intersectAppointmentObject->getDateTo()->disableUserTime(),
                    ))
                )
            );
        }

        return $result;
    }

    /**
     * @param Appointment $appointmentObject
     */
    protected static function fillSpecializationByDoctor($appointmentObject) {
        $result = new EventResult;

        if (
            ($appointmentObject->state === State::RAW && $appointmentObject->getSpecializationId())
            || (!in_array($appointmentObject->state, array(State::RAW, State::DELETED)) && $appointmentObject->getSpecializationId())
            || !$appointmentObject->getDoctorId()
        ) return $result;

        $doctorObject = DoctorTable::getById($appointmentObject->getDoctorId())->fetchObject();
        if (!$doctorObject) return $result;

        $specializationCollection = $doctorObject->fillSpecialization();
        if ($specializationCollection->count() !== 1) return $result;

        $specializationObject = $specializationCollection->current();

        $result->modifyFields(array(
            "SPECIALIZATION_ID" => $specializationObject->getId()
        ));

        return $result;
    }

    public static function normalizeComment($commentContent) {
        $commentContent = (string)str_replace('&#39;', "'", (string)$commentContent);

        $html = $commentContent;

        $html = strval($html);
        if ($html === '') {
            return '';
        }

        $allow = [
            'ANCHOR' => 'Y',
            'BIU' => 'Y',
            'IMG' => 'Y',
            'QUOTE' => 'Y',
            'CODE' => 'N',
            'FONT' => 'Y',
            'LIST' => 'Y',
            'SMILES' => 'Y',
            'NL2BR' => 'Y',
            'VIDEO' => 'Y',
            'TABLE' => 'Y',
            'ALIGN' => 'Y',
            'P' => 'Y',
            'CUT_ANCHOR' => 'Y',
        ];

        $result = (new \CTextParser())->convertHTMLToBB($html, $allow);

        $bb = htmlspecialcharsbx(strip_tags(htmlspecialcharsback($result)));

        $bb = (string)$bb;
        if (empty($bb)) {
            return '';
        }

        static $whitelist = [
            'b',
            'i',
            'u',
            's',
            'list',
            '\*',
            'user',
            'img',
            'disk file id',
            'url',
        ];

        $pattern =
            '#\[(\/?)(?!\b'
            . implode('\b|\b', array_diff($whitelist, ['user', 'disk file id']))
            . '\b)\w+\b[^\]]*\]#i'
            . BX_UTF_PCRE_MODIFIER;

        $result = preg_replace($pattern, '', $bb);

        return (string)str_replace(
            ['&amp;#91;', '&amp;#93;'],
            ['&#91;', '&#93;'],
            $result
        );
    }
}
