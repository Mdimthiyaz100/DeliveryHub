// 🏷️ Shows order/delivery status with colors
function StatusBadge({ status }) {
  // Map each status to Tailwind color classes
  const statusStyles = {
    "Delivered": "bg-green-100 text-green-800",
    "Pending": "bg-yellow-100 text-yellow-800",
    "In Transit": "bg-blue-100 text-blue-800",
    "Cancelled": "bg-red-100 text-red-800",
    "Available": "bg-green-100 text-green-700",
    "On Delivery": "bg-blue-100 text-blue-700",
    "Offline": "bg-gray-100 text-gray-600",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
}

export default StatusBadge;
