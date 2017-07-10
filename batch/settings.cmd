@ECHO OFF
:: Created By Chewei Hu.
:: https://github.com/chewei05/php_coder

:START
CLS
SET KEY=none
ECHO [[[ PHP/Laravel 開發程式集 ]]]
ECHO.
ECHO 功能選單:
ECHO 1 - 為 VS Code Portable 設定滑鼠右鍵選單(需以系統管理員身分執行)
ECHO 2 - 為 VS Code Portable 移除滑鼠右鍵選單(需以系統管理員身分執行)
ECHO 3 - 將 UniForm Server Zero 搬移到 C:\UniServerZ
ECHO 4 - 移除本程式集(說明)
ECHO 9 - 離開
:CHOOSE
SET /P KEY=請選擇你要執行的功能: 
IF %KEY%==none GOTO CHOOSE_ERROR
IF %KEY%==0 GOTO CHOOSE_ERROR
IF %KEY%==1 GOTO VSCODE_RIGHT_KEY
IF %KEY%==2 GOTO VSCODE_RIGHT_KEY_UNINSTALL
IF %KEY%==3 GOTO MOVE_UNISERVERZ
IF %KEY%==4 GOTO UNINSTALL_HELP
IF %KEY%==9 GOTO EXIT
GOTO CHOOSE_ERROR

:CHOOSE_ERROR
ECHO.
ECHO 無此功能，請重新選擇。
ECHO.
PAUSE
GOTO START

:VSCODE_RIGHT_KEY
CLS
CD ..\registry
REGEDIT vscode-right-key-install.reg
CD ..\batch
ECHO 執行完畢！
ECHO 如果發生錯誤，請以「系統管理員身分」重新執行。
PAUSE
GOTO START

:VSCODE_RIGHT_KEY_UNINSTALL
CLS
REG DELETE "HKEY_CLASSES_ROOT\*\shell\Open with VS Code"
REG DELETE "HKEY_CLASSES_ROOT\Directory\shell\vscode"
REG DELETE "HKEY_CLASSES_ROOT\Directory\Background\shell\vscode"
ECHO.
ECHO 執行完畢！
PAUSE
GOTO START

:MOVE_UNISERVERZ
CLS
CALL MoveUniServerZ.cmd
ECHO 成功！
PAUSE
GOTO START

:UNINSTALL_HELP
CLS
CALL Uninstall-Coder.cmd
ECHO.
PAUSE
GOTO START

:EXIT