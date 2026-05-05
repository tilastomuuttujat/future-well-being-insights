import { Link } from "react-router-dom";
import { useEffect } from "react";
import { InfoMark } from "@/components/InfoMark";
import { RECIPE_LIST } from "@/data/recipes";
import { ROADMAP } from "@/features/meta/data";
import { StatusBadge } from "@/features/meta/StatusBadge";

/**
 * Lukija — narratiivinen 8-lukuinen kertomus Suomen hyvinvointijärjestelmästä.
 *
 * Säilyttää alkuperäisen lukijaversion 5 lukua (Prologi, Iso kuva, Väestöryhmät,
 * Mekanismit, Agenda) ja lisää 3 uutta lukua, jotka vastaavat 50 v. polkuun,
 * 2035/2045-ajaumaan ja kustannustehokkaimpiin nivelkohtiin.
 */

const COHORTS = [
  {
    tag: "indiv" as const,
    label: "Yksilö",
    title: "Suuret ikäluokat",
    desc: "Pisimmälti hyötyivät peruspalvelujärjestelmän rakentumisesta työiässä ja saavat nyt eläkeiässä laajimman palvelukatteen.",
    role: "win" as const,
  },
  {
    tag: "cohort" as const,
    label: "Kohortti",
    title: "1990-luvun lapset",
    desc: "Lama-ajan lapsuuden indikaattorit (toimeentulotuki, mielenterveys, koulutuspolun katkokset) näkyvät kohonneina vielä aikuisiässä.",
    role: "lose" as const,
  },
  {
    tag: "state" as const,
    label: "Valtio",
    title: "2010-luvun nuoret aikuiset",
    desc: "Mielenterveys- ja työkykypalveluiden kysyntä on noussut nopeammin kuin järjestelmä on pystynyt mukautumaan.",
    role: "lose" as const,
  },
];

const PHASES = [
  {
    years: "1975–1990",
    name: "Laajeneminen",
    color: "var(--fn-vahvistava)",
    done: [
      "Peruspalveluiden alueellinen kattavuus",
      "Päivähoito-oikeus 1973 → 1990 täysi kattavuus",
      "Kansaneläkejärjestelmän laajennus",
    ],
    undone: [
      "Mielenterveyden avopalveluiden riittävä rakentuminen sairaalareformiin nähden",
      "Yksityisen ja julkisen rajapinnan tiedonkeruu",
    ],
  },
  {
    years: "1990–2000",
    name: "Lama ja säästö",
    color: "var(--fn-korjaava)",
    done: [
      "Akuuttien menojen jäädytys",
      "Kuntauudistuksen ensiyritys",
      "Työttömyysturvan rakenteen tiukennus",
    ],
    undone: [
      "Lasten ja nuorten kohorttisuojan rakentaminen laman aikana",
      "Perustason vahvistaminen erikoissairaanhoidon sijaan",
      "Pitkän aikavälin kohorttiseuranta investointina",
    ],
  },
  {
    years: "2000–2008",
    name: "Vaurastuminen",
    color: "var(--fn-vahvistava)",
    done: [
      "Hoitotakuun käyttöönotto 2005",
      "Eläkeuudistus 2005",
      "Koulutusinvestointien palautus",
    ],
    undone: [
      "Lama-ajan lasten saavuttaman 'tarjoumavajeen' korjaus aikuistumisvaiheessa",
      "Mielenterveys-perustason erottaminen erikoissairaanhoidosta",
      "Työterveyden ja julkisen perustason tiedonkulku",
    ],
  },
  {
    years: "2010–2024",
    name: "Pitkä sopeutuminen",
    color: "var(--fn-varautuminen)",
    done: [
      "SOTE-uudistus 2023",
      "Sosiaali- ja terveydenhuollon järjestämislaki",
      "Digitalisaatio (Kanta, Omakanta)",
    ],
    undone: [
      "Nuorten työkyvyttömyysalkavuuden rakenteellinen ratkaisu",
      "Perustason resurssoinnin sitominen erikoissairaanhoidon kasvuun",
      "Kohorttiriskien ennakointi ja aikainen interventio",
    ],
  },
];

const DRIFT_SCENARIOS = [
  {
    name: "Nykypolku",
    color: "var(--fn-korjaava)",
    desc: "Trendi jatkuu: työkyvyttömyysalkavuus +2,1 %/v., perustason hoitoonpääsy heikentyy, korjaavat menot kasvavat 1,8× nopeammin kuin ehkäisevät.",
    by2045: "n. 130 000 lisää työkyvyttömyyseläkkeellä alle 35-vuotiasta",
  },
  {
    name: "Varovainen interventio",
    color: "var(--fn-varautuminen)",
    desc: "30 % vähennys uusiin alkavuuksiin 5 v. kuluessa kohdennetulla mt-perustasolla ja nivelkohtien tuella.",
    by2045: "Säästö ~3,2 mrd €/v. korjaavissa palveluissa",
  },
  {
    name: "Voimakas interventio",
    color: "var(--fn-vahvistava)",
    desc: "60 % vähennys + ennakoivat investoinnit 5 nivelkohtaan (ks. luku 4.5). Vaatii etupainotteista panostusta 2025–2030.",
    by2045: "Työkyvyn tunnusluvut kohoavat 2010-tasoa korkeammalle",
  },
];

const LEVERAGE_POINTS = [
  {
    age: "0–2 v.",
    point: "Neuvola + perheille kohdennettu tuki",
    cost: "€",
    impact: "★★★★★",
    evidence: "Vahva (RCT, vertaismaat)",
  },
  {
    age: "7. luokka",
    point: "Mt-seulonta + matalan kynnyksen interventio koulussa",
    cost: "€",
    impact: "★★★★",
    evidence: "Kohtalainen (Suomi-pilotit)",
  },
  {
    age: "16–19 v.",
    point: "Nivelvaihe peruskoulu → toinen aste / työ",
    cost: "€€",
    impact: "★★★★★",
    evidence: "Vahva (kohorttitutkimus)",
  },
  {
    age: "25–35 v.",
    point: "Mt-perustason 24/7 + työterveyden integraatio",
    cost: "€€",
    impact: "★★★★",
    evidence: "Kohtalainen",
  },
  {
    age: "55–60 v.",
    point: "Ennakoiva työkyvyn tarkastus + työn muotoilu",
    cost: "€",
    impact: "★★★",
    evidence: "Kohtalainen",
  },
];

const AGENDA = [
  {
    who: "STM + hyvinvointialueet",
    title: "Sido perustason rahoitus erikoissairaanhoidon kasvuun",
    finding: "Perustason rahoitus on jäänyt jälkeen vaikka kysyntä on kasvanut nopeammin.",
    question: "Miksi sopeutuksissa leikataan ensimmäisenä siitä, mikä estää myöhempiä kuluja?",
    recipe: "funding_paradox",
  },
  {
    who: "STM + Kela",
    title: "Mt-perustason kapasiteetti vastaamaan kysyntäjoustoa",
    finding: "Joustavuus 0,2 — kysyntä kasvaa 5× kapasiteettia nopeammin.",
    question: "Mihin kapasiteetin lisäys kohdennettaisiin maksimaalisella vaikutuksella?",
    recipe: "elasticity",
  },
  {
    who: "OKM + STM",
    title: "Sulje datan katve työterveydestä ja yksityisestä",
    finding: "1/3 työikäisten palvelukäytöstä on ohjauksen katveessa.",
    question: "Voidaanko järjestelmää ohjata, jos kolmasosa on näkymätöntä?",
    recipe: "data_gap",
  },
  {
    who: "VM + hyvinvointialueet",
    title: "Etupainotteiset investoinnit 5 nivelkohtaan",
    finding: "Counterfactual näyttää 1995–2015 jätettyjen toimien hinnan.",
    question: "Voidaanko kustannustehokkaimpiin pisteisiin osoittaa etupainotteinen rahoitus?",
    recipe: "leverage",
  },
];

const Lukija = () => {
  useEffect(() => {
    document.title = "V-Signal · Suomen hyvinvointijärjestelmä, luettavasti";
  }, []);

  return (
    <article className="pb-16">
      {/* Header */}
      <header className="px-5 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <span className="eyebrow">V-Signal · Lukijaversio</span>
            <Link
              to="/reseptit"
              className="font-mono text-[11px] text-ink-mute hover:text-ink"
            >
              Asiantuntijatyökalu →
            </Link>
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl text-ink mb-5 leading-[1.05]">
            Suomen hyvinvointi&shy;järjestelmä, luettavasti.
          </h1>
          <p className="lede text-lg sm:text-xl">
            50 vuoden linjat, väestöryhmien voittajat ja häviäjät, ajauma 2045 — ja
            kustannustehokkaimmat nivelkohdat, joista korjaus alkaa.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 font-mono text-[11px] text-ink-mute">
            <span>~20 min lukuaika</span>
            <span aria-hidden>·</span>
            <a href="#agenda" className="hover:text-gold">Hyppää agendaan</a>
            <span aria-hidden>·</span>
            <a href="#menetelmat" className="hover:text-gold">Menetelmät & data</a>
          </div>
        </div>
      </header>

      {/* 0 Prologi */}
      <Section id="prologi" num={0} title="Prologi" sub="Mistä tässä on kyse">
        <p>
          Tämä on lukijaversio analyyseistä, jotka koskevat Suomen hyvinvointijärjestelmää:
          terveydenhuoltoa, sosiaaliturvaa, koulutusta, eläkkeitä ja niiden välisiä virtoja
          vuosikymmenten yli.
        </p>
        <p>
          Tarinaa ei ole sepitetty. Jokainen havainto on tuotettu nimetyllä
          analyysireseptillä avoimista tilastolähteistä. Vieressä oleva{" "}
          <span className="info-mark inline-flex" aria-hidden>i</span>-merkki kertoo aina,
          mistä havainto tulee ja miten se on laskettu — klikkaus vie suoraan reseptiin.
        </p>
        <p>
          Lukijaversio etenee yleiskuvasta yksityiskohtiin: <em>iso kuva</em> →{" "}
          <em>50 vuoden polku</em> → <em>väestöryhmät</em> → <em>mekanismit</em> →{" "}
          <em>ajauma 2045</em> → <em>nivelkohdat</em> → <em>agenda</em>.
        </p>
      </Section>

      {/* 1 Iso kuva */}
      <Section id="iso-kuva" num={1} title="Iso kuva" sub="Vuosikymmenet ja suunta">
        <p>
          1970-luvulta lähtien Suomen hyvinvointijärjestelmä on käynyt läpi neljä
          rakennevaihetta: <em>laajenemisen</em> (1975–1990), <em>laman ja säästön</em>{" "}
          (1990-luku), <em>vaurastumisen</em> (2000–2008) ja <em>pitkän sopeutumisen</em>{" "}
          (2010 →).
          <InfoMark recipeId="lifecycle" note="Vaiheistus tunnistetaan elinkaarivirran rakennemurroksista yli kaikkien sektorien." />
        </p>
        <p>
          Reaalimenoissa kasvu on ollut suhteellisen tasaista, mutta kasvun{" "}
          <em>kohde</em> on muuttunut radikaalisti. 1980-luvulla painopiste oli
          peruspalveluiden laajentumisessa. 2010-luvulta alkaen kasvu on suuntautunut yhä
          voimakkaammin korjaaviin palveluihin — erikoissairaanhoitoon, mielenterveyteen
          ja vanhushoivaan.
          <InfoMark recipeId="trend" note="Tunnistaa rakenteellisen taittuman vuosina 2008–2012 useimmissa sektoreissa." />
        </p>
        <KeyFinding>
          <strong className="font-serif">Avainhavainto.</strong> Vuodesta 2017 alkaen alle
          35-vuotiaiden työkyvyttömyyseläkkeissä on tilastollisesti todennettava
          trendinmurros, jota ei selitä pelkkä väestörakenne tai talouden sykli.
          <InfoMark recipeId="trend" />
        </KeyFinding>
        <p>
          Suunta seuraavalle vuosikymmenelle on kahden voiman määräämä: väestöllisen
          huoltosuhteen heikentyminen ja palvelutarpeiden siirtyminen yhä varhaisempaan
          elämänvaiheeseen. Nämä eivät kumoa toisiaan — ne kasautuvat.
        </p>
      </Section>

      {/* 1.5 50 vuoden polku — UUSI */}
      <Section
        id="polku"
        num={1.5}
        title="50 vuoden polku"
        sub="Mitä tehtiin, mitä jätettiin tekemättä"
        isNew
      >
        <p>
          Sen sijaan että tarkasteltaisiin vain mitä vuosikymmenten aikana saavutettiin,
          counterfactual-analyysi kysyy myös: <em>mitä jätettiin tekemättä?</em> Alla
          neljä rakennevaihetta tehtyjen päätösten <em>ja</em> tekemättä jätettyjen
          rinnakkaisesityksenä.
          <InfoMark recipeId="counterfactual" />
        </p>

        <div className="my-8 space-y-3">
          {PHASES.map((p) => (
            <div key={p.years} className="paper p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
                <div>
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: p.color }}
                  >
                    {p.years}
                  </div>
                  <h4 className="font-serif text-2xl text-ink mt-1">{p.name}</h4>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-5 mt-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute mb-2">
                    Tehtiin
                  </div>
                  <ul className="text-sm text-ink-soft space-y-1.5 list-disc list-inside marker:text-ink-faint">
                    {p.done.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-fn-korjaava mb-2">
                    Jätettiin tekemättä
                  </div>
                  <ul className="text-sm text-ink-soft space-y-1.5 list-disc list-inside marker:text-fn-korjaava">
                    {p.undone.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p>
          Tekemättä jätetyt päätökset eivät ole moralistinen lista — ne ovat ehdokkaita
          counterfactual-malliin, joka arvioi mitä toisin tehtynä olisi maksanut tai
          säästänyt. Suurimmat erot syntyvät 1990-luvun lapsuudenaikaisten kohorttisuojien
          puutteesta ja 2000-luvun mt-perustason laiminlyönnistä, joiden jäljet näkyvät
          nykyisessä työkyvyttömyystrendissä.
        </p>
      </Section>

      {/* 2 Väestöryhmät */}
      <Section id="vaestoryhmat" num={2} title="Väestöryhmät" sub="Voittajat ja häviäjät">
        <p>
          Sama järjestelmä näyttäytyy hyvin eri tavoin riippuen siitä, milloin olet
          syntynyt. Vertailupari-resepti antaa mahdollisuuden katsoa rinnakkain kahta
          kohorttia samassa elämänvaiheessa.
          <InfoMark recipeId="comparison_pair" />
        </p>
        <div className="grid sm:grid-cols-3 gap-4 my-8">
          {COHORTS.map((c) => (
            <div key={c.title} className="paper p-5">
              <div
                className={`font-mono text-[9px] uppercase tracking-[0.22em] ${
                  c.tag === "indiv"
                    ? "text-wake-individual"
                    : c.tag === "cohort"
                    ? "text-wake-cohort"
                    : "text-wake-state"
                }`}
              >
                {c.label}
              </div>
              <h4 className="font-serif text-xl text-ink mt-2 mb-2">{c.title}</h4>
              <p className="text-[13px] text-ink-soft leading-snug">{c.desc}</p>
              <span
                className={`inline-block mt-3 font-mono text-[10px] ${
                  c.role === "win" ? "text-fn-vahvistava" : "text-fn-korjaava"
                }`}
              >
                {c.role === "win" ? "Voittaja" : "Häviäjä"}
              </span>
            </div>
          ))}
        </div>
        <p>
          Voittajat ja häviäjät eivät jakaudu yksinkertaisesti ikäluokittain. Sama
          kohortti voi voittaa yhdessä elämänvaiheessa ja hävitä toisessa. Tärkeämpi
          kysymys on, <em>missä elämänvaiheessa</em> kohortti kohtasi järjestelmän
          vahvimmillaan tai heikoimmillaan.
        </p>
        <p>
          <Link
            to="/navigaattori?vuosi=1995&klusteri=cohort"
            className="font-mono text-[13px] text-gold hover:underline"
          >
            Tutki kohorttia 1995 navigaattorissa →
          </Link>
        </p>
      </Section>

      {/* 3 Mekanismit */}
      <Section id="mekanismit" num={3} title="Mekanismit" sub="Miksi näin kävi">
        <p>
          Miksi nämä kuviot syntyivät? Kolme rakenteellista mekanismia toistuvat
          aineistossa.
        </p>
        <h3 className="font-serif text-2xl text-ink mt-8 mb-3">1. Rahoitusparadoksi</h3>
        <p>
          Monilla alueilla ja sektoreilla rahoitus on kasvanut, mutta tulokset eivät ole
          seuranneet. Erityisen selvästi tämä näkyy perusterveydenhuollossa 2005–2024:
          reaalimenot +28 %, mutta hoitoonpääsyn ja jatkuvuuden mittarit heikentyneet.
          <InfoMark recipeId="funding_paradox" />
        </p>
        <KeyFinding>
          <strong className="font-serif">Avainhavainto.</strong> Rahoitusparadoksi ei ole
          rahan puutetta — se on rahan ja organisaation välistä viivettä.
        </KeyFinding>

        <h3 className="font-serif text-2xl text-ink mt-8 mb-3">2. Joustamattomuus</h3>
        <p>
          Kun kysyntä kasvaa nopeasti, järjestelmän kapasiteetti ei venytä mukana.
          Mielenterveyspalveluissa kysyntäjousto on noin 0,2 — kymmenen prosentin
          kysynnänkasvu tuottaa kahden prosentin kapasiteetinkasvun. Tulos: jonojen
          eksponentiaalinen kasvu.
          <InfoMark recipeId="elasticity" />
        </p>

        <h3 className="font-serif text-2xl text-ink mt-8 mb-3">3. Datan katve</h3>
        <p>
          Kolmas mekanismi on tiedon puute. Yli kolmasosa työikäisten
          terveyspalvelukäytöstä tapahtuu kanavissa (työterveys, yksityiset vakuutukset),
          joista ei ole julkista, vertailukelpoista dataa. Tämä tekee koko järjestelmän
          ohjaamisesta osittain sokkona suunnistamista.
          <InfoMark recipeId="data_gap" />
        </p>
      </Section>

      {/* 3.5 Ajauma — UUSI */}
      <Section
        id="ajauma"
        num={3.5}
        title="Ajauma 2035 / 2045"
        sub="Mihin nykytrendi vie 10–20 v. päässä"
        isNew
      >
        <p>
          Drift-projektio ekstrapoloi nykyiset rakenteelliset trendit kahteen
          horisonttiin (2035 ja 2045) kolmena polkuna: nykytrendi, varovainen interventio
          ja voimakas interventio.
          <InfoMark recipeId="drift" />
        </p>

        <div className="my-8 grid gap-4">
          {DRIFT_SCENARIOS.map((s) => (
            <div key={s.name} className="paper p-5 flex gap-4 items-start">
              <div
                className="w-1 self-stretch rounded-full flex-shrink-0"
                style={{ background: s.color }}
              />
              <div className="flex-1">
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1"
                  style={{ color: s.color }}
                >
                  {s.name}
                </div>
                <p className="text-[15px] text-ink-soft mb-2">{s.desc}</p>
                <p className="text-[13px] text-ink-mute font-mono">2045: {s.by2045}</p>
              </div>
            </div>
          ))}
        </div>

        <KeyFinding>
          <strong className="font-serif">Avainhavainto.</strong> Nykypolulla työkyvyttömyysmenot
          kohoavat 2045 mennessä noin 40 % nykyisestä reaalitasosta. Ero <em>varovaisen</em>{" "}
          ja <em>voimakkaan</em> intervention välillä on suuruusluokaltaan
          2–3 mrd €/v. — ja vaatii etupainotteista panostusta vuosina 2025–2030.
          <InfoMark recipeId="drift" />
        </KeyFinding>

        <p>
          Ekstrapolaatio ei ennusta tulevaisuutta. Se sanoo, mihin nykyiset rakenteet
          ajavat, jos mitään ei muutu. Mustia joutsenia (pandemia, geopolitiikka, AI:n
          tuottavuusvaikutus) ei mallinneta erikseen.
        </p>
        <p>
          <Link
            to="/navigaattori?nakyma=drift"
            className="font-mono text-[13px] text-gold hover:underline"
          >
            Tutki polkuja navigaattorissa →
          </Link>
        </p>
      </Section>

      {/* 4 Mekanismit-jälkeen → Nivelkohdat — UUSI */}
      <Section
        id="nivelkohdat"
        num={4}
        title="Nivelkohdat"
        sub="Missä panos-tuotos on paras"
        isNew
      >
        <p>
          Leverage-resepti tunnistaa elinkaaresta ne pisteet, joissa interventio tuottaa
          suurimman vaikutuksen suhteessa kustannukseen. Viisi nivelkohtaa nousee
          suomalaisesta ja vertailumaiden datasta selvimmin esiin.
          <InfoMark recipeId="leverage" />
        </p>

        <div className="my-8 paper overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-paper-deep">
              <tr className="text-left">
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                  Ikävaihe
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                  Interventio
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                  Kustannus
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                  Vaikutus
                </th>
                <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                  Näyttö
                </th>
              </tr>
            </thead>
            <tbody>
              {LEVERAGE_POINTS.map((lp) => (
                <tr key={lp.age} className="border-t border-ink/5">
                  <td className="px-4 py-3 font-mono text-xs text-ink">{lp.age}</td>
                  <td className="px-4 py-3 text-ink-soft">{lp.point}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-mute">{lp.cost}</td>
                  <td className="px-4 py-3 text-gold tracking-widest">{lp.impact}</td>
                  <td className="px-4 py-3 text-[12px] text-ink-mute">{lp.evidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p>
          Nivelkohdat eivät ole keskenään vaihtoehtoisia — ne kasaantuvat. Kohorttiin,
          joka saa tuen 7. luokalla, vaikuttaa myös nivelvaiheen 16–19 v. interventio
          vahvistavasti. Tämä on policy lag -reseptin keskeinen havainto.
          <InfoMark recipeId="policy_lag" />
        </p>
      </Section>

      {/* 5 Agenda */}
      <Section id="agenda" num={5} title="Agenda" sub="Korjattavat vinoumat">
        <p>
          Tämä on koostava lista vinoumista, joihin tarinan analyysit viittaavat. Jokainen
          kohta esittää kysymyksen päätöksentekijälle — ei poliittista kantaa.
        </p>
        <ol className="mt-6 grid gap-4">
          {AGENDA.map((a, i) => (
            <li key={a.title} className="paper p-5">
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <span className="font-mono text-[10px] text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-mono text-[11px] text-ink-mute text-right">{a.who}</span>
              </div>
              <h4 className="font-serif text-xl text-ink mb-1.5 leading-snug">{a.title}</h4>
              <p className="text-sm text-ink-soft mb-3">{a.finding}</p>
              <p className="text-[13px] italic text-ink border-t border-ink/10 pt-3">
                {a.question}
              </p>
              <Link
                to={`/reseptit/${a.recipe}`}
                className="mt-3 inline-block font-mono text-[10px] text-ink-faint hover:text-gold"
              >
                resepti: {a.recipe} →
              </Link>
            </li>
          ))}
        </ol>
      </Section>

      {/* 6 Menetelmät */}
      <Section id="menetelmat" num={6} title="Menetelmät & data" sub="Avoin laatikko">
        <p>
          Lukijaversion havainnot perustuvat {RECIPE_LIST.length} analyysireseptiin, jotka
          on määritelty SQL-näkyminä TTT-analyysi -tietokannassa. Reseptit ovat uudelleen
          ajettavissa ja jokainen niistä tuottaa tarkat luvut, joita tarinassa siteerataan.
        </p>
        <p>
          Lähdeaineistot: <strong>Tilastokeskus</strong> (väestö, kansantulot),{" "}
          <strong>THL</strong> (terveys- ja sosiaalipalvelut), <strong>Kela</strong>{" "}
          (etuudet), <strong>VM/valtion talousarvio</strong> (sektorimenot).
        </p>
        <div className="grid gap-3 mt-6">
          {RECIPE_LIST.map((r) => (
            <Link
              key={r.id}
              to={`/reseptit/${r.id}`}
              className="paper p-4 hover:shadow-md transition-shadow flex items-start gap-4 group"
            >
              <code className="font-mono text-[11px] text-gold pt-0.5 flex-shrink-0">
                {r.view}
              </code>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h4 className="font-serif text-lg text-ink group-hover:text-gold">
                    {r.title}
                  </h4>
                  {r.isNew && (
                    <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fn-vahvistava border border-fn-vahvistava/40 px-1.5 py-0.5 rounded">
                      Uusi
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink-soft mt-1">{r.oneliner}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-8">
          Haluatko ajaa reseptit itse omilla rajauksilla?{" "}
          <Link to="/reseptit" className="text-gold hover:underline">
            Asiantuntijatyökalu — reseptimylly →
          </Link>
        </p>
      </Section>

      {/* 7 Tiekartta — viittaus Tietokanta-sivuun */}
      <Section id="tiekartta" num={7} title="Tiekartta" sub="Mihin V-Signal etenee" isNew>
        <p>
          Lukijaversion ja navigaattorin alla on tietokanta, joka karttuu vaiheittain.
          Alla nykytilan tiivistelmä — täysi kuvaus tauluista, kattavuudesta ja tunnetuista
          puutteista löytyy meta-sivulta.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 my-6">
          {ROADMAP.map((p) => (
            <div key={p.phase} className="paper p-4 flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                  {p.phase}
                </div>
                <StatusBadge status={p.status} />
              </div>
              <h4 className="font-serif text-base text-ink leading-snug">{p.title}</h4>
              <ul className="text-[12px] text-ink-soft space-y-1 list-disc list-inside marker:text-ink-faint">
                {p.bullets.slice(0, 3).map((b) => <li key={b}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <p>
          <Link to="/navigaattori/tietokanta" className="font-mono text-[13px] text-gold hover:underline">
            Avaa tietokannan kokonaisarvio →
          </Link>
        </p>
      </Section>

      <footer className="border-t border-ink/10 mt-16 pt-12 pb-8">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <p className="eyebrow mb-3">V-Signal</p>
          <p className="text-sm text-ink-mute mb-1">
            Lukijaversio · avoin data, avoimet menetelmät · versio 0.2
          </p>
          <p className="font-mono text-[10px] text-ink-faint">
            <Link to="/navigaattori" className="hover:text-gold">/navigaattori</Link> ·{" "}
            <Link to="/reseptit" className="hover:text-gold">/reseptit</Link> ·{" "}
            <a href="#menetelmat" className="hover:text-gold">/menetelmat</a>
          </p>
        </div>
      </footer>
    </article>
  );
};

// ── Apukomponentit ─────────────────────────────────────────────

interface SectionProps {
  id: string;
  num: number;
  title: string;
  sub: string;
  isNew?: boolean;
  children: React.ReactNode;
}

const Section = ({ id, num, title, sub, isNew, children }: SectionProps) => (
  <section id={id} className="border-t border-ink/10 px-5 py-12">
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <p className="eyebrow">Luku {num}</p>
        {isNew && (
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-fn-vahvistava border border-fn-vahvistava/40 px-1.5 py-0.5 rounded">
            Uusi
          </span>
        )}
      </div>
      <h2 className="font-serif text-3xl sm:text-4xl text-ink mb-2 leading-tight">{title}</h2>
      <p className="lede mb-8">{sub}</p>
      <div className="prose-content space-y-4 text-[17px] text-ink-soft [&_strong]:text-ink [&_strong]:font-semibold [&_em]:italic">
        {children}
      </div>
    </div>
  </section>
);

const KeyFinding = ({ children }: { children: React.ReactNode }) => (
  <div className="paper gold-mark my-6 p-5">
    <p className="m-0">{children}</p>
  </div>
);

export default Lukija;
