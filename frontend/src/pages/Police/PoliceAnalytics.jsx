export default function PoliceAnalytics() {
    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analytics Overview</h1>
                 <p className="text-gray-500 dark:text-gray-400">Historical distress metrics and heatmap charting.</p>
            </div>

            <div className="flex-1 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center flex-col p-10 text-center">
                <span className="text-5xl mb-4 grayscale opacity-50">📊</span>
                <h3 className="text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest mb-2">Data Models Syncing...</h3>
                <p className="text-gray-500 dark:text-gray-500 text-sm max-w-md">The telemetry models are currently processing incoming geographical and response-time metrics. Historical visualizations will populate shortly.</p>
            </div>
        </div>
    );
}
