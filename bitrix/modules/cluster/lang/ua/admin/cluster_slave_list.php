<?
$MESS["CLU_SLAVE_LIST_TITLE"] = "Slave бази даних";
$MESS["CLU_SLAVE_LIST_ID"] = "ID";
$MESS["CLU_SLAVE_LIST_FLAG"] = "Стан";
$MESS["CLU_SLAVE_NOCONNECTION"] = "немає підключення";
$MESS["CLU_SLAVE_UPTIME"] = "час роботи";
$MESS["CLU_SLAVE_LIST_BEHIND"] = "Відставання, сек.";
$MESS["CLU_SLAVE_LIST_STATUS"] = "Статус";
$MESS["CLU_SLAVE_LIST_NAME"] = "Назва";
$MESS["CLU_SLAVE_LIST_DB_HOST"] = "Сервер";
$MESS["CLU_SLAVE_LIST_DB_NAME"] = "База даних";
$MESS["CLU_SLAVE_LIST_DB_LOGIN"] = "Користувач";
$MESS["CLU_SLAVE_LIST_WEIGHT"] = "Використовувати, %";
$MESS["CLU_SLAVE_LIST_DESCRIPTION"] = "Опис";
$MESS["CLU_SLAVE_LIST_ADD"] = "Додати slave базу даних";
$MESS["CLU_SLAVE_LIST_ADD_TITLE"] = "Запустити майстер додавання нової slave бази даних";
$MESS["CLU_SLAVE_LIST_MASTER_ADD"] = "Додати master-slave базу даних";
$MESS["CLU_SLAVE_LIST_MASTER_ADD_TITLE"] = "Запустити майстер додавання нової master-slave бази даних";
$MESS["CLU_SLAVE_LIST_EDIT"] = "Змінити";
$MESS["CLU_SLAVE_LIST_START_USING_DB"] = "Розпочати використовувати";
$MESS["CLU_SLAVE_LIST_SKIP_SQL_ERROR"] = "Ігнорувати помилку";
$MESS["CLU_SLAVE_LIST_SKIP_SQL_ERROR_ALT"] = "Ігнорувати одну помилку SQL і продовжити реплікацію";
$MESS["CLU_SLAVE_LIST_DELETE"] = "Видалити";
$MESS["CLU_SLAVE_LIST_DELETE_CONF"] = "Видалити підключення?";
$MESS["CLU_SLAVE_LIST_PAUSE"] = "Призупинити";
$MESS["CLU_SLAVE_LIST_RESUME"] = "Поновити";
$MESS["CLU_SLAVE_LIST_REFRESH"] = "Оновити";
$MESS["CLU_SLAVE_LIST_STOP"] = "Припинити використовувати";
$MESS["CLU_SLAVE_BACKUP"] = "Резервне копіювання";
$MESS["CLU_MAIN_LOAD"] = "Мінімальне навантаження";
$MESS["CLU_SLAVE_LIST_NOTE"] = "<p>Реплікація бази даних — це процес створення і підтримки в актуальному стані її копії.</p>
<p>Які завдання вирішує:<br>
1) можливість перенесення частини навантаження з основної бази даних (master) на одну або кілька її копій (slave).<br>
2) використовувати копії в якості гарячого резерву.<br>
</p>
<p>Важливо!<br>
— Використовувати для реплікації різні сервери зі швидким зв'язком між собою.<br>
— Запуск реплікації починається з копіювання вмісту бази даних. На час копіювання публічна частина сайту буде закрита, а адміністративна — ні. Будь-які невраховані модифікації даних в період копіювання можуть у подальшому вплинути на правильність роботи сайту.<br>
</p>
<p>Інструкція по налаштуванню:<br>
Крок 1: Запустіть майстер, натиснувши на кнопку «Додати slave бази даних». На даному етапі відбувається перевірка правильності налаштування сервера і додавання підключення до списку slave баз даних.<br>
Крок 2: У списку slave баз даних у меню дій виконайте команду «Почати використовувати».<br>
Крок 3: Дотримуйтесь рекомендацій майстра.<br>
</p>
";
?>