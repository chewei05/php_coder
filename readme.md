# PHP Coder Tools：免安裝可攜的 PHP/Laravel 開發程式集

### 【PHP/Laravel 開發程式集】，以下簡稱 coder。這是一個整合 UniServerZ、cmder、git、composer、VS Code 的懶人包，只要下載解壓縮後就可以有一個免安裝可攜的 PHP 本機開發環境，當然要開發 Laravel 專案也沒問題。

## 系統需求與整合套件

本程式集約需 614MB 左右的空間，已整合可攜式軟體如下:
1. [UniForm Server Zero](http://www.uniformserver.com/) 13.3.2
    - Apache 2.4.25
    - PHP 7.1.1
    - MySQL v5.5
    - phpMyAdmin 4.6.6
2. [Cmder](http://cmder.net/) 1.3.2 (With [Git-for-Windows](https://git-scm.com/download/win) 2.13.0)
3. [Composer](https://getcomposer.org/) 1.4.2
4. [Node.js](https://nodejs.org/en/) 8.1.2 (npm 5.0.3)
5. [Virtual Studio Code](https://code.visualstudio.com/) 1.12.2 (portable)

### 其中 UniForm Server Zero 至少需要「Microsoft Visual C++ 2015 可轉散發套件 Update 1」以上版本才能正常執行，請自行下載安裝，僅需下載 32 位元版本即可。

## 使用方式

* 請先下載/安裝 [Microsoft Visual C++ 2015 可轉散發套件](hhttps://www.microsoft.com/zh-tw/download/details.aspx?id=53587) (32 bits 即可)
* 下載 PHP Coder Tools
* 解壓縮至您想要的位置，如 `c:\coder`

## 程式啟動

* 在 cmder 下輸入 `settings` 即可開啟 coder 的設定功能。
* cmder 預設位於，`coder\cmder\Cmder.exe`，點擊兩下即可啟動，啟動後會自動載相關程式，包括：
	* Git：`coder\cmder\vendor\git-for-windows\bin\git.exe`
	* PHP：`coder\UniServerZ\core\php71\php.exe`
	* Composer：`coder\composer\composer.phar`
	* Node.js：`coder\node\node.exe`
	* npm：`coder\node\npm.cmd`
* VS Code：`coder\VSCodePortable\VSCodePortable.exe`
* UniForm Server Zero 預設位於 `coder\UniServerZ`，點擊兩下即可啟動，透過 GUI 介面來管理 Apache、MySQL、PHP。

## 版本檢測

在 cmder 內，輸入以下指令即可檢測目前相對應程式的版本，如下(大小寫有區分)：
* Git：`git --version`
* PHP：`php -v`
* Composer：`composer -V`
* Node.js：`node -v`
* npm：`npm -v`

## 快速啟動

在 cmder 內，輸入以下指令即可快速啟動相對應的，如下：
* Git Status：`gs`
* Git Log：`gl`
* LiveReload：`lr`
* 檔案總管(目前資料夾)：`e.` 或 `open.`
* UniForm Server Zero - Controller：`uc`
* VS Code (portable)：`code`

## 注意事項

* VS Code 的可攜版(Portable)啟動較慢，建議前往官方網址安裝完整版。
* 如果要在滑鼠右鍵新增「以 VS Code 開啟」的功能，請至 `coder\registry` 內，自行安裝 `vscode-right-key-install.reg` 註冊機碼即可(點擊兩下依畫面指示安裝)。