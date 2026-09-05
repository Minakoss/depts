import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";

/* =========================================================
   PROVIDERS / CATEGORIES
========================================================= */

const PROVIDER_CATEGORIES = {
  "Ενέργεια": [
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

  "Ύδρευση": [
    "ΕΥΔΑΠ",
    "ΕΥΑΘ",
    "Δημοτική Επιχείρηση Ύδρευσης",
    "Άλλος πάροχος ύδρευσης",
  ],

  // Κρατάμε την τιμή "Τηλεφωνία" ώστε να είναι συμβατή
  // με τις υπάρχουσες εγγραφές στη βάση.
  "Τηλεφωνία": [
    "COSMOTE",
    "Vodafone",
    "Nova",
    "ΔΕΗ Fiber",
    "Inalan",
    "HCN",
    "Άλλος πάροχος τηλεφωνίας / Internet",
  ],

  "Σπίτι": [
    "Κοινόχρηστα",
    "Ενοίκιο",
    "Πετρέλαιο θέρμανσης",
    "Θέρμανση",
    "Ασφάλεια κατοικίας",
    "Άλλο έξοδο κατοικίας",
  ],

  // Κρατάμε την τιμή "Τράπεζες" ώστε να είναι συμβατή
  // με τις υπάρχουσες εγγραφές στη βάση.
  "Τράπεζες": [
    "Alpha Bank",
    "Eurobank",
    "Εθνική Τράπεζα",
    "Τράπεζα Πειραιώς",
    "Attica Bank",
    "Optima bank",
    "tbi bank",
    "Klarna",
    "Πιστωτική κάρτα",
    "Καταναλωτικό δάνειο",
    "Προσωπικό δάνειο",
    "Στεγαστικό δάνειο",
    "Άλλη τραπεζική οφειλή",
  ],

  "Μετακινήσεις": [
    "Ασφάλεια αυτοκινήτου",
    "Τέλη κυκλοφορίας",
    "ΚΤΕΟ",
    "Διόδια",
    "Parking",
    "Κάρτα ΜΜΜ",
    "Άλλο έξοδο μετακίνησης",
  ],

  "Ασφάλειες": [
    "Ασφάλεια αυτοκινήτου",
    "Ασφάλεια κατοικίας",
    "Ασφάλεια υγείας",
    "Ασφάλεια ζωής",
    "Άλλη ασφάλεια",
  ],

  "Δημόσιο": [
    "Εφορία / ΑΑΔΕ",
    "ΕΝΦΙΑ",
    "Ρύθμιση οφειλών",
    "ΕΦΚΑ",
    "Δήμος",
    "Δημοτικά τέλη",
    "Πρόστιμο",
    "Άλλη οφειλή Δημοσίου",
  ],

  "Συνδρομές & Υπηρεσίες": [
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

  "Αγορές / Δόσεις": [
    "Klarna",
    "tbi bank",
    "PayPal",
    "Δόση αγοράς",
    "Δόση ηλεκτρικής συσκευής",
    "Δόση επίπλων",
    "Άλλη δόση",
  ],

  "Άλλο": ["Άλλη οφειλή"],
};

const PROVIDER_CATEGORY_ICONS = {
  "Ενέργεια": "⚡",
  "Ύδρευση": "💧",
  "Τηλεφωνία": "📱",
  "Σπίτι": "🏠",
  "Τράπεζες": "🏦",
  "Μετακινήσεις": "🚗",
  "Ασφάλειες": "🛡️",
  "Δημόσιο": "🏛️",
  "Συνδρομές & Υπηρεσίες": "🛒",
  "Αγορές / Δόσεις": "📦",
  "Άλλο": "📌",
};

const PROVIDER_CATEGORY_OPTIONS = Object.keys(PROVIDER_CATEGORIES);

function formatProviderCategory(category) {
  return `${PROVIDER_CATEGORY_ICONS[category] || "📌"} ${
    category || "Άλλο"
  }`;
}

const INCOME_CATEGORIES = [
  "Μισθός",
  "Freelance",
  "Ενοίκιο",
  "Επίδομα",
  "Επιστροφή χρημάτων",
  "Άλλο έσοδο",
];

const EXPENSE_CATEGORIES = [
  "Σπίτι",
  "Τρόφιμα",
  "Μετακινήσεις",
  "Υγεία",
  "Διασκέδαση",
  "Αγορές",
  "Συνδρομές",
  "Ταξίδια",
  "Άλλο έξοδο",
];

/* =========================================================
   HELPERS
========================================================= */

function getTodayDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getTodayDateString() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;
}

function getCurrentMonth() {
  const today = new Date();

  return new Date(today.getFullYear(), today.getMonth(), 1);
}

function formatMonthYear(date) {
  return date.toLocaleDateString("el-GR", {
    month: "long",
    year: "numeric",
  });
}

function formatMonth(date) {
  return date.toLocaleDateString("el-GR", {
    month: "long",
  });
}

function getDateForMonth(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}-01`;
}

function isDebtExpired(debt) {
  if (!debt || debt.paid || !debt.due_date) {
    return false;
  }

  const dueDate = new Date(`${debt.due_date}T00:00:00`);

  return dueDate < getTodayDate();
}

function getDebtStatus(debt) {
  if (debt.paid) {
    return "paid";
  }

  if (isDebtExpired(debt)) {
    return "expired";
  }

  return "pending";
}

function sortDebts(debts) {
  return [...debts].sort((a, b) => {
    const statusOrder = {
      expired: 0,
      pending: 1,
      paid: 2,
    };

    const statusA = getDebtStatus(a);
    const statusB = getDebtStatus(b);

    if (statusA !== statusB) {
      return statusOrder[statusA] - statusOrder[statusB];
    }

    const dateA = a.due_date
      ? new Date(`${a.due_date}T00:00:00`).getTime()
      : Infinity;

    const dateB = b.due_date
      ? new Date(`${b.due_date}T00:00:00`).getTime()
      : Infinity;

    return dateA - dateB;
  });
}

function formatCurrency(value) {
  return `${Number(value || 0).toFixed(2)} €`;
}

function formatDate(date) {
  if (!date) {
    return "-";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("el-GR");
}

function normalizeAmount(value) {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  return Number(String(value).replace(",", "."));
}

/* =========================================================
   PROVIDERS HOOK
========================================================= */

function useProviders(session) {
  const [providers, setProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  const loadProviders = async () => {
    if (!session?.user?.id) {
      setProviders([]);
      setLoadingProviders(false);
      return;
    }

    setLoadingProviders(true);

    // Φορτώνουμε πρώτα όλους τους υπάρχοντες παρόχους του χρήστη,
    // ώστε να μην ξαναδημιουργούμε εγγραφές που υπάρχουν ήδη.
    const { data: existingProviders, error: existingError } = await supabase
      .from("providers")
      .select("id, name, category, active")
      .eq("user_id", session.user.id);

    if (existingError) {
      console.error("Providers load error:", existingError);
      setProviders([]);
      setLoadingProviders(false);
      return;
    }

    const existing = existingProviders || [];

    const existingKeys = new Set(
      existing.map(
        (item) =>
          `${String(item.name || "")
            .trim()
            .toLowerCase()}|${String(item.category || "")
            .trim()
            .toLowerCase()}`,
      ),
    );

    const defaultsToInsert = [];

    Object.entries(PROVIDER_CATEGORIES).forEach(([category, names]) => {
      names.forEach((name) => {
        const key = `${name.trim().toLowerCase()}|${category
          .trim()
          .toLowerCase()}`;

        if (!existingKeys.has(key)) {
          defaultsToInsert.push({
            user_id: session.user.id,
            name,
            category,
            active: true,
          });
        }
      });
    });

    if (defaultsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("providers")
        .insert(defaultsToInsert);

      if (insertError) {
        console.error("Default providers insert error:", insertError);
      }
    }

    // Ενεργοί πάροχοι μόνο.
    const { data, error } = await supabase
      .from("providers")
      .select("id, name, category, active")
      .eq("user_id", session.user.id)
      .eq("active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Providers error:", error);
      setProviders([]);
    } else {
      setProviders(data || []);
    }

    setLoadingProviders(false);
  };

  useEffect(() => {
    loadProviders();
  }, [session?.user?.id]);

  return {
    providers,
    loadingProviders,
    reloadProviders: loadProviders,
  };
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const confirmed = window.confirm("Θέλετε σίγουρα να αποσυνδεθείτε;");

    if (!confirmed) {
      return;
    }

    await supabase.auth.signOut();
  };

  const handleEditDebt = (debt) => {
    setEditingDebt(debt);
    setActivePage("edit-debt");
    setMobileMenuOpen(false);
  };

  const handleSavedEdit = () => {
    setEditingDebt(null);
    setActivePage("debts");
    setMobileMenuOpen(false);
  };

  const handleNavigation = (page) => {
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app">
      {/* MOBILE HEADER */}

      <header className="mobile-header">
        <div className="mobile-brand">
          <div className="mobile-brand-text">
            <strong>MY DEBTS</strong>
            <span>PERSONAL FINANCE</span>
          </div>
        </div>

        <div className="mobile-header-actions">
          <button
            type="button"
            className="mobile-logout-button"
            onClick={handleLogout}
            title="Αποσύνδεση"
            aria-label="Αποσύνδεση"
          >
            ←
          </button>
        </div>
      </header>

      {/* MOBILE MENU */}

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <div className="mobile-user-info">
            <div className="user-avatar">
              {session?.user?.email?.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{session?.user?.email}</strong>
              <span>Συνδεδεμένος</span>
            </div>
          </div>

          <MobileNavigation
            activePage={activePage}
            onNavigate={handleNavigation}
          />

          <div className="mobile-menu-divider"></div>

          <button
            type="button"
            className="mobile-menu-logout"
            onClick={handleLogout}
          >
            <span>←</span>
            Αποσύνδεση
          </button>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}

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

          <SidebarButton
            active={activePage === "dashboard"}
            onClick={() => setActivePage("dashboard")}
            icon="⌂"
          >
            Dashboard
          </SidebarButton>

          <SidebarButton
            active={activePage === "debts"}
            onClick={() => setActivePage("debts")}
            icon="€"
          >
            Οφειλές
          </SidebarButton>

          <SidebarButton
            active={activePage === "income"}
            onClick={() => setActivePage("income")}
            icon="+"
          >
            Έσοδα
          </SidebarButton>

          <SidebarButton
            active={activePage === "expenses"}
            onClick={() => setActivePage("expenses")}
            icon="−"
          >
            Έξοδα
          </SidebarButton>

          <div className="nav-title second">ΟΙΚΟΝΟΜΙΚΑ</div>

          <SidebarButton
            active={activePage === "recurring"}
            onClick={() => setActivePage("recurring")}
            icon="↻"
          >
            Πάγιες οφειλές
          </SidebarButton>

          <SidebarButton
            active={activePage === "installments"}
            onClick={() => setActivePage("installments")}
            icon="▤"
          >
            Δόσεις
          </SidebarButton>

          <SidebarButton
            active={activePage === "loans"}
            onClick={() => setActivePage("loans")}
            icon="▥"
          >
            Δάνεια
          </SidebarButton>

          <SidebarButton
            active={activePage === "budget"}
            onClick={() => setActivePage("budget")}
            icon="◉"
          >
            Προϋπολογισμός
          </SidebarButton>

          <div className="nav-title second">ΑΝΑΦΟΡΕΣ</div>

          <SidebarButton
            active={activePage === "calendar"}
            onClick={() => setActivePage("calendar")}
            icon="□"
          >
            Ημερολόγιο
          </SidebarButton>

          <SidebarButton
            active={activePage === "statistics"}
            onClick={() => setActivePage("statistics")}
            icon="▥"
          >
            Στατιστικά
          </SidebarButton>

          <SidebarButton
            active={activePage === "providers"}
            onClick={() => setActivePage("providers")}
            icon="▣"
          >
            Πάροχοι
          </SidebarButton>

          <SidebarButton
            active={activePage === "history"}
            onClick={() => setActivePage("history")}
            icon="◷"
          >
            Ιστορικό
          </SidebarButton>

          <div className="nav-title second">ΣΥΣΤΗΜΑ</div>

          <SidebarButton
            active={activePage === "settings"}
            onClick={() => setActivePage("settings")}
            icon="⚙"
          >
            Ρυθμίσεις
          </SidebarButton>
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">
            {session?.user?.email?.charAt(0).toUpperCase()}
          </div>

          <div className="sidebar-user-info">
            <strong>{session?.user?.email}</strong>
            <span>Συνδεδεμένος</span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
            title="Αποσύνδεση"
            aria-label="Αποσύνδεση"
            type="button"
          >
            ←
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="main-area">
        {activePage === "dashboard" && (
          <DashboardHome
            session={session}
            onNewDebt={() => setActivePage("new-debt")}
            onEditDebt={handleEditDebt}
          />
        )}

        {activePage === "debts" && (
          <DebtsPage
            session={session}
            onNewDebt={() => setActivePage("new-debt")}
            onEditDebt={handleEditDebt}
          />
        )}

        {activePage === "income" && <IncomePage session={session} />}

        {activePage === "expenses" && <ExpensesPage session={session} />}

        {activePage === "recurring" && <RecurringDebtsPage session={session} />}

        {activePage === "installments" && (
          <InstallmentsPage session={session} />
        )}

        {activePage === "loans" && <LoansPage session={session} />}

        {activePage === "budget" && <BudgetPage session={session} />}

        {activePage === "calendar" && <CalendarPage session={session} />}

        {activePage === "statistics" && <StatisticsPage session={session} />}

        {activePage === "providers" && <ProvidersPage session={session} />}

        {activePage === "history" && (
          <HistoryPage session={session} onEditDebt={handleEditDebt} />
        )}

        {activePage === "settings" && <SettingsPage session={session} />}

        {activePage === "new-debt" && (
          <NewDebtPage
            session={session}
            onBack={() => setActivePage("dashboard")}
            onSaved={() => setActivePage("debts")}
          />
        )}

        {activePage === "edit-debt" && editingDebt && (
          <EditDebtPage
            session={session}
            debt={editingDebt}
            onBack={() => {
              setEditingDebt(null);
              setActivePage("debts");
            }}
            onSaved={handleSavedEdit}
          />
        )}
      </main>
    </div>
  );
}

/* =========================================================
   SIDEBAR BUTTON
========================================================= */

function SidebarButton({ active, onClick, icon, children }) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
      type="button"
    >
      <span className="nav-icon">{icon}</span>

      {children}
    </button>
  );
}

/* =========================================================
   MOBILE NAVIGATION
========================================================= */

function MobileNavigation({ activePage, onNavigate }) {
  const items = [
    ["dashboard", "⌂", "Dashboard"],
    ["debts", "€", "Οφειλές"],
    ["income", "+", "Έσοδα"],
    ["expenses", "−", "Έξοδα"],
    ["recurring", "↻", "Πάγιες"],
    ["installments", "▤", "Δόσεις"],
    ["loans", "▥", "Δάνεια"],
    ["budget", "◉", "Budget"],
    ["calendar", "□", "Ημερολόγιο"],
    ["statistics", "▥", "Στατιστικά"],
    ["providers", "▣", "Πάροχοι"],
    ["history", "◷", "Ιστορικό"],
    ["settings", "⚙", "Ρυθμίσεις"],
  ];

  return (
    <>
      {items.map(([page, icon, label]) => (
        <button
          key={page}
          className={`mobile-nav-item ${activePage === page ? "active" : ""}`}
          onClick={() => onNavigate(page)}
          type="button"
        >
          <span>{icon}</span>
          {label}
        </button>
      ))}
    </>
  );
}

/* =========================================================
   DASHBOARD HOME
========================================================= */

function DashboardHome({ session, onNewDebt, onEditDebt }) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const [debts, setDebts] = useState([]);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [selectedMonth, session.user.id]);

  const loadDashboard = async () => {
    setLoading(true);

    const startDate = `${selectedMonth.getFullYear()}-${String(
      selectedMonth.getMonth() + 1,
    ).padStart(2, "0")}-01`;

    const nextMonth = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth() + 1,
      1,
    );

    const endDate = `${nextMonth.getFullYear()}-${String(
      nextMonth.getMonth() + 1,
    ).padStart(2, "0")}-01`;

    const [debtsResult, incomeResult, expensesResult] = await Promise.all([
      supabase
        .from("debts")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("due_date", startDate)
        .lt("due_date", endDate),

      supabase
        .from("income")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("income_date", startDate)
        .lt("income_date", endDate),

      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("expense_date", startDate)
        .lt("expense_date", endDate),
    ]);

    if (debtsResult.error) console.error(debtsResult.error);
    if (incomeResult.error) console.error(incomeResult.error);
    if (expensesResult.error) console.error(expensesResult.error);

    setDebts(sortDebts(debtsResult.data || []));
    setIncome(incomeResult.data || []);
    setExpenses(expensesResult.data || []);

    setLoading(false);
  };

  const totalDebts = useMemo(
    () => debts.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [debts],
  );

  const paidDebts = useMemo(
    () =>
      debts
        .filter((item) => item.paid)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [debts],
  );

  const pendingDebts = useMemo(
    () =>
      debts
        .filter((item) => !item.paid)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [debts],
  );

  const totalIncome = useMemo(
    () => income.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [income],
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses],
  );

  const balance = totalIncome - totalExpenses - pendingDebts;

  const changeMonth = (amount) => {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + amount,
        1,
      ),
    );
  };

  return (
    <>
      <div className="welcome">
        <div className="welcome-header">
          <div>
            <h2>Επισκόπηση</h2>

            <p>
              Παρακάτω βλέπετε την οικονομική σας εικόνα για τον επιλεγμένο
              μήνα.
            </p>
          </div>

          <div className="month-selector">
            <button
              type="button"
              className="month-arrow"
              onClick={() => changeMonth(-1)}
            >
              ‹
            </button>

            <div className="month-current">
              {formatMonthYear(selectedMonth)}
            </div>

            <button
              type="button"
              className="month-arrow"
              onClick={() => changeMonth(1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>ΕΣΟΔΑ</span>
          <strong>{formatCurrency(totalIncome)}</strong>
        </div>

        <div className="summary-card">
          <span>ΕΞΟΔΑ</span>
          <strong>{formatCurrency(totalExpenses)}</strong>
        </div>

        <div className="summary-card">
          <span>ΟΦΕΙΛΕΣ</span>
          <strong>{formatCurrency(totalDebts)}</strong>
        </div>

        <div className="summary-card">
          <span>ΥΠΟΛΟΙΠΟ</span>
          <strong>{formatCurrency(balance)}</strong>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>ΠΛΗΡΩΜΕΝΑ</span>
          <strong>{formatCurrency(paidDebts)}</strong>
        </div>

        <div className="summary-card">
          <span>ΕΚΚΡΕΜΗ</span>
          <strong>{formatCurrency(pendingDebts)}</strong>
        </div>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>
              Οφειλές{" "}
              <span className="section-month">
                {formatMonth(selectedMonth)}
              </span>
            </h2>

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
              Δεν υπάρχουν καταχωρημένες οφειλές για τον επιλεγμένο μήνα.
            </div>
          ) : (
            debts.map((debt) => (
              <DebtRow key={debt.id} debt={debt} onEdit={onEditDebt} />
            ))
          )}
        </div>
      </div>

      <div className="dashboard-panels">
        <UpcomingDebts debts={debts} />

        <div className="dashboard-panel">
          <div className="dashboard-panel-header">
            <div>
              <h3>Οικονομική εικόνα</h3>
              <p>{formatMonthYear(selectedMonth)}</p>
            </div>
          </div>

          <div className="finance-overview">
            <div>
              <span>Έσοδα</span>
              <strong>{formatCurrency(totalIncome)}</strong>
            </div>

            <div>
              <span>Έξοδα</span>
              <strong>{formatCurrency(totalExpenses)}</strong>
            </div>

            <div>
              <span>Υποχρεώσεις</span>
              <strong>{formatCurrency(totalDebts)}</strong>
            </div>

            <div>
              <span>Υπόλοιπο</span>
              <strong>{formatCurrency(balance)}</strong>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   UPCOMING DEBTS
========================================================= */

function UpcomingDebts({ debts }) {
  const upcoming = [...debts]
    .filter((debt) => !debt.paid && debt.due_date)
    .sort(
      (a, b) =>
        new Date(`${a.due_date}T00:00:00`) - new Date(`${b.due_date}T00:00:00`),
    )
    .slice(0, 5);

  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel-header">
        <div>
          <h3>Προσεχείς υποχρεώσεις</h3>
          <p>Οι επόμενες πληρωμές σας</p>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div className="empty-state">Δεν υπάρχουν εκκρεμείς υποχρεώσεις.</div>
      ) : (
        <div className="upcoming-list">
          {upcoming.map((debt) => {
            const due = new Date(`${debt.due_date}T00:00:00`);
            const today = getTodayDate();

            const diff = Math.ceil(
              (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
            );

            return (
              <div className="upcoming-item" key={debt.id}>
                <div>
                  <strong>{debt.provider}</strong>
                  <span>{formatDate(debt.due_date)}</span>
                </div>

                <div className="upcoming-right">
                  <strong>{formatCurrency(debt.amount)}</strong>

                  <span>
                    {diff < 0
                      ? `Ληγμένη ${Math.abs(diff)} ημέρες`
                      : diff === 0
                        ? "Λήγει σήμερα"
                        : `Σε ${diff} ημέρες`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DEBT ROW
========================================================= */

function DebtRow({ debt, onEdit }) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const status = getDebtStatus(debt);

  const formattedDate = debt.due_date ? formatDate(debt.due_date) : "-";

  const togglePaid = async () => {
    setUpdating(true);

    const { error } = await supabase
      .from("debts")
      .update({
        paid: !debt.paid,
      })
      .eq("id", debt.id)
      .eq("user_id", debt.user_id);

    if (error) {
      console.error(error);
      alert("Δεν ήταν δυνατή η αλλαγή της κατάστασης.");
      setUpdating(false);
      return;
    }

    window.location.reload();
  };

  const deleteDebt = async () => {
    const confirmed = window.confirm(
      `Θέλετε να διαγράψετε την οφειλή "${debt.provider}";`,
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    const { error } = await supabase
      .from("debts")
      .delete()
      .eq("id", debt.id)
      .eq("user_id", debt.user_id);

    if (error) {
      console.error(error);
      alert("Δεν ήταν δυνατή η διαγραφή της οφειλής.");
      setDeleting(false);
      return;
    }

    window.location.reload();
  };

  let statusText = "Εκκρεμεί";

  if (status === "expired") {
    statusText = "Έχει λήξει";
  }

  if (status === "paid") {
    statusText = "✓ Πληρώθηκε";
  }

  return (
    <div className={`debt-row debt-row-${status}`}>
      <div className="debt-icon">
        {debt.provider?.charAt(0)?.toUpperCase() || "€"}
      </div>

      <div className="debt-info">
        <strong>{debt.provider}</strong>
        <span>{debt.description || "Οφειλή"}</span>
      </div>

      <div className="debt-due">
        <span>ΛΗΞΗ</span>
        <strong>{formattedDate}</strong>
      </div>

      <div className="debt-amount">
        <strong>{formatCurrency(debt.amount)}</strong>
      </div>

      <button
        type="button"
        className={`debt-status-button ${status}`}
        onClick={togglePaid}
        disabled={updating || deleting}
      >
        {statusText}
      </button>

      <button
        type="button"
        className="edit-debt-button"
        onClick={() => onEdit(debt)}
        disabled={updating || deleting}
        title="Επεξεργασία οφειλής"
        aria-label="Επεξεργασία οφειλής"
      >
        →
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
  const { providers, loadingProviders } = useProviders(session);

  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [form, setForm] = useState({
    provider: "",
    description: "",
    amount: "",
    due_date: getTodayDateString(),
    category: "",
  });

  const filteredProviders = providers.filter(
    (item) => item.category === selectedCategory,
  );

  const handleCategoryChange = (event) => {
    const category = event.target.value;

    setSelectedCategory(category);

    setForm((prev) => ({
      ...prev,
      category,
      provider: "",
    }));
  };

  const handleProviderChange = (event) => {
    const providerName = event.target.value;

    const selectedProvider = providers.find(
      (item) =>
        item.name === providerName && item.category === selectedCategory,
    );

    setForm((prev) => ({
      ...prev,
      provider: providerName,
      category: selectedProvider?.category || selectedCategory,
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedCategory) {
      alert("Επίλεξε πρώτα κατηγορία.");
      return;
    }

    if (!form.provider) {
      alert("Επίλεξε πάροχο.");
      return;
    }

    const numericAmount = normalizeAmount(form.amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Συμπλήρωσε έγκυρο ποσό.");
      return;
    }

    if (!form.due_date) {
      alert("Συμπλήρωσε ημερομηνία λήξης.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("debts").insert({
      user_id: session.user.id,
      provider: form.provider,
      description: form.description.trim(),
      amount: numericAmount,
      due_date: form.due_date,
      category: selectedCategory,
      paid: false,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Δεν ήταν δυνατή η καταχώρηση της οφειλής.");
      return;
    }

    onSaved();
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Νέα οφειλή</h1>
          <p>Καταχώρησε μια νέα οφειλή.</p>
        </div>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Κατηγορία</label>

              <select
                value={selectedCategory}
                onChange={handleCategoryChange}
                disabled={loadingProviders}
                required
              >
                <option value="">
                  {loadingProviders
                    ? "Φόρτωση..."
                    : "Επίλεξε κατηγορία"}
                </option>

                {PROVIDER_CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {formatProviderCategory(category)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Πάροχος</label>

              <select
                name="provider"
                value={form.provider}
                onChange={handleProviderChange}
                disabled={!selectedCategory || loadingProviders}
                required
              >
                <option value="">
                  {!selectedCategory
                    ? "Πρώτα επίλεξε κατηγορία"
                    : loadingProviders
                      ? "Φόρτωση..."
                      : filteredProviders.length === 0
                        ? "Δεν υπάρχουν πάροχοι"
                        : "Επίλεξε πάροχο"}
                </option>

                {filteredProviders.map((provider) => (
                  <option key={provider.id} value={provider.name}>
                    {provider.name}
                  </option>
                ))}
              </select>

              {!loadingProviders && providers.length === 0 && (
                <small className="form-help">
                  Δεν υπάρχουν πάροχοι. Πρόσθεσε πρώτα έναν από την ενότητα
                  «Πάροχοι».
                </small>
              )}
            </div>

            <div className="form-group form-group-full">
              <label>Περιγραφή</label>

              <input
                type="text"
                name="description"
                placeholder="π.χ. Λογαριασμός Σεπτεμβρίου"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Ποσό</label>

              <input
                type="text"
                inputMode="decimal"
                name="amount"
                placeholder="0,00 €"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Ημερομηνία λήξης</label>

              <input
                type="date"
                name="due_date"
                value={form.due_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onBack}>
              Ακύρωση
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                saving ||
                loadingProviders ||
                providers.length === 0 ||
                !selectedCategory ||
                filteredProviders.length === 0
              }
            >
              {saving ? "Αποθήκευση..." : "Καταχώρηση"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   EDIT DEBT
========================================================= */

function EditDebtPage({ session, debt, onBack, onSaved }) {
  const { providers, loadingProviders } = useProviders(session);

  const [provider, setProvider] = useState(debt.provider || "");
  const [category, setCategory] = useState(debt.category || "");
  const [description, setDescription] = useState(debt.description || "");
  const [amount, setAmount] = useState(debt.amount ?? "");
  const [dueDate, setDueDate] = useState(debt.due_date || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!category && provider) {
      const selected = providers.find((item) => item.name === provider);

      if (selected?.category) {
        setCategory(selected.category);
      }
    }
  }, [providers, provider, category]);

  const filteredProviders = providers.filter(
    (item) => item.category === category,
  );

  const providerOptions = [...filteredProviders];

  // Αν ο υπάρχων πάροχος δεν υπάρχει πλέον στους ενεργούς παρόχους,
  // τον κρατάμε προσωρινά ώστε να μπορεί να αποθηκευτεί η οφειλή.
  if (
    provider &&
    !providerOptions.some((item) => item.name === provider)
  ) {
    providerOptions.unshift({
      id: "existing-provider",
      name: provider,
      category: category || debt.category || "Άλλο",
    });
  }

  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;

    setCategory(newCategory);
    setProvider("");
  };

  const handleProviderChange = (event) => {
    const providerName = event.target.value;

    const selected = providers.find(
      (item) =>
        item.name === providerName && item.category === category,
    );

    setProvider(providerName);
    setCategory(selected?.category || category || "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!category || !provider || !amount || !dueDate) {
      setError("Συμπληρώστε κατηγορία, πάροχο, ποσό και ημερομηνία λήξης.");
      return;
    }

    const numericAmount = normalizeAmount(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Το ποσό δεν είναι έγκυρο.");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("debts")
      .update({
        category,
        provider,
        description: description.trim() || "Οφειλή",
        amount: numericAmount,
        due_date: dueDate,
      })
      .eq("id", debt.id)
      .eq("user_id", session.user.id);

    setSaving(false);

    if (error) {
      console.error(error);
      setError(`Δεν ήταν δυνατή η ενημέρωση της οφειλής. ${error.message}`);
      return;
    }

    onSaved();
  };

  return (
    <>
      <div className="welcome">
        <h2>Επεξεργασία οφειλής</h2>
        <p>Τροποποιήστε τα στοιχεία της οφειλής.</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Κατηγορία</label>

            <select
              value={category}
              onChange={handleCategoryChange}
              disabled={loadingProviders}
              required
            >
              <option value="">Επιλέξτε κατηγορία</option>

              {PROVIDER_CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {formatProviderCategory(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Πάροχος</label>

            <select
              value={provider}
              onChange={handleProviderChange}
              disabled={!category || loadingProviders}
              required
            >
              <option value="">
                {!category
                  ? "Πρώτα επιλέξτε κατηγορία"
                  : loadingProviders
                    ? "Φόρτωση..."
                    : "Επιλέξτε πάροχο"}
              </option>

              {providerOptions.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
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
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
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

            <button type="submit" disabled={saving || loadingProviders}>
              {saving ? "Αποθήκευση..." : "Αποθήκευση αλλαγών"}
            </button>
          </div>
        </form>
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
  }, [session.user.id]);

  const loadDebts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", session.user.id);

    if (!error) {
      setDebts(sortDebts(data || []));
    } else {
      console.error(error);
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
   GENERIC DELETE
========================================================= */

async function deleteRecord(table, id, userId, label) {
  const confirmed = window.confirm(`Θέλετε σίγουρα να διαγράψετε ${label};`);

  if (!confirmed) {
    return false;
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error(error);
    alert(`Δεν ήταν δυνατή η διαγραφή. ${error.message}`);
    return false;
  }

  return true;
}

/* =========================================================
   INCOME PAGE
========================================================= */

function IncomePage({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(getTodayDateString());
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadIncome();
  }, [session.user.id]);

  const loadIncome = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("income")
      .select("*")
      .eq("user_id", session.user.id)
      .order("income_date", {
        ascending: false,
      });

    if (error) {
      console.error(error);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!description || !amount || !incomeDate) {
      alert("Συμπληρώστε περιγραφή, ποσό και ημερομηνία.");
      return;
    }

    const numericAmount = normalizeAmount(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Το ποσό δεν είναι έγκυρο.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("income").insert({
      user_id: session.user.id,
      description,
      category: category || null,
      amount: numericAmount,
      income_date: incomeDate,
      recurring,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert(`Δεν ήταν δυνατή η αποθήκευση. ${error.message}`);
      return;
    }

    setDescription("");
    setCategory("");
    setAmount("");
    setRecurring(false);

    await loadIncome();
  };

  const handleDelete = async (id) => {
    const deleted = await deleteRecord(
      "income",
      id,
      session.user.id,
      "το έσοδο",
    );

    if (deleted) {
      await loadIncome();
    }
  };

  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <>
      <div className="welcome">
        <h2>Έσοδα</h2>
        <p>Καταχωρήστε και παρακολουθήστε τα έσοδά σας.</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>ΣΥΝΟΛΟ ΕΣΟΔΩΝ</span>
          <strong>{formatCurrency(total)}</strong>
        </div>

        <div className="summary-card">
          <span>ΚΑΤΑΧΩΡΗΣΕΙΣ</span>
          <strong>{items.length}</strong>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Περιγραφή</label>

            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="π.χ. Μισθός"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Κατηγορία</label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Επιλέξτε κατηγορία</option>

                {INCOME_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Ποσό (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Ημερομηνία</label>

              <input
                type="date"
                value={incomeDate}
                onChange={(event) => setIncomeDate(event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Επαναλαμβανόμενο</label>

              <select
                value={recurring ? "yes" : "no"}
                onChange={(event) => setRecurring(event.target.value === "yes")}
              >
                <option value="no">Όχι</option>
                <option value="yes">Ναι</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <span></span>

            <button type="submit" disabled={saving}>
              {saving ? "Αποθήκευση..." : "+ Προσθήκη εσόδου"}
            </button>
          </div>
        </form>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Καταχωρημένα έσοδα</h2>
            <p>{items.length} καταχωρήσεις</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">Δεν υπάρχουν καταχωρημένα έσοδα.</div>
        ) : (
          <div className="simple-record-list">
            {items.map((item) => (
              <div className="simple-record" key={item.id}>
                <div>
                  <strong>{item.description}</strong>

                  <span>
                    {item.category || "Έσοδο"} · {formatDate(item.income_date)}
                    {item.recurring ? " · Επαναλαμβανόμενο" : ""}
                  </span>
                </div>

                <strong>{formatCurrency(item.amount)}</strong>

                <button
                  type="button"
                  className="delete-debt-button"
                  onClick={() => handleDelete(item.id)}
                  title="Διαγραφή"
                  aria-label="Διαγραφή"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   EXPENSES PAGE
========================================================= */

function ExpensesPage({ session }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [recurring, setRecurring] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [session.user.id]);

  const loadExpenses = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("expense_date", {
        ascending: false,
      });

    if (error) {
      console.error(error);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!description || !amount || !expenseDate) {
      alert("Συμπληρώστε περιγραφή, ποσό και ημερομηνία.");
      return;
    }

    const numericAmount = normalizeAmount(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Το ποσό δεν είναι έγκυρο.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("expenses").insert({
      user_id: session.user.id,
      description,
      category: category || null,
      amount: numericAmount,
      expense_date: expenseDate,
      recurring,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert(`Δεν ήταν δυνατή η αποθήκευση. ${error.message}`);
      return;
    }

    setDescription("");
    setCategory("");
    setAmount("");
    setRecurring(false);

    await loadExpenses();
  };

  const handleDelete = async (id) => {
    const deleted = await deleteRecord(
      "expenses",
      id,
      session.user.id,
      "το έξοδο",
    );

    if (deleted) {
      await loadExpenses();
    }
  };

  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <>
      <div className="welcome">
        <h2>Έξοδα</h2>
        <p>Καταχωρήστε και παρακολουθήστε τα έξοδά σας.</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>ΣΥΝΟΛΟ ΕΞΟΔΩΝ</span>
          <strong>{formatCurrency(total)}</strong>
        </div>

        <div className="summary-card">
          <span>ΚΑΤΑΧΩΡΗΣΕΙΣ</span>
          <strong>{items.length}</strong>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Περιγραφή</label>

            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="π.χ. Supermarket"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Κατηγορία</label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Επιλέξτε κατηγορία</option>

                {EXPENSE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Ποσό (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Ημερομηνία</label>

              <input
                type="date"
                value={expenseDate}
                onChange={(event) => setExpenseDate(event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Επαναλαμβανόμενο</label>

              <select
                value={recurring ? "yes" : "no"}
                onChange={(event) => setRecurring(event.target.value === "yes")}
              >
                <option value="no">Όχι</option>
                <option value="yes">Ναι</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <span></span>

            <button type="submit" disabled={saving}>
              {saving ? "Αποθήκευση..." : "+ Προσθήκη εξόδου"}
            </button>
          </div>
        </form>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Καταχωρημένα έξοδα</h2>
            <p>{items.length} καταχωρήσεις</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">Δεν υπάρχουν καταχωρημένα έξοδα.</div>
        ) : (
          <div className="simple-record-list">
            {items.map((item) => (
              <div className="simple-record" key={item.id}>
                <div>
                  <strong>{item.description}</strong>

                  <span>
                    {item.category || "Έξοδο"} · {formatDate(item.expense_date)}
                    {item.recurring ? " · Επαναλαμβανόμενο" : ""}
                  </span>
                </div>

                <strong>{formatCurrency(item.amount)}</strong>

                <button
                  type="button"
                  className="delete-debt-button"
                  onClick={() => handleDelete(item.id)}
                  title="Διαγραφή"
                  aria-label="Διαγραφή"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   RECURRING DEBTS
========================================================= */

function RecurringDebtsPage({ session }) {
  const { providers, loadingProviders } = useProviders(session);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [saving, setSaving] = useState(false);

  const filteredProviders = providers.filter(
    (item) => item.category === category,
  );

  useEffect(() => {
    loadRecurring();
  }, [session.user.id]);

  const loadRecurring = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("recurring_debts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("day_of_month", {
        ascending: true,
      });

    if (error) {
      console.error(error);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;

    setCategory(newCategory);
    setProvider("");
  };

  const handleProviderChange = (event) => {
    const name = event.target.value;

    const selected = providers.find(
      (item) => item.name === name && item.category === category,
    );

    setProvider(name);
    setCategory(selected?.category || category);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const numericAmount = normalizeAmount(amount);

    if (!provider || !numericAmount || !dayOfMonth) {
      alert("Συμπληρώστε πάροχο, ποσό και ημέρα.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("recurring_debts").insert({
      user_id: session.user.id,
      category: category || null,
      provider,
      description: description || provider,
      amount: numericAmount,
      day_of_month: Number(dayOfMonth),
      active: true,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert(`Δεν ήταν δυνατή η αποθήκευση. ${error.message}`);
      return;
    }

    setProvider("");
    setCategory("");
    setDescription("");
    setAmount("");
    setDayOfMonth("1");

    await loadRecurring();
  };

  const toggleActive = async (item) => {
    const { error } = await supabase
      .from("recurring_debts")
      .update({
        active: !item.active,
      })
      .eq("id", item.id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error(error);
      alert("Δεν ήταν δυνατή η αλλαγή της κατάστασης.");
      return;
    }

    await loadRecurring();
  };

  const handleDelete = async (id) => {
    const deleted = await deleteRecord(
      "recurring_debts",
      id,
      session.user.id,
      "την πάγια οφειλή",
    );

    if (deleted) {
      await loadRecurring();
    }
  };

  return (
    <>
      <div className="welcome">
        <h2>Πάγιες οφειλές</h2>
        <p>Ορίστε τις υποχρεώσεις που επαναλαμβάνονται κάθε μήνα.</p>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Κατηγορία</label>

            <select
              value={category}
              onChange={handleCategoryChange}
              disabled={loadingProviders}
              required
            >
              <option value="">
                {loadingProviders ? "Φόρτωση..." : "Επιλέξτε κατηγορία"}
              </option>

              {PROVIDER_CATEGORY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {formatProviderCategory(item)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Πάροχος</label>

            <select
              value={provider}
              onChange={handleProviderChange}
              disabled={!category || loadingProviders}
              required
            >
              <option value="">
                {!category
                  ? "Πρώτα επιλέξτε κατηγορία"
                  : loadingProviders
                    ? "Φόρτωση..."
                    : "Επιλέξτε πάροχο"}
              </option>

              {filteredProviders.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

            {!loadingProviders && providers.length === 0 && (
              <small className="form-help">
                Δεν υπάρχουν πάροχοι. Πρόσθεσε πρώτα έναν από την ενότητα
                «Πάροχοι».
              </small>
            )}
          </div>

          <div className="form-field">
            <label>Περιγραφή</label>

            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="π.χ. Μηνιαίος λογαριασμός"
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Ποσό (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="form-field">
              <label>Ημέρα κάθε μήνα</label>

              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(event) => setDayOfMonth(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <span></span>

            <button type="submit" disabled={saving || providers.length === 0}>
              {saving ? "Αποθήκευση..." : "+ Προσθήκη πάγιας οφειλής"}
            </button>
          </div>
        </form>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Οι πάγιες οφειλές μου</h2>
            <p>{items.length} καταχωρήσεις</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">Δεν υπάρχουν πάγιες οφειλές.</div>
        ) : (
          <div className="simple-record-list">
            {items.map((item) => (
              <div className="simple-record" key={item.id}>
                <div>
                  <strong>{item.provider}</strong>

                  <span>
                    {item.description || item.category}
                    {" · "}
                    Κάθε {item.day_of_month} του μήνα
                  </span>
                </div>

                <strong>{formatCurrency(item.amount)}</strong>

                <button
                  type="button"
                  className={`debt-status-button ${
                    item.active ? "paid" : "expired"
                  }`}
                  onClick={() => toggleActive(item)}
                >
                  {item.active ? "Ενεργό" : "Ανενεργό"}
                </button>

                <button
                  type="button"
                  className="delete-debt-button"
                  onClick={() => handleDelete(item.id)}
                  title="Διαγραφή"
                  aria-label="Διαγραφή"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   INSTALLMENTS PAGE
========================================================= */

function InstallmentsPage({ session }) {
  const { providers, loadingProviders } = useProviders(session);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [installmentAmount, setInstallmentAmount] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [paidInstallments, setPaidInstallments] = useState("0");
  const [nextDueDate, setNextDueDate] = useState(getTodayDateString());
  const [saving, setSaving] = useState(false);

  const filteredProviders = providers.filter(
    (item) => item.category === category,
  );

  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;

    setCategory(newCategory);
    setProvider("");
  };

  const handleProviderChange = (event) => {
    const providerName = event.target.value;

    setProvider(providerName);
  };

  useEffect(() => {
    loadInstallments();
  }, [session.user.id]);

  const loadInstallments = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("installments")
      .select("*")
      .eq("user_id", session.user.id)
      .order("next_due_date", {
        ascending: true,
      });

    if (error) {
      console.error(error);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const total = normalizeAmount(totalAmount);
    const installment = normalizeAmount(installmentAmount);
    const totalCount = Number(totalInstallments);
    const paidCount = Number(paidInstallments || 0);

    if (
      !category ||
      !provider ||
      !total ||
      !installment ||
      !totalCount ||
      !nextDueDate
    ) {
      alert(
        "Συμπληρώστε πάροχο, συνολικό ποσό, ποσό δόσης, αριθμό δόσεων και ημερομηνία.",
      );
      return;
    }

    if (totalCount < 1 || paidCount < 0 || paidCount > totalCount) {
      alert("Ο αριθμός των δόσεων δεν είναι έγκυρος.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("installments").insert({
      user_id: session.user.id,
      provider,
      description: description || provider,
      total_amount: total,
      installment_amount: installment,
      total_installments: totalCount,
      paid_installments: paidCount,
      next_due_date: nextDueDate,
      active: paidCount < totalCount,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert(`Δεν ήταν δυνατή η αποθήκευση. ${error.message}`);
      return;
    }

    setProvider("");
    setCategory("");
    setDescription("");
    setTotalAmount("");
    setInstallmentAmount("");
    setTotalInstallments("");
    setPaidInstallments("0");

    await loadInstallments();
  };

  const payInstallment = async (item) => {
    if (item.paid_installments >= item.total_installments) {
      return;
    }

    const newPaidCount = Number(item.paid_installments || 0) + 1;
    const isFinished = newPaidCount >= item.total_installments;

    let newDueDate = item.next_due_date;

    if (!isFinished && item.next_due_date) {
      const date = new Date(`${item.next_due_date}T00:00:00`);

      date.setMonth(date.getMonth() + 1);

      newDueDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    const { error } = await supabase
      .from("installments")
      .update({
        paid_installments: newPaidCount,
        next_due_date: newDueDate,
        active: !isFinished,
      })
      .eq("id", item.id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error(error);
      alert(`Δεν ήταν δυνατή η ενημέρωση της δόσης. ${error.message}`);
      return;
    }

    await loadInstallments();
  };

  const handleDelete = async (id) => {
    const deleted = await deleteRecord(
      "installments",
      id,
      session.user.id,
      "τη δόση",
    );

    if (deleted) {
      await loadInstallments();
    }
  };

  const activeItems = items.filter((item) => item.active);

  const remainingTotal = activeItems.reduce(
    (sum, item) =>
      sum +
      Math.max(
        0,
        Number(item.total_installments || 0) -
          Number(item.paid_installments || 0),
      ) *
        Number(item.installment_amount || 0),
    0,
  );

  return (
    <>
      <div className="welcome">
        <h2>Δόσεις</h2>
        <p>Παρακολουθήστε τις αγορές και τις υποχρεώσεις σας σε δόσεις.</p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>ΕΝΕΡΓΕΣ ΔΟΣΕΙΣ</span>
          <strong>{activeItems.length}</strong>
        </div>

        <div className="summary-card">
          <span>ΥΠΟΛΟΙΠΟ ΔΟΣΕΩΝ</span>
          <strong>{formatCurrency(remainingTotal)}</strong>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Κατηγορία</label>

              <select
                value={category}
                onChange={handleCategoryChange}
                disabled={loadingProviders}
                required
              >
                <option value="">
                  {loadingProviders ? "Φόρτωση..." : "Επιλέξτε κατηγορία"}
                </option>

                {PROVIDER_CATEGORY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {formatProviderCategory(item)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Πάροχος / Κατάστημα</label>

              <select
                value={provider}
                onChange={handleProviderChange}
                disabled={!category || loadingProviders}
                required
              >
                <option value="">
                  {!category
                    ? "Πρώτα επιλέξτε κατηγορία"
                    : loadingProviders
                      ? "Φόρτωση..."
                      : "Επιλέξτε πάροχο"}
                </option>

                {filteredProviders.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field form-group-full">
              <label>Περιγραφή</label>

              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="π.χ. Laptop"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Συνολικό ποσό (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={totalAmount}
                onChange={(event) => setTotalAmount(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="form-field">
              <label>Ποσό δόσης (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={installmentAmount}
                onChange={(event) => setInstallmentAmount(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Συνολικές δόσεις</label>

              <input
                type="number"
                min="1"
                value={totalInstallments}
                onChange={(event) => setTotalInstallments(event.target.value)}
                placeholder="12"
                required
              />
            </div>

            <div className="form-field">
              <label>Πληρωμένες δόσεις</label>

              <input
                type="number"
                min="0"
                value={paidInstallments}
                onChange={(event) => setPaidInstallments(event.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Επόμενη ημερομηνία δόσης</label>

            <input
              type="date"
              value={nextDueDate}
              onChange={(event) => setNextDueDate(event.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <span></span>

            <button
              type="submit"
              disabled={
                saving ||
                loadingProviders ||
                providers.length === 0 ||
                !category ||
                filteredProviders.length === 0
              }
            >
              {saving ? "Αποθήκευση..." : "+ Προσθήκη δόσης"}
            </button>
          </div>
        </form>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Οι δόσεις μου</h2>
            <p>{items.length} καταχωρήσεις</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">Δεν υπάρχουν καταχωρημένες δόσεις.</div>
        ) : (
          <div className="simple-record-list">
            {items.map((item) => {
              const remaining =
                Number(item.total_installments || 0) -
                Number(item.paid_installments || 0);

              return (
                <div className="simple-record" key={item.id}>
                  <div>
                    <strong>{item.provider}</strong>

                    <span>
                      {item.description || "Δόση"}
                      {" · "}
                      {item.paid_installments}/{item.total_installments}{" "}
                      πληρωμένες
                      {" · "}
                      Επόμενη: {formatDate(item.next_due_date)}
                    </span>
                  </div>

                  <strong>{formatCurrency(item.installment_amount)}</strong>

                  {item.active ? (
                    <button
                      type="button"
                      className="debt-status-button pending"
                      onClick={() => payInstallment(item)}
                    >
                      Πληρωμή δόσης
                    </button>
                  ) : (
                    <span className="debt-status-button paid">
                      ✓ Ολοκληρώθηκε
                    </span>
                  )}

                  <span>{remaining} υπόλοιπες</span>

                  <button
                    type="button"
                    className="delete-debt-button"
                    onClick={() => handleDelete(item.id)}
                    title="Διαγραφή"
                    aria-label="Διαγραφή"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   LOANS PAGE
========================================================= */

function LoansPage({ session }) {
  const { providers, loadingProviders } = useProviders(session);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [remainingAmount, setRemainingAmount] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [totalInstallments, setTotalInstallments] = useState("");
  const [paidInstallments, setPaidInstallments] = useState("0");
  const [nextDueDate, setNextDueDate] = useState(getTodayDateString());

  const [saving, setSaving] = useState(false);

  const filteredProviders = providers.filter(
    (item) => item.category === category,
  );

  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;

    setCategory(newCategory);
    setProvider("");
  };

  const handleProviderChange = (event) => {
    setProvider(event.target.value);
  };

  useEffect(() => {
    loadLoans();
  }, [session.user.id]);

  const loadLoans = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("loans")
      .select("*")
      .eq("user_id", session.user.id)
      .order("next_due_date", {
        ascending: true,
      });

    if (error) {
      console.error(error);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const original = normalizeAmount(originalAmount);
    const remaining = normalizeAmount(remainingAmount);
    const monthly = normalizeAmount(monthlyPayment);
    const interest = normalizeAmount(interestRate);

    if (
      !category ||
      !provider ||
      !original ||
      !remaining ||
      !monthly ||
      !nextDueDate
    ) {
      alert(
        "Συμπληρώστε πάροχο, αρχικό ποσό, υπόλοιπο, μηνιαία δόση και ημερομηνία.",
      );
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("loans").insert({
      user_id: session.user.id,
      provider,
      description: description || provider,
      original_amount: original,
      remaining_amount: remaining,
      monthly_payment: monthly,
      interest_rate: interest,
      total_installments: totalInstallments ? Number(totalInstallments) : 0,
      paid_installments: paidInstallments ? Number(paidInstallments) : 0,
      next_due_date: nextDueDate,
      active: remaining > 0,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      alert(`Δεν ήταν δυνατή η αποθήκευση. ${error.message}`);
      return;
    }

    setProvider("");
    setCategory("");
    setDescription("");
    setOriginalAmount("");
    setRemainingAmount("");
    setMonthlyPayment("");
    setInterestRate("");
    setTotalInstallments("");
    setPaidInstallments("0");

    await loadLoans();
  };

  const makeLoanPayment = async (loan) => {
    const currentRemaining = Number(loan.remaining_amount || 0);
    const payment = Number(loan.monthly_payment || 0);

    const newRemaining = Math.max(0, currentRemaining - payment);
    const newPaidInstallments = Number(loan.paid_installments || 0) + 1;

    const finished = newRemaining <= 0;

    let newDueDate = loan.next_due_date;

    if (!finished && loan.next_due_date) {
      const date = new Date(`${loan.next_due_date}T00:00:00`);

      date.setMonth(date.getMonth() + 1);

      newDueDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1,
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    const { error } = await supabase
      .from("loans")
      .update({
        remaining_amount: newRemaining,
        paid_installments: newPaidInstallments,
        next_due_date: newDueDate,
        active: !finished,
      })
      .eq("id", loan.id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error(error);

      alert(`Δεν ήταν δυνατή η καταχώρηση της πληρωμής. ${error.message}`);

      return;
    }

    await loadLoans();
  };

  const handleDelete = async (id) => {
    const deleted = await deleteRecord(
      "loans",
      id,
      session.user.id,
      "το δάνειο",
    );

    if (deleted) {
      await loadLoans();
    }
  };

  const totalRemaining = items.reduce(
    (sum, item) => sum + Number(item.remaining_amount || 0),
    0,
  );

  const totalMonthlyPayments = items
    .filter((item) => item.active)
    .reduce((sum, item) => sum + Number(item.monthly_payment || 0), 0);

  return (
    <>
      <div className="welcome">
        <h2>Δάνεια</h2>

        <p>
          Παρακολουθήστε τα υπόλοιπα και τις μηνιαίες δόσεις των δανείων σας.
        </p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>ΣΥΝΟΛΟ ΥΠΟΛΟΙΠΟΥ</span>
          <strong>{formatCurrency(totalRemaining)}</strong>
        </div>

        <div className="summary-card">
          <span>ΜΗΝΙΑΙΕΣ ΔΟΣΕΙΣ</span>
          <strong>{formatCurrency(totalMonthlyPayments)}</strong>
        </div>

        <div className="summary-card">
          <span>ΕΝΕΡΓΑ ΔΑΝΕΙΑ</span>
          <strong>{items.filter((item) => item.active).length}</strong>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Κατηγορία</label>

              <select
                value={category}
                onChange={handleCategoryChange}
                disabled={loadingProviders}
                required
              >
                <option value="">
                  {loadingProviders ? "Φόρτωση..." : "Επιλέξτε κατηγορία"}
                </option>

                {PROVIDER_CATEGORY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {formatProviderCategory(item)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Τράπεζα / Πάροχος</label>

              <select
                value={provider}
                onChange={handleProviderChange}
                disabled={!category || loadingProviders}
                required
              >
                <option value="">
                  {!category
                    ? "Πρώτα επιλέξτε κατηγορία"
                    : loadingProviders
                      ? "Φόρτωση..."
                      : "Επιλέξτε πάροχο"}
                </option>

                {filteredProviders.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field form-group-full">
              <label>Περιγραφή</label>

              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="π.χ. Προσωπικό δάνειο"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Αρχικό ποσό (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={originalAmount}
                onChange={(event) => setOriginalAmount(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="form-field">
              <label>Υπόλοιπο (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={remainingAmount}
                onChange={(event) => setRemainingAmount(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Μηνιαία δόση (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={monthlyPayment}
                onChange={(event) => setMonthlyPayment(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>

            <div className="form-field">
              <label>Επιτόκιο (%)</label>

              <input
                type="text"
                inputMode="decimal"
                value={interestRate}
                onChange={(event) => setInterestRate(event.target.value)}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Συνολικές δόσεις</label>

              <input
                type="number"
                min="0"
                value={totalInstallments}
                onChange={(event) => setTotalInstallments(event.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Πληρωμένες δόσεις</label>

              <input
                type="number"
                min="0"
                value={paidInstallments}
                onChange={(event) => setPaidInstallments(event.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label>Επόμενη ημερομηνία πληρωμής</label>

            <input
              type="date"
              value={nextDueDate}
              onChange={(event) => setNextDueDate(event.target.value)}
              required
            />
          </div>

          <div className="form-actions">
            <span></span>

            <button
              type="submit"
              disabled={
                saving ||
                loadingProviders ||
                providers.length === 0 ||
                !category ||
                filteredProviders.length === 0
              }
            >
              {saving ? "Αποθήκευση..." : "+ Προσθήκη δανείου"}
            </button>
          </div>
        </form>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Τα δάνειά μου</h2>
            <p>{items.length} καταχωρήσεις</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">Δεν υπάρχουν καταχωρημένα δάνεια.</div>
        ) : (
          <div className="simple-record-list">
            {items.map((loan) => (
              <div className="simple-record" key={loan.id}>
                <div>
                  <strong>{loan.provider}</strong>

                  <span>
                    {loan.description || "Δάνειο"}
                    {" · "}
                    Επόμενη πληρωμή: {formatDate(loan.next_due_date)}
                    {loan.interest_rate ? ` · ${loan.interest_rate}%` : ""}
                  </span>
                </div>

                <div>
                  <span>Υπόλοιπο</span>
                  <strong>{formatCurrency(loan.remaining_amount)}</strong>
                </div>

                <div>
                  <span>Μηνιαία δόση</span>
                  <strong>{formatCurrency(loan.monthly_payment)}</strong>
                </div>

                {loan.active ? (
                  <button
                    type="button"
                    className="debt-status-button pending"
                    onClick={() => makeLoanPayment(loan)}
                  >
                    Πληρωμή
                  </button>
                ) : (
                  <span className="debt-status-button paid">✓ Εξοφλήθηκε</span>
                )}

                <button
                  type="button"
                  className="delete-debt-button"
                  onClick={() => handleDelete(loan.id)}
                  title="Διαγραφή"
                  aria-label="Διαγραφή"
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   BUDGET PAGE
========================================================= */

function BudgetPage({ session }) {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  useEffect(() => {
    loadBudgetData();
  }, [selectedMonth, session.user.id]);

  const getMonthRange = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const next = new Date(year, month + 1, 1);

    const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(
      2,
      "0",
    )}-01`;

    return { start, end };
  };

  const loadBudgetData = async () => {
    setLoading(true);

    const { start, end } = getMonthRange();

    const [budgetResult, expenseResult] = await Promise.all([
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", session.user.id)
        .order("category"),

      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("expense_date", start)
        .lt("expense_date", end),
    ]);

    if (budgetResult.error) console.error(budgetResult.error);
    if (expenseResult.error) console.error(expenseResult.error);

    setBudgets(budgetResult.data || []);
    setExpenses(expenseResult.data || []);

    setLoading(false);
  };

  const changeMonth = (amount) => {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + amount,
        1,
      ),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const limit = normalizeAmount(monthlyLimit);

    if (!category || !limit || limit <= 0) {
      alert("Συμπληρώστε κατηγορία και μηνιαίο όριο.");
      return;
    }

    setSaving(true);

    const existing = budgets.find((item) => item.category === category);

    let error;

    if (existing) {
      const result = await supabase
        .from("budgets")
        .update({
          monthly_limit: limit,
        })
        .eq("id", existing.id)
        .eq("user_id", session.user.id);

      error = result.error;
    } else {
      const result = await supabase.from("budgets").insert({
        user_id: session.user.id,
        category,
        monthly_limit: limit,
      });

      error = result.error;
    }

    setSaving(false);

    if (error) {
      console.error(error);
      alert(`Δεν ήταν δυνατή η αποθήκευση. ${error.message}`);
      return;
    }

    setCategory("");
    setMonthlyLimit("");

    await loadBudgetData();
  };

  const handleDelete = async (id) => {
    const deleted = await deleteRecord(
      "budgets",
      id,
      session.user.id,
      "το budget",
    );

    if (deleted) {
      await loadBudgetData();
    }
  };

  const getSpent = (budgetCategory) => {
    return expenses
      .filter((item) => item.category === budgetCategory)
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  };

  const totalBudget = budgets.reduce(
    (sum, item) => sum + Number(item.monthly_limit || 0),
    0,
  );

  const totalSpent = budgets.reduce(
    (sum, item) => sum + getSpent(item.category),
    0,
  );

  return (
    <>
      <div className="welcome">
        <div className="welcome-header">
          <div>
            <h2>Προϋπολογισμός</h2>
            <p>Παρακολουθήστε τα όρια δαπανών ανά κατηγορία.</p>
          </div>

          <div className="month-selector">
            <button
              type="button"
              className="month-arrow"
              onClick={() => changeMonth(-1)}
            >
              ‹
            </button>

            <div className="month-current">
              {formatMonthYear(selectedMonth)}
            </div>

            <button
              type="button"
              className="month-arrow"
              onClick={() => changeMonth(1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>ΣΥΝΟΛΙΚΟ BUDGET</span>
          <strong>{formatCurrency(totalBudget)}</strong>
        </div>

        <div className="summary-card">
          <span>ΔΑΠΑΝΕΣ</span>
          <strong>{formatCurrency(totalSpent)}</strong>
        </div>

        <div className="summary-card">
          <span>ΥΠΟΛΟΙΠΟ</span>
          <strong>
            {formatCurrency(Math.max(0, totalBudget - totalSpent))}
          </strong>
        </div>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Κατηγορία</label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
              >
                <option value="">Επιλέξτε κατηγορία</option>

                {EXPENSE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Μηνιαίο όριο (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={monthlyLimit}
                onChange={(event) => setMonthlyLimit(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <span></span>

            <button type="submit" disabled={saving}>
              {saving ? "Αποθήκευση..." : "+ Ορισμός budget"}
            </button>
          </div>
        </form>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Budget ανά κατηγορία</h2>
            <p>{formatMonthYear(selectedMonth)}</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : budgets.length === 0 ? (
          <div className="empty-state">
            Δεν έχουν οριστεί όρια προϋπολογισμού.
          </div>
        ) : (
          <div className="budget-list">
            {budgets.map((budget) => {
              const limit = Number(budget.monthly_limit || 0);

              const spent = getSpent(budget.category);
              const remaining = Math.max(0, limit - spent);

              const percentage =
                limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;

              return (
                <div className="budget-item" key={budget.id}>
                  <div className="budget-header">
                    <strong>{budget.category}</strong>

                    <span>
                      {formatCurrency(spent)} / {formatCurrency(limit)}
                    </span>
                  </div>

                  <div className="budget-bar">
                    <div
                      className="budget-bar-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    ></div>
                  </div>

                  <div className="budget-footer">
                    <span>Υπόλοιπο: {formatCurrency(remaining)}</span>

                    <span>{percentage.toFixed(0)}%</span>

                    <button
                      type="button"
                      className="delete-debt-button"
                      onClick={() => handleDelete(budget.id)}
                      title="Διαγραφή budget"
                      aria-label="Διαγραφή budget"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   CALENDAR PAGE
========================================================= */

function CalendarPage({ session }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [debts, setDebts] = useState([]);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalendarData();
  }, [selectedDate, session.user.id]);

  const loadCalendarData = async () => {
    setLoading(true);

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const nextMonth = new Date(year, month + 1, 1);

    const end = `${nextMonth.getFullYear()}-${String(
      nextMonth.getMonth() + 1,
    ).padStart(2, "0")}-01`;

    const [debtsResult, incomeResult, expensesResult] = await Promise.all([
      supabase
        .from("debts")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("due_date", start)
        .lt("due_date", end),

      supabase
        .from("income")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("income_date", start)
        .lt("income_date", end),

      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("expense_date", start)
        .lt("expense_date", end),
    ]);

    if (debtsResult.error) console.error(debtsResult.error);
    if (incomeResult.error) console.error(incomeResult.error);
    if (expensesResult.error) console.error(expensesResult.error);

    setDebts(debtsResult.data || []);
    setIncome(incomeResult.data || []);
    setExpenses(expensesResult.data || []);

    setLoading(false);
  };

  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0,
  ).getDate();

  const firstDay = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1,
  ).getDay();

  const mondayOffset = firstDay === 0 ? 6 : firstDay - 1;

  const days = [];

  for (let i = 0; i < mondayOffset; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const getDayEvents = (day) => {
    if (!day) {
      return {
        debts: [],
        income: [],
        expenses: [],
      };
    }

    const dateString = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return {
      debts: debts.filter((item) => item.due_date === dateString),

      income: income.filter((item) => item.income_date === dateString),

      expenses: expenses.filter((item) => item.expense_date === dateString),
    };
  };

  const changeMonth = (amount) => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + amount, 1),
    );
  };

  const selectedEvents = getDayEvents(selectedDate.getDate());

  return (
    <>
      <div className="welcome">
        <div className="welcome-header">
          <div>
            <h2>Ημερολόγιο</h2>

            <p>Οι οικονομικές σας υποχρεώσεις ανά ημέρα.</p>
          </div>

          <div className="month-selector">
            <button
              type="button"
              className="month-arrow"
              onClick={() => changeMonth(-1)}
            >
              ‹
            </button>

            <div className="month-current">{formatMonthYear(selectedDate)}</div>

            <button
              type="button"
              className="month-arrow"
              onClick={() => changeMonth(1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-container">
        <div className="calendar-weekdays">
          <span>Δευ</span>
          <span>Τρι</span>
          <span>Τετ</span>
          <span>Πεμ</span>
          <span>Παρ</span>
          <span>Σαβ</span>
          <span>Κυρ</span>
        </div>

        <div className="calendar-grid">
          {days.map((day, index) => {
            const events = getDayEvents(day);

            const hasDebt = events.debts.length > 0;
            const hasIncome = events.income.length > 0;
            const hasExpense = events.expenses.length > 0;

            return (
              <button
                type="button"
                className={`calendar-day ${day ? "" : "empty"}`}
                key={`${day}-${index}`}
                disabled={!day}
                onClick={() => {
                  if (!day) return;

                  setSelectedDate(
                    new Date(
                      selectedDate.getFullYear(),
                      selectedDate.getMonth(),
                      day,
                    ),
                  );
                }}
              >
                {day && (
                  <>
                    <strong>{day}</strong>

                    <div className="calendar-events">
                      {hasDebt && <span className="calendar-dot debt">€</span>}

                      {hasIncome && (
                        <span className="calendar-dot income">+</span>
                      )}

                      {hasExpense && (
                        <span className="calendar-dot expense">−</span>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>
              {selectedDate.toLocaleDateString("el-GR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h2>

            <p>Οικονομικές κινήσεις της ημέρας</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : (
          <div className="calendar-event-list">
            {selectedEvents.debts.map((item) => (
              <div className="simple-record" key={`debt-${item.id}`}>
                <div>
                  <strong>{item.provider}</strong>

                  <span>
                    Οφειλή
                    {item.description ? ` · ${item.description}` : ""}
                  </span>
                </div>

                <strong>- {formatCurrency(item.amount)}</strong>
              </div>
            ))}

            {selectedEvents.income.map((item) => (
              <div className="simple-record" key={`income-${item.id}`}>
                <div>
                  <strong>{item.description}</strong>

                  <span>{item.category || "Έσοδο"}</span>
                </div>

                <strong>+ {formatCurrency(item.amount)}</strong>
              </div>
            ))}

            {selectedEvents.expenses.map((item) => (
              <div className="simple-record" key={`expense-${item.id}`}>
                <div>
                  <strong>{item.description}</strong>

                  <span>{item.category || "Έξοδο"}</span>
                </div>

                <strong>- {formatCurrency(item.amount)}</strong>
              </div>
            ))}

            {selectedEvents.debts.length === 0 &&
              selectedEvents.income.length === 0 &&
              selectedEvents.expenses.length === 0 && (
                <div className="empty-state">
                  Δεν υπάρχουν οικονομικές κινήσεις αυτή την ημέρα.
                </div>
              )}
          </div>
        )}
      </div>
    </>
  );
}

/* =========================================================
   STATISTICS PAGE
========================================================= */

function StatisticsPage({ session }) {
  const [debts, setDebts] = useState([]);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  useEffect(() => {
    loadStatistics();
  }, [selectedMonth, session.user.id]);

  const loadStatistics = async () => {
    setLoading(true);

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const next = new Date(year, month + 1, 1);

    const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(
      2,
      "0",
    )}-01`;

    const [debtsResult, incomeResult, expensesResult] = await Promise.all([
      supabase
        .from("debts")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("due_date", start)
        .lt("due_date", end),

      supabase
        .from("income")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("income_date", start)
        .lt("income_date", end),

      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("expense_date", start)
        .lt("expense_date", end),
    ]);

    if (debtsResult.error) console.error(debtsResult.error);
    if (incomeResult.error) console.error(incomeResult.error);
    if (expensesResult.error) console.error(expensesResult.error);

    setDebts(debtsResult.data || []);
    setIncome(incomeResult.data || []);
    setExpenses(expensesResult.data || []);

    setLoading(false);
  };

  const changeMonth = (amount) => {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + amount,
        1,
      ),
    );
  };

  const totalIncome = income.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const totalExpenses = expenses.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const totalDebts = debts.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  const paidDebts = debts
    .filter((item) => item.paid)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const pendingDebts = debts
    .filter((item) => !item.paid)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const balance = totalIncome - totalExpenses - pendingDebts;

  const expensesByCategory = {};

  expenses.forEach((item) => {
    const itemCategory = item.category || "Άλλο έξοδο";

    expensesByCategory[itemCategory] =
      (expensesByCategory[itemCategory] || 0) + Number(item.amount || 0);
  });

  const categoryEntries = Object.entries(expensesByCategory).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <>
      <div className="welcome">
        <div className="welcome-header">
          <div>
            <h2>Στατιστικά</h2>

            <p>Αναλυτική εικόνα των οικονομικών σας.</p>
          </div>

          <div className="month-selector">
            <button
              type="button"
              className="month-arrow"
              onClick={() => changeMonth(-1)}
            >
              ‹
            </button>

            <div className="month-current">
              {formatMonthYear(selectedMonth)}
            </div>

            <button
              type="button"
              className="month-arrow"
              onClick={() => changeMonth(1)}
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Φόρτωση...</div>
      ) : (
        <>
          <div className="summary-grid">
            <div className="summary-card">
              <span>ΕΣΟΔΑ</span>
              <strong>{formatCurrency(totalIncome)}</strong>
            </div>

            <div className="summary-card">
              <span>ΕΞΟΔΑ</span>
              <strong>{formatCurrency(totalExpenses)}</strong>
            </div>

            <div className="summary-card">
              <span>ΟΦΕΙΛΕΣ</span>
              <strong>{formatCurrency(totalDebts)}</strong>
            </div>

            <div className="summary-card">
              <span>ΥΠΟΛΟΙΠΟ</span>
              <strong>{formatCurrency(balance)}</strong>
            </div>
          </div>

          <div className="dashboard-panels">
            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h3>Κατανομή εξόδων</h3>

                  <p>{formatMonthYear(selectedMonth)}</p>
                </div>
              </div>

              {categoryEntries.length === 0 ? (
                <div className="empty-state">
                  Δεν υπάρχουν έξοδα για τον επιλεγμένο μήνα.
                </div>
              ) : (
                <div className="statistics-list">
                  {categoryEntries.map(([itemCategory, amount]) => {
                    const percentage =
                      totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;

                    return (
                      <div className="statistics-item" key={itemCategory}>
                        <div>
                          <strong>{itemCategory}</strong>

                          <span>{formatCurrency(amount)}</span>
                        </div>

                        <div className="statistics-bar">
                          <div
                            className="statistics-bar-fill"
                            style={{
                              width: `${percentage}%`,
                            }}
                          ></div>
                        </div>

                        <small>{percentage.toFixed(1)}%</small>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="dashboard-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h3>Κατάσταση οφειλών</h3>

                  <p>{formatMonthYear(selectedMonth)}</p>
                </div>
              </div>

              <div className="finance-overview">
                <div>
                  <span>Σύνολο</span>

                  <strong>{formatCurrency(totalDebts)}</strong>
                </div>

                <div>
                  <span>Πληρωμένα</span>

                  <strong>{formatCurrency(paidDebts)}</strong>
                </div>

                <div>
                  <span>Εκκρεμή</span>

                  <strong>{formatCurrency(pendingDebts)}</strong>
                </div>

                <div>
                  <span>Ποσοστό πληρωμής</span>

                  <strong>
                    {totalDebts > 0
                      ? `${((paidDebts / totalDebts) * 100).toFixed(0)}%`
                      : "0%"}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* =========================================================
   PROVIDERS PAGE
========================================================= */

function ProvidersPage({ session }) {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProvider, setNewProvider] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const loadProviders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Providers error:", error);
      setProviders([]);
    } else {
      setProviders(data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProviders();
  }, [session.user.id]);

  const addProvider = async (event) => {
    event.preventDefault();

    const name = newProvider.trim();

    if (!name) {
      alert("Συμπλήρωσε το όνομα του παρόχου.");
      return;
    }

    const { error } = await supabase.from("providers").insert({
      user_id: session.user.id,
      name,
      category: newCategory || null,
      active: true,
    });

    if (error) {
      if (error.code === "23505") {
        alert("Ο συγκεκριμένος πάροχος υπάρχει ήδη.");
      } else {
        console.error(error);
        alert("Δεν ήταν δυνατή η προσθήκη του παρόχου.");
      }

      return;
    }

    setNewProvider("");
    setNewCategory("");

    await loadProviders();
  };

  const deleteProvider = async (id) => {
    const confirmed = window.confirm("Θέλεις να διαγράψεις αυτόν τον πάροχο;");

    if (!confirmed) return;

    const { error } = await supabase
      .from("providers")
      .update({ active: false })
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error(error);
      alert("Δεν ήταν δυνατή η διαγραφή.");
      return;
    }

    await loadProviders();
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Πάροχοι</h1>

          <p>Διαχείριση των παρόχων που χρησιμοποιείς στην εφαρμογή.</p>
        </div>
      </div>

      <div className="dashboard-panel">
        <h2>Νέος πάροχος</h2>

        <form className="inline-form" onSubmit={addProvider}>
          <input
            type="text"
            placeholder="Όνομα παρόχου"
            value={newProvider}
            onChange={(event) => setNewProvider(event.target.value)}
          />

          <select
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
          >
            <option value="">Κατηγορία</option>

            {PROVIDER_CATEGORY_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {formatProviderCategory(item)}
              </option>
            ))}

            <option value="Άλλο">📌 Άλλο</option>
          </select>

          <button type="submit" className="primary-button">
            Προσθήκη
          </button>
        </form>
      </div>

      <div className="dashboard-panel">
        <div className="panel-title-row">
          <h2>Οι πάροχοί μου</h2>

          <span className="panel-count">{providers.length}</span>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : providers.length === 0 ? (
          <div className="empty-state">Δεν υπάρχουν πάροχοι.</div>
        ) : (
          <div className="simple-record-list">
            {providers.map((provider) => (
              <div className="simple-record-row" key={provider.id}>
                <div>
                  <strong>{provider.name}</strong>

                  <span>
                    {formatProviderCategory(provider.category)}
                  </span>
                </div>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteProvider(provider.id)}
                  title="Διαγραφή"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   HISTORY
========================================================= */

function HistoryPage({ session }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("debts")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("paid", true)
      .order("due_date", {
        ascending: false,
      });

    if (!error) {
      setDebts(data || []);
    } else {
      console.error(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, [session.user.id]);

  const totalPaid = debts.reduce(
    (sum, debt) => sum + Number(debt.amount || 0),
    0,
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Ιστορικό</h1>
          <p>Οι οφειλές που έχουν εξοφληθεί.</p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>Εξοφλημένες</span>
          <strong>{debts.length}</strong>
        </div>

        <div className="summary-card">
          <span>Συνολικό ποσό</span>
          <strong>{formatCurrency(totalPaid)}</strong>
        </div>
      </div>

      <div className="dashboard-panel">
        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : debts.length === 0 ? (
          <div className="empty-state">Δεν υπάρχουν εξοφλημένες οφειλές.</div>
        ) : (
          <div className="simple-record-list">
            {debts.map((debt) => (
              <div className="simple-record-row" key={debt.id}>
                <div>
                  <strong>{debt.provider}</strong>

                  <span>{debt.description || "Χωρίς περιγραφή"}</span>
                </div>

                <div className="record-right">
                  <strong>{formatCurrency(debt.amount)}</strong>

                  <span>{formatDate(debt.due_date)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   SETTINGS
========================================================= */

function SettingsPage({ session }) {
  const [settings, setSettings] = useState({
    enabled: false,
    days_before: 3,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!error && data) {
      setSettings({
        enabled: data.enabled,
        days_before: data.days_before,
      });
    }

    if (error) {
      console.error(error);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, [session.user.id]);

  const saveSettings = async () => {
    setSaving(true);

    const { error } = await supabase.from("notification_settings").upsert(
      {
        user_id: session.user.id,
        enabled: settings.enabled,
        days_before: Number(settings.days_before),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    setSaving(false);

    if (error) {
      console.error(error);
      alert("Δεν ήταν δυνατή η αποθήκευση των ρυθμίσεων.");
      return;
    }

    alert("Οι ρυθμίσεις αποθηκεύτηκαν.");
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Ο browser σου δεν υποστηρίζει ειδοποιήσεις.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setSettings((prev) => ({
        ...prev,
        enabled: true,
      }));

      alert("Οι ειδοποιήσεις ενεργοποιήθηκαν.");
    } else {
      setSettings((prev) => ({
        ...prev,
        enabled: false,
      }));

      alert("Η άδεια για τις ειδοποιήσεις δεν δόθηκε.");
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="empty-state">Φόρτωση ρυθμίσεων...</div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Ρυθμίσεις</h1>

          <p>Ρυθμίσεις εφαρμογής και ειδοποιήσεων.</p>
        </div>
      </div>

      <div className="dashboard-panel settings-panel">
        <h2>Ειδοποιήσεις οφειλών</h2>

        <div className="setting-row">
          <div>
            <strong>Ειδοποιήσεις</strong>

            <span>Ενεργοποίηση υπενθυμίσεων για επερχόμενες οφειλές.</span>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  enabled: event.target.checked,
                }))
              }
            />

            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div>
            <strong>Υπενθύμιση πριν</strong>

            <span>Πόσες ημέρες πριν από την ημερομηνία λήξης.</span>
          </div>

          <select
            className="setting-select"
            value={settings.days_before}
            onChange={(event) =>
              setSettings((prev) => ({
                ...prev,
                days_before: Number(event.target.value),
              }))
            }
          >
            <option value="1">1 ημέρα</option>
            <option value="2">2 ημέρες</option>
            <option value="3">3 ημέρες</option>
            <option value="5">5 ημέρες</option>
            <option value="7">7 ημέρες</option>
            <option value="14">14 ημέρες</option>
          </select>
        </div>

        <div className="settings-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={requestNotifications}
          >
            Άδεια ειδοποιήσεων
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? "Αποθήκευση..." : "Αποθήκευση"}
          </button>
        </div>
      </div>

      <div className="dashboard-panel">
        <h2>Λογαριασμός</h2>

        <div className="account-info">
          <div>
            <span>Email</span>
            <strong>{session.user.email}</strong>
          </div>
        </div>
      </div>

      <div className="dashboard-panel">
        <h2>Πληροφορίες εφαρμογής</h2>

        <div className="app-info">
          <div>
            <span>Εφαρμογή</span>
            <strong>MY DEBTS</strong>
          </div>

          <div>
            <span>Έκδοση</span>
            <strong>1.0.0</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EXPORT
========================================================= */

export default App;
