import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";

/* =========================================================
   PROVIDERS / CATEGORIES
========================================================= */

const PROVIDER_CATEGORIES = {
  "⚡ Ενέργεια": [
    "ΔΕΗ",
    "Protergia",
    "ΗΡΩΝ",
    "Elpedison",
    "NRG",
    "ZeniΘ",
    "Volton",
    "Enerwave",
    "Φυσικό Αέριο",
    "Άλλος πάροχος ενέργειας",
  ],

  "💧 Ύδρευση": [
    "ΕΥΔΑΠ",
    "ΕΥΑΘ",
    "Δημοτική Επιχείρηση Ύδρευσης",
    "Άλλος πάροχος ύδρευσης",
  ],

  "📱 Τηλεφωνία & Internet": [
    "COSMOTE",
    "Vodafone",
    "Nova",
    "ΔΕΗ Fiber",
    "Inalan",
    "HCN",
    "Άλλος πάροχος τηλεφωνίας / Internet",
  ],

  "🏠 Σπίτι": [
    "Κοινόχρηστα",
    "Ενοίκιο",
    "Πετρέλαιο θέρμανσης",
    "Θέρμανση",
    "Ασφάλεια κατοικίας",
    "Άλλο έξοδο κατοικίας",
  ],

  "🏦 Τράπεζες & Χρηματοδοτήσεις": [
    "tbi bank",
    "Klarna",
    "Πιστωτική κάρτα",
    "Καταναλωτικό δάνειο",
    "Προσωπικό δάνειο",
    "Στεγαστικό δάνειο",
    "Άλλη τραπεζική οφειλή",
  ],

  "🚗 Μετακινήσεις": [
    "Ασφάλεια αυτοκινήτου",
    "Τέλη κυκλοφορίας",
    "ΚΤΕΟ",
    "Διόδια",
    "Parking",
    "Κάρτα ΜΜΜ",
    "Άλλο έξοδο μετακίνησης",
  ],

  "🛡️ Ασφάλειες": [
    "Ασφάλεια αυτοκινήτου",
    "Ασφάλεια κατοικίας",
    "Ασφάλεια υγείας",
    "Ασφάλεια ζωής",
    "Άλλη ασφάλεια",
  ],

  "🏛️ Δημόσιο": [
    "Εφορία / ΑΑΔΕ",
    "ΕΝΦΙΑ",
    "Ρύθμιση οφειλών",
    "ΕΦΚΑ",
    "Δήμος",
    "Δημοτικά τέλη",
    "Πρόστιμο",
    "Άλλη οφειλή Δημοσίου",
  ],

  "🛒 Συνδρομές & Υπηρεσίες": [
    "Netflix",
    "Spotify",
    "Apple",
    "Google",
    "Amazon",
    "Microsoft",
    "ChatGPT",
    "Γυμναστήριο",
    "Άλλη συνδρομή",
  ],

  "📦 Αγορές / Δόσεις": [
    "Klarna",
    "tbi bank",
    "PayPal",
    "Δόση αγοράς",
    "Δόση ηλεκτρικής συσκευής",
    "Δόση επίπλων",
    "Άλλη δόση",
  ],

  "📌 Άλλο": ["Άλλη οφειλή"],
};

/* =========================================================
   HELPERS
========================================================= */

function isDebtExpired(debt) {
  if (!debt?.due_date || debt?.paid) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${debt.due_date}T00:00:00`);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

/* =========================================================
   APP
========================================================= */

function App() {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();

      setSession(data.session);
      setCheckingSession(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return null;
  }

  if (!session) {
    return <LoginPage />;
  }

  return <Dashboard session={session} />;
}

/* =========================================================
   LOGIN
========================================================= */

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("EL");

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Λάθος email ή κωδικός πρόσβασης.");
    }

    setLoading(false);
  };

  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="visual-overlay"></div>

        <div className="visual-content">
          <div className="welcome-text">
            <div>Καλωσήρθατε στο</div>

            <h1>MY DEBTS</h1>

            <p>
              Την εφαρμογή που απλοποιεί τη διαχείριση
              <br />
              των μηνιαίων υποχρεώσεων
            </p>
          </div>
        </div>

        <div className="version">V 1.0.0</div>
      </section>

      <section className="login-panel">
        <div className="language-switch">
          <button
            type="button"
            className={language === "EL" ? "language-active" : ""}
            onClick={() => setLanguage("EL")}
          >
            EL
          </button>

          <span>|</span>

          <button
            type="button"
            className={language === "EN" ? "language-active" : ""}
            onClick={() => setLanguage("EN")}
          >
            EN
          </button>
        </div>

        <div className="login-content">
          <div className="brand">
            <div className="brand-icon">€</div>

            <div className="brand-name">
              <strong>MY</strong>
              <span>DEBTS</span>
            </div>
          </div>

          <p className="login-description">
            Συμπληρώστε τα στοιχεία σας για να συνδεθείτε
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Όνομα χρήστη"
                required
              />
            </div>

            <div className="login-field">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Κωδικός πρόσβασης"
                required
              />
            </div>

            <div className="forgot-password">
              <button type="button">Ξέχασα τον κωδικό μου</button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Σύνδεση..." : "Είσοδος"}
            </button>

            <button type="button" className="offline-button">
              Είσοδος Offline
            </button>
          </form>
        </div>

        <div className="login-footer">
          Προσωπική διαχείριση μηνιαίων υποχρεώσεων
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

function Dashboard({ session }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [editingDebt, setEditingDebt] = useState(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const openEditDebt = (debt) => {
    setEditingDebt(debt);
    setActivePage("edit-debt");
  };

  const closeEditDebt = () => {
    setEditingDebt(null);
    setActivePage("debts");
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">€</div>

          <div>
            <strong>MY DEBTS</strong>
            <span>PERSONAL FINANCE</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-title">ΚΥΡΙΟ ΜΕΝΟΥ</div>

          <button
            className={`nav-item ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("dashboard")}
          >
            <span className="nav-icon">⌂</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${
              activePage === "debts" || activePage === "new-debt"
                ? "active"
                : ""
            }`}
            onClick={() => setActivePage("debts")}
          >
            <span className="nav-icon">€</span>
            Οφειλές
          </button>

          <button
            className={`nav-item ${activePage === "providers" ? "active" : ""}`}
            onClick={() => setActivePage("providers")}
          >
            <span className="nav-icon">▣</span>
            Πάροχοι
          </button>

          <div className="nav-title second">ΑΝΑΦΟΡΕΣ</div>

          <button
            className={`nav-item ${activePage === "history" ? "active" : ""}`}
            onClick={() => setActivePage("history")}
          >
            <span className="nav-icon">◷</span>
            Ιστορικό
          </button>

          <div className="nav-title second">ΣΥΣΤΗΜΑ</div>

          <button
            className={`nav-item ${activePage === "settings" ? "active" : ""}`}
            onClick={() => setActivePage("settings")}
          >
            <span className="nav-icon">⚙</span>
            Ρυθμίσεις
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">
            {session?.user?.email?.charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>{session?.user?.email}</strong>
            <span>Συνδεδεμένος</span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
            title="Αποσύνδεση"
          >
            ↪
          </button>
        </div>
      </aside>

      <main className="main-area">
        {activePage === "dashboard" && (
          <DashboardHome
            session={session}
            onNewDebt={() => setActivePage("new-debt")}
            onEditDebt={openEditDebt}
          />
        )}

        {activePage === "debts" && (
          <DebtsPage
            session={session}
            onNewDebt={() => setActivePage("new-debt")}
            onEditDebt={openEditDebt}
          />
        )}

        {activePage === "providers" && <ProvidersPage session={session} />}

        {activePage === "history" && (
          <HistoryPage session={session} onEditDebt={openEditDebt} />
        )}

        {activePage === "settings" && <SettingsPage session={session} />}

        {activePage === "new-debt" && (
          <NewDebtPage
            session={session}
            onBack={() => setActivePage("debts")}
            onSaved={() => setActivePage("debts")}
          />
        )}

        {activePage === "edit-debt" && editingDebt && (
          <EditDebtPage
            session={session}
            debt={editingDebt}
            onBack={closeEditDebt}
            onSaved={closeEditDebt}
          />
        )}
      </main>
    </div>
  );
}

/* =========================================================
   DASHBOARD HOME
========================================================= */

function DashboardHome({ session, onNewDebt, onEditDebt }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("due_date", { ascending: true });

    if (!error) {
      setDebts(data || []);
    }

    setLoading(false);
  };

  const total = debts.reduce((sum, debt) => sum + Number(debt.amount || 0), 0);

  const paid = debts
    .filter((debt) => debt.paid)
    .reduce((sum, debt) => sum + Number(debt.amount || 0), 0);

  const pending = debts
    .filter((debt) => !debt.paid)
    .reduce((sum, debt) => sum + Number(debt.amount || 0), 0);

  return (
    <>
      <div className="welcome">
        <h2>Επισκόπηση</h2>
        <p>
          Παρακάτω βλέπετε την οικονομική σας εικόνα για τον επιλεγμένο μήνα.
        </p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>ΣΥΝΟΛΟ</span>
          <strong>{total.toFixed(2)} €</strong>
        </div>

        <div className="summary-card">
          <span>ΠΛΗΡΩΜΕΝΑ</span>
          <strong>{paid.toFixed(2)} €</strong>
        </div>

        <div className="summary-card">
          <span>ΕΚΚΡΕΜΗ</span>
          <strong>{pending.toFixed(2)} €</strong>
        </div>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Οφειλές</h2>
            <p>{debts.length} καταχωρήσεις</p>
          </div>

          <button className="new-debt-button" onClick={onNewDebt}>
            + Νέα οφειλή
          </button>
        </div>

        <div className="debts-list">
          {loading ? (
            <div className="empty-state">Φόρτωση...</div>
          ) : debts.length === 0 ? (
            <div className="empty-state">
              Δεν υπάρχουν ακόμα καταχωρημένες οφειλές.
            </div>
          ) : (
            debts.map((debt) => (
              <DebtRow key={debt.id} debt={debt} onEdit={onEditDebt} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================================
   DEBTS PAGE
========================================================= */

function DebtsPage({ session, onNewDebt, onEditDebt }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("due_date", { ascending: true });

    if (!error) {
      setDebts(data || []);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="welcome">
        <h2>Οφειλές</h2>
        <p>Όλες οι μηνιαίες σας υποχρεώσεις.</p>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Οι οφειλές μου</h2>
            <p>{debts.length} καταχωρήσεις</p>
          </div>

          <button className="new-debt-button" onClick={onNewDebt}>
            + Νέα οφειλή
          </button>
        </div>

        <div className="debts-list">
          {loading ? (
            <div className="empty-state">Φόρτωση...</div>
          ) : debts.length === 0 ? (
            <div className="empty-state">
              Δεν υπάρχουν καταχωρημένες οφειλές.
            </div>
          ) : (
            debts.map((debt) => (
              <DebtRow key={debt.id} debt={debt} onEdit={onEditDebt} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================================
   DEBT ROW
========================================================= */

function DebtRow({ debt, onEdit }) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const expired = isDebtExpired(debt);

  const formattedDate = debt.due_date
    ? new Date(`${debt.due_date}T00:00:00`).toLocaleDateString("el-GR")
    : "-";

  const statusClass = debt.paid ? "paid" : expired ? "expired" : "pending";

  const statusText = debt.paid
    ? "✓ Πληρώθηκε"
    : expired
      ? "Έχει λήξει"
      : "Εκκρεμεί";

  const togglePaid = async () => {
    setUpdating(true);

    const { error } = await supabase
      .from("debts")
      .update({
        paid: !debt.paid,
      })
      .eq("id", debt.id);

    if (error) {
      console.error(error);
      setUpdating(false);
      return;
    }

    window.location.reload();
  };

  const deleteDebt = async () => {
    const confirmed = window.confirm(
      `Θέλετε να διαγράψετε την οφειλή "${debt.provider}" ;`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const { error } = await supabase.from("debts").delete().eq("id", debt.id);

    if (error) {
      console.error(error);
      alert("Δεν ήταν δυνατή η διαγραφή της οφειλής.");
      setDeleting(false);
      return;
    }

    window.location.reload();
  };

  return (
    <div className={`debt-row ${expired && !debt.paid ? "debt-expired" : ""}`}>
      <div className="debt-icon">
        {debt.provider?.charAt(0)?.toUpperCase() || "€"}
      </div>

      <div className="debt-info">
        <strong>{debt.provider}</strong>
        <span>{debt.description || "Οφειλή"}</span>
      </div>

      <div className="debt-due">
        <span>ΛΗΞΗ</span>
        <strong className={expired && !debt.paid ? "expired-date" : ""}>
          {formattedDate}
        </strong>
      </div>

      <div className="debt-amount">
        <strong>{Number(debt.amount).toFixed(2)} €</strong>
      </div>

      <button
        type="button"
        className={`debt-status-button ${statusClass}`}
        onClick={togglePaid}
        disabled={updating || deleting}
        title={debt.paid ? "Σήμανση ως εκκρεμή" : "Σήμανση ως πληρωμένη"}
      >
        {updating ? "..." : statusText}
      </button>

      <button
        type="button"
        className="edit-debt-button"
        onClick={() => onEdit(debt)}
        disabled={updating || deleting}
        title="Επεξεργασία οφειλής"
        aria-label="Επεξεργασία οφειλής"
      >
        ✎
      </button>

      <button
        type="button"
        className="delete-debt-button"
        onClick={deleteDebt}
        disabled={updating || deleting}
        title="Διαγραφή οφειλής"
        aria-label="Διαγραφή οφειλής"
      >
        🗑
      </button>
    </div>
  );
}

/* =========================================================
   NEW DEBT
========================================================= */

function NewDebtPage({ session, onBack, onSaved }) {
  return (
    <DebtForm
      session={session}
      title="Νέα οφειλή"
      subtitle="Καταχωρήστε μια νέα μηνιαία υποχρέωση."
      submitLabel="Αποθήκευση οφειλής"
      onBack={onBack}
      onSaved={onSaved}
    />
  );
}

/* =========================================================
   EDIT DEBT
========================================================= */

function EditDebtPage({ session, debt, onBack, onSaved }) {
  return (
    <DebtForm
      session={session}
      debt={debt}
      title="Επεξεργασία οφειλής"
      subtitle="Τροποποιήστε τα στοιχεία της οφειλής."
      submitLabel="Αποθήκευση αλλαγών"
      onBack={onBack}
      onSaved={onSaved}
    />
  );
}

/* =========================================================
   DEBT FORM
========================================================= */

function DebtForm({
  session,
  debt = null,
  title,
  subtitle,
  submitLabel,
  onBack,
  onSaved,
}) {
  const [category, setCategory] = useState("");
  const [provider, setProvider] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!debt) {
      setCategory("");
      setProvider("");
      setDescription("");
      setAmount("");
      setDueDate("");
      return;
    }

    const detectedCategory =
      Object.entries(PROVIDER_CATEGORIES).find(([, providers]) =>
        providers.includes(debt.provider),
      )?.[0] || "";

    setCategory(detectedCategory);
    setProvider(debt.provider || "");
    setDescription(debt.description || "");
    setAmount(debt.amount ?? "");
    setDueDate(debt.due_date || "");
  }, [debt]);

  const availableProviders = category
    ? PROVIDER_CATEGORIES[category] || []
    : [];

  /*
   * Σε περίπτωση που υπάρχει παλιός/χειροκίνητος πάροχος
   * που δεν υπάρχει πλέον στη λίστα, τον εμφανίζουμε
   * προσωρινά ώστε να μη χαθεί κατά την επεξεργασία.
   */
  const providerOptions =
    provider && !availableProviders.includes(provider)
      ? [provider, ...availableProviders]
      : availableProviders;

  const handleCategoryChange = (event) => {
    const selectedCategory = event.target.value;

    setCategory(selectedCategory);
    setProvider("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!category || !provider || !amount || !dueDate) {
      setError("Συμπληρώστε κατηγορία, πάροχο, ποσό και ημερομηνία λήξης.");
      return;
    }

    setSaving(true);

    const payload = {
      provider,
      description: description || category,
      amount: Number(amount),
      due_date: dueDate,
    };

    let result;

    if (debt?.id) {
      result = await supabase
        .from("debts")
        .update(payload)
        .eq("id", debt.id)
        .eq("user_id", session.user.id);
    } else {
      result = await supabase.from("debts").insert({
        user_id: session.user.id,
        ...payload,
        paid: false,
      });
    }

    setSaving(false);

    if (result.error) {
      console.error(result.error);
      setError(
        debt
          ? "Δεν ήταν δυνατή η ενημέρωση της οφειλής."
          : "Δεν ήταν δυνατή η αποθήκευση της οφειλής.",
      );
      return;
    }

    onSaved();
  };

  return (
    <>
      <div className="welcome">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Κατηγορία</label>

            <select value={category} onChange={handleCategoryChange} required>
              <option value="">Επιλέξτε κατηγορία</option>

              {Object.keys(PROVIDER_CATEGORIES).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Πάροχος</label>

            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
              disabled={!category}
              required
            >
              <option value="">
                {category ? "Επιλέξτε πάροχο" : "Επιλέξτε πρώτα κατηγορία"}
              </option>

              {providerOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Περιγραφή</label>

            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="π.χ. Λογαριασμός ηλεκτρικού"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Ποσό (€)</label>

              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="form-field">
              <label>Ημερομηνία λήξης</label>

              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onBack}>
              Ακύρωση
            </button>

            <button type="submit" disabled={saving}>
              {saving ? "Αποθήκευση..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

/* =========================================================
   PROVIDERS
========================================================= */

function ProvidersPage({ session }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    const { data, error } = await supabase
      .from("debts")
      .select("provider")
      .eq("user_id", session.user.id)
      .order("provider");

    if (!error && data) {
      const uniqueProviders = [
        ...new Set(data.map((item) => item.provider).filter(Boolean)),
      ];

      setProviders(uniqueProviders);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="welcome">
        <h2>Πάροχοι</h2>
        <p>Οι πάροχοι που χρησιμοποιείτε στις οφειλές σας.</p>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Πάροχοι</h2>
            <p>{providers.length} πάροχοι</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : providers.length === 0 ? (
          <div className="empty-state">Δεν υπάρχουν ακόμα πάροχοι.</div>
        ) : (
          <div className="provider-list">
            {providers.map((provider) => (
              <div className="provider-item" key={provider}>
                <div className="debt-icon">
                  {provider.charAt(0).toUpperCase()}
                </div>

                <strong>{provider}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   HISTORY
========================================================= */

function HistoryPage({ session, onEditDebt }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("paid", true)
      .order("due_date", { ascending: false });

    if (!error) {
      setDebts(data || []);
    }

    setLoading(false);
  };

  return (
    <>
      <div className="welcome">
        <h2>Ιστορικό</h2>
        <p>Οι οφειλές που έχουν εξοφληθεί.</p>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Πληρωμένες οφειλές</h2>
            <p>{debts.length} καταχωρήσεις</p>
          </div>
        </div>

        <div className="debts-list">
          {loading ? (
            <div className="empty-state">Φόρτωση...</div>
          ) : debts.length === 0 ? (
            <div className="empty-state">Δεν υπάρχουν πληρωμένες οφειλές.</div>
          ) : (
            debts.map((debt) => (
              <DebtRow key={debt.id} debt={debt} onEdit={onEditDebt} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage({ session }) {
  return (
    <>
      <div className="welcome">
        <h2>Ρυθμίσεις</h2>
        <p>Ρυθμίσεις λογαριασμού και εφαρμογής.</p>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Λογαριασμός</h2>
            <p>{session?.user?.email}</p>
          </div>
        </div>

        <div className="empty-state">
          Οι ρυθμίσεις θα προστεθούν σε επόμενο βήμα.
        </div>
      </div>
    </>
  );
}

export default App;
