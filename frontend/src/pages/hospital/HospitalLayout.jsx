import { Outlet } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";

export default function HospitalLayout() {
    return (
        <div className="bg-slate-950 text-white min-h-screen font-sans selection:bg-red-600 selection:text-white">
            <Navbar />
            
            <main className="transition-all duration-300 min-h-screen" style={{ paddingLeft: 'var(--sidebar-width)', paddingTop: '4rem' }}>
                <div className="p-6 md:p-8 h-[calc(100vh-4rem)] mx-auto overflow-y-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
