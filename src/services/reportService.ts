import { StaffTransaction } from "@/types/manager";

export const generateReport = async (
  config: { type: string; dateFrom: string; dateTo: string; format: string },
  transactions: StaffTransaction[]
) => {
  const { type, dateFrom, dateTo, format } = config;

  const filteredTransactions = transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.timestamp)
      .toISOString()
      .split("T")[0];
    return transactionDate >= dateFrom && transactionDate <= dateTo;
  });

  if (format === "csv") {
    downloadCSV(filteredTransactions, type);
  }
};

export const downloadCSV = (data: StaffTransaction[], type: string) => {
  const headers = [
    "Transaction ID",
    "Date",
    "Time",
    "Cashier",
    "Items Count",
    "Subtotal",
    "Discount",
    "Tax",
    "Total",
    "Payment Method",
    "Customer",
  ];

  const csvContent = [
    headers.join(","),
    ...data.map((transaction) =>
      [
        transaction.transactionId,
        new Date(transaction.timestamp).toLocaleDateString(),
        new Date(transaction.timestamp).toLocaleTimeString(),
        transaction.cashierName,
        transaction.items.length,
        transaction.subtotal.toFixed(2),
        transaction.discountAmount.toFixed(2),
        transaction.taxAmount.toFixed(2),
        transaction.total.toFixed(2),
        transaction.paymentMethod,
        transaction.customer?.name || "Walk-in",
      ].join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}-report-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
