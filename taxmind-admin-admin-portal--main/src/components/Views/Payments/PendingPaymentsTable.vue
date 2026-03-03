<template>
    <div>
         <div class="payments-table-header">
                <div class="header-cell">Invoice No</div>
                <div class="header-cell">Customer Name</div>
                <div class="header-cell">Payment Method</div>
                <div class="header-cell">Transaction ID</div>
                <div class="header-cell">Date & Time</div>
                <div class="header-cell">Amount</div>
              </div>

              <!-- Table rows -->
              <div class="payments-table-row" v-for="(row, i) in rows" :key="i">
                <div class="body-cell">{{ row.invoice }}</div>
                <div class="body-cell">{{ row.customer }}</div>
                <div class="body-cell">{{ row.method }}</div>
                <div class="body-cell">{{ row.transaction }}</div>
                <div class="body-cell">{{ row.datetime }}</div>
                <div class="body-cell">{{ row.amount }}</div>
              </div>
    </div>
</template>
<script>
export default {
  data() {
    return {
      rows: [
        {
          invoice: "INV-A14",
          customer: "PRIBIN THOMAS",
          method: "Offline",
          transaction: "-",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A15",
          customer: "CHIRAYATH, JERNET",
          method: "Debit Card",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A16",
          customer: "PERUMTHOTTATHIL..",
          method: "Stripe",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A17",
          customer: "ENTSIWAH, WILLIAM",
          method: "PayPal",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A18",
          customer: "PERUMTHOTTATHIL..",
          method: "Credit Card",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A19",
          customer: "MARTIN, ANJANA",
          method: "Debit Card",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A20",
          customer: "52414MARTIN,..",
          method: "PayPal",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
        {
          invoice: "INV-A21",
          customer: "KARUKAYIL...",
          method: "Stripe",
          transaction: "CcAb12Cd3456",
          datetime: "31/07/2025, 06:00 Pm",
          amount: "€ 76.10",
        },
      ],
    };
  },
};
</script>