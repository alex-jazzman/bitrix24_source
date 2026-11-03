import { BaseEvent, EventEmitter } from "main.core.events";

export class Counters
{
	cachedCounters = [];
	counters = [];
	hiddenCountersForTotalCounter = [];
	shortcuts = [];
	#name;
	selectedDirectory;
	// a cross-folder section keeps its own number, named by the section it belongs to
	sectionCounters = {};
	activeSection = null;

	constructor(name,selectedDirectory)
	{
		this.#name = name;
		this.setDirectory(selectedDirectory);
	}

	getCounters()
	{
		return this.counters;
	}

	getDirPath(shortcut)
	{
		if(shortcut === undefined)
		{
			shortcut = '';
		}

		if(this.shortcuts[shortcut] !== undefined)
		{
			return this.shortcuts[shortcut];
		}

		return shortcut;
	}

	getShortcut(path)
	{
		//because they have a closure
		return this.getDirPath(path);
	}

	setDirectory(name)
	{
		if(name === undefined)
		{
			name = '';
		}

		if(this.shortcuts[name])
		{
			this.selectedDirectory = this.shortcuts[name];
		}
		else
		{
			this.selectedDirectory = name;
		}

		this.#sendCountersUpdate();
	}

	setSectionCounter(section, count)
	{
		this.sectionCounters[section] = Number(count);
		this.#sendCountersUpdate();
	}

	setActiveSection(section)
	{
		this.activeSection = section ?? null;
		this.#sendCountersUpdate();
	}

	// the number of a section and the section itself are one state for the panel, so they are
	// set together and the screen redraws once
	setSectionState(section, count, active)
	{
		this.sectionCounters[section] = Number(count);
		this.activeSection = active ? section : null;
		this.#sendCountersUpdate();
	}

	#sendCountersUpdate()
	{
		this.sendCounterUpdateEvent({ ...this.counters });
	}

	setShortcut(shortcutName,name)
	{
		//backlink
		this.shortcuts[shortcutName] = name;
		this.shortcuts[name] = shortcutName;
	}

	getName()
	{
		return this.#name;
	}

	setHiddenCountersForTotalCounter(counterNames)
	{
		for (let counter of counterNames)
		{
			this.hiddenCountersForTotalCounter[counter] = 'disabled';
		}
	}

	isHidden(name):boolean
	{
		if(this.hiddenCountersForTotalCounter[name] === 'disabled')
		{
			return true;
		}
		return false;
	}

	getTotalCounter()
	{
		let counters = 0;
		for (let name in this.counters)
		{
			if(name in this.hiddenCountersForTotalCounter)
			{
				continue;
			}
			counters += this.counters[name];
		}

		return counters;
	}

	getCounterObjects()
	{
		return this.counters;
	}

	getCounter(name)
	{
		return this.counters[name];
	}

	addCounter(name,count)
	{
		this.counters[name] = Number(count);
		return this.counters[name];
	}

	addCounters(counters)
	{
		this.cacheCounters();

		let resultCounters = {};

		for (let i = 0; i < counters.length; i++)
		{
			const counter = counters[i]

			counter['count'] = Number(counter['count']);

			const path = counter['path'];
			this.addCounter(path,counter['count']);

			if(this.shortcuts[path])
			{
				resultCounters[this.shortcuts[path]] = counter['count'];
			}
			else
			{
				resultCounters[path] = counter['count'];
			}

		}

		this.sendCounterUpdateEvent(resultCounters);
	}

	/*Set counters as when adding. Old counters with different names are retained*/
	setCounters(counters)
	{
		this.addCounters(counters);
	}

	isExists(name)
	{
		return this.counters[name] !== undefined;
	}

	increaseCounter(name,count = 1 )
	{
		this.cacheCounters();

		if(name in this.hiddenCountersForTotalCounter)
		{
			return "hidden counters for total counter";
		}

		if(!this.isExists(name))
		{
			return "no counter";
		}
		this.counters[name] += Number(count);
	}

	lowerCounter(name,count = 1 )
	{
		this.cacheCounters();

		if(name in this.hiddenCountersForTotalCounter)
		{
			return "hidden counters for total counter";
		}

		if(!this.isExists(name))
		{
			return "no counter";
		}

		const newValue = this.counters[name] - Number(count);
		if(newValue < 0)
		{
			return "negative value";
		}

		this.counters[name] = newValue;
	}

	cacheCounters()
	{
		this.cachedCounters = [];
		Object.assign(this.cachedCounters, this.counters);
	}

	restoreFromCache()
	{
		this.counters = [];
		Object.assign(this.counters, this.cachedCounters);
		this.sendCounterUpdateEvent(this.counters);
	}

	/*Change counters by rule*/
	updateCounters(counters = [
		{
			name: 'counter1',
			count: 2,
			increase: false,
			lower: true,
		},
		{
			name: 'counter2',
			count: 2,
			increase: true,
			lower: false,
		},
	])
	{
		this.cacheCounters();
		let resultCounters = {};
		let countersAreNotLoadedFromTheServer = false;

		for (let i = 0; i < counters.length; i++)
		{
			const counter = counters[i];
			const name = counter['name'];

			if(counter['lower'])
			{
				if(this.lowerCounter(name,counter['count']) === "negative value")
				{
					countersAreNotLoadedFromTheServer = true;
				}
			}

			if(counter['increase'] && countersAreNotLoadedFromTheServer === false)
			{
				this.increaseCounter(name,counter['count'])
			}

			if(this.shortcuts[name])
			{
				resultCounters[this.shortcuts[name]] = this.getCounter(name);
			}
			else
			{
				resultCounters[name] = this.getCounter(name);
			}
		}

		this.sendCounterUpdateEvent(resultCounters);
	}

	sendCounterUpdateEvent(counters)
	{
		if(counters === undefined)
		{
			counters = this.counters;
		}

		if(counters.length === 0)
		{
			return;
		}

		const event = new BaseEvent({
			data: {
				counters: counters,
				hidden: this.hiddenCountersForTotalCounter,
				selectedDirectory: this.selectedDirectory,
				name: this.getName(),
				total: this.getTotalCounter(),
				// read here rather than at the call, so every update carries the current section state
				sections: this.sectionCounters,
				activeSection: this.activeSection,
			}
		});

		EventEmitter.emit('BX.Mail.Home:updatingCounters', event);
	}

}