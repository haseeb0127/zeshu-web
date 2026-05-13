import { NextResponse } from 'next/server';

// 🚀 ZESHU 3-TIER SMART WATERFALL ENGINE (SIMULATION MODE)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    return NextResponse.json({ success: false, message: "Search query required" }, { status: 400 });
  }

  try {
    // 🧪 SIMULATION LOGIC: Routing based on keywords

    // TIER 1: INSTANT LOCAL (MedPay)
    if (query.includes('dolo') || query.includes('paracetamol') || query.includes('calpol')) {
      return NextResponse.json({
        success: true,
        routing_type: 'local',
        fulfillment: {
          provider: 'Zeshu Quick',
          eta: '15-30 Mins', 
          badgeColor: 'emerald', 
        },
        products: [
          { id: 'SKU-DOLO-650', name: 'Dolo 650mg Tablet (15 Tab)', price: 33, discount_price: 30, requires_rx: false },
          { id: 'SKU-DOLO-250', name: 'Dolo 250mg Suspension (60ml)', price: 45, discount_price: 40, requires_rx: false }
        ]
      });
    } 
    
    // TIER 2: EXPRESS FALLBACK (Tata 1mg)
    else if (query.includes('vicks') || query.includes('eno') || query.includes('protein') || query.includes('spray')) {
      const tata1mgLink = `https://www.1mg.com/search/all?name=${encodeURIComponent(query)}&utm_source=zeshu_app`;
      return NextResponse.json({
        success: true,
        routing_type: 'express',
        fulfillment: {
          provider: 'Tata 1mg',
          eta: '2-4 Hours',
          badgeColor: 'blue', 
        },
        fallback_action: {
          message: 'Sourced via Tata 1mg - Arriving Today.',
          link: tata1mgLink
        },
        products: [] 
      });
    } 
    
    // TIER 3: HARD-TO-FIND FALLBACK (Apollo 24|7)
    else {
      const apolloDeepLink = `https://www.apollo247.com/search?q=${encodeURIComponent(query)}&utm_source=zeshu_app`;
      return NextResponse.json({
        success: true,
        routing_type: 'affiliate',
        fulfillment: {
          provider: 'Apollo 24|7',
          eta: '1-2 Days',
          badgeColor: 'amber', 
        },
        fallback_action: {
          message: 'Rare Item - Redirecting to our national partner.',
          link: apolloDeepLink
        },
        products: [] 
      });
    }

  } catch (error: any) {
    console.error("Waterfall Loop Crashed:", error);
    return NextResponse.json({ success: false, message: "Medicine network offline" }, { status: 500 });
  }
}