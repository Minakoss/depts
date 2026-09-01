import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";

/* =========================
   APP
========================= */

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

/* =========================
   LOGIN
========================= */

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

/* =========================
   DASHBOARD
========================= */

function Dashboard({ session }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    provider: "",
    description: "",
    amount: "",
    dueDate: "",
  });

  const [selectedMonth, setSelectedMonth] = useState(new Date(2026, 8, 1));

  const [activePage, setActivePage] = useState("dashboard");

  /* =========================
     LOAD DEBTS
  ========================= */

  useEffect(() => {
    loadDebts();
  }, []);

  const loadDebts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .order("due_date", { ascending: true });

    if (!error) {
      setDebts(data || []);
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  /* =========================
     FORM
  ========================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const addDebt = async (event) => {
    event.preventDefault();

    if (!formData.provider || !formData.amount || !formData.dueDate) {
      return;
    }

    const { data, error } = await supabase
      .from("debts")
      .insert([
        {
          user_id: session.user.id,
          provider: formData.provider,
          description: formData.description || "Λογαριασμός",
          amount: Number(formData.amount),
          due_date: formData.dueDate,
          paid: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Παρουσιάστηκε σφάλμα κατά την αποθήκευση.");
      return;
    }

    setDebts((previous) => [...previous, data]);

    setFormData({
      provider: "",
      description: "",
      amount: "",
      dueDate: "",
    });

    setShowForm(false);
  };

  /* =========================
     TOGGLE PAID
  ========================= */

  const togglePaid = async (debt) => {
    const { error } = await supabase
      .from("debts")
      .update({
        paid: !debt.paid,
      })
      .eq("id", debt.id);

    if (error) {
      console.error(error);
      return;
    }

    setDebts((previous) =>
      previous.map((item) =>
        item.id === debt.id ? { ...item, paid: !item.paid } : item,
      ),
    );
  };

  /* =========================
     MONTH
  ========================= */

  const changeMonth = (amount) => {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + amount,
        1,
      ),
    );
  };

  const monthName = selectedMonth.toLocaleDateString("el-GR", {
    month: "long",
    year: "numeric",
  });

  const monthDebts = debts.filter((debt) => {
    const date = new Date(debt.due_date);

    return (
      date.getFullYear() === selectedMonth.getFullYear() &&
      date.getMonth() === selectedMonth.getMonth()
    );
  });

  /* =========================
     TOTALS
  ========================= */

  const total = monthDebts.reduce((sum, debt) => sum + Number(debt.amount), 0);

  const paid = monthDebts
    .filter((debt) => debt.paid)
    .reduce((sum, debt) => sum + Number(debt.amount), 0);

  const pending = total - paid;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("el-GR");
  };

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="app">
      {/* SIDEBAR */}

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
            Αρχική
          </button>

          <button
            className={`nav-item ${activePage === "debts" ? "active" : ""}`}
            onClick={() => setActivePage("debts")}
          >
            <span className="nav-icon">€</span>
            Υποχρεώσεις
          </button>

          <button
            className={`nav-item ${activePage === "payments" ? "active" : ""}`}
            onClick={() => setActivePage("payments")}
          >
            <span className="nav-icon">✓</span>
            Πληρωμές
          </button>

          <div className="nav-title second">ΔΙΑΧΕΙΡΙΣΗ</div>

          <button className="nav-item" onClick={() => setShowForm(true)}>
            <span className="nav-icon">＋</span>
            Νέα υποχρέωση
          </button>

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
            onClick={handleLogout}
            style={{
              marginLeft: "auto",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#65727e",
            }}
            title="Αποσύνδεση"
          >
            ↪
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <div className="main-area">
        <header className="header">
          <div>
            <h1>
              {activePage === "dashboard"
                ? "Dashboard"
                : activePage === "debts"
                  ? "Υποχρεώσεις"
                  : activePage === "payments"
                    ? "Πληρωμές"
                    : "Ρυθμίσεις"}
            </h1>

            <p>Παρακολούθηση μηνιαίων υποχρεώσεων</p>
          </div>

          <div className="month-selector">
            <button className="month-arrow" onClick={() => changeMonth(-1)}>
              ‹
            </button>

            <span>{monthName}</span>

            <button className="month-arrow" onClick={() => changeMonth(1)}>
              ›
            </button>
          </div>
        </header>

        <main>
          {/* DASHBOARD */}

          {activePage === "dashboard" && (
            <>
              <section className="welcome">
                <h2>Επισκόπηση</h2>

                <p>
                  Παρακάτω βλέπεις την οικονομική σου εικόνα για τον επιλεγμένο
                  μήνα.
                </p>
              </section>

              <section className="summary">
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
              </section>

              <section className="debts-section">
                <div className="section-header">
                  <div>
                    <h2>
                      Υποχρεώσεις{" "}
                      {selectedMonth.toLocaleDateString("el-GR", {
                        month: "long",
                      })}
                    </h2>

                    <p>{monthDebts.length} καταχωρήσεις</p>
                  </div>

                  <button
                    className="add-button"
                    onClick={() => setShowForm(true)}
                  >
                    + Νέα υποχρέωση
                  </button>
                </div>

                {/* FORM */}

                {showForm && (
                  <div className="form-container">
                    <h3>Νέα υποχρέωση</h3>

                    <form onSubmit={addDebt}>
                      <div className="form-grid">
                        <div className="form-field">
                          <label>Πάροχος</label>

                          <input
                            type="text"
                            name="provider"
                            value={formData.provider}
                            onChange={handleChange}
                            placeholder="π.χ. ΔΕΗ"
                            required
                          />
                        </div>

                        <div className="form-field">
                          <label>Περιγραφή</label>

                          <input
                            type="text"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="π.χ. Λογαριασμός ρεύματος"
                          />
                        </div>

                        <div className="form-field">
                          <label>Ποσό (€)</label>

                          <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                          />
                        </div>

                        <div className="form-field">
                          <label>Ημερομηνία λήξης</label>

                          <input
                            type="date"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-actions">
                        <button
                          type="button"
                          className="cancel-button"
                          onClick={() => setShowForm(false)}
                        >
                          Ακύρωση
                        </button>

                        <button type="submit" className="save-button">
                          Αποθήκευση
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* DEBTS */}

                <div className="debts-list">
                  {loading ? (
                    <div className="empty-state">
                      <h3>Φόρτωση...</h3>
                    </div>
                  ) : monthDebts.length === 0 ? (
                    <div className="empty-state">
                      <h3>Δεν υπάρχουν υποχρεώσεις</h3>

                      <p>
                        Δεν έχεις καταχωρημένες υποχρεώσεις για αυτόν τον μήνα.
                      </p>
                    </div>
                  ) : (
                    monthDebts.map((debt) => (
                      <div className="debt-row" key={debt.id}>
                        <div className="debt-info">
                          <div className="provider-icon">
                            {debt.provider.charAt(0)}
                          </div>

                          <div>
                            <h3>{debt.provider}</h3>

                            <p>{debt.description}</p>
                          </div>
                        </div>

                        <div className="debt-date">
                          <span>ΛΗΞΗ</span>

                          <strong>{formatDate(debt.due_date)}</strong>
                        </div>

                        <div className="debt-amount">
                          {Number(debt.amount).toFixed(2)} €
                        </div>

                        <button
                          className={`status ${debt.paid ? "paid" : "pending"}`}
                          onClick={() => togglePaid(debt)}
                        >
                          {debt.paid ? "✓ Πληρώθηκε" : "Εκκρεμεί"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          )}

          {/* OTHER PAGES */}

          {activePage !== "dashboard" && (
            <section className="coming-soon">
              <div className="coming-icon">
                {activePage === "debts"
                  ? "€"
                  : activePage === "payments"
                    ? "✓"
                    : "⚙"}
              </div>

              <h2>
                {activePage === "debts"
                  ? "Υποχρεώσεις"
                  : activePage === "payments"
                    ? "Πληρωμές"
                    : "Ρυθμίσεις"}
              </h2>

              <p>Αυτή η ενότητα θα προστεθεί στο επόμενο βήμα.</p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
