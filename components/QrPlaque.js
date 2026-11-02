'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { lienPlaque } from '../lib/stockage';

export default function QrPlaque({ code }) {
  const [image, setImage] = useState('');
  const lien = lienPlaque(code);

  useEffect(() => {
    QRCode.toDataURL(lien, { width: 600, margin: 2 }).then(setImage);
  }, [lien]);

  if (!image) return null;

  return (
    <div className="qr">
      <img src={image} alt={`QR code de la plaque ${code}`} />
      <p className="muted">Plaque {code}</p>
      <a
        className="bouton secondaire"
        href={image}
        download={`plaque-${code}.png`}
      >
        Télécharger pour imprimer
      </a>
    </div>
  );
}
