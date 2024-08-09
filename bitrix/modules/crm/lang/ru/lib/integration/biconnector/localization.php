<?php
//CRM_DYNAMIC_TYPE table descriptions
$MESS['CRM_SMART_PROC_TABLE'] = "Смарт-процессы";
$MESS['CRM_SMART_PROC_FIELD_ENTITY_TYPE_ID'] = "Идентификатор типа";
$MESS['CRM_SMART_PROC_FIELD_ENTITY_TYPE_ID_FULL'] = "Идентификатор типа (EntityTypeId) смарт-процесса";
$MESS['CRM_SMART_PROC_FIELD_TITLE'] = "Название";
$MESS['CRM_SMART_PROC_FIELD_TITLE_FULL'] = "Название смарт-процесса";
$MESS['CRM_SMART_PROC_FIELD_DATASET_NAME'] = "Имя датасета смарт-процесса";
$MESS['CRM_SMART_PROC_FIELD_DATASET_NAME_FULL'] = "Имя датасета смарт-процесса";
$MESS['CRM_SMART_PROC_FIELD_AUTOMATED_SOLUTION_DATASET_NAME'] = "Имя датасета цифрового рабочего места";
$MESS['CRM_SMART_PROC_FIELD_AUTOMATED_SOLUTION_DATASET_NAME_FULL'] = "Имя датасета цифрового рабочего места если связано с процессом, иначе CRM";
$MESS['CRM_SMART_PROC_FIELD_CUSTOM_SECTION_ID'] = "Идентификатор цифрового рабочего места";
$MESS['CRM_SMART_PROC_FIELD_CUSTOM_SECTION_TITLE'] = "Название рабочего места";
$MESS['CRM_SMART_PROC_FIELD_PRODUCT_DATASET_NAME'] = "Имя датасета товаров смарт-процесса";

//CRM_STAGES fields description
$MESS['CRM_STAGES_TABLE'] = "Стадии CRM";
$MESS['CRM_STAGES_FIELD_ID'] = "Уникальный ключ";
$MESS['CRM_STAGES_FIELD_ENTITY_TYPE_ID'] = "Идентификатор типа";
$MESS['CRM_STAGES_FIELD_STATUS_ID'] = "Идентификатор стадии";
$MESS['CRM_STAGES_FIELD_NAME'] = "Название стадии";
$MESS['CRM_STAGES_FIELD_CATEGORY_ID'] = "Идентификатор воронки";
$MESS['CRM_STAGES_FIELD_CATEGORY_NAME'] = "Название воронки";
$MESS['CRM_STAGES_FIELD_SORT'] = "Сортировка";
$MESS['CRM_STAGES_FIELD_SEMANTICS'] = "Тип стадии";

//CRM_ENTITY_RELATION table/field descriptions
$MESS['CRM_ENTITY_RELATION_TABLE'] = "Связи между элементами crm";
$MESS['CRM_ENTITY_RELATION_FIELD_SRC_ENTITY_TYPE_ID'] = "Идентификатор типа элемента, который связан";
$MESS['CRM_ENTITY_RELATION_FIELD_SRC_ENTITY_ID'] = "Идентификатор элемента, который связан";
$MESS['CRM_ENTITY_RELATION_FIELD_SRC_ENTITY_DATASET_NAME'] = "Название датасета элемента, который связан";
$MESS['CRM_ENTITY_RELATION_FIELD_DST_ENTITY_TYPE_ID'] = "Идентификатор типа элемента, с которым связан";
$MESS['CRM_ENTITY_RELATION_FIELD_DST_ENTITY_ID'] = "Идентификатор элемента, с которым связан";
$MESS['CRM_ENTITY_RELATION_FIELD_DST_ENTITY_DATASET_NAME'] = "Название датасета элемента, с которым связан";

//CRM_AUTOMATED_SOLUTION table/field descriptions
$MESS['CRM_AUTOMATED_SOLUTION_TABLE'] = "Цифровое рабочее место: #TITLE#";

//CRM_PRODUCT_ROW table/field for smart processes descriptions
$MESS['CRM_DYNAMIC_ITEMS_PROD_TABLE'] = "Смарт-процесс #TITLE#: товары";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_ID'] = "Уникальный идентификатор";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_ITEM_ID'] = "Идентификатор элемента смарт-процесса";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_PRODUCT'] = "Товар";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_PRODUCT_ID'] = "Идентификатор товара";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_PRODUCT_NAME'] = "Название товара";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_PRICE'] = "Цена";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_PRICE_EXCLUSIVE'] = "Цена без налога со скидкой";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_PRICE_NETTO'] = "Цена без скидок и налогов";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_PRICE_BRUTTO'] = "Цена без скидок, с налогом";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_QUANTITY'] = "Количество";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_DISCOUNT_TYPE'] = "Скидка";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_DISCOUNT_TYPE_ID'] = "Идентификатор скидки";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_DISCOUNT_TYPE_NAME'] = "Название скидки";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_DISCOUNT_RATE'] = "Величина скидки";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_DISCOUNT_SUM'] = "Сумма скидки";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_TAX_RATE'] = "Налог";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_TAX_INCLUDED'] = "Налог включен в цену";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_CUSTOMIZED'] = "Изменена";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_CUSTOMIZED_FULL'] = "Товарная позиция была изменена вручную после добавления в сделку. Y - да, N - нет";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_MEASURE'] = "Единица измерения";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_MEASURE_CODE'] = "Идентификатор единицы измерения";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_MEASURE_NAME'] = "Название единицы измерения";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_SORT'] = "Порядок сортировки";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_PARENT'] = "Раздел товара";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_SUPERPARENT'] = "Раздел товара на уровень выше";
$MESS['CRM_DYNAMIC_ITEMS_PROD_FIELD_SUPERSUPERPARENT'] = "Раздел товара на два уровня выше";
