:: use this file to run your own startup commands
:: use  in front of the command to prevent printing the command

:: call "%GIT_INSTALL_ROOT%/cmd/start-ssh-agent.cmd"
:: set "PATH=%CMDER_ROOT%\vendor\whatever;%PATH%"

@echo off
@REM ----------------------------------------------------------------------------
@REM  My Custom Environment Variables - Set PHP, Apache, MySQL & Composer Folder
@REM ----------------------------------------------------------------------------
FOR %%i IN ("%CMDER_ROOT%\..") DO SET PortableCodingProgramDir=%%~fi
SET UniformServerDir=%PortableCodingProgramDir%\UniServerZ
SET UniformServerCoreDir=%UniformServerDir%\core
SET PhpDir=%UniformServerCoreDir%\php71
SET MysqlDir=%UniformServerCoreDir%\mysql\bin
SET ApacheDir=%UniformServerCoreDir%\apache2\bin
SET ComposerVendorBinDir=%APPDATA%\Composer\vendor\bin
SET ComposerPharDir=%PortableCodingProgramDir%\composer
SET NodePortableDir=%PortableCodingProgramDir%\node
PATH=%PhpDir%;%MysqlDir%;%ApacheDir%;%ComposerVendorBinDir%;%NodePortableDir%;%PATH%

@REM -------------------------------------------------
@REM  Goto Uniform Server Apache Virtual Hosts Folder
@REM -------------------------------------------------
IF EXIST "%UniformServerDir%\www" CD /d "%UniformServerDir%\www"
IF EXIST "%UniformServerDir%\vhosts" CD /d "%UniformServerDir%\vhosts"

@REM -------------------------------------------------
@REM  Fix git asia charter settings
@REM -------------------------------------------------
set LANG=zh_TW.Big5
git config --global core.quotepath false
git config --global gui.encoding utf-8
git config --global i18n.commit.encoding utf-8
git config --global i18n.commitencoding utf-8
git config --global i18n.logoutputencoding big5