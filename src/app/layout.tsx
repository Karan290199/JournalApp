import "./globals.css";

export const metadata = {
  title: "My Journal",
  description: "A journaling chat app powered by Vercel Generative UI SDK",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
