import React, { useState } from 'react';

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);

  const generateReport = (type) => {
    setGenerating(true);
    setDownloadLink(null);
    setTimeout(() => {
      setGenerating(false);
      setDownloadLink(`Report-SmartOffice-${type.toUpperCase()}-${new Date().toISOString().split('T')[0]}.${type}`);
    }, 1500);
  };

  return (
    <div className="sub-page">
      <div className="page-header">
        <h2>Report Center</h2>
        <p>Export power summaries, audit logs, and anomaly warnings for auditing and offline inspection.</p>
      </div>

      <div className="report-options-grid">
        <div className="report-card">
          <h4>Office Power Summary</h4>
          <p>Generates a breakdown of hourly power loads, peak indicators, and baseline comparisons.</p>
          <button className="btn-primary" onClick={() => generateReport('csv')} disabled={generating}>
            Export to CSV
          </button>
        </div>

        <div className="report-card">
          <h4>Alert & Anomaly Log</h4>
          <p>Export a log of all device violations, response timings, and resolution states.</p>
          <button className="btn-primary" onClick={() => generateReport('pdf')} disabled={generating}>
            Export to PDF
          </button>
        </div>
      </div>

      {generating && (
        <div className="report-generation-status">
          <span className="spinner"></span> Generating report...
        </div>
      )}

      {downloadLink && (
        <div className="report-download-success">
          <p>✓ Report successfully generated!</p>
          <a href="#" className="download-anchor" onClick={(e) => { e.preventDefault(); alert('Report download started!'); }}>
            Download {downloadLink}
          </a>
        </div>
      )}
    </div>
  );
}
