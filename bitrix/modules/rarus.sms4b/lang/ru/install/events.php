<?php
$MESS['SMS4B_MAIN_ADMIN_SEND_NAME'] = 'Отправка сообщения администратору сайта';
$MESS['SMS4B_MAIN_ADMIN_SEND_DESC'] = '#SITE_NAME# - Название сайта (устанавливается в настройках)';
$MESS['SMS4B_MAIN_ADMIN_SEND_SUBJECT'] = 'Внимание! Не удалось подключиться к сервису SMS4B';
$MESS['SMS4B_MAIN_ADMIN_SEND_MESSAGE'] = 'Сервис SMS4B на сайте #SITE_NAME# недоступен. Отправка СМС не возможна.';

$MESS['SMS4B_MAIN_USER_LIST_CUSTOM_EVENT_NAME'] = 'Пользовательские шаблоны для списка пользователей';
$MESS['SMS4B_MAIN_USER_LIST_CUSTOM_EVENT_DESC'] = '#ID# - ID пользователя
#LOGIN# - Логин пользователя
#NAME# - Имя пользователя
#LAST_NAME# - Фамилия пользователя
#EMAIL# - Email пользователя
#PHONE_TO# - Телефон пользователя';
$MESS['SMS4B_MAIN_USER_LIST_CUSTOM_EVENT_SUBJECT'] = 'Новый пользовательский шаблон';
$MESS['SMS4B_MAIN_USER_LIST_CUSTOM_EVENT_MESSAGE'] = 'Пример пользовательского шаблона';

$MESS['SMS4B_MAIN_TASK_ADD_NAME'] = 'Добавление задачи';
$MESS['SMS4B_MAIN_TASK_ADD_DESC'] = '#TASK# - Название задачи
#DESCRIPTION# - Описание задачи
#DEADLINE# - Крайний срок
#PRIORITY# - Приоритет
#RESPONSIBLE_ID# - Идентификатор ответственного
#TIME_ESTIMATE# - Плановые трудозатраты (секунд)
#CREATED_BY# - Идентификатор постановщика
#STATUS# - Мета-статус задачи';
$MESS['SMS4B_MAIN_TASK_ADD_SUBJECT'] = 'Добавлена новая задача';
$MESS['SMS4B_MAIN_TASK_ADD_MESSAGE'] = 'Добавлена новая задача #TASK#';

$MESS['SMS4B_MAIN_TASK_UPDATE_NAME'] = 'Редактирование задачи';
$MESS['SMS4B_MAIN_TASK_UPDATE_DESC'] = '#TASK# - Название задачи
#DESCRIPTION# - Описание задачи
#DEADLINE# - Крайний срок
#PRIORITY# - Приоритет
#RESPONSIBLE_ID# - Идентификатор ответственного
#TIME_ESTIMATE# - Плановые трудозатраты (секунд)
#CREATED_BY# - Идентификатор постановщика';
$MESS['SMS4B_MAIN_TASK_UPDATE_SUBJECT'] = 'Внесены изменения в задачу';
$MESS['SMS4B_MAIN_TASK_UPDATE_MESSAGE'] = 'Задача #TASK# изменена';

$MESS['SMS4B_MAIN_TASK_DELETE_NAME'] = 'Удаление задачи';
$MESS['SMS4B_MAIN_TASK_DELETE_DESC'] = '#TASK# - Название задачи
#DESCRIPTION# - Описание задачи
#DEADLINE# - Крайний срок
#PRIORITY# - Приоритет
#RESPONSIBLE_ID# - Идентификатор ответственного
#TIME_ESTIMATE# - Плановые трудозатраты (секунд)
#CREATED_BY# - Идентификатор постановщика
#STATUS# - Мета-статус задачи';
$MESS['SMS4B_MAIN_TASK_DELETE_SUBJECT'] = 'Задача удалена';
$MESS['SMS4B_MAIN_TASK_DELETE_MESSAGE'] = 'Удалена задача #TASK#';

$MESS['SMS4B_MAIN_ADMIN_TASK_DELETE_NAME'] = 'Удаление задачи';
$MESS['SMS4B_MAIN_ADMIN_TASK_DELETE_DESC'] = '#TASK# - Название задачи';
$MESS['SMS4B_MAIN_ADMIN_TASK_DELETE_SUBJECT'] = 'Задача удалена';
$MESS['SMS4B_MAIN_ADMIN_TASK_DELETE_MESSAGE'] = 'Удалена задача #TASK#';

$MESS['SMS4B_MAIN_ADMIN_TASK_ADD_NAME'] = 'Добавление задачи';
$MESS['SMS4B_MAIN_ADMIN_TASK_ADD_DESC'] = '#TASK# - Название задачи';
$MESS['SMS4B_MAIN_ADMIN_TASK_ADD_SUBJECT'] = 'Добавлена новая задача';
$MESS['SMS4B_MAIN_ADMIN_TASK_ADD_MESSAGE'] = 'Добавлена новая задача #TASK#';

$MESS['SMS4B_MAIN_ADMIN_TASK_UPDATE_NAME'] = 'Редактирование задачи';
$MESS['SMS4B_MAIN_ADMIN_TASK_UPDATE_DESC'] = '#TASK# - Название задачи';
$MESS['SMS4B_MAIN_ADMIN_TASK_UPDATE_SUBJECT'] = 'Внесены изменения в задачу';
$MESS['SMS4B_MAIN_ADMIN_TASK_UPDATE_MESSAGE'] = 'Задача #TASK# изменена';

$MESS['SMS4B_MAIN_ADMIN_TASK_DELETE_NAME'] = 'Удаление задачи';
$MESS['SMS4B_MAIN_ADMIN_TASK_DELETE_DESC'] = '#TASK# - Название задачи';
$MESS['SMS4B_MAIN_ADMIN_TASK_DELETE_SUBJECT'] = 'Задача удалена';
$MESS['SMS4B_MAIN_ADMIN_TASK_DELETE_MESSAGE'] = 'Удалена задача #TASK#';

$MESS['SMS4B_MAIN_INTERCEPT_DEADLINE_NAME'] = 'Наступил дедлайн по задаче';
$MESS['SMS4B_MAIN_INTERCEPT_DEADLINE_SUBJECT'] = 'Наступил дедлайн по задаче';
$MESS['SMS4B_MAIN_INTERCEPT_DEADLINE_MESSAGE'] = "По задаче '#TITLE#' наступил дедлайн";
$MESS['SMS4B_MAIN_INTERCEPT_DEADLINE_DESC'] = '#ID# - Id задачи
  #TITLE# - Название задачи
  #DESCRIPTION# - Описание задачи
  #PRIORITY# - Приоритет
  #STATUS# - Мета-статус задачи
  #RESPONSIBLE_ID# - Идентификатор ответственного
  #DATE_START# - Дата начала выполнения задачи
  #START_DATE_PLAN# - Плановая дата начала
  #END_DATE_PLAN# - Плановая дата завершения
  #DURATION_PLAN# - Планируемая длительность в часах или днях
  #DURATION_TYPE# - Тип единицы измерения в планируемой длительности: days или hours
  #DEADLINE# - Дедлайн
  #CREATED_BY# - Идентификатор постановщика
  #CREATED_DATE# - Дата создания задачи
  #CHANGED_BY# - Пользователь, изменивший задачу в последний раз (идентификатор пользователя)
  #CHANGED_DATE# - Дата последнего изменения задачи
  #STATUS_CHANGED_BY# - Пользователь, изменивший статус задачи (идентификатор пользователя)
  #STATUS_CHANGED_DATE# - Дата смены статуса
  #CLOSED_BY# - Кем была завершена задача
  #CLOSED_DATE# - Дата завершения задачи
  #PARENT_ID# - Идентификатор родительской задачи
  #GROUP_ID# - Идентификатор рабочей группы
  #MARK# - Оценка по задаче
  #ALLOW_TIME_TRACKING# - Сейчас выполняется?
  #TIME_ESTIMATE# - Плановые трудозатраты
  #ZOMBIE# - Задача отложена?
';

$MESS['SMS4B_MAIN_NEW_COMM_FROM_TASK_NAME'] = 'Новый комментарий';
$MESS['SMS4B_MAIN_NEW_COMM_FROM_TASK_SUBJECT'] = 'Новый комментарий к задаче';
$MESS['SMS4B_MAIN_NEW_COMM_FROM_TASK_MESSAGE'] = "Новый комментарий к задаче '#TITLE#' - #COMMENT_TEXT#";
$MESS['SMS4B_MAIN_NEW_COMM_FROM_TASK_DESC'] = '#ID# - Id задачи
  #TITLE# - Название задачи
  #DESCRIPTION# - Описание задачи
  #PRIORITY# - Приоритет
  #STATUS# - Мета-статус задачи
  #RESPONSIBLE_ID# - Идентификатор ответственного
  #DATE_START# - Дата начала выполнения задачи
  #START_DATE_PLAN# - Плановая дата начала
  #END_DATE_PLAN# - Плановая дата завершения
  #DURATION_PLAN# - Планируемая длительность в часах или днях
  #DURATION_TYPE# - Тип единицы измерения в планируемой длительности: days или hours
  #DEADLINE# - Дедлайн
  #CREATED_BY# - Идентификатор постановщика
  #CREATED_DATE# - Дата создания задачи
  #CHANGED_BY# - Пользователь, изменивший задачу в последний раз (идентификатор пользователя)
  #CHANGED_DATE# - Дата последнего изменения задачи
  #STATUS_CHANGED_BY# - Пользователь, изменивший статус задачи (идентификатор пользователя)
  #STATUS_CHANGED_DATE# - Дата смены статуса
  #CLOSED_BY# - Кем была завершена задача
  #CLOSED_DATE# - Дата завершения задачи
  #PARENT_ID# - Идентификатор родительской задачи
  #GROUP_ID# - Идентификатор рабочей группы
  #MARK# - Оценка по задаче
  #ALLOW_TIME_TRACKING# - Сейчас выполняется?
  #TIME_ESTIMATE# - Плановые трудозатраты
  #ZOMBIE# - Задача отложена?
  #COMMENT_TEXT# - Текст комментария
';

$MESS['SMS4B_MAIN_SALE_NEW_ORDER_NAME'] = 'Новый заказ';
$MESS['SMS4B_MAIN_SALE_NEW_ORDER_DESC'] = '#ORDER_ID# - код заказа
#ORDER_DATE# - дата заказа
#ORDER_USER# - заказчик
#PRICE# - сумма заказа
#PHONE_TO# - телефон заказчика
#ORDER_LIST# - состав заказа
#SALE_PHONE# - телефон отдела продаж';

$MESS['SMS4B_MAIN_SALE_NEW_ORDER_SUBJECT'] = 'Новый заказ';
$MESS['SMS4B_MAIN_SALE_NEW_ORDER_MESSAGE'] = 'Ваш заказ N#ORDER_ID# принят
Стоимость: #PRICE#';

$MESS['SMS4B_MAIN_SALE_ORDER_CANCEL_NAME'] = 'Отмена заказа';
$MESS['SMS4B_MAIN_SALE_ORDER_CANCEL_DESC'] = '#ORDER_ID# - код заказа
#ORDER_DATE# - дата заказа
#PHONE_TO# - телефон заказчика
#ORDER_CANCEL_DESCRIPTION# - причина отмены
#SALE_PHONE# - телефон отдела продаж';
$MESS['SMS4B_MAIN_SALE_ORDER_CANCEL_SUBJECT'] = 'Отмена заказа';
$MESS['SMS4B_MAIN_SALE_ORDER_CANCEL_MESSAGE'] = 'Заказ N#ORDER_ID# отменен
#ORDER_CANCEL_DESCRIPTION#';

$MESS['SMS4B_MAIN_SALE_ORDER_PAID_NAME'] = 'Заказ оплачен';
$MESS['SMS4B_MAIN_SALE_ORDER_PAID_DESC'] = '#ORDER_ID# - код заказа
#ORDER_DATE# - дата заказа
#PHONE_TO# - телефон заказчика
#SALE_PHONE# - телефон отдела продаж';
$MESS['SMS4B_MAIN_SALE_ORDER_PAID_SUBJECT'] = 'Заказ оплачен';
$MESS['SMS4B_MAIN_SALE_ORDER_PAID_MESSAGE'] = 'Заказ N#ORDER_ID# оплачен';

$MESS['SMS4B_MAIN_SALE_ORDER_DELIVERY_NAME'] = 'Доставка заказа разрешена';
$MESS['SMS4B_MAIN_SALE_ORDER_DELIVERY_DESC'] = '#ORDER_ID# - код заказа
#ORDER_DATE# - дата заказа
#PHONE_TO# - телефон заказчика
#SALE_PHONE# - телефон отдела продаж';
$MESS['SMS4B_MAIN_SALE_ORDER_DELIVERY_SUBJECT'] = 'Доставка заказа разрешена';
$MESS['SMS4B_MAIN_SALE_ORDER_DELIVERY_MESSAGE'] = 'Доставка заказа N#ORDER_ID#  разрешена';

$MESS['SMS4B_MAIN_SUBSCRIBE_CONFIRM_NAME'] = 'Подтверждение подписки';
$MESS['SMS4B_MAIN_SUBSCRIBE_CONFIRM_DESC'] = '#ID# - идентификатор подписки
#PHONE_TO# - телефон подписки
#CONFIRM_CODE# - код подтверждения
#SUBSCR_SECTION# - раздел с страницей редактирования подписки
#USER_NAME# - имя подписчика
#DATE_SUBSCR# - дата добавления/изменения адреса';
$MESS['SMS4B_MAIN_SUBSCRIBE_CONFIRM_SUBJECT'] = 'Подтверждение подписки';
$MESS['SMS4B_MAIN_SUBSCRIBE_CONFIRM_MESSAGE'] = 'Информация о подписке:
Телефон #PHONE#
Дата добавления/изменения #DATE_SUBSCR#
Код подтверждения: #CONFIRM_CODE#';

$MESS['SMS4B_MAIN_ORDER_STATUS_DESC'] = '#ORDER_ID# - Код заказа
#ORDER_DATE# - Дата заказа
#ORDER_STATUS# - Статус заказа
#PHONE_TO# - Телефон пользователя
#ORDER_DESCRIPTION# - Описание статуса заказа';

$MESS['SMS4B_MAIN_SHIPMENT_STATUS_DESC'] = '#ID# - Код отгрузки
#ORDER_ID# - Код заказа
#DATE_INSERT# - Дата создания отгрузки
#SHIPMENT_ID# - ID статуса отгрузки
#SHIPMENT_STATUS# - Название статуса отгрузки
#PRICE_DELIVERY# - Сумма доставки
#CURRENCY# - Валюта суммы доставки
#DELIVERY_NAME# - Вид доставки
#RESPONSIBLE_ID# - ID ответственного';

$MESS['SMS4B_MAIN_ORDER_STATUS_SUBJ'] = 'Изменение статуса заказа на ';
$MESS['SMS4B_MAIN_SHIPMENT_STATUS_SUBJ'] = 'Изменение статуса отгрузки на ';
$MESS['SMS4B_MAIN_ORDER_STATUS_MESS'] = 'Новый статус заказа N#ORDER_ID#: #ORDER_STATUS#';
$MESS['SMS4B_MAIN_SHIPMENT_STATUS_MESS'] = 'Новый статус отгрузки заказа N#ORDER_ID#: #SHIPMENT_STATUS#';

$MESS['SMS4B_MAIN_CHANGING_ORDER_STATUS_TO'] = 'Изменение статуса заказа на ';
$MESS['SMS4B_MAIN_CHANGING_SHIPMENT_STATUS_TO'] = 'Изменение статуса отгрузки на ';

$MESS['SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_NAME'] = 'Новый тикет';
$MESS['SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_DESC'] = '#ID# - номер обращения
#PHONE_TO# - телефон поддержки
#CRITICAL# - критичность
#DATE_TICKET# - дата обновления';
$MESS['SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_SUBJECT'] = 'Новый тикет';
$MESS['SMS4B_MAIN_TICKET_NEW_FOR_TECHSUPPORT_MESSAGE'] = 'Информация о тикете:
Номер #ID#
Дата обновления #DATE_TICKET#
Критичность: #CRITICAL#';

$MESS['SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_NAME'] = 'Изменен тикет';
$MESS['SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_DESC'] = '#ID# - номер обращения
#PHONE_TO# - телефон поддержки
#CRITICAL# - критичность
#DATE_TICKET# - дата добавления';
$MESS['SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_SUBJECT'] = 'Изменен тикет';
$MESS['SMS4B_MAIN_TICKET_CHANGE_FOR_TECHSUPPORT_MESSAGE'] = 'Инфо о тикете:
Номер #ID#
Дата добавления #DATE_TICKET#
Критичность: #CRITICAL#
Изменения: #WHAT_CHANGE#';

//Для событий лидов
$MESS['SMS4B_MAIN_ADD_LEAD_CRM_NAME'] = 'Добавление лида';
$MESS['SMS4B_MAIN_ADD_LEAD_CRM_SUBJECT'] = 'Добавление лида';
$MESS['SMS4B_MAIN_ADD_LEAD_CRM_MESSAGE'] = 'Добавлен новый лид #TITLE#';
$MESS['SMS4B_MAIN_ADD_LEAD_CRM_DESC'] = '#ID# - ID лида
#TITLE# - Название лида
#STATUS_ID# - Статус лида
#PRODUCT_ID# - ID товара
#OPPORTUNITY# - Возможная сумма сделки
#CURRENCY_ID# - Валюта
#COMMENTS# - Комментарий
#NAME# - Имя
#LAST_NAME# - Фамилия
#SECOND_NAME# - Отчество
#COMPANY_TITLE# - Компания
#POST# - Должность
#ADDRESS# - Улица, дом, корпус, строение
#SOURCE_ID# - Источник
#SOURCE_DESCRIPTION# - Дополнительно об источнике
#ADDRESS_2# - Квартира / офис
#ADDRESS_CITY# - Город
#ADDRESS_POSTAL_CODE# - Почтовый индекс
#ADDRESS_REGION# - Район
#ADDRESS_PROVINCE# - Область
#ADDRESS_COUNTRY# - Страна
#ADDRESS_COUNTRY_CODE# - Код
#DATE_CREATE# - Дата создания
#DATE_MODIFY# - Дата изменения
#ASSIGNED_BY_ID# - ID ответственного
#CREATED_BY_ID# - ID создавшего
#MODIFY_BY_ID# - ID изменившего
#PRODUCTS# - Список товаров
#~BIRTHDATE# - День рождения';

$MESS['SMS4B_MAIN_UPDATE_LEAD_CRM_NAME'] = 'Редактирование лида';
$MESS['SMS4B_MAIN_UPDATE_LEAD_CRM_SUBJECT'] = 'Редактирование лида';
$MESS['SMS4B_MAIN_UPDATE_LEAD_CRM_MESSAGE'] = 'Редактирование лида #TITLE#';
$MESS['SMS4B_MAIN_UPDATE_LEAD_CRM_DESC'] = '#ID# - ID лида
#TITLE# - Название лида
#STATUS_ID# - Статус лида
#PRODUCT_ID# - ID товара
#OPPORTUNITY# - Возможная сумма сделки
#CURRENCY_ID# - Валюта
#COMMENTS# - Комментарий
#NAME# - Имя
#LAST_NAME# - Фамилия
#SECOND_NAME# - Отчество
#COMPANY_TITLE# - Компания
#POST# - Должность
#ADDRESS# - Улица, дом, корпус, строение
#SOURCE_ID# - Источник
#SOURCE_DESCRIPTION# - Дополнительно об источнике
#ADDRESS_2# - Квартира / офис
#ADDRESS_CITY# - Город
#ADDRESS_POSTAL_CODE# - Почтовый индекс
#ADDRESS_REGION# - Район
#ADDRESS_PROVINCE# - Область
#ADDRESS_COUNTRY# - Страна
#ADDRESS_COUNTRY_CODE# - Код
#DATE_CREATE# - Дата создания
#DATE_MODIFY# - Дата изменения
#ASSIGNED_BY_ID# - ID ответственного
#CREATED_BY_ID# - ID создавшего
#MODIFY_BY_ID# - ID изменившего
#PRODUCTS# - Список товаров
#~BIRTHDATE# - День рождения';

$MESS['SMS4B_MAIN_DELETE_LEAD_CRM_NAME'] = 'Удаление лида';
$MESS['SMS4B_MAIN_DELETE_LEAD_CRM_SUBJECT'] = 'Удаление лида';
$MESS['SMS4B_MAIN_DELETE_LEAD_CRM_MESSAGE'] = 'Удаление лида #TITLE#';
$MESS['SMS4B_MAIN_DELETE_LEAD_CRM_DESC'] = '#ID# - ID лида
#TITLE# - Название лида
#STATUS_ID# - Статус лида
#PRODUCT_ID# - ID товара
#OPPORTUNITY# - Возможная сумма сделки
#CURRENCY_ID# - Валюта
#COMMENTS# - Комментарий
#NAME# - Имя
#LAST_NAME# - Фамилия
#SECOND_NAME# - Отчество
#COMPANY_TITLE# - Компания
#POST# - Должность
#ADDRESS# - Улица, дом, корпус, строение
#SOURCE_ID# - Источник
#SOURCE_DESCRIPTION# - Дополнительно об источнике
#DATE_CREATE# - Дата создания
#DATE_MODIFY# - Дата изменения
#ASSIGNED_BY_ID# - ID ответственного
#CREATED_BY_ID# - ID создавшего
#MODIFY_BY_ID# - ID изменившего
#PRODUCTS# - Список товаров';

$MESS['SMS4B_MAIN_CHANGE_STAT_LEAD_CRM'] = 'Смена статуса лида на ';
$MESS['SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_SUBJECT'] = 'Смена статуса лида на ';
$MESS['SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_MESSAGE'] = 'Статус лида был изменен с #OLD_STAT# на #STATUS_ID#';
$MESS['SMS4B_MAIN_CHANGE_STAT_LEAD_CRM_DESC'] = '#ID# - ID лида
#TITLE# - Название лида
#STATUS_ID# - Статус лида
#OLD_STAT# - Предыдущий статус
#PRODUCT_ID# - ID товара
#OPPORTUNITY# - Возможная сумма сделки
#CURRENCY_ID# - Валюта
#COMMENTS# - Комментарий
#NAME# - Имя
#LAST_NAME# - Фамилия
#SECOND_NAME# - Отчество
#COMPANY_TITLE# - Компания
#POST# - Должность
#ADDRESS# - Улица, дом, корпус, строение
#SOURCE_ID# - Источник
#SOURCE_DESCRIPTION# - Дополнительно об источнике
#ADDRESS_2# - Квартира / офис
#ADDRESS_CITY# - Город
#ADDRESS_POSTAL_CODE# - Почтовый индекс
#ADDRESS_REGION# - Район
#ADDRESS_PROVINCE# - Область
#ADDRESS_COUNTRY# - Страна
#ADDRESS_COUNTRY_CODE# - Код
#ASSIGNED_BY_ID# - ID ответственного
#MODIFY_BY_ID# - ID изменившего
#~BIRTHDATE# - День рождения';

//Для событий контактов
$MESS['SMS4B_MAIN_ADD_CONTACT_CRM_NAME'] = 'Добавление контакта';
$MESS['SMS4B_MAIN_ADD_CONTACT_CRM_SUBJECT'] = 'Добавление контакта';
$MESS['SMS4B_MAIN_ADD_CONTACT_CRM_MESSAGE'] = 'Добавлен новый контакт #FULL_NAME#';
$MESS['SMS4B_MAIN_ADD_CONTACT_CRM_DESC'] = '#ID# - ID контакта
#NAME# - Имя
#LAST_NAME# - Фамилия
#SECOND_NAME# - Отчество
#FULL_NAME# - Имя Фамилия
#POST# - Должность
#ADDRESS# - Улица, дом, корпус, строение
#COMMENTS# - Комментарий
#SOURCE_ID# - Источник
#SOURCE_DESCRIPTION# - Описание
#DATE_CREATE# - Дата создания
#DATE_MODIFY# - Дата изменения
#ASSIGNED_BY_ID# - ID ответственного
#CREATED_BY_ID# - ID создавшего
#MODIFY_BY_ID# - ID изменившего
#ADDRESS_2# - Квартира / офис
#ADDRESS_CITY# - Город
#ADDRESS_POSTAL_CODE# - Почтовый индекс
#ADDRESS_REGION# - Район
#ADDRESS_PROVINCE# - Область
#ADDRESS_COUNTRY# - Страна
#ADDRESS_COUNTRY_CODE# - Код
#COMPANY_ID# - ID компании
#~BIRTHDATE# - День рождения';

$MESS['SMS4B_MAIN_UPDATE_CONTACT_CRM_NAME'] = 'Редактирование контакта';
$MESS['SMS4B_MAIN_UPDATE_CONTACT_CRM_SUBJECT'] = 'Редактирование контакта';
$MESS['SMS4B_MAIN_UPDATE_CONTACT_CRM_MESSAGE'] = 'Контакт #FULL_NAME# был отредактирован';
$MESS['SMS4B_MAIN_UPDATE_CONTACT_CRM_DESC'] = '#ID# - ID контакта
#NAME# - Имя
#LAST_NAME# - Фамилия
#SECOND_NAME# - Отчество
#FULL_NAME# - Имя Фамилия
#POST# - Должность
#ADDRESS# - Улица, дом, корпус, строение
#COMMENTS# - Комментарий
#SOURCE_ID# - Источник
#SOURCE_DESCRIPTION# - Описание
#DATE_CREATE# - Дата создания
#DATE_MODIFY# - Дата изменения
#ASSIGNED_BY_ID# - ID ответственного
#CREATED_BY_ID# - ID создавшего
#MODIFY_BY_ID# - ID изменившего
#ADDRESS_2# - Квартира / офис
#ADDRESS_CITY# - Город
#ADDRESS_POSTAL_CODE# - Почтовый индекс
#ADDRESS_REGION# - Район
#ADDRESS_PROVINCE# - Область
#ADDRESS_COUNTRY# - Страна
#ADDRESS_COUNTRY_CODE# - Код
#COMPANY_ID# - ID компании
#~BIRTHDATE# - День рождения';

//Для событий компаний
$MESS['SMS4B_MAIN_ADD_COMPANY_CRM_NAME'] = 'Добавление компании';
$MESS['SMS4B_MAIN_ADD_COMPANY_CRM_SUBJECT'] = 'Добавление компании';
$MESS['SMS4B_MAIN_ADD_COMPANY_CRM_MESSAGE'] = 'Добавлена новая компания #TITLE#';
$MESS['SMS4B_MAIN_ADD_COMPANY_CRM_DESC'] = '#ID# - ID компании
#TITLE# - Название компании
#INDUSTRY# - Индустрия
#CURRENCY_ID# - Валюта
#COMMENTS# - Комментарий
#ADDRESS# - Улица, дом, корпус, строение
#ADDRESS_LEGAL# - Фактический адрес
#BANKING_DETAILS# - Банковские реквизиты
#DATE_CREATE# - Дата создания
#DATE_MODIFY# - Дата изменения
#ASSIGNED_BY_ID# - ID ответственного
#CREATED_BY_ID# - ID создавшего
#MODIFY_BY_ID# - ID изменившего
#ADDRESS_2# - Квартира / офис
#ADDRESS_CITY# - Город
#ADDRESS_POSTAL_CODE# - Почтовый индекс
#ADDRESS_REGION# - Район
#ADDRESS_PROVINCE# - Область
#ADDRESS_COUNTRY# - Страна
#ADDRESS_COUNTRY_CODE# - Код страны
#REG_ADDRESS# - Улица, дом, корпус, строение (Юр. адрес)
#REG_ADDRESS_2# - Квартира / офис (Юр. адрес)
#REG_ADDRESS_CITY# - Город (Юр. адрес)
#REG_ADDRESS_POSTAL_CODE# - Почтовый индекс (Юр. адрес)
#REG_ADDRESS_REGION# - Район (Юр. адрес)
#REG_ADDRESS_PROVINCE# - Область (Юр. адрес)
#REG_ADDRESS_COUNTRY# - Страна (Юр. адрес)
#REG_ADDRESS_COUNTRY_CODE# - Код страны (Юр. адрес)
#ASSIGNED_BY_ID# - ID ответственного';

$MESS['SMS4B_MAIN_UPDATE_COMPANY_CRM_NAME'] = 'Редактирование компании';
$MESS['SMS4B_MAIN_UPDATE_COMPANY_CRM_SUBJECT'] = 'Редактирование компании';
$MESS['SMS4B_MAIN_UPDATE_COMPANY_CRM_MESSAGE'] = 'Компания #TITLE# была отредактирована';
$MESS['SMS4B_MAIN_UPDATE_COMPANY_CRM_DESC'] = '#ID# - ID компании
#TITLE# - Название компании
#INDUSTRY# - Индустрия
#CURRENCY_ID# - Валюта
#COMMENTS# - Комментарий
#ADDRESS# - Улица, дом, корпус, строение
#ADDRESS_LEGAL# - Фактический адрес
#BANKING_DETAILS# - Банковские реквизиты
#DATE_CREATE# - Дата создания
#DATE_MODIFY# - Дата изменения
#ASSIGNED_BY_ID# - ID ответственного
#CREATED_BY_ID# - ID создавшего
#MODIFY_BY_ID# - ID изменившего
#ADDRESS_2# - Квартира / офис
#ADDRESS_CITY# - Город
#ADDRESS_POSTAL_CODE# - Почтовый индекс
#ADDRESS_REGION# - Район
#ADDRESS_PROVINCE# - Область
#ADDRESS_COUNTRY# - Страна
#ADDRESS_COUNTRY_CODE# - Код страны
#REG_ADDRESS# - Улица, дом, корпус, строение (Юр. адрес)
#REG_ADDRESS_2# - Квартира / офис (Юр. адрес)
#REG_ADDRESS_CITY# - Город (Юр. адрес)
#REG_ADDRESS_POSTAL_CODE# - Почтовый индекс (Юр. адрес)
#REG_ADDRESS_REGION# - Район (Юр. адрес)
#REG_ADDRESS_PROVINCE# - Область (Юр. адрес)
#REG_ADDRESS_COUNTRY# - Страна (Юр. адрес)
#REG_ADDRESS_COUNTRY_CODE# - Код страны (Юр. адрес)
#ASSIGNED_BY_ID# - ID ответственного';

//Для событий сделок
$MESS['SMS4B_MAIN_ADD_DEAL_CRM_NAME'] = 'Добавление сделки';
$MESS['SMS4B_MAIN_ADD_DEAL_CRM_SUBJECT'] = 'Добавление сделки';
$MESS['SMS4B_MAIN_ADD_DEAL_CRM_MESSAGE'] = 'Добавлена новая сделка #TITLE#';
$MESS['SMS4B_MAIN_ADD_DEAL_CRM_DESC'] = '#ID# - ID сделки
#TITLE# - Название сделки
#OPPORTUNITY# - Возможная сумма сделки
#CURRENCY_ID# - Валюта сделки
#PROBABILITY# - Вероятность, %
#STAGE_ID# - Статус сделки
#CLOSED# - Зактрыта?
#TYPE_ID# - Тип
#COMMENTS# - Комментарий к сделке
#BEGINDATE# - Дата начала
#CLOSEDATE# - Дата закрытия
#DATE_CREATE# - Дата создания
#DATE_MODIFY# - Дата обновления
#ASSIGNED_BY_ID# - ID ответственного
#CREATED_BY_ID# - ID создавшего
#MODIFY_BY_ID# - ID изменившего
#LEAD_ID# - ID лида
#CONTACT_ID# - ID контакта
#COMPANY_ID# - ID компании';

$MESS['SMS4B_MAIN_UPDATE_DEAL_CRM_NAME'] = 'Редактирование сделки';
$MESS['SMS4B_MAIN_UPDATE_DEAL_CRM_SUBJECT'] = 'Редактирование сделки';
$MESS['SMS4B_MAIN_UPDATE_DEAL_CRM_MESSAGE'] = 'Сделка #TITLE# была отредактирована';
$MESS['SMS4B_MAIN_UPDATE_DEAL_CRM_DESC'] = '#ID# - ID сделки
#TITLE# - Название сделки
#OPPORTUNITY# - Возможная сумма сделки
#CURRENCY_ID# - Валюта сделки
#PROBABILITY# - Вероятность, %
#STAGE_ID# - Статус сделки
#CLOSED# - Зактрыта?
#TYPE_ID# - Тип
#COMMENTS# - Комментарий к сделке
#BEGINDATE# - Дата начала
#CLOSEDATE# - Дата закрытия
#DATE_CREATE# - Дата создания
#DATE_MODIFY# - Дата обновления
#ASSIGNED_BY_ID# - ID ответственного
#CREATED_BY_ID# - ID создавшего
#MODIFY_BY_ID# - ID изменившего
#LEAD_ID# - ID лида
#CONTACT_ID# - ID контакта
#COMPANY_ID# - ID компании';

$MESS['SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_NAME'] = 'Изменение статуса сделки на ';
$MESS['SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_SUBJECT'] = 'Изменение статуса сделки на ';
$MESS['SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_MESSAGE'] = 'Статус сделки был изменен с #OLD_STAGE# на #STAGE_ID#';
$MESS['SMS4B_MAIN_CHANGE_STAT_DEAL_CRM_DESC'] = '#ID# - ID сделки
#TITLE# - Название сделки
#OPPORTUNITY# - Возможная сумма сделки
#CURRENCY_ID# - Валюта сделки
#PROBABILITY# - Вероятность, %
#STAGE_ID# - Статус сделки
#CLOSED# - Зактрыта?
#TYPE_ID# - Тип
#COMMENTS# - Комментарий к сделке
#BEGINDATE# - Дата начала
#CLOSEDATE# - Дата закрытия
#DATE_CREATE# - Дата создания
#DATE_MODIFY# - Дата обновления
#ASSIGNED_BY_ID# - ID ответственного
#CREATED_BY_ID# - ID создавшего
#MODIFY_BY_ID# - ID изменившего
#LEAD_ID# - ID лида
#CONTACT_ID# - ID контакта
#COMPANY_ID# - ID компании
#OLD_STAGE# - Предыдущий статус';

//Для событий дел
$MESS['SMS4B_MAIN_ADD_ACTIVITY_CRM_NAME'] = 'Добавление дела';
$MESS['SMS4B_MAIN_ADD_ACTIVITY_CRM_SUBJECT'] = 'Добавление дела';
$MESS['SMS4B_MAIN_ADD_ACTIVITY_CRM_MESSAGE'] = 'Добавлено новое дело #TYPE_ID#';
$MESS['SMS4B_MAIN_ADD_ACTIVITY_CRM_DESC'] = '#ID# - ID дела
#TYPE_ID# - Тип дела
#SUBJECT# - Тема
#COMPLETED# - Завершен?
#RESPONSIBLE_ID# - ID ответственного
#PRIORITY# - Важность
#LOCATION# - Место
#CREATED# - Дата создания
#LAST_UPDATED# - Дата обновления
#START_TIME# - Дата старта
#END_TIME# - Дата окончания
#DEADLINE# - Дедлайн
#PARENT_ID# - ID родителя
#AUTHOR_ID# - ID автора
#EDITOR_ID# - ID редактора';

$MESS['SMS4B_MAIN_UPDATE_ACTIVITY_CRM_NAME'] = 'Напоминание о встрече\звонке';
$MESS['SMS4B_MAIN_UPDATE_ACTIVITY_CRM_SUBJECT'] = 'Напоминание о встрече\звонке';
$MESS['SMS4B_MAIN_UPDATE_ACTIVITY_CRM_MESSAGE'] = 'Напоминание о встрече\звонке';
$MESS['SMS4B_MAIN_UPDATE_ACTIVITY_CRM_DESC'] = '#ID# - ID дела
#TYPE_ID# - Тип дела
#SUBJECT# - Тема
#COMPLETED# - Завершен?
#RESPONSIBLE_ID# - ID ответственного
#PRIORITY# - Важность
#LOCATION# - Место
#CREATED# - Дата создания
#LAST_UPDATED# - Дата обновления
#START_TIME# - Дата старта
#END_TIME# - Дата окончания
#DEADLINE# - Дедлайн
#PARENT_ID# - ID родителя
#AUTHOR_ID# - ID автора
#EDITOR_ID# - ID редактора
#CONTACT_PHONE# - Номер телефона Контакта/Лида';

$MESS['SMS4B_MAIN_USER_CUSTOM_EVENT_NAME'] = 'Пользовательские шаблоны';
$MESS['SMS4B_MAIN_USER_CUSTOM_EVENT_SUBJECT'] = 'Пример пользовательского шаблона';
$MESS['SMS4B_MAIN_USER_CUSTOM_EVENT_MESSAGE'] = 'Текст SMS по новому пользовательском шаблону';
$MESS['SMS4B_MAIN_USER_CUSTOM_EVENT_DESC'] = '#ORDER_ID# - код заказа
#ORDER_DATE# - дата заказа
#ORDER_USER# - ФИО заказчика
#PRICE# - сумма заказа
#PHONE_TO# - телефон заказчика
#ORDER_LIST# - состав заказа';

$MESS['SMS4B_MAIN_VP_AUTOANSWER_NAME'] = 'SMS-Автоответчик';
$MESS['SMS4B_MAIN_VP_AUTOANSWER_DESC'] = '#PHONE_NUMBER# - Номер клиента
#CALL_START_DATE# - Дата звонка
#CALL_FAILED_CODE# - Код ошибки
#CALL_FAILED_REASON# - Причина пропущенного звонка
#ID# - ID пользователя
#LOGIN# - Логин пользователя
#NAME# - Имя пользователя
#LAST_NAME# - Фамилия пользователя
#EMAIL# - Email
#PHONE_TO# - Номер пользователя
#WORK_COMPANY# - Название компании';
$MESS['SMS4B_MAIN_VP_AUTOANSWER_SUBJECT'] = 'SMS-автоответчик';
$MESS['SMS4B_MAIN_VP_AUTOANSWER_MESSAGE'] = 'Добрый день
Перезвоните, пожалуйста на номер #PHONE_TO#
С уважением, компания #WORK_COMPANY#';

$MESS['SMS4B_MAIN_VP_MISSED_CALL_NAME'] = 'Уведомление о пропущенном звонке';
$MESS['SMS4B_MAIN_VP_MISSED_CALL_DESC'] = '#PHONE_NUMBER# - Номер клиента
#CALL_START_DATE# - Дата звонка
#CALL_FAILED_CODE# - Код ошибки
#CALL_FAILED_REASON# - Причина пропущенного звонка
#ID# - ID пользователя
#LOGIN# - Логин пользователя
#NAME# - Имя пользователя
#LAST_NAME# - Фамилия пользователя
#EMAIL# - Email
#PHONE_TO# - Номер пользователя
#WORK_COMPANY# - Название компании';
$MESS['SMS4B_MAIN_VP_MISSED_CALL_SUBJECT'] = 'Уведомление о пропущенном звонке';
$MESS['SMS4B_MAIN_VP_MISSED_CALL_MESSAGE'] = '#NAME#, у Вас пропущенный звонок от #PHONE_NUMBER#.
Перезвоните, пожалуйста';

$MESS['SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_1'] = 'Уведомление о неоплаченом заказе';
$MESS['SMS4B_TAB_SEND_FORGOTTEN_BASKETS_DESC_1'] = 'Доступны следующие свойства заказа 
';

$MESS['SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_1_SUBJECT'] = 'Уведомление о неоплаченом заказе';
$MESS['SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_1_MESSAGE'] = 'Уважаемый #FIO#, Вы оформили но не оплатили заказ
№ #ID# на сайте #SITE_NAME#. Стоимость заказа #PRICE#.';

$MESS['SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_2'] = 'Уведомление о неоплаченом заказе № 2 ';
$MESS['SMS4B_TAB_SEND_FORGOTTEN_BASKETS_DESC_2'] = 'Доступны следующие свойства заказа 
';
$MESS['SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_2_SUBJECT'] = 'Уведомление о неоплаченом заказе';
$MESS['SMS4B_TAB_SEND_FORGOTTEN_BASKETS_TEMPLATE_2_MESSAGE'] = 'Уважаемый #FIO#, Вы забыли оплатить заказ № #ID#. 
Стоимость заказа #PRICE#. Переходите на сайт #SERVER_NAME# для оплаты.';
