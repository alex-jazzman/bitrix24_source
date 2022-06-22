<?php
$MESS["CLUSTER_OPTIONS_MAX_SLAVE_DELAY"] = "Максимально возможное время отставания slave базы данных от master (сек.)";
$MESS["CLUSTER_OPTIONS_CACHE_TYPE_MEMCACHE"] = "Memcache";
$MESS["CLUSTER_OPTIONS_CACHE_TYPE_REDIS"] = "Redis";
$MESS["CLUSTER_OPTIONS_CACHE_TYPE"] = "Использовать для хранения кеша ";
$MESS["CLUSTER_OPTIONS_REDIS_SETTINGS"] = "Настройки соединения c Redis сервером";
$MESS["CLUSTER_REDIS_PCONNECT_SETTING"] = "Постоянное соединение";
$MESS["CLUSTER_OPTIONS_REDIS_FAILOWER_SETTINGS"] = "Распределение запросов в кластере";
$MESS["REDIS_OPTIONS_FAILOWER_NONE"] = "Выполнять запросы только на master нодах";
$MESS["REDIS_OPTIONS_FAILOWER_ERROR"] = "Чтение из slave в случае отказа master сервера";
$MESS["REDIS_OPTIONS_FAILOVER_DISTRIBUTE"] = "Распределять команды на чтение между master и slave серверами";
$MESS["REDIS_OPTIONS_FAILOVER_DISTRIBUTE_SLAVES"] = "Распределять команды на чтение случайным образом между slave серверами";
?>