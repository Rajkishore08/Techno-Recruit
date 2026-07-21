import React, { useRef, useState } from 'react';
import { UploadCloud, FileCheck } from 'lucide-react';

export default function Dropzone({ onFileSelected, selectedFile, accept = ".pdf,.docx,.txt" }) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  return (
    <div 
      className={`dropzone ${isDragOver ? 'dragover' : ''}`} 
      onClick={() => fileInputRef.current && fileInputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        accept={accept} 
        style={{ display: 'none' }} 
        onChange={handleFileChange} 
      />
      <div className="dropzone-content">
        {!selectedFile ? (
          <>
            <UploadCloud className="dropzone-icon" size={32} />
            <p className="dropzone-title" style={{ fontSize: '14px', fontWeight: 600 }}>Drop candidate resume here or click to browse</p>
            <p className="dropzone-subtitle" style={{ fontSize: '12px' }}>Supports PDF, DOCX, TXT (Max 5MB)</p>
          </>
        ) : (
          <>
            <FileCheck className="dropzone-icon" size={32} style={{ color: 'var(--color-success)' }} />
            <p className="dropzone-title" style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{selectedFile.name}</p>
            <p className="dropzone-subtitle" style={{ fontSize: '12px', color: 'var(--color-success)' }}>Resume file ready for AI evaluation</p>
          </>
        )}
      </div>
    </div>
  );
}
