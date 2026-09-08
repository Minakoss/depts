import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function ReceiptsPage({ session }) {
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const qrScannerRef = useRef(null);

  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [qrScanning, setQrScanning] = useState(false);
  const [qrResult, setQrResult] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleFile = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Παρακαλώ επιλέξτε μια εικόνα.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const url = URL.createObjectURL(file);

    setPreview(url);
    setFileName(file.name);
    setMessage("");
  };

  const handleCameraChange = (event) => {
    const file = event.target.files?.[0];
    handleFile(file);

    event.target.value = "";
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    handleFile(file);

    event.target.value = "";
  };

  const removePreview = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
    setFileName("");
    setMessage("");
  };

  const stopQRScanner = async () => {
    if (!qrScannerRef.current) {
      setQrScanning(false);
      return;
    }

    try {
      const state = qrScannerRef.current.getState();

      if (state === 2 || state === 3) {
        await qrScannerRef.current.stop();
      }

      await qrScannerRef.current.clear();
    } catch (error) {
      console.error("QR scanner stop error:", error);
    }

    qrScannerRef.current = null;
    setQrScanning(false);
  };

  const startQRScanner = async () => {
    setMessage("");
    setQrResult("");

    try {
      const scanner = new Html5Qrcode("receipt-qr-reader");

      qrScannerRef.current = scanner;
      setQrScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: {
            width: 250,
            height: 250,
          },
          aspectRatio: 1,
        },
        async (decodedText) => {
          setQrResult(decodedText);
          setMessage("Ο QR κωδικός αναγνωρίστηκε επιτυχώς.");

          await stopQRScanner();
        },
        () => {
          // Αγνοούμε τα συνεχόμενα αποτυχημένα scans.
        },
      );
    } catch (error) {
      console.error("QR scanner error:", error);

      qrScannerRef.current = null;
      setQrScanning(false);

      setMessage(
        "Δεν ήταν δυνατή η πρόσβαση στην κάμερα. Ελέγξτε ότι έχετε δώσει άδεια χρήσης κάμερας.",
      );
    }
  };

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            qrScannerRef.current?.clear().catch(() => {});
          });
      }

      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const processReceipt = async () => {
    if (!preview) {
      setMessage("Πρώτα φωτογραφίστε ή επιλέξτε μια απόδειξη.");
      return;
    }

    setProcessing(true);
    setMessage("");

    /*
     * Το OCR θα συνδεθεί εδώ στο επόμενο βήμα.
     * Προς το παρόν επιβεβαιώνουμε ότι η εικόνα
     * είναι έτοιμη για επεξεργασία.
     */

    await new Promise((resolve) => setTimeout(resolve, 700));

    setProcessing(false);

    setMessage(
      "Η απόδειξη είναι έτοιμη για αναγνώριση. Στο επόμενο βήμα θα γίνει αυτόματη αναγνώριση ποσού, ημερομηνίας και καταστήματος.",
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Αποδείξεις</h1>
          <p>Σάρωση και καταχώρηση αποδείξεων</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h2>Νέα απόδειξη</h2>
            <p>Φωτογραφίστε την απόδειξη ή σαρώστε τον QR κωδικό της.</p>
          </div>
        </div>

        <div className="receipt-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => cameraInputRef.current?.click()}
          >
            📷 Φωτογράφιση
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => fileInputRef.current?.click()}
          >
            🖼️ Επιλογή εικόνας
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={startQRScanner}
            disabled={qrScanning}
          >
            ▣ Σάρωση QR
          </button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraChange}
          style={{ display: "none" }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {qrScanning && (
          <div className="receipt-qr-scanner">
            <div className="receipt-qr-header">
              <strong>Σάρωση QR κωδικού</strong>

              <button
                type="button"
                className="secondary-button"
                onClick={stopQRScanner}
              >
                Κλείσιμο
              </button>
            </div>

            <div id="receipt-qr-reader" className="receipt-qr-reader" />

            <p className="receipt-qr-help">
              Τοποθετήστε τον QR κωδικό μέσα στο πλαίσιο.
            </p>
          </div>
        )}

        {qrResult && (
          <div className="receipt-qr-result">
            <strong>QR κωδικός</strong>

            <div className="receipt-qr-value">{qrResult}</div>
          </div>
        )}

        {preview && (
          <div className="receipt-preview">
            <div className="receipt-preview-header">
              <div>
                <strong>Προεπισκόπηση</strong>

                <div className="receipt-file-name">{fileName}</div>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={removePreview}
              >
                Αφαίρεση
              </button>
            </div>

            <div className="receipt-image-wrapper">
              <img
                src={preview}
                alt="Προεπισκόπηση απόδειξης"
                className="receipt-image"
              />
            </div>

            <div className="receipt-process">
              <button
                type="button"
                className="primary-button"
                onClick={processReceipt}
                disabled={processing}
              >
                {processing ? "Επεξεργασία..." : "🔍 Αναγνώριση απόδειξης"}
              </button>
            </div>
          </div>
        )}

        {message && <div className="receipt-message">{message}</div>}
      </div>
    </div>
  );
}
