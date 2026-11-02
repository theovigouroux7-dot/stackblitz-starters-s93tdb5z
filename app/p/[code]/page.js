'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  getContrats,
  getContratDePlaque,
  associer,
  dissocier,
  contact,
} from '../../../lib/stockage';

const PRESTATIONS = [
  "Livraison d'eau",
  'Entretien climatisation',
  'Vidange sanitaire',
  'Nettoyage',
];

function mail(sujet) {
  return `mailto:${contact.email}?subject=${encodeURIComponent(sujet)}`;
}

export default function PagePlaque() {
  const params = useParams();
  const code = String(params.code).toUpperCase();
  const [pret, setPret] = useState(false);
  const [erreur, setErreur] = useState('');
  const [contrat, setContrat] = useState(null);
  const [contrats, setContrats] = useState([]);
  const [choix, setChoix] = useState('');

  async function charger() {
    try {
      setContrat(await getContratDePlaque(code));
      setContrats(await getContrats());
    } catch (e) {
      setErreur(e.message);
    }
    setPret(true);
  }

  useEffect(() => {
    charger();
  }, [code]);

  if (!pret) return <p className="muted">Chargement…</p>;
  if (erreur) return <p className="muted">Erreur : {erreur}</p>;

  if (!contrat) {
    return (
      <>
        <p className="muted">Plaque {code}</p>
        <h1>Plaque inconnue</h1>
        <section className="carte">
          <h2>Associer cette plaque à un contrat</h2>
          {contrats.length === 0 ? (
            <p>
              Aucun contrat enregistré.{' '}
              <Link href="/">Importer un contrat</Link>
            </p>
          ) : (
            <>
              <select
                className="champ"
                value={choix}
                onChange={(e) => setChoix(e.target.value)}
              >
                <option value="">Choisir un contrat…</option>
                {contrats.map((c) => (
                  <option key={c.numero} value={c.numero}>
                    {c.numero} – {c.client}
                  </option>
                ))}
              </select>
              <button
                className="bouton"
                disabled={!choix}
                onClick={async () => {
                  await associer(code, choix);
                  charger();
                }}
              >
                Associer
              </button>
            </>
          )}
        </section>
      </>
    );
  }

  return (
    <>
      <p className="muted">Plaque {code}</p>
      <h1>{contrat.client}</h1>

      <section className="carte">
        <h2>Votre location</h2>
        <p>
          <strong>Contrat :</strong> {contrat.numero}
        </p>
        <p>
          <strong>Adresse :</strong> {contrat.adresse}
        </p>
        <p>
          <strong>Période :</strong> du {contrat.debut} au {contrat.fin}
        </p>
        {contrat.materiel && contrat.materiel.length > 0 && (
          <>
            <p>
              <strong>Matériel :</strong>
            </p>
            <ul>
              {contrat.materiel.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="carte">
        <h2>Un problème ?</h2>
        <a className="bouton" href={`tel:${contact.telephone}`}>
          Appeler le SAV
        </a>
        <a
          className="bouton secondaire"
          href={mail(`SAV – contrat ${contrat.numero}`)}
        >
          Signaler par e-mail
        </a>
      </section>

      <section className="carte">
        <h2>Commander une prestation</h2>
        <ul className="prestations">
          {PRESTATIONS.map((p) => (
            <li key={p}>
              <span>{p}</span>
              <a href={mail(`Demande : ${p} – contrat ${contrat.numero}`)}>
                Demander
              </a>
            </li>
          ))}
        </ul>
      </section>

      <button
        className="lien-discret"
        onClick={async () => {
          await dissocier(code);
          charger();
        }}
      >
        Changer de contrat
      </button>
    </>
  );
}
