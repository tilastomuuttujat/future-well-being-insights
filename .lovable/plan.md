
# V-Signal · yhdistetty hyvinvointijärjestelmän analyysisovellus

## Lähtötilanne ja tavoite

Sinulla on kolme erillistä HTML-prototyyppiä:
- **v_signal-4** — reseptimylly (tumma kojelauta, Supabase-yhteys, J-koodit + kulmat + elastisuus + vanavesi)
- **v-signal-lukija** — narratiivinen lukijaversio (vaalea paperi, 5 lukua + 6 reseptin metakortit)
- **navigaattori-8 / naviga-10** — klusteri × aika × vanavesi -kartta (vaalea paperi, funktiot vahvistava/varautuminen/korjaava)

Ne tuottavat hyödyllistä signaalia, mutta lukijalle jää liian ohut diagnoosi 50 vuoden hyvinvointimatkasta: lähinnä "nuoremmat ovat heikompikuntoisia + työkyvyttömyystrendi". Tarvitaan tukevampi ote siihen **mitä tehtiin, mitä jätettiin tekemättä ajoissa, mihin ollaan ajautumassa 10–20 v. päästä, ja missä panos-tuotos on paras**.

Tavoite: yksi yhtenäinen Lovable-sovellus, joka esittää saman datan kolmesta näkökulmasta ja laajentaa reseptivalikoimaa neljällä uudella analyysillä.

## Sovelluksen rakenne

Yksi React Router -sovellus, kolme reittiä, jaettu data-kerros ja jaettu tilanhallinta:

```
/                     → Lukija     (narratiivinen 5-lukuinen kertomus, ~15 min lukuaika)
/navigaattori         → Navigaattori (klusteri × aika × vanavesi -kartta)
/reseptit             → Reseptimylly (J-koodi-taulukko + drill + vertailu + reseptit)
/reseptit/:id         → Yksittäisen reseptin suora linkki (jaettavissa)
```

Kaikki kolme näkymää lukevat samasta Supabase-projektista (yjkabgtbcgvrfqtewtna). Tila — valittu klusteri, vuosi, J-koodi, vertailupari — kulkee URL-parametreissa, jotta navigointi näkymästä toiseen säilyttää kontekstin (esim. lukijasta klikkaus kohorttiin "1995" → navigaattori avautuu vuoteen 1995 → klikkaus J-koodiin → reseptimylly avaa kyseisen rivin drilliin).

## Visuaalinen identiteetti

Yhtenäinen vaalea paperi -tyyli koko sovellukseen, lukijan ja navigaattorin DNA:sta:
- Pohja `#f4f1ea`, paperi `#faf8f3`, muste `#1a1d24`, kulta-aksentti `#8a6510`
- Otsikot Instrument Serif, leipä Inter, koodi/metadata JetBrains Mono
- Funktiovärit: vahvistava `#2f6b46`, varautuminen `#2c5a8a`, korjaava `#a8401f`
- Vanavesivärit: yksilö `#3f8055`, kohortti `#a85d3f`, valtio `#2c5a8a`
- Reseptimyllyn taulukko muunnetaan tummasta kojelaudasta vaaleaan paperikieleen (samat sarakkeet, sama vuorovaikutus, eri värit)
- Yhteinen TopNav: `V-Signal · Lukija | Navigaattori | Reseptit`

## Reseptit

Säilytetään olemassa olevat 6 reseptiä (lifecycle, elasticity, trend, funding_paradox, data_gap, comparison_pair) ja lisätään 4 uutta, jotka vastaavat suoraan kysymyksiisi:

### Uusi 1 — Counterfactual ("mitä jos toimittu ajoissa")
Vastaa: *Mitä jätettiin tekemättä?*
Vertaa toteutunutta kehityspolkua simuloituun vaihtoehtoon, jossa interventio (esim. nuorten mielenterveyspalvelut 1995, perustasolaajennus 2008) olisi tehty ajoissa. Visualisoi kahden polun ero kumulatiivisena erotusalueena (työkykyvuodet, kustannukset).

### Uusi 2 — Drift-projektio 2035 / 2045
Vastaa: *Miltä trendit näyttävät 10–20 v. päästä?*
Ekstrapoloi nykytrendit segmenteittäin (väestö, sektorimenot, työkyvyttömyysalkavuus) luottamusvälin kanssa. Näyttää kolme polkua: nykypolku, varovainen interventio, voimakas interventio.

### Uusi 3 — Leverage-pisteet
Vastaa: *Missä panos-tuotos on paras?*
Kustannustehokkuuskartta elinkaarella: €/säilytetty työvuosi tai €/QALY interventiopisteittäin. Visualisoi nivelkohdat (esim. neuvola, 7. luokka, 19 v. nivelvaihe, 55+ ennakoiva), joissa pieni panos tuottaa suurimman vaikutuksen.

### Uusi 4 — Policy lag (kausaaliketju)
Vastaa: *Milloin tämän päivän päätös alkaa näkyä?*
Mallintaa viiveen päätös → toteutus → tulos sektoreittain (esim. SOTE 2010 → vaikutus 2023). Näyttää aikajanan, jossa nykyiset päätökset projisoituvat tulevaisuuden indikaattoreihin.

## Sovellusnäkymät yksityiskohtaisemmin

### Lukija (`/`)
Säilyttää nykyisen 5-lukuisen rakenteen (Prologi → Iso kuva → Väestöryhmät → Mekanismit → Agenda → Menetelmät) **ja lisää 3 uutta lukua** käyttäjän kysymyksiin vastaamaan:

- **Luku 1.5 — 50 vuoden polku.** Aikajana 1975–2024 nelivaiheisena (laajeneminen / lama / vaurastuminen / sopeutuminen) ja jokaiseen vaiheeseen 2–3 nimettyä päätöstä JA 2–3 nimettyä tekemätöntä päätöstä (counterfactual-reseptin tuottamana).
- **Luku 3.5 — Ajauma 2035/2045.** Kolme polkua kuvaajana, jokaisen tärkeimmät indikaattorit. Linkki "Tutki polkuja navigaattorissa →".
- **Luku 4.5 — Nivelkohdat.** Leverage-pisteet visuaalisena elinkaarikarttana, jokainen kohta avattavissa korttiin: kustannus, vaikutus, näyttöaste.

Jokainen havainto saa edelleen `i`-merkin → tooltip kertoo reseptin nimen ja linkki vie suoraan reseptimyllyyn.

### Navigaattori (`/navigaattori`)
Säilyttää nykyisen klusteri × aika × vanavesi -konseptin, mutta yhtenäistetään lukijan tyyliin. Lisätään:
- Aikajanaan **counterfactual-overlay** (toteutunut + ajoissa toimittu rinnakkain)
- **Drift-näkymä** — siirrä aikalevyä eteenpäin 2035 → 2045
- Klikkaus solmuun avaa drawerissa joko relevantin lukijan kappaleen TAI suoran linkin reseptiin

### Reseptimylly (`/reseptit`)
Sama taulukko kuin v_signal-4, mutta vaaleassa paperityylissä. 10 reseptin (6 vanhaa + 4 uutta) painikepaneeli yläosassa. Drill-näkymä avautuu rivin alle (nykyinen kuvaaja-, elastisuus- ja vertailutoiminnallisuus). Anomaliarivit ⚠ merkillä.

## Tekninen toteutus

> *Tämä osio on tekniselle lukijalle — voit hypätä yli, jos tärkeintä on lopputuotteen toiminnallisuus.*

- **Stack:** React 18 + Vite 5 + TypeScript + Tailwind + shadcn/ui (jo paikalla Lovable-pohjassa)
- **Data:** `@supabase/supabase-js` lukee suoraan v_signal_*-näkymät (anon-key, vain SELECT). Lovable Cloud kytketään, jotta secret-hallinta siirtyy pois inline-koodista.
- **Reititys:** React Router (`BrowserRouter`) — `/`, `/navigaattori`, `/reseptit`, `/reseptit/:id`, `*` NotFound
- **Tila:** TanStack Query reseptidatan caching, URL-parametrit jaetulle tilalle (klusteri, vuosi, J-koodi, vertailu)
- **Kuvaajat:** Recharts (yhdenmukainen koko sovelluksessa; korvaa nykyisten prototyyppien d3 + Chart.js -sekoituksen)
- **Tyyli:** Tailwind-tokenit `index.css`:ssä (HSL-muuttujat) — vaalea paperi -paletti, Instrument Serif + Inter + JetBrains Mono Google Fontsista
- **Uusien reseptien Supabase-näkymät:** `v_signal_counterfactual`, `v_signal_drift`, `v_signal_leverage`, `v_signal_policy_lag` — luodaan migraatiolla Lovable Cloudin kautta sen jälkeen, kun olet vahvistanut, mistä taulukoista ne lasketaan
- **Esteettömyys:** Semanttinen HTML, tooltip-`i`-merkit `<button>`-elementteinä, tumma teksti vaalealla pohjalla riittävällä kontrastilla, tulostustyyli säilytetään lukijassa

## Toteutusvaiheet

Jaetaan kahteen erään, jotta jokainen vaihe pysyy hallittavana:

**Erä 1 — Pohja + lukija + Supabase-yhteys**
1. Asenna React Router, TanStack Query, Recharts, supabase-js
2. Luo Tailwind-tyylitokenit (vaalea paperi -paletti, fontit)
3. Kytke Lovable Cloud → Supabase-projekti `yjkabgtbcgvrfqtewtna`
4. Toteuta TopNav + reititys + NotFound
5. Toteuta Lukija (`/`) nykyisellä 5-lukuisella sisällöllä, hae reseptidata Supabasesta, `i`-tooltipit
6. **Tarkistuspiste sinulle**: lukija näyttää oikealta tyyliltä ja datalta

**Erä 2 — Navigaattori + reseptimylly + uudet reseptit + lukijan uudet luvut**
7. Toteuta Navigaattori (`/navigaattori`) klusteri × aika × vanavesi
8. Toteuta Reseptimylly (`/reseptit`) vaaleassa tyylissä, 6 olemassa olevaa reseptiä
9. Lisää 4 uutta reseptiä (counterfactual, drift, leverage, policy_lag) — UI + Supabase-näkymät migraationa
10. Lisää lukijaan 3 uutta lukua (50 v. polku, ajauma, nivelkohdat) jotka käyttävät uusia reseptejä
11. Yhdistä syvälinkitykset: lukija → navigaattori → reseptimylly URL-parametreilla
12. **Tarkistuspiste sinulle**: kaikki kolme näkymää keskustelevat

## Mitä tarvitsen sinulta ennen aloitusta

1. **Supabase-yhteys.** Pohja viittaa projektiin `yjkabgtbcgvrfqtewtna` julkisella anon-keyllä. Vahvista, että haluat:
   - (a) käyttää tätä samaa kantaa Lovable Cloudin kautta, tai
   - (b) luoda uuden Supabase-projektin Lovable Cloudin sisälle ja siirtää näkymät sinne
2. **Uusien reseptien data.** Onko taulukoita, joista uudet 4 reseptiä voidaan laskea (interventiokustannukset, vaikutuskertoimet, väestöprojektiot)? Vai aloitetaanko UI:lla ja täydennetään näkymät myöhemmin demo-laskelmilla?

Jos vastaus on epäselvä, oletusarvo on (a) + UI ensin, näkymät demo-laskelmilla joita tarkennetaan kun kerrot lähdetaulukot.

## Lopputulos

Yhden klikkauksen sovellus, joka:
- antaa lukijalle 15 min mittaisen kertomuksen 50 v. hyvinvointimatkasta nivelkohtineen ja ajauma-ennusteineen
- antaa asiantuntijalle interaktiivisen klusteri × aika × vanavesi -kartan ja reseptimyllyn 10 analyysillä
- jakaa saman datan kaikkien näkymien kesken, niin että jokainen havainto on jäljitettävissä reseptiin ja reseptin tulos kerrottavissa narratiivina
