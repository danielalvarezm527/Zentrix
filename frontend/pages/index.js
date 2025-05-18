import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { Rubik} from "next/font/google";

const RubikSans = Rubik({
  variable: "--font-Rubik-sans",
  subsets: ["latin"],
});

export default function Home() {
  const router=useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, 2000); 

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={`background ${RubikSans.className}`}>
      <div className="watermark">Zentrix</div>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color:"#18404b" }}>Bienvenido a Zentrix</h1>
      </div>
    </div>
  );
}
