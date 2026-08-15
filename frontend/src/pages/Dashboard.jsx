// 🏠 Main dashboard page
import StatCards from "../components/dashboard/StatCards";
import DeliveryChart from "../components/dashboard/DeliveryChart";
import RecentOrders from "../components/dashboard/RecentOrders";
function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard For DeliveryHub</h2>
        <p className="text-gray-500 mt-1">Welcome back!</p>
      </div>

      {/* Stats row */}
      <StatCards />

      {/* Charts + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DeliveryChart />
        <RecentOrders />
      </div>
    </div>
  );
}

export default Dashboard;