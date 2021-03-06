/*!--------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
define("vs/code/electron-browser/sharedProcessMain.nls.de",{"vs/base/common/json":["Ungültiges Symbol","Ungültiges Zahlenformat.","Ein Eigenschaftenname wurde erwartet.","Ein Wert wurde erwartet.","Ein Doppelpunkt wurde erwartet.","Ein Komma wurde erwartet.","Eine schließende geschweifte Klammer wurde erwartet.","Eine schließende Klammer wurde erwartet.","Das Dateiende wurde erwartet."],"vs/base/common/severity":["Fehler","Warnung","Info"],"vs/base/node/zip":["{0} wurde im ZIP nicht gefunden."],"vs/platform/configuration/common/configurationRegistry":["Standard-Konfiguration überschreibt","Zu überschreibende Einstellungen für Sprache {0} konfigurieren.","Zu überschreibende Editor-Einstellungen für eine Sprache konfigurieren.","Trägt Konfigurationseigenschaften bei.","Eine Zusammenfassung der Einstellungen. Diese Bezeichnung wird in der Einstellungsdatei als trennender Kommentar verwendet.","Die Beschreibung der Konfigurationseigenschaften.",'"{0}" kann nicht registriert werden. Die Eigenschaft stimmt mit dem Eigenschaftsmuster \'\\\\[.*\\\\]$\' zum Beschreiben sprachspezifischer Editor-Einstellungen überein. Verwenden Sie den Beitrag "configurationDefaults".','"{0}" kann nicht registriert werden. Diese Eigenschaft ist bereits registriert.','"configuration.properties" muss ein Objekt sein.','Wenn eine Festlegung erfolgt, muss "configuration.type" auf "object" festgelegt werden.',"configuration.title muss eine Zeichenfolge sein.","Trägt zu Konfigurationeinstellungen des Standard-Editors für die jeweilige Sprache bei."],"vs/platform/extensionManagement/common/extensionManagement":["Extensions","Einstellungen"],"vs/platform/extensionManagement/node/extensionGalleryService":["Die Extension wurde nicht gefunden.","Eine kompatible Version von {0} mit dieser Version des Codes wurde nicht gefunden."],"vs/platform/extensionManagement/node/extensionManagementService":['Die Erweiterung ist ungültig: "package.json" ist keine JSON-Datei.',"Bitte starten Sie Code vor der Neuinstallation von {0} neu.","Bitte starten Sie Code vor der Neuinstallation von {0} neu.",'Durch das Installieren von "{0}" werden auch die abhängigen Komponenten installiert. Möchten Sie den Vorgang fortsetzen?',"Ja","Nein","Bitte starten Sie Code vor der Neuinstallation von {0} neu.",'Möchten Sie nur "{0}" oder auch die zugehörigen Abhängigkeiten deinstallieren?',"Nur","Alle","Abbrechen",'Möchten Sie "{0}" deinstallieren?',"OK","Abbrechen",'Die Erweiterung "{0}" kann nicht deinstalliert werden. Die Erweiterung "{1}" hängt von dieser Erweiterung ab.','Die Erweiterung "{0}" kann nicht deinstalliert werden. Die Erweiterungen "{1}" und "{2}" hängen von dieser Erweiterung ab.','Die Erweiterung "{0}" kann nicht deinstalliert werden. Die Erweiterungen "{1}" und "{2}" sowie weitere hängen von dieser Erweiterung ab.',"Die Erweiterung wurde nicht gefunden."],"vs/platform/extensions/common/extensionsRegistry":['Gibt für VS Code-Erweiterungen die VS Code-Version an, mit der die Erweiterung kompatibel ist. Darf nicht "*" sein. Beispiel: ^0.10.5 gibt die Kompatibilität mit mindestens VS Code-Version 0.10.5 an.',"Der Herausgeber der VS Code-Extension.","Der Anzeigename für die Extension, der im VS Code-Katalog verwendet wird.","Die vom VS Code-Katalog zum Kategorisieren der Extension verwendeten Kategorien.","Das in VS Code Marketplace verwendete Banner.","Die Bannerfarbe für die Kopfzeile der VS Code Marketplace-Seite.","Das Farbdesign für die Schriftart, die im Banner verwendet wird.","Alle Beiträge der VS Code-Extension, die durch dieses Paket dargestellt werden.","Legt die Erweiterung fest, die im Marketplace als Vorschau gekennzeichnet werden soll.","Aktivierungsereignisse für die VS Code-Extension.","Array aus Badges, die im Marketplace in der Seitenleiste auf der Seite mit den Erweiterungen angezeigt werden.","Die Bild-URL für den Badge.","Der Link für den Badge.","Eine Beschreibung für den Badge.",'Abhängigkeiten von anderen Erweiterungen. Der Bezeichner einer Erweiterung ist immer ${publisher}.${name}, beispielsweise "vscode.csharp".',"Ein Skript, das ausgeführt wird, bevor das Paket als VS Code-Extension veröffentlicht wird.","Der Pfad zu einem 128x128-Pixel-Symbol."],"vs/platform/extensions/node/extensionValidator":["Der engines.vscode-Wert {0} konnte nicht analysiert werden. Verwenden Sie z. B. ^0.10.0, ^1.2.3, ^0.11.0, ^0.10.x usw.",'Die in "engines.vscode" ({0}) angegebene Version ist nicht spezifisch genug. Definieren Sie für VS Code-Versionen vor Version 1.0.0 bitte mindestens die gewünschte Haupt- und Nebenversion, z. B. ^0.10.0, 0.10.x, 0.11.0 usw.','Die in "engines.vscode" ({0}) angegebene Version ist nicht spezifisch genug. Definieren Sie für VS Code-Versionen nach Version 1.0.0 bitte mindestens die gewünschte Hauptversion, z. B. ^1.10.0, 1.10.x, 1.x.x, 2.x.x usw.',"Die Extension ist nicht mit dem Code {0} kompatibel. Die Extension erfordert {1}.","Es wurde eine leere Extensionbeschreibung abgerufen.",'Die Eigenschaft "{0}" ist erforderlich. Sie muss vom Typ "string" sein.','Die Eigenschaft "{0}" ist erforderlich. Sie muss vom Typ "string" sein.','Die Eigenschaft "{0}" ist erforderlich. Sie muss vom Typ "string" sein.','Die Eigenschaft "{0}" ist erforderlich und muss vom Typ "object" sein.','Die Eigenschaft "{0}" ist erforderlich. Sie muss vom Typ "string" sein.','Die Eigenschaft "{0}" kann ausgelassen werden oder muss vom Typ "string[]" sein.','Die Eigenschaft "{0}" kann ausgelassen werden oder muss vom Typ "string[]" sein.','Die Eigenschaften "{0}" und "{1}" müssen beide angegeben oder beide ausgelassen werden.','Die Eigenschaft "{0}" kann ausgelassen werden oder muss vom Typ "string" sein.','Es wurde erwartet, dass "main" ({0}) im Ordner ({1}) der Extension enthalten ist. Dies führt ggf. dazu, dass die Extension nicht portierbar ist.','Die Eigenschaften "{0}" und "{1}" müssen beide angegeben oder beide ausgelassen werden.','Die Extensionversion ist nicht mit "semver" kompatibel.'],"vs/platform/message/common/message":["Schließen","Später","Abbrechen"],"vs/platform/request/node/request":["HTTP",'Die zu verwendende Proxyeinstellung. Wenn diese Option nicht festgelegt wird, wird der Wert aus den Umgebungsvariablen "http_proxy" und "https_proxy" übernommen.',"Gibt an, ob das Proxyserverzertifikat anhand der Liste der bereitgestellten Zertifizierungsstellen überprüft werden soll.","Der Wert, der als Proxy-Authorization-Header für jede Netzwerkanforderung gesendet werden soll."],"vs/platform/telemetry/common/telemetryService":["Telemetrie","Aktivieren Sie das Senden von Nutzungsdaten und Fehlern an Microsoft."]});
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/19222cdc84ce72202478ba1cec5cb557b71163de/core/vs\code\electron-browser\sharedProcessMain.nls.de.js.map
