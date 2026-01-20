<?php

class_alias('\\Bitrix\\Tasks\\Internals\\Task\\MemberTable', 'Bitrix\\Tasks\\MemberTable'); // todo: remove after performan, stafftools

class_alias('\\Bitrix\\Tasks\\Internals\\Log\\LogFacade', '\\Bitrix\\Tasks\\Internals\\Log\\Logger');
class_alias('\\Bitrix\\Tasks\\Integration\\Report\\Internals\\TaskTable', 'Bitrix\\Tasks\\TaskTable'); // used in report

class_alias('\\Bitrix\\Tasks\\Util\\Util', '\\Bitrix\\Tasks\\Util');

class_alias('\\Bitrix\\Tasks\\Util\\UI', '\\Bitrix\\Tasks\\UI');

class_alias('\\Bitrix\\Tasks\\Provider\\Query\\TaskQuery', '\\Bitrix\\Tasks\\Provider\\TaskQuery'); // todo: remove after im. calendar, tasksmobile

class_alias('\\Bitrix\\Tasks\\V2\\Internal\\Service\\Task\\Action\\Add\\Async\\Message\\AddLastActivity', 'Bitrix\\Tasks\\V2\\Internals\\Control\\Task\\Action\\Add\\Async\\Message\\AddLastActivity');
class_alias('\\Bitrix\\Tasks\\V2\\Internal\\Service\\Task\\Action\\Add\\Async\\Message\\AddDavSync', 'Bitrix\\Tasks\\V2\\Internals\\Control\\Task\\Action\\Add\\Async\\Message\\AddDavSync');
class_alias('\\Bitrix\\Tasks\\V2\\Internal\\Service\\Task\\Action\\Add\\Async\\Message\\AddScenario', 'Bitrix\\Tasks\\V2\\Internals\\Control\\Task\\Action\\Add\\Async\\Message\\AddScenario');
class_alias('\\Bitrix\\Tasks\\V2\\Internal\\Service\\Task\\Action\\Add\\Async\\Message\\AddSearchIndex', 'Bitrix\\Tasks\\V2\\Internals\\Control\\Task\\Action\\Add\\Async\\Message\\AddSearchIndex');

class_alias('\\Bitrix\\Tasks\\V2\\Internal\\Service\\Task\\Action\\Add\\Async\\Receiver\\AddLastActivity', 'Bitrix\\Tasks\\V2\\Internals\\Control\\Task\\Action\\Add\\Async\\Receiver\\AddLastActivity');
class_alias('\\Bitrix\\Tasks\\V2\\Internal\\Service\\Task\\Action\\Add\\Async\\Receiver\\AddDavSync', 'Bitrix\\Tasks\\V2\\Internals\\Control\\Task\\Action\\Add\\Async\\Receiver\\AddDavSync');
class_alias('\\Bitrix\\Tasks\\V2\\Internal\\Service\\Task\\Action\\Add\\Async\\Receiver\\AddScenario', 'Bitrix\\Tasks\\V2\\Internals\\Control\\Task\\Action\\Add\\Async\\Receiver\\AddScenario');
class_alias('\\Bitrix\\Tasks\\V2\\Internal\\Service\\Task\\Action\\Add\\Async\\Receiver\\AddSearchIndex', 'Bitrix\\Tasks\\V2\\Internals\\Control\\Task\\Action\\Add\\Async\\Receiver\\AddSearchIndex');
