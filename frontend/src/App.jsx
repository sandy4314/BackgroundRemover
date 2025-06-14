import React, { useState } from "react";
import axios from "axios";

const colors = ["#f8b400", "#00b894", "#6c5ce7", "#d63031", "#0984e3", "#e84393"];

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [bgColor, setBgColor] = useState(colors[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    
    // Validate file type
    if (!f.type.match("image.*")) {
      setError("Please select an image file (JPEG, PNG, etc.)");
      return;
    }
    
    // Validate file size (5MB max)
    if (f.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB");
      return;
    }
    
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an image");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append("photo", file);
    formData.append("color", bgColor);

    try {
      const res = await axios.post("http://localhost:5000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      setResult(res.data.final);
    } catch (err) {
      setError(err.response?.data?.message || "Image processing failed. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "90%",
        width: "100%",
        margin: "2rem auto",
        padding: "1.5rem",
        textAlign: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff"
      }}
    >
      <h2 style={{ 
        marginBottom: "1.5rem",
        color: "#2d3436",
        fontSize: "clamp(1.5rem, 4vw, 2rem)",
        fontWeight: 600
      }}>
        Profile Photo Styler
      </h2>

      {/* Image upload circle */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label
          htmlFor="fileInput"
          style={{
            display: "inline-block",
            width: "clamp(120px, 30vw, 180px)",
            height: "clamp(120px, 30vw, 180px)",
            borderRadius: "50%",
            border: `2px dashed ${error ? "#ff7675" : "#dfe6e9"}`,
            cursor: "pointer",
            overflow: "hidden",
            position: "relative",
            backgroundColor: "#f8f9fa",
            boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            transition: "all 0.3s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = error ? "#ff7675" : "#74b9ff";
            e.currentTarget.style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = error ? "#ff7675" : "#dfe6e9";
            e.currentTarget.style.transform = "scale(1)";
          }}
          title="Click to select image"
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              style={{ 
                width: "100%", 
                height: "100%", 
                objectFit: "cover",
                filter: loading ? "grayscale(50%)" : "none",
                opacity: loading ? 0.8 : 1
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: error ? "#ff7675" : "#b2bec3",
                fontSize: "clamp(0.9rem, 3vw, 1.1rem)",
                userSelect: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              Upload Photo
            </div>
          )}
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ display: "none" }}
            disabled={loading}
          />
        </label>
        {error && (
          <p style={{ 
            color: "#ff7675", 
            fontSize: "0.9rem",
            marginTop: "0.5rem"
          }}>
            {error}
          </p>
        )}
      </div>

      {/* Background color options */}
      <div style={{ marginBottom: "2rem" }}>
        <h3 style={{ 
          marginBottom: "1rem",
          color: "#636e72",
          fontSize: "1.1rem",
          fontWeight: 500
        }}>
          Choose Background Color
        </h3>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.8rem",
            flexWrap: "wrap",
            maxWidth: "400px",
            margin: "0 auto"
          }}
        >
          {colors.map((color) => (
            <label
              key={color}
              style={{
                cursor: "pointer",
                display: "inline-block"
              }}
              title={`Set background color ${color}`}
            >
              <input
                type="radio"
                name="bg"
                value={color}
                checked={bgColor === color}
                onChange={() => setBgColor(color)}
                style={{ display: "none" }}
                disabled={loading}
              />
              <div
                style={{
                  width: "clamp(36px, 8vw, 48px)",
                  height: "clamp(36px, 8vw, 48px)",
                  borderRadius: "50%",
                  backgroundColor: color,
                  border: bgColor === color ? "3px solid #2d3436" : "2px solid #dfe6e9",
                  boxShadow: bgColor === color ? "0 0 0 2px #ffffff, 0 0 0 4px #74b9ff" : "none",
                  transition: "all 0.2s ease",
                  transform: bgColor === color ? "scale(1.1)" : "scale(1)"
                }}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!file || loading}
        style={{
          padding: "0.8rem 2rem",
          fontSize: "1rem",
          backgroundColor: loading ? "#b2bec3" : "#6c5ce7",
          color: "#ffffff",
          border: "none",
          borderRadius: "50px",
          cursor: file && !loading ? "pointer" : "not-allowed",
          boxShadow: file && !loading ? "0 4px 14px rgba(108, 92, 231, 0.3)" : "none",
          transition: "all 0.3s ease",
          fontWeight: 500,
          letterSpacing: "0.5px",
          position: "relative",
          overflow: "hidden",
          minWidth: "150px"
        }}
        onMouseEnter={(e) => {
          if (!loading && file) {
            e.currentTarget.style.backgroundColor = "#5941e0";
            e.currentTarget.style.transform = "translateY(-2px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!loading && file) {
            e.currentTarget.style.backgroundColor = "#6c5ce7";
            e.currentTarget.style.transform = "translateY(0)";
          }
        }}
      >
        {loading ? (
          <>
            <span style={{ position: "relative", zIndex: 1 }}>Processing...</span>
            <span style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
              animation: "shimmer 1.5s infinite",
              zIndex: 0
            }}></span>
          </>
        ) : "Style My Photo"}
      </button>

      {/* Processed image result */}
      {result && (
        <div style={{ 
          marginTop: "2.5rem",
          paddingTop: "2rem",
          borderTop: "1px solid #f1f1f1"
        }}>
          <h3 style={{
            marginBottom: "1rem",
            color: "#2d3436",
            fontSize: "1.2rem"
          }}>
            Your Styled Photo
          </h3>
          <div style={{
            display: "inline-block",
            padding: "0.5rem",
            borderRadius: "16px",
            backgroundColor: "#ffffff",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            border: "1px solid #f1f1f1"
          }}>
            <img
              src={result}
              alt="Processed"
              style={{
                width: "clamp(160px, 40vw, 220px)",
                height: "clamp(160px, 40vw, 220px)",
                borderRadius: "12px",
                objectFit: "cover",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>
          <div style={{ marginTop: "1.5rem" }}>
            <a
              href={result}
              download="styled-profile-photo.png"
              style={{
                display: "inline-block",
                padding: "0.6rem 1.5rem",
                backgroundColor: "#00b894",
                color: "white",
                borderRadius: "6px",
                textDecoration: "none",
                fontWeight: 500,
                transition: "all 0.2s ease",
                fontSize: "0.9rem"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#00a884";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#00b894";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Download Photo
            </a>
          </div>
        </div>
      )}

      {/* Global styles */}
      <style>{`
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
        button:disabled {
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}

export default App;