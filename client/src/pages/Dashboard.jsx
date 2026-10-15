
export default function Dashboard({ user, onLogout }) {
  const role = user?.role;

  const roleContent = {
    employee: {
      title: "Employee Dashboard",
      description: "Manage your customer visits and meetings.",
      items: ["My Meetings", "My Customers", "My Follow-ups"],
    },
    manager: {
      title: "Manager Dashboard",
      description: "Monitor your team's meetings and follow-ups.",
      items: ["Team Meetings", "Team Follow-ups", "Meeting Overview"],
    },
    admin: {
      title: "Admin Dashboard",
      description: "Manage and monitor the SalesPilot system.",
      items: ["All Meetings", "Customers", "System Overview"],
    },
  };

  const content = roleContent[role];

  if (!content) {
    return <p>Unknown user role. Please sign in again.</p>;
  }

  return (
    <main>
      <h1>SalesPilot</h1>
      <h2>{content.title}</h2>
      <p>Welcome, {user.name || user.email}!</p>
      <p>{content.description}</p>

      <ul>
        {content.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <button onClick={onLogout}>Logout</button>
    </main>
  );
}
