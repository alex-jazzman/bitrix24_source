DROP TABLE IF EXISTS hms_clinic;

DROP TABLE IF EXISTS hms_office;

DROP TABLE IF EXISTS hms_doctor;

DROP TABLE IF EXISTS hms_schedule;

DROP TABLE IF EXISTS hms_schedule_worktime;

DROP TABLE IF EXISTS hms_shift_work;

DROP TABLE IF EXISTS hms_filling_method;

DROP TABLE IF EXISTS hms_appointment;

DROP TABLE IF EXISTS hms_appointment_reserve_doctor;

DROP TABLE IF EXISTS hms_appointment_reserve_office;

DROP TABLE IF EXISTS hms_appointment_reserve_specialization;

DROP TABLE IF EXISTS hms_appointment_reserve_date;

DROP TABLE IF EXISTS hms_appointment_contact;

DROP TABLE IF EXISTS hms_specialization;

DROP TABLE IF EXISTS hms_doctor_specialization;

DROP TABLE IF EXISTS hms_office_specialization;

DROP TABLE IF EXISTS hms_receive;

DROP TABLE IF EXISTS hms_appointment_deal;

DROP TABLE IF EXISTS hms_receive_base;

DROP TABLE IF EXISTS hms_vhi_service_type;

DROP TABLE IF EXISTS hms_vhi_type;

DROP TABLE IF EXISTS hms_vhi_type_vhi_service_type;

DROP TABLE IF EXISTS hms_vhi_storage;

DROP TABLE IF EXISTS hms_vhi;

DROP TABLE IF EXISTS hms_product_row;

DELETE IGNORE
FROM
    b_crm_product_row
WHERE
    OWNER_TYPE = 'HMS';