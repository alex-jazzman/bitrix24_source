// eslint-disable-next-line max-lines-per-function
(function() {
	BX.namespace('BX.Cluster');
	BX.Cluster.SlaveStart = {
		path: '',
		sessid: '',
		nodeId: '',
		LANG: '',
		formID: '',
		nextButtonID: '',

		init(params)
		{
			if (BX.Type.isObject(params))
			{
				this.path = params.path || '';
				this.sessid = params.sessid || '';
				this.nodeId = params.nodeId || '';
				this.module = params.module || '';
				this.LANG = params.LANG;
				this.formID = params.formID || '';
				this.nextButtonID = params.nextButtonID || '';
			}
		},

		DropTables()
		{
			BX.ajax.post(
				`${this.path}/scripts/drop.php`,
				{
					sessid: this.sessid,
					node_id: this.nodeId,
					lang: this.LANG,
				},
				(data) => {
					const obContainer = document.getElementById('output');
					if (obContainer)
					{
						obContainer.innerHTML = data;
					}
				},
			);
		},

		MoveTables(STEP)
		{
			let step = STEP;

			if (step === null)
			{
				step = 1;
			}

			if (BX.Type.isObject(step))
			{
				step = 1;
			}

			BX.ajax.post(
				`${this.path}/scripts/move.php`,
				{
					sessid: this.sessid,
					node_id: this.nodeId,
					STEP: step,
					lang: this.LANG,
				},
				(data) => {
					const obContainer = document.getElementById('output');
					if (obContainer)
					{
						obContainer.innerHTML = data;
					}
				},
			);
		},

		RunError()
		{
			const obErrorMessage = document.getElementById('error_message');
			if (obErrorMessage)
			{
				BX.Dom.style(obErrorMessage, 'display', 'inline');
			}
		},

		RunAgain()
		{
			const obOut = document.getElementById('output');
			const obErrorMessage = document.getElementById('error_message');

			obOut.innerHTML = '';
			BX.Dom.style(obErrorMessage, 'display', 'none');
			window.Run(1);
		},

		DisableButton(e)
		{
			const obNextButton = document.forms[this.formID][this.nextButtonID];
			obNextButton.disabled = true;
		},

		EnableButton()
		{
			const obNextButton = document.forms[this.formID][this.nextButtonID];
			obNextButton.disabled = false;
		},
	};
})();
