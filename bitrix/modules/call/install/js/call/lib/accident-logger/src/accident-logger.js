import { CallSettingsManager } from 'call.lib.settings-manager';
import { AccidentManager } from './classes/accident-manager';
import { AccidentStorage } from './classes/accident-storage';
export { getUnknownErrorType } from './utils/get-unknown-error-type';

const sendIntervalSecs = CallSettingsManager.accidentLogSendIntervalSecs || 0;
const maxStorageAge = CallSettingsManager.accidentLogGroupMaxAgeSecs || 0;

const accidentStorage = new AccidentStorage(maxStorageAge, 100);
export const accidentLogger = new AccidentManager(accidentStorage, sendIntervalSecs);