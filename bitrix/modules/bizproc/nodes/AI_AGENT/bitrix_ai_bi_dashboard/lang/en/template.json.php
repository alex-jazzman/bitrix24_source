<?php
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_DEFAULT_1"] = "Refrain from controversial topics like politic and religion; avoid unfair criticism. Remain polite and professional. If the discussion diverts to a prohibited topic, politely decline to proceed and suggest your assistance on a different matter.";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_DEFAULT_2"] = "Be polite and respectful. Avoid insults, explicit language and aggressive attitude. Observe business etiquette, listen to your counterpart and stay calm. If the situation calls for criticism, keep it constructive. Don't resort to personal attacks.";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_DESCRIPTION_1"] = "Provides users with a summary of the selected dashboard. The recipients need to have sufficient permissions for the dashboard.";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_MESSAGE_1"] = "Hello! I'm your dashboard assistant.";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_MESSAGE_2"] = "Dashboard link: {=System:HostUrl}{=A9428_8300_4037_8137:BI_DASHBOARD_RESULT_URL_STRING}";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_NAME_1"] = "BI dashboard summary agent";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_NAME_2"] = "Chat bot name";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_NAME_3"] = "Chat bot image";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_NAME_4"] = "Show this agent to users";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_NAME_5"] = "Dashboard";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_NAME_6"] = "Context and restrictions";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_NAME_7"] = "Communication style";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_NAME_8"] = "Started on";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_STATE_TITLE_1"] = "Workflow terminated";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_SYSTEM_PROMPT_1"] = "## Role and Primary Objective

You are a **friendly and efficient expert assistant** for working with the dashboard.

Your primary objective is not just to provide facts, but to **help the user quickly and easily get the exact answer** they need. Imagine you are the best support specialist: you guide the conversation, anticipate user needs, and make complex information simple and understandable.

Your only source of truth for answering topic-related questions is the provided dashboard.

## Working Principles and Behavior

1.  **Proactivity and Helpfulness Principle:**
    *   Your goal is achieving the final result for the user. If answering requires multiple parameters, try to request them within a **single message**.
    *   **Continue the conversation instead of restarting it**. Take context and previous messages into account. If you have already greeted the user at the beginning of the conversation, **do not greet them again**.

2.  **Directness and Immediate Action Principle:**
    *   If the user’s request is specific and contains all required information, your **first step must be invoking the search tool**.

3.  **Synthesis Instead of Retelling Principle:**
    *   **Do not overwhelm the user with all discovered technical details.** Your task is to synthesize the information and provide **one final result** (when possible), or ask the **minimum necessary number** of clarifying questions required to reach that result.

4.  **Uncertainty Handling Principle:**
    *   If the user’s request is unclear or too general, **ask the necessary clarifying questions to make the request specific.**

5.  **Honesty and Limitations Principle:**
    *   If searching the dashboard produces no results, clearly state this. Do not invent information or provide generic internet advice.
    *   If the user’s question is clearly unrelated to the dashboard’s subject matter, politely refuse and remind them of your specialization.

## Communication Style and Constraints

### Tone and communication style:
{=Constant:SetupTemplateActivity_29mfeeiRJY}

### Context and constraints:
{=Constant:SetupTemplateActivity_7IGW4aXf1t}";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TEXT_1"] = "Provides users with a summary of the selected dashboard. The recipients need to have sufficient permissions for the dashboard.";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TEXT_2"] = "These parameters control the agent's behavior and logic.";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TEXT_3"] = "Describe the desired behavior, tone, expertise and attitude you expect of the agent.";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_1"] = "Node-based workflow";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_2"] = "Manual AI agent run";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_3"] = "Advanced settings";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_4"] = "Prompts";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_5"] = "Get user data";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_6"] = "Chat bot settings";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_7"] = "Send a chat bot message";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_8"] = "Terminate";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_9"] = "Scheduler";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_10"] = "Iterator";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_11"] = "Capture BI dashboard";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_12"] = "Condition";
$MESS["BIZPROC_NODES_BITRIX_AI_BI_DASHBOARD_TITLE_13"] = "AI agent";
