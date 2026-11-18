import Dashboard from "./dashboard";

export default function Page() {
  return <Dashboard stripe={Boolean(process.env.STRIPE_SECRET_KEY)} />;
}

export const dynamic = "force-dynamic";
