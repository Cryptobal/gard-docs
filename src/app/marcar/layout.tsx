/**
 * Layout para la página pública de marcación.
 * Sin sidebar, sin header — solo la interfaz de marcación.
 */

export default function MarcacionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
