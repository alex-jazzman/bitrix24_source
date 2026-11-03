<?php
// Section labels for the new hub tree (the flat prod tabs have no merged equivalents).
$MESS['CRM_TYPE_DETAIL_HUB_SECTION_MAIN'] = 'Основное';
$MESS['CRM_TYPE_DETAIL_HUB_SECTION_FEATURES'] = 'Возможности';
$MESS['CRM_TYPE_DETAIL_HUB_SECTION_RELATIONS'] = 'Связи';
$MESS['CRM_TYPE_DETAIL_HUB_SECTION_PRODUCTS'] = 'Товары и документы';
$MESS['CRM_TYPE_DETAIL_HUB_SECTION_PERMISSIONS'] = 'Права доступа';

// Recomposed tree (spec 2026-08-31). Copy comes from the Figma of the wizard (426-9301 and the two
// screens next to it): on a conflict between the mockup and our UXGEN pass the mockup wins — the
// PM's decision of 2026-09-01. It reverts the two renames of D-26 ("Карточка элемента",
// "Движение элементов") and gives "Связи" a name of its own in the new tree.
//
// The menu label and the header of the section's own card are now two DIFFERENT phrases: the mockup
// names the menu item after the subject ("Карточка процесса") and the card after what the card
// actually holds ("Опции внутри карточки"), see ..._CARD_* below.
$MESS['CRM_TYPE_DETAIL_HUB_SECTION_CARD'] = 'Карточка смарт-процесса';
$MESS['CRM_TYPE_DETAIL_HUB_SECTION_PROCESS'] = 'Движение смарт-процесса';
$MESS['CRM_TYPE_DETAIL_HUB_SECTION_AUTOMATION'] = 'Автоматизация';
// Own code, not a retext of ..._SECTION_RELATIONS: that phrase also labels the section in the legacy
// tree, which the option must restore untouched.
$MESS['CRM_TYPE_DETAIL_HUB_SECTION_RELATIONS_V2'] = 'Связи по Битрикс24';

// Headers of the section cards in the recomposed tree (the mockup, see above). "Автоматизация" and
// "Товары и документы" keep the section label as their card header — the wizard has no screen for
// them yet, so there is nothing to take the copy from.
$MESS['CRM_TYPE_DETAIL_HUB_CARD_CARD_OPTIONS'] = 'Возможности элемента';
$MESS['CRM_TYPE_DETAIL_HUB_CARD_PROCESS_MOVEMENT'] = 'Настройка движения элементов';

// Tile of "Движение элементов". The production phrase ("Права доступа при создании воронки") is long
// for a tile and, next to the funnels, reads as a permission of the process, which it is not.
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_OPEN_PERMISSIONS_TITLE'] = 'Доступ к новым воронкам';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_OPEN_PERMISSIONS_DESCRIPTION'] = 'Доступ к новой воронке откроется сразу для всех ролей';
$MESS['CRM_TYPE_DETAIL_HUB_DESCRIPTION'] = 'Описание';

// Close-confirmation dialog (new client behaviour).
$MESS['CRM_TYPE_DETAIL_HUB_CLOSE_CONFIRM_TITLE'] = 'Закрыть?';
$MESS['CRM_TYPE_DETAIL_HUB_CLOSE_CONFIRM_TEXT'] = 'Ваши изменения не сохранятся';
$MESS['CRM_TYPE_DETAIL_HUB_ERROR_CLOSE'] = 'Закрыть сообщение';
$MESS['CRM_TYPE_DETAIL_CUSTOM_SECTION_ITEM_NAME_LABEL'] = 'Название рабочего места';

// "Main" section layout (Figma "Основное"): card titles, the passport and the placement row.
// Caption of the placement button of the passport while the type is in no workplace. It is not an
// empty state: a type outside every workplace sits in CRM, which is what BI already reports for a
// type with no CUSTOM_SECTION_ID (PM, 2026-09-01). The workplace names itself, so there is no phrase
// for its name; both cases are then framed by the caption below.
$MESS['CRM_TYPE_DETAIL_HUB_LOCATION_CRM'] = 'CRM';
// The caption of that button on both screens (owner, T12): the frame around "CRM" above or the name
// of the workplace — "Расположен в: CRM", "Расположен в: Отдел выпуска".
$MESS['CRM_TYPE_DETAIL_HUB_LOCATION_BUTTON'] = 'Расположение: #TITLE#';
// The option inside the dialog ("this type is in no workplace") — a different thing from the button
// caption above, which is why it keeps its own code.
$MESS['CRM_TYPE_DETAIL_HUB_LOCATION_EMPTY'] = 'CRM';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_DATES_TITLE'] = 'Сроки';

// Copy of "Основное"'s four feature cards. Unlike FEATURES_CARDS / PRODUCTS_FEATURE_CARDS further
// down, these phrase codes are referenced only from the descriptor records (`ScalarRecord.description`)
// — MAIN_FEATURE_CARDS overrides none of them (D-17), so the card picks them up from the record on
// its own. DATES_NOTE explains the days field that lives inside the "Сроки" card.
//
// Сквозное правило с созвона N460476 (T-01): описание говорит, что человек сможет ДЕЛАТЬ, а не из
// чего настройка сделана. Слова «поле», «галка», «настройка» из описаний убраны — «поле — это способ
// реализации сценария» (02:29). Поэтому «Наблюдатели» больше не «поле для сотрудников», а приглашение
// коллег к конкретным элементам, и «Источник» начинается с глагола.
//
// «Источник» остаётся тумблером, а не показывается всем (?-03, решение от 2026-09-15): не каждый смарт
// подразумевает каналы, и подсчёт лишнего здесь не нужен. Перечисление каналов оставлено — оно
// правдиво и конкретно; переписан только зачин.
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_DATES_DESCRIPTION'] = 'Укажите срок в днях — даты начала и завершения рассчитаются автоматически';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_DATES_NOTE'] = 'Срок в днях';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_OBSERVERS_DESCRIPTION'] = 'Наблюдатели получают уведомления и следят за работой над элементом, но не отвечают за неё';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_SOURCE_DESCRIPTION'] = 'Показывает источник элемента: звонок, сайт, реклама или рекомендация';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_RECURRING_DESCRIPTION'] = 'Новые копии элемента создаются по расписанию автоматически';

// Copy of the six feature cards, "Возможности процесса" section (task-10 brief): short titles and
// descriptions that override the descriptor's full-sentence production phrases at the layout level
// (the section layouts of src/const/), sized for the two-column card grid instead of the old
// vertical list.
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_CATEGORIES_TITLE'] = 'Воронки и туннели';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_CATEGORIES_DESCRIPTION'] = 'Создавайте несколько воронок с отдельными стадиями и правами доступа и переносите элементы между ними через туннели';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_AUTOMATION_TITLE'] = 'Роботы и триггеры';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_AUTOMATION_DESCRIPTION'] = 'Роботы выполняют действия на стадиях, а триггеры перемещают элементы между ними. Без стадий они не работают';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_STAGES_TITLE'] = 'Стадии и канбан';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_STAGES_DESCRIPTION'] = 'Распределяйте элементы по стадиям и отслеживайте их в канбане. Без стадий роботы и туннели не работают';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_BIZ_PROC_TITLE'] = 'Дизайнер бизнес-процессов';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_BIZ_PROC_DESCRIPTION'] = 'Создавайте сценарии согласования и других действий. Шаблоны могут запускаться автоматически при создании или изменении элемента';
// Название «Счётчики» оставлено сознательно: переименование в «сценарий» отклонено прямо на созвоне —
// «как это сценарием теперь обозвать даже непонятно, потому что она же дела не выключает —
// [выключает] подсчёт» (07:55). Переписано только описание (T-04).
//
// Описание называет ровно то, что тумблер выключает, и ничего сверх: зелёные и красные счётчики по
// элементам, их агрегацию в левом меню и панель счётчиков в списке. Создавать дела он НЕ запрещает —
// красный кружок у просроченного дела в таймлайне остаётся, — поэтому в описании нет ни слова про дела.
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_COUNTERS_TITLE'] = 'Счётчики';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_COUNTERS_DESCRIPTION'] = 'Счётчики над списком и в левом меню показывают количество входящих, запланированных на сегодня и просроченных дел';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_RECYCLEBIN_TITLE'] = 'Корзина';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_RECYCLEBIN_DESCRIPTION'] = 'Удалённые элементы можно восстановить из корзины в течение 30 дней. Если корзина отключена, элементы удаляются без возможности восстановления';

// Copy of the three feature cards, "Товары и документы" section (task-10 brief): same short-copy
// override, PRODUCTS_FEATURE_CARDS in products-layout.ts.
//
// Две правки созвона N460476. T-07: сумма — не второй равноправный эффект, а следствие каталога
// («включаешь товары… сумма — это как бы следствие того, что включу каталог», 41:12), поэтому
// описание сначала включает каталог и лишь затем говорит про сумму.
//
// T-08: «реквизиты — это по сути поле "Моя компания" в карточке» (41:37). Связь с печатью в описании
// названа потому, что она неочевидна и уже стоила путаницы: печать документов когда-то включала
// реквизиты сама, потом «накатился бэк, они перестали», а подстановки организации в шаблонах печатных
// форм по-прежнему берутся из «Моей компании» — без неё печатная форма выходит неполной.
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_LINK_WITH_PRODUCTS_TITLE'] = 'Товары и суммы';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_LINK_WITH_PRODUCTS_DESCRIPTION'] = 'Добавляйте товары из каталога — сумма элемента рассчитается автоматически';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_DOCUMENTS_TITLE'] = 'Печать документов';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_DOCUMENTS_DESCRIPTION'] = 'Создавайте документы по шаблонам — данные элемента подставятся автоматически';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_MYCOMPANY_TITLE'] = 'Реквизиты компании';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_MYCOMPANY_DESCRIPTION'] = 'Выберите свою компанию в элементе — её реквизиты подставятся в печатные документы';

// Meta of the passport. Each item is a self-contained plural phrase, never a fragment of a sentence:
// splicing a sentence out of parts is untranslatable into a language with a different word order.

// MOCK. The card-view presets have no backend behind them: this is a single hard-coded row.
// Task for the hub owner, see decisions.md OQ-06.

$MESS['CRM_TYPE_DETAIL_HUB_DESCRIPTION_PLACEHOLDER'] = 'Добавить описание';

// The save button of the CREATION screen, which lives in the passport itself: there the shared save
// panel is hidden, so it and the cancel below are the only actions on the screen. Kept apart from CRM_SETTINGS_HUB_SAVE
// of the kit's panel — that one is the kit's phrase and belongs to a different screen.
$MESS['CRM_TYPE_DETAIL_HUB_CREATION_SAVE_BUTTON'] = 'Создать';
// Its neighbour on the creation screen: leaves the screen without saving and without the close
// dialog. Own code for the same reason: CRM_SETTINGS_HUB_CANCEL is the phrase of the kit's panel.
$MESS['CRM_TYPE_DETAIL_HUB_CREATION_CANCEL_BUTTON'] = 'Отмена';

// "Relations" section layout, "Связи с CRM" card (task-8-brief.md): the store keeps relations per
// direction (parent/child), pivoted here into one row per entity with up to three sub-options. Copy
// is a working formulation, rewritten in Task 10 via UXGEN.
$MESS['CRM_TYPE_DETAIL_HUB_RELATIONS_CRM_TITLE'] = 'Связи с CRM';
// Chip captions. With the heading naming the card, each chip only has to say WHAT appears there, and
// the two field chips have to stay tellable apart by comparison: one is the field of the related
// entity inside the process element ("Поле со связанным элементом", under the process heading), the
// other is the field holding an element of THIS process inside the entity ("Поле с элементом
// процесса", under the entity heading).
//
// Both are "поле С чем-то" — instrumental — on purpose. The PM edit of D-28 made the second one
// "Поле этого процесса", a genitive, and that broke the pair: read under "В лиде" it says whose
// field it is, not what the field holds, so the difference D-25 wanted read by comparison had to be
// guessed instead. The collision the genitive was meant to avoid is already handled by the group
// headings ("В лиде" against "В «Обработка документов»"), which is what D-28 built them for. The
// wording matches the four portal rows below, which name the same artifact.
//
// Terminology of the whole screen, settled by the copy pass of 2026-09-01: BOTH sides of a link are
// an "элемент". The process side is "элемент процесса", the CRM side is "элемент CRM" — the term
// production itself uses (CRM_TYPE_DETAIL_RELATION_CHILD, ..._IS_USE_IN_USERFIELD_ENABLED_TITLE) and
// the term the portal rows below already use. "Запись" is gone: it survived only in the three hints,
// where it contradicted the chip right above it once the mockup renamed the chips to "элемент".
//
// The parent-field chip names the entity outright instead of calling it "связанный элемент" (PM; the
// rename was asked for in D-28 and deferred there). The row already names that entity, so the chip
// was the one place on the row that went vague, and the vagueness cost the pair its comparison: next
// to "Поле с элементом процесса" the difference between the two fields is WHAT each one holds, and
// "связанный элемент" named it only by pointing back at the row.
//
// One phrase per core type rather than one with a substitution: the case is instrumental, a
// substitution cannot decline a noun, and the preposition alternates on top of that (с лидом, но
// со сделкой и со счётом).
// Everything else — other smart processes — keeps its name in quotes and undeclined, the same trick
// as the constructor row's "Элементы «Демо для хаба»" (..._RELATION_PLURAL_NAMED).
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_NAMED'] = 'Поле с элементом «#TITLE#»';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_LEAD'] = 'Поле с лидом';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_DEAL'] = 'Поле со сделкой';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_QUOTE'] = 'Поле с предложением';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_ORDER'] = 'Поле с заказом';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PARENT_FIELD_INVOICE'] = 'Поле со счётом';
//
// Обе опции группы «Что появится в <карточке CRM>» держат ЭТОТ процесс, поэтому обе зовут его по
// имени — тем же приёмом, что и запасная форма parent-field строкой выше: имя не склоняется, значит
// стоит в кавычках. До этого они звали его категорией («элемент процесса»), и внутри одной строки
// один и тот же артефакт назывался двумя способами: сущность CRM — прямо («Поле со сделкой»), а
// процесс — категорией. На строке «СП → СП» это было заметнее всего: два зеркальных чипса
// различались не тем, ЧТО в них лежит, а тем, каким способом это названо.
//
// Категория никуда не делась — она ушла туда, где ей и место: в подсказку чипса, которая объясняет,
// ЧТО такое этот артефакт («Ссылается на один элемент процесса»). Чипс называет, подсказка объясняет.
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_CHILDREN_LIST'] = 'Вкладка с элементами «#TITLE#»';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_CHILD_FIELD'] = 'Поле с элементом «#TITLE#»';
// Row descriptions of "Связи с CRM", shown only while the row is off: once it is on, the chips say
// what appears where and the sentence would be the same thing said twice (PM, 2026-09-01).
//
// Форма — придаточное цели («Чтобы …») или условия («Если …»), а НЕ вопрос «какую X обслуживает
// работа», как было до созвона N460476 (2026-09-14, T-06). Прежняя форма называла сущность, которую
// строка и так называет заголовком, и молчала о главном — зачем связь нужна. На созвоне это разобрали
// на «Клиенте»: «С кем ведётся работа» не отвечает, зачем клиент нужен в ЭТОМ процессе.
//
// Формулировки намеренно универсальны: «мы никогда не знаем, для чего они создают смарт» (14:18), —
// поэтому ни одна строка не предполагает отрасль или бизнес-сценарий. Две из шести взяты с созвона
// дословно: лид — «если у вас смарт-процесс начинается с первого касания», сделка — «чтобы подключить
// смарт-процесс к уже активному процессу» (13:57–14:17).
//
// «Работа» — закреплённое в проекте неформальное имя элемента (05-final.md,
// ..._FEATURE_SOURCE_DESCRIPTION), а не восьмой термин для него.
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_LEAD'] = 'Свяжите процесс с лидом, если он сопровождает первое обращение клиента: например, расчёт стоимости или демонстрацию продукта до сделки';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_DEAL'] = 'Свяжите процесс со сделкой, чтобы вести связанную с ней работу — например, изготовление или закупку под эту сделку';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_QUOTE'] = 'Свяжите процесс с предложением клиенту, если нужно согласовать скидку с руководителем или проверить условия с юристом';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_ORDER'] = 'Свяжите процесс с заказом из магазина, чтобы вести доставку или разбор рекламации';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_INVOICE'] = 'Свяжите процесс со счётом, если работа касается оплаты или закрывающих документов';
// Card of its own since the third screen of the mockup: a chosen process gets the same row as
// "Сделка", with the same two groups and the same chips, instead of a flat chip that hid all three
// of its options behind a "×".
$MESS['CRM_TYPE_DETAIL_HUB_RELATIONS_SP_TITLE'] = 'Связи с другими смарт-процессами';
$MESS['CRM_TYPE_DETAIL_HUB_RELATIONS_SP_ACTION'] = 'Выбрать смарт-процесс';

// Portal card (task-9-brief.md): sp-use-in-userfield (independent flag) + the three linkedUserFields
// rows (titles come from the server already localized, see linkedUserFieldRows).
//
// The card used to repeat the section label verbatim — menu "Связи по порталу" over card "Связи по
// порталу" — which is the one thing a section heading may not do. It now carries the production term
// for what it actually holds (CRM_TYPE_DETAIL_TAB_USER_FIELDS_TITLE). The menu label is left alone:
// it comes from the mockup and is PM's to change. "Товары и документы" and "Автоматизация" still
// repeat their section labels, but for a different reason — D-27 parked their card headers as
// placeholders until those sections get a mockup, so there is nothing to correct there yet.
$MESS['CRM_TYPE_DETAIL_HUB_RELATIONS_PORTAL_TITLE'] = 'Связи с другими инструментами';
// Row descriptions of the portal card. Unlike the CRM rows these have no sub-options to replace
// them, so they stay on screen whether the row is on or off.
//
// Они называют тот же артефакт, что и чипсы «Связей с CRM», поэтому названы так же — процесс по
// имени, в кавычках. Форма «Поле с «#TITLE#»» здесь ещё и единственно верная: поле в задаче или в
// событии календаря подписано своим, а не именем процесса, — оно лишь ХРАНИТ его элемент. Форма
// «Поле «#TITLE#»» утверждала бы про подпись и была бы неправдой.
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_CRM_ITEMS'] = 'Связывайте лиды, сделки, счета и другие элементы CRM с элементами «#TITLE#»';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_CALENDAR'] = 'Связывайте события календаря с элементами «#TITLE#»';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_TASK'] = 'Связывайте задачи с элементами «#TITLE#»';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_TASK_TEMPLATE'] = 'Связывайте шаблоны задач с элементами «#TITLE#»';

// "Permissions" section layout (Figma "Права доступа"): intro copy over the single action row.
// The intro used to restate the card and the row under it — the screen said "roles and employees"
// four times running. It now carries the one thing none of them says: permissions are held by roles,
// and people reach them through role membership (RoleRelationTable).
$MESS['CRM_TYPE_DETAIL_HUB_PERMISSIONS_CARD_TITLE'] = 'Роли и сотрудники';
$MESS['CRM_TYPE_DETAIL_HUB_PERMISSIONS_INTRO'] = 'Настройте права доступа для разных ролей и добавьте сотрудников и отделы, чтобы регулировать доступ к элементам смарт-процесса';
// Заголовок строки — существительное, как у всех двадцати четырёх её соседей («Корзина», «Сроки»,
// «Дизайнер бизнес-процессов»). «Кто работает с процессом» был единственным вопросом среди них, и
// сбивал он не формой, а ролью: у навигационных строк заголовок называет то, КУДА они ведут, а вопрос
// называл людей, которых там настраивают, — то есть повторял карточку над собой («Роли и сотрудники»).
//
// «Права доступа» взять нельзя: так называется раздел меню, а он PM-ский и совпадать с ним нечему
// внутри него же. «Права на процесс» называет ровно тот артефакт, который открывает кнопка, и
// расходится и с карточкой, и с разделом.
$MESS['CRM_TYPE_DETAIL_HUB_PERMISSIONS_ROW_TITLE'] = 'Права на смарт-процесс';
// Хвост «прав по этому процессу» ушёл вместе с переименованием: заголовок теперь говорит это сам, и
// в описании слово «права» стояло бы вторым за две строки. Осталось то, чего заголовок не говорит, —
// кому дают доступ и что настраивают его не здесь.
$MESS['CRM_TYPE_DETAIL_HUB_PERMISSIONS_ROW_DESCRIPTION'] = 'Настройте, кто может просматривать и изменять элементы смарт-процесса';
$MESS['CRM_TYPE_DETAIL_HUB_PERMISSIONS_OPEN'] = 'Открыть права';

// "Products and documents" section layout (Figma "Товары и документы"): the feature-card trio plus
// the secondary rows that only appear once their capability is on.
$MESS['CRM_TYPE_DETAIL_HUB_PRODUCTS_TITLE'] = 'Товары и документы';
$MESS['CRM_TYPE_DETAIL_HUB_PRODUCTS_INTRO'] = 'Считайте суммы по товарам каталога и оформляйте документы по шаблонам';
$MESS['CRM_TYPE_DETAIL_HUB_PRODUCTS_TEMPLATES_ACTION'] = 'Открыть шаблоны';
$MESS['CRM_TYPE_DETAIL_HUB_PRODUCTS_REQUISITES_ACTION'] = 'Заполнить реквизиты';

// A button caption under a _TITLE code: renaming it would orphan a phrase already sent for translation.
$MESS['CRM_TYPE_DETAIL_HUB_FEATURES_FUNNELS_EDITOR_TITLE'] = 'Открыть редактор воронок';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURES_BIZ_PROC_ACTION'] = 'Открыть дизайнер';

// Spoken, not shown: what the screen reader says when a switch reveals the button of its row.
// #ACTION# is that button's own caption, one of the phrases just above.
$MESS['CRM_TYPE_DETAIL_HUB_ACTION_REVEALED'] = 'Доступно действие: #ACTION#';

// Phrases carried over from templates/.default/lang/ru/template.php. The title heads the slider menu
// and names the screen, not the entity: "Настройки смарт-процесса" (PM, 25.09). The hyphen is
// non-breaking (U+2011): the menu column is narrow and would otherwise wrap as "смарт- / процесса".
$MESS['CRM_TYPE_DETAIL_TITLE'] = 'Настройки смарт-процесса';
$MESS['CRM_TYPE_DETAIL_FIELD_TITLE'] = 'Название смарт-процесса';
$MESS['CRM_TYPE_DETAIL_FIELD_SOURCE'] = 'Источник';
$MESS['CRM_TYPE_DETAIL_FIELD_DATES'] = 'Даты начала и завершения';
$MESS['CRM_TYPE_DETAIL_FIELD_OBSERVERS'] = 'Наблюдатели';
$MESS['CRM_TYPE_DETAIL_FIELD_RECURRING'] = 'Регулярность';
$MESS['CRM_TYPE_DETAIL_FIELD_CLIENT'] = 'Клиент';
$MESS['CRM_TYPE_DETAIL_FIELD_MY_COMPANY'] = 'Реквизиты компании';
$MESS['CRM_TYPE_DETAIL_FIELD_DAYS_BEFORE_CLOSE'] = 'Срок в днях';
$MESS['CRM_TYPE_DETAIL_TAB_FIELDS_MSGVER_1'] = 'Вид карточки';
$MESS['CRM_TYPE_DETAIL_TAB_CUSTOM_SECTION_MSGVER_1'] = 'Цифровое рабочее место';
$MESS['CRM_TYPE_DETAIL_TAB_USER_FIELDS_TITLE'] = 'Связь с другими инструментами';
$MESS['CRM_TYPE_DETAIL_IS_USE_IN_USERFIELD_ENABLED_TITLE'] = 'Элементы CRM';
$MESS['CRM_TYPE_DETAIL_RELATION_PARENT'] = 'Связать с этим смарт-процессом';
$MESS['CRM_TYPE_DETAIL_RELATION_CHILD'] = 'Связать этот смарт-процесс с другими элементами CRM';
$MESS['CRM_TYPE_DETAIL_RELATION_CHILDREN_LIST'] = 'Показывать связанные элементы списком в карточке';
$MESS['CRM_TYPE_DETAIL_CUSTOM_SECTION_SWITCHER_MSGVER_1'] = 'Добавить в рабочее место';
$MESS['CRM_TYPE_DETAIL_CUSTOM_SECTION_LABEL_MSGVER_1'] = 'Рабочее место';
$MESS['CRM_TYPE_DETAIL_CUSTOM_SECTION_LIST_MSGVER_1'] = 'Рабочие места';
$MESS['CRM_TYPE_DETAIL_CATEGORIES_DISABLED_HINT'] = 'Нельзя отключить, пока в смарт-процессе больше одной воронки';
$MESS['CRM_TYPE_DETAIL_CATEGORIES_CARD_DESCRIPTION'] = 'Создавайте воронки с отдельными стадиями, настройками карточки и правами доступа. Переносите элементы между воронками с помощью туннелей';
$MESS['CRM_TYPE_DETAIL_STAGES_CARD_DESCRIPTION'] = 'Создавайте стадии и ведите элементы в канбане. Для каждой стадии можно настроить роботов, триггеры и права доступа';
$MESS['CRM_TYPE_DETAIL_AUTOMATION_CARD_DESCRIPTION'] = 'Роботы и триггеры автоматизируют работу с элементами смарт-процесса, как со сделками и лидами';
$MESS['CRM_TYPE_DETAIL_BIZ_PROC_CARD_DESCRIPTION'] = 'Шаблоны бизнес-процессов можно запускать автоматически при создании или изменении элементов смарт-процесса';
$MESS['CRM_TYPE_DETAIL_IS_SET_OPEN_PERMISSIONS_DESCRIPTION'] = 'Доступ к новой воронке автоматически получат все роли';
$MESS['CRM_TYPE_DETAIL_RECYCLE_DISABLED_HINT'] = 'Чтобы отключить корзину, сначала удалите из неё элементы этого смарт-процесса';
$MESS['CRM_TYPE_DETAIL_PERMISSIONS_WILL_BE_RESET_ALERT'] = 'После смены расположения права доступа к смарт-процессу нужно будет настроить заново. <a href="#LINK#">Посмотреть текущие права</a>';
$MESS['CRM_TYPE_DETAIL_DELETE_CONFIRM'] = 'Удалить смарт-процесс? Вместе со смарт-процессом будут удалены все его роботы, триггеры и шаблоны бизнес-процессов. Восстановить смарт-процесс и его автоматизацию не получится';
// Microtext above the rows of the section cards (pass of 2026-09-25 over call N460476, chosen by the PM
// among variants). "Автоматизация" got its own the same evening, on the PM's request.
$MESS['CRM_TYPE_DETAIL_HUB_CARD_AUTOMATION_INTRO'] = 'Включите роботов, бизнес-процессы и повтор по расписанию для автоматизации работы с элементами';
$MESS['CRM_TYPE_DETAIL_HUB_CARD_CARD_OPTIONS_INTRO'] = 'Выберите возможности, которые нужны при работе с элементами';
$MESS['CRM_TYPE_DETAIL_HUB_CARD_PROCESS_MOVEMENT_INTRO'] = 'Настройте стадии и воронки, чтобы видеть, как элементы движутся к результату';
$MESS['CRM_TYPE_DETAIL_HUB_DELETE'] = 'Удалить смарт-процесс';
$MESS['CRM_TYPE_DETAIL_HUB_FEATURES_BIN_ACTION'] = 'Открыть корзину';

// The "Клиент" row came over from "Связи" (?-04) with no description at all: card-layout.ts expected the
// descriptor to supply one, and sp-client there has none. Lives in the layout, the descriptor stays as is.
$MESS['CRM_TYPE_DETAIL_HUB_FEATURE_CLIENT_DESCRIPTION'] = 'Добавляйте компанию и контакты клиента в элемент, чтобы связываться с ним';

$MESS['CRM_TYPE_DETAIL_HUB_RELATIONS_CRM_INTRO'] = 'Свяжите смарт-процесс с CRM, чтобы видеть связанные лиды, сделки и счета в элементах смарт-процесса, а элементы смарт-процесса — в карточках CRM';
$MESS['CRM_TYPE_DETAIL_HUB_RELATIONS_PORTAL_INTRO'] = 'Разрешите связывать задачи, события календаря и элементы CRM с элементами смарт-процесса';
$MESS['CRM_TYPE_DETAIL_HUB_RELATIONS_SP_INTRO'] = 'Свяжите смарт-процессы, если работа в одном смарт-процессе продолжается в другом';

// Строка-конструктор раздела «Связи» (D-61, спека 2026-09-17). Связь объясняет себя ПРЕДЛОЖЕНИЕМ в
// своей строке — это буквально ответ созвона N460476 (27:06): «сама подчинённость лучше всего
// покажется предложением». Схема с экрана снята, поэтому фразы колонок, карточек и сводки ушли.
//
// Предложение собирается из половин: имя процесса не склоняется (оно пользовательское), падеж
// падает на слово «элемент», имя стоит в кавычках и в именительном. Имя сущности CRM, наоборот,
// склоняется — и каждая его форма написана руками, потому что из имени в рантайме её не получить.
// «Это позволит…»: та же связь, пересказанная пользой. Заказано PM 17.09 вместо заголовка-направления.
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_CONSEQUENCE_BOTH'] = 'Связанные элементы будут видны списком в обеих карточках. Главным может быть любой из них';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_CONSEQUENCE_CHILD'] = 'С одним элементом «#PROCESS#» можно связать #MANY#';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_CONSEQUENCE_PARENT'] = 'Элементы «#PROCESS#» можно создавать прямо #IN# и видеть там списком';

// Предложный с предлогом: предлог — часть склонения, поэтому живёт во фразе, а не в рамке.
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_IN_COMPANY'] = 'в компании';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_IN_CONTACT'] = 'в контакте';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_IN_DEAL'] = 'в сделке';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_IN_INVOICE'] = 'в счёте';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_IN_LEAD'] = 'в лиде';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_IN_NAMED'] = 'в элементе «#TITLE#»';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_IN_ORDER'] = 'в заказе';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_IN_QUOTE'] = 'в предложении';

// Родительный множественного.
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_MANY_COMPANY'] = 'несколько компаний';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_MANY_CONTACT'] = 'несколько контактов';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_MANY_DEAL'] = 'несколько сделок';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_MANY_INVOICE'] = 'несколько счетов';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_MANY_LEAD'] = 'несколько лидов';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_MANY_NAMED'] = 'несколько элементов «#TITLE#»';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_MANY_ORDER'] = 'несколько заказов';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_MANY_QUOTE'] = 'несколько предложений';

// Родительный единственного вместе с числительным: числительное согласуется по роду, поэтому стоит
// внутри фразы, а не в рамке.
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ONE_COMPANY'] = 'одной компании';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ONE_CONTACT'] = 'одного контакта';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ONE_DEAL'] = 'одной сделки';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ONE_INVOICE'] = 'одного счёта';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ONE_LEAD'] = 'одного лида';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ONE_NAMED'] = 'одного элемента «#TITLE#»';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ONE_ORDER'] = 'одного заказа';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ONE_QUOTE'] = 'одного предложения';

// Именительный множественного с заглавной — им начинается подпись чипсы «Лиды в процессе».
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_COMPANY'] = 'Компании';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_CONTACT'] = 'Контакты';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_DEAL'] = 'Сделки';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_INVOICE'] = 'Счета';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_LEAD'] = 'Лиды';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_NAMED'] = 'Элементы «#TITLE#»';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_ORDER'] = 'Заказы';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PLURAL_QUOTE'] = 'Предложения';

// Миниатюра карточки: «что появится» показано, а не перечислено (D-63, вечер 17.09). Подписи мест
// на ней уже есть — их считает resolveRelationOptionTitle, — а имена карточек приходят из данных.
// Своя фраза миниатюре нужна одна, и говорит она её только читалке: ряд табов без имени немой.
// Красная точка «есть изменения» на табе снята (правка PM 29.09) вместе со своей фразой.
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_PREVIEW_TITLE'] = 'Предпросмотр карточек';

$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_COMPANY'] = 'Свяжите процесс с компанией, если работа касается организации: например, обслуживания по договору или проверки контрагента';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_ROW_CONTACT'] = 'Свяжите процесс с контактом, если работа касается человека: например, обращения в поддержку или записи на приём';

// Переключатель сценария. Подписи говорят, ГДЕ появится список (PM, 25.09): «Процесс в лиде» —
// элементы процесса списком в лиде, «Лиды в процессе» — лиды списком в элементе процесса. Сущность
// склоняется готовыми формами (#IN#, #PLURAL#), строка другого смарт-процесса — через «элемент».
// Заголовка над переключателем на экране нет: подписи говорят сами за себя, а фраза осталась
// доступным именем группы — для читалки «три чипсы подряд» без имени немы. Подробности каждого
// сценария человек получает подсказкой при наведении, она собирается из тех же половин.
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_BOTH'] = 'В обе стороны';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_CHILD'] = '#PLURAL# в смарт-процессе';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_PARENT'] = 'Смарт-процесс #IN#';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_SCENARIO_TITLE'] = 'Направление связи';

$MESS['CRM_TYPE_DETAIL_HUB_RELATION_SENTENCE_BOTH'] = 'У #ONE# может быть #MANY#, и наоборот';
$MESS['CRM_TYPE_DETAIL_HUB_RELATION_SENTENCE_ONE_TO_MANY'] = 'У #ONE# может быть #MANY#';
