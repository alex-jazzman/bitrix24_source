import { Extension } from 'main.core';

export function lpad(str, length, chr)
{
	str = str.toString();
	chr = chr || ' ';

	if (str.length > length)
	{
		return str;
	}

	let result = '';
	for (let i = 0; i < length - str.length; i++)
	{
		result += chr;
	}

	return result + str;
}

export const getDateForLog = () =>
{
	const d = new Date();

	return d.getFullYear() + "-" + lpad(d.getMonth() + 1, 2, '0') + "-" + lpad(d.getDate(), 2, '0') + " " + lpad(d.getHours(), 2, '0') + ":" + lpad(d.getMinutes(), 2, '0') + ":" + lpad(d.getSeconds(), 2, '0') + "." + d.getMilliseconds();
}

export const getTimeForLog = () =>
{
	const d = new Date();

	return lpad(d.getHours(), 2, '0') + ":" + lpad(d.getMinutes(), 2, '0') + ":" + lpad(d.getSeconds(), 2, '0') + "." + d.getMilliseconds();
}

export function getLogMessage()
{
	let text = getDateForLog();

	for (let i = 0; i < arguments.length; i++)
	{
		if (arguments[i] instanceof Error)
		{
			text = arguments[i].message + "\n" + arguments[i].stack
		}
		else
		{
			try
			{
				text = text + ' | ' + (typeof (arguments[i]) == 'object' ? JSON.stringify(arguments[i]) : arguments[i]);
			} catch (e)
			{
				text = text + ' | (circular structure)';
			}
		}
	}

	return text;
}

// OTLP body.stringValue must be a string; a non-string payload makes
// the go-collector reject the whole batch via strict json.Unmarshal
export function logToString(log)
{
	if (typeof log === 'string')
	{
		return log;
	}

	try
	{
		return JSON.stringify(log) ?? String(log);
	}
	catch (e)
	{
		return String(log);
	}
}

let localConsoleLogsEnabled = false;

export const setConsoleLogsEnabled = (enabled: boolean = true) =>
{
	localConsoleLogsEnabled = !!enabled;
}

export const isConsoleLogsEnabled = () =>
{
	return Extension.getSettings('call.core')?.isConsoleLogsEnabled || localConsoleLogsEnabled;
}
