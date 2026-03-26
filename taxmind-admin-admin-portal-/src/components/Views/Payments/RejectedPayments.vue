<template>
  <div class="payments-table-wrapper">
    <div class="payments-table-header">
      <div class="header-cell">Invoice No</div>
      <div class="header-cell">Customer Name</div>
      <div class="header-cell">Payment Method</div>
      <div class="header-cell">Transaction ID</div>
      <div class="header-cell">Date & Time</div>
      <div class="header-cell">Amount</div>
    </div>
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
  name: "RejectedPayments",
  props: {
    rows: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style scoped>
.payments-table-wrapper {
  width: 100%;
  min-width: 1022px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  overflow: hidden;
  background: #fff;
}
.payments-table-header {
  display: flex;
  border-bottom: 1px solid #e5e5e5;
  height: 60px;
  align-items: center;
  font-family: "DM Sans", sans-serif;
  font-weight: 800;
  font-size: 14px;
  color: #000;
}
.header-cell {
  flex: 1 1 0;
  padding: 0 16px;
  text-align: left;
  font-weight: 800;
  font-size: 14px;
  color: #000;
}
.payments-table-row {
  display: flex;
  align-items: center;
  height: 50px;
  border-bottom: 1px solid #e5e5e5;
  font-family: "DM Sans", sans-serif;
  font-size: 14px;
  color: #000;
}
.body-cell {
  flex: 1 1 0;
  padding: 0 16px;
  text-align: left;
  font-weight: 400;
  font-size: 14px;
  color: #000;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>