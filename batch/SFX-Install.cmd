@ECHO OFF
SET TARGET=C:\coder
ECHO 安裝中，請稍候… (安裝完成後會自動關閉)


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
ECHO 安裝資料夾已存在 %TARGET% ，是否移除？
RD %TARGET% /S
GOTO BEGIN

:FINISH
CLS
ECHO.
ECHO 安裝完成！
ECHO.
ECHO 如需移除本程式集時，請自行刪除
ECHO 1. 桌面上的兩個捷徑(cmder 及 UniController)
ECHO 2. 資料夾 C:\coder
ECHO 3. 資料夾 C:\UniServerZ
ECHO 本程式不會殘留任何資料。
ECHO.
ECHO 感謝你的使用。
GOTO END

:END
PAUSE