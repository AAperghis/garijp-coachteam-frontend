import localFont from "next/font/local";
import "../../globals.css";
import { DisciplineProvider } from "../../context/disciplineContext";

const oneDirection = localFont({
  src: "../../../fonts/OneDirection.ttf",
  variable: "--font-one-direction",
});

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className={`${oneDirection.variable} bg-white text-zinc-900`}>
        <DisciplineProvider>{children}</DisciplineProvider>
      </body>
    </html>
  );
}
