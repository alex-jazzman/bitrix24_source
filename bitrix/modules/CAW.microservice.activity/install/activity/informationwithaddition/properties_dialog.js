var b_log_counter = -1;
var mainForm=true;
lastEd=false;
setTimeout(BPRIAStart(),100);

function BPRIAStart()
{
	console.log(BPRIAParams);
	var id;

	for (id in BPRIAParams)
		BPRIAParamAddParam(id, BPRIAParams[id]);
}

function newParam(){
	lastEd = false;
	changeForm();

	for (var i = 1; i < 10000; i++)
	{
		if (!BPRIAParams[i])
			break;
	}

	document.getElementById("id_fri_title").value = "";
	document.getElementById("id_fri_name").value = "";
	document.getElementById("id_fri_description").value = "";
	document.getElementById("id_fri_type").value = "";
	document.getElementById("id_fri_id").value = i;

	for (var t in objFields.arFieldTypes)
		break;

	window.currentType = {'Type' : t, 'Options' : null, 'Required' : 'N', 'Multiple' : 'N'};
	document.getElementById("id_fri_title").focus();
}

function BPRIAParamEditParam(ob)
{
	if(mainForm) changeForm();

	window.lastEd = ob.parentNode.parentNode.paramId;

	var s = BPRIAParams[window.lastEd];

	window.currentType = {'Type' : s['Type'], 'Options' : s['Options'], 'Required' : s['Required'], 'Multiple' : s['Multiple']};

	document.getElementById("id_fri_title").value = s["Title"];
	document.getElementById("id_fri_name").value = s["Name"];
	document.getElementById("id_fri_description").value = s["Description"] || '';
	document.getElementById("id_fri_id").value = window.lastEd;
	document.getElementById('id_fri_type').value=s['Type'];
	BPRIAChangeFieldType(
		window.currentType,
		s['Default']
	);

	document.getElementById("id_fri_title").focus();
}

function changeForm(){
	mainForm=!mainForm;
	let formDocHTML=document.getElementById("ria_pd_edit_form");
	let formMainHTML=document.getElementById("ria_pd_list_form");
	let btnchange=document.getElementById("btn-change-form1");
	if (mainForm){
		formDocHTML.hidden=true;
		btnchange.style.display="block";
		formMainHTML.hidden=false;
	} else{
		formDocHTML.hidden=false;
		btnchange.style.display="none";
		formMainHTML.hidden=true;
	}
}

function BPRIAParamSaveForm()
{
	BX.showWait();

	var N = lastEd;
	if (!lastEd)
	{
		lastEd = document.getElementById("id_fri_id").value.replace(/^\s+|\s+$/g, '');
		BPRIAParams[lastEd] = {};
	}
	console.log(lastEd);
	BPRIAParams[lastEd]['Title'] = document.getElementById("id_fri_title").value.replace(/^\s+|\s+$/g, '');
	BPRIAParams[lastEd]['Name'] = document.getElementById("id_fri_name").value.replace(/^\s+|\s+$/g, '');
	BPRIAParams[lastEd]['Description'] = document.getElementById("id_fri_description").value;
	BPRIAParams[lastEd]['Type'] = document.getElementById("id_fri_type").value;;
	if (objFields.arFieldTypes[BPRIAParams[lastEd]['Type']]['Complex'] == "Y")
		BPRIAParams[lastEd]['Options'] = window.currentType['Options'];

	objFields.GetFieldInputValue(
		BPRIAParams[lastEd],
		{'Field':'fri_default', 'Form':'<?= $formName ?>'},
		function(v){
			if (typeof v == "object")
			{
				v = v[0];
			}

			BPRIAParams[lastEd]['Default'] = v;
			if (N === false)
				BPRIAParamAddParam(lastEd, BPRIAParams[lastEd]);
			else
				BPRIAParamFillParam(lastEd, BPRIAParams[lastEd]);

				changeForm();

			BX.closeWait();
		}
	);

}

function BPRIADeleteRow(ob)
{
	var id = ob.parentNode.parentNode.paramId;
	delete BPRIAParams[id];

	var i, t = document.getElementById('ria_pd_list_table');
	for (i = 1; i < t.rows.length; i++)
	{
		if (t.rows[i].paramId == id)
		{
			t.deleteRow(i);
			return;
		}
	}
}

function BPRIAToHiddens(ob, name)
{
	if (typeof ob == "object")
	{
		var s = "";
		for (var k in ob)
			s += BPRIAToHiddens(ob[k], name + "[" + k + "]");
		return s;
	}
	return '<input type="hidden" name="' + objFields.HtmlSpecialChars(name) + '" value="' + objFields.HtmlSpecialChars(ob) + '">';
}

function BPRIAParamFillParam(id, p)
{
	var i, t = document.getElementById('ria_pd_list_table');
	for (i = 1; i < t.rows.length; i++)
	{
		if (t.rows[i].paramId == id)
		{
			var r = t.rows[i].cells;

			r[0].innerHTML = '<a href="javascript:void(0);" onclick="BPRIAParamEditParam(this);">'+HTMLEncode(p['Name'])+"</a>"
				+ BPRIAToHiddens(p, 'requested_information[' + id + ']');

			r[1].innerHTML = HTMLEncode(p['Title']);
			r[2].innerHTML = (objFields.arFieldTypes[p['Type']] ? objFields.arFieldTypes[p['Type']]['Name'] : p['Type'] );

			return true;
		}
	}
}

function BPRIAParamAddParam(id, p)
{
	var t = document.getElementById('ria_pd_list_table');
	var r = t.insertRow(-1);
	r.paramId = id;
	var c = r.insertCell(-1);
	c.style.textAlign="center";
	c = r.insertCell(-1);
	c.style.textAlign="center";
	c = r.insertCell(-1);
	c.style.textAlign="center";
	console.dir(c);
	c = r.insertCell(-1);
	c.innerHTML = '<a href="javascript:void(0);" onclick="BPRIAParamEditParam(this); return false;">Изменить</a> | <a href="javascript:void(0);" onclick="BPRIADeleteRow(this); return false;">Удалить</a>';
	BPRIAParamFillParam(id, p);
}

function AddCondition(field, val)
{
	var addrowTable = document.getElementById('bwfvc_addrow_table1');
	b_log_counter++;
	var newRow = addrowTable.insertRow(-1);
	newRow.id = "delete_row_log_" + b_log_counter;
	var newCell = newRow.insertCell(-1);
	var newSelect = document.createElement("input");
        newSelect.placeholder="название";
        newSelect.type = 'text';
        newSelect.size = '21';
	newSelect.setAttribute('b_log_counter', b_log_counter);
	newSelect.id = "id_var_name_" + b_log_counter;
	newSelect.name = "fields[var_value_" + b_log_counter + "]";
	newSelect.value = BWFVCUnHtmlSpecialChars(field);
	newCell.appendChild(newSelect);

	var newCell = newRow.insertCell(-1);
	newCell.id = "id_row_value_" + b_log_counter;
        newCell.align="right";
     	newCell.innerHTML = '<input placeholder="переменная" size="21" type="text" id="id_var_value_' + b_log_counter + '" name="values[var_value_' + b_log_counter + ']" value="' + val + '">';

        var newCell = newRow.insertCell(-1);
        newCell.id = "id_dialog_" + b_log_counter;

        newCell.innerHTML = '<input type="button" value="..." onclick="BPAShowSelector(\'id_var_value_'+b_log_counter+'\', \'string\');">';

        var newCell = newRow.insertCell(-1);
	newCell.align="right";
	newCell.innerHTML = '<input type="button" value="Удалить" onclick="BWFVCDeleteCondition(' + b_log_counter + '); return false;">';  
}

function BWFVCUnHtmlSpecialChars(string, quote)
{
	string = string.toString();

	if (quote)
		string = string.replace(/&#039;/g, "'");

	string = string.replace(/&quot;/g, "\"");
	string = string.replace(/&gt;/g, ">");
	string = string.replace(/&lt;/g, "<");
	string = string.replace(/&amp;/g, '&');

	return string;
}

function BWFVCDeleteCondition(ind)
{
	var addrowTable = document.getElementById('bwfvc_addrow_table1');

	var cnt = addrowTable.rows.length;
	for (i = 0; i < cnt; i++)
	{
		if (addrowTable.rows[i].id != 'delete_row_log_' + ind)
			continue;

		addrowTable.deleteRow(i);

		break;
	}
}

