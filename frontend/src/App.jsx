import React, { useState, useCallback } from "react";
import axios from "axios";

const colors = ["#f8b400", "#00b894", "#6c5ce7", "#d63031", "#0984e3", "#e84393"];

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [bgColor, setBgColor] = useState(colors[0]);
  const [result, setResult] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [progress, setProgress] = useState(0);

  const resetState = useCallback(() => {
    setResult(null);
    setResultUrl(null);
    setError(null);
    setProgress(0);
  }, []);

  const onFileChange = (e) => {
    resetState();
    const f = e.target.files[0];
    if (!f) return;
    
    if (!f.type.match("image.*")) {
      setError("Please select an image file (JPEG, PNG, etc.)");
      return;
    }
    
    if (f.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB");
      return;
    }
    
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUrlSubmit = async () => {
    resetState();
    if (!imageUrl) {
      setError("Please enter an image URL");
      return;
    }

    try {
      new URL(imageUrl); // Validate URL format
    } catch (e) {
      setError("Please enter a valid URL");
      return;
    }

    setLoading(true);
    try {
      // Quick check if URL points to an image
      const response = await axios.head(imageUrl, { timeout: 5000 });
      if (!response.headers["content-type"]?.startsWith("image/")) {
        throw new Error("URL does not point to a valid image");
      }
      setPreview(imageUrl);
      setFile(null);
    } catch (err) {
      setError(err.message || "Failed to load image from URL");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!preview) {
      setError("Please select an image or provide a URL");
      return;
    }
    
    resetState();
    setLoading(true);
    
    const formData = new FormData();
    if (file) {
      formData.append("photo", file);
    } else {
      formData.append("photo_url", imageUrl);
    }
    formData.append("color", bgColor);

    try {
      const res = await axios.post("https://backgroundremover-5.onrender.com/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });
      
      setResult(res.data.base64);
      setResultUrl(res.data.url);
    } catch (err) {
      setError(err.response?.data?.error || "Image processing failed");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="app-container">
      <h2>Profile Photo Styler</h2>

      {/* Tab selector */}
      <div className="tab-selector">
        <button
          onClick={() => setActiveTab("upload")}
          className={activeTab === "upload" ? "active" : ""}
        >
          Upload Image
        </button>
        <button
          onClick={() => setActiveTab("url")}
          className={activeTab === "url" ? "active" : ""}
        >
          Paste URL
        </button>
      </div>

      {/* Image upload or URL input */}
      {activeTab === "upload" ? (
        <div className="upload-section">
          <label htmlFor="fileInput" className={`upload-area ${error ? "error" : ""}`}>
            {preview ? (
              <img src={preview} alt="Preview" className="preview-image" />
            ) : (
              <div className="upload-prompt">
                <UploadIcon />
                <span>Upload Photo</span>
              </div>
            )}
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={onFileChange}
              disabled={loading}
            />
          </label>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <div className="url-section">
          <div className="url-input-container">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste image URL here"
              disabled={loading}
            />
            <button
              onClick={handleUrlSubmit}
              disabled={!imageUrl || loading}
            >
              {loading ? "Loading..." : "Use URL"}
            </button>
          </div>
          {preview && (
            <div className="url-preview">
              <img src={preview} alt="URL Preview" />
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {/* Background color options */}
      <div className="color-picker">
        <h3>Choose Background Color</h3>
        <div className="color-options">
          {colors.map((color) => (
            <label key={color} title={`Set background color ${color}`}>
              <input
                type="radio"
                name="bg"
                value={color}
                checked={bgColor === color}
                onChange={() => setBgColor(color)}
                disabled={loading}
              />
              <div className="color-circle" style={{ backgroundColor: color }} />
            </label>
          ))}
        </div>
      </div>

      {/* Upload button with progress */}
      <div className="upload-button-container">
        <button
          onClick={handleUpload}
          disabled={!preview || loading}
          className="upload-button"
        >
          {loading ? `Processing... ${progress}%` : "Style My Photo"}
        </button>
        {loading && (
          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Results section */}
      {result && (
        <div className="results-section">
          <h3>Your Styled Photo</h3>
          <div className="results-container">
            <div className="image-result">
              <img src={result} alt="Processed" />
            </div>
            <div className="url-result">
              <h4>Permanent URL:</h4>
              <div className="url-display">{resultUrl}</div>
              <div className="action-buttons">
                <a
                  href={result}
                  download="styled-profile-photo.png"
                  className="download-button"
                >
                  Download Photo
                </a>
                {resultUrl && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resultUrl);
                      alert("URL copied to clipboard!");
                    }}
                    className="copy-button"
                  >
                    Copy URL
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style jsx>{`
        .app-container {
          max-width: 90%;
          width: 100%;
          margin: 2rem auto;
          padding: 1.5rem;
          text-align: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          background-color: #ffffff;
        }
        
        h2 {
          margin-bottom: 1.5rem;
          color: #2d3436;
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: 600;
        }
        
        .tab-selector {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid #dfe6e9;
          padding-bottom: 0.5rem;
        }
        
        .tab-selector button {
          padding: 0.5rem 1.5rem;
          background-color: transparent;
          color: #636e72;
          border: none;
          border-radius: 6px 6px 0 0;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .tab-selector button.active {
          background-color: #6c5ce7;
          color: white;
        }
        
        .upload-area {
          display: inline-block;
          width: clamp(120px, 30vw, 180px);
          height: clamp(120px, 30vw, 180px);
          border-radius: 50%;
          border: 2px dashed #dfe6e9;
          cursor: pointer;
          overflow: hidden;
          position: relative;
          background-color: #f8f9fa;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }
        
        .upload-area.error {
          border-color: #ff7675;
        }
        
        .upload-area:hover {
          border-color: #74b9ff;
          transform: scale(1.02);
        }
        
        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: grayscale(50%);
          opacity: 0.8;
        }
        
        .upload-prompt {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #b2bec3;
          font-size: clamp(0.9rem, 3vw, 1.1rem);
          user-select: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        
        .error-message {
          color: #ff7675;
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }
        
        .url-input-container {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .url-input-container input {
          padding: 0.8rem 1rem;
          border-radius: 8px;
          border: 1px solid #dfe6e9;
          width: clamp(200px, 70vw, 400px);
          font-size: 0.9rem;
          transition: all 0.2s ease;
          outline: none;
        }
        
        .url-input-container input:focus {
          border-color: #74b9ff;
          box-shadow: 0 0 0 2px rgba(116, 185, 255, 0.2);
        }
        
        .url-preview {
          width: clamp(120px, 30vw, 180px);
          height: clamp(120px, 30vw, 180px);
          border-radius: 50%;
          margin: 0 auto;
          overflow: hidden;
          border: 2px solid #dfe6e9;
        }
        
        .url-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .color-picker {
          margin-bottom: 2rem;
        }
        
        .color-picker h3 {
          margin-bottom: 1rem;
          color: #636e72;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .color-options {
          display: flex;
          justify-content: center;
          gap: 0.8rem;
          flex-wrap: wrap;
          max-width: 400px;
          margin: 0 auto;
        }
        
        .color-circle {
          width: clamp(36px, 8vw, 48px);
          height: clamp(36px, 8vw, 48px);
          border-radius: 50%;
          border: 2px solid #dfe6e9;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        input[type="radio"]:checked + .color-circle {
          border: 3px solid #2d3436;
          box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #74b9ff;
          transform: scale(1.1);
        }
        
        .upload-button-container {
          margin-bottom: 1rem;
          width: 100%;
        }
        
        .upload-button {
          padding: 0.8rem 2rem;
          font-size: 1rem;
          background-color: #6c5ce7;
          color: #ffffff;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(108, 92, 231, 0.3);
          transition: all 0.3s ease;
          font-weight: 500;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
          min-width: 150px;
        }
        
        .upload-button:hover:not(:disabled) {
          background-color: #5941e0;
          transform: translateY(-2px);
        }
        
        .upload-button:disabled {
          background-color: #b2bec3;
          box-shadow: none;
          cursor: not-allowed;
          opacity: 0.7;
        }
        
        .progress-bar {
          width: 100%;
          height: 4px;
          background-color: #dfe6e9;
          margin-top: 0.5rem;
          border-radius: 2px;
        }
        
        .progress-bar div {
          height: 100%;
          background-color: #6c5ce7;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        
        .results-section {
          margin-top: 2.5rem;
          padding-top: 2rem;
          border-top: 1px solid #f1f1f1;
        }
        
        .results-container {
          display: flex;
          justify-content: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        
        .image-result {
          padding: 0.5rem;
          border-radius: 16px;
          background-color: #ffffff;
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
          border: 1px solid #f1f1f1;
        }
        
        .image-result img {
          width: clamp(160px, 40vw, 220px);
          height: clamp(160px, 40vw, 220px);
          border-radius: 12px;
          object-fit: cover;
          transition: all 0.3s ease;
        }
        
        .image-result img:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        
        .url-result {
          max-width: 400px;
          text-align: left;
        }
        
        .url-display {
          background-color: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          word-break: break-all;
        }
        
        .action-buttons {
          margin-top: 1.5rem;
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        
        .download-button, .copy-button {
          padding: 0.6rem 1.5rem;
          color: white;
          border-radius: 6px;
          font-weight: 500;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        
        .download-button {
          background-color: #00b894;
        }
        
        .download-button:hover {
          background-color: #00a884;
          transform: translateY(-1px);
        }
        
        .copy-button {
          background-color: #0984e3;
        }
        
        .copy-button:hover {
          background-color: #0878d1;
          transform: translateY(-1px);
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        body {
          background-color: #f8f9fa;
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
        }
      `}</style>
    </div>
  );
}

// Simple upload icon component
function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  );
}

export default App;