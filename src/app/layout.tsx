import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-poppins" });
export const metadata: Metadata = { title: { default: "BorrowHub | Don't Buy It. Borrow It.", template: "%s | BorrowHub" }, description: "Rent everyday items from people nearby. Save money, share more.", openGraph: { title: "BorrowHub", description: "Don't Buy It. Borrow It.", type: "website" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={`${inter.variable} ${poppins.variable}`}><body><Providers><SiteHeader />{children}</Providers></body></html>; }
