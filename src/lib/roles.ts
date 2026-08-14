export type Role = "CUSTOMER" | "ADMIN" | "DELIVERY";

export const ROLE_HOME: Record<Role, string> = {
  CUSTOMER: "/customer/home",
  ADMIN: "/admin/dashboard",
  DELIVERY: "/delivery/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  CUSTOMER: "Customer",
  ADMIN: "Admin",
  DELIVERY: "Delivery Partner",
};
