@ECHO OFF
SET TARGET=C:\coder
ECHO �w�ˤ��A�еy�ԡK (�w�˧�����|�۰�����)


:CHECK
IF EXIST %TARGET% GOTO REMOVE
:BEGIN
MD %TARGET%
MOVE /-Y UniServerZ C:\UniServerZ
MOVE /-Y cmder %TARGET%\cmder
MOVE /-Y composer %TARGET%\composer
MOVE /-Y node %TARGET%\node
MOVE /-Y VSCodePortable %TARGET%\VSCodePortable
:SHORTCUT1
	SET SCRIPT="demo.vbs"
	ECHO Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
	ECHO sLinkFile = "%USERPROFILE%\Desktop\UniController.lnk" >> %SCRIPT%
	ECHO Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
	ECHO oLink.TargetPath = "C:\UniServerZ\UniController.exe" >> %SCRIPT%
	ECHO oLink.Save >> %SCRIPT%
	CSCRIPT /nologo %SCRIPT%
	DEL %SCRIPT%
:SHORTCUT2
	SET SCRIPT="demo.vbs"
	ECHO Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
	ECHO sLinkFile = "%USERPROFILE%\Desktop\Cmder.lnk" >> %SCRIPT%
	ECHO Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
	ECHO oLink.TargetPath = "%TARGET%\cmder\cmder.exe" >> %SCRIPT%
	ECHO oLink.WorkingDirectory  = "%TARGET%\cmder" >> %SCRIPT%
	ECHO oLink.Save >> %SCRIPT%
	CSCRIPT /nologo %SCRIPT%
	DEL %SCRIPT%
GOTO FINISH

:REMOVE
ECHO �w�˸�Ƨ��w�s�b %TARGET% �A�O�_�����H
RD %TARGET% /S
GOTO BEGIN

:FINISH
CLS
ECHO.
ECHO �w�˧����I
ECHO.
ECHO �p�ݲ������{�����ɡA�Цۦ�R��
ECHO 1. �ୱ�W����ӱ��|(cmder �� UniController)
ECHO 2. ��Ƨ� C:\coder
ECHO 3. ��Ƨ� C:\UniServerZ
ECHO ���{�����|�ݯd�����ơC
ECHO.
ECHO �P�§A���ϥΡC
GOTO END

:END
PAUSE