import { useEffect, useMemo, useState } from "react";
import {
  subscribeToPush,
  unsubscribeFromPush,
  saveNotificationSettings,
  loadNotificationSettings,
} from "./notifications";
import { supabase } from "./lib/supabaseClient";
import "./App.css";
import ReceiptsPage from "./ReceiptsPage";
import RecurringExpensesPage from "./RecurringExpensesPage";
import { Html5Qrcode } from "html5-qrcode";

/* =========================================================
   PROVIDERS / CATEGORIES
========================================================= */

const PROVIDER_CATEGORIES = {
  Ενέργεια: [
    "ΔΕΗ",
    "Protergia",
    "ΗΡΩΝ",
    "Enerwave",
    "NRG",
    "ZeniΘ",
    "Volton",
    "Φυσικό Αέριο Ελληνική Εταιρεία Ενέργειας",
    "ΕΛΙΝ",
    "ΕΛΤΑ Ενέργεια",
    "Eunice",
    "Solar Energy",
    "ΔΕΠΑ",
    "Watt+Volt",
    "EFA Energy",
    "Άλλος πάροχος ενέργειας",
  ],

  Ύδρευση: [
    "ΕΥΔΑΠ",
    "ΕΥΑΘ",
    "ΔΕΥΑ",
    "Δημοτική Επιχείρηση Ύδρευσης",
    "Άλλος πάροχος ύδρευσης",
  ],

  Τηλεφωνία: [
    "COSMOTE",
    "Vodafone",
    "Nova",
    "ΔΕΗ Fiber",
    "Inalan",
    "HCN",
    "United Fiber",
    "SkyTelecom",
    "Orizon",
    "Cosmote Business",
    "Vodafone Business",
    "Nova Business",
    "Άλλος πάροχος τηλεφωνίας / Internet",
  ],

  Σπίτι: [
    "Κοινόχρηστα",
    "Ενοίκιο",
    "Πετρέλαιο θέρμανσης",
    "Φυσικό αέριο",
    "Υγραέριο",
    "Ξύλα",
    "Pellet",
    "Θέρμανση",
    "Ασφάλεια κατοικίας",
    "Ενοίκιο αποθήκης",
    "Ενοίκιο parking",
    "Διαχειριστής πολυκατοικίας",
    "Άλλο έξοδο κατοικίας",
  ],

  Τράπεζες: [
    "Alpha Bank",
    "Eurobank",
    "Εθνική Τράπεζα",
    "Τράπεζα Πειραιώς",
    "Optima Bank",
    "CrediaBank",
    "Viva.com",
    "ProCredit Bank",
    "Παγκρήτια Τράπεζα",
    "Συνεταιριστική Τράπεζα Θεσσαλίας",
    "Συνεταιριστική Τράπεζα Ηπείρου",
    "Συνεταιριστική Τράπεζα Καρδίτσας",
    "BNP Paribas",
    "Citibank",
    "HSBC",
    "Άλλη τράπεζα",
  ],

  Μετακινήσεις: [
    "Ασφάλεια αυτοκινήτου",
    "Ασφάλεια μηχανής",
    "Τέλη κυκλοφορίας",
    "ΚΤΕΟ",
    "Διόδια",
    "e-PASS",
    "Fast Pass",
    "Olympia Pass",
    "Αυτοκινητόδρομος Αιγαίου",
    "Parking",
    "Κάρτα ΜΜΜ",
    "ΟΑΣΑ",
    "ΟΣΕΘ",
    "Hellenic Train",
    "Αττική Οδός",
    "Άλλο έξοδο μετακίνησης",
  ],

  Ασφάλειες: [
    "Εθνική Ασφαλιστική",
    "Interamerican",
    "Generali",
    "Allianz",
    "Eurolife FFH",
    "NN Hellas",
    "ERGO",
    "Groupama",
    "AXA",
    "Hellas Direct",
    "Anytime",
    "Minetta",
    "Interasco",
    "Ευρωπαϊκή Πίστη",
    "Συνεταιριστική Ασφαλιστική",
    "Άλλη ασφαλιστική",
  ],

  Δημόσιο: [
    "ΑΑΔΕ / Εφορία",
    "ΕΝΦΙΑ",
    "Φόρος εισοδήματος",
    "ΦΠΑ",
    "Ρύθμιση οφειλών ΑΑΔΕ",
    "ΕΦΚΑ",
    "Ρύθμιση ΕΦΚΑ",
    "Δήμος",
    "Δημοτικά τέλη",
    "Κλήση / Πρόστιμο",
    "Τροχαία",
    "Άλλη οφειλή Δημοσίου",
  ],

  "Συνδρομές & Υπηρεσίες": [
    "Netflix",
    "Spotify",
    "Apple",
    "iCloud",
    "Google",
    "Google One",
    "Amazon",
    "Amazon Prime",
    "Microsoft",
    "Microsoft 365",
    "ChatGPT",
    "Disney+",
    "Max",
    "YouTube Premium",
    "YouTube Music",
    "Dropbox",
    "OneDrive",
    "Adobe",
    "PlayStation Plus",
    "Xbox Game Pass",
    "Nintendo Switch Online",
    "Γυμναστήριο",
    "Συνδρομή εφημερίδας",
    "Άλλη συνδρομή",
  ],

  "Αγορές / Δόσεις": [
    "Klarna",
    "tbi bank",
    "PayPal",
    "Δόση αγοράς",
    "Δόση ηλεκτρικής συσκευής",
    "Δόση κινητού",
    "Δόση υπολογιστή",
    "Δόση τηλεόρασης",
    "Δόση επίπλων",
    "Δόση αυτοκινήτου",
    "Άλλη δόση",
  ],

  "Πιστωτικές / Χρηματοδοτήσεις": [
    "Πιστωτική κάρτα Alpha Bank",
    "Πιστωτική κάρτα Eurobank",
    "Πιστωτική κάρτα Εθνικής",
    "Πιστωτική κάρτα Πειραιώς",
    "Πιστωτική κάρτα Optima",
    "Προσωπικό δάνειο",
    "Καταναλωτικό δάνειο",
    "Στεγαστικό δάνειο",
    "Αυτοκινητοδάνειο",
    "tbi bank",
    "Klarna",
    "Leasing",
    "Άλλη χρηματοδότηση",
  ],

  Υγεία: [
    "Ιδιώτης γιατρός",
    "Οδοντίατρος",
    "Διαγνωστικό κέντρο",
    "Ιδιωτική κλινική",
    "Φαρμακείο",
    "ΕΟΠΥΥ",
    "Ιδιωτική ασφάλεια υγείας",
    "Άλλη ιατρική οφειλή",
  ],

  Εκπαίδευση: [
    "Πανεπιστήμιο",
    "Ιδιωτικό ΙΕΚ",
    "Κολλέγιο",
    "Φροντιστήριο",
    "Ξένη γλώσσα",
    "Online course",
    "Άλλη εκπαιδευτική οφειλή",
  ],

  Άλλο: [
    "Προσωπική οφειλή",
    "Οφειλή σε ιδιώτη",
    "Οφειλή σε επιχείρηση",
    "Δάνειο από φίλο / συγγενή",
    "Άλλη οφειλή",
  ],
};

const PROVIDER_CATEGORY_ICONS = {
  Ενέργεια: "⚡",
  Ύδρευση: "💧",
  Τηλεφωνία: "📱",
  Σπίτι: "🏠",
  Τράπεζες: "🏦",
  Μετακινήσεις: "🚗",
  Ασφάλειες: "🛡️",
  Δημόσιο: "🏛️",
  "Συνδρομές & Υπηρεσίες": "🛒",
  "Αγορές / Δόσεις": "📦",
  "Πιστωτικές / Χρηματοδοτήσεις": "💳",
  Υγεία: "⚕️",
  Εκπαίδευση: "🎓",
  Άλλο: "📌",
};

const PROVIDER_CATEGORY_OPTIONS = Object.keys(PROVIDER_CATEGORIES);

function formatProviderCategory(category) {
  return `${PROVIDER_CATEGORY_ICONS[category] || "📌"} ${category || "Άλλο"}`;
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
function getMonthDifference(fromDateString, targetMonth) {
  if (!fromDateString) {
    return null;
  }

  const fromDate = new Date(`${fromDateString}T00:00:00`);

  return (
    (targetMonth.getFullYear() - fromDate.getFullYear()) * 12 +
    (targetMonth.getMonth() - fromDate.getMonth())
  );
}

function getDateInSelectedMonth(year, monthIndex, day) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  const safeDay = Math.min(Number(day) || 1, lastDay);

  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(
    safeDay,
  ).padStart(2, "0")}`;
}

function addMonthsToDateString(dateString, months) {
  const date = new Date(`${dateString}T00:00:00`);

  date.setMonth(date.getMonth() + months);

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
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
        .upsert(defaultsToInsert, {
          onConflict: "user_id,name,category",
          ignoreDuplicates: true,
        });

      if (insertError) {
        console.error("Default providers upsert error:", insertError);
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
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();

      setSession(data.session);

      /*
       * Το Supabase προσθέτει type=recovery στο URL
       * όταν ο χρήστης ανοίξει το link επαναφοράς κωδικού.
       */
      const hash = window.location.hash;

      if (hash.includes("type=recovery")) {
        setRecoveryMode(true);
      }

      setCheckingSession(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);

      /*
       * Το Supabase ενημερώνει την εφαρμογή ότι
       * ο χρήστης βρίσκεται σε διαδικασία PASSWORD RECOVERY.
       */
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }

      /*
       * Μετά το logout βγαίνουμε από το recovery mode.
       */
      if (event === "SIGNED_OUT") {
        setRecoveryMode(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return null;
  }

  /*
   * Ο χρήστης ήρθε από το email επαναφοράς.
   * Εμφανίζουμε την οθόνη αλλαγής κωδικού.
   */
  if (recoveryMode && session) {
    return (
      <ResetPasswordPage
        onCompleted={async () => {
          await supabase.auth.signOut();
          setRecoveryMode(false);
        }}
      />
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return <Dashboard session={session} />;
}
/* =========================================================
   RESET PASSWORD
========================================================= */

function ResetPasswordPage({ onCompleted }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Ο κωδικός πρέπει να περιέχει τουλάχιστον 6 χαρακτήρες.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Οι κωδικοί πρόσβασης δεν ταιριάζουν.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      console.error(error);

      setError(
        "Δεν ήταν δυνατή η αλλαγή του κωδικού πρόσβασης. Παρακαλώ δοκιμάστε ξανά.",
      );

      return;
    }

    setMessage("Ο κωδικός πρόσβασης άλλαξε με επιτυχία.");

    /*
     * Μικρή καθυστέρηση ώστε ο χρήστης να δει
     * το μήνυμα επιτυχίας πριν επιστρέψει στη σύνδεση.
     */
    setTimeout(() => {
      onCompleted();
    }, 1200);
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
          <button type="button" className="language-active">
            EL
          </button>

          <span>|</span>

          <button type="button">EN</button>
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
            Ορίστε τον νέο σας κωδικό πρόσβασης
          </p>

          <form onSubmit={handleUpdatePassword} className="login-form">
            <div className="login-field">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Νέος κωδικός πρόσβασης"
                minLength={6}
                required
              />
            </div>

            <div className="login-field">
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Επιβεβαίωση νέου κωδικού"
                minLength={6}
                required
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            {message && <div className="login-success">{message}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Αλλαγή..." : "Αλλαγή κωδικού"}
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
   LOGIN
========================================================= */

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [language, setLanguage] = useState("EL");

  const [mode, setMode] = useState("login");
  // login
  // register
  // forgot

  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    resetMessages();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setError("Λάθος email ή κωδικός πρόσβασης.");
    }

    setLoading(false);
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    resetMessages();

    if (password.length < 6) {
      setError("Ο κωδικός πρέπει να περιέχει τουλάχιστον 6 χαρακτήρες.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Οι κωδικοί πρόσβασης δεν ταιριάζουν.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error(error);

      if (error.message?.toLowerCase().includes("already registered")) {
        setError("Υπάρχει ήδη λογαριασμός με αυτό το email.");
      } else {
        setError("Δεν ήταν δυνατή η δημιουργία του λογαριασμού.");
      }

      setLoading(false);
      return;
    }

    setLoading(false);

    if (data?.user && !data.session) {
      setMessage(
        "Ο λογαριασμός δημιουργήθηκε. Ελέγξτε το email σας για επιβεβαίωση.",
      );
    } else {
      setMessage("Ο λογαριασμός δημιουργήθηκε με επιτυχία.");
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();

    resetMessages();

    if (!email.trim()) {
      setError("Συμπληρώστε πρώτα το email σας.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/`,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setError("Δεν ήταν δυνατή η αποστολή του email επαναφοράς.");
      return;
    }

    setMessage("Σας στείλαμε email για την επαναφορά του κωδικού πρόσβασης.");
  };

  const showLogin = () => {
    resetMessages();
    setPassword("");
    setConfirmPassword("");
    setMode("login");
  };

  const showRegister = () => {
    resetMessages();
    setPassword("");
    setConfirmPassword("");
    setMode("register");
  };

  const showForgotPassword = () => {
    resetMessages();
    setPassword("");
    setConfirmPassword("");
    setMode("forgot");
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

          {mode === "login" && (
            <>
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
                  <button type="button" onClick={showForgotPassword}>
                    Ξέχασα τον κωδικό μου
                  </button>
                </div>

                {error && <div className="login-error">{error}</div>}

                {message && <div className="login-success">{message}</div>}

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Σύνδεση..." : "Είσοδος"}
                </button>

                <button
                  type="button"
                  className="register-link-button"
                  onClick={showRegister}
                >
                  Δεν έχω λογαριασμό
                </button>
              </form>
            </>
          )}

          {mode === "register" && (
            <>
              <p className="login-description">
                Δημιουργήστε τον προσωπικό σας λογαριασμό
              </p>

              <form onSubmit={handleRegister} className="login-form">
                <div className="login-field">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email"
                    required
                  />
                </div>

                <div className="login-field">
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Κωδικός πρόσβασης"
                    minLength={6}
                    required
                  />
                </div>

                <div className="login-field">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Επιβεβαίωση κωδικού"
                    minLength={6}
                    required
                  />
                </div>

                {error && <div className="login-error">{error}</div>}

                {message && <div className="login-success">{message}</div>}

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Δημιουργία..." : "Δημιουργία λογαριασμού"}
                </button>

                <button
                  type="button"
                  className="register-link-button"
                  onClick={showLogin}
                >
                  ← Επιστροφή στη σύνδεση
                </button>
              </form>
            </>
          )}

          {mode === "forgot" && (
            <>
              <p className="login-description">
                Συμπληρώστε το email σας για να λάβετε
                <br />
                οδηγίες επαναφοράς κωδικού.
              </p>

              <form onSubmit={handleForgotPassword} className="login-form">
                <div className="login-field">
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Email"
                    required
                  />
                </div>

                {error && <div className="login-error">{error}</div>}

                {message && <div className="login-success">{message}</div>}

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Αποστολή..." : "Αποστολή email"}
                </button>

                <button
                  type="button"
                  className="register-link-button"
                  onClick={showLogin}
                >
                  ← Επιστροφή στη σύνδεση
                </button>
              </form>
            </>
          )}
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
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
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
    setToolsMenuOpen(false);
  };

  const handleToolsNavigation = (page) => {
    setActivePage(page);
    setToolsMenuOpen(false);
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
            ↪
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
            toolsMenuOpen={toolsMenuOpen}
            onToggleTools={() => setToolsMenuOpen((current) => !current)}
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
            active={activePage === "cards"}
            onClick={() => setActivePage("cards")}
            icon="▣"
          >
            Κάρτες τροφοδοσίας
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
          <div className="nav-title second">ΕΡΓΑΛΕΙΑ</div>

          <SidebarButton
            active={toolsMenuOpen}
            onClick={() => setToolsMenuOpen((current) => !current)}
            icon="◆"
          >
            Εργαλεία
          </SidebarButton>

          {toolsMenuOpen && (
            <div className="tools-submenu">
              <button
                type="button"
                className={`tools-submenu-item ${
                  activePage === "receipts" ? "active" : ""
                }`}
                onClick={() => handleToolsNavigation("receipts")}
              >
                <span>▣</span>
                Αποδείξεις
              </button>
              <button
                type="button"
                className={`tools-submenu-item ${
                  activePage === "recurring-expenses" ? "active" : ""
                }`}
                onClick={() => handleToolsNavigation("recurring-expenses")}
              >
                <span>↻</span>
                Επαναλαμβανόμενα έξοδα
              </button>

              <button
                type="button"
                className={`tools-submenu-item ${
                  activePage === "debt-planner" ? "active" : ""
                }`}
                onClick={() => handleToolsNavigation("debt-planner")}
              >
                <span>€</span>
                Αποπληρωμή χρεών
              </button>

              <button
                type="button"
                className={`tools-submenu-item ${
                  activePage === "forecast" ? "active" : ""
                }`}
                onClick={() => handleToolsNavigation("forecast")}
              >
                <span>↗</span>
                Προβλέψεις
              </button>

              <button
                type="button"
                className={`tools-submenu-item ${
                  activePage === "spending-limit" ? "active" : ""
                }`}
                onClick={() => handleToolsNavigation("spending-limit")}
              >
                <span>◉</span>
                Διαθέσιμο ποσό
              </button>
            </div>
          )}
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
            ↪
          </button>
        </div>
      </aside>
      {toolsMenuOpen && (
        <div className="mobile-tools-popup">
          <button
            type="button"
            className={`mobile-tools-popup-item ${
              activePage === "receipts" ? "active" : ""
            }`}
            onClick={() => handleToolsNavigation("receipts")}
          >
            <span>▣</span>
            Αποδείξεις
          </button>
          <button
            type="button"
            className={`mobile-tools-popup-item ${
              activePage === "recurring-expenses" ? "active" : ""
            }`}
            onClick={() => handleToolsNavigation("recurring-expenses")}
          >
            <span>↻</span>
            Επαναλαμβανόμενα έξοδα
          </button>

          <button
            type="button"
            className={`mobile-tools-popup-item ${
              activePage === "debt-planner" ? "active" : ""
            }`}
            onClick={() => handleToolsNavigation("debt-planner")}
          >
            <span>€</span>
            Αποπληρωμή χρεών
          </button>

          <button
            type="button"
            className={`mobile-tools-popup-item ${
              activePage === "forecast" ? "active" : ""
            }`}
            onClick={() => handleToolsNavigation("forecast")}
          >
            <span>↗</span>
            Προβλέψεις
          </button>

          <button
            type="button"
            className={`mobile-tools-popup-item ${
              activePage === "spending-limit" ? "active" : ""
            }`}
            onClick={() => handleToolsNavigation("spending-limit")}
          >
            <span>◉</span>
            Διαθέσιμο ποσό
          </button>
        </div>
      )}
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
        {activePage === "cards" && <BenefitCardsPage session={session} />}

        {activePage === "budget" && <BudgetPage session={session} />}

        {activePage === "calendar" && <CalendarPage session={session} />}

        {activePage === "statistics" && <StatisticsPage session={session} />}

        {activePage === "providers" && <ProvidersPage session={session} />}

        {activePage === "history" && (
          <HistoryPage session={session} onEditDebt={handleEditDebt} />
        )}

        {activePage === "settings" && <SettingsPage session={session} />}
        {activePage === "receipts" && <ReceiptsPage session={session} />}
        {activePage === "recurring-expenses" && (
          <RecurringExpensesPage session={session} />
        )}
        {activePage === "debt-planner" && <DebtPlannerPage session={session} />}

        {activePage === "forecast" && <ForecastPage session={session} />}

        {activePage === "spending-limit" && (
          <SpendingLimitPage session={session} />
        )}

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

function MobileNavigation({
  activePage,
  onNavigate,
  toolsMenuOpen,
  onToggleTools,
}) {
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

      {/* =====================================================
          ΕΡΓΑΛΕΙΑ - MOBILE
      ===================================================== */}

      <div className="mobile-tools-section">
        <button
          type="button"
          className={`mobile-nav-item mobile-tools-button ${
            toolsMenuOpen ? "active" : ""
          }`}
          onClick={onToggleTools}
          aria-expanded={toolsMenuOpen}
        >
          <span>◆</span>
          <span className="mobile-tools-label">Εργαλεία</span>
          <span className="mobile-tools-arrow">
            {toolsMenuOpen ? "▲" : "▼"}
          </span>
        </button>

        {toolsMenuOpen && (
          <div className="mobile-tools-submenu">
            <button
              type="button"
              className={`mobile-tools-submenu-item ${
                activePage === "receipts" ? "active" : ""
              }`}
              onClick={() => onNavigate("receipts")}
            >
              <span>▣</span>
              Αποδείξεις
            </button>

            <button
              type="button"
              className={`mobile-tools-submenu-item ${
                activePage === "debt-planner" ? "active" : ""
              }`}
              onClick={() => onNavigate("debt-planner")}
            >
              <span>€</span>
              Αποπληρωμή χρεών
            </button>

            <button
              type="button"
              className={`mobile-tools-submenu-item ${
                activePage === "forecast" ? "active" : ""
              }`}
              onClick={() => onNavigate("forecast")}
            >
              <span>↗</span>
              Προβλέψεις
            </button>

            <button
              type="button"
              className={`mobile-tools-submenu-item ${
                activePage === "spending-limit" ? "active" : ""
              }`}
              onClick={() => onNavigate("spending-limit")}
            >
              <span>◉</span>
              Διαθέσιμο ποσό
            </button>
          </div>
        )}
      </div>
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

    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();

    const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const nextMonth = new Date(year, month + 1, 1);

    const endDate = `${nextMonth.getFullYear()}-${String(
      nextMonth.getMonth() + 1,
    ).padStart(2, "0")}-01`;

    const [
      debtsResult,
      incomeResult,
      expensesResult,
      recurringResult,
      installmentsResult,
      loansResult,
    ] = await Promise.all([
      /* =====================================================
         ΚΑΝΟΝΙΚΕΣ ΟΦΕΙΛΕΣ
      ===================================================== */

      supabase
        .from("debts")
        .select("*")
        .eq("user_id", session.user.id)
        .or(
          `and(due_date.gte.${startDate},due_date.lt.${endDate}),and(due_date.lt.${startDate},paid.eq.false)`,
        ),

      /* =====================================================
         ΕΣΟΔΑ
      ===================================================== */

      supabase
        .from("income")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("income_date", startDate)
        .lt("income_date", endDate),

      /* =====================================================
         ΕΞΟΔΑ
      ===================================================== */

      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", session.user.id)
        .gte("expense_date", startDate)
        .lt("expense_date", endDate),

      /* =====================================================
         ΠΑΓΙΕΣ ΟΦΕΙΛΕΣ
      ===================================================== */

      supabase
        .from("recurring_debts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("active", true),

      /* =====================================================
         ΔΟΣΕΙΣ
      ===================================================== */

      supabase
        .from("installments")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("active", true),

      /* =====================================================
         ΔΑΝΕΙΑ
      ===================================================== */

      supabase
        .from("loans")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("active", true),
    ]);

    /* =======================================================
       ERRORS
    ======================================================= */

    if (debtsResult.error) {
      console.error("Dashboard debts:", debtsResult.error);
    }

    if (incomeResult.error) {
      console.error("Dashboard income:", incomeResult.error);
    }

    if (expensesResult.error) {
      console.error("Dashboard expenses:", expensesResult.error);
    }

    if (recurringResult.error) {
      console.error("Dashboard recurring debts:", recurringResult.error);
    }

    if (installmentsResult.error) {
      console.error("Dashboard installments:", installmentsResult.error);
    }

    if (loansResult.error) {
      console.error("Dashboard loans:", loansResult.error);
    }

    /* =======================================================
       ΚΑΝΟΝΙΚΕΣ ΟΦΕΙΛΕΣ
    ======================================================= */

    const normalDebts = (debtsResult.data || []).map((item) => ({
      ...item,
      sourceType: "debt",
    }));

    /* =======================================================
       ΠΑΓΙΕΣ ΟΦΕΙΛΕΣ
    ======================================================= */

    const recurringDebts = (recurringResult.data || []).map((item) => ({
      id: `recurring-${item.id}`,
      user_id: item.user_id,
      provider: item.provider,
      description: `${item.description || item.provider} · Πάγια οφειλή`,
      amount: Number(item.amount || 0),
      due_date: getDateInSelectedMonth(year, month, item.day_of_month),
      paid: false,
      sourceType: "recurring",
      sourceId: item.id,
    }));

    /* =======================================================
       ΔΟΣΕΙΣ
    ======================================================= */

    const installmentDebts = [];

    (installmentsResult.data || []).forEach((item) => {
      if (!item.next_due_date) {
        return;
      }

      const remainingInstallments =
        Number(item.total_installments || 0) -
        Number(item.paid_installments || 0);

      if (remainingInstallments <= 0) {
        return;
      }

      const monthDifference = getMonthDifference(
        item.next_due_date,
        selectedMonth,
      );

      if (
        monthDifference === null ||
        monthDifference < 0 ||
        monthDifference >= remainingInstallments
      ) {
        return;
      }

      const dueDate = addMonthsToDateString(
        item.next_due_date,
        monthDifference,
      );

      installmentDebts.push({
        id: `installment-${item.id}-${monthDifference}`,
        user_id: item.user_id,
        provider: item.provider,
        description: `${item.description || "Δόση"} · Δόση ${
          Number(item.paid_installments || 0) + monthDifference + 1
        }/${item.total_installments}`,
        amount: Number(item.installment_amount || 0),
        due_date: dueDate,
        paid: false,
        sourceType: "installment",
        sourceId: item.id,
      });
    });

    /* =======================================================
       ΔΑΝΕΙΑ
    ======================================================= */

    const loanDebts = [];

    (loansResult.data || []).forEach((item) => {
      if (
        !item.next_due_date ||
        Number(item.remaining_amount || 0) <= 0 ||
        Number(item.monthly_payment || 0) <= 0
      ) {
        return;
      }

      const monthDifference = getMonthDifference(
        item.next_due_date,
        selectedMonth,
      );

      if (monthDifference === null || monthDifference < 0) {
        return;
      }

      const remainingAmount = Number(item.remaining_amount || 0);

      const monthlyPayment = Number(item.monthly_payment || 0);

      const futurePayments = Math.ceil(remainingAmount / monthlyPayment);

      if (monthDifference >= futurePayments) {
        return;
      }

      const remainingAtThisMonth =
        remainingAmount - monthDifference * monthlyPayment;

      const paymentAmount = Math.min(
        monthlyPayment,
        Math.max(0, remainingAtThisMonth),
      );

      const dueDate = addMonthsToDateString(
        item.next_due_date,
        monthDifference,
      );

      loanDebts.push({
        id: `loan-${item.id}-${monthDifference}`,
        user_id: item.user_id,
        provider: item.provider,
        description: `${item.description || "Δάνειο"} · Μηνιαία δόση`,
        amount: paymentAmount,
        due_date: dueDate,
        paid: false,
        sourceType: "loan",
        sourceId: item.id,
      });
    });

    /* =======================================================
       ΕΝΟΠΟΙΗΣΗ ΟΛΩΝ ΤΩΝ ΥΠΟΧΡΕΩΣΕΩΝ
    ======================================================= */

    const combinedDebts = [
      ...normalDebts,
      ...recurringDebts,
      ...installmentDebts,
      ...loanDebts,
    ];

    setDebts(sortDebts(combinedDebts));
    setIncome(incomeResult.data || []);
    setExpenses(expensesResult.data || []);

    setLoading(false);
  };

  /* =======================================================
     ΣΥΝΟΛΑ ΟΦΕΙΛΩΝ
  ======================================================= */

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

  /* =======================================================
     ΕΣΟΔΑ
  ======================================================= */

  const totalIncome = useMemo(
    () => income.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [income],
  );

  /* =======================================================
     ΕΞΟΔΑ
     
     totalExpenses = ΟΛΑ τα έξοδα του μήνα
     
     bankExpenses = μόνο Τράπεζα / Μετρητά
     
     cardExpenses = μόνο κάρτες τροφοδοσίας
  ======================================================= */

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses],
  );

  const bankExpenses = useMemo(
    () =>
      expenses
        .filter(
          (item) => !item.payment_method || item.payment_method === "bank",
        )
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses],
  );

  const cardExpenses = useMemo(
    () =>
      expenses
        .filter((item) => item.payment_method === "card")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses],
  );

  /* =======================================================
     ΥΠΟΛΟΙΠΟ
     
     Το υπόλοιπο της τράπεζας ΔΕΝ επηρεάζεται από αγορές
     που έγιναν με κάρτα τροφοδοσίας.
     
     Έσοδα
     - Τράπεζα / Μετρητά
     - ΟΛΕΣ οι υποχρεώσεις
    ======================================================= */

  const balance = totalIncome - bankExpenses - totalDebts;

  /* =======================================================
     MONTH
  ======================================================= */

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
      {/* =====================================================
          HEADER
      ===================================================== */}

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

      {/* =====================================================
          SUMMARY
      ===================================================== */}

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

      {/* =====================================================
          PAID / PENDING
      ===================================================== */}

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

      {/* =====================================================
          ALL DEBTS / OBLIGATIONS
      ===================================================== */}

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>
              Οφειλές{" "}
              <span className="section-month">
                {formatMonth(selectedMonth)}
              </span>
            </h2>

            <p>{debts.length} υποχρεώσεις</p>
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
              Δεν υπάρχουν οφειλές ή άλλες υποχρεώσεις για τον επιλεγμένο μήνα.
            </div>
          ) : (
            debts.map((debt) =>
              debt.sourceType === "debt" ? (
                <DebtRow
                  key={debt.id}
                  debt={debt}
                  onEdit={onEditDebt}
                  selectedMonth={selectedMonth}
                />
              ) : (
                <DashboardLinkedDebtRow key={debt.id} debt={debt} />
              ),
            )
          )}
        </div>
      </div>

      {/* =====================================================
          DASHBOARD PANELS
      ===================================================== */}

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

          {/* =================================================
              ΠΛΗΡΟΦΟΡΙΕΣ ΚΑΡΤΩΝ
          ================================================= */}

          <div
            style={{
              marginTop: "18px",
              paddingTop: "16px",
              borderTop: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                ΕΞΟΔΑ ΚΑΡΤΩΝ ΤΡΟΦΟΔΟΣΙΑΣ
              </span>

              <strong
                style={{
                  fontSize: "18px",
                }}
              >
                {formatCurrency(cardExpenses)}
              </strong>
            </div>

            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "11px",
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                ΤΡΑΠΕΖΑ / ΜΕΤΡΗΤΑ
              </span>

              <strong
                style={{
                  fontSize: "18px",
                }}
              >
                {formatCurrency(bankExpenses)}
              </strong>
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
  const upcomingDebts = [...debts]
    .filter((debt) => {
      if (!debt.due_date) return false;

      const dueDate = new Date(`${debt.due_date}T00:00:00`);
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      const diffTime = dueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays >= 0 && diffDays <= 30 && !debt.paid;
    })
    .sort((a, b) => {
      return new Date(a.due_date) - new Date(b.due_date);
    });

  if (upcomingDebts.length === 0) {
    return (
      <div className="upcoming-section">
        <div className="section-header">
          <h3>ΕΠΟΜΕΝΕΣ ΟΦΕΙΛΕΣ</h3>
        </div>

        <div className="empty-state">Δεν υπάρχουν επόμενες οφειλές.</div>
      </div>
    );
  }

  return (
    <div className="upcoming-section">
      <div className="section-header">
        <h3>ΕΠΟΜΕΝΕΣ ΟΦΕΙΛΕΣ</h3>
      </div>

      <div className="upcoming-list">
        {upcomingDebts.map((debt) => {
          let sourceLabel = "";

          if (debt.sourceType === "recurring") {
            sourceLabel = "Πάγια οφειλή";
          } else if (debt.sourceType === "installment") {
            sourceLabel = "Δόση";
          } else if (debt.sourceType === "loan") {
            sourceLabel = "Δάνειο";
          }

          return (
            <div
              className="upcoming-item"
              key={`${debt.sourceType || "debt"}-${debt.id}`}
            >
              <div className="upcoming-left">
                <div className="upcoming-icon">
                  {debt.provider?.charAt(0)?.toUpperCase() || "€"}
                </div>

                <div className="upcoming-info">
                  <strong>{debt.provider}</strong>

                  <span>{debt.description || sourceLabel || "Οφειλή"}</span>
                </div>
              </div>

              <div className="upcoming-right">
                <span className="upcoming-date">
                  {formatDate(debt.due_date)}
                </span>

                <strong className="upcoming-amount">
                  {formatCurrency(debt.amount)}
                </strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* =========================================================
   DASHBOARD LINKED DEBT
   Εμφάνιση πάγιων οφειλών / δόσεων / δανείων
========================================================= */

function DashboardLinkedDebtRow({ debt }) {
  let sourceLabel = "Υποχρέωση";

  if (debt.sourceType === "recurring") {
    sourceLabel = "Πάγια οφειλή";
  }

  if (debt.sourceType === "installment") {
    sourceLabel = "Δόση";
  }

  if (debt.sourceType === "loan") {
    sourceLabel = "Δάνειο";
  }

  const formattedDate = debt.due_date ? formatDate(debt.due_date) : "-";

  return (
    <div className="debt-row debt-row-pending">
      <div className="debt-icon">
        {debt.provider?.charAt(0)?.toUpperCase() || "€"}
      </div>

      <div className="debt-info">
        <strong>{debt.provider}</strong>

        <span>{debt.description || sourceLabel}</span>
      </div>

      <div className="debt-due">
        <span>ΛΗΞΗ</span>

        <strong>{formattedDate}</strong>
      </div>

      <div className="debt-amount">
        <strong>{formatCurrency(debt.amount)}</strong>
      </div>

      <span className="debt-status-button pending">{sourceLabel}</span>
    </div>
  );
}

/* =========================================================
   DEBT ROW
========================================================= */

function DebtRow({ debt, onEdit, selectedMonth = null }) {
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const status = getDebtStatus(debt);

  const formattedDate = debt.due_date ? formatDate(debt.due_date) : "-";
  const selectedMonthStart = selectedMonth
    ? `${selectedMonth.getFullYear()}-${String(
        selectedMonth.getMonth() + 1,
      ).padStart(2, "0")}-01`
    : null;

  const isCarriedOver =
    !debt.paid &&
    selectedMonth &&
    debt.due_date &&
    debt.due_date < selectedMonthStart;
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
        <span>
          {debt.description || "Οφειλή"}
          {isCarriedOver && (
            <small className="debt-carried-over">Μεταφέρθηκε</small>
          )}
        </span>
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
   FORECAST
========================================================= */

function ForecastPage({ session }) {
  const [months, setMonths] = useState(3);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    loadForecast();
  }, [session, months]);

  const loadForecast = async () => {
    setLoading(true);
    setError("");

    try {
      const userId = session.user.id;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

      const endDate = new Date(
        today.getFullYear(),
        today.getMonth() + months + 1,
        0,
      );

      const start = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1,
      ).padStart(2, "0")}-01`;

      const end = `${endDate.getFullYear()}-${String(
        endDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

      const [
        incomeResult,
        expensesResult,
        debtsResult,
        recurringExpensesResult,
      ] = await Promise.all([
        supabase
          .from("income")
          .select("*")
          .eq("user_id", userId)
          .gte("income_date", start)
          .lte("income_date", end),

        supabase
          .from("expenses")
          .select("*")
          .eq("user_id", userId)
          .gte("expense_date", start)
          .lte("expense_date", end),

        supabase.from("debts").select("*").eq("user_id", userId),

        supabase
          .from("recurring_expenses")
          .select("*")
          .eq("user_id", userId)
          .eq("active", true),
      ]);

      if (incomeResult.error) {
        throw incomeResult.error;
      }

      if (expensesResult.error) {
        throw expensesResult.error;
      }

      if (debtsResult.error) {
        throw debtsResult.error;
      }

      if (recurringExpensesResult.error) {
        throw recurringExpensesResult.error;
      }

      const income = incomeResult.data || [];
      const expenses = expensesResult.data || [];
      const debts = debtsResult.data || [];
      const recurringExpenses = recurringExpensesResult.data || [];
      const result = [];
      let cumulativeBalance = 0;

      for (let index = 0; index < months; index++) {
        const monthDate = new Date(
          today.getFullYear(),
          today.getMonth() + index,
          1,
        );

        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();

        const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;

        const nextMonth = new Date(year, month + 1, 1);

        const monthEnd = `${nextMonth.getFullYear()}-${String(
          nextMonth.getMonth() + 1,
        ).padStart(2, "0")}-01`;

        const actualMonthIncome = income
          .filter((item) => {
            return (
              item.income_date >= monthStart && item.income_date < monthEnd
            );
          })
          .reduce((sum, item) => {
            return sum + Number(item.amount || 0);
          }, 0);

        let monthIncome = actualMonthIncome;

        /*
         * Για τους επόμενους μήνες χρησιμοποιούμε
         * τα επαναλαμβανόμενα έσοδα ως πρόβλεψη.
         *
         * Παίρνουμε την πιο πρόσφατη καταχώρηση
         * για κάθε διαφορετικό επαναλαμβανόμενο έσοδο,
         * ώστε παλιές μηνιαίες καταχωρήσεις να μην
         * αθροίζονται μεταξύ τους.
         */

        if (index > 0) {
          const recurringIncomeMap = new Map();

          income
            .filter((item) => item.recurring)
            .sort((a, b) => {
              return String(b.income_date).localeCompare(String(a.income_date));
            })
            .forEach((item) => {
              const key = `${item.description || ""}|${item.category || ""}`;

              if (!recurringIncomeMap.has(key)) {
                recurringIncomeMap.set(key, item);
              }
            });

          const recurringIncome = Array.from(
            recurringIncomeMap.values(),
          ).reduce((sum, item) => {
            return sum + Number(item.amount || 0);
          }, 0);

          monthIncome = recurringIncome;
        }

        const monthExpenses = expenses
          .filter((item) => {
            return (
              item.expense_date >= monthStart && item.expense_date < monthEnd
            );
          })
          .reduce((sum, item) => {
            return sum + Number(item.amount || 0);
          }, 0);

        const recurringTotal = recurringExpenses.reduce((sum, item) => {
          const day = Number(item.day_of_month || 1);

          const recurringDate = new Date(
            year,
            month,
            Math.min(day, new Date(year, month + 1, 0).getDate()),
          );

          const recurringDateString = `${year}-${String(month + 1).padStart(
            2,
            "0",
          )}-${String(recurringDate.getDate()).padStart(2, "0")}`;

          const starts =
            !item.start_date || recurringDateString >= item.start_date;

          const ends = !item.end_date || recurringDateString <= item.end_date;

          if (starts && ends) {
            return sum + Number(item.amount || 0);
          }

          return sum;
        }, 0);

        /*
         * Υπολογίζουμε τις οφειλές του μήνα.
         *
         * Μια απλήρωτη παλαιότερη οφειλή μεταφέρεται
         * στον επόμενο μήνα και συνεχίζει να εμφανίζεται
         * μέχρι να πληρωθεί.
         */

        const monthDebtsList = debts.filter((debt) => {
          if (debt.paid) {
            return debt.due_date >= monthStart && debt.due_date < monthEnd;
          }

          return debt.due_date < monthEnd;
        });

        const monthDebts = monthDebtsList.reduce((sum, debt) => {
          return sum + Number(debt.amount || 0);
        }, 0);

        const newDebts = monthDebtsList
          .filter((debt) => {
            return debt.due_date >= monthStart && debt.due_date < monthEnd;
          })
          .reduce((sum, debt) => {
            return sum + Number(debt.amount || 0);
          }, 0);

        const carriedDebts = monthDebtsList
          .filter((debt) => {
            return !debt.paid && debt.due_date < monthStart;
          })
          .reduce((sum, debt) => {
            return sum + Number(debt.amount || 0);
          }, 0);

        const totalExpenses = monthExpenses + recurringTotal;

        const monthlyBalance = monthIncome - totalExpenses - monthDebts;

        cumulativeBalance += monthlyBalance;

        const balance = cumulativeBalance;
        result.push({
          date: monthDate,
          income: monthIncome,
          expenses: totalExpenses,
          debts: monthDebts,
          newDebts,
          carriedDebts,
          balance,
        });
      }

      setForecast(result);
    } catch (err) {
      console.error("Forecast error:", err);
      setError("Δεν ήταν δυνατή η φόρτωση των προβλέψεων.");
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (date) => {
    return date.toLocaleDateString("el-GR", {
      month: "long",
      year: "numeric",
    });
  };

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("el-GR", {
      style: "currency",
      currency: "EUR",
    });
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Προβλέψεις</h1>
          <p>
            Δες πώς αναμένεται να διαμορφωθούν τα οικονομικά σου τους επόμενους
            μήνες.
          </p>
        </div>

        <div className="forecast-period-selector">
          <button
            type="button"
            className={months === 3 ? "active" : ""}
            onClick={() => setMonths(3)}
          >
            3 μήνες
          </button>

          <button
            type="button"
            className={months === 6 ? "active" : ""}
            onClick={() => setMonths(6)}
          >
            6 μήνες
          </button>

          <button
            type="button"
            className={months === 12 ? "active" : ""}
            onClick={() => setMonths(12)}
          >
            12 μήνες
          </button>
        </div>
      </div>

      {loading && (
        <div className="form-card">
          <p>Υπολογισμός προβλέψεων...</p>
        </div>
      )}

      {!loading && error && (
        <div className="form-card">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="forecast-list">
          {forecast.map((item) => (
            <div
              className="form-card forecast-card"
              key={`${item.date.getFullYear()}-${item.date.getMonth()}`}
            >
              <div className="forecast-card-header">
                <div>
                  <h2>{formatMonth(item.date)}</h2>

                  {item.balance >= 0 ? (
                    <small className="forecast-status positive">
                      Θετική πρόβλεψη
                    </small>
                  ) : (
                    <small className="forecast-status negative">
                      Αρνητική πρόβλεψη
                    </small>
                  )}
                  {item.balance < 0 && (
                    <div className="forecast-warning">
                      ⚠️ Προβλέπεται έλλειμμα{" "}
                      <strong>{formatMoney(Math.abs(item.balance))}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="forecast-grid">
                <div className="forecast-item">
                  <span>Έσοδα</span>
                  <strong>{formatMoney(item.income)}</strong>
                </div>

                <div className="forecast-item">
                  <span>Έξοδα</span>
                  <strong>{formatMoney(item.expenses)}</strong>
                </div>

                <div className="forecast-item">
                  <span>Οφειλές</span>

                  <strong>{formatMoney(item.debts)}</strong>

                  {item.newDebts > 0 && (
                    <small>Νέες: {formatMoney(item.newDebts)}</small>
                  )}

                  {item.carriedDebts > 0 && (
                    <small className="forecast-carried">
                      Μεταφέρθηκαν: {formatMoney(item.carriedDebts)}
                    </small>
                  )}
                </div>

                <div className="forecast-item">
                  <span>Προβλεπόμενο υπόλοιπο</span>
                  <strong
                    className={
                      item.balance >= 0
                        ? "forecast-positive"
                        : "forecast-negative"
                    }
                  >
                    {formatMoney(item.balance)}
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
    interest_rate: "",
    monthly_payment: "",
    due_date: getTodayDateString(),
    category: "",
  });

  const filteredProviders = providers.filter(
    (item) => item.category === selectedCategory,
  );
  const interestAllowed =
    selectedCategory === "Αγορές / Δόσεις" ||
    selectedCategory === "Πιστωτικές / Χρηματοδοτήσεις";
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

    const numericInterestRate = form.interest_rate
      ? Number(String(form.interest_rate).replace(",", "."))
      : null;

    const numericMonthlyPayment = form.monthly_payment
      ? Number(String(form.monthly_payment).replace(",", "."))
      : null;

    if (
      numericInterestRate !== null &&
      (!Number.isFinite(numericInterestRate) || numericInterestRate < 0)
    ) {
      alert("Συμπλήρωσε έγκυρο επιτόκιο.");
      return;
    }

    if (
      numericMonthlyPayment !== null &&
      (!Number.isFinite(numericMonthlyPayment) || numericMonthlyPayment <= 0)
    ) {
      alert("Συμπλήρωσε έγκυρη μηνιαία δόση.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("debts").insert({
      user_id: session.user.id,
      provider: form.provider,
      description: form.description.trim() || "Οφειλή",
      amount: numericAmount,

      interest_rate: numericInterestRate,

      monthly_payment: numericMonthlyPayment,

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
                  {loadingProviders ? "Φόρτωση..." : "Επίλεξε κατηγορία"}
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

            {interestAllowed && (
              <div className="form-group">
                <label>Επιτόκιο (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="π.χ. 18,50"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </div>
            )}

            <div className="form-group">
              <label>Μηνιαία δόση (€)</label>

              <input
                type="text"
                inputMode="decimal"
                name="monthly_payment"
                placeholder="π.χ. 150,00"
                value={form.monthly_payment}
                onChange={handleChange}
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
   DEBT PLANNER
========================================================= */

function DebtPlannerPage({ session }) {
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState("snowball");
  const [extraPayment, setExtraPayment] = useState("");

  useEffect(() => {
    if (!session?.user?.id) return;

    loadDebts();
  }, [session]);

  const loadDebts = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("paid", false)
        .order("due_date", { ascending: true });

      if (error) throw error;

      setDebts(data || []);
    } catch (error) {
      console.error("Debt planner error:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedDebts = [...debts].sort((a, b) => {
    const amountA = Number(a.amount || 0);
    const amountB = Number(b.amount || 0);

    const rateA =
      a.interest_rate !== null &&
      a.interest_rate !== undefined &&
      a.interest_rate !== ""
        ? Number(a.interest_rate)
        : null;

    const rateB =
      b.interest_rate !== null &&
      b.interest_rate !== undefined &&
      b.interest_rate !== ""
        ? Number(b.interest_rate)
        : null;

    if (method === "snowball") {
      return amountA - amountB;
    }

    // Avalanche:
    // μεγαλύτερο επιτόκιο πρώτα.
    // Οφειλές χωρίς επιτόκιο μπαίνουν στο τέλος.
    if (rateA === null && rateB === null) {
      return amountA - amountB;
    }

    if (rateA === null) {
      return 1;
    }

    if (rateB === null) {
      return -1;
    }

    if (rateA !== rateB) {
      return rateB - rateA;
    }

    // Αν έχουν ίδιο επιτόκιο,
    // προτεραιότητα στη μικρότερη οφειλή.
    return amountA - amountB;
  });
  const calculatePayoffPlan = () => {
    const balances = sortedDebts.map((debt) => ({
      id: debt.id,

      balance: Number(debt.amount || 0),

      interestRate:
        debt.interest_rate !== null &&
        debt.interest_rate !== undefined &&
        debt.interest_rate !== ""
          ? Number(debt.interest_rate)
          : 0,

      monthlyPayment:
        debt.monthly_payment !== null &&
        debt.monthly_payment !== undefined &&
        debt.monthly_payment !== ""
          ? Number(debt.monthly_payment)
          : 0,

      paidOff: false,
    }));

    const monthlyExtra = Math.max(
      0,
      Number(String(extraPayment || "0").replace(",", ".")),
    );

    if (!balances.length) {
      return {
        months: null,
        totalInterest: 0,
      };
    }

    let month = 0;
    let totalInterest = 0;

    // Δόσεις που έχουν απελευθερωθεί από προηγούμενες
    // εξοφλημένες οφειλές.
    let freedPayments = 0;

    while (balances.some((item) => item.balance > 0) && month < 600) {
      month += 1;

      // =====================================================
      // 1. Υπολογισμός τόκων
      // =====================================================

      balances.forEach((item) => {
        if (item.balance <= 0 || item.interestRate <= 0) {
          return;
        }

        const monthlyInterest = item.balance * (item.interestRate / 100 / 12);

        item.balance += monthlyInterest;
        totalInterest += monthlyInterest;
      });

      // =====================================================
      // 2. Κανονικές μηνιαίες δόσεις
      // =====================================================

      balances.forEach((item) => {
        if (item.balance <= 0 || item.monthlyPayment <= 0) {
          return;
        }

        const payment = Math.min(item.balance, item.monthlyPayment);

        item.balance -= payment;

        // Αν η κανονική δόση εξόφλησε την οφειλή,
        // η δόση της απελευθερώνεται από τον επόμενο μήνα.
        if (item.balance <= 0 && !item.paidOff) {
          item.balance = 0;
          item.paidOff = true;

          freedPayments += item.monthlyPayment;
        }
      });

      // =====================================================
      // 3. Extra ποσό + δόσεις που έχουν απελευθερωθεί
      // =====================================================

      let availableExtra = monthlyExtra + freedPayments;

      // Οι απελευθερωμένες δόσεις χρησιμοποιούνται
      // από αυτόν τον μήνα και μετά.
      freedPayments = 0;

      // =====================================================
      // 4. Η επιπλέον πληρωμή πηγαίνει στην πρώτη
      //    ενεργή οφειλή της σειράς Snowball/Avalanche
      // =====================================================

      for (const item of balances) {
        if (item.balance <= 0 || availableExtra <= 0) {
          continue;
        }

        const payment = Math.min(item.balance, availableExtra);

        item.balance -= payment;
        availableExtra -= payment;

        // Αν η οφειλή εξοφληθεί μέσω της επιπλέον
        // πληρωμής, η κανονική της δόση θα
        // απελευθερωθεί από τον επόμενο μήνα.
        if (item.balance <= 0 && !item.paidOff) {
          item.balance = 0;
          item.paidOff = true;

          freedPayments += item.monthlyPayment;
        }
      }

      // =====================================================
      // 5. Καθαρισμός μικρών υπολοίπων
      // =====================================================

      balances.forEach((item) => {
        if (item.balance < 0.01) {
          item.balance = 0;
        }
      });
    }

    return {
      months: balances.some((item) => item.balance > 0) ? null : month,

      totalInterest: Number(totalInterest.toFixed(2)),
    };
  };

  const payoffPlan = calculatePayoffPlan();
  const totalDebt = debts.reduce(
    (sum, debt) => sum + Number(debt.amount || 0),
    0,
  );

  const extra = Number(extraPayment || 0);

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("el-GR", {
      style: "currency",
      currency: "EUR",
    });
  };

  return (
    <div className="page-content">
      <div className="page-header debt-planner-page-header">
        <div>
          <h1>Αποπληρωμή χρεών</h1>
          <p>Οργάνωσε τις οφειλές σου και δημιούργησε ένα πλάνο αποπληρωμής.</p>
        </div>
      </div>

      {loading ? (
        <div className="form-card">
          <p>Φόρτωση οφειλών...</p>
        </div>
      ) : (
        <>
          <div className="debt-planner-controls form-card">
            <div>
              <span className="planner-label">Μέθοδος αποπληρωμής</span>

              <div className="planner-methods">
                <div className="debt-planner-methods">
                  <button
                    type="button"
                    className={
                      method === "snowball"
                        ? "debt-planner-method active"
                        : "debt-planner-method"
                    }
                    onClick={() => setMethod("snowball")}
                  >
                    Snowball
                  </button>

                  <button
                    type="button"
                    className={
                      method === "avalanche"
                        ? "debt-planner-method active"
                        : "debt-planner-method"
                    }
                    onClick={() => setMethod("avalanche")}
                  >
                    Avalanche
                  </button>
                </div>
              </div>
            </div>

            <div className="planner-extra">
              <label>Επιπλέον ποσό / μήνα</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={extraPayment}
                onChange={(e) => setExtraPayment(e.target.value)}
                placeholder="0,00 €"
              />
            </div>
          </div>

          <div className="forecast-summary-grid debt-planner-summary">
            <div className="summary-card">
              <span>ΕΝΕΡΓΕΣ ΟΦΕΙΛΕΣ</span>
              <strong>{debts.length}</strong>
            </div>

            <div className="summary-card">
              <span>ΣΥΝΟΛΙΚΟ ΧΡΕΟΣ</span>
              <strong>{formatMoney(totalDebt)}</strong>
            </div>

            <div className="summary-card">
              <span>ΕΠΙΠΛΕΟΝ / ΜΗΝΑ</span>
              <strong>{formatMoney(extra)}</strong>
            </div>

            <div className="summary-card">
              <span>ΜΕΘΟΔΟΣ</span>
              <strong>
                {method === "snowball" ? "Snowball" : "Avalanche"}
              </strong>
            </div>
          </div>
          {payoffPlan.months !== null && (
            <div className="debt-payoff-result">
              <div>
                <span>ΕΚΤΙΜΩΜΕΝΟΣ ΧΡΟΝΟΣ ΕΞΟΦΛΗΣΗΣ</span>
                <strong>
                  {payoffPlan.months}{" "}
                  {payoffPlan.months === 1 ? "μήνας" : "μήνες"}
                </strong>
              </div>

              <div>
                <span>ΣΥΝΟΛΙΚΟΙ ΤΟΚΟΙ</span>
                <strong>{formatMoney(payoffPlan.totalInterest)}</strong>
              </div>
            </div>
          )}

          {payoffPlan.months === null && extra > 0 && (
            <div className="debt-payoff-result">
              <div>
                <span>ΠΛΑΝΟ ΑΠΟΠΛΗΡΩΜΗΣ</span>
                <strong>Δεν ολοκληρώνεται με το συγκεκριμένο ποσό.</strong>
              </div>
            </div>
          )}

          <div className="form-card debt-planner-list">
            <div className="debt-planner-list-header">
              <h2>Σειρά αποπληρωμής</h2>

              <span>
                {method === "snowball"
                  ? "Από τη μικρότερη προς τη μεγαλύτερη οφειλή"
                  : "Με βάση την προτεραιότητα των οφειλών"}
              </span>
            </div>

            {sortedDebts.length === 0 ? (
              <p>Δεν υπάρχουν απλήρωτες οφειλές.</p>
            ) : (
              <div className="debt-planner-items">
                {sortedDebts.map((debt, index) => (
                  <div className="debt-planner-item" key={debt.id}>
                    <div className="debt-planner-number">{index + 1}</div>

                    <div className="debt-planner-main">
                      <div className="debt-planner-title">{debt.provider}</div>

                      <div className="debt-planner-description">
                        {debt.description || "Οφειλή"}
                      </div>

                      <div className="debt-planner-meta">
                        {debt.interest_rate !== null &&
                          debt.interest_rate !== undefined &&
                          debt.interest_rate !== "" && (
                            <span>
                              Επιτόκιο: {Number(debt.interest_rate).toFixed(2)}%
                            </span>
                          )}

                        {debt.monthly_payment !== null &&
                          debt.monthly_payment !== undefined &&
                          debt.monthly_payment !== "" && (
                            <span>
                              Δόση: {formatMoney(debt.monthly_payment)}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="debt-planner-amount">
                      {formatMoney(debt.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
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
  const interestAllowed =
    category === "Αγορές / Δόσεις" ||
    category === "Πιστωτικές / Χρηματοδοτήσεις";

  const [description, setDescription] = useState(debt.description || "");
  const [amount, setAmount] = useState(debt.amount ?? "");
  const [monthlyPayment, setMonthlyPayment] = useState(
    debt.monthly_payment ?? "",
  );

  const [interestRate, setInterestRate] = useState(debt.interest_rate ?? "");

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

  if (provider && !providerOptions.some((item) => item.name === provider)) {
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
      (item) => item.name === providerName && item.category === category,
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

    const numericInterestRate =
      interestRate !== "" && interestRate !== null
        ? normalizeAmount(interestRate)
        : null;

    if (
      numericInterestRate !== null &&
      (!Number.isFinite(numericInterestRate) || numericInterestRate < 0)
    ) {
      setError("Το επιτόκιο δεν είναι έγκυρο.");
      return;
    }

    const numericMonthlyPayment =
      monthlyPayment !== "" && monthlyPayment !== null
        ? normalizeAmount(monthlyPayment)
        : null;

    if (
      numericMonthlyPayment !== null &&
      (!Number.isFinite(numericMonthlyPayment) || numericMonthlyPayment <= 0)
    ) {
      setError("Η μηνιαία δόση δεν είναι έγκυρη.");
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
        interest_rate: numericInterestRate,
        monthly_payment: numericMonthlyPayment,
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
                placeholder="π.χ. 18,50"
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
                placeholder="π.χ. 150,00"
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
  const [cards, setCards] = useState([]);

  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(true);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [recurring, setRecurring] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [paymentCardId, setPaymentCardId] = useState("");

  const [saving, setSaving] = useState(false);
  const [qrData, setQrData] = useState("");
  const [qrScanning, setQrScanning] = useState(false);
  useEffect(() => {
    if (!qrScanning) return;

    const scanner = new Html5Qrcode("expense-qr-reader");

    scanner
      .start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setQrData(decodedText);
          setQrScanning(false);

          scanner
            .stop()
            .then(() => scanner.clear())
            .catch((error) => console.error("QR stop:", error));
        },
        () => {},
      )
      .catch((error) => {
        console.error("QR camera:", error);
        setQrScanning(false);
        alert("Δεν ήταν δυνατή η εκκίνηση της κάμερας.");
      });

    return () => {
      scanner
        .stop()
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, [qrScanning]);
  useEffect(() => {
    loadExpenses();
    loadCards();
  }, [session.user.id]);

  /* =======================================================
     ΕΞΟΔΑ
  ======================================================= */

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
      console.error("Expenses:", error);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  /* =======================================================
     ΚΑΡΤΕΣ ΤΡΟΦΟΔΟΣΙΑΣ
  ======================================================= */

  const loadCards = async () => {
    setCardsLoading(true);

    const { data, error } = await supabase
      .from("benefit_cards")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("active", true)
      .order("name", {
        ascending: true,
      });

    if (error) {
      console.error("Benefit cards:", error);
      setCards([]);
    } else {
      setCards(data || []);
    }

    setCardsLoading(false);
  };

  /* =======================================================
     ΑΛΛΑΓΗ ΤΡΟΠΟΥ ΠΛΗΡΩΜΗΣ
  ======================================================= */

  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);

    if (value !== "card") {
      setPaymentCardId("");
    }
  };
  /* =======================================================

     QR ΑΠΟΔΕΙΞΗΣ

  ======================================================= */

  const handleExpenseQrScan = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const scanner = new Html5Qrcode("expense-qr-reader");

      const decodedText = await scanner.scanFile(file, true);

      setQrData(decodedText);

      alert(`Το QR διαβάστηκε επιτυχώς:\n\n${decodedText}`);
    } catch (error) {
      console.error("QR scan error:", error);

      alert("Δεν ήταν δυνατή η ανάγνωση του QR της απόδειξης.");
    }

    event.target.value = "";
  };

  /* =======================================================
     ΑΠΟΘΗΚΕΥΣΗ
  ======================================================= */

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

    /* -------------------------------------------------------
       Αν επιλέχθηκε κάρτα, πρέπει να έχει επιλεγεί συγκεκριμένη
       κάρτα τροφοδοσίας.
    ------------------------------------------------------- */

    if (paymentMethod === "card" && !paymentCardId) {
      alert("Επιλέξτε την κάρτα τροφοδοσίας.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("expenses").insert({
      user_id: session.user.id,
      description: description.trim(),
      category: category || null,
      amount: numericAmount,
      expense_date: expenseDate,
      recurring,

      payment_method: paymentMethod,
      payment_card_id: paymentMethod === "card" ? Number(paymentCardId) : null,
    });

    setSaving(false);

    if (error) {
      console.error("Save expense:", error);
      alert(`Δεν ήταν δυνατή η αποθήκευση. ${error.message}`);
      return;
    }

    /* -------------------------------------------------------
       Reset φόρμας
    ------------------------------------------------------- */

    setDescription("");
    setCategory("");
    setAmount("");
    setExpenseDate(getTodayDateString());
    setRecurring(false);
    setPaymentMethod("bank");
    setPaymentCardId("");

    await loadExpenses();
  };

  /* =======================================================
     ΔΙΑΓΡΑΦΗ
  ======================================================= */

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

  /* =======================================================
     ΣΥΝΟΛΑ
  ======================================================= */

  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const bankTotal = items
    .filter((item) => !item.payment_method || item.payment_method === "bank")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const cardTotal = items
    .filter((item) => item.payment_method === "card")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  /* =======================================================
     ΒΟΗΘΗΤΙΚΟ ΓΙΑ ΤΗΝ ΕΜΦΑΝΙΣΗ ΤΗΣ ΚΑΡΤΑΣ
  ======================================================= */

  const getCardName = (cardId) => {
    if (!cardId) {
      return "";
    }

    const card = cards.find((item) => String(item.id) === String(cardId));

    return card?.name || "Κάρτα τροφοδοσίας";
  };

  return (
    <>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="welcome">
        <h2>Έξοδα</h2>

        <p>Καταχωρήστε και παρακολουθήστε τα έξοδά σας.</p>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="summary-grid">
        <div className="summary-card">
          <span>ΣΥΝΟΛΟ ΕΞΟΔΩΝ</span>

          <strong>{formatCurrency(total)}</strong>
        </div>

        <div className="summary-card">
          <span>ΤΡΑΠΕΖΑ / ΜΕΤΡΗΤΑ</span>

          <strong>{formatCurrency(bankTotal)}</strong>
        </div>

        <div className="summary-card">
          <span>ΚΑΡΤΕΣ</span>

          <strong>{formatCurrency(cardTotal)}</strong>
        </div>

        <div className="summary-card">
          <span>ΚΑΤΑΧΩΡΗΣΕΙΣ</span>

          <strong>{items.length}</strong>
        </div>
      </div>

      {/* =====================================================
          FORM
      ===================================================== */}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* -------------------------------------------------
             ΠΕΡΙΓΡΑΦΗ
          ------------------------------------------------- */}

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

          {/* -------------------------------------------------
             ΚΑΤΗΓΟΡΙΑ / ΠΟΣΟ
          ------------------------------------------------- */}

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

          {/* -------------------------------------------------
             ΗΜΕΡΟΜΗΝΙΑ / ΕΠΑΝΑΛΑΜΒΑΝΟΜΕΝΟ
          ------------------------------------------------- */}

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

          {/* -------------------------------------------------
             ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ
          ------------------------------------------------- */}

          <div className="form-row">
            <div className="form-field">
              <label>Τρόπος πληρωμής</label>

              <select
                value={paymentMethod}
                onChange={(event) =>
                  handlePaymentMethodChange(event.target.value)
                }
              >
                <option value="bank">Τράπεζα / Μετρητά</option>

                <option value="card">Κάρτα τροφοδοσίας</option>
              </select>
            </div>

            {/* -------------------------------------------------
               ΕΠΙΛΟΓΗ ΚΑΡΤΑΣ
            ------------------------------------------------- */}

            {paymentMethod === "card" && (
              <div className="form-field">
                <label>Κάρτα</label>

                <select
                  value={paymentCardId}
                  onChange={(event) => setPaymentCardId(event.target.value)}
                  disabled={cardsLoading}
                >
                  <option value="">
                    {cardsLoading
                      ? "Φόρτωση καρτών..."
                      : cards.length === 0
                        ? "Δεν υπάρχουν κάρτες"
                        : "Επιλέξτε κάρτα"}
                  </option>

                  {cards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* -------------------------------------------------
             ACTIONS
          ------------------------------------------------- */}
          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setQrScanning(true)}
            >
              ▣ Σάρωση QR απόδειξης
            </button>

            <button type="submit" disabled={saving}>
              {saving ? "Αποθήκευση..." : "+ Προσθήκη εξόδου"}
            </button>
          </div>

          {qrScanning && (
            <div
              id="expense-qr-reader"
              style={{
                width: "100%",
                maxWidth: "420px",
                margin: "16px auto 0",
              }}
            />
          )}
        </form>
      </div>

      {/* =====================================================
          LIST
      ===================================================== */}

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
                    {item.payment_method === "card"
                      ? ` · ${getCardName(item.payment_card_id)}`
                      : " · Τράπεζα / Μετρητά"}
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
function BenefitCardsPage({ session }) {
  const [cards, setCards] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [initialAmount, setInitialAmount] = useState("");
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [reloadAmount, setReloadAmount] = useState("");
  const [reloadFrequency, setReloadFrequency] = useState("monthly");
  const [reloadDay, setReloadDay] = useState("1");

  useEffect(() => {
    loadCards();
  }, [session.user.id]);

  /* =======================================================
     ΦΟΡΤΩΣΗ ΚΑΡΤΩΝ + ΕΞΟΔΩΝ
  ======================================================= */

  const loadCards = async () => {
    setLoading(true);

    const [cardsResult, expensesResult] = await Promise.all([
      supabase
        .from("benefit_cards")
        .select("*")
        .eq("user_id", session.user.id)
        .order("name", {
          ascending: true,
        }),

      supabase
        .from("expenses")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("payment_method", "card")
        .order("expense_date", {
          ascending: true,
        }),
    ]);

    if (cardsResult.error) {
      console.error("Benefit cards:", cardsResult.error);
    }

    if (expensesResult.error) {
      console.error("Card expenses:", expensesResult.error);
    }

    setCards(cardsResult.data || []);
    setExpenses(expensesResult.data || []);

    setLoading(false);
  };

  /* =======================================================
     ΠΡΟΣΘΗΚΗ ΚΑΡΤΑΣ
  ======================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      alert("Συμπληρώστε το όνομα της κάρτας.");
      return;
    }

    if (!initialAmount) {
      alert("Συμπληρώστε το αρχικό ποσό.");
      return;
    }

    if (!startDate) {
      alert("Συμπληρώστε την ημερομηνία έναρξης.");
      return;
    }

    if (!reloadAmount) {
      alert("Συμπληρώστε το ποσό ανανέωσης.");
      return;
    }

    const numericInitialAmount = normalizeAmount(initialAmount);
    const numericReloadAmount = normalizeAmount(reloadAmount);
    const numericReloadDay = Number(reloadDay);

    if (!Number.isFinite(numericInitialAmount) || numericInitialAmount < 0) {
      alert("Το αρχικό ποσό δεν είναι έγκυρο.");
      return;
    }

    if (!Number.isFinite(numericReloadAmount) || numericReloadAmount < 0) {
      alert("Το ποσό ανανέωσης δεν είναι έγκυρο.");
      return;
    }

    if (
      !Number.isInteger(numericReloadDay) ||
      numericReloadDay < 1 ||
      numericReloadDay > 31
    ) {
      alert("Η ημέρα ανανέωσης πρέπει να είναι από 1 έως 31.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("benefit_cards").insert({
      user_id: session.user.id,
      name: name.trim(),
      initial_amount: numericInitialAmount,
      start_date: startDate,
      reload_amount: numericReloadAmount,
      reload_frequency: reloadFrequency,
      reload_day: numericReloadDay,
      active: true,
    });

    setSaving(false);

    if (error) {
      console.error("Add benefit card:", error);

      alert(`Δεν ήταν δυνατή η αποθήκευση. ${error.message}`);

      return;
    }

    setName("");
    setInitialAmount("");
    setStartDate(getTodayDateString());
    setReloadAmount("");
    setReloadFrequency("monthly");
    setReloadDay("1");

    await loadCards();
  };

  /* =======================================================
     ΔΙΑΓΡΑΦΗ
  ======================================================= */

  const handleDelete = async (id, cardName) => {
    const confirmed = window.confirm(
      `Θέλετε να διαγράψετε την κάρτα "${cardName}";`,
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("benefit_cards")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Delete benefit card:", error);

      alert(`Δεν ήταν δυνατή η διαγραφή. ${error.message}`);

      return;
    }

    await loadCards();
  };

  /* =======================================================
     ΜΕΤΑΤΡΟΠΗ ΣΥΧΝΟΤΗΤΑΣ ΣΕ ΜΗΝΕΣ
  ======================================================= */

  const getFrequencyMonths = (frequency) => {
    switch (frequency) {
      case "monthly":
        return 1;

      case "bimonthly":
        return 2;

      case "quarterly":
        return 3;

      case "semiannual":
        return 6;

      case "yearly":
        return 12;

      default:
        return 1;
    }
  };

  /* =======================================================
     SAFE ΗΜΕΡΟΜΗΝΙΑ
     
     Αν π.χ. η ημέρα είναι 31 και ο μήνας έχει 30 ημέρες,
     χρησιμοποιούμε την τελευταία ημέρα του μήνα.
  ======================================================= */

  const createSafeDate = (year, monthIndex, day) => {
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();

    return new Date(year, monthIndex, Math.min(day, lastDayOfMonth));
  };

  /* =======================================================
     ΠΛΗΘΟΣ ΑΝΑΝΕΩΣΕΩΝ ΜΕΧΡΙ ΣΗΜΕΡΑ
     
     ΣΗΜΑΝΤΙΚΟ:
     Το initial_amount είναι το αρχικό ποσό της κάρτας.
     
     Οι ανανεώσεις ξεκινούν ΜΕΤΑ την start_date.
     
     Άρα δεν προσθέτουμε αναδρομικά ανανεώσεις από Ιανουάριο.
  ======================================================= */

  const getReloadCountUntilDate = (card, targetDate) => {
    if (!card || !card.start_date || !targetDate) {
      return 0;
    }

    const start = new Date(`${card.start_date}T00:00:00`);
    const target = new Date(targetDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(target.getTime())) {
      return 0;
    }

    /*
     * Αν η ημερομηνία έναρξης είναι στο μέλλον,
     * δεν υπάρχει ακόμη καμία ανανέωση.
     */

    if (target <= start) {
      return 0;
    }

    const frequencyMonths = getFrequencyMonths(card.reload_frequency);

    const reloadDay = Number(card.reload_day || 1);

    /*
     * Βρίσκουμε την πρώτη προγραμματισμένη ανανέωση
     * μετά την ημερομηνία έναρξης.
     */

    let current = createSafeDate(
      start.getFullYear(),
      start.getMonth(),
      reloadDay,
    );

    /*
     * Η πρώτη ανανέωση πρέπει να είναι ΑΥΣΤΗΡΑ μετά
     * την ημερομηνία έναρξης.
     */

    if (current <= start) {
      current = createSafeDate(
        start.getFullYear(),
        start.getMonth() + frequencyMonths,
        reloadDay,
      );
    }

    let count = 0;

    while (current <= target) {
      count += 1;

      current = createSafeDate(
        current.getFullYear(),
        current.getMonth() + frequencyMonths,
        reloadDay,
      );
    }

    return count;
  };

  /* =======================================================
     ΠΛΗΘΟΣ ΑΝΑΝΕΩΣΕΩΝ ΜΕΧΡΙ ΣΗΜΕΡΑ
  ======================================================= */

  const getReloadCountUntilToday = (card) => {
    const today = new Date();

    return getReloadCountUntilDate(card, today);
  };

  /* =======================================================
     ΕΞΟΔΑ ΣΥΓΚΕΚΡΙΜΕΝΗΣ ΚΑΡΤΑΣ
  ======================================================= */

  const getCardExpenses = (cardId) => {
    return expenses.filter(
      (item) => String(item.payment_card_id) === String(cardId),
    );
  };

  /* =======================================================
     ΣΥΝΟΛΙΚΑ ΕΞΟΔΑ ΚΑΡΤΑΣ
  ======================================================= */

  const getCardUsedAmount = (cardId) => {
    return getCardExpenses(cardId).reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0,
    );
  };

  /* =======================================================
     ΣΥΝΟΛΟ ΑΝΑΝΕΩΣΕΩΝ ΚΑΡΤΑΣ
  ======================================================= */

  const getCardReloadAmount = (card) => {
    const reloadCount = getReloadCountUntilToday(card);

    return Number(card.reload_amount || 0) * reloadCount;
  };

  /* =======================================================
     ΔΙΑΘΕΣΙΜΟ ΥΠΟΛΟΙΠΟ ΚΑΡΤΑΣ
  ======================================================= */

  const getCardBalance = (card) => {
    const initial = Number(card.initial_amount || 0);

    const reloads = getCardReloadAmount(card);

    const used = getCardUsedAmount(card.id);

    return Math.max(0, initial + reloads - used);
  };

  /* =======================================================
     ΣΥΧΝΟΤΗΤΑ ΓΙΑ ΕΜΦΑΝΙΣΗ
  ======================================================= */

  const getFrequencyLabel = (frequency) => {
    switch (frequency) {
      case "monthly":
        return "Κάθε μήνα";

      case "bimonthly":
        return "Κάθε 2 μήνες";

      case "quarterly":
        return "Κάθε 3 μήνες";

      case "semiannual":
        return "Κάθε 6 μήνες";

      case "yearly":
        return "Κάθε χρόνο";

      default:
        return "Κάθε μήνα";
    }
  };

  /* =======================================================
     ΣΥΝΟΛΑ
  ======================================================= */

  const totalInitial = cards.reduce(
    (sum, card) => sum + Number(card.initial_amount || 0),
    0,
  );

  const totalReloads = cards.reduce(
    (sum, card) => sum + getCardReloadAmount(card),
    0,
  );

  const totalUsed = cards.reduce(
    (sum, card) => sum + getCardUsedAmount(card.id),
    0,
  );

  const totalBalance = cards.reduce(
    (sum, card) => sum + getCardBalance(card),
    0,
  );

  return (
    <>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="welcome">
        <h2>Κάρτες τροφοδοσίας</h2>

        <p>Διαχειριστείτε τις κάρτες παροχών και τα διαθέσιμα υπόλοιπά τους.</p>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="summary-grid">
        <div className="summary-card">
          <span>ΑΡΧΙΚΟ ΣΥΝΟΛΟ</span>

          <strong>{formatCurrency(totalInitial)}</strong>
        </div>

        <div className="summary-card">
          <span>ΑΝΑΝΕΩΣΕΙΣ</span>

          <strong>{formatCurrency(totalReloads)}</strong>
        </div>

        <div className="summary-card">
          <span>ΧΡΗΣΙΜΟΠΟΙΗΘΗΚΑΝ</span>

          <strong>{formatCurrency(totalUsed)}</strong>
        </div>

        <div className="summary-card">
          <span>ΔΙΑΘΕΣΙΜΟ ΥΠΟΛΟΙΠΟ</span>

          <strong>{formatCurrency(totalBalance)}</strong>
        </div>
      </div>

      {/* =====================================================
          ΝΕΑ ΚΑΡΤΑ
      ===================================================== */}

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label>Όνομα κάρτας</label>
              <select value={name} onChange={(e) => setName(e.target.value)}>
                <option value="">Επιλέξτε κάρτα</option>
                <option value="Up Hellas">Up Hellas</option>
                <option value="Edenred">Edenred</option>
                <option value="Άλλη">Άλλη κάρτα</option>
              </select>
            </div>

            <div className="form-field">
              <label>Αρχικό ποσό (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={initialAmount}
                onChange={(event) => setInitialAmount(event.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Ημερομηνία έναρξης</label>

              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label>Ποσό ανανέωσης (€)</label>

              <input
                type="text"
                inputMode="decimal"
                value={reloadAmount}
                onChange={(event) => setReloadAmount(event.target.value)}
                placeholder="π.χ. 150,00"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Ανανέωση</label>

              <select
                value={reloadFrequency}
                onChange={(event) => setReloadFrequency(event.target.value)}
              >
                <option value="monthly">Κάθε μήνα</option>

                <option value="bimonthly">Κάθε 2 μήνες</option>

                <option value="quarterly">Κάθε 3 μήνες</option>

                <option value="semiannual">Κάθε 6 μήνες</option>

                <option value="yearly">Κάθε χρόνο</option>
              </select>
            </div>

            <div className="form-field">
              <label>Ημέρα ανανέωσης</label>

              <select
                value={reloadDay}
                onChange={(event) => setReloadDay(event.target.value)}
              >
                {Array.from({ length: 31 }, (_, index) => index + 1).map(
                  (day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Κατάσταση</label>

              <input type="text" value="Ενεργή" disabled />
            </div>

            <div className="form-field">
              <label>&nbsp;</label>

              <div className="form-actions">
                <span></span>

                <button type="submit" disabled={saving}>
                  {saving ? "Αποθήκευση..." : "+ Προσθήκη κάρτας"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* =====================================================
          ΚΑΡΤΕΣ
      ===================================================== */}

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Οι κάρτες μου</h2>

            <p>{cards.length} κάρτες</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : cards.length === 0 ? (
          <div className="empty-state">Δεν υπάρχουν καταχωρημένες κάρτες.</div>
        ) : (
          <div className="simple-record-list">
            {cards.map((card) => {
              const initial = Number(card.initial_amount || 0);

              const reloads = getCardReloadAmount(card);

              const used = getCardUsedAmount(card.id);

              const balance = getCardBalance(card);

              const reloadCount = getReloadCountUntilToday(card);

              return (
                <div className="simple-record" key={card.id}>
                  <div>
                    <strong>{card.name}</strong>

                    <span>
                      Αρχικό: {formatCurrency(initial)}
                      {" · "}
                      Έναρξη:{" "}
                      {card.start_date ? formatDate(card.start_date) : "-"}
                    </span>

                    <span>
                      Ανανέωση: {formatCurrency(card.reload_amount)}
                      {" · "}
                      {getFrequencyLabel(card.reload_frequency)}
                      {" · Ημέρα "}
                      {card.reload_day}
                    </span>

                    <span>
                      Ανανεώσεις: {reloadCount}
                      {" ("}
                      {formatCurrency(reloads)}
                      {")"}
                      {" · "}
                      Χρησιμοποιήθηκαν: {formatCurrency(used)}
                    </span>
                  </div>

                  <strong>{formatCurrency(balance)}</strong>

                  <button
                    type="button"
                    className="delete-debt-button"
                    onClick={() => handleDelete(card.id, card.name)}
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
        .or(
          `and(due_date.gte.${start},due_date.lt.${end}),and(due_date.lt.${start},paid.eq.false)`,
        ),

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
        .or(
          `and(due_date.gte.${start},due_date.lt.${end}),and(due_date.lt.${start},paid.eq.false)`,
        ),

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

  const balance = totalIncome - totalExpenses - totalDebts;

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

                  <span>{formatProviderCategory(provider.category)}</span>
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const [daysBefore, setDaysBefore] = useState(3);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* -------------------------------------------------------
     LOAD SETTINGS
  ------------------------------------------------------- */

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const settings = await loadNotificationSettings(session);

        setNotificationsEnabled(Boolean(settings.enabled));

        setDaysBefore(Number(settings.days_before ?? 3));
      } catch (err) {
        console.error(err);

        setError("Δεν ήταν δυνατή η φόρτωση των ρυθμίσεων ειδοποιήσεων.");
      } finally {
        setLoading(false);
      }
    }

    if (session?.user?.id) {
      loadSettings();
    }
  }, [session]);

  /* -------------------------------------------------------
     TOGGLE NOTIFICATIONS
  ------------------------------------------------------- */

  async function handleNotificationToggle() {
    if (saving) {
      return;
    }

    setMessage("");
    setError("");
    setSaving(true);

    const newValue = !notificationsEnabled;

    try {
      /* -----------------------------------------------
         ENABLE
      ----------------------------------------------- */

      if (newValue) {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
          setNotificationsEnabled(false);

          setError("Η άδεια για τις ειδοποιήσεις δεν δόθηκε.");

          return;
        }

        await subscribeToPush(session);

        await saveNotificationSettings(session, true, daysBefore);

        setNotificationsEnabled(true);

        setMessage("Οι ειδοποιήσεις ενεργοποιήθηκαν επιτυχώς.");
      } else {
        /* -----------------------------------------------
         DISABLE
      ----------------------------------------------- */
        await unsubscribeFromPush(session);

        await saveNotificationSettings(session, false, daysBefore);

        setNotificationsEnabled(false);

        setMessage("Οι ειδοποιήσεις απενεργοποιήθηκαν.");
      }
    } catch (err) {
      console.error("Notification toggle error:", err);

      setNotificationsEnabled(false);

      setError(err?.message || "Δεν ήταν δυνατή η ρύθμιση των ειδοποιήσεων.");
    } finally {
      setSaving(false);
    }
  }

  /* -------------------------------------------------------
     DAYS BEFORE
  ------------------------------------------------------- */

  async function handleDaysBeforeChange(event) {
    const value = Number(event.target.value);

    setDaysBefore(value);

    if (!notificationsEnabled) {
      return;
    }

    try {
      await saveNotificationSettings(session, true, value);

      setMessage("Η ρύθμιση των ειδοποιήσεων ενημερώθηκε.");

      setError("");
    } catch (err) {
      console.error(err);

      setError("Δεν ήταν δυνατή η αποθήκευση της ρύθμισης.");
    }
  }

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Ρυθμίσεις</h1>

        <p>Διαχείριση εφαρμογής και ειδοποιήσεων</p>
      </div>

      {/* NOTIFICATIONS */}

      <div className="dashboard-panel settings-panel">
        <div className="dashboard-panel-header">
          <h3>Ειδοποιήσεις</h3>

          <p>Λάβε ειδοποίηση για τις επερχόμενες οφειλές σου.</p>
        </div>

        <div className="setting-row">
          <div>
            <strong>Ειδοποιήσεις οφειλών</strong>

            <span>Εμφάνιση push notification στη συσκευή σου.</span>
          </div>

          <label className="switch">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={handleNotificationToggle}
              disabled={loading || saving}
            />

            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-row">
          <div>
            <strong>Ειδοποίηση πριν την οφειλή</strong>

            <span>Πόσες ημέρες πριν την ημερομηνία πληρωμής.</span>
          </div>

          <select
            className="setting-select"
            value={daysBefore}
            onChange={handleDaysBeforeChange}
            disabled={!notificationsEnabled || loading || saving}
          >
            <option value={1}>1 ημέρα</option>

            <option value={2}>2 ημέρες</option>

            <option value={3}>3 ημέρες</option>

            <option value={5}>5 ημέρες</option>

            <option value={7}>7 ημέρες</option>
          </select>
        </div>

        {message && (
          <div
            style={{
              marginTop: "15px",
              padding: "10px 12px",
              borderRadius: "6px",
              background: "#eaf7ef",
              color: "#08752f",
              fontSize: "10px",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: "15px",
              padding: "10px 12px",
              borderRadius: "6px",
              background: "#fff0f0",
              color: "#c62828",
              fontSize: "10px",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* ACCOUNT */}

      <div className="dashboard-panel settings-panel">
        <div className="dashboard-panel-header">
          <h3>Λογαριασμός</h3>

          <p>Τα στοιχεία του λογαριασμού σου.</p>
        </div>

        <div className="account-info">
          <div>
            <span>Email</span>

            <strong>{session?.user?.email || "-"}</strong>
          </div>
        </div>
      </div>

      {/* APP INFO */}

      <div className="dashboard-panel">
        <div className="dashboard-panel-header">
          <h3>MY DEBTS</h3>

          <p>Personal Finance & Debt Manager</p>
        </div>

        <div className="app-info">
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
