import Monitor from "./monitor";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <Monitor />
      <Toaster />
    </main>
  );
}
