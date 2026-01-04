import MainNav from "@/components/main-nav";

export default function Home() {
  return (
    <div className="flex min-h-screen justify-center">
      <main className="flex min-h-screen w-full flex-col">
        <MainNav />
        <p className="font-light">Beausite Classic – Light</p>
        <p className="font-clear">Beausite Classic – Clear</p>
        <p className="font-regular">Beausite Classic – Regular</p>
        <p className="font-medium">Beausite Classic – Medium</p>
      </main>
    </div>
  );
}
