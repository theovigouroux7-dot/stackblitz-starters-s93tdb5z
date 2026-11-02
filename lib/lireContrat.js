// Lit un contrat BATILOC (PDF scanné ou photo) dans le navigateur, sans API.
const PDFJS =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const TESSERACT =
  'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';

function chargerScript(src, nomGlobal) {
  return new Promise((resolve, reject) => {
    if (window[nomGlobal]) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Impossible de charger ' + src));
    document.head.appendChild(s);
  });
}

async function pdfVersImage(fichier) {
  await chargerScript(PDFJS, 'pdfjsLib');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  const pdf = await window.pdfjsLib.getDocument({
    data: await fichier.arrayBuffer(),
  }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 4 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport })
    .promise;
  return canvas;
}

async function lireTexte(image) {
  await chargerScript(TESSERACT, 'Tesseract');
  const { data } = await window.Tesseract.recognize(image, 'fra');
  return data.text;
}

export function extraireInfos(texte) {
  const lignes = texte
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let numero = (texte.match(/\b\d{2}\s?-\s?\d{6}\b/) || [''])[0].replace(
    /\s/g,
    ''
  );
  if (!numero) {
    const secours = texte.match(/\b\d{7}\D{1,15}?(\d{6})\b/);
    numero = secours ? secours[1] : '';
  }

  const periode = texte.match(/(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})/);

  let client = '';
  for (const l of lignes) {
    if (/BATILOC/i.test(l)) continue;
    const m = l.match(
      /[A-Z0-9&'.\- ]*\b(SAS|SASU|SARL|EURL|SA|SCI|SNC)\b|\b(MAIRIE|COMMUNE)\b[A-Z0-9'\- ]*/
    );
    if (m) {
      client = m[0].trim();
      break;
    }
  }

  const postaux = [];
  lignes.forEach((l, i) => {
    const m = l.match(/^[:|\s]*(\d{5})\s+[A-Z]/);
    if (m) postaux.push({ code: m[1], i });
  });
  let adresse = '';
  if (postaux.length) {
    const facturation = postaux[0].code;
    const livraison =
      postaux.find((p) => p.code !== facturation && p.code !== '69330') ||
      postaux[0];
    const avant = livraison.i > 0 ? lignes[livraison.i - 1] : '';
    adresse = `${avant}, ${lignes[livraison.i]}`.replace(/[:|]/g, '').trim();
  }

  const materiel = [];
  for (const l of lignes) {
    const m = l.match(
      /[A-Z0-9]+\s*[-–~]+\s*.*?\d+[,.]\d+\s*m\s*x\s*\d+[,.]\d+\s*m/
    );
    if (m) materiel.push(m[0].trim());
  }

  return {
    numero,
    client,
    adresse,
    debut: periode ? periode[1] : '',
    fin: periode ? periode[2] : '',
    materiel,
  };
}

export async function lireContrat(fichier, etape) {
  etape('Ouverture du document…');
  const image =
    fichier.type === 'application/pdf' ? await pdfVersImage(fichier) : fichier;
  etape('Lecture du contrat, environ 30 secondes…');
  const texte = await lireTexte(image);
  return extraireInfos(texte);
}
