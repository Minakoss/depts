import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

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

function getTodayDateString() {
  const today = new Date();

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(today.getDate()).padStart(2, "0")}`;
}

function normalizeAmount(value) {
  if (typeof value === "number") {
    return value;
  }

  const normalized = String(value).trim().replace(/\./g, "").replace(",", ".");

  return Number(normalized);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(`${value}T00:00:00`).toLocaleDateString("el-GR");
}

export default function RecurringExpensesPage({ session }) {
  const [items, setItems] = useState([]);
  const [cards, setCards] = useState([]);

  const [loading, setLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const [startDate, setStartDate] = useState(getTodayDateString());
  const [endDate, setEndDate] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [paymentCardId, setPaymentCardId] = useState("");

  useEffect(() => {
    loadRecurringExpenses();
    loadCards();
  }, [session?.user?.id]);

  const loadRecurringExpenses = async () => {
    if (!session?.user?.id) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("recurring_expenses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("active", { ascending: false })
      .order("day_of_month", { ascending: true });

    if (error) {
      console.error("Recurring expenses:", error);
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  };

  const loadCards = async () => {
    if (!session?.user?.id) return;

    setCardsLoading(true);

    const { data, error } = await supabase
      .from("benefit_cards")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("Benefit cards:", error);
      setCards([]);
    } else {
      setCards(data || []);
    }

    setCardsLoading(false);
  };

  const handlePaymentMethodChange = (event) => {
    const value = event.target.value;

    setPaymentMethod(value);

    if (value !== "card") {
      setPaymentCardId("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!description.trim()) {
      alert("Συμπληρώστε περιγραφή.");
      return;
    }

    const numericAmount = normalizeAmount(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Συμπληρώστε έγκυρο ποσό.");
      return;
    }

    const numericDay = Number(dayOfMonth);

    if (!Number.isInteger(numericDay) || numericDay < 1 || numericDay > 31) {
      alert("Η ημέρα πρέπει να είναι από 1 έως 31.");
      return;
    }

    if (!startDate) {
      alert("Συμπληρώστε ημερομηνία έναρξης.");
      return;
    }

    if (endDate && endDate < startDate) {
      alert("Η ημερομηνία λήξης δεν μπορεί να είναι πριν από την έναρξη.");
      return;
    }

    if (paymentMethod === "card" && !paymentCardId) {
      alert("Επιλέξτε την κάρτα τροφοδοσίας.");
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("recurring_expenses").insert({
      user_id: session.user.id,
      description: description.trim(),
      category: category || null,
      amount: numericAmount,
      day_of_month: numericDay,
      start_date: startDate,
      end_date: endDate || null,
      payment_method: paymentMethod,
      payment_card_id: paymentMethod === "card" ? Number(paymentCardId) : null,
      active: true,
    });

    setSaving(false);

    if (error) {
      console.error("Save recurring expense:", error);
      alert(`Δεν ήταν δυνατή η αποθήκευση. ${error.message}`);
      return;
    }

    setDescription("");
    setCategory("");
    setAmount("");
    setDayOfMonth("1");
    setStartDate(getTodayDateString());
    setEndDate("");
    setPaymentMethod("bank");
    setPaymentCardId("");

    await loadRecurringExpenses();
  };

  const toggleActive = async (item) => {
    const { error } = await supabase
      .from("recurring_expenses")
      .update({
        active: !item.active,
      })
      .eq("id", item.id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Toggle recurring expense:", error);
      alert("Δεν ήταν δυνατή η αλλαγή της κατάστασης.");
      return;
    }

    await loadRecurringExpenses();
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Θέλετε σίγουρα να διαγράψετε αυτό το επαναλαμβανόμενο έξοδο;",
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("recurring_expenses")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Delete recurring expense:", error);
      alert("Δεν ήταν δυνατή η διαγραφή.");
      return;
    }

    await loadRecurringExpenses();
  };

  const getCardName = (cardId) => {
    if (!cardId) {
      return "";
    }

    const card = cards.find((item) => String(item.id) === String(cardId));

    return card?.name || "Κάρτα τροφοδοσίας";
  };

  return (
    <>
      <div className="welcome">
        <h2>Επαναλαμβανόμενα έξοδα</h2>

        <p>Ορίστε τα έξοδα που επαναλαμβάνονται κάθε μήνα.</p>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Περιγραφή</label>

            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="π.χ. Netflix"
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

            <div className="form-field">
              <label>Ημερομηνία έναρξης</label>

              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Ημερομηνία λήξης</label>

              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />

              <small className="form-help">
                Αφήστε κενό αν το έξοδο συνεχίζεται χωρίς ημερομηνία λήξης.
              </small>
            </div>

            <div className="form-field">
              <label>Τρόπος πληρωμής</label>

              <select
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <option value="bank">Τράπεζα / Μετρητά</option>
                <option value="card">Κάρτα τροφοδοσίας</option>
              </select>
            </div>
          </div>

          {paymentMethod === "card" && (
            <div className="form-field">
              <label>Κάρτα τροφοδοσίας</label>

              <select
                value={paymentCardId}
                onChange={(event) => setPaymentCardId(event.target.value)}
                disabled={cardsLoading}
                required
              >
                <option value="">
                  {cardsLoading ? "Φόρτωση..." : "Επιλέξτε κάρτα"}
                </option>

                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                  </option>
                ))}
              </select>

              {!cardsLoading && cards.length === 0 && (
                <small className="form-help">
                  Δεν υπάρχουν ενεργές κάρτες τροφοδοσίας.
                </small>
              )}
            </div>
          )}

          <div className="form-actions">
            <span></span>

            <button type="submit" disabled={saving}>
              {saving ? "Αποθήκευση..." : "+ Προσθήκη επαναλαμβανόμενου εξόδου"}
            </button>
          </div>
        </form>
      </div>

      <div className="debts-section">
        <div className="section-header">
          <div>
            <h2>Τα επαναλαμβανόμενα έξοδά μου</h2>

            <p>{items.length} καταχωρήσεις</p>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Φόρτωση...</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            Δεν υπάρχουν επαναλαμβανόμενα έξοδα.
          </div>
        ) : (
          <div className="simple-record-list">
            {items.map((item) => (
              <div className="simple-record" key={item.id}>
                <div>
                  <strong>{item.description}</strong>

                  <span>
                    {item.category || "Άλλο έξοδο"}
                    {" · "}
                    Κάθε {item.day_of_month} του μήνα
                    {" · "}
                    Έναρξη: {formatDate(item.start_date)}
                    {item.end_date
                      ? ` · Λήξη: ${formatDate(item.end_date)}`
                      : ""}
                    {item.payment_method === "card"
                      ? ` · ${getCardName(item.payment_card_id)}`
                      : ""}
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
