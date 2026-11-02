'use client';
import { useEffect, useState } from 'react';
import { lireContrat } from '../lib/lireContrat';
import {
  getContrats,
  ajouterContrat,
  supprimerContrat,
  creerPlaque,
} from '../lib/stockage';
import QrPlaque from '../components/QrPlaque';

const VIDE = {
  numero: '',
  client: '',
  adresse: '',
  debut: '',
  fin: '',
  materiel: '',
};

export default function Accueil() {
  const [contrats, setContrats] = useState([]);
  const [brouillon, setBrouillon] = useState(null);
  const [etape, setEtape] = useState('');
  const [survol, setSurvol] = useState(false);
  const [qrOuvert, setQrOuvert] = useState('');

  async function recharger() {
    try {
      setContrats(await getContrats());
    } catch (e) {
      setEtape('Erreur Supabase : ' + e.message);
    }
  }

  useEffect(() => {
    recharger();
  }, []);

  async function importer(fichier) {
    if (!fichier) return;
    setBrouillon(null);
    try {
      const infos = await lireContrat(fichier, setEtape);
      setBrouillon({ ...infos, materiel: infos.materiel.join('\n') });
      setEtape('');
    } catch (e) {
      setEtape('Lecture impossible : ' + e.message);
      setBrouillon({ ...VIDE });
    }
  }

  function modifier(champ, valeur) {
    setBrouillon({ ...brouillon, [champ]: valeur });
  }

  async function enregistrer() {
    if (!brouillon.numero)
      return alert('Indique au moins le numéro de contrat.');
    try {
      await ajouterContrat({
        ...brouillon,
        materiel: brouillon.materiel
          .split('\n')
          .map((m) => m.trim())
          .filter(Boolean),
      });
      setBrouillon(null);
      recharger();
    } catch (e) {
      alert('Enregistrement impossible : ' + e.message);
    }
  }

  async function supprimer(numero) {
    if (!confirm('Supprimer ce contrat ?')) return;
    await supprimerContrat(numero);
    recharger();
  }

  async function nouveauQr(numero) {
    try {
      const code = await creerPlaque(numero);
      setQrOuvert(code);
      recharger();
    } catch (e) {
      alert('Création impossible : ' + e.message);
    }
  }

  const champs = [
    ['numero', 'N° de contrat'],
    ['client', 'Client'],
    ['adresse', 'Adresse de livraison'],
    ['debut', 'Début de location'],
    ['fin', 'Fin de location prévue'],
  ];

  return (
    <>
      <h1>Contrats</h1>

      <label
        className={survol ? 'zone survol' : 'zone'}
        onDragOver={(e) => {
          e.preventDefault();
          setSurvol(true);
        }}
        onDragLeave={() => setSurvol(false)}
        onDrop={(e) => {
          e.preventDefault();
          setSurvol(false);
          importer(e.dataTransfer.files[0]);
        }}
      >
        <strong>Glisse un contrat BATILOC ici</strong>
        <span className="muted">
          ou clique pour choisir un PDF ou une photo
        </span>
        <input
          type="file"
          accept="application/pdf,image/*"
          hidden
          onChange={(e) => importer(e.target.files[0])}
        />
      </label>

      {etape && <p className="muted">{etape}</p>}

      {brouillon && (
        <section className="carte">
          <h2>Vérifie les infos lues</h2>
          {champs.map(([cle, libelle]) => (
            <div key={cle}>
              <label className="libelle">{libelle}</label>
              <input
                className="champ"
                value={brouillon[cle]}
                onChange={(e) => modifier(cle, e.target.value)}
              />
            </div>
          ))}
          <label className="libelle">Matériel (une ligne par module)</label>
          <textarea
            className="champ"
            rows={3}
            value={brouillon.materiel}
            onChange={(e) => modifier('materiel', e.target.value)}
          />
          <button className="bouton" onClick={enregistrer}>
            Enregistrer le contrat
          </button>
        </section>
      )}

      <h2>Contrats enregistrés</h2>
      {contrats.length === 0 && (
        <p className="muted">Aucun contrat pour l'instant.</p>
      )}
      <ul className="liste">
        {contrats.map((c) => (
          <li key={c.numero} className="carte">
            <strong>
              {c.numero} – {c.client}
            </strong>
            <p className="muted">{c.adresse}</p>
            <p className="muted">
              Du {c.debut} au {c.fin}
            </p>

            {c.plaques.length > 0 && (
              <p className="muted">
                Plaques :{' '}
                {c.plaques.map((p) => (
                  <button
                    key={p.code}
                    className="lien-discret code"
                    onClick={() =>
                      setQrOuvert(qrOuvert === p.code ? '' : p.code)
                    }
                  >
                    {p.code}
                  </button>
                ))}
              </p>
            )}

            {c.plaques.some((p) => p.code === qrOuvert) && (
              <QrPlaque code={qrOuvert} />
            )}

            <button className="bouton" onClick={() => nouveauQr(c.numero)}>
              Générer un QR code
            </button>
            <button
              className="lien-discret"
              onClick={() => supprimer(c.numero)}
            >
              Supprimer le contrat
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
