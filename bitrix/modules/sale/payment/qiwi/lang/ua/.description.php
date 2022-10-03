<?
$MESS["SALE_QH_TITLE"] = "Qiwi Wallet";
$MESS["SALE_QH_DESCRIPTION"] = "<div class='adm-info-message'>
Платіжний сервіс <a href='https://ishop.qiwi.com' target='_blank'>Visa QIWI Wallet</a><br/>
<ol>
<li>Виберіть обов'язкові параметри.</li>
<li>Створіть сторінку для отримання повідомлень від платіжної системи і розташуйте на ній компонент <strong>bitrix:sale.order.payment.receive</strong>.</li>
 <li>Налаштуйте <strong>bitrix:sale.order.payment.receive</strong> на цю платіжну систему.</li>
<li>Виберіть <a href = 'https://ishop.qiwi.com/options/merchants.action'>особистому кабінеті</a> Qiwi Wallet url-адресу створеної сторінки.</li>
</ol>
</div>";
$MESS["SALE_QH_SHOP_ID"] = "Ідентифікатор магазину.";
$MESS["SALE_QH_SHOP_ID_DESCR"] = "Дізнатися цей id можна на сторінці налаштувань в розділі <a target='_blank' href='https://ishop.qiwi.com/options/merchants.action'>Налаштування HTTP-протоколу</a>.";
$MESS["SALE_QH_API_LOGIN"] = "Ідентифікатор API";
$MESS["SALE_QH_API_LOGIN_DESCR"] = "Ідентифікатор для доступу до API. Задається в <a href='https://ishop.qiwi.com/options/merchants.action' target='_blank'>налаштуваннях магазину</a> у розділі 'Аутентифікаційні дані для всіх протоколів'.";
$MESS["SALE_QH_API_PASS"] = "Пароль API";
$MESS["SALE_QH_API_PASS_DESCR"] = "Пароль для доступу до API. Задається в <a href='https://ishop.qiwi.com/options/merchants.action' target='_blank'>налаштуваннях магазину</a> у розділі 'Аутентифікаційні дані для всіх протоколів'.";
$MESS["SALE_QH_CLIENT_PHONE"] = "Телефон клієнта, на який виставляти рахунок.";
$MESS["SALE_QH_ORDER_ID"] = "Номер оплати";
$MESS["SALE_QH_ORDER_ID_DESCR"] = "(наприклад, номер замовлення в інтернет-магазині)";
$MESS["SALE_QH_SHOULD_PAY"] = "До оплати";
$MESS["SALE_QH_SHOULD_PAY_DESCR"] = "Сума рахунку.";
$MESS["SALE_QH_CURRENCY"] = "Валюта рахунку";
$MESS["SALE_QH_CURRENCY_DESCR"] = "(повинна бути у форматі ISO 4217 у буквеному або цифровому форматі)";
$MESS["SALE_QH_BILL_LIFETIME"] = "Час дії рахунку";
$MESS["SALE_QH_BILL_LIFETIME_DESCR"] = "(у хвилинах)";
$MESS["SALE_QH_FAIL_URL"] = "Url, на який користувач перенаправляється при <strong>неуспішній</strong> оплаті рахунку";
$MESS["SALE_QH_SUCCESS_URL"] = "Url, на який користувач перенаправляється при <strong>успішній</strong> оплаті рахунку";
$MESS["SALE_QH_CHANGE_STATUS_PAY"] = "Автоматично оплачувати замовлення при отриманні успішного статусу оплати";
$MESS["SALE_QH_CHANGE_STATUS_PAY_DESC"] = "(<strong>Y</strong> - так, <strong>N</strong> - ні)";
$MESS["SALE_QH_YES"] = "Так";
$MESS["SALE_QH_NO"] = "Ні";
$MESS["SALE_QH_AUTHORIZATION"] = "Спосіб авторизації";
$MESS["SALE_QH_AUTHORIZATION_DESCR"] = "Використовується для авторизації при повідомленнях. Настроюється в особистому кабінеті в розділі <a href='https://ishop.qiwi.com/options/merchants.action' target='_blank'>Налаштування Pull (REST) протоколу</a> (галочка 'Підпис'). <br/> (<strong>OPEN</strong> - Передача пароля у відкритому вигляді, <strong>SIMPLE</strong> - Використання простого підпису)";
$MESS["SALE_QH_AUTH_OPEN"] = "Передача пароля у відкритому вигляді";
$MESS["SALE_QH_AUTH_SIMPLE"] = "Використання простого підпису";
$MESS["SALE_QH_NOTICE_PASSWORD"] = "Пароль оповіщення.";
$MESS["SALE_QH_NOTICE_PASSWORD_DESCR"] = "Пароль можна змінити у пункті <a target='_blank' href='https://ishop.qiwi.com/options/merchants.action'>Змінити пароль оповіщення</a> у розділі Налаштування Pull (REST). <strong>Обов'язково вкажіть URL для сповіщення!</strong>";
?>