import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "./lib/supabaseClient";

const RECEIPT_CATEGORIES = [
  "Supermarket",
  "Εστιατόριο",
  "Καφέ",
  "Καύσιμα",
  "Υγεία",
  "Φαρμακείο",
  "Ένδυση",
  "Σπίτι",
  "Μεταφορές",
  "Διασκέδαση",
  "Λογαριασμοί",
  "Άλλο",
];

function getTodayDateString() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeAmount(value) {
  if (value === null || value === undefined) {
    return NaN;
  }

  let text = String(value).trim();

  if (!text) {
    return NaN;
  }

  text = text.replace(/\s/g, "");

  /*
   * Ελληνική μορφή:
   * 12,50
   * 1.234,50
   */

  if (text.includes(",") && text.includes(".")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  return Number(text);
}

export default function ReceiptsPage({ session }) {
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const qrScannerRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");

  const [merchant, setMerchant] = useState("");
  const [receiptDate, setReceiptDate] = useState(getTodayDateString());
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  const [message, setMessage] = useState("");

  const [qrScanning, setQrScanning] = useState(false);
  const [qrResult, setQrResult] = useState("");

  const [processing, setProcessing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [receiptsLoading, setReceiptsLoading] = useState(true);

  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState("");
  const [viewingReceiptLoading, setViewingReceiptLoading] = useState(false);
  const analyzeReceiptWithAI = async () => {
    if (!selectedFile) {
      setMessage("Επίλεξε πρώτα μία φωτογραφία απόδειξης.");
      return;
    }

    try {
      setProcessing(true);
      setMessage("");

      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const base64Image = reader.result;

          const { data, error } = await supabase.functions.invoke(
            "analyze-receipt",
            {
              body: {
                image: base64Image,
              },
            },
          );

          if (error) {
            console.error("Analyze receipt error:", error);
            setMessage("Σφάλμα κατά την ανάλυση της απόδειξης.");
            return;
          }

          console.log("OCR RESULT:", data);

          if (!data?.success) {
            setMessage(
              data?.error || "Δεν ήταν δυνατή η ανάλυση της απόδειξης.",
            );
            return;
          }

          const receipt = data.receipt;

          setMerchant(receipt?.merchant || "");
          setReceiptDate(receipt?.date || getTodayDateString());

          setAmount(
            receipt?.amount !== null && receipt?.amount !== undefined
              ? String(receipt.amount).replace(".", ",")
              : "",
          );

          setCategory(receipt?.category || "");

          setMessage(
            "✓ Η απόδειξη αναλύθηκε επιτυχώς. Ελέγξτε τα στοιχεία πριν την αποθήκευση.",
          );
        } catch (error) {
          console.error("OCR processing error:", error);
          setMessage("Παρουσιάστηκε σφάλμα κατά την ανάλυση.");
        } finally {
          setProcessing(false);
        }
      };

      reader.onerror = () => {
        setProcessing(false);
        setMessage("Δεν ήταν δυνατή η ανάγνωση της εικόνας.");
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("OCR error:", error);
      setProcessing(false);
      setMessage("Παρουσιάστηκε σφάλμα.");
    }
  };
  /* =======================================================
   ΙΣΤΟΡΙΚΟ ΑΠΟΔΕΙΞΕΩΝ
======================================================= */

  const loadReceipts = async () => {
    if (!session?.user?.id) {
      return;
    }

    setReceiptsLoading(true);

    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("receipt_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Receipts:", error);
      setMessage(`Δεν ήταν δυνατή η φόρτωση των αποδείξεων: ${error.message}`);
      setReceipts([]);
    } else {
      setReceipts(data || []);
    }

    setReceiptsLoading(false);
  };

  useEffect(() => {
    loadReceipts();
  }, [session?.user?.id]);
  /* =======================================================
   ΠΡΟΒΟΛΗ ΑΠΟΔΕΙΞΗΣ
======================================================= */

  const handleViewReceipt = async (receipt) => {
    if (!receipt?.file_path) {
      setMessage("Δεν υπάρχει αποθηκευμένη εικόνα για αυτή την απόδειξη.");
      return;
    }

    setViewingReceipt(receipt);
    setViewingReceiptUrl("");
    setViewingReceiptLoading(true);

    const { data, error } = await supabase.storage
      .from("receipts")
      .createSignedUrl(receipt.file_path, 60 * 10);

    if (error) {
      console.error("Receipt image:", error);

      setViewingReceiptLoading(false);

      setMessage(`Δεν ήταν δυνατή η προβολή της απόδειξης: ${error.message}`);

      return;
    }

    setViewingReceiptUrl(data?.signedUrl || "");
    setViewingReceiptLoading(false);
  };

  const closeReceiptViewer = () => {
    setViewingReceipt(null);
    setViewingReceiptUrl("");
    setViewingReceiptLoading(false);
  };
  /* =======================================================
   ΔΙΑΓΡΑΦΗ ΑΠΟΔΕΙΞΗΣ
======================================================= */

  const handleDeleteReceipt = async (receipt) => {
    if (!receipt?.id) {
      return;
    }

    const confirmed = window.confirm("Θέλετε να διαγράψετε αυτή την απόδειξη;");

    if (!confirmed) {
      return;
    }

    setMessage("");

    try {
      /*
       * Διαγράφουμε πρώτα την εικόνα από το Storage.
       */

      if (receipt.file_path) {
        const { error: storageError } = await supabase.storage
          .from("receipts")
          .remove([receipt.file_path]);

        if (storageError) {
          throw new Error(
            `Δεν ήταν δυνατή η διαγραφή της εικόνας: ${storageError.message}`,
          );
        }
      }

      /*
       * Διαγράφουμε την εγγραφή της απόδειξης.
       *
       * Το αντίστοιχο έξοδο ΔΕΝ διαγράφεται.
       * Παραμένει κανονικά στα Έξοδα.
       */

      const { error: deleteError } = await supabase
        .from("receipts")
        .delete()
        .eq("id", receipt.id)
        .eq("user_id", session.user.id);

      if (deleteError) {
        throw new Error(
          `Δεν ήταν δυνατή η διαγραφή της απόδειξης: ${deleteError.message}`,
        );
      }

      setReceipts((current) =>
        current.filter((item) => item.id !== receipt.id),
      );

      if (viewingReceipt?.id === receipt.id) {
        closeReceiptViewer();
      }

      setMessage("Η απόδειξη διαγράφηκε επιτυχώς.");
    } catch (error) {
      console.error("Delete receipt:", error);

      setMessage(error?.message || "Δεν ήταν δυνατή η διαγραφή της απόδειξης.");
    }
  };
  /* =======================================================
     ΑΡΧΕΙΟ / ΕΙΚΟΝΑ
  ======================================================= */

  const handleFile = (file) => {
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Παρακαλώ επιλέξτε μια εικόνα.");
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const url = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreview(url);
    setFileName(file.name);

    setMerchant("");
    setReceiptDate(getTodayDateString());
    setAmount("");
    setCategory("");

    setQrResult("");
    setMessage("");
    setSaved(false);
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

    setSelectedFile(null);
    setPreview(null);
    setFileName("");

    setMerchant("");
    setReceiptDate(getTodayDateString());
    setAmount("");
    setCategory("");

    setQrResult("");
    setMessage("");
    setSaved(false);
  };

  /* =======================================================
     QR SCANNER
  ======================================================= */

  const stopQRScanner = async () => {
    const scanner = qrScannerRef.current;

    if (!scanner) {
      setQrScanning(false);
      return;
    }

    try {
      const state = scanner.getState();

      /*
       * Html5Qrcode states:
       * 2 = SCANNING
       * 3 = PAUSED
       */

      if (state === 2 || state === 3) {
        await scanner.stop();
      }

      await scanner.clear();
    } catch (error) {
      console.error("QR scanner stop error:", error);
    }

    qrScannerRef.current = null;
    setQrScanning(false);
  };

  const startQRScanner = () => {
    setMessage("");
    setQrResult("");
    setQrScanning(true);
  };

  /*
   * ΣΗΜΑΝΤΙΚΟ:
   *
   * Δεν ξεκινάμε τον scanner αμέσως στο click.
   * Πρώτα γίνεται render το #receipt-qr-reader
   * και μετά ξεκινάει η κάμερα.
   */

  useEffect(() => {
    if (!qrScanning) {
      return;
    }

    let cancelled = false;

    const initializeScanner = async () => {
      try {
        /*
         * Περιμένουμε να δημιουργηθεί το DOM element.
         */
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (cancelled) {
          return;
        }

        const element = document.getElementById("receipt-qr-reader");

        if (!element) {
          throw new Error("QR reader element was not found.");
        }

        const scanner = new Html5Qrcode("receipt-qr-reader");

        qrScannerRef.current = scanner;

        await scanner.start(
          {
            facingMode: "environment",
          },
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

            try {
              await scanner.stop();
              await scanner.clear();
            } catch (error) {
              console.error("QR scanner cleanup error:", error);
            }

            qrScannerRef.current = null;
            setQrScanning(false);
          },
          () => {
            /*
             * Τα αποτυχημένα frame scans είναι φυσιολογικά.
             * Δεν εμφανίζουμε μήνυμα.
             */
          },
        );
      } catch (error) {
        console.error("QR scanner error:", error);

        if (!cancelled) {
          qrScannerRef.current = null;
          setQrScanning(false);

          const errorName = error?.name || "UnknownError";

          setMessage(`Σφάλμα κάμερας: ${errorName}`);
        }
      }
    };

    initializeScanner();

    return () => {
      cancelled = true;
    };
  }, [qrScanning]);

  /*
   * Cleanup όταν φύγουμε από τη σελίδα.
   */

  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            qrScannerRef.current?.clear().catch(() => {});
            qrScannerRef.current = null;
          });
      }
    };
  }, []);

  /*
   * Cleanup preview URL.
   */

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  /* =======================================================
     ΑΠΟΘΗΚΕΥΣΗ ΑΠΟΔΕΙΞΗΣ
  ======================================================= */

  const saveReceipt = async () => {
    if (!session?.user?.id) {
      setMessage("Δεν βρέθηκε ενεργός χρήστης.");
      return;
    }

    if (!selectedFile) {
      setMessage("Πρώτα φωτογραφίστε ή επιλέξτε μια απόδειξη.");
      return;
    }

    const numericAmount = normalizeAmount(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setMessage("Συμπληρώστε ένα έγκυρο ποσό.");
      return;
    }

    if (!receiptDate) {
      setMessage("Συμπληρώστε την ημερομηνία της απόδειξης.");
      return;
    }

    setProcessing(true);
    setMessage("");

    let uploadedPath = null;
    let receiptId = null;
    let expenseId = null;

    try {
      /*
       * -----------------------------------------------------
       * 1. UPLOAD ΕΙΚΟΝΑΣ
       * -----------------------------------------------------
       */

      const extension =
        selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";

      const safeExtension = extension.replace(/[^a-z0-9]/gi, "");

      const filePath =
        `${session.user.id}/` +
        `${Date.now()}-${crypto.randomUUID()}.` +
        `${safeExtension || "jpg"}`;

      uploadedPath = filePath;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: selectedFile.type,
        });

      if (uploadError) {
        throw new Error(`Αποτυχία αποθήκευσης εικόνας: ${uploadError.message}`);
      }

      /*
       * -----------------------------------------------------
       * 2. ΔΗΜΙΟΥΡΓΙΑ ΕΞΟΔΟΥ
       * -----------------------------------------------------
       */

      const expenseDescription = merchant.trim() || "Απόδειξη";

      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .insert({
          user_id: session.user.id,
          description: expenseDescription,
          category: category || null,
          amount: numericAmount,
          expense_date: receiptDate,
          recurring: false,
          payment_method: "bank",
          payment_card_id: null,
        })
        .select("id")
        .single();

      if (expenseError) {
        throw new Error(`Αποτυχία δημιουργίας εξόδου: ${expenseError.message}`);
      }

      expenseId = expenseData?.id || null;

      /*
       * -----------------------------------------------------
       * 3. ΔΗΜΙΟΥΡΓΙΑ ΑΠΟΔΕΙΞΗΣ
       * -----------------------------------------------------
       */

      const { data: receiptData, error: receiptError } = await supabase
        .from("receipts")
        .insert({
          user_id: session.user.id,

          file_path: uploadedPath,
          file_name: fileName,

          merchant: merchant.trim() || null,
          receipt_date: receiptDate || null,
          amount: numericAmount,
          category: category || null,

          qr_data: qrResult || null,

          expense_id: expenseId,
        })
        .select("id")
        .single();

      if (receiptError) {
        throw new Error(
          `Αποτυχία αποθήκευσης απόδειξης: ${receiptError.message}`,
        );
      }

      receiptId = receiptData?.id || null;

      /*
       * -----------------------------------------------------
       * 4. ΕΠΙΤΥΧΙΑ
       * -----------------------------------------------------
       */

      setSaved(true);

      await loadReceipts();

      setMessage("Η απόδειξη αποθηκεύτηκε και το έξοδο καταχωρήθηκε επιτυχώς.");
    } catch (error) {
      console.error("Save receipt error:", error);

      /*
       * -----------------------------------------------------
       * CLEANUP ΑΝ ΑΠΟΤΥΧΕΙ ΚΑΠΟΙΟ ΒΗΜΑ
       * -----------------------------------------------------
       */

      if (receiptId) {
        await supabase
          .from("receipts")
          .delete()
          .eq("id", receiptId)
          .eq("user_id", session.user.id);
      }

      if (expenseId) {
        await supabase
          .from("expenses")
          .delete()
          .eq("id", expenseId)
          .eq("user_id", session.user.id);
      }

      if (uploadedPath) {
        await supabase.storage.from("receipts").remove([uploadedPath]);
      }

      setSaved(false);

      setMessage(
        error?.message || "Δεν ήταν δυνατή η αποθήκευση της απόδειξης.",
      );
    } finally {
      setProcessing(false);
    }
  };

  /* =======================================================
     ΝΕΑ ΑΠΟΔΕΙΞΗ
  ======================================================= */

  const startNewReceipt = () => {
    removePreview();
  };

  /* =======================================================
     RENDER
  ======================================================= */

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

            <p>Φωτογραφίστε την απόδειξη ή επιλέξτε μια εικόνα.</p>
          </div>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        {!saved && (
          <div className="receipt-actions">
            <button
              type="button"
              className="receipt-action-button primary"
              onClick={() => cameraInputRef.current?.click()}
            >
              <span className="receipt-action-icon">📷</span>
              <span>Φωτογράφιση</span>
            </button>

            <button
              type="button"
              className="receipt-action-button"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="receipt-action-icon">▣</span>
              <span>Επιλογή εικόνας</span>
            </button>

            <button
              type="button"
              className="receipt-action-button"
              onClick={startQRScanner}
              disabled={qrScanning}
            >
              <span className="receipt-action-icon qr-icon">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  aria-hidden="true"
                >
                  <path
                    d="M3 3h7v7H3V3zm2 2v3h3V5H5z
         M14 3h7v7h-7V3zm2 2v3h3V5h-3z
         M3 14h7v7H3v-7zm2 2v3h3v-3H5z
         M14 14h3v3h-3v-3zm5 0h2v2h-2v-2zm-5 5h2v2h-2v-2zm3-3h4v4h-2v-2h-2v-2z"
                    fill="currentColor"
                  />
                </svg>
              </span>{" "}
              <span>Σάρωση QR</span>
            </button>

            <button
              type="button"
              className="receipt-action-button"
              onClick={analyzeReceiptWithAI}
              disabled={!selectedFile || processing}
            >
              <span className="receipt-action-icon">
                {processing ? "…" : "✦"}
              </span>
              <span>{processing ? "Ανάλυση..." : "Ανάλυση με AI"}</span>
            </button>
          </div>
        )}

        {/* =================================================
            HIDDEN FILE INPUTS
        ================================================= */}

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

        {/* =================================================
            QR SCANNER
        ================================================= */}

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

        {/* =================================================
            QR RESULT
        ================================================= */}

        {qrResult && (
          <div className="receipt-qr-result">
            <strong>QR κωδικός</strong>

            <div className="receipt-qr-value">{qrResult}</div>
          </div>
        )}

        {/* =================================================
            PREVIEW
        ================================================= */}

        {preview && (
          <div className="receipt-preview">
            <div className="receipt-preview-header">
              <div>
                <strong>Προεπισκόπηση</strong>

                <div className="receipt-file-name">{fileName}</div>
              </div>

              {!saved && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={removePreview}
                  disabled={processing}
                >
                  Αφαίρεση
                </button>
              )}
            </div>

            <div className="receipt-image-wrapper">
              <img
                src={preview}
                alt="Προεπισκόπηση απόδειξης"
                className="receipt-image"
              />
            </div>

            {/* =============================================
                RECEIPT DETAILS
            ============================================= */}

            {!saved && (
              <div className="receipt-form">
                <div className="receipt-form-field">
                  <label htmlFor="receipt-merchant">Κατάστημα</label>

                  <input
                    id="receipt-merchant"
                    type="text"
                    value={merchant}
                    onChange={(event) => setMerchant(event.target.value)}
                    placeholder="π.χ. AB Βασιλόπουλος"
                    disabled={processing}
                  />
                </div>

                <div className="receipt-form-row">
                  <div className="receipt-form-field">
                    <label htmlFor="receipt-date">Ημερομηνία</label>

                    <input
                      id="receipt-date"
                      type="date"
                      value={receiptDate}
                      onChange={(event) => setReceiptDate(event.target.value)}
                      disabled={processing}
                    />
                  </div>

                  <div className="receipt-form-field">
                    <label htmlFor="receipt-amount">Ποσό (€)</label>

                    <input
                      id="receipt-amount"
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="0,00"
                      disabled={processing}
                    />
                  </div>
                </div>

                <div className="receipt-form-field">
                  <label htmlFor="receipt-category">Κατηγορία</label>

                  <select
                    id="receipt-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    disabled={processing}
                  >
                    <option value="">Επιλέξτε κατηγορία</option>

                    {RECEIPT_CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* =============================================
                SAVE
            ============================================= */}

            {!saved && (
              <div className="receipt-process">
                <button
                  type="button"
                  className="primary-button"
                  onClick={saveReceipt}
                  disabled={processing}
                >
                  {processing ? "Αποθήκευση..." : "💾 Αποθήκευση απόδειξης"}
                </button>
              </div>
            )}

            {/* =============================================
                SAVED
            ============================================= */}

            {saved && (
              <div className="receipt-saved">
                <strong>✓ Η απόδειξη αποθηκεύτηκε</strong>

                <p>Το αντίστοιχο έξοδο δημιουργήθηκε αυτόματα.</p>

                <button
                  type="button"
                  className="primary-button"
                  onClick={startNewReceipt}
                >
                  + Νέα απόδειξη
                </button>
              </div>
            )}
          </div>
        )}

        {/* =================================================
            MESSAGE
        ================================================= */}
        {/* =================================================
    ΙΣΤΟΡΙΚΟ ΑΠΟΔΕΙΞΕΩΝ
================================================= */}

        <div className="receipts-history">
          <div className="receipts-history-header">
            <div>
              <h2>Ιστορικό αποδείξεων</h2>

              <p>Οι αποδείξεις που έχουν αποθηκευτεί στον λογαριασμό σας.</p>
            </div>

            {!receiptsLoading && receipts.length > 0 && (
              <span className="receipts-count">{receipts.length}</span>
            )}
          </div>

          {receiptsLoading ? (
            <div className="receipts-empty">Φόρτωση αποδείξεων...</div>
          ) : receipts.length === 0 ? (
            <div className="receipts-empty">
              Δεν υπάρχουν ακόμη αποθηκευμένες αποδείξεις.
            </div>
          ) : (
            <div className="receipts-list">
              {receipts.map((receipt) => (
                <div key={receipt.id} className="receipt-history-item">
                  <div className="receipt-history-main">
                    <div className="receipt-history-icon">🧾</div>

                    <div className="receipt-history-info">
                      <strong>{receipt.merchant || "Απόδειξη"}</strong>

                      <span>
                        {receipt.receipt_date
                          ? new Date(
                              `${receipt.receipt_date}T00:00:00`,
                            ).toLocaleDateString("el-GR")
                          : "Χωρίς ημερομηνία"}
                      </span>

                      {receipt.category && (
                        <span className="receipt-history-category">
                          {receipt.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="receipt-history-right">
                    <strong className="receipt-history-amount">
                      {Number(receipt.amount || 0).toLocaleString("el-GR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </strong>

                    <div className="receipt-history-actions">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => handleViewReceipt(receipt)}
                      >
                        Προβολή
                      </button>

                      <button
                        type="button"
                        className="delete-debt-button"
                        onClick={() => handleDeleteReceipt(receipt)}
                        title="Διαγραφή απόδειξης"
                        aria-label="Διαγραφή απόδειξης"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =================================================
    RECEIPT VIEWER
================================================= */}

        {viewingReceipt && (
          <div className="receipt-viewer-overlay" onClick={closeReceiptViewer}>
            <div
              className="receipt-viewer"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="receipt-viewer-header">
                <div>
                  <strong>{viewingReceipt.merchant || "Απόδειξη"}</strong>

                  <span>
                    {viewingReceipt.receipt_date
                      ? new Date(
                          `${viewingReceipt.receipt_date}T00:00:00`,
                        ).toLocaleDateString("el-GR")
                      : ""}
                  </span>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeReceiptViewer}
                >
                  Κλείσιμο
                </button>
              </div>

              <div className="receipt-viewer-content">
                {viewingReceiptLoading ? (
                  <div className="receipts-empty">Φόρτωση εικόνας...</div>
                ) : viewingReceiptUrl ? (
                  <img
                    src={viewingReceiptUrl}
                    alt="Απόδειξη"
                    className="receipt-viewer-image"
                  />
                ) : (
                  <div className="receipts-empty">
                    Δεν ήταν δυνατή η φόρτωση της εικόνας.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {message && <div className="receipt-message">{message}</div>}
      </div>
    </div>
  );
}
