<?php
$MESS["BITRIX_AI_DAY_PLANNER_AIAGENTSTARTTRIGGER_TITLE"] = "Manual AI agent run";
$MESS["BITRIX_AI_DAY_PLANNER_AIASSISTANTAGENTACTIVITY_TITLE"] = "AI agent";
$MESS["BITRIX_AI_DAY_PLANNER_AIASSISTANTAGENTCOMPLEXACTIVITY_RETURN_AI_RESULT"] = "AI processing result";
$MESS["BITRIX_AI_DAY_PLANNER_AIASSISTANTAGENTCOMPLEXACTIVITY_RETURN_ERROR_MESSAGE"] = "AI processing error";
$MESS["BITRIX_AI_DAY_PLANNER_AIASSISTANTAGENTCOMPLEXACTIVITY_RETURN_TOOLS_USED"] = "No MCP errors detected";
$MESS["BITRIX_AI_DAY_PLANNER_AIASSISTANTAGENTCOMPLEXACTIVITY_TITLE"] = "AI agent";
$MESS["BITRIX_AI_DAY_PLANNER_BOSSWELCOMEMESSAGE"] = "Hello!

I'm your daily planner agent.

I'll be dropping progress reports on your employees and the team to this chat.";
$MESS["BITRIX_AI_DAY_PLANNER_BOTREPLY"] = "I'm sorry, I'm not that smart yet.";
$MESS["BITRIX_AI_DAY_PLANNER_CALENDARGETINFORM_TITLE"] = "Get calendar events";
$MESS["BITRIX_AI_DAY_PLANNER_CREATESTORAGENODE_TITLE"] = "Create storage";
$MESS["BITRIX_AI_DAY_PLANNER_DAY_END_AI_MESSAGE"] = "Your daily summary:

{=A6001_0001_0001_0098:aiResult}";
$MESS["BITRIX_AI_DAY_PLANNER_DAY_END_ERRORMESSAGE"] = "Could not create daily summary.";
$MESS["BITRIX_AI_DAY_PLANNER_DAY_PLAN_AI_MESSAGE"] = "Your daily plan:

{=A3001_0001_0001_0098:aiResult}";
$MESS["BITRIX_AI_DAY_PLANNER_DAY_PLAN_FROM_STORAGE_MESSAGE"] = "Your daily plan:

{=A3001_0001_0001_0002:AiResult}";
$MESS["BITRIX_AI_DAY_PLANNER_DAY_START_ERRORMESSAGE"] = "Could not create daily plan.";
$MESS["BITRIX_AI_DAY_PLANNER_DELETEDATASTORAGEACTIVITY_TITLE"] = "Delete data";
$MESS["BITRIX_AI_DAY_PLANNER_ENDDAY_QUERY_FALLBACK"] = "**Input data:**

Current date:
{{=date('c', {=System:Now})}}

Supervisor full name: {=A6001_0001_0001_0001:USER > friendly}

Tasks completed today:
{=A6001_0001_0001_0008:TASKS_INFO_JSON}

Tasks in progress today:
{=A6001_0001_0001_0007:TASKS_INFO_JSON}

Tasks nearly overdue without any progress:
{=A6001_0001_0001_0009:TASKS_INFO_JSON}

Events:
{=A6001_0001_0001_0006:ResultJsonAi}";
$MESS["BITRIX_AI_DAY_PLANNER_FILLFULLREPORTACTIVITY_TITLE"] = "Update work report";
$MESS["BITRIX_AI_DAY_PLANNER_FOREACHACTIVITY_TITLE"] = "Iterator";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORTREADYTRIGGER_TITLE"] = "Report is due";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORTSENTTRIGGER_TITLE"] = "Report sent to supervisor";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_BASIC_MESSAGE"] = "No new data for {=A8001_0001_0001_0001:USER > friendly} to create report for the specified date range.

Employee comment:
{=A8001_0001_0001_0001:REPORT}";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_DISCUSS_BUTTON"] = "Discuss report";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_ERRORMESSAGE"] = "Could not create report for {=A7001_0001_0001_0001:USER > friendly}.";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_FAILED"] = "Could not create report.";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_HANDWRITTEN_MESSAGE"] = "Employee comment:
{=A8001_0001_0001_0001:REPORT}";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_MESSAGE"] = "Report for {=A8001_0001_0001_0001:USER > friendly}
{=A8001_0001_0001_0002:ReportExtended}
{{=if(
strlen({=A8001_0001_0001_0002:ReportText}) > 0,
\"Employee comment:
\" & {=A8001_0001_0001_0002:ReportText},
\"\"
)}}";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_NODATA"] = "Insufficient data to create report for the specified date range.";
$MESS["BITRIX_AI_DAY_PLANNER_FULLREPORT_SENT_EMPTY_MESSAGE"] = "No new data for {=A8001_0001_0001_0001:USER > friendly} to create report for the specified date range.
I'm watching their progress and will let you know when there are new updates.";
$MESS["BITRIX_AI_DAY_PLANNER_GETFULLREPORTACTIVITY_TITLE"] = "Get employee report";
$MESS["BITRIX_AI_DAY_PLANNER_GETUSERACTIVITY_TITLE"] = "Select employee";
$MESS["BITRIX_AI_DAY_PLANNER_HUMANRESOURCESGETAIREPORTUSERSACTIVITY_TITLE"] = "Get users for AI assisted reports";
$MESS["BITRIX_AI_DAY_PLANNER_IFELSEBRANCHACTIVITY_TITLE"] = "Condition";
$MESS["BITRIX_AI_DAY_PLANNER_IMBOTCREATEBOTACTIVITY_TITLE"] = "Chat bot settings";
$MESS["BITRIX_AI_DAY_PLANNER_IMBOTMESSAGEACTIVITY_TITLE"] = "Send a chat bot message";
$MESS["BITRIX_AI_DAY_PLANNER_IMBOTNEWMESSAGETRIGGER_TITLE"] = "Chat bot received a message";
$MESS["BITRIX_AI_DAY_PLANNER_IMNOTIFYACTIVITY_TITLE"] = "Norify user";
$MESS["BITRIX_AI_DAY_PLANNER_NODATAMESSAGE"] = "There is no data to create a daily plan on. I'll get back to it as soon as there are tasks or events.";
$MESS["BITRIX_AI_DAY_PLANNER_NODATA_ENDDAY_MESSAGE"] = "There are no tasks and events for the daily summary.";
$MESS["BITRIX_AI_DAY_PLANNER_NODATA_PLAN"] = "You have no scheduled meetings or tasks today. Ask #COPILOT_NAME# if you need anything.";
$MESS["BITRIX_AI_DAY_PLANNER_QUERY"] = "**Input information:**

Date:
{{=date('c', {=System:Now})}}

Tasks:
{=A2001_0001_0001_0003:TASKS_INFO_JSON}

Upcoming events:
{=A2001_0001_0001_0002:ResultJsonAi}";
$MESS["BITRIX_AI_DAY_PLANNER_QUERY_WDS"] = "**Input data:**

Date:
{{=date('c', {=System:Now})}}

Tasks:
{=A3001_0001_0001_0004:TASKS_INFO_JSON}

Upcoming events:
{=A3001_0001_0001_0003:ResultJsonAi}";
$MESS["BITRIX_AI_DAY_PLANNER_READDATASTORAGEACTIVITY_TITLE"] = "Read data";
$MESS["BITRIX_AI_DAY_PLANNER_SAVEDAYPLANACTIVITY_TITLE"] = "Save daily plan";
$MESS["BITRIX_AI_DAY_PLANNER_SAVEREPORTACTIVITY_TITLE"] = "Save workday report";
$MESS["BITRIX_AI_DAY_PLANNER_SCHEDULEDTRIGGER_TITLE"] = "Scheduler";
$MESS["BITRIX_AI_DAY_PLANNER_SETUPTEMPLATEACTIVITY_TITLE"] = "Get user data";
$MESS["BITRIX_AI_DAY_PLANNER_STARTWORKTIMETRIGGER_TITLE"] = "User clocked in";
$MESS["BITRIX_AI_DAY_PLANNER_STOPWORKTIMETRIGGER_TITLE"] = "User clocked out";
$MESS["BITRIX_AI_DAY_PLANNER_STORAGEERROR"] = "Could not create day planner storage. Please contact your Bitrix24 administrator.";
$MESS["BITRIX_AI_DAY_PLANNER_TASKSGETINFOACTIVITY_TITLE"] = "Get task information";
$MESS["BITRIX_AI_DAY_PLANNER_USER_ENDDAY_DELIVERY_FALLBACK"] = "Your daily summary:

{{=
if(
intval({=A6001_0001_0001_0021:COUNTER_TASKS_INFO}) > 0,
\"New (owner):
\" & {=A6001_0001_0001_0021:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0022:COUNTER_TASKS_INFO}) > 0,
\"Completed (assignee):
\" & {=A6001_0001_0001_0022:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0023:COUNTER_TASKS_INFO}) > 0,
\"Completed (owner):
\" & {=A6001_0001_0001_0023:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0024:COUNTER_TASKS_INFO}) > 0,
\"In progress (assignee):
\" & {=A6001_0001_0001_0024:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0025:EventsCount}) > 0,
\"Events:
\" & {=A6001_0001_0001_0025:EVENTS_TITLES_BB_LIST},
\"\"
)
}}";
$MESS["BITRIX_AI_DAY_PLANNER_USER_ENDDAY_MESSAGE"] = "New (owner):
{=A5001_0001_0001_0021:TASKS_TITLES_BB_LIST}

Completed (assignee):
{=A5001_0001_0001_0022:TASKS_TITLES_BB_LIST}

Completed (owner):
{=A5001_0001_0001_0023:TASKS_TITLES_BB_LIST}

In progress (assignee):
{=A5001_0001_0001_0024:TASKS_TITLES_BB_LIST}

Events:
{=A5001_0001_0001_0025:EVENTS_TITLES_BB_LIST}";
$MESS["BITRIX_AI_DAY_PLANNER_USER_ENDDAY_MESSAGE_FALLBACK"] = "{{=
if(
intval({=A6001_0001_0001_0021:COUNTER_TASKS_INFO}) > 0,
\"New (owner):
\" & {=A6001_0001_0001_0021:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0022:COUNTER_TASKS_INFO}) > 0,
\"Completed (assignee):
\" & {=A6001_0001_0001_0022:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0023:COUNTER_TASKS_INFO}) > 0,
\"Completed (owner):
\" & {=A6001_0001_0001_0023:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0024:COUNTER_TASKS_INFO}) > 0,
\"In progress (assignee):
\" & {=A6001_0001_0001_0024:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A6001_0001_0001_0025:EventsCount}) > 0,
\"Events:
\" & {=A6001_0001_0001_0025:EVENTS_TITLES_BB_LIST},
\"\"
)
}}";
$MESS["BITRIX_AI_DAY_PLANNER_USER_PLAN_DELIVERY_WDS"] = "Your daily plan:

{{=
if(
intval({=A3001_0001_0001_0021:COUNTER_TASKS_INFO}) > 0,
\"Overdue:
\" & {=A3001_0001_0001_0021:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A3001_0001_0001_0022:COUNTER_TASKS_INFO}) > 0,
\"In progress (assignee):
\" & {=A3001_0001_0001_0022:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A3001_0001_0001_0023:EventsCount}) > 0,
\"Events:
\" & {=A3001_0001_0001_0023:EVENTS_TITLES_BB_LIST},
\"\"
)
}}";
$MESS["BITRIX_AI_DAY_PLANNER_USER_PLAN_MESSAGE"] = "{{=
if(
intval({=A2001_0001_0001_0021:COUNTER_TASKS_INFO}) > 0,
\"Overdue:
\" & {=A2001_0001_0001_0021:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A2001_0001_0001_0022:COUNTER_TASKS_INFO}) > 0,
\"In progress (assignee):
\" & {=A2001_0001_0001_0022:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A2001_0001_0001_0023:EventsCount}) > 0,
\"Events:
\" & {=A2001_0001_0001_0023:EVENTS_TITLES_BB_LIST},
\"\"
)
}}";
$MESS["BITRIX_AI_DAY_PLANNER_USER_PLAN_MESSAGE_WDS"] = "{{=
if(
intval({=A3001_0001_0001_0021:COUNTER_TASKS_INFO}) > 0,
\"Overdue:
\" & {=A3001_0001_0001_0021:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A3001_0001_0001_0022:COUNTER_TASKS_INFO}) > 0,
\"In progress (assignee):
\" & {=A3001_0001_0001_0022:TASKS_TITLES_BB_LIST} & \"

\",
\"\"
) &
if(
intval({=A3001_0001_0001_0023:EventsCount}) > 0,
\"Events:
\" & {=A3001_0001_0001_0023:EVENTS_TITLES_BB_LIST},
\"\"
)
}}";
$MESS["BITRIX_AI_DAY_PLANNER_WELCOMEMESSAGE"] = "Hello!

I'm your planning and controlling agent.

I can help you start off in the morning by reminding you about events, tasks and everything else.";
$MESS["BITRIX_AI_DAY_PLANNER_WRITEDATASTORAGEACTIVITY_TITLE"] = "Write data";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOSS_BOT_AVATAR"] = "Chat bot image as it appears in employee report";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOSS_BOT_NAME"] = "Chat bot name as it reads in employee report";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOSS_BOT_NAME_DEFAULT"] = "AI-assisted work reports";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOT_AVATAR"] = "Chat bot image";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOT_NAME"] = "Chat bot name";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_BOT_NAME_DEFAULT"] = "AI-assisted daily plan and report";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_SCHEDULE_INTERVAL"] = "Repeat interval";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_SCHEDULE_TYPE"] = "Run mode";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_CONST_SCHEDULE_WEEKDAYS"] = "Days of week";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_DESC"] = "The agent will help the supervisor plan their work and monitor the team. It will collect data on events, tasks and decisions made in the chat, and send the summary to the supervisor.
- At the start of the day, the agent will analyze the calendar, task chat messages and send a detailed plan for the day.
- When the workday is over, it will compare the plan with what was actually done, and  create a report.
- The agent will create and send employee performance reports to the supervisor: tasks completed, overdue, events the employee participated in etc. Daily, weekly and monthly reports are possible.
Subordinate supervisors will also receive their own daily performance reports, and weekly reports for their employees.";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_FIELD_DATE"] = "Date created";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_FIELD_RESULT"] = "Analysis result";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_FIELD_USER"] = "Employee";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_NAME"] = "Planning and controlling agent";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_SCHEDULE_DAILY"] = "Daily";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_SCHEDULE_WEEKLY"] = "Weekly";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_STORAGE_TITLE"] = "Daily planner agent results";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WELCOMES_FIELD_BOT_KIND"] = "Bot type";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WELCOMES_FIELD_DATE"] = "Welcome message send date";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WELCOMES_FIELD_USER"] = "User";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WELCOMES_STORAGE_TITLE"] = "Chat bot welcome messages";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WIZARD_DESC"] = "Fill out the field to help the agent create employee plans.";
$MESS["BIZPROC_NODES_BITRIX_AI_DAY_PLANNER_WIZARD_TITLE"] = "Daily planner agent";
