<?
$MESS["WD_HELP_FULL_TEXT"] = "З бібліотекою документів можна працювати двома способами: через браузер (Internet Explorer, Opera, FireFox і т.д.) або через WebDAV-клієнти ОС (для ОС Windows: компонент веб-папок, підключення диска). <br><br>
<ul>
	<li><b><a href=\"#iewebfolder\">Робота з бібліотекою документів у веб-браузері</a></b></li>
	<li><b><a href=\"#ostable\">Таблиця порівнянь клієнтських WebDAV-застосунків</a></b></li>
	<li><b><a href=\"#oswindows\">Підключення бібліотеки документів у ОС Windows</a></b></li>
	<ul>
		<li><a href=\"#oswindowsnoties\">Обмеження ОС Windows</a></li>
		<li><a href=\"#oswindowsreg\">Дозвіл авторизації без https</a></li>
		<li><a href=\"#oswindowswebclient\">Перезапуск служби Веб-клієнт</a></li>
		<li><a href=\"#oswindowsfolders\">Підключення через компонент Веб-папок</a></li>
		<li><a href=\"#oswindowsmapdrive\">Підключення мережевого диска</a></li>

	</ul>
	<li><b><a href=\"#osmacos\">Підключення до бібліотеки в Mac OS, Mac OS X</a></b></li>
	<li><b><a href=\"#maxfilesize\">Збільшення максимального розміру файлів, що завантажуються</a></b></li>
</ul>


<h2><a name=\"browser\"></a>Робота з бібліотекою документів у веб-браузері</h2>
<h4><a name=\"upload\"></a>Завантаження документів</h4>
<p>Для виконання завантаження документів перейдіть до папки, до якої необхідно завантажити документи. Натисніть кнопку <b>Завантажити</b>, яка розташована на Контекстній панелі:</p>
<p><img src=\"#TEMPLATEFOLDER#/images/load_contex_panel.png\" border=\"0\"/></p>
<p>Відкриється форма для завантаження файлів, яка має декілька подань:</p>
<ul>
<li><b>одиночне завантаження</b> - дозволяє легко й швидко завантажити один документ;</li>
<li><b>звичайне</b> - дозволяє виконати пофайлове завантаження документів з різних директорій (кнопка <b>Додати файли</b>) або завантажити документи якої-небудь папки (кнопка <b>Додати папку</b>);</li>
<li><b>класичне</b> - слугує для завантаження документів з певної директорії;</li>
<li><b>просте</b> - використовується для індивідуального завантаження кожного документа.</li>
</ul>

<p>Виберіть вигляд форми, що підходить вам, та вкажіть документи, які повинні бути завантажені.</p>
<p><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/load_form.png',661,575,'Форма для завантаження документів')\">
<img src=\"#TEMPLATEFOLDER#/images/load_form_sm.png\" style=\"CURSOR: pointer\" width=\"300\" height=\"261\" alt=\"Натисніть на малюнок, щоб збільшити\"  border=\"0\"/></a></p>

<p>Натисніть кнопку <b>Завантажити</b>.</p>

<br/>
<h4><a name=\"bizproc\"></a>Запуск бізнес-процесу</h4>

<p>У деяких випадках потрібне виконання деяких операцій з завантаженим документом. Наприклад, затвердити або погодити документ. Для цього використовуються бізнес-процеси</p>

<p>Для запуску бізнес-процесу в контекстному меню пункт <b>Новий бізнес-процес</b>:</p>
<p><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/new_bizproc.png',622,459,'Запуск бізнес-процесу')\">
<img src=\"#TEMPLATEFOLDER#/images/new_bizproc_sm.png\" style=\"CURSOR: pointer\" alt=\"Натисніть на малюнок, щоб збільшити\"  border=\"0\"/></a></p>
#BPHELP#
<p>Для переходу до управління шаблонами бізнес-процесів натисніть на кнопку <b>Бізнес-процеси</b>, яка розташована на контекстній панелі:</p>

<br/>
<h4><a name=\"delete\"></a>Зміна, видалення документів</h4>
<p>Управління документами здійснюється або за допомогою контекстного меню:
<p><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/delete_file.png',399,516,'Зміна, видалення документів')\">
<img src=\"#TEMPLATEFOLDER#/images/delete_file_sm.png\" style=\"CURSOR: pointer\" alt=\"Натисніть на малюнок, щоб збільшити\"  border=\"0\"/></a></p>
або за допомогою панелі групових дій, розташованих під списком документів.
<br/><br/>

<br>
<h2><a name=\"ostable\"></a>Таблиця порівнянь клієнтських WebDAV-застосунків</h2>

<p>
<div style=\"border:1px solid #ffc34f; background: #fffdbe;padding:1em;\">
	<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\">
		<tr>
			<td style=\"border-right:1px solid #FFDD9D; padding-right:1em;\">
				<img src=\"/bitrix/components/bitrix/webdav.help/templates/.default/images/help.png\" width=\"20\" height=\"18\" border=\"0\"/>
			</td>
			<td style=\"padding-left:1em;\">
				При використанні WebDAV-клієнта для управління бібліотекою в разі <b>документообігу</b> або <b>бізнес-процесів</b>, є деякі обмеження: <br/><br/>
				1. не можна запустити бізнес-процес для документу; <br/>
				2. не можна завантажувати, змінювати документи, якщо на автозапуску знаходяться бізнес-процеси з обов'язковими параметрами автозапуску без значень за умовчанням; <br/>
				3. простежити історію документу.
			</td>
		</tr>
	</table>
</div>
</p>


<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\" width=\"100%\" class=\"wd-main data-table\">
	<thead>
		<tr class=\"wd-row\">
			<th class=\"wd-cell\">WebDAV-клієнт</th>
			<th class=\"wd-cell\">Авторизація<br />Windows (IWA)</th>
			<th class=\"wd-cell\">Дайджест<br /> авторизація<br />(Digest)</th>
			<th class=\"wd-cell\">Авторизація<br />базова (Basic)</th>
			<th class=\"wd-cell\">SSL</th>
			<th class=\"wd-cell\">Порт</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><a href=\"#oswindowsfolders\"><u>Веб&ndash;папка</u></a>, Windows 7</td>
			<td>+</td>
			<td>+</td>
			<td>+&nbsp;<sup><small><a title='Необхідно внести зміни до реєстру' href='#osnote2'>[2]</a></small></sup></td>
			<td>&ndash;&nbsp;<sup><small><a title='Не підтримується операційною системою' href='#osnote1'>[1]</a></small></sup></td>
			<td>все</td>
		</tr>
		<tr>
			<td><a href=\"#oswindowsfolders\"><u>Веб&ndash;папка</u></a>, Vista SP1</td>
			<td>+</td>
			<td>+</td>
			<td>+&nbsp;<sup><small><a title='Необхідно внести зміни до реєстру' href='#osnote2'>[2]</a></small></sup></td>
			<td>+</td>
			<td>все</td>
		</tr>
		<tr>
			<td><a href=\"#oswindowsfolders\"><u>Веб&ndash;папка</u></a>, Windows XP</td>
			<td>+</td>
			<td>&ndash;&nbsp;<sup><small><a title='Не підтримується операційною системою' href='#osnote1'>[1]</a></small></sup></td>
			<td>+&nbsp;<sup><small><a title='Необхідно внести зміни до реєстру' href='#osnote2'>[2]</a></small></sup></td>
			<td>+</td>
			<td>все</td>
		</tr>
		<tr>
			<td><a href=\"#oswindowsfolders\"><u>Веб&ndash;папка</u></a>, Windows 2003/2000
				<sup><small><a title='За умовчанням не встановлено в операційній системі' href='#osnote3'>[3]</a></small></sup></td>
			<td>+</td>
			<td>&ndash;&nbsp;<sup><small><a title='Не підтримується операційною системою' href='#osnote1'>[1]</a></small></sup></td>
			<td>+&nbsp;<sup><small><a title='Необхідно внести зміни до реєстру' href='#osnote2'>[2]</a></small></sup></td>
			<td>+</td>
			<td>все</td>
		</tr>
		<tr>
			<td><a href=\"#oswindowsfolders\"><u>Веб&ndash;папка</u></a>, Windows Server 2008
				<sup><small><a title='За умовчанням не встановлено в операційній системі' href='#osnote3'>[3]</a></small></sup></td>
			<td>+</td>
			<td>+</td>
			<td>+&nbsp;<sup><small><a title='Необхідно внести зміни до реєстру' href='#osnote2'>[2]</a></small></sup></td>
			<td>+</td>
			<td>все</td>
		</tr>
		<tr>
			<td><a href=\"#oswindowsmapdrive\"><u>Сетевой диск</u></a>, Windows 7</td>
			<td>+</td>
			<td>+</td>
			<td>+&nbsp;<sup><small><a title='Необхідно внести зміни до реєстру' href='#osnote2'>[2]</a></small></sup></td>
			<td>+</td>
			<td>все</td>
		</tr>
		<tr>
			<td><a href=\"#oswindowsmapdrive\"><u>Мережевий диск</u></a>, Vista SP1</td>
			<td>+</td>
			<td>+</td>
			<td>+&nbsp;<sup><small><a title='Необхідно внести зміни до реєстру' href='#osnote2'>[2]</a></small></sup></td>
			<td>+</td>
			<td>все</td>
		</tr>
		<tr>
			<td><a href=\"#oswindowsmapdrive\"><u>Мережевий диск</u></a>, Windows XP</td>
			<td>+</td>
			<td>&ndash;&nbsp;<sup><small><a title='Не підтримується операційною системою' href='#osnote1'>[1]</a></small></sup></td>
			<td>&ndash;&nbsp;<sup><small><a title='Не підтримується операційною системою' href='#osnote1'>[1]</a></small></sup></td>
			<td>&ndash;&nbsp;<sup><small><a title='Не підтримується операційною системою' href='#osnote1'>[1]</a></small></sup></td>
			<td>80</td>
		</tr>
		<tr>
			<td><a href=\"#oswindowsmapdrive\"><u>Мережевий диск</u></a>, Windows 2003/2000</td>
			<td>+</td>
			<td>&ndash;&nbsp;<sup><small><a title='Не підтримується операційною системою' href='#osnote1'>[1]</a></small></sup></td>
			<td>&ndash;&nbsp;<sup><small><a title='Не підтримується операційною системою' href='#osnote1'>[1]</a></small></sup></td>
			<td>&ndash;&nbsp;<sup><small><a title='Не підтримується операційною системою' href='#osnote1'>[1]</a></small></sup></td>
			<td>80</td>
		</tr>
		<tr>
			<td>MS Office 2007/2003/XP</td>
			<td>+</td>
			<td>+</td>
			<td>+</td>
			<td>+</td>
			<td>все</td>
		</tr>
		<tr>
			<td>MS Office 2010</td>
			<td>+</td>
			<td>+</td>
			<td>+&nbsp;<sup><small><a title='Необхідно внести зміни до реєстру' href='#osnote2'>[2]</a></small></sup></td>
			<td>+</td>
			<td>все</td>
		</tr>
		<tr>
			<td><a href=\"#osmacos\"><u>MAC OS X</u></a></td>
			<td>&ndash;&nbsp;<sup><a title='Не підтримується операційною системою' href='#osnote1'>[1]</a></sup></td>
			<td>+</td>
			<td>+</td>
			<td>+</td>
			<td>все</td>
		</tr>
	</tbody>
</table>
<br />
<p>
	<b>Нотатки:</b>
<ol>
<li><a name='osnote1'></a>Не підтримується операційною системою.</li>
<li><a name='osnote2'></a>Для увімкнення підтримки в операційній системі необхідно <a href='#oswindowsreg'>внести зміни до реєстру</a>.</li>
<li><a name='osnote3'></a>За умовчанням служба <i>Веб-клієнт</i> (<i>WebClient</i>) не встановлена в операційній системі.
	Необхідно встановити <i>Доповнення</i> (<i>Features</i>) наступним чином:
	<ul>
		<li><i>Start -> Administrative Tools -> Server Manager -> Features</i></li>
		<li>Справа зверху натиснути на <i>Add Features</i></li>
		<li>Обрати <i>Desktop Experience</i>, встановити</li>
	</ul>
</li>
</ol>
</p>
<br>
<h2><a name=\"oswindows\"></a>Підключення бібліотеки документів в ОС Windows</h2>
<h4><a name=\"oswindowsnoties\"></a>Обмеження ОС Windows</h4>
<div style=\"border:1px solid #ffc34f; background: #fffdbe;padding:1em;\">
	<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\">
		<tr>
			<td style=\"border-right:1px solid #FFDD9D; padding-right:1em;\">
				<img src=\"/bitrix/components/bitrix/webdav.help/templates/.default/images/help.png\" width=\"20\" height=\"18\" border=\"0\"/>
			</td>
			<td style=\"padding-left:1em;\">
				<p>У <b>Windows 7</b> компонент веб-папок не працює за захищеним протоколом. Для роботи з бібліотекою з Windows 7 вам необхідно працювати по протоколу HTTP. </p>
				<p>У <b>Windows XP</b> завжди необхідно зазначати номер порту, навіть в тому випадку, якщо використовується 80 порт (http://servername:80/).</p>
				<p><b>Перш ніж підключати бібліотеку документів, переконайтеся, що запущена служба Веб-клієнт (WebClient).</b></p>
			</td>
		</tr>
	</table>
</div>

<h4><a name=\"oswindowsreg\">Дозвіл авторизації без https</a></h4>
<p><b>По-перше</b>, необхідно змінити параметр <b>Basic authentication</b> у реєстрі ОС Windows: </p>
<ul>
  <li><a href=\"/bitrix/webdav/xp.reg\">зміниті реєстр</a> для <b>Windows XP, Windows 2003 Server</b></li>
  <li><a href=\"/bitrix/webdav/vista.reg\">зміниті реєстр</a> для <b>Windows 7, Vista, Windows 2008 Server</b></li>
  <li><a href=\"/bitrix/webdav/office14.reg\">зміниті реєстр</a> для <b>Microsoft Office 2010</b></li>
</ul>
<p>Натисніть кнопку <b>Запустити</b> у вікні завантаження файлу у діалозі <b>Редактора реєстру</b> з попередженням про недостовірність джерела натисніть <b>Так</b>:</p>
<p><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/vista_reg_2.png',572,212,'Діалог ОС');\">
<img src=\"#TEMPLATEFOLDER#/images/vista_reg_2_sm.png\" style=\"CURSOR: pointer\" width=\"250\" height=\"93\" alt=\"Натисніть на малюнок, щоб збільшити\"  border=\"0\"/></a></p>
<p>Якщо ви використовуєте браузер, який не дозволяє запускати .reg файли, то необхідно завантажити файл та запустити або внести зміни до реєстру вручну за допомогою <b>Редактора реєстра</b>.</p>
<p><b>Зміна параметрів за допомогою Редактора реєстра</b></p>
<p>Виконайте команду: <b>Пуск &gt; Виконати</b>. Відкриється вікно <b>Запуск програми</b>:</p>

<p><img src=\"#TEMPLATEFOLDER#/images/regedit.png\" width=\"347\" height=\"179\" border=\"0\"/></a></p>

<p>У полі <b>Открыть</b> введіть <b>regedit</b> та натисніть кнопку <b>ОК</b>.</p>
<p>Для <b>Windows XP, Windows 2003 Server</b> необхідно змінити значення параметра на:</p>
<p></p>
  <table cellspacing=\"0\" cellpadding=\"0\" border=\"1\">
    <tbody>
      <tr><td width=\"638\" valign=\"top\">
          <p>[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\WebClient\\Parameters] &quot;UseBasicAuth&quot;=dword:00000001</p>
         </td></tr>
     </tbody>
   </table>
<p></p>
<p>Для <b>Windows 7, Vista, Windows 2008 Server</b> потрібно змінити значення параметра або створити запис у реєстрі:</p>
	<table cellspacing=\"0\" cellpadding=\"0\" border=\"1\">
		<tbody>
			<tr><td width=\"638\" valign=\"top\">
				<p>[HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Services\\WebClient\\Parameters]
				<br />
				&quot;BasicAuthLevel&quot;=dword:00000002</p>
			</td></tr>
		</tbody>
	</table>

<p><b>По-друге</b>, необхідно перезапустити службу <a href=\"#oswindowswebclient\"><b>Веб-клієнт (WebClient)</b></a>.</p>
<h4><a name=\"oswindowswebclient\"></a><b>Перезапуск служби Веб-клієнт</b></h4>
<p>Для перезапуску перейдіть: <b>Пуск &gt; Панель керування &gt; Адміністрування &gt; Служби</b>. Відкриється діалог <b>Служби</b>:
<p><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/web_client.png',638,450,'Служби');\">
<img src=\"#TEMPLATEFOLDER#/images/web_client_sm.png\" style=\"CURSOR: pointer\" width=\"300\" height=\"212\" alt=\"Натисніть на малюнок, щоб збільшити\"  border=\"0\"/></a></p>
<p>Знайдіть у загальному списку служб рядок <b>Веб-клієнт (WebClient)</b>, перезапустіть (запустіть). Щоб служба запускалася надалі при старті ОС, необхідно у властивостях служби встановити значення параметра <b>Тип запуску</b> в <b>Авто</b>:
<p><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/web_client_prop.png',410,461,'Властивість служби Веб-клієнт');\">
<img src=\"#TEMPLATEFOLDER#/images/web_client_prop_sm.png\" style=\"CURSOR: pointer\" width=\"205\" height=\"230\" alt=\"Натисніть на малюнок, щоб збільшити\"  border=\"0\"/></a></p></li>
<p>Можна приступати безпосередньо до підключення папки.</p>

<h4><a name=\"oswindowsfolders\">Підключення через компонент Веб-папок (web-folders)</a></h4>
<div style=\"border:1px solid #ffc34f; background: #fffdbe;padding:1em;\">
	<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\">
		<tr>
			<td style=\"border-right:1px solid #FFDD9D; padding-right:1em;\">
				<img src=\"/bitrix/components/bitrix/webdav.help/templates/.default/images/help.png\" width=\"20\" height=\"18\" border=\"0\"/>
			</td>
			<td style=\"padding-left:1em;\">
				У <b>Windows 7</b> не працює підключення за захищеним протоколу HTTPS/SSL.<br>
				У <b>Windows 2003 Server</b> компонент веб-папок не встановлено. Необхідно встановити компонент веб-папок ( <a href=\"http://www.microsoft.com/downloads/details.aspx?displaylang=ru&FamilyID=17c36612-632e-4c04-9382-987622ed1d64\" target=\"_blank\">перейти до сайту Microsoft</a> ).
			</td>
		</tr>
	</table>
</div>
<p>Перш, ніж підключати бібліотеку документів, переконайтеся, що <a href=\"#oswindowsreg\">внесені зміни до реєстру</a> та <a href=\"#oswindowswebclient\">запущена служба Веб-клієнт (WebClient).</a></p>
<p>Для підключення до бібліотеки документів даним способом необхідний компонент веб-папок. Бажано встановити останню версію програмного забезпечення для веб-папок ( <a href=\"http://www.microsoft.com/downloads/details.aspx?displaylang=ru&FamilyID=17c36612-632e-4c04-9382-987622ed1d64\" target=\"_blank\">перейти до сайту Microsoft</a> ) на клієнтський комп'ютер. </p>
<p>Натисніть на кнопку <b>Підключити</b>, розташовану на панелі інструментів. </p>
<p><img border=\"0\" src=\"#TEMPLATEFOLDER#/images/load_contex_panel.png\" /></p>
<p>У діалоговому вікні ви побачите доступні способи підключення для вашого браузера та ОС.</p>
<p><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/connection.png',719,490,'Підключення');\">
<img src=\"#TEMPLATEFOLDER#/images/connection_sm.png\" style=\"CURSOR: pointer\" alt=\"Натисніть на малюнок, щоб збільшити\"  border=\"0\"/></a></p>
<p>Якщо ви не використовуєте <b>Internet Explorer</b> або якщо бібліотека не була відкрита як веб-папка при натисканні на кнопку в діалоговому вікні, то виконайте наступні дії:</p>
<ul>
<li>Запустіть <b>Провідник</b></li>
<li>Оберіть в меню пункт <b>Сервіс &gt; Підключити мережевий диск</b></li>
<li>За допомогою посилання <b>Підписатися на сховище в Інтернеті або підключитися до мережного серверу</b> запустіть <b>Майстер додавання до мережевого оточення</b>:</p>
<p><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/network_add_1.png',447,322,'Підключення мережевого диску');\">
<img width=\"250\" height=\"180\" border=\"0\" src=\"#TEMPLATEFOLDER#/images/network_add_1_sm.png\" style=\"cursor: pointer;\" alt=\"Натисніть на малюнок, щоб збільшити\" /></a></li>
<li>Натисніть кнопку <b>Далі</b>, відкриється друге вікно <b>Майстра</b></li>
<li>У цьому вікні зробіть активною позицію <b>Оберіть інше мережеве розміщення</b> та натисніть кнопку <b>Далі</b>. Відкриється наступний крок <b>Майстра</b>:
<p><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/network_add_4.png',563,459,'Додавання до мережевого оточення: Крок 3');\">
<img width=\"250\" height=\"204\" border=\"0\" src=\"#TEMPLATEFOLDER#/images/network_add_4_sm.png\" style=\"cursor: pointer;\" alt=\"Натисніть на малюнок, щоб збільшити\" /></a></li>
<li>У полі <b>Мережева адреса або адреса в Інтернеті</b> введіть URL папки, що підключається, вигляду: <i>http://<ваш_сервер>/docs/shared/</i>.</li>
<li>Натисніть кнопку <b>Далі</b>. Якщо з'явиться вікно для авторизації, то введіть дані для авторизації на сервері.</li>
</ul>

<p>Для подальшого відкриття папки виконайте команду: <b>Пуск > Мережеве оточення > Ім'я папки</b>.</p>

<br />
<br />

<h4><a name=\"oswindowsmapdrive\"></a>Підключення мережевого диску</h4>
<div style=\"border:1px solid #ffc34f; background: #fffdbe;padding:1em;\">
	<table cellpadding=\"0\" cellspacing=\"0\" border=\"0\">
		<tr>
			<td style=\"border-right:1px solid #FFDD9D; padding-right:1em;\">
				<img src=\"/bitrix/components/bitrix/webdav.help/templates/.default/images/help.png\" width=\"20\" height=\"18\" border=\"0\"/>
			</td>
			<td style=\"padding-left:1em;\">
				<b>Увага!</b> В ОС <b>Windows XP та Windows Server 2003</b> не працює підключення за захищеним протоколом HTTPS/SSL.
			</td>
		</tr>
	</table>
</div>
<p>Для підключення бібліотеки як мережевого диска у <b>Windows 7</b> за захищеним протоколом <b>HTTPS/SSL</b>: виконайте команду <b>Пуск &gt; Виконайте &gt; cmd</b>. У командному рядку введіть:<br>
<table cellspacing=\"0\" cellpadding=\"0\" border=\"1\">
	<tbody>
		<tr><td width=\"638\" valign=\"top\">
			<p>net use z: https://&lt;ваш_сервер&gt;/docs/shared/ /user:&lt;userlogin&gt; *</p>
		</td></tr>
	</tbody>
</table>
<br>

<p>Для підключення бібліотеки як мережевого диска за допомогою <b>провідника</b>:
<ul>
<li>Запустіть <b>Провідник.</b></li>
<li>Оберіте в меню пункт <i>Сервіс > Підключити мережевий диск</i>. Відкриється діалог під'єднання мережевого диска:
<br><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/network_storage.png',628,465,'Під\\'єднання мережевого диска');\">
<img width=\"250\" height=\"185\" border=\"0\" src=\"#TEMPLATEFOLDER#/images/network_storage_sm.png\" style=\"cursor: pointer;\" alt=\"Натисніть на малюнок, щоб збільшити\" /></a></li>
<li>У полі <b>Диск</b> призначте букву для папки, яка підключається.</li>
<li>У полі <b>Папка</b> введіть шлях до бібліотеки: <i>http://&lt;ваш_сервер&gt;/docs/shared/</i>. Якщо необхідно, щоб папка підключалася для перегляду при кожному запуску системи, встановіть прапорець <b>Відновлювати при вході до системи</b>.</li>
<li>Натисніть <b>Готово</b>. Якщо відкриється діалог операційної системи для авторизації, введіть дані для авторизації на сервері.</li>
</ul>
</p>
<p>Наступні відкриття папки можна здійснювати через <b>Провідник Windows</b>, де папка відображається у вигляді окремого диска, або через будь-який файловий менеджер.</p>

<h2><a name=\"osmacos\"></a>Підключення до бібліотеки у Mac OS, Mac OS X</h2>

<p>Для подключения:</p>

<ul>
<li>Откройте <i>Finder Go->Connect to Server command</i>.</li>
<li>Введите адрес к библиотеке в поле <b>Server Address</b>:</p>
<p><a href=\"javascript:ShowImg('#TEMPLATEFOLDER#/images/macos.png',465,550,'Mac OS X');\">
<img width=\"235\" height=\"278\" border=\"0\" src=\"#TEMPLATEFOLDER#/images/macos_sm.png\" style=\"cursor: pointer;\" alt=\"Натисніть на малюнок, щоб збільшити\" /></a></li>
</ul>
<br />

<h2><a name=\"maxfilesize\"></a>Збільшення максимального розміру завантажуваних файлів</h2>

<p>Максимальний розмір завантажуваного файлу - це мінімальні значення змінних PHP (<b>upload_max_filesize</b> і <b>post_max_size</b>) та параметри налаштування компонентів.</p>
<p>Якщо ви хочете збільшити квоту, яка перевищує рекомендовані значення, то внесіть такі зміни <b>php.ini</b>:</p>

<table cellspacing=\"0\" cellpadding=\"0\" border=\"1\">
  <tbody>
      <tr><td width=\"638\" valign=\"top\">
	  <p>upload_max_filesize = бажане_значення;
	  <br/>post_max_size = перевищує_розмір_upload_max_filesize;</p>
      </td></tr>
  </tbody>
</table>

<p>Якщо ви орендуєте майданчик (віртуальний хостинг), то внесіть зміни до файлу <b>.htaccess</b>:</p>

<table cellspacing=\"0\" cellpadding=\"0\" border=\"1\">
  <tbody>
      <tr><td width=\"638\" valign=\"top\">
	  <p>php_value upload_max_filesize бажане_значення<br/>
	  php_value post_max_size перевищує_розмір_upload_max_filesize</p>
      </td></tr>
  </tbody>
</table>

<p>Можливо, вам доведеться звернутися до хостера з проханням збільшити мінімальні значення змінних PHP (<b>upload_max_filesize</b> й <b>post_max_size</b>).</p>
<p>Після того, як будуть збільшені квоти PHP, слід внести зміни до налаштувань компонентів.</p>";
$MESS["WD_HELP_BPHELP_TEXT"] = "<p><b>Примітка</b>: детальну інформацію про бізнес-процеси дивіться на сторінці <a href=\"#LINK#\" target=\"_blank\">Бізнес-процеси</a>. </p>";
?>