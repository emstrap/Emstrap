import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function PoliceDashboard() {
    const { user } = useAuth();

    return (
        <div className="mx-auto flex h-full w-full max-w-5xl items-start">
            <div className="w-full rounded-3xl border border-slate-800 bg-slate-950/70 p-8 shadow-xl shadow-black/20">
                <div className="max-w-2xl space-y-4">
                    <p className="text-sm font-medium uppercase tracking-[0.3em] text-sky-300">
                        Police Dashboard
                    </p>
                    <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                        Welcome back{user?.name ? `, ${user.name}` : ""}.
                    </h1>
                    <p className="text-base leading-7 text-slate-300">
                        This dashboard has been simplified to a clean starting point. Use the live map when you need field visibility, or head to your profile to manage account details.
                    </p>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                    <Link
                        to="/police/map"
                        className="inline-flex items-center justify-center rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-300"
                    >
                        Open Live Map
                    </Link>
                    <Link
                        to="/profile"
                        className="inline-flex items-center justify-center rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                    >
                        View Profile
                    </Link>
                </div>

                <div className="mt-10 grid gap-4 md:grid-cols-2">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                        <h2 className="text-lg font-semibold text-white">Workspace</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            The dashboard now acts as a simple landing page for police users with quick access to core navigation.
                        </p>
                    </section>
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                        <h2 className="text-lg font-semibold text-white">Next Step</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            Use the sidebar to move between the dashboard and live map without any embedded analytics, alert feeds, or tracking widgets.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
