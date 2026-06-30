const styles = {
  admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  analyst: 'bg-soc-accent/20 text-soc-accent border-soc-accent/30',
  viewer: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
};

export default function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize ${styles[role] || styles.viewer}`}
    >
      {role}
    </span>
  );
}
