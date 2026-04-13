'use client';
import React, { useState } from 'react';
import { Smartphone, Tv, Zap, Flame, ShieldCheck, Phone, Car, PlayCircle } from 'lucide-react';

// --- ZESHU COIN BUSINESS LOGIC ---
const COMMISSION_RATES: { [key: string]: number } = {
  'Vodafone': 3.70, 'RELIANCE - JIO': 0.65, 'Airtel': 1.00, 'BSNL - STV': 3.00, 'BSNL - TOPUP': 3.00, 'Idea': 3.70,
  'DISH TV': 3.80, 'Airtel Digital DTH TV': 4.20, 'SUNDIRECT DTH TV': 3.50, 'VIDEOCON DTH TV': 4.20, 'TATASKY DTH TV': 3.20,
  'Google Play': 2.50, 'Federal Bank - Fastag': 0.15, 'Hdfc Bank - Fastag': 0.15, 'Icici Bank Fastag': 0.15, 'Idbi Bank Fastag': 0.15, 
  'Idfc First Bank- Fastag': 0.15, 'Paytm Payments Bank Fastag': 0.15, 'Axis Bank Fastag': 0.15, 'Bank Of Baroda - Fastag': 0.15, 
  'Sbi Bank Fastag': 0.15, 'Airtel Payments Bank': 0.15
};

const PROVIDERS = {
  Prepaid: ['Airtel', 'RELIANCE - JIO', 'Vodafone', 'Idea', 'BSNL - TOPUP', 'BSNL - STV'],
  Postpaid: ['Airtel Postpaid', 'BSNL Postpaid', 'Idea Postpaid', 'JIO POSTPAID', 'Vodafone Postpaid', 'Airtel Landline', 'Bsnl Landline', 'MTNL Delhi Landline', 'Tata Docomo Postpaid'],
  DTH: ['Airtel Digital DTH TV', 'DISH TV', 'SUNDIRECT DTH TV', 'TATASKY DTH TV', 'VIDEOCON DTH TV'],
  Electricity: ['Adani power', 'Ajmer Vidyut Vitran Nigam - RAJASTHAN', 'APDCL (Non-RAPDR) - ASSAM', 'APEPDCL - ANDHRA PRADESH', 'Assam Power Distribution Company Ltd (RAPDR)', 'Bangalore ElectricitySupply Company', 'BEST Mumbai', 'BharatpurElectricityServicesLtd', 'Bikaner Electricity Supply Limited', 'BrihanMumbaiElectricSupplyandTransportUndertaking', 'BSES Rajdhani Power Limited - Delhi', 'BSES Yamuna Power Limited - Delhi', 'Central Power Distribution Company of Andhra Pradesh Ltd', 'CESC - WEST BENGAL', 'Chamundeshwari Electricity Supply Corporation Ltd. (Cesc,Mysore)', 'Chhattisgarh State Power Distribution Company Ltd. (CSPDCL)', 'Dakshin Gujarat Vij Company Ltd', 'DakshinHaryanaBijliVitranNigam', 'Department of Power Arunachal Pradesh', 'Department of Power, Nagaland', 'DNHPowerDistributionCompanyLimited', 'Gift Power Company Limited', 'Goa Electricity', 'Government of Puducherry Electricity Department', 'GulbargaElectricitySupplyCompanyLimited', 'Himachal Pradesh State Electricity Board Ltd', 'Hubli Electricity Supply Company Ltd. (HESCOM)', 'India Power - WEST BENGAL', 'IndiaPowerCorporationLimited', 'Jaipur Vidyut Vitran Nigam - RAJASTHAN', 'Jammu & Kashmir power Development department', 'JamshedpurUtilitiesandServicesCompanyLimited', 'JBVNL - JHARKHAND', 'Jodhpur Vidyut Vitran Nigam - RAJASTHAN', 'kannan devan hills power', 'Kanpur Electricity Supply Company', 'KEDL - KOTA', 'Kerala State Electricity Board Ltd.', 'Lakshadweep Electricity Department', 'Madhya Gujarat Vij Company Ltd', 'Madhya Pradesh Madhya Kshetra Vidyut Vitaran-RURAL', 'Madhya Pradesh Poorv Kshetra Vidyut Vitaran-URBAN', 'Madhyanchal Vidyut Vitran Nigam Limited', 'Mangalore Electricity Supply Co. Ltd (MESCOM) - RAPDR', 'Mangalore Electricity Supply Co. Ltd (Non) - RAPDR', 'Manipur State Power Distribution Company Limited (Prepaid)', 'MEPDCL - MEGHALAYA', 'MP Madhaya Kshetra Vidyut Vitaran -Urban', 'MP Poorv Kshetra Vidyut Vitaran - Jabalpur', 'MP Poorv Kshetra Vidyut Vitaran - Rular', 'MSEDC - MAHARASHTRA', 'MUNICIPALCORPORATIONOFGURUGRAM', 'Muzaffarpur Vidyut Vitran', 'NESCO Odisha', 'New Delhi Municipal Council (NDMC) - Electricity', 'Noida Power - NOIDA', 'North Bihar Electricity', 'NorthDelhiPowerLimited', 'Paschim Gujarat Vij Company Ltd', 'Paschim Kshetra Vitaran - MADHYA PRADESH', 'Power & Electricity Department - Mizoram', 'Punjab State Power Corporation Limted', 'Reliance Energy', 'Sikkim Power Rural', 'Sikkim Power Urban', 'SNDL Power - NAGPUR', 'South Bihar Electricity', 'SOUTHCO Odisha', 'Southern Power - ANDHRA PRADESH', 'Southern Power - TELANGANA', 'Tata Power - MUMBAI', 'Tata Power Delhi Limited - Delhi', 'TNEB - TAMIL NADU', 'Torrent Power agra', 'Torrent Power Ahemdabad', 'Torrent Power Bhivandi', 'Torrent Power Dahej', 'Torrent Power SHIL', 'Torrent Power Surat', 'TP Ajmer Distribution Ltd', 'TP central odisha distribution limited', 'TripuraStateElectricityCorporationLtd', 'TSNPDCL Telangana northern power', 'UPPCL (URBAN) - UTTAR PRADESH', 'Uttar Pradesh Power Corporation Limited(Rular)', 'UttarakhandPowerCorporationLimited', 'UttarGujarat Vij Company Ltd', 'UttarHaryanaBijliVitranNigam', 'WBSEDCL - WEST BENGAL', 'Western Electricity supply co. Of orissa ltd.'],
  Gas: ['Adani Gas', 'Gujarat Gas', 'Hindustan Petroleum Corporation Ltd', 'Indraprastha Gas', 'Mahanagar Gas'],
  Insurance: ['ICICI Prudential Insurance', 'Tata AIA Insurance'],
  FASTag: ['Federal Bank - Fastag', 'Hdfc Bank - Fastag', 'Icici Bank Fastag', 'Idbi Bank Fastag', 'Idfc First Bank- Fastag', 'Paytm Payments Bank Fastag', 'Axis Bank Fastag', 'Bank Of Baroda - Fastag', 'Sbi Bank Fastag'],
  PlayStore: ['Google Play']
};

export default function PhonePeRechargeWidget() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [number, setNumber] = useState('');
  const [operator, setOperator] = useState('');
  const [amount, setAmount] = useState('');
  const [dob, setDob] = useState('');

  // Calculate Zeshu Coins (80% of your commission profit)
  const numericAmount = parseFloat(amount) || 0;
  const operatorMargin = COMMISSION_RATES[operator] || 0;
  const myProfit = numericAmount * (operatorMargin / 100);
  const customerCoinsEarned = Math.floor(myProfit * 0.80);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!operator || !number || !amount) return alert("Please fill all details.");
    
    // Calls your live Render backend!
    try {
      const response = await fetch('https://zeshu-backend-api.onrender.com/api/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operator_code: operator, 
          number: number,
          amount: parseInt(amount),
          order_id: `WEB_${Date.now()}`
        })
      });
      const data = await response.json();
      alert(`Status: ${data.status || 'Processed'}\nYou earned ${customerCoinsEarned} Zeshu Coins!`);
      setActiveTab(null); // Return to home grid
    } catch(err) {
      alert("Error connecting to server.");
    }
  };

  const ServiceIcon = ({ title, IconKey, catId }: { title: string, IconKey: any, catId: string }) => (
    <div 
      onClick={() => { setActiveTab(catId); setOperator(''); setAmount(''); setNumber(''); }}
      className="flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 p-3 rounded-xl transition-all"
    >
      <div className="w-12 h-12 bg-[#5f259f] text-white rounded-full flex items-center justify-center mb-2 shadow-md">
        <IconKey size={22} />
      </div>
      <span className="text-xs text-center font-medium text-gray-700">{title}</span>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      
      {/* PHONEPE STYLE HEADER */}
      <div className="bg-[#5f259f] p-4 text-white flex items-center justify-between">
        <h2 className="text-lg font-bold">{activeTab ? `${activeTab.toUpperCase()} PAYMENT` : 'Recharge & Pay Bills'}</h2>
        {activeTab && (
          <button onClick={() => setActiveTab(null)} className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">
            Back
          </button>
        )}
      </div>

      <div className="p-5">
        {/* PHONEPE STYLE GRID */}
        {!activeTab ? (
          <div className="grid grid-cols-4 gap-y-6 gap-x-2">
            <ServiceIcon title="Mobile Recharge" IconKey={Smartphone} catId="Prepaid" />
            <ServiceIcon title="Postpaid" IconKey={Phone} catId="Postpaid" />
            <ServiceIcon title="DTH" IconKey={Tv} catId="DTH" />
            <ServiceIcon title="Electricity" IconKey={Zap} catId="Electricity" />
            <ServiceIcon title="FASTag" IconKey={Car} catId="FASTag" />
            <ServiceIcon title="Gas" IconKey={Flame} catId="Gas" />
            <ServiceIcon title="Insurance" IconKey={ShieldCheck} catId="Insurance" />
            <ServiceIcon title="Google Play" IconKey={PlayCircle} catId="PlayStore" />
          </div>
        ) : (
          /* PAYMENT FORM */
          <form onSubmit={handleRecharge} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                {activeTab === 'Electricity' ? 'Customer Account Number' : activeTab === 'FASTag' ? 'Vehicle Number' : 'Mobile / Account Number'}
              </label>
              <input 
                type="text" 
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full border-b-2 border-gray-300 focus:border-[#5f259f] py-2 outline-none text-gray-800 font-medium bg-transparent transition-colors"
                placeholder="Enter Details"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Select Provider</label>
              <select 
                required
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full border-b-2 border-gray-300 focus:border-[#5f259f] py-2 outline-none text-gray-800 font-medium bg-transparent transition-colors appearance-none"
              >
                <option value="" disabled>Select Operator</option>
                {PROVIDERS[activeTab as keyof typeof PROVIDERS].map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            {activeTab === 'Insurance' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full border-b-2 border-gray-300 focus:border-[#5f259f] py-2 outline-none text-gray-800 font-medium bg-transparent transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Amount (₹)</label>
              <input 
                type="number" 
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border-b-2 border-gray-300 focus:border-[#5f259f] py-2 outline-none text-gray-800 font-medium text-lg bg-transparent transition-colors"
                placeholder="₹0"
              />
              
              {/* 80% ZESHU COIN REWARD DISPLAY */}
              {amount && customerCoinsEarned > 0 && (
                <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center">
                  <span className="text-xl mr-2">🪙</span>
                  <p className="text-green-700 text-sm font-bold">
                    You will earn {customerCoinsEarned} Zeshu Coins on this payment!
                  </p>
                </div>
              )}
            </div>

            <button type="submit" className="w-full bg-[#5f259f] text-white font-bold py-4 rounded-xl hover:bg-[#4a1d7c] transition-colors shadow-lg mt-4 text-lg tracking-wide">
              PROCEED TO PAY
            </button>
          </form>
        )}
      </div>
    </div>
  );
}