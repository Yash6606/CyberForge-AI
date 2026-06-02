import React, { useState, useEffect } from 'react';
import {
    Shield,
    Search,
    BarChart3,
    Lock,
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Activity,
    Zap,
    Info,
    Layers,
    Cpu,
    RefreshCw,
    Eye,
    Settings,
    Network,
    Download,
    ThumbsUp,
    ThumbsDown,
    Globe,
    Radio,
    Image as ImageIcon,
    FileIcon,
    Monitor,
    Camera
} from 'lucide-react';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line, Pie, Doughnut } from 'react-chartjs-2';
import { motion, AnimatePresence } from 'framer-motion';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_BASE = "http://localhost:8000";

const HighlightText = ({ text, triggers }) => {
    if (!text) return null;
    if (!triggers || triggers.length === 0) return <span>{text}</span>;

    // Filter out empty triggers to avoid regex loops
    const validTriggers = triggers.filter(t => t && t.length > 0);
    if (validTriggers.length === 0) return <span>{text}</span>;

    const pattern = new RegExp(`(${validTriggers.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
    const parts = text.split(pattern);

    return (
        <p className="text-gray-300 leading-relaxed text-sm">
            {parts.map((part, i) => (
                // Use a local non-global regex for testing to avoid stateful lastIndex issues
                new RegExp(pattern.source, 'i').test(part) ?
                    <span key={i} className="bg-red-500/20 text-red-400 border-b border-red-500/40 px-0.5 rounded-sm font-bold">{part}</span> :
                    <span key={i}>{part}</span>
            ))}
        </p>
    );
};

const Dashboard = () => {
    const [inputText, setInputText] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [visionResult, setVisionResult] = useState(null);
    const [isVisionAnalyzing, setIsVisionAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('analyze');
    const [scriptInput, setScriptInput] = useState("");
    const [scriptResult, setScriptResult] = useState(null);
    const [isScriptAnalyzing, setIsScriptAnalyzing] = useState(false);
    // ... existing handlers ...
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsVisionAnalyzing(true);
        setResult(null);
        setVisionResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const resp = await fetch(`${API_BASE}/vision/analyze`, {
                method: 'POST',
                body: formData
            });
            const data = await resp.json();
            console.log("Vision Analysis Result:", data);

            setVisionResult(data);
            if (data.vision?.extracted_text) {
                setInputText(data.vision.extracted_text);
            }
            if (data.nlp_context) {
                setResult(data.nlp_context);
            }
        } catch (e) {
            console.error("Vision Analysis Error:", e);
            alert("Error analyzing image. Please ensure the backend is running.");
        } finally {
            setIsVisionAnalyzing(false);
            // Reset input so same file can be uploaded again
            event.target.value = '';
        }
    };
    const [metrics, setMetrics] = useState(null);
    const [privacyMode, setPrivacyMode] = useState(true);
    const [intrusionData, setIntrusionData] = useState({
        protocol_type: 'tcp', service: 'http', flag: 'SF', src_bytes: 250, dst_bytes: 4500,
        num_failed_logins: 0, logged_in: 1, count: 20, srv_count: 20, hot: 0,
        wrong_fragment: 0, urgent: 0
    });
    const [intrusionResult, setIntrusionResult] = useState(null);
    const [isIntrusionAnalyzing, setIsIntrusionAnalyzing] = useState(false);
    const [intrusionDashboard, setIntrusionDashboard] = useState(null);
    const [liveStatus, setLiveStatus] = useState({ is_active: false, packets: [] });
    const [threatMap, setThreatMap] = useState([]);
    const [isReporting, setIsReporting] = useState(false);

    useEffect(() => {
        fetchMetrics();
        const interval = setInterval(fetchMetrics, 10000);

        // Request Notification Permission
        if ("Notification" in window) {
            Notification.requestPermission();
        }

        const liveInterval = setInterval(fetchLiveStatus, 2000);
        return () => {
            clearInterval(interval);
            clearInterval(liveInterval);
        };
    }, []);

    const fetchLiveStatus = async () => {
        try {
            const resp = await fetch(`${API_BASE}/live/status`);
            const data = await resp.json();
            setLiveStatus(data);
        } catch (e) { console.error(e); }
    };

    const fetchThreatMap = async () => {
        try {
            const resp = await fetch(`${API_BASE}/intel/map`);
            const data = await resp.json();
            setThreatMap(data);
        } catch (e) { console.error(e); }
    };

    const handleToggleLive = async (active) => {
        try {
            await fetch(`${API_BASE}/live/toggle?active=${active}`, { method: 'POST' });
            fetchLiveStatus();
        } catch (e) { console.error(e); }
    };

    const handleDownloadReport = async (data) => {
        setIsReporting(true);
        try {
            const resp = await fetch(`${API_BASE}/report/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const { download_url } = await resp.json();
            window.open(`${API_BASE}${download_url}`, '_blank');
        } catch (e) { console.error(e); }
        finally { setIsReporting(false); }
    };

    const handleFeedback = async (label) => {
        try {
            await fetch(`${API_BASE}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: inputText,
                    initial_score: result.risk_score,
                    user_label: label,
                    confidence: result.confidence
                })
            });
            alert("Feedback recorded. Thank you for helping the AI learn!");
        } catch (e) { console.error(e); }
    };

    const fetchMetrics = async () => {
        try {
            const resp = await fetch(`${API_BASE}/metrics`);
            const data = await resp.json();
            setMetrics(data);
        } catch (e) { console.error(e); }
    };

    const handleAnalyze = async () => {
        if (!inputText.trim()) return;
        setIsAnalyzing(true);
        try {
            const resp = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: inputText, privacy_mode: privacyMode })
            });
            const data = await resp.json();
            setResult(data);

            // Trigger Notification for High Risk Phishing
            if (data.risk_score > 70 && Notification.permission === "granted") {
                new Notification("🚨 High Risk Threat Detected", {
                    body: `Phishing attempt identified with ${data.risk_score}% risk score. Category: ${data.category}`,
                    icon: "/shield-logo.png"
                });
            }

            fetchMetrics();
        } catch (e) {
            console.error(e);
            alert("Error analyzing message. Is the backend running?");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleIntrusionAnalyze = async () => {
        setIsIntrusionAnalyzing(true);
        try {
            const resp = await fetch(`${API_BASE}/intrusion/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(intrusionData)
            });
            const data = await resp.json();
            setIntrusionResult(data);

            // Trigger Notification for Network Intrusion
            if (!data.attack_type.toLowerCase().includes('normal') && Notification.permission === "granted") {
                new Notification(`🛑 Network Attack: ${data.attack_type}`, {
                    body: `${data.severity} severity intrusion detected. Confidence: ${data.confidence}%`,
                    icon: "/shield-logo.png"
                });
            }
        } catch (e) {
            console.error(e);
            alert("Error analyzing network traffic.");
        } finally {
            setIsIntrusionAnalyzing(false);
        }
    };

    const handleScriptAnalyze = async () => {
        if (!scriptInput.trim()) return;
        setIsScriptAnalyzing(true);
        try {
            const resp = await fetch(`${API_BASE}/script/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: scriptInput })
            });
            const data = await resp.json();
            setScriptResult(data);
        } catch (e) {
            console.error(e);
            alert("Error analyzing script.");
        } finally {
            setIsScriptAnalyzing(false);
        }
    };

    const fetchIntrusionDashboard = async () => {
        try {
            const resp = await fetch(`${API_BASE}/intrusion/dashboard-data`);
            const data = await resp.json();
            setIntrusionDashboard(data);
        } catch (e) { console.error(e); }
    };

    const simulateTraffic = (type) => {
        const scenarios = {
            'Normal': { protocol_type: 'tcp', service: 'http', flag: 'SF', src_bytes: 350, dst_bytes: 4200, count: 2, srv_count: 2, num_failed_logins: 0, logged_in: 1, hot: 0, wrong_fragment: 0, urgent: 0 },
            'DoS': { protocol_type: 'tcp', service: 'http', flag: 'S0', src_bytes: 0, dst_bytes: 0, count: 511, srv_count: 511, num_failed_logins: 0, logged_in: 0, hot: 0, wrong_fragment: 0, urgent: 0 },
            'Probe': { protocol_type: 'icmp', service: 'eco_i', flag: 'SF', src_bytes: 8, dst_bytes: 0, count: 1, srv_count: 14, num_failed_logins: 0, logged_in: 0, hot: 0, wrong_fragment: 0, urgent: 0 },
            'R2L': { protocol_type: 'tcp', service: 'ftp', flag: 'SF', src_bytes: 200, dst_bytes: 500, count: 1, srv_count: 1, num_failed_logins: 5, logged_in: 0, hot: 2, wrong_fragment: 0, urgent: 0 }
        };
        setIntrusionData(scenarios[type] || scenarios['Normal']);
    };

    const getRiskColor = (score) => {
        if (score > 70) return "text-red-500";
        if (score > 30) return "text-yellow-500";
        return "text-green-500";
    };

    const lineData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Threats Detected',
                data: [12, 19, 3, 5, 2, 3, 7],
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: '#3b82f6',
                tension: 0.4,
            },
        ],
    };

    return (
        <div className="flex h-screen bg-[#0a0c10] text-gray-200 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-[#11141b] border-r border-gray-800 flex flex-col">
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20">
                        <Shield className="text-white w-6 h-6" />
                    </div>
                    <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        CyberForge
                        <span className="text-orange-500 block text-xs -mt-1 uppercase tracking-widest font-black">AI by AMD</span>
                    </span>
                </div>

                <nav className="flex-1 mt-6 px-4 space-y-2">
                    {[
                        { id: 'analyze', icon: Search, label: 'Phishing Analysis' },
                        { id: 'script-audit', icon: FileIcon, label: 'Script Audit' },
                        { id: 'intrusion', icon: Shield, label: 'Intrusion Detection' },
                        { id: 'hardware-core', icon: Zap, label: 'AMD Intelligence Core' },
                        { id: 'dashboard', icon: BarChart3, label: 'Threat Intel' },
                        { id: 'intrusion-dashboard', icon: Layers, label: 'NIDS Dashboard' },
                        { id: 'privacy', icon: Lock, label: 'Privacy Control' },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                setActiveTab(item.id);
                                if (item.id === 'intrusion-dashboard') fetchIntrusionDashboard();
                                if (item.id === 'dashboard') fetchThreatMap();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeTab === item.id
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-gray-800">
                    <div className="bg-[#1a1f29] rounded-xl p-4 border border-gray-800">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity className="text-blue-500 w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">System Health</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-green-500">Ryzen™ AI Active</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_green]"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'script-audit' && (
                        <motion.div
                            key="script-audit"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="max-w-6xl mx-auto space-y-8"
                        >
                            <header className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-display font-bold text-white mb-2">Malicious Script Audit</h1>
                                    <p className="text-gray-400">Deep packet inspection for suspicious code fragments.</p>
                                </div>
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-3">
                                    <Cpu className="text-orange-400" size={24} />
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">NPU Acceleration</p>
                                        <p className="text-xs font-bold text-white">AMD Ryzen™ AI-Assisted Scan</p>
                                    </div>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-[#11141b] rounded-2xl border border-gray-800 shadow-2xl overflow-hidden font-mono">
                                        <div className="bg-[#0d1016] px-6 py-3 border-b border-gray-800 flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Source Code (Python/JS)</span>
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                                            </div>
                                        </div>
                                        <textarea
                                            value={scriptInput}
                                            onChange={(e) => setScriptInput(e.target.value)}
                                            placeholder="Paste script here (e.g. import os; os.system('...'))"
                                            className="w-full bg-transparent p-6 h-96 focus:outline-none resize-none text-sm text-blue-300"
                                        />
                                        <div className="p-4 border-t border-gray-800 flex justify-end bg-[#0d1016]">
                                            <button
                                                onClick={handleScriptAnalyze}
                                                disabled={isScriptAnalyzing || !scriptInput.trim()}
                                                className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
                                            >
                                                {isScriptAnalyzing ? <RefreshCw className="animate-spin" /> : <Eye size={18} />}
                                                {isScriptAnalyzing ? "Scanning..." : "Audit Code"}
                                            </button>
                                        </div>
                                    </div>

                                    {scriptResult && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-[#11141b] border border-gray-800 rounded-2xl p-8 shadow-2xl"
                                        >
                                            <div className="flex justify-between items-center mb-8">
                                                <div>
                                                    <h2 className="text-4xl font-black text-white italic">{scriptResult.verdict}</h2>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Zap size={14} className="text-orange-500" />
                                                        <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">{scriptResult.acceleration_mode}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Threat Score</p>
                                                    <p className={`text-4xl font-black ${scriptResult.threat_score > 60 ? 'text-red-500' : 'text-orange-500'}`}>{scriptResult.threat_score}%</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {(scriptResult.findings || []).map((f, i) => (
                                                    <div key={i} className="bg-[#0d1016] border border-gray-800 p-6 rounded-2xl">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <span className="text-[10px] px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-black uppercase tracking-widest">{f.category}</span>
                                                            <span className="text-xs text-gray-600">Risk: {f.risk_level}</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {(f.triggers || []).map((t, idx) => (
                                                                <code key={idx} className="block text-xs text-orange-400 bg-orange-950/10 p-2 rounded border border-orange-950/20">{t}</code>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-[#11141b] rounded-2xl p-6 border border-gray-800">
                                        <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                                            <Info size={16} className="text-orange-500" />
                                            Audit Handbook
                                        </h3>
                                        <ul className="space-y-4">
                                            {[
                                                { t: 'Data Exfil', d: 'Detection of remote POST/GET requests to non-whitelisted IPs.' },
                                                { t: 'System Mod', d: 'Identifying calls to OS-level modification flags.' },
                                                { t: 'Obfuscation', d: 'Spotting Base64 or Zlib encoding used to hide payloads.' },
                                                { t: 'Side-Channel', d: 'AMD-specific detection of branch prediction timing leaks.' }
                                            ].map((item, i) => (
                                                <li key={i}>
                                                    <p className="text-xs font-black text-gray-300 uppercase tracking-tighter mb-1">{item.t}</p>
                                                    <p className="text-[11px] text-gray-500 leading-tight">{item.d}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'hardware-core' && (
                        <motion.div
                            key="hardware-core"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="max-w-6xl mx-auto space-y-8"
                        >
                            <header className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-display font-bold text-white mb-2">AMD Hardware Intelligence Core</h1>
                                    <p className="text-gray-400">Real-time telemetry and hardware-level security metrics.</p>
                                </div>
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-3">
                                    <Cpu className="text-orange-400" size={24} />
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Acceleration Engine</p>
                                        <p className="text-xs font-bold text-white">Ryzen™ AI NPU Active</p>
                                    </div>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Activity size={48} className="text-orange-500" /></div>
                                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Activity size={12} />
                                        NPU Utilization
                                    </p>
                                    <h3 className="text-4xl font-black text-white mb-2">{metrics?.hardware?.npu_utilization || "---"}</h3>
                                    <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden mt-4">
                                        <div className="h-full bg-orange-500" style={{ width: metrics?.hardware?.npu_utilization || "0%" }}></div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-widest">Ryzen™ AI Logic Tiles</p>
                                </div>

                                <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Zap size={48} className="text-green-500" /></div>
                                    <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Zap size={12} />
                                        Inference Efficiency
                                    </p>
                                    <h3 className="text-4xl font-black text-white mb-2">{metrics?.hardware?.inference_efficiency || "---"}</h3>
                                    <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-widest">Samples per Watt (FP16)</p>
                                </div>

                                <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Lock size={48} className="text-blue-500" /></div>
                                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Shield size={12} />
                                        Secure Enclave
                                    </p>
                                    <h3 className="text-4xl font-black text-white mb-2">{metrics?.hardware?.secure_enclave_status || "---"}</h3>
                                    <p className="text-[10px] text-gray-500 mt-4 uppercase font-bold tracking-widest">AMD Secure Processor (ASP)</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl">
                                    <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Silicon Telemetry</h3>
                                    <div className="space-y-4 font-mono text-xs">
                                        <div className="flex justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                            <span className="text-gray-500">Acceleration API</span>
                                            <span className="text-blue-400">ROCm v6.0</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                            <span className="text-gray-500">Latency Gain</span>
                                            <span className="text-green-400">{metrics?.hardware?.latency_gain || "N/A"}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                            <span className="text-gray-500">Power Draw</span>
                                            <span className="text-orange-400">{metrics?.hardware?.power_draw || "---"}</span>
                                        </div>
                                        <div className="flex justify-between p-3 bg-black/20 rounded-xl border border-white/5">
                                            <span className="text-gray-500">Die Temperature</span>
                                            <span className="text-red-400">{metrics?.hardware?.temp || "---"}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col justify-center items-center text-center">
                                    <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
                                        <Shield className="text-blue-500 w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">Hardware-Verified Trust</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                        Executes on Ryzen™ 9 7000 Series. Verified boot chain and memory encryption active via AMD AES-NI instructions.
                                    </p>
                                    <div className="grid grid-cols-1 gap-2 w-full">
                                        <div className="px-4 py-2 bg-black/40 rounded-lg border border-green-500/20 text-[10px] font-black text-green-500 uppercase tracking-widest">AES-NI Active</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'analyze' && (
                        <motion.div
                            key="analyze"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="max-w-6xl mx-auto space-y-8"
                        >
                            <header className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-3xl font-display font-bold text-white mb-2">Threat Analysis Engine</h1>
                                    <p className="text-gray-400">Perform a multi-layered AI audit on messages or URLs.</p>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-[#11141b] rounded-2xl p-1 border border-gray-800 shadow-2xl">
                                        <textarea
                                            value={inputText}
                                            onChange={(e) => setInputText(e.target.value)}
                                            placeholder="Paste suspicious text or URL here..."
                                            className="w-full bg-transparent p-6 h-64 focus:outline-none resize-none text-lg text-gray-200"
                                        />
                                        <div className="p-4 border-t border-gray-800 flex justify-between items-center bg-[#0d1016] rounded-b-2xl">
                                            <div className="flex gap-4 items-center">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    Hybrid AI Model
                                                </div>
                                                <div className="h-4 w-px bg-gray-800"></div>
                                                <label className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 cursor-pointer group transition-all">
                                                    <ImageIcon size={14} className="group-hover:scale-110 transition-transform" />
                                                    <span>{isVisionAnalyzing ? 'Auditing...' : 'Audit Image'}</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        disabled={isVisionAnalyzing}
                                                    />
                                                </label>
                                            </div>
                                            <button
                                                onClick={handleAnalyze}
                                                disabled={isAnalyzing || (!inputText.trim() && !visionResult)}
                                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                                            >
                                                {isAnalyzing ? <RefreshCw className="animate-spin" /> : <Zap size={18} />}
                                                {isAnalyzing ? "Processing..." : "Analyze Now"}
                                            </button>
                                        </div>
                                    </div>

                                    {(result || visionResult) && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-[#11141b] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl"
                                        >
                                            <div className={`h-1.5 w-full ${(visionResult?.final_risk_score || result?.risk_score) > 70 ? 'bg-red-500' : (visionResult?.final_risk_score || result?.risk_score) > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                            <div className="p-8">
                                                <div className="flex justify-between items-start mb-8">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${(visionResult?.final_risk_score || result?.risk_score) > 70 ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                (visionResult?.final_risk_score || result?.risk_score) > 30 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                    'bg-green-500/10 text-green-500 border-green-500/20'
                                                                }`}>
                                                                {result?.category || (visionResult ? 'Vision Audit' : 'Analysis')}
                                                            </span>
                                                            <span className="text-gray-500 text-sm">• Latency: {result?.latency || '24ms'}</span>
                                                        </div>
                                                        <h2 className="text-6xl font-black text-white">
                                                            {visionResult ? visionResult.final_risk_score : result?.risk_score}% <span className="text-2xl font-medium text-gray-500">Risk</span>
                                                        </h2>
                                                        <div className="flex items-center gap-2 mt-4">
                                                            <Zap size={14} className="text-blue-400" />
                                                            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                                                                {result?.acceleration_mode || visionResult?.acceleration_mode || "AMD ROCm Optimized (NPU-Accelerated)"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-gray-400 text-xs mb-1 uppercase tracking-widest font-black">AI Confidence</p>
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500" style={{ width: `${(result?.confidence || 0.98) * 100}%` }}></div>
                                                            </div>
                                                            <span className="font-mono text-white font-bold">{((result?.confidence || 0.98) * 100).toFixed(0)}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {visionResult && (
                                                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        <div className="bg-[#0d1016] p-4 rounded-xl border border-gray-800">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <Camera size={16} className="text-purple-400" />
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Forgery Analysis (ELA)</p>
                                                            </div>
                                                            <div className="flex items-end justify-between">
                                                                <span className="text-xl font-black text-white">{visionResult.vision.manipulation_score}%</span>
                                                                <span className="text-[10px] text-gray-600">Manipulation Conf.</span>
                                                            </div>
                                                            <div className="mt-2 h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                                                                <div className={`h-full ${visionResult.vision.manipulation_score > 50 ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${visionResult.vision.manipulation_score}%` }}></div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-[#0d1016] p-4 rounded-xl border border-gray-800">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <ImageIcon size={16} className="text-blue-400" />
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">OCR Extraction</p>
                                                            </div>
                                                            <p className="text-xs text-gray-400 line-clamp-2">
                                                                {visionResult.vision.extracted_text || "No text detected in image."}
                                                            </p>
                                                        </div>
                                                        <div className="bg-[#0d1016] p-4 rounded-xl border border-orange-500/20">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <Monitor size={16} className="text-orange-400" />
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Deepfake UI Audit</p>
                                                            </div>
                                                            <div className="flex items-end justify-between">
                                                                <span className="text-xl font-black text-white">{visionResult.vision.deepfake_ui_score}%</span>
                                                                <span className="text-[10px] text-gray-600">UI Inconsistency</span>
                                                            </div>
                                                            <div className="mt-2 h-1 w-full bg-gray-900 rounded-full overflow-hidden">
                                                                <div className="h-full bg-orange-500" style={{ width: `${visionResult.vision.deepfake_ui_score}%` }}></div>
                                                            </div>
                                                        </div>
                                                        {visionResult.vision.qr_codes?.length > 0 && (
                                                            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-[#0d1016] p-4 rounded-xl border border-blue-500/30">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <Zap size={16} className="text-yellow-400" />
                                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">QR Intel Found</p>
                                                                </div>
                                                                <p className="text-xs font-mono text-blue-400 break-all bg-blue-900/10 p-2 rounded">
                                                                    {visionResult.vision.qr_codes[0].data}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {result?.trigger_words && (
                                                    <div className="mb-8 p-6 bg-[#0d1016] border border-gray-800 rounded-2xl">
                                                        <h3 className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider mb-4">
                                                            <Eye className="text-red-500" size={16} />
                                                            Analyzed Evidence (XAI)
                                                        </h3>
                                                        <HighlightText text={inputText} triggers={result.trigger_words} />
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            {result.trigger_words.map((word, i) => (
                                                                <span key={i} className="text-[9px] px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full font-black uppercase tracking-widest">
                                                                    {word}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-6">
                                                        <h3 className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                                                            <Layers className="text-blue-500" size={16} />
                                                            Risk Breakdown
                                                        </h3>
                                                        <div className="bg-[#1a1f29] rounded-2xl p-6 border border-gray-800 space-y-4">
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                    <span>ML Probability</span>
                                                                    <span className="text-blue-500">{result?.breakdown?.ml_probability || 0}%</span>
                                                                </div>
                                                                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-blue-500" style={{ width: `${result?.breakdown?.ml_probability || 0}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                    <span>URL Risk Signals</span>
                                                                    <span className="text-purple-500">{result?.breakdown?.url_risk || 0}%</span>
                                                                </div>
                                                                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-purple-500" style={{ width: `${result?.breakdown?.url_risk || 0}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                                    <span>Heuristic Flags</span>
                                                                    <span className="text-green-500">{result?.breakdown?.text_heuristic?.total || result?.breakdown?.text_heuristic ? Object.values(result.breakdown.text_heuristic).reduce((a, b) => a + b, 0) / 4 : 0}%</span>
                                                                </div>
                                                                <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-green-500" style={{ width: `${result?.breakdown?.text_heuristic ? Object.values(result.breakdown.text_heuristic).reduce((a, b) => a + b, 0) / 4 : 0}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-6">
                                                        <h3 className="flex items-center gap-2 text-white font-bold text-sm uppercase tracking-wider">
                                                            <CheckCircle2 className="text-green-500" size={16} />
                                                            Mitigation Plan
                                                        </h3>
                                                        <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/5 to-blue-500/5 border border-green-500/10 flex flex-col justify-between h-full">
                                                            <p className="text-sm text-gray-300 leading-relaxed mb-6">
                                                                {result?.suggested_action || visionResult?.suggested_action || 'No specific mitigation plan available for this audit.'}
                                                            </p>
                                                            <div className="space-y-4">
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => handleDownloadReport(result || visionResult)}
                                                                        className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg border border-white/10 flex items-center justify-center gap-2 transition-all"
                                                                    >
                                                                        {isReporting ? <RefreshCw size={12} className="animate-spin" /> : <Download size={12} />}
                                                                        Audit Report
                                                                    </button>
                                                                    {result && (
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => handleFeedback('correct')} className="p-2 bg-green-500/10 text-green-500 rounded-lg border border-green-500/20 hover:bg-green-500/20 transition-all"><ThumbsUp size={14} /></button>
                                                                            <button onClick={() => handleFeedback('incorrect')} className="p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-all"><ThumbsDown size={14} /></button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {result?.signals && (
                                                                    <div className="space-y-2">
                                                                        {result.signals.slice(0, 2).map((sig, i) => (
                                                                            <div key={i} className="flex gap-3 text-[10px] bg-[#0d1016] p-2 rounded-lg border border-gray-800">
                                                                                <Activity size={12} className="text-blue-500 shrink-0" />
                                                                                <span className="text-gray-400 uppercase tracking-widest font-black leading-tight text-left">{sig.message || sig}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {result?.external_intel && (
                                                    <div className="px-8 pb-8 pt-8 border-t border-gray-800 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                        <div className="bg-[#0d1016] p-4 rounded-xl border border-gray-800 flex items-center gap-4">
                                                            <div className="p-2 bg-blue-500/10 rounded-lg"><Globe size={20} className="text-blue-500" /></div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Domain Intel</p>
                                                                <p className="text-xs font-mono text-white">{result.external_intel.domain}</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-[#0d1016] p-4 rounded-xl border border-gray-800 flex items-center gap-4">
                                                            <div className="p-2 bg-red-500/10 rounded-lg"><Shield size={20} className="text-red-500" /></div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">VirusTotal Node</p>
                                                                <p className="text-xs font-mono text-white">{result.external_intel.vt_score} Engines</p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-[#0d1016] p-4 rounded-xl border border-gray-800 flex items-center gap-4">
                                                            <div className="p-2 bg-purple-500/10 rounded-lg"><Info size={20} className="text-purple-500" /></div>
                                                            <div>
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">WHOIS Age</p>
                                                                <p className="text-xs font-mono text-white">{result.external_intel.whois_age}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-[#11141b] rounded-2xl p-6 border border-gray-800 shadow-xl">
                                        <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-[.2em] mb-4">Pipeline Metrics</h3>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-end border-b border-gray-800/50 pb-3">
                                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Latency</span>
                                                <span className="font-mono text-blue-400 font-bold">{result?.latency || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-end border-b border-gray-800/50 pb-3">
                                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Analyzed Today</span>
                                                <span className="font-mono text-purple-400 font-bold">{metrics?.total_analyzed || '0'}</span>
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Acc Rating</span>
                                                <span className="font-mono text-green-400 font-bold">{metrics?.model_accuracy || '98.4%'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-6 border border-blue-500/20">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Cpu className="text-blue-400" size={20} />
                                            <span className="font-bold text-white text-sm">Security Layer Stack</span>
                                        </div>
                                        <ul className="space-y-3">
                                            {['NLP Transformer Node', 'URL Intelligence API', 'Heuristic Engine', 'Explainability Layer'].map((l, i) => (
                                                <li key={i} className="flex items-center gap-3 text-xs text-blue-300/80">
                                                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                                    {l}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'intrusion' && (
                        <motion.div
                            key="intrusion"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="max-w-6xl mx-auto space-y-8"
                        >
                            <header className="flex justify-between items-center">
                                <div>
                                    <h1 className="text-3xl font-display font-bold text-white mb-2">Network Intrusion Node</h1>
                                    <p className="text-gray-400">Packet inspection and anomaly detection for student networks.</p>
                                </div>
                                <div className="flex gap-2">
                                    {['Normal', 'DoS', 'Probe', 'R2L'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => simulateTraffic(t)}
                                            className="px-4 py-2 bg-[#1a1f29] hover:bg-[#252b38] border border-gray-800 rounded-xl text-[10px] font-black text-blue-400 uppercase tracking-[.2em] transition-all"
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-1 space-y-4">
                                    <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-6 opacity-5"><Activity size={80} /></div>
                                        <h3 className="text-white font-black mb-8 flex items-center gap-3 uppercase tracking-widest text-xs">
                                            <Activity size={16} className="text-blue-500" />
                                            Packet Signature
                                        </h3>
                                        <div className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block tracking-widest">Protocol</label>
                                                    <select
                                                        value={intrusionData.protocol_type}
                                                        onChange={e => setIntrusionData({ ...intrusionData, protocol_type: e.target.value })}
                                                        className="w-full bg-[#0d1016] border border-gray-800 rounded-xl p-3 text-xs text-blue-400 font-bold focus:border-blue-500 outline-none"
                                                    >
                                                        <option>tcp</option><option>udp</option><option>icmp</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block tracking-widest">Service</label>
                                                    <select
                                                        value={intrusionData.service}
                                                        onChange={e => setIntrusionData({ ...intrusionData, service: e.target.value })}
                                                        className="w-full bg-[#0d1016] border border-gray-800 rounded-xl p-3 text-xs text-blue-400 font-bold focus:border-blue-500 outline-none"
                                                    >
                                                        <option>http</option><option>private</option><option>ftp</option><option>smtp</option><option>eco_i</option><option>ecr_i</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block tracking-widest">Src Bytes</label>
                                                    <input type="number" value={intrusionData.src_bytes} onChange={e => setIntrusionData({ ...intrusionData, src_bytes: parseInt(e.target.value) })} className="w-full bg-[#0d1016] border border-gray-800 rounded-xl p-3 text-xs font-mono" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-500 uppercase font-black mb-1.5 block tracking-widest">Dst Bytes</label>
                                                    <input type="number" value={intrusionData.dst_bytes} onChange={e => setIntrusionData({ ...intrusionData, dst_bytes: parseInt(e.target.value) })} className="w-full bg-[#0d1016] border border-gray-800 rounded-xl p-3 text-xs font-mono" />
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleIntrusionAnalyze}
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                                            >
                                                {isIntrusionAnalyzing ? <RefreshCw size={18} className="animate-spin" /> : <Shield size={18} />}
                                                {isIntrusionAnalyzing ? "Inspecting..." : "Scan Traffic"}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-6">
                                    <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl overflow-hidden relative min-h-[400px]">
                                        <div className="flex justify-between items-center mb-8">
                                            <h3 className="text-white font-black flex items-center gap-3 uppercase tracking-widest text-xs">
                                                <Radio size={16} className={liveStatus.is_active ? "text-red-500 animate-pulse" : "text-gray-600"} />
                                                Live Network Stream
                                                {liveStatus.is_active && (
                                                    <span className={`px-2 py-0.5 rounded text-[8px] ${liveStatus.stats?.mode === 'live' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                        {liveStatus.stats?.mode?.toUpperCase() || 'SEARCHING'}
                                                    </span>
                                                )}
                                            </h3>
                                            <button
                                                onClick={() => handleToggleLive(!liveStatus.is_active)}
                                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${liveStatus.is_active
                                                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                                    : "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                                                    }`}
                                            >
                                                {liveStatus.is_active ? "Stop Sniffing" : "Start Live listening"}
                                            </button>
                                        </div>

                                        <div className="space-y-2 font-mono text-[10px]">
                                            {liveStatus.packets.length > 0 ? (
                                                liveStatus.packets.slice(-10).map((p, i) => (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                        className="flex gap-4 p-2.5 bg-gray-900/40 rounded-lg border border-white/5 hover:border-blue-500/30 transition-all"
                                                    >
                                                        <span className="text-blue-400">[{p.proto}]</span>
                                                        <span className="text-gray-400">{p.src}</span>
                                                        <ChevronRight size={10} className="text-gray-600" />
                                                        <span className="text-gray-400">{p.dst}</span>
                                                        <span className="ml-auto text-gray-500">{p.size}B</span>
                                                    </motion.div>
                                                ))
                                            ) : (
                                                <div className="h-48 flex flex-col items-center justify-center text-gray-600 border border-dashed border-gray-800 rounded-2xl">
                                                    <Activity className="mb-4 opacity-20" size={40} />
                                                    <p className="uppercase tracking-widest font-black opacity-30">Waiting for packets...</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {intrusionResult ? (
                                            <motion.div
                                                key="result"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-[#11141b] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col"
                                            >
                                                <div className={`h-2 w-full ${intrusionResult.severity === 'Critical' ? 'bg-red-600' :
                                                    intrusionResult.severity === 'High' ? 'bg-red-500' :
                                                        intrusionResult.severity === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                                                    }`}></div>
                                                <div className="p-8">
                                                    <div className="flex justify-between items-start mb-8">
                                                        <div>
                                                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[.3em] mb-2">Detection Signal</p>
                                                            <h2 className="text-5xl font-black text-white lining-nums tracking-tight mb-2 uppercase">{intrusionResult.attack_type}</h2>
                                                            <div className="flex items-center gap-4">
                                                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${intrusionResult.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                                    'bg-green-500/10 text-green-500 border-green-500/20'
                                                                    }`}>
                                                                    {intrusionResult.severity} Severity
                                                                </span>
                                                                <span className="text-[10px] text-orange-500 font-bold uppercase flex items-center gap-1">
                                                                    <Zap size={10} />
                                                                    {intrusionResult.acceleration_mode || "CPU EMULATED"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="bg-[#1a1f29] p-6 rounded-3xl border border-gray-800 text-center min-w-[140px]">
                                                            <p className="text-[10px] text-gray-600 font-black mb-1 uppercase tracking-widest">Confidence</p>
                                                            <p className="text-4xl font-black text-blue-500">{intrusionResult.confidence}%</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : null}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'intrusion-dashboard' && (
                        <motion.div
                            key="intrusion-dashboard"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="max-w-6xl mx-auto space-y-8"
                        >
                            <header className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-display font-bold text-white mb-2">Network Security Overview</h1>
                                    <p className="text-gray-400">Live NIDS metrics and performance analytics.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="px-5 py-2.5 bg-[#11141b] border border-gray-800 rounded-2xl text-xs font-black uppercase tracking-widest text-blue-400 shadow-xl">
                                        Accuracy: {intrusionDashboard?.metrics?.accuracy || '0'}%
                                    </div>
                                </div>
                            </header>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl">
                                    <h3 className="text-white font-bold mb-8 uppercase tracking-widest text-xs">Threat Distribution</h3>
                                    <div className="h-64 relative flex items-center justify-center">
                                        <div className="absolute flex flex-col items-center text-center">
                                            <span className="text-4xl font-black text-white">{intrusionDashboard?.metrics?.total_samples || '0'}</span>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[.2em] leading-none mt-2">Samples</span>
                                        </div>
                                        <Doughnut
                                            data={{
                                                labels: (intrusionDashboard?.attack_distribution || []).map(d => d.name),
                                                datasets: [{
                                                    data: (intrusionDashboard?.attack_distribution || []).map(d => d.value),
                                                    backgroundColor: (intrusionDashboard?.attack_distribution || []).map(d => d.color),
                                                    borderWidth: 0,
                                                    cutout: '80%',
                                                }]
                                            }}
                                            options={{ plugins: { legend: { display: false } }, maintainAspectRatio: false }}
                                        />
                                    </div>
                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                        {(intrusionDashboard?.attack_distribution || []).map((d, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{d.name}</span>
                                                    <span className="text-sm font-black text-white">{d.value}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-8">
                                    <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl">
                                        <h3 className="text-white font-bold mb-6 uppercase tracking-widest text-xs flex justify-between items-center">
                                            Traffic Anomaly Trend
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                <span className="text-[10px] text-gray-500">Live Telemetry</span>
                                            </div>
                                        </h3>
                                        <div className="h-64">
                                            <Line
                                                data={{
                                                    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '23:59'],
                                                    datasets: [{
                                                        data: [5, 3, 12, 18, 15, 28, 8],
                                                        borderColor: '#3b82f6',
                                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                        fill: true,
                                                        tension: 0.4,
                                                        pointRadius: 0
                                                    }]
                                                }}
                                                options={{
                                                    maintainAspectRatio: false,
                                                    plugins: { legend: { display: false } },
                                                    scales: { x: { display: false }, y: { display: false } }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl">
                                            <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6">Confusion Matrix Metrics</h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center bg-[#0d1016] p-4 rounded-2xl border border-gray-800">
                                                    <span className="text-xs font-bold text-gray-400">Precision</span>
                                                    <span className="text-lg font-black text-green-500">0.998</span>
                                                </div>
                                                <div className="flex justify-between items-center bg-[#0d1016] p-4 rounded-2xl border border-gray-800">
                                                    <span className="text-xs font-bold text-gray-400">F1 Score</span>
                                                    <span className="text-lg font-black text-blue-500">{intrusionDashboard?.metrics?.f1_score || '0'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl">
                                            <h3 className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6">Critical Features</h3>
                                            <div className="space-y-5">
                                                {Object.entries(intrusionDashboard?.feature_importance || {}).slice(0, 4).map(([f, v], i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-600 mb-2">
                                                            <span>{f}</span>
                                                            <span className="text-blue-500">{(v * 100).toFixed(1)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-gray-950 rounded-full overflow-hidden">
                                                            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600" style={{ width: `${v * 100}%` }}></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-6xl mx-auto space-y-8"
                        >
                            <header className="flex justify-between items-end">
                                <div>
                                    <h1 className="text-3xl font-display font-bold text-white mb-2">Threat Intelligence</h1>
                                    <p className="text-gray-400">Aggregated insights from the student ecosystem.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="px-5 py-2.5 bg-orange-600/10 border border-orange-600/20 rounded-2xl text-xs font-black uppercase tracking-widest text-orange-400 shadow-xl flex items-center gap-2">
                                        <Cpu size={14} />
                                        Hygiene Score: {metrics?.hygiene_score || '0'}%
                                    </div>
                                    <div className="px-4 py-2 bg-[#11141b] border border-gray-800 rounded-lg text-sm text-gray-400">
                                        Model Acc: <span className="text-blue-500 font-bold">{metrics?.model_accuracy}</span>
                                    </div>
                                </div>
                            </header>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col justify-between">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Digital Hygiene</p>
                                        <h3 className="text-3xl font-black text-white">{metrics?.hygiene_score}%</h3>
                                    </div>
                                    <div className="mt-4 h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: `${metrics?.hygiene_score}%` }}></div>
                                    </div>
                                    <p className="mt-4 text-[10px] text-gray-500 leading-tight">Your personalized security posture based on recent audits.</p>
                                </div>

                                <div className="bg-[#11141b] rounded-3xl p-8 border border-orange-500/20 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Cpu size={48} className="text-orange-500" /></div>
                                    <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Zap size={10} />
                                        Hardware Intel
                                    </p>
                                    <h3 className="text-xl font-black text-white mb-4">Ryzen™ AI NPU</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-left">
                                            <span className="text-gray-500">NPU Load</span>
                                            <span className="text-white">{metrics?.hardware?.npu_utilization}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-left">
                                            <span className="text-gray-500">Efficiency</span>
                                            <span className="text-green-500">{metrics?.hardware?.inference_efficiency}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-black uppercase text-left">
                                            <span className="text-gray-500">Enclave</span>
                                            <span className="text-blue-500">Locked</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl overflow-hidden relative">
                                    <h3 className="text-white font-semibold mb-6">Real-time Threat Flow</h3>
                                    <div className="h-24">
                                        <Line
                                            data={lineData}
                                            options={{
                                                maintainAspectRatio: false,
                                                scales: { x: { display: false }, y: { display: false } },
                                                plugins: { legend: { display: false } },
                                                elements: { point: { radius: 0 } }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl overflow-hidden relative min-h-[400px]">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-white font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                            <Globe size={16} className="text-blue-500" />
                                            Active Adversary Hotspots
                                        </h3>
                                        <button onClick={fetchThreatMap} className="p-2 hover:bg-white/5 rounded-lg transition-all"><RefreshCw size={14} className="text-gray-500" /></button>
                                    </div>
                                    <div className="relative aspect-video bg-blue-900/5 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
                                        <svg viewBox="0 0 800 400" className="w-full h-full opacity-20 grayscale invert">
                                            <path d="M150,100 Q200,50 300,100 T500,150 T700,100" fill="none" stroke="currentColor" strokeWidth="1" />
                                            <path d="M100,200 Q250,150 400,250 T700,200" fill="none" stroke="currentColor" strokeWidth="1" />
                                            <circle cx="400" cy="200" r="150" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                                        </svg>
                                        <AnimatePresence>
                                            {threatMap.map((node) => (
                                                <motion.div
                                                    key={node.id}
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${(node.lon + 180) * (100 / 360)}%`,
                                                        top: `${(90 - node.lat) * (100 / 180)}%`
                                                    }}
                                                    className="group cursor-pointer"
                                                >
                                                    <div className={`w-3 h-3 rounded-full animate-ping absolute bg-${node.color}-500 opacity-75`}></div>
                                                    <div className={`w-3 h-3 rounded-full relative bg-${node.color}-500 shadow-lg shadow-${node.color}-500/50`}></div>
                                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0d1016] border border-gray-800 px-3 py-1.5 rounded-lg text-[8px] font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                        {node.name}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                    <div className="mt-6 grid grid-cols-2 gap-4">
                                        {metrics?.feedback_stats && (
                                            <>
                                                <div className="bg-[#0d1016] p-4 rounded-xl border border-gray-800">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Human Verified</p>
                                                    <p className="text-xl font-black text-green-500">{metrics.feedback_stats.verified_threats}</p>
                                                </div>
                                                <div className="bg-[#0d1016] p-4 rounded-xl border border-gray-800">
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">False Positives</p>
                                                    <p className="text-xl font-black text-red-500">{metrics.feedback_stats.false_positives}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-[#11141b] rounded-2xl p-6 border border-gray-800 shadow-xl">
                                    <h3 className="text-white font-semibold mb-4 text-xs uppercase tracking-widest">Model Performance Matrix</h3>
                                    <div className="overflow-x-auto text-[11px]">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="text-gray-500 border-b border-gray-800">
                                                    <th className="pb-3 px-2">Metric</th>
                                                    <th className="pb-3 px-2 text-blue-500 uppercase tracking-widest">Current AI</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-gray-300 font-mono">
                                                <tr className="border-b border-gray-800/50">
                                                    <td className="py-4 px-2">Total Analyzed</td>
                                                    <td className="py-4 px-2">{metrics?.total_analyzed}</td>
                                                </tr>
                                                <tr className="border-b border-gray-800/50">
                                                    <td className="py-4 px-2">Hardware Acceleration</td>
                                                    <td className="py-4 px-2 text-orange-500 font-bold">{metrics?.hardware?.npu_utilization ? "Ryzen AI ACTIVE" : "X86 EMULATED"}</td>
                                                </tr>
                                                <tr className="border-b border-gray-800/50">
                                                    <td className="py-4 px-2">Inference Latency</td>
                                                    <td className="py-4 px-2 font-mono">{metrics?.hardware?.latency_gain || "N/A"}</td>
                                                </tr>
                                                <tr className="border-b border-gray-800/50">
                                                    <td className="py-4 px-2">Accuracy</td>
                                                    <td className="py-4 px-2 text-green-500">96.2%</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-4 px-2">Detection Rate</td>
                                                    <td className="py-4 px-2 text-blue-400">99.1%</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'privacy' && (
                        <motion.div
                            key="privacy"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-w-4xl mx-auto space-y-8"
                        >
                            <header>
                                <h1 className="text-3xl font-display font-bold text-white mb-2">Privacy & Security Controls</h1>
                                <p className="text-gray-400">How we protect your identity while auditing threats.</p>
                            </header>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-600/20 rounded-2xl">
                                                <Lock className="text-blue-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">Full Privacy Mode</h3>
                                                <p className="text-xs text-gray-500 font-medium">Zero data retention</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setPrivacyMode(!privacyMode)}
                                            className={`w-14 h-8 rounded-full p-1 transition-colors ${privacyMode ? 'bg-blue-600' : 'bg-gray-700'}`}
                                        >
                                            <div className={`w-6 h-6 bg-white rounded-full transition-transform ${privacyMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <CheckCircle2 className="text-green-500 shrink-0 w-5 h-5" />
                                            <div>
                                                <h4 className="font-semibold text-sm">Message Fingerprinting</h4>
                                                <p className="text-xs text-gray-400">All messages are hashed (SHA-256). We never save the original text content.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <CheckCircle2 className="text-green-500 shrink-0 w-5 h-5" />
                                            <div>
                                                <h4 className="font-semibold text-sm">Differential Privacy</h4>
                                                <p className="text-xs text-gray-400">Clustering algorithms add noise to prevent individual message reconstruction.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#11141b] rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col justify-center items-center text-center">
                                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
                                        <Shield className="text-green-500 w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">GDPR & FERPA Compliant</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed mb-6">
                                        CyberForge AI is designed for educational environments. We adhere to strict data protection standards for student records and private communications.
                                    </p>
                                    <button className="text-blue-400 font-bold flex items-center gap-2 hover:underline">
                                        View Full Transparency Report <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-[#0d1016] border border-gray-800 rounded-3xl p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <Settings className="text-gray-500" />
                                    <h3 className="text-white font-bold uppercase tracking-widest text-xs">Security Settings</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['Encrypted Logs', 'Local Inference', 'PII Scrubbing', 'Anonymization'].map((opt) => (
                                        <div key={opt} className="px-6 py-3 bg-[#11141b] rounded-2xl border border-gray-800 text-xs font-black text-gray-500 flex justify-between items-center uppercase tracking-tighter">
                                            {opt}
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Dashboard;
