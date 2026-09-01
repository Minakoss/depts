import { useState } from "react";
import "./App.css";

const initialDebts = [
  {
    id: 1,
    provider: "ΔΕΗ",
    description: "Λογαριασμός ηλεκτρικού",
    amount: 85.4,
    dueDate: "2026-09-05",
    paid: false,
  },
  {
    id: 2,
    provider: "ΟΤΕ",
    description: "Internet & σταθερό",
    amount: 32.9,
    dueDate: "2026-09-10",
    paid: true,
  },
  {
    id: 3,
    provider: "ΕΥΔΑΠ",
    description: "Λογαριασμός νερού",
    amount: 18.5,
    dueDate: "2026-09-15",
    paid: false,
  },
];

function App() {
  const [debts, setDebts] = useState(initialDebts);

  const [selectedMonth, setSelectedMonth] = useState(new Date(2026, 8, 1));

  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    provider: "",
    description: "",
    amount: "",
    dueDate: "",
  });

  const monthName = selectedMonth.toLocaleDateString("el-GR", {
    month: "long",
    year: "numeric",
  });

  const changeMonth = (amount) => {
    setSelectedMonth(
      new Date(
        selectedMonth.getFullYear(),
        selectedMonth.getMonth() + amount,
        1,
      ),
    );
  };

  const selectedYear = selectedMonth.getFullYear();
  const selectedMonthNumber = selectedMonth.getMonth();

  const monthDebts = debts.filter((debt) => {
    const date = new Date(debt.dueDate);

    return (
      date.getFullYear() === selectedYear &&
      date.getMonth() === selectedMonthNumber
    );
  });

  const togglePaid = (id) => {
    setDebts(
      debts.map((debt) =>
        debt.id === id ? { ...debt, paid: !debt.paid } : debt,
      ),
    );
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const addDebt = (event) => {
    event.preventDefault();

    if (!formData.provider || !formData.amount || !formData.dueDate) {
      return;
    }

    const newDebt = {
      id: Date.now(),
      provider: formData.provider,
      description: formData.description || "Λογαριασμός",
      amount: Number(formData.amount),
      dueDate: formData.dueDate,
      paid: false,
    };

    setDebts([...debts, newDebt]);

    setFormData({
      provider: "",
      description: "",
      amount: "",
      dueDate: "",
    });

    setShowForm(false);
  };

  const total = monthDebts.reduce((sum, debt) => sum + debt.amount, 0);

  const paid = monthDebts
    .filter((debt) => debt.paid)
    .reduce((sum, debt) => sum + debt.amount, 0);

  const pending = total - paid;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("el-GR");
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Οι Οφειλές μου</h1>
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
        <section className="summary">
          <div className="summary-card">
            <span>Σύνολο</span>
            <strong>{total.toFixed(2)} €</strong>
          </div>

          <div className="summary-card">
            <span>Πληρωμένα</span>
            <strong>{paid.toFixed(2)} €</strong>
          </div>

          <div className="summary-card">
            <span>Εκκρεμή</span>
            <strong>{pending.toFixed(2)} €</strong>
          </div>
        </section>

        <section className="debts-section">
          <div className="section-header">
            <div>
              <h2>
                Οφειλές{" "}
                {selectedMonth.toLocaleDateString("el-GR", { month: "long" })}
              </h2>

              <p>{monthDebts.length} οφειλές</p>
            </div>

            <button className="add-button" onClick={() => setShowForm(true)}>
              + Νέα οφειλή
            </button>
          </div>

          {showForm && (
            <div className="form-container">
              <h3>Νέα οφειλή</h3>

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
                    />
                  </div>

                  <div className="form-field">
                    <label>Ημερομηνία λήξης</label>

                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
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

          <div className="debts-list">
            {monthDebts.length === 0 ? (
              <div className="empty-state">
                <h3>Δεν υπάρχουν οφειλές</h3>
                <p>Δεν έχεις καταχωρημένες οφειλές για αυτόν τον μήνα.</p>
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
                    <span>Λήξη</span>

                    <strong>{formatDate(debt.dueDate)}</strong>
                  </div>

                  <div className="debt-amount">{debt.amount.toFixed(2)} €</div>

                  <button
                    className={`status ${debt.paid ? "paid" : "pending"}`}
                    onClick={() => togglePaid(debt.id)}
                  >
                    {debt.paid ? "✓ Πληρώθηκε" : "Εκκρεμεί"}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
