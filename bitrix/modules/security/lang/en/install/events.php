<?php
$MESS["SECURITY_INSTALL_SMS_EVENT_OTP_CONFIRM_DESC"] = "#USER_PHONE#: phone number
#CODE#: confirmation code";
$MESS["SECURITY_INSTALL_SMS_EVENT_OTP_CONFIRM_NAME"] = "Login confirmation via SMS code";
$MESS["SECURITY_INSTALL_SMS_TEMPLATE_OTP_CONFIRM_MESS"] = "#CODE# is Bitrix24 login confirmation code.";
$MESS["SEC_EVENT_USER_OTP_CONFIRM_DESC"] = "#USER_ID#: user ID
#EMAIL#: Backup email address for OTP
#LOGIN#: Login
#CODE#: Confirmation code
#DATE#: Date and time";
$MESS["SEC_EVENT_USER_OTP_CONFIRM_NAME"] = "Confirm backup email";
$MESS["SEC_EVENT_USER_OTP_DESC"] = "#USER_ID#: User ID
#EMAIL#: Back-up email address for one-time passwords
#LOGIN#: Login
#CODE#: One-time password
#DATE#: Date and time
#DEVICE#: Device type
#BROWSER#: Browser
#PLATFORM#: Operating system
#DEVICE_INFO#: Device information
#USER_AGENT#: Browser User Agent
#IP#: IP address
#COUNTRY#: Country
#REGION#: Region
#CITY#: City
#LOCATION#: Full location
#HELP_URL#: Help section page URL";
$MESS["SEC_EVENT_USER_OTP_NAME"] = "One-time password";
$MESS["SEC_TEMPLATE_USER_OTP_CONFIRM_MESSAGE"] = "Copy this email verification code and paste it when requested by Bitrix24:
				
#CODE#
				
Ignore this message if you didn't expect it.

Your Bitrix24: #SERVER_NAME#
Login: #LOGIN#
Date: #DATE#";
$MESS["SEC_TEMPLATE_USER_OTP_CONFIRM_SUBJECT"] = "#SITE_NAME#: Email confirmation code";
$MESS["SEC_TEMPLATE_USER_OTP_MESSAGE"] = "Someone logged in to your account on #SERVER_NAME# and requested a one-time password:
				
#CODE#
				
Check the information below and make sure it was you.

Date: #DATE#
Login: #LOGIN#
Device: #DEVICE_INFO#
Browser: #USER_AGENT#
IP address: #IP#
Location: #LOCATION#

If you can't confirm it was you, change your password as soon as possible.

Learn more about account security here: #HELP_URL#";
$MESS["SEC_TEMPLATE_USER_OTP_SUBJECT"] = "#SITE_NAME#: One-time password";
$MESS["VIRUS_DETECTED_DESC"] = "#EMAIL# - Site administrator's e-mail address (from the Kernel module settings)";
$MESS["VIRUS_DETECTED_MESSAGE"] = "Informational message from #SITE_NAME#

------------------------------------------

You have received this message as a result of the detection of potentially dangerous code by the proactive protection system of #SERVER_NAME#.

1.  The potentially dangerous code has been cut from the html. 
2.  Check the event log and make sure that the code is indeed harmful, and is not simply a counter or framework.
	(link: http://#SERVER_NAME#/bitrix/admin/event_log.php?lang=en&set_filter=Y&find_type=audit_type_id&find_audit_type[]=SECURITY_VIRUS )
3.  If the code is not harmful, add it to the 'exceptions' list on the antivirus settings page. 
	(link: http://#SERVER_NAME#/bitrix/admin/security_antivirus.php?lang=en&tabControl_active_tab=exceptions )
4.  If the code is a virus, then complete the following steps:

	a) Change the login password for the administrator and other responsible users to the site.
	b) Change the login password for ssh and ftp. 
	c) Test and remove viruses from computers of administrators who have access to the site through ssh or ftp. 
	d) Turn off password saving in programs which provide access to the site through ssh or ftp. 
	e) Delete the harmful code from the infected files.  For example, re-install the infected files using the most recent backup.  

---------------------------------------------------------------------
This message has been automatically generated.";
$MESS["VIRUS_DETECTED_NAME"] = "Virus detected";
$MESS["VIRUS_DETECTED_SUBJECT"] = "#SITE_NAME#:  Virus detected";
