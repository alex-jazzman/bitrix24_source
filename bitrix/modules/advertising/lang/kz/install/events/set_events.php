<?php
$MESS["ADV_BANNER_STATUS_CHANGE_DESC"] = "#EMAIL_TO# - Хабарламаны алушының EMail-і (#OWNER_EMAIL#)
#ADMIN_EMAIL# - \"баннер менеджері\" және \"әкімші\" рөлдеріне ие пайдаланушылардың EMail-і.
#ADD_EMAIL# - шарт баннерлерін басқаруға құқығы бар пайдаланушылардың EMail-і
#STAT_EMAIL# - шарт баннерлерін көру құқығы бар пайдаланушылардың EMail-і
#EDIT_EMAIL# - шарттың кейбір өрістерін өзгертуге құқығы бар пайдаланушылардың EMail-і
#OWNER_EMAIL# - шартқа қандай да бір құқығы бар пайдаланушылардың EMail-і
#BCC# - жасырын көшірме (#ADMIN_EMAIL#)
#ID# - баннер ID-і
#CONTRACT_ID# - шарттың ID-і
#CONTRACT_NAME# - шарттың тақырыпаты
#TYPE_SID# - түр ID-і
#TYPE_NAME# - түр атауы
#STATUS# - мәртебе
#STATUS_COMMENTS# - мәртебеге пікір
#NAME# - баннер тақырыпаты
#GROUP_SID# - баннер тобы
#INDICATOR# - сайтта баннер көрсетіле ме?
#ACTIVE# - баннердің белсенділік жалауы [Y | N]
#MAX_SHOW_COUNT# - баннердің максималды көрсетілім саны
#SHOW_COUNT# - баннер сайтта қанша рет көрсетілді
#MAX_CLICK_COUNT# - баннердегі ең көп шерту саны
#CLICK_COUNT# - баннерге қанша рет шертілді
#DATE_LAST_SHOW# - баннердің соңғы көрсетілген күні
#DATE_LAST_CLICK# - баннерге соңғы рет шертілген күн
#DATE_SHOW_FROM# - баннерді көрсету басталған күн
#DATE_SHOW_TO# - баннерді көрсету аяқталатын күн
#IMAGE_LINK# - баннер кескініне сілтеме
#IMAGE_ALT# - кескіндегі қалқымалы кеңестің мәтіні
#URL# - кескіндегі URL
#URL_TARGET# - суреттің URL мекенжайын қайда орналастыру керек
#CODE# - баннер коды
#CODE_TYPE# - баннер кодының түрі (text | html)
#COMMENTS# - баннерге пікір
#DATE_CREATE# - баннердің жасалған күні
#CREATED_BY# - баннерді кім жасады
#DATE_MODIFY# - баннердің өзгертілген күні
#MODIFIED_BY# - баннерді кім өзгертті
";
$MESS["ADV_BANNER_STATUS_CHANGE_MESSAGE"] = "# #ID# баннердің мәртебесі [#STATUS#] болып өзгерді.

>=================== Баннер параметрлері ===============================

Баннер   - [#ID#] #NAME#
Шарт - [#CONTRACT_ID#] #CONTRACT_NAME#
Түр      - [#TYPE_SID#] #TYPE_NAME#
Топ  - #GROUP_SID#

----------------------------------------------------------------------

Белсенділік: #INDICATOR#

Кезең    - [#DATE_SHOW_FROM# - #DATE_SHOW_TO#]
Көрсетілді   - #SHOW_COUNT# / #MAX_SHOW_COUNT# [#DATE_LAST_SHOW#]
Шертті  - #CLICK_COUNT# / #MAX_CLICK_COUNT# [#DATE_LAST_CLICK#]
Белс. жалауы - [#ACTIVE#]
Мәртебе    - [#STATUS#]
Пікір:
#STATUS_COMMENTS#
----------------------------------------------------------------------

Кескін - [#IMAGE_ALT#] #IMAGE_LINK#
URL         - [#URL_TARGET#] #URL#

Код: [#CODE_TYPE#]
#CODE#

>=====================================================================

Жасалды  - #CREATED_BY# [#DATE_CREATE#]
Өзгертілді - #MODIFIED_BY# [#DATE_MODIFY#]

Баннер параметрлерін көру үшін сілтемені пайдаланыңыз:
http://#SERVER_NAME#/bitrix/admin/adv_banner_edit.php?ID=#ID#&CONTRACT_ID=#CONTRACT_ID#&lang=#LANGUAGE_ID#

Хат автоматты түрде жазылды.
";
$MESS["ADV_BANNER_STATUS_CHANGE_NAME"] = "Баннердің мәртебесі өзгерді";
$MESS["ADV_BANNER_STATUS_CHANGE_SUBJECT"] = "[BID##ID#] #SITE_NAME#: Баннердің мәртебесі өзгерді - [#STATUS#]";
$MESS["ADV_CONTRACT_INFO_DESC"] = "#MESSAGE# - хабарлама
#EMAIL_TO# - Хабарламаны алушының EMail-і (#OWNER_EMAIL#)
#ADMIN_EMAIL# - \"баннер менеджері\" және \"әкімші\" рөлдеріне ие пайдаланушылардың EMail-і.
#ADD_EMAIL# - шарт баннерлерін басқаруға құқығы бар пайдаланушылардың EMail-і
#STAT_EMAIL# - баннер шартының статистикасын көруге құқығы бар пайдаланушылардың EMail-і
#EDIT_EMAIL# - шарттың кейбір өрістерін өзгертуге құқығы бар пайдаланушылардың EMail-і
#OWNER_EMAIL# - шартқа қандай да бір құқығы бар пайдаланушылардың EMail-і
#BCC# - жасырын көшірме (#ADD_EMAIL#)
#ID# - шарт ID-і
#INDICATOR# - сайтта шарт баннерлері көрсетіле ме?
#ACTIVE# - шарттың белсенділік жалауы [Y | N]
#NAME# - шарттың тақырыпаты
#DESCRIPTION# - шарттың сипаттамасы
#MAX_SHOW_COUNT# - шарттағы барлық баннерлердің максималды көрсетілім саны
#SHOW_COUNT# - шарт баннерлері қанша рет көрсетілгенін көрсетеді
#MAX_CLICK_COUNT# - шарттағы барлық баннерлерге максималды шерту саны
#CLICK_COUNT# - шарттағы барлық баннерлерге жасалған шертулер саны
#BANNERS# - шарттағы баннерлер саны
#DATE_SHOW_FROM# - баннерлерді көрсету басталатын күн
#DATE_SHOW_TO# - баннерлерді көрсету аяқталатын күн
#DATE_CREATE# - шарттың жасалған күні
#CREATED_BY# - шарттыі кім жасады
#DATE_MODIFY# - шарттың өзгертілген күні
#MODIFIED_BY# - шартты кім өзгертті
";
$MESS["ADV_CONTRACT_INFO_MESSAGE"] = "#MESSAGE#
Шарт: [#ID#] #NAME#
#DESCRIPTION#
>================== Шарт параметрлері ==============================

Белсенділік: #INDICATOR#

Кезең    - [#DATE_SHOW_FROM# - #DATE_SHOW_TO#]
Көрсетілді  - #SHOW_COUNT# / #MAX_SHOW_COUNT#
Шертті  - #CLICK_COUNT# / #MAX_CLICK_COUNT#
Белс. жалауы - [#ACTIVE#]

Баннер  - #BANNERS#
>=====================================================================

Жасалды  - #CREATED_BY# [#DATE_CREATE#]
Өзгертілді - #MODIFIED_BY# [#DATE_MODIFY#]

Шарт параметрлерін көру үшін сілтемені пайдаланыңыз:
http://#SERVER_NAME#/bitrix/admin/adv_contract_edit.php?ID=#ID#&lang=#LANGUAGE_ID#

Хат автоматты түрде жазылды.
";
$MESS["ADV_CONTRACT_INFO_NAME"] = "Жарнамалық шарттың параметрлері";
$MESS["ADV_CONTRACT_INFO_SUBJECT"] = "[CID##ID#] #SITE_NAME#: Жарнама шартының параметрлері";
