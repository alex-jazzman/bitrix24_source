var NodeWorkflowActivity = function()
{
	let ob = new BizProcActivity();
	ob.Type = 'NodeWorkflowActivity';

	ob.Settings = function()
	{
		window.open(`/bizprocdesigner/editor/?ID=${window.BPTemplateId}`);
	};

	ob.OnRemoveClick = () => {};

	return ob;
};
