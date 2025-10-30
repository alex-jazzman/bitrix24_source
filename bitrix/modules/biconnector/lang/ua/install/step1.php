<?php
$MESS["BICONNECTOR_CONNECTION_NOTE"] = "
<p>Не знайдено сумісних із модулем підключень до бази даних у файлі bitrix/.settings.php.</p>
<p>Буде використовуватися підключення за замовчуванням, що може бути неефективним з точки зору продуктивності.<p>
<p>Для оптимального налаштування відредагуйте файл bitrix/.settings.php:</p>
<ul>
<li>З ключа 'connections' скопіюйте ключ 'default' у ключ із новим ім'ям (наприклад: 'biconnector');
<li>Замініть значення ключа 'className' на '\Bitrix\BIConnector\DB\MysqliConnection';
<li>За необхідності додайте підключення файлу для доналаштування підключення 'include_after_connected'.
</ul>
<p>Результат може виглядати приблизно так:</p>
<pre>
  'connections' =>
  array (
    'value' =>
    array (
      'default' =>
      array (
        'className' => '\Bitrix\Main\DB\MysqliConnection',
        'host' => 'localhost',
        'database' => 'sitemanager',
        'login' => 'user',
        'password' => 'password',
        'options' => 2,
        'include_after_connected' => \$_SERVER['DOCUMENT_ROOT'] . '/bitrix/' . 'php_interface/after_connect.php',
      ),
      'biconnector' =>
      array (
        'className' => '\Bitrix\BIConnector\DB\MysqliConnection',
        'host' => 'localhost',
        'database' => 'sitemanager',
        'login' => 'user',
        'password' => 'password',
        'options' => 2,
        'include_after_connected' => \$_SERVER['DOCUMENT_ROOT'] . '/bitrix/' . 'php_interface/after_connect_bi.php',
      ),
    ),
    'readonly' => true,
  ),
</pre>
<p>Приклад вмісту файлу after_connect_bi.php:</p>
<pre>
\$this->queryExecute(\"SET NAMES 'utf-8'\");
\$this->queryExecute(\"SET sql_mode=''\");
</pre>
<p>Зверніть увагу на використання '\$this' для доналаштування підключення.</p>
<p>Важливо! Будьте дуже уважними, оскільки неправильне виправлення може призвести до повного припинення роботи сайту.<p>
<p>Бажано виконувати її або через ssh консоль або використовуючи sftp.<p>
";
$MESS["BICONNECTOR_INSTALL"] = "Установка модуля BI-конектор.";
