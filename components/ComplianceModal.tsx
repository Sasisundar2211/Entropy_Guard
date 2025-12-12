import React from 'react';
import { ShieldCheck, Download, RefreshCw, AlertTriangle, FileText } from 'lucide-react';
import { LogEntry } from '../types';
import { jsPDF } from "jspdf";

interface Props {
  logs: LogEntry[];
  duration: string;
  onReset: () => void;
}

export const ComplianceModal: React.FC<Props> = ({ logs, duration, onReset }) => {
  const errors = logs.filter(l => l.type === 'ERROR').length;
  const complianceScore = Math.max(0, 100 - (errors * 15));

  const handleDownload = () => {
    const sessionId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const date = new Date().toLocaleString();
    
    // Initialize PDF
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    // --- DESIGN ---
    
    // Header Background
    doc.setFillColor(17, 25, 40); // Dark Blue-Black
    doc.rect(0, 0, 210, 50, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("CERTIFICATE OF COMPLIANCE", 105, 25, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(168, 199, 250); // Accent Color
    doc.text("ENTROPYGUARD ASSURANCE PROTOCOL V2.0", 105, 35, { align: "center" });

    // Certificate Body
    doc.setTextColor(60, 60, 60);
    
    // Session Info Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(20, 60, 170, 40, 3, 3, 'FD');

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SESSION IDENTIFIER:", 30, 75);
    doc.text("TIMESTAMP:", 30, 85);
    doc.text("DURATION:", 110, 85);

    doc.setFont("helvetica", "normal");
    doc.text(sessionId, 80, 75);
    doc.text(date, 80, 85);
    doc.text(duration, 140, 85);

    // Score Section
    const scoreColor = complianceScore > 80 ? [46, 125, 50] : [198, 40, 40]; // Green or Red
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.setFontSize(40);
    doc.setFont("helvetica", "bold");
    doc.text(`${complianceScore}%`, 105, 125, { align: "center" });
    
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("COMPLIANCE SCORE", 105, 135, { align: "center" });

    // Critical Errors Section
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 150, 190, 150);

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CRITICAL EVENTS LOG", 20, 165);

    let yPos = 175;
    const errorLogs = logs.filter(l => l.type === 'ERROR' || l.type === 'WARNING');
    
    if (errorLogs.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        doc.setTextColor(46, 125, 50);
        doc.text("No critical deviations detected. Procedure executed perfectly.", 20, yPos);
    } else {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        errorLogs.slice(0, 15).forEach(log => {
            const prefix = log.type === 'ERROR' ? "[CRITICAL]" : "[WARNING]";
            doc.setTextColor(log.type === 'ERROR' ? 198 : 200, log.type === 'ERROR' ? 40 : 150, 40);
            doc.text(`${log.timestamp}  ${prefix}  ${log.message.substring(0, 70)}`, 20, yPos);
            yPos += 7;
        });
        if (errorLogs.length > 15) {
            doc.setTextColor(100, 100, 100);
            doc.text(`... and ${errorLogs.length - 15} more events.`, 20, yPos + 5);
        }
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated automatically by EntropyGuard AI. This document serves as a digital record of procedural adherence.", 105, 280, { align: "center" });

    doc.save(`Compliance_Cert_${sessionId}.pdf`);
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-[#111318]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in zoom-in-95">
      <div className="w-full max-w-lg bg-[#1E2229] border border-[#444746] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#6DD58C] via-[#A8C7FA] to-[#6DD58C]" />

        <div className="flex flex-col items-center text-center mb-8">
            <div className="w-20 h-20 bg-[#003817] rounded-full flex items-center justify-center mb-4 border-4 border-[#1E2229] shadow-lg">
                <ShieldCheck size={40} className="text-[#6DD58C]" />
            </div>
            <h2 className="text-3xl font-bold text-[#E3E3E3] font-[Google Sans]">Session Summary</h2>
            <p className="text-[#C4C7C5] mt-2">Compliance Certificate Ready</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-[#111318] p-4 rounded-2xl border border-[#2B2F36]">
                <p className="text-xs text-[#8E918F] uppercase">Duration</p>
                <p className="text-xl font-mono text-[#E3E3E3]">{duration}</p>
            </div>
            <div className="bg-[#111318] p-4 rounded-2xl border border-[#2B2F36]">
                <p className="text-xs text-[#8E918F] uppercase">Critical Errors</p>
                <p className={`text-xl font-mono ${errors > 0 ? 'text-[#FFB4AB]' : 'text-[#6DD58C]'}`}>{errors}</p>
            </div>
            <div className="col-span-2 bg-[#111318] p-4 rounded-2xl border border-[#2B2F36] flex items-center justify-between">
                <div>
                    <p className="text-xs text-[#8E918F] uppercase">Compliance Score</p>
                    <p className={`text-2xl font-bold ${complianceScore > 80 ? 'text-[#6DD58C]' : 'text-[#FFB4AB]'}`}>{complianceScore}%</p>
                </div>
                {complianceScore < 100 && <AlertTriangle className="text-[#FFB4AB]" />}
            </div>
        </div>

        <div className="flex gap-4">
            <button onClick={onReset} className="flex-1 py-3 bg-[#2B2F36] hover:bg-[#3F444D] text-[#E3E3E3] rounded-full font-bold transition-colors flex items-center justify-center gap-2">
                <RefreshCw size={18} /> New Task
            </button>
            <button onClick={handleDownload} className="flex-1 py-3 bg-[#A8C7FA] hover:bg-[#D3E3FD] text-[#062E6F] rounded-full font-bold transition-colors flex items-center justify-center gap-2 shadow-lg">
                <FileText size={18} /> Export PDF
            </button>
        </div>

      </div>
    </div>
  );
};