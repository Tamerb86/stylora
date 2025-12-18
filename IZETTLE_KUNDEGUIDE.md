# iZettle Betalingsintegrasjon - Komplett Kundeguide

## 📱 Hva er iZettle?

iZettle er en moderne betalingsløsning som lar deg ta imot kortbetalinger direkte i salongen din. Med Styloras iZettle-integrasjon kan du:

- ✅ Ta imot alle typer kortbetalinger (Visa, Mastercard, American Express)
- ✅ Få pengene direkte inn på din egen bankkonto
- ✅ Synkronisere betalinger automatisk med Stylora
- ✅ Få kvitteringer sendt automatisk til kunder
- ✅ Ingen ekstra kostnader fra Stylora (kun iZettles ordinære gebyrer)

---

## 🚀 Kom i Gang - 3 Enkle Steg

### Steg 1: Opprett iZettle-konto (hvis du ikke har en)

**Hvis du allerede har iZettle-konto, hopp til Steg 2.**

1. Gå til https://www.izettle.com/no
2. Klikk på **"Kom i gang"**
3. Fyll ut informasjon om salongen din:
   - Organisasjonsnummer
   - Kontaktinformasjon
   - Bankkontonummer (for utbetalinger)
4. Fullfør registreringen og verifiser e-postadressen din
5. Bestill kortleser hvis du trenger en (valgfritt - kan også bruke mobilapp)

**Viktig:** Det tar vanligvis 1-3 virkedager å få godkjent iZettle-kontoen din.

### Steg 2: Koble iZettle til Stylora

1. **Logg inn på Stylora**
   - Gå til https://barbertime-production-5d35.up.railway.app
   - Logg inn med dine Stylora-legitimasjoner

2. **Åpne Innstillinger**
   - Klikk på **"Innstillinger"** i menyen til venstre
   - Velg **"Betalingsleverandører"**

3. **Koble til iZettle**
   - Finn **iZettle**-kortet på siden
   - Klikk på den blå knappen **"Koble til iZettle"**

4. **Godkjenn tilgang**
   - Du blir sendt til iZettles innloggingsside
   - Logg inn med din iZettle-konto
   - Klikk **"Godkjenn"** for å gi Stylora tilgang

5. **Ferdig!**
   - Du sendes tilbake til Stylora
   - Status skal nå vise **"Tilkoblet"** med grønn hake ✅
   - Din iZettle e-postadresse vises under statusen

### Steg 3: Start å ta imot betalinger

1. **Gå til Salg (POS)**
   - Klikk på **"Salg"** i menyen

2. **Legg til tjenester/produkter**
   - Klikk **"Legg til tjeneste"** og velg tjeneste
   - Klikk **"Legg til produkt"** hvis du selger produkter
   - Totalsummen vises nederst

3. **Betal med iZettle**
   - Klikk på den grønne knappen **"Betal med iZettle"**
   - Følg instruksjonene på skjermen
   - Betalingen behandles av iZettle

4. **Kvittering**
   - Kunden får kvittering automatisk
   - Betalingen registreres i Stylora
   - Du kan se transaksjonen i ordrehistorikken

---

## 📖 Detaljert Brukerveiledning

### Hvordan fungerer betalingsprosessen?

```
1. Kunde bestiller tjeneste
   ↓
2. Du legger til tjenester/produkter i POS
   ↓
3. Du klikker "Betal med iZettle"
   ↓
4. Kunde betaler med kort (via iZettle-terminal eller app)
   ↓
5. Betalingen godkjennes
   ↓
6. Kvittering sendes automatisk
   ↓
7. Pengene går direkte til din bankkonto
   ↓
8. Transaksjonen registreres i Stylora
```

### Hvor går pengene?

**Viktig:** Pengene går **direkte til din egen bankkonto** som er registrert hos iZettle. Stylora tar ikke noen del av betalingen - du betaler kun iZettles ordinære transaksjonsgebyr (vanligvis 1,75% per transaksjon).

**Utbetalingstid:**
- iZettle utbetaler normalt neste virkedag
- Du kan se alle utbetalinger i iZettle-appen eller på izettle.com

### Hva koster det?

**Stylora:**
- ✅ Ingen ekstra kostnader fra Stylora
- ✅ Betalingsintegrasjonen er inkludert i din månedlige abonnementspris

**iZettle:**
- 💳 Transaksjonsgebyr: 1,75% per transaksjon
- 📱 Kortleser: Ca. 299-599 kr (engangskjøp, valgfritt)
- 🆓 Ingen månedlige avgifter
- 🆓 Ingen bindingstid

### Hvilke betalingsmetoder støttes?

- ✅ Visa
- ✅ Mastercard
- ✅ American Express
- ✅ Maestro
- ✅ Kontaktløs betaling (NFC)
- ✅ Apple Pay
- ✅ Google Pay

---

## 🎯 Vanlige Spørsmål (FAQ)

### 1. Trenger jeg en iZettle-kortleser?

**Nei, det er valgfritt.** Du kan bruke:
- **iZettle-kortleser:** Best for fysiske betalinger i salongen (anbefalt)
- **iZettle-app:** Kan ta imot betalinger via mobilen din
- **Begge deler:** Bruk kortleser i salongen og app for mobile betalinger

### 2. Hvor lang tid tar det å få pengene?

iZettle utbetaler normalt **neste virkedag**. Eksempel:
- Betaling mandag → Penger på konto tirsdag
- Betaling fredag → Penger på konto mandag

### 3. Kan jeg bruke samme iZettle-konto på flere salonger?

**Nei.** Hver salong i Stylora må ha sin egen iZettle-konto. Dette sikrer at:
- Hver salong får pengene direkte til sin egen bankkonto
- Regnskapet blir riktig for hver salong
- Du har full kontroll over hver salongens økonomi

### 4. Hva skjer hvis betalingen feiler?

Hvis en betaling feiler:
1. Du får en feilmelding i Stylora
2. Ingen penger trekkes fra kundens kort
3. Du kan prøve igjen eller velge en annen betalingsmetode
4. Ordren lagres uansett i Stylora (med status "Ubetalt")

### 5. Kan jeg refundere en betaling?

**Ja!** Refundering kommer snart til Stylora. Inntil da kan du:
1. Gå til iZettle-appen eller izettle.com
2. Finn transaksjonen
3. Klikk "Refunder"
4. Velg helt eller delvis refundering

### 6. Hva hvis jeg mister internettforbindelsen?

iZettle-kortleseren kan lagre betalinger offline og synkronisere når internett kommer tilbake. Betalingene vil automatisk dukke opp i Stylora når synkroniseringen er fullført.

### 7. Er betalingene sikre?

**Ja, 100% sikre!** 
- 🔒 iZettle er PCI DSS sertifisert (høyeste sikkerhetsnivå for kortbetalinger)
- 🔒 All data krypteres
- 🔒 Stylora lagrer aldri kortnumre eller sensitive kortdata
- 🔒 Betalingene går direkte mellom kunde og iZettle

### 8. Kan jeg se alle iZettle-betalinger i Stylora?

**Ja!** Alle betalinger som gjøres via Stylora registreres automatisk:
- Se dem under **"Ordre"** i menyen
- Filtrer på betalingsmetode "iZettle"
- Eksporter til Excel for regnskap
- Se statistikk på Dashboard

### 9. Hva skjer hvis jeg kobler fra iZettle?

Hvis du kobler fra iZettle:
- Knappen "Betal med iZettle" forsvinner fra POS
- Eksisterende betalingshistorikk forblir i Stylora
- Du kan koble til igjen når som helst
- Ingen data slettes

### 10. Kan jeg bruke andre betalingsmetoder samtidig?

**Ja, absolutt!** Stylora støtter flere betalingsmetoder samtidig:
- iZettle (kortbetaling)
- Vipps (kommer snart)
- Kontant
- Faktura
- Gavekort

---

## 🛠️ Feilsøking

### Problem: "Koble til iZettle"-knappen gjør ingenting

**Løsning:**
1. Sjekk at du har internettforbindelse
2. Prøv å oppdatere siden (F5 eller Ctrl+R)
3. Prøv en annen nettleser (Chrome anbefales)
4. Tøm nettleserens cache og prøv igjen

### Problem: "Ugyldig redirect URI"-feil

**Løsning:**
Dette er et teknisk problem som må løses av Stylora support. Kontakt oss på support@stylora.no med følgende informasjon:
- Salongens navn
- Din e-postadresse
- Skjermbilde av feilen

### Problem: Betalingen tar lang tid

**Forventet tid:** 3-10 sekunder

**Hvis det tar lengre:**
1. Sjekk internettforbindelsen
2. Sjekk at iZettle-kortleseren er tilkoblet
3. Prøv å starte betalingen på nytt
4. Kontakt iZettle support hvis problemet vedvarer

### Problem: "Ikke tilkoblet" vises selv om jeg har koblet til

**Løsning:**
1. Oppdater siden (F5)
2. Logg ut og inn igjen
3. Koble fra og koble til iZettle på nytt:
   - Gå til Innstillinger → Betalingsleverandører
   - Klikk "Koble fra"
   - Klikk "Koble til iZettle" igjen

### Problem: Betalingen vises ikke i Stylora

**Løsning:**
1. Vent 1-2 minutter (synkronisering kan ta litt tid)
2. Oppdater siden
3. Sjekk under "Ordre" i menyen
4. Hvis betalingen fortsatt ikke vises, kontakt support

---

## 📞 Support og Hjelp

### Stylora Support

**For spørsmål om Stylora-integrasjonen:**
- 📧 E-post: support@stylora.no
- 🌐 Hjelpesenter: https://help.stylora.no
- 📱 Telefon: [Telefonnummer]
- ⏰ Åpningstider: Man-Fre 09:00-17:00

### iZettle Support

**For spørsmål om iZettle-kontoen, kortleser eller utbetalinger:**
- 📧 E-post: support@izettle.com
- 🌐 Hjelpesenter: https://www.izettle.com/no/help
- 📱 Telefon: 21 93 05 50
- ⏰ Åpningstider: Man-Fre 09:00-17:00

---

## 🎓 Tips og Triks

### 1. Bruk iZettle-appen som backup

Last ned iZettle-appen på mobilen din som backup. Hvis Stylora skulle ha tekniske problemer, kan du fortsatt ta imot betalinger via iZettle-appen.

### 2. Test betalingsfunksjonen

Før du begynner å bruke iZettle med ekte kunder:
1. Gjør en testbetaling med ditt eget kort
2. Sjekk at betalingen vises i Stylora
3. Refunder testbetalingen i iZettle-appen

### 3. Informer kundene dine

La kundene vite at du nå tar imot kortbetalinger:
- Legg ut en plakat i salongen
- Oppdater nettsiden din
- Nevn det når kunder booker time

### 4. Følg med på utbetalinger

Sjekk iZettle-appen regelmessig for å se:
- Når penger blir utbetalt
- Totale inntekter
- Transaksjonsgebyrer

### 5. Bruk rapportene i Stylora

Stylora gir deg detaljerte rapporter:
- Gå til **"Rapporter"** i menyen
- Se hvor mye du har tjent via iZettle
- Sammenlign med andre betalingsmetoder
- Eksporter til Excel for regnskapet

---

## 📊 Eksempel: En typisk arbeidsdag med iZettle

**Kl. 09:00 - Første kunde**
- Kunde kommer for herreklipp
- Du logger inn i Stylora
- Går til "Salg" (POS)
- Legger til "Herreklipp" (299 kr)
- Klikker "Betal med iZettle"
- Kunde betaler med kort
- Kvittering sendes automatisk

**Kl. 12:00 - Kunde kjøper også produkt**
- Kunde vil ha hårpleieprodukt etter klippingen
- Legger til "Hårpleie produkt" (150 kr)
- Legger til "Herreklipp" (299 kr)
- Total: 449 kr
- Betaler med iZettle
- Begge varer registreres i lageret

**Kl. 17:00 - Dagens oppsummering**
- Går til "Rapporter"
- Ser at du har hatt 8 iZettle-betalinger
- Totalt 2.850 kr via iZettle
- Pengene blir utbetalt til bankkontoen din i morgen

**Neste dag kl. 10:00**
- 2.850 kr er på bankkontoen din
- Minus iZettles gebyr (ca. 50 kr)
- Netto: 2.800 kr

---

## ✅ Sjekkliste: Er du klar til å bruke iZettle?

Før du begynner å ta imot betalinger, sjekk at:

- [ ] Du har opprettet iZettle-konto
- [ ] iZettle-kontoen er godkjent og aktiv
- [ ] Du har koblet iZettle til Stylora
- [ ] Status viser "Tilkoblet" i Stylora
- [ ] Du har testet en betaling
- [ ] Du har iZettle-kortleser eller app klar
- [ ] Du har informert kundene dine om at du tar imot kort

**Gratulerer! Du er nå klar til å ta imot kortbetalinger! 🎉**

---

## 📱 Last ned iZettle-appen

**iOS (iPhone/iPad):**
- Søk etter "iZettle" i App Store
- Eller gå til: https://apps.apple.com/no/app/izettle/id581916213

**Android:**
- Søk etter "iZettle" i Google Play
- Eller gå til: https://play.google.com/store/apps/details?id=com.izettle.android

---

## 🔄 Oppdateringer og Nye Funksjoner

Stylora jobber kontinuerlig med å forbedre iZettle-integrasjonen. Kommende funksjoner:

**Kommer snart:**
- ✨ Refundering direkte fra Stylora
- ✨ Automatisk synkronisering av alle iZettle-betalinger
- ✨ Kvitteringsutskrift via iZettle-skriver
- ✨ Støtte for flere iZettle-terminaler per salong
- ✨ Detaljerte betalingsrapporter

**Ønsker du en funksjon?**
Send oss en e-post på support@stylora.no med dine ønsker!

---

**Lykke til med iZettle og Stylora! 🚀**

*Sist oppdatert: 18. desember 2024*
