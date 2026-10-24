# Listen to the Ghost

Ein gruseliges 2D-Seitenansicht-Spiel mit Phaser 3 – alle Grafiken (Pixel-Art) und Sounds werden im Code erzeugt.

```bash
npm install
npm run dev      # http://localhost:5188
```

**Steuerung:** Pfeiltasten / WASD / linke Maustaste halten = fliegen · Leertaste / Rechtsklick = BUH! · M = Ton an/aus

**Ablauf:** Der Geist steigt in der verfallenen Burg (Gruftsteine, Gargoyles) aus seinem Grab, fliegt durch den Spukwald in die Stadt mit 12 vierstöckigen Stadthäusern (Zink-Mansarddächer). Über die Kellerabgänge neben den Häusern geht es hinunter in die Keller. Bewohner erschreckt man mit BUH. Der Zauberer versteckt sich in einem der hinteren vier Häuser – oben im Haus (violette Gauben) oder im Keller (violette Kellerfenster und Kellerlampe); violetter Kaminrauch verrät das Haus. Im Bosskampf weicht man den Zauberfunken aus und lässt sie Kronleuchter, Regale oder die Ritterrüstung treffen – die fallen dann auf den Zauberer. Nach drei Treffern öffnen sich die Käfige.

Entwickler-Abkürzungen: `?start=city`, `?start=boss`, `?start=boss-cellar`.
