import Image from 'next/image';

export default function Header() {
  return (
    <header className="header">
      <Image
        src="/logo.png"
        alt="Loc and Go"
        width={160}
        height={125}
        priority
      />
    </header>
  );
}
