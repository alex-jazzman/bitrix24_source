<?
$MESS["CLU_RUNNING_SLAVE"] = "У зазначеній базі даних вже запущений процес реплікації. Підключення неможливо.";
$MESS["CLU_SYNC_BINLOGDODB_WIZREC"] = "У файлі my.cnf додайте параметр binlog-do-db=#database#. Перезапустіть MySQL та натисніть кнопку «Далі».";
$MESS["CLU_LOG_BIN_WIZREC"] = "У файлі my.cnf додайте параметр log-bin=mysql-bin. Перезапустіть MySQL та натисніть кнопку «Далі».";
$MESS["CLU_MAX_ALLOWED_PACKET_WIZREC"] = "У файлі my.cnf задайте значення параметра max_allowed_packet і перезапустіть MySQL.";
$MESS["CLU_SERVER_ID_WIZREC"] = "У файлі my.cnf задайте значення параметра server-id. Перезапустіть MySQL та натисніть кнопку «Далі».";
$MESS["CLU_SKIP_NETWORKING_WIZREC"] = "У файлі my.cnf видаліть або закоментуйте параметр skip-networking. Перезапустіть MySQL та натисніть кнопку «Далі».";
$MESS["CLU_SLAVE_VERSION_MSG"] = "Версія MySQL slave бази даних (#slave-version#) повинна бути не нижче, ніж #required-version#.";
$MESS["CLU_VERSION_MSG"] = "Версія MySQL slave бази даних (#slave-version#) повинна бути не нижче, ніж версія головної (#master-version#).";
$MESS["CLU_AFTER_CONNECT_WIZREC"] = "Виконайте необхідні налаштування. Переконайтеся в правильності роботи продукту. Видаліть файл і запустіть майстер ще раз.";
$MESS["CLU_AFTER_CONNECT_MSG"] = "Головна база даних і оточення продукту повинні бути налаштовані так, щоб не було файлу php_interface/after_connect.php";
$MESS["CLU_SYNC_BINLOGDODB_MSG"] = "Повинна бути налаштована реплікація тільки однієї бази даних.";
$MESS["CLU_MAX_ALLOWED_PACKET_MSG"] = "Значення параметра max_allowed_packet у slave бази даних повинне бути не менше ніж у головної.";
$MESS["CLU_SERVER_ID_MSG"] = "Кожен вузол кластера повинен мати унікальний ідентифікатор (поточне значення server-id: #server-id#).";
$MESS["CLU_CHARSET_MSG"] = "Кодування для сервера, бази даних, підключення і клієнта повинні збігатися.";
$MESS["CLU_MASTER_CHARSET_MSG"] = "Кодування і правила сортування головного сервера і нового підключення повинні збігатися.";
$MESS["CLU_CHARSET_WIZREC"] = "Налаштуйте параметри MySQL:<br />
&nbsp;character_set_server (поточне значення: #character_set_server#),<br />
&nbsp;character_set_database (поточне значення: #character_set_database#),<br />
&nbsp;character_set_connection (поточне значення: #character_set_connection#),<br />
&nbsp;character_set_client (поточне значення: #character_set_client#).<br />
Переконайтеся у правильності роботи продукту та запустіть майстер ще раз.";
$MESS["CLU_MASTER_CHARSET_WIZREC"] = "Налаштуйте параметри MySQL:<br />
&nbsp;character_set_server (поточне значення: #character_set_server#),<br />
&nbsp;collation_server (поточне значення: #collation_server#).<br />
Переконайтеся у правильності роботи продукту та запустіть майстер ще раз.";
$MESS["CLU_COLLATION_WIZREC"] = "Налаштуйте параметри MySQL:<br />
&nbsp;collation_server (поточне значення: #collation_server#),<br />
&nbsp;collation_database (поточне значення: #collation_database#),<br />
&nbsp;collation_connection (поточне значення: #collation_connection#).<br />
Переконайтеся у правильності роботи продукту та запустіть майстер ще раз.";
$MESS["CLU_SQL_WIZREC"] = "Недостатньо прав. Не вдалося виконати наступні SQL-запити: #sql_erorrs_list#";
$MESS["CLU_SKIP_NETWORKING_MSG"] = "Необхідно дозволити підключення до головного серверу по мережі (поточне значення skip-networking: #skip-networking#).";
$MESS["CLU_VERSION_WIZREC"] = "Оновіть MySQL і запустіть майстер ще раз.";
$MESS["CLU_MASTER_CONNECT_ERROR"] = "Помилка підключення до головної бази даних:";
$MESS["CLU_SERVER_ID_WIZREC1"] = "Параметр server-id не заданий.";
$MESS["CLU_SQL_MSG"] = "Користувач повинен мати права на створення і видалення таблиць, а також на вставку, вибірку, змінення та видалення даних.";
$MESS["CLU_COLLATION_MSG"] = "Правила сортування для сервера, бази даних і підключення повинні збігатися.";
$MESS["CLU_FLUSH_ON_COMMIT_MSG"] = "При використанні InnoDB для збільшення надійності реплікації бажано встановити параметр innodb_flush_log_at_trx_commit = 1 (поточне значення: #innodb_flush_log_at_trx_commit#).";
$MESS["CLU_SYNC_BINLOG_MSG"] = "При використанні InnoDB для збільшення надійності реплікації бажано встановити параметр sync_binlog = 1 (поточне значення: #sync_binlog#).";
$MESS["CLU_SERVER_ID_WIZREC2"] = "Сервер бази даних з таким server-id вже зареєстрований у модулі.";
$MESS["CLU_LOG_BIN_MSG"] = "У головного серверу повинно бути увімкнено журналювання (поточне значення log-bin: #log-bin#).";
$MESS["CLU_NOT_MASTER"] = "Зазначена в якості головної бази даних не є такою.";
$MESS["CLU_SAME_DATABASE"] = "Ця база даних та ж сама, що і головна. Підключення неможливо.";
$MESS["CLU_SLAVE_RELAY_LOG_MSG"] = "Не задано значення параметра relay-log. При зміні імені хоста сервера реплікація буде порушена.";
$MESS["CLU_RELAY_LOG_WIZREC"] = "У файлі my.cnf задайте значення параметра relay-log (наприклад: mysqld-relay-bin) і перезавантажте MySQL.";
$MESS["CLU_MASTER_STATUS_MSG"] = "Недостатньо привілеїв для перевірки статусу реплікації.";
$MESS["CLU_MASTER_STATUS_WIZREC"] = "Виконайте запит: #sql#.";
$MESS["CLU_LOG_BIN_NODE_MSG"] = "У  сервера, що додається, повинно бути ввімкнено журналювання (поточне значення log-bin: #log-bin#).";
$MESS["CLU_SKIP_NETWORKING_NODE_MSG"] = "Необхідно дозволити підключення до  серверу , що додається  по мережі (поточне значення skip-networking: #skip-networking#).";
$MESS["CLU_AUTO_INCREMENT_INCREMENT_ERR_MSG"] = "У сервера з ID рівним #node_id# невірне значення параметра auto_increment_increment. Воно повинно бути рівним #value# (поточне значення auto_increment_increment: #current#).";
$MESS["CLU_AUTO_INCREMENT_INCREMENT_NODE_ERR_MSG"] = "У додається сервера невірне значення параметра auto_increment_increment. Воно повинно бути рівним #value# (поточне значення auto_increment_increment: #current#).";
$MESS["CLU_AUTO_INCREMENT_INCREMENT_WIZREC"] = "У файлі my.cnf задайте значення параметра auto_increment_increment рівним #value#. Перезапустіть MySQL та натисніть кнопку \"Далі\".";
$MESS["CLU_AUTO_INCREMENT_INCREMENT_OK_MSG"] = "У серверів кластера значення параметра auto_increment_increment повинно бути рівним #value#.";
$MESS["CLU_AUTO_INCREMENT_OFFSET_ERR_MSG"] = "У сервера з ID рівним #node_id# невірне значення параметра auto_increment_offset. Воно не повинно бути рівним #current#.";
$MESS["CLU_AUTO_INCREMENT_OFFSET_NODE_ERR_MSG"] = "У сервера, що додається невірне значення параметра auto_increment_offset. Воно не повинно бути рівним #current#.";
$MESS["CLU_AUTO_INCREMENT_OFFSET_WIZREC"] = "У файлі my.cnf задайте значення параметра auto_increment_offset відмінне від інших серверів. Перезапустіть MySQL та натисніть кнопку \"Далі\".";
$MESS["CLU_AUTO_INCREMENT_OFFSET_OK_MSG"] = "У серверів кластера значення параметра auto_increment_offset не повинно приводити до колізій.";
$MESS["CLU_RELAY_LOG_ERR_MSG"] = "У сервера з ID рівним #node_id# не включено читання журналу (поточне значення relay-log: #relay-log#).";
$MESS["CLU_RELAY_LOG_OK_MSG"] = "У серверів кластера має бути ввімкнено читання журналу (параметр relay-log).";
$MESS["CLU_LOG_SLAVE_UPDATES_MSG"] = "У сервера з ID рівним #node_id# не увімкнено журнал запитів,що прийшли від master бази даних. Це знадобиться, якщо до нього будуть підключені slave бази даних. Поточне значення log-slave-updates: #log-slave-updates#.";
$MESS["CLU_LOG_SLAVE_UPDATES_WIZREC"] = "У файлі my.cnf задайте значення параметра log-slave-updates рівне #value#. Перезапустіть MySQL та натисніть кнопку \"Далі\".";
$MESS["CLU_LOG_SLAVE_UPDATES_OK_MSG"] = "У master серверів кластера має бути включено журнал запитів, що прийшли від іншої master бази даних.";
$MESS["CLU_AFTER_CONNECT_D7_MSG"] = "Головна база даних і оточення продукту повинні бути налаштовані так, щоб не було файлу php_interface/after_connect_d7.php";
?>