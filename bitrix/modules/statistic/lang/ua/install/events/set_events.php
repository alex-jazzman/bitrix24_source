<?
$MESS["STATISTIC_ACTIVITY_EXCEEDING_NAME"] = "Перевищення ліміту активності";
$MESS["STATISTIC_ACTIVITY_EXCEEDING_DESC"] = "#ACTIVITY_TIME_LIMIT# — тестовий інтервал часу
#ACTIVITY_HITS# — кількість хітів за тестовий інтервал часу
#ACTIVITY_HITS_LIMIT# — максимальна кількість хітів за тестовий інтервал часу (ліміт активності)
#ACTIVITY_EXCEEDING# — перевищення кількость хітів
#CURRENT_TIME# — момент блокування (час на сервері)
#DELAY_TIME# — тривалість блокування
#USER_AGENT# — UserAgent
#SESSION_ID# — ID сесії
#SESSION_LINK# — посилання на сесію
#SERACHER_ID# — ID пошуковика
#SEARCHER_NAME# — найменування пошуковика
#SEARCHER_LINK# — посилання на список хітів пошуковика
#VISITOR_ID# — ID відвідувача
#VISITOR_LINK# — посилання на профайл відвідувача
#STOPLIST_LINK# — посилання для додавання відвідувача в стоп-лист
";
$MESS["STATISTIC_DAILY_REPORT_NAME"] = "Щоденна статистика сайту";
$MESS["STATISTIC_DAILY_REPORT_DESC"] = "#EMAIL_TO# — e-mail адміністратора сайту
#SERVER_TIME# — час на сервері на момент момент надсилання звіту
#HTML_HEADER# — відкриття тегу HTML + CSS стилі
#HTML_COMMON# — таблиця відвідуваності сайту (хіти, сесії, хости, відвідувачі, події) (HTML)
#HTML_ADV# — таблиця рекламних кампаній (TOP 10) (HTML)
#HTML_EVENTS# — таблиця типів подій (TOP 10) (HTML)
#HTML_REFERERS# — таблиця сайтів, що посилаються (TOP 10) (HTML)
#HTML_PHRASES# — таблиця пошукових фраз (TOP 10) (HTML)
#HTML_SEARCHERS# — таблиця індексації сайта (TOP 10) (HTML)
#HTML_FOOTER# — закриття тегу HTML";
$MESS["STATISTIC_DAILY_REPORT_SUBJECT"] = "#SERVER_NAME#: Статистика сайту (#SERVER_TIME#)";
$MESS["STATISTIC_DAILY_REPORT_MESSAGE"] = "#HTML_HEADER#
<font class='h2'> Узагальнена статистика сайту <font color='#A52929'>#SITE_NAME#</font><br>
Дані на <font color='#0D716F'>#SERVER_TIME#</font></font>
<br><br>
<a class='tablebodylink' href='http://#SERVER_NAME#/bitrix/admin/stat_list.php?lang=#LANGUAGE_ID#'>http://#SERVER_NAME#/bitrix/admin/stat_list.php?lang=#LANGUAGE_ID#</a>
<br>
<hr><br>
#HTML_COMMON#
<br>
#HTML_ADV#
<br>
#HTML_REFERERS#
<br>
#HTML_PHRASES#
<br>
#HTML_SEARCHERS#
<br>
#HTML_EVENTS#
<br>
<hr>
<a class='tablebodylink' href='http://#SERVER_NAME#/bitrix/admin/stat_list.php?lang=#LANGUAGE_ID#'>http://#SERVER_NAME#/bitrix/admin/stat_list.php?lang=#LANGUAGE_ID#</a>
#HTML_FOOTER#
";
$MESS["STATISTIC_ACTIVITY_EXCEEDING_SUBJECT"] = "#SERVER_NAME#: Перевищено ліміт активності";
$MESS["STATISTIC_ACTIVITY_EXCEEDING_MESSAGE"] = "На сайті #SERVER_NAME# відвідувач перевищив встановлений ліміт активності.

Починаючи з #CURRENT_TIME# відвідувача заблоковано на #DELAY_TIME# сек.

Активність  — #ACTIVITY_HITS# хитов за #ACTIVITY_TIME_LIMIT# сек. (ліміт— #ACTIVITY_HITS_LIMIT#)
Відвідувач  — #VISITOR_ID#
Сесія — #SESSION_ID#
Пошуковик — [#SERACHER_ID#] #SEARCHER_NAME#
UserAgent — #USER_AGENT#

>===============================================================================================
Щоб додати до стоп-листа скористайтеся нижченаведеним посиланням:
http://#SERVER_NAME##STOPLIST_LINK#
Для перегляду сесії відвідувача скористайтеся нижченаведеним посиланням:
http://#SERVER_NAME##SESSION_LINK#
Для перегляду профайлу відвідувача скористайтеся нижченаведеним посиланням:
http://#SERVER_NAME##VISITOR_LINK#
Для перегляду статистики хітів пошуковика скористайтеся нижченаведеним посиланням:
http://#SERVER_NAME##SEARCHER_LINK#
";
?>