// zeshu-web/components/MobileRecharge.tsx
import { useState } from 'react';

export default function MobileRecharge() {
  const [number, setNumber] = useState('');
  const [operator, setOperator] = useState('');
  const [amount, setAmount] = useState('');

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calls your live Render backend!
    const response = await fetch('https://zeshu-backend-api.onrender.com/api/recharge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operator_code: operator, // Make sure these match A1Topup exact codes!
        number: number,
        amount: parseInt(amount),
        order_id: `WEB_${Date.now()}`
      })
    });
    const data = await response.json();
    alert(`Status: ${data.status || 'Processed'}`);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-800">MOBILE RECHARGE (Prepaid)</h2>
      
      <form onSubmit={handleRecharge} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile Number :</label>
          <input 
            type="tel" 
            maxLength={10}
            required
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="mt-1 w-full border border-gray-300 p-2 rounded focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Enter 10 digit number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Select Operator* :</label>
          <select 
            required
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="mt-1 w-full border border-gray-300 p-2 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="" disabled>Select Operator</option>
            <option value="AIRTEL">Airtel</option>
            <option value="BSNL_STV">BSNL - STV</option>
            <option value="BSNL_TOPUP">BSNL - TOPUP</option>
            <option value="IDEA">Idea</option>
            <option value="JIO">RELIANCE - JIO</option>
            <option value="VODAFONE">Vodafone</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount :</label>
          <input 
            type="number" 
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-full border border-gray-300 p-2 rounded focus:ring-blue-500 focus:border-blue-500" 
            placeholder="₹"
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition"
        >
          Proceed to Recharge
        </button>
      </form>
    </div>
  );
}