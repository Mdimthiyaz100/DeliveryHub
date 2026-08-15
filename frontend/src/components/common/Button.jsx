// 🔘 A reusable button component
function Button({ children, onClick, variant = "primary", className = "" }) {
  // Tailwind classes based on variant
  const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600",
    success: "bg-green-500 text-white hover:bg-green-600",
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default Button;