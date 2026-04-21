import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const operatorCode = searchParams.get('operator');
  const circleCode = searchParams.get('circle') || '92'; // Default circle if missing
  const service = searchParams.get('service') || 'mobile';

  if (!operatorCode) {
    return NextResponse.json({ plans: [], message: "Missing operator code" }, { status: 400 });
  }

  try {
    const apiUserId = process.env.PLAN_API_USER_ID || '';
    const apiPassword = process.env.PLAN_API_PASSWORD || '';

    if (service === 'dth') {
      // --- FETCH DTH PLANS ---
      const dthParams = new URLSearchParams({
        apimember_id: apiUserId,
        api_password: apiPassword,
        operatorcode: operatorCode
      });

      const res = await fetch(`https://planapi.in/api/Mobile/DthPlans?${dthParams.toString()}`);
      const data = await res.json();

      if (data.STATUS === "3" || !data.RDATA) {
        return NextResponse.json({ plans: [], message: data.MESSAGE || "No DTH plans available" });
      }

      let formattedDthPlans: any[] = [];
      
      // Flatten the deeply nested DTH JSON structure
      Object.keys(data.RDATA).forEach(category => {
        const categoryData = data.RDATA[category];
        if (Array.isArray(categoryData)) {
          categoryData.forEach((pack: any) => {
            if (pack.Details && Array.isArray(pack.Details)) {
              pack.Details.forEach((detail: any) => {
                if (detail.PricingList && Array.isArray(detail.PricingList)) {
                  detail.PricingList.forEach((priceItem: any) => {
                    formattedDthPlans.push({
                      amount: String(priceItem.Amount).replace(/[^0-9.]/g, ''), // Strip "₹" symbol
                      validity: priceItem.Month || 'N/A',
                      desc: `${detail.PlanName} | ${detail.Channels} | ${pack.Language}`,
                      categoryName: category
                    });
                  });
                }
              });
            }
          });
        }
      });

      return NextResponse.json({ plans: formattedDthPlans });

    } else {
      // --- FETCH MOBILE PLANS ---
      const mobileParams = new URLSearchParams({
        apimember_id: apiUserId,
        api_password: apiPassword,
        operatorcode: operatorCode, 
        cricle: circleCode // Leaving the API's typo 'cricle' intact as per their docs
      });

      const res = await fetch(`https://planapi.in/api/Mobile/MobileRechargePlan?${mobileParams.toString()}`);
      const data = await res.json();

      if (data.STATUS === "3" || data.STATUS === "0" || !data.RDATA) {
        return NextResponse.json({ plans: [], message: data.MESSAGE || "No mobile plans available" });
      }

      let rawPlans: any[] = [];
      if (data.RDATA && typeof data.RDATA === 'object') {
        Object.keys(data.RDATA).forEach((cat) => {
          const list = data.RDATA[cat];
          if (Array.isArray(list)) {
            rawPlans = [...rawPlans, ...list.map(p => ({ ...p, categoryName: cat }))];
          }
        });
      }

      const formattedMobilePlans = rawPlans.map((p: any) => ({
        amount: String(p.rs || p.amount || p.Price || "0"),
        validity: p.validity || p.Validity || 'N/A',
        desc: p.desc || p.Description || p.detail || `Live ${p.categoryName} Plan`,
        categoryName: p.categoryName
      })).filter(p => p.amount !== "0");

      return NextResponse.json({ plans: formattedMobilePlans });
    }

  } catch (error) {
    console.error("Plan Fetch Error:", error);
    return NextResponse.json({ plans: [], message: "Failed to connect to provider" }, { status: 500 });
  }
}