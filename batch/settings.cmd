@ECHO OFF
:: Created By Chewei Hu.
:: https://github.com/chewei05/php_coder

:START
CLS
SET KEY=none
ECHO [[[ PHP/Laravel �}�o�{���� ]]]
ECHO.
ECHO �\����:
ECHO 1 - �� VS Code Portable �]�w�ƹ��k����(�ݥH�t�κ޲z����������)
ECHO 2 - �� VS Code Portable �����ƹ��k����(�ݥH�t�κ޲z����������)
ECHO 3 - �N UniForm Server Zero �h���� C:\UniServerZ
ECHO 4 - �������{����(����)
ECHO 9 - ���}
:CHOOSE
SET /P KEY=�п�ܧA�n���檺�\��: 
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
ECHO �L���\��A�Э��s��ܡC
ECHO.
PAUSE
GOTO START

:VSCODE_RIGHT_KEY
CLS
CD ..\registry
REGEDIT vscode-right-key-install.reg
CD ..\batch
ECHO ���槹���I
ECHO �p�G�o�Ϳ��~�A�ХH�u�t�κ޲z�������v���s����C
PAUSE
GOTO START

:VSCODE_RIGHT_KEY_UNINSTALL
CLS
REG DELETE "HKEY_CLASSES_ROOT\*\shell\Open with VS Code"
REG DELETE "HKEY_CLASSES_ROOT\Directory\shell\vscode"
REG DELETE "HKEY_CLASSES_ROOT\Directory\Background\shell\vscode"
ECHO.
ECHO ���槹���I
PAUSE
GOTO START

:MOVE_UNISERVERZ
CLS
CALL MoveUniServerZ.cmd
ECHO ���\�I
PAUSE
GOTO START

:UNINSTALL_HELP
CLS
CALL Uninstall-Coder.cmd
ECHO.
PAUSE
GOTO START

:EXIT