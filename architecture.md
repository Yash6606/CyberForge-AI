# CyberForge AI System Architecture

```mermaid
graph TD
    User([Student/User])
    Admin([Cyber Analyst])

    subgraph Frontend [Premium Intelligence Dashboard]
        UI[React + Tailwind UI]
        ScriptUI[Malicious Script Audit View]
        HardwareUI[AMD Hardware Intelligence Core]
        AnalyticUI[NIDS Dashboard & Threat Map]
    end

    subgraph Backend [FastAPI Backend Engine]
        API[FastAPI Routes /analyze, /script/analyze, /intrusion/analyze, /live/status]
        
        subgraph SecurityLayers [AI Intelligence Stack]
            Layer1 [Layer 1: Hybrid NLP Classifier]
            Layer2 [Layer 2: Vision & Forgery Engine]
            Layer3 [Layer 3: Malicious Script Auditor]
            Layer4 [Layer 4: NIDS Traffic Monitor]
        end
        
        subgraph HardwareAcceleration [AMD Hardware Acceleration Core]
            NPU[Ryzen™ AI NPU Engine]
            ROCm[ROCm GPU Acceleration]
            ASP[AMD Secure Processor]
        end
        
        subgraph DataExplanations [Explainable AI & Feedback]
            XAI[SHAP/LIME Feature Highlights]
            Feedback[Feedback Learning Loop]
        end
    end

    User --> UI
    Admin --> UI
    UI --> API
    
    API --> SecurityLayers
    SecurityLayers <--> HardwareAcceleration
    SecurityLayers --> XAI
    XAI --> UI
    
    API --> HardwareAcceleration
    HardwareAcceleration --> HardwareUI
```

## Core Architectural Components

- **Frontend**: A high-performance React application utilizing Framer Motion for smooth transitions and Chart.js for real-time telemetry visualization.
- **Backend**: FastAPI-powered engine for low-latency asynchronous processing of multi-vector threats.
- **Hardware Acceleration**: Deeply integrated with AMD hardware features:
    - **Ryzen™ AI NPU**: Offloads text and script analysis for sub-10ms inference.
    - **ROCm**: Parallelizes network intrusion checks and vision audits.
    - **AMD Secure Processor (ASP)**: Ensures the integrity of the detection engine via a hardware-verified boot chain.
