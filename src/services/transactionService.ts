import { StaffTransaction } from "@/types/manager";

export const validateString = (value: string, fallback: string): string => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
};

export const validateDate = (dateStr: string): string => {
  if (typeof dateStr === "string" && dateStr.trim().length >= 10) {
    const date = new Date(dateStr.trim());
    if (!isNaN(date.getTime())) {
      return dateStr.trim();
    }
  }
  return new Date().toISOString().split("T")[0];
};

export const loadAllTransactions = (): StaffTransaction[] => {
  const allSales: StaffTransaction[] = [];

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("cashdesk_sales_")) {
      try {
        const sales = JSON.parse(localStorage.getItem(key) || "[]");
        allSales.push(
          ...sales.map((sale: StaffTransaction) => ({
            id: validateString(
              sale.id,
              `transaction-${Date.now()}-${Math.random()}`
            ),
            transactionId: validateString(
              sale.transactionId,
              `TXN-${Date.now()}`
            ),
            cashierId: validateString(sale.cashierId, "default_cashier"),
            cashierName: validateString(sale.cashierName, "Default Cashier"),
            timestamp: validateDate(sale.timestamp),
            items: Array.isArray(sale.items) ? sale.items : [],
            subtotal: Number(sale.subtotal) || 0,
            discountAmount: Number(sale.discountAmount) || 0,
            taxAmount: Number(sale.taxAmount) || 0,
            total: Number(sale.total) || 0,
            paymentMethod: [
              "cash",
              "card",
              "transfer",
              "wallet",
              "split",
            ].includes(sale.paymentMethod)
              ? sale.paymentMethod
              : "cash",
            customer: sale.customer,
            refunded: Boolean(sale.refunded),
            voided: Boolean(sale.voided),
          }))
        );
      } catch (error) {
        console.error("Error parsing sales data:", error);
      }
    }
  });

  return allSales.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};
