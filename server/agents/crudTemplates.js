// CRUD App Templates
const CRUD_APP_TEMPLATES = {
  "Simple Blog": {
    entities: ["Post", "Category", "User"],
    features: [
      "Create posts",
      "Edit posts",
      "Delete posts",
      "Categories",
      "User auth",
    ],
    tech_stack: ["Next.js", "Prisma", "SQLite", "Tailwind CSS"],
    pages: ["home", "posts", "admin", "login"],
  },
  "Task Manager": {
    entities: ["Task", "Project", "User"],
    features: [
      "Create tasks",
      "Update status",
      "Assign tasks",
      "Project grouping",
    ],
    tech_stack: ["React", "Node.js", "MongoDB", "Express"],
    pages: ["dashboard", "tasks", "projects", "profile"],
  },
  "Contact Manager": {
    entities: ["Contact", "Group", "User"],
    features: ["Add contacts", "Edit contacts", "Group contacts", "Search"],
    tech_stack: ["Vue.js", "FastAPI", "PostgreSQL", "Bootstrap"],
    pages: ["contacts", "groups", "search", "settings"],
  },
  "Inventory System": {
    entities: ["Product", "Category", "Supplier", "Order"],
    features: ["Add products", "Track inventory", "Manage orders", "Suppliers"],
    tech_stack: ["React", "Django", "PostgreSQL", "Material-UI"],
    pages: ["products", "inventory", "orders", "suppliers", "dashboard"],
  },
};

module.exports = { CRUD_APP_TEMPLATES };
