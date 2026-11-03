'use strict';

BX.namespace('Tasks.Component');

(function(){

	if(typeof BX.Tasks.Component.TasksToolbar != 'undefined')
	{
		return;
	}

	/**
	 * Main js controller for this template
	 */
	BX.Tasks.Component.TasksToolbar = BX.Tasks.Component.extend({
		sys: {
			code: 'toolbar'
		},
		methodsStatic: {
			instance: {},

			getInstance: function()
			{
				return BX.Tasks.Component.TasksToolbar.instance;
			},

			addInstance: function(obj)
			{
				BX.Tasks.Component.TasksToolbar.instance = obj;
			}
		},
		methods: {
			construct: function()
			{
				this.callConstruct(BX.Tasks.Component);
				BX.Tasks.Component.TasksToolbar.addInstance(this);
			},
		}
	});
}).call(this);