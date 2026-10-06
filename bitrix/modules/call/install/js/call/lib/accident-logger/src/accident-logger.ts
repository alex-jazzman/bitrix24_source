import { Loc } from 'main.core';

import { CallSettingsManager } from 'call.lib.settings-manager';
import { AccidentManager } from './classes/accident-manager';
import { AccidentStorage } from './classes/accident-storage';
import { LogEntryProvider } from './classes/log-entry-provider';

const sendIntervalSecs = CallSettingsManager.accidentLogSendIntervalSecs || 0;
const maxStorageAgeSecs = CallSettingsManager.accidentLogGroupMaxAgeSecs || 0;
const userId: string = Loc.getMessage('USER_ID') as string;

const accidentStorage = new AccidentStorage(maxStorageAgeSecs);
const logEntryProvider = new LogEntryProvider(userId);
export const accidentLogger = new AccidentManager(accidentStorage, logEntryProvider, sendIntervalSecs);

// @ts-ignore
window.accidentLogger = accidentLogger;
