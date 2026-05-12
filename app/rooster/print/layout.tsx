import localFont from "next/font/local";
import "../../globals.css";

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
        {children}
      </body>
    </html>
  );
}
