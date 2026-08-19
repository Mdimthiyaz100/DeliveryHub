import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";

function StatCards() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    cancelledOrders: 0,
    assignesOrders:0,
  });

  useEffect(() => {
    api.get("/dashboard/stats")
      .then(res => {
        if (res.data && res.data.stats) {
          setData({
            totalOrders: res.data.stats.totalOrders || 0,
            deliveredOrders: res.data.stats.deliveredOrders || 0,
            pendingOrders: res.data.stats.pendingOrders || 0,
            cancelledOrders: res.data.stats.cancelledOrders || 0,
            assignedOrders:res.data.stats.assignedOrders || 0
          });
        }
      })
      .catch(err => {
        console.error("Error fetching stats:", err);
      });
  }, []);

  const stats = [
    { title: "Total Orders", value: data.totalOrders, up: true, icon: "📦", color: "bg-blue-500" },
    { title: "Delivered", value: data.deliveredOrders, up: true, icon: "✅", color: "bg-green-500" },
    { title: "Pending", value: data.pendingOrders, up: false, icon: "⏳", color: "bg-red-500" },
    { title: "cancelled", value: data.cancelledOrders, up: false, icon: "❌", color: "bg-yellow-500" },
    { title: "assigned", value: data.assignedOrders, up: false, icon: "📋", color: "bg-sky-500"}
  ];
  const filters = ["all", "delivered", "pending", "cancelled", "assigned"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <button
          key={index}
          type="button"
          onClick={() => navigate(filters[index] === "all" ? "/orders" : `/orders?status=${filters[index]}`)}
          className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 text-left transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={`View ${stat.title.toLowerCase()} orders`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-gray-800">{(stat.value ?? 0).toLocaleString()}</h3>
            </div>
            <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-white text-xl`}>
              {stat.icon}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export default StatCards;
