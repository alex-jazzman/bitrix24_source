import aiRobotAnimation from './lottie/ai-robot.json';
import dataAnimation from './lottie/data.json';
import editAnimation from './lottie/edit.json';
import handshakeAnimation from './lottie/handshake.json';
import readAnimation from './lottie/read.json';
import settingsAnimation from './lottie/settings.json';
import smartAnimation from './lottie/smart.json';
import taskAnimation from './lottie/task.json';
import trashcanAnimation from './lottie/trashcan.json';

const ICON_ANIMATIONS: Map<string, Object> = new Map([
	['AI_ROBOT', aiRobotAnimation],
	['DATA_READING', readAnimation],
	['DATABASE', dataAnimation],
	['EDIT_L', editAnimation],
	['HANDSHAKE', handshakeAnimation],
	['SETTINGS', settingsAnimation],
	['SMART_PROCESS', smartAnimation],
	['TASK', taskAnimation],
	['TRASHCAN', trashcanAnimation],
]);

export function getAnimationData(iconName: ?string): ?Object
{
	return iconName ? ICON_ANIMATIONS.get(iconName) ?? null : null;
}
