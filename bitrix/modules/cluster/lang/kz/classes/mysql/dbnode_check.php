<?php
$MESS["CLU_AFTER_CONNECT_D7_MSG"] = "Басты дерекқор мен өнімнің ортасы php_interface/after_connect_d7.php файлы болмайтындай етіп бапталуы керек";
$MESS["CLU_AFTER_CONNECT_MSG"] = "Басты дерекқор мен өнімнің ортасы php_interface/after_connect.php файлы болмайтындай етіп бапталуы керек";
$MESS["CLU_AFTER_CONNECT_WIZREC"] = "Қажетті баптауларды орындаңыз. Өнімнің дұрыс жұмыс істейтініне көз жеткізіңіз. Файлды жойып, шеберді қайтадан іске қосыңыз.";
$MESS["CLU_AUTO_INCREMENT_INCREMENT_ERR_MSG"] = "#Node_id# -ге тең ID бар серверде auto_increment_increment параметрінің мәні дұрыс емес. Ол #value# -ге тең болуы керек (ағымдағы мән auto_increment_increment: #current#).";
$MESS["CLU_AUTO_INCREMENT_INCREMENT_NODE_ERR_MSG"] = "Қосылған серверде auto_increment_increment параметрінің мәні дұрыс емес. Ол #value# -ге тең болуы керек (ағымдағы мән auto_increment_increment: #current#).";
$MESS["CLU_AUTO_INCREMENT_INCREMENT_OK_MSG"] = "Кластер серверлерінде auto_increment_increment параметрінің мәні #value# -ге тең болуы керек.";
$MESS["CLU_AUTO_INCREMENT_INCREMENT_WIZREC"] = "My.cnf файлында auto_increment_increment параметрінің мәнін #value# мәніне орнатыңыз. MySQL қайта іске қосыңыз және \"Әрі қарай\" батырмасын басыңыз.";
$MESS["CLU_AUTO_INCREMENT_OFFSET_ERR_MSG"] = "#node_id# идентификаторы бар серверде auto_increment_offset параметрінің мәні дұрыс емес. Ол #current# тең болмауы керек.";
$MESS["CLU_AUTO_INCREMENT_OFFSET_NODE_ERR_MSG"] = "Қосылған серверде auto_increment_offset параметрінің мәні дұрыс емес. Ол #current# тең болмауы керек.";
$MESS["CLU_AUTO_INCREMENT_OFFSET_OK_MSG"] = "Кластер серверлерінде auto_increment_offset параметрінің мәні коллизияға әкелмеуі керек.";
$MESS["CLU_AUTO_INCREMENT_OFFSET_WIZREC"] = "My.cnf файлында басқа серверлерден өзгеше auto_increment_offset параметрінің мәнін орнатыңыз. MySQL қайта іске қосыңыз және \"Әрі қарай\" батырмасын басыңыз.";
$MESS["CLU_CHARSET_MSG"] = "Сервер, дерекқор, қосылым және клиент үшін кодтау сәйкес келуі керек.";
$MESS["CLU_CHARSET_WIZREC"] = "MySQL параметрлерін баптаңыз:<br />
&nbsp;character_set_server (ағымдағы мән: #character_set_server#),<br />
&nbsp;character_set_database (ағымдағы мән: #character_set_database#),<br />
&nbsp;character_set_connection (ағымдағы мән: #character_set_connection#),<br />
&nbsp;character_set_client (ағымдағы мән: #character_set_client#).<br />
Өнімнің дұрыс жұмыс істеп тұрғанына көз жеткізіп, шеберді қайтадан іске қосыңыз.";
$MESS["CLU_COLLATION_MSG"] = "Сервер, дерекқор және қосылым үшін сұрыптау ережелері сәйкес келуі керек.";
$MESS["CLU_COLLATION_WIZREC"] = "MySQL параметрлерін баптаңыз:<br />
&nbsp;collation_server (ағымдағы мән: #collation_server#),<br />
&nbsp;collation_database (ағымдағы мән: #collation_database#),<br />
&nbsp;collation_connection (ағымдағы мән: #collation_connection#).<br />
Өнімнің дұрыс жұмыс істеп тұрғанына көз жеткізіп, шеберді қайтадан іске қосыңыз.";
$MESS["CLU_FLUSH_ON_COMMIT_MSG"] = "Репликацияның сенімділігін арттыру үшін InnoDB қолданған кезде innodb_flush_log_at_trx_commit = 1 параметрін орнатқан жөн (ағымдағы мән: #innodb_flush_log_at_trx_commit#).";
$MESS["CLU_LOG_BIN_MSG"] = "Бас серверде журналдауды қосу керек (ағымдағы log-bin мәні: #log-bin#).";
$MESS["CLU_LOG_BIN_NODE_MSG"] = "Қосылған серверде журналдауды қосу керек (ағымдағы log-bin мәні: #log-bin#).";
$MESS["CLU_LOG_BIN_WIZREC"] = "My.cnf файлында log-bin=mysql-bin. параметрін қосыңыз. MySQL қайта іске қосыңыз және \"Әрі қарай\" батырмасын басыңыз.";
$MESS["CLU_LOG_SLAVE_UPDATES_MSG"] = "#node_id# ID бар серверде master дерекқорынан келген сұрауларды журналдау қосылмаған. Егер оған slave дерекқоры қосылған болса, бұл қажет болады. Ағымдағы мән log-slave-updates: #log-slave-updates#.";
$MESS["CLU_LOG_SLAVE_UPDATES_OK_MSG"] = "Кластер серверлерінің шебері басқа master дерекқорынан келген сұрауларды журналдауды қосуы керек.";
$MESS["CLU_LOG_SLAVE_UPDATES_WIZREC"] = "My.cnf файлында log-slave-updates параметрінің мәнін #value# мәніне орнатыңыз. MySQL қайта іске қосыңыз және \"Әрі қарай\" батырмасын басыңыз.";
$MESS["CLU_MASTER_CHARSET_MSG"] = "Бас сервер мен жаңа қосылымды кодтау және сұрыптау ережелері сәйкес келуі керек.";
$MESS["CLU_MASTER_CHARSET_WIZREC"] = "MySQL параметрлерін баптаңыз:<br />
&nbsp;character_set_server (ағымдағы мән: #character_set_server#),<br />
&nbsp;collation_server (ағымдағы мән: #collation_server#).<br />
Өнімнің дұрыс жұмыс істеп тұрғанына көз жеткізіп, шеберді қайтадан іске қосыңыз.";
$MESS["CLU_MASTER_CONNECT_ERROR"] = "Бас дерекқорға қосылу қатесі:";
$MESS["CLU_MASTER_STATUS_MSG"] = "Репликация мәртебесін тексеру үшін артықшылықтар жеткіліксіз.";
$MESS["CLU_MASTER_STATUS_WIZREC"] = "Сұрауды орындаңыз: #sql#.";
$MESS["CLU_MAX_ALLOWED_PACKET_MSG"] = "Slave дерекқорындағы max_allowed_packet параметрінің мәні бас дерекқор мәнінен кем болмауы керек.";
$MESS["CLU_MAX_ALLOWED_PACKET_WIZREC"] = "My.cnf файлында max_allowed_packet параметрінің мәнін орнатыңыз және MySQL қайта іске қосыңыз.";
$MESS["CLU_NOT_MASTER"] = "Бас дерекқор ретінде көрсетілген дерекқор ондай емес.";
$MESS["CLU_RELAY_LOG_ERR_MSG"] = "#node_id# идентификаторы бар серверде журналды оқу қосылмаған (ағымдағы relay-log мәні: #relay-log#).";
$MESS["CLU_RELAY_LOG_OK_MSG"] = "Кластер серверлерінде журналды оқу қосулы болуы керек (relay-log параметрі).";
$MESS["CLU_RELAY_LOG_WIZREC"] = "My.cnf файлында relay-log параметрінің мәнін орнатыңыз (мысалы: mysql-relay-bin) және MySQL қайта іске қосыңыз.";
$MESS["CLU_RUNNING_SLAVE"] = "Көрсетілген дерекқорда репликация процесі басталды. Қосылу мүмкін емес.";
$MESS["CLU_SAME_DATABASE"] = "Бұл дерекқор бас дерекқормен бірдей. Қосылу мүмкін емес.";
$MESS["CLU_SERVER_ID_MSG"] = "Әрбір кластер түйінінде бірегей идентификатор болуы керек (ағымдағы server-id мәні: #server-id#).";
$MESS["CLU_SERVER_ID_WIZREC"] = "My.cnf файлында server-id параметрінің мәнін орнатыңыз. MySQL қайта іске қосыңыз және \"Әрі қарай\" батырмасын басыңыз.";
$MESS["CLU_SERVER_ID_WIZREC1"] = "Server-id параметрі орнатылмаған.";
$MESS["CLU_SERVER_ID_WIZREC2"] = "Мұндай server-id бар дерекқор сервері модульде тіркелген.";
$MESS["CLU_SKIP_NETWORKING_MSG"] = "Бас серверге желі арқылы қосылуға рұқсат беру керек (ағымдағы skip-networking мәні: #skip-networking#).";
$MESS["CLU_SKIP_NETWORKING_NODE_MSG"] = "Қосылған серверге желі арқылы қосылуға рұқсат беру керек (ағымдағы skip-networking мәні: #skip-networking#).";
$MESS["CLU_SKIP_NETWORKING_WIZREC"] = "My.cnf файлында skip-networking опциясын жойыңыз немесе түсініктеме беріңіз. MySQL қайта іске қосыңыз және \"Әрі қарай\" батырмасын басыңыз.";
$MESS["CLU_SLAVE_PRIVILEGE_MSG"] = "Репликация үшін пайдаланушының артықшылықтары.";
$MESS["CLU_SLAVE_RELAY_LOG_MSG"] = "Relay-log параметрінің мәні көрсетілмеген. Сервер хостының атын өзгерткен кезде репликация бұзылады.";
$MESS["CLU_SLAVE_VERSION_MSG"] = "MySQL slave дерекқорының нұсқасы (#slave-version#) #required-version# нұсқасынан төмен болмауы керек.";
$MESS["CLU_SQL_MSG"] = "Пайдаланушы кестелерді құруға және жоюға, сондай-ақ деректерді енгізуге, таңдауға, өзгертуге және жоюға құқылы болуы керек.";
$MESS["CLU_SQL_WIZREC"] = "Құқықтар жеткіліксіз. Келесі SQL сұрауларын орындау мүмкін болмады:#sql_erorrs_list#";
$MESS["CLU_SYNC_BINLOGDODB_MSG"] = "Тек бір дерекқордың репликациясы бапталуы керек.";
$MESS["CLU_SYNC_BINLOGDODB_WIZREC"] = "My.cnf файлында binlog-do-db=#database# параметрін қосыңыз. MySQL қайта іске қосыңыз және \"Әрі қарай\" батырмасын басыңыз.";
$MESS["CLU_SYNC_BINLOG_MSG"] = "Репликацияның сенімділігін арттыру үшін InnoDB қолданған кезде sync_binlog = 1 параметрін орнатқан жөн (ағымдағы мән: #sync_binlog#).";
$MESS["CLU_VERSION_MSG"] = "MySQL slave дерекқорының нұсқасы (#slave-version#) бас нұсқадан (#master-version#) төмен болмауы керек.";
$MESS["CLU_VERSION_WIZREC"] = "MySQL жаңартыңыз және шеберді қайтадан іске қосыңыз.";
