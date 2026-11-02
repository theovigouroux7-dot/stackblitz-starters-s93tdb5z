import './globals.css';
import Header from '../components/Header';

export const metadata = {
  title: 'Loc and Go',
  description: 'Votre bungalow Loc and Go',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
