import { useEffect, useState } from "react";
import api from "../../../api/api";

function DeliveryChart() {
  const [data, setData] = useState([
    { day: "Mon", delivered: 0, pending: 0 },
    { day: "Tue", delivered: 0, pending: 0 },
    { day: "Wed", delivered: 0, pending: 0 },
    { day: "Thu", delivered: 0, pending: 0 },
    { day: "Fri", delivered: 0, pending: 0 },
    { day: "Sat", delivered: 0, pending: 0 },
    { day: "Sun", delivered: 0, pending: 0 },
  ]);

useEffect(() => {
    api.get("/dashboard/stats")
      .then(res => {
        if (res.data && res.data.ordersPerDay) {
          const daysMap = {
            "Mon": { delivered: 120, pending: 12 },
            "Tue": { delivered: 201, pending: 41 },
            "Wed": { delivered: 161, pending: 45 },
            "Thu": { delivered: 98, pending: 16 },
            "Fri": { delivered: 152, pending: 32 },
            "Sat": { delivered: 120, pending: 27 },
            "Sun": { delivered: 188, pending: 30 }
          };

          res.data.ordersPerDay.forEach(item => {
            const dateObj = new Date(item.date);
            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
            if (daysMap[dayName]) {
              const count = item.count || 0;
              daysMap[dayName].delivered = Math.round(count * 0.8);
              daysMap[dayName].pending = Math.round(count * 0.2);
            }
          });

          setData([
            { day: "Mon", ...daysMap["Mon"] },
            { day: "Tue", ...daysMap["Tue"] },
            { day: "Wed", ...daysMap["Wed"] },
            { day: "Thu", ...daysMap["Thu"] },
            { day: "Fri", ...daysMap["Fri"] },
            { day: "Sat", ...daysMap["Sat"] },
            { day: "Sun", ...daysMap["Sun"] }
          ]);
        }
      })
      .catch(err => {
        console.error("Error fetching chart data:", err);
      });
  }, []);

  const maxValue = Math.max(...data.map(d => d.delivered + d.pending), 80);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-800 mb-6">Weekly Delivery Overview</h3>
      
      <div className="flex items-end justify-between h-48 gap-2">
        {data.map((item) => (
          <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
            {/* Bars container */}
            <div className="w-full flex gap-1 justify-center items-end h-40">
              {/* Delivered bar */}
              <div 
                className="w-3 bg-green-500 rounded-t"
                style={{ height: `${(item.delivered / maxValue) * 100}%` }}
                title={`Delivered: ${item.delivered}`}
              />
              {/* Pending bar */}
              <div 
                className="w-3 bg-yellow-400 rounded-t"
                style={{ height: `${(item.pending / maxValue) * 100}%` }}
                title={`Pending: ${item.pending}`}
              />
            </div>
            {/* Day label */}
            <span className="text-xs text-gray-500">{item.day}</span>
          </div>
        ))}
      </div>  
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Delivered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-400 rounded"></div>
          <span className="text-gray-600">Pending</span>
        </div>
      </div>
    </div>
  );
}

export default DeliveryChart;