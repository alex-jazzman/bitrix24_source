CREATE TABLE IF NOT EXISTS sms4b_sendings
(
    id                      int unsigned NOT NULL auto_increment,
    sender                  char(20)     NOT NULL,
    startSendForUser        datetime,
    startSend               datetime,
    finishSend              datetime,
    allowedDeliveryInterval char(2),
    sourceId                smallint unsigned,
    mailEvent               varchar(255),
    PRIMARY KEY (id),
    KEY id (id),
    KEY sender (sender),
    KEY startSend (startSend)
);

CREATE TABLE IF NOT EXISTS sms4b_sending_message
(
    messageId    int unsigned     NOT NULL auto_increment,
    sendingId    int unsigned     NOT NULL,
    guid         char(36)         NOT NULL,
    destination  char(20)         NOT NULL,
    text         text             NOT NULL,
    encoding     tinyint unsigned NOT NULL,
    lastModified datetime         NOT NULL,
    result       varchar(255),
    entityId     int unsigned,
    status       tinyint unsigned NOT NULL,
    PRIMARY KEY (messageId),
    FOREIGN KEY (sendingId) REFERENCES sms4b_sendings (id),
    KEY sendingId_guid (sendingId, guid),
    KEY status (status),
    KEY destination (destination)
);

CREATE TABLE IF NOT EXISTS sms4b_sendings_queue
(
    id                      int unsigned     NOT NULL auto_increment,
    guid                    char(36)         NOT NULL,
    sendingId               int unsigned     NOT NULL,
    groupId                 int unsigned,
    sender                  char(20)         NOT NULL,
    destination             char(20)         NOT NULL,
    text                    text             NOT NULL,
    encoding                tinyint          NOT NULL,
    startSend               datetime,
    finishSend              datetime,
    allowedDeliveryInterval char(2),
    sendingSource           varchar(50)     NOT NULL,
    result                  mediumint DEFAULT NULL,
    statusInQueue           tinyint unsigned NOT NULL,
    PRIMARY KEY (id),
    KEY sendingId (sendingId),
    KEY status_source_data (statusInQueue, sendingSource, startSend)
);

CREATE TABLE IF NOT EXISTS sms4b_incoming
(
    id          int unsigned      NOT NULL auto_increment,
    guid        char(36)          NOT NULL,
    moment      datetime          NOT NULL,
    time        datetime          NOT NULL,
    source      char(20)          NOT NULL,
    destination char(20)          NOT NULL,
    encoding    tinyint           NOT NULL,
    text        text,
    total       smallint unsigned NOT NULL,
    part        smallint unsigned NOT NULL,
    PRIMARY KEY (id)
);