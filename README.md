# Listen to the Ghost

Ein gruseliges 2D-Seitenansicht-Spiel mit Phaser 3 – alle Grafiken (Pixel-Art) und Sounds werden im Code erzeugt.

```bash
npm install
npm run dev      # http://localhost:5188
```

**Sprache:** Deutsch und Englisch. Die Browsersprache wird erkannt; umgeschaltet wird oben rechts auf dem Titelbildschirm („DE / EN“). Die Wahl wird im Browser gespeichert.

**Steuerung:** Pfeiltasten / WASD / linke Maustaste halten = fliegen · Leertaste / Rechtsklick = BUH! · M = Ton an/aus

**Ablauf:** Der Geist steigt in der verfallenen Burg (Gruftsteine, Gargoyles) aus seinem Grab, fliegt durch den Spukwald (mit einem verlassenen Spielplatz, dessen Schaukeln, Wippe und Karussell sich bewegen, wenn er vorbeischwebt) in die Stadt mit 12 vierstöckigen Stadthäusern (Zink-Mansarddächer). Über die Kellerabgänge neben den Häusern geht es hinunter in die Keller. Bewohner erschreckt man mit BUH. Ein BUH an den Gräbern in Burg und Wald lässt eine Skeletthand hochkommen, die freundlich winkt; Fledermäuse in der Nähe begleiten den Geist danach ein Stück. In der Straßenmitte steht das „Gasthaus zum Kürbis“: Im zweistöckigen Saal feiern 10 Gäste und 2 Kellner eine Halloween-Party und halten den Geist für verkleidet – erst ein BUH lässt sie unter Tische, hinter Deko und die Küchentür flüchten. Oben in den Hotelzimmern schlafen Gäste, die nur ein BUH weckt. In einem Drittel der Häuser lebt ein Hund, der den Geist anbellt und sich erst bei einem BUH versteckt. Unter drei Häusern liegt die U-Bahn-Station „Tuileries“ mit zwei Ausgängen vorne und hinten (jeweils mit „Metropolitain“-Bogen und roten Lampen): Auf dem Bahnsteig warten Leute, das Licht flackert in der Nähe des Geistes, einmal pro Minute hält ein Zug mit zwei Waggons voller Fahrgäste, und der Fahrkartenautomat spuckt Tickets aus. Der Zauberer versteckt sich in einem der hinteren vier Häuser – oben im Haus (violette Gauben) oder im Keller (violette Kellerfenster und Kellerlampe); violetter Kaminrauch verrät das Haus. Der Bosskampf hat zwei Stufen: Zuerst lässt der Zauberer seinen Lehrling kämpfen und verschwindet mit den Käfigen. Man weicht den Funken aus und lässt sie Kronleuchter, Regale oder die Ritterrüstung treffen – die fallen dann auf den Gegner. Nach dem Sieg liegen bis zu drei fliegende Herz-Tränke bereit, und eine Luke führt ins Dachgeschoss: eine astronomische Sternwarte, in der Teleskope, eine Armillarsphäre, hängende Planetenmodelle und Schriftrollen-Regale auf den Zauberer fallen können. Nach drei Treffern öffnen sich die Käfige.

Entwickler-Abkürzungen: `?start=city`, `?start=boss`, `?start=boss-cellar`, `?start=boss2` (Dachgeschoss).
